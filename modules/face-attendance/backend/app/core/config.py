import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Face Attendance & Anti-Spoofing Engine"
    API_PREFIX: str = "/api/face"
    VERSION: str = "1.0.0"

    # Path to SQLite DB
    DB_PATH: str = os.getenv("FACE_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "face_attendance.db"))

    # AI Face Model Settings
    INSIGHTFACE_MODEL: str = os.getenv("INSIGHTFACE_MODEL", "buffalo_sc")
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.65"))
    DEFAULT_LIVENESS_MODE: str = os.getenv("LIVENESS_MODE", "standard") # standard | strict | off

    # Optional Vector Database
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_COLLECTION: str = "employee_faces"

    # CORS
    CORS_ORIGINS: list = ["*"]

settings = Settings()