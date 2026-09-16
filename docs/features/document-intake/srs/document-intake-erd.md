---
type: srs-erd
feature: document-intake
updated: 2026-09-14
---

# document-intake — Entity Relationship Diagram

> Scope: dữ liệu cổng tiếp nhận — file được nhận, job xử lý và sự kiện kiểm
> toán. Không gồm nội dung trích xuất (thuộc `document-review`) hay phiên
> bản thư viện (thuộc `document-library`).

## Diagram

```mermaid
erDiagram
    INTAKE_DOCUMENT ||--o{ PROCESSING_JOB : "tao"
    INTAKE_DOCUMENT ||--o{ INTAKE_AUDIT_EVENT : "ghi_nhan"
    PROCESSING_JOB ||--o{ INTAKE_AUDIT_EVENT : "ghi_nhan"
    USERS ||--o{ INTAKE_DOCUMENT : "tai_len"
    USERS ||--o{ INTAKE_AUDIT_EVENT : "thuc_hien"

    INTAKE_DOCUMENT {
        string id PK "định danh bản ghi tiếp nhận"
        string file_name "tên file người dùng tải lên"
        string file_type "định dạng file theo whitelist"
        int file_size "kích thước file tính bằng byte"
        string doc_type "loại tài liệu đã xác nhận (CV, giấy tờ nhân sự, biên bản...)"
        string context_type "loại ngữ cảnh đích (hồ sơ, cuộc họp, công việc, thư viện)"
        string context_id "mã tham chiếu ngữ cảnh đích"
        string status "trạng thái file: đang kiểm tra/đã nhận/bị từ chối/cách ly/đã xử lý/thất bại"
        string reject_reason "lý do từ chối hoặc cách ly hiển thị cho người tải"
        string storage_path "đường dẫn lưu file trong kho"
        string uploaded_by FK "người tải file"
        datetime created_at "thời điểm tiếp nhận"
        datetime updated_at "thời điểm cập nhật trạng thái gần nhất"
    }

    PROCESSING_JOB {
        string id PK "định danh job xử lý"
        string document_id FK "file được xử lý"
        string job_type "loại xử lý (trích xuất text, phân loại...)"
        string status "trạng thái job: chờ/đang xử lý/xong/thất bại/treo"
        int attempt_count "số lần đã thử xử lý"
        string error_message "thông điệp lỗi lần gần nhất"
        datetime queued_at "thời điểm vào hàng chờ"
        datetime started_at "thời điểm bắt đầu xử lý gần nhất"
        datetime finished_at "thời điểm kết thúc"
    }

    INTAKE_AUDIT_EVENT {
        string id PK "định danh sự kiện kiểm toán"
        string document_id FK "file liên quan (nếu có)"
        string job_id FK "job liên quan (nếu có)"
        string actor_id FK "người thực hiện hành động"
        string action "hành động: tải/từ chối/cách ly/retry/can thiệp admin"
        string result "kết quả bước kiểm tra hoặc hành động"
        string detail "chi tiết bổ sung và lý do"
        datetime created_at "thời điểm ghi nhận"
    }

    USERS {
        string id PK "người dùng nội bộ (thuộc org-governance)"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| INTAKE_DOCUMENT | Bản ghi một file đi qua cổng tiếp nhận, gắn ngữ cảnh nghiệp vụ và trạng thái vòng đời | file_name, file_type, doc_type, context_type + context_id, status, storage_path |
| PROCESSING_JOB | Một lần xử lý nền của file đã nhận; nhiều job khi retry tạo lần chạy mới hoặc loại xử lý khác nhau | document_id, job_type, status, attempt_count, error_message |
| INTAKE_AUDIT_EVENT | Vết kiểm toán cho mọi lượt tải, từ chối, cách ly, retry và can thiệp admin | actor_id, action, result, detail, created_at |
| USERS | Người dùng nội bộ — entity ngoài do `org-governance` sở hữu, chỉ tham chiếu | id |

## Notes & Assumptions

- `context_type` + `context_id` là tham chiếu logic tới ngữ cảnh nghiệp vụ
  (hồ sơ ứng viên, cuộc họp, task, thư viện nguồn); kiểu liên kết cụ thể
  là quyết định thiết kế, không phải FK DB trong phạm vi spec này.
- File bị từ chối không lưu vào kho → `storage_path` rỗng với status bị từ
  chối; file bị cách ly có `storage_path` vùng riêng nhưng không tạo job.
- Trạng thái `treo` của PROCESSING_JOB là cờ giám sát (quá ngưỡng thời
  gian), không phải trạng thái kết thúc — job treo vẫn có thể được admin
  đẩy lại hàng chờ.
- Retention/xóa file thô chờ OQ-5 (liên quan OQ-6 sản phẩm); ERD chưa mô
  hình thuộc tính retention.
