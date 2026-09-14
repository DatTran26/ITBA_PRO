---
type: srs
feature: assessment-authoring
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/assessment-authoring/brainstorms/assessment-build-and-publish.md
  - docs/features/assessment-authoring/assessment-authoring-urd.md
  - docs/_reverse/assessment-and-grading/reverse-spec.md
---

# assessment-authoring — Software Requirements Specification

## 1. Scope

SRS này cover việc tạo và phát hành bài đánh giá của một tổ chức: CRUD bản
nháp với cấu hình nghiệp vụ (mục tiêu, trình độ, đối tượng, thời lượng,
quy tắc chấm, hướng dẫn, chính sách hiển thị kết quả), áp mẫu từ
`assessment-templates`, soạn đề từ câu "Đã duyệt" của `question-bank`,
preview và checklist trước phát hành, phát hành kèm snapshot đề bất biến,
quản lý link/token (hạn, giới hạn lượt, thu hồi), đóng bài và audit mọi
thay đổi sau phát hành. Đây là feature `Must` trong cam kết v1 (PRD Mục
7.21).

KHÔNG cover: làm bài/autosave/submit/attempt (`candidate-assessment` —
feature này chỉ công bố chính sách), chấm/phân tích/kết quả
(`assessment-grading`), soạn và review câu hỏi (`question-bank`), sinh câu
AI (`ai-question-generation`), vòng đời mẫu (`assessment-templates`), và
adaptive testing (PRD "Chưa làm").

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR (author) | người | Tạo, cấu hình, soạn đề, preview, phát hành, quản lý link, đóng bài | Có |
| Interviewer (đồng tác giả) | người | Soạn bài trong phạm vi được giao, preview, phát hành | Có |
| Admin | người | Kiểm soát quyền phát hành, sửa/thu hồi khi cần, truy vết audit | Có |
| Người làm bài (ứng viên/nhân viên) | người | Làm bài qua link/tài khoản hợp lệ | Không (không có giao diện authoring; tiêu thụ qua `candidate-assessment`) |
| `question-bank` | hệ thống (feature khác) | Cung cấp danh sách câu "Đã duyệt" + phiên bản | Không (nguồn câu hỏi) |
| `assessment-templates` | hệ thống (feature khác) | Cung cấp mẫu "Đã công bố" để điền sẵn cấu hình | Không (nguồn cấu hình) |
| `ai-question-generation` | hệ thống (feature khác) | Luồng sinh câu bổ sung khi ngân hàng thiếu | Không (điều hướng tới) |
| `candidate-assessment` | hệ thống (feature khác) | Tiêu thụ bài + link đã phát hành, thực thi attempt | Không (consumer) |
| `contextual-notifications` / `operational-email` | hệ thống (feature khác) | Kênh gửi link tới đối tượng | Không (kênh phân phối) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-assessment-authoring-001 | Tạo/sửa bài nháp | Khi author tạo hoặc sửa bài ở "Bản nháp", hệ thống phải ghi nhận: tên, mô tả, hướng dẫn làm bài, mục tiêu (vị trí/JD từ danh mục tổ chức), trình độ, đối tượng (ứng viên/nhân viên), thời lượng, quy tắc chấm (thang điểm + điểm đạt + mô tả) và chính sách hiển thị kết quả | P0 | demo | PRD Mục 7.21; URD UN-001 |
| FR-assessment-authoring-002 | Áp mẫu vào bài mới | Khi author chọn "Tạo từ mẫu", hệ thống phải chỉ liệt kê mẫu "Đã công bố" (và mẫu cá nhân của chính người đó), sao chép cấu hình mẫu vào bản nháp độc lập và ghi nhận `template_id` trên bài để truy vết | P0 | test | PRD Mục 7.31; brainstorm Mục 5.1; URD UN-002 |
| FR-assessment-authoring-003 | Soạn đề từ ngân hàng | Khi author mở "Chọn từ ngân hàng", hệ thống phải chỉ trả câu ở trạng thái "Đã duyệt"; cho thêm/bớt/đổi thứ tự câu, gán điểm từng câu (số dương) và hiển thị tổng điểm | P0 | test | PRD Mục 7.21 (question composition), Mục 12; URD UN-003 |
| FR-assessment-authoring-004 | Cảnh báo câu trong đề | Khi câu trong bài nháp bị "Ngừng dùng" hoặc có phiên bản mới được duyệt, hệ thống phải hiện cảnh báo trên bài nháp; phát hành phải chặn khi còn câu ngừng dùng và cho cập nhật phiên bản khi có bản mới | P0 | test | PRD Mục 7.19/7.21; URD UN-004 |
| FR-assessment-authoring-005 | Gợi ý câu theo mục tiêu | Khi bài đã có mục tiêu (vị trí/trình độ), hệ thống phải áp sẵn bộ lọc kỹ năng/trình độ tương ứng trong màn chọn câu | P1 | demo | brainstorm Mục 4 (P1); URD UN-003 |
| FR-assessment-authoring-006 | Điều hướng sinh câu AI | Khi ngân hàng thiếu câu, hệ thống phải cho author mở luồng `ai-question-generation` (mang theo mục tiêu/kỹ năng làm ngữ cảnh) rồi quay lại chọn câu sau khi câu được duyệt vào bank | P1 | demo | PRD Mục 7.21 luồng "chọn/sinh câu", Mục 7.20 |
| FR-assessment-authoring-007 | Preview người làm bài | Khi author bấm preview, hệ thống phải hiển thị bài đúng như người làm bài sẽ thấy (hướng dẫn, câu hỏi, lựa chọn) và tuyệt đối không hiển thị đáp án/giải thích | P0 | test | PRD Mục 7.21 (preview); Observed: GAP-AS-06 |
| FR-assessment-authoring-008 | Checklist phát hành | Khi author bấm "Phát hành", hệ thống phải kiểm tra: có ≥1 câu, mọi câu "Đã duyệt" (không ngừng dùng), thời lượng hợp lệ, hướng dẫn không rỗng, quy tắc chấm và chính sách hiển thị kết quả đã chọn; nếu thiếu, liệt kê mục thiếu và giữ "Bản nháp" | P0 | test | PRD Mục 7.21 (review → publish); URD UN-005 |
| FR-assessment-authoring-009 | Phát hành có snapshot | Khi checklist đạt và author xác nhận, hệ thống phải chuyển bài sang "Đã phát hành", chốt tham chiếu từng câu tới `QUESTION_VERSION` hiệu lực tại thời điểm phát hành (bất biến) và ghi nhận người + thời điểm phát hành | P0 | test | PRD Mục 7.21, Mục 7.22 (snapshot bất biến) |
| FR-assessment-authoring-010 | Tạo link phát hành | Khi tạo link trên bài "Đã phát hành", hệ thống phải yêu cầu hạn dùng (≤90 ngày) và giới hạn lượt (1–1.000), sinh token duy nhất và cho phép ghi chú đợt/đối tượng; link mới ở trạng thái "hoạt động" | P0 | test | PRD Mục 7.21 (token/link); OQ-AS-01 |
| FR-assessment-authoring-011 | Thu hồi và hết hạn link | Hệ thống phải tự chuyển link sang "hết hạn" khi qua hạn hoặc đạt giới hạn lượt; khi author/admin thu hồi, bắt buộc lý do, chuyển "thu hồi" và chặn attempt mới trong khi attempt đang chạy vẫn hoàn tất | P0 | test | PRD Mục 7.22 (expiry/override có lý do và audit); OQ-AS-01 |
| FR-assessment-authoring-012 | Sửa sau phát hành có kiểm soát | Trên bài "Đã phát hành", hệ thống phải chỉ cho sửa field không ảnh hưởng đề (tên, mô tả, hướng dẫn, hạn/giới hạn của link) kèm lý do bắt buộc + audit; mọi thay đổi đề (câu hỏi, điểm, thời lượng, quy tắc chấm) phải bị chặn và điều hướng "Nhân bản" | P0 | test | PRD Mục 7.22; brainstorm Mục 6.1 (D6); URD UN-008 |
| FR-assessment-authoring-013 | Nhân bản bài | Khi author chọn "Nhân bản", hệ thống phải tạo bài mới ở "Bản nháp" sao chép toàn bộ cấu hình và danh sách câu (theo phiên bản hiệu lực hiện tại), ghi nguồn "nhân bản từ {bài}" | P1 | demo | brainstorm Mục 5.3; URD UN-008 |
| FR-assessment-authoring-014 | Đóng/mở lại bài | Khi author/admin "Đóng bài", hệ thống phải chuyển bài sang "Đã đóng" và chặn attempt mới trên mọi link trong khi attempt đang chạy vẫn hoàn tất; mở lại chỉ bởi author/admin kèm lý do + audit | P0 | test | brainstorm Mục 5.3; URD UN-007 |
| FR-assessment-authoring-015 | Audit bài và link | Hệ thống phải ghi vết audit cho: phát hành, đóng/mở lại, sửa sau phát hành (trước/sau + lý do), tạo link, thu hồi link (lý do), nhân bản | P0 | kiểm tra | PRD Mục 9, Mục 7.22; URD UN-009 |
| FR-assessment-authoring-016 | Theo dõi lượt dùng link | Hệ thống phải hiển thị trên mỗi link: số attempt đã tạo, giới hạn còn lại và trạng thái, để author quyết định thu hồi/tạo thêm | P1 | demo | brainstorm Mục 6.5; URD UN-010 |
| FR-assessment-authoring-017 | Đối tượng nhân viên | Khi đối tượng là "nhân viên", hệ thống phải cho phát hành qua giao bài theo tài khoản (ngoài link) và ghi nhận chính sách tương ứng | P1 | kiểm tra | PRD Mục 7.22 (theo token/quyền); URD UN-011; OQ-4 đã giải |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-assessment-authoring-001 | security | Đáp án/giải thích không bao giờ lộ qua preview, link hay bất kỳ surface nào của feature với vai trò không được cấp | P0 | 0 sự cố lộ đáp án được xác nhận (guardrail bám M-GR-01; vá GAP-AS-06) |
| NFR-assessment-authoring-002 | security | Chỉ vai trò được cấp (author/admin) tạo/sửa/phát hành bài và link — deny-by-default, kiểm tra phía server | P0 | 0 incident vượt quyền được xác nhận (bám M-GR-01) |
| NFR-assessment-authoring-003 | auditability | Mọi sự kiện FR-015 truy vết được (ai, khi nào, lý do, trước/sau) | P0 | Truy vết đủ trên mẫu kiểm tra bất kỳ |
| NFR-assessment-authoring-004 | performance | Màn chọn câu (đọc từ `question-bank`) và preview phản hồi nhanh cho thao tác soạn đề | P1 | 95% thao tác lọc/preview trả kết quả trong ≤3 giây ở đề ≤200 câu [đề xuất — xem OQ-3] |
| NFR-assessment-authoring-005 | reliability | Phát hành là thao tác nguyên tử và idempotent: lỗi giữa chừng không để bài nửa "đã phát hành", bấm lại không nhân đôi link/snapshot | P0 | Test phát hành lặp/lỗi giữa chừng không sinh bản ghi mồ côi |
| NFR-assessment-authoring-006 | usability | Toàn bộ giao diện và thông báo tiếng Việt; nội dung bài hỗ trợ đầy đủ dấu tiếng Việt | P0 | Kiểm tra mẫu nội dung tiếng Việt lưu/hiển thị đúng |
| NFR-assessment-authoring-007 | data-retention | Bài đã đóng và link thu hồi vẫn truy vết được phục vụ audit và đối chiếu attempt cũ | P1 | Thời gian giữ theo quyết định retention (liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-assessment-authoring-001 | Chỉ câu "Đã duyệt" được đưa vào đề — không ngoại lệ, kể cả câu import hay câu AI | Khi chọn câu vào bài hoặc phát hành | FR-003, FR-008 | PRD Mục 12 (human-in-the-loop); BR-question-bank-001 |
| BR-assessment-authoring-002 | Checklist phát hành bắt buộc đạt toàn bộ trước khi bài chuyển "Đã phát hành" | Khi author bấm "Phát hành" | FR-008 | PRD Mục 7.21 (rủi ro bài sai mục tiêu) |
| BR-assessment-authoring-003 | Đề phát hành là snapshot bất biến theo phiên bản câu tại thời điểm phát hành | Khi phát hành và khi có yêu cầu sửa đề sau đó | FR-009, FR-012 | PRD Mục 7.22 |
| BR-assessment-authoring-004 | Link bắt buộc có hạn (≤90 ngày) + giới hạn lượt (1–1.000); không có link vô hạn | Khi tạo link | FR-010 | brainstorm Mục 7.2; OQ-AS-01 |
| BR-assessment-authoring-005 | Thu hồi link và đóng bài không hủy attempt đang chạy — chỉ chặn attempt mới | Khi thu hồi link hoặc đóng bài | FR-011, FR-014 | PRD Mục 7.22 (hợp đồng attempt); brainstorm Mục 6.4 |
| BR-assessment-authoring-006 | Mọi thay đổi sau phát hành và mọi thao tác link bắt buộc lý do + audit | Khi sửa field nhẹ/thu hồi/đóng/mở lại | FR-011, FR-012, FR-014, FR-015 | PRD Mục 9, Mục 7.22 |
| BR-assessment-authoring-007 | Chính sách hiển thị kết quả cho người làm bài do author công bố trên bài; không bao giờ hiện đáp án đúng | Khi cấu hình và khi render kết quả | FR-001, FR-007 | PRD Mục 7.22; OQ-AS-03 (đề xuất đã giải OQ-5) |
| BR-assessment-authoring-008 | Mẫu áp vào bài là bản sao độc lập — sửa mẫu sau đó không đổi bài đã tạo | Khi áp mẫu và khi mẫu gốc thay đổi | FR-002 | brainstorm `assessment-templates` Mục 5.2 |
| BR-assessment-authoring-009 | Quyền phát hành/thu hồi/đóng giới hạn ở author (phạm vi tổ chức) và admin | Khi gọi thao tác phát hành/link/đóng | FR-009–FR-015 | PRD Mục 9; brainstorm Mục 6.2 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-assessment-authoring-001 | Checklist phát hành thiếu mục | "Phát hành" khi thiếu câu/cấu hình bắt buộc | major | FR-008 | Panel checklist hiện mục thiếu + "Chưa thể phát hành — còn thiếu: {danh sách mục}" | Bổ sung mục thiếu rồi phát hành lại |
| E-assessment-authoring-002 | Bài có câu ngừng dùng | Phát hành bài chứa câu "Ngừng dùng" | major | FR-004, FR-008 | "Bài có {n} câu đã ngừng dùng — thay câu trước khi phát hành" | Thay/gỡ câu rồi phát hành |
| E-assessment-authoring-003 | Sửa đề trên bài đã phát hành | Lưu thay đổi câu hỏi/điểm/thời lượng/quy tắc chấm trên bài "Đã phát hành" | major | FR-012 | "Bài đã phát hành không sửa được đề — hãy nhân bản để tạo phiên bản mới" | Nhân bản → chỉnh → phát hành bài mới |
| E-assessment-authoring-004 | Tạo link thiếu hạn/giới hạn | Tạo link không có hạn hoặc giới hạn lượt | minor | FR-010 | "Link cần có hạn dùng và giới hạn lượt làm trước khi tạo" | Nhập đủ rồi tạo |
| E-assessment-authoring-005 | Hạn link vượt tối đa | Đặt hạn link >90 ngày | minor | FR-010 | "Hạn link tối đa 90 ngày — chọn ngày sớm hơn" | Chọn hạn hợp lệ |
| E-assessment-authoring-006 | Thu hồi/đóng thiếu lý do | Thu hồi link hoặc đóng/mở lại bài không nhập lý do | minor | FR-011, FR-014 | "Vui lòng nhập lý do thu hồi link" | Nhập lý do rồi xác nhận |
| E-assessment-authoring-007 | Không có quyền phát hành | Vai trò chưa được cấp bấm phát hành/thu hồi/đóng | major | FR-009–FR-015 | "Bạn không có quyền phát hành bài đánh giá" | Xin cấp quyền qua admin; sự kiện ghi audit |
| E-assessment-authoring-008 | Sửa đồng thời một bài nháp | Người thứ hai lưu khi bài vừa được cập nhật | minor | FR-001 | "Bài vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-assessment-authoring-009 | Lỗi giữa thao tác phát hành | Mất kết nối/lỗi server khi đang phát hành | major | FR-009 | Bài giữ "Bản nháp", hiện "Phát hành chưa hoàn tất — thử lại" | Bấm phát hành lại (idempotent) |
| E-assessment-authoring-010 | Mục tiêu mất hiệu lực | Vị trí/kỹ năng mục tiêu bị gỡ khỏi danh mục trước phát hành | major | FR-008 | Cảnh báo "mục tiêu không còn hợp lệ", chặn phát hành | Gán lại mục tiêu hợp lệ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-assessment-authoring-01 | Bài phát hành không phải hủy do cấu hình sai | Tỷ lệ bài phát hành có ≥1 submission hợp lệ và không bị hủy vì cấu hình | ≥95% sau 1 tháng pilot (chốt cùng OQ-2 PRD) |
| SC-assessment-authoring-02 | Đề phát hành toàn câu đã duyệt + snapshot | Tỷ lệ câu trong bài phát hành ở "Đã duyệt" có phiên bản chốt | 100% |
| SC-assessment-authoring-03 | Link trong tầm kiểm soát | Tỷ lệ link có hạn + giới hạn lượt + trạng thái hợp lệ | 100% |
| SC-assessment-authoring-04 | Không sửa ngầm đề đã phát hành | Số sự cố snapshot thay đổi sau phát hành | 0 |
| SC-assessment-authoring-05 | Tái sử dụng mẫu/ngân hàng | Tỷ lệ bài tạo từ mẫu; tỷ lệ câu lấy từ bank | ≥60% bài từ mẫu hoặc ≥80% câu từ bank sau 1 tháng pilot |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Bài đánh giá__ — định danh, cấu hình nghiệp vụ (mục tiêu, trình độ, đối
  tượng, thời lượng, quy tắc chấm, hướng dẫn, chính sách kết quả), trạng
  thái vòng đời, mẫu gốc, người tạo/phát hành, tổ chức sở hữu.
- __Câu trong đề__ — tham chiếu câu + phiên bản chốt tại phát hành, điểm
  và thứ tự trong đề.
- __Link phát hành__ — token, hạn, giới hạn lượt, trạng thái, lý do thu
  hồi, người tạo.
- __Câu hỏi / Phiên bản câu__ — tham chiếu từ `question-bank` (không sở
  hữu ở feature này).
- __Mẫu bài đánh giá__ — tham chiếu từ `assessment-templates`.
- __Vị trí__ — tham chiếu từ `recruitment-planning`/`talent-framework`.
- __Người dùng__ — tham chiếu từ `org-governance`/`account-access`.

Chi tiết quan hệ + thuộc tính ở `srs/assessment-authoring-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo bài → cấu hình → chọn câu "Đã duyệt" → preview +
  checklist → phát hành → tạo link.
- __Flow 2:__ Tạo từ mẫu → điền sẵn cấu hình → chỉnh → phát hành.
- __Flow 3:__ Quản lý link — tạo thêm, theo dõi lượt, thu hồi kèm lý do.
- __Flow 4:__ Sửa sau phát hành — field nhẹ có audit; đổi đề → nhân bản.
- __Flow 5:__ Đóng bài — chặn attempt mới, attempt đang chạy hoàn tất.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __assessment-list__ — danh sách bài theo trạng thái + lọc mục tiêu.
- __assessment-editor__ — form cấu hình bản nháp (mục tiêu, thời lượng,
  quy tắc chấm, hướng dẫn, chính sách kết quả).
- __question-picker__ — chọn câu từ ngân hàng (lọc taxonomy, chỉ "Đã
  duyệt"), sắp thứ tự, gán điểm, cảnh báo câu.
- __assessment-preview__ — preview người làm bài (ẩn đáp án) + checklist
  phát hành.
- __link-manager__ — danh sách link của bài: hạn, lượt đã dùng/còn lại,
  trạng thái, tạo/thu hồi.
- __assessment-detail__ — tổng quan bài đã phát hành: provenance, audit,
  attempt theo link, đóng/mở lại/nhân bản.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi bài/link thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Chỉ câu đã qua review của con người được vào đề | PRD Mục 12 (human-in-the-loop) — Product owner |
| Snapshot đề bất biến sau phát hành; thời gian server là chuẩn cho hạn/expiry | PRD Mục 7.22 — Assessment owner |
| Quyền xem kết quả/attempt/expiry/reopen/override do author công bố, có lý do và audit | PRD Mục 7.22 — Assessment owner |
| Audit cho action nhạy cảm (phát hành, thu hồi, đóng, sửa sau phát hành) | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Danh sách câu "Đã duyệt" + QUESTION_VERSION bất biến | `question-bank` | FR-003, FR-004, FR-009 — toàn bộ soạn đề |
| Mẫu "Đã công bố" để điền sẵn | `assessment-templates` | FR-002 (không chặn tạo từ đầu) |
| Danh mục vị trí/JD của tổ chức | `recruitment-planning` (và `talent-framework` cho trình độ) | FR-001 — gán mục tiêu |
| Role/scope cho vai trò author + audit | `org-governance`, `account-access` | Phát hành/quản lý link đúng quyền |
| Luồng sinh câu AI khi bank thiếu câu | `ai-question-generation` | FR-006 (không chặn luồng chọn tay) |
| Thực thi attempt trên link (timer, autosave, submit) | `candidate-assessment` | Ý nghĩa nghiệp vụ của link phát hành |
| Kênh gửi link tới đối tượng | `contextual-notifications` / `operational-email` | Phân phối link (có thể sao chép thủ công) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Phát hành không cần approver thứ hai trong v1 (checklist + preview là rào chắn) | Thêm hàng chờ duyệt + vai trò reviewer bắt buộc — FR-008/009 thay đổi |
| Sửa sau phát hành chỉ field không ảnh hưởng đề | FR-012 phải mở rộng hoặc bỏ — snapshot không còn bảo đảm |
| Link bắt buộc hạn + giới hạn lượt + thu hồi (giải OQ-AS-01) | FR-010/011 mất ràng buộc an toàn, lặp lại GAP-AS-03 |
| Mặc định hiển thị kết quả là "chỉ biên nhận" | BR-007 đổi mặc định — rủi ro lộ thông tin trước review |
| Vị trí mục tiêu chọn từ danh mục tổ chức (không nhập tự do) | FR-001/005 không gợi ý/lọc được theo mục tiêu |
| Giới hạn số (200 câu, 240 phút, 90 ngày, 1.000 lượt, 20 link) là chuẩn v1 | Validation FR-001/010 đổi ngưỡng — chờ OQ-3 |

## 12. Open Questions

- [x] OQ-1: Phát hành bài có cần approver thứ hai? — Resolved (đề xuất):
  v1 không; author tự phát hành sau checklist + preview bắt buộc — chờ
  Product owner xác nhận.
- [x] OQ-2: Token/link cần expiry, revocation, attempt limit thế nào
  (OQ-AS-01)? — Resolved (đề xuất): cả ba bắt buộc — hạn ≤90 ngày, giới
  hạn 1–1.000 lượt, thu hồi kèm lý do — chờ Product owner xác nhận.
- [x] OQ-3: Các giới hạn (200 câu, 240 phút, 90 ngày, 1.000 lượt, 20 link,
  preview ≤3 giây) có làm chuẩn v1? — Resolved (đề xuất): dùng làm chuẩn
  draft — chờ Product owner xác nhận.
- [x] OQ-4: Đối tượng "nhân viên" giao bài bằng link hay tài khoản? —
  Resolved (đề xuất): mặc định giao qua tài khoản; link public vẫn khả
  dụng khi author chủ động chọn — chờ Product owner xác nhận.
- [x] OQ-5: Người làm bài xem gì sau nộp (OQ-AS-03)? — Resolved (đề
  xuất): 3 mức author chọn, mặc định chỉ biên nhận, không bao giờ hiện đáp
  án đúng — chờ Product owner + Head of HR xác nhận.
- [x] OQ-6: Bài đã đóng có được mở lại? — Resolved (đề xuất): được, bởi
  author/admin kèm lý do + audit — chờ Product owner xác nhận.
- [x] OQ-7: Bài đánh giá có cần versioning hiển thị (v1, v2) hay nhân bản
  là đủ? — Resolved (đề xuất): nhân bản là đủ cho v1 — mỗi bài phát hành
  là một bản ghi độc lập, truy vết qua provenance "nhân bản từ {bài}" —
  chờ Product owner xác nhận.
