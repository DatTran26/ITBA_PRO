"""Main FastAPI application entrypoint — importing modules."""

import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure modules path is on sys.path
root_dir = Path(__file__).resolve().parent.parent
modules_ocr_path = root_dir / "modules" / "vision-ocr" / "backend"
if str(modules_ocr_path) not in sys.path:
    sys.path.insert(0, str(modules_ocr_path))

from app.api.ocr import router as ocr_router

app = FastAPI(
    title="Down Town Application API",
    description="Main Backend Application API with modules",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)


@app.get("/health")
async def health_check():
    """Liveness probe."""
    return {"status": "ok"}
