from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """
    Endpoint POST /api/ocr/scan
    Accepts image file, encodes to Base64, calls Gemini Vision API with local OCR fallback.
    """
    pass
