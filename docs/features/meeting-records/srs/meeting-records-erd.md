---
type: srs-erd
feature: meeting-records
updated: 2026-09-14
---

# meeting-records — Entity Relationship Diagram

> Scope: meeting record, participants + consent, file ghi, transcript,
> biên bản và revision trong đúng phạm vi quyền (PRD Mục 7.13).

## Diagram

```mermaid
erDiagram
    ORG_UNIT ||--o{ MEETING : "sở hữu phạm vi"
    APP_USER ||--o{ MEETING : "tạo và chủ trì"
    MEETING ||--o{ MEETING_PARTICIPANT : "có người tham gia"
    APP_USER ||--o{ MEETING_PARTICIPANT : "là participant"
    MEETING ||--o{ MEETING_MEDIA : "đính kèm file ghi"
    APP_USER ||--o{ MEETING_MEDIA : "tải lên"
    MEETING_MEDIA ||--o| TRANSCRIPT : "bóc thành transcript"
    TRANSCRIPT ||--o{ TRANSCRIPT_SEGMENT : "gồm các đoạn"
    MEETING_PARTICIPANT ||--o{ TRANSCRIPT_SEGMENT : "được gán là người nói"
    MEETING ||--o{ MINUTES : "có biên bản"
    APP_USER ||--o{ MINUTES : "xác nhận biên bản"
    MINUTES ||--o{ MINUTES_REVISION : "lưu vết chỉnh sửa"
    APP_USER ||--o{ MINUTES_REVISION : "thực hiện sửa"

    MEETING {
        string id PK "mã cuộc họp"
        string title "tiêu đề cuộc họp"
        string agenda "chương trình nghị sự"
        datetime start_at "thời điểm bắt đầu"
        datetime end_at "thời điểm kết thúc"
        string meeting_type "hình thức: trực tiếp hoặc online"
        string meeting_link "link tham gia họp online"
        string status "trạng thái: SCHEDULED, ONGOING, ENDED, CANCELLED"
        boolean record_enabled "cuộc họp được phép ghi âm trong nền tảng"
        string org_unit_id FK "đơn vị/phạm vi dữ liệu sở hữu"
        string created_by FK "người tạo, mặc định là chủ trì"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật"
    }

    MEETING_PARTICIPANT {
        string id PK "mã người tham gia"
        string meeting_id FK "thuộc cuộc họp"
        string user_id FK "người dùng nội bộ, trống nếu khách ngoài"
        string guest_name "tên khách ngoài không có tài khoản"
        string role "vai trò: chủ trì, thành viên, khách"
        string join_status "trạng thái tham gia"
        string consent_status "consent ghi âm: PENDING, ACCEPTED, DECLINED"
        datetime consent_at "thời điểm trả lời consent"
        string consent_confirmed_by FK "chủ trì xác nhận consent hộ khách ngoài"
        string consent_note "ghi chú khi xác nhận consent ngoài hệ thống"
    }

    MEETING_MEDIA {
        string id PK "mã file ghi"
        string meeting_id FK "thuộc cuộc họp"
        string file_name "tên file ghi âm hoặc ghi hình"
        string file_format "định dạng: MP3, MP4, M4A, WAV, WEBM"
        int file_size_mb "dung lượng file tính bằng MB"
        string status "trạng thái: UPLOADED, PROCESSING, READY, FAILED, DELETED"
        date retention_expiry "ngày hết hạn lưu trữ media"
        string uploaded_by FK "người tải file"
        datetime created_at "thời điểm tải lên"
    }

    TRANSCRIPT {
        string id PK "mã transcript"
        string media_id FK "bóc từ file ghi"
        string status "trạng thái: PROCESSING, READY, FAILED"
        string content "toàn văn transcript"
        string language "ngôn ngữ của transcript"
        int retry_count "số lần đã chạy lại job"
        datetime processed_at "thời điểm xử lý xong"
        datetime created_at "thời điểm tạo"
    }

    TRANSCRIPT_SEGMENT {
        string id PK "mã đoạn transcript"
        string transcript_id FK "thuộc transcript"
        int seq "thứ tự đoạn trong transcript"
        int start_sec "giây bắt đầu đoạn trong file ghi"
        int end_sec "giây kết thúc đoạn trong file ghi"
        string content "nội dung lời nói của đoạn"
        string speaker_participant_id FK "participant được gán là người nói, trống nếu chưa xác định"
    }

    MINUTES {
        string id PK "mã biên bản"
        string meeting_id FK "thuộc cuộc họp"
        string content "nội dung biên bản hiện hành"
        string status "trạng thái: DRAFT, PUBLISHED, ARCHIVED"
        string source "nguồn: soạn tay hoặc AI đề xuất"
        string confirmed_by FK "chủ trì xác nhận biên bản"
        datetime confirmed_at "thời điểm xác nhận"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật"
    }

    MINUTES_REVISION {
        string id PK "mã phiên bản"
        string minutes_id FK "thuộc biên bản"
        int rev_no "số phiên bản tăng dần"
        string content_before "nội dung trước khi sửa"
        string content_after "nội dung sau khi sửa"
        string edited_by FK "người thực hiện chỉnh sửa"
        datetime edited_at "thời điểm chỉnh sửa"
    }

    APP_USER {
        string id PK "mã người dùng nội bộ, thuộc account-access"
        string name "tên hiển thị"
        string email "email nội bộ"
    }

    ORG_UNIT {
        string id PK "mã đơn vị/phạm vi, thuộc org-governance"
        string name "tên đơn vị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| MEETING | Cuộc họp nội bộ — nguồn dữ liệu duy nhất để chốt kết quả | title, start_at/end_at, status, org_unit_id |
| MEETING_PARTICIPANT | Người tham gia cuộc họp và consent ghi âm từng người | meeting_id, user_id/guest_name, role, consent_status |
| MEETING_MEDIA | File ghi âm/ghi hình đính kèm cuộc họp | meeting_id, file_name, status, retention_expiry |
| TRANSCRIPT | Transcript được bóc từ một file ghi | media_id, status, retry_count |
| TRANSCRIPT_SEGMENT | Đoạn transcript có nhãn người nói sửa được | transcript_id, seq, speaker_participant_id |
| MINUTES | Biên bản cuộc họp — phải được chủ trì xác nhận | meeting_id, status, source, confirmed_by |
| MINUTES_REVISION | Lịch sử chỉnh sửa biên bản, không ghi đè | minutes_id, rev_no, content_before/after |
| APP_USER | Người dùng nội bộ — entity ngoài feature (account-access) | id, name, email |
| ORG_UNIT | Đơn vị/phạm vi dữ liệu — entity ngoài feature (org-governance) | id, name |

## Notes & Assumptions

- APP_USER và ORG_UNIT chỉ khai tối thiểu để tham chiếu khóa ngoại; model đầy
  đủ thuộc `account-access` và `org-governance`.
- Consent ghi âm nằm trên MEETING_PARTICIPANT (mỗi người một trạng thái);
  khách ngoài không có user_id thì chủ trì xác nhận hộ qua
  consent_confirmed_by + consent_note (BR-004).
- Một cuộc họp có thể có nhiều MINUTES theo thời gian (bản mới thay thế, giữ
  revision); chỉ một MINUTES ở trạng thái PUBLISHED tại một thời điểm —
  ràng buộc nghiệp vụ, không thể hiện trên ERD.
- speaker_participant_id trống = đoạn "chưa xác định người nói" (BR-008).
- retention_expiry trên MEETING_MEDIA điều khiển xóa media; TRANSCRIPT và
  MINUTES giữ theo chính sách hồ sơ riêng (OQ-1 spec).
- Audit truy cập/xóa media và tranh chấp consent nằm ở audit log của
  `org-governance`, không tạo entity riêng trong feature này.
