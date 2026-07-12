import os
import logging
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
import pypdf

# Backend local imports
from backend.config import get_settings, UPLOAD_DIR, FRONTEND_URL
from backend.database import supabase, get_current_user
from fastapi import Depends
from typing import Any
from backend.vector_store import vector_store
from backend.gmail_service import gmail_service
from backend.agents.orchestrator import run_agent_workflow
from backend.utils.pdf_generator import generate_report_pdf
from backend.llm import LLMClient
import json

# Set up logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agentflow.main")

app = FastAPI(
    title="AgentFlow AI - Productivity Platform",
    description="Backend API orchestration powering RAG, Gmail integration, tasks, and multi-agents workflow.",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AgentFlow AI productivity engine is running.",
        "settings": get_settings()
    }

# ================= DOCUMENT INGESTION & RAG ENDPOINTS =================

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...), user: Any = Depends(get_current_user)):
    """
    Ingests a PDF file, parses its text, stores document metadata in Supabase,
    and indexes embeddings in the persistent ChromaDB collection.
    """
    filename = file.filename
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF files are allowed."
        )

    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}"
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # Save to disk
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to local disk uploads/: {str(e)}"
        )

    # Extract text content
    try:
        reader = pypdf.PdfReader(file_path)
        extracted_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        
        if not extracted_text.strip():
            extracted_text = "[No indexable text extracted from this PDF document.]"
            
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF reading error: {str(e)}"
        )

    # Save document metadata in Supabase
    try:
        existing = supabase.table('documents').select('*').eq('user_id', user.id).eq('filename', filename).execute()
        if existing.data:
            supabase.table('documents').update({'file_size': len(contents), 'file_path': file_path}).eq('filename', filename).execute()
        else:
            supabase.table('documents').insert({'user_id': user.id, 'filename': filename, 'file_path': file_path, 'file_size': len(contents)}).execute()
    except Exception as db_err:
        logger.error(f"Supabase write error for document metadata: {db_err}")

    # Add text chunks and vectors in ChromaDB
    try:
        vector_store.delete_document(filename)
        chunk_count = vector_store.add_document(filename, extracted_text)
    except Exception as vs_err:
        logger.error(f"ChromaDB write error: {vs_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector store indexing failed: {str(vs_err)}"
        )

    # Log activity
    try:
        supabase.table('activities').insert({'user_id': user.id, "action": f"Uploaded document: {filename}"}).execute()
    except Exception:
        pass

    return {
        "message": f"Document '{filename}' successfully ingested and indexed.",
        "filename": filename,
        "chunks": chunk_count,
        "text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
    }

@app.get("/documents")
def get_documents(user: Any = Depends(get_current_user)):
    """
    Returns list of all active indexed documents.
    """
    try:
        docs = supabase.table('documents').select('*').eq('user_id', user.id).order('upload_date', desc=True).execute()
        return docs.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, user: Any = Depends(get_current_user)):
    """
    Removes a document from Supabase and wipes its text embeddings from ChromaDB.
    """
    try:
        doc_res = supabase.table('documents').select('*').eq('user_id', user.id).eq('id', doc_id).execute()
        if not doc_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found."
            )
        doc = doc_res.data[0]

        # Wipe vectors
        vector_store.delete_document(doc['filename'])
        # Delete file on disk if exists
        if os.path.exists(doc['file_path']):
            os.remove(doc['file_path'])
            
        supabase.table('documents').delete().eq('id', doc_id).execute()
        return {"status": "success", "message": f"Successfully deleted document '{doc['filename']}'."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deletion failed: {str(e)}"
        )

@app.post("/api/documents/extract")
def extract_document_insights(payload: dict, user: Any = Depends(get_current_user)):
    """
    Extracts structured info (tasks, meetings, reminders) from document text.
    """
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Document text is required.")
        
    llm = LLMClient()
    system_instruction = (
        "You are an AI document analysis agent. Your goal is to perform document extraction. "
        "Analyze the following text and extract tasks, meetings, and reminders. "
        "Return the result as a strict JSON object with this exact structure: "
        '{"tasks": [{"title": "", "description": "", "deadline": "", "priority": "Medium"}], '
        '"meetings": [{"title": "", "description": "", "time": ""}], '
        '"reminders": [{"title": "", "description": "", "time": ""}]}'
    )
    
    try:
        response = llm.generate(prompt=text, system_instruction=system_instruction, response_json=True)
        # Parse the JSON
        if isinstance(response, str):
            # Clean potential markdown formatting
            clean_json = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_json)
        else:
            data = response
            
        tasks = data.get("tasks", [])
        meetings = data.get("meetings", [])
        reminders = data.get("reminders", [])
        
        # Save tasks to database
        for t in tasks:
            supabase.table('tasks').insert({'user_id': user.id, 
                "title": t.get("title", "Extracted Task"),
                "description": t.get("description", ""),
                "deadline": t.get("deadline", ""),
                "priority": t.get("priority", "Medium")
            }).execute()
            
        # Save meetings as tasks with deadlines for the calendar
        for m in meetings:
            supabase.table('tasks').insert({'user_id': user.id, 
                "title": f"Meeting: {m.get('title', '')}",
                "description": m.get("description", ""),
                "deadline": m.get("time", ""),
                "priority": "High"
            }).execute()
            
        # Save reminders to notifications table
        for r in reminders:
            supabase.table('notifications').insert({'user_id': user.id, 
                "title": r.get("title", "Reminder"),
                "description": r.get("description", ""),
                "time": r.get("time", "")
            }).execute()
            
        # Log activity
        try:
            total_items = len(tasks) + len(meetings) + len(reminders)
            supabase.table('activities').insert({'user_id': user.id, "action": f"AI Document Analysis extracted {total_items} items."}).execute()
        except Exception:
            pass
            
        return {
            "success": True,
            "tasks_found": len(tasks),
            "meetings_found": len(meetings),
            "reminders_found": len(reminders),
            "total_items": len(tasks) + len(meetings) + len(reminders),
            "high_priority_count": sum(1 for t in tasks if str(t.get("priority", "")).lower() == "high") + len(meetings)
        }
    except Exception as e:
        logger.error(f"Document extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================= TASK MANAGER CRUD ENDPOINTS =================

@app.get("/tasks")
def get_tasks(user: Any = Depends(get_current_user)):
    """
    Retrieves all tasks in the system.
    """
    tasks = supabase.table('tasks').select('*').eq('user_id', user.id).order('created_at', desc=True).execute()
    return tasks.data

@app.post("/tasks")
def create_task(title: str, description: Optional[str] = "", deadline: Optional[str] = None, priority: Optional[str] = "Medium", user: Any = Depends(get_current_user)):
    """
    Creates a new task manually.
    """
    if not title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task title cannot be empty."
        )
        
    try:
        task_data = {
            "title": title,
            "description": description,
            "deadline": deadline,
            "priority": priority,
            "completed": False
        }
        result = supabase.table('tasks').insert(task_data).execute()
        
        # Log activity
        try:
            supabase.table('activities').insert({'user_id': user.id, "action": f"Created new task: {title}"}).execute()
        except Exception:
            pass
            
        return result.data[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/tasks/{task_id}")
def update_task(task_id: int, title: Optional[str] = None, description: Optional[str] = None, deadline: Optional[str] = None, priority: Optional[str] = None, completed: Optional[bool] = None, user: Any = Depends(get_current_user)):
    """
    Updates details of an existing task.
    """
    updates = {}
    if title is not None:
        updates['title'] = title
    if description is not None:
        updates['description'] = description
    if deadline is not None:
        updates['deadline'] = deadline
    if priority is not None:
        updates['priority'] = priority
    if completed is not None:
        updates['completed'] = completed
        
    try:
        result = supabase.table('tasks').update(updates).eq('id', task_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, user: Any = Depends(get_current_user)):
    """
    Deletes a task from database.
    """
    try:
        result = supabase.table('tasks').delete().eq('id', task_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
        return {"status": "success", "message": f"Successfully deleted task {task_id}."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/tasks/{task_id}/complete")
def toggle_task_complete(task_id: int, user: Any = Depends(get_current_user)):
    """
    Toggles completion status of a task.
    """
    try:
        task_res = supabase.table('tasks').select('completed', 'title').eq('id', task_id).execute()
        if not task_res.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found."
            )
        new_completed = not task_res.data[0]['completed']
        title = task_res.data[0].get('title', '')
        
        result = supabase.table('tasks').update({'completed': new_completed}).eq('id', task_id).execute()
        
        # Log activity
        status_text = "Completed" if new_completed else "Reopened"
        try:
            supabase.table('activities').insert({'user_id': user.id, "action": f"{status_text} task: {title}"}).execute()
        except Exception:
            pass
            
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ================= GMAIL OAUTH & INBOX ENDPOINTS =================


@app.get("/api/gmail/connect")
def gmail_connect(
    redirect_uri: str = Query("http://localhost:5173/dashboard"),
    state_token: str = Query(None),
    user: Any = Depends(get_current_user)
):
    try:
        connected = gmail_service.is_connected(user.id)
        auth_url = ""
        
        if not connected:
            try:
                auth_url = gmail_service.get_auth_url(redirect_uri, state_token)
            except Exception as oauth_err:
                logger.warning(f"OAuth URL generation blocked: {oauth_err}")
                
        return {
            "connected": connected,
            "auth_url": auth_url,
            "sandbox_mode": not connected and not auth_url
        }
    except Exception as e:
        return {"connected": False, "auth_url": "", "error": str(e), "sandbox_mode": True}

@app.get("/auth/gmail/callback")
def gmail_callback(code: str, state: str, redirect_uri: str = Query("http://localhost:5173/dashboard")):
    # Extract user from state (which is the JWT token passed by frontend)
    try:
        user_res = supabase.auth.get_user(state)
        user_id = user_res.user.id
        success = gmail_service.exchange_code_for_token(redirect_uri, code, user_id)
        if success:
            return RedirectResponse(url=redirect_uri + "?tab=inbox")
    except Exception as e:
        logger.error(f"Callback error: {e}")
        
    return RedirectResponse(url=redirect_uri + "?tab=inbox&gmail_error=auth_failed")

@app.post("/api/gmail/sync")
def sync_emails(user: Any = Depends(get_current_user)):
    try:
        result = gmail_service.sync_emails(user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gmail/emails")
def get_emails(user: Any = Depends(get_current_user)):
    return gmail_service.fetch_recent_emails(user.id)

# ================= MULTI-AGENT# ================= MULTI-AGENT GRAPH CHAT ENGINE =================

@app.post("/api/chat")
def run_agent_chat(payload: dict, user: Any = Depends(get_current_user)):
    """
    Core Multi-Agent chat interface.
    Takes conversational query, feeds to LangGraph orchestrator graph router,
    and returns synthesized response.
    """
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query text cannot be empty."
        )
        
    try:
        result = run_agent_workflow(query, user.id)
        
        # Save to chat_history
        response_text = result.get("response", "")
        try:
            supabase.table('chat_history').insert({'user_id': user.id, 
                "query": query,
                "response": response_text
            }).execute()
        except Exception as db_err:
            logger.error(f"Failed to log chat history to Supabase: {db_err}")
            
        return result
    except Exception as e:
        logger.error(f"Multi-Agent pipeline crash: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent graph execution failed: {str(e)}"
        )

@app.get("/api/chat_history")
def get_chat_history(user: Any = Depends(get_current_user)):
    """
    Returns previous chat history logs.
    """
    try:
        history = supabase.table('chat_history').select('*').eq('user_id', user.id).order('timestamp', desc=False).execute()
        return history.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= NOTIFICATIONS ENGINE =================

@app.get("/api/notifications")
def get_notifications(user: Any = Depends(get_current_user)):
    """
    Aggregates active deadlines and alerts from Supabase.
    """
    try:
        notifications = supabase.table('notifications').select('*').eq('user_id', user.id).order('timestamp', desc=True).execute()
        return notifications.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, user: Any = Depends(get_current_user)):
    try:
        result = supabase.table('notifications').update({'read': True}).eq('id', notif_id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= ACTIVITIES ENGINE =================

@app.get("/api/notifications")
def get_notifications(user: Any = Depends(get_current_user)):
    """
    Retrieves all notifications (reminders/alerts) in the system.
    """
    try:
        notifications = supabase.table('notifications').select('*').eq('user_id', user.id).order('timestamp', desc=True).execute()
        return notifications.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/activities")
def get_activities(user: Any = Depends(get_current_user)):
    """
    Returns system activities from Supabase.
    """
    try:
        activities = supabase.table('activities').select('*').eq('user_id', user.id).order('timestamp', desc=True).execute()
        return activities.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/activities")
def create_activity(payload: dict, user: Any = Depends(get_current_user)):
    action = payload.get("action", "").strip()
    if not action:
        raise HTTPException(status_code=400, detail="Action text required.")
    try:
        res = supabase.table('activities').insert({'user_id': user.id, "action": action}).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= REPORTS & PDF EXPORTS ENDPOINTS =================

@app.post("/api/reports/generate")
def generate_report(user: Any = Depends(get_current_user)):
    """
    Triggers the Report Specialist agent to compile a summary Markdown document.
    """
    from backend.agents.report_agent import report_agent_node
    dummy_state = {
        "messages": [], "query": "generate report",
        "tasks": [], "emails": [], "reports": [], "notifications": [],
        "context": "", "response": "", "next_agent": ""
    }
    result_state = report_agent_node(dummy_state)
    return {
        "report_content": result_state.get("report_content", ""),
        "response": result_state.get("response", "")
    }

@app.post("/api/reports/export")
def export_report_pdf(payload: dict, user: Any = Depends(get_current_user)):
    """
    Accepts Markdown text content, compiles a styled corporate PDF layout,
    and returns a downloadable file byte stream.
    """
    content = payload.get("content", "").strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report text content is required."
        )
        
    output_path = os.path.join(UPLOAD_DIR, "agentflow_productivity_report.pdf")
    try:
        generate_report_pdf(content, output_path)
        return FileResponse(
            path=output_path,
            filename="AgentFlow_Productivity_Report.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        logger.error(f"Failed to generate and download PDF report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF conversion failed: {str(e)}"
        )
