---
type: srs
feature: question-bank
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/question-bank/brainstorms/question-bank-governance.md
  - docs/features/question-bank/question-bank-urd.md
---

# question-bank — Software Requirements Specification

## 1. Scope

SRS này cover ngân hàng câu hỏi tập trung của một tổ chức: tạo/xem/sửa/xóa
câu hỏi có phân loại theo kỹ năng/topic/trình độ/loại câu/nguồn, luồng gửi
duyệt → reviewer quyết định, phiên bản câu hỏi, provenance, ngừng dùng, bulk
import theo file mẫu, cảnh báo trùng và bảo vệ đáp án theo quyền. KHÔNG cover:
sinh câu hỏi bằng AI (`ai-question-generation` — feature này chỉ tiếp nhận câu
đã duyệt từ đó), soạn cấu trúc/phát hành bài đánh giá (`assessment-authoring`),
chấm và thống kê chất lượng câu (`assessment-grading`), định nghĩa khung kỹ
năng (`talent-framework`), và marketplace chia sẻ câu hỏi giữa các tổ chức.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Soạn, phân loại, tìm và tái sử dụng câu hỏi đã duyệt; import hàng loạt | Có |
| Interviewer | người | Lấy câu đã duyệt đúng kỹ năng cần đánh giá; đề xuất câu mới | Có |
| Reviewer (business owner mảng/HR lead) | người | Duyệt hoặc yêu cầu chỉnh câu hỏi chờ review, có ghi nhận | Có |
| Admin | người | Kiểm soát taxonomy tham chiếu, quyền xem đáp án, truy vết thay đổi | Có |
| Người làm bài (ứng viên/nhân viên) | người | Làm bài từ câu đã duyệt, không thấy đáp án | Không (không có giao diện ngân hàng; chỉ chịu ràng buộc bảo vệ đáp án) |
| `ai-question-generation` | hệ thống (feature khác) | Đẩy câu AI đã được duyệt vào kho qua cùng luồng review | Không (nguồn câu hỏi, không thao tác trong feature này) |
| `assessment-authoring` | hệ thống (feature khác) | Đọc danh sách câu "Đã duyệt" để soạn bài | Không (consumer của dữ liệu feature này) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-question-bank-001 | Tạo câu hỏi thủ công | Khi HR/interviewer tạo câu hỏi, hệ thống phải ghi nhận nội dung, loại câu, đáp án (hoặc hướng dẫn chấm với câu tự luận), giải thích và phân loại (kỹ năng/topic/trình độ), đặt trạng thái "Bản nháp" | P0 | demo | PRD Mục 7.19; URD UN-002 |
| FR-question-bank-002 | Sửa và xem câu nháp | Trong khi câu ở "Bản nháp", hệ thống phải cho người tạo (và vai trò được cấp) xem, sửa tự do và lưu lại mà không đổi trạng thái | P0 | demo | brainstorm Mục 5.1; URD UN-002 |
| FR-question-bank-003 | Gửi duyệt câu hỏi | Khi người tạo bấm "Gửi duyệt", hệ thống phải kiểm tra đủ trường bắt buộc theo loại câu rồi chuyển câu sang "Chờ review" và đưa vào hàng chờ của reviewer | P0 | test | PRD Mục 7.19 (review/status); URD UN-002 |
| FR-question-bank-004 | Hàng chờ và quyết định review | Khi reviewer mở hàng chờ, hệ thống phải liệt kê câu "Chờ review" kèm nội dung, đáp án, phân loại, nguồn và cảnh báo trùng (nếu có); khi reviewer quyết định, hệ thống phải ghi nhận "Duyệt" hoặc "Yêu cầu chỉnh" kèm ghi chú, người duyệt và thời điểm | P0 | test | PRD Mục 7.19; URD UN-004 |
| FR-question-bank-005 | Chỉ câu đã duyệt được dùng | Khi `assessment-authoring` đọc danh sách chọn câu, hệ thống phải chỉ trả câu ở trạng thái "Đã duyệt" | P0 | test | PRD Mục 7.19, Mục 12 (human-in-the-loop); URD UN-001 |
| FR-question-bank-006 | Tìm kiếm và lọc | Hệ thống phải cho tìm theo từ khóa trong nội dung câu và lọc theo kỹ năng, topic, trình độ, loại câu, trạng thái review và nguồn; tìm kiếm của người không có quyền đáp án không quét vùng đáp án/giải thích | P0 | test | PRD Mục 7.19 (search/filter); brainstorm Mục 6.5 |
| FR-question-bank-007 | Sửa câu đã duyệt theo mức độ | Khi câu "Đã duyệt" bị sửa lớn (nội dung, đáp án hoặc trình độ), hệ thống phải tạo phiên bản mới ở "Chờ review" và giữ phiên bản cũ "Đã duyệt" tới khi bản mới được duyệt; sửa nhỏ giữ nguyên trạng thái | P0 | test | brainstorm Mục 5.1 (D3); URD UN-005; ngưỡng "sửa lớn" chờ OQ-2 |
| FR-question-bank-008 | Ngừng dùng câu hỏi | Khi người có quyền đánh dấu "Ngừng dùng" kèm lý do, hệ thống phải ẩn câu khỏi mọi danh sách chọn, giữ nguyên snapshot trong các bài đã phát hành và cho phép khôi phục (về "Chờ review") | P0 | test | PRD Mục 7.19 (rủi ro câu lỗi); URD UN-008 |
| FR-question-bank-009 | Xóa câu chưa từng dùng | Nếu câu chưa nằm trong bài đánh giá nào, thì hệ thống phải cho xóa hẳn và giữ vết audit (ai xóa, nội dung cuối, thời điểm); nếu câu đã dùng trong bài đã phát hành, hệ thống phải chặn xóa và hướng dẫn "Ngừng dùng" | P0 | test | brainstorm Mục 6.1 (D6); URD UN-008 |
| FR-question-bank-010 | Bulk import theo file mẫu | Khi HR tải file theo mẫu công bố, hệ thống phải kiểm tra từng dòng độc lập (đủ trường, loại câu hợp lệ, phân loại tồn tại, cảnh báo trùng), tạo câu hợp lệ ở "Bản nháp" mang nguồn "import" và báo lỗi theo dòng cho dòng không hợp lệ | P0 | test | PRD Mục 7.19; reverse spec FR-KB-01; URD UN-003 |
| FR-question-bank-011 | Cảnh báo trùng | Khi tạo hoặc import câu, hệ thống phải phát hiện câu gần giống đã tồn tại và cảnh báo để người tạo xem trước khi quyết định tạo mới | P1 | test | brainstorm Mục 6.1 (D1); URD UN-007; cơ chế/ngưỡng chờ OQ-3 |
| FR-question-bank-012 | Bảo vệ đáp án theo quyền | Hệ thống phải chỉ hiển thị đáp án và giải thích cho vai trò được cấp, trên mọi surface (xem câu, tìm kiếm, export, preview); người làm bài không bao giờ thấy đáp án | P0 | test | PRD Mục 7.19 (rủi ro), Mục 9, Mục 12; URD UN-006 |
| FR-question-bank-013 | Provenance mỗi câu | Hệ thống phải giữ trên mỗi câu: nguồn (soạn thủ công / import / AI sinh kèm tài liệu nguồn), người tạo, người duyệt và phiên bản; câu sinh từ tài liệu phải trỏ đúng phiên bản nguồn đã duyệt | P0 | test | PRD Mục 7.19 (source reference), R-11; reverse spec FR-KB-04 |
| FR-question-bank-014 | Lịch sử phiên bản | Hệ thống phải giữ toàn bộ phiên bản đã duyệt của câu và cho xem lại từng phiên bản (bất biến sau khi bài đã dùng phiên bản đó) | P0 | kiểm tra | PRD Mục 7.19 (version); brainstorm Mục 4 |
| FR-question-bank-015 | Thống kê tái sử dụng | Hệ thống phải cho xem mỗi câu đang nằm trong bao nhiêu bài và lần dùng gần nhất, để phát hiện câu "chết" hoặc bị lạm dụng | P1 | demo | brainstorm Mục 4 (P1); URD UN-009 |
| FR-question-bank-016 | Đánh dấu yêu thích | Hệ thống phải cho mỗi người đánh dấu câu yêu thích/thường dùng của riêng mình và lọc theo đánh dấu đó | P2 | demo | brainstorm Mục 4 (P1→P2); reverse ERD FAVOURITE_QUESTIONS |
| FR-question-bank-017 | Cảnh báo câu trong bài nháp | Khi câu đang nằm trong bài nháp bị "Ngừng dùng" hoặc có phiên bản mới được duyệt, hệ thống phải hiện cảnh báo trên bài nháp và chặn phát hành nếu câu đã ngừng dùng | P0 | test | brainstorm Mục 6.1 (D4); URD Journey 5 |
| FR-question-bank-018 | Cảnh báo phân loại mất hiệu lực | Khi kỹ năng/topic mà câu đang gán bị gỡ khỏi taxonomy, hệ thống phải giữ nguyên câu và hiện cảnh báo "phân loại không còn hợp lệ" để người dùng gán lại | P1 | demo | brainstorm Mục 6.5; URD Mục 6 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-question-bank-001 | security | Đáp án/giải thích là dữ liệu hạn chế: deny-by-default cho mọi vai trò chưa được cấp, gồm cả kết quả tìm kiếm và export | P0 | 0 sự cố lộ đáp án cho người không có quyền được xác nhận (guardrail bám M-GR-01) |
| NFR-question-bank-002 | auditability | Mọi thay đổi trạng thái review, đáp án, phân loại và hành động ngừng dùng/xóa phải có vết audit (ai, khi nào, trước/sau) | P0 | Truy vết được 100% sự kiện trên mẫu câu kiểm tra bất kỳ |
| NFR-question-bank-003 | performance | Tìm kiếm/lọc trong kho câu hỏi của tổ chức | P1 | 95% lượt tìm trả kết quả trong ≤3 giây ở quy mô kho ≤20.000 câu [NEEDS CLARIFICATION: quy mô kho mục tiêu — xem OQ-7] |
| NFR-question-bank-004 | performance | Job import file không chặn thao tác khác của người dùng và báo kết quả theo dòng | P1 | File 500 dòng được xử lý và báo kết quả trong ≤5 phút (giá trị đề xuất — xem OQ-7) |
| NFR-question-bank-005 | usability | Toàn bộ giao diện và thông báo tiếng Việt; nội dung câu hỏi hỗ trợ đầy đủ dấu và ký tự đặc biệt tiếng Việt | P0 | Kiểm tra mẫu câu tiếng Việt có dấu/ký tự đặc biệt lưu và hiển thị đúng |
| NFR-question-bank-006 | data-retention | Câu ngừng dùng/xóa vẫn truy vết được phục vụ audit và bài cũ | P1 | Thời gian giữ theo quyết định retention — chờ OQ-6 (liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-question-bank-001 | Chỉ câu "Đã duyệt" mới được đưa vào bài đánh giá — không có ngoại lệ, kể cả câu import hay câu AI | Khi chọn câu vào bài hoặc phát hành bài | FR-question-bank-005 | PRD Mục 12 (human-in-the-loop); brainstorm Mục 4 |
| BR-question-bank-002 | Câu đã nằm trong bài đã phát hành không được xóa hẳn — chỉ được "Ngừng dùng" | Khi người dùng yêu cầu xóa câu | FR-question-bank-008, FR-question-bank-009 | brainstorm Mục 6.1 (D6) |
| BR-question-bank-003 | Sửa lớn (nội dung, đáp án hoặc trình độ) buộc tạo phiên bản mới qua review; sửa nhỏ giữ trạng thái | Khi lưu sửa trên câu "Đã duyệt" | FR-question-bank-007 | brainstorm Mục 5.1; ngưỡng chờ OQ-2 |
| BR-question-bank-004 | Import không bypass kiểm duyệt — mọi câu import vào "Bản nháp" và qua review như câu soạn tay | Khi import tạo câu | FR-question-bank-010 | brainstorm Mục 5.3 |
| BR-question-bank-005 | Đáp án/giải thích chỉ hiển thị cho vai trò được cấp trên mọi surface; người làm bài không bao giờ thấy | Khi render/search/export dữ liệu câu | FR-question-bank-012 | PRD Mục 9, Mục 12 |
| BR-question-bank-006 | Câu tự luận bắt buộc "hướng dẫn chấm" thay cho đáp án cố định | Khi lưu/gửi duyệt câu loại tự luận | FR-question-bank-001, FR-question-bank-003 | brainstorm Mục 6.5; phục vụ `assessment-grading` |
| BR-question-bank-007 | Câu trắc nghiệm một đáp án có đúng 1 đáp án đúng; nhiều đáp án có ≥1 đáp án đúng; lựa chọn 2–10 | Khi lưu/gửi duyệt câu trắc nghiệm | FR-question-bank-001, FR-question-bank-003 | brainstorm Mục 7.1 |
| BR-question-bank-008 | Reviewer đang xem câu mà câu vừa bị sửa → hệ thống phải kiểm tra phiên bản và cảnh báo trước khi ghi nhận quyết định | Khi reviewer bấm duyệt trên bản đã cũ | FR-question-bank-004 | brainstorm Mục 6.4; URD Mục 6 |
| BR-question-bank-009 | Phân loại câu chỉ chọn từ taxonomy chung của tổ chức — không nhập kỹ năng/trình độ tự do | Khi gán kỹ năng/trình độ/topic | FR-question-bank-001 | brainstorm Mục 9 (rủi ro taxonomy phân tán); OQ-1 (liên quan OQ-11 PRD) |
| BR-question-bank-010 | Phiên bản câu đã được bài phát hành tham chiếu là bất biến | Khi có yêu cầu sửa/xóa phiên bản đã dùng | FR-question-bank-014 | brainstorm Mục 8 (assumption snapshot); PRD Mục 7.22 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-question-bank-001 | Thiếu trường bắt buộc khi gửi duyệt | "Gửi duyệt" trên câu thiếu trường bắt buộc của loại câu | minor | FR-question-bank-003 | Form hiện lỗi tại từng field + "Vui lòng điền đủ thông tin bắt buộc trước khi gửi duyệt: {danh sách field}" | Người tạo bổ sung rồi gửi lại |
| E-question-bank-002 | Câu trắc nghiệm thiếu đáp án đúng | Lưu/gửi duyệt câu trắc nghiệm chưa đánh dấu đáp án đúng | minor | FR-question-bank-001 | Hiện "Câu trắc nghiệm cần ít nhất một đáp án đúng" | Người tạo đánh dấu đáp án |
| E-question-bank-003 | File import vượt giới hạn | File >5 MB hoặc >500 dòng hoặc sai định dạng mẫu | major | FR-question-bank-010 | Hiện "File vượt quá 5 MB hoặc 500 dòng — chia nhỏ file rồi tải lại" | Người dùng chia nhỏ/sửa file |
| E-question-bank-004 | Dòng import lỗi | Dòng thiếu trường, loại câu sai, phân loại không tồn tại | minor | FR-question-bank-010 | Báo kết quả "Dòng {n}: {lý do} — dòng này chưa được tạo" | Sửa dòng lỗi, tải lại phần lỗi |
| E-question-bank-005 | Xóa câu đã dùng trong bài phát hành | Xóa câu đang được tham chiếu | major | FR-question-bank-009 | Hiện "Câu hỏi đã được dùng trong bài đánh giá đã phát hành — chỉ có thể ngừng dùng" | Chuyển sang thao tác Ngừng dùng |
| E-question-bank-006 | Không có quyền xem đáp án | Người dùng/vai trò chưa được cấp cố xem đáp án/giải thích | major | FR-question-bank-012 | Phần đáp án ẩn; khi cố truy cập hiện "Bạn không có quyền xem đáp án của câu hỏi này" | Xin cấp quyền qua admin; sự kiện ghi audit |
| E-question-bank-007 | Phát hành bài có câu ngừng dùng | `assessment-authoring` phát hành bài chứa câu "Ngừng dùng" | major | FR-question-bank-017 | Hiện "Bài có {n} câu đã ngừng dùng — thay câu trước khi phát hành" | Người tạo bài thay câu |
| E-question-bank-008 | Sửa đồng thời một câu | Người thứ hai lưu trong khi câu vừa được người khác cập nhật | minor | FR-question-bank-002 | Hiện "Câu hỏi vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-question-bank-009 | Reviewer duyệt trên bản cũ | Câu bị sửa sau khi reviewer mở màn review | major | FR-question-bank-004 | Cảnh báo câu đã đổi trước khi ghi nhận quyết định | Reviewer xem lại bản mới rồi quyết định |
| E-question-bank-010 | Job import gián đoạn | Import file lớn bị ngắt giữa chừng | major | FR-question-bank-010 | Job hiện trạng thái lỗi + số dòng đã xử lý | Tải lại file, hệ thống chạy lại phần lỗi; dòng đã tạo không bị trùng |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-question-bank-01 | HR soạn bài từ kho thay vì nguồn ngoài | Tỷ lệ câu trong bài có tham chiếu ngân hàng / tổng câu | ≥80% sau 1 tháng pilot |
| SC-question-bank-02 | Mọi câu trong bài phát hành đã qua review | Tỷ lệ câu trong bài phát hành ở "Đã duyệt" + provenance đủ | 100% |
| SC-question-bank-03 | Hàng chờ review không treo | Thời gian từ "gửi duyệt" đến quyết định đầu tiên | ≤3 ngày làm việc (trung bình) |
| SC-question-bank-04 | Không lộ đáp án | Số incident lộ đáp án được xác nhận | 0 (guardrail, bám M-GR-01) |
| SC-question-bank-05 | Cảnh báo trùng được xử lý có ý thức | Tỷ lệ cảnh báo near-duplicate có hành động xác nhận (dùng câu cũ / xác nhận tạo mới) | ≥90% sau 1 tháng pilot |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Câu hỏi__ — nội dung, loại câu, trạng thái review, trình độ, giải thích,
  nguồn, người tạo, người duyệt, tổ chức sở hữu, phiên bản hiện hành.
- __Phiên bản câu hỏi__ — snapshot nội dung/đáp án/lựa chọn/hướng dẫn chấm của
  một phiên bản, bất biến sau khi được bài phát hành tham chiếu.
- __Lựa chọn của câu__ — các phương án trắc nghiệm và cờ đáp án đúng (dữ liệu
  hạn chế theo quyền).
- __Kỹ năng / Topic__ — taxonomy tham chiếu từ `talent-framework` (không sở
  hữu bởi feature này).
- __Quyết định review__ — câu/phiên bản được duyệt hay yêu cầu chỉnh, người
  duyệt, ghi chú, thời điểm.
- __Job import + dòng import__ — file nguồn, trạng thái job, kết quả từng dòng.
- __Câu yêu thích__ — đánh dấu theo từng người dùng.

Chi tiết quan hệ + thuộc tính ở `srs/question-bank-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Soạn câu → gửi duyệt → reviewer duyệt/yêu cầu chỉnh → "Đã duyệt".
- __Flow 2:__ Tìm/lọc và chọn câu "Đã duyệt" vào bài đánh giá.
- __Flow 3:__ Bulk import theo file mẫu → kết quả theo dòng.
- __Flow 4:__ Ngừng dùng câu → ẩn khỏi chọn, bài đã phát hành giữ snapshot.
- __Flow 5:__ Sửa lớn câu đã duyệt → phiên bản mới chờ review, bản cũ còn hiệu
  lực tới khi thay thế.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __question-list__ — danh sách câu + bộ lọc taxonomy/trạng thái/nguồn.
- __question-editor__ — soạn/sửa câu theo loại câu (đáp án ẩn theo quyền).
- __review-queue__ — hàng chờ câu "Chờ review" của reviewer.
- __question-review-detail__ — xem câu đầy đủ + cảnh báo trùng + duyệt/yêu cầu
  chỉnh.
- __import-upload__ — tải file mẫu, xem kết quả theo dòng.
- __question-detail-history__ — lịch sử phiên bản và provenance.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi câu hỏi thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Câu AI sinh phải qua review của con người trước khi vào kho | PRD Mục 12 (invariant human-in-the-loop) — Product owner |
| Audit cho action nhạy cảm (duyệt, đổi đáp án, ngừng dùng, xóa) | PRD Mục 9 — Security owner |
| Taxonomy kỹ năng/trình độ là tham chiếu, không định nghĩa trong feature | PRD Mục 7.32 (`talent-framework`) — Head of HR (OQ-11 PRD) |
| Phiên bản câu được bài phát hành tham chiếu là bất biến | PRD Mục 7.22 (snapshot bất biến) — Assessment owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Taxonomy kỹ năng/trình độ/topic | `talent-framework` / `org-governance` | Gán phân loại và lọc câu hỏi |
| Role/scope cho vai trò reviewer và quyền xem đáp án | `org-governance` | Luồng review và bảo vệ đáp án |
| Câu AI đã duyệt đổ vào kho | `ai-question-generation` | Nguồn câu "sinh bởi AI" (không chặn luồng soạn tay) |
| Điểm đọc danh sách "Đã duyệt" cho soạn bài | `assessment-authoring` | Tái sử dụng câu trong bài |
| File mẫu import được công bố | Owner nghiệp vụ (chờ OQ-5) | FR-question-bank-010 dùng được thực tế |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Reviewer là vai trò nghiệp vụ được gán quyền qua org-governance (không chỉ admin) | FR-question-bank-004 nghẽn — hàng chờ chỉ admin xử lý |
| Sửa lớn = đổi nội dung/đáp án/trình độ | FR-question-bank-007 quá nặng hoặc quá lỏng |
| Câu từ mọi nguồn (tay/import/AI) đi cùng một luồng review | Hai hàng chờ song song, khó kiểm soát |
| Giới hạn số (2.000 ký tự, 10 lựa chọn, 10 topic, 500 dòng/5 MB, 50 kết quả/trang) là chuẩn v1 | FR-question-bank-001/010 và NFR-question-bank-004 đổi ngưỡng |
| Người làm bài không có bất kỳ giao diện ngân hàng nào | NFR-question-bank-001 phải mở rộng surface bảo vệ |

## 12. Open Questions

- [ ] OQ-1: Ai là reviewer hợp lệ cho câu hỏi — admin, HR lead, hay business
  owner từng mảng kỹ năng? (liên quan OQ-11 PRD, OQ-KB-01 reverse spec)
- [ ] OQ-2: Ngưỡng "sửa lớn" buộc tạo phiên bản mới chờ review — chỉ đổi nội
  dung/đáp án/trình độ, hay cả đổi kỹ năng/topic?
- [ ] OQ-3: Cơ chế phát hiện trùng v1 — trùng tuyệt đối theo nội dung hay
  near-duplicate; ai chốt ngưỡng "gần giống"? (OQ-KB-03)
- [ ] OQ-4: Tài liệu nguồn có bản mới được duyệt thì câu hỏi trỏ tới bị đánh
  dấu "cần rà soát" tự động hay chỉ cảnh báo cho owner? (R-11, OQ-9 PRD)
- [ ] OQ-5: Định dạng file mẫu bulk import (cột bắt buộc) do ai công bố và
  version file mẫu quản lý thế nào?
- [ ] OQ-6: Retention cho câu hỏi đã ngừng dùng/xóa — giữ bao lâu cho audit
  và truy vết bài cũ? (OQ-KB-02, OQ-6 PRD)
- [ ] OQ-7: Các giới hạn và ngưỡng hiệu năng (2.000 ký tự, 10 lựa chọn, 500
  dòng/5 MB, 50 kết quả/trang, kho ≤20.000 câu, import ≤5 phút) có được owner
  chấp nhận làm chuẩn v1 không?
