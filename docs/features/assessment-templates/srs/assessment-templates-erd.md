---
type: srs-erd
feature: assessment-templates
updated: 2026-09-14
---

# assessment-templates — Entity Relationship Diagram

> Scope: mẫu cấu hình bài đánh giá tái sử dụng và review công bố mẫu chung
> của một tổ chức. `ASSESSMENT` thuộc `assessment-authoring` (ghi
> `template_id` khi tạo bài từ mẫu), `POSITION` thuộc
> `recruitment-planning`, `USER` thuộc `org-governance` — đều là tham
> chiếu tối thiểu, không sao chép cấu trúc.

## Diagram

```mermaid
erDiagram
    USER ||--o{ ASSESSMENT_TEMPLATE : "tạo"
    USER ||--o{ TEMPLATE_REVIEW : "ra quyết định"
    ASSESSMENT_TEMPLATE ||--o{ TEMPLATE_REVIEW : "được review qua"
    POSITION |o--o{ ASSESSMENT_TEMPLATE : "áp dụng cho"
    ASSESSMENT_TEMPLATE |o--o{ ASSESSMENT : "sinh ra"

    ASSESSMENT_TEMPLATE {
        string template_id PK "mã mẫu"
        string organization_id FK "tổ chức sở hữu mẫu"
        string name "tên mẫu, duy nhất trong cùng phạm vi"
        string scope "phạm vi: chung hoặc cá nhân"
        string status "vòng đời: bản nháp, chờ review, đã công bố, ngừng dùng"
        string description "mô tả mẫu"
        string position_id FK "vị trí áp dụng, để trống nghĩa là mọi vị trí"
        string level "trình độ mục tiêu"
        string audience "đối tượng làm bài: ứng viên hoặc nhân viên"
        int question_count "số câu hỏi của bài"
        int duration_minutes "thời lượng làm bài theo phút"
        decimal max_score "thang điểm tổng"
        decimal passing_score "điểm đạt"
        string scoring_description "mô tả quy tắc chấm"
        string jd_description "mô tả JD kèm theo"
        string test_instructions "hướng dẫn bài test kèm theo"
        string retired_reason "lý do ngừng dùng, bắt buộc khi ngừng"
        int usage_count "số bài đã tạo từ mẫu, đếm gộp để hiển thị"
        string created_by FK "người tạo mẫu, owner của mẫu cá nhân"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật gần nhất"
    }
    TEMPLATE_REVIEW {
        string review_id PK "mã lần review"
        string template_id FK "mẫu được review"
        string decision "quyết định: công bố hoặc yêu cầu chỉnh"
        string notes "ghi chú của reviewer"
        string reviewer_id FK "admin hoặc business owner được chỉ định"
        datetime decided_at "thời điểm quyết định"
    }
    ASSESSMENT {
        string assessment_id PK "mã bài đánh giá, thuộc assessment-authoring"
        string template_id FK "mẫu đã dùng để tạo bài, giữ để truy vết"
        string title "tên bài đánh giá"
        string status "trạng thái vòng đời bài"
    }
    POSITION {
        string position_id PK "mã vị trí, thuộc recruitment-planning"
        string name "tên vị trí"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| ASSESSMENT_TEMPLATE | Mẫu cấu hình khung của bài đánh giá — vị trí, trình độ, đối tượng, số câu, thời lượng, quy tắc chấm; phạm vi chung/cá nhân và vòng đời có review | name, scope, status, position_id, level, audience, question_count, duration_minutes, max_score, passing_score |
| TEMPLATE_REVIEW | Quyết định review trên một lần gửi duyệt mẫu chung — công bố hoặc yêu cầu chỉnh, kèm reviewer và ghi chú | decision, notes, reviewer_id, decided_at |
| ASSESSMENT | Bài đánh giá được tạo từ mẫu — tham chiếu từ `assessment-authoring`; `template_id` trên bài giữ liên kết truy vết, không phải liên kết sống | assessment_id, template_id, title, status |
| POSITION | Vị trí áp dụng của mẫu — tham chiếu từ `recruitment-planning`; để trống nghĩa là mọi vị trí | position_id, name |
| USER | Người dùng nội bộ — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `ASSESSMENT_TEMPLATE.scope` phân biệt hai vòng đời: mẫu "cá nhân" lưu
  thẳng lên "đã công bố" trong phạm vi riêng (FR-006), mẫu "chung" bắt
  buộc qua "chờ review" và `TEMPLATE_REVIEW` trước khi công bố (BR-002).
- Áp mẫu là bản sao độc lập (BR-003): `ASSESSMENT.template_id` chỉ giữ
  để truy vết bài-sinh-từ-mẫu (khoanh vùng khi mẫu lỗi) và tính
  `usage_count` — sửa/ngừng/xóa mẫu không làm đổi bài đã tạo.
- `status` "bản nháp" chỉ áp dụng cho mẫu chung chưa gửi duyệt; "sửa lớn"
  trên mẫu chung đã công bố đưa bản sửa về "chờ review" trong khi bản đã
  công bố vẫn hiệu lực (BR-004) — cơ chế giữ hai trạng thái hiệu lực này
  nằm ở tầng ứng dụng (đề xuất OQ-4), không cần entity phiên bản trong
  v1 (version mẫu là OOS/P2).
- `TEMPLATE_REVIEW` ghi một dòng mỗi quyết định trên một lần gửi duyệt —
  mẫu bị yêu cầu chỉnh rồi gửi lại sinh dòng mới, giữ vết đầy đủ (USC-002).
- `max_score`/`passing_score` là 2 field có cấu trúc tối thiểu của quy
  tắc chấm để `assessment-grading` đọc được (đề xuất OQ-10); phần còn lại
  nằm trong `scoring_description` dạng tự do.
- `usage_count` là đếm gộp phục vụ hiển thị "lượt dùng" (FR-015); nguồn
  chân thật vẫn là các dòng `ASSESSMENT.template_id`.
- `ASSESSMENT`, `POSITION`, `USER` là entity tối thiểu tham chiếu chéo —
  bản đầy đủ thuộc ERD của `assessment-authoring`, `recruitment-planning`
  và `org-governance`; không sao chép cấu trúc.
