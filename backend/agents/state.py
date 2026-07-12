from typing import List, Dict, Any, TypedDict, Annotated
import operator

class AgentState(TypedDict):
    """
    Defines the shared state passed between agents in the LangGraph multi-agent system.
    Using Annotated with operator.add enables automatic accumulation of data layers (like messages).
    """
    # Messages list will accumulate over steps
    messages: Annotated[List[Dict[str, Any]], operator.add]
    
    # Context, tasks, emails, etc. passed down the graph
    tasks: List[Dict[str, Any]]
    emails: List[Dict[str, Any]]
    reports: List[Dict[str, Any]]
    notifications: List[Dict[str, Any]]
    
    # State tracking variables for routing
    user_id: str
    query: str
    context: str
    response: str
    next_agent: str
