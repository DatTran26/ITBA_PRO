# Plan — Face login/chấm công + nhận diện hành vi (tối nay)

**Trạng thái:** **LOCKED** (Leader + Anti_1). Không implement cho đến khi Hieu/Codex rảnh.  
**Nhánh:** `develop-hieu`. Kiến trúc B: Next.js = auth/admin UI; Python = HTTP inference (không `ProcessStartInfo`).  
**Nguồn logic:** `D:\WEB\project\Webapp_Quan_Li_Hanh_Vi_Vi_Pham`  
**PRODUCT Town Hown:** Module 7 ≠ camera hành vi. Slice mới; AI không tự kỷ luật; alert `pending_review`.

### Chốt sau Anti_1

- **Không port full** C#/SignalR/Telegram/RTSP tối nay.
- Python **FastAPI HTTP**, Next BFF điều phối (giống OCR Phase 1).
- **Disk local bắt buộc** cho ảnh/embedding (`FACE_DATA_DIR`); Docker **bind-mount** thư mục đó vào container Python. Supabase Storage = tùy chọn multi-host sau — không thay yêu cầu local của Hieu.
- Engine: **ArcFace (InsightFace)**, không VGG-Face/DeepFace của reference.
- Tracking IoU/thời gian tối nay: BFF hoặc Python stateless từng frame; worker nền = sau.

---

## 1. Project tham chiếu làm gì

| Khối | Cách làm (file) |
| --- | --- |
| Face enroll | Webcam 4 góc (0 trước, 1 trái, 2 phải, 3 cúi). `wwwroot/js/register.js`, `UserService.cs` |
| Embedding | Python `ML/scripts/run_deepface.py` (`represent` / `represent_batch`). Default DeepFace **VGG-Face** + opencv, fallback RetinaFace. **Không phải ArcFace** trong code hiện tại. |
| Ảnh local | `dataset/{username}/*.jpg` cạnh ContentRoot (`UserService` ~dòng 420). `FaceImagePath` trỏ file đầu. |
| Vector | SQL `UserFaceEmbeddings.EmbeddingJson` + cosine distance, threshold DB ~0.40–0.68 |
| Login / ca | Face verify trước session; `WorkSessions` check-in/out + ảnh `wwwroot/uploads/attendance/{userId}/` |
| Admin CRUD face | Manager/Admin: list nhân viên có face, cập nhật 4 ảnh (`UpdateBiometricImageAsync`) |
| Hành vi | YOLO `Cigarette` + `un-occupied_desk`; worker persistent `yolo_worker.py` stdin/stdout; smoke >1.5s, empty desk >3s; ảnh `wwwroot/uploads/violations/`; Manager Approved/Rejected |
| Live | `yolo_monitor_session.py` preview, **không** ghi DB |

Town Hown hiện có: login email/password Supabase (`Frontend/src/app/login`). **Không** có face, WorkSessions, YOLO.

---

## 2. Quyết định port (không copy nguyên C# MVC)

- Web auth vẫn **Supabase + Next**. Python **không** thay session cookie.
- Face: Hieu yêu cầu **ArcFace** → InsightFace buffalo_l (512-d), **không** giữ VGG-Face.
- Ảnh/embedding **file local** (máy chạy Python), path cấu hình `FACE_DATA_DIR` (vd. `D:\Open AI\down_town\data\faces\{userId}\`). Metadata userId/góc/CRUD: bảng Supabase (để admin Next query). Vector có thể `.npy` cạnh ảnh **và/hoặc** cột jsonb.
- Hành vi: port YOLO worker + luật thời gian + bảng alert Pending; **không** port Telegram/payroll/chat tối nay.
- Role CRUD face: `admin` / `super_admin` / `leader` (và `hr` nếu Hieu xác nhận “toàn role”).

---

## 3. Cắt tối nay vs sau

### Tối nay (P0) — Face → chấm công

1. Service Python `modules/face-arcface/` (FastAPI, persistent model):
   - `POST /enroll` 4 ảnh → detect 1 mặt/ảnh → ArcFace → ghi `{FACE_DATA_DIR}/{userId}/{0-3}.jpg` + `{userId}.npy`
   - `POST /verify` 1 ảnh → cosine vs enroll → `{ match, userId, distance }`
   - `GET/DELETE /enroll/{userId}` cho admin
2. Next BFF (auth bắt buộc, trừ bước verify-login nếu design “face trước password”):
   - Admin: CRUD enroll (gắn `users.id` Town Hown)
   - Employee: check-in/out: capture → BFF → Python verify → ghi `attendance_sessions`
3. UI mỏng: trang admin “Khuôn mặt”; trang chấm công webcam (học `register.js` / employee attendance).
4. Migration: `face_enrollments`, `attendance_sessions` (check_in/out, image_path local, distance).

**Login bằng mặt:** tối nay = **face verify rồi mới tạo attendance**; tùy chọn gắn thêm “face + đã có session Supabase” nếu user đã login password. Full “thay password bằng mặt” = P1 (rủi ro spoof).

### Tối nay nếu còn giờ (P0.5) — Hành vi admin skeleton

- Copy logic `yolo_worker.py` + weight local `ML/weights/best.pt` (không commit .pt).
- FastAPI `POST /detect` frame → boxes; Next admin live **hoặc** chỉ upload ảnh test.
- Bảng `behavior_alerts` status `pending` — admin duyệt. **Không** auto phạt.

### Sau (P1+)

- Live stream SignalR-equivalent, tracking IoU, Telegram, gán nhân viên vào alert, PRODUCT privacy policy camera, anti-spoof liveness.

---

## 4. Luồng đề xuất

```text
Enroll (admin/hr): webcam 4 góc → Next /api/face/enroll → Python ArcFace
  → disk FACE_DATA_DIR + rows face_enrollments

Chấm công: webcam 1 frame → Next /api/attendance/check-in
  → Python /verify → nếu match: attendance_sessions + lưu ảnh local
  → nếu fail: 401, không ghi công

Hành vi (admin): camera/frame → Python YOLO → nếu vượt ngưỡng thời gian
  → ảnh evidence local + behavior_alerts pending → admin Approved/Rejected
```

---

## 5. Rủi ro

| Rủi ro | Ghi chú |
| --- | --- |
| Local disk | Chỉ máy host Python; nhiều user/VPS phải NFS hoặc đổi Storage sau |
| GPU / cold start | Worker persistent như `yolo_worker.py`; ArcFace load 1 lần |
| Privacy | Camera + lưu mặt: cần policy; không auto kỷ luật |
| Reference ≠ ArcFace | Phải đổi engine, giữ protocol 4 ảnh + cosine |
| Spoof | Ảnh in; tối nay threshold chặt, chưa liveness |
| PRODUCT drift | Cần ghi vào PRODUCT khi Hieu chốt |

---

## 6. Việc chờ Anti_1 / Hieu chốt

- [ ] Anti_1: PASS/FAIL plan (auth boundary, local path, không leak embedding ra browser)
- [ ] Hieu: `FACE_DATA_DIR` mặc định; hr có CRUD face không; tối nay có làm YOLO hay chỉ face
- [ ] Khi Codex rảnh: Leader giao P0 `modules/face-arcface` + BFF + 2 trang UI
