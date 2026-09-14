---
type: srs-erd
feature: interview-recording
updated: 2026-09-14
---

# interview-recording — Entity Relationship Diagram

> Scope: consent ghi âm theo session, recording và vòng đời xử lý,
> transcript có đoạn timestamp, summary đề xuất → đã review, đoạn trích
> evidence kèm nguồn, audit truy cập và job xử lý/retry.
> `INTERVIEW_SESSION` và `USER` là tham chiếu tối thiểu sang
> `interview-management` và `org-governance`.

## Diagram

```mermaid
erDiagram
    INTERVIEW_SESSION ||--o{ CONSENT_RECORD : "ghi nhận"
    INTERVIEW_SESSION ||--o{ RECORDING : "có ghi âm"
    CONSENT_RECORD ||--o{ RECORDING : "cho phép"
    RECORDING ||--o{ TRANSCRIPT : "có bản bóc băng"
    TRANSCRIPT ||--o{ TRANSCRIPT_SEGMENT : "gồm đoạn"
    RECORDING ||--o{ SUMMARY : "có tóm tắt"
    TRANSCRIPT_SEGMENT ||--o{ EVIDENCE_EXTRACT : "được trích"
    SUMMARY ||--o{ EVIDENCE_EXTRACT : "được trích"
    RECORDING ||--o{ ACCESS_LOG : "bị truy cập"
    USER ||--o{ ACCESS_LOG : "truy cập"
    RECORDING ||--o{ PROCESSING_JOB : "được xử lý"
    USER ||--o{ RECORDING : "tạo"
    USER ||--o{ SUMMARY : "xác nhận"
    USER ||--o{ EVIDENCE_EXTRACT : "trích"

    INTERVIEW_SESSION {
        string session_id PK "mã phiên phỏng vấn, thuộc interview-management"
        string application_id "application mà phiên thuộc về"
        datetime scheduled_at "thời điểm diễn ra phiên"
    }
    CONSENT_RECORD {
        string consent_id PK "mã bản ghi consent"
        string session_id FK "phiên mà consent áp dụng"
        string status "trạng thái: đồng-ý, từ-chối, đã-rút"
        string channel "kênh xin: thư-mời hoặc trong-phiên"
        string content_version "phiên bản nội dung consent đã đồng ý"
        string recorded_by "ai ghi nhận quyết định: ứng viên tự chọn hoặc interviewer và HR ghi nhận"
        string withdraw_reason "lý do rút consent nếu có"
        datetime decided_at "thời điểm ứng viên quyết định"
        datetime withdrawn_at "thời điểm rút consent nếu có"
    }
    RECORDING {
        string recording_id PK "mã ghi âm"
        string session_id FK "phiên được ghi"
        string consent_id FK "consent hợp lệ cho phép ghi, bắt buộc"
        string user_id FK "người tạo recording hoặc tải file"
        string source "nguồn: ghi-trong-phiên hoặc tải-file"
        string status "vòng đời: đang-ghi, chờ-xử-lý, sẵn-sàng, đã-review, lỗi-xử-lý, chờ-xóa, hết-hạn-lưu-trữ, đã-xóa"
        string format "định dạng file âm thanh"
        int duration_seconds "thời lượng ghi âm"
        int size_bytes "dung lượng file"
        string storage_ref "tham chiếu lưu trữ nội bộ"
        datetime created_at "thời điểm tạo bản ghi"
    }
    TRANSCRIPT {
        string transcript_id PK "mã bản bóc băng"
        string recording_id FK "recording được bóc băng"
        string language "ngôn ngữ bóc băng, tiếng Việt ưu tiên"
        string model_version "model và phiên bản provider, provenance"
        string status "trạng thái: đang-tạo, sẵn-sàng, lỗi"
        datetime created_at "thời điểm tạo"
    }
    TRANSCRIPT_SEGMENT {
        string segment_id PK "mã đoạn transcript"
        string transcript_id FK "transcript chứa đoạn"
        int seq_no "thứ tự đoạn trong transcript"
        string speaker_label "nhãn người nói: interviewer, ứng-viên, chưa-rõ"
        boolean speaker_confirmed "interviewer đã xác nhận nhãn người nói"
        decimal start_seconds "mốc bắt đầu đoạn trong file"
        decimal end_seconds "mốc kết thúc đoạn trong file"
        string content "nội dung đoạn"
    }
    SUMMARY {
        string summary_id PK "mã bản tóm tắt"
        string recording_id FK "recording được tóm tắt"
        string content "nội dung tóm tắt"
        string status "trạng thái: đề-xuất hoặc đã-review"
        string model_version "model và phiên bản sinh đề xuất, provenance"
        string user_id FK "người xác nhận bản tóm tắt"
        int version_no "số phiên bản sau mỗi lần sửa và xác nhận lại"
        datetime confirmed_at "thời điểm xác nhận"
    }
    EVIDENCE_EXTRACT {
        string extract_id PK "mã đoạn trích"
        string segment_id FK "đoạn transcript được trích nếu có"
        string summary_id FK "bản tóm tắt đã review được trích nếu có"
        string evaluation_ref "mã đánh giá nhận đoạn trích, thuộc interview-evaluation"
        string user_id FK "người trích"
        boolean source_withdrawn "nguồn đã bị rút consent hoặc xóa"
        datetime created_at "thời điểm trích"
    }
    ACCESS_LOG {
        string access_id PK "mã lượt truy cập"
        string recording_id FK "recording bị truy cập"
        string user_id FK "người truy cập"
        string action "hành động: xem, nghe, đọc, xuất, từ-chối"
        datetime created_at "thời điểm truy cập"
    }
    PROCESSING_JOB {
        string job_id PK "mã job xử lý"
        string recording_id FK "recording được xử lý"
        string job_type "loại: transcript hoặc summary"
        string status "trạng thái: chờ, đang-chạy, xong, lỗi"
        int retry_count "số lần retry đã thực hiện"
        string error_detail "chi tiết lỗi gần nhất nếu có"
        datetime created_at "thời điểm tạo job"
        datetime finished_at "thời điểm kết thúc"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| INTERVIEW_SESSION | Phiên phỏng vấn — tham chiếu tối thiểu từ `interview-management` | session_id, application_id, scheduled_at |
| CONSENT_RECORD | Quyết định consent của ứng viên theo session — điều kiện cứng trước khi ghi | status, channel, content_version, decided_at, withdrawn_at |
| RECORDING | File âm thanh gắn session — luôn trỏ về consent hợp lệ; vòng đời tới chờ-xóa/đã-xóa | consent_id, source, status, duration_seconds, storage_ref |
| TRANSCRIPT | Bản bóc băng của recording — có provenance model | language, model_version, status |
| TRANSCRIPT_SEGMENT | Đoạn transcript có timestamp và nhãn người nói được xác nhận | seq_no, speaker_label, start_seconds, end_seconds, content |
| SUMMARY | Bản tóm tắt — đề xuất của AI chỉ thành evidence sau khi interviewer xác nhận | status, model_version, user_id, confirmed_at |
| EVIDENCE_EXTRACT | Đoạn đã trích vào đánh giá kèm liên kết nguồn — đánh dấu khi nguồn bị rút/xóa | segment_id, summary_id, evaluation_ref, source_withdrawn |
| ACCESS_LOG | Audit mọi lượt xem/nghe/đọc/xuất, kể cả lượt bị từ chối | action, user_id, created_at |
| PROCESSING_JOB | Job xử lý transcript/summary — retry có giới hạn, lỗi không mất file gốc | job_type, status, retry_count, error_detail |
| USER | Người dùng nội bộ (interviewer, HR, admin) — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `RECORDING.consent_id` là NOT NULL về mặt contract: mọi recording phải trỏ
  về `CONSENT_RECORD` có `status = đồng-ý` tại thời điểm tạo — hiện thực
  BR-interview-recording-001 "không consent không ghi".
- `CONSENT_RECORD` là append-only theo thời gian: một session có thể có
  nhiều bản ghi (từ chối rồi đồng ý lại, đồng ý rồi rút); bản ghi mới nhất
  quyết định trạng thái hiện tại. `content_version` giữ phiên bản nội dung
  đã đồng ý — đổi nội dung consent không sửa bản ghi cũ.
- Khi consent bị rút, `RECORDING.status` chuyển `chờ-xóa` và mọi truy cập bị
  chặn; `EVIDENCE_EXTRACT.source_withdrawn = true` đánh dấu các đoạn đã
  trích — nội dung trích giữ nguyên trong evaluation kèm cờ (BR-interview-
  recording-005).
- `RECORDING.status` gộp cả vòng đời xử lý và retention (`hết-hạn-lưu-trữ`,
  `đã-xóa`): khi hết hạn theo policy, bản ghi chuyển lưu trữ nguội; `đã-xóa`
  chỉ còn metadata tối thiểu để audit, không còn nội dung truy cập được.
- `EVIDENCE_EXTRACT` trích từ `TRANSCRIPT_SEGMENT` (đoạn câu có timestamp)
  hoặc `SUMMARY` đã review — ít nhất một trong hai FK phải có; `evaluation_ref`
  là tham chiếu chuỗi sang `interview-evaluation`, không phải FK vật lý.
- `SUMMARY.version_no` tăng mỗi lần sửa và xác nhận lại; chỉ bản `đã-review`
  được trích làm evidence (human-in-the-loop).
- `PROCESSING_JOB` tách khỏi `RECORDING.status`: một recording có thể có
  nhiều job (transcript rồi summary, retry); lỗi job không làm mất file gốc.
- `ACCESS_LOG.action = từ-chối` ghi cả lượt truy cập bị chặn vì ngoài
  data-scope hoặc dữ liệu chờ xóa.
