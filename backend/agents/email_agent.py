import logging
from backend.agents.state import AgentState
from backend.gmail_service import gmail_service
from backend.llm import llm_client

logger = logging.getLogger("agentflow.agents.email")

def email_agent_node(state: AgentState) -> AgentState:
    """
    Email Agent Node in the LangGraph.
    Responsible for fetching recent emails and drafting contextual replies.
    """
    logger.info("Executing Email Agent Node...")
    query = state.get("query", "").lower()
    
    # 1. Action: Draft a reply if requested
    if "draft" in query or "reply" in query:
        # Try to find which email to reply to (either by index or text match)
        emails = gmail_service.fetch_recent_emails()
        target_email = None
        
        if emails:
            # Simple heuristic: reply to the first email by default,
            # or try to match names from the query.
            target_email = emails[0]
            for email in emails:
                if any(name in query for name in email["sender"].lower().split()):
                    target_email = email
                    break
        
        if target_email:
            # Let the LLM construct the reply body based on query instructions
            prompt = (
                f"Draft a reply to this email:\n"
                f"From: {target_email['sender']}\n"
                f"Subject: {target_email['subject']}\n"
                f"Body: {target_email['body']}\n\n"
                f"Instructions for reply: {state.get('query')}"
            )
            reply_text = llm_client.generate(
                prompt=prompt,
                system_instruction="You are a professional email drafting assistant. Draft a concise, helpful reply."
            )
            
            # Send draft to gmail service
            res = gmail_service.draft_reply(target_email["id"], reply_text)
            
            state["response"] = (
                f"Successfully created a draft reply in Gmail thread!\n\n"
                f"**To**: {target_email['sender']}\n"
                f"**Subject**: Re: {target_email['subject']}\n\n"
                f"**Draft Body**:\n```\n{reply_text}\n```"
            )
        else:
            state["response"] = "No emails found in the inbox to reply to."
            
    # 2. Action: Fetch recent emails
    else:
        logger.info("Fetching recent emails from Gmail Service...")
        emails = gmail_service.fetch_recent_emails()
        state["emails"] = emails
        
        email_summaries = []
        for idx, email in enumerate(emails):
            email_summaries.append(f"{idx+1}. **From**: {email['sender']} | **Subject**: {email['subject']} ({email['date']})")
        
        summaries_str = "\n".join(email_summaries)
        state["response"] = (
            f"Here are your most recent emails:\n\n{summaries_str}\n\n"
            f"You can ask me to draft replies or extract tasks from any of these emails."
        )
        
    state["next_agent"] = "end"
    # Accumulate log message
    state["messages"] = [{"role": "assistant", "content": f"[Email Agent]: Processed email operations for query: '{query}'."}]
    return state
