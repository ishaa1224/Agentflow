import json
import logging
from datetime import datetime
from backend.agents.state import AgentState
from backend.database import supabase
from backend.llm import llm_client
from backend.gmail_service import gmail_service

logger = logging.getLogger("agentflow.agents.task")

def task_agent_node(state: AgentState) -> AgentState:
    """
    Task Extraction Agent Node in the LangGraph.
    Parses unstructured emails or conversational prompts, extracts deliverables (title, description,
    priority, deadline), and persists them into the SQLite database.
    """
    logger.info("Executing Task Extraction Agent Node...")
    query = state.get("query", "")
    user_id = state.get("user_id")
    
    # Identify content to parse.
    # If the user asks to extract tasks from emails, we fetch recent emails.
    # Otherwise, we parse the user's query itself.
    content_to_parse = query
    source_email_id = None
    
    if "from email" in query.lower() or "recent emails" in query.lower():
        emails = gmail_service.fetch_recent_emails(user_id)
        if emails:
            # Join recent email contents to parse
            email_texts = []
            for email in emails[:3]:  # Parse top 3 emails
                email_texts.append(
                    f"Email ID: {email['id']}\n"
                    f"Sender: {email['sender']}\n"
                    f"Subject: {email['subject']}\n"
                    f"Body: {email['body']}\n"
                )
            content_to_parse = "\n---\n".join(email_texts)
            # Link to first email as primary source ID
            source_email_id = emails[0]["id"]
            logger.info("Parsing task payloads from retrieved Gmail inbox emails.")
        else:
            state["response"] = "No recent emails found in the inbox to extract tasks from."
            state["next_agent"] = "end"
            return state

    # Prompt LLM to extract JSON structured tasks
    prompt = (
        f"Parse the following text and extract all actionable tasks. "
        f"For each task, identify:\n"
        f"- title: short description of what needs to be done\n"
        f"- description: additional details or context\n"
        f"- deadline: ONLY extract explicit due dates or times mentioned. Return null if none is explicitly stated. Do not invent or infer deadlines.\n"
        f"- priority: priority level (must be one of 'High', 'Medium', or 'Low')\n\n"
        f"Text to parse:\n{content_to_parse}\n\n"
        f"You must respond ONLY with a valid JSON object matching this schema:\n"
        f'{{"tasks": [{{"title": "...", "description": "...", "deadline": "...", "priority": "..."}}]}}'
    )
    
    system_instruction = "You are a precise task extraction system. Output strict JSON only. Do not wrap in markdown quotes."
    
    try:
        response_text = llm_client.generate(
            prompt=prompt,
            system_instruction=system_instruction,
            response_json=True
        )
        
        # Parse JSON output from LLM
        # Strip markdown wrapper code block markers if LLM returns them
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        parsed_data = json.loads(cleaned_response)
        extracted_tasks = parsed_data.get("tasks", [])
        
        # Save tasks to Supabase Database
        saved_tasks = []
        try:
            for task_data in extracted_tasks:
                # Basic validation
                title = task_data.get("title", "").strip()
                if not title:
                    continue
                    
                new_task = {
                    "title": title,
                    "description": task_data.get("description", ""),
                    "deadline": task_data.get("deadline"),
                    "priority": task_data.get("priority", "Medium"),
                    "completed": False,
                    "user_id": user_id,
                    "source_email_id": source_email_id
                }
                res = supabase.table('tasks').insert(new_task).execute()
                if res.data:
                    saved_tasks.append(res.data[0])
                
            logger.info(f"Successfully extracted and saved {len(saved_tasks)} tasks to database.")
            
            # Log activity
            try:
                supabase.table('activities').insert({"action": f"Agent extracted {len(saved_tasks)} tasks", "user_id": user_id}).execute()
            except Exception:
                pass
        except Exception as db_err:
            logger.error(f"Database write failure in Task Agent: {db_err}")
            raise db_err
            
        # Update State
        state["tasks"] = saved_tasks
        
        if saved_tasks:
            task_list_str = "\n".join([
                f"- [ ] **{t['title']}** (Priority: {t['priority']}, Due: {t['deadline'] or 'No deadline'})"
                for t in saved_tasks
            ])
            state["response"] = (
                f"Successfully extracted and logged {len(saved_tasks)} new tasks in database!\n\n"
                f"{task_list_str}"
            )
        else:
            state["response"] = "No actionable tasks could be extracted from the text."
            
    except Exception as e:
        logger.error(f"Task extraction parsing failed: {e}")
        state["response"] = f"Task extraction failure: {str(e)}"
        
    state["next_agent"] = "end"
    state["messages"] = [{"role": "assistant", "content": f"[Task Agent]: Extracted and saved tasks successfully."}]
    return state
