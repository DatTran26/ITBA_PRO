---
type: srs-erd
feature: ai-meeting-minutes
updated: 2026-09-14
---

# ai-meeting-minutes — Entity Relationship Diagram

> Scope: job sinh biên bản AI, bản đề xuất biên bản, các mục đề xuất kèm
> trích dẫn transcript và đối chiếu người phụ trách (PRD Mục 7.14).
> `TRANSCRIPT`, `TRANSCRIPT_SEGMENT`, `MEETING`, `MEETING_PARTICIPANT`,
> `MINUTES` thuộc `meeting-records`; `APP_USER` thuộc `account-access` —
> chỉ khai tối thiểu để tham chiếu.

## Diagram

```mermaid
erDiagram
    TRANSCRIPT ||--o{ MINUTES_JOB : "là đầu vào"
    APP_USER ||--o{ MINUTES_JOB : "kích hoạt"
    MINUTES_JOB ||--o| MINUTES_PROPOSAL : "tạo ra"
    MEETING ||--o{ MINUTES_PROPOSAL : "có các bản đề xuất"
    APP_USER ||--o{ MINUTES_PROPOSAL : "xác nhận"
    MINUTES_PROPOSAL ||--o| MINUTES : "xuất bản thành"
    MINUTES_PROPOSAL ||--o{ PROPOSAL_ITEM : "gồm các mục"
    PROPOSAL_ITEM ||--o{ ITEM_EVIDENCE : "có trích dẫn"
    TRANSCRIPT_SEGMENT ||--o{ ITEM_EVIDENCE : "được trích dẫn"
    APP_USER ||--o{ PROPOSAL_ITEM : "được gán phụ trách"
    MEETING_PARTICIPANT ||--o{ PROPOSAL_ITEM : "được gán là người tham gia phụ trách"

    MINUTES_JOB {
        string id PK "mã job sinh biên bản"
        string transcript_id FK "transcript đầu vào"
        string status "trạng thái: QUEUED, PROCESSING, READY, FAILED"
        int retry_count "số lần đã chạy lại"
        string error_reason "lý do lỗi khi FAILED"
        string created_by FK "chủ trì kích hoạt job"
        datetime processed_at "thời điểm xử lý xong"
        datetime created_at "thời điểm tạo job"
    }

    MINUTES_PROPOSAL {
        string id PK "mã bản đề xuất"
        string meeting_id FK "thuộc cuộc họp"
        string job_id FK "job đã sinh bản này"
        string summary "tóm tắt cuộc họp do AI đề xuất"
        string status "vòng đời: PROPOSED, REVIEWING, CONFIRMED, DISCARDED, SUPERSEDED"
        boolean is_stale "cờ lệch nguồn khi transcript thay đổi"
        string confirmed_by FK "chủ trì xác nhận biên bản"
        datetime confirmed_at "thời điểm xác nhận"
        string published_minutes_id FK "biên bản được xuất bản trên record"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật"
    }

    PROPOSAL_ITEM {
        string id PK "mã mục đề xuất"
        string proposal_id FK "thuộc bản đề xuất"
        string item_type "loại: tóm tắt, quyết định, vấn đề mở, rủi ro, đầu việc"
        string proposed_content "nội dung AI đề xuất"
        string final_content "nội dung sau khi chủ trì sửa"
        string review_state "trạng thái review: đề xuất, đã giữ, đã sửa, bị loại, thêm tay"
        string source "nguồn mục: AI đề xuất hoặc thêm tay"
        string suggested_person_name "tên người AI trích nguyên văn"
        string person_status "đối chiếu người: RESOLVED, UNRESOLVED"
        string resolved_user_id FK "người nội bộ được gán phụ trách"
        string resolved_participant_id FK "participant cuộc họp được gán phụ trách"
        date due_date "hạn đề xuất cho đầu việc, trống nếu AI không trích được"
        int display_order "thứ tự hiển thị trong bản"
    }

    ITEM_EVIDENCE {
        string id PK "mã trích dẫn"
        string item_id FK "mục được dẫn chứng"
        string segment_id FK "đoạn transcript nguồn"
        string quote "trích đoạn ngắn hiển thị"
    }

    TRANSCRIPT {
        string id PK "mã transcript, thuộc meeting-records"
        string status "trạng thái xử lý transcript"
    }

    TRANSCRIPT_SEGMENT {
        string id PK "mã đoạn transcript, thuộc meeting-records"
        string content "nội dung đoạn lời nói"
    }

    MEETING {
        string id PK "mã cuộc họp, thuộc meeting-records"
        string title "tiêu đề cuộc họp"
        string status "trạng thái cuộc họp"
    }

    MEETING_PARTICIPANT {
        string id PK "mã người tham gia, thuộc meeting-records"
        string meeting_id FK "thuộc cuộc họp"
        string user_id FK "người dùng nội bộ, trống nếu khách ngoài"
        string guest_name "tên khách ngoài không có tài khoản"
        string role "vai trò trong cuộc họp"
    }

    MINUTES {
        string id PK "mã biên bản, thuộc meeting-records"
        string meeting_id FK "thuộc cuộc họp"
        string status "trạng thái biên bản"
    }

    APP_USER {
        string id PK "mã người dùng nội bộ, thuộc account-access"
        string name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| MINUTES_JOB | Một lần sinh biên bản AI từ transcript — trạng thái và retry | transcript_id, status, retry_count, created_by |
| MINUTES_PROPOSAL | Bản đề xuất biên bản của một job — vòng đời review đến publish | meeting_id, job_id, summary, status, is_stale, confirmed_by, published_minutes_id |
| PROPOSAL_ITEM | Một mục trong bản đề xuất — nội dung AI vs nội dung đã sửa, người và hạn đề xuất | item_type, proposed_content, final_content, review_state, suggested_person_name, person_status, resolved_user_id, due_date |
| ITEM_EVIDENCE | Trích dẫn từ một mục tới đoạn transcript nguồn (provenance) | item_id, segment_id, quote |
| TRANSCRIPT | Transcript cuộc họp — entity ngoài feature (`meeting-records`), là đầu vào job | id, status |
| TRANSCRIPT_SEGMENT | Đoạn transcript làm trích dẫn — ngoài feature (`meeting-records`) | id, content |
| MEETING | Cuộc họp sở hữu các bản đề xuất — ngoài feature (`meeting-records`) | id, title, status |
| MEETING_PARTICIPANT | Participant làm đích gán phụ trách — ngoài feature (`meeting-records`) | id, user_id/guest_name, role |
| MINUTES | Biên bản đích khi xác nhận publish — ngoài feature (`meeting-records`) | id, meeting_id, status |
| APP_USER | Người dùng nội bộ — ngoài feature (`account-access`): kích hoạt job, xác nhận, được gán phụ trách | id, name |

## Notes & Assumptions

- `MINUTES_JOB` tách riêng khỏi `MINUTES_PROPOSAL` vì một job có thể FAILED
  không tạo bản nào; mỗi job thành công tạo đúng một bản đề xuất (`||--o|`).
- Một cuộc họp chỉ có tối đa 1 bản đề xuất đang mở (PROPOSED/REVIEWING) —
  ràng buộc nghiệp vụ BR-006, không thể hiện trên ERD; các bản DISCARDED/
  SUPERSEDED giữ vết để đối chiếu provenance (OQ-2 spec).
- `PROPOSAL_ITEM` giữ song song `proposed_content` (gốc AI) và
  `final_content` (sau sửa) để đo tỷ lệ đề xuất được giữ lại (đo thành công
  PRD Mục 7.14); mục thêm tay có `source = thêm tay` và không bắt buộc
  ITEM_EVIDENCE (BR-010).
- `person_status = UNRESOLVED` giữ `suggested_person_name` nguyên văn và cờ
  chưa resolve — `meeting-to-tasks` chặn tạo task từ đầu việc chưa resolve
  (BR-008, PRD Mục 7.15). `resolved_user_id` và `resolved_participant_id`
  chỉ một trong hai được điền tùy đích gán (người danh bạ hoặc participant).
- `is_stale` bật khi transcript thay đổi sau khi bản đề xuất tồn tại; xác
  nhận publish khi cờ bật phải qua hỏi xác nhận (BR-011).
- `published_minutes_id` trỏ MINUTES được tạo/cập nhật khi publish — biên
  bản và revision tiếp theo thuộc `meeting-records`, không nhân bản ở đây.
- Audit các quyết định review và xác nhận nằm ở audit log của
  `org-governance`, không tạo entity riêng trong feature này.
