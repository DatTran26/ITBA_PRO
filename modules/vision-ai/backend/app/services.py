import os
from functools import lru_cache
from pathlib import Path

import numpy as np

from app.config import (
    BEHAVIOR_CONFIDENCE,
    BEHAVIOR_LABELS,
    BEHAVIOR_MODEL_PATH,
    SRC_ROOT,
    FACE_MATCH_THRESHOLD,
    FACE_MODEL_NAME,
)


def decode_image(content: bytes) -> np.ndarray:
    import cv2

    image = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image")
    return image


@lru_cache(maxsize=1)
def get_face_model():
    from insightface.app import FaceAnalysis

    model = FaceAnalysis(name=FACE_MODEL_NAME, providers=["CPUExecutionProvider"])
    model.prepare(ctx_id=-1, det_size=(640, 640))
    return model


def extract_face_embedding(content: bytes) -> list[float]:
    faces = get_face_model().get(decode_image(content))
    if not faces:
        raise ValueError("No face detected")
    face = max(faces, key=lambda item: float(np.prod(item.bbox[2:] - item.bbox[:2])))
    embedding = np.asarray(face.normed_embedding, dtype=np.float32)
    return embedding.tolist()


def verify_face(
    probe: list[float], stored_embeddings: list[list[float]]
) -> tuple[bool, int, list[float]]:
    probe_array = np.asarray(probe, dtype=np.float32)
    if probe_array.ndim != 1 or not probe_array.size:
        raise ValueError("Invalid probe embedding")

    scores: list[float] = []
    for stored in stored_embeddings:
        stored_array = np.asarray(stored, dtype=np.float32)
        if stored_array.shape != probe_array.shape:
            raise ValueError("Stored embedding dimensions do not match probe")
        denominator = float(np.linalg.norm(probe_array) * np.linalg.norm(stored_array))
        if denominator == 0:
            raise ValueError("Embedding cannot be a zero vector")
        scores.append(float(np.dot(probe_array, stored_array) / denominator))

    matches = sum(score >= FACE_MATCH_THRESHOLD for score in scores)
    return matches >= 2, matches, scores


def _resolve_behavior_model_path(model_path: str | None) -> Path:
    if not model_path:
        return Path(BEHAVIOR_MODEL_PATH)
    path = Path(os.path.expandvars(model_path)).expanduser()
    return path if path.is_absolute() else (SRC_ROOT / path).resolve()


@lru_cache(maxsize=4)
def get_behavior_model(model_path: str | None = None):
    from ultralytics import YOLO

    resolved_path = _resolve_behavior_model_path(model_path)
    if not resolved_path.is_file():
        raise FileNotFoundError(f"Behavior weights missing at {resolved_path}")
    return YOLO(str(resolved_path))


def detect_behaviors(content: bytes, model_path: str | None = None) -> list[dict]:
    result = get_behavior_model(model_path).predict(
        source=decode_image(content), conf=BEHAVIOR_CONFIDENCE, verbose=False
    )[0]
    detections = []
    for box in result.boxes:
        label = str(result.names[int(box.cls.item())])
        if label.lower() not in BEHAVIOR_LABELS:
            continue
        detections.append(
            {
                "label": label,
                "confidence": float(box.conf.item()),
                "bbox": [float(value) for value in box.xyxy[0].tolist()],
            }
        )
    return detections

