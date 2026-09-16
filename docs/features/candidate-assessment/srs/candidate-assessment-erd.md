---
type: srs-erd
feature: candidate-assessment
updated: 2026-09-14
---

# candidate-assessment — Entity Relationship Diagram

> Scope: làm bài đánh giá qua token/tài khoản — snapshot đề bất biến, attempt
> theo giờ server, câu trả lời có server ack, submission idempotent kèm biên
> nhận và thao tác quản trị có lý do. `ASSESSMENT_TEST` và `USER` là tham
> chiếu tối thiểu sang `assessment-authoring` và `org-governance`.

## Diagram

```mermaid
erDiagram
    ASSESSMENT_TEST ||--o{ TEST_SNAPSHOT : "phát hành thành"
    TEST_SNAPSHOT ||--o{ SNAPSHOT_QUESTION : "gồm câu"
    SNAPSHOT_QUESTION ||--o{ SNAPSHOT_OPTION : "gồm lựa chọn"
    ASSESSMENT_TEST ||--o{ ACCESS_TOKEN : "cấp quyền vào"
    ACCESS_TOKEN ||--o{ ATTEMPT : "mở"
    USER ||--o{ ATTEMPT : "làm bài nội bộ"
    TEST_SNAPSHOT ||--o{ ATTEMPT : "được làm trên"
    ATTEMPT ||--o{ ANSWER : "ghi nhận"
    SNAPSHOT_QUESTION ||--o{ ANSWER : "được trả lời"
    ANSWER ||--o{ ANSWER_SELECTION : "chọn"
    SNAPSHOT_OPTION ||--o{ ANSWER_SELECTION : "được chọn trong"
    ATTEMPT ||--o| SUBMISSION : "chốt một lần"
    ACCESS_TOKEN ||--o{ ATTEMPT_ACTION : "chịu thao tác"
    ATTEMPT ||--o{ ATTEMPT_ACTION : "chịu thao tác"
    USER ||--o{ ATTEMPT_ACTION : "thực hiện"

    ASSESSMENT_TEST {
        string test_id PK "mã bài đánh giá, thuộc assessment-authoring"
        string title "tên bài đánh giá"
        string publish_status "trạng thái phát hành: đang mở hoặc đã đóng"
    }
    TEST_SNAPSHOT {
        string snapshot_id PK "mã snapshot đề bất biến"
        string test_id FK "bài đánh giá gốc"
        int duration_minutes "thời lượng làm bài tại thời điểm phát hành"
        int max_attempts "số attempt tối đa được author công bố"
        string result_visibility "phần kết quả được phép hiển thị sau nộp"
        string published_by FK "người phát hành"
        datetime published_at "thời điểm phát hành snapshot"
    }
    SNAPSHOT_QUESTION {
        string snapshot_question_id PK "mã câu hỏi trong snapshot"
        string snapshot_id FK "snapshot chứa câu"
        string content "nội dung câu hỏi tại snapshot, bất biến"
        string question_type "loại câu: trắc nghiệm một đáp án, nhiều đáp án, đúng-sai, tự luận"
        string source_version_id "phiên bản câu nguồn trong question-bank, provenance"
        int display_order "thứ tự câu trong đề"
        int max_length "giới hạn ký tự cho câu tự luận"
    }
    SNAPSHOT_OPTION {
        string option_id PK "mã lựa chọn trong snapshot"
        string snapshot_question_id FK "câu hỏi snapshot chứa lựa chọn"
        string content "nội dung phương án, không chứa cờ đáp án đúng"
        int display_order "thứ tự hiển thị"
    }
    ACCESS_TOKEN {
        string token_id PK "mã token/link truy cập"
        string test_id FK "bài đánh giá token trỏ tới"
        string status "trạng thái: phát-hành, hết-hạn, thu-hồi"
        datetime expires_at "hạn token, giờ server"
        int max_attempts "số attempt tối đa của token"
        string issued_to "định danh người nhận do authoring ghi: email hoặc mã ứng viên"
        string issued_by FK "người cấp token"
        string revoked_reason "lý do thu hồi nếu có"
        datetime created_at "thời điểm cấp token"
    }
    ATTEMPT {
        string attempt_id PK "mã lượt làm bài"
        string token_id FK "token dùng để mở, rỗng với nhân viên nội bộ"
        string user_id FK "tài khoản nhân viên làm bài, rỗng với ứng viên qua token"
        string snapshot_id FK "snapshot đề của attempt, bất biến"
        int attempt_no "lần làm thứ mấy của token/người"
        string status "trạng thái: đang-làm, đã-nộp, hết-giờ, bị-thu-hồi"
        datetime started_at "mốc bắt đầu theo giờ server"
        datetime deadline_at "mốc hết giờ theo giờ server"
        datetime submitted_at "mốc nộp theo giờ server"
    }
    ANSWER {
        string answer_id PK "mã câu trả lời"
        string attempt_id FK "attempt chứa câu trả lời"
        string snapshot_question_id FK "câu hỏi snapshot được trả lời"
        string text_answer "nội dung trả lời tự luận"
        int ack_seq "số thứ tự lần lưu được server xác nhận gần nhất"
        datetime last_ack_at "thời điểm server xác nhận lần lưu cuối"
    }
    ANSWER_SELECTION {
        string answer_id FK "câu trả lời chọn lựa chọn này"
        string option_id FK "lựa chọn snapshot được chọn"
    }
    SUBMISSION {
        string submission_id PK "mã bài nộp, tối đa một mỗi attempt"
        string attempt_id FK "attempt tạo submission"
        string receipt_code "mã biên nhận hiển thị cho người nộp"
        string idempotency_key "khóa chống tạo submission trùng"
        datetime submitted_at "thời điểm nộp theo giờ server"
    }
    ATTEMPT_ACTION {
        string action_id PK "mã thao tác quản trị"
        string attempt_id FK "attempt bị tác động, rỗng khi tác động token"
        string token_id FK "token bị tác động"
        string user_id FK "người thực hiện, HR hoặc admin"
        string action_type "loại thao tác: gia-hạn, thu-hồi, mở-lại"
        string reason "lý do bắt buộc"
        string previous_value "giá trị trước thao tác"
        string new_value "giá trị sau thao tác"
        datetime created_at "thời điểm thao tác"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| ASSESSMENT_TEST | Bài đánh giá đã phát hành — tham chiếu tối thiểu từ `assessment-authoring` | test_id, publish_status |
| TEST_SNAPSHOT | Snapshot đề + cấu hình tại thời điểm phát hành — bất biến trong suốt attempt | duration_minutes, max_attempts, result_visibility, published_at |
| SNAPSHOT_QUESTION | Câu hỏi trong snapshot, giữ provenance về phiên bản câu nguồn | content, question_type, source_version_id, max_length |
| SNAPSHOT_OPTION | Phương án trả lời của câu trong snapshot — không mang cờ đáp án đúng | content, display_order |
| ACCESS_TOKEN | Quyền vào bài của ứng viên: hạn, lượt attempt, trạng thái thu hồi | status, expires_at, max_attempts, issued_to, revoked_reason |
| ATTEMPT | Một lượt làm bài theo giờ server — gắn token (ứng viên) hoặc user (nhân viên) | status, attempt_no, started_at, deadline_at, submitted_at |
| ANSWER | Câu trả lời theo câu hỏi snapshot kèm dấu server ack gần nhất | text_answer, ack_seq, last_ack_at |
| ANSWER_SELECTION | Lựa chọn được chọn của câu trắc nghiệm (hỗ trợ câu nhiều đáp án) | answer_id, option_id |
| SUBMISSION | Bài nộp đã chốt — tối đa một mỗi attempt, kèm biên nhận và khóa idempotent | receipt_code, idempotency_key, submitted_at |
| ATTEMPT_ACTION | Vết thao tác quản trị (gia hạn/thu hồi/mở lại) có lý do và giá trị trước/sau | action_type, reason, actor_id, previous_value, new_value |
| USER | Người dùng nội bộ (nhân viên làm bài, HR thao tác) — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `ATTEMPT` có hai đường định danh: `token_id` cho ứng viên qua link,
  `user_id` cho nhân viên nội bộ — đúng một trong hai được điền theo loại
  attempt (URD UN-011).
- `SNAPSHOT_OPTION` cố ý không có cờ đáp án đúng: surface người làm bài là
  whitelist không đáp án (BR-candidate-assessment-005, vá GAP-AS-06). Đáp án
  đúng nằm ở `question-bank` và chỉ đi qua đường chấm của `assessment-grading`.
- `SNAPSHOT_QUESTION.source_version_id` là chốt provenance về
  `QUESTION_VERSION` của `question-bank` — quan hệ vật lý nằm ngoài scope ERD
  này, không vẽ lại entity `question-bank`.
- `ATTEMPT ||--o| SUBMISSION` thể hiện contract idempotent: một attempt có tối
  đa một submission; `idempotency_key` chống tạo trùng khi submit lặp.
- `ATTEMPT_ACTION` là vết nghiệp vụ cho gia hạn/thu hồi/mở lại theo contract
  "có lý do + audit" của PRD Mục 7.22; audit log toàn hệ thống thuộc
  `org-governance`, không trùng lặp ở đây.
- `ACCESS_TOKEN` do `assessment-authoring` phát hành; feature này thực thi
  vòng đời (hết hạn/thu hồi/gia hạn) — ghi đầy đủ vì các ràng buộc expiry là
  trách nhiệm kiểm soát của feature này.
