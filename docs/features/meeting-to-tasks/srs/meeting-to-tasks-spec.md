---
type: srs
feature: meeting-to-tasks
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/meeting-to-tasks/brainstorms/confirmed-actions-to-owned-tasks.md
  - docs/features/meeting-to-tasks/meeting-to-tasks-urd.md
  - docs/features/ai-meeting-minutes/srs/ai-meeting-minutes-spec.md
---

# meeting-to-tasks — Software Requirements Specification

## 1. Scope

SRS này cover việc chuyển đầu việc đã được chủ trì xác nhận trong biên bản
PUBLISHED thành task trên board Kanban: danh sách đầu việc kèm trạng thái
chuyển đổi, form review action (tiêu đề/mô tả chỉnh được), resolve assignee
bắt buộc thành người dùng nội bộ, chọn workspace/board đích thủ công, tạo
task có link nguồn hai chiều, chống trùng (1 đầu việc ↔ tối đa 1 task còn
hiệu lực + cảnh báo task tương tự), thông báo assignee, theo dõi trạng thái
ngược, bỏ qua đầu việc kèm lý do, tạo lại khi task nguồn bị xóa và cờ "nguồn
đã cập nhật" khi đầu việc gốc bị sửa.

Đây là feature `Should` trong theme Meetings & Work — KHÔNG thuộc cam kết
pilot v1; spec này chuẩn bị cho slice mở rộng sau v1 (PRD Mục 6.1, Feature
Map).

KHÔNG cover: tự giao việc khi người/đơn vị chưa xác định (cấm — PRD Mục 7.15
"Chưa làm"), vòng đời task/bàn giao/comment/attachment (`kanban-workspaces`),
sinh đầu việc từ transcript (`ai-meeting-minutes`), biên bản và consent
(`meeting-records`), giao việc cho người ngoài tổ chức hoặc nhóm/đơn vị (P2),
đồng bộ task ra công cụ ngoài (`external-integrations`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Chủ trì | người | Review đầu việc, resolve assignee, chọn board, tạo task, bỏ qua | Có |
| Assignee | người | Nhận thông báo, mở task, truy nguyên nguồn biên bản | Có |
| Participant | người | Xem đầu việc + trạng thái chuyển đổi trong phạm vi | Có (chỉ đọc) |
| Quản lý | người | Theo dõi đầu việc → task → trạng thái trong phạm vi | Có (chỉ đọc) |
| Admin | người | Làm thay chủ trì (ghi rõ), audit | Có (hạn chế) |
| `ai-meeting-minutes` | hệ thống | Nguồn đầu việc đã xác nhận + cờ resolve người | Có — dependency |
| `meeting-records` | hệ thống | Biên bản PUBLISHED, cuộc họp, phạm vi truy cập | Có — dependency |
| `kanban-workspaces` | hệ thống | Workspace/board/task đích, vòng đời task | Có — dependency |
| `account-access` | hệ thống | Danh bạ người dùng để resolve assignee | Có — dependency |
| `contextual-notifications` | hệ thống | Thông báo assignee | Có — dependency |
| `org-governance` | hệ thống | Phạm vi, audit | Có — dependency |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-meeting-to-tasks-001 | Danh sách đầu việc chuyển đổi | Khi biên bản ở trạng thái PUBLISHED, hệ thống phải liệt kê các đầu việc đã xác nhận (đã giữ/đã sửa/thêm tay) kèm trạng thái chuyển đổi: "chưa tạo task", "đã tạo task", "đã bỏ qua"; đầu việc trong bản đề xuất chưa xác nhận không được hiện | P0 | test | PRD Mục 7.15 (review action); brainstorm Mục 6.1 (D1) |
| FR-meeting-to-tasks-002 | Form review action | Khi chủ trì mở một đầu việc "chưa tạo task", hệ thống phải hiện form chuyển đổi với tiêu đề và mô tả lấy sẵn từ đầu việc (chỉnh được), assignee, hạn, mức ưu tiên và workspace/board đích | P0 | demo | PRD Mục 7.15; URD UN-002 |
| FR-meeting-to-tasks-003 | Resolve assignee bắt buộc | Nếu đầu việc chưa có người phụ trách là người dùng nội bộ (cờ "chưa xác định" hoặc trống), thì hệ thống phải vô hiệu tạo task cho tới khi chủ trì chọn một người dùng nội bộ còn hiệu lực; lựa chọn này ghi ngược resolved user về đầu việc | P0 | test | PRD Mục 7.15 "Chưa làm"; URD UN-003 |
| FR-meeting-to-tasks-004 | Chọn đích thủ công | Hệ thống phải bắt buộc chủ trì chọn workspace + board đích và kiểm tra quyền tạo task của chủ trì trên board đó; hệ thống chỉ gợi ý board của đơn vị sở hữu cuộc họp, không tự chọn | P0 | test | PRD Mục 7.15 "Chưa làm"; brainstorm Mục 6.1 (D3) |
| FR-meeting-to-tasks-005 | Tạo task có link nguồn | Khi chủ trì xác nhận tạo, hệ thống phải tạo task trên board đích với tiêu đề, mô tả, assignee, hạn, ưu tiên và ghi nguồn bắt buộc (cuộc họp + biên bản + đầu việc); task hiển thị link về đầu việc/biên bản và đầu việc hiển thị link sang task | P0 | test | PRD Mục 7.15 (create task, source link) |
| FR-meeting-to-tasks-006 | Chống trùng theo đầu việc | Nếu đầu việc đã có task còn hiệu lực, thì hệ thống phải chặn tạo mới và hiện link task hiện có; khi task nguồn bị xóa, đầu việc hiện "task đã xóa" và cho phép tạo lại | P0 | test | PRD Mục 7.15 rủi ro chính; brainstorm Mục 6.1 (D4) |
| FR-meeting-to-tasks-007 | Cảnh báo task tương tự | Khi tạo task, hệ thống phải kiểm tra board đích có task tiêu đề/nội dung tương tự và cảnh báo kèm link tối đa 5 task nghi trùng để chủ trì quyết tạo hay hủy | P1 | test | Brainstorm Mục 6.1 (D5); URD UN-006 |
| FR-meeting-to-tasks-008 | Thông báo assignee | Khi task được tạo, hệ thống phải gửi thông báo cho assignee qua `contextual-notifications` kèm mô tả, hạn, ưu tiên và link nguồn; thất bại thì retry theo chính sách notification và ghi log | P0 | test | PRD Mục 7.15 (thông báo); URD UN-005 |
| FR-meeting-to-tasks-009 | Trạng thái ngược trên đầu việc | Hệ thống phải hiển thị trên đầu việc "đã tạo task" trạng thái hiện tại của task (đang làm/hoàn tất/quá hạn) để chủ trì và quản lý theo dõi | P0 | demo | PRD Mục 7.15 (theo dõi); URD UN-008 |
| FR-meeting-to-tasks-010 | Bỏ qua đầu việc có lý do | Hệ thống phải cho chủ trì đánh dấu đầu việc "bỏ qua" kèm lý do bắt buộc (vd phụ trách ngoài hệ thống); đầu việc bỏ qua vẫn nằm trong biên bản và mở lại chuyển đổi được | P0 | test | Brainstorm Mục 5.2; URD UN-009 |
| FR-meeting-to-tasks-011 | Cờ nguồn đã cập nhật | Khi đầu việc nguồn bị sửa trong revision biên bản sau khi task đã tạo, hệ thống phải hiện cờ "nguồn đã cập nhật" trên task cho tới khi có người xác nhận đã đối chiếu; không tự ghi đè nội dung task | P0 | test | Brainstorm Mục 5.4, 6.1 (D8); bám OQ-9 PRD |
| FR-meeting-to-tasks-012 | Không giao cho người ngoài | Nếu người phụ trách là khách ngoài không tài khoản, thì hệ thống phải chặn tạo task và hướng dẫn đánh dấu bỏ qua kèm lý do | P0 | test | Brainstorm Mục 6.1 (D6); URD UN-003 |
| FR-meeting-to-tasks-013 | Chuyển đổi hàng loạt | Hệ thống phải cho chọn tối đa 20 đầu việc đủ điều kiện và tạo task lần lượt, báo kết quả từng mục; mục lỗi không chặn mục hợp lệ | P1 | test | Brainstorm Mục 4 (P1), 6.5 |
| FR-meeting-to-tasks-014 | Audit chuyển đổi | Hệ thống phải ghi audit cho: tạo task (ai, khi nào, đầu việc nào, board nào), resolve assignee, bỏ qua, mở lại và tạo lại | P0 | kiểm tra | PRD Mục 9, Mục 12 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-meeting-to-tasks-001 | integrity | Mỗi đầu việc có tối đa 1 task còn hiệu lực; 100% task tạo bởi feature này có link nguồn hợp lệ | P0 | Audit liên kết: 0 đầu việc có ≥2 task hiệu lực; 0 task thiếu nguồn |
| NFR-meeting-to-tasks-002 | human-in-the-loop | 100% task có assignee là người dùng nội bộ do con người chọn — không task nào được tạo khi assignee/workspace chưa xác định | P0 | Kiểm task: 0 task thiếu resolved assignee hoặc board do hệ thống tự chọn |
| NFR-meeting-to-tasks-003 | permission | Truy cập đầu việc/biên bản kế thừa scope `meeting-records`; tạo task theo quyền board của `kanban-workspaces`; deny-by-default | P0 | Access test: người ngoài phạm vi không xem/chuyển đổi được |
| NFR-meeting-to-tasks-004 | auditability | Mọi hành động chuyển đổi truy vết được (ai, khi nào, đầu việc, board, kết quả) | P0 | Truy vết đủ vết của một đầu việc mẫu từ review đến task |
| NFR-meeting-to-tasks-005 | resilience | Thông báo assignee lỗi không làm mất task đã tạo; retry theo `contextual-notifications` và log thất bại cuối | P0 | Test notification fail: task tồn tại, log retry/thất bại đầy đủ |
| NFR-meeting-to-tasks-006 | performance | Danh sách đầu việc + trạng thái chuyển đổi tải trong ≤3 giây ở cuộc họp ≤50 đầu việc | P1 | Đo thời gian tải trên mẫu pilot (giá trị đề xuất — OQ-5) |
| NFR-meeting-to-tasks-007 | data-retention | Bản ghi chuyển đổi và link nguồn giữ theo vòng đời task + biên bản; nguồn xóa thì link ghi "đã xóa" | P1 | Chính sách retention được duyệt — chờ DPO/legal (PRD OQ-6) |
| NFR-meeting-to-tasks-008 | language | Giao diện và thông báo tiếng Việt tự nhiên | P0 | Kiểm tra wording mẫu brainstorm Mục 7.3 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-meeting-to-tasks-001 | Chỉ đầu việc thuộc biên bản PUBLISHED mới được chuyển đổi — đầu việc trong bản đề xuất chưa xác nhận không phải cam kết | Mở danh sách/form chuyển đổi | FR-meeting-to-tasks-001 | PRD Mục 12, Mục 7.15 |
| BR-meeting-to-tasks-002 | Không tạo task khi assignee chưa là người dùng nội bộ cụ thể — bao gồm cả trường hợp cờ "chưa xác định" và khách ngoài | Bấm "Tạo công việc" | FR-meeting-to-tasks-003, FR-012 | PRD Mục 7.15 "Chưa làm" |
| BR-meeting-to-tasks-003 | Không tự chọn workspace/board — chủ trì chọn và phải có quyền tạo trên board đích | Chuyển đổi | FR-meeting-to-tasks-004 | PRD Mục 7.15 "Chưa làm" |
| BR-meeting-to-tasks-004 | Một đầu việc chỉ gắn tối đa 1 task còn hiệu lực; task nguồn bị xóa thì cho tạo lại | Tạo task | FR-meeting-to-tasks-006 | PRD Mục 7.15 rủi ro chính |
| BR-meeting-to-tasks-005 | Task giữ snapshot nội dung tại thời điểm tạo; sửa đầu việc nguồn chỉ bật cờ "nguồn đã cập nhật", không ghi đè | Sửa đầu việc trong revision | FR-meeting-to-tasks-011 | Brainstorm OQ-4; PRD OQ-9 |
| BR-meeting-to-tasks-006 | Một task có đúng 1 assignee người dùng nội bộ trong v1 | Gán assignee | FR-meeting-to-tasks-005 | Brainstorm Mục 8; bám `crm_tasks` nguồn |
| BR-meeting-to-tasks-007 | Chỉ chủ trì (hoặc admin theo scope làm thay, ghi rõ) khởi tạo chuyển đổi | Mở form chuyển đổi | FR-meeting-to-tasks-002 | Brainstorm OQ-1 |
| BR-meeting-to-tasks-008 | Bỏ qua đầu việc bắt buộc có lý do; đầu việc bỏ qua vẫn hiển thị trong biên bản | Đánh dấu bỏ qua | FR-meeting-to-tasks-010 | Brainstorm Mục 7.1 |
| BR-meeting-to-tasks-009 | Task bắt buộc ghi nguồn (cuộc họp + biên bản + đầu việc) — không task nào từ feature này thiếu link | Tạo task | FR-meeting-to-tasks-005 | PRD Mục 7.15 (source link) |
| BR-meeting-to-tasks-010 | Hạn task không bắt buộc nhưng khi trống phải nhắc "chưa có hạn" trước khi tạo | Tạo task không hạn | FR-meeting-to-tasks-002 | Brainstorm Mục 6.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-meeting-to-tasks-001 | Chưa resolve assignee | Bấm tạo khi đầu việc chưa có người nội bộ | major | FR-003 | Nút vô hiệu + "Chưa thể tạo công việc — đầu việc chưa xác định được người phụ trách" | Chọn người trong danh bạ hoặc bỏ qua |
| E-meeting-to-tasks-002 | Chưa chọn board | Bấm tạo thiếu workspace/board | minor | FR-004 | "Vui lòng chọn workspace và bảng đích cho công việc" | Chọn đích |
| E-meeting-to-tasks-003 | Không có quyền trên board | Chọn board chủ trì không có quyền tạo | major | FR-004 | "Bạn không có quyền tạo công việc trên bảng này — chọn bảng khác hoặc xin quyền" | Chọn board khác |
| E-meeting-to-tasks-004 | Đầu việc đã có task | Tạo lại trên đầu việc có task hiệu lực | major | FR-006 | "Đầu việc này đã được tạo thành công việc — xem {liên kết task}" | Mở task hiện có |
| E-meeting-to-tasks-005 | Phụ trách ngoài hệ thống | Assignee là khách ngoài không tài khoản | major | FR-012 | "Không thể giao công việc cho người ngoài tổ chức — đánh dấu bỏ qua kèm lý do" | Bỏ qua có lý do |
| E-meeting-to-tasks-006 | Thiếu tiêu đề | Lưu form bỏ trống tiêu đề | minor | FR-002 | "Tiêu đề công việc không được để trống" | Điền tiêu đề |
| E-meeting-to-tasks-007 | Chưa có board nào | Tổ chức chưa có workspace/board | major | FR-004 | "Chưa có bảng công việc nào — hãy tạo bảng trong workspace trước" | Tạo board ở `kanban-workspaces` |
| E-meeting-to-tasks-008 | Nguồn đổi khi đang tạo | Đầu việc bị sửa trong revision giữa lúc mở form | major | FR-011 | "Đầu việc nguồn vừa được cập nhật trong biên bản — kiểm tra lại trước khi tạo" | Tải lại form, kiểm tra nội dung mới |
| E-meeting-to-tasks-009 | Thông báo thất bại | Notification assignee lỗi sau retry | minor | FR-008 | Task vẫn tạo; log hiện "thông báo chưa gửi được" | Retry theo `contextual-notifications`; chủ trì báo tay |
| E-meeting-to-tasks-010 | Tạo đồng thời cùng đầu việc | Hai người có quyền cùng bấm tạo | minor | FR-006 | Người sau thấy "đã có task" + link | Mở task đã tạo |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-meeting-to-tasks-01 | Đầu việc đã xác nhận được giao đúng owner | Tỷ lệ đầu việc publish có task gắn assignee nội bộ hợp lệ | ≥80% sau 1 tháng pilot (đề xuất — chờ OQ-2 PRD) |
| SC-meeting-to-tasks-02 | Task luôn truy nguyên được nguồn | Tỷ lệ task có link nguồn hợp lệ tới đầu việc + biên bản | 100% |
| SC-meeting-to-tasks-03 | Không duplicate | Số đầu việc có ≥2 task còn hiệu lực | 0 |
| SC-meeting-to-tasks-04 | Không task thiếu owner hợp lệ | Tỷ lệ task có assignee người dùng nội bộ còn hiệu lực | 100% (guardrail) |
| SC-meeting-to-tasks-05 | Assignee được báo | Tỷ lệ task có thông báo giao thành công | ≥95% sau 1 tháng pilot |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __ACTION_CONVERSION__ — bản ghi chuyển đổi một đầu việc thành task: đầu
  việc nguồn, trạng thái (chưa tạo/đã tạo/đã bỏ qua), tiêu đề/mô tả/hạn/ưu
  tiên đã chốt, assignee đã resolve, workspace + board đích, task được tạo,
  lý do bỏ qua, cờ nguồn đã cập nhật.
- __PROPOSAL_ITEM__ — đầu việc nguồn (loại "đầu việc") — entity của
  `ai-meeting-minutes`, chỉ tham chiếu.
- __MINUTES__, __MEETING__ — biên bản và cuộc họp nguồn — entity của
  `meeting-records`, chỉ tham chiếu.
- __WORKSPACE__, __BOARD__, __TASK__ — đích chuyển đổi — entity của
  `kanban-workspaces`, chỉ khai tối thiểu.
- __APP_USER__ — người dùng nội bộ (chủ trì, assignee) — entity của
  `account-access`, chỉ tham chiếu.

Chi tiết quan hệ + thuộc tính ở `srs/meeting-to-tasks-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Luồng chính:__ biên bản PUBLISHED → chọn đầu việc → form chuyển đổi →
  resolve assignee + chọn board → tạo task → thông báo → theo dõi hai chiều.
- __Luồng resolve:__ cờ "chưa xác định" → chọn người nội bộ → ghi ngược
  resolved user → tạo task.
- __Luồng chống trùng:__ đã có task → chặn + link; task tương tự → cảnh báo;
  task xóa → cho tạo lại.
- __Luồng lệch nguồn:__ đầu việc sửa trong revision → cờ "nguồn đã cập
  nhật" → đối chiếu tay → tắt cờ.
- __Luồng bỏ qua:__ đầu việc không cần task → bỏ qua kèm lý do → mở lại khi
  đổi ý.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __action-list__ — danh sách đầu việc trên biên bản kèm trạng thái chuyển
  đổi + cờ người chưa xác định.
- __conversion-form__ — form chuyển đổi: tiêu đề/mô tả, assignee, hạn, ưu
  tiên, workspace/board đích.
- __assignee-resolver__ — chọn người dùng nội bộ khi cờ "chưa xác định".
- __task-source__ — mục "Nguồn" trên task: link đầu việc + biên bản + cờ
  "nguồn đã cập nhật".
- __duplicate-warning__ — cảnh báo task tương tự kèm link nghi trùng.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Không tự giao việc khi người/đơn vị chưa xác định | PRD Mục 7.15 "Chưa làm", Mục 12 — Product owner |
| Chỉ đầu việc đã xác nhận (biên bản PUBLISHED) mới chuyển đổi | PRD Mục 7.15, Mục 12 — Product owner |
| Truy cập theo participant + organization/role/data-scope | PRD Mục 9 — Security owner |
| Task phải ghi nguồn truy nguyên được | PRD Mục 7.15 (source link), Mục 12 — Product owner |
| Link nguồn/bản ghi chuyển đổi tuân theo retention được duyệt | PRD Mục 9 — Product + DPO/legal |
| Feature `Should` — không thuộc cam kết pilot v1 | PRD Mục 6.1, Feature Map — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| `ai-meeting-minutes`: đầu việc đã xác nhận + cờ resolve người | Meetings & Work | Nguồn đầu việc có cấu trúc (đầu việc tay vẫn chuyển được nếu có) |
| `meeting-records`: biên bản PUBLISHED, cuộc họp, phạm vi | Meetings & Work | Toàn bộ feature |
| `kanban-workspaces`: workspace/board/task đích + quyền board | Meetings & Work | Đích chuyển đổi (FR-004/005) |
| `account-access`: danh bạ người dùng để resolve | Platform | FR-003 |
| `contextual-notifications`: thông báo assignee | Platform | FR-008 |
| `org-governance`: scope, audit | Platform | Kiểm soát truy cập, audit |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Chỉ chủ trì/admin theo scope khởi tạo chuyển đổi | BR-007 mở rộng cho assignee tự tạo — mất kiểm soát giao việc |
| Task chỉ giao người dùng nội bộ, 1 assignee | FR-003/012 và BR-006 đổi mô hình |
| Không auto-sync khi nguồn đổi — chỉ cờ | FR-011 phải đổi thành sync tự động |
| Mức ưu tiên 4 mức chung `kanban-workspaces` | Validation ưu tiên đổi |
| Giới hạn số (bulk 20, 200/5.000 ký tự, 5 gợi ý, tải ≤3 giây) là v1 | FR-007/013 và NFR-006 đổi ngưỡng |
| Đầu việc thêm tay chuyển đổi như đầu việc AI | FR-001 phải tách hai loại nguồn |

## 12. Open Questions

- [x] OQ-1: Ai khởi tạo chuyển đổi? — Resolved (đề xuất): chủ trì/admin theo
  scope làm thay — chờ Product owner.
- [x] OQ-2: Giao task cho khách ngoài/nhóm đơn vị? — Resolved: khách ngoài
  không tạo task (bỏ qua kèm lý do); nhóm/đơn vị là P2 ngoài v1.
- [x] OQ-3: Tự chọn board đích? — Resolved: không — chỉ gợi ý board đơn vị
  cuộc họp (PRD "Chưa làm").
- [x] OQ-4: Auto-sync khi đầu việc nguồn đổi? — Resolved (đề xuất): không,
  cờ "nguồn đã cập nhật" (bám hướng owner-review của PRD OQ-9).
- [x] OQ-5: Giới hạn số (bulk 20, 200/5.000 ký tự, 5 gợi ý trùng, tải ≤3
  giây)? — Resolved (đề xuất): giá trị v1 — chờ Product owner.
- [x] OQ-6: Retention bản ghi chuyển đổi/link nguồn? — Resolved (đề xuất):
  theo vòng đời task + biên bản — chờ DPO/legal (PRD OQ-6).
- [~] OQ-7: Watchers ngoài assignee? — Out of scope v1 (P1).
- [~] OQ-8: Đồng bộ task sang công cụ ngoài? — Out of scope v1 (thuộc
  `external-integrations`).
