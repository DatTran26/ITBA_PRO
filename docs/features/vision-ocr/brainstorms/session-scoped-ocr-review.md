---
type: brainstorm
feature: vision-ocr
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, modules/vision-ocr/README.md]
---

# Bóc tách văn bản từ ảnh trong phiên, có con người xác nhận — vision-ocr

## 1. Idea Seed

Một module Vision OCR chạy tách biệt (`modules/vision-ocr`, backend
FastAPI + frontend React riêng) cho phép HR tải tối đa 5 ảnh giấy tờ
(PNG/JPG/WEBP, ≤10 MB mỗi ảnh), hệ thống xử lý lần lượt qua hàng đợi
tuần tự, bóc tách văn bản bằng mô hình thị giác (Gemini Vision, fallback
Tesseract nội bộ khi provider lỗi), rồi mở workspace cho HR đối chiếu ảnh
gốc với text, sửa và xác nhận. Module giữ riêng ba bản text — gốc OCR, đã
sửa, đã xác nhận — và chỉ tồn tại trong phiên: không lưu trữ, không đẩy
sang module nghiệp vụ, refresh là mất.

## 2. Context

Đây là lát cắt engine + review chạy độc lập của theme Document AI, mức
`Should` (PRD Mục 7.39, Mục 12) — không phụ thuộc feature nào và không
nằm trong cam kết v1. HR thường cần lấy nhanh văn bản từ ảnh giấy tờ
(CCCD, biểu mẫu, chứng chỉ) mà không muốn đưa file qua cả pipeline
`document-intake`/`document-review`. Module đã tồn tại trong repo với
test backend + frontend (Observed: source `modules/vision-ocr`). Rủi ro
lớn nhất: ảnh giấy tờ chứa PII được gửi tới AI provider bên ngoài khi
chưa có chính sách che/lọc (R-16, OQ-13 của PRD) — vì vậy phạm vi sử
dụng hiện tại giới hạn ở dữ liệu không nhạy cảm/synthetic cho tới khi
masking/retention được duyệt, và tích hợp vào pipeline Document AI chỉ
xảy ra sau gate đó (PRD Mục 12). Mọi thông số kỹ thuật nêu trong doc này
là fact hiện trạng của module, không phải quyết định thiết kế mới.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Phải gõ lại nội dung từ ảnh giấy tờ (CCCD, biểu mẫu, chứng chỉ) | Bóc nhanh text, đối chiếu ảnh gốc, sửa rồi xác nhận để copy dùng ngay |
| HR | Dùng OCR bên ngoài thì không có chỗ kiểm chứng và không rõ ảnh đi đâu | Biết rõ text máy đề xuất vs text mình đã sửa/xác nhận; dữ liệu không bị giữ lại |
| Admin | Module chạy tách biệt, chưa có đăng nhập/phạm vi | Biết rõ giới hạn phạm vi hiện tại và điều kiện mở rộng |
| Người trong giấy tờ (ứng viên/nhân viên) | Ảnh giấy tờ của mình có thể đi qua provider ngoài | (gián tiếp) ảnh chỉ được xử lý khi chính sách che/lọc đã duyệt |

## 4. Capabilities Breakdown

### P0 — must have

- Upload tối đa 5 ảnh trong một phiên, chấp nhận PNG/JPG/JPEG/WEBP, mỗi
  ảnh ≤10 MB; kiểm tra cả định dạng lẫn phần mở rộng, từ chối file trống
  và file trùng đã có trong phiên (Observed: source `modules/vision-ocr`).
- Hàng đợi xử lý tuần tự: chỉ một ảnh được xử lý tại một thời điểm, các
  ảnh còn lại xếp "queued"; trạng thái từng ảnh rõ ràng (queued /
  processing / needs_review / confirmed / error).
- OCR bằng mô hình thị giác với prompt giữ nguyên ngôn ngữ gốc, chữ in/
  viết tay/bảng, đánh dấu phần không rõ; fallback OCR nội bộ khi provider
  lỗi (Observed: source `modules/vision-ocr`).
- Workspace review từng tài liệu: ảnh gốc bên cạnh text OCR; HR sửa text
  rồi xác nhận — hệ thống giữ riêng ba bản text (gốc OCR / đã sửa / đã
  xác nhận).
- Retry ảnh lỗi (về hàng đợi, tăng số lần thử), reopen tài liệu đã xác
  nhận để sửa lại (bản xác nhận cũ bị hủy và phải xác nhận lại), và gỡ
  ảnh khỏi hàng đợi khi còn ở trạng thái cho phép.
- Dùng kết quả trong phiên: copy text đã xác nhận để dán sang nơi làm
  việc khác — không có xuất file hay lưu trữ.
- Session-only: toàn bộ ảnh, hàng đợi và text chỉ trong bộ nhớ tab hiện
  tại; đóng/refresh tab là xóa sạch (Observed: source `modules/vision-ocr`).

### P1 — should have

- Cảnh báo trước khi rời/refresh trang khi phiên còn dữ liệu chưa xác
  nhận (tránh mất việc vô tình) — đề xuất.
- Thông báo rõ khi kết quả đến từ fallback nội bộ thay vì provider chính
  (để HR biết chất lượng có thể khác) — đề xuất.
- Đếm số lần retry hiển thị trên từng tài liệu.

### P2 — nice to have (chỉ sau gate tích hợp)

- Tích hợp vào pipeline Document AI: đưa ảnh qua `document-intake`, text
  đã xác nhận qua `document-review` — chỉ sau khi masking/retention ảnh
  giấy tờ được duyệt (PRD Mục 12).
- Đăng nhập và phạm vi quyền theo tổ chức.
- Trích xuất field có cấu trúc, confidence và vùng nguồn.
- Lưu trữ/lịch sử phiên.

## 5. Core Flows (Happy Path)

### 5.1 Tải ảnh → hàng đợi tuần tự → review → xác nhận → dùng trong phiên

1) HR mở module, kéo thả/chọn tối đa 5 ảnh giấy tờ → hệ thống kiểm tra
   định dạng, dung lượng, file trống và trùng trong phiên; ảnh hợp lệ
   vào hàng đợi "queued".
2) Hệ thống xử lý tuần tự từng ảnh: "queued" → "processing" → gọi OCR
   (provider chính, fallback nội bộ khi lỗi) → "needs_review".
3) HR chọn tài liệu trong hàng đợi → workspace hiện ảnh gốc + text OCR;
   HR đối chiếu, sửa chỗ sai (chữ dấu, số, ngày).
4) HR bấm xác nhận → bản "đã sửa" được chốt thành bản "đã xác nhận",
   trạng thái "confirmed".
5) HR copy text đã xác nhận dùng trong công việc hiện tại; kết thúc phiên
   là xóa sạch dữ liệu.

```
HR                        Hàng đợi phiên                 OCR engine
──────────────────────────────────────────────────────────────────────────
Chọn ≤5 ảnh
     │
     ▼
Kiểm tra định dạng/dung lượng/trống/trùng ── vi phạm ▶ báo lỗi từng file
     │ hợp lệ
     ▼
Ảnh vào "queued" (tối đa 5)     ┌────────────────────────────┐
     │                          │ Xử lý tuần tự: chỉ 1 ảnh    │
     └─────────────────────────▶│ "processing" tại 1 thời điểm│
                                 └─────────────┬──────────────┘
                                               ▼
                                    Provider OCR chính
                                               │ lỗi ▶ fallback nội bộ
                                               │ cả hai lỗi ▶ "error"
                                               ▼
                                        "needs_review"
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │ HR đối chiếu ảnh gốc ↔ text OCR trong workspace  │
                    │  sửa text (bản "đã sửa" cập nhật liên tục)       │
                    └──────────────────────────┬──────────────────────┘
                                               ▼
                                    Xác nhận → "confirmed"
                                    (bản xác nhận = bản đã sửa)
                                               │
                                               ▼
                              Copy text đã xác nhận — dùng trong phiên
                              (reopen → về "needs_review", phải xác
                               nhận lại; refresh tab → mất toàn bộ)
```

### 5.2 Xử lý ảnh lỗi

1) Ảnh ở "error" (provider + fallback đều lỗi, hoặc lỗi đọc file) → hiện
   thông điệp lỗi.
2) HR chọn "Thử lại" → ảnh về "queued", số lần thử +1, chờ tới lượt xử
   lý lại; hoặc "Gỡ" để bỏ ảnh khỏi phiên.
3) Retry thành công → vào luồng review bình thường.

### 5.3 Reopen tài liệu đã xác nhận

1) HR phát hiện text đã xác nhận còn sai → chọn "Mở lại".
2) Tài liệu về "needs_review", bản xác nhận bị hủy (không còn text đã
   xác nhận); bản "đã sửa" giữ nguyên để sửa tiếp.
3) HR sửa và xác nhận lại → bản xác nhận mới thay thế.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | File hợp lệ (định dạng + phần mở rộng, ≤10 MB, không trống, không trùng trong phiên)? | Vào hàng đợi "queued" | Báo lỗi từng file, không tạo job (Observed: source `modules/vision-ocr`) |
| D2 | 5.1 | Hàng đợi còn chỗ (<5 tài liệu)? | Nhận ảnh | Báo "Hàng đợi chỉ chứa tối đa 5 tài liệu" |
| D3 | 5.1 | Provider OCR chính phản hồi thành công? | Text về "needs_review" | Chuyển fallback nội bộ; fallback cũng lỗi → "error" (Observed: source `modules/vision-ocr`) |
| D4 | 5.1 | HR xác nhận tài liệu? | Bản "đã sửa" chốt thành bản "đã xác nhận", trạng thái "confirmed" | Ở "needs_review", tiếp tục sửa |
| D5 | 5.3 | HR mở lại tài liệu "confirmed"? | Về "needs_review", hủy bản xác nhận | Giữ "confirmed" |
| D6 | 5.2 | Ảnh "error" được thử lại? | Về "queued", attempt +1 | Ở "error" hoặc bị gỡ |
| D7 | 5.1 | Ảnh ở trạng thái cho phép gỡ (queued/confirmed/error)? | Cho "Gỡ" khỏi hàng đợi | Chặn gỡ khi đang "processing"/"needs_review" (Observed: source `modules/vision-ocr`) |
| D8 | 5.1 | HR rời/refresh tab khi phiên còn dữ liệu? | (đề xuất) cảnh báo mất toàn bộ dữ liệu phiên | Mất sạch không cảnh báo — hành vi hiện tại |

### 6.2 Scenario Matrix

| Trạng thái tài liệu | Xem ảnh + text | Sửa text | Xác nhận | Mở lại | Thử lại | Gỡ khỏi hàng đợi |
|---|---|---|---|---|---|---|
| queued | xem ảnh | — | — | — | — | có |
| processing | xem ảnh + chờ | — | — | — | — | — |
| needs_review | xem ảnh + text | có | có | — | — | — |
| confirmed | xem ảnh + text đã xác nhận | — | — | có | — | có |
| error | xem ảnh + lỗi | — | — | — | có | có |

(Observed: source `modules/vision-ocr` — REMOVABLE_STATUSES =
queued/confirmed/error.)

### 6.3 State Transitions

```
tài liệu trong hàng đợi phiên:
  queued → processing → needs_review → confirmed
     ▲         │            │            │
     │         ▼            │            ▼
     │       error ──retry──┘         reopened
     └──(retry: attempt+1)─────────────┘
gỡ khỏi hàng đợi: chỉ từ queued/confirmed/error → loại khỏi phiên
refresh/đóng tab: mọi trạng thái → mất (session-only)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| tài liệu | — | queued | thêm ảnh hợp lệ | — |
| tài liệu | queued | processing | tới lượt trong hàng đợi tuần tự | — |
| tài liệu | processing | needs_review | OCR trả text (chính hoặc fallback) | — |
| tài liệu | processing | error | cả hai engine lỗi hoặc lỗi đọc file | có (retry) |
| tài liệu | error | queued | HR "Thử lại" | có (lặp) |
| tài liệu | needs_review | confirmed | HR xác nhận | có (reopen) |
| tài liệu | confirmed | needs_review | HR "Mở lại" | có (lặp) |
| tài liệu | queued/confirmed/error | (gỡ) | HR "Gỡ" | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Đóng/refresh tab giữa phiên | không còn gì — session-only | phiên mới trống, phải tải lại ảnh | không có gì để dọn (không lưu trữ) |
| Provider lỗi giữa lúc xử lý | ảnh "error" + thông điệp | "Thử lại" → về hàng đợi | — |
| Mất mạng giữa upload | file không vào được hàng đợi | chọn lại file | — |
| Backend chết giữa lúc scan | ảnh kẹt "processing" phía client | (đề xuất) timeout client → "error" cho retry | — |
| HR xác nhận rồi mở lại nhiều lần | bản xác nhận mới nhất thay bản cũ | sửa/xác nhận lại bình thường | — |

### 6.5 Other Edge Cases

- Ảnh không có text (ảnh trắng, chụp lỗi): engine trả text rỗng/đánh dấu
  không đọc được → vẫn "needs_review", HR quyết định gõ tay toàn bộ
  hoặc gỡ ảnh (Observed: fallback trả "[No text detected by local OCR]"
  khi rỗng).
- Ảnh chứa PII (số định danh, địa chỉ): hiện tại module KHÔNG che/lọc —
  chính sách dùng chỉ cho dữ liệu không nhạy cảm/synthetic tới khi
  OQ-13 được duyệt (R-16); UI nên cảnh báo người dùng không tải ảnh
  nhạy cảm (đề xuất).
- Ảnh lớn nhưng nén tốt (≤10 MB nhưng độ phân giải rất cao): xử lý chậm
  hơn nhưng vẫn tuần tự — không timeout phía client trước ngưỡng engine
  (30 giây theo cấu hình hiện tại, Observed: source `modules/vision-ocr`).
- Cùng file tải hai lần trong phiên: bị chặn bởi kiểm tra trùng (theo
  name+size+lastModified, Observed: source `modules/vision-ocr`).
- HR sửa text rồi refresh: mất cả bản sửa — session-only là hành vi đã
  công bố; cảnh báo trước khi rời là đề xuất P1.
- Nhiều tab mở cùng module: mỗi tab một phiên độc lập, không chia sẻ
  hàng đợi — chặn nhầm "phiên chung".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Định dạng ảnh | chỉ PNG/JPG/JPEG/WEBP — kiểm cả MIME lẫn phần mở rộng (Observed: source `modules/vision-ocr`) |
| Dung lượng ảnh | ≤10 MB mỗi ảnh; file 0 byte bị từ chối |
| Trùng trong phiên | từ chối file trùng name+size+lastModified với ảnh đã có |
| Số tài liệu trong hàng đợi | tối đa 5 |
| Sửa text | tự do trên vùng text khi "needs_review"; text đã xác nhận bất biến cho tới khi reopen |
| Xác nhận | chỉ khi tài liệu ở "needs_review" |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số ảnh mỗi phiên | 5 | hàng đợi phiên | từ chối phần vượt, báo giới hạn (Observed: source `modules/vision-ocr`) |
| Dung lượng mỗi ảnh | 10 MB | mỗi file | từ chối file, báo giới hạn |
| Xử lý đồng thời | 1 ảnh | hàng đợi | tuần tự, ảnh sau chờ ảnh trước xong |
| Timeout gọi provider | 30 giây | mỗi lần scan | chuyển fallback nội bộ (Observed: source `modules/vision-ocr`) |
| Số lần retry | không giới hạn cứng | mỗi tài liệu | mỗi retry attempt+1; (đề xuất) cảnh báo sau 3 lần |
| Giữ dữ liệu phiên | 0 — session-only | đóng/refresh tab | mất toàn bộ ảnh + text |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Sai định dạng | "{tên file}: định dạng không được hỗ trợ." | E-? (Observed: source `modules/vision-ocr`) |
| File trống/không đọc được | "{tên file}: tệp trống hoặc không đọc được." | E-? (Observed) |
| Vượt dung lượng | "{tên file}: dung lượng vượt quá 10 MB." | E-? (Observed) |
| Trùng trong phiên | "{tên file}: có thể đã tồn tại trong phiên này." | E-? (Observed) |
| Hàng đợi đầy | "Hàng đợi chỉ chứa tối đa 5 tài liệu." | E-? (Observed) |
| Cả hai engine lỗi | "Không xử lý được ảnh này — thử lại hoặc gỡ khỏi hàng đợi." | E-? (Observed: backend trả "OCR service temporarily unavailable") |

#### Success messages

| Tình huống | Wording |
|---|---|
| Ảnh vào hàng đợi | "Đã thêm {n} ảnh vào hàng đợi — xử lý lần lượt" |
| Xác nhận tài liệu | "Đã xác nhận văn bản — có thể sao chép để sử dụng" |
| Mở lại | "Đã mở lại tài liệu — văn bản cần được xác nhận lại" |
| Thử lại thành công | "Ảnh đã được xử lý lại — kiểm tra văn bản" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang xử lý | "Đang bóc tách văn bản…" |
| Chờ trong hàng đợi | "Ảnh đang chờ tới lượt xử lý" |
| Fallback nội bộ | (đề xuất) "Kết quả từ bộ đọc dự phòng — kiểm tra kỹ trước khi xác nhận" |
| Cảnh báo rời trang | (đề xuất) "Dữ liệu phiên sẽ bị xóa khi rời trang — xác nhận/sao chép trước khi thoát" |
| Cảnh báo dữ liệu nhạy cảm | (đề xuất) "Chỉ tải ảnh không chứa dữ liệu nhạy cảm — ảnh được gửi tới dịch vụ OCR bên ngoài" |
| Phiên trống | "Chưa có tài liệu nào — tải tối đa 5 ảnh để bắt đầu" |

## 8. Assumptions

- Module chạy độc lập, hiện không có đăng nhập/phạm vi quyền — người
  dùng là HR nội bộ được phát link truy cập; ràng buộc quyền chỉ áp khi
  tích hợp (P2).
- Phiên là đơn vị dữ liệu duy nhất: không lưu trữ, không lịch sử, không
  audit — phù hợp mục tiêu "scan nhanh ngoài pipeline" và tránh giữ PII.
- Ba bản text (gốc OCR / đã sửa / đã xác nhận) là đủ cho provenance mức
  phiên; diff giữa các bản phục vụ đo "mức sửa trung bình" trong phiên.
- Việc gửi ảnh tới provider ngoài tuân theo gate R-16/OQ-13: cho tới
  khi chính sách che/lọc và provider được DPO/legal duyệt, module chỉ
  dùng với dữ liệu không nhạy cảm/synthetic; fallback nội bộ là đường
  xử lý khi không muốn gửi ra ngoài.
- Các con số (5 ảnh, 10 MB, 30 giây timeout, sequential) là fact hiện
  trạng của module (Observed: source `modules/vision-ocr`), không phải
  đề xuất mới — mọi thay đổi ngưỡng chờ owner.
- Tích hợp pipeline là hướng P2 và phải qua `document-intake` +
  `document-review` như mọi tài liệu khác — không đường tắt.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Ảnh giấy tờ chứa PII gửi tới provider ngoài khi chưa duyệt che/lọc (R-16, OQ-13) | thường nếu dùng dữ liệu thật | vi phạm privacy gate, phải dừng module với dữ liệu thật | giới hạn dữ liệu không nhạy cảm/synthetic; cảnh báo trong UI; masking/provider gate trước khi mở rộng; fallback nội bộ |
| HR coi text OCR là fact mà không đối chiếu | thỉnh thoảng | copy text sai sang hồ sơ/công việc | bắt buộc xác nhận mới có bản "đã xác nhận"; đối chiếu ảnh gốc ngay trong workspace |
| Refresh tab vô tình làm mất việc đang làm | thường | mất text đã sửa/xác nhận, phải làm lại | (đề xuất) cảnh báo trước khi rời trang; copy ngay sau xác nhận |
| Fallback nội bộ cho kết quả kém hơn nhưng HR không biết | thỉnh thoảng | xác nhận text chất lượng thấp | (đề xuất) gắn nhãn nguồn kết quả trên từng tài liệu |
| Module bị dùng như đường lách pipeline (không qua intake/review) | thỉnh thoảng | dữ liệu chưa kiểm chứng lọt vào hồ sơ nghiệp vụ | module không có đường đẩy sang module khác — chỉ copy thủ công; tích hợp chỉ qua gate PRD Mục 12 |
| Ảnh nhạy cảm đọng lại ở provider ngoài | hiếm | rò rỉ dữ liệu cá nhân | retention/provider terms do DPO/legal duyệt (OQ-13); khi chưa rõ chỉ dùng fallback nội bộ cho dữ liệu thật |
| Giới hạn 5 ảnh bị lách bằng nhiều tab | hiếm | tải hàng loạt ngoài ý đồ | giới hạn theo phiên là ràng buộc sản phẩm đã chọn; ghi nhận như giới hạn thiết kế, không phải lỗ hổng |

## 10. Success Criteria (preliminary)

- Tỷ lệ tài liệu được xác nhận sau review / tổng tài liệu vào hàng đợi
  — theo PRD Mục 7.39; mốc chờ OQ-2 sản phẩm.
- Mức sửa trung bình mỗi tài liệu (ký tự khác giữa bản gốc OCR và bản
  xác nhận) — đo trong phiên, dùng đánh giá chất lượng engine.
- 0 tài liệu nào được "dùng" mà chưa qua trạng thái confirmed.
- 0 ảnh PII gửi tới provider ngoài khi chính sách chưa duyệt (guardrail
  theo R-16).

## 11. Open Questions

- [x] OQ-1: Ai duyệt chính sách gửi ảnh giấy tờ chứa dữ liệu nhạy cảm
  tới AI provider ngoài và mức che/lọc bắt buộc (OQ-13 PRD) — Resolved
  (đề xuất): chờ DPO/legal duyệt; khi chưa duyệt module chỉ dùng dữ liệu
  không nhạy cảm/synthetic và ưu tiên fallback nội bộ cho dữ liệu thật
  (R-16, PRD Mục 12).
- [x] OQ-2: Có cần cảnh báo trước khi rời/refresh trang — Resolved (đề
  xuất): có, khi phiên còn dữ liệu chưa xác nhận — chờ Product owner
  xác nhận (thay đổi hành vi hiện tại của module).
- [x] OQ-3: Có hiển thị nguồn kết quả (provider chính vs fallback nội
  bộ) trên từng tài liệu — Resolved (đề xuất): có, gắn nhãn để HR biết
  chất lượng có thể khác — chờ Document AI owner xác nhận.
- [x] OQ-4: Giới hạn retry trên tài liệu lỗi — Resolved (đề xuất): không
  giới hạn cứng, cảnh báo sau 3 lần thử — chờ Operations owner xác nhận.
- [~] OQ-5: Lưu trữ/lịch sử phiên, đăng nhập/phạm vi, field có cấu trúc,
  confidence/vùng nguồn, đẩy sang hồ sơ nghiệp vụ — Out of scope: thuộc
  "Chưa làm" của PRD Mục 7.39; các phần này là trách nhiệm của
  `document-intake`/`document-review` khi tích hợp sau gate.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd vision-ocr` — capture user perspective
- `/brd vision-ocr` — business case
- `/prd-epic vision-ocr` — product scope
