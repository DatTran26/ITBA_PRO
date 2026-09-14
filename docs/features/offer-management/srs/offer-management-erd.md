---
type: srs-erd
feature: offer-management
updated: 2026-09-14
---

# offer-management — Entity Relationship Diagram

> Scope: vòng đời offer của một tổ chức — offer, phiên bản nội dung, quyết
> định phê duyệt, lượt gửi (delivery) và phản hồi ứng viên. `APPLICATION`
> là tham chiếu tối thiểu sang `candidate-pipeline`; `USER` là tham chiếu
> sang `org-governance`.

## Diagram

```mermaid
erDiagram
    APPLICATION ||--o{ OFFER : "được tạo offer"
    USER ||--o{ OFFER : "soạn"
    OFFER ||--o{ OFFER_VERSION : "có nhiều phiên bản"
    OFFER }o--o| OFFER_VERSION : "phiên bản hiệu lực"
    OFFER_VERSION ||--o{ OFFER_APPROVAL : "được phê duyệt"
    USER ||--o{ OFFER_APPROVAL : "ra quyết định"
    OFFER ||--o{ OFFER_DELIVERY : "có lượt gửi"
    OFFER_VERSION ||--o{ OFFER_DELIVERY : "được gửi"
    USER ||--o{ OFFER_DELIVERY : "thực hiện gửi"
    OFFER_DELIVERY ||--o| OFFER_RESPONSE : "nhận phản hồi"
    USER ||--o{ OFFER_RESPONSE : "ghi nhận thay"

    APPLICATION {
        string application_id PK "mã hồ sơ ứng tuyển, thuộc candidate-pipeline"
        string candidate_name "tên ứng viên"
        string stage "stage pipeline hiện tại, offer tạo khi đang PASSED"
    }
    USER {
        string user_id PK "mã người dùng nội bộ, thuộc org-governance"
        string display_name "tên hiển thị"
    }
    OFFER {
        string offer_id PK "mã offer"
        string application_id FK "application được tạo offer"
        string organization_id FK "tổ chức sở hữu offer"
        string status "vòng đời: nháp, chờ duyệt, đã duyệt, đã gửi, đã xem, đã chấp nhận, đã từ chối, hết hạn, thu hồi"
        string current_version_id FK "phiên bản offer đang hiệu lực"
        string created_by FK "người tạo offer"
        datetime created_at "thời điểm tạo"
        datetime updated_at "thời điểm cập nhật cuối"
    }
    OFFER_VERSION {
        string version_id PK "mã phiên bản offer"
        string offer_id FK "offer gốc"
        int version_no "số thứ tự phiên bản"
        string position_title "vị trí offer"
        string department "phòng ban dự kiến"
        decimal salary_amount "mức lương hoặc thù lao đề nghị, dữ liệu hạn chế theo quyền"
        string salary_note "ghi chú lương, bắt buộc khi đánh dấu thỏa thuận"
        boolean is_negotiable "cờ lương thỏa thuận thay con số cố định"
        date start_date "ngày bắt đầu làm việc dự kiến"
        date response_due_date "hạn ứng viên phản hồi"
        string content "nội dung thư mời và điều khoản"
        string review_status "trạng thái duyệt của phiên bản: nháp, chờ duyệt, đã duyệt, từ chối duyệt"
        string created_by FK "người soạn phiên bản"
        datetime created_at "thời điểm tạo phiên bản"
    }
    OFFER_APPROVAL {
        string approval_id PK "mã quyết định duyệt"
        string version_id FK "phiên bản offer được duyệt"
        string approver_id FK "người duyệt có thẩm quyền"
        string decision "quyết định: đã duyệt hoặc từ chối duyệt"
        string note "ghi chú của người duyệt, bắt buộc khi từ chối"
        datetime decided_at "thời điểm quyết định"
    }
    OFFER_DELIVERY {
        string delivery_id PK "mã lượt gửi"
        string offer_id FK "offer được gửi"
        string version_id FK "phiên bản offer đã gửi trong lượt này"
        string channel "kênh gửi: email chứa link xem có hạn"
        string recipient_email "email ứng viên đã kiểm khớp application"
        string sent_by FK "người thực hiện gửi"
        datetime sent_at "thời điểm gửi"
        datetime access_expires_at "hạn truy cập link xem offer"
        datetime first_viewed_at "thời điểm ứng viên xem lần đầu"
        int view_count "số lần ứng viên đã xem"
        int reminder_count "số lần đã nhắc ứng viên, tối đa 2"
    }
    OFFER_RESPONSE {
        string response_id PK "mã phản hồi"
        string offer_id FK "offer được phản hồi"
        string delivery_id FK "lượt gửi mà ứng viên phản hồi"
        string version_id FK "phiên bản offer ứng viên đã xem khi phản hồi"
        string response "kết quả: chấp nhận hoặc từ chối"
        string channel "kênh phản hồi: tự phản hồi qua link hoặc ghi thay bởi HR"
        string note "ghi chú của ứng viên hoặc lý do ghi thay"
        string recorded_by FK "người ghi nhận thay nếu kênh ghi thay"
        datetime responded_at "thời điểm ghi nhận phản hồi"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| OFFER | Một đề nghị tuyển dụng cho một application — định danh, vòng đời, phiên bản hiệu lực, provenance | application_id, status, current_version_id, organization_id |
| OFFER_VERSION | Snapshot nội dung offer của một phiên bản — điều khoản bất biến sau khi gửi | version_no, position_title, salary_amount, start_date, response_due_date, content, review_status |
| OFFER_APPROVAL | Quyết định duyệt/từ chối duyệt của người có thẩm quyền trên một phiên bản | approver_id, decision, note, decided_at |
| OFFER_DELIVERY | Một lần gửi phiên bản cho ứng viên — kênh, người nhận, hạn link và dấu vết xem | channel, recipient_email, sent_at, access_expires_at, first_viewed_at, view_count, reminder_count |
| OFFER_RESPONSE | Phản hồi chấp nhận/từ chối của ứng viên — một lần duy nhất trên mỗi lượt gửi | response, channel, version_id, recorded_by, responded_at |
| APPLICATION | Hồ sơ ứng tuyển nguồn của offer — tham chiếu tối thiểu từ `candidate-pipeline` | application_id, candidate_name, stage |
| USER | Người dùng nội bộ (HR, người duyệt) — tham chiếu tối thiểu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `OFFER.status` là vòng đời nghiệp vụ của cả offer; `OFFER_VERSION.
  review_status` theo dõi duyệt của từng phiên bản vì sửa sau gửi tạo phiên
  bản mới chờ duyệt trong khi bản đã gửi vẫn hiệu lực — cùng mô hình hai
  trục trạng thái của `question-bank`.
- `OFFER.current_version_id` trỏ phiên bản mới nhất; khi phiên bản mới được
  gửi (một `OFFER_DELIVERY` mới), link của lượt gửi cũ vô hiệu — ứng viên chỉ
  thấy phiên bản của lượt gửi còn hạn.
- `OFFER_VERSION.salary_amount` + `content` là vùng dữ liệu hạn chế
  (NFR-offer-management-002): chỉ HR trong scope, người duyệt và đúng ứng
  viên của offer đó truy cập.
- `OFFER_RESPONSE` tối đa 1 trên mỗi `OFFER_DELIVERY` và chỉ ghi một lần —
  phản hồi đầu tiên là hiệu lực (BR-offer-management-005); `recorded_by` rỗng
  khi ứng viên tự phản hồi.
- `APPLICATION`/`USER` là entity của feature khác (`candidate-pipeline`,
  `org-governance`) — chỉ khai tối thiểu để tham chiếu, không sao chép đầy
  đủ. Transition `OFFERED`/`ACCEPTED`/`OFFER_REJECTED` trên `APPLICATION.
  stage` do `candidate-pipeline` thực hiện qua state machine của nó, không
  nằm trong schema này.
- Ứng viên không có `USER` — định danh của họ nằm ở `APPLICATION` và
  `OFFER_DELIVERY.recipient_email`; truy cập qua link có `access_expires_at`.
