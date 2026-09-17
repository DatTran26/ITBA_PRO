---
type: srs-erd
feature: external-integrations
updated: 2026-09-14
---

# external-integrations — Entity Relationship Diagram

> Scope: dữ liệu khung tích hợp provider-agnostic — integration và contract
> field allowlist, sync run/item/attempt, reconcile report/item.
> `SETTING_VALUE` (credential/endpoint) thuộc `platform-configuration`,
> `USERS` thuộc `account-access`, `ORGANIZATION` thuộc `org-governance`.

## Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ INTEGRATION : "so_huu"
    SETTING_VALUE ||--o{ INTEGRATION : "cap_credential"
    INTEGRATION ||--o{ CONTRACT_FIELD : "khai_bao"
    INTEGRATION ||--o{ SYNC_RUN : "chay"
    SYNC_RUN ||--o{ SYNC_ITEM : "xu_ly"
    SYNC_ITEM ||--o{ SYNC_ATTEMPT : "thu_gui"
    INTEGRATION ||--o{ RECONCILE_REPORT : "doi_soat"
    RECONCILE_REPORT ||--o{ RECONCILE_ITEM : "liet_ke"
    USERS ||--o{ SYNC_RUN : "kich_hoat"
    USERS ||--o{ RECONCILE_REPORT : "chay"
    USERS ||--o{ RECONCILE_ITEM : "quyet_dinh"
    USERS ||--o{ SYNC_ITEM : "xu_ly"
    INTEGRATION ||--o{ SYNC_ITEM : "phan_phat"

    INTEGRATION {
        string integration_id PK "mã integration"
        string organization_id FK "tổ chức sở hữu"
        string name "tên integration, duy nhất trong tổ chức"
        string exchange_type "loại trao đổi: calendar, form, webhook, file, task"
        string direction "hướng: outbound, inbound, hai_chieu"
        string provider_key "mã provider khi đã chọn, rỗng khi đang trì hoãn"
        string credential_setting_id FK "giá trị credential trong catalog platform-configuration"
        string status "vòng đời: nháp, hoạt động, tạm dừng, ngắt"
        string webhook_secret_ref "tham chiếu secret endpoint inbound trong catalog"
        string created_by FK "người tạo"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    CONTRACT_FIELD {
        string contract_field_id PK "mã trường trong contract"
        string integration_id FK "integration chủ sở hữu"
        string data_kind "loại dữ liệu: lịch hẹn, biểu mẫu, task, file"
        string field_key "mã trường được phép trao đổi"
        string direction "hướng áp dụng cho trường: outbound, inbound, hai_chieu"
        string source_of_truth "bên giữ truth cho loại dữ liệu: he_thong, ben_ngoai"
        boolean sensitive "trường nhạy cảm cần DPO duyệt trước khi bật"
        boolean active "trường còn được phép trao đổi"
    }
    SYNC_RUN {
        string run_id PK "mã đợt đồng bộ"
        string integration_id FK "integration chạy"
        string run_type "loại: sync_outbound, webhook_inbound, reconcile_apply"
        string status "trạng thái: đang chạy, hoàn tất, hoàn tất có lỗi"
        int total_items "tổng mục trong run"
        int sent_count "số mục thành công"
        int failed_count "số mục lỗi"
        string triggered_by FK "người hoặc tiến trình kích hoạt"
        datetime started_at "thời điểm bắt đầu"
        datetime completed_at "thời điểm kết thúc"
    }
    SYNC_ITEM {
        string item_id PK "mã mục đồng bộ"
        string run_id FK "run xử lý mục"
        string integration_id FK "integration phát/nhận"
        string idempotency_key "khóa duy nhất: integration cộng bản ghi nguồn cộng loại trao đổi"
        string source_ref "tham chiếu bản ghi nguồn trong hệ thống"
        string target_ref "tham chiếu bản ghi phía provider sau khi gửi"
        string payload_snapshot "payload tối thiểu theo allowlist tại thời điểm xử lý"
        string status "trạng thái: QUEUED, RETRYING, SENT, FAILED"
        string failure_reason "lý do thất bại gần nhất"
        string resolution "xử lý cuối: đang chờ, đã resend, xử lý ngoài"
        string resolved_by FK "người ghi nhận xử lý"
        datetime resolved_at "thời điểm ghi nhận xử lý"
        datetime queued_at "thời điểm vào hàng chờ"
        datetime sent_at "thời điểm provider chấp nhận"
    }
    SYNC_ATTEMPT {
        string attempt_id PK "mã lần thử"
        string item_id FK "mục được thử"
        int attempt_no "lần thử thứ mấy"
        string result "kết quả: chấp nhận, lỗi tạm, lỗi cuối, lỗi xác thực"
        string error "thông điệp lỗi của provider"
        datetime attempted_at "thời điểm thử"
    }
    RECONCILE_REPORT {
        string report_id PK "mã báo cáo đối soát"
        string integration_id FK "integration được đối soát"
        date period_start "mốc bắt đầu khoảng đối soát"
        date period_end "mốc kết thúc khoảng đối soát"
        int diff_count "số chênh lệch phát hiện"
        int decided_count "số dòng đã có quyết định"
        string created_by FK "người chạy đối soát"
        datetime created_at "thời điểm chạy"
    }
    RECONCILE_ITEM {
        string reconcile_item_id PK "mã dòng chênh lệch"
        string report_id FK "báo cáo chứa dòng"
        string diff_kind "loại chênh: chi_o_ta, chi_o_ho, khac_gia_tri"
        string local_ref "tham chiếu bản ghi phía hệ thống"
        string remote_ref "tham chiếu bản ghi phía provider"
        string local_value "giá trị phía hệ thống tại thời điểm chạy"
        string remote_value "giá trị phía provider tại thời điểm chạy"
        string source_of_truth "truth áp dụng snapshot tại thời điểm tạo"
        string decision "quyết định append-only: chưa quyết định, áp dụng, giữ, bỏ qua"
        string decision_note "ghi chú quyết định, bắt buộc khi bỏ qua"
        string decided_by FK "người quyết định"
        datetime decided_at "thời điểm quyết định"
    }
    SETTING_VALUE {
        string setting_value_id PK "giá trị cấu hình, thuộc platform-configuration"
        string setting_key "key credential/endpoint của integration"
        string status "trạng thái: chưa cấu hình, đã cấu hình, chưa kiểm chứng, đã kiểm chứng"
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
| INTEGRATION | Một kết nối theo contract của tổ chức — vòng đời nháp → hoạt động → tạm dừng → ngắt; `provider_key` rỗng khi chưa chọn provider | exchange_type, direction, provider_key, credential_setting_id, status |
| CONTRACT_FIELD | Allowlist trường được phép trao đổi + source-of-truth per loại dữ liệu — nền của minimal payload và reconcile | data_kind, field_key, direction, source_of_truth, sensitive |
| SYNC_RUN | Một đợt chạy sync hoặc nhóm apply của reconcile | run_type, status, counters |
| SYNC_ITEM | Một bản ghi trao đổi — khóa idempotent, payload snapshot tối thiểu, trạng thái và vết xử lý | idempotency_key, source_ref, target_ref, status, resolution |
| SYNC_ATTEMPT | Từng lần gọi provider theo lịch retry 5p/30p/2h | item_id, attempt_no, result, error |
| RECONCILE_REPORT | Một lần chạy đối soát theo khoảng thời gian | period_start/period_end, diff_count, decided_count |
| RECONCILE_ITEM | Một dòng chênh lệch — quyết định append-only có người/thời điểm | diff_kind, local/remote value, source_of_truth snapshot, decision |
| SETTING_VALUE | Credential/endpoint của integration — entity ngoài do `platform-configuration` sở hữu | setting_value_id, setting_key, status |
| USERS | Người cấu hình/kích hoạt/quyết định — entity ngoài do `account-access` sở hữu | user_id, email, status |
| ORGANIZATION | Tenant sở hữu integration — entity ngoài do `org-governance` sở hữu | organization_id, name, status |

## Notes & Assumptions

- `INTEGRATION.provider_key` rỗng khi feature đang trì hoãn chưa chọn
  provider (project profile 2026-09-13); khi chọn, provider chỉ điền vào
  `provider_key` + adapter — khung contract không đổi.
- `INTEGRATION.credential_setting_id` trỏ `SETTING_VALUE` của
  `platform-configuration`: credential/endpoint là nguồn duy nhất nằm trong
  catalog đó (write-only, masked, versioned) — đề xuất, URD OQ-8 chờ
  Operations owner. `webhook_secret_ref` cũng là tham chiếu catalog.
- `SYNC_ITEM.idempotency_key` = integration + bản ghi nguồn + loại trao
  đổi — replay webhook hay chạy lại run bị chặn kèm log duplicate-skipped
  (FR-external-integrations-005, R-12).
- `SYNC_ITEM.status` theo state machine: QUEUED → SENT; QUEUED → RETRYING
  → FAILED; FAILED → QUEUED khi resend tạo `SYNC_ATTEMPT` mới cùng khóa.
- `SYNC_ITEM.payload_snapshot` giữ payload tối thiểu theo allowlist tại
  thời điểm xử lý — truy vết đúng dữ liệu đã trao đổi; retention chờ DPO
  (OQ-6 PRD).
- `CONTRACT_FIELD.sensitive` đánh dấu trường nhạy cảm: chỉ được `active`
  sau khi DPO duyệt — cơ chế chặn ở tầng nghiệp vụ (FR-external-
  integrations-011).
- `RECONCILE_ITEM.source_of_truth` là snapshot rule tại thời điểm tạo
  report — đổi contract sau đó không sửa quyết định đã ghi (BR-external-
  integrations-010); `decision` là append-only, ghi một lần.
- `RECONCILE_ITEM` với decision "áp dụng" sinh `SYNC_RUN` loại
  `reconcile_apply` chứa các `SYNC_ITEM` sửa phía không phải truth —
  quan hệ logic qua `SYNC_RUN.integration_id` + `run_type`.
- `source_ref`/`target_ref`/`local_ref`/`remote_ref` là tham chiếu logic
  (chuỗi khóa bản ghi), không phải FK vật lý vì đa hình theo module nguồn.
- `USERS`, `ORGANIZATION`, `SETTING_VALUE` là entity ngoài khai tối thiểu;
  định nghĩa đầy đủ thuộc `account-access`, `org-governance` và
  `platform-configuration`.
- Webhook inbound không tạo entity riêng: request hợp lệ thành
  `SYNC_ITEM` trong `SYNC_RUN` loại `webhook_inbound`; request sai chữ ký
  bị từ chối và chỉ xuất hiện trong audit của `org-governance`.
