---
type: srs-erd
feature: kanban-workspaces
updated: 2026-09-14
---

# kanban-workspaces — Entity Relationship Diagram

> Scope: workspace theo nhóm/phòng ban/dự án, board và cột Kanban, task có
> một assignee/hạn/ưu tiên/trạng thái, bình luận, file đính kèm, bàn giao
> có duyệt và lịch sử hoạt động (PRD Mục 7.16). `APP_USER` thuộc
> `account-access`; `ORGANIZATION`, `ORG_UNIT` thuộc `org-governance`;
> `INTAKE_DOCUMENT` thuộc `document-intake`; `ACTION_CONVERSION` thuộc
> `meeting-to-tasks` — chỉ khai tối thiểu để tham chiếu.

## Diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ WORKSPACE : "sở hữu"
    ORG_UNIT ||--o{ WORKSPACE : "liên quan"
    APP_USER ||--o{ WORKSPACE : "tạo"
    WORKSPACE ||--o{ WORKSPACE_MEMBER : "có thành viên"
    APP_USER ||--o{ WORKSPACE_MEMBER : "là thành viên"
    APP_USER ||--o{ WORKSPACE_MEMBER : "thêm vào"
    WORKSPACE ||--o{ BOARD : "chứa"
    APP_USER ||--o{ BOARD : "tạo"
    BOARD ||--o{ BOARD_COLUMN : "gồm cột"
    BOARD ||--o{ TASK : "chứa"
    BOARD_COLUMN ||--o{ TASK : "đặt tại"
    APP_USER ||--o{ TASK : "phụ trách"
    APP_USER ||--o{ TASK : "tạo"
    ACTION_CONVERSION ||--o| TASK : "tạo ra"
    TASK ||--o{ TASK_COMMENT : "có bình luận"
    APP_USER ||--o{ TASK_COMMENT : "viết"
    TASK ||--o{ TASK_DOCUMENT : "đính kèm"
    INTAKE_DOCUMENT ||--o{ TASK_DOCUMENT : "được gán vào"
    APP_USER ||--o{ TASK_DOCUMENT : "tải lên"
    TASK ||--o{ HANDOVER : "có bàn giao"
    APP_USER ||--o{ HANDOVER : "gửi"
    APP_USER ||--o{ HANDOVER : "duyệt"
    INTAKE_DOCUMENT ||--o{ HANDOVER : "là evidence"
    TASK ||--o{ TASK_ACTIVITY : "ghi vết"
    APP_USER ||--o{ TASK_ACTIVITY : "thực hiện"

    WORKSPACE {
        string id PK "mã workspace"
        string organization_id FK "tổ chức sở hữu"
        string org_unit_id FK "đơn vị liên quan, trống với loại nhóm hoặc dự án tự do"
        string name "tên workspace, duy nhất trong tổ chức"
        string workspace_type "loại: phòng ban, dự án, nhóm"
        string status "trạng thái: HOAT_DONG, LUU_TRU"
        string created_by FK "người tạo workspace, là owner đầu tiên"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    WORKSPACE_MEMBER {
        string id PK "mã thành viên"
        string workspace_id FK "workspace chứa thành viên"
        string user_id FK "người dùng nội bộ là thành viên"
        string member_role "vai trò: owner, member, viewer"
        string added_by FK "người thêm thành viên"
        datetime created_at "thời điểm thêm"
    }
    BOARD {
        string id PK "mã board"
        string workspace_id FK "workspace chứa board"
        string name "tên board"
        string description "mô tả board"
        string status "trạng thái: HOAT_DONG, LUU_TRU — lưu trữ không nhận task mới"
        string created_by FK "người tạo board"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    BOARD_COLUMN {
        string id PK "mã cột"
        string board_id FK "board chứa cột"
        string name "tên cột, duy nhất trong board"
        int position "thứ tự hiển thị trên board"
        string status_category "nhóm trạng thái cố định: MOI, DANG_LAM, CHO_DUYET, HOAN_TAT"
        datetime created_at "thời điểm tạo"
    }
    TASK {
        string id PK "mã task"
        string board_id FK "board chứa task"
        string column_id FK "cột đang chứa task"
        string title "tiêu đề, bắt buộc"
        string description "mô tả công việc"
        string assignee_id FK "người phụ trách, đúng một và là thành viên workspace"
        date due_date "hạn, trống được nhưng nhắc"
        string priority "mức ưu tiên: thấp, trung bình, cao, khẩn"
        string status "trạng thái: MOI, DANG_LAM, CHO_DUYET, HOAN_TAT, DA_HUY"
        string close_reason "lý do đóng không hoàn tất hoặc mở lại, bắt buộc khi dùng"
        boolean assignee_out_of_workspace "cờ assignee không còn trong workspace"
        string created_by FK "người tạo task"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
        datetime closed_at "thời điểm hoàn tất hoặc đóng"
    }
    TASK_COMMENT {
        string id PK "mã bình luận"
        string task_id FK "task chứa bình luận"
        string author_id FK "người viết bình luận"
        string content "nội dung bình luận"
        datetime edited_at "thời điểm sửa, trống nếu chưa sửa"
        datetime deleted_at "thời điểm xóa, trống nếu chưa xóa"
        datetime created_at "thời điểm đăng"
    }
    TASK_DOCUMENT {
        string id PK "mã gán file"
        string task_id FK "task chứa file"
        string document_id FK "file qua cổng document-intake"
        string uploaded_by FK "người đính kèm"
        datetime created_at "thời điểm gán"
    }
    HANDOVER {
        string id PK "mã lần bàn giao"
        string task_id FK "task được bàn giao"
        string submitted_by FK "assignee gửi bàn giao"
        string outcome_note "ghi chú kết quả, bắt buộc"
        string evidence_document_id FK "file evidence qua document-intake, tùy chọn"
        string reviewer_id FK "người duyệt, mặc định người tạo task"
        string decision "quyết định: CHO_DUYET, DA_DUYET, TU_CHOI"
        string review_note "phản hồi của reviewer, bắt buộc khi từ chối"
        datetime submitted_at "thời điểm gửi bàn giao"
        datetime decided_at "thời điểm quyết định"
    }
    TASK_ACTIVITY {
        string id PK "mã sự kiện lịch sử"
        string task_id FK "task bị tác động"
        string actor_id FK "người thực hiện"
        string action "hành động: tạo, sửa trường, đổi cột, gán lại, bình luận, đính kèm, gửi bàn giao, duyệt, từ chối, đóng, mở lại, truy cập bị từ chối"
        string field_name "trường bị đổi, trống với hành động không theo trường"
        string old_value "giá trị trước"
        string new_value "giá trị sau"
        datetime created_at "thời điểm ghi nhận"
    }
    ORGANIZATION {
        string id PK "mã tổ chức, thuộc org-governance"
        string name "tên tổ chức"
    }
    ORG_UNIT {
        string id PK "mã đơn vị, thuộc org-governance"
        string name "tên đơn vị"
    }
    APP_USER {
        string id PK "mã người dùng nội bộ, thuộc account-access"
        string name "tên hiển thị"
        string status "trạng thái tài khoản"
    }
    INTAKE_DOCUMENT {
        string id PK "mã file tiếp nhận, thuộc document-intake"
        string file_name "tên file đã tải lên"
        string status "trạng thái xử lý file"
    }
    ACTION_CONVERSION {
        string id PK "mã chuyển đổi, thuộc meeting-to-tasks"
        string task_id FK "task được tạo ra"
        boolean source_stale "cờ nguồn đã cập nhật do upstream đặt"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| WORKSPACE | Không gian công việc theo nhóm/phòng ban/dự án — ranh giới quyền và gán đơn vị liên quan | organization_id, org_unit_id, name, workspace_type, status |
| WORKSPACE_MEMBER | Thành viên workspace với vai trò owner/member/viewer — quyền trên board và task đi qua đây | workspace_id, user_id, member_role |
| BOARD | Bảng Kanban trong workspace — lưu trữ không nhận task mới | workspace_id, name, status |
| BOARD_COLUMN | Cột trên board — mỗi cột gán đúng một trong 4 nhóm trạng thái cố định | board_id, name, position, status_category |
| TASK | Công việc trên board — một assignee, hạn, ưu tiên, trạng thái; cờ thiếu owner khi assignee rời workspace | board_id, column_id, title, assignee_id, due_date, priority, status, assignee_out_of_workspace |
| TASK_COMMENT | Bình luận trên task — giữ vết sửa/xóa | task_id, author_id, content, edited_at, deleted_at |
| TASK_DOCUMENT | Gán file đính kèm vào task qua `document-intake` | task_id, document_id, uploaded_by |
| HANDOVER | Một lần bàn giao — ghi chú kết quả bắt buộc, evidence tùy chọn, quyết định của reviewer | task_id, outcome_note, evidence_document_id, reviewer_id, decision, review_note |
| TASK_ACTIVITY | Lịch sử hoạt động trên task — ai, hành động, trường, trước → sau | task_id, actor_id, action, field_name, old_value, new_value |
| ORGANIZATION | Tổ chức sở hữu workspace — entity ngoài thuộc `org-governance` | id, name |
| ORG_UNIT | Đơn vị liên quan của workspace — entity ngoài thuộc `org-governance` | id, name |
| APP_USER | Người dùng nội bộ: thành viên, assignee, reviewer, actor — entity ngoài thuộc `account-access` | id, name, status |
| INTAKE_DOCUMENT | File đính kèm/evidence qua cổng tiếp nhận — entity ngoài thuộc `document-intake` | id, file_name, status |
| ACTION_CONVERSION | Bản ghi chuyển đổi đầu việc thành task — entity ngoài thuộc `meeting-to-tasks`, giữ link nguồn và cờ source_stale | id, task_id, source_stale |

## Notes & Assumptions

- `WORKSPACE`, `BOARD`, `TASK` giữ đúng tên entity như `meeting-to-tasks`
  đã tham chiếu (WORKSPACE{id,name}, BOARD{id,workspace_id,name},
  TASK{id,board_id,title,status}) — contract này không đổi, các thuộc tính
  ở đây là phần đầy đủ mà upstream khai tối thiểu.
- `ACTION_CONVERSION ||--o| TASK : "tạo ra"` lặp lại quan hệ upstream để
  thể hiện link nguồn hai chiều: `ACTION_CONVERSION.task_id` trỏ task ở
  đây; cờ `source_stale` do upstream đặt và feature này chỉ đọc để hiển
  thị "nguồn đã cập nhật" — không tự đồng bộ nội dung (BR-012).
- `TASK.status` là trạng thái sự thật; `BOARD_COLUMN.status_category` chỉ
  là cách nhìn: kéo task giữa cột mở đổi status theo nhóm cột, còn
  CHO_DUYET chỉ qua gửi bàn giao và HOAN_TAT chỉ qua duyệt — ràng buộc
  nghiệp vụ kiểm khi ghi, không thể hiện trên ERD (BR-001, BR-006).
- `TASK.assignee_id` trỏ `APP_USER` và phải là thành viên workspace còn
  hiệu lực; khi assignee bị gỡ, cờ `assignee_out_of_workspace` bật để task
  vào danh sách thiếu owner (BR-004, BR-005, FR-021).
- `HANDOVER.reviewer_id` mặc định là người tạo task; quản lý trong scope
  và workspace owner duyệt được — đề xuất chờ Product owner (OQ-1). Một
  task có nhiều HANDOVER theo thời gian (bàn giao lại sau từ chối), tối đa
  một HANDOVER CHO_DUYET tại một thời điểm.
- `HANDOVER.evidence_document_id` trỏ `INTAKE_DOCUMENT` — một file intake
  có thể là evidence của nhiều lần bàn giao và đính kèm của nhiều task.
- `TASK_COMMENT.edited_at/deleted_at` giữ vết mềm: sửa trong 15 phút hiển
  thị "đã sửa", xóa hiển thị "bình luận đã xóa" — bản ghi không mất hẳn
  (BR-010).
- `TASK_ACTIVITY` là vết nghiệp vụ gắn task; audit truy cập bị từ chối và
  sự kiện về quyền cũng ghi `AUDIT_EVENT` của `org-governance`.
- `WORKSPACE_MEMBER` là junction workspace–người dùng mang `member_role`;
  một người chỉ một vai trò trong một workspace.
- Retention task/comment/đính kèm/lịch sử theo vòng đời workspace và chính
  sách DPO — chờ OQ-6 PRD (spec OQ-7); ERD chưa mô hình thuộc tính
  retention.
