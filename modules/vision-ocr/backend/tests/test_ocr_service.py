import io
from unittest.mock import AsyncMock, patch

import pytest
import pytesseract
from PIL import Image

from app.services.ocr_service import extract_text_from_image, _local_ocr_fallback


@pytest.mark.asyncio
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
async def test_extract_text_gemini_success(mock_gemini):
    mock_gemini.return_value = "Gemini OCR Text"
    result = await extract_text_from_image(b"fake-bytes", "image/png")

    assert result["status"] == "success"
    assert result["text"] == "Gemini OCR Text"


@pytest.mark.asyncio
@patch("app.services.ocr_service._local_ocr_fallback")
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
async def test_extract_text_fallback_on_error(mock_gemini, mock_fallback):
    mock_gemini.side_effect = Exception("API connection timeout")
    mock_fallback.return_value = "Fallback OCR Text"

    result = await extract_text_from_image(b"fake-bytes", "image/jpeg")

    assert result["status"] == "success"
    assert result["text"] == "Fallback OCR Text"


@pytest.mark.asyncio
@patch("app.services.ocr_service._local_ocr_fallback")
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
async def test_extract_text_raises_generic_error_when_both_engines_fail(
    mock_gemini,
    mock_fallback,
):
    mock_gemini.side_effect = RuntimeError("Gemini unavailable")
    mock_fallback.side_effect = RuntimeError("Tesseract unavailable")

    with pytest.raises(RuntimeError, match="No OCR engine could process the image") as exc_info:
        await extract_text_from_image(b"fake-bytes", "image/png")

    assert str(exc_info.value.__cause__) == "Tesseract unavailable"


def test_local_ocr_missing_binary_raises_instead_of_returning_error_text():
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="white").save(buffer, format="PNG")

    with patch(
        "pytesseract.image_to_string",
        side_effect=pytesseract.TesseractNotFoundError(),
    ):
        with pytest.raises(RuntimeError, match="Local OCR failed"):
            _local_ocr_fallback(buffer.getvalue())
