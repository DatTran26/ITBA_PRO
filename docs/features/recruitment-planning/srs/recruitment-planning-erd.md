---
type: srs-erd
feature: recruitment-planning
updated: 2026-09-14
---

# recruitment-planning — Entity Relationship Diagram

> Scope: dữ liệu nhu cầu tuyển dụng — recruitment request, vị trí đã duyệt,
> quyết định phê duyệt và sự kiện kiểm toán. `USER` và `ORG_UNIT` là tham
> chiếu sang `org-governance`; `JOB_APPLICATION` là tham chiếu tối thiểu
> sang `candidate-pipeline` để đếm headcount.

## Diagram

```mermaid
erDiagram
    USER ||--o{ RECRUITMENT_REQUEST : "đề xuất"
    USER ||--o{ POSITION : "phụ trách"
    USER ||--o{ APPROVAL_DECISION : "ra quyết định"
    USER ||--o{ RECRUITMENT_AUDIT_EVENT : "thực hiện"
    ORG_UNIT ||--o{ RECRUITMENT_REQUEST : "thuộc đơn vị"
    ORG_UNIT ||--o{ POSITION : "thuộc đơn vị"
    RECRUITMENT_REQUEST ||--o{ APPROVAL_DECISION : "được duyệt"
    RECRUITMENT_REQUEST ||--o| POSITION : "tạo thành"
    RECRUITMENT_REQUEST ||--o{ RECRUITMENT_AUDIT_EVENT : "ghi nhận"
    POSITION ||--o{ RECRUITMENT_AUDIT_EVENT : "ghi nhận"
    POSITION ||--o{ JOB_APPLICATION : "nhận ứng viên"

    RECRUITMENT_REQUEST {
        string request_id PK "mã đề xuất tuyển dụng"
        string organization_id FK "tổ chức sở hữu request"
        string org_unit_id FK "đơn vị có nhu cầu"
        string title "tên vị trí dự kiến"
        string reason "lý do tuyển"
        int headcount "số lượng cần tuyển, nguyên 1-50"
        date needed_by "thời điểm cần người, tùy chọn"
        string priority "mức ưu tiên: thấp, trung bình, cao, gấp"
        string jd_description "mô tả JD đã chuẩn hóa"
        string jd_requirements "yêu cầu JD đã chuẩn hóa"
        string owner_id FK "HR owner phụ trách vị trí"
        string status "trạng thái: nháp, chờ duyệt, yêu cầu chỉnh, đã duyệt, từ chối, đã hủy"
        string cancel_reason "lý do hủy nếu có"
        string requested_by FK "người đề xuất"
        datetime submitted_at "thời điểm gửi duyệt gần nhất"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    POSITION {
        string position_id PK "mã vị trí tuyển dụng"
        string organization_id FK "tổ chức sở hữu vị trí"
        string request_id FK "request đã duyệt tạo vị trí này"
        string org_unit_id FK "đơn vị của vị trí"
        string title "tên vị trí"
        string jd_description "mô tả JD tại thời điểm duyệt, điều chỉnh có audit"
        string jd_requirements "yêu cầu JD, điều chỉnh có audit"
        int headcount_total "số lượng cần tuyển"
        int headcount_filled "số đã chốt tuyển theo pipeline"
        string owner_id FK "HR owner phụ trách"
        string status "trạng thái: đang mở, tạm dừng, đã đóng"
        string close_reason "lý do tạm dừng hoặc đóng gần nhất"
        datetime opened_at "thời điểm mở vị trí"
        datetime closed_at "thời điểm đóng vị trí"
    }
    APPROVAL_DECISION {
        string decision_id PK "mã quyết định"
        string request_id FK "request được quyết định"
        string approver_id FK "người có thẩm quyền quyết định"
        string decision "quyết định: duyệt, từ chối, yêu cầu chỉnh"
        string note "ghi chú, bắt buộc khi từ chối hoặc yêu cầu chỉnh"
        int round "vòng duyệt thứ mấy của request"
        datetime decided_at "thời điểm quyết định"
    }
    RECRUITMENT_AUDIT_EVENT {
        string event_id PK "mã sự kiện kiểm toán"
        string request_id FK "request liên quan, nếu có"
        string position_id FK "vị trí liên quan, nếu có"
        string actor_id FK "người thực hiện"
        string action "hành động: tạo, sửa, gửi duyệt, rút về, hủy, quyết định, mở, tạm dừng, mở lại, đóng, điều chỉnh"
        string before_value "giá trị trước khi thay đổi"
        string after_value "giá trị sau khi thay đổi"
        string detail "lý do hoặc ghi chú bổ sung"
        datetime created_at "thời điểm ghi nhận"
    }
    USER {
        string user_id PK "người dùng nội bộ, thuộc org-governance"
        string display_name "tên hiển thị"
    }
    ORG_UNIT {
        string org_unit_id PK "đơn vị tổ chức, thuộc org-governance"
        string name "tên đơn vị"
    }
    JOB_APPLICATION {
        string application_id PK "hồ sơ ứng tuyển, thuộc candidate-pipeline"
        string status "trạng thái pipeline hiện tại"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| RECRUITMENT_REQUEST | Đề xuất nhu cầu tuyển của quản lý/HR — vòng đời nháp → chờ duyệt → đã duyệt/từ chối/hủy | title, org_unit_id, headcount, priority, jd_*, owner_id, status |
| POSITION | Vị trí tuyển dụng tạo từ request "Đã duyệt" — đích gắn CV và theo dõi headcount | request_id, jd_*, headcount_total, headcount_filled, status |
| APPROVAL_DECISION | Một quyết định của cấp thẩm quyền trên request; nhiều dòng khi request qua nhiều vòng chỉnh | request_id, approver_id, decision, note, round |
| RECRUITMENT_AUDIT_EVENT | Vết kiểm toán mọi hành động trên request và vị trí kèm trước/sau | actor_id, action, before_value, after_value, detail |
| USER | Người đề xuất, HR owner, approver — tham chiếu từ `org-governance` | user_id, display_name |
| ORG_UNIT | Đơn vị của request và vị trí — tham chiếu từ `org-governance` | org_unit_id, name |
| JOB_APPLICATION | Hồ sơ ứng tuyển gắn vị trí để đếm "đã chốt" — thuộc `candidate-pipeline` | application_id, status |

## Notes & Assumptions

- Một request tạo tối đa một POSITION (quan hệ `||--o|`); khi request bị
  từ chối hoặc hủy thì `POSITION.request_id` không tồn tại — POSITION chỉ
  được sinh từ request "Đã duyệt" (BR-recruitment-planning-001/003).
- `POSITION.headcount_filled` là giá trị vật lý hóa từ đếm JOB_APPLICATION
  đạt trạng thái chốt tuyển do `candidate-pipeline` công bố; cập nhật khi
  application đổi trạng thái, không do HR nhập tay (OQ-3 đề xuất).
- `JOB_APPLICATION` chỉ khai tối thiểu để thể hiện quan hệ đếm headcount —
  entity thật thuộc `candidate-pipeline`, không sao chép cấu trúc.
- `APPROVAL_DECISION.round` đánh số vòng duyệt để lịch sử yêu cầu chỉnh →
  gửi lại truy vết được theo thứ tự.
- `RECRUITMENT_AUDIT_EVENT` ghi cả sự kiện trên request lẫn vị trí; một
  trong hai FK có thể rỗng tùy đối tượng.
- Snapshot đơn vị: `ORG_UNIT` đổi tên/giải thể sau duyệt không viết lại
  request — giá trị hiển thị theo tham chiếu hiện tại kèm cảnh báo (edge
  case brainstorm 6.5).
- Không mô hình chuỗi duyệt đa cấp (out of scope v1 — OQ-7).
