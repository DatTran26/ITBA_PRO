FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    INSIGHTFACE_ROOT=/data/insightface \
    VISION_AI_MODELS_DIR=/models \
    VISION_CONTROLLER_CONFIG_FILE=/data/config/vision_controller_config.json \
    FACE_DATA_DIR=/data/faces \
    VIOLATION_DATA_DIR=/data/violations \
    YOLO_CONFIG_DIR=/tmp/Ultralytics

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        cmake \
        git \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

RUN mkdir -p /data/faces /data/violations /data/insightface /data/config /models

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
