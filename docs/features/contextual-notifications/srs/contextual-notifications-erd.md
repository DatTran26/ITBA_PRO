---
type: srs-erd
feature: contextual-notifications
updated: 2026-09-14
---

# contextual-notifications — Entity Relationship Diagram

> Scope: dữ liệu trung tâm thông báo — event nghiệp vụ đầu vào, thông báo
> in-app, delivery theo kênh và preference người dùng. Không gồm mẫu email
> nghiệp vụ (`operational-email`) hay định nghĩa board (`kanban-workspaces`).

## Diagram

```mermaid
erDiagram
    BUSINESS_EVENT ||--o{ NOTIFICATION : "sinh_ra"
    NOTIFICATION_TYPE ||--o{ NOTIFICATION : "dinh_dang"
    USERS ||--o{ NOTIFICATION : "nhan"
    NOTIFICATION ||--o{ NOTIFICATION_DELIVERY : "phan_kenh"
    NOTIFICATION_DELIVERY ||--o{ DELIVERY_ATTEMPT : "thu_gui"
    USERS ||--o{ NOTIFICATION_PREFERENCE : "cau_hinh"
    NOTIFICATION_TYPE ||--o{ NOTIFICATION_PREFERENCE : "ap_cho"
    NOTIFICATION ||--o| KANBAN_CARD : "tao_card"
    USERS ||--o{ KANBAN_CARD : "so_huu"

    BUSINESS_EVENT {
        string id PK "định danh event nghiệp vụ nhận được"
        string event_key "khóa idempotent: nguồn + loại + entity + người nhận"
        string event_type "loại event (giao task, đổi hạn, lịch PV, offer, chờ duyệt...)"
        string entity_type "loại entity nguồn (task, interview_session, offer...)"
        string entity_id "mã entity nguồn"
        string payload_summary "ngữ cảnh tối thiểu để render template"
        string status "trạng thái xử lý: đã ghi nhận/bỏ qua/lỗi"
        datetime occurred_at "thời điểm event phát sinh"
        datetime processed_at "thời điểm xử lý xong"
    }

    NOTIFICATION_TYPE {
        string code PK "mã loại thông báo trong catalog"
        string name "tên hiển thị của loại"
        string title_template "mẫu tiêu đề có biến"
        string body_template "mẫu nội dung in-app có biến"
        string email_template "mẫu email teaser + link có biến"
        boolean mandatory_email "admin đánh dấu bắt buộc gửi email"
        boolean urgent "loại được vượt quiet hours"
        boolean active "loại còn được dùng"
    }

    NOTIFICATION {
        string id PK "định danh thông báo"
        string event_id FK "event nghiệp vụ sinh ra"
        string type_code FK "loại thông báo"
        string recipient_id FK "người nhận nội bộ (rỗng nếu là ứng viên)"
        string recipient_email "email người nhận ngoài hệ thống (ứng viên)"
        string entity_type "loại entity tham chiếu để dedup"
        string entity_id "mã entity tham chiếu để dedup"
        string title "tiêu đề đã render"
        string body "nội dung đã render"
        string link "đường dẫn tới màn hình liên quan"
        string status "UNREAD/READ/ARCHIVED"
        datetime created_at "thời điểm tạo hoặc cập nhật dedup"
        datetime read_at "thời điểm đọc"
        datetime archived_at "thời điểm archive"
    }

    NOTIFICATION_DELIVERY {
        string id PK "định danh lần giao theo kênh"
        string notification_id FK "thông báo được giao"
        string channel "kênh: in_app hoặc email"
        string recipient_address "địa chỉ email đích (kênh email)"
        string status "QUEUED/SENT/DELIVERED/FAILED/SUPPRESSED"
        string failure_reason "lý do thất bại gần nhất"
        datetime queued_at "thời điểm vào hàng chờ (kể cả giữ quiet hours)"
        datetime sent_at "thời điểm provider chấp nhận"
        datetime delivered_at "thời điểm xác nhận mở/click"
    }

    DELIVERY_ATTEMPT {
        string id PK "định danh lần thử gửi"
        string delivery_id FK "delivery được thử"
        int attempt_no "lần thử thứ mấy (1-3)"
        string result "kết quả lần thử: chấp nhận/lỗi tạm/lỗi cuối"
        string error "thông điệp lỗi của provider"
        datetime attempted_at "thời điểm thử"
    }

    NOTIFICATION_PREFERENCE {
        string id PK "định danh preference"
        string user_id FK "người dùng sở hữu"
        string type_code FK "loại thông báo áp dụng"
        boolean email_enabled "người dùng bật/tắt email cho loại"
        string reminder_offsets "mốc nhắc lịch riêng của người dùng"
        datetime updated_at "thời điểm chỉnh gần nhất"
    }

    KANBAN_CARD {
        string id PK "card trên board cá nhân (thuộc kanban-workspaces)"
        string notification_id FK "thông báo loại lịch sinh card (rỗng nếu pin tay)"
        string owner_id FK "người sở hữu board"
        string title "tiêu đề card"
        string status "trạng thái card: ACTIVE/REMOVED"
        datetime due_at "thời điểm lịch/hạn liên quan"
    }

    USERS {
        string id PK "người dùng nội bộ (thuộc account-access/org-governance)"
        string email "địa chỉ email trong hồ sơ"
        string status "trạng thái tài khoản: active/deactivated"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| BUSINESS_EVENT | Event nghiệp vụ các module phát vào dispatch; khóa `event_key` bảo đảm xử lý idempotent | event_key, event_type, entity_type + entity_id, status |
| NOTIFICATION_TYPE | Catalog loại thông báo và template hệ thống; định loại bắt buộc email và nhóm urgent | code, title/body/email_template, mandatory_email, urgent |
| NOTIFICATION | Một thông báo in-app cho một người nhận; dedup theo type_code + entity_type + entity_id | recipient_id/recipient_email, title, body, status, read_at |
| NOTIFICATION_DELIVERY | Một lần giao của notification theo kênh; giữ trạng thái giao nhận để truy vết và dead-letter | channel, recipient_address, status, failure_reason |
| DELIVERY_ATTEMPT | Từng lần thử gửi của một delivery email theo lịch retry | delivery_id, attempt_no, result, error |
| NOTIFICATION_PREFERENCE | Tùy chọn kênh/mốc nhắc của một người dùng cho một loại | user_id, type_code, email_enabled, reminder_offsets |
| KANBAN_CARD | Card board cá nhân tạo từ thông báo lịch hoặc pin tay — entity ngoài do `kanban-workspaces` sở hữu, chỉ tham chiếu | notification_id, owner_id, status, due_at |
| USERS | Người dùng nội bộ — entity ngoài do `account-access`/`org-governance` sở hữu, chỉ tham chiếu | id, email, status |

## Notes & Assumptions

- `NOTIFICATION.entity_type` + `entity_id` + `type_code` là khóa dedup
  nghiệp vụ: event mới cùng bộ ba này cập nhật NOTIFICATION hiện có và đặt
  lại UNREAD thay vì tạo dòng mới.
- Người nhận có hai dạng: `recipient_id` trỏ USERS cho nội bộ, hoặc
  `recipient_email` trần cho ứng viên không tài khoản — một notification
  chỉ dùng một dạng.
- `NOTIFICATION_DELIVERY.status = SUPPRESSED` ghi nhận các trường hợp cố
  ý không gửi (tài khoản deactivate, recipient không resolve được, email
  bị giữ qua quiet hours rồi entity bị hủy trước giờ gửi) — vẫn là kết quả
  truy vết được, không phải mất âm thầm.
- `DELIVERY_ATTEMPT` chỉ sinh cho kênh email; kênh in-app ghi nhận ngay ở
  NOTIFICATION.
- `KANBAN_CARD` và `USERS` là entity ngoài, khai tối thiểu để thể hiện
  quan hệ; định nghĩa đầy đủ thuộc `kanban-workspaces` và
  `account-access`/`org-governance`.
- Retention (90 ngày archive) là chính sách vận hành trên
  `NOTIFICATION.status`, không phải thuộc tính riêng; retention của
  delivery log chờ OQ-6 sản phẩm.
- Email payload tối thiểu được ràng buộc ở `NOTIFICATION_TYPE.email_template`
  (chỉ teaser + link), không phải bản ghi dữ liệu riêng.
