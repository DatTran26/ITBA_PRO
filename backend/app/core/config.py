import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_URL: str = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
)

# Allowed image MIME types
ALLOWED_MIME_TYPES: set[str] = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}

# Max upload size (10 MB)
MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024
