---
type: srs-erd
feature: employee-onboarding
updated: 2026-09-14
---

# employee-onboarding — Entity Relationship Diagram

> Scope: hồ sơ onboarding (case) sau khi offer được chấp nhận —
> checklist có nhóm gồm task có assignee/hạn, mẫu checklist snapshot,
> đính kèm tài liệu, audit sự kiện và liên kết conversion sang hồ sơ
> nhân viên. `APPLICATION`, `OFFER`, `EMPLOYEE_PROFILE`, `USER`,
> `DOCUMENT` là tham chiếu tối thiểu sang feature khác
> (`candidate-pipeline`, `offer-management`, `employee-profiles`,
> `org-governance`, `document-library`).

## Diagram

```mermaid
erDiagram
    APPLICATION ||--o{ ONBOARDING_CASE : "chuyển đổi thành"
    OFFER ||--o| ONBOARDING_CASE : "làm nguồn cho"
    EMPLOYEE_PROFILE |o--o| ONBOARDING_CASE : "liên kết conversion"
    CHECKLIST_TEMPLATE |o--o{ ONBOARDING_CASE : "áp dụng"
    CHECKLIST_TEMPLATE ||--o{ TEMPLATE_ITEM : "định nghĩa"
    TEMPLATE_ITEM |o--o{ ONBOARDING_TASK : "sinh ra"
    ONBOARDING_CASE ||--o{ ONBOARDING_TASK : "gồm việc"
    ONBOARDING_TASK ||--o{ TASK_ATTACHMENT : "đính kèm"
    DOCUMENT ||--o{ TASK_ATTACHMENT : "được tham chiếu"
    ONBOARDING_CASE ||--o{ ONBOARDING_EVENT : "ghi vết"
    ONBOARDING_TASK |o--o{ ONBOARDING_EVENT : "bị tác động"
    USER ||--o{ ONBOARDING_CASE : "điều phối"
    USER ||--o{ ONBOARDING_TASK : "được giao"
    USER ||--o{ ONBOARDING_TASK : "xác nhận"
    USER ||--o{ ONBOARDING_EVENT : "thực hiện"

    ONBOARDING_CASE {
        string case_id PK "mã hồ sơ onboarding"
        string application_id FK "application nguồn, một case mở mỗi application"
        string offer_id FK "offer đã chấp nhận làm nguồn"
        string employee_profile_id FK "hồ sơ nhân viên đã khởi tạo, điều kiện đóng"
        string template_id FK "mẫu checklist đã áp, rỗng khi không có mẫu"
        string status "mới tạo, đang thực hiện, hoàn tất, đã hủy"
        date start_date "ngày bắt đầu làm việc, bắt buộc"
        string owner_user_id FK "HR điều phối case"
        boolean no_tasks_confirmed "HR đã xác nhận checklist trống có chủ đích"
        string cancel_reason "lý do hủy case, bắt buộc khi hủy"
        string created_by FK "người tạo case, rỗng khi tạo bởi sự kiện"
        datetime completed_at "thời điểm đóng case"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    ONBOARDING_TASK {
        string task_id PK "mã việc onboarding"
        string case_id FK "case chứa việc"
        string template_item_id FK "mục mẫu nguồn, rỗng khi thêm tay"
        string group_name "nhóm: giấy tờ, thiết bị, tài khoản, đào tạo, khác"
        string title "tiêu đề việc"
        string description "mô tả và hướng dẫn thực hiện"
        string assignee_user_id FK "người phụ trách, rỗng khi giao cho nhân viên mới"
        boolean for_new_employee "việc giao cho nhân viên mới tự xác nhận"
        boolean is_required "việc bắt buộc chặn đóng case"
        date due_date "hạn hoàn tất, bắt buộc"
        string status "mở, hoàn tất, đã hủy, bỏ qua"
        boolean is_overdue "cờ quá hạn khi quá due_date chưa xong"
        boolean completed_late "đã hoàn tất sau hạn"
        string confirmed_by FK "người xác nhận hoàn tất, kể cả HR xác nhận thay"
        datetime confirmed_at "thời điểm xác nhận"
        string completion_note "ghi chú khi hoàn tất"
        string cancel_reason "lý do hủy hoặc bỏ qua, bắt buộc"
        int reminder_count "số lần đã nhắc, tối đa 5"
        int display_order "thứ tự hiển thị trong checklist"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    CHECKLIST_TEMPLATE {
        string template_id PK "mã mẫu checklist"
        string organization_id FK "tổ chức sở hữu mẫu"
        string name "tên mẫu"
        string position_id FK "vị trí áp dụng, rỗng = mặc định tổ chức"
        string status "đang dùng hoặc ngừng dùng"
        string created_by FK "người soạn mẫu"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    TEMPLATE_ITEM {
        string item_id PK "mã mục mẫu"
        string template_id FK "mẫu chứa mục"
        string group_name "nhóm việc khi sinh task"
        string title "tiêu đề mục"
        string description "mô tả mục"
        boolean is_required "mục bắt buộc khi sinh task"
        int due_offset_days "số ngày trước ngày bắt đầu, đề xuất 1-14"
        string default_assignee_role "vai trò gán mặc định, HR đổi được khi tạo case"
        boolean for_new_employee "mục mặc định giao cho nhân viên mới"
        int display_order "thứ tự mục trong mẫu"
    }
    TASK_ATTACHMENT {
        string attachment_id PK "mã đính kèm"
        string task_id FK "task đính kèm"
        string document_id FK "tài liệu trong document-library"
        string added_by FK "người đính kèm"
        datetime created_at "thời điểm đính kèm"
    }
    ONBOARDING_EVENT {
        string event_id PK "mã sự kiện"
        string case_id FK "case bị tác động"
        string task_id FK "task bị tác động, rỗng khi sự kiện mức case"
        string event_type "tạo case, bắt đầu, giao, đổi hạn, hủy, xác nhận, bỏ qua, đóng, reopen"
        string actor_user_id FK "người thực hiện, rỗng khi nguồn hệ thống"
        string reason "lý do khi hành động bắt buộc lý do"
        string before_value "giá trị trước khi đổi"
        string after_value "giá trị sau khi đổi"
        datetime created_at "thời điểm ghi sự kiện"
    }
    APPLICATION {
        string application_id PK "mã application, thuộc candidate-pipeline"
        string stage "trạng thái pipeline, ACCEPTED mới tạo được case"
    }
    OFFER {
        string offer_id PK "mã offer, thuộc offer-management"
        string status "đã chấp nhận mới là nguồn case"
        date start_date "ngày bắt đầu đề xuất trên offer"
    }
    EMPLOYEE_PROFILE {
        string profile_id PK "mã hồ sơ nhân viên, thuộc employee-profiles"
        string status "NHAP, CHO_DUYET, HOAT_DONG — HOAT_DONG là điều kiện đóng case"
        string application_id "application nguồn của hồ sơ"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
    DOCUMENT {
        string document_id PK "mã tài liệu, thuộc document-library"
        string title "tên tài liệu"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| ONBOARDING_CASE | Hồ sơ onboarding của một application đã chấp nhận offer — vòng đời mới tạo → đang thực hiện → hoàn tất/đã hủy | application_id, offer_id, employee_profile_id, status, start_date, owner_user_id |
| ONBOARDING_TASK | Một việc trong checklist — nhóm, assignee hoặc cờ nhân viên mới, hạn, cờ bắt buộc, xác nhận hoàn tất | case_id, group_name, assignee_user_id, for_new_employee, is_required, due_date, status |
| CHECKLIST_TEMPLATE | Mẫu checklist theo tổ chức/vị trí — snapshot khi áp vào case | name, position_id, status |
| TEMPLATE_ITEM | Một mục trong mẫu — offset hạn trước ngày bắt đầu, vai trò assignee mặc định | due_offset_days, default_assignee_role, is_required |
| TASK_ATTACHMENT | Tài liệu từ `document-library` đính kèm task (P1) | task_id, document_id |
| ONBOARDING_EVENT | Audit mọi tác động trên case và task — kèm lý do và trước/sau | event_type, actor_user_id, reason, before_value, after_value |
| APPLICATION | Application nguồn — tham chiếu tối thiểu từ `candidate-pipeline` | application_id, stage |
| OFFER | Offer đã chấp nhận — tham chiếu tối thiểu từ `offer-management` | offer_id, status, start_date |
| EMPLOYEE_PROFILE | Hồ sơ nhân viên khởi tạo từ conversion — tham chiếu tối thiểu từ `employee-profiles` | profile_id, status, application_id |
| USER | Người dùng nội bộ — tham chiếu tối thiểu từ `org-governance` | user_id, display_name |
| DOCUMENT | Tài liệu đính kèm — tham chiếu tối thiểu từ `document-library` | document_id, title |

## Notes & Assumptions

- `ONBOARDING_CASE` là điểm nối conversion: một application `ACCEPTED`
  tối đa một case đang mở (BR-employee-onboarding-001); `offer_id` giữ
  nguồn dữ liệu prefill và `employee_profile_id` giữ kết quả khởi tạo
  để kiểm tra điều kiện đóng (`HOAT_DONG`).
- `ONBOARDING_TASK.template_item_id` chốt mục mẫu nguồn theo nguyên tắc
  snapshot (BR-employee-onboarding-006): sửa mẫu không đổi task đã sinh;
  task thêm tay có trường này rỗng.
- "Quá hạn" và "hoàn tất trễ" là cờ (`is_overdue`, `completed_late`)
  chứ không phải trạng thái — trạng thái task chỉ gồm mở, hoàn tất, đã
  hủy, bỏ qua; `reminder_count` kiểm soát nhịp nhắc (tối đa 5 lần).
- `for_new_employee` trên task đánh dấu việc của nhân viên mới; khi cờ
  này bật, `assignee_user_id` rỗng và quyền xác nhận phụ thuộc nhân
  viên đã có tài khoản chưa (BR-employee-onboarding-008) — việc kiểm
  tra tài khoản đi qua `account-access`, không mô hình ở đây.
- `ONBOARDING_EVENT.task_id` rỗng với sự kiện mức case (tạo, bắt đầu,
  đóng, hủy, reopen) và có giá trị với sự kiện mức task (giao, đổi
  hạn, xác nhận, hủy, bỏ qua); reopen là sự kiện trên cùng case chứ
  không tạo case mới.
- `no_tasks_confirmed` trên case ghi việc HR xác nhận checklist trống
  có chủ đích (OQ-4) — audit lựa chọn ngoại lệ.
- `APPLICATION`, `OFFER`, `EMPLOYEE_PROFILE`, `USER`, `DOCUMENT` chỉ
  khai tối thiểu phục vụ quan hệ — entity đầy đủ thuộc ERD của feature
  tương ứng. Transition `ONBOARDED` nằm trong state machine của
  `candidate-pipeline`, case chỉ phát sự kiện (BR-employee-onboarding-007).
- Retention: case, task, sự kiện và đính kèm giữ theo retention hồ sơ
  nhân viên — chờ DPO (PRD OQ-6); ERD chưa mô hình thuộc tính retention.
