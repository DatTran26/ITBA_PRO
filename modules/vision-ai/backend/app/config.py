import os
from pathlib import Path

FACE_DATA_DIR = Path(os.getenv("FACE_DATA_DIR", "/data/faces"))
FACE_MODEL_NAME = os.getenv("FACE_MODEL_NAME", "buffalo_l")
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.75"))
BEHAVIOR_MODEL_PATH = os.getenv("BEHAVIOR_MODEL_PATH", "/models/behavior.pt")
BEHAVIOR_CONFIDENCE = float(os.getenv("BEHAVIOR_CONFIDENCE", "0.25"))
BEHAVIOR_LABELS = {
    label.strip().lower()
    for label in os.getenv(
        "BEHAVIOR_LABELS", "smoke,Cigarette,empty_seat,un-occupied_desk"
    ).split(",")
    if label.strip()
}
