import os
from pathlib import Path

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


def _resolve_path(value: str, default: Path) -> Path:
    if not value:
        return default
    path = Path(os.path.expandvars(value)).expanduser()
    if path.is_absolute():
        return path
    from_backend = (BACKEND_DIR / path).resolve()
    if from_backend.exists():
        return from_backend
    return (SRC_ROOT / path).resolve()


_load_env_file(BACKEND_DIR / ".env")

FACE_DATA_DIR = _resolve_path(
    os.getenv("FACE_DATA_DIR", ""),
    SRC_ROOT / "data" / "vision-ai" / "faces",
)
FACE_MODEL_NAME = os.getenv("FACE_MODEL_NAME", "buffalo_l")
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.75"))
BEHAVIOR_MODEL_PATH = str(
    _resolve_path(
        os.getenv("BEHAVIOR_MODEL_PATH", ""),
        SRC_ROOT / "models" / "vision-ai" / "behavior.pt",
    )
)
BEHAVIOR_CONFIDENCE = float(os.getenv("BEHAVIOR_CONFIDENCE", "0.25"))
BEHAVIOR_LABELS = {
    label.strip().lower()
    for label in os.getenv(
        "BEHAVIOR_LABELS", "smoke,Cigarette,empty_seat,un-occupied_desk"
    ).split(",")
    if label.strip()
}
