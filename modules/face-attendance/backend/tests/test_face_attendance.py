import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.services.antispoofing_service import antispoofing_service
from app.services.attendance_service import attendance_service

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_liveness_challenge():
    response = client.post("/api/face/liveness-challenge")
    assert response.status_code == 200
    data = response.json()
    assert "challenge_id" in data
    assert data["action"] in ["blink", "turn_head", "smile"]
    assert len(data["instruction"]) > 0

def test_attendance_summary():
    response = client.get("/api/face/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "summary" in data
    assert "total_employees" in data["summary"]

def test_antispoofing_texture_analysis():
    # Test synthetic image
    fake_img = np.zeros((100, 100, 3), dtype=np.uint8)
    res = antispoofing_service.analyze_texture_liveness(fake_img)
    assert "score" in res
    assert "is_real" in res
    assert res["is_real"] is False  # Pure black image is not real human skin

def test_antispoofing_empty_crop():
    res = antispoofing_service.analyze_texture_liveness(None)
    assert res["is_real"] is False
    assert res["score"] == 0.0

def test_antispoofing_motion_detection():
    # Frame metadata with identical bbox (static spoof)
    static_frames = [
        {"bbox": [10, 10, 50, 50], "landmarks_5": [[15, 20], [35, 20], [25, 30], [20, 40], [30, 40]]},
        {"bbox": [10, 10, 50, 50], "landmarks_5": [[15, 20], [35, 20], [25, 30], [20, 40], [30, 40]]}
    ]
    res = antispoofing_service.analyze_sequence_motion(static_frames)
    assert res["motion_verified"] is False # Detected static duplicate image spoof