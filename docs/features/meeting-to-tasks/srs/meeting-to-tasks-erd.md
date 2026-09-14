---
type: srs-erd
feature: meeting-to-tasks
updated: 2026-09-14
---

# meeting-to-tasks — Entity Relationship Diagram

> Scope: bản ghi chuyển đổi đầu việc đã xác nhận thành task có owner, hạn,
> ưu tiên và link nguồn (PRD Mục 7.15). `PROPOSAL_ITEM` thuộc
> `ai-meeting-minutes`; `MINUTES`, `MEETING` thuộc `meeting-records`;
> `WORKSPACE`, `BOARD`, `TASK` thuộc `kanban-workspaces`; `APP_USER` thuộc
> `account-access` — chỉ khai tối thiểu để tham chiếu.

## Diagram

```mermaid
erDiagram
    PROPOSAL_ITEM ||--o| ACTION_CONVERSION : "được chuyển thành"
    MEETING ||--o{ ACTION_CONVERSION : "là nguồn cuộc họp"
    MINUTES ||--o{ ACTION_CONVERSION : "là nguồn biên bản"
    APP_USER ||--o{ ACTION_CONVERSION : "khởi tạo chuyển đổi"
    APP_USER ||--o{ ACTION_CONVERSION : "được giao làm assignee"
    WORKSPACE ||--o{ ACTION_CONVERSION : "là workspace đích"
    BOARD ||--o{ ACTION_CONVERSION : "vào board đích"
    ACTION_CONVERSION ||--o| TASK : "tạo ra"
    WORKSPACE ||--o{ BOARD : "chứa"
    BOARD ||--o{ TASK : "chứa"

    ACTION_CONVERSION {
        string id PK "mã bản ghi chuyển đổi"
        string action_item_id FK "đầu việc nguồn, thuộc ai-meeting-minutes"
        string meeting_id FK "cuộc họp nguồn"
        string minutes_id FK "biên bản nguồn"
        string status "trạng thái: chưa tạo task, đã tạo task, đã bỏ qua"
        string title "tiêu đề task đã chốt"
        string description "mô tả task"
        string assignee_id FK "người phụ trách nội bộ đã resolve"
        date due_date "hạn task, trống nếu không có"
        string priority "mức ưu tiên: thấp, trung bình, cao, khẩn"
        string workspace_id FK "workspace đích"
        string board_id FK "board đích"
        string task_id FK "task được tạo, thuộc kanban-workspaces"
        string skip_reason "lý do bỏ qua, bắt buộc khi status = đã bỏ qua"
        boolean source_stale "cờ nguồn đã cập nhật khi đầu việc bị sửa"
        string created_by FK "chủ trì khởi tạo chuyển đổi"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật"
    }

    PROPOSAL_ITEM {
        string id PK "mã mục đề xuất, thuộc ai-meeting-minutes"
        string item_type "loại mục, chỉ loại đầu việc được chuyển đổi"
        string person_status "đối chiếu người: RESOLVED, UNRESOLVED"
        string resolved_user_id FK "người nội bộ đã resolve"
    }

    MEETING {
        string id PK "mã cuộc họp, thuộc meeting-records"
        string title "tiêu đề cuộc họp"
        string status "trạng thái cuộc họp"
    }

    MINUTES {
        string id PK "mã biên bản, thuộc meeting-records"
        string meeting_id FK "thuộc cuộc họp"
        string status "trạng thái biên bản"
    }

    WORKSPACE {
        string id PK "mã workspace, thuộc kanban-workspaces"
        string name "tên workspace"
    }

    BOARD {
        string id PK "mã board, thuộc kanban-workspaces"
        string workspace_id FK "thuộc workspace"
        string name "tên board"
    }

    TASK {
        string id PK "mã task, thuộc kanban-workspaces"
        string board_id FK "thuộc board"
        string title "tiêu đề task"
        string status "trạng thái task"
    }

    APP_USER {
        string id PK "mã người dùng nội bộ, thuộc account-access"
        string name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| ACTION_CONVERSION | Bản ghi chuyển đổi một đầu việc thành task — trạng thái, nội dung đã chốt, đích, link nguồn và task được tạo | action_item_id, status, assignee_id, due_date, priority, workspace_id, board_id, task_id, source_stale |
| PROPOSAL_ITEM | Đầu việc nguồn đã xác nhận — entity của `ai-meeting-minutes`, chỉ loại "đầu việc" được chuyển đổi | item_type, person_status, resolved_user_id |
| MEETING | Cuộc họp nguồn của link truy nguyên — entity của `meeting-records` | id, title, status |
| MINUTES | Biên bản nguồn PUBLISHED — entity của `meeting-records` | id, meeting_id, status |
| WORKSPACE | Workspace đích do chủ trì chọn — entity của `kanban-workspaces` | id, name |
| BOARD | Board đích chứa task — entity của `kanban-workspaces` | id, workspace_id, name |
| TASK | Task được tạo trên board — entity của `kanban-workspaces`, vòng đời do feature đó quản lý | id, board_id, title, status |
| APP_USER | Người dùng nội bộ: chủ trì khởi tạo và assignee — entity của `account-access` | id, name |

## Notes & Assumptions

- Một đầu việc có tối đa 1 ACTION_CONVERSION (quan hệ `||--o|`): trạng thái
  chuyển đổi (chưa tạo/đã tạo/bỏ qua) nằm trên một bản ghi duy nhất; khi task
  nguồn bị xóa, bản ghi quay về "chưa tạo task" và `task_id` trống để cho
  tạo lại — lịch sử các lần tạo nằm ở audit log, không tách entity.
- `meeting_id` + `minutes_id` được giữ trực tiếp trên ACTION_CONVERSION để
  link nguồn hai chiều không phụ thuộc truy vấn dây chuyền — đây là chốt
  chống rủi ro "task mất liên kết biên bản" của PRD Mục 7.15 (BR-009).
- `assignee_id` chỉ trỏ APP_USER — khách ngoài (participant không tài khoản)
  không thể làm assignee task; đầu việc đó chuyển "đã bỏ qua" kèm lý do
  (BR-002, FR-012).
- `source_stale` bật khi đầu việc nguồn bị sửa trong revision biên bản sau
  khi task tạo; cờ chỉ tắt khi có người xác nhận đã đối chiếu — không
  auto-sync nội dung (BR-005, bám PRD OQ-9).
- `skip_reason` bắt buộc khi `status = đã bỏ qua` (BR-008).
- Quan hệ `WORKSPACE ||--o{ BOARD ||--o{ TASK` khai tối thiểu để đủ ngữ cảnh
  đích; model đầy đủ (column, comment, handover) thuộc ERD của
  `kanban-workspaces`.
- Điều kiện "chỉ đầu việc của biên bản PUBLISHED" và "tối đa 1 task còn hiệu
  lực mỗi đầu việc" là ràng buộc nghiệp vụ kiểm khi tạo, không thể hiện trên
  ERD.
