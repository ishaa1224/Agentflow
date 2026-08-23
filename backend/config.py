import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from a .env file if it exists
load_dotenv(BASE_DIR / ".env")

# General Configuration
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/agentflow.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads"))
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", str(BASE_DIR / "chroma_db"))

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Flag: True only when both required Supabase vars are present
SUPABASE_CONFIGURED = bool(SUPABASE_URL and SUPABASE_ANON_KEY)
if not SUPABASE_CONFIGURED:
    logger.warning("⚠️  Supabase credentials not set — auth features will be unavailable.")

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")  # Optional search api

# Google Auth Config
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip("\"'").rstrip("/")

# Gmail Credentials Paths
GMAIL_CREDENTIALS_PATH = os.getenv("GMAIL_CREDENTIALS_PATH", str(BASE_DIR / "credentials.json"))
GMAIL_TOKEN_PATH = os.getenv("GMAIL_TOKEN_PATH", str(BASE_DIR / "token.json"))

# Ensure uploads directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

# Application Modes / Fallbacks
# If no Gemini Key is supplied, the LLM will fall back to rule-based simulations
USE_MOCK_LLM = not bool(GEMINI_API_KEY)
# Mock Gmail is enabled if Google Client ID is missing OR if credentials files are missing
USE_MOCK_GMAIL = not bool(GOOGLE_CLIENT_ID) or (not os.path.exists(GMAIL_CREDENTIALS_PATH) and not os.path.exists(GMAIL_TOKEN_PATH))

def get_settings():
    return {
        "database_url": DATABASE_URL,
        "upload_dir": UPLOAD_DIR,
        "chroma_db_dir": CHROMA_DB_DIR,
        "has_gemini_key": bool(GEMINI_API_KEY),
        "use_mock_llm": USE_MOCK_LLM,
        "use_mock_gmail": USE_MOCK_GMAIL,
    }
