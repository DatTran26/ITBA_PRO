---
type: srs
feature: management-reporting
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/management-reporting/management-reporting-urd.md, docs/features/management-reporting/brainstorms/scoped-kpi-risk-alerts.md]
---

# management-reporting — Software Requirements Specification

## 1. Scope

Lớp tổng hợp báo cáo quản trị trên dữ liệu sẵn có của recruitment,
assessment và công việc: dashboard KPI theo phạm vi quyền, cảnh báo quá
hạn/rủi ro có vòng đời, drill-down evidence, AI executive summary có
kiểm chứng, và export có audit. Feature KHÔNG phát sinh dữ liệu nghiệp
vụ (nguồn thuộc các module khác), không gửi thông báo trực tiếp (qua
`contextual-notifications`), và không làm report builder tùy biến hay
báo cáo liên domain.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Quản lý | người | Xem KPI/cảnh báo trong đơn vị mình, xác nhận action xử lý | Có |
| Lãnh đạo / Head of HR | người | Báo cáo toàn tổ chức, AI summary, export | Có |
| HR | người | Xem/export số liệu trong phạm vi được phân công | Có |
| Admin | người | Cấu hình ngưỡng cảnh báo, bộ KPI mặc định, nhận báo lỗi | Có |
| org-governance | hệ thống nội bộ | Cung cấp data-scope/quyền cho mọi truy vấn tổng hợp | Có (dependency) |
| candidate-pipeline / kanban-workspaces / candidate-assessment / assessment-grading | hệ thống nội bộ | Nguồn trạng thái, owner, hạn để tổng hợp | Có (dependency) |
| contextual-notifications | hệ thống nội bộ | Kênh đẩy cảnh báo tới người có scope | Có (dependency) |
| AI provider | ngoài | Sinh executive summary theo yêu cầu | Có (dependency) |
| Nhân viên / Ứng viên | người | Đối tượng bị tổng hợp; không phải người xem báo cáo | Không |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-management-reporting-001 | Xác định phạm vi dữ liệu khi mở báo cáo | Khi người dùng mở mục báo cáo, hệ thống phải xác định data-scope của người xem từ org-governance và chỉ tổng hợp dữ liệu trong scope đó. Nếu người xem chưa được gán phạm vi, thì hệ thống phải hiển thị màn trống kèm hướng dẫn liên hệ admin, không tải số liệu. | P0 | demo | PRD Mục 7.25; URD UN-001 |
| FR-management-reporting-002 | Hiển thị KPI mặc định trong scope | Hệ thống phải hiển thị bộ KPI mặc định: application đang kẹt theo trạng thái/thời gian, task quá hạn, bài đánh giá đã giao/hoàn thành/sắp hết hạn, tỷ lệ hoàn thành đúng hạn — tính trên kỳ hiện tại và trong scope. Bộ KPI cụ thể chờ OQ-1. | P0 | demo | PRD Mục 7.25; brainstorm Mục 4 |
| FR-management-reporting-003 | Filter theo kỳ và đơn vị trong scope | Khi người xem đổi kỳ (tuần/tháng/quý/tùy chọn từ-ngày đến-ngày, tối đa 12 tháng) hoặc filter phòng ban/vị trí, hệ thống phải tổng hợp lại số liệu; lựa chọn ngoài scope phải bị lọc bỏ. | P0 | test | PRD Mục 7.25 (filter scope) |
| FR-management-reporting-004 | Ẩn số liệu nhóm dưới ngưỡng tối thiểu | Nếu một ô tổng hợp có nhóm nhỏ hơn ngưỡng tối thiểu (đề xuất 5 — OQ-3), thì hệ thống phải ẩn số liệu và hiển thị "Không đủ dữ liệu để hiển thị" thay vì con số. | P0 | test | Brainstorm Mục 6.1 D2; rủi ro suy diễn cá nhân |
| FR-management-reporting-005 | Hiển thị độ tươi dữ liệu | Hệ thống phải hiển thị mốc "Dữ liệu cập nhật đến {giờ}" trên mỗi khối KPI; nếu một nguồn không trả dữ liệu kịp, thì ô KPI tương ứng hiển thị "chưa cập nhật" thay vì dùng số liệu cũ. | P0 | demo | Brainstorm Mục 6.4; URD UN-008 |
| FR-management-reporting-006 | Phát hiện và tạo cảnh báo vượt ngưỡng | Khi một entity nguồn vượt ngưỡng cấu hình (application ở một trạng thái quá ngưỡng ngày, task quá hạn, bài test sắp hết hạn chưa làm), hệ thống phải tạo cảnh báo trạng thái "mới" trên dashboard và phát thông báo tới người có scope qua contextual-notifications. | P0 | test | PRD Mục 7.25 (overdue/risk) |
| FR-management-reporting-007 | Vòng đời cảnh báo | Hệ thống phải quản lý trạng thái cảnh báo: mới → đã xem → đang xử lý → đã đóng; nhánh tạm hoãn (bắt buộc lý do + mốc hẹn ≤14 ngày) và tự hết khi tình trạng nguồn hết. Cảnh báo đã đóng hoặc tự hết phải giữ trong lịch sử, không mở lại. | P0 | test | Brainstorm Mục 6.3 |
| FR-management-reporting-008 | Drill evidence từ số liệu/cảnh báo | Khi người xem chọn một KPI hoặc cảnh báo, hệ thống phải hiển thị danh sách entity nguồn làm evidence — chỉ entity thuộc scope người xem; truy cập entity luôn kiểm tra quyền ở tầng entity, không phụ thuộc màn báo cáo. | P0 | test | PRD Mục 7.25 (drill evidence) |
| FR-management-reporting-009 | Action xử lý trên cảnh báo | Khi người xem xử lý cảnh báo, hệ thống phải cho phép: tạo task xử lý, giao lại owner, tạm hoãn kèm lý do, hoặc đóng kèm lý do chọn từ danh sách; mọi action phải ghi audit (ai, action, lý do, thời điểm). | P0 | test | PRD Mục 7.25 (xác nhận action) |
| FR-management-reporting-010 | AI executive summary có evidence | Khi người xem yêu cầu "Tóm tắt AI", hệ thống phải sinh summary từ dữ liệu trong scope: điểm nghẽn, xu hướng, rủi ro cần kiểm tra — mỗi nhận định kèm liên kết evidence nguồn và nhãn "Tóm tắt do AI đề xuất — kiểm tra evidence trước khi hành động". | P1 | demo | PRD Mục 7.25; invariant Mục 12 |
| FR-management-reporting-011 | Action đề xuất của AI phải có xác nhận | Khi AI summary đề xuất action, hệ thống phải hiển thị đề xuất kèm evidence và chỉ thực thi khi người xem xác nhận từng action; AI không tự thực thi và không kết luận vi phạm/phẩm chất. | P0 | test | PRD Mục 12 (human-in-the-loop) |
| FR-management-reporting-012 | Export báo cáo trong scope có audit | Khi người xem có quyền export chọn xuất CSV/PDF, hệ thống phải sinh file chỉ chứa dữ liệu trong scope, chặn khi vượt 10.000 dòng (đề xuất — OQ-7), ghi audit lượt export (ai, kỳ, loại, số dòng), liệt kê file trong "báo cáo đã xuất" và tự xóa file sau hạn lưu giữ (đề xuất 30 ngày). | P0 | test | PRD Mục 7.25 (export hợp lệ) |
| FR-management-reporting-013 | Cấu hình ngưỡng cảnh báo và KPI mặc định | Hệ thống phải cho phép admin (hoặc quản lý được ủy quyền) đặt ngưỡng cảnh báo theo loại/đơn vị và bộ KPI mặc định; thay đổi ngưỡng phải ghi audit. Ngưỡng mặc định đề xuất: application kẹt 5 ngày, task quá hạn >0 ngày (OQ-2). | P0 | test | Brainstorm Mục 4, 7.1 |
| FR-management-reporting-014 | Gửi báo cáo định kỳ qua email | Khi có lịch gửi định kỳ, hệ thống phải gửi báo cáo qua email theo đúng scope của từng người nhận, tối đa 1 lần/ngày/người nhận; lỗi gửi phải báo admin. | P1 | test | Brainstorm Mục 4 P1 |
| FR-management-reporting-015 | So sánh với kỳ trước | Hệ thống phải hiển thị xu hướng lên/xuống của từng KPI so với kỳ liền trước cùng độ dài. | P1 | demo | Brainstorm Mục 4 P1 |
| FR-management-reporting-016 | Lưu khung báo cáo cá nhân | Hệ thống phải cho phép người xem lưu bộ lọc hay dùng thành khung báo cáo cá nhân và mở lại sau. | P1 | demo | Brainstorm Mục 4 P1 |
| FR-management-reporting-017 | Tự đóng cảnh báo khi tình trạng nguồn hết | Khi tình trạng nguồn của một cảnh báo đang mở không còn (task xong, application chuyển trạng thái), hệ thống phải chuyển cảnh báo sang "tự hết" và hiển thị phân biệt với đóng do người xử lý. | P0 | test | Brainstorm Mục 6.1 D4 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-management-reporting-001 | authorization | Mọi số liệu, evidence và file export chỉ bao gồm dữ liệu trong data-scope của người xem; không có đường nào (kể cả link dán tay) vượt scope. | P0 | 0 sự cố vượt scope được xác nhận trong pilot (bám M-GR-01); kiểm tra bằng tài khoản quản lý đơn vị A truy cập dữ liệu đơn vị B bị từ chối |
| NFR-management-reporting-002 | privacy | Aggregate không cho suy diễn cá nhân: nhóm dưới ngưỡng tối thiểu bị ẩn ở mọi surface (dashboard, drill, export, email định kỳ). | P0 | Không có số liệu nào của nhóm <5 (hoặc ngưỡng được duyệt ở OQ-3) hiển thị trong kiểm tra thủ công lẫn export |
| NFR-management-reporting-003 | auditability | 100% action trên cảnh báo, thay đổi ngưỡng và lượt export có bản ghi audit truy vết được. | P0 | Truy vết ngẫu nhiên 10 action/export — đủ ai/gì/lý do/thời điểm |
| NFR-management-reporting-004 | performance | Người xem thấy dashboard KPI kỳ hiện tại trong thời gian chấp nhận được cho quy mô pilot (50-300 người nội bộ). | P1 | Đề xuất: dashboard hiển thị trong ≤5 giây với dữ liệu pilot; target chính thức chờ OQ-5 |
| NFR-management-reporting-005 | reliability | Lỗi của một nguồn dữ liệu không làm mất toàn bộ dashboard; phần lỗi được đánh dấu rõ và tự phục hồi khi nguồn trở lại. | P0 | Ngắt một nguồn (vd kanban) — các KPI nguồn khác vẫn hiển thị, KPI lỗi báo "chưa cập nhật" |
| NFR-management-reporting-006 | data integrity | Số liệu hiển thị luôn kèm mốc cập nhật; không trình bày dữ liệu cũ như dữ liệu mới sau lỗi nguồn. | P0 | Kiểm tra UI: mọi khối KPI có mốc "cập nhật đến"; sau lỗi nguồn không hiện số cũ |
| NFR-management-reporting-007 | usability | Giao diện và wording tiếng Việt tự nhiên; mọi cảnh báo/action có wording rõ hệ quả. | P1 | Review wording trên 3 luồng chính với Head of HR pilot |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-management-reporting-001 | Chỉ người có data-scope hợp lệ mới xem được báo cáo; không scope = không số liệu. | Mở mục báo cáo | FR-management-reporting-001 | PRD Mục 9 (constraint org/role/data-scope) |
| BR-management-reporting-002 | Ô tổng hợp có nhóm nhỏ hơn ngưỡng tối thiểu (đề xuất 5) phải bị ẩn số liệu. | Tổng hợp/filter/drill/export | FR-management-reporting-004 | Brainstorm Mục 7.2 |
| BR-management-reporting-003 | Đóng hoặc tạm hoãn cảnh báo bắt buộc lý do; snooze tối đa 14 ngày/lần (đề xuất). | Action trên cảnh báo | FR-management-reporting-007, -009 | Brainstorm Mục 7.1 |
| BR-management-reporting-004 | Export chỉ chứa dữ liệu trong scope người xuất; mọi lượt export ghi audit; file tự xóa sau hạn (đề xuất 30 ngày); tối đa 10.000 dòng/lượt (đề xuất). | Yêu cầu export | FR-management-reporting-012 | Brainstorm Mục 7.2 |
| BR-management-reporting-005 | AI summary chỉ mang tính đề xuất: mọi nhận định kèm evidence, mọi action do con người xác nhận, không kết luận vi phạm/phẩm chất. | Sinh/hiển thị AI summary | FR-management-reporting-010, -011 | PRD Mục 12 (invariant) |
| BR-management-reporting-006 | Cảnh báo đã đóng/tự hết không được mở lại; nếu tình trạng tái diễn thì tạo cảnh báo mới. | Cập nhật trạng thái cảnh báo | FR-management-reporting-007, -017 | Brainstorm Mục 6.3 |
| BR-management-reporting-007 | Ngưỡng cảnh báo chỉ do admin hoặc quản lý được ủy quyền đặt; mọi thay đổi ngưỡng ghi audit. | Thay đổi cấu hình ngưỡng | FR-management-reporting-013 | Brainstorm Mục 7.1 |
| BR-management-reporting-008 | Email báo cáo định kỳ tối đa 1 lần/ngày/người nhận — các báo cáo cùng kỳ phải được gộp. | Chạy lịch gửi định kỳ | FR-management-reporting-014 | Brainstorm Mục 7.2 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-management-reporting-001 | Chưa được gán phạm vi | Người xem mở báo cáo nhưng không có data-scope | major | FR-001 | Dashboard trống + "Bạn chưa được gán phạm vi xem báo cáo — liên hệ quản trị viên" | Admin gán scope → người xem tải lại |
| E-management-reporting-002 | Không có quyền export | Người xem không có quyền export trên scope đã chọn | major | FR-012 | Nút export disabled/ẩn; nếu cố gọi → "Bạn không có quyền xuất báo cáo trên phạm vi này" | Xin cấp quyền; không sinh file |
| E-management-reporting-003 | Export vượt giới hạn dòng | Kết quả export >10.000 dòng | minor | FR-012 | "Báo cáo vượt quá 10.000 dòng — hãy thu hẹp bộ lọc hoặc chia nhỏ kỳ" | Người xem thu hẹp filter/kỳ |
| E-management-reporting-004 | Nguồn dữ liệu không phản hồi | Một module nguồn timeout/lỗi khi tổng hợp | major | FR-005 | Ô KPI lỗi hiển thị "Chưa tải được số liệu {tên nhóm} — dữ liệu sẽ tự cập nhật lại"; các ô khác bình thường | Tự tổng hợp lại khi nguồn phục hồi; không hiển thị số cũ |
| E-management-reporting-005 | AI summary lỗi/timeout | Provider lỗi hoặc timeout khi sinh summary | minor | FR-010 | Dashboard KPI vẫn hiển thị; vùng summary báo lỗi + nút thử lại | Người xem bấm lại "Tóm tắt AI"; không lưu summary lỗi |
| E-management-reporting-006 | Xung đột xử lý cảnh báo | Hai người cùng action một cảnh báo gần đồng thời | minor | FR-009 | Người sau thấy trạng thái mới nhất + ai đã action trước | Giữ action đầu; action sau ghi chú là thao tác bổ sung |
| E-management-reporting-007 | Snooze vượt hạn tối đa | Người xem chọn mốc hẹn >14 ngày | minor | FR-007 | Chặn + báo chọn mốc ngắn hơn | Người xem chọn lại mốc hợp lệ |
| E-management-reporting-008 | Email báo cáo định kỳ thất bại | Gửi email định kỳ lỗi sau retry của kênh notification | major | FR-014 | Không có màn hình người xem; cảnh báo tới admin | Retry theo policy email; admin kiểm tra cấu hình |
| E-management-reporting-009 | Thiếu dữ liệu kỳ đầu | Tổng hợp kỳ chưa có dữ liệu nguồn nào | minor | FR-002 | Empty state "Chưa có dữ liệu trong kỳ này" | Tự hiển thị khi có dữ liệu |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-management-reporting-01 | Cảnh báo dẫn tới hành động thật | Tỷ lệ cảnh báo có action được con người xác nhận / tổng cảnh báo | ≥60% (đề xuất — chờ OQ-5) |
| SC-management-reporting-02 | Không lộ dữ liệu ngoài phạm vi | Số incident xem/xuất vượt scope được xác nhận | 0 (bám M-GR-01) |
| SC-management-reporting-03 | Truy vết được mọi hành động | Tỷ lệ action cảnh báo và lượt export có audit đủ trường | 100% |
| SC-management-reporting-04 | Lãnh đạo tự phục vụ số liệu | Tỷ lệ yêu cầu số liệu định kỳ được lấy qua dashboard/export thay vì nhờ HR tổng hợp tay | ≥80% (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **KPI_MEASUREMENT** — số liệu tổng hợp của một chỉ số trên một đơn vị
  trong một kỳ, kèm kích thước nhóm và mốc tính toán (phục vụ độ tươi
  dữ liệu và ngưỡng ẩn nhóm nhỏ).
- **REPORT_ALERT** — cảnh báo quá hạn/rủi ro: loại, entity nguồn, đơn vị,
  ngưỡng vi phạm, trạng thái vòng đời, lý do đóng, mốc hẹn tạm hoãn.
- **ALERT_ACTION** — lịch sử action trên cảnh báo (xem, tạo task, giao
  lại, tạm hoãn, đóng) kèm actor, lý do, thời điểm — bản audit.
- **ALERT_THRESHOLD** — ngưỡng cảnh báo theo loại và đơn vị, do
  admin/người được ủy quyền đặt.
- **REPORT_EXPORT** — lượt export: người xuất, kỳ, định dạng, số dòng,
  trạng thái file và hạn xóa.
- **AI_SUMMARY** — một lượt tóm tắt AI trên một scope/kỳ, kèm người yêu
  cầu và thời điểm sinh.
- **AI_SUMMARY_ITEM** — từng nhận định trong summary: nội dung, liên kết
  evidence, action đề xuất, quyết định xác nhận của người xem.
- **SAVED_REPORT_VIEW** — khung báo cáo cá nhân: bộ lọc đã lưu của một
  người xem.
- **SCHEDULED_REPORT** — lịch gửi báo cáo định kỳ: tần suất, danh sách
  người nhận, lần gửi gần nhất (P1).
- Tham chiếu ngoài: đơn vị tổ chức và người dùng (org-governance /
  account-access), entity nguồn của cảnh báo (pipeline/kanban/assessment).

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- Xem dashboard theo scope → filter → drill evidence (brainstorm Mục 5.1).
- Cảnh báo vượt ngưỡng → thông báo → xem evidence → action → đóng/tự hết
  (brainstorm Mục 5.2).
- AI executive summary → kiểm chứng evidence → xác nhận action
  (brainstorm Mục 5.3).
- Export báo cáo → kiểm quyền/scope → sinh file → audit → hết hạn tự xóa
  (brainstorm Mục 5.4).

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- Dashboard báo cáo: KPI cards + danh sách cảnh báo + filter kỳ/đơn vị +
  mốc độ tươi dữ liệu.
- Màn drill evidence: danh sách entity nguồn của một KPI/cảnh báo.
- Màn chi tiết cảnh báo: evidence, ngưỡng, chọn action + lý do.
- Màn AI summary: nhận định + link evidence + checkbox xác nhận action.
- Màn "báo cáo đã xuất": danh sách file, hạn tải, trạng thái.
- Màn cấu hình ngưỡng (admin): ngưỡng theo loại/đơn vị, bộ KPI mặc định.
- Empty states: chưa gán scope / chưa có dữ liệu kỳ này / KPI lỗi nguồn.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi truy vấn tổng hợp và drill phải qua organization/role/data-scope; audit là bắt buộc | PRD Mục 9 — Product/Security owner |
| AI không tự kết luận vi phạm, chấm phẩm chất, hoặc thực thi action | PRD Mục 12 invariant — Product owner |
| Ngôn ngữ giao diện ưu tiên tiếng Việt | PRD Mục 9 — Product owner |
| Credential/provider secret chỉ ở server boundary | PRD Mục 9 — Security owner |
| Báo cáo liên domain không thuộc cam kết v1 | PRD Mục 5 non-goals — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Data-scope và quyền (org-governance) | Feature org-governance | Toàn bộ dashboard/drill/export |
| Trạng thái/owner/hạn từ pipeline, kanban, assessment | Feature candidate-pipeline, kanban-workspaces, candidate-assessment, assessment-grading | KPI và cảnh báo không có nguồn |
| Kênh thông báo cảnh báo (contextual-notifications) | Feature contextual-notifications | Cảnh báo chỉ hiện trên dashboard |
| AI provider cho executive summary | Platform AI | FR-010/011 giảm còn KPI thô |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Quyền export tách khỏi quyền xem báo cáo | FR-012, E-002 — nếu gộp thì mọi người xem đều export được |
| Ngưỡng nhóm tối thiểu 5 được privacy owner chấp nhận | FR-004, BR-002 — sai thì thay ngưỡng toàn hệ thống |
| Module nguồn phát sinh đủ dữ liệu trạng thái/hạn trong kỳ | FR-002, FR-006 — KPI rỗng/cảnh báo sai |
| Người xem chấp nhận đánh dấu cảnh báo "đã xem" khi mở | FR-007 — vòng đời thiếu trạng thái trung gian đáng tin |
| Chính sách "báo cáo vận hành không dùng đánh giá/kỷ luật cá nhân" sẽ được công bố | NFR-002, rủi ro lạm dụng — thiếu thì cần wording/thiết kế bổ sung (OQ-6) |

## 12. Open Questions

- [ ] OQ-1: Bộ KPI mặc định của v1 gồm những chỉ số nào — cần Head of
  HR/sponsor duyệt?
- [ ] OQ-2: Ngưỡng cảnh báo mặc định từng loại (application kẹt bao
  ngày, bài test nhắc trước hạn bao lâu)?
- [ ] OQ-3: Ngưỡng nhóm tối thiểu để hiển thị số liệu — đề xuất 5, cần
  DPO/privacy owner duyệt (liên quan OQ-3/OQ-6 PRD)?
- [ ] OQ-4: Quản lý kiêm nhiệm nhiều đơn vị — scope gộp hay bắt chọn
  từng đơn vị khi xem?
- [ ] OQ-5: Target định lượng cho tỷ lệ cảnh báo dẫn tới action xác
  nhận và performance dashboard (liên quan OQ-2 PRD)?
- [ ] OQ-6: Chính sách "báo cáo vận hành không dùng đánh giá/kỷ luật cá
  nhân" có được công bố kèm dashboard — owner DPO/Head of HR?
- [ ] OQ-7: Retention file export (đề xuất 30 ngày) và audit lượt export
  theo chính sách nào (liên quan OQ-6 PRD)?
- [ ] OQ-8: Email báo cáo định kỳ có cần xác nhận đăng ký của người
  nhận, hay mặc định theo role? [NEEDS CLARIFICATION: ai quyết định danh
  sách người nhận báo cáo định kỳ — admin cấu hình hay người dùng tự
  đăng ký?]
