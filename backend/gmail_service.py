import os
import json
import logging
from datetime import datetime
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from backend.config import USE_MOCK_GMAIL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
from backend.database import supabase

logger = logging.getLogger("agentflow.gmail_service")

# Gmail Scopes required to fetch emails and draft replies
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose"
]

class GmailService:
    """
    Service layer for Gmail integration. 
    Handles OAuth2 client credentials flows, real Gmail API communication, 
    and multi-user credentials management via Supabase.
    """
    
    def _get_client_config(self):
        return {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI]
            }
        }

    def get_credentials(self, user_id: str) -> Credentials:
        """
        Retrieves user credentials from Supabase and refreshes them if expired.
        Returns None if user is not connected.
        """
        try:
            res = supabase.table('gmail_connections').select('credentials').eq('user_id', user_id).execute()
            if not res.data:
                return None
                
            creds_data = res.data[0]['credentials']
            creds = Credentials.from_authorized_user_info(creds_data, SCOPES)
            
            if creds.expired and creds.refresh_token:
                creds.refresh(Request())
                # Update DB with new refreshed tokens
                self.save_credentials(user_id, creds)
                logger.info(f"Refreshed Gmail OAuth token for user {user_id}")
                
            return creds if creds.valid else None
        except Exception as e:
            logger.error(f"Error retrieving credentials for user {user_id}: {e}")
            return None

    def save_credentials(self, user_id: str, creds: Credentials):
        """
        Saves credentials dict to Supabase.
        """
        creds_json = json.loads(creds.to_json())
        try:
            existing = supabase.table('gmail_connections').select('id').eq('user_id', user_id).execute()
            if existing.data:
                supabase.table('gmail_connections').update({'credentials': creds_json}).eq('user_id', user_id).execute()
            else:
                supabase.table('gmail_connections').insert({'user_id': user_id, 'credentials': creds_json}).execute()
        except Exception as e:
            logger.error(f"Error saving credentials for user {user_id}: {e}")

    def is_connected(self, user_id: str) -> bool:
        """
        Checks whether the application has successfully linked a Gmail account for this user.
        """
        creds = self.get_credentials(user_id)
        return creds is not None and creds.valid

    def get_auth_url(self, redirect_uri: str, state_token: str) -> str:
        """
        Generates the authorization URL for user consent.
        Passes state_token to identify user on callback.
        """
        if USE_MOCK_GMAIL:
            raise ValueError(
                "Gmail integration is not configured. "
                "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
            )
            
        flow = Flow.from_client_config(
            self._get_client_config(),
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state_token
        )
        return auth_url

    def exchange_code_for_token(self, redirect_uri: str, code: str, user_id: str) -> bool:
        """
        Exchanges the callback authorization code for OAuth tokens and associates with user_id.
        """
        try:
            flow = Flow.from_client_config(
                self._get_client_config(),
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=code)
            self.save_credentials(user_id, flow.credentials)
            logger.info(f"Exchanged auth code and saved to DB for user {user_id}.")
            return True
        except Exception as e:
            logger.error(f"Gmail token exchange failed for user {user_id}: {e}")
            return False

    def sync_emails(self, user_id: str, max_results: int = 20) -> dict:
        """
        Fetches recent emails from Gmail and saves them to Supabase `gmail_emails`.
        Avoids duplicates.
        """
        creds = self.get_credentials(user_id)
        if not creds:
            raise Exception("Gmail not connected for this user.")

        try:
            service = build("gmail", "v1", credentials=creds)
            results = service.users().messages().list(userId="me", maxResults=max_results, q="is:inbox").execute()
            messages = results.get("messages", [])
            
            synced_count = 0
            for msg_summary in messages:
                msg_id = msg_summary["id"]
                # Check for duplicate
                existing = supabase.table("gmail_emails").select("id").eq("user_id", user_id).eq("message_id", msg_id).execute()
                if existing.data:
                    continue
                
                # Fetch full message
                msg = service.users().messages().get(userId="me", id=msg_id, format="full").execute()
                payload = msg.get("payload", {})
                headers = payload.get("headers", [])
                
                subject = "No Subject"
                sender = "Unknown Sender"
                date_str = ""
                for h in headers:
                    if h["name"].lower() == "subject":
                        subject = h["value"]
                    elif h["name"].lower() == "from":
                        sender = h["value"]
                    elif h["name"].lower() == "date":
                        date_str = h["value"]
                
                snippet = msg.get("snippet", "")
                
                # Simple body extraction
                body = ""
                if "parts" in payload:
                    for part in payload["parts"]:
                        if part.get("mimeType") == "text/plain" and "data" in part.get("body", {}):
                            import base64
                            body_data = part["body"]["data"]
                            body += base64.urlsafe_b64decode(body_data).decode("utf-8")
                if not body:
                    body = snippet
                
                email_data = {
                    "user_id": user_id,
                    "message_id": msg_id,
                    "thread_id": msg.get("threadId", ""),
                    "sender": sender,
                    "subject": subject,
                    "snippet": snippet,
                    "body": body,
                    "date": date_str or datetime.now().strftime("%a, %d %b %Y %H:%M:%S"),
                    "processed": False
                }
                
                supabase.table("gmail_emails").insert(email_data).execute()
                synced_count += 1
                
            return {"status": "success", "synced": synced_count}
        except Exception as e:
            logger.error(f"Sync failed for user {user_id}: {e}")
            raise

    def fetch_recent_emails(self, user_id: str) -> list:
        """
        Retrieves the synced emails from Supabase for this user.
        """
        if USE_MOCK_GMAIL:
            logger.info("Using Gmail Sandbox Mode: returning mockup inbox emails.")
            return self.get_mock_emails()
            
        try:
            res = supabase.table("gmail_emails").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()
            # Map backend keys to what frontend expects
            emails = []
            for row in res.data:
                emails.append({
                    "id": row["id"],
                    "message_id": row["message_id"],
                    "subject": row["subject"],
                    "sender": row["sender"],
                    "date": row["date"],
                    "snippet": row["snippet"],
                    "body": row["body"],
                    "is_mock": False
                })
            return emails
        except Exception as e:
            logger.error(f"Failed to fetch emails from DB for user {user_id}: {e}")
            return self.get_mock_emails()

    def draft_reply(self, user_id: str, message_id: str, reply_body: str) -> dict:
        """
        Drafts a response to a given email ID in Gmail API.
        """
        creds = self.get_credentials(user_id)
        if not creds or USE_MOCK_GMAIL:
            return {"status": "success", "message": "Draft created in sandbox mode.", "draft_id": "mock_draft_123"}
            
        try:
            service = build("gmail", "v1", credentials=creds)
            original = service.users().messages().get(userId="me", id=message_id).execute()
            headers = original.get("payload", {}).get("headers", [])
            
            subject = "Re:"
            to_recipient = ""
            msg_id_header = ""
            
            for h in headers:
                if h["name"].lower() == "subject":
                    subject = h["value"] if h["value"].lower().startswith("re:") else f"Re: {h['value']}"
                elif h["name"].lower() == "from":
                    to_recipient = h["value"]
                elif h["name"].lower() == "message-id":
                    msg_id_header = h["value"]

            from email.mime.text import MIMEText
            import base64
            
            message = MIMEText(reply_body)
            message["to"] = to_recipient
            message["subject"] = subject
            if msg_id_header:
                message["In-Reply-To"] = msg_id_header
                message["References"] = msg_id_header
                
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            
            draft_payload = {
                "message": {
                    "raw": raw_message
                }
            }
            
            draft = service.users().drafts().create(userId="me", body=draft_payload).execute()
            return {"status": "success", "message": "Draft created successfully", "draft_id": draft["id"]}
        except Exception as e:
            logger.error(f"Failed to create Gmail draft: {e}")
            return {"status": "error", "message": str(e)}

    def get_mock_emails(self) -> list:
        # Same mocks as original
        return [
            {
                "id": "mock_001",
                "message_id": "msg_mock_001",
                "subject": "ACTION REQUIRED: Q3 Infrastructure Migration Plan",
                "sender": "Sarah Jenkins (sarah.j@company.com)",
                "date": "Sun, 28 Jun 2026 14:15:00",
                "snippet": "Urgent update on infrastructure migration. Please review the server schema specs, create SQLite database migrations, and submit comments by tomorrow at 5 PM. Priority: High.",
                "body": "Hi Team,\n\nWe are moving forward with the Q3 cloud infrastructure shift. There are a few urgent tasks we need to delegate:\n\n1. Review the new database model specs in database.py.\n2. Create SQLAlchemy schema migrations for SQLite database support by tomorrow Monday, June 29th at 5:00 PM. This is critical and is a High priority.\n3. Make sure to update the README.md to document the database layout.\n\nThanks,\nSarah Jenkins\nEngineering Lead",
                "is_mock": True
            }
        ]

gmail_service = GmailService()
