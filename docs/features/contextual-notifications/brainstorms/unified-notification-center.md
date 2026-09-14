---
type: brainstorm
feature: contextual-notifications
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Unified Notification Center — contextual-notifications

## 1. Idea Seed

Gộp mọi thông báo nghiệp vụ (notification bell hiện có + email) thành một trung
tâm thông báo theo ngữ cảnh: event nghiệp vụ → đúng người nhận → đúng kênh
(in-app real-time + email) → theo dõi giao hàng. Thông báo dạng lịch tự động
trở thành card trên kanban cá nhân.

## 2. Context

Interviewer đang bị miss lịch phỏng vấn vì nhắc việc rải rác qua Gmail, Zalo,
Telegram — tin trôi, không ai biết ai đã được nhắn. HR nhắc thủ công ở nhiều
nền tảng nên dễ sót người. Hệ thống hiện đã có nền email đầy đủ (template,
SMTP, log) và bell hiển thị thông báo phiên bản — feature này mở rộng thành
trung tâm thông báo chung cho mọi event nghiệp vụ, và là mắt xích các feature
khác (task, onboarding, biên bản, phê duyệt) dựa vào để báo việc.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Nhắc interviewer rải rác nhiều nền tảng, không biết ai đã nhận | Một chỗ gửi + log ai đã nhận/đã đọc |
| Interviewer | Lịch phỏng vấn chìm trong email/chat | Lịch tự hiện trong hệ thống + nhắc trước giờ |
| Quản lý | Không biết có request đang chờ mình duyệt | Thông báo phê duyệt kịp thời |
| Nhân viên | Không biết được giao việc/đổi hạn | Thấy task + hạn ngay khi được giao |
| Ứng viên | Không có tài khoản, dễ miss lịch/offer | Email rõ ràng, đúng giờ, có link vào xem |
| Admin | Email lỗi âm thầm không ai hay | Báo ngay khi email FAILED |

## 4. Capabilities Breakdown

### P0 — must have

- Trung tâm thông báo in-app: bell (10 mới nhất + badge unread) + trang riêng
  có filter theo loại, lịch sử, đánh dấu đã đọc/archive.
- Dispatch event → người nhận theo entity (assignee/interviewer/requester/
  owner/người bị đổi) → template theo loại → kênh.
- Dedup: cùng entity + cùng loại → cập nhật nội dung mới nhất + đặt lại unread.
- Email channel: teaser + link (không lộ dữ liệu nhạy cảm), gửi qua SMTP hiện
  có, track open/click, retry 3 lần (5p/30p/2h) rồi FAILED báo admin + người gửi.
- Preference per-user theo loại thông báo; admin định loại bắt buộc email.
- Reminder lịch phỏng vấn: admin đặt mặc định (24h + 1h), user chỉnh được.
- Loại "lịch" tự tạo card trên kanban cá nhân; entity hủy → gỡ card + đổi
  nội dung thông báo thành "đã hủy" + bắn thông báo hủy mới.
- In-app real-time; retention 90 ngày auto-archive; tài khoản nghỉ việc ngừng
  bắn mới nhưng giữ lịch sử.

### P1 — should have

- Calendar view cho thông báo dạng lịch trong trang thông báo.
- User tự pin thông báo thành card kanban.
- Quiet hours email 22:00–06:00; whitelist urgent (lịch PV đổi/hủy sát giờ,
  offer sắp hết hạn).
- Open/click tracking chi tiết trên email logs.

### P2 — nice to have

- Digest tổng hợp định kỳ qua email.
- Kênh OTT (SMS/Zalo) cho ứng viên.
- Dashboard phân tích tỷ lệ đọc theo loại/role.

## 5. Core Flows (Happy Path)

### 5.1 Event nghiệp vụ → thông báo tới người nhận

1) Event nghiệp vụ phát sinh (giao task, lịch PV mới/đổi/nhắc, offer, chờ
   duyệt, biên bản cần xác nhận, ...).
2) Hệ thống xác định người nhận theo entity (assignee, interviewer, requester,
   owner, người bị đổi quyền).
3) Kiểm tra dedup: đã có thông báo cùng entity + loại → cập nhật nội dung mới
   nhất + đặt lại unread; chưa có → tạo thông báo mới theo template của loại.
4) Phân kênh: ứng viên → chỉ email; nội bộ → in-app luôn + email nếu pref ON
   hoặc loại thuộc danh sách bắt buộc của admin.
5) Loại "lịch" → tự tạo card kanban cá nhân cho người nhận.
6) Email đi qua SMTP kèm tracking open/click; lỗi → retry 5p/30p/2h → hết thì
   FAILED, báo admin + người gửi.
7) Người nhận thấy badge/bell ngay (real-time), mở → READ, click → tới màn
   hình liên quan; email open/click → DELIVERED.

```
Nguồn nghiệp vụ              Hệ thống thông báo                       Người nhận
─────────────────────────────────────────────────────────────────────────────────

Event nghiệp vụ phát sinh
(giao task, lịch PV mới/đổi/
 nhắc, offer, chờ duyệt,
 biên bản cần xác nhận, ...)
        │
        ▼
┌──────────────────────────┐
│ Xác định người nhận theo │
│ entity: assignee,        │
│ interviewer, requester,  │
│ owner, người bị đổi      │
└───────────┬──────────────┘
            ▼
   ── Đã có thông báo cùng entity + cùng loại? ──┐
   │                                           │
  Có ▶ cập nhật nội dung mới nhất              │
       + đặt lại UNREAD                        │
   │                                           │
 Không ▼                                       │
┌──────────────────────────┐                   │
│ Tạo thông báo mới theo   │                   │
│ template của loại event  │                   │
└───────────┬──────────────┘                   │
            ▼                                   │
   ── Người nhận là? ──┐                       │
   │                   │                       │
 Ứng viên          Nội bộ                      │
   │                   ├─▶ in-app (luôn):      │
   │                   │    ghi notif + badge  │
   │                   │    loại "lịch" → tạo  │
   │                   │    card kanban tự động│
   │                   │                       │
   │                   └─▶ email: pref ON hoặc │
   │                   │    loại bắt buộc ─Có─▶│
   ▼                   │                       │
 gửi email qua SMTP    │                       │
 + tracking open/click │                       │
   │                   │                       │
   ├─ lỗi ─▶ retry 5p/30p/2h ── hết ─▶ FAILED  │
   │                                     (báo  │
   │                                admin +    │
   │                                người gửi) │
   ▼                                            │
 email: user open/click ▶ DELIVERED            │
 in-app: user mở item   ▶ READ                 │
                        (bỏ badge, đi tới màn  │
                         hình liên quan)       │

Entity bị hủy sau khi đã bắn ──▶ gỡ card kanban,
 đổi nội dung thông báo cũ thành "đã hủy",
 bắn thông báo hủy mới.
```

### 5.2 Người dùng xem và xử lý thông báo

1) Badge bell nhảy số real-time khi có thông báo mới.
2) Mở bell → 10 thông báo mới nhất; click item → tới màn hình liên quan +
   đánh dấu READ; "xem tất cả" → trang thông báo.
3) Trang thông báo: filter theo loại, tab lịch sử (đã đọc/archive), calendar
   view cho thông báo dạng lịch.
4) Từ item thông báo có thể pin thành card kanban (loại không tự động).

### 5.3 Chỉnh preference thông báo

1) Vào cài đặt → danh sách loại thông báo với toggle email (in-app luôn nhận).
2) Loại admin đánh dấu bắt buộc → hiển thị khóa, không tắt được.
3) Chỉnh mốc nhắc lịch trong khoảng cho phép → lưu → "Đã lưu cài đặt thông
   báo".

### 5.4 Entity bị hủy sau khi đã bắn thông báo

1) Entity (lịch PV, task, offer) bị hủy/xóa.
2) Hệ thống gỡ card kanban liên quan, đổi nội dung thông báo cũ thành "đã
   hủy", bắn thông báo hủy mới cho cùng người nhận.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Đã có thông báo cùng entity + loại? | Cập nhật nội dung + đặt lại UNREAD | Tạo thông báo mới |
| D2 | 5.1 | Người nhận là ứng viên (không tài khoản)? | Chỉ gửi email | In-app + email theo pref |
| D3 | 5.1 | Email pref của loại này ON, hoặc loại thuộc ds bắt buộc? | Gửi email | Bỏ email, chỉ in-app |
| D4 | 5.1 | Loại thông báo là "lịch" (có ngày giờ)? | Tự tạo card kanban | Không tạo card |
| D5 | 5.1 | Đang trong quiet hours 22:00–06:00? | Email giữ tới 06:00, trừ loại urgent gửi ngay | Gửi ngay |
| D6 | 5.1 | SMTP trả lỗi? | Retry 5p → 30p → 2h; hết thì FAILED + báo admin & người gửi | Mark SENT |
| D7 | 5.4 | Entity bị hủy sau khi đã bắn thông báo? | Gỡ card + đổi nội dung cũ + bắn notif hủy | Không làm gì |

### 6.2 Scenario Matrix

| Người nhận | Event ví dụ | In-app | Email | Kanban card |
|---|---|---|---|---|
| HR | CV cần review, offer được chấp nhận, lịch PV | ✓ | theo pref | lịch → auto |
| Interviewer | lịch PV mới/đổi/nhắc | ✓ | theo pref | lịch → auto |
| Ứng viên | giao bài test, offer, lịch PV | — | ✓ luôn | — |
| Quản lý | request chờ duyệt, cảnh báo quá hạn | ✓ | theo pref | lịch → auto |
| Nhân viên | giao task, đổi hạn, biên bản | ✓ | theo pref | lịch → auto |
| Admin | cảnh báo AI, email FAILED | ✓ | theo pref | — |

### 6.3 State Transitions

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| notification | — | UNREAD | tạo mới hoặc dedup cập nhật | — |
| notification | UNREAD | READ | user mở item | có (dedup đặt lại UNREAD) |
| notification | UNREAD/READ | ARCHIVED | user archive hoặc quá 90 ngày | không |
| email_delivery | — | QUEUED | tạo email (kể cả giữ quiet hours) | — |
| email_delivery | QUEUED | SENT | SMTP chấp nhận | — |
| email_delivery | QUEUED | FAILED | sau 3 lần retry | không |
| email_delivery | SENT | DELIVERED | open/click tracked | — |
| kanban_card | — | ACTIVE | notif loại lịch / user pin | — |
| kanban_card | ACTIVE | REMOVED | entity hủy hoặc user xóa | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| User offline/đóng app khi event bắn | notification UNREAD tích lũy | hiện khi mở lại; email vẫn gửi | không cần |
| SMTP down/timeout | delivery QUEUED | retry 5p/30p/2h | FAILED → báo admin + người gửi |
| Entity hủy sau khi đã bắn | notif cũ + card ACTIVE | gỡ card, đổi nội dung → "đã hủy", bắn notif mới | — |
| 2 event cùng entity sát nhau | — | dedup cập nhật notif cũ | — |
| User đọc trên 2 thiết bị | UNREAD ở cả 2 | đọc ở 1 → READ đồng bộ | — |

### 6.5 Other Edge Cases

- Tài khoản nội bộ bị deactivate (nghỉ việc): ngừng bắn thông báo mới và email
  cho người đó; lịch sử thông báo giữ nguyên.
- Email ứng viên sai/bounce: quy về FAILED như SMTP lỗi — admin + người gửi
  biết để liên hệ kênh khác.
- Event bắn trong quiet hours: in-app vẫn nhận ngay, chỉ email bị giữ.
- Ứng viên không mở email: trạng thái dừng ở SENT — HR thấy trong log để chủ
  động nhắc.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Preference toggle | theo từng loại thông báo; loại bắt buộc (admin định) hiển thị khóa |
| Mốc nhắc lịch | nằm trong khoảng admin cho phép (khoảng min/max chờ OQ-1) |
| Nội dung email | chỉ teaser + link; không chứa dữ liệu nhạy cảm (lương, điểm đánh giá) |
| Người nhận | phải resolve được từ entity (assignee/interviewer/owner); không resolve được → không bắn + log |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số thông báo trong bell | 10 | mới nhất | "xem tất cả" → trang thông báo |
| Retention thông báo | 90 ngày | rolling | auto-archive, vẫn xem trong tab lịch sử |
| Email retry | 3 lần | 5p → 30p → 2h | FAILED + notif admin & người gửi |
| Quiet hours email | 22:00–06:00 | mỗi ngày | giữ tới 06:00; loại urgent gửi ngay |
| Reminder mặc định | 24h + 1h trước lịch | — | admin đổi default, user chỉnh của mình |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Không lưu được preference | "Không lưu được cài đặt — thử lại sau" | E-? |
| Email FAILED (gửi cho admin/người gửi) | "Email tới {địa chỉ} gửi thất bại sau 3 lần thử — kiểm tra lại địa chỉ" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu preference | "Đã lưu cài đặt thông báo" |
| Pin thành card | "Đã thêm vào board của bạn" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Lịch PV mới | "Bạn có lịch phỏng vấn {vị trí} với {ứng viên} lúc {HH:mm DD/MM}" |
| Nhắc lịch PV | "Nhắc lịch: phỏng vấn {vị trí} — {ứng viên} sau {X} nữa" |
| Giao task | "{người giao} đã giao cho bạn: {tên task} — hạn {ngày}" |
| Chờ duyệt | "{người yêu cầu} cần bạn duyệt: {tên request}" |
| Offer được chấp nhận | "Offer {vị trí} đã được {ứng viên} chấp nhận" |
| Biên bản cần xác nhận | "Biên bản cuộc họp {tên họp} cần bạn xác nhận" |
| Entity bị hủy | "{tên entity} đã bị hủy" |

## 8. Assumptions

- SMTP đã cấu hình và đang hoạt động (có sẵn trong platform-configuration).
- Mọi nhân sự có tài khoản + email hợp lệ trong hệ thống; ứng viên có email
  từ hồ sơ CV.
- Kanban cá nhân tồn tại sau khi kanban-workspaces hoàn tất phần UI.
- Các module nghiệp vụ (recruitment, tasks, assessment, documents, versions)
  có sẵn điểm phát sinh event để dispatch bắt vào.
- In-app real-time dùng nền realtime có sẵn của hệ thống.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| User tắt hết email pref → lại miss lịch PV như hiện nay | thường | mất tác dụng của feature, quay lại pain cũ | admin định loại bắt buộc email trong settings |
| SMTP provider lỗi/quota → email fail hàng loạt | hiếm | miss offer/lịch ứng viên, complaint | retry 3 lần + FAILED báo admin & người gửi kịp xử lý |
| Gửi sai người / lộ dữ liệu nhạy cảm qua email | thỉnh thoảng | lộ lương/đánh giá, vi phạm privacy | email chỉ teaser+link; recipient theo entity |
| Dedup gộp sai → mất thông báo mới nhất | hiếm | user thấy thông tin cũ, hành động sai | dedup chỉ theo entity+loại, luôn giữ nội dung mới nhất |
| Quiet hours trì hoãn email khẩn (PV hủy sát giờ) | thỉnh thoảng | ứng viên/interviewer đến họp vô ích | whitelist loại urgent vượt quiet hours |

## 10. Success Criteria (preliminary)

- Tỷ lệ thông báo nghiệp vụ giao thành công (in-app hiện + email SENT/
  DELIVERED) — target chốt ở OQ-3.
- Interviewer miss lịch PV vì không hay thông báo ≈ 0.
- 100% event trong catalog có delivery log truy vết được ai đã được gửi.

## 11. Open Questions

- [ ] OQ-1: Khoảng min/max cho mốc nhắc lịch user được chỉnh (vd 5 phút đến 7
  ngày)?
- [ ] OQ-2: Card kanban tự động của loại lịch rơi vào cột nào trên board cá
  nhân (Inbox/Todo/Sắp tới)?
- [ ] OQ-3: "Sát giờ" trong urgent = PV đổi/hủy trong bao lâu trước giờ họp
  (vd ≤2h)?
- [ ] OQ-4: Target cụ thể cho tỷ lệ thông báo giao thành công (% và cửa sổ
  đo)?
- [ ] OQ-5: Có cần digest định kỳ ở phase sau không (v1 không có)?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd contextual-notifications` — capture user perspective
- `/brd contextual-notifications` — business case
- `/prd-epic contextual-notifications` — product scope
