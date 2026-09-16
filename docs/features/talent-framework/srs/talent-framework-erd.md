---
type: srs-erd
feature: talent-framework
updated: 2026-09-14
---

# talent-framework — Entity Relationship Diagram

> Scope: taxonomy kỹ năng của một tổ chức — nhóm kỹ năng, kỹ năng, thang
> level chung, mô tả hành vi từng mức, khung kỳ vọng vị trí, đề xuất kỹ
> năng và yêu cầu/quyết định duyệt. `POSITION`, `USER` là tham chiếu sang
> feature khác (`employee-profiles`/`org-governance`, `account-access`).

## Diagram

```mermaid
erDiagram
    SKILL_CATEGORY ||--o{ SKILL : "gom nhóm"
    USER ||--o{ SKILL : "soạn và công bố"
    SKILL ||--o{ SKILL_LEVEL_DESCRIPTOR : "mô tả hành vi từng mức"
    SKILL_LEVEL_SCALE ||--o{ SKILL_LEVEL_DESCRIPTOR : "được mô tả ở"
    POSITION ||--o{ POSITION_FRAMEWORK : "có các phiên bản khung"
    POSITION_FRAMEWORK ||--o{ POSITION_FRAMEWORK_ITEM : "gồm yêu cầu"
    SKILL ||--o{ POSITION_FRAMEWORK_ITEM : "xuất hiện trong khung"
    SKILL_LEVEL_SCALE ||--o{ POSITION_FRAMEWORK_ITEM : "là mức yêu cầu"
    USER ||--o{ POSITION_FRAMEWORK : "phụ trách làm owner"
    USER ||--o{ SKILL_PROPOSAL : "gửi đề xuất"
    SKILL_PROPOSAL }o--o| SKILL : "được duyệt thành"
    SKILL ||--o{ REVIEW_REQUEST : "được duyệt qua"
    POSITION_FRAMEWORK ||--o{ REVIEW_REQUEST : "được duyệt qua"
    SKILL_PROPOSAL ||--o{ REVIEW_REQUEST : "được duyệt qua"
    USER ||--o{ REVIEW_REQUEST : "gửi và quyết định"

    SKILL_CATEGORY {
        string category_id PK "mã nhóm kỹ năng"
        string organization_id FK "tổ chức sở hữu taxonomy"
        string name "tên nhóm kỹ năng"
        string description "mô tả phạm vi nhóm"
        datetime created_at "thời điểm tạo"
    }
    SKILL {
        string skill_id PK "mã kỹ năng"
        string organization_id FK "tổ chức sở hữu"
        string category_id FK "nhóm kỹ năng chứa kỹ năng"
        string name "tên kỹ năng, duy nhất toàn taxonomy"
        string description "mô tả kỹ năng"
        string status "vòng đời: bản-nháp, chờ-duyệt, đã-công-bố, ngừng-dùng"
        string source_type "nguồn tạo: soạn thủ công, import, đề xuất quản lý"
        string created_by_user_id FK "người tạo kỹ năng"
        string published_by_user_id FK "người công bố bản hiệu lực"
        string retired_reason "lý do ngừng dùng"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    SKILL_LEVEL_SCALE {
        string level_id PK "mã mức trên thang chung"
        string organization_id FK "tổ chức sở hữu thang"
        int level_no "thứ tự mức, đề xuất 1-5"
        string name "tên mức"
        string description "mô tả ý nghĩa mức"
        boolean is_locked "khóa chỉnh khi đã có tham chiếu"
    }
    SKILL_LEVEL_DESCRIPTOR {
        string descriptor_id PK "mã mô tả level"
        string skill_id FK "kỹ năng được mô tả"
        string level_id FK "mức trên thang chung"
        string behavior_description "hành vi mong đợi của kỹ năng ở mức này"
    }
    POSITION {
        string position_id PK "mã vị trí, thuộc employee-profiles/org-governance"
        string name "tên vị trí"
    }
    POSITION_FRAMEWORK {
        string framework_id PK "mã khung kỳ vọng vị trí"
        string organization_id FK "tổ chức sở hữu"
        string position_id FK "vị trí áp khung"
        int version_no "phiên bản khung, bản mới thay bản cũ khi công bố"
        string status "vòng đời: bản-nháp, chờ-duyệt, đã-công-bố, ngừng-dùng"
        string business_owner_user_id FK "owner chịu trách nhiệm khung, bắt buộc trước công bố"
        string created_by_user_id FK "người soạn khung"
        string published_by_user_id FK "người công bố"
        datetime published_at "thời điểm công bố bản hiệu lực"
        datetime created_at "thời điểm tạo"
    }
    POSITION_FRAMEWORK_ITEM {
        string item_id PK "mã dòng yêu cầu trong khung"
        string framework_id FK "khung chứa dòng"
        string skill_id FK "kỹ năng yêu cầu, phải ở trạng thái đã công bố"
        string level_id FK "level yêu cầu trên thang chung"
        boolean is_mandatory "cờ kỹ năng bắt buộc của vị trí"
        int display_order "thứ tự hiển thị trong khung"
    }
    SKILL_PROPOSAL {
        string proposal_id PK "mã đề xuất kỹ năng"
        string organization_id FK "tổ chức sở hữu"
        string proposed_name "tên kỹ năng đề xuất"
        string category_id FK "nhóm kỹ năng gợi ý"
        string description "mô tả kỹ năng đề xuất"
        string reason "lý do cần kỹ năng này"
        string status "trạng thái: chờ xử lý, được duyệt, từ chối"
        string proposed_by_user_id FK "quản lý gửi đề xuất"
        string skill_id FK "kỹ năng được tạo nếu đề xuất được duyệt"
        datetime created_at "thời điểm gửi đề xuất"
    }
    REVIEW_REQUEST {
        string review_id PK "mã yêu cầu duyệt"
        string organization_id FK "tổ chức sở hữu"
        string target_type "đối tượng duyệt: kỹ năng, khung vị trí, đề xuất kỹ năng"
        string target_id "mã đối tượng chờ duyệt, đa hình theo target_type"
        string submitted_by_user_id FK "người gửi duyệt"
        string reviewer_user_id FK "business owner phụ trách duyệt"
        string status "trạng thái: chờ duyệt, đã quyết định, rút lại"
        string decision "quyết định: công bố hoặc yêu cầu chỉnh"
        string note "ghi chú người duyệt, bắt buộc khi yêu cầu chỉnh"
        boolean self_approved "đánh dấu owner tự duyệt nội dung mình soạn"
        datetime submitted_at "thời điểm gửi duyệt"
        datetime decided_at "thời điểm quyết định"
    }
    USER {
        string user_id PK "mã người dùng, thuộc account-access/org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| SKILL_CATEGORY | Nhóm kỹ năng tầng một của taxonomy thuộc tổ chức | name, description |
| SKILL | Kỹ năng trong taxonomy — định danh, phân loại, vòng đời duyệt và provenance | name, category_id, status, source_type, retired_reason |
| SKILL_LEVEL_SCALE | Thang cấp độ chung của tổ chức (đề xuất 5 mức); khóa khi đã có tham chiếu | level_no, name, is_locked |
| SKILL_LEVEL_DESCRIPTOR | Mô tả hành vi mong đợi của một kỹ năng ở một mức cụ thể | skill_id, level_id, behavior_description |
| POSITION | Vị trí mà khung kỳ vọng gắn vào — tham chiếu từ `employee-profiles`/`org-governance` | position_id, name |
| POSITION_FRAMEWORK | Khung kỳ vọng của một vị trí theo phiên bản; mỗi vị trí ≤1 bản "đã-công-bố" | position_id, version_no, status, business_owner_user_id |
| POSITION_FRAMEWORK_ITEM | Một dòng yêu cầu trong khung: kỹ năng + level yêu cầu + cờ bắt buộc | skill_id, level_id, is_mandatory |
| SKILL_PROPOSAL | Đề xuất kỹ năng mới của quản lý chờ owner xử lý | proposed_name, reason, status, proposed_by_user_id, skill_id |
| REVIEW_REQUEST | Yêu cầu duyệt và quyết định của business owner — đa hình theo đối tượng | target_type, target_id, reviewer_user_id, decision, note, self_approved |
| USER | Người dùng nội bộ — tham chiếu từ `account-access`/`org-governance` | user_id, display_name |

## Notes & Assumptions

- `SKILL.status` và `POSITION_FRAMEWORK.status` chia sẻ vòng đời bản-nháp →
  chờ-duyệt → đã-công-bố → ngừng-dùng; chỉ bản "đã-công-bố" được module
  khác tham chiếu (BR-talent-framework-001). Nội dung sửa sau công bố đi
  qua `REVIEW_REQUEST` mới trong khi bản cũ vẫn là chuẩn (BR-004).
- `REVIEW_REQUEST.target_id` là tham chiếu đa hình tới `SKILL`,
  `POSITION_FRAMEWORK` hoặc `SKILL_PROPOSAL` tùy `target_type` — mức
  requirement giữ một hàng chờ duy nhất cho owner; quyết định chi tiết
  chuẩn hóa ở tầng thiết kế.
- `POSITION_FRAMEWORK.business_owner_user_id` bắt buộc trước khi khung
  được công bố (BR-talent-framework-002, R-13); `REVIEW_REQUEST.
  reviewer_user_id` là owner thực tế ra quyết định, `self_approved` ghi
  nhận trường hợp owner tự duyệt nội dung mình soạn (đề xuất — chờ Head
  of HR, OQ-4).
- `SKILL_LEVEL_SCALE.is_locked` chặn sửa thang trực tiếp khi đã có
  `SKILL_LEVEL_DESCRIPTOR`/`POSITION_FRAMEWORK_ITEM` tham chiếu; đổi thang
  qua quy trình migrate riêng (đề xuất — OQ-7).
- `POSITION` khai tối thiểu vì thuộc `employee-profiles`/`org-governance`;
  `USER` khai tối thiểu vì thuộc `account-access`/`org-governance`. Kỹ
  năng của từng nhân viên (`PERSON_SKILL`) thuộc `employee-profiles` và
  không vẽ ở đây.
