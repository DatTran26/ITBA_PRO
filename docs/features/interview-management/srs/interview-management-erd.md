---
type: srs-erd
feature: interview-management
updated: 2026-09-14
---

# interview-management — Entity Relationship Diagram

> Scope: phiên phỏng vấn của một application — lịch, participant và phản
> hồi, đề xuất đổi lịch, lịch sử thay đổi phiên và context tham chiếu (CV
> đã xác nhận, câu hỏi gợi ý). `APPLICATION`, `USER`, `QUESTION`,
> `CV_DOCUMENT` là tham chiếu tối thiểu sang feature khác
> (`candidate-pipeline`, `org-governance`, `question-bank`, `cv-intake`).

## Diagram

```mermaid
erDiagram
    APPLICATION ||--o{ INTERVIEW_SESSION : "được xếp phiên"
    USER ||--o{ INTERVIEW_SESSION : "tạo"
    CV_DOCUMENT ||--o{ INTERVIEW_SESSION : "làm context CV"
    INTERVIEW_SESSION ||--o{ SESSION_PARTICIPANT : "có participant"
    USER ||--o{ SESSION_PARTICIPANT : "được gán"
    INTERVIEW_SESSION ||--o{ RESCHEDULE_PROPOSAL : "nhận đề xuất"
    SESSION_PARTICIPANT ||--o{ RESCHEDULE_PROPOSAL : "gửi đề xuất"
    USER |o--o{ RESCHEDULE_PROPOSAL : "chốt"
    INTERVIEW_SESSION ||--o{ SESSION_EVENT : "ghi lịch sử"
    USER |o--o{ SESSION_EVENT : "thực hiện"
    INTERVIEW_SESSION ||--o{ SESSION_QUESTION : "gợi ý câu hỏi"
    QUESTION ||--o{ SESSION_QUESTION : "được gợi ý"

    INTERVIEW_SESSION {
        string session_id PK "mã phiên phỏng vấn"
        string application_id FK "application trên pipeline"
        int round_no "số vòng phỏng vấn, bắt đầu từ 1"
        string status "chờ xác nhận, đã xác nhận, cần gán lại, đã hủy, hoàn thành, ứng viên vắng"
        string mode "hình thức: trực tuyến, trực tiếp, điện thoại"
        string location "địa điểm khi trực tiếp"
        string meeting_link "link họp khi trực tuyến"
        datetime scheduled_start "giờ bắt đầu đang hiệu lực"
        datetime scheduled_end "giờ kết thúc đang hiệu lực"
        string timezone "múi giờ tổ chức tại thời điểm tạo"
        int reschedule_count "số lần đã đổi lịch"
        string cancel_reason "lý do hủy phiên"
        string outcome "kết quả diễn ra: hoàn thành, ứng viên vắng, hủy sát giờ"
        string cv_document_id FK "CV đã xác nhận làm context"
        string jd_reference "tham chiếu JD vị trí từ recruitment-planning"
        string created_by_user_id FK "người tạo phiên"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
        datetime completed_at "thời điểm ghi nhận kết quả diễn ra"
    }
    SESSION_PARTICIPANT {
        string participant_id PK "mã participant"
        string session_id FK "phiên được gán"
        string user_id FK "người được gán"
        string participant_role "vai trò trong phiên: interviewer, observer"
        string response_status "chờ phản hồi, chấp nhận, từ chối, đề xuất đổi lịch"
        string decline_reason "lý do từ chối thư mời"
        datetime invited_at "thời điểm gửi thư mời"
        datetime responded_at "thời điểm phản hồi"
    }
    RESCHEDULE_PROPOSAL {
        string proposal_id PK "mã đề xuất đổi lịch"
        string session_id FK "phiên bị đề xuất đổi"
        string participant_id FK "participant gửi đề xuất"
        datetime proposed_start "giờ bắt đầu đề xuất"
        datetime proposed_end "giờ kết thúc đề xuất"
        string note "ghi chú của người đề xuất"
        string status "đang chờ, đã chốt, bị từ chối, hết hiệu lực"
        string resolved_by_user_id FK "HR xử lý đề xuất"
        datetime created_at "thời điểm gửi đề xuất"
        datetime resolved_at "thời điểm HR quyết định"
    }
    SESSION_EVENT {
        string event_id PK "mã sự kiện phiên"
        string session_id FK "phiên bị thay đổi"
        string event_type "loại: tạo, đổi lịch, gán, gỡ, hủy, ghi nhận kết quả"
        string actor_user_id FK "người thực hiện, rỗng khi nguồn hệ thống"
        string reason "lý do khi hành động bắt buộc lý do"
        string previous_value "giá trị trước dạng chuỗi, vd giờ cũ"
        string new_value "giá trị sau dạng chuỗi, vd giờ mới"
        datetime created_at "thời điểm ghi sự kiện"
    }
    SESSION_QUESTION {
        string session_id FK "phiên có gợi ý"
        string question_id FK "câu hỏi đã duyệt từ question-bank"
        string added_by_user_id FK "người gắn câu hỏi vào context"
        datetime created_at "thời điểm gắn"
    }
    APPLICATION {
        string application_id PK "mã application, thuộc candidate-pipeline"
        string stage "stage hiện tại của application"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
    QUESTION {
        string question_id PK "mã câu hỏi, thuộc question-bank"
        string content "nội dung câu hỏi đã duyệt"
    }
    CV_DOCUMENT {
        string document_id PK "mã tài liệu CV, thuộc cv-intake"
        string title "tên file CV đã xác nhận"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| INTERVIEW_SESSION | Phiên phỏng vấn của một application — vòng đời chờ xác nhận → đã xác nhận → hoàn thành/vắng, hoặc cần gán lại/đã hủy | application_id, round_no, status, mode, scheduled_start, scheduled_end, outcome, reschedule_count |
| SESSION_PARTICIPANT | Interviewer/observer được gán vào phiên với trạng thái phản hồi riêng | participant_role, response_status, decline_reason, invited_at, responded_at |
| RESCHEDULE_PROPOSAL | Đề xuất đổi lịch của participant chờ HR chốt hoặc từ chối | proposed_start, proposed_end, status, resolved_by_user_id |
| SESSION_EVENT | Lịch sử mọi thay đổi phiên — audit trước → sau kèm actor và lý do | event_type, actor_user_id, reason, previous_value, new_value |
| SESSION_QUESTION | Junction phiên ↔ câu hỏi đã duyệt làm gợi ý context | session_id, question_id, added_by_user_id |
| APPLICATION | Application trên pipeline — tham chiếu tối thiểu từ `candidate-pipeline`, quyết định cho phép tạo phiên theo stage | application_id, stage |
| USER | Người dùng nội bộ — tham chiếu tối thiểu từ `org-governance` | user_id, display_name |
| QUESTION | Câu hỏi đã duyệt — tham chiếu tối thiểu từ `question-bank` | question_id, content |
| CV_DOCUMENT | CV đã xác nhận của ứng viên — tham chiếu tối thiểu từ `cv-intake` | document_id, title |

## Notes & Assumptions

- `INTERVIEW_SESSION.status` là state machine của phiên (xem spec Mục 5
  và brainstorm 6.3); `SESSION_PARTICIPANT.response_status` là state
  machine riêng của participant — đổi lịch phiên đưa toàn bộ participant
  về "chờ phản hồi" cho giờ mới.
- `SESSION_EVENT.actor_user_id` rỗng cho sự kiện nguồn hệ thống (vd hết
  hạn phản hồi, vô hiệu participant); `previous_value`/`new_value` giữ
  dạng chuỗi để chứa cặp giờ cũ → mới và các thay đổi khác.
- `jd_reference` là tham chiếu JD vị trí lấy qua application — giữ trên
  phiên để context không lệch khi JD đổi sau; entity JD đầy đủ thuộc
  `recruitment-planning`.
- `RESCHEDULE_PROPOSAL.status` "hết hiệu lực" áp khi phiên bị hủy hoặc
  đổi giờ trước khi đề xuất được xử lý (brainstorm Mục 6.4).
- `APPLICATION`, `USER`, `QUESTION`, `CV_DOCUMENT` chỉ khai tối thiểu
  phục vụ quan hệ — entity đầy đủ thuộc ERD của `candidate-pipeline`,
  `org-governance`, `question-bank`, `cv-intake`.
- Consent ghi âm và file recording không nằm trong ERD này — thuộc
  `interview-recording` (PRD Mục 7.24).
- Retention: phiên, participant và event giữ theo retention hồ sơ tuyển
  dụng chung; xóa/anonymize cùng application (PRD OQ-6 — chờ DPO).
