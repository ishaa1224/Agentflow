import logging
from backend.agents.state import AgentState
from backend.database import supabase
from backend.gmail_service import gmail_service
from backend.llm import llm_client

logger = logging.getLogger("agentflow.agents.report")

def report_agent_node(state: AgentState) -> AgentState:
    """
    Report Agent Node in the LangGraph.
    Collects tasks status (completed vs pending) and email summaries,
    then generates a structured Markdown report highlighting productivity.
    """
    logger.info("Executing Report Agent Node...")
    
    # 1. Fetch tasks from Supabase
    try:
        tasks_res = supabase.table('tasks').select('*').execute()
        tasks_dicts = tasks_res.data
    except Exception as e:
        logger.error(f"Failed to fetch tasks for report: {e}")
        tasks_dicts = []
        
    # 2. Fetch email headers from Gmail service
    emails = gmail_service.fetch_recent_emails(max_results=3)
    
    # 3. Formulate prompt for LLM report compiling
    tasks_summary_str = ""
    if tasks_dicts:
        tasks_summary_str = "\n".join([
            f"- Title: {t['title']} | Priority: {t['priority']} | Status: {'Completed' if t['completed'] else 'Pending'} | Due: {t['deadline'] or 'None'}"
            for t in tasks_dicts
        ])
    else:
        tasks_summary_str = "No active tasks in database."
        
    emails_summary_str = ""
    if emails:
        emails_summary_str = "\n".join([
            f"- From: {e['sender']} | Subject: {e['subject']}"
            for e in emails
        ])
    else:
        emails_summary_str = "No recent emails."
        
    prompt = (
        f"Generate a professional, executive productivity report based on this workspace data:\n\n"
        f"Active Tasks:\n{tasks_summary_str}\n\n"
        f"Recent Emails:\n{emails_summary_str}\n\n"
        f"Report Requirements:\n"
        f"- Output a clean, beautiful Markdown document.\n"
        f"- Include sections: Executive Summary, Tasks Analytics, Communication Summary, and Next Action Items.\n"
        f"- Maintain a premium, executive tone.\n"
    )
    
    system_instruction = "You are a senior Operations Analyst. Compile summaries into a clean, structured executive Markdown report."
    
    try:
        report_md = llm_client.generate(prompt=prompt, system_instruction=system_instruction)
        state["report_content"] = report_md
        state["response"] = report_md
    except Exception as e:
        logger.error(f"Report agent compilation failed: {e}")
        state["response"] = f"Report Agent Error during compilation: {str(e)}"
        
    state["next_agent"] = "end"
    state["messages"] = [{"role": "assistant", "content": "[Report Agent]: Generated Markdown productivity report."}]
    return state
