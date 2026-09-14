---
type: srs-erd
feature: question-bank
updated: 2026-09-14
---

# question-bank — Entity Relationship Diagram

> Scope: ngân hàng câu hỏi của một tổ chức — câu hỏi, phiên bản, lựa chọn,
> phân loại kỹ năng/topic, quyết định review, job import và đánh dấu yêu thích.
> `SKILL`, `TOPIC`, `USER`, `SOURCE_DOCUMENT` là tham chiếu sang feature khác
> (`talent-framework`, `org-governance`, `document-library`).

## Diagram

```mermaid
erDiagram
    USER ||--o{ QUESTION : "soạn"
    USER ||--o{ REVIEW_DECISION : "ra quyết định"
    USER ||--o{ IMPORT_JOB : "tải file"
    USER ||--o{ FAVORITE_QUESTION : "đánh dấu"
    SOURCE_DOCUMENT ||--o{ QUESTION : "là nguồn sinh câu"
    QUESTION ||--o{ QUESTION_VERSION : "có nhiều phiên bản"
    QUESTION }o--o| QUESTION_VERSION : "phiên bản hiệu lực"
    QUESTION_VERSION ||--o{ QUESTION_OPTION : "gồm lựa chọn"
    QUESTION_VERSION ||--o{ REVIEW_DECISION : "được review"
    QUESTION ||--o{ QUESTION_SKILL : "gán kỹ năng"
    SKILL ||--o{ QUESTION_SKILL : "được gán cho"
    QUESTION ||--o{ QUESTION_TOPIC : "gán topic"
    TOPIC ||--o{ QUESTION_TOPIC : "được gán cho"
    IMPORT_JOB ||--o{ IMPORT_ROW : "xử lý từng dòng"
    IMPORT_ROW }o--o| QUESTION : "tạo thành"
    QUESTION ||--o{ FAVORITE_QUESTION : "được đánh dấu"

    QUESTION {
        string question_id PK "mã câu hỏi"
        string organization_id FK "tổ chức sở hữu câu hỏi"
        string question_type "loại câu: trắc nghiệm một đáp án, nhiều đáp án, đúng-sai, tự luận"
        string status "trạng thái vòng đời: bản nháp, chờ review, đã duyệt, ngừng dùng"
        string level "trình độ mục tiêu theo khung chung"
        string source_type "nguồn tạo: soạn thủ công, import, sinh bởi AI"
        string source_document_id FK "tài liệu nguồn nếu câu sinh từ tài liệu"
        string current_version_id FK "phiên bản đang hiệu lực của câu"
        string created_by FK "người tạo câu hỏi"
        string retired_reason "lý do ngừng dùng"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    QUESTION_VERSION {
        string version_id PK "mã phiên bản câu hỏi"
        string question_id FK "câu hỏi gốc"
        int version_no "số thứ tự phiên bản"
        string content "nội dung câu hỏi tại phiên bản"
        string explanation "giải thích đáp án, dữ liệu hạn chế theo quyền"
        string scoring_guide "hướng dẫn chấm cho câu tự luận"
        string review_status "trạng thái duyệt của phiên bản"
        datetime created_at "thời điểm tạo phiên bản"
    }
    QUESTION_OPTION {
        string option_id PK "mã lựa chọn"
        string version_id FK "phiên bản câu chứa lựa chọn"
        string content "nội dung phương án trả lời"
        boolean is_correct "cờ đáp án đúng, dữ liệu hạn chế theo quyền"
        int display_order "thứ tự hiển thị trong câu"
    }
    REVIEW_DECISION {
        string review_id PK "mã quyết định review"
        string question_id FK "câu được review"
        string version_id FK "phiên bản được review"
        string reviewer_id FK "người ra quyết định"
        string decision "quyết định: duyệt hoặc yêu cầu chỉnh"
        string note "ghi chú của người duyệt"
        datetime decided_at "thời điểm quyết định"
    }
    SKILL {
        string skill_id PK "mã kỹ năng, thuộc talent-framework"
        string name "tên kỹ năng"
    }
    TOPIC {
        string topic_id PK "mã topic phân loại"
        string name "tên topic"
    }
    QUESTION_SKILL {
        string question_id FK "câu hỏi được gán"
        string skill_id FK "kỹ năng được gán"
    }
    QUESTION_TOPIC {
        string question_id FK "câu hỏi được gán"
        string topic_id FK "topic được gán"
    }
    IMPORT_JOB {
        string job_id PK "mã job import"
        string file_name "tên file đã tải lên"
        string status "trạng thái job: đang xử lý, hoàn tất, lỗi"
        int total_rows "tổng số dòng trong file"
        int success_rows "số dòng tạo câu thành công"
        int error_rows "số dòng lỗi"
        string created_by FK "người tải file"
        datetime started_at "thời điểm bắt đầu xử lý"
        datetime finished_at "thời điểm kết thúc xử lý"
    }
    IMPORT_ROW {
        string row_id PK "mã dòng import"
        string job_id FK "job chứa dòng này"
        int row_no "số thứ tự dòng trong file"
        string status "kết quả dòng: thành công hoặc lỗi"
        string error_message "lý do lỗi nếu dòng thất bại"
        string question_id FK "câu được tạo nếu dòng thành công"
    }
    FAVORITE_QUESTION {
        string user_id FK "người đánh dấu yêu thích"
        string question_id FK "câu được đánh dấu"
        datetime created_at "thời điểm đánh dấu"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
    SOURCE_DOCUMENT {
        string document_id PK "mã tài liệu nguồn, thuộc document-library"
        string title "tên tài liệu nguồn"
        string version "phiên bản tài liệu đã duyệt mà câu trỏ tới"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| QUESTION | Câu hỏi trong kho của tổ chức — định danh, phân loại, trạng thái vòng đời và provenance | question_type, status, level, source_type, source_document_id, current_version_id |
| QUESTION_VERSION | Snapshot nội dung/đáp án của một phiên bản — bất biến sau khi bài phát hành tham chiếu | version_no, content, explanation, scoring_guide, review_status |
| QUESTION_OPTION | Phương án trả lời của câu trắc nghiệm, thuộc một phiên bản; cờ đáp án đúng là dữ liệu hạn chế | content, is_correct, display_order |
| REVIEW_DECISION | Bản ghi quyết định duyệt/yêu cầu chỉnh của reviewer trên một phiên bản | decision, note, reviewer_id, decided_at |
| SKILL | Kỹ năng trong taxonomy chung — tham chiếu từ `talent-framework`, không sở hữu ở đây | skill_id, name |
| TOPIC | Topic phân loại câu hỏi của tổ chức | topic_id, name |
| QUESTION_SKILL | Gán nhiều-nhiều câu hỏi ↔ kỹ năng | question_id, skill_id |
| QUESTION_TOPIC | Gán nhiều-nhiều câu hỏi ↔ topic (tối đa 10 topic mỗi câu) | question_id, topic_id |
| IMPORT_JOB | Một lần import file mẫu — trạng thái job và đếm kết quả | file_name, status, total_rows, success_rows, error_rows |
| IMPORT_ROW | Kết quả xử lý từng dòng của job — lỗi không chặn dòng hợp lệ | row_no, status, error_message, question_id |
| FAVORITE_QUESTION | Đánh dấu câu yêu thích/thường dùng của từng người | user_id, question_id |
| USER | Người dùng nội bộ — tham chiếu từ `org-governance` | user_id, display_name |
| SOURCE_DOCUMENT | Tài liệu nguồn mà câu AI sinh trỏ tới — tham chiếu từ `document-library`, giữ đúng phiên bản đã duyệt | document_id, title, version |

## Notes & Assumptions

- `QUESTION.status` là vòng đời nghiệp vụ (bản nháp → chờ review → đã duyệt →
  ngừng dùng); `QUESTION_VERSION.review_status` theo dõi duyệt của từng phiên
  bản vì sửa lớn tạo phiên bản mới chờ review trong khi bản cũ vẫn hiệu lực.
- Đáp án đúng nằm ở `QUESTION_OPTION.is_correct` và `QUESTION_VERSION.
  explanation`/`scoring_guide` — đây là vùng dữ liệu hạn chế, chỉ lộ cho vai
  trò được cấp (BR-question-bank-005).
- `SOURCE_DOCUMENT.version` là chốt provenance theo R-11: câu sinh từ AI trỏ
  đúng phiên bản tài liệu đã duyệt tại thời điểm duyệt câu; khi tài liệu có
  bản mới, hành vi "cần rà soát" chờ OQ-4 của spec.
- `IMPORT_ROW.question_id` rỗng khi dòng lỗi; dòng lỗi không tạo câu.
- Bài đánh giá (`assessment-authoring`) tham chiếu `QUESTION_VERSION` qua
  snapshot riêng của nó — quan hệ đó nằm trong ERD của `assessment-authoring`,
  không vẽ lại ở đây.
