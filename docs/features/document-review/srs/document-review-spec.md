---
type: srs
feature: document-review
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/document-review/brainstorms/human-confirmed-extraction-publish.md
  - docs/features/document-review/document-review-urd.md
  - docs/features/document-intake/srs/document-intake-spec.md
---

# document-review — Software Requirements Specification

## 1. Scope

SRS này cover lớp kiểm chứng của pipeline Document AI: nhận output đã xử
lý xong từ `document-intake`, trình bày text OCR và field có cấu trúc kèm
confidence/vị trí nguồn cho reviewer, ghi nhận sửa/xác nhận của con người
và publish payload đã xác nhận kèm provenance sang module đích. KHÔNG
cover: tiếp nhận/kiểm tra file và vòng đời job (`document-intake`), quản
lý phiên bản tài liệu nguồn và topic (`document-library`), scan ảnh nhanh
ngoài pipeline (`vision-ocr`), ngữ nghĩa field của module đích, và việc
ghi đè hồ sơ nghiệp vụ khi chưa review (PRD "Chưa làm").

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR / Reviewer | người | Đối chiếu evidence, sửa và xác nhận field, publish kết quả | Có |
| Admin | người | Giám sát hàng chờ review, reassign, mở nhập tay | Có |
| Người tải file | người | Theo dõi trạng thái review/publish của file mình | Có |
| `document-intake` | hệ thống (feature khác) | Bàn giao file + job hoàn tất + ngữ cảnh | Có (nguồn đầu vào) |
| Module đích (cv-intake, document-library, ai-question-generation) | hệ thống | Nhận payload đã publish kèm provenance | Có (bên nhận) |
| `org-governance` | hệ thống | Quyết định quyền trên ngữ cảnh và vai trò reviewer | Có (dependency) |
| Engine OCR/trích xuất (provider) | hệ thống/ngoài | Trả text + field + confidence + vùng nguồn | Có (dependency; bị chặn bởi OQ-6 khi file PII) |
| `contextual-notifications` | hệ thống | Nhắc tài liệu chờ review, báo kết quả publish | Có (dependency) |
| Người trong tài liệu (ứng viên/nhân viên) | người | Facts về mình được kiểm chứng | Không (không thao tác) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-document-review-001 | Nhận output từ intake | Khi `document-intake` bàn giao file + job hoàn tất, hệ thống phải tạo một kết quả trích xuất ở trạng thái "Chờ review" gắn với file và ngữ cảnh gốc | P0 | test | PRD Mục 7.18; FR-document-intake-014 |
| FR-document-review-002 | Hiển thị text OCR đầy đủ | Hệ thống phải hiển thị toàn bộ text đã trích xuất của tài liệu, giữ cấu trúc dòng/đoạn/bảng, giữ nguyên ngôn ngữ gốc (ưu tiên tiếng Việt), và đánh dấu phần không đọc được thay vì đoán | P0 | demo | PRD Mục 7.18 (OCR tiếng Việt); brainstorm 5.1 |
| FR-document-review-003 | Trích xuất field có cấu trúc | Hệ thống phải sinh danh sách field đề xuất theo loại tài liệu đã xác nhận ở intake, mỗi field gồm giá trị đề xuất, điểm confidence và vị trí nguồn (trang/vùng) trên tài liệu gốc | P0 | test | PRD Mục 7.18 (extraction, confidence, source location) |
| FR-document-review-004 | Màn đối chiếu evidence | Khi reviewer mở tài liệu, hệ thống phải hiển thị đồng thời tài liệu gốc và danh sách field; khi reviewer chọn một field, hệ thống phải định vị vùng nguồn tương ứng trên tài liệu | P0 | demo | PRD Mục 7.18 (hiển thị evidence); URD UN-002 |
| FR-document-review-005 | Ưu tiên field confidence thấp | Khi field có confidence dưới ngưỡng cảnh báo, hệ thống phải tô nổi field đó và đưa lên đầu danh sách review | P0 | test | PRD Mục 7.18 (confidence); R-05; ngưỡng chờ OQ-1 |
| FR-document-review-006 | Sửa field giữ diff | Khi reviewer sửa một field, hệ thống phải lưu cả giá trị máy đề xuất lẫn giá trị đã sửa và đánh dấu field "đã sửa" để phục vụ diff và đo mức chỉnh sửa | P0 | test | PRD Mục 7.18 (diff/review), M-IN-03; URD UN-004 |
| FR-document-review-007 | Xác nhận field | Hệ thống phải cho reviewer xác nhận từng field hoặc xác nhận tất cả field còn lại sau khi đã rà; mỗi xác nhận ghi người và thời điểm | P0 | test | PRD Mục 7.18 (sửa/xác nhận); URD UN-005 |
| FR-document-review-008 | Điều kiện publish | Khi reviewer yêu cầu publish, hệ thống phải kiểm tra mọi field bắt buộc theo loại tài liệu đã có giá trị và ở trạng thái đã xác nhận; nếu thiếu thì phải chặn và liệt kê field còn thiếu | P0 | test | PRD Mục 7.18, Mục 12; brainstorm D2 |
| FR-document-review-009 | Publish có provenance | Khi đủ điều kiện, hệ thống phải đóng gói payload gồm field đã xác nhận + text đã duyệt + provenance (file nguồn, job, engine/model version, reviewer, thời điểm) và gửi sang module đích theo ngữ cảnh | P0 | test | PRD Mục 7.18 (publish → audit), Mục 12 |
| FR-document-review-010 | Publish idempotent có trạng thái | Khi gửi sang module đích thất bại, hệ thống phải giữ kết quả ở "Chờ publish", cho gửi lại mà không tạo bản ghi trùng ở module đích; quá số lần gửi lại thì báo admin | P0 | test | brainstorm 5.3, D6; R-07 sản phẩm |
| FR-document-review-011 | Hàng chờ review | Hệ thống phải cho reviewer/admin xem danh sách tài liệu theo trạng thái review (chờ/đang/đã xác nhận/chờ publish/đã publish/chờ xử lý lại), lọc theo ngữ cảnh và người được giao | P0 | demo | PRD Mục 7.18 (luồng); URD UN-001, UN-007 |
| FR-document-review-012 | Gán và nhắc reviewer | Hệ thống phải cho phép gán/reassign reviewer cho tài liệu chờ review và nhắc người được giao khi chờ quá ngưỡng | P1 | test | brainstorm P1, D7; URD UN-007 |
| FR-document-review-013 | Yêu cầu xử lý lại | Khi reviewer đánh dấu kết quả không dùng được kèm lý do, hệ thống phải chuyển kết quả sang "Chờ xử lý lại" và tạo yêu cầu job mới trên cùng file qua intake; kết quả mới về thì tạo extraction mới "Chờ review" | P0 | test | brainstorm 5.2; URD UN-006 |
| FR-document-review-014 | Giới hạn xử lý lại và nhập tay | Khi đã xử lý lại quá số lần cho phép, hệ thống phải báo admin và mở chế độ nhập tay (toàn bộ field ở trạng thái điền thủ công) | P1 | test | brainstorm D5; ngưỡng chờ OQ-2 |
| FR-document-review-015 | Khóa phiên review | Khi một tài liệu đang ở "Đang review" bởi một người, hệ thống phải chỉ cho người khác xem ở chế độ chỉ đọc kèm cảnh báo, cho tới khi phiên được nhả hoặc reassign | P1 | test | brainstorm D7; URD UN-009 |
| FR-document-review-016 | Không publish khi file bị khóa | Khi file nguồn bị khóa/cách ly/rút ở intake trong lúc review, hệ thống phải khóa màn review và chặn publish cho tới khi file được giải phóng | P1 | test | brainstorm D8, 6.4 |
| FR-document-review-017 | Đổi loại tài liệu trong review | Khi loại tài liệu ở intake sai, hệ thống phải cho reviewer đổi sang loại khác trong danh sách đã công bố, nạp lại bộ field mục tiêu và ghi nhận thay đổi | P1 | demo | brainstorm 6.5 |
| FR-document-review-018 | Nhóm field lặp | Hệ thống phải cho reviewer thêm/bớt nhóm field lặp (vd nhiều mục kinh nghiệm) trong màn review | P2 | demo | brainstorm 6.5 |
| FR-document-review-019 | Trạng thái cho người tải | Hệ thống phải hiển thị trạng thái review/publish của file cho người tải theo quyền trên ngữ cảnh | P1 | demo | URD UN-008 |
| FR-document-review-020 | Audit review và publish | Hệ thống phải ghi audit cho: mở/nhận review, sửa/xác nhận field, đổi loại tài liệu, yêu cầu xử lý lại, reassign, publish và gửi lại — đủ ai/hành động/trước-sau/thời điểm | P0 | kiểm tra | PRD Mục 9, 7.18 (audit); URD UN-005 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-document-review-001 | integrity | Không field nào được đưa sang module đích khi chưa ở trạng thái đã xác nhận bởi con người; mọi payload publish có provenance đủ | P0 | 0 payload publish thiếu reviewer/engine/thời điểm trong kiểm tra mẫu (invariant PRD Mục 12) |
| NFR-document-review-002 | security | Chỉ người có quyền trên ngữ cảnh file được review/xem kết quả; field nhạy cảm hiển thị theo quyền; deny by default khi quyết định quyền lỗi | P0 | 0 incident vượt data-scope liên quan màn review (bám M-GR-01) |
| NFR-document-review-003 | privacy | File chứa PII chỉ gửi provider OCR bên ngoài theo chính sách đã duyệt; khi chưa duyệt chỉ file không nhạy cảm/synthetic được gửi | P0 | 0 file PII gửi ra provider ngoài khi OQ-13/OQ-6 sản phẩm còn mở |
| NFR-document-review-004 | auditability | Mọi thay đổi trên field và quyết định publish truy vết được trước/sau | P0 | 100% field đã publish truy vết được giá trị máy, giá trị xác nhận và người xác nhận |
| NFR-document-review-005 | reliability | Kết quả đã xác nhận không mất khi publish lỗi; gửi lại không tạo trùng | P0 | 0 kết quả đã xác nhận mất; 0 payload trùng ở module đích trong kiểm thử retry |
| NFR-document-review-006 | performance | Mở màn review của một tài liệu (tài liệu gốc + field + vùng nguồn) | P1 | 95% lượt mở hiển thị đủ trong ≤5 giây (đề xuất — chờ OQ-3) |
| NFR-document-review-007 | usability | Mọi thông báo/trạng thái tiếng Việt tự nhiên; text trích xuất giữ nguyên ngôn ngữ gốc | P0 | Kiểm tra mẫu: không thông báo nào lộ lỗi kỹ thuật thô cho người dùng |
| NFR-document-review-008 | data-retention | Text trích xuất, vùng nguồn và diff review giữ theo vòng đời file nguồn | P1 | Thời gian giữ theo quyết định retention — chờ OQ-7 (liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-document-review-001 | Chỉ kết quả đã xác nhận bởi con người mới được publish; không có đường publish tự động hoặc bỏ qua review | Mọi yêu cầu publish | FR-document-review-008, FR-document-review-009 | PRD Mục 12 (human-in-the-loop), 7.18 "Chưa làm" |
| BR-document-review-002 | Field bắt buộc theo loại tài liệu phải có giá trị và đã xác nhận trước khi publish | Kiểm tra điều kiện publish | FR-document-review-008 | brainstorm 7.1 |
| BR-document-review-003 | Field dưới ngưỡng confidence (đề xuất 0,70) phải tô nổi và buộc reviewer định vị vùng nguồn trước khi xác nhận | Kết quả trích xuất có field thấp-confidence | FR-document-review-005 | brainstorm 7.2; R-05; chờ OQ-1 |
| BR-document-review-004 | Sửa field luôn giữ cặp (giá trị máy, giá trị người) — không ghi đè giá trị máy | Reviewer lưu sửa field | FR-document-review-006 | PRD Mục 7.18 (diff), M-IN-03 |
| BR-document-review-005 | Xử lý lại tối đa 2 lần mỗi tài liệu (đề xuất); sau đó chỉ nhập tay hoặc admin quyết định | Yêu cầu xử lý lại | FR-document-review-013, FR-document-review-014 | brainstorm 7.2; chờ OQ-2 |
| BR-document-review-006 | Một tài liệu chỉ có một phiên review hoạt động; phiên nhả về chờ sau 60 phút không hoạt động (đề xuất) | Người thứ hai mở review / phiên hết hạn | FR-document-review-015 | brainstorm 7.2; chờ OQ-3 |
| BR-document-review-007 | Publish idempotent theo cặp (kết quả, module đích); gửi lại tối đa 3 lần rồi báo admin | Publish thất bại | FR-document-review-010 | brainstorm 7.2; R-07 |
| BR-document-review-008 | Mọi xác nhận/sửa/publish phải ghi ai + khi nào + trước/sau | Mọi hành động trên field và kết quả | FR-document-review-020 | PRD Mục 9 |
| BR-document-review-009 | Tài liệu của ngữ cảnh chỉ review được bởi người có quyền trên ngữ cảnh đó | Mở màn review / gán reviewer | FR-document-review-011, FR-document-review-012 | PRD Mục 9 (data-scope) |
| BR-document-review-010 | Sau khi publish, kết quả là bất biến; thay đổi dữ liệu nghiệp vụ thực hiện ở module đích | Yêu cầu sửa kết quả đã publish | FR-document-review-009 | brainstorm Mục 8 (assumption) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-document-review-001 | Publish thiếu field bắt buộc | Bấm publish khi còn field bắt buộc chưa xác nhận | minor | FR-document-review-008 | "Chưa thể đưa vào sử dụng — còn {n} field bắt buộc chưa xác nhận: {danh sách}" | Rà và xác nhận field còn thiếu |
| E-document-review-002 | Field bắt buộc bỏ trống | Xác nhận field bắt buộc không có giá trị | minor | FR-document-review-007 | "Field {tên} là bắt buộc — điền giá trị hoặc đánh dấu không có trong tài liệu" | Điền giá trị hoặc đánh dấu vắng mặt |
| E-document-review-003 | Tài liệu đang được người khác review | Mở tài liệu có phiên review hoạt động | minor | FR-document-review-015 | "Tài liệu đang được {người} review — bạn chỉ có thể xem" | Chờ nhả phiên hoặc nhờ admin reassign |
| E-document-review-004 | Publish sang module đích thất bại | Module đích từ chối/không phản hồi | major | FR-document-review-010 | Kết quả "Chờ publish" + "hệ thống sẽ giữ trạng thái chờ gửi, không mất dữ liệu đã xác nhận" | Gửi lại; hết 3 lần báo admin |
| E-document-review-005 | File nguồn bị khóa/cách ly | Intake khóa file khi đang review | major | FR-document-review-016 | Màn review khóa + "File nguồn đang bị khóa/cách ly — tạm dừng review tài liệu này" | Chờ giải phóng; nếu file bị xóa thì hủy kết quả |
| E-document-review-006 | Hết lượt xử lý lại | Yêu cầu xử lý lại lần thứ 3 | major | FR-document-review-014 | "Đã xử lý lại {n} lần không cải thiện — chuyển sang nhập thủ công hoặc liên hệ admin" | Nhập tay toàn bộ hoặc admin quyết định |
| E-document-review-007 | Không có quyền review trên ngữ cảnh | Người dùng thiếu quyền mở review | major | FR-document-review-011 | Tài liệu không hiện trong hàng chờ; khi truy cập trực tiếp báo không có quyền | Xin cấp quyền; sự kiện ghi audit |
| E-document-review-008 | Kết quả trích xuất rỗng | Engine trả text rỗng/ảnh không đọc được | major | FR-document-review-002 | Kết quả vào hàng chờ với cờ "không đọc được nội dung" | Nhập tay hoặc yêu cầu xử lý lại/tải file khác |
| E-document-review-009 | Reassign sai người | Gán reviewer không có quyền ngữ cảnh | minor | FR-document-review-012 | "Người được gán không có quyền trên ngữ cảnh của tài liệu" | Chọn người khác có quyền |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-document-review-01 | Field máy đề xuất được giữ nguyên sau review | Tỷ lệ field xác nhận không sửa / tổng field đề xuất (M-IN-03), theo engine version | Baseline trong 1 tháng pilot; mốc chờ OQ-2 PRD |
| SC-document-review-02 | Mọi payload publish đều có kiểm chứng con người | Tỷ lệ publish event đủ reviewer + engine + thời điểm + provenance | 100% |
| SC-document-review-03 | Hàng chờ review không treo | Thời gian trung bình từ "chờ-review" đến "đang-review" | ≤1 ngày làm việc (đề xuất — chờ OQ-3) |
| SC-document-review-04 | Kết quả đã xác nhận không mất/trùng khi publish | Số incident mất hoặc trùng publish được xác nhận | 0 |
| SC-document-review-05 | Giảm nhập tay cho HR | Tỷ lệ tài liệu publish có thời gian review < nhập tay ước lượng | ≥60% sau 1 tháng pilot (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **EXTRACTION_RESULT** — một lần trích xuất trên file đã xử lý: text đầy
  đủ, engine/model version, ngôn ngữ, trạng thái vòng đời review, liên kết
  file và job nguồn.
- **EXTRACTED_FIELD** — một field đề xuất: tên field, giá trị máy, giá trị
  đã sửa/xác nhận, confidence, vị trí nguồn (trang/vùng), trạng thái,
  nhóm lặp, cờ bắt buộc.
- **REVIEW_ACTION** — vết hành động của reviewer trên field/kết quả: sửa,
  xác nhận, đánh dấu vắng mặt, trước/sau, thời điểm.
- **REVIEW_ASSIGNMENT** — người đang giữ review và lịch sử gán/reassign.
- **PUBLISH_EVENT** — một lần publish sang module đích: module đích,
  payload/tham chiếu, trạng thái gửi, số lần gửi lại.
- **INTAKE_DOCUMENT**, **PROCESSING_JOB**, **USERS** — tham chiếu ngoài
  (thuộc `document-intake`, `org-governance`).

Chi tiết quan hệ + thuộc tính ở `srs/document-review-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- **Flow 1:** Job hoàn tất → kết quả "Chờ review" → reviewer đối chiếu →
  sửa/xác nhận field → publish sang module đích → "Đã publish".
- **Flow 2:** Kết quả nhiễu → "Yêu cầu xử lý lại" kèm lý do → job mới →
  kết quả mới "Chờ review" → hết lượt → nhập tay/admin.
- **Flow 3:** Publish lỗi → "Chờ publish" → gửi lại idempotent → hết lượt
  → admin xử lý.
- **Flow 4:** Admin giám sát backlog → reassign / mở nhập tay / xử lý tài
  liệu bị khóa.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- **review-queue** — hàng chờ tài liệu chờ/đang review, lọc trạng thái +
  ngữ cảnh + người được giao.
- **review-workspace** — màn đối chiếu: tài liệu gốc ↔ danh sách field
  kèm confidence/vùng nguồn, hành động sửa/xác nhận/publish/xử lý lại.
- **publish-status** — trạng thái publish của kết quả (đã publish/chờ
  publish, lần gửi, module đích).
- **admin-review-backlog** — danh sách chờ quá hạn, gán/reassign reviewer,
  mở nhập tay.
- **extraction-detail** — provenance: engine/model, job, diff từng field,
  lịch sử xử lý lại.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Không field nào thành fact khi chưa qua xác nhận con người; mọi publish có provenance | PRD Mục 12 (invariant), 7.18 — Product owner |
| Truy cập theo organization/role/data-scope trên ngữ cảnh file | PRD Mục 9 — Security owner |
| File PII chỉ tới provider ngoài theo chính sách duyệt; OQ-13/OQ-6 mở thì chỉ dữ liệu không nhạy cảm/synthetic | PRD Mục 9, R-16 — Product + DPO |
| OCR phải hỗ trợ tiếng Việt; text giữ nguyên ngôn ngữ gốc | PRD Mục 7.18, 9 — Document AI owner |
| Audit đầy đủ cho sửa/xác nhận/publish | PRD Mục 9 — Security owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| File hợp lệ + job hoàn tất + ngữ cảnh được bàn giao | `document-intake` | Không có đầu vào để review |
| Engine OCR/trích xuất trả text + field + confidence + vùng nguồn, hỗ trợ tiếng Việt | Document AI/Operations owner (provider chờ OQ-13) | Không có đề xuất để review |
| Quyết định quyền + vai trò reviewer | `org-governance` | Không kiểm soát được ai review |
| Module đích nhận payload (cv-intake, document-library, ai-question-generation) | Owner từng module | Publish không có nơi tiêu thụ |
| Thông báo nhắc hàng chờ/kết quả | `contextual-notifications` | Reviewer không được báo việc |
| Bộ field mục tiêu + field bắt buộc theo loại tài liệu | Owner nghiệp vụ từng loại | Điều kiện publish không xác định |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Confidence thang 0–1, ngưỡng cảnh báo 0,70 | FR-005, BR-003 tô nổi sai nhóm field |
| Xử lý lại ≤2 lần, phiên review nhả sau 60 phút, gửi lại publish ≤3 | BR-005/006/007 đổi ngưỡng |
| Reviewer = người có quyền ngữ cảnh, mặc định người tải | FR-011/012 phải đổi mô hình phân công |
| Engine trả vùng nguồn theo trang/vùng đủ để định vị | FR-004 mất khả năng nhảy tới evidence |
| Publish idempotent được module đích hỗ trợ | FR-010 tạo trùng payload |

## 12. Open Questions

- [x] OQ-1: Ngưỡng confidence cảnh báo — Resolved (đề xuất): 0,70 trên
  thang 0–1 — chờ Document AI owner xác nhận.
- [x] OQ-2: Số lần xử lý lại tối đa — Resolved (đề xuất): 2 lần rồi mở
  nhập tay — chờ Document AI owner.
- [x] OQ-3: SLA hàng chờ/phiên review và ngưỡng hiệu năng mở màn — Resolved
  (đề xuất): nhắc 1 ngày làm việc, phiên nhả sau 60 phút, mở màn ≤5 giây —
  chờ Operations owner (liên quan OQ-2 sản phẩm).
- [x] OQ-4: Cơ chế publish và gửi lại — Resolved (đề xuất): "chờ-publish"
  + ≤3 lần gửi lại idempotent — chờ Technical owner.
- [x] OQ-5: Mô hình phân công reviewer — Resolved (đề xuất): quyền trên
  ngữ cảnh, admin phân công, mặc định người tải — chờ Admin lead.
- [x] OQ-6: Chính sách gửi file PII tới provider OCR ngoài và mức che/lọc
  — Resolved (đề xuất): chưa duyệt thì chỉ file không nhạy cảm/synthetic;
  file PII dùng engine nội bộ hoặc chờ — chờ DPO/legal (PRD OQ-13, R-16,
  KHÔNG tự chốt).
- [x] OQ-7: Retention text/vùng nguồn/diff — Resolved (đề xuất): theo vòng
  đời file nguồn ở intake — chờ DPO/legal (PRD OQ-6).
- [~] OQ-8: Gợi ý field từ dữ liệu hiện có và học từ sửa reviewer — Out
  of scope v1: capability P2, cần duyệt thêm về dùng dữ liệu học.
