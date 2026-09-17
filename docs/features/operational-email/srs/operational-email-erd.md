---
type: srs-erd
feature: operational-email
updated: 2026-09-14
---

# operational-email — Entity Relationship Diagram

> Scope: dữ liệu email nghiệp vụ — mẫu và phiên bản mẫu có duyệt, whitelist
> biến, đợt gửi, giao nhận từng người nhận và lần thử gửi. `SETTING_VALUE`
> (giá trị SMTP) thuộc `platform-configuration`, `USERS` thuộc
> `account-access`, `ORGANIZATION` thuộc `org-governance`.

## Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ EMAIL_TEMPLATE : "so_huu"
    ORGANIZATION ||--o{ ALLOWED_VARIABLE : "cho_phep"
    ORGANIZATION ||--o{ EMAIL_BATCH : "phat_sinh"
    USERS ||--o{ EMAIL_TEMPLATE : "soan"
    USERS ||--o{ TEMPLATE_VERSION : "duyet"
    USERS ||--o{ EMAIL_BATCH : "gui"
    USERS ||--o{ EMAIL_DELIVERY : "xu_ly"
    EMAIL_TEMPLATE ||--o{ TEMPLATE_VERSION : "co_phien_ban"
    EMAIL_TEMPLATE ||--o{ EMAIL_BATCH : "duoc_chon"
    TEMPLATE_VERSION ||--o{ EMAIL_BATCH : "duoc_dung"
    SETTING_VALUE ||--o{ EMAIL_BATCH : "kenh_smtp"
    EMAIL_BATCH ||--o{ EMAIL_DELIVERY : "giao_cho"
    EMAIL_DELIVERY ||--o{ DELIVERY_ATTEMPT : "thu_gui"

    EMAIL_TEMPLATE {
        string template_id PK "mã mẫu email"
        string organization_id FK "tổ chức sở hữu"
        string name "tên mẫu, duy nhất trong tổ chức"
        string context_code "ngữ cảnh áp dụng: lịch phỏng vấn, offer, nhân sự"
        string status "trạng thái: bản nháp, chờ duyệt, đã duyệt, ngừng dùng"
        int current_version_no "số phiên bản đang hiệu lực"
        string retired_reason "lý do ngừng dùng"
        string created_by FK "người soạn mẫu"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    TEMPLATE_VERSION {
        string version_id PK "mã phiên bản mẫu"
        string template_id FK "mẫu chủ sở hữu"
        int version_no "số phiên bản tăng dần"
        string subject "tiêu đề email kèm biến"
        string body "nội dung email kèm biến, chỉ biến trong whitelist"
        string variables "danh sách biến được dùng trong phiên bản"
        string status "trạng thái: chờ duyệt, đã duyệt, bị thay thế"
        string review_note "ghi chú quyết định của người duyệt"
        string reviewed_by FK "người duyệt phiên bản"
        datetime reviewed_at "thời điểm duyệt"
        string created_by FK "người tạo phiên bản"
        datetime created_at "thời điểm tạo"
    }
    ALLOWED_VARIABLE {
        string variable_id PK "mã trường được phép"
        string organization_id FK "tổ chức áp dụng"
        string context_code "ngữ cảnh được phép dùng trường"
        string field_key "mã trường trong hồ sơ nguồn"
        string description "mô tả trường hiển thị khi soạn"
        string approved_by FK "người duyệt whitelist"
        boolean active "trường còn được phép dùng"
    }
    EMAIL_BATCH {
        string batch_id PK "mã đợt gửi"
        string organization_id FK "tổ chức phát sinh"
        string template_id FK "mẫu được chọn"
        string template_version_id FK "phiên bản mẫu đã dùng"
        string smtp_setting_id FK "giá trị cấu hình SMTP dùng để gửi"
        string send_type "loại gửi: đơn, bulk, test"
        string context_type "loại ngữ cảnh nguồn: application, offer, employee"
        string context_id "mã đối tượng ngữ cảnh nguồn"
        string eligibility "tiêu chí lọc người nhận của bulk"
        string status "trạng thái: nháp, đang gửi, hoàn tất, hoàn tất có lỗi"
        int total_recipients "tổng người nhận sau eligibility"
        int sent_count "số delivery đạt SENT/DELIVERED"
        int failed_count "số delivery FAILED/BOUNCED"
        string created_by FK "người gửi"
        datetime created_at "thời điểm tạo"
        datetime completed_at "thời điểm batch kết thúc"
    }
    EMAIL_DELIVERY {
        string delivery_id PK "mã giao nhận cho một người nhận"
        string batch_id FK "đợt gửi chứa delivery"
        string idempotency_key "khóa duy nhất: batch cộng địa chỉ người nhận"
        string recipient_address "địa chỉ email tại thời điểm gửi"
        string recipient_ref "tham chiếu hồ sơ nguồn của người nhận"
        string subject_snapshot "tiêu đề đã render tại thời điểm gửi"
        string body_snapshot "nội dung đã render tại thời điểm gửi"
        string status "trạng thái: QUEUED, SENT, DELIVERED, BOUNCED, FAILED"
        string failure_reason "lý do thất bại gần nhất"
        string resolution "xử lý cuối: đang chờ, đã resend, liên hệ kênh khác"
        string resolved_by FK "người ghi nhận xử lý"
        datetime resolved_at "thời điểm ghi nhận xử lý"
        datetime queued_at "thời điểm vào hàng chờ"
        datetime sent_at "thời điểm provider chấp nhận"
        datetime delivered_at "thời điểm xác nhận giao"
    }
    DELIVERY_ATTEMPT {
        string attempt_id PK "mã lần thử gửi"
        string delivery_id FK "delivery được thử"
        int attempt_no "lần thử thứ mấy"
        string result "kết quả: chấp nhận, lỗi tạm, lỗi cuối, bounce"
        string error "thông điệp lỗi của provider"
        datetime attempted_at "thời điểm thử"
    }
    SETTING_VALUE {
        string setting_value_id PK "giá trị cấu hình, thuộc platform-configuration"
        string setting_key "key cấu hình SMTP/provider"
        string status "trạng thái cấu hình: chưa cấu hình, đã cấu hình, chưa kiểm chứng, đã kiểm chứng"
    }
    USERS {
        string user_id PK "người dùng nội bộ, thuộc account-access"
        string email "địa chỉ email trong hồ sơ"
        string status "trạng thái tài khoản"
    }
    ORGANIZATION {
        string organization_id PK "mã tổ chức tenant, thuộc org-governance"
        string name "tên tổ chức"
        string status "trạng thái tenant"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| EMAIL_TEMPLATE | Mẫu email của tổ chức theo ngữ cảnh — state machine bản nháp → chờ duyệt → đã duyệt → ngừng dùng | name, context_code, status, current_version_no |
| TEMPLATE_VERSION | Snapshot tiêu đề/nội dung/biến của một phiên bản mẫu — sửa lớn tạo phiên bản mới qua duyệt | template_id, version_no, subject, body, variables, reviewed_by |
| ALLOWED_VARIABLE | Whitelist trường được phép làm biến theo ngữ cảnh — nền của minimal payload (R-08) | context_code, field_key, approved_by, active |
| EMAIL_BATCH | Một đợt gửi (đơn/bulk/test): mẫu + phiên bản, ngữ cảnh nguồn, eligibility, tổng kết | send_type, context_type + context_id, eligibility, status, counters |
| EMAIL_DELIVERY | Một người nhận trong batch — khóa idempotent, snapshot nội dung, trạng thái giao nhận và vết xử lý | idempotency_key, recipient_address, status, failure_reason, resolution |
| DELIVERY_ATTEMPT | Từng lần thử gửi theo lịch retry 5p/30p/2h | delivery_id, attempt_no, result, error |
| SETTING_VALUE | Giá trị cấu hình SMTP/provider hiệu lực — entity ngoài do `platform-configuration` sở hữu, chỉ tham chiếu | setting_value_id, setting_key, status |
| USERS | Người soạn/duyệt/gửi/xử lý — entity ngoài do `account-access` sở hữu | user_id, email, status |
| ORGANIZATION | Tenant sở hữu mẫu/whitelist/batch — entity ngoài do `org-governance` sở hữu | organization_id, name, status |

## Notes & Assumptions

- `EMAIL_BATCH` giữ cả `template_id` và `template_version_id`: delivery log
  truy vết được đúng phiên bản đã gửi (BR-operational-email-012), còn lọc
  theo mẫu không cần dựng lại qua phiên bản.
- `EMAIL_DELIVERY.idempotency_key` = batch + địa chỉ người nhận — bảo đảm
  bấm gửi hai lần, retry hoặc resend không tạo email trùng; địa chỉ trùng
  trong một batch gộp một delivery (FR-operational-email-013).
- `EMAIL_DELIVERY.status` theo state machine: QUEUED → SENT → DELIVERED;
  QUEUED/SENT → BOUNCED khi provider báo bounce; QUEUED → FAILED khi hết
  retry; FAILED → QUEUED khi resend (brainstorm Mục 6.3).
- `EMAIL_DELIVERY.recipient_address` và snapshot giữ giá trị tại thời điểm
  gửi — hồ sơ người nhận đổi sau đó không ảnh hưởng vết đã gửi; resend sau
  khi sửa hồ sơ tạo attempt mới với địa chỉ mới.
- `EMAIL_DELIVERY.resolution` ghi nhận đóng vết xử lý thủ công: resend hoặc
  "đã liên hệ kênh khác" kèm `resolved_by`/`resolved_at` (FR-operational-
  email-015).
- `smtp_setting_id` trỏ `SETTING_VALUE` của `platform-configuration`: giá
  trị SMTP là nguồn duy nhất nằm trong catalog đó; entity khai tối thiểu để
  thể hiện quan hệ (đề xuất — OQ-9 URD/spec chờ Operations owner).
- `recipient_ref` là tham chiếu logic tới hồ sơ nguồn (user, application
  hoặc employee theo `context_type`) — không phải FK vật lý vì đa hình.
- `ALLOWED_VARIABLE` là whitelist do owner nghiệp vụ + DPO duyệt; trường
  nhạy cảm (lương, điểm đánh giá, giấy tờ tùy thân) không bao giờ có bản
  ghi active — ràng buộc chặn ở tầng nghiệp vụ.
- `USERS`, `ORGANIZATION`, `SETTING_VALUE` là entity ngoài khai tối thiểu;
  định nghĩa đầy đủ thuộc `account-access`, `org-governance` và
  `platform-configuration`.
- Retention `EMAIL_DELIVERY`/snapshot và `DELIVERY_ATTEMPT` chờ DPO (OQ-6
  PRD): đề xuất log theo audit policy, snapshot nội dung tối thiểu.
