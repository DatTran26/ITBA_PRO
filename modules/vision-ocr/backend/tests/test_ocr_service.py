from unittest.mock import AsyncMock, patch
import pytest
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


def test_local_ocr_fallback_handling():
    result = _local_ocr_fallback(b"invalid-image-data")
    assert isinstance(result, str)
