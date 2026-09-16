---
type: urd
feature: cv-intake
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/cv-intake/brainstorms/cv-consent-parse-review.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md, docs/_reverse/recruitment-and-interviews/gaps.md]
---

# cv-intake — User Requirements Document

## 1. Purpose

Cho HR một cửa tiếp nhận CV thống nhất: mọi CV đến đều có consent và
provenance rõ ràng, được trích xuất thành đề xuất có confidence để HR
chỉ xác nhận thay vì gõ lại, và chỉ sau khi con người xác nhận dữ liệu
mới trở thành facts của hồ sơ ứng viên và tạo application — thay vì CV
đi qua email/chat rồi nhập tay, không biết CV nào đã xử lý và từ đâu.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Nhận CV qua email/Zalo, nhập tay vào hệ thống hoặc sheet | Mất thời gian nhập lại, dễ sai, không biết CV nào đã xử lý, không rõ nguồn và consent | Hồ sơ ứng viên sai/thiếu, quyết định trên dữ liệu lỗi, không truy vết được | Confirmed — PRD Mục 2, 7.6, JTBD-HR-01 |
| Ứng viên | Nộp CV qua email, không rõ ai đọc và dữ liệu bị dùng thế nào | Không biết hồ sơ đã được nhận chưa, chưa từng đồng ý xử lý dữ liệu một cách có ghi nhận | Trải nghiệm mờ, rủi ro dữ liệu bị dùng không đúng mục đích | Confirmed — PRD Mục 3 (JTBD-CAN-01), 7.6 |
| Reviewer/HR lead | Dữ liệu parse từ CV đi thẳng vào hồ sơ | Parse sai (tên, email, kinh nghiệm) được coi là fact | Liên hệ sai người, đánh giá trên dữ liệu lỗi | Confirmed — PRD Mục 7.6 (rủi ro chính), R-05 |
| Quản lý | Không nhìn được CV đang kẹt ở đâu | CV bị kẹt trạng thái xử lý vô thời hạn, backlog không ai biết | Ứng viên không được xử lý, mất đầu vào pipeline | Observed: reverse spec GAP-RC-03 (CV kẹt PROCESSING); Confirmed — roadmap Now |
| Admin/DPO nominee | CV chứa PII, consent/retention chưa rõ | Thu thập hồ sơ không có chấp thuận hoặc giữ quá hạn | Vi phạm bảo vệ dữ liệu, khiếu nại/pháp lý | Confirmed — PRD Mục 9, OQ-6 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Tiếp nhận, theo dõi xử lý, review và xác nhận dữ liệu CV | Một cửa vào có trạng thái rõ; chỉ xác nhận/sửa, không gõ lại | CV rải rác nhiều kênh, nhập tay sai, không biết CV nào kẹt |
| secondary | Ứng viên | Nộp CV qua form công khai của một vị trí đang mở | Nộp hồ sơ rõ ràng, đồng ý xử lý có ghi nhận, nhận xác nhận đã nộp | Không biết hồ sơ đến được chưa, dữ liệu dùng thế nào |
| secondary | Reviewer/HR lead | Giám sát hàng chờ review và chất lượng xác nhận | Hàng chờ theo vị trí/kênh/confidence; facts chỉ vào sau xác nhận | Parse sai lọt vào hồ sơ như fact |
| secondary | Quản lý | Theo dõi backlog và CV kẹt | Trạng thái và cảnh báo CV lỗi/quá hạn review | Không nhìn được đầu vào pipeline |
| out | Admin/DPO nominee | Đảm bảo consent/retention tuân thủ | (gián tiếp) mọi CV có consent + provenance | Chính sách retention chưa duyệt (OQ-6 PRD) |

## 3. Scope Boundaries

### In Scope

- Tiếp nhận CV hai kênh: HR tải lên trong app (nhiều file một lần, khai
  báo nguồn + xác nhận chấp thuận) và form ứng viên công khai gắn vị trí
  đang mở (tick đồng ý xử lý dữ liệu).
- Ghi consent (mục đích, phiên bản chính sách, thời điểm, kênh) và
  provenance (ai tải/nộp, kênh, nguồn khai báo) trên mọi CV.
- Kiểm tra file: PDF/DOCX, ≤10 MB, đọc được; từ chối kèm lý do.
- Xử lý có trạng thái không treo: chờ xử lý → đang xử lý → chờ xác nhận →
  đã xác nhận; nhánh thất bại có retry giới hạn và đường nhập tay.
- Trích xuất field đề xuất (liên hệ, học vấn, kinh nghiệm, kỹ năng,
  chứng chỉ) kèm confidence và vị trí nguồn trong file.
- Màn review của HR: file gốc + field đề xuất; sửa/xác nhận từng field
  hoặc hàng loạt; field thiếu/confidence thấp đánh dấu.
- Dò trùng người theo định danh và cảnh báo gộp hồ sơ — quyết định gộp
  của con người.
- Tạo application ở trạng thái đầu pipeline khi CV được xác nhận và vị
  trí còn mở; hồ sơ không gắn vị trí thì vào pool.
- Xác nhận đã nhận hồ sơ cho ứng viên qua form; cảnh báo CV kẹt/quá hạn.
- Audit: ai tải/nộp/sửa/xác nhận, khi nào.

### Out of Scope

- Kênh integration (job board, webhook) — chờ `external-integrations`
  (roadmap Later).
- Parse CV ảnh/scan không có text layer — thuộc `document-review` +
  `vision-ocr` khi tích hợp được duyệt.
- Auto-reject hay auto-điều phối ứng viên — mọi quyết định sau xác nhận
  thuộc `candidate-pipeline`/`candidate-matching` và con người.
- Cơ chế xóa/ẩn dữ liệu khi ứng viên rút consent — chờ chính sách
  retention (OQ-6 PRD); v1 chỉ đánh dấu và xử lý theo policy.
- Đối chiếu điểm CV với vị trí — thuộc `candidate-matching`.
- Định nghĩa chuẩn field hồ sơ ứng viên — tham chiếu person model chung.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi có CV từ nhiều kênh cần đưa vào | Tải một hoặc nhiều CV cùng lúc, khai báo nguồn và xác nhận ứng viên đã đồng ý, biết ngay file nào được nhận/bị từ chối | CV hợp lệ vào hàng chờ xử lý có provenance; file lỗi có lý do | Critical | Confirmed — PRD Mục 7.6 (upload), brainstorm 5.1 |
| UN-002 | Ứng viên | Khi nộp hồ sơ cho một vị trí | Form rõ mục đích xử lý, tick đồng ý, điền liên hệ tối thiểu, tải CV, nhận xác nhận đã nộp | Hồ sơ vào hệ thống với consent đầy đủ; ứng viên yên tâm đã nộp | Critical | Confirmed — PRD Mục 7.6, JTBD-CAN-01 |
| UN-003 | HR | Sau khi CV được tiếp nhận | Theo dõi trạng thái từng CV và không có CV nào kẹt xử lý vô thời hạn | CV lỗi chuyển "Thất bại" có lý do + thử lại/nhập tay được | Critical | Observed: reverse spec GAP-RC-03; Confirmed — roadmap Now |
| UN-004 | HR | Khi CV được trích xuất | Xem file gốc cạnh field đề xuất kèm confidence và vị trí nguồn; sửa từng field hoặc xác nhận hàng loạt | Giảm nhập tay mà vẫn kiểm chứng được từng field | Critical | Confirmed — PRD Mục 7.6 (parse + review); M-IN-03 |
| UN-005 | HR | Trước khi tạo application | Field bắt buộc thiếu và confidence thấp được đánh dấu để bổ sung | Không application nào tạo ra từ facts thiếu/chưa xác nhận | Critical | Confirmed — PRD Mục 7.6 (review dữ liệu thiếu), invariant Mục 12 |
| UN-006 | HR | Khi CV trùng với hồ sơ người đã có | Được cảnh báo và chọn gộp vào hồ sơ cũ hoặc tạo mới | Một người không bị tách nhiều hồ sơ mất lịch sử | High | Observed: reverse spec GAP-RC-06 (duplicate person) |
| UN-007 | HR | Sau khi xác nhận CV | Application được tạo ở trạng thái đầu pipeline gắn vị trí đang mở | Ứng viên vào đúng chỗ để điều phối tiếp | Critical | Confirmed — PRD Mục 7.6 (luồng → tạo application) |
| UN-008 | Ứng viên | Sau khi nộp xong | Nhận xác nhận hệ thống đã nhận hồ sơ | Biết hồ sơ đến được, biết kênh liên hệ lại | High | Assumption — suy từ JTBD-CAN-01 (trải nghiệm rõ ràng) |
| UN-009 | HR/Admin | Khi ứng viên rút consent | Đánh dấu rút trên hồ sơ và kích hoạt xử lý theo policy retention | Không dữ liệu nào dùng tiếp ngoài chính sách | High | Confirmed — PRD Mục 9 (consent); cơ chế chờ OQ-6 PRD |
| UN-010 | Quản lý | Khi theo dõi đầu vào | Cảnh báo CV kẹt/thất bại hết lượt và backlog chờ review | Không CV nào mất âm thầm | High | Assumption — suy từ rủi ro backlog brainstorm Mục 9 |

## 5. Prioritized User Journeys

### Journey 1: HR tải CV → trích xuất → xác nhận → tạo application

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR có file CV cần đưa vào một vị trí đang mở (hoặc pool).
- **Expected outcome:** Facts ứng viên được con người xác nhận vào hồ sơ;
  application mới ở trạng thái đầu pipeline.
- **Related needs:** UN-001, UN-003, UN-004, UN-005, UN-007

1) HR mở "Tiếp nhận CV" → chọn vị trí đang mở (hoặc "chưa gán") → kéo
   file PDF/DOCX → khai báo nguồn + xác nhận chấp thuận → gửi.
2) Hệ thống kiểm tra file, tạo bản ghi CV "Chờ xử lý" có provenance.
3) Trích xuất chạy → field đề xuất kèm confidence → CV "Chờ xác nhận"
   vào hàng chờ review.
4) HR mở review: file gốc + field đề xuất; sửa sai, điền thiếu, xử lý
   cảnh báo trùng; xác nhận.
5) Facts ghi vào hồ sơ (person mới hoặc gộp), CV "Đã xác nhận",
   application tạo ở trạng thái đầu pipeline.

**Independent verification:** Chọn một application vừa tạo — truy ngược
về CV gốc: có file, consent/provenance đủ, mọi field trong hồ sơ có
nguồn (AI đề xuất/HR sửa/nhập tay) và người xác nhận.

### Journey 2: Ứng viên tự nộp qua form

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** Ứng viên mở link nộp hồ sơ của vị trí đang mở.
- **Expected outcome:** CV được tiếp nhận với consent đầy đủ; ứng viên
  nhận xác nhận; CV đi vào cùng hàng chờ review như kênh HR.
- **Related needs:** UN-002, UN-008

1) Ứng viên mở link → đọc mục đích xử lý dữ liệu → tick đồng ý → điền
   liên hệ tối thiểu → tải CV → gửi.
2) Hệ thống ghi consent (mục đích, phiên bản chính sách, thời điểm, kênh
   form), kiểm tra file, tạo CV "Chờ xử lý".
3) Ứng viên nhận "Đã nhận hồ sơ"; CV đi vào hàng chờ trích xuất/review —
   không đường tắt bỏ qua review của con người.

**Independent verification:** Nộp thử một CV qua form — kiểm tra bản ghi
consent có đủ mục đích + phiên bản chính sách + thời điểm + kênh, và CV
xuất hiện trong hàng chờ review của HR.

### Journey 3: Xử lý CV kẹt hoặc lỗi

- **User:** HR
- **Importance:** Critical
- **Trigger:** CV ở "Đang xử lý" quá ngưỡng hoặc bước xử lý trả lỗi.
- **Expected outcome:** CV chuyển "Thất bại" có lý do; thử lại được trong
  giới hạn; hết lượt vẫn có đường nhập tay — không CV mất âm thầm.
- **Related needs:** UN-003, UN-010

1) Giám sát chuyển CV quá hạn/lỗi sang "Thất bại" + lý do, báo owner.
2) HR bấm "Thử lại" → CV về "Chờ xử lý".
3) Hết lượt → CV giữ "Thất bại", mở nhập tay: HR đọc file gốc, nhập
   field, xác nhận như thường (provenance "nhập tay").

**Independent verification:** Tạo một CV ép timeout — kiểm tra nó kết
thúc ở "Thất bại" có lý do và người được báo, không ở "Đang xử lý" quá
ngưỡng (vá GAP-RC-03).

### Journey 4: Xử lý trùng hồ sơ người

- **User:** HR
- **Importance:** High
- **Trigger:** Trích xuất/xác nhận phát hiện định danh trùng person đã có.
- **Expected outcome:** Cảnh báo trùng hiện rõ; HR chọn gộp hoặc tạo mới;
  quyết định được ghi nhận.
- **Related needs:** UN-006

1) Hệ thống dò trùng theo định danh (email; mở rộng khác khi được chốt).
2) Màn review hiện "đã có hồ sơ {tên}" → HR chọn gộp vào hồ sơ cũ hoặc
   tạo mới.
3) Quyết định ghi nhận; CV gắn vào person đúng.

**Independent verification:** Nộp CV có email trùng hồ sơ sẵn — cảnh báo
hiện trước khi xác nhận, và quyết định gộp/tạo mới có trong audit.

### Journey 5: Ứng viên rút consent

- **User:** HR/Admin (xử lý), ứng viên (khởi xướng qua kênh công bố)
- **Importance:** Medium
- **Trigger:** Ứng viên yêu cầu rút chấp thuận xử lý dữ liệu.
- **Expected outcome:** Consent đánh dấu "đã rút"; hồ sơ/application xử
  lý theo policy retention; sự kiện truy vết được.
- **Related needs:** UN-009

1) Kênh rút consent được công bố ghi nhận yêu cầu.
2) Hồ sơ đánh dấu "đã rút" + thời điểm; cảnh báo HR đang phụ trách.
3) Xử lý tiếp theo policy retention (ẩn/xóa/giữ tối thiểu) — cơ chế chờ
   OQ-6 PRD; v1 đánh dấu và báo người phụ trách.

**Independent verification:** Đánh dấu rút consent trên một hồ sơ — trạng
thái consent đổi "đã rút", có audit và người phụ trách được báo.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| File sai định dạng/quá lớn/không đọc được | CV bị từ chối không rõ lý do | Từ chối kèm lý do cụ thể (định dạng, 10 MB, file hỏng) | Journey 1, 2 / UN-001 |
| Ứng viên không tick đồng ý | Không gửi được | Nút gửi vô hiệu + giải thích cần đồng ý xử lý dữ liệu | Journey 2 / UN-002 |
| HR tải thiếu khai báo nguồn | Vi phạm consent ngầm | Chặn nhận, yêu cầu khai báo nguồn + xác nhận chấp thuận | Journey 1 / UN-001 |
| Trích xuất thất bại hết lượt | CV tưởng mất | "Thất bại" + lý do + mở nhập tay, file gốc còn nguyên | Journey 3 / UN-003 |
| PDF ảnh scan không có text | Toàn field trống | Vẫn tới review, gợi ý nhập tay (OCR ảnh không phải v1) | Journey 3 |
| Thiếu field bắt buộc khi xác nhận | Application thiếu facts | Chặn xác nhận, liệt kê field còn thiếu | Journey 1 / UN-005 |
| Vị trí đích vừa đóng khi xác nhận | Facts đã xác nhận mất đích | Facts giữ trong hồ sơ; chọn vị trí khác hoặc giữ pool | Journey 1 / UN-007 |
| Ứng viên nộp lại CV cùng vị trí | Trùng application | Cảnh báo; giữ nhiều CV trên hồ sơ, application tham chiếu CV mới nhất | Journey 4 |
| Hai HR cùng review một CV | Người lưu sau ghi đè | Cảnh báo "CV vừa được {người} cập nhật" | Journey 1 |
| Ứng viên đã rút consent trước đó | Tiếp nhận vi phạm | Cảnh báo HR, xử lý theo policy | Journey 5 / UN-009 |
| Hàng chờ review trống | Không biết còn việc không | Empty state "Chưa có CV nào chờ xác nhận" | Journey 1 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và thông báo tiếng Việt; form ứng viên cũng tiếng
  Việt ưu tiên (PRD Mục 9).
- HR phải đăng nhập và có quyền trên vị trí/đơn vị tương ứng; form ứng
  viên là surface công khai tối thiểu chỉ gắn vị trí "Đang mở" do
  `recruitment-planning` công bố.
- Không CV nào được tiếp nhận khi thiếu consent/provenance hợp lệ — điều
  kiện tiên quyết của cả hai kênh.
- Chỉ CV "Đã xác nhận" mới ghi facts vào hồ sơ và tạo application — không
  có ngoại lệ (human-in-the-loop, PRD Mục 12).
- File chỉ PDF/DOCX ≤10 MB mỗi file — giới hạn đã công bố cho người dùng.
- Chỉ dữ liệu synthetic/de-identified trước khi privacy gate (OQ-3/OQ-6
  PRD) đạt — CV thật chỉ chạy sau khi DPO duyệt policy.
- Màn review tối ưu desktop (file gốc + bảng field); form ứng viên dùng
  được trên mobile.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| V1 có 2 kênh thật: HR tải + form ứng viên công khai theo vị trí; integration chờ external-integrations | Nếu kênh integration là Must → thiếu cổng | Assumption — PRD 7.6 nêu "upload/form/integration" nhưng provider chưa chọn | Chốt lại khi external-integrations được duyệt |
| Kênh HR tải đi qua cổng `document-intake` (quyền/định dạng/lưu file/job); form ứng viên là surface riêng của cv-intake vì document-intake v1 chỉ nội bộ | Nếu document-intake nhận kênh ngoài → trùng cổng | Assumption — suy từ phạm vi v1 document-intake + phụ thuộc PRD | Đối chiếu khi document-intake/document-review chốt spec |
| Field bắt buộc tối thiểu để xác nhận = họ tên + ≥1 liên hệ (email hợp lệ hoặc điện thoại) | Nếu chuẩn khác → xác nhận quá chặt/lỏng | Assumption — đã giải OQ (đề xuất chờ Head of HR) | Head of HR xác nhận |
| Timeout 10 phút, retry 3 lần, confidence cần kiểm tra <0,8, 20 file/lượt HR | Nếu ngưỡng sai → CV kẹt hoặc retry vô ích | Assumption — nguồn chỉ xác nhận 10 MB + PDF/DOCX (OQ-RC-05) | Product owner xác nhận |
| Application tạo ở trạng thái đầu pipeline; mọi chuyển trạng thái sau là của con người — KHÔNG auto-reject | Nếu auto-reject → vi phạm invariant | Confirmed — PRD Mục 12; sửa xung đột rule 1 reverse spec | — |
| Dò trùng v1 theo email; định danh khác (điện thoại, tên+ngày sinh) là mở rộng | Nếu chỉ email → trùng lọt | Assumption — đã giải OQ (đề xuất chờ Head of HR) | Head of HR chốt bộ định danh |
| Ứng viên nộp lại: nhiều CV trên một hồ sơ, application tham chiếu CV mới nhất | Nếu chỉ 1 CV → mất lịch sử file | Assumption | — |
| Rút consent chỉ đánh dấu + xử lý theo policy, chưa xóa/ẩn tự động | Nếu policy yêu cầu xóa ngay → thiếu cơ chế | Assumption — chờ OQ-6 PRD | DPO duyệt retention trước dữ liệu thật |
| Form công khai cần chống spam tối thiểu (captcha/giới hạn theo IP — đề xuất) | Nếu thiếu → hàng chờ nhiễu/file độc | Assumption — đã giải OQ (đề xuất chờ Security owner) | Security owner chốt mức chống spam |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | HR không phải nhập lại nhiều sau trích xuất | Chưa có — xác lập bằng đo số field sửa trung bình trong 1 tháng pilot | Tỷ lệ CV xác nhận không cần nhập lại nhiều đạt mức sponsor duyệt (chờ OQ-2 sản phẩm); M-IN-03 đo field giữ nguyên | Field được HR giữ nguyên / field extraction đề xuất, theo phiên bản parser | 1 tháng sau pilot |
| USC-002 | Không CV nào kẹt xử lý vô thời hạn | CV có thể kẹt PROCESSING (GAP-RC-03) | 0 CV ở "Đang xử lý"/"Thất bại" quá SLA không có owner hoặc đường xử lý | Giám sát trạng thái + thời gian kẹt theo ngưỡng | Liên tục |
| USC-003 | Mọi CV có consent/provenance | 0% trước feature | 100% CV tiếp nhận có consent + provenance đủ | Kiểm tra bản ghi consent trên mẫu CV | Hàng tháng |
| USC-004 | Facts vào hồ sơ đều có nguồn và reviewer | 0% trước feature | 100% field ghi vào hồ sơ có provenance + người xác nhận | Kiểm tra mẫu field trên hồ sơ mới | Hàng tháng |
| USC-005 | Ứng viên được báo đã nhận hồ sơ | Chưa có — xác lập trong pilot | ≥95% CV nộp qua form có xác nhận gửi thành công | Tỷ lệ form nộp có xác nhận đã gửi / tổng nộp hợp lệ | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Retention và quy trình rút consent cho CV — Resolved (đề
  xuất): v1 đánh dấu "đã rút" + cảnh báo người phụ trách + xử lý theo
  policy retention do DPO công bố; chỉ dữ liệu synthetic trước khi duyệt
  (PRD OQ-6, OQ-3) — chờ DPO/legal xác nhận.
- [x] OQ-2: Ngưỡng timeout và retry — Resolved (đề xuất): timeout 10
  phút, retry tối đa 3 lần rồi nhập tay — chờ Product owner xác nhận.
- [x] OQ-3: Field bắt buộc tối thiểu để xác nhận — Resolved (đề xuất):
  họ tên + ít nhất một liên hệ (email hợp lệ hoặc điện thoại) — chờ Head
  of HR xác nhận.
- [x] OQ-4: CV không gắn vị trí (pool) — Resolved (đề xuất): v1 nhận —
  HR tải được để "chưa gán", form ứng viên luôn gắn vị trí; pool là hồ
  sơ không application — chờ Head of HR xác nhận.
- [x] OQ-5: Chống spam form công khai — Resolved (đề xuất): link theo vị
  trí + captcha tương đương + giới hạn nộp theo IP (ví dụ 5 lần/giờ) —
  chờ Security owner xác nhận.
- [x] OQ-6: Cơ chế dò trùng ngoài email — Resolved (đề xuất): v1 dò theo
  email là chính; cảnh báo phụ theo số điện thoại khi có; bộ định danh
  khớp mở rộng sau — chờ Head of HR xác nhận (GAP-RC-06, OQ-RC-04).
- [x] OQ-7: Consent wording/phiên bản chính sách do ai công bố — Resolved
  (đề xuất): DPO/legal nominee công bố và version hóa; hệ thống chỉ ghi
  phiên bản đã đồng ý — chờ DPO/legal xác nhận.
- [x] OQ-8: Khi rút consent, application đang chạy xử lý thế nào —
  Resolved (đề xuất): đánh dấu rút + cảnh báo HR phụ trách để quyết định
  dừng/giữ theo policy; hệ thống không tự xóa hay tự đóng application —
  chờ DPO/legal xác nhận (PRD OQ-6).
