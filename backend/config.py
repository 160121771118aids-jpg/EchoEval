import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
VAPI_PUBLIC_KEY = os.getenv("VAPI_PUBLIC_KEY")
VAPI_SERVER_URL = os.getenv("VAPI_SERVER_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
PORT = int(os.getenv("PORT", "8000"))
VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID")
