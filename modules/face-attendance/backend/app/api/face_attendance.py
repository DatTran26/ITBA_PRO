from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import List, Optional
import cv2
import numpy as np
import uuid
import base64

from app.services.face_service import face_service
from app.services.antispoofing_service import antispoofing_service
from app.services.attendance_service import attendance_service
from app.core.config import settings

router = APIRouter(prefix="/api/face", tags=["Face Attendance"])

ACTIVE_CHALLENGES = {}

# ============================================================================
# 1. ĐĂNG KÝ HỒ SƠ TỪ CV (PDF HOẶC ẢNH)
# ============================================================================
@router.post("/register-cv", summary="Đăng ký khuôn mặt từ file CV (PDF/Ảnh)")
async def register_from_cv(
    employee_code: str = Form(..., description="Mã nhân viên (duy nhất)"),
    full_name: str = Form(..., description="Họ và tên nhân viên"),
    department: str = Form("Hành chính Nhân sự", description="Phòng ban"),
    email: str = Form("", description="Email liên hệ"),
    file: UploadFile = File(..., description="File CV định dạng PDF hoặc hình ảnh (PNG, JPG, WebP)")
):
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Tệp tải lên rỗng.")

        extracted = face_service.extract_cv_face(content, file.filename)

        saved = attendance_service.save_employee(
            employee_code=employee_code.strip(),
            full_name=full_name.strip(),
            department=department.strip(),
            email=email.strip(),
            embedding=extracted["embedding"],
            avatar_base64=extracted["avatar_base64"]
        )

        return {
            "success": True,
            "message": f"Đăng ký khuôn mặt thành công cho nhân viên {full_name} ({employee_code}).",
            "data": {
                "employee": saved,
                "bbox": extracted["bbox"],
                "avatar_preview": extracted["avatar_base64"]
            }
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý hồ sơ CV: {str(e)}")

# ============================================================================
# 2. KHỞI TẠO THỬ THÁCH CHỐNG GIẢ MẠO TƯƠNG TÁC
# ============================================================================
@router.post("/liveness-challenge", summary="Tạo thử thách cử động (Chớp mắt / Cười / Quay đầu)")
async def create_liveness_challenge():
    import random
    challenges = [
        {"action": "blink", "instruction": "Vui lòng chớp mắt 1-2 lần trước camera."},
        {"action": "turn_head", "instruction": "Vui lòng nghiêng nhẹ đầu sang một bên."},
        {"action": "smile", "instruction": "Vui lòng mỉm cười nhẹ trước camera."}
    ]
    selected = random.choice(challenges)
    challenge_id = str(uuid.uuid4())
    ACTIVE_CHALLENGES[challenge_id] = selected["action"]

    return {
        "challenge_id": challenge_id,
        "action": selected["action"],
        "instruction": selected["instruction"]
    }

# ============================================================================
# 3. ĐIỂM DANH QUA CAMERA (DUAL ANTI-SPOOFING + 1:N MATCHING)
# ============================================================================
@router.post("/check-in", summary="Điểm danh khuôn mặt qua Camera có kiểm tra Anti-Spoofing")
async def check_in(
    files: List[UploadFile] = File(..., description="Một hoặc nhiều frame ảnh gửi từ webcam"),
    device_id: str = Form("CAM_GATE_01", description="Mã thiết bị / Vị trí quét"),
    threshold: float = Form(None, description="Ngưỡng Cosine Similarity"),
    liveness_mode: str = Form(None, description="Chế độ kiểm tra: standard | strict | off")
):
    if not files:
        raise HTTPException(status_code=400, detail="Không có hình ảnh nào được gửi lên.")

    use_threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD
    use_liveness_mode = liveness_mode if liveness_mode is not None else settings.DEFAULT_LIVENESS_MODE

    face_crops = []
    frames_meta = []
    best_face_data = None

    for f in files:
        data = await f.read()
        nparr = np.frombuffer(data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            continue

        extracted = face_service.extract_face_from_frame(img)
        if extracted:
            x1, y1, x2, y2 = extracted["bbox"]
            h, w, _ = img.shape
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            face_crop = img[y1:y2, x1:x2]

            face_crops.append(face_crop)
            frames_meta.append(extracted)
            if best_face_data is None:
                best_face_data = extracted

    if not best_face_data:
        return {
            "success": False,
            "status": "NO_FACE",
            "message": "Không tìm thấy khuôn mặt rõ ràng trong khung hình camera."
        }

    # 1. So khớp 1:N với cơ sở dữ liệu vector
    query_emb = best_face_data["embedding"].tolist()
    match_result = attendance_service.search_face_1_to_n(query_emb, threshold=use_threshold)

    # 2. Kiểm tra Anti-Spoofing
    liveness_result = antispoofing_service.evaluate_liveness(face_crops, frames_meta, mode=use_liveness_mode)
    liveness_score = liveness_result.get("liveness_score", 0.0)

    # Cảnh báo nếu ở strict mode và fail
    if use_liveness_mode == "strict" and not liveness_result["passed"]:
        attendance_service.log_attendance(
            employee_id=match_result["id"] if (match_result and match_result.get("id")) else 0,
            employee_code=match_result["employee_code"] if (match_result and match_result.get("employee_code")) else "UNKNOWN",
            full_name=f"Cảnh báo giả mạo ({match_result['full_name'] if (match_result and match_result.get('full_name')) else 'Chưa rõ'})",
            similarity_score=match_result.get("similarity", 0.0) if match_result else 0.0,
            liveness_score=liveness_score,
            device_id=device_id,
            status="SPOOF_DETECTED"
        )
        return {
            "success": False,
            "status": "SPOOF_REJECTED",
            "message": "Xác thực thất bại: Nghi ngờ ảnh in hoặc ánh sáng màn hình giả mạo.",
            "similarity_score": match_result.get("similarity", 0.0) if match_result else 0.0,
            "liveness_score": liveness_score,
            "liveness_details": liveness_result
        }

    # 3. Kiểm tra kết quả so khớp khuôn mặt
    if not match_result or not match_result.get("id"):
        highest_sim = match_result.get("highest_similarity", 0.0) if match_result else 0.0
        return {
            "success": False,
            "status": "NOT_MATCHED",
            "similarity_score": highest_sim,
            "liveness_score": liveness_score,
            "message": f"Khuôn mặt người thật ({int(liveness_score*100)}%) nhưng chưa đăng ký hoặc độ tương đồng thấp ({int(highest_sim*100)}% < {int(use_threshold*100)}%)."
        }

    # 4. Ghi log điểm danh thành công
    log_entry = attendance_service.log_attendance(
        employee_id=match_result["id"],
        employee_code=match_result["employee_code"],
        full_name=match_result["full_name"],
        similarity_score=match_result["similarity"],
        liveness_score=liveness_score,
        device_id=device_id,
        status="SUCCESS"
    )

    return {
        "success": True,
        "status": "SUCCESS",
        "message": f"Điểm danh thành công! Xin chào {match_result['full_name']}.",
        "employee": {
            "id": match_result["id"],
            "employee_code": match_result["employee_code"],
            "full_name": match_result["full_name"],
            "department": match_result.get("department", ""),
            "avatar_base64": match_result.get("avatar_base64", "")
        },
        "similarity_score": match_result["similarity"],
        "liveness_score": liveness_result["liveness_score"],
        "log": log_entry
    }

# ============================================================================
# 4. QUẢN LÝ NHÂN SỰ & BÁO CÁO THỐNG KÊ
# ============================================================================
@router.get("/employees", summary="Lấy danh sách nhân viên đã đăng ký")
def list_employees():
    return {
        "success": True,
        "employees": attendance_service.get_employees()
    }

@router.get("/logs", summary="Lấy lịch sử điểm danh")
def list_attendance_logs(limit: int = Query(50, ge=1, le=200)):
    return {
        "success": True,
        "logs": attendance_service.get_attendance_logs(limit=limit)
    }

@router.get("/summary", summary="Lấy thống kê điểm danh hôm nay")
def get_today_summary():
    return {
        "success": True,
        "summary": attendance_service.get_attendance_summary()
    }