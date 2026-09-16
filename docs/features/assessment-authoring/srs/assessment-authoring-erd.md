---
type: srs-erd
feature: assessment-authoring
updated: 2026-09-14
---

# assessment-authoring — Entity Relationship Diagram

> Scope: bài đánh giá của một tổ chức — cấu hình, câu trong đề (snapshot
> theo phiên bản câu), link phát hành và vòng đời. `QUESTION`,
> `QUESTION_VERSION`, `ASSESSMENT_TEMPLATE`, `POSITION`, `USER` là tham
> chiếu sang feature khác (`question-bank`, `assessment-templates`,
> `recruitment-planning`, `org-governance`).

## Diagram

```mermaid
erDiagram
    USER ||--o{ ASSESSMENT : "soạn"
    USER ||--o{ ASSESSMENT_LINK : "tạo link"
    ASSESSMENT_TEMPLATE ||--o{ ASSESSMENT : "điền sẵn cấu hình"
    POSITION ||--o{ ASSESSMENT : "làm mục tiêu"
    ASSESSMENT ||--o{ ASSESSMENT : "nhân bản từ"
    ASSESSMENT ||--o{ ASSESSMENT_QUESTION : "gồm câu"
    QUESTION ||--o{ ASSESSMENT_QUESTION : "được chọn vào"
    QUESTION_VERSION ||--o{ ASSESSMENT_QUESTION : "được snapshot qua"
    ASSESSMENT ||--o{ ASSESSMENT_LINK : "phát hành qua"

    ASSESSMENT {
        string assessment_id PK "mã bài đánh giá"
        string organization_id FK "tổ chức sở hữu bài"
        string template_id FK "mẫu đã áp, rỗng nếu tạo từ đầu"
        string position_id FK "vị trí hoặc JD mục tiêu của bài"
        string source_assessment_id FK "bài gốc nếu được nhân bản"
        string name "tên bài đánh giá"
        string description "mô tả bài"
        string instructions "hướng dẫn làm bài cho người làm"
        string target_level "trình độ mục tiêu: intern, fresher, junior, mid, senior, lead"
        string audience "đối tượng làm bài: ứng viên hoặc nhân viên"
        int duration_minutes "thời lượng làm bài tính bằng phút"
        string scoring_rule "quy tắc chấm: thang điểm, điểm đạt và mô tả"
        string result_visibility "chính sách xem kết quả: chỉ biên nhận, điểm tổng, điểm và nhận xét"
        string status "vòng đời: bản nháp, đã phát hành, đã đóng"
        string created_by FK "người tạo bài"
        string published_by FK "người phát hành bài"
        datetime published_at "thời điểm phát hành"
        datetime closed_at "thời điểm đóng bài"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    ASSESSMENT_QUESTION {
        string assessment_id FK, PK "bài chứa câu"
        string question_id FK, PK "câu được chọn vào đề"
        string question_version_id FK "phiên bản câu chốt tại thời điểm phát hành"
        decimal points "điểm của câu trong đề"
        int display_order "thứ tự câu trong đề"
    }
    ASSESSMENT_LINK {
        string link_id PK "mã link phát hành"
        string assessment_id FK "bài được phát hành"
        string token "token truy cập duy nhất của link"
        string status "trạng thái: hoạt động, hết hạn, thu hồi"
        datetime expires_at "hạn dùng link, tối đa 90 ngày"
        int max_attempts "giới hạn lượt làm trên link"
        string audience_note "ghi chú đợt hoặc đối tượng của link"
        string created_by FK "người tạo link"
        string revoked_by FK "người thu hồi link"
        string revoke_reason "lý do thu hồi, bắt buộc khi thu hồi"
        datetime created_at "thời điểm tạo link"
        datetime revoked_at "thời điểm thu hồi"
    }
    QUESTION {
        string question_id PK "mã câu hỏi, thuộc question-bank"
        string status "trạng thái vòng đời câu hỏi"
    }
    QUESTION_VERSION {
        string version_id PK "mã phiên bản câu, thuộc question-bank"
        string question_id FK "câu hỏi gốc"
        string review_status "trạng thái duyệt của phiên bản"
    }
    ASSESSMENT_TEMPLATE {
        string template_id PK "mã mẫu, thuộc assessment-templates"
        string name "tên mẫu"
        string status "trạng thái mẫu: chỉ mẫu đã công bố được áp"
    }
    POSITION {
        string position_id PK "mã vị trí, thuộc recruitment-planning"
        string title "tên vị trí"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| ASSESSMENT | Bài đánh giá của tổ chức — cấu hình nghiệp vụ, chính sách hiển thị kết quả và vòng đời phát hành | name, target_level, audience, duration_minutes, scoring_rule, result_visibility, status, template_id, position_id |
| ASSESSMENT_QUESTION | Câu trong đề — tham chiếu câu + phiên bản chốt tại phát hành, điểm và thứ tự | question_id, question_version_id, points, display_order |
| ASSESSMENT_LINK | Link/token phát hành một bài — hạn, giới hạn lượt, trạng thái và lý do thu hồi | token, status, expires_at, max_attempts, revoke_reason |
| QUESTION | Câu hỏi trong ngân hàng — tham chiếu từ `question-bank`, chỉ "Đã duyệt" được chọn | question_id, status |
| QUESTION_VERSION | Phiên bản câu được chốt vào đề — tham chiếu từ `question-bank`, bất biến sau phát hành | version_id, question_id, review_status |
| ASSESSMENT_TEMPLATE | Mẫu cấu hình tái sử dụng — tham chiếu từ `assessment-templates`, chỉ mẫu "Đã công bố" được áp | template_id, name, status |
| POSITION | Vị trí/JD mục tiêu của bài — tham chiếu từ `recruitment-planning` | position_id, title |
| USER | Người dùng nội bộ (author/admin) — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `ASSESSMENT.status` là vòng đời nghiệp vụ (bản nháp → đã phát hành → đã
  đóng). Bài "Đã phát hành" chỉ sửa được field không ảnh hưởng đề; đổi đề
  tạo bài mới qua quan hệ tự tham chiếu `source_assessment_id` (nhân bản).
- `ASSESSMENT_QUESTION.question_version_id` là chốt snapshot theo PRD Mục
  7.22: tại thời điểm phát hành, mỗi câu trong đề trỏ đúng
  `QUESTION_VERSION` hiệu lực — phiên bản đó bất biến nên đề không bị sửa
  ngầm khi đã có người làm. Trong lúc nháp, cột này trỏ phiên bản được
  chọn và có thể cập nhật khi câu có bản mới (cảnh báo FR-004).
- Khóa chính của `ASSESSMENT_QUESTION` là cặp (assessment_id, question_id):
  một câu chỉ xuất hiện một lần trong một đề; cùng câu ở phiên bản khác
  vẫn là cùng `question_id`.
- `ASSESSMENT_LINK.token` duy nhất trên toàn hệ thống; `expires_at` và
  `max_attempts` bắt buộc theo BR-004 (giải OQ-AS-01 của reverse spec).
  Attempt và enforcement (timer, autosave, submit) thuộc
  `candidate-assessment` — ERD này chỉ khai báo chính sách link mà bên đó
  đối chiếu.
- `result_visibility` và `scoring_rule` là chính sách author công bố theo
  PRD Mục 7.22; `assessment-grading`/`candidate-assessment` thực thi việc
  hiển thị kết quả dựa trên chính sách này.
- `ASSESSMENT_TEMPLATE`, `QUESTION`, `QUESTION_VERSION`, `POSITION`,
  `USER` là entity tối thiểu tham chiếu chéo — bản đầy đủ thuộc ERD của
  `assessment-templates`, `question-bank`, `recruitment-planning` và
  `org-governance`; không sao chép cấu trúc.
- Quan hệ tự tham chiếu `ASSESSMENT ||--o{ ASSESSMENT : "nhân bản từ"`
  biểu diễn bài được tạo bằng nhân bản — mỗi bài phát hành là bản ghi độc
  lập (đề xuất OQ-7 của spec: không cần versioning hiển thị trong v1).
