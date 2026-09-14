---
type: brainstorm
feature: meeting-records
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Nguồn dữ liệu cuộc họp thống nhất — meeting-records

## 1. Idea Seed

Một nơi duy nhất trong Town Hown lưu trọn một cuộc họp: thông tin, người tham
gia, file ghi âm/ghi hình, transcript, biên bản và toàn bộ lịch sử chỉnh sửa —
để chủ trì xác nhận kết quả họp trên một nguồn dữ liệu duy nhất, và ghi âm chỉ
xảy ra khi có sự đồng ý (consent) của người tham gia.

## 2. Context

Cuộc họp nội bộ hiện vận hành rời rạc: lịch ở calendar, file ghi âm nằm trên
máy cá nhân của người ghi, biên bản nằm trong file Word gửi qua email/chat, và
quyết định đã chốt trôi trong các cuộc trò chuyện. Hậu quả: chủ trì mất thời
gian tổng hợp, người tham gia không xem lại được nội dung đã chốt, quản lý
không truy nguyên được quyết định, và file ghi âm chứa dữ liệu nhạy cảm tồn tại
không kiểm soát. Feature này là nền dữ liệu cho `ai-meeting-minutes` (biên bản
AI cần transcript sẵn sàng) và `meeting-to-tasks` (action item bắt nguồn từ
biên bản đã xác nhận). Phụ thuộc duy nhất theo Feature Map: `account-access`
(đăng nhập, phiên làm việc). Đây là feature `Should` trong Meetings & Work —
không thuộc lát cắt pilot v1 nhưng cần spec sẵn cho slice sau.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Chủ trì (nhân viên/quản lý tạo cuộc họp) | Quyết định, file ghi, biên bản rải rác nhiều nơi; mất thời gian tổng hợp | Một meeting record chứa đủ media + transcript + biên bản để xác nhận kết quả |
| Người tham gia (nhân viên) | Không xem lại được nội dung họp; không biết mình có bị ghi âm không | Xem lại transcript/biên bản trong phạm vi; biết và quyết định consent ghi âm |
| Quản lý | Không truy nguyên được quyết định đã chốt trong họp của đội | Xem biên bản cuộc họp trong đúng phạm vi quyền |
| Admin | File ghi âm nhạy cảm tồn tại không kiểm soát, không rõ retention | Áp retention và audit truy cập cho recording/transcript |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo/sửa/hủy cuộc họp: tiêu đề, thời gian bắt đầu–kết thúc, hình thức (trực
  tiếp / online kèm link), agenda, đơn vị/phạm vi dữ liệu.
- Quản lý người tham gia từ danh bạ nội bộ: vai trò (chủ trì / thành viên),
  trạng thái tham gia và trạng thái consent ghi âm từng người.
- Hai cách có file ghi: (a) upload file audio/video sau họp; (b) đánh dấu
  "cuộc họp được ghi âm trong nền tảng" — cả hai đều bị chặn nếu còn người
  tham gia chưa đồng ý ghi âm.
- Xử lý transcript từ file ghi: tạo job, theo dõi trạng thái (đang xử lý /
  sẵn sàng / lỗi), xem transcript gắn với cuộc họp, sửa nhãn người nói.
- Biên bản thủ công (soạn tay khi không dùng AI) + lịch sử chỉnh sửa: ai sửa,
  khi nào, nội dung trước/sau.
- Kiểm soát truy cập theo participant + organization/role/data-scope; deny-by-
  default cho người ngoài phạm vi.
- Retention cho file ghi: ngày hết hạn hiển thị rõ, hết hạn thì xóa media
  nhưng giữ transcript/biên bản.

### P1 — should have

- Tìm kiếm trong transcript; nhảy tới đoạn transcript từ biên bản.
- Đính kèm tài liệu liên quan vào cuộc họp (qua `document-intake`).
- Nhập cuộc họp từ lịch bên ngoài (qua `external-integrations` khi provider
  được chọn).
- Nhắc chủ trì khi cuộc họp đã kết thúc mà chưa có biên bản (qua
  `contextual-notifications`).

### P2 — nice to have

- Ghi âm/ghi hình trực tiếp trong nền tảng khi provider được chọn.
- Transcript trực tiếp (live) và chia đoạn theo agenda.
- Dịch transcript đa ngôn ngữ khi có scope ngoài tiếng Việt.

## 5. Core Flows (Happy Path)

### 5.1 Tạo cuộc họp → ghi/tải file → transcript → review → lưu

1) Chủ trì tạo cuộc họp: tiêu đề, thời gian, hình thức, agenda, đơn vị/phạm vi.
2) Thêm người tham gia từ danh bạ nội bộ; hệ thống gửi thông báo mời kèm thông
   tin "cuộc họp này có thể được ghi âm" và yêu cầu consent.
3) Người tham gia phản hồi consent (đồng ý / từ chối); chủ trì thấy danh sách
   còn ai chưa đồng ý.
4) Sau/trong cuộc họp, chủ trì tải file ghi (hoặc bật cờ ghi âm trong nền
   tảng). Hệ thống kiểm tra: còn người chưa đồng ý → chặn và báo rõ còn ai.
5) File hợp lệ → lưu vào record + tạo job transcript; trạng thái "đang xử lý".
6) Job xong → transcript "sẵn sàng"; chủ trì xem, sửa nhãn người nói nếu sai.
7) Chủ trì soạn biên bản (hoặc để `ai-meeting-minutes` đề xuất) → lưu; mọi
   chỉnh sửa sau đó ghi thành phiên bản trong lịch sử.
8) Cuộc họp ở trạng thái hoàn tất; record lưu trữ trong đúng phạm vi quyền.

```
Chủ trì                      Hệ thống meeting-records              Người tham gia
──────────────────────────────────────────────────────────────────────────────────

Tạo cuộc họp
(tiêu đề, giờ, agenda,
phạm vi)
   │
   ▼
┌─────────────────────────┐
│ Lưu meeting record      │
│ trạng thái SCHEDULED    │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐     ┌──────────────────────────────┐
│ Thêm participants +     │────▶│ Thông báo mời + xin consent  │
│ gán vai trò             │     │ ghi âm từng người            │
└───────────┬─────────────┘     └──────────────┬───────────────┘
            │                                  ▼
            │                    consent: đồng ý / từ chối / chưa trả lời
            ▼
Chủ trì tải file ghi / bật cờ ghi âm
            ▼
   ── Còn ai chưa đồng ý ghi âm? ──┐
   │                              │
  Có ▶ CHẶN, báo "còn {N} người   │
       chưa đồng ý", chờ chủ trì  │
       xử lý (xin lại / bỏ ghi)   │
   │                              │
 Không ▼                          │
┌─────────────────────────┐       │
│ Validate định dạng +    │       │
│ kích thước file         │       │
└───────────┬─────────────┘       │
            ▼                     │
   ── File hợp lệ? ──┐            │
   │                 │            │
  Không ▶ báo lỗi,               │
          không lưu              │
   │                             │
  Có ▼                           │
┌─────────────────────────┐      │
│ Lưu media + tạo job     │      │
│ transcript (PROCESSING) │      │
└───────────┬─────────────┘      │
            ▼                    │
   job xong ▶ transcript READY   │
   job lỗi  ▶ FAILED (retry /    │
             báo chủ trì)        │
            ▼
Chủ trì xem transcript, sửa nhãn
người nói → soạn/xác nhận biên bản
            ▼
┌─────────────────────────┐
│ Lưu biên bản + mọi sửa  │
│ đổi thành revision      │
└───────────┬─────────────┘
            ▼
   Meeting ENDED — record hoàn
   chỉnh, truy cập theo phạm vi
```

### 5.2 Người tham gia phản hồi consent và xem lại cuộc họp

1) Nhận thông báo mời họp kèm câu hỏi consent ghi âm.
2) Chọn đồng ý / từ chối; có thể đổi trước khi cuộc họp bắt đầu.
3) Sau họp: mở meeting record → xem transcript + biên bản (trong phạm vi của
   mình); nếu từ chối consent mà cuộc họp vẫn có file ghi → thấy rõ phần mình
   bị loại khỏi/quyền khiếu nại theo chính sách.

### 5.3 Quản lý xem biên bản trong phạm vi

1) Quản lý mở danh sách cuộc họp thuộc phạm vi quản lý của mình.
2) Xem biên bản/transcript; không thấy cuộc họp ngoài phạm vi.
3) Mọi lượt xem nội dung nhạy cảm (recording) được ghi audit.

### 5.4 Retention: file ghi hết hạn

1) Media đến ngày hết hạn theo chính sách retention.
2) Hệ thống xóa/vô hiệu file ghi; transcript và biên bản vẫn còn.
3) Record hiển thị "file ghi đã xóa theo chính sách lưu trữ"; ghi audit xóa.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Cuộc họp có file ghi/ghi âm không? | Kiểm tra consent trước khi lưu media | Meeting chỉ có agenda + biên bản tay |
| D2 | 5.1 | Tất cả participants đã consent ghi âm? | Cho phép lưu media / bật ghi âm | Chặn + báo danh sách chưa đồng ý |
| D3 | 5.1 | File upload hợp lệ (định dạng + kích thước)? | Lưu media + tạo job transcript | Báo lỗi exact wording, không lưu |
| D4 | 5.1 | Job transcript thành công? | Transcript READY, cho xem/sửa nhãn | FAILED: retry tự động, hết thì báo chủ trì |
| D5 | 5.3 | Người xem thuộc phạm vi (participant hoặc scope quản lý)? | Hiển thị record | Từ chối truy cập (deny-by-default) |
| D6 | 5.4 | Media đã hết retention? | Xóa media, giữ transcript/biên bản, ghi audit | Giữ nguyên |
| D7 | 5.2 | Participant đổi consent trước giờ họp? | Cập nhật trạng thái, báo chủ trì | — |

### 6.2 Scenario Matrix

| Vai trò | Tạo/sửa meeting | Tải file ghi | Xem transcript/biên bản | Xem media gốc | Quyết consent |
|---|---|---|---|---|---|
| Chủ trì | ✓ | ✓ | ✓ | ✓ | xem trạng thái của mình |
| Thành viên tham gia | — | — | ✓ (cuộc họp mình tham gia) | theo chính sách (OQ-4) | quyết của chính mình |
| Quản lý trong scope | — | — | ✓ trong phạm vi | theo chính sách (OQ-4) | — |
| Người ngoài phạm vi | — | — | — | — | — |
| Admin | — | — | theo cấu hình audit | theo cấu hình audit | — |

### 6.3 State Transitions

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| meeting | — | SCHEDULED | chủ trì tạo | — |
| meeting | SCHEDULED | ONGOING | đến giờ / chủ trì mở | không |
| meeting | SCHEDULED | CANCELLED | chủ trì hủy | không |
| meeting | ONGOING | ENDED | chủ trì kết thúc / hết giờ | không |
| meeting_media | — | UPLOADED | file hợp lệ được lưu | — |
| meeting_media | UPLOADED | PROCESSING | job transcript bắt đầu | — |
| meeting_media | PROCESSING | READY | transcript hoàn tất | — |
| meeting_media | PROCESSING | FAILED | job lỗi hết retry | có (upload lại/retry thủ công) |
| meeting_media | READY | DELETED | hết retention hoặc yêu cầu xóa | không |
| transcript | — | PROCESSING | tạo từ media | — |
| transcript | PROCESSING | READY | xử lý xong | — |
| transcript | PROCESSING | FAILED | lỗi hết retry | có (chạy lại job) |
| minutes | — | DRAFT | tạo nháp (tay hoặc AI) | — |
| minutes | DRAFT | PUBLISHED | chủ trì xác nhận (xem `ai-meeting-minutes`) | có (bản mới thay thế, giữ revision) |
| minutes | PUBLISHED | ARCHIVED | meeting lưu trữ | không |
| consent | — | PENDING | thêm participant | — |
| consent | PENDING | ACCEPTED / DECLINED | participant trả lời | có (đổi trước giờ họp) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| User đóng app giữa lúc upload | media chưa lưu / lưu một phần ở trạng thái UPLOADING | upload lại từ đầu; không tạo job cho file dở | dọn phần upload dở theo chính sách tạm |
| Transcript provider fail/timeout | media UPLOADED/PROCESSING, transcript chưa có | retry tự động 3 lần (5 phút → 30 phút → 2 giờ); hết thì FAILED | báo chủ trì, cho chạy lại thủ công |
| 2 người cùng upload 2 file cho 1 meeting | cả 2 media tồn tại | cả 2 job chạy độc lập; chủ trì chọn transcript chính | — |
| Participant từ chối consent sau khi media đã lưu | media READY vẫn tồn tại | không tự xóa; flag tranh chấp cho chủ trì/admin xử lý theo chính sách | theo quyết định của admin |
| Meeting bị hủy sau khi đã có media/transcript | record vẫn tồn tại | chuyển trạng thái CANCELLED, giữ record để audit | retention vẫn áp dụng bình thường |
| Người tham gia không có tài khoản (khách ngoài) | không có consent record | ghi tên thủ công + chủ trì xác nhận "đã xin consent ngoài hệ thống" kèm ghi chú | — |

### 6.5 Other Edge Cases

- Cuộc họp không có file ghi: record vẫn hợp lệ với agenda + biên bản tay;
  hiển thị "không có ghi âm".
- File ghi không có tiếng/không bóc được lời: transcript READY nhưng rỗng —
  cảnh báo "không nhận diện được lời nói".
- Participant bị deactivate (nghỉ việc): record lịch sử giữ nguyên, consent
  record giữ nguyên để audit.
- Media hết retention nhưng biên bản đang bị tranh chấp: escalation cho admin
  theo legal-hold (nếu chính sách có).
- Người lạ được forward link meeting record: deny-by-default, ghi audit truy
  cập bị từ chối.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tiêu đề cuộc họp | bắt buộc, 3–200 ký tự |
| Thời gian | kết thúc > bắt đầu; cho phép tạo cuộc họp đã qua (ghi lại) |
| Participants | tối thiểu 1 (chủ trì); chỉ chọn trong danh bạ nội bộ; khách ngoài ghi tên thủ công |
| File ghi | định dạng MP3, MP4, M4A, WAV, WEBM; ≤ 2 GB/file |
| Consent | không lưu media / không bật ghi âm khi còn participant ở trạng thái PENDING hoặc DECLINED |
| Nhãn người nói | chỉ gán tới participant của cuộc họp hoặc đánh dấu "chưa xác định" |
| Biên bản | nội dung tự do; mỗi lần lưu tạo revision mới, không ghi đè |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Kích thước file ghi | 2 GB | mỗi file | từ chối upload + thông báo lỗi |
| Số file media / cuộc họp | 5 | mỗi meeting | từ chối file thứ 6, gợi ý xóa file cũ |
| Số participants / cuộc họp | 100 | mỗi meeting | từ chối thêm, gợi ý nhóm |
| Retry job transcript | 3 lần | 5 phút → 30 phút → 2 giờ | FAILED + báo chủ trì |
| Retention file ghi | 90 ngày | từ ngày tạo media | tự xóa media, giữ transcript/biên bản |
| Độ dài tiêu đề | 200 ký tự | — | chặn nhập quá |

*Các giá trị 2 GB / 5 file / 100 người / 90 ngày là Assumption — con số nghiệp
vụ thận trọng, chờ OQ-1/OQ-3 và OQ-6 của PRD chốt retention.*

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| File quá lớn | "File vượt quá 2 GB — hãy tải file nhỏ hơn hoặc liên hệ admin" | E-? |
| Định dạng không hỗ trợ | "Định dạng file không được hỗ trợ — chỉ chấp nhận MP3, MP4, M4A, WAV, WEBM" | E-? |
| Còn người chưa consent | "Chưa thể ghi âm — còn {N} người tham gia chưa đồng ý ghi âm" | E-? |
| Transcript fail hết retry | "Không tạo được transcript cho file {tên file} — thử chạy lại hoặc tải file khác" | E-? |
| Ngoài phạm vi xem | "Bạn không có quyền xem cuộc họp này" | E-? |
| Quá số file | "Cuộc họp đã có tối đa 5 file ghi — xóa file cũ trước khi tải thêm" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo cuộc họp | "Đã tạo cuộc họp" |
| Upload thành công | "Đã tải file lên — transcript đang được xử lý" |
| Transcript xong | "Transcript đã sẵn sàng để xem" |
| Lưu biên bản | "Đã lưu biên bản" |
| Consent ghi nhận | "Đã ghi nhận lựa chọn của bạn" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Thông báo mời họp | "{chủ trì} mời bạn tham gia '{tên cuộc họp}' lúc {HH:mm DD/MM} — cuộc họp có thể được ghi âm" |
| Đang xử lý transcript | "Transcript đang được xử lý — bạn sẽ được thông báo khi xong" |
| Media hết hạn | "File ghi sẽ được xóa vào {ngày} theo chính sách lưu trữ" |
| Media đã xóa | "File ghi đã được xóa theo chính sách lưu trữ — transcript và biên bản vẫn còn" |
| Không có ghi âm | "Cuộc họp này không có file ghi" |
| Nhắc thiếu biên bản | "Cuộc họp '{tên}' đã kết thúc nhưng chưa có biên bản" |

## 8. Assumptions

- Engine transcript là AI provider đã được cấu hình sẵn qua
  `platform-configuration`; chỉ được gọi khi file hợp lệ và đủ consent.
- Consent mặc định của participant mới là PENDING; hệ thống hỏi qua
  `contextual-notifications`.
- Retention mặc định đề xuất 90 ngày cho file ghi; transcript/biên bản giữ
  lâu hơn theo chính sách hồ sơ — chờ PRD OQ-6.
- Mọi participant nội bộ có tài khoản; khách ngoài không có tài khoản và được
  xử lý bằng ghi tên + xác nhận thủ công của chủ trì.
- "Chủ trì" là một vai trò trong cuộc họp — một cuộc họp có đúng 1 chủ trì,
  có thể đổi người chủ trì.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Compliance: ghi âm khi chưa đủ consent hoặc retention chưa được duyệt (PRD OQ-6) | thỉnh thoảng | vi phạm privacy nội bộ/pháp lý, mất niềm tin nhân viên | chặn ghi/lưu media khi thiếu consent; retention mặc định + chỉ synthetic data tới khi policy duyệt |
| Adoption: chủ trì vẫn lưu file + biên bản ở công cụ cũ | thường | record trong hệ thống rỗng, feature mất giá trị | luồng upload đơn giản, nhắc thiếu biên bản, cho phép biên bản tay không cần media |
| Vendor: provider transcript lỗi/chậm | thỉnh thoảng | cuộc họp không có transcript, chủ trì phải ghi tay | retry + trạng thái rõ + cho phép biên bản tay không phụ thuộc transcript |
| Data: transcript sai tên người nói / bỏ sót đoạn | thường | biên bản gán sai người — lan sang `ai-meeting-minutes` | cho sửa nhãn người nói; transcript không phải fact cho tới khi biên bản được xác nhận |
| Process: ai được xem media gốc chưa rõ (OQ-4) | thỉnh thoảng | lộ nội dung nhạy cảm ngoài participant | mặc định chỉ participant + chủ trì xem media; mở rộng theo quyết định OQ |
| Timeline: phụ thuộc `account-access` và provider transcript | hiếm | không pilot được đúng slice Meetings & Work | đặt feature sau safety foundation trong roadmap |

## 10. Success Criteria (preliminary)

- Tỷ lệ cuộc họp cần biên bản có transcript khả dụng (metric PRD Mục 7.13) —
  target chốt theo OQ-1/OQ-2 của PRD.
- 100% media được lưu đều có consent đầy đủ tại thời điểm lưu (kiểm audit).
- Tỷ lệ cuộc họp có record đầy đủ (participants + biên bản) tăng dần qua
  các tháng pilot.

## 11. Open Questions

- [ ] OQ-1: Retention chính thức cho file ghi, transcript và biên bản là bao
  lâu? (liên quan PRD OQ-6 — DPO/legal)
- [ ] OQ-2: Khách ngoài tổ chức (không tài khoản) cần cơ chế consent riêng
  không, hay ghi nhận thủ công của chủ trì là đủ?
- [ ] OQ-3: Giới hạn kích thước/định dạng file chính thức — 2 GB và 5 định
  dạng đề xuất có được duyệt?
- [ ] OQ-4: Ngoài chủ trì và participant, ai được xem media gốc (quản lý
  trong scope? admin khi audit)?
- [ ] OQ-5: Transcript chỉ tiếng Việt hay cần đa ngôn ngữ trong phase đầu?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd meeting-records` — capture user perspective
- `/brd meeting-records` — business case
- `/prd-epic meeting-records` — product scope
