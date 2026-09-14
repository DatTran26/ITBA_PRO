---
type: srs-erd
feature: skill-gap-analysis
updated: 2026-09-14
---

# skill-gap-analysis — Entity Relationship Diagram

> Scope: phân tích độ phủ kỹ năng — lần phân tích (run) cho cá nhân/nhóm
> kèm snapshot provenance, thành viên được tính, kết quả từng kỹ năng có
> trạng thái và nguồn level, công thức coverage qua duyệt của business
> owner, và action sinh từ run đã xác nhận. `EMPLOYEE_PROFILE`,
> `EMPLOYEE_SKILL`, `USER`, `POSITION_FRAMEWORK`, `SKILL`,
> `SKILL_LEVEL_SCALE`, `SKILL_EVALUATION` là tham chiếu tối thiểu sang
> `employee-profiles`, `org-governance`, `talent-framework` và
> `employee-evaluation`.

## Diagram

```mermaid
erDiagram
    USER ||--o{ GAP_RUN : "tạo"
    USER ||--o{ GAP_RUN : "xác nhận"
    COVERAGE_RULE ||--o{ GAP_RUN : "áp cho"
    EMPLOYEE_PROFILE |o--o{ GAP_RUN : "là đối tượng cá nhân của"
    GAP_RUN ||--o| GAP_RUN : "được thay thế bởi"
    GAP_RUN ||--o{ GAP_RUN_MEMBER : "gồm"
    EMPLOYEE_PROFILE ||--o{ GAP_RUN_MEMBER : "được tính trong"
    POSITION_FRAMEWORK ||--o{ GAP_RUN_MEMBER : "làm chuẩn cho"
    GAP_RUN_MEMBER ||--o{ GAP_SKILL_RESULT : "gồm kết quả"
    SKILL ||--o{ GAP_SKILL_RESULT : "được đo trong"
    SKILL_LEVEL_SCALE ||--o{ GAP_SKILL_RESULT : "là level yêu cầu hoặc xác nhận"
    EMPLOYEE_SKILL |o--o{ GAP_SKILL_RESULT : "làm nguồn cho"
    SKILL_EVALUATION |o--o{ GAP_SKILL_RESULT : "xác nhận nguồn qua"
    EMPLOYEE_PROFILE ||--o{ EMPLOYEE_SKILL : "hồ sơ năng lực"
    SKILL ||--o{ EMPLOYEE_SKILL : "được ghi trong"
    SKILL_EVALUATION }o--o| EMPLOYEE_SKILL : "cập nhật"
    GAP_RUN ||--o{ GAP_ACTION : "sinh"
    GAP_SKILL_RESULT |o--o{ GAP_ACTION : "là căn cứ cho"
    USER ||--o{ GAP_ACTION : "sở hữu"
    USER ||--o{ GAP_ACTION : "tạo"
    USER ||--o{ COVERAGE_RULE : "soạn và duyệt"

    GAP_RUN {
        string run_id PK "mã lần phân tích"
        string organization_id FK "tổ chức sở hữu"
        string subject_type "đối tượng: ca-nhan hoặc nhom"
        string profile_id FK "nhân viên đối tượng khi run cá nhân, rỗng khi run nhóm"
        string unit_id "đơn vị được phân tích khi run nhóm, tham chiếu org-governance"
        string rule_id FK "phiên bản công thức coverage đã áp"
        string status "trạng thái: đã-tính, đã-xác-nhận, đã-thay-thế"
        string reviewer_user_id FK "người xác nhận run, không được là chính đối tượng"
        string review_note "ghi chú reviewer, bắt buộc khi trả run không xác nhận"
        string replaced_by_gap_run_id FK "run mới thay thế run này"
        string replace_reason "lý do đánh dấu thay thế"
        string created_by_user_id FK "người tạo run"
        datetime computed_at "thời điểm hệ thống tính xong"
        datetime reviewed_at "thời điểm reviewer xác nhận"
    }
    GAP_RUN_MEMBER {
        string member_id PK "mã thành viên trong run"
        string run_id FK "run chứa thành viên"
        string profile_id FK "nhân viên được tính"
        string framework_id FK "khung vị trí làm chuẩn cho thành viên"
        string data_status "đủ-dữ-liệu, thiếu-khung, thiếu-level-đã-xác-nhận"
        decimal coverage_percent "độ phủ của thành viên theo công thức, rỗng khi chưa đủ dữ liệu"
    }
    GAP_SKILL_RESULT {
        string gap_result_id PK "mã kết quả một kỹ năng"
        string member_id FK "thành viên được tính"
        string skill_id FK "kỹ năng trong khung đã áp"
        string required_level_id FK "level yêu cầu theo khung"
        string confirmed_level_id FK "level đã xác nhận mới nhất, rỗng khi chưa đánh giá"
        string gap_status "trạng thái: đạt, dưới-yêu-cầu, vượt, chưa-đánh-giá"
        boolean is_mandatory "kỹ năng bắt buộc theo khung"
        string employee_skill_id FK "bản ghi kỹ năng hồ sơ làm nguồn, rỗng khi chưa đánh giá"
        string skill_eval_id FK "kết quả đánh giá xác nhận level nguồn nếu có"
        datetime source_confirmed_at "thời điểm level nguồn được xác nhận"
        boolean is_stale "dữ liệu cũ theo ngưỡng tại thời điểm tính"
    }
    COVERAGE_RULE {
        string rule_id PK "mã công thức coverage"
        string organization_id FK "tổ chức sở hữu"
        int version_no "phiên bản công thức"
        string name "tên công thức"
        string description "cách tính %, trọng số kỹ năng bắt buộc, xử lý chưa-đánh-giá"
        string status "vòng đời: bản-nháp, chờ-duyệt, đã-công-bố, ngừng-dùng"
        string created_by_user_id FK "người soạn công thức"
        string approved_by_user_id FK "business owner duyệt"
        datetime published_at "thời điểm công bố"
    }
    GAP_ACTION {
        string action_id PK "mã hành động"
        string run_id FK "run đã xác nhận sinh action"
        string gap_skill_result_id FK "dòng gap làm căn cứ, rỗng khi action cả nhóm"
        string action_type "loại: đào-tạo, điều-phối, đánh-giá-bổ-sung"
        string description "mô tả hành động"
        string owner_user_id FK "người chịu trách nhiệm thực hiện"
        date due_date "hạn hoàn tất, ngày tương lai nếu có"
        string status "trạng thái: mở, đang-làm, xong, hủy"
        string cancel_reason "lý do hủy nếu có"
        string created_by_user_id FK "người tạo action"
        datetime created_at "thời điểm tạo"
        datetime closed_at "thời điểm đóng"
    }
    EMPLOYEE_PROFILE {
        string profile_id PK "mã hồ sơ nhân viên, thuộc employee-profiles"
        string full_name "họ tên"
        string position_id FK "vị trí hiện tại, suy khung mặc định"
        string manager_id FK "quản lý trực tiếp, làm reviewer mặc định"
    }
    EMPLOYEE_SKILL {
        string profile_id FK "hồ sơ được gắn kỹ năng, thuộc employee-profiles"
        string skill_id FK "kỹ năng trong taxonomy"
        string level "trình độ đã xác nhận theo thang chung"
        string status "nguồn ghi nhận: tự khai hoặc đã xác nhận"
    }
    SKILL_EVALUATION {
        string skill_eval_id PK "mã kết quả đánh giá một kỹ năng, thuộc employee-evaluation"
        string employee_skill_id FK "kỹ năng hồ sơ được cập nhật"
        string confirmed_level_id FK "level reviewer đã xác nhận"
        datetime confirmed_at "thời điểm xác nhận"
    }
    POSITION_FRAMEWORK {
        string framework_id PK "mã khung kỳ vọng vị trí, thuộc talent-framework"
        string position_id "vị trí áp khung"
        string status "chỉ bản đã-công-bố được làm chuẩn"
    }
    SKILL {
        string skill_id PK "mã kỹ năng, thuộc talent-framework"
        string name "tên kỹ năng"
    }
    SKILL_LEVEL_SCALE {
        string level_id PK "mã mức trên thang chung, thuộc talent-framework"
        int level_no "thứ tự mức"
        string name "tên mức"
    }
    USER {
        string user_id PK "mã người dùng, thuộc account-access/org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| GAP_RUN | Lần phân tích — đối tượng cá nhân/nhóm, chuẩn và công thức đã áp, trạng thái review, provenance thay thế | subject_type, rule_id, status, reviewer_user_id, computed_at, replaced_by_gap_run_id |
| GAP_RUN_MEMBER | Thành viên được tính trong run — khung áp riêng, trạng thái đủ/thiếu dữ liệu, % coverage cá nhân | profile_id, framework_id, data_status, coverage_percent |
| GAP_SKILL_RESULT | Kết quả một kỹ năng của một thành viên — yêu cầu vs đã xác nhận, trạng thái gap, nguồn và nhãn dữ liệu cũ | required_level_id, confirmed_level_id, gap_status, is_mandatory, is_stale |
| COVERAGE_RULE | Công thức tính độ phủ có phiên bản — qua duyệt của business owner, chỉ bản đã công bố được áp | version_no, status, approved_by_user_id, published_at |
| GAP_ACTION | Hành động từ run đã xác nhận — đào tạo/điều phối/đánh giá bổ sung có owner, hạn, trạng thái | action_type, owner_user_id, due_date, status |
| EMPLOYEE_PROFILE | Hồ sơ nhân viên — tham chiếu từ `employee-profiles`; suy khung mặc định qua `position_id` | profile_id, position_id, manager_id |
| EMPLOYEE_SKILL | Kỹ năng trên hồ sơ năng lực — nguồn level "đã xác nhận" duy nhất vào tính coverage, thuộc `employee-profiles` | profile_id, skill_id, level, status |
| SKILL_EVALUATION | Kết quả đánh giá đã xác nhận level — evidence drill sâu hơn, thuộc `employee-evaluation` | skill_eval_id, confirmed_level_id, confirmed_at |
| POSITION_FRAMEWORK | Khung vị trí làm chuẩn so sánh — tham chiếu từ `talent-framework` | framework_id, status |
| SKILL | Kỹ năng được đo trong khung — tham chiếu từ `talent-framework` | skill_id, name |
| SKILL_LEVEL_SCALE | Mức trên thang chung làm yêu cầu/đã xác nhận — tham chiếu từ `talent-framework` | level_id, level_no |
| USER | Người dùng nội bộ (HR, quản lý, owner, reviewer) — tham chiếu từ `account-access`/`org-governance` | user_id, display_name |

## Notes & Assumptions

- `GAP_RUN.status` theo vòng đời trong brainstorm Mục 6.3: đã-tính →
  đã-xác-nhận → đã-thay-thế (self-ref `replaced_by_gap_run_id`, immutable sau
  xác nhận — bản mới là run mới, không ghi đè).
- `GAP_RUN_MEMBER` gom cả run cá nhân (một member) lẫn run nhóm (tối đa
  300 — đề xuất OQ-5): `data_status` tách "đủ-dữ-liệu" khỏi "thiếu-khung"
  và "thiếu-level-đã-xác-nhận" để thành viên thiếu dữ liệu không vào mẫu
  tính (BR-skill-gap-analysis-003, D7).
- `GAP_RUN_MEMBER.framework_id` ghi khung đã áp cho từng thành viên —
  với run nhóm nhiều vị trí, mỗi người so với khung của mình; với run cá
  nhân có thể là khung vị trí khác (chuẩn tham chiếu, OQ-7).
- `GAP_SKILL_RESULT.employee_skill_id` và `skill_eval_id` rỗng khi
  `gap_status = chưa-đánh-giá` — không suy level 0 (BR-skill-gap-analysis-003);
  khi có, chúng là evidence truy nguyên sang `employee-profiles` và
  `employee-evaluation` (FR-skill-gap-analysis-004).
- `GAP_RUN.rule_id` chốt phiên bản `COVERAGE_RULE` "đã-công-bố" tại thời
  điểm tính (BR-skill-gap-analysis-001); công thức có vòng đời duyệt giống khung
  của `talent-framework`, `approved_by_user_id` là business owner (R-13, OQ-11 —
  đề xuất chờ Head of HR).
- `GAP_ACTION.run_id` trỏ run "đã-xác-nhận" bắt buộc (BR-skill-gap-analysis-004);
  `gap_skill_result_id` rỗng khi action áp cho cả nhóm thay vì một dòng gap.
- `GAP_RUN.unit_id` là tham chiếu đơn vị tổ chức sang `org-governance`
  (thuộc tính, không phải entity của feature này); scope enforcement và
  audit truy cập nằm ở `org-governance`.
- `EMPLOYEE_PROFILE`, `EMPLOYEE_SKILL`, `SKILL_EVALUATION`,
  `POSITION_FRAMEWORK`, `SKILL`, `SKILL_LEVEL_SCALE`, `USER` khai tối
  thiểu vì thuộc các feature khác; feature này chỉ ĐỌC nguồn ngoài
  (NFR-skill-gap-analysis-003), quan hệ vật lý đầy đủ nằm trong ERD feature sở
  hữu.
