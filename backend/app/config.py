import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")]

OPENAI_MODEL = "gpt-4o-mini"
GEMINI_ENGINE_MODEL = "gemini-2.0-flash"
GEMINI_AGENT_MODEL = "gemini-2.0-flash"

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing in environment")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing in environment")
