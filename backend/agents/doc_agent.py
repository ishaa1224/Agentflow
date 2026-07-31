import json
import logging
from datetime import datetime
from backend.agents.state import AgentState
from backend.database import supabase
from backend.llm import llm_client

logger = logging.getLogger("agentflow.agents.doc")

def doc_agent_node(state: AgentState) -> AgentState:
    """
    Document Analysis Agent Node.
    Loads PDF text, generates summary, extracts tasks/meetings/reminders,
    persists them in Supabase, and updates the shared AgentState.
    """
    logger.info("Executing Document Analysis Agent Node...")
    query = state.get("query", "")
    user_id = state.get("user_id")
    text = state.get("context", "")
    
    # 1. Retrieve text from database if not present in state context
    if not text:
        logger.info("Document context empty in state. Searching in Supabase documents table...")
        try:
            docs_res = supabase.table('documents').select('*').eq('user_id', user_id).execute()
            if docs_res.data:
                for doc in docs_res.data:
                    # check if the file_name is mentioned in the query
                    if doc.get('file_name', '').lower() in query.lower():
                        text = doc.get('extracted_text', '')
                        logger.info(f"Found document text for '{doc.get('file_name')}' in Supabase.")
                        break
                # Fallback: if no name matches but there is at least one doc, use the most recent one
                if not text:
                    text = docs_res.data[0].get('extracted_text', '')
                    logger.info(f"Fallback: using text of most recent document '{docs_res.data[0].get('file_name')}'")
        except Exception as db_err:
            logger.error(f"Error fetching documents from Supabase: {db_err}")
            
    if not text or text == "[No indexable text extracted from this PDF document.]":
        state["response"] = "No document text found to analyze."
        state["document_summary"] = "No document text found to analyze."
        state["tasks"] = []
        state["meetings"] = []
        state["reminders"] = []
        state["next_agent"] = "end"
        return state

    # 2. Generate Document Summary
    logger.info("Generating document summary...")
    summary_prompt = (
        f"Provide a concise, professional executive summary of the following document:\n\n{text[:8000]}"
    )
    try:
        summary = llm_client.generate(
            prompt=summary_prompt, 
            system_instruction="You are a professional summary writer. Keep it concise, high-level, and informative."
        )
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        summary = "Summary generation failed."

    # 3. Extract Tasks, Meetings, and Reminders
    logger.info("Extracting tasks, meetings, and reminders from document text...")
    system_instruction = (
        "You are an AI document analysis agent. Your goal is to perform document extraction. "
        "Analyze the following text and extract tasks, meetings, and reminders. "
        "Return the result as a strict JSON object with this exact structure: "
        '{"tasks": [{"title": "", "description": "", "deadline": "", "priority": "Medium"}], '
        '"meetings": [{"title": "", "description": "", "time": ""}], '
        '"reminders": [{"title": "", "description": "", "time": ""}]}'
    )
    
    extracted_tasks = []
    extracted_meetings = []
    extracted_reminders = []
    
    try:
        response_text = llm_client.generate(
            prompt=text[:8000],
            system_instruction=system_instruction,
            response_json=True
        )
        cleaned_response = response_text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[7:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
        cleaned_response = cleaned_response.strip()
        
        parsed_data = json.loads(cleaned_response)
        tasks_raw = parsed_data.get("tasks", [])
        meetings_raw = parsed_data.get("meetings", [])
        reminders_raw = parsed_data.get("reminders", [])
        
        # 4. Save tasks to Supabase
        for t in tasks_raw:
            title = t.get("title", "").strip()
            if not title:
                continue
            try:
                res = supabase.table('tasks').insert({
                    'user_id': user_id, 
                    "title": title,
                    "description": t.get("description", ""),
                    "deadline": t.get("deadline", ""),
                    "priority": t.get("priority", "Medium")
                }).execute()
                if res.data:
                    extracted_tasks.append(res.data[0])
            except Exception as e:
                logger.error(f"Error saving extracted task: {e}")
                
        # 5. Save meetings as tasks with deadlines for the calendar
        for m in meetings_raw:
            title = m.get("title", "").strip()
            if not title:
                continue
            try:
                res = supabase.table('tasks').insert({
                    'user_id': user_id, 
                    "title": f"Meeting: {title}",
                    "description": m.get("description", ""),
                    "deadline": m.get("time", ""),
                    "priority": "High"
                }).execute()
                if res.data:
                    extracted_meetings.append({
                        "title": title,
                        "description": m.get("description", ""),
                        "time": m.get("time", "")
                    })
            except Exception as e:
                logger.error(f"Error saving extracted meeting: {e}")
                
        # 6. Save reminders to notifications table
        for r in reminders_raw:
            title = r.get("title", "").strip()
            if not title:
                continue
            try:
                res = supabase.table('notifications').insert({
                    'user_id': user_id,
                    'message': f"Reminder: {title} - {r.get('description', '')} ({r.get('time', '')})",
                    'is_read': False
                }).execute()
                if res.data:
                    extracted_reminders.append({
                        "title": title,
                        "description": r.get("description", ""),
                        "time": r.get("time", "")
                    })
            except Exception as e:
                logger.error(f"Error saving extracted reminder: {e}")
                
        # 7. Log activity and main notification in database
        try:
            total_items = len(extracted_tasks) + len(extracted_meetings) + len(extracted_reminders)
            supabase.table('activities').insert({
                'user_id': user_id, 
                "action": f"AI Document Analysis extracted {total_items} items."
            }).execute()
            
            supabase.table('notifications').insert({
                'user_id': user_id,
                'message': f"Tasks Extracted: Successfully extracted {len(extracted_tasks)} tasks, {len(extracted_meetings)} meetings, and {len(extracted_reminders)} reminders from the document.",
                'is_read': False
            }).execute()
        except Exception as log_err:
            logger.error(f"Failed to log activity or notification: {log_err}")

    except Exception as parse_err:
        logger.error(f"Failed to parse document insights: {parse_err}")
        
    state["document_summary"] = summary
    state["tasks"] = extracted_tasks
    # Save raw meetings/reminders in state for the API response
    state["meetings"] = extracted_meetings
    state["reminders"] = extracted_reminders
    state["context"] = text
    state["response"] = f"Successfully analyzed document. Summary: {summary}"
    
    state["next_agent"] = "end"
    state["messages"] = [{"role": "assistant", "content": "[Doc Agent]: Analyzed document successfully."}]
    return state
