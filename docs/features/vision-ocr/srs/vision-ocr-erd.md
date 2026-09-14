---
type: srs-erd
feature: vision-ocr
updated: 2026-09-14
---

# vision-ocr — Entity Relationship Diagram

> Scope: domain model **transient** của module — chỉ tồn tại trong bộ
> nhớ phiên trình duyệt (in-memory), KHÔNG persist xuống database nào.
> Hai entity `OCR_SESSION` và `OCR_JOB` mô tả hàng đợi phiên và tài
> liệu trong hàng đợi; ba bản text là thuộc tính của `OCR_JOB`. Module
> không tham chiếu entity ngoài nào (Observed: source
> `modules/vision-ocr`).

## Diagram

```mermaid
erDiagram
    OCR_SESSION ||--o{ OCR_JOB : "chứa hàng đợi"

    OCR_SESSION {
        string id PK "định danh phiên, tạo mới mỗi tab"
        int job_count "số tài liệu đang trong hàng đợi, tối đa 5"
        datetime created_at "thời điểm mở phiên"
    }
    OCR_JOB {
        string id PK "định danh tài liệu trong hàng đợi phiên"
        string session_id FK "phiên chứa tài liệu"
        string file_name "tên file ảnh đã tải"
        string mime_type "định dạng: PNG, JPG, JPEG hoặc WEBP"
        int file_size_bytes "dung lượng file, tối đa 10 MB"
        string image_preview_ref "tham chiếu preview ảnh trong phiên, data URI"
        string status "trạng thái: queued, processing, needs_review, confirmed, error"
        string original_text "bản text gốc từ engine OCR, bất biến"
        string edited_text "bản text đang được sửa"
        string confirmed_text "bản text đã xác nhận, chỉ khi confirmed"
        string engine_used "engine trả kết quả: provider chính hoặc fallback nội bộ"
        string error_message "thông điệp lỗi khi status error"
        int attempt_count "số lần đã xử lý, tăng mỗi retry"
        datetime created_at "thời điểm thêm vào hàng đợi"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| OCR_SESSION | Phiên làm việc của một tab — gốc chứa hàng đợi; hủy khi đóng/refresh tab | id, job_count, created_at |
| OCR_JOB | Một tài liệu trong hàng đợi phiên — ảnh preview, trạng thái xử lý và ba bản text | status, original_text, edited_text, confirmed_text, engine_used, attempt_count |

## Notes & Assumptions

- **Không persistence:** hai entity này là mô hình domain trong bộ nhớ —
  không bảng database, không audit trail; refresh/đóng tab xóa toàn bộ
  (Observed: source `modules/vision-ocr`). Khi tích hợp pipeline sau
  gate PRD Mục 12, dữ liệu sẽ được đưa qua `INTAKE_DOCUMENT`/
  `PROCESSING_JOB` của `document-intake` thay vì giữ model này.
- `OCR_JOB` giữ ba bản text riêng trên cùng bản ghi: `original_text`
  bất biến sau khi engine trả; `edited_text` cập nhật khi HR sửa;
  `confirmed_text` chỉ tồn tại khi `status = confirmed` và bị hủy khi
  reopen (Observed: source `modules/vision-ocr`).
- `engine_used` ghi engine nào trả kết quả cuối (provider chính hay
  fallback nội bộ) — phục vụ nhãn nguồn đề xuất ở OQ-3; hiện module
  chưa lưu trường này, là **đề xuất bổ sung**.
- `OCR_SESSION.job_count ≤ 5` là ràng buộc thiết kế (MAX_QUEUE_SIZE);
  xử lý đồng thời tối đa một `OCR_JOB` ở `processing` trên mỗi phiên —
  hai ràng buộc này là invariant của hàng đợi tuần tự.
- Không có entity USER/AUTH: module chưa có đăng nhập — phiên là đơn vị
  quyền duy nhất; khi tích hợp, người dùng sẽ tham chiếu `USERS` của
  `org-governance`.
