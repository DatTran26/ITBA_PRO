---
type: srs
feature: employee-profiles
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/employee-profiles/brainstorms/unified-employee-record.md
  - docs/features/employee-profiles/employee-profiles-urd.md
  - docs/_reverse/talent-and-crm/reverse-spec.md
---

# employee-profiles — Software Requirements Specification

## 1. Scope

SRS này cover hồ sơ nhân viên thống nhất của một tổ chức: tạo thủ công hoặc
chuyển đổi từ ứng viên có offer đã chấp nhận (prefill từ CV đã xác nhận +
offer), kiểm tra trùng 3 khóa, checklist trường bắt buộc, review → kích hoạt,
tự phục vụ của nhân viên (whitelist + yêu cầu trường hạn chế), cập nhật có lý
do, lịch sử audit, tìm/lọc trong phạm vi quyền, gộp hồ sơ trùng, màn thiếu
dữ liệu, gắn kỹ năng và export.

Lưu ý phạm vi release: `employee-profiles` là feature `Should` trong Feature
Map — KHÔNG nằm trong cam kết lát cắt v1 (15 feature `Must`); spec này mô tả
slice mở rộng Core HR sau khi sponsor duyệt roadmap.

KHÔNG cover: payroll/benefit (PRD Mục 7.3 "Chưa làm"), trạng thái vòng đời
việc làm và tài liệu nhân sự (`employment-lifecycle`), checklist onboarding
(`employee-onboarding`), định nghĩa cơ cấu/role/scope (`org-governance`),
khung kỹ năng (`talent-framework`), org chart/import hàng loạt/custom field/
đồng bộ HRM ngoài (P2).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo/chuyển đổi/bổ sung/cập nhật hồ sơ, gộp trùng, rà soát thiếu dữ liệu | Có |
| HR reviewer | người | Review và kích hoạt hồ sơ, duyệt yêu cầu cập nhật và gộp hồ sơ | Có |
| Nhân viên | người | Xem hồ sơ của mình, tự sửa whitelist, gửi yêu cầu trường hạn chế | Có |
| Quản lý | người | Xem trường cơ bản của người trong phạm vi quản lý | Có |
| Admin | người | Kiểm chứng quyền, truy vết thay đổi | Có |
| Ứng viên | người | Nguồn dữ liệu trước chuyển đổi | Không (không có giao diện ở feature này) |
| `cv-intake` / `offer-management` / `employee-onboarding` | hệ thống (feature khác) | Cung cấp dữ liệu nguồn đã xác nhận và điểm chuyển đổi | Không (upstream data source) |
| `employment-lifecycle` | hệ thống (feature khác) | Báo nghỉ việc để hồ sơ chuyển LUU_TRU | Không (consumer/trigger bên ngoài) |
| `talent-framework` | hệ thống (feature khác) | Cung cấp taxonomy kỹ năng để gắn | Không (tham chiếu) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-employee-profiles-001 | Tạo hồ sơ thủ công | Khi HR tạo hồ sơ mới, hệ thống phải ghi nhận các nhóm trường (thông tin cá nhân/liên hệ, giấy tờ định danh, vị trí, phòng ban, manager, ngày bắt đầu) và đặt trạng thái ban đầu NHAP | P0 | demo | PRD Mục 7.3; brainstorm Mục 4 |
| FR-employee-profiles-002 | Chuyển đổi từ ứng viên | Khi application có offer đã chấp nhận, hệ thống phải cho HR tạo hồ sơ prefill từ dữ liệu CV đã xác nhận (tên, liên hệ, giấy tờ) và offer (vị trí, phòng ban, ngày bắt đầu), giữ tham chiếu nguồn | P0 | test | PRD Mục 7.3 (luồng chính); URD UN-001 |
| FR-employee-profiles-003 | Kiểm tra trùng trước khi tạo | Khi tạo hồ sơ (tay hoặc chuyển đổi), hệ thống phải kiểm tra trùng theo email / số định danh / số điện thoại và hiện cảnh báo kèm hồ sơ hiện có; người tạo chọn gộp / tạo mới / hủy; định danh trùng nhưng tên khác phải cảnh báo mạnh hơn | P0 | test | PRD Mục 7.3 (rủi ro chính); URD UN-002 |
| FR-employee-profiles-004 | Checklist trường bắt buộc | Khi hồ sơ còn thiếu trường bắt buộc, hệ thống phải giữ trạng thái NHAP và liệt kê trường thiếu; chỉ khi đủ mới cho phép gửi review | P0 | test | PRD Mục 7.3 (đo thành công); brainstorm Mục 7.1 |
| FR-employee-profiles-005 | Gửi review và kích hoạt | Khi người tạo gửi review, hệ thống phải chuyển hồ sơ CHO_DUYET và đưa vào hàng chờ reviewer; khi reviewer kích hoạt, hồ sơ chuyển HOAT_DONG + audit + thông báo nhân viên; khi reviewer trả về kèm ghi chú, hồ sơ về NHAP | P0 | test | PRD Mục 7.3 (luồng chính); URD UN-004 |
| FR-employee-profiles-006 | Gợi ý re-hire | Nếu hồ sơ trùng là hồ sơ LUU_TRU, hệ thống phải gợi ý mở lại hồ sơ đó (về CHO_DUYET) thay vì tạo hồ sơ mới | P1 | demo | brainstorm Mục 6.5; URD OQ-7 |
| FR-employee-profiles-007 | Nhân viên xem hồ sơ của mình | Hệ thống phải cho nhân viên có tài khoản xem đúng các trường được phép của hồ sơ mình; trường chỉ HR hiển thị chỉ-đọc; hồ sơ HOAT_DONG tồn tại độc lập tài khoản đăng nhập | P0 | demo | PRD Mục 7.3 (phục vụ job); URD UN-005 |
| FR-employee-profiles-008 | Tự cập nhật trường whitelist | Khi nhân viên sửa trường whitelist (điện thoại, email cá nhân, địa chỉ, liên hệ khẩn cấp, ảnh đại diện), hệ thống phải lưu ngay và ghi audit "tự cập nhật" | P0 | test | brainstorm Mục 5.2; URD UN-005 |
| FR-employee-profiles-009 | Yêu cầu cập nhật trường hạn chế | Khi nhân viên sửa trường hạn chế (tên, ngày sinh, số định danh), hệ thống phải tạo yêu cầu CHO_DUYET kèm giá trị mới + lý do; HR duyệt thì áp dụng + audit, từ chối thì giữ giá trị cũ + báo nhân viên kèm lý do | P0 | test | brainstorm Mục 5.2; URD UN-006 |
| FR-employee-profiles-010 | HR cập nhật có lý do | Khi HR sửa hồ sơ trong scope, hệ thống phải cho sửa mọi trường; nếu trường thuộc nhóm trọng yếu (vị trí, phòng ban, manager, trạng thái, định danh) thì bắt buộc lý do 10–500 ký tự trước khi lưu | P0 | test | PRD Mục 9 (audit); brainstorm Mục 7.1 |
| FR-employee-profiles-011 | Thông báo thay đổi ảnh hưởng | Khi trường ảnh hưởng trải nghiệm nhân viên bị đổi (manager, vị trí), hệ thống phải gửi thông báo cho nhân viên đó | P1 | demo | brainstorm Mục 5.3 |
| FR-employee-profiles-012 | Lịch sử thay đổi | Hệ thống phải giữ và cho xem lịch sử mọi thay đổi trên hồ sơ: ai, khi nào, trường nào, giá trị trước → sau, lý do | P0 | kiểm tra | PRD Mục 7.3 (cập nhật có audit), Mục 9 |
| FR-employee-profiles-013 | Tìm kiếm và lọc trong scope | Hệ thống phải cho tìm/lọc hồ sơ theo trạng thái, đơn vị, vị trí, manager — chỉ trả kết quả trong phạm vi quyền; trường nhạy cảm (định danh, ngày sinh) chỉ lộ cho vai trò được cấp kể cả trong kết quả tìm kiếm | P0 | test | PRD Mục 9; brainstorm Mục 4 |
| FR-employee-profiles-014 | Gộp hồ sơ trùng | Khi HR chọn gộp 2 hồ sơ, hệ thống phải hiển thị so sánh từng trường để chọn giá trị giữ lại, gửi duyệt; khi reviewer duyệt, hồ sơ phụ chuyển LUU_TRU và dữ liệu liên quan trỏ về hồ sơ chính; audit ghi cả 2 phía | P1 | test | brainstorm Mục 5.4; URD UN-010 |
| FR-employee-profiles-015 | Màn hồ sơ thiếu dữ liệu | Hệ thống phải liệt kê hồ sơ HOAT_DONG còn thiếu trường bắt buộc/khuyến nghị (kể cả khi policy đổi trường bắt buộc) và cho HR nhắc nhân viên bổ sung; hồ sơ không tự hạ trạng thái | P1 | demo | brainstorm Mục 4 (P1), Mục 6.5; URD UN-011 |
| FR-employee-profiles-016 | Gắn kỹ năng nhân viên | Hệ thống phải cho gắn kỹ năng từ taxonomy `talent-framework` lên hồ sơ, phân biệt kỹ năng tự khai và đã được xác nhận | P1 | demo | brainstorm Mục 4 (P1); reverse spec FR-TL-05 |
| FR-employee-profiles-017 | Export có log | Hệ thống phải cho export hồ sơ (CSV/PDF) theo quyền và ghi log ai export, phạm vi, thời điểm; trường nhạy cảm chỉ export cho vai trò được cấp | P1 | test | brainstorm Mục 4 (P1); PRD Mục 9 |
| FR-employee-profiles-018 | Lưu trữ và khôi phục hồ sơ | Khi nhân viên nghỉ việc (tín hiệu từ `employment-lifecycle`) hoặc bị gộp, hệ thống phải chuyển hồ sơ LUU_TRU, giữ truy vết; khôi phục chỉ qua quy trình riêng đưa về CHO_DUYET | P0 | test | brainstorm Mục 6.3; URD UN-010 |
| FR-employee-profiles-019 | Chặn tự duyệt | Khi người kích hoạt trùng người tạo hồ sơ và tổ chức còn reviewer khác, hệ thống phải chặn và yêu cầu reviewer khác; nếu chỉ có 1 reviewer thì cho phép nhưng gắn cờ "tự duyệt" trong audit | P1 | test | brainstorm Mục 6.2/OQ-4; PRD Mục 12 (human-in-the-loop) |
| FR-employee-profiles-020 | Cảnh báo sửa đồng thời | Khi hồ sơ bị cập nhật bởi người khác trong lúc đang mở sửa, hệ thống phải cảnh báo "hồ sơ vừa bị {ai} đổi" trước khi ghi đè | P1 | test | brainstorm Mục 6.4 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-employee-profiles-001 | security | Mọi truy cập hồ sơ kiểm tra org/role/data-scope, deny-by-default; trường nhạy cảm chỉ lộ cho vai trò được cấp trên mọi surface (xem, tìm kiếm, export) | P0 | 0 sự cố vượt scope được xác nhận (guardrail M-GR-01) |
| NFR-employee-profiles-002 | auditability | Mọi tạo/sửa/kích hoạt/lưu trữ/gộp/yêu cầu tự cập nhật đều có vết audit đầy đủ (ai, khi nào, trước/sau, lý do) | P0 | Truy vết được 100% sự kiện trên mẫu hồ sơ kiểm tra bất kỳ |
| NFR-employee-profiles-003 | privacy | Dữ liệu hồ sơ và lịch sử sau nghỉ việc giữ theo chính sách retention được DPO duyệt; trước khi OQ-6 PRD đóng chỉ dùng dữ liệu synthetic | P0 | Không có dữ liệu người thật trước privacy gate (PRD Mục 9) |
| NFR-employee-profiles-004 | performance | Danh sách/lọc hồ sơ trong phạm vi quyền | P1 | 95% lượt trả kết quả trong ≤3 giây ở quy mô ≤300 hồ sơ ACTIVE (giá trị đề xuất — xem OQ-8) |
| NFR-employee-profiles-005 | usability | Toàn bộ giao diện và thông báo tiếng Việt; dữ liệu hỗ trợ đầy đủ dấu tiếng Việt | P0 | Kiểm tra mẫu hồ sơ tiếng Việt có dấu lưu/hiển thị đúng |
| NFR-employee-profiles-006 | data-integrity | Không tồn tại 2 hồ sơ ACTIVE cùng một người (cùng tổ chức) sau khi kiểm tra trùng | P0 | Kiểm tra trùng 3 khóa trước mọi thao tác tạo; định danh duy nhất trong tổ chức |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-employee-profiles-001 | Mọi hồ sơ thuộc 1 tổ chức; truy cập theo org/role/data-scope, deny-by-default | Khi có bất kỳ truy cập nào vào hồ sơ | FR-employee-profiles-013 | PRD Mục 9 |
| BR-employee-profiles-002 | Hồ sơ phải đủ trường bắt buộc và qua review mới được HOAT_DONG — không có đường tắt | Khi gửi review / kích hoạt | FR-employee-profiles-004, FR-employee-profiles-005 | PRD Mục 7.3 (luồng chính) |
| BR-employee-profiles-003 | Trường trọng yếu (vị trí, phòng ban, manager, trạng thái, định danh) bắt buộc lý do 10–500 ký tự | Khi lưu thay đổi trên trường trọng yếu | FR-employee-profiles-010 | brainstorm Mục 7.1 |
| BR-employee-profiles-004 | Whitelist tự phục vụ của nhân viên gồm đúng: điện thoại, email cá nhân, địa chỉ, liên hệ khẩn cấp, ảnh đại diện; trường khác → yêu cầu duyệt hoặc chỉ-đọc | Khi nhân viên sửa hồ sơ mình | FR-employee-profiles-008, FR-employee-profiles-009 | brainstorm Mục 5.2, 7.1; danh sách chờ Head of HR chốt (URD OQ-1) |
| BR-employee-profiles-005 | Một người tối đa 1 hồ sơ ACTIVE trong 1 tổ chức | Khi tạo/kích hoạt/gộp hồ sơ | FR-employee-profiles-003, FR-employee-profiles-014 | brainstorm Mục 8 |
| BR-employee-profiles-006 | Kiểm tra trùng 3 khóa (email/định danh/SĐT) là bắt buộc trước khi tạo — không bỏ qua | Khi tạo hồ sơ bằng mọi cách | FR-employee-profiles-003 | PRD Mục 7.3 (rủi ro chính) |
| BR-employee-profiles-007 | Số định danh 9 hoặc 12 chữ số và duy nhất trong tổ chức | Khi lưu trường định danh | FR-employee-profiles-001 | brainstorm Mục 7.1 |
| BR-employee-profiles-008 | Gộp hồ sơ không tự động — luôn qua so sánh từng trường + phê duyệt | Khi thực hiện gộp | FR-employee-profiles-014 | brainstorm Mục 4 (không auto-merge) |
| BR-employee-profiles-009 | Người tạo hồ sơ không tự kích hoạt hồ sơ mình tạo khi tổ chức còn reviewer khác | Khi kích hoạt hồ sơ CHO_DUYET | FR-employee-profiles-019 | PRD Mục 12; URD OQ-4 (đề xuất) |
| BR-employee-profiles-010 | Yêu cầu tự cập nhật của nhân viên có SLA xử lý 2 ngày làm việc, quá hạn nhắc HR | Khi yêu cầu CHO_DUYET quá SLA | FR-employee-profiles-009 | brainstorm Mục 7.2 (giá trị đề xuất) |
| BR-employee-profiles-011 | Tuổi lao động tối thiểu 15 khi kích hoạt hồ sơ | Khi reviewer kích hoạt | FR-employee-profiles-005 | brainstorm Mục 7.1 (Assumption — chờ Head of HR xác nhận) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-employee-profiles-001 | Thiếu trường bắt buộc | Gửi review trên hồ sơ chưa đủ trường | minor | FR-employee-profiles-004 | Hiện "Còn {n} thông tin bắt buộc chưa có — hồ sơ chưa thể gửi duyệt" + danh sách thiếu | Bổ sung rồi gửi lại |
| E-employee-profiles-002 | Trùng hồ sơ hiện có | Tạo hồ sơ có email/định danh/SĐT trùng | major | FR-employee-profiles-003 | Hiện "Số định danh này đã thuộc hồ sơ {tên} — chọn gộp hồ sơ hoặc kiểm tra lại" + các lựa chọn | Chọn gộp / tạo mới / hủy |
| E-employee-profiles-003 | Truy cập ngoài phạm vi | Xem/sửa hồ sơ ngoài org/role/data-scope | critical | FR-employee-profiles-013 | Hiện "Bạn không có quyền cập nhật hồ sơ này"; sự kiện ghi audit | Xin cấp quyền qua admin |
| E-employee-profiles-004 | Lý do không hợp lệ | Lưu trường trọng yếu với lý do <10 hoặc >500 ký tự | minor | FR-employee-profiles-010 | Hiện "Nhập lý do thay đổi (tối thiểu 10 ký tự)" | Nhập lý do hợp lệ |
| E-employee-profiles-005 | Tự duyệt hồ sơ mình tạo | Người tạo bấm kích hoạt hồ sơ CHO_DUYET của chính mình | major | FR-employee-profiles-019 | Chặn + hiện yêu cầu reviewer khác | Chuyển reviewer khác kích hoạt |
| E-employee-profiles-006 | Sửa đồng thời | Lưu khi hồ sơ vừa được người khác cập nhật | minor | FR-employee-profiles-020 | Hiện "Hồ sơ vừa bị {ai} đổi — xem lại trước khi ghi" | Tải lại bản mới rồi sửa |
| E-employee-profiles-007 | Sửa hồ sơ LUU_TRU | Cập nhật trên hồ sơ đã lưu trữ | minor | FR-employee-profiles-018 | Chặn sửa, chỉ cho xem; gợi ý quy trình khôi phục | Khôi phục về CHO_DUYET trước |
| E-employee-profiles-008 | Định danh sai định dạng | Nhập số định danh không phải 9/12 chữ số hoặc trùng | minor | FR-employee-profiles-001 | Hiện lỗi tại field định danh | Nhập lại đúng định dạng |
| E-employee-profiles-009 | Offer bị hủy giữa review | Hồ sơ CHO_DUYET từ chuyển đổi mà offer bị hủy | major | FR-employee-profiles-005 | Hồ sơ CHO_DUYET hiện cảnh báo nguồn đã hủy | Reviewer quyết định kích hoạt hoặc hủy kèm ghi chú |
| E-employee-profiles-010 | Duyệt yêu cầu trên giá trị đã đổi | HR duyệt yêu cầu tự cập nhật khi trường đó đã bị sửa khác | minor | FR-employee-profiles-009 | Hiện giá trị hiện tại kèm cảnh báo trước khi quyết định | HR xem giá trị hiện tại rồi duyệt/từ chối |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-employee-profiles-01 | Hồ sơ ACTIVE đủ trường bắt buộc | Tỷ lệ hồ sơ ACTIVE đủ trường / tổng ACTIVE | ≥95% (đề xuất — chờ Product owner, PRD OQ-1/OQ-2) |
| SC-employee-profiles-02 | Chuyển đổi không nhập lại dữ liệu nguồn | Tỷ lệ trường prefill giữ nguyên / trường prefill | ≥80% |
| SC-employee-profiles-03 | Kích hoạt nhanh sau offer | Thời gian offer chấp nhận → HOAT_DONG | ≤1 ngày làm việc |
| SC-employee-profiles-04 | Không truy cập vượt quyền | Số incident vượt scope xác nhận | 0 (guardrail M-GR-01) |
| SC-employee-profiles-05 | Thay đổi trọng yếu có vết | Tỷ lệ thay đổi trường trọng yếu có lý do + audit | 100% |
| SC-employee-profiles-06 | Yêu cầu tự cập nhật đúng hạn | Tỷ lệ yêu cầu có quyết định trong SLA 2 ngày làm việc | ≥90% (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Hồ sơ nhân viên (EMPLOYEE_PROFILE)__ — thông tin cá nhân/liên hệ/định
  danh, vị trí, phòng ban, manager, ngày bắt đầu, trạng thái bản ghi
  (NHAP/CHO_DUYET/HOAT_DONG/LUU_TRU), tham chiếu nguồn ứng viên.
- __Yêu cầu cập nhật (PROFILE_CHANGE_REQUEST)__ — yêu cầu sửa trường hạn
  chế của nhân viên: trường, giá trị cũ/mới, lý do, quyết định.
- __Sự kiện audit hồ sơ (PROFILE_AUDIT_EVENT)__ — vết mọi thay đổi: ai,
  trường, trước/sau, lý do, hành động.
- __Gộp hồ sơ (PROFILE_MERGE)__ — phiên gộp 2 hồ sơ trùng có phê duyệt.
- __Kỹ năng nhân viên (EMPLOYEE_SKILL)__ — gắn kỹ năng taxonomy, tự khai
  hay đã xác nhận.
- __Tham chiếu ngoài__ — `USER` (account-access/org-governance), `POSITION`,
  `ORGANIZATION_UNIT` (org-governance), `SKILL` (talent-framework),
  `APPLICATION` (candidate-pipeline — nguồn chuyển đổi).

Chi tiết quan hệ + thuộc tính ở `srs/employee-profiles-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Offer chấp nhận → tạo hồ sơ prefill → kiểm trùng → bổ sung →
  gửi review → kích hoạt HOAT_DONG.
- __Flow 2:__ Nhân viên xem hồ sơ → sửa whitelist (lưu ngay) hoặc gửi yêu
  cầu trường hạn chế → HR duyệt/từ chối.
- __Flow 3:__ HR sửa hồ sơ → trường trọng yếu bắt buộc lý do → audit →
  thông báo nhân viên khi ảnh hưởng.
- __Flow 4:__ Cảnh báo trùng → so sánh 2 hồ sơ → duyệt gộp → phụ LUU_TRU.
- __Flow 5:__ Nghỉ việc (từ employment-lifecycle) → hồ sơ LUU_TRU; re-hire
  → mở lại về CHO_DUYET.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __profile-list__ — danh sách hồ sơ + lọc trạng thái/đơn vị/vị trí/manager.
- __profile-detail__ — hồ sơ đầy đủ theo quyền + timeline thay đổi.
- __profile-create__ — tạo tay hoặc chuyển đổi từ ứng viên, prefill + cảnh
  báo trùng.
- __review-queue__ — hàng chờ hồ sơ CHO_DUYET và yêu cầu tự cập nhật.
- __my-profile__ — nhân viên xem/sửa whitelist + gửi yêu cầu trường hạn chế.
- __merge-review__ — so sánh từng trường 2 hồ sơ + chọn giá trị giữ.
- __missing-data__ — hồ sơ ACTIVE thiếu trường + nhắc nhân viên.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi hồ sơ thuộc 1 tổ chức; truy cập theo org/role/data-scope, deny-by-default | PRD Mục 9 — Security owner |
| Audit mọi action nhạy cảm (tạo, sửa trọng yếu, kích hoạt, gộp, lưu trữ, export) | PRD Mục 9 — Security owner |
| Feature `Should` — không thuộc cam kết v1; roadmap mở rộng cần sponsor duyệt | PRD Mục 6.1, 7 — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Human-in-the-loop: kích hoạt/gộp/từ chối yêu cầu là quyết định của người có quyền | PRD Mục 12 — Product owner |
| Trường bắt buộc + whitelist tự phục vụ là quyết định nghiệp vụ | brainstorm Mục 7.1 — Head of HR (chờ xác nhận) |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Cơ cấu đơn vị/vị trí/role/scope để gán và kiểm quyền | `org-governance` (phụ thuộc khai báo #2) | Mọi gán phòng ban/manager và kiểm tra quyền |
| Dữ liệu CV đã xác nhận để prefill | `cv-intake` | Prefill chuyển đổi (vẫn tạo tay được) |
| Offer đã chấp nhận + dữ liệu offer | `offer-management` / `employee-onboarding` | Điểm chuyển đổi tự nhiên (fallback: tạo tay) |
| Tài khoản đăng nhập liên kết 1-1 với hồ sơ | `account-access` | Self-service của nhân viên |
| Taxonomy kỹ năng | `talent-framework` | FR-employee-profiles-016 (P1) |
| Tín hiệu nghỉ việc để chuyển LUU_TRU | `employment-lifecycle` | FR-employee-profiles-018 nhánh nghỉ việc |
| Kênh thông báo cho nhân viên | `contextual-notifications` | FR-employee-profiles-011, nhắc thiếu dữ liệu |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Mỗi người 1 hồ sơ ACTIVE trong 1 tổ chức; tài khoản liên kết 1-1 | FR-employee-profiles-003/005 thiếu nền chặn trùng |
| Dữ liệu CV/offer đã xác nhận là nguồn prefill đáng tin | FR-employee-profiles-002 prefill sai — phải review lại toàn bộ |
| Người tạo không tự kích hoạt khi còn reviewer khác | FR-employee-profiles-019 vô nghĩa, review thành hình thức |
| Hồ sơ HOAT_DONG tồn tại độc lập tài khoản đăng nhập | FR-employee-profiles-007 buộc có tài khoản trước — chặn onboarding |
| Giới hạn số (25 hồ sơ/trang, lý do 10–500 ký tự, SLA 2 ngày, ≤300 ACTIVE) là chuẩn được chấp nhận | FR-employee-profiles-010/013 và NFR-employee-profiles-004 đổi ngưỡng |
| Trạng thái vòng đời việc làm sống ở `employment-lifecycle`; hồ sơ chỉ giữ trạng thái bản ghi | Chồng 2 nguồn trạng thái — không rõ source of truth |

## 12. Open Questions

- [x] OQ-1: Ai duyệt danh sách trường bắt buộc và whitelist tự phục vụ? —
  Resolved (đề xuất): Head of HR — chờ xác nhận (URD OQ-1).
- [x] OQ-2: Retention hồ sơ/lịch sử sau nghỉ việc? — Resolved (đề xuất):
  giữ LUU_TRU để truy vết, thời hạn theo chính sách DPO; trước khi OQ-6
  PRD đóng chỉ synthetic — chờ DPO/legal xác nhận (PRD OQ-6).
- [x] OQ-3: Nhân viên sửa trường định danh qua yêu cầu hay chỉ HR? —
  Resolved: qua yêu cầu chờ HR duyệt (URD OQ-3).
- [x] OQ-4: Người tạo có được tự kích hoạt? — Resolved (đề xuất): không khi
  còn reviewer khác; ngoại lệ 1-reviewer gắn cờ "tự duyệt" — chờ Head of HR.
- [x] OQ-5: Quy tắc gộp — ai duyệt, dữ liệu nào ưu tiên? — Resolved (đề
  xuất): reviewer HR; mặc định giá trị hồ sơ chính, chọn lại từng trường;
  liên kết trỏ về chính — chờ Head of HR.
- [x] OQ-6: Target tỷ lệ hồ sơ đủ trường? — Resolved (đề xuất): ≥95%
  ACTIVE, rolling hàng tuần — chờ Product owner (PRD OQ-1/OQ-2).
- [x] OQ-7: Re-hire tạo mới hay mở lại? — Resolved: mở lại LUU_TRU về
  CHO_DUYET (URD OQ-7).
- [x] OQ-8: Ngưỡng hiệu năng và giới hạn số (≤300 ACTIVE, 25/trang, ≤3 giây,
  SLA 2 ngày) có được owner chấp nhận? — Resolved (đề xuất): chấp nhận làm
  chuẩn slice này — chờ Product owner xác nhận.
