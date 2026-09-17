---
type: srs
feature: cv-intake
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/cv-intake/brainstorms/cv-consent-parse-review.md
  - docs/features/cv-intake/cv-intake-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# cv-intake — Software Requirements Specification

## 1. Scope

SRS này cover đầu vào hồ sơ ứng viên của lát cắt tuyển dụng v1 (feature
`Must`, PRD Mục 6.1): tiếp nhận CV qua hai kênh (HR tải trong app, form
ứng viên công khai gắn vị trí đang mở), ghi consent + provenance bắt
buộc, kiểm tra file, xử lý có trạng thái không treo, trích xuất field
đề xuất kèm confidence/vị trí nguồn, màn review của HR, dò trùng người,
tạo application sau xác nhận, xác nhận đã nhận hồ sơ và audit đầy đủ.
KHÔNG cover: kênh integration (chờ `external-integrations`), OCR ảnh/scan
(`document-review`/`vision-ocr`), auto-reject hoặc điều phối ứng viên
(`candidate-pipeline`/`candidate-matching`), cơ chế xóa/ẩn khi rút consent
(chờ OQ-6 PRD), và chuẩn field hồ sơ người (person model chung).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tải CV, theo dõi xử lý, review và xác nhận field, xử lý trùng/lỗi | Có |
| Ứng viên | người | Nộp CV qua form công khai, đồng ý xử lý, nhận xác nhận | Có |
| Reviewer/HR lead | người | Giám sát hàng chờ review và chất lượng xác nhận | Có |
| Quản lý | người | Nhìn backlog và cảnh báo CV kẹt trong phạm vi | Có (chỉ đọc/cảnh báo) |
| Admin/DPO nominee | người | Kiểm tra consent/provenance, xử lý rút consent | Có (gián tiếp) |
| `document-intake` | hệ thống | Cổng kiểm tra quyền/định dạng/lưu file/job cho kênh HR tải | Có (dependency) |
| `document-review` | hệ thống | Hạ tầng trích xuất có confidence/vị trí nguồn mà job CV dùng | Có (dependency) |
| `recruitment-planning` | hệ thống | Cung cấp vị trí "Đang mở" làm đích gắn CV/form | Có (dependency) |
| `candidate-pipeline` | hệ thống | Nhận application mới ở trạng thái đầu pipeline | Có (consumer) |
| `contextual-notifications` | hệ thống | Cảnh báo CV kẹt/quá hạn, thông báo kết quả | Có (dependency) |
| `operational-email` | hệ thống | Gửi xác nhận đã nhận hồ sơ cho ứng viên | Có (dependency, kênh gửi) |
| Provider AI trích xuất | ngoài | Trích xuất field từ file CV | Có (bị chặn bởi privacy gate OQ-3/OQ-6) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-cv-intake-001 | Tiếp nhận kênh HR có provenance | Khi HR tải một hoặc nhiều CV, hệ thống phải yêu cầu chọn vị trí đích (hoặc "chưa gán"), khai báo nguồn hồ sơ và xác nhận ứng viên đã đồng ý chia sẻ trước khi nhận; thiếu khai báo thì phải chặn. File đi qua cổng `document-intake` để kiểm tra quyền/định dạng/lưu/tạo job. | P0 | test | PRD Mục 7.6; brainstorm D3; document-intake FR-001/002 |
| FR-cv-intake-002 | Form ứng viên có consent bắt buộc | Khi ứng viên nộp qua link của vị trí "Đang mở", hệ thống phải hiển thị mục đích xử lý dữ liệu, yêu cầu tick đồng ý trước khi gửi, ghi consent gồm mục đích + phiên bản chính sách + thời điểm + kênh; không tick thì không cho gửi. | P0 | test | PRD Mục 7.6, Mục 9 (consent); brainstorm D2 |
| FR-cv-intake-003 | Kiểm tra file CV | Hệ thống phải chỉ nhận PDF/DOCX ≤10 MB mỗi file và mở đọc được; file vi phạm bị từ chối kèm lý do và không tạo bản ghi CV. | P0 | test | reverse spec FR-RC-01; brainstorm D1, 7.1 |
| FR-cv-intake-004 | Trạng thái CV không treo | Hệ thống phải đưa mỗi CV qua trạng thái chờ xử lý → đang xử lý → chờ xác nhận → đã xác nhận; khi xử lý lỗi hoặc quá ngưỡng thời gian phải chuyển "Thất bại" kèm lý do — không có trạng thái treo vô thời hạn. | P0 | test | brainstorm 6.3, vá GAP-RC-03 |
| FR-cv-intake-005 | Trích xuất field đề xuất | Khi xử lý CV, hệ thống phải trích xuất field có cấu trúc (liên hệ, học vấn, kinh nghiệm, kỹ năng, chứng chỉ), mỗi field kèm confidence 0–1 và vị trí nguồn trong file để đối chiếu. | P0 | test | PRD Mục 7.6; brainstorm Mục 4 |
| FR-cv-intake-006 | Màn review của con người | Hệ thống phải hiển thị file gốc cạnh field đề xuất, cho HR sửa từng field, xác nhận từng field hoặc xác nhận hàng loạt; chỉ sau xác nhận mới ghi facts vào hồ sơ, và mọi field phải giữ provenance (AI đề xuất / HR sửa / nhập tay). | P0 | test | PRD Mục 7.6, Mục 12; brainstorm D7 |
| FR-cv-intake-007 | Đánh dấu field thiếu/confidence thấp | Khi field bắt buộc thiếu hoặc confidence dưới ngưỡng đã công bố, hệ thống phải đánh dấu trong màn review; nếu thiếu field bắt buộc thì phải chặn xác nhận và liệt kê phần thiếu. | P0 | test | PRD Mục 7.6 (review dữ liệu thiếu); URD UN-005 |
| FR-cv-intake-008 | Dò trùng người và quyết định gộp | Khi định danh của CV trùng person đã có, hệ thống phải cảnh báo trong màn review và bắt buộc HR chọn gộp vào hồ sơ cũ hay tạo person mới trước khi xác nhận; quyết định phải được ghi nhận. | P0 | test | brainstorm D6, vá GAP-RC-06 |
| FR-cv-intake-009 | Tạo application sau xác nhận | Khi CV chuyển "Đã xác nhận", hệ thống phải tạo application ở trạng thái đầu pipeline gắn vị trí đích nếu vị trí còn mở; nếu vị trí đã đóng hoặc CV không gắn vị trí thì giữ hồ sơ trong pool và cho chọn vị trí sau — không mất dữ liệu đã xác nhận. | P0 | test | PRD Mục 7.6 (luồng → application); brainstorm D8 |
| FR-cv-intake-010 | Retry và nhập tay khi xử lý lỗi | Khi CV "Thất bại", hệ thống phải cho "Thử lại" trong giới hạn số lần; khi hết lượt phải mở chế độ nhập tay — HR đọc file gốc, nhập field, xác nhận bình thường với provenance "nhập tay". | P0 | test | brainstorm D9, 5.3; OQ-RC-05 |
| FR-cv-intake-011 | Xác nhận đã nhận hồ sơ | Khi ứng viên nộp qua form thành công, hệ thống phải hiển thị và/hoặc gửi xác nhận đã nhận hồ sơ qua kênh được cấu hình (`operational-email`/`contextual-notifications`). | P1 | test | URD UN-008; brainstorm P1 |
| FR-cv-intake-012 | Cảnh báo CV kẹt và quá hạn review | Hệ thống phải cảnh báo owner và quản lý khi CV ở "Đang xử lý" quá ngưỡng, "Thất bại" hết lượt, hoặc "Chờ xác nhận" quá hạn review đã công bố. | P1 | test | URD UN-010; brainstorm P1 |
| FR-cv-intake-013 | Lọc hàng chờ review | Hệ thống phải cho lọc hàng chờ CV "Chờ xác nhận" theo vị trí, kênh nguồn và mức confidence thấp. | P1 | demo | brainstorm P1 |
| FR-cv-intake-014 | Đánh dấu rút consent | Khi ứng viên rút consent qua kênh được công bố, hệ thống phải đánh dấu consent "đã rút" kèm thời điểm, cảnh báo HR phụ trách và ghi audit; việc xóa/ẩn dữ liệu xử lý theo policy retention. | P1 | test | PRD Mục 9, OQ-6; URD UN-009 |
| FR-cv-intake-015 | Audit toàn bộ vòng đời CV | Hệ thống phải ghi audit cho: tiếp nhận (ai, kênh, nguồn), từ chối file, sửa field, xác nhận, quyết định gộp, thử lại, nhập tay, rút consent — đủ người, thời điểm, trước/sau. | P0 | kiểm tra | PRD Mục 9; brainstorm P0 |
| FR-cv-intake-016 | Chặn tiếp nhận thiếu consent/provenance | Hệ thống không được tạo bản ghi CV khi thiếu consent (form) hoặc thiếu khai báo nguồn/chấp thuận (kênh HR); CV từ ứng viên đã rút consent phải cảnh báo xử lý theo policy. | P0 | test | PRD Mục 7.6 ("Chưa làm" thu thập không consent), Mục 9 |
| FR-cv-intake-017 | Chống spam form công khai | Khi form ứng viên được mở, hệ thống phải áp dụng chống spam tối thiểu đã công bố (đề xuất: captcha tương đương + giới hạn nộp theo IP) và từ chối lượt vượt giới hạn. | P1 | test | brainstorm rủi ro spam; URD OQ-5 đề xuất |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-cv-intake-001 | privacy | CV và consent là dữ liệu nhạy cảm: truy cập theo organization/role/data-scope; chỉ dữ liệu synthetic/de-identified trước khi privacy gate đạt; file chỉ gửi provider AI theo chính sách đã duyệt. | P0 | 0 CV dữ liệu thật xử lý khi OQ-3/OQ-6 PRD còn mở; 0 sự cố truy cập vượt scope (M-GR-01) |
| NFR-cv-intake-002 | reliability | Không CV nào kẹt "Đang xử lý" vô thời hạn: timeout chuyển "Thất bại", retry giới hạn, hết lượt có nhập tay. | P0 | 0 CV quá ngưỡng không ở "Thất bại" và không có người được báo (vá GAP-RC-03) |
| NFR-cv-intake-003 | auditability | Mọi facts vào hồ sơ phải có provenance (nguồn field) và người xác nhận; mọi lượt tiếp nhận có vết. | P0 | 100% field hồ sơ có provenance + reviewer trên mẫu kiểm tra |
| NFR-cv-intake-004 | usability | Thông báo lỗi/trạng thái tiếng Việt nêu lý do + cách khắc phục; màn review cho đối chiếu file gốc với từng field. | P0 | HR xác nhận được mà không mở công cụ ngoài; kiểm tra mẫu wording |
| NFR-cv-intake-005 | performance | Trạng thái CV cập nhật gần như tức thì; hàng chờ review phản hồi nhanh ở quy mô pilot. | P1 | 95% lượt mở hàng chờ trong ≤3 giây ở ≤5.000 CV (đề xuất); người dùng không phải tải lại trang để thấy trạng thái mới |
| NFR-cv-intake-006 | integrity | Xác nhận và gộp phải idempotent: bấm lại/refresh không tạo application hay field trùng; retry xử lý không tạo kết quả trùng. | P0 | Test submit lặp: 1 application/CV xác nhận; 0 field nhân đôi sau retry |
| NFR-cv-intake-007 | data-retention | Consent và file CV giữ/xử lý theo policy retention được duyệt; rút consent không tự xóa âm thầm. | P0 | Hành vi theo policy do DPO duyệt (OQ-6 PRD); audit rút consent 100% |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-cv-intake-001 | Chỉ PDF/DOCX ≤10 MB, mở đọc được mới được tiếp nhận; vi phạm từ chối kèm lý do, không tạo bản ghi CV. | Gửi file | FR-cv-intake-003 | reverse FR-RC-01; brainstorm 7.1 |
| BR-cv-intake-002 | Không tiếp nhận khi thiếu consent (form) hoặc thiếu khai báo nguồn + xác nhận chấp thuận (HR). | Tiếp nhận CV | FR-cv-intake-001, FR-cv-intake-002, FR-cv-intake-016 | PRD Mục 7.6 "Chưa làm", Mục 9 |
| BR-cv-intake-003 | Facts chỉ ghi vào hồ sơ sau khi HR xác nhận; mọi field giữ provenance nguồn. | Xác nhận CV | FR-cv-intake-006 | PRD Mục 12 (human-in-the-loop), M-IN-03 |
| BR-cv-intake-004 | Field bắt buộc tối thiểu để xác nhận: họ tên + ≥1 liên hệ (email hợp lệ hoặc điện thoại) (đề xuất — OQ-3). | Xác nhận CV | FR-cv-intake-007 | brainstorm 7.1, OQ |
| BR-cv-intake-005 | Timeout xử lý 10 phút và retry tối đa 3 lần (đề xuất — OQ-2); hết lượt chỉ còn nhập tay. | Job xử lý lỗi/quá giờ | FR-cv-intake-004, FR-cv-intake-010 | brainstorm 7.2, OQ-RC-05 |
| BR-cv-intake-006 | Confidence <0,8 (đề xuất) đánh dấu "cần kiểm tra" trong màn review; không tự sửa hay tự loại field. | Hiển thị field đề xuất | FR-cv-intake-005, FR-cv-intake-007 | brainstorm 7.2 |
| BR-cv-intake-007 | Application chỉ tạo từ CV "Đã xác nhận", ở trạng thái đầu pipeline; AI không tự chuyển trạng thái hay reject. | Tạo application | FR-cv-intake-009 | PRD Mục 12; sửa xung đột rule 1 reverse spec |
| BR-cv-intake-008 | HR tải tối đa 20 file mỗi lượt (đề xuất); file trong lô kiểm tra độc lập, file lỗi không chặn file hợp lệ. | Upload lô | FR-cv-intake-001, FR-cv-intake-003 | brainstorm 7.2 |
| BR-cv-intake-009 | Trùng định danh person (v1: email, cảnh báo phụ theo điện thoại — đề xuất OQ-6) bắt buộc HR chọn gộp hay tạo mới trước khi xác nhận. | Dò trùng trong review | FR-cv-intake-008 | brainstorm D6; GAP-RC-06 |
| BR-cv-intake-010 | Form ứng viên chỉ hiện cho vị trí "Đang mở"; vị trí đóng/tạm dừng thì link ngừng nhận và hiện thông báo. | Ứng viên mở link | FR-cv-intake-002, FR-cv-intake-009 | brainstorm 6.2; phụ thuộc recruitment-planning |
| BR-cv-intake-011 | Rút consent chỉ đánh dấu + cảnh báo + audit; xóa/ẩn theo policy retention — hệ thống không tự xóa. | Yêu cầu rút consent | FR-cv-intake-014 | PRD Mục 9, OQ-6; URD OQ-8 |
| BR-cv-intake-012 | Retry xử lý phải idempotent — thử lại không tạo bản ghi CV, field hay application trùng. | Thử lại CV thất bại | FR-cv-intake-010, NFR-cv-intake-006 | R-07 sản phẩm |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-cv-intake-001 | Sai định dạng file | File không phải PDF/DOCX; nếu sai thì hệ thống phải từ chối kèm định dạng được hỗ trợ | minor | FR-cv-intake-003 | File bị từ chối + lý do | Tải file đúng định dạng |
| E-cv-intake-002 | File vượt 10 MB | File quá lớn; nếu vượt thì phải từ chối và nêu giới hạn | minor | FR-cv-intake-003 | File bị từ chối + lý do | Nén/tải file khác |
| E-cv-intake-003 | File không đọc được | File hỏng/mã hóa; nếu không mở được thì phải từ chối | minor | FR-cv-intake-003 | File bị từ chối + lý do | Kiểm tra file rồi tải lại |
| E-cv-intake-004 | Thiếu consent | Ứng viên gửi form chưa tick đồng ý; nếu thiếu thì phải chặn gửi | major | FR-cv-intake-002, FR-cv-intake-016 | Nút gửi vô hiệu + giải thích | Tick đồng ý rồi gửi |
| E-cv-intake-005 | Thiếu khai báo nguồn | HR tải chưa khai báo nguồn/xác nhận chấp thuận; nếu thiếu thì phải chặn nhận | major | FR-cv-intake-001, FR-cv-intake-016 | Form chặn + yêu cầu bổ sung | Khai báo đủ rồi gửi |
| E-cv-intake-006 | Trích xuất thất bại | Job xử lý lỗi/timeout; nếu lỗi thì phải chuyển "Thất bại" + lý do | major | FR-cv-intake-004 | CV "Thất bại" + lý do + nút thử lại | Thử lại hoặc nhập tay |
| E-cv-intake-007 | Hết lượt thử lại | CV thất bại quá số lần retry; nếu hết lượt thì phải mở nhập tay | major | FR-cv-intake-010 | "Thất bại" + chế độ nhập tay | HR nhập tay rồi xác nhận |
| E-cv-intake-008 | Thiếu field bắt buộc khi xác nhận | Xác nhận khi thiếu họ tên/liên hệ; nếu thiếu thì phải chặn | major | FR-cv-intake-007 | Liệt kê field còn thiếu | Bổ sung rồi xác nhận |
| E-cv-intake-009 | Trùng person chưa quyết | Xác nhận khi cảnh báo trùng chưa được xử lý; nếu chưa chọn thì phải chặn | major | FR-cv-intake-008 | Cảnh báo trùng + bắt buộc chọn | Chọn gộp hoặc tạo mới |
| E-cv-intake-010 | Vị trí đã đóng khi xác nhận | Vị trí đích đóng giữa lúc review; nếu đóng thì phải báo và giữ facts | major | FR-cv-intake-009 | Cảnh báo vị trí đóng | Chọn vị trí khác hoặc giữ pool |
| E-cv-intake-011 | Form của vị trí không mở | Ứng viên mở link vị trí đóng/chưa tồn tại | minor | FR-cv-intake-002, BR-010 | Trang thông báo vị trí không còn nhận hồ sơ | Liên hệ HR qua kênh công bố |
| E-cv-intake-012 | Nộp trùng cùng vị trí | Ứng viên nộp lần 2+ cho cùng vị trí | minor | FR-cv-intake-008, FR-cv-intake-009 | Cảnh báo trùng trong review | HR chọn giữ bản mới/gộp |
| E-cv-intake-013 | Sửa đồng thời một CV | Hai HR lưu cùng CV trong review | minor | FR-cv-intake-006 | Cảnh báo "CV vừa được {người} cập nhật" | Tải lại, xử lý trên bản mới |
| E-cv-intake-014 | Vượt chống spam form | Nộp quá giới hạn theo IP/captcha fail | minor | FR-cv-intake-017 | Thông báo thử lại sau | Nộp lại sau hoặc qua kênh HR |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-cv-intake-01 | CV được xác nhận mà không phải nhập lại nhiều | M-IN-03: field HR giữ nguyên / field extraction đề xuất, theo phiên bản parser | Target chờ OQ-2 sản phẩm |
| SC-cv-intake-02 | Không CV kẹt xử lý | Số CV ở "Đang xử lý"/"Thất bại" quá SLA không có owner/đường xử lý | 0 |
| SC-cv-intake-03 | Consent/provenance đầy đủ | Tỷ lệ CV tiếp nhận có consent + provenance đủ | 100% |
| SC-cv-intake-04 | Facts có nguồn và reviewer | Tỷ lệ field vào hồ sơ có provenance + người xác nhận | 100% |
| SC-cv-intake-05 | Ứng viên được báo đã nhận | Tỷ lệ nộp form hợp lệ có xác nhận gửi thành công | ≥95% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **CANDIDATE_CV** — bản ghi một CV được tiếp nhận: file, kênh, nguồn
  khai báo, vị trí đích (rỗng = pool), trạng thái xử lý/xác nhận, số lần
  thử, người tải.
- **CV_CONSENT** — bản ghi chấp thuận của CV: mục đích, phiên bản chính
  sách, kênh, hình thức (ứng viên tick / HR khai báo), thời điểm đồng ý
  và rút.
- **CV_EXTRACTED_FIELD** — một field đề xuất của trích xuất: khóa field,
  giá trị đề xuất, confidence, vị trí nguồn, giá trị sau sửa/xác nhận,
  người xác nhận.
- **CV_AUDIT_EVENT** — sự kiện kiểm toán vòng đời CV: tiếp nhận, từ chối,
  sửa, xác nhận, gộp, thử lại, nhập tay, rút consent.
- **PERSON**, **POSITION**, **JOB_APPLICATION**, **INTAKE_DOCUMENT**
  (tham chiếu ngoài) — hồ sơ người (person model chung), vị trí
  (`recruitment-planning`), application (`candidate-pipeline`), bản ghi
  cổng file (`document-intake`).

Chi tiết quan hệ + thuộc tính ở `srs/cv-intake-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- **Flow 1:** HR tải CV → khai báo nguồn + chấp thuận → kiểm tra file →
  trích xuất → review → xác nhận → facts + application.
- **Flow 2:** Ứng viên mở link vị trí → đồng ý xử lý → tải CV → ghi
  consent → xác nhận đã nộp → vào cùng hàng chờ review.
- **Flow 3:** CV lỗi/kẹt → "Thất bại" + lý do → thử lại (≤3) → hết lượt
  → nhập tay → xác nhận.
- **Flow 4:** Cảnh báo trùng person → HR chọn gộp/tạo mới → ghi quyết
  định.
- **Flow 5:** Rút consent → đánh dấu + cảnh báo HR → xử lý theo policy.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- **cv-upload** — HR chọn vị trí, kéo nhiều file, khai báo nguồn +
  chấp thuận, xem kết quả từng file.
- **candidate-apply-form** — form công khai theo vị trí: mục đích xử lý,
  tick đồng ý, liên hệ tối thiểu, tải CV, xác nhận.
- **cv-status-list** — danh sách CV theo trạng thái, lý do thất bại, lọc
  theo vị trí/kênh.
- **cv-review** — file gốc + bảng field đề xuất (confidence, vị trí
  nguồn), sửa/xác nhận, cảnh báo trùng.
- **review-queue** — hàng chờ "Chờ xác nhận" lọc theo vị trí/kênh/
  confidence.
- **cv-manual-entry** — nhập tay khi hết lượt thử lại (file gốc cạnh form
  trống).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Consent + provenance là điều kiện tiếp nhận; không thu thập từ nguồn không consent | PRD Mục 7.6 "Chưa làm", Mục 9 — Product + DPO |
| Facts chỉ vào hồ sơ sau xác nhận của con người; AI chỉ đề xuất | PRD Mục 12 — Product owner |
| Truy cập CV/consent theo organization/role/data-scope; audit đầy đủ | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi OQ-3/OQ-6 PRD đạt; file gửi provider ngoài theo policy | PRD Mục 9 — Product + DPO |
| Không auto-reject/auto-điều phối — quyết định pipeline thuộc con người | PRD Mục 12; sửa conflict rule 1 reverse spec — Product owner |
| Tiếng Việt ưu tiên cho mọi surface kể cả form ứng viên | PRD Mục 9 |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Cổng tiếp nhận file (quyền/định dạng/lưu/job) cho kênh HR | `document-intake` owner | HR không tải CV qua cổng chung được |
| Hạ tầng trích xuất + confidence + vị trí nguồn | `document-review` owner | Không có field đề xuất để review |
| Vị trí "Đang mở" + form gắn vị trí | `recruitment-planning` owner | Không có đích gắn CV, form không mở |
| Trạng thái đầu pipeline để tạo application | `candidate-pipeline` owner | Application không vào được pipeline |
| Thông báo in-app/email cảnh báo + xác nhận | `contextual-notifications`, `operational-email` owners | Cảnh báo kẹt và xác nhận nộp không đến người |
| Person model chung (hồ sơ ứng viên) | owner person model (`employee-profiles`/talent) | Không ghi được facts |
| Chính sách retention/consent + wording đồng ý | DPO/legal (OQ-6, OQ-3 PRD) | Không dùng dữ liệu thật |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| V1 = 2 kênh (HR tải + form ứng viên); integration ra ngoài scope | FR-001/002 thiếu kênh, phải thêm contract integration |
| Kênh HR đi qua document-intake; form ứng viên là surface riêng của cv-intake | FR-001/017 phải đổi ranh giới cổng |
| Ngưỡng 10 phút/3 lần/<0,8/20 file là chuẩn v1 | BR-005/006/008 đổi giá trị |
| Field bắt buộc = họ tên + 1 liên hệ | BR-004, E-008 đổi điều kiện xác nhận |
| Dò trùng v1 theo email (+cảnh báo điện thoại) | FR-008 bỏ lọt trùng theo định danh khác |
| Ứng viên nộp lại giữ nhiều CV, application tham chiếu bản mới nhất | E-012, quan hệ CV–application phải đổi |
| Rút consent chỉ đánh dấu, xử lý theo policy | FR-014, BR-011 phải thêm cơ chế xóa/ẩn |

## 12. Open Questions

- [x] OQ-1: Retention và rút consent cho CV — Resolved (đề xuất): đánh
  dấu "đã rút" + cảnh báo + xử lý theo policy do DPO công bố; synthetic
  trước khi duyệt (PRD OQ-6/OQ-3) — chờ DPO/legal xác nhận.
- [x] OQ-2: Timeout/retry — Resolved (đề xuất): 10 phút, 3 lần rồi nhập
  tay — chờ Product owner xác nhận.
- [x] OQ-3: Field bắt buộc tối thiểu — Resolved (đề xuất): họ tên + 1
  liên hệ — chờ Head of HR xác nhận.
- [x] OQ-4: CV không gắn vị trí (pool) — Resolved (đề xuất): nhận qua
  kênh HR "chưa gán"; form luôn gắn vị trí — chờ Head of HR xác nhận.
- [x] OQ-5: Chống spam form — Resolved (đề xuất): captcha + giới hạn nộp
  theo IP (ví dụ 5 lần/giờ) — chờ Security owner xác nhận.
- [x] OQ-6: Bộ định danh dò trùng — Resolved (đề xuất): v1 email chính +
  cảnh báo điện thoại; mở rộng sau — chờ Head of HR xác nhận.
- [x] OQ-7: Consent wording/version — Resolved (đề xuất): DPO công bố +
  version; hệ thống ghi phiên bản đã đồng ý — chờ DPO/legal xác nhận.
- [x] OQ-8: Application đang chạy khi rút consent — Resolved (đề xuất):
  đánh dấu + cảnh báo HR quyết định theo policy; không tự xóa/đóng — chờ
  DPO/legal xác nhận.
