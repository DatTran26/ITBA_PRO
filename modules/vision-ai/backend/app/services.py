import os
from functools import lru_cache
from pathlib import Path

import numpy as np

import app.config as cfg
from app.config import SRC_ROOT


def decode_image(content: bytes) -> np.ndarray:
    import cv2

    image = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image")
    return image


@lru_cache(maxsize=1)
def get_face_model():
    from insightface.app import FaceAnalysis

    cfg.INSIGHTFACE_ROOT.mkdir(parents=True, exist_ok=True)
    model = FaceAnalysis(
        name=cfg.FACE_MODEL_NAME,
        root=str(cfg.INSIGHTFACE_ROOT),
        providers=["CPUExecutionProvider"],
    )
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

    matches = sum(score >= cfg.FACE_MATCH_THRESHOLD for score in scores)
    return matches >= 2, matches, scores


def _resolve_behavior_model_path(model_path: str | None) -> Path:
    if not model_path:
        return Path(cfg.BEHAVIOR_MODEL_PATH)
    path = Path(os.path.expandvars(model_path.strip().strip('"').strip("'"))).expanduser()
    if path.is_file():
        return path.resolve()
    if path.is_absolute():
        by_name = cfg.models_dir() / path.name
        if by_name.is_file():
            return by_name
        return path
    from_models = cfg.models_dir() / path.name
    if from_models.is_file():
        return from_models
    return (SRC_ROOT / path).resolve()


@lru_cache(maxsize=4)
def get_behavior_model(model_path: str | None = None):
    from ultralytics import YOLO

    resolved_path = _resolve_behavior_model_path(model_path)
    if not resolved_path.is_file():
        raise FileNotFoundError(f"Behavior weights missing at {resolved_path}")
    return YOLO(str(resolved_path))


def detect_behaviors(content: bytes, model_path: str | None = None) -> list[dict]:
    image = decode_image(content)

    if model_path and model_path.strip().lower() == "all":
        detections = []
        for m in getattr(cfg, "BEHAVIOR_MODELS", []):
            if not m.get("enabled", True):
                continue
            path = m.get("modelPath")
            conf = float(m.get("confidence", cfg.BEHAVIOR_CONFIDENCE))
            iou = float(m.get("iouThreshold", 0.45))
            labels = {str(l).strip().lower() for l in m.get("labels", [])}
            try:
                result = get_behavior_model(path).predict(
                    source=image, conf=conf, iou=iou, verbose=False
                )[0]
                for box in result.boxes:
                    label = str(result.names[int(box.cls.item())])
                    detections.append(
                        {
                            "label": label,
                            "confidence": float(box.conf.item()),
                            "bbox": [float(value) for value in box.xyxy[0].tolist()],
                            "isViolation": label.lower() in labels,
                        }
                    )
            except FileNotFoundError:
                continue
        return detections

    # Single model execution: match model configuration by path or ID
    matching = None
    target_path = model_path
    if hasattr(cfg, "BEHAVIOR_MODELS") and cfg.BEHAVIOR_MODELS:
        if model_path:
            norm_target = str(model_path).strip().replace("/", "\\").lower()
            matching = next(
                (
                    m
                    for m in cfg.BEHAVIOR_MODELS
                    if str(m.get("modelPath", "")).strip().replace("/", "\\").lower() == norm_target
                    or m.get("id", "").lower() == str(model_path).strip().lower()
                ),
                None,
            )
        if not matching:
            matching = cfg.BEHAVIOR_MODELS[0]

    conf = float(matching.get("confidence", cfg.BEHAVIOR_CONFIDENCE)) if matching else cfg.BEHAVIOR_CONFIDENCE
    iou = float(matching.get("iouThreshold", 0.45)) if matching else 0.45
    labels = (
        {str(lbl).strip().lower() for lbl in matching.get("labels", [])}
        if matching and matching.get("labels")
        else cfg.BEHAVIOR_LABELS
    )

    result = get_behavior_model(target_path).predict(
        source=image, conf=conf, iou=iou, verbose=False
    )[0]
    detections = []
    for box in result.boxes:
        label = str(result.names[int(box.cls.item())])
        detections.append(
            {
                "label": label,
                "confidence": float(box.conf.item()),
                "bbox": [float(value) for value in box.xyxy[0].tolist()],
                "isViolation": label.lower() in labels,
            }
        )
    return detections
