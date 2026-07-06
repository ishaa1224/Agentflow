# AgentFlow AI 🚀
**AI-Powered Productivity and Workflow Automation Platform**

## Overview
AgentFlow AI is an advanced productivity and workflow automation platform designed to process documents, extract actionable insights, and coordinate specialized AI agents. It seamlessly bridges the gap between raw data and actionable tasks, allowing users to automate their day-to-day operations with intelligent multi-agent orchestration.

## Key Features
- 📄 **PDF Document Ingestion**: Robust PDF processing and text extraction capabilities.
- 🔍 **Document Indexing & Semantic Retrieval (RAG)**: Full vectorization and semantic search powered by ChromaDB.
- ⚡ **Automatic Task Extraction**: LLM-driven parsing of documents to automatically generate tasks, meetings, and reminders.
- 🤖 **AI Copilot & Document Q&A**: Conversational interface backed by a multi-agent LangGraph workflow.
- ✉️ **Gmail Integration**: Fetch recent emails with a seamless fallback to a sandbox/simulation mode if OAuth credentials are not provided.
- 🔔 **Notifications & Deadlines**: Persistent deadline tracking and alerts stored in the database.
- 💾 **Supabase Persistence**: Scalable data storage for documents, tasks, notifications, and activities.
- 🌓 **Theme Support**: UI built to support beautiful dynamic styling and layouts.

## Architecture
AgentFlow AI employs a modern, decoupled architecture:
**User** ➡️ **React Frontend** ➡️ **FastAPI Backend** ➡️ **LangGraph Agent Orchestration** ➡️ **Specialized Agents** ➡️ **Supabase & ChromaDB** ➡️ **Frontend Results**

## Specialized Agent System
The backend utilizes a multi-agent system, where specialized agents handle distinct responsibilities:
- **Orchestrator (`orchestrator.py`)**: The graph router that directs queries to the appropriate specialized agent.
- **RAG Agent (`rag_agent.py`)**: Handles semantic retrieval and document Q&A.
- **Task Agent (`task_agent.py`)**: Manages task extraction, creation, and updates.
- **Email Agent (`email_agent.py`)**: Interfaces with Gmail for fetching and summarizing emails.
- **Report Agent (`report_agent.py`)**: Compiles system activity and metrics into professional reports.
- **Notification Agent (`notification_agent.py`)**: Manages reminders and system alerts.
- **Web Search Agent (`web_search_agent.py`)**: Expands knowledge retrieval via external search capabilities.

## Tech Stack
### Frontend
- **React**: Component-based UI library.
- **Vite**: Ultra-fast build tool and development server.

### Backend & AI
- **FastAPI (Python)**: High-performance API framework.
- **LangGraph**: Framework for orchestrating stateful, multi-actor LLM applications.
- **ChromaDB**: Local vector storage for document embeddings.
- **Sentence Transformers**: Model used for generating high-quality text embeddings.

### Storage
- **Supabase**: PostgreSQL database used for relational persistence (Tasks, Activities, Chat History, Notifications).

## Project Structure
```text
agentflow-ai/
├── backend/            # FastAPI server, AI agents, vector storage, and PDF processing
└── frontend/           # React application built with Vite and Tailwind CSS
```

## Local Setup Instructions

### 1. Clone Repository
```bash
git clone <repository_url>
cd agentflow-ai
```

### 2. Backend Setup
Navigate to the backend directory, set up your Python environment, and run the server:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and run the development server:
```bash
cd frontend
npm install

# Start the Vite dev server
npm run dev
```

### 4. Configure Environment Variables
Create a `.env` file in both the `backend` and `frontend` directories based on the required variables (see below).

## Environment Variables
*Note: Do not expose real keys in your version control or this README.*

**Backend (`backend/.env`)**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (or `OPENAI_API_KEY` for LLM provider)
- `TAVILY_API_KEY` (Optional for Web Search)
- `GMAIL_CREDENTIALS_PATH` (Optional for real Gmail sync)
- `GMAIL_TOKEN_PATH` (Optional)
- `DATABASE_URL` (Optional fallback URL)

**Frontend (`frontend/.env`)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Current Project Status
**Working Features**:
- PDF uploads, text extraction, and ChromaDB vectorization.
- Multi-agent conversational interface (Orchestrator, RAG, Tasks).
- Automatic task, meeting, and reminder extraction from documents.
- Supabase persistence for tasks, documents, notifications, and chat history.
- Sandbox simulated Gmail integration mode.

**In-Progress / Planned Features**:
- Live production Gmail integration deployment.
- Advanced web-search agent tooling (currently under development).
- Active push notifications and automated background execution.

## Future Improvements
- **Integration Expansion**: Connect with tools like Slack, Notion, and Google Calendar.
- **Advanced Agent Capabilities**: Multi-step reasoning agents that autonomously execute complex background tasks.
- **User Authentication Flow**: Implement full user-level JWT authentication for multi-tenant support.
- **Cloud Vector DB**: Migrate from local ChromaDB to managed services like Pinecone or pgvector for better scaling.

## Author
*Created and maintained as a showcase of modern AI workflow automation and multi-agent systems.*
