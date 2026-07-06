import logging
from datetime import datetime
from backend.agents.state import AgentState
from backend.database import supabase

logger = logging.getLogger("agentflow.agents.notification")

def notification_agent_node(state: AgentState) -> AgentState:
    """
    Notification Agent Node in the LangGraph.
    Scans the database for task deadlines, flagging items that are:
    - Overdue (deadline passed and not completed).
    - Upcoming (due within next 24 hours).
    - High priority items that need attention.
    """
    logger.info("Executing Notification Agent Node...")
    
    notifications = []
    try:
        tasks_res = supabase.table('tasks').select('*').eq('completed', False).execute()
        tasks = tasks_res.data
        now = datetime.utcnow()
        
        for task in tasks:
            if not task.get('deadline'):
                # Highlight High priority items without deadlines as warning reminders
                if task.get('priority') == "High":
                    notifications.append({
                        "id": f"notif_high_{task['id']}",
                        "type": "warning",
                        "title": "High Priority Task Pending",
                        "message": f"Task '{task['title']}' has High priority but no deadline set.",
                        "task_id": task['id']
                    })
                continue
                
            try:
                # Try parsing deadline ISO string. Support date-only (YYYY-MM-DD) or datetime.
                deadline_str = task['deadline']
                if "T" in deadline_str:
                    task_date = datetime.fromisoformat(deadline_str)
                else:
                    task_date = datetime.strptime(deadline_str, "%Y-%m-%d")
                    
                time_diff = task_date - now
                
                # Check Overdue
                if time_diff.total_seconds() < 0:
                    notifications.append({
                        "id": f"notif_overdue_{task['id']}",
                        "type": "error",
                        "title": "Overdue Deadline",
                        "message": f"Task '{task['title']}' is overdue! (Due: {deadline_str})",
                        "task_id": task['id']
                    })
                # Check Upcoming (within 36 hours for safety margins)
                elif time_diff.total_seconds() <= 129600:
                    notifications.append({
                        "id": f"notif_upcoming_{task['id']}",
                        "type": "info",
                        "title": "Upcoming Deadline",
                        "message": f"Task '{task['title']}' is due soon. (Due: {deadline_str})",
                        "task_id": task['id']
                    })
            except Exception as parse_err:
                # If deadline parsing fails, treat as a string reminder
                logger.debug(f"Failed to parse task deadline datetime '{task.get('deadline')}': {parse_err}")
                
        # Persist new notifications to Supabase if they don't exist
        for notif in notifications:
            # Check if this exact message exists to prevent duplicates (naive approach)
            existing = supabase.table('notifications').select('*').eq('message', notif['message']).execute()
            if not existing.data:
                try:
                    supabase.table('notifications').insert({"message": notif['message'], "read": False}).execute()
                except Exception as insert_err:
                    logger.error(f"Failed to insert notification into Supabase: {insert_err}")
                
    except Exception as e:
        logger.error(f"Failed to compile notifications: {e}")
        
    state["notifications"] = notifications
    
    # Textual response summarizing notifications
    if notifications:
        notif_summaries = []
        for n in notifications:
            badge = "⚠️" if n["type"] == "warning" else ("🚨" if n["type"] == "error" else "🔔")
            notif_summaries.append(f"{badge} **{n['title']}**: {n['message']}")
        
        state["response"] = "Here are your task notifications and alerts:\n\n" + "\n".join(notif_summaries)
    else:
        state["response"] = "All clear! You have no upcoming or overdue task deadlines."
        
    state["next_agent"] = "end"
    state["messages"] = [{"role": "assistant", "content": f"[Notification Agent]: Found {len(notifications)} active alerts."}]
    return state
