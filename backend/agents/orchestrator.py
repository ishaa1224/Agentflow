import logging
from langgraph.graph import StateGraph, END
from backend.agents.state import AgentState
from backend.agents.email_agent import email_agent_node
from backend.agents.task_agent import task_agent_node
from backend.agents.rag_agent import rag_agent_node
from backend.agents.web_search_agent import web_search_agent_node
from backend.agents.report_agent import report_agent_node
from backend.agents.notification_agent import notification_agent_node
from backend.llm import llm_client

logger = logging.getLogger("agentflow.agents.orchestrator")

def supervisor_router_node(state: AgentState) -> AgentState:
    """
    Supervisor Router Node.
    Analyzes the user's conversational query and determines the target expert agent
    to dispatch the work to.
    """
    query = state.get("query", "").lower()
    logger.info(f"Supervisor parsing routing logic for query: '{query}'")
    
    # 1. Routing rules based on keywords
    if any(keyword in query for keyword in ["email", "inbox", "gmail", "draft", "reply"]):
        state["next_agent"] = "email_agent"
    elif any(keyword in query for keyword in ["task", "todo", "extract", "checklist", "priority"]):
        state["next_agent"] = "task_agent"
    elif any(keyword in query for keyword in ["search", "web", "lookup", "google", "internet"]):
        state["next_agent"] = "web_search_agent"
    elif any(keyword in query for keyword in ["report", "summary", "compile"]):
        state["next_agent"] = "report_agent"
    elif any(keyword in query for keyword in ["notification", "alert", "deadline", "overdue", "upcoming"]):
        state["next_agent"] = "notification_agent"
    elif any(keyword in query for keyword in ["document", "pdf", "file", "rag", "ask"]):
        state["next_agent"] = "rag_agent"
    else:
        # LLM Supervisor routing fallback
        prompt = (
            f"You are a routing supervisor. Route the query '{query}' to one of these agents:\n"
            f"- 'email_agent': handles mailbox fetching and email reply drafting.\n"
            f"- 'task_agent': extracts structured deliverables/todos.\n"
            f"- 'rag_agent': answers questions based on uploaded documents.\n"
            f"- 'web_search_agent': queries the internet for general knowledge.\n"
            f"- 'report_agent': compiles activity statistics.\n"
            f"- 'notification_agent': displays deadline alerts.\n"
            f"- 'end': for basic greetings or queries that don't fit any agent.\n\n"
            f"Respond with ONLY the name of the agent in lowercase. Do not add punctuation or other text."
        )
        try:
            decision = llm_client.generate(prompt=prompt, system_instruction="You are a routing supervisor.").strip().lower()
            if decision in ["email_agent", "task_agent", "rag_agent", "web_search_agent", "report_agent", "notification_agent"]:
                state["next_agent"] = decision
            else:
                state["next_agent"] = "end"
        except Exception as e:
            logger.error(f"Supervisor LLM routing failed: {e}. Falling back to default greeting.")
            state["next_agent"] = "end"
            
    logger.info(f"Supervisor routed query to: '{state['next_agent']}'")
    return state

# Define conditional route function
def route_to_agent(state: AgentState):
    """
    Evaluates where to route based on next_agent parameter.
    """
    next_agent = state.get("next_agent", "end")
    if next_agent == "end":
        return END
    return next_agent

# Initialize StateGraph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("supervisor", supervisor_router_node)
workflow.add_node("email_agent", email_agent_node)
workflow.add_node("task_agent", task_agent_node)
workflow.add_node("rag_agent", rag_agent_node)
workflow.add_node("web_search_agent", web_search_agent_node)
workflow.add_node("report_agent", report_agent_node)
workflow.add_node("notification_agent", notification_agent_node)

# Connect edges
workflow.set_entry_point("supervisor")

# Define routing transitions from supervisor
workflow.add_conditional_edges(
    "supervisor",
    route_to_agent,
    {
        "email_agent": "email_agent",
        "task_agent": "task_agent",
        "rag_agent": "rag_agent",
        "web_search_agent": "web_search_agent",
        "report_agent": "report_agent",
        "notification_agent": "notification_agent",
        END: END
    }
)

# Set all specialist agents to return to END (one-hop dispatch pattern)
workflow.add_edge("email_agent", END)
workflow.add_edge("task_agent", END)
workflow.add_edge("rag_agent", END)
workflow.add_edge("web_search_agent", END)
workflow.add_edge("report_agent", END)
workflow.add_edge("notification_agent", END)

# Compile graph
compiled_agent_graph = workflow.compile()
logger.info("LangGraph workflow graph compiled successfully.")

def run_agent_workflow(user_query: str, user_id: str) -> dict:
    """
    Executes the multi-agent graph with the given user query.
    Returns the accumulated state.
    """
    initial_state = {
        "messages": [{"role": "user", "content": user_query}],
        "user_id": user_id,
        "query": user_query,
        "tasks": [],
        "emails": [],
        "reports": [],
        "notifications": [],
        "context": "",
        "response": "",
        "next_agent": "supervisor"
    }
    
    final_state = compiled_agent_graph.invoke(initial_state)
    
    # Return formatted workflow summary
    return {
        "response": final_state.get("response", "I parsed your request but didn't produce an answer."),
        "routed_agent": final_state.get("next_agent", "end"),
        "tasks": final_state.get("tasks", []),
        "emails": final_state.get("emails", []),
        "notifications": final_state.get("notifications", []),
        "report_content": final_state.get("report_content", "")
    }
