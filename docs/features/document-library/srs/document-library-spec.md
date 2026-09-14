---
type: srs
feature: document-library
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/document-library/brainstorms/versioned-knowledge-source-library.md
  - docs/features/document-library/document-library-urd.md
  - docs/_reverse/knowledge-and-question-bank/reverse-spec.md
---

# document-library — Software Requirements Specification

## 1. Scope

SRS này cover thư viện tài liệu nguồn của một tổ chức phục vụ sinh kiến
thức/câu hỏi: thêm nguồn qua cổng `document-intake` kèm metadata, quản lý
phiên bản có trạng thái xử lý và duyệt, giữ provenance giữa file gốc ↔
text đã xác nhận ↔ topic ↔ nội dung phát sinh, chọn nguồn đã duyệt cho
module sinh nội dung và đánh dấu "cần rà soát" khi nguồn bị thay thế.
Feature ở mức `Should` — KHÔNG nằm trong cam kết v1 (slice mở rộng của
Document AI). KHÔNG cover: tự đồng bộ từ nguồn ngoài và tự ghi đè bản đã
duyệt (PRD "Chưa làm"), cổng tiếp nhận file (`document-intake`), trích
xuất/xác nhận text (`document-review`), sinh và quản lý câu hỏi
(`ai-question-generation`, `question-bank`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Content editor (HR phụ trách nội dung) | người | Thêm/cập nhật tài liệu nguồn, gắn topic, rà soát nội dung phát sinh | Có |
| Reviewer/owner nội dung | người | Duyệt/từ chối phiên bản kèm ghi chú | Có |
| HR/interviewer (consumer) | người | Chọn nguồn đã duyệt khi sinh nội dung | Có |
| Admin | người | Kiểm soát quyền, ngừng dùng, truy vết | Có |
| `document-intake` | hệ thống | Cổng duy nhất đưa file vào, tạo job xử lý | Có (dependency) |
| `document-review` | hệ thống | Cung cấp text đã xác nhận cho phiên bản | Có (dependency) |
| `ai-question-generation` / `question-bank` | hệ thống | Đọc nguồn đã duyệt; ghi nhận nội dung phát sinh | Có (consumer) |
| `org-governance` | hệ thống | Quyền theo organization/role/data-scope | Có (dependency) |
| `contextual-notifications` | hệ thống | Nhắc chờ duyệt, báo "cần rà soát" | Có (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-document-library-001 | Thêm tài liệu nguồn | Khi content editor thêm tài liệu nguồn, hệ thống phải yêu cầu metadata bắt buộc (tên, loại, chủ sở hữu nội dung, mô tả) và đưa file qua cổng `document-intake` với ngữ cảnh thư viện nguồn | P0 | demo | PRD Mục 7.30 (upload, metadata); BR-document-intake-009 |
| FR-document-library-002 | Tạo phiên bản tài liệu | Khi một file được nhận cho tài liệu nguồn, hệ thống phải tạo phiên bản mới có số thứ tự kế tiếp ở trạng thái "đang xử lý", gắn bản ghi file intake; bản hiệu lực hiện tại không bị ảnh hưởng | P0 | test | PRD Mục 7.30 (version); brainstorm 5.1/5.2 |
| FR-document-library-003 | Trạng thái xử lý phiên bản | Hệ thống phải hiển thị trạng thái của từng phiên bản: đang xử lý / chờ duyệt / đã duyệt / đã thay thế / từ chối / thất bại / ngừng dùng, và luôn chỉ rõ phiên bản nào đang hiệu lực | P0 | demo | PRD Mục 7.30 (trạng thái xử lý) |
| FR-document-library-004 | Gắn text đã xác nhận | Khi text trích xuất của phiên bản được xác nhận ở `document-review`, hệ thống phải liên kết kết quả đó vào phiên bản và chuyển phiên bản sang "chờ duyệt"; phiên bản chưa có text đã xác nhận không được đưa lên duyệt | P0 | test | PRD Mục 7.30, dependency 18; PRD Mục 12 |
| FR-document-library-005 | Duyệt/từ chối phiên bản | Khi reviewer quyết định trên phiên bản "chờ duyệt", hệ thống phải ghi nhận duyệt hoặc từ chối kèm ghi chú bắt buộc, người duyệt và thời điểm | P0 | test | PRD Mục 12; Observed: reverse spec FR-KB-02 approve route |
| FR-document-library-006 | Một phiên bản hiệu lực | Khi phiên bản mới được duyệt, hệ thống phải chuyển phiên bản hiệu lực trước đó (nếu có) sang "đã thay thế" và đặt bản mới làm bản hiệu lực duy nhất — không xóa bản cũ | P0 | test | PRD Mục 7.30; brainstorm D2 |
| FR-document-library-007 | Cảnh báo duyệt bản không mới nhất | Khi reviewer duyệt một phiên bản "chờ duyệt" không phải mới nhất của tài liệu, hệ thống phải cảnh báo và yêu cầu xác nhận trước khi ghi nhận | P1 | test | brainstorm D7, 6.4 |
| FR-document-library-008 | Cảnh báo trùng nội dung | Khi file tải lên trùng nội dung phiên bản hiệu lực, hệ thống phải cảnh báo và hỏi xác nhận có tạo phiên bản mới | P1 | test | brainstorm D3, 6.5 |
| FR-document-library-009 | Chọn nguồn đã duyệt | Khi module sinh nội dung đọc danh sách nguồn, hệ thống phải chỉ trả tài liệu có phiên bản "đã duyệt"; khi được chọn, hệ thống phải khóa tham chiếu vào đúng phiên bản hiệu lực tại thời điểm chọn | P0 | test | PRD Mục 7.30 (chọn nguồn), R-11 |
| FR-document-library-010 | Provenance nội dung phát sinh | Hệ thống phải ghi nhận mỗi nội dung phát sinh (câu hỏi/nội dung khác) trỏ tới đúng (tài liệu, phiên bản) đã dùng, và cho truy ngược từ phiên bản ra danh sách nội dung phát sinh của nó | P0 | test | PRD Mục 7.30 (quan hệ nội dung phát sinh); Observed: reverse spec FR-KB-04 |
| FR-document-library-011 | Đánh dấu "cần rà soát" | Khi một phiên bản bị thay thế, hệ thống phải đánh dấu "cần rà soát" trên mọi nội dung phát sinh trỏ tới phiên bản đó và thông báo owner nội dung; hệ thống không tự chuyển hay vô hiệu nội dung | P0 | test | PRD Mục 7.30 (rủi ro), R-11; đáp án đề xuất OQ-9 PRD |
| FR-document-library-012 | Ghi nhận rà soát | Khi owner rà soát một nội dung "cần rà soát", hệ thống phải ghi nhận người rà soát, thời điểm và quyết định (giữ/đề xuất tạo lại) rồi tắt cờ | P1 | test | brainstorm 5.2; URD Journey 4 |
| FR-document-library-013 | Topic trên phiên bản | Hệ thống phải cho gắn/bớt topic trên phiên bản đã duyệt, và hỗ trợ merge/split topic mà không mất truy nguyên về phiên bản nguồn | P1 | test | Observed: reverse spec FR-KB-03 + business rule 3; URD UN-007 |
| FR-document-library-014 | Tìm kiếm và lọc | Hệ thống phải cho tìm theo tên và lọc theo loại, trạng thái, chủ sở hữu, topic; mặc định ưu tiên hiển thị phiên bản hiệu lực | P0 | demo | PRD Mục 7.30 (tìm kiếm) |
| FR-document-library-015 | Ngừng dùng tài liệu | Khi người có quyền đánh dấu "ngừng dùng" kèm lý do, hệ thống phải ẩn tài liệu khỏi chọn nguồn, giữ nguyên bản ghi và nội dung phát sinh liên quan; cho khôi phục | P1 | test | brainstorm D8; URD UN-008 |
| FR-document-library-016 | Chặn xóa có nội dung phát sinh | Khi tài liệu đã có nội dung phát sinh tham chiếu, hệ thống phải chặn xóa hẳn và hướng dẫn "ngừng dùng"; tài liệu chưa có nội dung phát sinh cho xóa theo quyền | P1 | test | brainstorm D8; rủi ro mất provenance |
| FR-document-library-017 | Xem lịch sử và diff phiên bản | Hệ thống phải cho xem toàn bộ phiên bản của tài liệu và so sánh text đã trích xuất giữa hai phiên bản để hỗ trợ quyết định duyệt | P1 | demo | brainstorm P1 |
| FR-document-library-018 | Audit đầy đủ | Hệ thống phải ghi audit cho: thêm tài liệu, tải phiên bản, duyệt/từ chối, thay thế, gắn/merge/split topic, chọn nguồn, đánh dấu rà soát, ngừng/khôi phục | P0 | kiểm tra | PRD Mục 9 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-document-library-001 | integrity | Không nội dung nào được sinh từ phiên bản chưa "đã duyệt"; mọi nội dung phát sinh có tham chiếu phiên bản đầy đủ | P0 | 0 nội dung phát sinh thiếu tham chiếu phiên bản đã duyệt trong kiểm tra mẫu |
| NFR-document-library-002 | integrity | Phiên bản đã được tham chiếu bởi nội dung phát sinh không bị xóa hẳn hay ghi đè | P0 | 0 phiên bản có nội dung phát sinh bị mất bản ghi |
| NFR-document-library-003 | security | Truy cập thư viện theo organization/role/data-scope; quyền xem/tải/duyệt/ngừng tách theo vai trò | P0 | 0 incident vượt scope (bám M-GR-01; RLS như reverse spec FR-KB-05) |
| NFR-document-library-004 | auditability | Mọi quyết định duyệt/thay thế/rà soát truy vết được ai + khi nào + trước/sau | P0 | 100% sự kiện trên mẫu tài liệu kiểm tra truy vết được |
| NFR-document-library-005 | performance | Tìm kiếm/lọc trong thư viện của tổ chức | P1 | 95% lượt tìm trả kết quả trong ≤3 giây ở quy mô ≤5.000 tài liệu (đề xuất — OQ-4) |
| NFR-document-library-006 | usability | Mọi thông báo/trạng thái tiếng Việt; luôn hiển thị rõ phiên bản hiệu lực | P0 | Kiểm tra mẫu: người dùng xác định được bản hiệu lực trong ≤5 giây |
| NFR-document-library-007 | data-retention | File gốc, phiên bản cũ và nội dung phát sinh giữ theo chính sách retention tài liệu | P1 | Thời gian giữ chờ OQ-3 (OQ-6 PRD, OQ-KB-02) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-document-library-001 | Chỉ phiên bản "đã duyệt" được dùng làm nguồn sinh nội dung — không ngoại lệ | Chọn nguồn hoặc sinh nội dung | FR-document-library-009 | PRD Mục 12 (human-in-the-loop), R-11 |
| BR-document-library-002 | Mỗi tài liệu chỉ có một phiên bản hiệu lực; duyệt bản mới tự chuyển bản cũ sang "đã thay thế" | Duyệt phiên bản | FR-document-library-006 | brainstorm 5.2 |
| BR-document-library-003 | Phiên bản chỉ được đưa lên duyệt khi đã có text được xác nhận ở document-review | Chuyển "chờ duyệt" | FR-document-library-004 | PRD Mục 12; dependency 18 |
| BR-document-library-004 | Khi nguồn bị thay thế, nội dung phát sinh chỉ bị đánh dấu "cần rà soát" — không tự chuyển, không tự vô hiệu | Phiên bản chuyển "đã thay thế" | FR-document-library-011 | R-11; đáp án đề xuất OQ-9 PRD |
| BR-document-library-005 | Merge/split topic không được mất truy nguyên về phiên bản nguồn | Thao tác merge/split topic | FR-document-library-013 | Observed: reverse spec `knowledge-and-question-bank` business rule 3 |
| BR-document-library-006 | Tài liệu có nội dung phát sinh không được xóa hẳn — chỉ "ngừng dùng" | Yêu cầu xóa tài liệu | FR-document-library-016 | brainstorm D8 |
| BR-document-library-007 | File tài liệu nguồn bắt buộc qua cổng document-intake — không đường upload riêng | Thêm tài liệu/tải phiên bản | FR-document-library-001 | BR-document-intake-009 |
| BR-document-library-008 | Từ chối duyệt bắt buộc ghi chú lý do | Reviewer từ chối | FR-document-library-005 | brainstorm 7.1 |
| BR-document-library-009 | Nội dung phát sinh khóa tham chiếu phiên bản tại thời điểm sinh — bất biến sau đó | Sinh nội dung từ nguồn | FR-document-library-010 | PRD Mục 7.30; R-11 |
| BR-document-library-010 | Ngừng dùng tài liệu ẩn khỏi chọn nguồn nhưng không vô hiệu nội dung phát sinh đã có | Ngừng dùng | FR-document-library-015 | brainstorm 5.2, D8 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-document-library-001 | Thiếu metadata bắt buộc | Thêm tài liệu thiếu tên/loại/chủ sở hữu | minor | FR-document-library-001 | "Vui lòng điền đủ tên, loại và chủ sở hữu nội dung trước khi thêm tài liệu" | Bổ sung rồi lưu lại |
| E-document-library-002 | File bị intake từ chối | File sai định dạng/vượt kích thước/thiếu quyền | minor | FR-document-library-001 | Theo wording của document-intake | Sửa file/ngữ cảnh theo hướng dẫn intake |
| E-document-library-003 | Chọn nguồn chưa duyệt | Chọn tài liệu không có phiên bản "đã duyệt" | minor | FR-document-library-009 | "Tài liệu này chưa có phiên bản đã duyệt — chỉ phiên bản đã duyệt mới dùng làm nguồn" | Chọn tài liệu khác hoặc chờ duyệt |
| E-document-library-004 | Từ chối không ghi chú | Reviewer từ chối bỏ trống ghi chú | minor | FR-document-library-005 | "Vui lòng ghi rõ lý do từ chối để người đăng biết cần sửa gì" | Nhập ghi chú rồi xác nhận |
| E-document-library-005 | Duyệt phiên bản không mới nhất | Duyệt bản "chờ duyệt" khi đã có bản mới hơn chờ | major | FR-document-library-007 | "Đã có phiên bản {n} mới hơn đang chờ duyệt — xác nhận duyệt phiên bản {m} này?" | Xác nhận hoặc chuyển duyệt bản mới nhất |
| E-document-library-006 | File trùng nội dung | Tải file giống bản hiệu lực | minor | FR-document-library-008 | "File tải lên giống nội dung phiên bản {n} đang dùng — xác nhận tạo phiên bản mới?" | Xác nhận tạo hoặc hủy |
| E-document-library-007 | Xóa tài liệu có nội dung phát sinh | Xóa tài liệu đang được tham chiếu | major | FR-document-library-016 | "Tài liệu đã được dùng để sinh nội dung — chỉ có thể ngừng dùng" | Chuyển sang ngừng dùng |
| E-document-library-008 | Phiên bản xử lý thất bại | Job xử lý file lỗi hết retry | major | FR-document-library-003 | Phiên bản "thất-bại" + lý do | Xử lý lại hoặc tải file khác |
| E-document-library-009 | Ngừng dùng khi đang có phiên bản chờ duyệt | Ngừng dùng tài liệu có bản "chờ duyệt" | minor | FR-document-library-015 | Cảnh báo phiên bản chờ duyệt sẽ không thể duyệt | Xác nhận hoặc xử lý phiên bản trước |
| E-document-library-010 | Merge/split topic có nội dung phát sinh gắn | Gộp/tách topic đang được nội dung tham chiếu | major | FR-document-library-013 | Cảnh báo số nội dung bị ảnh hưởng, yêu cầu xác nhận | Xác nhận; provenance phiên bản vẫn giữ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-document-library-01 | Nội dung sinh ra trỏ đúng phiên bản nguồn đã duyệt | Tỷ lệ nội dung phát sinh có tham chiếu (tài liệu, phiên bản đã duyệt) | 100% (PRD Mục 7.30) |
| SC-document-library-02 | Không nội dung nào âm thầm chạy trên bản cũ | Tỷ lệ nội dung phát sinh của phiên bản đã thay thế mang cờ "cần rà soát" trong ≤1 ngày | 100% |
| SC-document-library-03 | Phiên bản chờ duyệt có quyết định kịp thời | Thời gian từ "chờ-duyệt" đến quyết định | ≤3 ngày làm việc (đề xuất — OQ-5) |
| SC-document-library-04 | Mọi phiên bản duyệt đều có kiểm chứng con người | Tỷ lệ phiên bản "đã duyệt" có reviewer + ghi nhận | 100% |
| SC-document-library-05 | Provenance hai chiều nguyên vẹn | Tỷ lệ nội dung phát sinh truy ngược được về tài liệu + phiên bản + người duyệt | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **SOURCE_DOCUMENT** — tài liệu nguồn: tên, loại, chủ sở hữu, mô tả,
  trạng thái hoạt động/ngừng dùng, phiên bản hiệu lực.
- **SOURCE_VERSION** — một phiên bản của tài liệu: số phiên bản, file
  intake, kết quả trích xuất đã xác nhận, trạng thái vòng đời, người duyệt,
  ghi chú quyết định.
- **DOCUMENT_TOPIC** — topic gắn trên một phiên bản: tên, nguồn (gợi ý/tự
  thêm), trạng thái, vết merge/split.
- **DERIVED_CONTENT** — tham chiếu nội dung phát sinh: loại nội dung, mã
  tham chiếu ngoài (câu hỏi), phiên bản nguồn đã dùng, cờ "cần rà soát",
  vết rà soát.
- **LIBRARY_AUDIT_EVENT** — sự kiện kiểm toán của thư viện.
- **INTAKE_DOCUMENT**, **EXTRACTION_RESULT**, **USERS** — tham chiếu ngoài
  (`document-intake`, `document-review`, `org-governance`).

Chi tiết quan hệ + thuộc tính ở `srs/document-library-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- **Flow 1:** Thêm tài liệu → file qua intake → xử lý + text xác nhận →
  "chờ duyệt" → reviewer duyệt → "đã duyệt" hiệu lực.
- **Flow 2:** Tải file mới → phiên bản kế tiếp → chờ duyệt → duyệt → bản
  cũ "đã thay thế" + nội dung phát sinh "cần rà soát".
- **Flow 3:** Chọn nguồn trong ai-question-generation → chỉ bản đã duyệt
  → khóa tham chiếu → sinh nội dung ghi provenance.
- **Flow 4:** Rà soát nội dung phát sinh → xem danh sách cần rà soát →
  giữ/đề xuất tạo lại → ghi nhận.
- **Flow 5:** Topic: gắn trên bản duyệt → merge/split giữ trace → dùng
  lọc khi chọn nguồn.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- **library-list** — danh sách tài liệu nguồn + lọc loại/trạng thái/chủ
  sở hữu/topic; hiện bản hiệu lực và cờ "cần rà soát".
- **source-detail** — chi tiết tài liệu: metadata, danh sách phiên bản,
  nội dung phát sinh, hành động tải bản mới/ngừng dùng.
- **version-review** — màn duyệt phiên bản: file gốc + text đã xác nhận +
  topic + diff với bản hiệu lực + duyệt/từ chối.
- **version-history** — lịch sử phiên bản kèm trạng thái và người duyệt.
- **derived-content-list** — nội dung phát sinh của một phiên bản/tài
  liệu, cờ "cần rà soát" và hành động rà soát.
- **source-picker** — màn chọn nguồn cho module sinh nội dung (chỉ bản đã
  duyệt).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Chỉ phiên bản đã duyệt được làm nguồn; duyệt là quyết định của con người | PRD Mục 12, 7.30 — Product owner/Knowledge owner |
| Truy cập theo organization/role/data-scope (RLS thư viện) | PRD Mục 9; Observed: reverse spec FR-KB-05 — Security owner |
| File vào qua cổng document-intake duy nhất | BR-document-intake-009 — Document AI owner |
| Text nguồn phải đã xác nhận ở document-review | PRD Mục 7.30 dependency, Mục 12 — Document AI owner |
| Không tự đồng bộ nguồn ngoài, không tự ghi đè bản đã duyệt | PRD Mục 7.30 "Chưa làm" — Product owner |
| Audit cho thêm/duyệt/thay thế/ngừng/rà soát | PRD Mục 9 — Security owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Cổng tiếp nhận file + job + ngữ cảnh | `document-intake` | Không đưa được file vào thư viện |
| Text trích xuất đã xác nhận | `document-review` | Phiên bản không thể lên "chờ duyệt" |
| Quyền và vai trò reviewer duyệt phiên bản | `org-governance` | Luồng duyệt (OQ-1) |
| Module sinh nội dung ghi provenance | `ai-question-generation`, `question-bank` | Tham chiếu nội dung phát sinh trống |
| Thông báo chờ duyệt/cần rà soát | `contextual-notifications` | Owner không được báo |
| Chính sách retention tài liệu | Product + DPO (OQ-6 PRD) | Vòng đời file gốc/bản cũ |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Reviewer duyệt = owner nội dung/HR lead được gán quyền | FR-005/006 không có ai vận hành hàng chờ duyệt |
| Nội dung phát sinh bản cũ chỉ đánh dấu "cần rà soát" | FR-011/BR-004 phải đổi cơ chế (OQ-9 PRD) |
| Một phiên bản hiệu lực duy nhất mỗi tài liệu | FR-006/009 phải hỗ trợ đa bản hiệu lực |
| 20 topic/phiên bản, 50 kết quả/trang, thư viện ≤5.000 tài liệu | FR-013/014, NFR-005 đổi ngưỡng |
| Topic merge/split giữ trace là yêu cầu có sẵn từ nguồn | FR-013 mất căn cứ triển khai |

## 12. Open Questions

- [x] OQ-1: Approval authority cho phiên bản nguồn — Resolved (đề
  xuất): owner nội dung/HR lead được gán quyền qua org-governance — chờ
  Head of HR (OQ-KB-01, GAP-KB-02).
- [x] OQ-2: Hành vi khi tài liệu đổi (OQ-9 PRD) — Resolved (đề xuất):
  bản mới qua duyệt; nội dung phát sinh chỉ đánh dấu "cần rà soát",
  không tự chuyển/vô hiệu — chờ Technical/Operations owner.
- [x] OQ-3: Retention/cascade file gốc + phiên bản + nội dung phát sinh
  — Resolved (đề xuất): theo retention tài liệu chung; bản có nội dung
  phát sinh không xóa hẳn — chờ DPO/legal (OQ-KB-02, OQ-6 PRD).
- [x] OQ-4: Giới hạn topic/quy mô thư viện — Resolved (đề xuất): 20
  topic/phiên bản, 50 kết quả/trang, ≤5.000 tài liệu — chờ Document AI
  owner.
- [x] OQ-5: SLA duyệt phiên bản + nhắc rà soát — Resolved (đề xuất): ≤3
  ngày làm việc; nhắc sau 7 ngày — chờ Operations owner.
- [x] OQ-6: Nội dung "cần rà soát" có tự vô hiệu — Resolved (đề xuất):
  không; chỉ cảnh báo (human-in-the-loop) — chờ Knowledge owner.
- [~] OQ-7: Đồng bộ từ nguồn ngoài — Out of scope v1 (PRD "Chưa làm").
