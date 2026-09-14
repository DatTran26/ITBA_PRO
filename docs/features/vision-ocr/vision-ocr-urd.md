---
type: urd
feature: vision-ocr
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/vision-ocr/brainstorms/session-scoped-ocr-review.md, modules/vision-ocr/README.md]
---

# vision-ocr — User Requirements Document

## 1. Purpose

Cho HR một công cụ độc lập để lấy nhanh văn bản đã kiểm chứng từ ảnh giấy
tờ (CCCD, biểu mẫu, chứng chỉ): tải tối đa 5 ảnh, xử lý tuần tự, đối
chiếu ảnh gốc với text OCR, sửa và xác nhận — rồi copy dùng ngay trong
phiên, không lưu trữ, không đẩy sang module nghiệp vụ. Module ở mức
`Should`, chạy tách biệt (`modules/vision-ocr`), là lát cắt engine +
review trước khi tích hợp pipeline Document AI.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Nhận ảnh giấy tờ (scan/chụp) cần lấy nội dung | Gõ lại toàn bộ thủ công, chậm và dễ sai | Mất thời gian, dữ liệu thiếu kiểm chứng | Confirmed — PRD Mục 7.39, JTBD-HR-01 |
| HR | Dùng công cụ OCR online bên ngoài | Không biết ảnh đi đâu, không có bước xác nhận, phải tin output máy | Nguy cơ lộ dữ liệu cá nhân + copy text sai | Confirmed — PRD Mục 7.39 (rủi ro), R-16, OQ-13 |
| HR | Chỉ cần text nhanh, không muốn đưa file qua cả pipeline tài liệu | Pipeline đầy đủ (intake → job → review → publish) quá nặng cho nhu cầu ad-hoc | Bỏ qua hệ thống, dùng kênh ngoài mất kiểm soát | Confirmed — PRD Mục 7.39 ("scan nhanh ngoài pipeline"), Mục 7 hành trình HR |
| Admin | Module standalone chưa có đăng nhập/quyền | Không rõ ai được dùng, dữ liệu có bị giữ không | Khó kiểm soát khi mở rộng | Assumption — suy từ "Chưa làm" của PRD Mục 7.39 |
| Người trong giấy tờ | Ảnh giấy tờ chứa PII có thể qua provider ngoài | Chưa có chính sách che/lọc được duyệt | Rủi ro vi phạm dữ liệu cá nhân | Confirmed — R-16, OQ-13 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Có ảnh giấy tờ cần lấy văn bản trong công việc hiện tại | Text đã kiểm chứng trong vài phút, copy dùng ngay, không phải qua pipeline | Nhập tay chậm; OCR ngoài không kiểm soát được |
| secondary | Admin | Giám sát việc module được dùng đúng giới hạn | Biết phạm vi hiện tại (session-only, không lưu trữ) và điều kiện mở rộng | Module tách biệt, chưa có quyền/audit |
| out | Người trong giấy tờ (ứng viên/nhân viên) | Ảnh giấy tờ của mình được xử lý | Ảnh chỉ qua provider ngoài khi chính sách duyệt | Không thao tác trong feature |
| out | `document-intake`/`document-review` | Tiêu thụ kết quả khi tích hợp sau này | Module hiện không đẩy dữ liệu sang | Tích hợp là P2 sau gate |

## 3. Scope Boundaries

### In Scope

- Upload tối đa 5 ảnh/phiên, định dạng PNG/JPG/JPEG/WEBP, ≤10 MB mỗi
  ảnh; kiểm tra định dạng + phần mở rộng, file trống và trùng trong
  phiên.
- Hàng đợi xử lý tuần tự (một ảnh tại một thời điểm) với trạng thái
  từng tài liệu: queued / processing / needs_review / confirmed / error.
- OCR chữ in/viết tay/bảng giữ nguyên ngôn ngữ gốc qua mô hình thị giác;
  fallback OCR nội bộ khi provider lỗi.
- Workspace review: đối chiếu ảnh gốc ↔ text, sửa, xác nhận; giữ riêng
  ba bản text (gốc OCR / đã sửa / đã xác nhận).
- Retry ảnh lỗi, reopen tài liệu đã xác nhận, gỡ ảnh ở trạng thái cho
  phép.
- Dùng kết quả trong phiên (copy text đã xác nhận).
- Session-only: mọi dữ liệu chỉ trong bộ nhớ tab; refresh/đóng là xóa
  sạch.

### Out of Scope

- Lưu trữ/lịch sử phiên làm việc (PRD "Chưa làm").
- Đăng nhập, tài khoản và phạm vi quyền (PRD "Chưa làm").
- Trích xuất field có cấu trúc, điểm confidence và vùng nguồn (PRD "Chưa
  làm" — thuộc `document-review`).
- Đẩy kết quả sang hồ sơ/module nghiệp vụ (PRD "Chưa làm" — thuộc
  `document-intake`/`document-review` khi tích hợp).
- Audit log, retention và reporting — module không giữ dữ liệu để audit;
  khi tích hợp thì kế thừa audit của pipeline.
- Cam kết v1: slice mở rộng (`Should`), không thuộc 15 capability `Must`.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi có 1–5 ảnh giấy tờ cần lấy text | Tải ảnh lên nhanh, biết ngay ảnh nào không hợp lệ và vì sao | Ảnh hợp lệ vào hàng đợi, ảnh lỗi có lý do rõ | Critical | Confirmed — PRD Mục 7.39 (phạm vi v1); Observed: source `modules/vision-ocr` |
| UN-002 | HR | Khi ảnh đang được xử lý | Thấy trạng thái từng ảnh và biết hệ thống xử lý lần lượt | Không mơ hồ tiến độ, không tưởng bị treo | High | Confirmed — PRD Mục 7.39 (hàng đợi tuần tự); Observed: source `modules/vision-ocr` |
| UN-003 | HR | Khi text OCR đã có | Đối chiếu ảnh gốc với text trong một màn, sửa chỗ sai | Kiểm chứng được trước khi tin dùng | Critical | Confirmed — PRD Mục 7.39 (review–sửa–xác nhận), Mục 12 |
| UN-004 | HR | Khi đã kiểm text | Xác nhận để có bản text chính thức của phiên, copy dùng ngay | Bản xác nhận tách biệt bản máy/bản sửa | Critical | Confirmed — PRD Mục 7.39 (3 bản text, dùng trong phiên) |
| UN-005 | HR | Khi ảnh xử lý lỗi | Thử lại hoặc gỡ ảnh mà không mất các ảnh khác | Ảnh lỗi không chặn hàng đợi | High | Confirmed — PRD Mục 7.39 (retry); Observed: source `modules/vision-ocr` |
| UN-006 | HR | Khi xác nhận xong phát hiện còn sai | Mở lại tài liệu để sửa và xác nhận lại | Bản xác nhận mới thay thế, không chồng bản | Medium | Confirmed — PRD Mục 7.39 (reopen); Observed: source `modules/vision-ocr` |
| UN-007 | HR | Khi làm việc trong phiên | Biết dữ liệu chỉ tồn tại trong phiên và sẽ mất khi đóng | Không ngạc nhiên khi refresh; chủ động copy trước | High | Confirmed — PRD Mục 7.39 (session-only); Observed: source `modules/vision-ocr` |
| UN-008 | Admin | Khi đánh giá mở rộng module | Biết rõ giới hạn hiện tại và gate trước khi tích hợp | Quyết định tích hợp đúng lúc, không lách privacy | Medium | Confirmed — PRD Mục 12 (gate vision-ocr), R-16 |

## 5. Prioritized User Journeys

### Journey 1: Bóc text từ vài ảnh giấy tờ trong một phiên

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR có 2–3 ảnh CCCD/biểu mẫu cần lấy nội dung cho công
  việc đang làm.
- **Expected outcome:** Text đã xác nhận cho từng ảnh, copy dùng ngay;
  đóng tab là xóa sạch.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-007

1) HR mở module, chọn/kéo tối đa 5 ảnh → kiểm tra hợp lệ → vào hàng
   đợi "queued".
2) Hệ thống xử lý tuần tự → từng ảnh chuyển "needs_review".
3) HR mở từng tài liệu: đối chiếu ảnh gốc ↔ text, sửa chỗ sai.
4) Xác nhận → bản "đã xác nhận" → copy sang công việc.
5) Làm xong đóng tab; dữ liệu phiên xóa.

**Independent verification:** Trong một phiên — thêm 3 ảnh hợp lệ, xác
nhận 2 ảnh; kiểm tra mỗi ảnh có 3 bản text riêng (gốc/sửa/xác nhận),
trạng thái đúng, và sau refresh không còn dữ liệu.

### Journey 2: Xử lý ảnh không hợp lệ và ảnh lỗi

- **User:** HR
- **Importance:** High
- **Trigger:** Trong lô ảnh tải lên có file sai định dạng/quá lớn/trùng,
  hoặc ảnh xử lý lỗi.
- **Expected outcome:** File lỗi bị từ chối riêng kèm lý do; ảnh xử lý
  lỗi retry được không ảnh hưởng ảnh khác.
- **Related needs:** UN-001, UN-005

1) HR tải lô ảnh gồm file hợp lệ + file vi phạm → hệ thống báo lỗi từng
   file vi phạm, file hợp lệ vẫn vào hàng đợi.
2) Một ảnh xử lý lỗi → "error" + thông điệp; HR "Thử lại" → ảnh về
   "queued" chờ lượt.
3) Ảnh không cần nữa → "Gỡ" khỏi hàng đợi.

**Independent verification:** Tải lô có cố ý file sai định dạng + file
>10 MB — báo đúng lỗi từng file; ảnh hợp lệ xử lý bình thường; retry ảnh
error quay về hàng đợi với số lần thử tăng.

### Journey 3: Reopen tài liệu đã xác nhận

- **User:** HR
- **Importance:** Medium
- **Trigger:** Sau khi xác nhận, HR phát hiện text còn sai sót.
- **Expected outcome:** Tài liệu quay về review, bản xác nhận mới thay
  thế bản cũ.
- **Related needs:** UN-006, UN-003

1) HR mở tài liệu "confirmed" → "Mở lại".
2) Trạng thái về "needs_review", bản xác nhận cũ bị hủy; bản đã sửa giữ
   nguyên.
3) Sửa tiếp → xác nhận → bản xác nhận mới.

**Independent verification:** Trên tài liệu đã confirmed — sau reopen,
bản confirmed cũ không còn; sau xác nhận lại, confirmedText khớp bản đã
sửa mới nhất (Observed: source `modules/vision-ocr`).

### Journey 4: Làm việc có ý thức với phiên tạm

- **User:** HR
- **Importance:** Medium
- **Trigger:** HR cần rời máy/refresh giữa phiên.
- **Expected outcome:** HR biết trước dữ liệu sẽ mất và chủ động copy/
  xác nhận trước khi thoát.
- **Related needs:** UN-007

1) Khi phiên còn tài liệu chưa xác nhận và HR định rời trang → (đề
   xuất) cảnh báo dữ liệu phiên sẽ xóa.
2) HR copy phần đã xác nhận hoặc xác nhận nốt rồi mới thoát.

**Independent verification:** Có dữ liệu trong phiên và refresh → toàn
bộ hàng đợi/text biến mất (hành vi đã công bố); nếu cảnh báo được thêm,
nó chỉ hiện khi còn việc dở.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tải >5 ảnh cùng lúc | Không hiểu vì sao phần sau không vào | Báo giới hạn 5 tài liệu, chỉ phần vượt bị từ chối | Journey 2 / UN-001 |
| File sai định dạng/quá lớn/trống/trùng | Mất công chọn lại | Lỗi nêu tên file + lý do cụ thể từng file | Journey 2 / UN-001 |
| Provider OCR và fallback đều lỗi | Ảnh không có text | Ảnh "error" + lựa chọn Thử lại/Gỡ rõ ràng | Journey 2 / UN-005 |
| Ảnh không có text (ảnh trắng) | Không có gì để review | Vẫn vào "needs_review" với cờ không đọc được; HR gõ tay hoặc gỡ | UN-003 |
| Refresh/đóng tab giữa phiên | Mất toàn bộ việc | (Đề xuất) cảnh báo trước khi rời; nếu đã mất → phiên mới trống | Journey 4 / UN-007 |
| Mở lại tài liệu confirmed | Sợ mất bản đã xác nhận | Hiểu rõ bản xác nhận bị hủy và phải xác nhận lại | Journey 3 / UN-006 |
| Ảnh chứa dữ liệu nhạy cảm | Vô tình gửi PII ra provider ngoài | (Đề xuất) cảnh báo chỉ tải ảnh không nhạy cảm khi chính sách chưa duyệt | UN-007; R-16 |
| Kết quả từ fallback nội bộ | Chất lượng có thể khác mà không biết | (Đề xuất) nhãn nguồn kết quả trên tài liệu | UN-003 |
| Gỡ ảnh đang xử lý | Hành động không rõ | Gỡ chỉ cho phép ở queued/confirmed/error; đang processing/needs_review không gỡ được | UN-005 (Observed: source `modules/vision-ocr`) |
| Nhiều tab cùng mở | Tưởng hàng đợi dùng chung | Mỗi tab là phiên độc lập | UN-007 |

## 7. User-side Constraints

- Giao diện/thông báo tiếng Việt; text bóc tách giữ nguyên ngôn ngữ gốc
  (không dịch).
- Module chạy tách biệt trên surface riêng — không phải màn trong HRMS
  chính; desktop là môi trường chính.
- Session-only là hành vi đã công bố: người dùng phải copy/xác nhận
  trước khi đóng tab — không có "lưu nháp".
- Chỉ tải ảnh không chứa dữ liệu nhạy cảm cho tới khi chính sách
  che/lọc và provider được DPO/legal duyệt (R-16, OQ-13); fallback nội
  bộ là đường xử lý cho dữ liệu thật.
- Tối đa 5 ảnh/phiên và xử lý tuần tự là ràng buộc thiết kế đã chọn —
  không tải hàng loạt.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| HR là người dùng duy nhất của module; truy cập qua link nội bộ | Nếu cần đa vai trò → phải thêm đăng nhập/quyền (Out of scope) | Confirmed — PRD Mục 7.39 persona HR | — |
| Session-only đủ cho nhu cầu scan nhanh; không cần lưu trữ | Nếu user cần lịch sử → phải nâng scope tích hợp | Confirmed — PRD Mục 7.39 "Chưa làm" | Theo dõi feedback pilot |
| Ba bản text đủ provenance mức phiên | Nếu cần audit → phải tích hợp pipeline | Confirmed — PRD Mục 7.39; Observed: source `modules/vision-ocr` | — |
| Chỉ dữ liệu không nhạy cảm/synthetic tới provider ngoài khi chưa duyệt | Nếu dùng PII → vi phạm R-16/OQ-13 | Confirmed — PRD Mục 12, R-16 | Chờ DPO/legal (OQ-13) |
| Giới hạn 5 ảnh/10 MB/tuần tự/30 giây là ràng buộc hiện trạng được giữ | Nếu đổi → review lại UX hàng đợi | Confirmed — Observed: source `modules/vision-ocr` | Chỉ đổi khi owner chốt |
| Cảnh báo rời trang + nhãn nguồn kết quả là cải tiến nhỏ được chấp nhận | Nếu không → giữ hành vi hiện tại | Assumption — đề xuất | Chốt ở OQ-2/OQ-3 brainstorm |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | HR có text dùng được mà không nhập lại toàn bộ | Chưa có — xác lập bằng đo thời gian/tài liệu trong pilot | ≥70% tài liệu vào hàng đợi được xác nhận sau review | Tỷ lệ tài liệu đạt confirmed / tổng tài liệu (PRD Mục 7.39; mốc chờ OQ-2) | 1 tháng sau pilot |
| USC-002 | Text máy đề xuất đỡ phải sửa nhiều | Chưa có — xác lập bằng đo diff trong phiên | Mức sửa trung bình đo được và giảm theo cải tiến engine | Số ký tự khác giữa bản gốc OCR và bản xác nhận, trung bình/tài liệu | 1 tháng sau pilot |
| USC-003 | Không text nào được "dùng" mà chưa xác nhận | 0 | 0 tài liệu có confirmedText khi chưa qua xác nhận | Kiểm tra invariant trạng thái (chỉ confirmed mới có bản xác nhận) | Liên tục |
| USC-004 | HR không mất việc vì refresh vô tình | Chưa có — đếm sự cố tự báo | Giảm sau khi có cảnh báo rời trang (nếu duyệt OQ-2) | Số báo cáo mất dữ liệu phiên của HR | 1 tháng sau pilot |
| USC-005 | Không ảnh PII tới provider ngoài khi chưa duyệt | 0 | 0 (guardrail R-16) | Số incident được xác nhận liên quan dữ liệu nhạy cảm | Liên tục |

## 10. Open Questions

- [x] OQ-1: Chính sách gửi ảnh giấy tờ chứa PII tới provider ngoài và
  mức che/lọc bắt buộc (OQ-13 PRD) — Resolved (đề xuất): chờ DPO/legal;
  chưa duyệt thì chỉ dữ liệu không nhạy cảm/synthetic, dữ liệu thật đi
  fallback nội bộ — KHÔNG tự chốt (R-16, PRD Mục 12).
- [x] OQ-2: Cảnh báo trước khi rời/refresh trang — Resolved (đề xuất):
  có khi phiên còn dữ liệu chưa xác nhận — chờ Product owner.
- [x] OQ-3: Nhãn nguồn kết quả (provider/fallback) — Resolved (đề
  xuất): hiển thị trên từng tài liệu — chờ Document AI owner.
- [x] OQ-4: Giới hạn retry — Resolved (đề xuất): không giới hạn cứng,
  cảnh báo sau 3 lần — chờ Operations owner.
- [~] OQ-5: Lưu trữ/lịch sử, đăng nhập/quyền, field cấu trúc,
  confidence/vùng nguồn, đẩy sang nghiệp vụ — Out of scope v1 (PRD
  "Chưa làm"); thuộc tích hợp document-intake/document-review sau gate.
