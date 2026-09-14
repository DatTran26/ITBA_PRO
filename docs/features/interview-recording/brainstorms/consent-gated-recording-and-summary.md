---
type: brainstorm
feature: interview-recording
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# Ghi âm có consent và tóm tắt phiên phỏng vấn — interview-recording

## 1. Idea Seed

Cho interviewer ghi âm (hoặc tải file audio) phiên phỏng vấn sau khi ứng viên
đồng ý, hệ thống tạo transcript và bản tóm tắt bằng AI, interviewer/HR review
rồi lưu hoặc xuất — mọi recording/transcript/summary được gắn với phiên phỏng
vấn và application làm evidence, tuân theo chính sách consent, quyền truy cập
và retention đã công bố.

## 2. Context

Interviewer hiện vừa phỏng vấn vừa ghi chú tay — chia sự tập trung, dễ sót ý,
và biên bản sau buổi phụ thuộc trí nhớ. HR khi cần đối chiếu "ai nói gì, đánh
giá dựa trên evidence nào" thì không có nguồn để truy nguyên. Tuyển dụng đã có
`interview-management` (lịch, session, participant) và `interview-evaluation`
(form đánh giá, HR review); feature này nối evidence âm thanh vào hai mắt xích
đó. Ràng buộc cứng từ PRD: recording chỉ được tạo khi có consent; recording,
transcript và evaluation cần retention/access policy được duyệt (OQ-6 sản
phẩm); AI chỉ tóm tắt — không được kết luận pass/fail thay con người; dữ liệu
đi qua AI provider phải nằm trong chính sách được duyệt.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Interviewer | Vừa hỏi vừa ghi chú, sót ý và mất thời gian viết lại biên bản | Bật ghi hợp lệ, nhận transcript + summary để đưa vào đánh giá |
| HR | Không truy nguyên được căn cứ của nhận xét phỏng vấn khi ứng viên tranh chấp | Recording/transcript gắn session/application, đúng quyền, đúng retention |
| Ứng viên | Không biết buổi phỏng vấn có bị ghi không, dữ liệu đi đâu | Được hỏi consent rõ ràng, biết mục đích và thời gian lưu |
| Quản lý | Muốn nghe lại phần nào của buổi phỏng vấn trong phạm vi quyền | Truy cập theo data-scope, có audit |
| Admin | Provider/retention cấu hình tùy tiện, khó kiểm soát | Cấu hình provider + retention ở một chỗ, test được, audit được |

## 4. Capabilities Breakdown

### P0 - must have

- Hỏi và ghi nhận consent của ứng viên trước khi ghi: hiển thị nội dung consent
  (mục đích, phạm vi sử dụng, thời gian lưu), ghi nhận ai đồng ý/từ chối, khi
  nào, qua kênh nào; không có consent = không ghi được.
- Ghi âm trong phiên (khi nền họp/nền ghi của hệ thống được bật) hoặc tải file
  audio sau buổi phỏng vấn; mọi recording gắn với đúng session.
- Xử lý nền: tạo transcript (tiếng Việt ưu tiên), sau đó tạo bản tóm tắt AI
  (điểm chính, câu trả lời đáng chú ý, chủ đề đã đề cập); trạng thái xử lý
  hiển thị rõ (đang xử lý / xong / lỗi).
- Review trước khi dùng: transcript và summary chỉ là bản đề xuất; interviewer
  xem, sửa phần tóm tắt, xác nhận trước khi nội dung được đánh dấu "đã review"
  và cho phép trích vào `interview-evaluation`.
- Liên kết evidence: recording/transcript/summary hiển thị trong trang session
  của `interview-management` và được tham chiếu khi HR tổng hợp đánh giá.
- Xuất dữ liệu: HR xuất transcript/summary (và file gốc khi policy cho phép)
  trong đúng data-scope; mọi lượt xem/nghe/xuất đều có audit.
- Áp dụng retention/access policy: recording + transcript + summary có thời
  hạn lưu trữ và nhóm người được xem; hết hạn tự chuyển trạng thái lưu trữ/
  xóa theo policy; consent bị rút → ngừng xử lý và đánh dấu để xóa.
- Báo lỗi và retry xử lý: xử lý thất bại được báo cho người tạo + admin, có
  đường retry thủ công, không mất file gốc.

### P1 - should have

- Nghe lại recording kèm transcript có timestamp (bấm câu → nhảy tới đoạn âm
  thanh) trong phạm vi được cấp.
- Nhãn người nói (interviewer/ứng viên) do interviewer xác nhận lại trên
  transcript.
- Rút consent sau ghi: ứng viên/HR ghi nhận rút → hệ thống đánh dấu và xếp
  lịch xóa, chặn mọi truy cập mới.
- Trích đoạn transcript vào evaluation note bằng một thao tác (giữ liên kết
  nguồn).
- Thông báo khi xử lý xong/lỗi qua `contextual-notifications`.

### P2 - nice to have

- Ghi video hoặc nhiều track âm thanh.
- Transcript trực tiếp (live) trong buổi phỏng vấn.
- Gợi ý câu hỏi/chủ đề còn thiếu từ transcript (vẫn là đề xuất, không tự
  gắn vào evaluation).
- Phân tích tỷ lệ thời gian nói interviewer/ứng viên.

## 5. Core Flows (Happy Path)

### 5.1 Consent → ghi → xử lý → review → lưu

1) HR/interviewer mở phiên phỏng vấn đã được xếp lịch trong
   `interview-management`; hệ thống hiển thị trạng thái consent của ứng viên
   (ghi nhận từ lúc xếp lịch nếu đã hỏi qua thư mời, hoặc "chưa hỏi").
2) Nếu chưa có consent: interviewer bấm "Xin phép ghi âm" → hệ thống hiển thị
   nội dung consent (mục đích, ai xem, lưu bao lâu) để đọc/gửi cho ứng viên
   → ứng viên đồng ý → hệ thống ghi consent record (ai, khi nào, nội dung bản
   consent nào).
3) Nút "Bắt đầu ghi" chỉ mở khi consent hợp lệ; interviewer bắt đầu ghi trong
   phiên (hoặc sau buổi chọn "Tải file ghi âm" và tải file lên).
4) Kết thúc buổi → "Dừng ghi" (hoặc upload xong) → recording chuyển "Đang xử
   lý"; hệ thống tạo transcript rồi summary bằng AI provider.
5) Xử lý xong → recording "Sẵn sàng"; interviewer mở trang review: nghe/xem
   file gốc, đọc transcript, sửa bản tóm tắt đề xuất.
6) Interviewer bấm "Xác nhận" → summary chuyển "Đã review", được phép trích
   vào `interview-evaluation`; recording/transcript/summary lưu gắn với
   session + application, hiển thị cho đúng nhóm quyền.
7) Khi cần, HR bấm "Xuất" → chọn transcript/summary (file gốc chỉ khi policy
   cho phép) → hệ thống ghi audit lượt xuất.

```
Interviewer                 Hệ thống                       AI provider    Ứng viên
──────────────────────────────────────────────────────────────────────────────────
Mở phiên PV (đã lên lịch)
        │
        ▼
── Đã có consent ứng viên? ──┐
   │                         │
 Chưa ▼                      │ Có (từ thư mời / lần trước, còn hiệu lực)
┌───────────────────────┐    │
│ Bấm "Xin phép ghi âm" │    │
│ hệ thống hiện nội     │────┼──▶ đọc/gửi cho ──▶ ứng viên quyết định
│ dung consent          │    │                       │
└───────────┬───────────┘    │              ┌────────┴────────┐
            │                │          đồng ý            từ chối
            │                │             │                  │
            │                │   ghi consent record     chặn ghi,
            │                │   (ai/khi nào/bản nào)   interviewer
            │                │             │            ghi chú tay
            │                ▼             │
            │        ┌────────────────────┐│
            └───────▶│ "Bắt đầu ghi" mở  │◀┘
                     │ (ghi trong phiên  │
                     │  hoặc tải file)   │
                     └─────────┬──────────┘
                               ▼
                     Dừng ghi / upload xong
                               ▼
                     ┌────────────────────┐   transcript +   ┌─────────────┐
                     │ Recording:          │── summary ─────▶│ AI provider │
                     │ "Đang xử lý"        │◀─ kết quả ──────│ (server-    │
                     └─────────┬──────────┘                 │  side only) │
                               ▼                            └─────────────┘
                     "Sẵn sàng" → trang review
                     (file gốc + transcript +
                      summary đề xuất)
                               ▼
                     Interviewer sửa summary
                     → "Xác nhận"
                               ▼
                     Summary "Đã review";
                     lưu gắn session +
                     application; HR trong
                     scope xem/xuất + audit

Consent bị rút bất kỳ lúc nào ──▶ chặn truy cập mới,
 đánh dấu xóa theo retention; quá hạn retention ──▶
 tự chuyển lưu trữ/xóa theo policy.
```

### 5.2 Tải file ghi âm sau buổi phỏng vấn

1) Interviewer mở phiên đã diễn ra → "Tải file ghi âm" → chọn file audio hợp
   lệ (định dạng/dung lượng trong giới hạn).
2) Hệ thống kiểm tra: session còn cho phép đính kèm, consent đã được ghi nhận
   cho session này (chưa có → bắt buộc xin consent trước khi nhận file).
3) Upload xong → vào hàng xử lý giống luồng ghi trực tiếp (bước 4-7 của 5.1).

### 5.3 Đưa evidence vào đánh giá phỏng vấn

1) Interviewer/HR mở form đánh giá của session trong `interview-evaluation`.
2) Vùng "Evidence từ recording" liệt kê transcript/summary đã "Đã review" của
   session; chọn trích đoạn → đoạn trích kèm liên kết nguồn vào note đánh giá.
3) HR tổng hợp: khi review kết quả, mở được recording/transcript/summary gốc
   nếu thuộc data-scope của mình.

### 5.4 Ứng viên từ chối hoặc rút consent

1) Từ chối khi được hỏi: hệ thống ghi consent record "từ chối", khoá nút ghi
   và nút tải file cho session đó, gợi ý interviewer ghi chú tay.
2) Rút consent sau khi đã ghi: HR/admin ghi nhận rút → recording/transcript/
   summary chuyển "Chờ xóa": chặn mọi truy cập mới, dừng xử lý đang chạy nếu
   có thể, xếp lịch xóa theo policy; lượt rút được audit.

### 5.5 Hết hạn retention

1) Theo lịch nền, recording/transcript/summary quá thời hạn policy chuyển
   "Hết hạn lưu trữ".
2) Theo policy: chuyển lưu trữ nguội (chỉ admin/HR theo quy trình mở) hoặc
   xóa hẳn; sự kiện được audit, summary đã trích vào evaluation giữ nguyên
   bản đã trích (ghi nhận nguồn đã hết hạn).

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Session đã có consent ứng viên còn hiệu lực? | Cho ghi/tải file | Khoá ghi, hiện nút "Xin phép ghi âm" |
| D2 | 5.1/5.4 | Ứng viên đồng ý khi được hỏi? | Ghi consent record, mở ghi | Ghi "từ chối", khoá ghi, gợi ý ghi chú tay |
| D3 | 5.2 | File tải lên hợp lệ (định dạng + dung lượng)? | Nhận file, vào hàng xử lý | Từ chối + nêu định dạng/giới hạn chấp nhận |
| D4 | 5.1 | Xử lý transcript/summary thành công? | "Sẵn sàng" + báo interviewer | "Lỗi xử lý" + báo người tạo/admin + mở retry |
| D5 | 5.1 | Interviewer xác nhận summary? | "Đã review", cho trích vào evaluation | Giữ "Sẵn sàng" — chưa được dùng làm evidence |
| D6 | 5.3 | Người xem có thuộc data-scope của session? | Cho xem/nghe/xuất + audit | Từ chối truy cập, ghi audit từ chối |
| D7 | 5.4/5.5 | Consent bị rút hoặc hết hạn retention? | Chặn truy cập, xếp lịch xóa/lưu trữ theo policy | Tiếp tục vòng đời bình thường |
| D8 | 5.2 | Consent chưa có khi tải file sau buổi? | Bắt buộc xin consent trước khi nhận file | (không cho tải) |

### 6.2 Scenario Matrix

| Vai trò | Xem/nghe recording | Xem transcript | Xem/sửa summary | Xuất | Xin/xác nhận consent |
|---|---|---|---|---|---|
| Interviewer của session | ✓ | ✓ | ✓ sửa + xác nhận | theo policy | ✓ |
| HR trong scope | ✓ | ✓ | ✓ (xem bản đã review) | ✓ + audit | ghi nhận rút |
| HR ngoài scope | — | — | — | — | — |
| Quản lý trong scope | theo policy | theo policy | ✓ (đã review) | theo policy | — |
| Admin | cấu hình, truy cập kiểm soát khi điều tra | — | — | — | ghi nhận rút |
| Ứng viên | — | — | — | — | đồng ý/từ chối/rút |

### 6.3 State Transitions

```
consent:      chưa-hỏi → đã-đồng-ý → đã-rút
                  └────→ từ-chối

recording:    (chưa có) → đang-ghi → đã-ghi /
              tải-lên → chờ-xử-lý → đang-xử-lý → sẵn-sàng
                                      │            │
                                      ▼            ▼
                                  lỗi-xử-lý    đã-review ──▶ (hết hạn/
                                   │  ↑ retry              consent rút)
                                   └──┘                     ▼
                                                     chờ-xóa → đã-xóa
                                              / hết-hạn-lưu-trữ → lưu-trữ-nguội
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| consent | — | đã-đồng-ý | ứng viên đồng ý (trong thư mời hoặc trong phiên) | rút được → đã-rút |
| consent | — | từ-chối | ứng viên từ chối | có (hỏi lại khi ứng viên đổi ý → đã-đồng-ý) |
| consent | đã-đồng-ý | đã-rút | ứng viên/HR ghi nhận rút | không |
| recording | — | đang-ghi | interviewer bắt đầu ghi (consent hợp lệ) | — |
| recording | đang-ghi | đã-ghi | dừng ghi, file hoàn chỉnh | — |
| recording | — | tải-lên | upload file hợp lệ xong | — |
| recording | đã-ghi/tải-lên | chờ-xử-lý | vào hàng xử lý | — |
| recording | chờ-xử-lý | đang-xử-lý | job xử lý nhận việc | — |
| recording | đang-xử-lý | sẵn-sàng | transcript + summary tạo xong | — |
| recording | đang-xử-lý | lỗi-xử-lý | provider lỗi/hết retry | có (retry → chờ-xử-lý) |
| summary | — | đã-review | interviewer xác nhận bản tóm tắt | sửa lại → vẫn đã-review (ghi phiên bản) |
| recording (+transcript, summary) | sẵn-sàng/đã-review | chờ-xóa | consent bị rút | không |
| recording (+transcript, summary) | chờ-xóa | đã-xóa | job xóa theo policy chạy | không |
| recording (+transcript, summary) | sẵn-sàng/đã-review | hết-hạn-lưu-trữ | quá thời hạn retention | — |
| recording | hết-hạn-lưu-trữ | lưu-trữ-nguội hoặc đã-xóa | theo policy retention | theo policy |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Browser đóng/mất mạng khi đang ghi trong phiên | phần đã ghi phía server (nếu nền ghi là server-side) hoặc file cục bộ chưa tải | mở lại session → thấy trạng thái "đang-ghi" hoặc file dở → tiếp tục ghi / tải phần dở | file dở không hoàn chỉnh quá hạn → "lỗi-xử-lý" + báo interviewer |
| Upload file giữa chừng bị ngắt | file part chưa hoàn chỉnh | cho tải lại cùng file (ghi đè part dở) | part dở quá hạn tự dọn |
| AI provider lỗi/timeout khi tạo transcript/summary | recording "đang-xử-lý"/"lỗi-xử-lý", file gốc nguyên vẹn | retry tự động có giới hạn → hết thì "lỗi-xử-lý", interviewer/admin bấm retry thủ công | không xóa file gốc; dead-letter báo admin |
| Consent bị rút khi đang xử lý | recording đang xử lý | dừng job nếu có thể; nếu transcript đã tạo thì đưa cả vào "chờ-xóa" | xóa theo policy, audit |
| Interviewer mở review ở 2 thiết bị | cùng bản summary | lưu ở thiết bị sau → cảnh báo "bản vừa được cập nhật — tải lại" | — |
| Xin consent mới khi đã có yêu cầu chờ | yêu cầu cũ còn hiệu lực | dedup: hiện trạng thái "đang chờ ứng viên", không gửi trùng | — |

### 6.5 Other Edge Cases

- Session không có interviewer được gán (interviewer từ chối lịch): vẫn cho
  ghi/tải khi có người được phân công mới và consent hợp lệ; trạng thái
  consent gắn với session chứ không gắn interviewer.
- Ứng viên đồng ý ở một session, session sau là vòng khác: consent cần ghi
  theo session (mỗi buổi hỏi lại) — đề xuất, chờ duyệt (OQ-4).
- File tải lên không phải của session đó (nhầm buổi): interviewer gắn sai
  session → cho "Gỡ file" khi chưa "đã-review"; đã review rồi thì chỉ admin
  gỡ và audit.
- Recording có nhiều người ngoài ứng viên (panel interview): consent cần của
  mọi người được ghi — v1 giả định ứng viên là bắt buộc, thành viên nội bộ
  được thông báo qua chính sách nội bộ (OQ-5).
- Transcript tiếng Việt lẫn tiếng Anh: đánh dấu ngôn ngữ chính, phần còn lại
  giữ nguyên âm bản; không tự dịch trong v1.
- Empty state: session chưa có recording → "Chưa có ghi âm — xin consent để
  bắt đầu".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Consent | bắt buộc trước khi ghi/tải; ghi nhận người đồng ý, thời điểm, kênh (thư mời / trong phiên), phiên bản nội dung consent |
| Nội dung consent | bản do admin/HR duyệt trong cấu hình; thay đổi nội dung → consent cũ vẫn ghi phiên bản đã đồng ý |
| File tải lên | định dạng audio: mp3, m4a, wav, webm, ogg (đề xuất — chờ duyệt, OQ-2); không nhận file thiếu audio track |
| Dung lượng file | tối đa 500 MB / file (đề xuất — chờ duyệt, OQ-2) |
| Thời lượng ghi | tối đa 4 giờ / session (đề xuất — chờ duyệt, OQ-2) |
| Retention recording/transcript/summary | theo policy admin cấu hình; mặc định đề xuất 90 ngày (chờ OQ-6 sản phẩm duyệt) |
| Summary trước khi dùng | chỉ "đã-review" mới được trích vào evaluation |
| Quyền truy cập | chỉ interviewer của session, HR/quản lý trong data-scope, admin khi điều tra — deny-by-default |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Định dạng file audio | mp3, m4a, wav, webm, ogg | — | chặn upload + nêu danh sách chấp nhận |
| Dung lượng file tải lên | 500 MB (đề xuất — chờ duyệt) | mỗi file | chặn upload + thông báo giới hạn |
| Thời lượng recording | 4 giờ (đề xuất — chờ duyệt) | mỗi session | tự dừng ghi + báo interviewer |
| Retry xử lý tự động | 3 lần (đề xuất — chờ duyệt) | mỗi recording | sau đó "lỗi-xử-lý" + báo người tạo/admin |
| Retention mặc định | 90 ngày (đề xuất — chờ OQ-6) | từ ngày "đã-review" | hết hạn → lưu trữ nguội/xóa theo policy |
| Số recording / session | 5 (đề xuất — chờ duyệt) | mỗi session | chặn thêm + gợi ý gỡ file cũ chưa review |
| SLA xử lý transcript+summary | 30 phút (đề xuất — chờ duyệt, OQ-3) | từ lúc vào hàng | quá SLA báo admin + hiện "xử lý chậm" |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Ghi khi chưa có consent | "Chưa có đồng ý ghi âm của ứng viên — xin phép trước khi ghi" | E-? |
| Ứng viên từ chối | "Ứng viên không đồng ý ghi âm — buổi phỏng vấn sẽ không được ghi" | E-? |
| File sai định dạng | "Định dạng không hỗ trợ — chỉ nhận mp3, m4a, wav, webm, ogg" | E-? |
| File quá lớn | "File vượt quá 500 MB — nén hoặc tải file nhỏ hơn" | E-? |
| Xử lý lỗi | "Chưa tạo được transcript — file gốc vẫn an toàn, bạn có thể thử lại" | E-? |
| Không có quyền xem | "Bạn không có quyền truy cập ghi âm này" | E-? |
| Consent đã rút | "Ghi âm này đã bị rút đồng ý và đang chờ xóa — không thể truy cập" | E-? |
| Không xuất được | "Không xuất được dữ liệu — thử lại sau" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi yêu cầu consent | "Đã gửi nội dung xin phép ghi âm tới {ứng viên}" |
| Ghi nhận consent | "Ứng viên đã đồng ý ghi âm lúc {HH:mm DD/MM}" |
| Dừng ghi | "Đã lưu ghi âm — hệ thống đang tạo transcript" |
| Upload xong | "Đã tải file lên — đang xử lý transcript" |
| Xác nhận summary | "Bản tóm tắt đã được xác nhận và có thể dùng làm evidence" |
| Xuất xong | "Đã xuất {loại dữ liệu} — lượt xuất đã được ghi lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang chờ consent | "Đang chờ ứng viên đồng ý ghi âm" |
| Đang xử lý | "Đang tạo transcript và tóm tắt — thường mất vài phút" |
| Xử lý chậm | "Việc xử lý đang chậm hơn bình thường — bạn sẽ được báo khi xong" |
| Summary chưa review | "Bản tóm tắt là đề xuất của AI — cần bạn kiểm tra và xác nhận" |
| Sắp hết hạn | "Ghi âm này sẽ hết hạn lưu trữ vào {DD/MM}" |
| Đoạn trích đã gắn | "Đã trích vào đánh giá kèm liên kết nguồn" |
| Empty state | "Chưa có ghi âm — xin consent để bắt đầu" |

## 8. Assumptions

- Session phỏng vấn (lịch, participant, trạng thái) đã tồn tại từ
  `interview-management`; feature này chỉ gắn recording/evidence vào session,
  không quản lý lịch.
- Evaluation form và đường review của HR đã có ở `interview-evaluation`;
  summary đã review chỉ là evidence đầu vào, không tự tạo đánh giá.
- Consent hỏi được qua hai kênh: trong thư mời phỏng vấn (trước buổi) và
  trong phiên (interviewer đọc nội dung + ghi nhận miệng/trực tiếp) — chi
  tiết kênh nào bắt buộc chờ OQ-4.
- AI transcription/summarization chạy qua provider được admin cấu hình ở
  `platform-configuration`/`external-integrations`, credential chỉ phía
  server; không xử lý ở trình duyệt.
- "Ghi trong phiên" phụ thuộc nền họp được chọn; khi nền họp không hỗ trợ
  ghi phía server, đường đi chuẩn là tải file sau buổi (OQ-6).
- Ứng viên có email/kênh liên hệ từ hồ sơ CV để nhận nội dung consent trước
  buổi nếu chọn kênh đó.
- Retention/access policy cho recording/transcript/evaluation sẽ được
  Product + DPO duyệt (OQ-6 sản phẩm); trước khi duyệt chỉ dùng dữ liệu
  thử/synthetic cho pilot.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Ghi mà consent chưa đầy đủ/không truy vết được | thỉnh thoảng | vi phạm cam kết privacy, ứng viên complaint, mất niềm tin buyer | consent là điều kiện cứng mở ghi; consent record có phiên bản nội dung + audit |
| Retention/quyền truy cập chưa được duyệt (OQ-6 mở) | thường | recording chứa dữ liệu nhạy cảm giữ quá hạn/lộ sai người — rủi ro chính của PRD | chặn pilot dữ liệu thật tới khi policy duyệt; deny-by-default; retention mặc định đề xuất chờ duyệt |
| Transcript AI sai nội dung (tên, số liệu, tiếng lóng) | thường | đánh giá dựa trên evidence sai, tranh chấp với ứng viên | summary/transcript chỉ là đề xuất phải qua xác nhận; nghe lại file gốc 1 chạm; provenance rõ |
| AI provider lỗi/quá tải → xử lý treo | thỉnh thoảng | interviewer chờ, kế hoạch review chậm | retry có giới hạn + retry thủ công + báo admin; file gốc không mất |
| Interviewer lười review summary, copy thẳng vào evaluation | thỉnh thoảng | lỗi AI thành "fact" trong quyết định tuyển | chỉ bản "đã-review" mới trích được; audit ai xác nhận |
| Vendor lock-in / chi phí transcription theo phút | thỉnh thoảng | vượt ngân sách khi tuyển nhiều | theo dõi qua `ai-usage-monitoring`; giới hạn thời lượng/dung lượng |
| Ứng viên rút consent sau khi HR đã trích vào evaluation | hiếm | phải gỡ evidence khỏi hồ sơ quyết định | đoạn trích ghi nguồn; khi xóa, đánh dấu đoạn trích "nguồn đã rút/xóa" để HR xử lý |

## 10. Success Criteria (preliminary)

- Tỷ lệ recording được xử lý và review trong SLA — target chờ OQ-3 (đo: số
  recording có "đã-review" trong SLA / số recording đủ consent).
- 100% recording được tạo đều có consent record hợp lệ đi kèm (guardrail
  bắt buộc, không phải chỉ số tối ưu).
- Tỷ lệ phiên phỏng vấn có evidence truy nguyên được (recording/transcript/
  summary đã review gắn session) — baseline chưa có, xác lập trong pilot.
- Số sự cố truy cập vượt data-scope = 0.

## 11. Open Questions

- [ ] OQ-1: Kế thừa OQ-6 sản phẩm — retention/consent chính thức cho
  recording, transcript, summary và evaluation là gì (thời hạn, ai xem, quy
  trình rút/xóa, legal hold)?
- [ ] OQ-2: Giới hạn đề xuất có được duyệt: định dạng (mp3/m4a/wav/webm/ogg),
  500 MB/file, 4 giờ/session, 5 recording/session, retry 3 lần?
- [ ] OQ-3: SLA xử lý transcript + summary chấp nhận được là bao lâu (đề
  xuất 30 phút) và target "xử lý + review trong SLA" là bao nhiêu %?
- [ ] OQ-4: Consent hỏi qua kênh nào là bắt buộc — trong thư mời trước buổi,
  trong phiên khi bắt đầu, hay cả hai? Consent theo session hay theo toàn bộ
  quy trình của ứng viên?
- [ ] OQ-5: Panel interview nhiều người bị ghi: cần consent của từng người
  thế nào (thành viên nội bộ tính theo chính sách lao động)?
- [ ] OQ-6: "Ghi trong phiên" chạy trên nền nào — hệ thống họp tích hợp sẵn,
  hay bắt buộc đường tải file khi nền họp không cho ghi phía server?
- [ ] OQ-7: Ai được xuất file gốc (chỉ HR trong scope, hay cả admin) và xuất
  ra định dạng nào được cho phép?

## 12. Next Steps

- `/urd interview-recording` — capture user perspective
- `/brd interview-recording` — business case
- `/prd-epic interview-recording` — product scope
