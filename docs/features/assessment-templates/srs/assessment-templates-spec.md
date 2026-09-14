---
type: srs
feature: assessment-templates
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/assessment-templates/brainstorms/assessment-template-lifecycle.md
  - docs/features/assessment-templates/assessment-templates-urd.md
  - docs/_reverse/assessment-and-grading/reverse-spec.md
---

# assessment-templates — Software Requirements Specification

## 1. Scope

SRS này cover thư viện mẫu bài đánh giá tái sử dụng của một tổ chức:
CRUD mẫu cấu hình khung (vị trí, trình độ, đối tượng, số câu, thời lượng,
quy tắc chấm, mô tả JD, hướng dẫn bài test), hai phạm vi mẫu chung/cá
nhân, vòng đời bản nháp → chờ review → đã công bố → ngừng dùng với review
bắt buộc cho mẫu chung, áp mẫu vào bài mới (`assessment-authoring`) theo
cơ chế bản sao độc lập, ghi nhận bài-sinh-từ-mẫu và thống kê lượt dùng.
Đây là feature `Should` — slice mở rộng, KHÔNG nằm trong cam kết v1 (PRD
Mục 7.31, Mục 6.1).

KHÔNG cover: soạn/phát hành bài đánh giá (`assessment-authoring` — tiêu
thụ mẫu đã công bố), bộ câu hỏi cố định trong mẫu (P2), quản lý vị trí/
taxonomy (`recruitment-planning`/`talent-framework`), marketplace mẫu
giữa tổ chức (PRD "Chưa làm"), và version mẫu có so sánh/khôi phục (P2).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo/dùng mẫu cá nhân, đọc mẫu chung, đề xuất mẫu chung | Có |
| Admin | người | Công bố/sửa/ngừng mọi mẫu, chỉ định reviewer, quản lý thư viện mẫu | Có |
| Reviewer mẫu chung (admin/business owner được chỉ định) | người | Duyệt mẫu chờ công bố có ghi nhận | Có |
| Interviewer (đồng tác giả) | người | Đọc/dùng mẫu chung khi có quyền tạo bài | Có |
| Người làm bài | người | Làm bài tạo từ mẫu | Không (không thao tác trong feature này) |
| `assessment-authoring` | hệ thống (feature khác) | Đọc mẫu "Đã công bố", sao chép cấu hình vào bản nháp, ghi template_id | Không (consumer) |
| `recruitment-planning` / `talent-framework` | hệ thống (feature khác) | Cung cấp danh mục vị trí và trình độ | Không (nguồn tham chiếu) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-assessment-templates-001 | Tạo/sửa mẫu | Khi người dùng tạo/sửa mẫu, hệ thống phải ghi nhận: tên (duy nhất theo phạm vi), mô tả, vị trí áp dụng (từ danh mục tổ chức, cho phép trống = mọi vị trí), trình độ, đối tượng làm bài, số câu hỏi, thời lượng, quy tắc chấm (thang điểm + điểm đạt + mô tả), mô tả JD và hướng dẫn bài test | P0 | demo | PRD Mục 7.31; brainstorm Mục 4; URD UN-002 |
| FR-assessment-templates-002 | Hai phạm vi mẫu | Hệ thống phải phân biệt mẫu cá nhân (chỉ người tạo và admin thấy/dùng) và mẫu chung (mọi người có quyền tạo bài thấy/dùng) trên mọi danh sách và quyền thao tác | P0 | test | PRD Mục 7.31 (phân biệt mẫu chung/cá nhân); brainstorm Mục 6.2 |
| FR-assessment-templates-003 | Danh sách + lọc mẫu | Hệ thống phải hiển thị danh sách mẫu với tab "Mẫu chung"/"Mẫu của tôi" và lọc theo vị trí, trình độ, đối tượng, trạng thái | P0 | demo | PRD Mục 7.31 (phân loại); URD UN-006 |
| FR-assessment-templates-004 | Gửi duyệt mẫu chung | Khi người tạo (hoặc admin) gửi mẫu làm mẫu chung, hệ thống phải kiểm tra đủ field bắt buộc rồi chuyển mẫu sang "Chờ review" và đưa vào hàng chờ của reviewer | P0 | test | brainstorm Mục 5.1; URD UN-003 |
| FR-assessment-templates-005 | Hàng chờ + quyết định review | Khi reviewer (admin/business owner được chỉ định) mở hàng chờ, hệ thống phải liệt kê mẫu "Chờ review" kèm đủ cấu hình; khi quyết định, ghi nhận "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú, người duyệt và thời điểm | P0 | test | brainstorm Mục 5.1; URD UN-004 |
| FR-assessment-templates-006 | Mẫu cá nhân công bố trong phạm vi riêng | Khi người dùng lưu mẫu phạm vi cá nhân đủ field bắt buộc, hệ thống phải đặt mẫu "Đã công bố" trong phạm vi riêng mà không cần review | P0 | test | brainstorm Mục 5.1; URD UN-002 |
| FR-assessment-templates-007 | Đọc mẫu cho authoring | Khi `assessment-authoring` đọc danh sách mẫu để áp, hệ thống phải chỉ trả mẫu "Đã công bố" (mẫu chung + mẫu cá nhân của chính người đó); khi mẫu được chọn, trả toàn bộ cấu hình để sao chép vào bản nháp | P0 | test | PRD Mục 7.31 luồng "chọn khi tạo bài"; URD UN-001 |
| FR-assessment-templates-008 | Cảnh báo/chặn mẫu không khả dụng | Khi mẫu được chọn đang "Chờ review" hệ thống phải cảnh báo trạng thái trước khi cho dùng; mẫu "Ngừng dùng" phải bị chặn không cho áp | P0 | test | brainstorm Mục 6.1 (D3); URD UN-007 |
| FR-assessment-templates-009 | Ngừng dùng mẫu | Khi admin/owner đánh dấu "Ngừng dùng" kèm lý do, hệ thống phải ẩn mẫu khỏi mọi danh sách chọn và gợi ý, giữ nguyên các bài đã tạo từ mẫu, và cho xem lại lịch sử | P0 | test | PRD Mục 7.31 (rủi ro mẫu lỗi thời); URD UN-005 |
| FR-assessment-templates-010 | Sửa lớn mẫu chung quay về review | Khi mẫu chung "Đã công bố" bị sửa lớn (đối tượng, trình độ, quy tắc chấm, vị trí áp dụng), hệ thống phải đưa bản sửa về "Chờ review"; bản đã công bố vẫn dùng được tới khi bản mới được duyệt; sửa nhỏ giữ trạng thái | P0 | test | brainstorm Mục 5.3 (D4); OQ-4 đã giải |
| FR-assessment-templates-011 | Ghi nhận bài-sinh-từ-mẫu | Hệ thống phải truy vết được mẫu nào đã sinh ra bài nào (qua `template_id` trên bài do `assessment-authoring` ghi) để khoanh vùng khi mẫu lỗi | P0 | kiểm tra | brainstorm Mục 4 (P0); URD UN-008 |
| FR-assessment-templates-012 | Phân quyền thao tác | Hệ thống phải thực thi: owner sửa/xóa mẫu cá nhân của mình; admin sửa/xóa mọi mẫu; chỉ admin (hoặc business owner được chỉ định) công bố mẫu chung; ai có quyền tạo bài đọc được mẫu chung | P0 | test | brainstorm Mục 6.2; URD UN-002 |
| FR-assessment-templates-013 | Nhân bản mẫu | Khi người dùng nhân bản một mẫu (kể cả mẫu chung), hệ thống phải tạo mẫu cá nhân của người đó sao chép toàn bộ cấu hình ở "Đã công bố" phạm vi riêng | P1 | demo | brainstorm Mục 4 (P1); URD UN-011 |
| FR-assessment-templates-014 | Đề xuất mẫu chung từ mẫu cá nhân | Hệ thống phải cho owner mẫu cá nhân gửi đề xuất công bố chung → mẫu vào hàng chờ như gửi duyệt thường | P1 | test | brainstorm Mục 4 (P1); URD UN-009 |
| FR-assessment-templates-015 | Thống kê lượt dùng | Hệ thống phải hiển thị mỗi mẫu được dùng tạo bao nhiêu bài và lần dùng gần nhất để phát hiện mẫu "chết"/lỗi thời | P1 | demo | brainstorm Mục 4 (P1); URD UN-010 |
| FR-assessment-templates-016 | Gợi ý mẫu theo ngữ cảnh | Khi tạo bài có sẵn vị trí/trình độ/đối tượng, hệ thống phải ưu tiên gợi ý mẫu khớp ngữ cảnh | P1 | demo | brainstorm Mục 4 (P1); URD Journey 1 |
| FR-assessment-templates-017 | Khôi phục mẫu ngừng dùng | Khi mở lại mẫu "Ngừng dùng", mẫu cá nhân về "Đã công bố" phạm vi riêng; mẫu chung phải quay về "Chờ review" | P1 | test | brainstorm Mục 6.3 |
| FR-assessment-templates-018 | Audit mẫu | Hệ thống phải ghi vết cho: gửi duyệt, quyết định review, công bố, sửa lớn, ngừng dùng/khôi phục, xóa (kèm lý do khi bắt buộc) | P0 | kiểm tra | PRD Mục 9; URD UN-005 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-assessment-templates-001 | security | Quyền theo phạm vi mẫu thực thi phía server — mẫu cá nhân không lộ cho người khác (trừ admin), deny-by-default | P0 | 0 incident xem/sửa mẫu vượt quyền được xác nhận (bám M-GR-01) |
| NFR-assessment-templates-002 | auditability | Mọi sự kiện FR-018 truy vết được (ai, khi nào, trước/sau, lý do) | P0 | Truy vết đủ trên mẫu kiểm tra bất kỳ |
| NFR-assessment-templates-003 | data-integrity | Áp mẫu là bản sao độc lập — không có liên kết sống giữa mẫu và bài đã tạo; sửa/ngừng mẫu không đổi bài | P0 | Sửa/xóa mẫu sau khi sinh bài không làm đổi cấu hình bài |
| NFR-assessment-templates-004 | performance | Danh sách mẫu + lọc phản hồi nhanh cho thao tác tạo bài | P1 | 95% lượt mở danh sách/gợi ý mẫu trả trong ≤3 giây ở ≤500 mẫu [đề xuất — xem OQ-9] |
| NFR-assessment-templates-005 | usability | Giao diện/thông báo tiếng Việt; nội dung mẫu hỗ trợ dấu tiếng Việt | P0 | Kiểm tra mẫu mẫu tiếng Việt lưu/hiển thị đúng |
| NFR-assessment-templates-006 | data-retention | Mẫu ngừng dùng/xóa vẫn truy vết được cho audit và đối chiếu bài đã tạo | P1 | Thời gian giữ theo quyết định retention (liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-assessment-templates-001 | Chỉ mẫu "Đã công bố" được áp vào bài mới; mẫu "Ngừng dùng" bị chặn tuyệt đối | Khi đọc danh sách/áp mẫu trong authoring | FR-007, FR-008 | PRD Mục 7.31 (rủi ro dùng hàng loạt) |
| BR-assessment-templates-002 | Mẫu chung không được tự công bố — bắt buộc qua review của admin/business owner được chỉ định | Khi gửi/công bố mẫu chung | FR-004, FR-005 | PRD Mục 7.31; Mục 12 (human-in-the-loop) |
| BR-assessment-templates-003 | Áp mẫu là bản sao độc lập — mẫu và bài không liên kết sống; chỉ giữ `template_id` truy vết | Khi áp mẫu và khi mẫu thay đổi sau đó | FR-007, FR-011 | brainstorm Mục 8 |
| BR-assessment-templates-004 | Sửa lớn (đối tượng/trình độ/quy tắc chấm/vị trí áp dụng) trên mẫu chung đã công bố → quay về "Chờ review"; bản đã công bố vẫn hiệu lực tới khi thay thế | Khi lưu sửa trên mẫu chung | FR-010 | brainstorm Mục 5.3; OQ-4 đã giải |
| BR-assessment-templates-005 | Tên mẫu duy nhất trong phạm vi: cá nhân theo owner, mẫu chung toàn tổ chức | Khi lưu mẫu | FR-001 | brainstorm Mục 7.1 |
| BR-assessment-templates-006 | Chỉ admin/business owner được chỉ định công bố mẫu chung; owner sửa mẫu mình, admin sửa mọi mẫu | Khi gọi thao tác công bố/sửa/xóa | FR-005, FR-012 | brainstorm Mục 6.2 |
| BR-assessment-templates-007 | Mẫu đã sinh bài khuyến nghị "Ngừng dùng" thay vì xóa; xóa vẫn cho phép nhưng bài giữ ghi chú "tạo từ mẫu đã xóa" | Khi xóa mẫu đã được dùng | FR-009, FR-011 | brainstorm Mục 6.5 |
| BR-assessment-templates-008 | Ngừng dùng/khôi phục/xóa bắt buộc audit; ngừng dùng bắt buộc lý do | Khi gọi các thao tác đó | FR-009, FR-017, FR-018 | PRD Mục 9 |
| BR-assessment-templates-009 | Trình độ chỉ chọn từ 6 mức chuẩn; đối tượng chỉ "ứng viên"/"nhân viên"; vị trí chỉ từ danh mục tổ chức | Khi lưu mẫu | FR-001 | brainstorm Mục 7.1; align `question-bank`/`assessment-authoring` |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-assessment-templates-001 | Thiếu field bắt buộc | Lưu/gửi duyệt mẫu thiếu trường | minor | FR-001, FR-004 | "Vui lòng điền đủ thông tin bắt buộc: {danh sách field}" | Bổ sung rồi lưu/gửi lại |
| E-assessment-templates-002 | Trùng tên mẫu | Lưu mẫu trùng tên trong cùng phạm vi | minor | FR-001 | "Đã có mẫu tên \"{tên}\" trong phạm vi này — chọn tên khác" | Đổi tên rồi lưu |
| E-assessment-templates-003 | Sửa mẫu không có quyền | Sửa/xóa mẫu cá nhân của người khác (không phải admin) | major | FR-012 | "Bạn không có quyền sửa mẫu này" | Xin admin; sự kiện ghi audit |
| E-assessment-templates-004 | Dùng mẫu đã ngừng | Chọn mẫu "Ngừng dùng" khi tạo bài | major | FR-008 | "Mẫu này đã ngừng dùng — chọn mẫu khác" | Chọn mẫu khác |
| E-assessment-templates-005 | Dùng mẫu chờ review | Chọn mẫu "Chờ review" khi tạo bài | minor | FR-008 | Cảnh báo "Mẫu này đang chờ duyệt để công bố chung" | Xác nhận có ý thức hoặc chọn mẫu khác |
| E-assessment-templates-006 | Ngừng dùng thiếu lý do | Đánh dấu ngừng dùng không nhập lý do | minor | FR-009 | "Vui lòng nhập lý do ngừng dùng mẫu" | Nhập lý do rồi xác nhận |
| E-assessment-templates-007 | Công bố mẫu chung không quyền | Vai trò không phải admin/reviewer bấm công bố chung | major | FR-005, FR-012 | "Bạn không có quyền công bố mẫu chung" | Xin admin; sự kiện ghi audit |
| E-assessment-templates-008 | Sửa đồng thời một mẫu | Người thứ hai lưu khi mẫu vừa được cập nhật | minor | FR-001 | "Mẫu vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-assessment-templates-009 | Xóa mẫu đã sinh bài | Xóa mẫu có bài tham chiếu | major | FR-011 | Cảnh báo "Mẫu đã được dùng tạo {n} bài — khuyến nghị ngừng dùng thay vì xóa" | Chọn ngừng dùng, hoặc xác nhận xóa |
| E-assessment-templates-010 | Vượt giới hạn số mẫu | Tạo mẫu mới khi đạt giới hạn (50 cá nhân/200 chung) | minor | FR-001 | "Đã đạt giới hạn số mẫu — ngừng dùng mẫu cũ trước khi tạo thêm" | Ngừng dùng/xóa mẫu cũ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-assessment-templates-01 | Bài từ mẫu không hủy do sai cấu hình | Tỷ lệ bài có template_id không bị hủy vì cấu hình | ≥95% sau 1 tháng (chốt cùng OQ-2 PRD) |
| SC-assessment-templates-02 | Mẫu chung luôn đã qua review | Tỷ lệ mẫu chung "Đã công bố" có bản ghi duyệt | 100% |
| SC-assessment-templates-03 | Mức tái sử dụng mẫu | Tỷ lệ bài mới tạo từ mẫu | ≥60% sau 1 tháng (đề xuất) |
| SC-assessment-templates-04 | Mẫu lỗi thời bị chặn | Số bài mới tạo từ mẫu "Ngừng dùng" | 0 |
| SC-assessment-templates-05 | Hàng chờ review không treo | Thời gian gửi duyệt → quyết định đầu tiên | ≤3 ngày làm việc trung bình (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Mẫu bài đánh giá__ — cấu hình khung (tên, mô tả, vị trí, trình độ, đối
  tượng, số câu, thời lượng, quy tắc chấm, JD, hướng dẫn), phạm vi, trạng
  thái vòng đời, owner, tổ chức.
- __Quyết định review mẫu__ — công bố/yêu cầu chỉnh, reviewer, ghi chú,
  thời điểm trên một lần gửi duyệt.
- __Bài đánh giá__ — tham chiếu từ `assessment-authoring` (ghi template_id
  để truy vết bài-sinh-từ-mẫu).
- __Vị trí__ — tham chiếu từ `recruitment-planning`.
- __Người dùng__ — tham chiếu từ `org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/assessment-templates-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo mẫu → lưu cá nhân (công bố riêng) hoặc gửi duyệt mẫu
  chung → reviewer công bố/yêu cầu chỉnh.
- __Flow 2:__ Áp mẫu trong authoring → bản sao cấu hình vào bản nháp →
  chỉnh → bài ghi template_id.
- __Flow 3:__ Ngừng dùng mẫu lỗi thời → ẩn khỏi chọn, bài đã tạo giữ
  nguyên, truy vết để khoanh vùng.
- __Flow 4:__ Sửa lớn mẫu chung → bản sửa chờ review, bản đã công bố vẫn
  hiệu lực.
- __Flow 5:__ Nhân bản mẫu chung → mẫu cá nhân; đề xuất mẫu cá nhân lên
  mẫu chung.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __template-list__ — hai tab "Mẫu chung"/"Mẫu của tôi" + bộ lọc vị trí/
  trình độ/đối tượng/trạng thái + lượt dùng.
- __template-editor__ — form cấu hình mẫu đầy đủ.
- __template-review-queue__ — hàng chờ mẫu "Chờ review" của reviewer.
- __template-review-detail__ — đối chiếu cấu hình + công bố/yêu cầu chỉnh.
- __template-picker__ (trong `assessment-authoring`) — gợi ý mẫu theo ngữ
  cảnh, cảnh báo trạng thái.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi mẫu thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Mẫu chung phải qua review của con người trước khi công bố — không tự công bố | PRD Mục 7.31, Mục 12 — Product owner |
| Mẫu lỗi/lỗi thời phải chặn được trước khi dùng hàng loạt | PRD Mục 7.31 (rủi ro chính) — Assessment owner |
| Audit cho action nhạy cảm (công bố, ngừng dùng, xóa, chỉ định reviewer) | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Danh mục vị trí của tổ chức | `recruitment-planning` | FR-001 gán vị trí áp dụng (có thể tạm để trống) |
| Khung trình độ 6 mức | `talent-framework` | FR-001 trình độ chuẩn |
| Role/scope cho owner/admin/reviewer + chỉ định business owner | `org-governance` | FR-005, FR-012 phân quyền |
| Điểm đọc mẫu "Đã công bố" + ghi template_id trên bài | `assessment-authoring` | FR-007, FR-011 — ý nghĩa của mẫu |
| Taxonomy câu hỏi (để mẫu gợi ý đúng, nếu mở rộng câu) | `question-bank` | Không chặn v1 |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Mẫu chỉ chứa cấu hình khung, không gồm bộ câu cố định | Thêm entity câu-trong-mẫu + snapshot — phạm vi lớn hơn nhiều |
| Mẫu chung cần 1 cấp duyệt (admin/business owner được chỉ định) | Thêm cấp duyệt → hàng chờ phức tạp |
| Bản mẫu đã công bố vẫn dùng được khi bản sửa lớn chờ duyệt | Nếu ẩn ngay → mẫu hay dùng biến mất đột ngột |
| Vị trí áp dụng chọn từ danh mục, để trống = mọi vị trí | Nếu nhập tự do → không lọc/gợi ý được |
| Quy tắc chấm = mô tả + thang điểm + điểm đạt tối thiểu | `assessment-grading` không đọc cấu trúc được |
| Giới hạn số (tên ≤150, mô tả ≤2.000, câu 1–200, 5–240 phút, 50 cá nhân/200 chung) là chuẩn draft | Đổi validation — chờ OQ-7/OQ-9 |

## 12. Open Questions

- [x] OQ-1: Mẫu chung cần bao nhiêu cấp duyệt (liên quan OQ-11 PRD)? —
  Resolved (đề xuất): 1 cấp — admin hoặc business owner được admin chỉ
  định — chờ Head of HR xác nhận.
- [x] OQ-2: Ai làm reviewer mẫu chung ngoài admin? — Resolved (đề xuất):
  admin chỉ định business owner theo mảng qua `org-governance` — chờ
  Admin lead xác nhận.
- [x] OQ-3: Mẫu cho "nhân viên" có quy trình duyệt khác? — Resolved (đề
  xuất): cùng quy trình, reviewer khuyến nghị business owner — chờ Head
  of HR xác nhận.
- [x] OQ-4: Ngưỡng "sửa lớn" và bản cũ còn dùng khi chờ duyệt? —
  Resolved (đề xuất): sửa lớn = đổi đối tượng/trình độ/quy tắc chấm/vị
  trí; bản đã công bố vẫn dùng tới khi thay thế — chờ Product owner xác
  nhận.
- [x] OQ-5: Sửa đồng thời owner + admin? — Resolved: cảnh báo tải lại,
  không merge — align `question-bank`.
- [x] OQ-6: Mẫu cá nhân của nhân sự nghỉ việc? — Resolved (đề xuất): giữ
  nguyên; admin chuyển ownership hoặc ngừng dùng — chờ Admin lead xác
  nhận.
- [x] OQ-7: Độ dài tên/mô tả? — Resolved (đề xuất): tên ≤150, mô tả
  ≤2.000, hướng dẫn ≤5.000 — chờ Product owner xác nhận.
- [x] OQ-8: Vị trí áp dụng nhập tự do hay danh mục? — Resolved (đề
  xuất): danh mục vị trí của tổ chức, để trống = mọi vị trí — chờ Head
  of HR xác nhận.
- [x] OQ-9: Min/max số câu/thời lượng/giới hạn mẫu? — Resolved (đề
  xuất): câu 1–200, 5–240 phút, mẫu cá nhân ≤50/người, mẫu chung ≤200/
  tổ chức — chờ Product owner xác nhận.
- [x] OQ-10: Quy tắc chấm có cấu trúc không? — Resolved (đề xuất): mô tả
  tự do + thang điểm + điểm đạt tối thiểu — chờ Assessment owner xác
  nhận.
- [x] OQ-11: Target "tỷ lệ bài từ mẫu không bị hủy"? — Resolved: chưa có
  baseline — xác lập bằng audit 1 tháng; target chờ OQ-2 PRD.
- [~] OQ-12: Mẫu kèm bộ câu hỏi cố định? — Out of scope v1: P2 —
  brainstorm chỉ định cấu hình khung.
- [~] OQ-13: Version mẫu có so sánh/khôi phục? — Out of scope v1: P2 —
  cơ chế "bản đã công bố vẫn hiệu lực" đã đủ cho v1.
