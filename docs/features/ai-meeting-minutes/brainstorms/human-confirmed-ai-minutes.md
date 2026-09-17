---
type: brainstorm
feature: ai-meeting-minutes
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md]
---

# Biên bản AI được chủ trì xác nhận — ai-meeting-minutes

## 1. Idea Seed

Từ transcript đã sẵn sàng của một cuộc họp, AI đề xuất một bản biên bản có cấu
trúc: tóm tắt nội dung, các quyết định đã chốt, vấn đề còn mở, rủi ro, và các
đầu việc kèm người phụ trách đề xuất và hạn xử lý — mỗi mục đều trỏ về đoạn
transcript làm bằng chứng. Chủ trì đối chiếu, sửa, loại bỏ hoặc bổ sung rồi
xác nhận; chỉ sau khi chủ trì xác nhận, biên bản mới trở thành bản ghi nghiệp
vụ được công bố trong cuộc họp.

## 2. Context

Sau khi `meeting-records` đưa transcript vào một nguồn dữ liệu duy nhất, chủ
trì vẫn phải đọc lại toàn văn và tự tổng hợp biên bản — công đoạn tốn thời
gian nhất của chuỗi họp. AI có thể nén transcript thành bản nháp biên bản,
nhưng theo invariant human-in-the-loop (PRD Mục 12) và mục "Chưa làm" của PRD
Mục 7.14, AI không được tự công bố biên bản khi chưa có con người xác nhận.
Rủi ro chính của feature là gán sai người (AI đoán nhầm ai chịu trách nhiệm
một việc) hoặc bỏ mất quyết định (AI tóm tắt sót), nên mỗi mục đề xuất phải
kèm trích dẫn đoạn transcript để chủ trì kiểm chứng nhanh. Feature này là
`Should` trong theme Meetings & Work — không thuộc cam kết pilot v1 — và là
đầu vào trực tiếp của `meeting-to-tasks` (chuyển đầu việc đã xác nhận thành
task). Phụ thuộc duy nhất theo Feature Map: `meeting-records` (transcript
READY, danh bạ participant, biên bản/revision). Nguồn ITBAAI không có triển
khai tương đương biên bản họp bằng AI — đây là nhu cầu mới suy từ PRD, không
có bằng chứng hiện trạng.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Chủ trì | Phải đọc lại toàn văn transcript và tự tổng hợp biên bản sau mỗi cuộc họp | Bản nháp biên bản AI có cấu trúc để review nhanh, sửa và xác nhận |
| Người tham gia | Không rà được biên bản có phản ánh đúng điều mình nói/cam kết không | Biên bản được công bố có bằng chứng trích dẫn transcript để đối chiếu |
| Quản lý | Biên bản tổng hợp tay dễ sót quyết định hoặc gán sai người phụ trách | Biên bản đã xác nhận với đầu việc rõ người, rõ hạn |
| Admin | AI output có thể đi thẳng thành bản ghi chính thức không qua kiểm chứng | Luồng bắt buộc con người xác nhận, có provenance và audit |

## 4. Capabilities Breakdown

### P0 — must have

- Sinh bản đề xuất biên bản từ transcript ở trạng thái READY của cuộc họp:
  chủ trì bấm "Sinh biên bản bằng AI", hệ thống tạo job xử lý có trạng thái.
- Bản đề xuất có cấu trúc gồm: tóm tắt cuộc họp, danh sách quyết định đã
  chốt, vấn đề còn mở, rủi ro, và đầu việc (nội dung việc + người phụ trách
  đề xuất + hạn đề xuất).
- Provenance từng mục: mỗi quyết định/vấn đề/rủi ro/đầu việc trỏ về một hoặc
  nhiều đoạn transcript nguồn để chủ trì kiểm chứng.
- Đối chiếu danh bạ: tên người AI trích được trong đầu việc được đối chiếu
  với participant cuộc họp và danh bạ nội bộ; không khớp được thì gắn cờ
  "chưa xác định" (unknown-person warning) — không tự gán bừa.
- Màn review của chủ trì: xem từng mục kèm trích dẫn, giữ nguyên / sửa nội
  dung / đổi loại mục / loại bỏ / thêm mục thủ công; resolve người "chưa xác
  định" bằng cách gán participant hoặc người trong danh bạ.
- Xác nhận và công bố: chủ trì bấm "Xác nhận biên bản" → nội dung đã duyệt
  trở thành biên bản PUBLISHED của cuộc họp (ghi vào meeting record), ghi
  nhận người xác nhận và thời điểm.
- Từ chối/bỏ bản đề xuất: chủ trì có thể hủy bản đề xuất và viết biên bản
  tay như luồng `meeting-records` — AI chỉ là đường hỗ trợ.
- Sinh lại: chủ trì chạy lại việc sinh biên bản (ví dụ sau khi sửa nhãn
  người nói); bản đề xuất mới thay thế bản cũ chưa xác nhận, bản cũ được giữ
  vết.
- Cảnh báo lệch nguồn: khi transcript bị sửa sau khi đã có bản đề xuất, hiện
  cảnh báo "đề xuất không còn khớp transcript hiện tại".

### P1 — should have

- Nhảy từ mục biên bản tới đúng đoạn transcript nguồn trong transcript viewer.
- Diff tóm tắt giữa đề xuất AI và bản chủ trì đã sửa — phục vụ đo "tỷ lệ đề
  xuất được giữ lại" (mục Đo thành công của PRD).
- Sinh lại từng phần (chỉ tóm tắt, chỉ đầu việc) thay vì toàn bộ bản đề xuất.
- Nhắc chủ trì khi có bản đề xuất chờ review quá lâu (qua
  `contextual-notifications`).

### P2 — nice to have

- Chia bản đề xuất theo mục agenda của cuộc họp.
- Mẫu biên bản theo loại cuộc họp (họp tuần, review dự án, 1-1).
- Học theo cách chủ trì sửa để đề xuất sát hơn ở các cuộc họp sau.
- Đề xuất song ngữ khi transcript đa ngôn ngữ (chờ scope ngoài tiếng Việt).

## 5. Core Flows (Happy Path)

### 5.1 Transcript → AI đề xuất → đối chiếu danh bạ → chủ trì sửa/xác nhận → publish

1) Cuộc họp có transcript ở trạng thái READY (do `meeting-records` xử lý).
   Chủ trì mở meeting record, bấm "Sinh biên bản bằng AI".
2) Hệ thống tạo job sinh biên bản, hiển thị "đang tạo bản đề xuất"; xong thì
   bản đề xuất hiện trong màn review với các phần: tóm tắt, quyết định, vấn
   đề mở, rủi ro, đầu việc.
3) Hệ thống đối chiếu tên người trong đầu việc với participant + danh bạ:
   khớp thì gán sẵn, không khớp thì gắn cờ "chưa xác định".
4) Chủ trì duyệt từng mục: giữ nguyên / sửa nội dung / đổi loại / loại bỏ /
   thêm mục tay; resolve các người "chưa xác định" hoặc để nguyên văn tên
   trong transcript.
5) Chủ trì bấm "Xác nhận biên bản" → biên bản chuyển PUBLISHED trên meeting
   record, hiển thị cho người trong phạm vi; mọi thao tác giữ/sửa/loại được
   ghi nhận.

```
Chủ trì                     Hệ thống                        AI provider
─────────────────────────────────────────────────────────────────────────
Transcript READY trên record
        │
        ▼ "Sinh biên bản bằng AI"
   job sinh biên bản ────────▶ gửi transcript ──▶ trích xuất có cấu trúc
        │                                              │
        │                                              ▼
        │                              tóm tắt + quyết định + vấn đề mở
        │                              + rủi ro + đầu việc (kèm trích dẫn)
        ▼                                              │
   đối chiếu danh bạ ◀─────────────────────────────────┘
   (tên người → participant/danh bạ; không khớp → "chưa xác định")
        │
        ▼
   ┌────────────────────────────────────────┐
   │ Màn review: từng mục + trích dẫn       │
   │ chủ trì giữ / sửa / đổi loại / loại bỏ │
   │ / thêm tay / resolve người chưa rõ     │
   └───────────────────┬────────────────────┘
                       ▼
              ── Chủ trì xác nhận? ──┐
                │                   │
              Có ▼                Không ▼
        MINUTES PUBLISHED     tiếp tục sửa / bỏ bản đề xuất
        trên meeting record   (viết biên bản tay)
        + ghi người xác nhận

Sinh lại: chủ trì chạy lại → bản đề xuất mới thay thế bản cũ
chưa xác nhận; bản cũ giữ vết trạng thái "đã thay thế".
```

### 5.2 Xử lý cảnh báo người chưa xác định

1) Trong bản đề xuất, đầu việc có người phụ trách "chưa xác định" hiển thị
   cờ cảnh báo kèm tên nguyên văn AI trích được từ transcript.
2) Chủ trì mở mục → chọn gán participant cuộc họp, gán người trong danh bạ
   nội bộ, hoặc giữ nguyên văn (không gán ai).
3) Nếu để "chưa xác định" khi xác nhận → biên bản vẫn publish, đầu việc ghi
   tên nguyên văn; hệ thống ghi nhận còn người chưa resolve để
   `meeting-to-tasks` biết phải xử lý trước khi tạo task.

### 5.3 Sinh lại bản đề xuất sau khi transcript thay đổi

1) Chủ trì sửa nhãn người nói/nội dung transcript trong `meeting-records`.
2) Bản đề xuất hiện hữu (chưa xác nhận) hiện cảnh báo "đề xuất không còn
   khớp transcript hiện tại".
3) Chủ trì chọn: giữ bản đề xuất hiện tại tiếp tục review, hoặc "Sinh lại" →
   job mới tạo bản đề xuất mới thay thế; bản cũ chuyển trạng thái "đã thay
   thế", giữ vết ai/khi nào.
4) Nếu bản đề xuất đã được chủ trì sửa nhiều, trước khi thay thế hệ thống
   hỏi xác nhận "bản sửa hiện tại sẽ bị thay thế".

### 5.4 Bỏ bản đề xuất, viết biên bản tay

1) Chủ trì chọn "Bỏ bản đề xuất" → bản đề xuất chuyển "đã hủy", giữ vết.
2) Chủ trì viết biên bản tay theo luồng của `meeting-records`; meeting
   record vẫn hợp lệ, không còn đề xuất AI chờ xử lý.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Transcript cuộc họp đang ở trạng thái READY? | Cho bấm "Sinh biên bản bằng AI", tạo job | Nút bị vô hiệu + giải thích (transcript chưa sẵn sàng/không có file ghi) |
| D2 | 5.1 | Job sinh biên bản thành công? | Hiện bản đề xuất trong màn review | Trạng thái FAILED + thông báo chủ trì + chạy lại/viết tay |
| D3 | 5.1/5.2 | Tên người trong đầu việc khớp participant hoặc danh bạ? | Gán sẵn người đề xuất, cho chủ trì đổi | Gắn cờ "chưa xác định", giữ tên nguyên văn |
| D4 | 5.1 | Chủ trì đồng ý xác nhận biên bản? | MINUTES chuyển PUBLISHED, ghi người xác nhận | Bản đề xuất ở "đang review", tiếp tục sửa |
| D5 | 5.2 | Còn đầu việc có người "chưa xác định" khi xác nhận? | Vẫn cho publish, đầu việc ghi tên nguyên văn + cờ chưa resolve | (không chặn publish — chỉ cảnh báo) |
| D6 | 5.3 | Transcript thay đổi sau khi bản đề xuất đã tồn tại? | Hiện cảnh báo lệch nguồn + đề nghị sinh lại | Không làm gì nếu đề xuất đã PUBLISHED (biên bản đã chốt) |
| D7 | 5.3 | Bản đề xuất hiện tại đã bị chủ trì sửa khi bấm "Sinh lại"? | Hỏi xác nhận "bản sửa hiện tại sẽ bị thay thế" trước khi chạy | Sinh lại ngay khi bản chưa có sửa tay |
| D8 | 5.4 | Chủ trì chọn bỏ bản đề xuất? | Đề xuất chuyển "đã hủy", mở biên bản tay | — |

### 6.2 Scenario Matrix

| Vai trò | Bản đề xuất mới sinh | Bản đang review | Biên bản đã publish | Bản đã thay thế/hủy |
|---|---|---|---|---|
| Chủ trì | xem, sửa, resolve, xác nhận, bỏ | xem, sửa tiếp, xác nhận, bỏ, sinh lại | xem; sửa qua revision của `meeting-records` | xem vết |
| Người tham gia | — | — | xem trong phạm vi + đối chiếu trích dẫn | — |
| Quản lý trong scope | — | — | xem trong phạm vi | — |
| Admin | xem (audit), không tự xác nhận thay | xem | xem, xử lý tranh chấp | xem |

### 6.3 State Transitions

```
job sinh biên bản: QUEUED → PROCESSING → READY
                              │
                              └──▶ FAILED ──(retry thủ công)──▶ QUEUED

bản đề xuất: PROPOSED → REVIEWING → CONFIRMED ──▶ (xuất bản) PUBLISHED
                │          │
                │          └──▶ DISCARDED (chủ trì bỏ)
                └──▶ SUPERSEDED (bản đề xuất mới thay thế)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| job sinh biên bản | — | QUEUED | chủ trì bấm sinh / sinh lại | — |
| job sinh biên bản | QUEUED | PROCESSING | worker nhận job | — |
| job sinh biên bản | PROCESSING | READY | trích xuất xong, bản đề xuất tạo | — |
| job sinh biên bản | PROCESSING | FAILED | provider lỗi/timeout hết retry | có (retry thủ công → QUEUED) |
| bản đề xuất | — | PROPOSED | job READY tạo bản | — |
| bản đề xuất | PROPOSED | REVIEWING | chủ trì mở/sửa mục đầu tiên | — |
| bản đề xuất | REVIEWING | CONFIRMED | chủ trì bấm "Xác nhận biên bản" | — |
| bản đề xuất | CONFIRMED | (xuất bản) | ghi vào MINUTES PUBLISHED của record | không (sửa sau đó qua revision) |
| bản đề xuất | PROPOSED/REVIEWING | DISCARDED | chủ trì "Bỏ bản đề xuất" | không |
| bản đề xuất | PROPOSED/REVIEWING | SUPERSEDED | job sinh lại tạo bản mới | không |
| mục đề xuất | đề xuất | được giữ / đã sửa / bị loại / thêm tay | thao tác review của chủ trì | có (trước khi xác nhận) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Chủ trì đóng trình duyệt giữa lúc review | bản đề xuất REVIEWING + các mục đã sửa đã lưu | mở lại meeting record tiếp tục review | đề xuất chờ quá lâu → nhắc qua notification |
| Job AI lỗi/timeout giữa chừng | job FAILED, không có bản đề xuất | chủ trì bấm chạy lại; hoặc viết tay | job lỗi ghi trạng thái + log |
| Transcript bị sửa trong lúc review | bản đề xuất đánh dấu "lệch nguồn" | chủ trì giữ bản hoặc sinh lại | — |
| 2 người có quyền cùng sửa bản đề xuất | bản lưu sau ghi đè | cảnh báo "bản đề xuất vừa được {người} cập nhật" | chỉ chủ trì được xác nhận — quyền sửa nới cho admin theo scope |
| Chủ trì bấm xác nhận đúng lúc transcript đổi | kiểm lại cờ lệch nguồn trước khi publish | nếu lệch nguồn → cảnh báo hỏi tiếp tục | — |
| Sinh lại khi đã có bản REVIEWING nhiều sửa tay | bản cũ SUPERSEDED sau xác nhận người dùng | bản mới review từ đầu | bản cũ giữ vết, không mất âm thầm |

### 6.5 Other Edge Cases

- Cuộc họp không có file ghi hoặc transcript FAILED: nút sinh biên bản AI vô
  hiệu, hướng dẫn chủ trì viết biên bản tay — AI không bắt buộc.
- Transcript rỗng hoặc quá ngắn (không nhận diện được lời nói): job hoàn tất
  nhưng bản đề xuất gần như trống → cảnh báo, gợi ý viết tay.
- AI trích được tên người không có trong danh bạ nội bộ (khách ngoài): cờ
  "chưa xác định" + cho gán sang participant khách (ghi tên) của cuộc họp.
- AI đề xuất đầu việc trùng nhau (hai câu nói cùng một việc): chủ trì loại
  bỏ mục trùng trong review; hệ thống không tự gộp.
- Bản đề xuất đã CONFIRMED/publish: không sửa trực tiếp được nữa — mọi sửa
  sau đó đi qua revision biên bản của `meeting-records`.
- Cuộc họp bị hủy sau khi đã publish biên bản: biên bản vẫn giữ theo quy tắc
  record CANCELLED của `meeting-records`.
- Empty state: transcript có nhưng AI không trích được mục nào → bản đề xuất
  chỉ có tóm tắt, chủ trì tự thêm mục tay.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Điều kiện sinh biên bản | cuộc họp có ≥1 transcript ở trạng thái READY; người bấm là chủ trì (hoặc admin theo scope) |
| Nội dung mục đề xuất | mỗi mục có loại (tóm tắt/quyết định/vấn đề mở/rủi ro/đầu việc) + nội dung không rỗng + ≥1 trích dẫn đoạn transcript (trừ mục thêm tay) |
| Người phụ trách đầu việc | một trong: participant cuộc họp / người trong danh bạ nội bộ / "chưa xác định" kèm tên nguyên văn |
| Hạn đầu việc | ngày hợp lệ, có thể trống (AI không trích được hạn thì để trống, không bịa) |
| Mục thêm tay | loại + nội dung bắt buộc; trích dẫn transcript tùy chọn |
| Xác nhận biên bản | chỉ chủ trì (hoặc admin theo scope khi chủ trì không khả dụng — ghi rõ ai xác nhận thay) |
| Sửa sau publish | cấm trên bản đề xuất; đi qua MINUTES_REVISION |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Bản đề xuất đang mở mỗi cuộc họp | 1 | — | bản mới thay thế bản cũ (SUPERSEDED) |
| Số lần sinh lại bản đề xuất | 3 lần | mỗi cuộc họp / 24 giờ | chặn nút sinh lại, báo giới hạn |
| Độ dài transcript đưa vào job | 150.000 ký tự | mỗi job | chặn job + báo transcript quá dài, gợi ý chia file |
| Số mục trong bản đề xuất | 50 mục | mỗi bản | phần vượt gộp vào "mục khác", cảnh báo chủ trì |
| Retry job khi provider lỗi | 3 lần tự động | sau 5 phút, 30 phút, 2 giờ | hết số lần → FAILED + thông báo |
| Thời gian nhắc review | 48 giờ | sau khi bản đề xuất READY chưa review | gửi nhắc chủ trì qua notification |
| Kết quả đối chiếu danh bạ hiển thị | 10 gợi ý | mỗi lượt resolve | cuộn/tìm thêm trong danh bạ |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Transcript chưa sẵn sàng | "Chưa thể tạo biên bản bằng AI — transcript của cuộc họp chưa sẵn sàng" | E-? |
| Cuộc họp không có transcript | "Cuộc họp này chưa có transcript — hãy tải file ghi hoặc viết biên bản thủ công" | E-? |
| Job thất bại hết retry | "Không tạo được bản đề xuất biên bản — thử tạo lại hoặc viết biên bản thủ công" | E-? |
| Transcript quá dài | "Transcript vượt quá 150.000 ký tự — chia nhỏ file ghi rồi tạo lại" | E-? |
| Vượt số lần sinh lại | "Đã đạt tối đa 3 lần tạo lại trong 24 giờ cho cuộc họp này" | E-? |
| Không có quyền xác nhận | "Chỉ chủ trì cuộc họp mới được xác nhận biên bản" | E-? |
| Nội dung mục rỗng | "Nội dung mục không được để trống — điền nội dung hoặc loại bỏ mục này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Job hoàn tất | "Bản đề xuất biên bản đã sẵn sàng — hãy kiểm tra trước khi xác nhận" |
| Xác nhận biên bản | "Biên bản đã được xác nhận và công bố trong cuộc họp" |
| Sinh lại xong | "Đã tạo bản đề xuất mới — bản trước đã được lưu vết thay thế" |
| Bỏ bản đề xuất | "Đã bỏ bản đề xuất — bạn có thể viết biên bản thủ công" |
| Resolve người | "Đã gán {tên người} cho đầu việc" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Nhãn bản đề xuất | "Biên bản do AI đề xuất — chủ trì kiểm tra và xác nhận trước khi công bố" |
| Người chưa xác định | "AI chưa xác định được {n} người trong đầu việc — kiểm tra trước khi xác nhận" |
| Lệch nguồn | "Transcript đã thay đổi sau khi bản đề xuất này được tạo — cân nhắc tạo lại" |
| Xác nhận khi lệch nguồn | "Bản đề xuất không còn khớp transcript hiện tại — vẫn xác nhận xuất bản?" |
| Sắp bị thay thế | "Bản đề xuất đang có chỉnh sửa của bạn — tạo lại sẽ thay thế toàn bộ" |
| Empty state | "AI chưa trích được mục nào ngoài tóm tắt — bạn có thể thêm mục thủ công" |
| Provenance mục | "Nguồn: đoạn transcript #{n} — {trích dẫn ngắn}" |

## 8. Assumptions

- Việc sinh biên bản do chủ trì chủ động bấm nút, KHÔNG tự động chạy khi
  transcript READY — giảm job lãng phí cho cuộc họp không cần biên bản và giữ
  hành động AI có chủ đích của con người (Assumption — chờ Product owner
  xác nhận).
- AI provider dùng để sinh biên bản là provider đã cấu hình cho tenant qua
  `platform-configuration`, cùng cụm với dịch vụ transcript nhưng là job
  riêng (transcription vs summarization).
- Bản đề xuất AI không phải bản ghi nghiệp vụ: chỉ sau "Xác nhận biên bản"
  nội dung mới ghi vào MINUTES PUBLISHED của `meeting-records` — bám invariant
  human-in-the-loop (PRD Mục 12) và "Chưa làm" của PRD Mục 7.14.
- Mỗi mục đề xuất phải kèm trích dẫn đoạn transcript (provenance) trừ mục
  chủ trì thêm tay — đây là cách chống rủi ro "bỏ mất quyết định" và "gán
  sai người" của PRD Mục 7.14.
- Đối chiếu danh bạ chỉ dò trong participant cuộc họp + danh bạ người dùng
  nội bộ cùng tổ chức — không dò người ngoài tổ chức.
- Chỉ chủ trì được xác nhận; admin theo scope xem/xử lý tranh chấp nhưng khi
  xác nhận thay phải ghi rõ "xác nhận thay chủ trì" (mở rộng từ BR-003 của
  `meeting-records`).
- Giới hạn số ở Mục 7.2 (150.000 ký tự, 50 mục, 3 lần sinh lại, 48 giờ nhắc)
  là giá trị đề xuất thận trọng — cần owner chốt (xem OQ-4).
- Không dùng ngưỡng confidence để tự chấp nhận hoặc tự loại mục — mọi mục đều
  qua mắt chủ trì; confidence (nếu có) chỉ sắp xếp thứ tự review.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| AI gán sai người phụ trách đầu việc | thỉnh thoảng | việc giao nhầm người, tranh chấp trách nhiệm | đối chiếu danh bạ + cờ "chưa xác định" thay vì đoán; chủ trì resolve trước xác nhận; `meeting-to-tasks` chặn tạo task khi chưa resolve |
| AI tóm tắt sót quyết định đã chốt | thỉnh thoảng | biên bản thiếu cam kết, mất evidence quyết định | mọi mục kèm trích dẫn transcript để đối chiếu nhanh; chủ trì thêm mục tay; đo tỷ lệ đề xuất được giữ lại |
| Chủ trì bấm xác nhận không đọc (review lướt) | thỉnh thoảng | biên bản AI lỗi trở thành bản ghi chính thức | màn review buộc qua từng phần, nhãn "do AI đề xuất" rõ; audit ai xác nhận; đo mức sửa trung bình để phát hiện rubber-stamp |
| Job AI lỗi/provider chưa cấu hình | thỉnh thoảng | chủ trì quay lại viết tay, chậm biên bản | retry có hạn + FAILED rõ ràng + đường biên bản tay luôn mở (kế thừa `meeting-records`) |
| Transcript sửa sau khi đề xuất đã tạo → biên bản lệch nguồn | hiếm | publish biên bản không khớp nội dung thật | cờ "lệch nguồn" + hỏi xác nhận trước publish; sinh lại có kiểm soát |
| Chi phí AI cho cuộc họp không cần biên bản | thường | lãng phí ngân sách AI (bám R-14 PRD) | sinh thủ công theo nút bấm, giới hạn sinh lại 3 lần/ngày |
| Nội dung nhạy cảm trong biên bản lộ ngoài phạm vi | hiếm | lộ thông tin nhân sự/kinh doanh | truy cập biên bản theo participant + scope của `meeting-records`; không mở rộng quyền mới |

## 10. Success Criteria (preliminary)

- Thời gian chủ trì review và xác nhận biên bản giảm rõ so với viết tay —
  mục tiêu theo PRD Mục 7.14 ("thời gian review biên bản"); con số chờ OQ-2.
- Tỷ lệ mục đề xuất AI được chủ trì giữ nguyên hoặc giữ sau sửa nhỏ —
  "tỷ lệ đề xuất được giữ lại" theo PRD Mục 7.14; target chờ OQ-2.
- 100% biên bản PUBLISHED có bản ghi xác nhận của chủ trì (người + thời điểm).
- 100% mục đề xuất có trích dẫn transcript nguồn (trừ mục thêm tay).
- 0 biên bản được publish mà không qua bước xác nhận của con người (guardrail
  human-in-the-loop, bám M-GR-02).

## 11. Open Questions

- [x] OQ-1: Sinh biên bản tự động khi transcript READY hay do chủ trì bấm?
  — Resolved (đề xuất): chủ trì chủ động bấm "Sinh biên bản bằng AI"; tự
  động sinh gây job lãng phí cho họp không cần biên bản và làm mờ hành động
  có chủ đích của con người — chờ Product owner xác nhận.
- [x] OQ-2: Retention cho transcript và bản đề xuất AI (kể cả bản DISCARDED/
  SUPERSEDED)? — Resolved (đề xuất): transcript giữ theo chính sách của
  `meeting-records`; bản đề xuất giữ theo vòng đời biên bản cuộc họp để đối
  chiếu provenance — chờ DPO/legal chốt chính sách (PRD OQ-6).
- [x] OQ-3: Transcript thay đổi sau khi bản đề xuất tồn tại thì tự sinh lại
  hay chỉ cảnh báo? — Resolved (đề xuất): chỉ cảnh báo "lệch nguồn" + chủ
  trì quyết định sinh lại; không tự regenerate vì bản đề xuất có thể đã có
  sửa tay (bám hướng owner-review của PRD OQ-9).
- [x] OQ-4: Các giới hạn Mục 7.2 (150.000 ký tự transcript, 50 mục, 3 lần
  sinh lại/24 giờ, nhắc sau 48 giờ) có được owner chấp nhận không? —
  Resolved (đề xuất): giữ như giá trị v1 thận trọng — chờ Product owner
  xác nhận.
- [x] OQ-5: Được publish biên bản khi còn đầu việc có người "chưa xác định"
  không? — Resolved: được — biên bản ghi tên nguyên văn + cờ chưa resolve;
  việc chặn giao task cho người chưa xác định thuộc `meeting-to-tasks` (bám
  "Chưa làm" của PRD Mục 7.15), không chặn xuất bản biên bản.
- [x] OQ-6: Có dùng confidence score để tự chấp nhận/loại mục đề xuất không?
  — Resolved: không — mọi mục đều qua review của chủ trì theo invariant
  human-in-the-loop; confidence chỉ dùng sắp xếp thứ tự hiển thị.
- [~] OQ-7: Chia bản đề xuất theo mục agenda và mẫu biên bản theo loại họp?
  — Out of scope v1: đưa vào P1/P2; cần dữ liệu sử dụng thực tế trước.
- [~] OQ-8: Biên bản đa ngôn ngữ cho transcript không phải tiếng Việt? —
  Out of scope v1: sản phẩm ưu tiên tiếng Việt (PRD Mục 9).

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd ai-meeting-minutes` — capture user perspective
- `/brd ai-meeting-minutes` — business case
- `/prd-epic ai-meeting-minutes` — product scope
