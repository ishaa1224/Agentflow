import json
import re
import logging
from typing import Dict, Any, Optional
from backend.config import GEMINI_API_KEY, USE_MOCK_LLM

logger = logging.getLogger("agentflow.llm")

class LLMClient:
    """
    LLM API Client adapter.
    Interfaces with Google's Gemini Pro model.
    Contains an intelligent offline rules engine to simulate high-fidelity AI behaviors
    when no API key is specified, ensuring seamless testing.
    """
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.use_mock = USE_MOCK_LLM
        self.model = None
        self._initialized = False

    def _initialize(self):
        if self._initialized: return
        self._initialized = True
        
        if not self.use_mock:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                logger.info("Gemini LLM model 'gemini-1.5-flash' successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize real Gemini Client: {e}. Switching to offline simulator.")
                self.use_mock = True
        else:
            logger.warning("AgentFlow started in offline/LLM simulation mode. No API key detected.")

    def generate(self, prompt: str, system_instruction: Optional[str] = None, response_json: bool = False) -> str:
        """
        Queries the LLM.
        - prompt: Instruction text.
        - system_instruction: Guides system constraints.
        - response_json: Forces return content to format as JSON.
        """
        self._initialize()
        if not self.use_mock:
            try:
                import google.generativeai as genai
                # Configure generation options
                generation_config = {}
                if response_json:
                    generation_config["response_mime_type"] = "application/json"
                
                # Combine system instructions
                full_prompt = prompt
                if system_instruction:
                    full_prompt = f"{system_instruction}\n\nUser request:\n{prompt}"
                
                response = self.model.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
                return response.text.strip()
            except Exception as e:
                logger.error(f"LLM generation API call failed: {e}. Falling back to simulator.")
                # Continue into simulator below
        
        return self._simulate_response(prompt, system_instruction, response_json)

    def _simulate_response(self, prompt: str, system_instruction: Optional[str], response_json: bool) -> str:
        """
        High-fidelity regex-based rules simulator representing multi-agent tasks outputs.
        """
        prompt_lower = prompt.lower()
        sys_inst_lower = system_instruction.lower() if system_instruction else ""
        
        # 0. SUPERVISOR ROUTING DECISION
        if "routing supervisor" in sys_inst_lower:
            if any(keyword in prompt_lower for keyword in ["email", "inbox", "gmail", "draft", "reply"]):
                return "email_agent"
            elif any(keyword in prompt_lower for keyword in ["task", "todo", "extract", "checklist", "priority"]):
                return "task_agent"
            elif any(keyword in prompt_lower for keyword in ["search", "web", "lookup", "google", "internet"]):
                return "web_search_agent"
            elif any(keyword in prompt_lower for keyword in ["report", "summary", "compile"]):
                return "report_agent"
            elif any(keyword in prompt_lower for keyword in ["notification", "alert", "deadline", "overdue", "upcoming"]):
                return "notification_agent"
            elif any(keyword in prompt_lower for keyword in ["document", "pdf", "file", "rag", "ask"]):
                return "rag_agent"
            return "end"

        # 1. TASK EXTRACTION AGENT Request
        is_task_extraction = "task extraction" in sys_inst_lower or "strict json" in sys_inst_lower
        if not is_task_extraction and not sys_inst_lower:
            is_task_extraction = "extract task" in prompt_lower or "priority" in prompt_lower or "deadline" in prompt_lower
            
        if is_task_extraction:
            # Look for specific email mockups text in prompt to yield precise responses
            tasks = []
            
            # Sarah Jenkins mock email
            if "sarah.j@company.com" in prompt_lower or "q3 infrastructure" in prompt_lower:
                tasks.append({
                    "title": "Review database model specs",
                    "description": "Inspect and review the database model declarations inside database.py for the cloud migration.",
                    "deadline": "2026-06-29T17:00:00",
                    "priority": "Medium"
                })
                tasks.append({
                    "title": "Create SQLAlchemy schema migrations",
                    "description": "Write database schema migrations for SQLite compatibility as requested by Sarah Jenkins.",
                    "deadline": "2026-06-29T17:00:00",
                    "priority": "High"
                })
                tasks.append({
                    "title": "Update README database layout docs",
                    "description": "Document the database schema structures inside the main repository README.md.",
                    "deadline": "2026-06-30T17:00:00",
                    "priority": "Low"
                })
            
            # DevOps Monitor mock email
            elif "alerts@ops.company" in prompt_lower or "chromadb storage" in prompt_lower:
                tasks.append({
                    "title": "Clear ChromaDB index files",
                    "description": "Inspect vector database folders and clear redundant test collection document indices.",
                    "deadline": "2026-07-01T23:59:59",
                    "priority": "Medium"
                })
                
            # Michael Vance design mock email
            elif "m.vance@clientcorp" in prompt_lower or "glassmorphism" in prompt_lower:
                tasks.append({
                    "title": "Refactor dashboard styles to glassmorphism",
                    "description": "Revamp the dashboard components into a dark black background layout with glassmorphic cards.",
                    "deadline": "2026-07-03T18:00:00",
                    "priority": "High"
                })
                tasks.append({
                    "title": "Deploy Vercel staging builds",
                    "description": "Build the production-ready React build and host on Vercel staging deployment pipeline.",
                    "deadline": "2026-07-03T18:00:00",
                    "priority": "Medium"
                })
            
            # General text parsing
            else:
                # Basic regex search to try to extract something
                title_match = re.search(r"(?:task|todo|do|need to)\s*:\s*([^.\n]+)", prompt, re.IGNORECASE)
                title = title_match.group(1).strip() if title_match else "Extracted Task Item"
                tasks.append({
                    "title": title[:60],
                    "description": "Automatically extracted from email snippet text.",
                    "deadline": "2026-07-05T18:00:00",
                    "priority": "Medium"
                })
            
            if response_json:
                # If the system instruction specifically asks for meetings and reminders too (Document Analysis workflow)
                if "meetings" in sys_inst_lower or "meetings" in prompt_lower:
                    meetings = [{
                        "title": "Review Document Findings",
                        "description": "Discuss the extracted items from the newly ingested PDF.",
                        "time": "2026-06-30T10:00:00"
                    }]
                    reminders = [{
                        "title": "Follow up on high priority items",
                        "description": "Ensure the tasks extracted from the document are assigned.",
                        "time": "2026-07-01T09:00:00"
                    }]
                    return json.dumps({
                        "tasks": tasks,
                        "meetings": meetings,
                        "reminders": reminders
                    })
                return json.dumps({"tasks": tasks})
            return f"Extracted tasks: {json.dumps(tasks, indent=2)}"

        # 2. EMAIL REPLY DRAFTING
        is_email_drafting = "email drafting" in sys_inst_lower
        if not is_email_drafting and not sys_inst_lower:
            is_email_drafting = "draft" in prompt_lower or "reply" in prompt_lower or "compose" in prompt_lower
            
        if is_email_drafting:
            sender = "User"
            subject = "Re: Project Updates"
            if "sarah" in prompt_lower:
                sender = "Sarah Jenkins"
                subject = "Re: ACTION REQUIRED: Q3 Infrastructure Migration Plan"
            elif "vance" in prompt_lower:
                sender = "Michael Vance"
                subject = "Re: Client feedback on design & glassmorphism mockup"
                
            body = (
                f"Hi {sender.split()[0]},\n\n"
                f"Thank you for the update. I have registered these task deliverables in my dashboard:\n"
                f"- Action items have been logged and scheduled.\n"
                f"- I'm currently finalizing the updates and compiling our weekly status report.\n\n"
                f"I will keep you updated on our progress.\n\n"
                f"Best regards,\nAgentFlow System Auto-Reply"
            )
            
            if response_json:
                return json.dumps({"subject": subject, "body": body})
            return body

        # 3. RAG QUESTION ANSWERING
        is_rag_qa = "technical document q&a" in sys_inst_lower or "provided document context" in prompt_lower
        if not is_rag_qa and not sys_inst_lower:
            is_rag_qa = "context" in prompt_lower or "document" in prompt_lower or "retrieved" in prompt_lower
            
        if is_rag_qa:
            # Find context block
            context = ""
            context_match = re.search(r"context\s*:\s*(.*?)(?:\n\n|\n[A-Z]|\Z)", prompt, re.IGNORECASE | re.DOTALL)
            if context_match:
                context = context_match.group(1).strip()
            
            if not context:
                context_match = re.search(r"document context\s*:\s*(.*?)(?:\n\n|\Z)", prompt, re.IGNORECASE | re.DOTALL)
                if context_match:
                    context = context_match.group(1).strip()
            
            if not context:
                context = prompt.strip()
            
            if context and len(context) > 30:
                # Let's parse the chunks from the context string
                chunks = re.split(r"--- Chunk \d+ \(Source: (.*?)\) ---", context)
                
                parsed_chunks = []
                if len(chunks) > 1:
                    for i in range(1, len(chunks), 2):
                        src = chunks[i].strip()
                        text = chunks[i+1].strip() if i+1 < len(chunks) else ""
                        if text:
                            parsed_chunks.append((src, text))
                
                if parsed_chunks:
                    response_parts = [
                        "Based on the retrieved document context, here is a detailed and pointed summary of the key findings:\n"
                    ]
                    
                    for idx, (src, text) in enumerate(parsed_chunks):
                        response_parts.append(f"### Source: `{src}` (Passage {idx + 1})")
                        
                        # Clean up the text: replace multiple spaces/newlines with single space
                        cleaned_text = re.sub(r"\s+", " ", text).strip()
                        
                        # Split into sentences using a simple regex
                        sentences = re.split(r"(?<=[.!?])\s+", cleaned_text)
                        
                        # Filter out empty or extremely short sentences
                        valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
                        
                        if valid_sentences:
                            # Take up to 5 sentences to provide a detailed, pointed overview
                            for sentence in valid_sentences[:5]:
                                # Clean up leading bullet chars if any
                                s_clean = re.sub(r"^[-*•\d.\s]+", "", sentence)
                                response_parts.append(f"- {s_clean}")
                        else:
                            response_parts.append(f"- {cleaned_text[:350]}...")
                            
                        response_parts.append("") # Empty line between sources
                        
                    response_parts.append("This synthesis has been compiled offline directly from the vector indices library database matches.")
                    return "\n".join(response_parts)
                else:
                    # Let's return a slice of the text
                    # Strip any prompts structure
                    cleaned_context = re.sub(r"^(Answer the user query|Document Context).*?$", "", context, flags=re.MULTILINE)
                    cleaned_context = re.sub(r"\s+", " ", cleaned_context).strip()
                    return (
                        f"Based on the uploaded documents, here is the detailed retrieved text:\n\n"
                        f"- {cleaned_context[:800]}...\n\n"
                        f"This content was retrieved directly from your vector indices database library."
                    )
            else:
                return (
                    "No relevant document context was found in the ChromaDB database. "
                    "Please make sure to upload a valid PDF document with text and index it before asking queries."
                )

        # 4. REPORT COMPILER AGENT
        is_report = "operations analyst" in sys_inst_lower
        if not is_report and not sys_inst_lower:
            is_report = "report" in prompt_lower or "summary" in prompt_lower
            
        if is_report:
            # Parse tasks and emails from the prompt dynamically!
            tasks_lines = []
            emails_lines = []
            
            in_tasks = False
            in_emails = False
            for line in prompt.split('\n'):
                l_str = line.strip()
                if "active tasks:" in l_str.lower():
                    in_tasks = True
                    in_emails = False
                    continue
                elif "recent emails:" in l_str.lower():
                    in_tasks = False
                    in_emails = True
                    continue
                elif l_str.lower().startswith("report requirements:"):
                    in_tasks = False
                    in_emails = False
                    continue
                
                if in_tasks and l_str.startswith("-"):
                    tasks_lines.append(l_str)
                elif in_emails and l_str.startswith("-"):
                    emails_lines.append(l_str)
            
            total_tasks = len(tasks_lines)
            completed_tasks = sum(1 for t in tasks_lines if "completed" in t.lower() or "status: completed" in t.lower())
            pending_tasks = total_tasks - completed_tasks
            high_priority = sum(1 for t in tasks_lines if "priority: high" in t.lower())
            
            # Compile markdown
            md = []
            md.append("# AgentFlow AI - Executive Productivity Report")
            md.append("")
            md.append("## Executive Summary")
            md.append("This report aggregates active deliverables, task completion states, and recent email updates across your workspace. Overall productivity velocity is running on target.")
            md.append("")
            md.append("## Workspace Metrics")
            md.append(f"- **Total Tracked Tasks**: {total_tasks} items")
            md.append(f"- **Completed Deliverables**: {completed_tasks} items")
            md.append(f"- **Pending Action Items**: {pending_tasks} items")
            md.append(f"- **High Priority Critical Items**: {high_priority} items")
            if total_tasks > 0:
                percent = int((completed_tasks / total_tasks) * 100)
                md.append(f"- **Productivity Rate**: {percent}%")
            md.append("")
            md.append("## Tasks Analytics")
            if tasks_lines:
                for t in tasks_lines:
                    md.append(t)
            else:
                md.append("- No tasks found in workspace database.")
            md.append("")
            md.append("## Communication Summary")
            if emails_lines:
                for e in emails_lines:
                    md.append(e)
            else:
                md.append("- No recent emails.")
            md.append("")
            md.append("*Compiled automatically by AgentFlow AI Report Agent.*")
            
            return "\n".join(md)

        # 5. GENERAL/DEFAULT FALLBACK CHAT
        return (
            "I am the AgentFlow Multi-Agent Assistant. "
            "I can interface with your local vector library (RAG), search the web, manage email threads, "
            "and build productivity reports. Please let me know what you'd like to do!"
        )

llm_client = LLMClient()
