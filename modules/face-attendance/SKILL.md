---
name: face-attendance
description: >
  High-speed Biometric Face Attendance & Dual Anti-Spoofing engine specification,
  ArcFace 512-D vector extraction, and FastAPI + React implementation guide for
  real-time webcam verification, fake prevention (print/screen replay), and HRMS integration.
---

# Biometric Face Attendance & Dual Anti-Spoofing Skill

## Overview

High-precision Biometric Face Attendance engine utilizing ArcFace 512-D embeddings and a robust Dual Anti-Spoofing pipeline:
1. **Silent Texture & Optical Liveness**: Laplacian frequency variance, YCrCb skin pigment scattering, and HSV specular overexposure detection.
2. **Interactive Motion & Landmark Liveness**: Eye Aspect Ratio (EAR) blink calculation, micro-motion coordinates variance, and randomized challenge-response (blink, tilt head, smile).
3. **1:N Vector Search**: Sub-2ms Cosine similarity matching powered by NumPy or Qdrant Vector DB.

## Architecture

```text
[Webcam Stream / CV PDF Upload]
          ¦
          ?
  InsightFace (ArcFace 512-D + RetinaFace)
          ¦
          +--? Dual Anti-Spoofing Pipeline --? Real/Fake Score (0.0 - 1.0)
          ¦
          +--? 1:N Cosine Similarity Engine (SQLite / Qdrant) --? Match Result
                    ¦
                    ?
          [Attendance Log Recorded (face_attendance.db)]
```

## API Specification

- `POST /api/face/check-in`: Multi-frame webcam payload `files: [Blob]`, `threshold: float`, `liveness_mode: standard | strict | off`.
- `POST /api/face/register-cv`: Upload candidate CV (PDF/Image) or portrait photo to automatically extract 512-D vector and save employee.
- `POST /api/face/liveness-challenge`: Generate randomized interactive action challenge for client liveness confirmation.
- `GET /api/face/employees`: Retrieve registered employee directory with avatar previews.
- `GET /api/face/logs`: Retrieve real-time attendance logs and spoof attempt alerts.
- `GET /api/face/summary`: Daily check-in KPI metrics (Present, Absent, Spoof Rejected).

## Drag & Drop Integration Rules

To integrate this module directly into Town Hown (`down-town`):
1. **Backend Integration**:
   Mount `face_router` from `modules/face-attendance/backend/app/api/face_attendance.py` into your FastAPI gateway or app:
   ```python
   from modules.face_attendance.backend.app.api.face_attendance import router as face_router
   app.include_router(face_router)
   ```
2. **Frontend Integration**:
   Import `FaceAttendanceWorkspace` from `modules/face-attendance/frontend/src/components/FaceAttendanceWorkspace`:
   ```tsx
   import { FaceAttendanceWorkspace } from '@/modules/face-attendance/components/FaceAttendanceWorkspace';
   export default function AttendancePage() {
     return <FaceAttendanceWorkspace />;
   }
   ```