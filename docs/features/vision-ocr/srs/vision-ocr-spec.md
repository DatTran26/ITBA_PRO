---
type: srs
feature: vision-ocr
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/vision-ocr/vision-ocr-urd.md, modules/vision-ocr/README.md]
---

# vision-ocr — Software Requirements Specification

> Scope: module Vision OCR độc lập (`modules/vision-ocr`) — tải tối đa 5
> ảnh, hàng đợi xử lý tuần tự, bóc text bằng mô hình thị giác với
> fallback nội bộ, workspace đối chiếu–sửa–xác nhận giữ riêng ba bản
> text, kết quả chỉ tồn tại trong phiên (session-only). Module chạy
> tách biệt, không lưu trữ, không đẩy sang feature nghiệp vụ.

## 1. Phạm vi và mục tiêu

`vision-ocr` phục vụ nhu cầu ad-hoc của HR: lấy nhanh văn bản đã kiểm
chứng từ ảnh giấy tờ mà không phải đưa file qua pipeline Document AI
đầy đủ (PRD Mục 7.39 — mức `Should`, trước tích hợp). Module gồm
backend FastAPI + frontend React riêng; mọi trạng thái là in-memory
(Observed: source `modules/vision-ocr`).

- Đầu vào: tối đa 5 ảnh (PNG/JPG/JPEG/WEBP, ≤10 MB mỗi ảnh) trong một
  phiên trình duyệt.
- Đầu ra: cho mỗi tài liệu được xác nhận — text đã xác nhận để copy dùng
  trong phiên; không xuất file, không lưu trữ.
- Con người nằm trong vòng lặp: không có bản text nào coi là "dùng được"
  nếu chưa qua bước HR xác nhận.
- Điều kiện tiền tích hợp: chỉ đưa kết quả vào pipeline Document AI sau
  khi masking/retention ảnh giấy tờ được duyệt (PRD Mục 12) — và khi đó
  phải đi qua `document-intake` + `document-review` như mọi tài liệu.

### Điểm tiếp xúc với phần còn lại của hệ thống

- Không tiêu thụ entity của feature khác: module tự quản hàng đợi phiên.
- Không cung cấp dữ liệu cho feature khác trong phạm vi hiện tại — kết
  quả rời hệ thống chỉ bằng copy thủ công.
- Provider OCR bên ngoài là dependency duy nhất: ảnh được gửi ra ngoài
  khi gọi engine chính; fallback OCR nội bộ không gửi gì (Observed:
  source `modules/vision-ocr`).

## 2. Chức năng chi tiết

### UC-01 — Tải ảnh vào hàng đợi phiên

- **Actor:** HR
- **Trigger:** Chọn hoặc kéo thả file ảnh vào module.
- **Precondition:** Phiên còn chỗ trong hàng đợi (<5 tài liệu).
- **Luồng chính:**
  1. Với từng file — kiểm tra định dạng (MIME + phần mở rộng
     PNG/JPG/JPEG/WEBP), file không rỗng, dung lượng ≤10 MB, không trùng
     file đã có trong phiên (theo name+size+lastModified) (Observed:
     source `modules/vision-ocr`).
  2. File hợp lệ → tạo tài liệu trong hàng đợi, trạng thái "queued", kèm
     preview ảnh và định danh phiên.
  3. File vi phạm → báo lỗi riêng theo file, không chặn file hợp lệ.
  4. Khi hàng đợi đã đủ 5 — từ chối toàn bộ phần vượt.
- **Postcondition:** Ảnh hợp lệ chờ tới lượt xử lý; ảnh vi phạm có lý do
  từ chối rõ ràng; tổng tài liệu trong phiên ≤5.
- **Exception:**
  - Sai định dạng → "{tên file}: định dạng không được hỗ trợ."
  - File trống → "{tên file}: tệp trống hoặc không đọc được."
  - Quá dung lượng → "{tên file}: dung lượng vượt quá 10 MB."
  - Trùng trong phiên → "{tên file}: có thể đã tồn tại trong phiên này."
  - Hàng đợi đầy → "Hàng đợi chỉ chứa tối đa 5 tài liệu."

### UC-02 — Xử lý tuần tự qua OCR engine

- **Actor:** Hệ thống (hàng đợi phiên)
- **Trigger:** Có tài liệu "queued" và không tài liệu nào đang
  "processing".
- **Luồng chính:**
  1. Lấy tài liệu "queued" đầu tiên → "processing"; chỉ một tài liệu
     được xử lý tại một thời điểm (hàng đợi tuần tự).
  2. Gọi OCR engine chính (mô hình thị giác qua `POST /api/ocr/scan`) —
     request kèm ảnh, timeout 30 giây (Observed: source
     `modules/vision-ocr`).
  3. Thành công → text trả về thành bản "gốc OCR" của tài liệu, trạng
     thái "needs_review"; tài liệu "queued" kế tiếp tự động xử lý.
  4. Engine chính lỗi → tự động chuyển fallback OCR nội bộ (Tesseract
     vie+eng) trong cùng request; fallback thành công → như bước 3 và
     (đề xuất) gắn nhãn nguồn kết quả "bộ đọc dự phòng".
  5. Cả hai engine lỗi → "error" kèm thông điệp; tài liệu kế tiếp vẫn
     được xử lý (ảnh lỗi không chặn hàng đợi).
- **Postcondition:** Mỗi tài liệu kết thúc ở "needs_review" hoặc
  "error"; thứ tự xử lý giữ đúng FIFO của hàng đợi.
- **Exception:**
  - Ảnh không đọc được text → engine trả rỗng/đánh dấu không đọc được,
    vẫn "needs_review" (HR quyết định gõ tay hoặc gỡ).
  - Backend không phản hồi → tài liệu "error" với thông điệp chung.

### UC-03 — Đối chiếu và sửa text

- **Actor:** HR
- **Trigger:** Chọn tài liệu ở "needs_review" trong hàng đợi.
- **Luồng chính:**
  1. Workspace hiện ảnh gốc (xem/zoom) bên cạnh vùng text OCR.
  2. HR đối chiếu và sửa trực tiếp trong vùng text — mọi chỉnh sửa ghi
     vào bản "đã sửa"; bản "gốc OCR" bất biến để truy vết.
  3. (Đề xuất) Khi kết quả đến từ fallback nội bộ, hiện nhãn "Kết quả từ
     bộ đọc dự phòng — kiểm tra kỹ trước khi xác nhận".
- **Postcondition:** Bản "đã sửa" phản ánh chỉnh sửa mới nhất; không
  giới hạn thời gian/số lần sửa trong phiên.

### UC-04 — Xác nhận text

- **Actor:** HR
- **Trigger:** Bấm "Xác nhận" trên tài liệu "needs_review".
- **Luồng chính:**
  1. Bản "đã sửa" hiện tại được chốt thành bản "đã xác nhận"; trạng thái
     "confirmed".
  2. Tài liệu "confirmed" hiển thị text đã xác nhận (read-only) và nút
     copy sang clipboard.
- **Postcondition:** Tài liệu có đủ ba bản text: gốc OCR (bất biến), đã
  sửa (bản làm việc), đã xác nhận (bản chính thức của phiên); chỉ trạng
  thái "confirmed" mới có bản xác nhận.
- **Exception:** Không xác nhận được khi tài liệu không ở "needs_review".

### UC-05 — Reopen tài liệu đã xác nhận

- **Actor:** HR
- **Trigger:** "Mở lại" trên tài liệu "confirmed".
- **Luồng chính:**
  1. Tài liệu về "needs_review"; bản "đã xác nhận" bị hủy (không còn
     text đã xác nhận); bản "đã sửa" giữ nguyên để sửa tiếp.
  2. HR sửa và xác nhận lại → bản xác nhận mới thay thế.
- **Postcondition:** Tại mọi thời điểm tối đa một bản "đã xác nhận" hợp
  lệ trên tài liệu; không chồng nhiều bản xác nhận.

### UC-06 — Retry ảnh lỗi / gỡ ảnh khỏi hàng đợi

- **Actor:** HR
- **Trigger:** Ảnh "error" → "Thử lại"; hoặc ảnh ở trạng thái cho phép →
  "Gỡ".
- **Luồng chính:**
  1. Retry: tài liệu "error" về "queued", số lần thử +1, chờ tới lượt xử
     lý lại (Observed: source `modules/vision-ocr`).
  2. Gỡ: tài liệu bị loại khỏi hàng đợi phiên — chỉ cho phép ở
     queued/confirmed/error; không gỡ được khi đang "processing" hoặc
     "needs_review" (Observed: source `modules/vision-ocr`).
- **Postcondition:** Hàng đợi luôn ≤5 tài liệu; ảnh gỡ giải phóng chỗ.

### UC-07 — Kết thúc phiên

- **Actor:** HR (đóng/refresh tab) hoặc hệ thống.
- **Trigger:** Refresh/đóng tab trình duyệt.
- **Luồng chính:**
  1. (Đề xuất — OQ-2) Nếu phiên còn tài liệu chưa xác nhận → cảnh báo
     "Dữ liệu phiên sẽ bị xóa khi rời trang".
  2. Toàn bộ ảnh, hàng đợi và ba bản text bị xóa — không ghi xuống bất
     kỳ nơi nào (Observed: source `modules/vision-ocr`).
- **Postcondition:** Phiên mới bắt đầu trống; không có dữ liệu sót lại
  phía client hay server.

## 3. Yêu cầu phi chức năng

- **Hiệu năng:** xử lý tuần tự theo thiết kế — không cam kết throughput;
  mỗi lần scan giới hạn bởi timeout provider 30 giây + thời gian
  fallback (Observed: source `modules/vision-ocr`); không hiển thị tiến
  độ giả.
- **Bảo mật/quyền:** module hiện không có đăng nhập/phạm vi — giả định
  truy cập nội bộ (Observed: README); khi tích hợp phải kế thừa RBAC của
  HRMS chính.
- **Riêng tư:** ảnh có thể chứa PII được gửi tới provider ngoài — chỉ
  dùng dữ liệu không nhạy cảm/synthetic tới khi DPO/legal duyệt
  masking/provider (OQ-13, R-16); fallback nội bộ không gửi ảnh ra
  ngoài.
- **Lưu trữ:** session-only — không persistence, không log nội dung ảnh/
  text phía backend (Observed: source `modules/vision-ocr`).
- **Khả dụng:** mất backend → tài liệu chuyển "error", retry khi backend
  sống lại; không cần HA vì phiên tạm.
- **Quan sát:** (đề xuất) log metadata kỹ thuật (thời gian scan, engine
  nào trả, lỗi) — KHÔNG log nội dung ảnh/text.
- **Ngôn ngữ:** UI tiếng Việt; text bóc tách giữ nguyên ngôn ngữ gốc.

## 4. Luồng dữ liệu và hợp đồng giao diện

```
HR → Frontend (React) ──multipart ảnh──▶ POST /api/ocr/scan ──▶ Engine chính (provider)
        ▲                                                    │ lỗi → Fallback nội bộ
        └── text + preview ảnh + trạng thái ◀──JSON──backend──┘
HR sửa/xác nhận/reopen/retry/gỡ — tất cả trên state phiên (in-memory)
Đóng tab → xóa sạch; không có API persist
```

| Điểm | Hợp đồng |
|------|----------|
| Request | `POST /api/ocr/scan` multipart file ảnh (Observed: source `modules/vision-ocr`) |
| Response thành công | `{ extracted_text, image_data_url (base64 preview), status }` |
| Response lỗi | 400 định dạng/trống; 413 >10 MB; 503 cả hai engine lỗi ("OCR service temporarily unavailable") |
| Trạng thái tài liệu | queued → processing → needs_review → confirmed; error ↔ retry |
| Trường text | originalText (bất biến), editedText, confirmedText (chỉ khi confirmed) |

## 5. Giới hạn và ràng buộc

| Ràng buộc | Giá trị | Nguồn |
|-----------|---------|-------|
| Số ảnh/phiên | 5 | Observed: source `modules/vision-ocr` (MAX_QUEUE_SIZE) |
| Dung lượng/ảnh | 10 MB | Observed: source `modules/vision-ocr` |
| Định dạng | PNG/JPG/JPEG/WEBP | Observed: source `modules/vision-ocr` |
| Xử lý đồng thời | 1 (tuần tự) | Observed: source `modules/vision-ocr` |
| Timeout engine chính | 30 giây | Observed: source `modules/vision-ocr` |
| Persistence | 0 — in-memory | Observed: source `modules/vision-ocr` |
| Retry | không giới hạn cứng; (đề xuất) cảnh báo sau 3 lần | OQ-4 brainstorm |

## 6. Phụ thuộc

- Provider mô hình thị giác (Gemini — mặc định `gemini-3.6-flash`,
  cấu hình được) + OCR nội bộ Tesseract `vie+eng` (Observed: source
  `modules/vision-ocr`).
- Không phụ thuộc entity/entity-owner của feature HRMS nào ở phạm vi
  hiện tại.
- Khi tích hợp (P2): `document-intake` (đưa ảnh vào pipeline),
  `document-review` (review/publish chuẩn) — chỉ sau gate PRD Mục 12.

## 7. Quyết định đề xuất và câu hỏi chờ owner

| Mục | Nội dung | Trạng thái |
|-----|----------|-----------|
| OQ-1/OQ-13 | Chính sách ảnh nhạy cảm tới provider ngoài + che/lọc | Đề xuất: chờ DPO/legal; tạm chỉ dữ liệu không nhạy cảm/synthetic, dữ liệu thật qua fallback nội bộ |
| OQ-2 | Cảnh báo trước khi rời trang | Đề xuất: có khi còn việc dở — chờ Product owner |
| OQ-3 | Nhãn nguồn kết quả (provider/fallback) | Đề xuất: hiển thị — chờ Document AI owner |
| OQ-4 | Giới hạn retry | Đề xuất: không giới hạn cứng + cảnh báo sau 3 lần — chờ Operations owner |
| Tích hợp pipeline | Đưa kết quả sang document-intake/document-review | Chờ gate PRD Mục 12 — giữ ngoài phạm vi hiện tại |
| Contract format | Spec dùng UC-* source-backed thay vì template FR/NFR/BR/E/SC của `docs/features/README.md` | Đề xuất: giữ — spec ghi nhận module standalone đã hiện thực (`modules/vision-ocr`); chuẩn hóa sang FR khi tích hợp pipeline — chờ Product owner/BA |
