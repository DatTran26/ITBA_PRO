---
type: srs-erd
feature: document-review
updated: 2026-09-14
---

# document-review — Entity Relationship Diagram

> Scope: lớp kiểm chứng của pipeline Document AI — kết quả trích xuất,
> field đề xuất kèm confidence/vùng nguồn, hành động review của con người,
> phân công reviewer và sự kiện publish sang module đích. `INTAKE_DOCUMENT`,
> `PROCESSING_JOB`, `USERS` là tham chiếu sang feature khác
> (`document-intake`, `org-governance`).

## Diagram

```mermaid
erDiagram
    INTAKE_DOCUMENT ||--o{ EXTRACTION_RESULT : "có kết quả trích xuất"
    PROCESSING_JOB ||--o| EXTRACTION_RESULT : "sinh ra"
    EXTRACTION_RESULT ||--o| EXTRACTION_RESULT : "xử lý lại từ"
    EXTRACTION_RESULT ||--o{ EXTRACTED_FIELD : "gồm field"
    EXTRACTION_RESULT ||--o{ REVIEW_ACTION : "ghi nhận"
    EXTRACTED_FIELD ||--o{ REVIEW_ACTION : "được thao tác"
    EXTRACTION_RESULT ||--o{ REVIEW_ASSIGNMENT : "được gán"
    EXTRACTION_RESULT ||--o{ PUBLISH_EVENT : "được publish"
    USERS ||--o{ REVIEW_ACTION : "thực hiện"
    USERS ||--o{ REVIEW_ASSIGNMENT : "được giao"

    EXTRACTION_RESULT {
        string id PK "định danh kết quả trích xuất"
        string document_id FK "file nguồn do document-intake quản lý"
        string job_id FK "job xử lý đã sinh kết quả này"
        string previous_result_id FK "kết quả trước khi xử lý lại, chuỗi phiên bản"
        string doc_type "loại tài liệu hiệu lực, reviewer có thể đổi trong review"
        string full_text "toàn bộ text OCR giữ cấu trúc và ngôn ngữ gốc"
        string language "ngôn ngữ chính phát hiện được, ưu tiên tiếng Việt"
        string engine_name "tên engine hoặc provider trích xuất"
        string engine_version "phiên bản engine/model tại thời điểm chạy"
        string status "vòng đời: chờ review, đang review, đã xác nhận, chờ publish, đã publish, chờ xử lý lại, đã hủy"
        int rerun_count "số lần đã xử lý lại trên cùng file"
        datetime created_at "thời điểm tạo kết quả"
        datetime confirmed_at "thời điểm reviewer xác nhận đủ điều kiện"
        datetime published_at "thời điểm publish thành công"
    }
    EXTRACTED_FIELD {
        string id PK "định danh field trích xuất"
        string result_id FK "kết quả trích xuất chứa field"
        string field_key "khóa field theo bộ field của loại tài liệu"
        int group_no "thứ tự nhóm field lặp, vd mục kinh nghiệm thứ hai"
        string machine_value "giá trị máy đề xuất, bất biến để làm diff"
        string confirmed_value "giá trị cuối cùng sau sửa hoặc xác nhận"
        decimal confidence "điểm tin cậy thang 0 đến 1 do engine trả"
        string source_location "vị trí nguồn trên tài liệu gốc, trang hoặc vùng"
        string status "trạng thái: đề xuất, đã sửa, điền thủ công, đã xác nhận, vắng mặt"
        boolean is_required "field bắt buộc theo loại tài liệu"
    }
    REVIEW_ACTION {
        string id PK "định danh hành động review"
        string result_id FK "kết quả trích xuất liên quan"
        string field_id FK "field bị tác động, rỗng với hành động mức tài liệu"
        string actor_id FK "người thực hiện hành động"
        string action "hành động: nhận review, sửa field, xác nhận, đánh dấu vắng, đổi loại tài liệu, yêu cầu xử lý lại, nhả review"
        string before_value "giá trị trước hành động"
        string after_value "giá trị sau hành động"
        string note "ghi chú hoặc lý do, bắt buộc với xử lý lại"
        datetime created_at "thời điểm hành động"
    }
    REVIEW_ASSIGNMENT {
        string id PK "định danh lượt gán review"
        string result_id FK "kết quả được gán"
        string assignee_id FK "người được giao review"
        string assigned_by FK "người gán, admin hoặc gán mặc định"
        string status "trạng thái gán: đang giữ, đã nhả, đã chuyển"
        datetime assigned_at "thời điểm gán"
        datetime released_at "thời điểm nhả hoặc chuyển"
    }
    PUBLISH_EVENT {
        string id PK "định danh sự kiện publish"
        string result_id FK "kết quả được publish"
        string target_module "module đích: cv-intake, document-library, ai-question-generation"
        string payload_ref "tham chiếu snapshot payload đã gửi"
        string status "trạng thái gửi: chờ publish, đã publish, thất bại cuối"
        int attempt_count "số lần đã gửi"
        string published_by FK "reviewer bấm publish"
        datetime published_at "thời điểm publish thành công"
        datetime last_attempt_at "thời điểm gửi gần nhất"
    }
    INTAKE_DOCUMENT {
        string id PK "file đã tiếp nhận, thuộc document-intake"
        string file_name "tên file"
        string context_id "ngữ cảnh nghiệp vụ quyết định module đích"
    }
    PROCESSING_JOB {
        string id PK "job xử lý file, thuộc document-intake"
        string status "trạng thái job"
    }
    USERS {
        string id PK "người dùng nội bộ, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| EXTRACTION_RESULT | Một lần trích xuất trên file đã xử lý — text đầy đủ, engine provenance và vòng đời review | document_id, job_id, full_text, engine_name/engine_version, status, rerun_count |
| EXTRACTED_FIELD | Một field đề xuất trong kết quả — giữ cả giá trị máy lẫn giá trị con người để làm diff | field_key, machine_value, confirmed_value, confidence, source_location, status |
| REVIEW_ACTION | Vết audit mức field/tài liệu của reviewer — sửa, xác nhận, đổi loại, yêu cầu xử lý lại | action, actor_id, before_value, after_value, note |
| REVIEW_ASSIGNMENT | Lượt gán review và lịch sử reassign — chống sửa đè đồng thời | assignee_id, assigned_by, status, released_at |
| PUBLISH_EVENT | Một lần gửi payload sang module đích — trạng thái và số lần gửi lại | target_module, payload_ref, status, attempt_count |
| INTAKE_DOCUMENT | File nguồn đã qua cổng intake — tham chiếu từ `document-intake` | id, file_name, context_id |
| PROCESSING_JOB | Job đã xử lý file sinh ra kết quả — tham chiếu từ `document-intake` | id, status |
| USERS | Reviewer/admin/người gán — tham chiếu từ `org-governance` | id, display_name |

## Notes & Assumptions

- `EXTRACTION_RESULT.previous_result_id` tạo chuỗi phiên bản khi "xử lý
  lại": kết quả mới trỏ về kết quả trước; kết quả cũ giữ trạng thái "chờ
  xử lý lại" rồi đóng khi bản mới được publish — phục vụ diff giữa hai
  lần trích xuất và truy vết (BR-document-review-005).
- `EXTRACTED_FIELD.machine_value` là bất biến sau khi tạo — diff và chỉ số
  M-IN-03 (field giữ nguyên/đề xuất) tính từ cặp `machine_value` ↔
  `confirmed_value`.
- `source_location` lưu dạng tham chiếu logic (trang + vùng); định dạng
  cụ thể do engine quyết định — spec chỉ yêu cầu định vị được trên tài
  liệu gốc.
- `PUBLISH_EVENT` idempotent theo cặp (`result_id`, `target_module`):
  gửi lại tăng `attempt_count`, không tạo sự kiện trùng ở module đích.
- `INTAKE_DOCUMENT`, `PROCESSING_JOB`, `USERS` là entity ngoài — chỉ khai
  tối thiểu để vẽ quan hệ; định nghĩa đầy đủ ở ERD của `document-intake`
  và `org-governance`.
- Retention của `full_text`, `source_location` và diff gắn vòng đời file
  nguồn ở intake — chờ OQ-7 (liên quan OQ-6 sản phẩm); ERD chưa mô hình
  thuộc tính retention.
