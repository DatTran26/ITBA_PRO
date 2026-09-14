---
type: srs-erd
feature: document-library
updated: 2026-09-14
---

# document-library — Entity Relationship Diagram

> Scope: thư viện tài liệu nguồn của một tổ chức — tài liệu, phiên bản có
> trạng thái duyệt, topic theo phiên bản, tham chiếu nội dung phát sinh và
> sự kiện kiểm toán. `INTAKE_DOCUMENT`, `EXTRACTION_RESULT`, `USERS` là
> tham chiếu sang feature khác (`document-intake`, `document-review`,
> `org-governance`).

## Diagram

```mermaid
erDiagram
    SOURCE_DOCUMENT ||--o{ SOURCE_VERSION : "có phiên bản"
    SOURCE_DOCUMENT }o--o| SOURCE_VERSION : "bản hiệu lực"
    INTAKE_DOCUMENT ||--o| SOURCE_VERSION : "là file của"
    EXTRACTION_RESULT ||--o| SOURCE_VERSION : "cung cấp text"
    SOURCE_VERSION ||--o{ DOCUMENT_TOPIC : "gồm topic"
    DOCUMENT_TOPIC ||--o| DOCUMENT_TOPIC : "gộp hoặc tách thành"
    SOURCE_VERSION ||--o{ DERIVED_CONTENT : "là nguồn của"
    SOURCE_DOCUMENT ||--o{ LIBRARY_AUDIT_EVENT : "ghi nhận"
    SOURCE_VERSION ||--o{ LIBRARY_AUDIT_EVENT : "ghi nhận"
    USERS ||--o{ LIBRARY_AUDIT_EVENT : "thực hiện"
    USERS ||--o{ SOURCE_DOCUMENT : "sở hữu nội dung"
    USERS ||--o{ SOURCE_VERSION : "duyệt"

    SOURCE_DOCUMENT {
        string id PK "định danh tài liệu nguồn"
        string title "tên tài liệu nguồn"
        string doc_kind "loại: quy trình, đào tạo, khung năng lực, khác"
        string description "mô tả nội dung và mục đích dùng"
        string owner_id FK "chủ sở hữu nội dung, người dùng nội bộ"
        string current_version_id FK "phiên bản đang hiệu lực, tối đa một"
        string status "trạng thái: hoạt động hoặc ngừng dùng"
        string retired_reason "lý do ngừng dùng"
        datetime created_at "thời điểm thêm tài liệu"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    SOURCE_VERSION {
        string id PK "định danh phiên bản tài liệu"
        string source_document_id FK "tài liệu nguồn chứa phiên bản"
        int version_no "số thứ tự phiên bản trong tài liệu"
        string intake_document_id FK "file nguồn của phiên bản qua document-intake"
        string extraction_result_id FK "text trích xuất đã xác nhận qua document-review"
        string status "vòng đời: đang xử lý, chờ duyệt, đã duyệt, đã thay thế, từ chối, thất bại, ngừng dùng"
        string decision_note "ghi chú của reviewer khi duyệt hoặc từ chối"
        string approved_by FK "người duyệt phiên bản"
        datetime approved_at "thời điểm duyệt"
        datetime created_at "thời điểm tạo phiên bản"
    }
    DOCUMENT_TOPIC {
        string id PK "định danh topic"
        string version_id FK "phiên bản tài liệu gắn topic"
        string name "tên topic"
        string origin "nguồn topic: gợi ý trích xuất hoặc tự thêm"
        string merged_into_id FK "topic đích khi bị gộp, giữ trace merge/split"
        string status "trạng thái: đang dùng hoặc đã gộp"
        datetime created_at "thời điểm gắn topic"
    }
    DERIVED_CONTENT {
        string id PK "định danh tham chiếu nội dung phát sinh"
        string version_id FK "phiên bản nguồn đã dùng để sinh nội dung"
        string content_type "loại nội dung phát sinh: câu hỏi hoặc nội dung khác"
        string external_ref_id "tham chiếu bản ghi ở module consumer, vd question-bank"
        boolean needs_recheck "cờ cần rà soát khi phiên bản nguồn bị thay thế"
        string rechecked_by FK "người rà soát nội dung phát sinh"
        datetime rechecked_at "thời điểm rà soát"
        datetime created_at "thời điểm ghi nhận tham chiếu"
    }
    LIBRARY_AUDIT_EVENT {
        string id PK "định danh sự kiện kiểm toán"
        string source_document_id FK "tài liệu liên quan, rỗng nếu không có"
        string version_id FK "phiên bản liên quan, rỗng nếu không có"
        string actor_id FK "người thực hiện hành động"
        string action "hành động: thêm, tải phiên bản, duyệt, từ chối, thay thế, gắn topic, gộp, tách, chọn nguồn, rà soát, ngừng, khôi phục"
        string detail "chi tiết trước sau và lý do"
        datetime created_at "thời điểm ghi nhận"
    }
    INTAKE_DOCUMENT {
        string id PK "file đã tiếp nhận, thuộc document-intake"
        string file_name "tên file"
    }
    EXTRACTION_RESULT {
        string id PK "kết quả trích xuất đã xác nhận, thuộc document-review"
        string status "trạng thái review của kết quả"
    }
    USERS {
        string id PK "người dùng nội bộ, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| SOURCE_DOCUMENT | Tài liệu nguồn trong thư viện — metadata, chủ sở hữu và con trỏ phiên bản hiệu lực | title, doc_kind, owner_id, current_version_id, status |
| SOURCE_VERSION | Một phiên bản của tài liệu — gắn file intake và text đã xác nhận, có vòng đời duyệt | version_no, intake_document_id, extraction_result_id, status, approved_by |
| DOCUMENT_TOPIC | Topic gắn trên phiên bản đã duyệt — merge/split giữ trace qua `merged_into_id` | name, origin, merged_into_id, status |
| DERIVED_CONTENT | Tham chiếu nội dung phát sinh (câu hỏi...) trỏ đúng phiên bản nguồn — cờ "cần rà soát" khi bản bị thay thế | version_id, content_type, external_ref_id, needs_recheck |
| LIBRARY_AUDIT_EVENT | Vết kiểm toán mọi hành động trên tài liệu/phiên bản | actor_id, action, detail, created_at |
| INTAKE_DOCUMENT | File gốc của phiên bản — tham chiếu từ `document-intake` | id, file_name |
| EXTRACTION_RESULT | Text trích xuất đã xác nhận — tham chiếu từ `document-review` | id, status |
| USERS | Chủ sở hữu/reviewer/người rà soát — tham chiếu từ `org-governance` | id, display_name |

## Notes & Assumptions

- `SOURCE_DOCUMENT.current_version_id` trỏ tối đa một `SOURCE_VERSION`
  có `status = đã duyệt` — bảo đảm "một bản hiệu lực duy nhất"
  (BR-document-library-002); khi duyệt bản mới, con trỏ chuyển và bản cũ
  sang "đã thay thế".
- `SOURCE_VERSION.extraction_result_id` chỉ được điền khi kết quả trích
  xuất đã xác nhận ở `document-review` — điều kiện lên "chờ duyệt"
  (BR-document-library-003).
- `DERIVED_CONTENT.external_ref_id` là tham chiếu logic sang entity của
  `question-bank`/`ai-question-generation` (nội dung phát sinh không
  thuộc feature này); khóa tham chiếu phiên bản tại thời điểm sinh là
  bất biến (BR-document-library-009).
- `DOCUMENT_TOPIC.merged_into_id` giữ vết merge/split: topic bị gộp vẫn
  tồn tại với status "đã gộp" và trỏ topic đích — truy nguyên về phiên
  bản nguồn không đứt (business rule reverse spec `knowledge-and-
  question-bank`).
- `INTAKE_DOCUMENT`, `EXTRACTION_RESULT`, `USERS` là entity ngoài — chỉ
  khai tối thiểu; định nghĩa đầy đủ ở ERD của `document-intake`,
  `document-review` và `org-governance`.
- Retention file gốc và phiên bản cũ chờ OQ-3 (OQ-6 sản phẩm, OQ-KB-02);
  phiên bản đã được `DERIVED_CONTENT` tham chiếu không xóa hẳn.
