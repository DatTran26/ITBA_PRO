import io
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def create_dummy_image_bytes(fmt: str = "PNG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="white")
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_does_not_allow_unlisted_origin():
    response = client.options(
        "/api/ocr/scan",
        headers={
            "Origin": "http://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_scan_unsupported_mime_type():
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    response = client.post("/api/ocr/scan", files=files)
    assert response.status_code == 400


@patch("app.api.ocr.extract_text_from_image", new_callable=AsyncMock)
def test_scan_image_success(mock_extract):
    mock_extract.return_value = {
        "text": "Sample Extracted Text",
        "image_b64": "data:image/png;base64,dummy",
        "status": "success",
    }

    img_bytes = create_dummy_image_bytes("PNG")
    files = {"file": ("sample.png", img_bytes, "image/png")}
    response = client.post("/api/ocr/scan", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["text"] == "Sample Extracted Text"


@patch("app.services.ocr_service._local_ocr_fallback")
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
def test_scan_returns_503_when_all_ocr_engines_fail(mock_gemini, mock_fallback):
    mock_gemini.side_effect = RuntimeError("Gemini unavailable")
    mock_fallback.side_effect = RuntimeError("Tesseract unavailable")
    error_client = TestClient(app, raise_server_exceptions=False)

    files = {"file": ("sample.png", create_dummy_image_bytes(), "image/png")}
    response = error_client.post("/api/ocr/scan", files=files)

    assert response.status_code == 503
    assert response.json() == {"detail": "OCR service temporarily unavailable"}
