import logging
from backend.agents.state import AgentState
from backend.vector_store import vector_store
from backend.llm import llm_client

logger = logging.getLogger("agentflow.agents.rag")

def rag_agent_node(state: AgentState) -> AgentState:
    """
    RAG Agent Node in the LangGraph.
    Searches the persistent ChromaDB collection for context matching the user's query,
    then uses the LLM to answer the question using the retrieved sources.
    """
    logger.info("Executing RAG Agent Node...")
    query = state.get("query", "")
    
    # 1. Retrieve matches from vector database
    results = vector_store.query(query_text=query, n_results=4)
    
    if not results:
        state["response"] = (
            "I checked your uploaded document index library, but could not find any matching text passages. "
            "Please make sure you have uploaded PDFs in the RAG view and that they processed successfully."
        )
        state["next_agent"] = "end"
        state["messages"] = [{"role": "assistant", "content": "[RAG Agent]: Found 0 relevant vector store chunks."}]
        return state

    # 2. Structure context block and list sources
    context_passages = []
    sources = set()
    for idx, match in enumerate(results):
        filename = match.get("filename", "unknown_source")
        text = match.get("text", "")
        sources.add(filename)
        context_passages.append(f"--- Chunk {idx+1} (Source: {filename}) ---\n{text}")
        
    context_str = "\n\n".join(context_passages)
    state["context"] = context_str

    # 3. Prompt LLM to synthesize answer
    prompt = (
        f"Answer the user query based ONLY on the provided document context passages below. "
        f"Include citations to the sources (filenames) where appropriate.\n\n"
        f"Query: {query}\n\n"
        f"Document Context:\n{context_str}\n"
    )
    
    system_instruction = (
        "You are an expert technical document Q&A assistant. "
        "Answer the question objectively using ONLY the context provided. "
        "If the context does not contain the answer, say that you cannot find it in the documents."
    )
    
    try:
        answer = llm_client.generate(prompt=prompt, system_instruction=system_instruction)
        
        # Append sources footer to the response
        sources_list = ", ".join([f"`{src}`" for src in sources])
        state["response"] = f"{answer}\n\n**Sources Analyzed**: {sources_list}"
    except Exception as e:
        logger.error(f"RAG agent synthesis failed: {e}")
        state["response"] = f"RAG Agent Error during synthesis: {str(e)}"
        
    state["next_agent"] = "end"
    state["messages"] = [{"role": "assistant", "content": f"[RAG Agent]: Answered query using {len(sources)} sources."}]
    return state
