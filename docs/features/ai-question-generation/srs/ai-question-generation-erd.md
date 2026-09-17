---
type: srs-erd
feature: ai-question-generation
updated: 2026-09-14
---

# ai-question-generation — Entity Relationship Diagram

> Scope: job sinh câu hỏi bằng AI từ tài liệu đã duyệt và staging câu nháp
> chờ review của một tổ chức. `SOURCE_DOCUMENT`, `DOCUMENT_TOPIC` thuộc
> `document-library`; `SKILL` thuộc `talent-framework`; `TOPIC`, `QUESTION`
> thuộc `question-bank`; `USER` thuộc `org-governance` — đều là tham chiếu
> tối thiểu, không sao chép cấu trúc.

## Diagram

```mermaid
erDiagram
    USER ||--o{ GENERATION_JOB : "tạo"
    USER ||--o{ GENERATED_QUESTION : "review"
    SOURCE_DOCUMENT ||--o{ GENERATION_JOB : "là nguồn sinh"
    GENERATION_JOB ||--o{ JOB_TOPIC : "giới hạn phạm vi"
    DOCUMENT_TOPIC ||--o{ JOB_TOPIC : "được chọn"
    GENERATION_JOB ||--o{ GENERATED_QUESTION : "sinh ra"
    GENERATED_QUESTION ||--o{ GENERATED_OPTION : "gồm lựa chọn"
    SKILL ||--o{ GENERATED_QUESTION : "gán đề xuất"
    TOPIC ||--o{ GENERATED_QUESTION : "gán đề xuất"
    QUESTION ||--o| GENERATED_QUESTION : "được tạo từ"

    GENERATION_JOB {
        string job_id PK "mã job sinh câu"
        string organization_id FK "tổ chức sở hữu job"
        string source_document_id FK "tài liệu nguồn đã duyệt"
        string document_version "phiên bản tài liệu chốt tại đăng ký job"
        string scope_mode "phạm vi sinh: theo topic đã chọn hoặc toàn văn"
        string question_type "loại câu mục tiêu"
        int target_count "số câu mục tiêu, từ 1 đến 50"
        string level "trình độ mục tiêu của câu sinh"
        string skill_id FK "kỹ năng gán sẵn cho câu sinh"
        string status "vòng đời: đăng ký, đang chạy, hoàn tất, lỗi, thất bại, hủy"
        int retry_count "số lần retry đã dùng, tối đa 3"
        string error_message "lý do lỗi gần nhất"
        string created_by FK "người tạo job"
        datetime created_at "thời điểm đăng ký"
        datetime started_at "thời điểm bắt đầu chạy"
        datetime finished_at "thời điểm kết thúc"
    }
    JOB_TOPIC {
        string job_id FK, PK "job được giới hạn phạm vi"
        string document_topic_id FK, PK "topic tài liệu được chọn làm phạm vi"
    }
    GENERATED_QUESTION {
        string generated_question_id PK "mã câu sinh trong staging"
        string job_id FK "job đã sinh câu này"
        string question_type "loại câu sinh ra"
        string content "nội dung câu nháp"
        string explanation "giải thích đáp án, dữ liệu hạn chế theo quyền"
        string scoring_guide "hướng dẫn chấm nếu câu tự luận"
        string source_excerpt "đoạn trích evidence từ tài liệu nguồn"
        string source_location "vị trí đoạn trích trong tài liệu"
        boolean has_evidence "cờ có đoạn trích nguồn hay không"
        string level "trình độ đề xuất"
        string skill_id FK "kỹ năng đề xuất gán cho câu"
        string topic_id FK "topic phân loại đề xuất"
        string status "trạng thái: chờ review, đã duyệt đưa bank, bị loại"
        boolean edited "cờ đã được reviewer chỉnh sửa trước duyệt"
        string reviewed_by FK "người ra quyết định ở staging"
        string reject_reason "lý do loại, bắt buộc khi loại"
        string question_id FK "câu trong ngân hàng được tạo khi duyệt"
        datetime created_at "thời điểm sinh"
        datetime reviewed_at "thời điểm quyết định staging"
    }
    GENERATED_OPTION {
        string option_id PK "mã lựa chọn của câu sinh"
        string generated_question_id FK "câu sinh chứa lựa chọn"
        string content "nội dung phương án"
        boolean is_correct "đáp án đúng do AI đề xuất, dữ liệu hạn chế"
        int display_order "thứ tự hiển thị"
    }
    SOURCE_DOCUMENT {
        string document_id PK "mã tài liệu nguồn, thuộc document-library"
        string title "tên tài liệu"
        string version "phiên bản tài liệu đã duyệt"
    }
    DOCUMENT_TOPIC {
        string topic_id PK "mã topic trích xuất từ tài liệu, thuộc document-library"
        string document_id FK "tài liệu chứa topic"
        string name "tên topic"
    }
    SKILL {
        string skill_id PK "mã kỹ năng, thuộc talent-framework"
        string name "tên kỹ năng"
    }
    TOPIC {
        string topic_id PK "mã topic phân loại câu hỏi, thuộc question-bank"
        string name "tên topic"
    }
    QUESTION {
        string question_id PK "mã câu hỏi trong ngân hàng, thuộc question-bank"
        string status "trạng thái vòng đời câu hỏi"
        string source_type "nguồn tạo, câu từ feature này mang nguồn sinh bởi AI"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| GENERATION_JOB | Một lần chạy sinh câu từ tài liệu — cấu hình, phiên bản nguồn chốt, trạng thái và retry | source_document_id, document_version, scope_mode, question_type, target_count, status, retry_count |
| JOB_TOPIC | Phạm vi topic tài liệu được chọn cho job (nhiều-nhiều) | job_id, document_topic_id |
| GENERATED_QUESTION | Câu nháp AI trong staging — nội dung, evidence đoạn trích, phân loại đề xuất, quyết định review | content, source_excerpt, has_evidence, status, edited, reject_reason, question_id |
| GENERATED_OPTION | Lựa chọn của câu trắc nghiệm sinh ra — đáp án đúng là đề xuất của AI, hạn chế theo quyền | content, is_correct, display_order |
| SOURCE_DOCUMENT | Tài liệu nguồn đã duyệt — tham chiếu từ `document-library`, chốt phiên bản vào job | document_id, title, version |
| DOCUMENT_TOPIC | Topic trích xuất từ tài liệu — tham chiếu từ `document-library`, là phạm vi sinh | topic_id, document_id, name |
| SKILL | Kỹ năng trong taxonomy chung — tham chiếu từ `talent-framework` | skill_id, name |
| TOPIC | Topic phân loại câu hỏi của bank — tham chiếu từ `question-bank` | topic_id, name |
| QUESTION | Câu trong ngân hàng được tạo khi staging duyệt — tham chiếu từ `question-bank`, vào ở "Chờ review" | question_id, status, source_type |
| USER | Người dùng nội bộ — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `GENERATION_JOB.document_version` là chốt provenance theo R-11: job luôn
  sinh trên đúng phiên bản tài liệu đã duyệt tại thời điểm đăng ký; khi
  tài liệu có bản mới, câu trỏ bản cũ được cờ "cần rà soát" (FR-013) thay
  vì tự đồng bộ.
- `JOB_TOPIC` là junction nhiều-nhiều giữa job và `DOCUMENT_TOPIC` (topic
  trích xuất từ tài liệu — khác với `TOPIC` phân loại của ngân hàng); khi
  `scope_mode` là "toàn văn" thì không có dòng nào.
- `GENERATED_QUESTION.status` chỉ quản vòng đời staging (chờ review → đã
  duyệt đưa bank / bị loại). "Đã duyệt đưa bank" tạo `QUESTION` ở "Chờ
  review" trong `question-bank` — bank review là cổng duy nhất tạo câu
  "Đã duyệt" (BR-004, đề xuất OQ-1).
- `GENERATED_QUESTION.question_id` rỗng tới khi câu được duyệt; khi có giá
  trị nó là liên kết provenance từ câu bank về câu sinh gốc (NFR-002).
- `has_evidence` = false khi provider không trả được đoạn trích — câu vẫn
  vào staging nhưng reviewer được khuyến nghị loại hoặc gán đoạn trích
  (đề xuất OQ-4).
- `GENERATED_OPTION.is_correct` và `GENERATED_QUESTION.explanation`/
  `scoring_guide` là đáp án do AI đề xuất — vùng dữ liệu hạn chế, chỉ lộ
  cho vai trò được cấp như đáp án trong `question-bank`.
- `SOURCE_DOCUMENT`, `DOCUMENT_TOPIC`, `SKILL`, `TOPIC`, `QUESTION`,
  `USER` là entity tối thiểu tham chiếu chéo — bản đầy đủ thuộc ERD của
  `document-library`, `talent-framework`, `question-bank` và
  `org-governance`; không sao chép cấu trúc.
