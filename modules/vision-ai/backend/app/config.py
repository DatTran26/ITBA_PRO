import os
from pathlib import Path
import json

BACKEND_DIR = Path(__file__).resolve().parents[1]
SRC_ROOT = Path(__file__).resolve().parents[4]


def _load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key and key not in os.environ:
            os.environ[key] = value.strip().strip('"').strip("'")


def models_dir() -> Path:
    env_dir = os.getenv("VISION_AI_MODELS_DIR", "").strip()
    if env_dir:
        return Path(os.path.expandvars(env_dir)).expanduser().resolve()
    container = Path("/models")
    if container.is_dir():
        return container
    return SRC_ROOT / "models" / "vision-ai"


def find_weight(*names: str) -> Path:
    directory = models_dir()
    for name in names:
        candidate = directory / name
        if candidate.is_file():
            return candidate
    return directory / names[0]


def _resolve_path(value: str, default: Path) -> Path:
    if not value:
        return default
    path = Path(os.path.expandvars(value.strip().strip('"').strip("'"))).expanduser()
    if path.exists():
        return path.resolve() if path.is_absolute() else path
    if path.is_absolute():
        by_name = models_dir() / path.name
        if by_name.exists():
            return by_name
        return path
    from_models = models_dir() / path.name
    if from_models.exists():
        return from_models
    from_backend = (BACKEND_DIR / path).resolve()
    if from_backend.exists():
        return from_backend
    return (SRC_ROOT / path).resolve()


_load_env_file(BACKEND_DIR / ".env")

VISION_CONTROLLER_CONFIG_FILE = Path(
    os.getenv(
        "VISION_CONTROLLER_CONFIG_FILE",
        str(BACKEND_DIR / "vision_controller_config.json"),
    )
)
FACE_STORAGE_CONFIG_FILE = VISION_CONTROLLER_CONFIG_FILE
INSIGHTFACE_ROOT = Path(
    os.getenv("INSIGHTFACE_ROOT", str(Path.home() / ".insightface"))
)


def _load_vision_configs() -> dict:
    if VISION_CONTROLLER_CONFIG_FILE.is_file():
        try:
            return json.loads(VISION_CONTROLLER_CONFIG_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


_saved_configs = _load_vision_configs()

# Face configuration
FACE_DATA_DIR = _resolve_path(
    _saved_configs.get("faceStoragePath") or os.getenv("FACE_DATA_DIR", ""),
    SRC_ROOT / "data" / "vision-ai" / "faces",
)
VIOLATION_DATA_DIR = _resolve_path(
    _saved_configs.get("violationStoragePath") or os.getenv("VIOLATION_DATA_DIR", ""),
    SRC_ROOT / "data" / "vision-ai" / "violations",
)
FACE_MODEL_NAME = str(_saved_configs.get("faceModelName") or os.getenv("FACE_MODEL_NAME", "buffalo_l"))
FACE_MATCH_THRESHOLD = float(_saved_configs.get("faceMatchThreshold") or os.getenv("FACE_MATCH_THRESHOLD", "0.75"))

# Behavior multi-model configuration
_saved_behavior_models = _saved_configs.get("behaviorModels")

_windows_smoke = Path(
    r"D:\WEB\model_trained\ML\Model_trained\rc_v1_yolov8\train_yolov8n_200ep\weights\best.pt"
)
_default_smoke_path = _saved_configs.get("behaviorModelPath") or (
    str(_windows_smoke)
    if _windows_smoke.is_file()
    else str(
        find_weight(
            "smoking.pt",
            "smoking.onnx",
            "behavior.pt",
            "behavior.onnx",
            "best.pt",
            "best.onnx",
        )
    )
)

_default_seat_path = str(
    find_weight("leaving.pt", "leaving.onnx", "behavior.pt", "behavior.onnx")
)

DEFAULT_BEHAVIOR_MODELS = [
    {
        "id": "smoke_detection",
        "name": "Smoking Detection",
        "description": "Detects smoking, cigarettes, and smoke in the workplace",
        "enabled": True,
        "modelPath": str(_default_smoke_path),
        "confidence": float(_saved_configs.get("behaviorConfidence") or 0.50),
        "iouThreshold": 0.45,
        "labels": ["smoke", "cigarette"],
    },
    {
        "id": "seat_occupancy",
        "name": "Seat & Desk Occupancy",
        "description": "Detects unoccupied desks or empty seats during working hours",
        "enabled": True,
        "modelPath": str(_default_seat_path),
        "confidence": 0.25,
        "iouThreshold": 0.45,
        "labels": ["empty_seat", "un-occupied_desk"],
    },
]

BEHAVIOR_MODELS = _saved_behavior_models if isinstance(_saved_behavior_models, list) and len(_saved_behavior_models) > 0 else DEFAULT_BEHAVIOR_MODELS

# Keep built-in model copy in English when loading older local configuration files.
for _model in BEHAVIOR_MODELS:
    if _model.get("id") == "smoke_detection":
        _model["name"] = "Smoking Detection"
        _model["description"] = "Detects smoking, cigarettes, and smoke in the workplace"
    elif _model.get("id") == "seat_occupancy":
        _model["name"] = "Seat & Desk Occupancy"
        _model["description"] = "Detects unoccupied desks or empty seats during working hours"

# Top-level legacy fallbacks
first_model = BEHAVIOR_MODELS[0] if BEHAVIOR_MODELS else DEFAULT_BEHAVIOR_MODELS[0]
BEHAVIOR_MODEL_PATH = str(
    _resolve_path(
        first_model.get("modelPath") or _saved_configs.get("behaviorModelPath") or os.getenv("BEHAVIOR_MODEL_PATH", ""),
        find_weight("behavior.pt", "behavior.onnx", "smoking.pt", "smoking.onnx"),
    )
)
BEHAVIOR_CONFIDENCE = float(first_model.get("confidence") or _saved_configs.get("behaviorConfidence") or os.getenv("BEHAVIOR_CONFIDENCE", "0.25"))

_saved_labels = first_model.get("labels") or _saved_configs.get("behaviorLabels")
if _saved_labels and isinstance(_saved_labels, list):
    BEHAVIOR_LABELS = {str(item).strip().lower() for item in _saved_labels if str(item).strip()}
else:
    BEHAVIOR_LABELS = {
        label.strip().lower()
        for label in os.getenv(
            "BEHAVIOR_LABELS", "smoke,cigarette,empty_seat,un-occupied_desk"
        ).split(",")
        if label.strip()
    }


def get_face_data_dir() -> Path:
    return FACE_DATA_DIR


def set_face_data_dir(new_path: str | Path) -> Path:
    update_vision_config({"faceStoragePath": str(new_path)})
    return FACE_DATA_DIR


def get_violation_data_dir() -> Path:
    return VIOLATION_DATA_DIR


def get_vision_config() -> dict:
    models_info = []
    for m in BEHAVIOR_MODELS:
        m_path_str = str(m.get("modelPath", "")).strip()
        resolved_path = _resolve_path(m_path_str, find_weight("behavior.pt", "behavior.onnx"))
        models_info.append({
            "id": m.get("id") or "custom_model",
            "name": m.get("name") or "Behavior model",
            "description": m.get("description", ""),
            "enabled": bool(m.get("enabled", True)),
            "modelPath": str(resolved_path),
            "modelExists": resolved_path.is_file(),
            "confidence": float(m.get("confidence", 0.25)),
            "iouThreshold": float(m.get("iouThreshold", 0.45)),
            "labels": sorted(list({str(lbl).strip().lower() for lbl in m.get("labels", []) if str(lbl).strip()})),
        })

    first = models_info[0] if models_info else None
    return {
        "faceStoragePath": str(FACE_DATA_DIR.resolve()),
        "faceStorageExists": FACE_DATA_DIR.exists(),
        "violationStoragePath": str(VIOLATION_DATA_DIR.resolve()),
        "violationStorageExists": VIOLATION_DATA_DIR.exists(),
        "faceModelName": FACE_MODEL_NAME,
        "faceMatchThreshold": FACE_MATCH_THRESHOLD,
        "behaviorModelPath": first["modelPath"] if first else str(BEHAVIOR_MODEL_PATH),
        "behaviorModelExists": first["modelExists"] if first else Path(BEHAVIOR_MODEL_PATH).is_file(),
        "behaviorConfidence": first["confidence"] if first else BEHAVIOR_CONFIDENCE,
        "behaviorLabels": first["labels"] if first else sorted(list(BEHAVIOR_LABELS)),
        "behaviorModels": models_info,
    }


def update_vision_config(updates: dict) -> dict:
    global FACE_DATA_DIR, VIOLATION_DATA_DIR, FACE_MODEL_NAME, FACE_MATCH_THRESHOLD
    global BEHAVIOR_MODEL_PATH, BEHAVIOR_CONFIDENCE, BEHAVIOR_LABELS, BEHAVIOR_MODELS

    if "faceStoragePath" in updates and str(updates["faceStoragePath"]).strip():
        resolved_path = _resolve_path(str(updates["faceStoragePath"]).strip(), SRC_ROOT / "data" / "vision-ai" / "faces")
        resolved_path.mkdir(parents=True, exist_ok=True)
        FACE_DATA_DIR = resolved_path

    if "violationStoragePath" in updates and str(updates["violationStoragePath"]).strip():
        resolved_path = _resolve_path(
            str(updates["violationStoragePath"]).strip(),
            SRC_ROOT / "data" / "vision-ai" / "violations",
        )
        resolved_path.mkdir(parents=True, exist_ok=True)
        VIOLATION_DATA_DIR = resolved_path

    if "faceModelName" in updates and str(updates["faceModelName"]).strip():
        FACE_MODEL_NAME = str(updates["faceModelName"]).strip()

    if "faceMatchThreshold" in updates:
        try:
            val = float(updates["faceMatchThreshold"])
            if 0.1 <= val <= 1.0:
                FACE_MATCH_THRESHOLD = val
        except (ValueError, TypeError):
            pass

    if "behaviorModels" in updates and isinstance(updates["behaviorModels"], list):
        clean_models = []
        for index, item in enumerate(updates["behaviorModels"]):
            if not isinstance(item, dict):
                continue
            m_id = str(item.get("id") or f"model_{index + 1}").strip()
            m_name = str(item.get("name") or f"Model {index + 1}").strip()
            m_desc = str(item.get("description") or "").strip()
            m_enabled = bool(item.get("enabled", True))
            m_path = str(item.get("modelPath") or "").strip()
            resolved_pt = str(_resolve_path(m_path, find_weight("behavior.pt", "behavior.onnx")))

            conf = 0.25
            try:
                c_val = float(item.get("confidence", 0.25))
                if 0.01 <= c_val <= 1.0:
                    conf = c_val
            except (ValueError, TypeError):
                pass

            iou = 0.45
            try:
                i_val = float(item.get("iouThreshold", 0.45))
                if 0.01 <= i_val <= 1.0:
                    iou = i_val
            except (ValueError, TypeError):
                pass

            raw_labels = item.get("labels", [])
            if isinstance(raw_labels, str):
                raw_labels = raw_labels.split(",")
            clean_labels = sorted(list({str(lbl).strip().lower() for lbl in raw_labels if str(lbl).strip()}))

            clean_models.append({
                "id": m_id,
                "name": m_name,
                "description": m_desc,
                "enabled": m_enabled,
                "modelPath": resolved_pt,
                "confidence": conf,
                "iouThreshold": iou,
                "labels": clean_labels,
            })

        if clean_models:
            BEHAVIOR_MODELS = clean_models
            # Sync legacy top-level variables with first model
            BEHAVIOR_MODEL_PATH = BEHAVIOR_MODELS[0]["modelPath"]
            BEHAVIOR_CONFIDENCE = BEHAVIOR_MODELS[0]["confidence"]
            all_labels = set()
            for m in BEHAVIOR_MODELS:
                all_labels.update(m.get("labels", []))
            BEHAVIOR_LABELS = all_labels or {"smoke", "cigarette", "empty_seat", "un-occupied_desk"}

    # Legacy support if updating behaviorModelPath directly
    if "behaviorModelPath" in updates and str(updates["behaviorModelPath"]).strip():
        BEHAVIOR_MODEL_PATH = str(
            _resolve_path(str(updates["behaviorModelPath"]).strip(), find_weight("behavior.pt", "behavior.onnx"))
        )
        if BEHAVIOR_MODELS:
            BEHAVIOR_MODELS[0]["modelPath"] = BEHAVIOR_MODEL_PATH

    if "behaviorConfidence" in updates:
        try:
            conf = float(updates["behaviorConfidence"])
            if 0.01 <= conf <= 1.0:
                BEHAVIOR_CONFIDENCE = conf
                if BEHAVIOR_MODELS:
                    BEHAVIOR_MODELS[0]["confidence"] = conf
        except (ValueError, TypeError):
            pass

    if "behaviorLabels" in updates:
        raw_labels = updates["behaviorLabels"]
        if isinstance(raw_labels, str):
            raw_labels = raw_labels.split(",")
        if isinstance(raw_labels, (list, set)):
            BEHAVIOR_LABELS = {str(item).strip().lower() for item in raw_labels if str(item).strip()}
            if BEHAVIOR_MODELS:
                BEHAVIOR_MODELS[0]["labels"] = sorted(list(BEHAVIOR_LABELS))

    current = {
        "faceStoragePath": str(FACE_DATA_DIR.resolve()),
        "violationStoragePath": str(VIOLATION_DATA_DIR.resolve()),
        "faceModelName": FACE_MODEL_NAME,
        "faceMatchThreshold": FACE_MATCH_THRESHOLD,
        "behaviorModelPath": str(BEHAVIOR_MODEL_PATH),
        "behaviorConfidence": BEHAVIOR_CONFIDENCE,
        "behaviorLabels": sorted(list(BEHAVIOR_LABELS)),
        "behaviorModels": BEHAVIOR_MODELS,
    }

    try:
        VISION_CONTROLLER_CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
        VISION_CONTROLLER_CONFIG_FILE.write_text(
            json.dumps(current, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    except Exception:
        pass

    return get_vision_config()
