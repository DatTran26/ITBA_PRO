from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.face_attendance import router as face_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Module Điểm danh Khuôn mặt & Chống Giả mạo (Dual Anti-Spoofing + ArcFace 512-D + SQLite/Qdrant)",
    version=settings.VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(face_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)