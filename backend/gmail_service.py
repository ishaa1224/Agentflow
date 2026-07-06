import os
import json
import logging
from datetime import datetime
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from backend.config import GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH, USE_MOCK_GMAIL

logger = logging.getLogger("agentflow.gmail_service")

# Gmail Scopes required to fetch emails and draft replies
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose"
]

class GmailService:
    """
    Service layer for Gmail integration. Handles OAuth2 client credentials flows,
    real Gmail API communication, and sandbox mock fallbacks.
    """
    def __init__(self):
        self.creds = None
        self.load_credentials()

    def load_credentials(self):
        """
        Loads saved Google OAuth credentials from token.json if available.
        """
        if os.path.exists(GMAIL_TOKEN_PATH):
            try:
                self.creds = Credentials.from_authorized_user_file(GMAIL_TOKEN_PATH, SCOPES)
                logger.info("Successfully loaded Gmail OAuth credentials from token.json.")
            except Exception as e:
                logger.error(f"Error loading token.json: {e}")
                self.creds = None

    def is_connected(self) -> bool:
        """
        Checks whether the application has successfully linked a Gmail account.
        """
        if not self.creds:
            return False
        
        # Check if expired and refresh if possible
        if self.creds.expired and self.creds.refresh_token:
            try:
                self.creds.refresh(Request())
                with open(GMAIL_TOKEN_PATH, "w") as token_file:
                    token_file.write(self.creds.to_json())
                logger.info("Refreshed Gmail OAuth token successfully.")
                return True
            except Exception as e:
                logger.error(f"Failed to refresh Gmail OAuth token: {e}")
                return False
        
        return self.creds.valid

    def get_auth_url(self, redirect_uri: str) -> str:
        """
        Generates the authorization URL for user consent.
        """
        if not os.path.exists(GMAIL_CREDENTIALS_PATH):
            raise FileNotFoundError(
                "credentials.json is missing in the backend directory. "
                "Please download OAuth Client credentials from Google Developer Console."
            )
            
        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_PATH,
            scopes=SCOPES,
            redirect_uri=redirect_uri
        )
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true"
        )
        return auth_url

    def exchange_code_for_token(self, redirect_uri: str, code: str) -> bool:
        """
        Exchanges the callback authorization code for OAuth tokens.
        """
        try:
            flow = Flow.from_client_secrets_file(
                GMAIL_CREDENTIALS_PATH,
                scopes=SCOPES,
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=code)
            self.creds = flow.credentials
            
            # Save the credentials for next session
            with open(GMAIL_TOKEN_PATH, "w") as token_file:
                token_file.write(self.creds.to_json())
            logger.info("Exchanged auth code and saved token.json successfully.")
            return True
        except Exception as e:
            logger.error(f"Gmail token exchange failed: {e}")
            return False

    def fetch_recent_emails(self, max_results: int = 10) -> list:
        """
        Fetches recent emails from the connected Gmail inbox.
        Falls back to high-quality mockup emails in sandbox mode if Gmail is disconnected.
        """
        if not self.is_connected() or USE_MOCK_GMAIL:
            logger.info("Using Gmail Sandbox Mode: returning mockup inbox emails.")
            return self.get_mock_emails()

        try:
            service = build("gmail", "v1", credentials=self.creds)
            # Query recent messages from inbox
            results = service.users().messages().list(userId="me", maxResults=max_results, q="is:inbox").execute()
            messages = results.get("messages", [])
            
            emails = []
            for msg_summary in messages:
                msg = service.users().messages().get(userId="me", id=msg_summary["id"], format="full").execute()
                payload = msg.get("payload", {})
                headers = payload.get("headers", [])
                
                # Extract headers
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
                
                # Parse body snippet
                snippet = msg.get("snippet", "")
                
                emails.append({
                    "id": msg["id"],
                    "subject": subject,
                    "sender": sender,
                    "date": date_str or datetime.now().strftime("%a, %d %b %Y %H:%M:%S"),
                    "snippet": snippet,
                    "body": snippet,  # Simplification for snippet body parsing
                    "is_mock": False
                })
            return emails
        except Exception as e:
            logger.error(f"Failed to fetch real Gmail emails: {e}. Falling back to mocks.")
            return self.get_mock_emails()

    def draft_reply(self, email_id: str, reply_body: str) -> dict:
        """
        Drafts a response to a given email.
        """
        if not self.is_connected() or USE_MOCK_GMAIL:
            logger.info(f"Sandbox Mode: drafted reply for email {email_id} (not sent to API).")
            return {"status": "success", "message": "Draft created in sandbox mode.", "draft_id": "mock_draft_123"}
            
        try:
            service = build("gmail", "v1", credentials=self.creds)
            # Retrieve original message to reference headers for threading
            original = service.users().messages().get(userId="me", id=email_id).execute()
            headers = original.get("payload", {}).get("headers", [])
            
            subject = "Re:"
            to_recipient = ""
            message_id = ""
            
            for h in headers:
                if h["name"].lower() == "subject":
                    subject = h["value"] if h["value"].lower().startswith("re:") else f"Re: {h['value']}"
                elif h["name"].lower() == "from":
                    to_recipient = h["value"]
                elif h["name"].lower() == "message-id":
                    message_id = h["value"]

            # Construct MIME message
            from email.mime.text import MIMEText
            import base64
            
            message = MIMEText(reply_body)
            message["to"] = to_recipient
            message["subject"] = subject
            if message_id:
                message["In-Reply-To"] = message_id
                message["References"] = message_id
                
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
        """
        Pre-populated professional sandbox inbox for immediate out-of-the-box evaluations.
        Contains explicit directives for task extraction.
        """
        return [
            {
                "id": "msg_mock_001",
                "subject": "ACTION REQUIRED: Q3 Infrastructure Migration Plan",
                "sender": "Sarah Jenkins (sarah.j@company.com)",
                "date": "Sun, 28 Jun 2026 14:15:00",
                "snippet": "Urgent update on infrastructure migration. Please review the server schema specs, create SQLite database migrations, and submit comments by tomorrow at 5 PM. Priority: High.",
                "body": "Hi Team,\n\nWe are moving forward with the Q3 cloud infrastructure shift. There are a few urgent tasks we need to delegate:\n\n1. Review the new database model specs in database.py.\n2. Create SQLAlchemy schema migrations for SQLite database support by tomorrow Monday, June 29th at 5:00 PM. This is critical and is a High priority.\n3. Make sure to update the README.md to document the database layout.\n\nThanks,\nSarah Jenkins\nEngineering Lead",
                "is_mock": True
            },
            {
                "id": "msg_mock_002",
                "subject": "System Warning: ChromaDB storage clean up",
                "sender": "DevOps Monitor (alerts@ops.company.local)",
                "date": "Sat, 27 Jun 2026 09:30:00",
                "snippet": "ChromaDB workspace collections require metadata cleanup. Delete redundant document vector indices by Wednesday, July 1st to prevent disk alert. Priority: Medium.",
                "body": "Hello System Administrator,\n\nThis is an automated alert from DevOps operations.\n\nOur vector store storage is approaching 80% capacity. Action required: Inspect and delete redundant index test files from the uploads/ folders and clear ChromaDB workspace collection items by Wednesday, July 1st. Priority: Medium.\n\nRegards,\nDevOps Cron Daemon",
                "is_mock": True
            },
            {
                "id": "msg_mock_003",
                "subject": "Client feedback on design & glassmorphism mockup",
                "sender": "Michael Vance (m.vance@clientcorp.com)",
                "date": "Fri, 26 Jun 2026 18:45:00",
                "snippet": "The client reviewed the dashboard mockups. They request a premium dark theme and loading skeletons. Submit final layout files by Friday, July 3rd. Priority: Medium.",
                "body": "Hi AgentFlow developers,\n\nWe received feedback from our client stakeholders regarding the workspace screens:\n\n1. They love the Framer-inspired concept, but requested we emphasize a deep dark black layout with glassmorphic cards.\n2. We must add loading skeletons to the lists so elements load gracefully.\n3. Please finalize and submit the Vercel staging deployment url and layout screenshots by next Friday, July 3rd. Priority is Medium.\n\nWarm regards,\nMichael Vance\nDesign Partner, ClientCorp",
                "is_mock": True
            },
            {
                "id": "msg_mock_004",
                "subject": "Routine task: Weekly Productivity Reports",
                "sender": "Operations Bot (ops-notify@company.local)",
                "date": "Mon, 22 Jun 2026 08:00:00",
                "snippet": "Generate and review the team's weekly task summaries and export report as PDF every Sunday night. Priority: Low.",
                "body": "System Reminder:\n\nPlease trigger the report generation agent to compile a summary of task completion rates and export the output as a PDF file. Set the deadline for this recurring check to Sunday night at 11:59 PM. Priority: Low.",
                "is_mock": True
            }
        ]

# Singleton instance of Gmail client
gmail_service = GmailService()
