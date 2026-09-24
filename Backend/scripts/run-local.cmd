@echo off
setlocal
set "ROOT=%~dp0..\.."
set "VISION_DIR=%ROOT%\modules\vision-ai\backend"
set "OCR_DIR=%ROOT%\modules\vision-ocr\backend"

if not exist "%VISION_DIR%\.venv\Scripts\python.exe" (
  echo Vision AI virtual environment is missing. Run its setup first.
  exit /b 1
)

start "DownTown-Next" /D "%ROOT%\Frontend" cmd /k npm run dev
start "DownTown-VisionAI" /D "%VISION_DIR%" cmd /k .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
start "DownTown-OCR" /D "%OCR_DIR%" cmd /k python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
echo Local:
echo   http://localhost:3000
echo   http://127.0.0.1:8001/health
echo   http://127.0.0.1:8000/health
