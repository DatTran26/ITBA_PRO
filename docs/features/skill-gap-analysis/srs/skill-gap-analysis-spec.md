---
type: srs
feature: skill-gap-analysis
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/skill-gap-analysis/brainstorms/skill-coverage-and-gap-review.md
---

# skill-gap-analysis — Software Requirements Specification

> Scope: phân tích độ phủ kỹ năng — so năng lực đã xác nhận của cá
> nhân/nhóm với khung kỳ vọng vị trí đã công bố theo công thức được
> business owner duyệt; run có provenance, qua reviewer xác nhận trước
> khi tạo action đào tạo/điều phối/đánh giá bổ sung. Source chính: PRD
> Mục 7.34 (priority Should, "Chưa làm": ranking công khai, quyết định
> nhân sự tự động), reverse spec `talent-and-crm`, brainstorm
> `skill-coverage-and-gap-review`, URD `skill-gap-analysis-urd`.

## 1. Scope

### In Scope

- Lần phân tích (run) cho một nhân viên hoặc một đơn vị/nhóm trong
  scope: chọn đối tượng, chọn chuẩn, tính coverage và lưu snapshot kèm
  provenance.
- Breakdown theo kỹ năng: level yêu cầu vs đã xác nhận, trạng thái
  đạt/dưới-yêu-cầu/vượt/chưa-đánh-giá, cờ bắt buộc, % coverage, kỹ
  năng thiếu.
- Drill evidence: nguồn level, thời điểm xác nhận, nhãn "dữ liệu cũ".
- Group coverage: số người đạt/tổng theo kỹ năng, kỹ năng thiếu phổ
  biến; drill thành viên trong scope; không bảng xếp hạng.
- Vòng đời duyệt cho công thức coverage (business owner); run ghi
  phiên bản công thức và khung đã áp.
- Xác nhận run của reviewer trước khi tạo action; action có mô tả,
  owner, hạn, trạng thái.
- Nhân viên xem gap của chính mình (phần công bố); so sánh hai run;
  cảnh báo khung/level mới; xuất CSV trong scope; audit truy cập.

### Out of Scope

- Ranking công khai / bảng xếp hạng nhân viên (PRD Mục 7.34 "Chưa làm").
- Quyết định nhân sự tự động (lương, thăng chức, kỷ luật, điều chuyển
  bắt buộc) từ kết quả phân tích.
- Ghi nhận/đánh giá level kỹ năng — thuộc `employee-evaluation`.
- Định nghĩa taxonomy, thang level, khung vị trí — thuộc
  `talent-framework`.
- Sở hữu hồ sơ nhân viên / hồ sơ năng lực gốc — thuộc
  `employee-profiles`.
- Nhóm ad-hoc ngoài đơn vị tổ chức — hướng mở rộng (OQ-1).
- Đề xuất đào tạo bằng AI, dashboard xu hướng (giao
  `management-reporting`) — hướng P2.
- Task đầy đủ cho action (kanban) — first release action chỉ có owner/
  hạn/trạng thái; liên kết `kanban-workspaces` là mở rộng sau.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Quản lý | người | Tạo run cho cấp dưới/team trong scope, đọc breakdown + evidence, tạo action | Có |
| HR | người | Chạy phân tích nhiều nhóm, soạn công thức, phân công reviewer khi reviewer vắng | Có |
| Reviewer (quản lý trực tiếp / quản lý đơn vị) | người | Xem kết quả run và xác nhận hoặc trả ghi chú trước khi action được tạo | Có |
| Business owner (Head of HR / người được gán) | người | Soạn/duyệt/công bố công thức coverage, weight, threshold | Có |
| Nhân viên | người | Xem gap của chính mình ở phần công bố và action được giao | Có (chỉ phần self-view) |
| Admin / `org-governance` | người/hệ thống (feature khác) | Phân quyền scope, truy vết audit | Không (owner bên ngoài, feature này chỉ dùng kết quả) |
| `employee-profiles` | hệ thống (feature khác) | Cung cấp hồ sơ năng lực với level "đã xác nhận" | Không (nguồn đọc) |
| `talent-framework` | hệ thống (feature khác) | Cung cấp khung vị trí "đã-công-bố", thang level, skill | Không (nguồn đọc) |
| `employee-evaluation` | hệ thống (feature khác) | Cung cấp kết quả đánh giá đã xác nhận làm evidence | Không (nguồn đọc) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-skill-gap-analysis-001 | Tạo run và chọn chuẩn | Khi quản lý/HR tạo run cho một nhân viên hoặc một đơn vị trong scope, hệ thống phải cho chọn chuẩn là bất kỳ khung vị trí "đã-công-bố" (mặc định khung của vị trí hiện tại, OQ-7) và chặn với hướng dẫn khi đối tượng chưa có khung "đã-công-bố" hoặc ngoài scope | P0 | test | PRD Mục 7.34; URD UN-001, UN-002 |
| FR-skill-gap-analysis-002 | Tính coverage và snapshot | Khi run được tạo, hệ thống phải tính và lưu: đối tượng, khung đã áp, phiên bản công thức, từng kỹ năng (yêu cầu, đã xác nhận, trạng thái, cờ bắt buộc, nguồn), % coverage, và thành viên thiếu dữ liệu (run nhóm) | P0 | test | PRD Mục 7.34; URD UN-001 |
| FR-skill-gap-analysis-003 | Chỉ level đã xác nhận vào mẫu | Hệ thống phải chỉ dùng level "đã xác nhận" từ hồ sơ năng lực để tính coverage; kỹ năng chưa có level xác nhận được đánh dấu "chưa-đánh-giá" riêng, không suy thành level 0 | P0 | test | brainstorm D7; URD UN-007 |
| FR-skill-gap-analysis-004 | Drill evidence | Hệ thống phải cho mở evidence của từng dòng gap: kết quả đánh giá hoặc bản ghi thủ công làm nguồn, thời điểm xác nhận, người xác nhận; không có nguồn → "chưa đánh giá" | P0 | demo | PRD Mục 7.34 (drill evidence); URD UN-003 |
| FR-skill-gap-analysis-005 | Vòng đời công thức qua duyệt | Hệ thống phải quản công thức coverage theo bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng; chỉ owner được công bố; chỉ bản "đã-công-bố" được áp cho run mới; run ghi phiên bản đã áp; phiên bản cũ giữ cho run cũ | P0 | test | PRD Mục 7.34 (rủi ro), R-13, OQ-11; URD UN-004 |
| FR-skill-gap-analysis-006 | Reviewer xác nhận run | Khi run tính xong, hệ thống phải đưa vào hàng chờ reviewer (quản lý trực tiếp/quản lý đơn vị); reviewer xem toàn bộ breakdown + evidence rồi "Xác nhận" → "đã-xác-nhận" hoặc trả ghi chú → run ở "đã-tính" kèm yêu cầu | P0 | test | PRD Mục 7.34 (review trước action); URD UN-005 |
| FR-skill-gap-analysis-007 | Trạng thái run | Hệ thống phải duy trì vòng đời run: đã-tính → đã-xác-nhận → đã-thay-thế; run "đã-xác-nhận" bất biến — sai nguồn thì tạo run mới và đánh dấu run cũ "đã-thay-thế" kèm liên kết | P0 | test | brainstorm D5; URD UN-009 |
| FR-skill-gap-analysis-008 | Tạo action từ run đã xác nhận | Hệ thống phải cho tạo action (đào tạo/điều phối/đánh giá bổ sung) cho một dòng gap hoặc cả nhóm, chỉ từ run "đã-xác-nhận"; action có mô tả, owner, hạn, trạng thái mở → đang-làm → xong / hủy (lý do bắt buộc) | P0 | test | PRD Mục 7.34; URD UN-006 |
| FR-skill-gap-analysis-009 | Nhân viên xem gap của mình | Hệ thống phải cho nhân viên xem trạng thái kỹ năng của mình theo khung vị trí, action được giao, kèm nhãn "căn cứ tham khảo — không phải quyết định nhân sự"; chặn và audit khi cố xem phân tích của người khác | P1 | test | URD UN-008; OQ-2 (PRD OQ-8) |
| FR-skill-gap-analysis-010 | Group coverage | Với run nhóm, hệ thống phải hiển thị số người đạt/tổng theo từng kỹ năng, kỹ năng thiếu phổ biến, danh sách thành viên thiếu dữ liệu (thiếu khung / chưa đánh giá) riêng, và drill thành viên chỉ trong scope — không bảng xếp hạng | P0 | test | PRD Mục 7.34 (group coverage); URD UN-002, UN-007 |
| FR-skill-gap-analysis-011 | Cảnh báo dữ liệu mới | Khi khung/công thức/level đã xác nhận thay đổi sau run, hệ thống phải hiện cảnh báo "có dữ liệu mới — tạo phân tích mới" trên run cũ và cho phép tạo run mới; run cũ giữ snapshot | P1 | demo | URD UN-009 |
| FR-skill-gap-analysis-012 | So sánh hai run | Hệ thống phải cho so sánh hai run cùng đối tượng: chênh lệch % coverage và kỹ năng đổi trạng thái giữa hai thời điểm | P1 | demo | brainstorm Mục 4 (P1); OQ-5 |
| FR-skill-gap-analysis-013 | Xuất và audit truy cập | Hệ thống phải cho xuất CSV trong scope (giới hạn 10.000 dòng — OQ-5) và ghi audit cho mọi lượt xem, xuất, xác nhận run | P1 | kiểm tra | PRD Mục 9 (audit); URD UN-010, UN-012 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-skill-gap-analysis-001 | auditability | Mọi run phải ghi provenance: khung đã áp, phiên bản công thức, thời điểm tính, nguồn level từng dòng; mọi lượt xem/xuất/xác nhận có vết audit | P0 | Kiểm tra mẫu run bất kỳ truy nguyên được 100% provenance và vết truy cập |
| NFR-skill-gap-analysis-002 | performance | Tính run cho nhóm ≤300 thành viên (ngưỡng đề xuất OQ-5) trong thời gian chấp nhận được cho tác vụ phân tích | P1 | Run 300 thành viên hoàn tất ≤5 phút (giá trị đề xuất — chờ OQ-5) |
| NFR-skill-gap-analysis-003 | data-integrity | Feature chỉ đọc `employee-profiles`, `talent-framework`, `employee-evaluation`, `org-governance`; không ghi ngược nguồn ngoài | P0 | Không có write-path nào tới entity của feature khác trong review/thiết kế |
| NFR-skill-gap-analysis-004 | compliance | Không surface ranking/xếp hạng hay quyết định nhân sự tự động; mọi màn kết quả mang nhãn "căn cứ tham khảo" | P0 | Kiểm tra toàn bộ surface: không có thứ hạng/sắp xếp nhân viên; nhãn hiện ở mọi màn kết quả |
| NFR-skill-gap-analysis-005 | privacy | Chỉ dữ liệu synthetic trước khi privacy gate (PRD Mục 9, OQ-3/OQ-6) đạt | P0 | 0 bản ghi nhân sự thật trong môi trường chưa được duyệt |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-skill-gap-analysis-001 | Chỉ công thức "đã-công-bố" được áp cho run mới; khi chưa có công thức nào được duyệt thì không tạo được run | Khi tạo run | FR-skill-gap-analysis-005 | brainstorm D3, R-13; URD Journey 3 |
| BR-skill-gap-analysis-002 | Chỉ khung vị trí "đã-công-bố" được làm chuẩn; thành viên thiếu khung bị loại khỏi mẫu và liệt kê riêng | Khi chọn chuẩn / tính run nhóm | FR-skill-gap-analysis-001, FR-skill-gap-analysis-010 | PRD Mục 7.34; URD Mục 6 |
| BR-skill-gap-analysis-003 | Chỉ level "đã xác nhận" vào tính coverage; "chưa-đánh-giá" là trạng thái riêng, không suy thành level 0 | Khi tính từng kỹ năng | FR-skill-gap-analysis-003 | brainstorm D7 |
| BR-skill-gap-analysis-004 | Action chỉ được tạo từ run "đã-xác-nhận" — con người phải xem kết quả trước khi hành động | Khi tạo action | FR-skill-gap-analysis-006, FR-skill-gap-analysis-008 | PRD Mục 7.34 (luồng + đo thành công), Mục 12 |
| BR-skill-gap-analysis-005 | Reviewer phải thuộc scope và không phải đối tượng của run; reviewer mặc định là quản lý trực tiếp/quản lý đơn vị | Khi gán/xác nhận run | FR-skill-gap-analysis-006 | brainstorm D5; URD Assumption |
| BR-skill-gap-analysis-006 | Run "đã-xác-nhận" là snapshot bất biến; sửa bằng run mới và đánh dấu run cũ "đã-thay-thế" kèm lý do và liên kết | Khi có yêu cầu sửa kết quả đã xác nhận | FR-skill-gap-analysis-007, FR-skill-gap-analysis-011 | brainstorm D5; URD UN-009 |
| BR-skill-gap-analysis-007 | Chỉ dữ liệu synthetic trước khi privacy gate đạt; dữ liệu nhân sự thật chỉ dùng sau khi OQ-3/OQ-6 PRD được duyệt | Khi vận hành feature trên dữ liệu thật | FR-skill-gap-analysis-001 | PRD Mục 9, OQ-3/OQ-6; brainstorm Mục 10 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-skill-gap-analysis-001 | Đối tượng chưa có khung đã công bố | Tạo run cá nhân cho vị trí chưa có khung "đã-công-bố" | major | FR-skill-gap-analysis-001 | Hiện "Vị trí này chưa có khung kỹ năng đã công bố — chọn khung khác hoặc công bố khung trước" | Chọn khung khác / nhờ talent-framework công bố |
| E-skill-gap-analysis-002 | Chưa có công thức được duyệt | Tạo run khi chưa có công thức "đã-công-bố" | major | FR-skill-gap-analysis-005 | Hiện "Chưa có công thức độ phủ đã công bố — gửi duyệt công thức trước khi phân tích" | Soạn + gửi duyệt công thức |
| E-skill-gap-analysis-003 | Đối tượng ngoài scope | Chọn nhân viên/đơn vị ngoài scope được cấp | major | FR-skill-gap-analysis-001 | Hiện "Bạn không có quyền phân tích đối tượng này"; sự kiện ghi audit | Chọn đối tượng trong scope / xin cấp quyền |
| E-skill-gap-analysis-004 | Nhóm vượt giới hạn | Run nhóm >300 thành viên (ngưỡng đề xuất OQ-5) | minor | FR-skill-gap-analysis-010 | Hiện "Nhóm vượt quá 300 thành viên — chia nhỏ đơn vị hoặc chạy từng phần" | Chia nhỏ đơn vị phân tích |
| E-skill-gap-analysis-005 | Action từ run chưa xác nhận | Tạo action khi run ở "đã-tính" | major | FR-skill-gap-analysis-008 | Hiện "Kết quả phân tích cần được người xác nhận duyệt trước khi tạo hành động" | Chờ reviewer xác nhận |
| E-skill-gap-analysis-006 | Action thiếu trường bắt buộc | Lưu action thiếu mô tả hoặc owner | minor | FR-skill-gap-analysis-008 | Form hiện lỗi tại field + "Vui lòng nhập mô tả và chọn người chịu trách nhiệm" | Bổ sung rồi lưu lại |
| E-skill-gap-analysis-007 | Quá giới hạn action mở | Tạo action mở thứ 21 trên cùng run (ngưỡng đề xuất OQ-5) | minor | FR-skill-gap-analysis-008 | Hiện "Run này đã có 20 hành động đang mở — hoàn tất hoặc hủy bớt trước khi thêm" | Đóng/hủy action cũ |
| E-skill-gap-analysis-008 | Hủy action không lý do | Bấm "Hủy" mà không nhập lý do | minor | FR-skill-gap-analysis-008 | Hiện "Vui lòng nhập lý do hủy" | Nhập lý do rồi hủy |
| E-skill-gap-analysis-009 | Xuất vượt giới hạn | Xuất CSV >10.000 dòng (ngưỡng đề xuất OQ-5) | minor | FR-skill-gap-analysis-013 | Hiện "Kết quả vượt 10.000 dòng — lọc thu hẹp phạm vi hoặc xuất theo kỹ năng" | Lọc hẹp rồi xuất lại |
| E-skill-gap-analysis-010 | Thay thế run không lý do | "Đánh dấu thay thế" mà không nhập lý do, hoặc bởi người không có quyền | minor | FR-skill-gap-analysis-011 | Hiện "Vui lòng nhập lý do đánh dấu thay thế" / "Bạn không có quyền cập nhật run này" | Người tạo/quản lý nhập lý do |
| E-skill-gap-analysis-011 | Nhân viên xem run của người khác | Truy cập run/đối tượng không phải của mình | major | FR-skill-gap-analysis-009 | Hiện "Bạn chỉ có thể xem phân tích của chính mình"; sự kiện ghi audit | Quay lại màn self-view |
| E-skill-gap-analysis-012 | Reviewer vắng / ngoài scope | Run chờ xác nhận quá lâu hoặc reviewer mất scope | major | FR-skill-gap-analysis-006 | Hàng chờ hiện cảnh báo; HR thấy run cần phân công | HR phân công reviewer khác trong scope |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-skill-gap-analysis-01 | Gap được reviewer xác nhận và dẫn tới action phù hợp | Tỷ lệ run "đã-xác-nhận" có ≥1 action / tổng run "đã-xác-nhận" | ≥70% sau 1 quý pilot (đề xuất — target chính thức chờ OQ-1/OQ-2 PRD; USC-001) |
| SC-skill-gap-analysis-02 | Run nào cũng có provenance chuẩn | Tỷ lệ run ghi phiên bản công thức + khung đã áp | 100% (USC-002) |
| SC-skill-gap-analysis-03 | Action chỉ sinh từ kết quả đã xem | Tỷ lệ action trỏ run "đã-xác-nhận" | 100% (USC-003) |
| SC-skill-gap-analysis-04 | Action được theo đến cùng | Tỷ lệ action đóng (xong/hủy có lý do) trong hạn | ≥80% sau 1 quý pilot (đề xuất — USC-004) |
| SC-skill-gap-analysis-05 | Không lộ kết quả ngoài phạm vi | Số incident xem/xuất vượt scope được xác nhận | 0 (guardrail bám M-GR-01; USC-005) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Lần phân tích (GAP_RUN)__ — đối tượng cá nhân/nhóm, chuẩn và công
  thức đã áp, trạng thái review, reviewer, provenance thay thế.
- __Thành viên run (GAP_RUN_MEMBER)__ — nhân viên được tính, khung áp
  riêng, trạng thái đủ/thiếu dữ liệu, % coverage cá nhân.
- __Kết quả kỹ năng (GAP_SKILL_RESULT)__ — yêu cầu vs đã xác nhận theo
  thang level, trạng thái gap, cờ bắt buộc, nguồn và nhãn dữ liệu cũ.
- __Công thức coverage (COVERAGE_RULE)__ — cách tính %, trọng số bắt
  buộc, xử lý "chưa-đánh-giá"; vòng đời duyệt, phiên bản, owner.
- __Hành động (GAP_ACTION)__ — đào tạo/điều phối/đánh giá bổ sung từ
  run đã xác nhận, có owner, hạn, trạng thái, lý do hủy.
- __Tham chiếu ngoài__ — `EMPLOYEE_PROFILE`, `EMPLOYEE_SKILL`
  (`employee-profiles`), `POSITION_FRAMEWORK`, `SKILL`,
  `SKILL_LEVEL_SCALE` (`talent-framework`), `SKILL_EVALUATION`
  (`employee-evaluation`), `USER` (`account-access`/`org-governance`):
  khai tối thiểu, chỉ đọc.

Chi tiết quan hệ + thuộc tính ở `srs/skill-gap-analysis-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Chọn nhân viên + chuẩn → tính coverage → reviewer xác
  nhận → tạo action cho dòng gap.
- __Flow 2:__ Chọn đơn vị → tính từng thành viên (thiếu dữ liệu liệt
  kê riêng) → coverage nhóm → reviewer xác nhận → action nhóm.
- __Flow 3:__ HR soạn công thức → owner duyệt → "đã-công-bố" → áp cho
  run mới.
- __Flow 4:__ Nhân viên mở "Kỹ năng của tôi so với vị trí" → xem phần
  công bố + action được giao.
- __Flow 5:__ Khung/công thức/level đổi → cảnh báo "có dữ liệu mới" →
  run mới; run cũ "đã-thay-thế" giữ snapshot.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __run-create__ — chọn đối tượng (cá nhân/đơn vị) + chuẩn khung.
- __run-result__ — breakdown kỹ năng + % coverage + drill evidence +
  nhãn "căn cứ tham khảo".
- __review-queue__ — hàng chờ run "đã-tính" của reviewer.
- __group-coverage__ — số người đạt/tổng theo kỹ năng + danh sách thiếu
  dữ liệu (không xếp hạng).
- __rule-editor__ — soạn/gửi duyệt/công bố công thức coverage.
- __action-list__ — action của run: owner, hạn, trạng thái, hủy kèm lý
  do.
- __self-gap-view__ — "Kỹ năng của tôi so với vị trí" + action được
  giao (nhân viên).
- __run-compare__ — so sánh hai run cùng đối tượng.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Truy cập run/aggregate theo scope organization/role, deny-by-default; drill chỉ trong scope | PRD Mục 9 — Security owner; `org-governance` |
| Action chỉ từ run "đã-xác-nhận" — con người xem kết quả trước khi hành động | PRD Mục 7.34, Mục 12 — Product owner |
| Chỉ level "đã xác nhận" vào mẫu; chỉ khung/công thức "đã-công-bố" làm chuẩn | brainstorm D3, D7 — Head of HR |
| Kết quả luôn mang nhãn "căn cứ tham khảo, không phải quyết định nhân sự"; cấm ranking | PRD Mục 7.34 "Chưa làm" — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate đạt | PRD Mục 9, OQ-3/OQ-6 — DPO |
| Giao diện tiếng Việt | URD Mục 7 — Product owner |

__Dependencies (phụ thuộc):__

| Phụ thuộc | Dùng cho | Rủi ro nếu thiếu |
|-----------|----------|------------------|
| `employee-profiles` — hồ sơ năng lực với level "đã xác nhận" (ghi bởi `employee-evaluation`) | Nguồn level duy nhất vào tính coverage | Coverage không tính được → "chưa-đánh-giá" toàn bộ |
| `talent-framework` — khung vị trí "đã-công-bố", thang level chung, skill | Chuẩn so sánh và tên/level hiển thị | Chặn run / mẫu tính thu hẹp |
| `employee-evaluation` — kết quả đánh giá đã xác nhận | Drill evidence sâu cho dòng gap | Evidence chỉ tới hồ sơ năng lực, không tới phiên đánh giá |
| `org-governance` — scope, đơn vị, audit | Quyền xem/xuất/phân tích, drill trong scope, "nhóm" | Không kiểm soát được phạm vi dữ liệu nhạy cảm |
| `account-access` — USER | Tạo run, reviewer, owner action | Không gán trách nhiệm được |
| `kanban-workspaces` (mở rộng sau) | Action thành task đầy đủ | Action chỉ ở mức owner/hạn/trạng thái |

__Assumptions (giả định — owner + hệ quả nếu sai):__

| Giả định | Owner | Hệ quả nếu sai |
|----------|-------|----------------|
| "Nhóm" = đơn vị/phòng ban của `org-governance`; nhóm ad-hoc là mở rộng | Product owner (OQ-1) | Thiếu entity nhóm và scope nếu cần nhóm tự tạo ngay |
| Business owner duyệt công thức là Head of HR (hoặc người được gán) | Head of HR (OQ-3, R-13) | Duyệt gán sai authority → con số vô chủ |
| Công thức v1: % = kỹ năng đạt/vượt trên tổng kỹ năng khung; "chưa-đánh-giá" vào mẫu số, hiển thị riêng | Head of HR (OQ-4) | Con số coverage đổi toàn bộ nếu công thức khác |
| Reviewer mặc định: quản lý trực tiếp (cá nhân) / quản lý đơn vị (nhóm) | Head of HR (OQ-3) | Hàng chờ gán sai người |
| Ngưỡng 300 thành viên, 180 ngày dữ liệu cũ, 20 action mở/run, 10.000 dòng CSV | Head of HR (OQ-5) | Đổi giới hạn và nhãn trên màn hình |
| `GAP_SKILL_RESULT.employee_skill_id` là FK khái niệm — khóa thực của `EMPLOYEE_SKILL` là cặp profile + skill | Implementation owner | Mapping vật lý cần khóa tổ hợp khi triển khai |
| `GAP_RUN.unit_id` tham chiếu đơn vị sang `org-governance` — contract đọc đơn vị | `org-governance` owner | Run nhóm không giải được danh sách thành viên |

## 12. Open Questions

- [x] OQ-1: "Nhóm" trong phân tích nhóm là gì — đơn vị tổ chức hay nhóm
  tự tạo? — Resolved (đề xuất): first release dùng đơn vị/phòng ban của
  `org-governance`; nhóm ad-hoc là hướng mở rộng — chờ Product owner
  xác nhận.
- [x] OQ-2: Ai được xem kết quả phân tích — nhân viên có xem gap của
  mình không? — Resolved (đề xuất): quản lý/HR trong scope xem đầy đủ;
  nhân viên xem gap của chính mình ở phần công bố; không ranking — chờ
  Product owner xác nhận (PRD OQ-8).
- [x] OQ-3: Ai duyệt công thức coverage, weight và threshold? —
  Resolved (đề xuất): business owner là Head of HR (hoặc người Head of
  HR gán) — chờ Head of HR xác nhận (PRD OQ-11, R-13; OQ-TL-02 reverse
  spec).
- [x] OQ-4: Công thức coverage v1 cụ thể là gì? — Resolved (đề xuất):
  % coverage = kỹ năng đạt/vượt yêu cầu trên tổng kỹ năng khung; "chưa-
  đánh-giá" vào mẫu số nhưng hiển thị riêng; trọng số bắt buộc trong
  quy tắc do owner công bố — chờ Head of HR xác nhận.
- [x] OQ-5: Ngưỡng đề xuất (300 thành viên, dữ liệu cũ 180 ngày, 20
  action mở/run, 10.000 dòng CSV) có được duyệt? — Resolved (đề xuất):
  giữ ngưỡng — chờ Head of HR xác nhận.
- [x] OQ-6: Run bắt buộc reviewer xác nhận trước khi tạo action? —
  Resolved: có — bám luồng "tính coverage → review → tạo action" của
  PRD Mục 7.34.
- [x] OQ-7: Có cho so gap theo khung vị trí khác hiện tại không? —
  Resolved: có — chọn bất kỳ khung "đã-công-bố" làm chuẩn, mặc định
  khung vị trí hiện tại; run ghi rõ chuẩn đã áp.
- [x] OQ-8: Retention của run và action? — Resolved (đề xuất): giữ để
  truy vết/so sánh; chính thức theo OQ-6 PRD — chờ DPO.
