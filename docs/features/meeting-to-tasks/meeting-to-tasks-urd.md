---
type: urd
feature: meeting-to-tasks
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/meeting-to-tasks/brainstorms/confirmed-actions-to-owned-tasks.md
---

# meeting-to-tasks — User Requirements Document

## 1. Purpose

Cho chủ trì một đường ngắn và có kiểm soát để biến đầu việc đã xác nhận trong
biên bản thành task thật trên board Kanban — đúng một người phụ trách nội bộ,
có hạn và ưu tiên, nằm đúng workspace — và cho assignee một task rõ ràng có
liên kết ngược về quyết định đã sinh ra nó.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Chủ trì | Đầu việc nằm trong biên bản; phải nhắc từng người qua chat/email để việc được làm | Đầu việc không thành trách nhiệm thực thi, không có chỗ theo dõi | Việc đã chốt trong họp trôi mất, chủ trì phải đuổi tay | Confirmed — PRD Mục 7.15 |
| Assignee | Việc được giao bằng lời nói hoặc tin nhắn | Không có task rõ mô tả/hạn, dễ quên hoặc hiểu sai | Làm sai việc, trễ hạn, tranh chấp "có giao không" | Confirmed — PRD Mục 7.15 (rủi ro mất liên kết) |
| Quản lý | Muốn biết đầu việc họp có được thực thi | Không thấy liên kết từ biên bản sang công việc đang chạy | Không kiểm soát được cam kết của đội | Confirmed — PRD JTBD-MGR-01 |
| Participant | Không nhớ mình bị giao gì sau họp | Phải đọc lại biên bản hoặc hỏi lại | Sót việc của chính mình | Assumption — suy từ luồng "thông báo → theo dõi" PRD Mục 7.15 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Chủ trì | Biên bản đã publish, cần đầu việc thành task | Chuyển đầu việc thành task đúng owner/hạn/board nhanh và không trùng | Nhắc tay từng người, không biết việc đã vào hệ thống chưa |
| secondary | Assignee | Được giao việc từ cuộc họp | Nhận task rõ mô tả, hạn, ưu tiên + nguồn quyết định | Việc giao bằng lời dễ trôi, thiếu ngữ cảnh |
| secondary | Quản lý | Theo dõi thực thi đầu việc của đội | Thấy đầu việc → task → trạng thái trong phạm vi | Không có đường truy nguyên cam kết |
| secondary | Participant | Xem lại biên bản | Biết đầu việc nào liên quan mình và trạng thái | Phải tự đọc lại toàn bộ |
| out | Khách ngoài tổ chức | Được giao việc trong họp | (không có task — theo dõi qua biên bản) | Không có tài khoản hệ thống |

## 3. Scope Boundaries

### In Scope

- Danh sách đầu việc đã xác nhận trên biên bản PUBLISHED kèm trạng thái
  chuyển đổi.
- Form chuyển đổi: tiêu đề/mô tả chỉnh được, assignee người dùng nội bộ,
  hạn, mức ưu tiên, workspace + board đích do chủ trì chọn.
- Resolve assignee bắt buộc trước khi tạo (kế thừa cờ từ
  `ai-meeting-minutes` hoặc gán trực tiếp).
- Tạo task có link nguồn hai chiều (task ↔ đầu việc ↔ biên bản ↔ cuộc họp).
- Chống trùng: 1 đầu việc ↔ tối đa 1 task còn hiệu lực; cảnh báo task tương
  tự trên board đích.
- Thông báo assignee; theo dõi trạng thái task từ đầu việc.
- Bỏ qua đầu việc kèm lý do; mở lại chuyển đổi khi cần; tạo lại khi task
  nguồn bị xóa.

### Out of Scope

- Tự giao việc khi người phụ trách hoặc đơn vị đích chưa xác định (PRD Mục
  7.15 "Chưa làm").
- Quản lý vòng đời task, bàn giao, comment, attachment — thuộc
  `kanban-workspaces`.
- Sinh/trích đầu việc từ transcript — thuộc `ai-meeting-minutes`.
- Biên bản, transcript, consent — thuộc `meeting-records` /
  `ai-meeting-minutes`.
- Giao task cho người ngoài tổ chức hoặc nhóm/đơn vị (P2, cần mô hình
  group-assignee).
- Đồng bộ task sang công cụ ngoài (`external-integrations`).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Chủ trì | Khi biên bản đã publish | Thấy danh sách đầu việc kèm trạng thái chuyển đổi (chưa tạo/đã tạo/bỏ qua) | Biết ngay đầu việc nào chưa thành trách nhiệm | Critical | Confirmed — PRD Mục 7.15 |
| UN-002 | Chủ trì | Khi chuyển một đầu việc | Form có sẵn nội dung đầu việc, chỉnh lại tiêu đề/mô tả cho ngữ cảnh task | Task mô tả đúng việc thật, không lặc ngôn cảnh AI | Critical | Confirmed — PRD Mục 7.15 (review action) |
| UN-003 | Chủ trì | Khi đầu việc chưa rõ người | Buộc chọn người dùng nội bộ trước khi tạo task | Không có task treo không owner hoặc gán ngầm sai | Critical | Confirmed — PRD Mục 7.15 (resolve assignee, "Chưa làm") |
| UN-004 | Chủ trì | Khi chọn đích task | Chọn workspace + board mình có quyền, được gợi ý board đơn vị cuộc họp | Task vào đúng nơi đội đang theo dõi | Critical | Confirmed — PRD Mục 7.15 (workspace phù hợp) |
| UN-005 | Assignee | Khi task được tạo cho mình | Nhận thông báo kèm mô tả, hạn, ưu tiên và link nguồn biên bản | Biết phải làm gì, khi nào và vì quyết định nào | Critical | Confirmed — PRD Mục 7.15 (thông báo) |
| UN-006 | Chủ trì | Khi lo trùng task | Được chặn tạo lại task cho đầu việc đã có task; cảnh báo task tương tự | Không duplicate trên board | Critical | Confirmed — PRD Mục 7.15 rủi ro chính |
| UN-007 | Assignee/Participant | Khi mở task hoặc đầu việc | Nhảy được hai chiều: task → đầu việc → biên bản | Truy nguyên quyết định gốc bất cứ lúc nào | High | Confirmed — PRD Mục 7.15 (source link) |
| UN-008 | Quản lý | Khi kiểm tra thực thi | Xem đầu việc đã thành task và trạng thái hiện tại trong phạm vi | Biết cam kết nào đang chạy/kẹt | High | Confirmed — PRD JTBD-MGR-01 |
| UN-009 | Chủ trì | Khi đầu việc không cần task | Đánh dấu "bỏ qua" kèm lý do, mở lại được khi đổi ý | Danh sách sạch, không ép tạo task thừa | Medium | Assumption — suy từ luồng review |
| UN-010 | Chủ trì | Khi nguồn đầu việc bị sửa sau khi tạo task | Task hiện cờ "nguồn đã cập nhật" để đối chiếu | Không làm việc theo nội dung cũ mà không biết | Medium | Assumption — bám OQ-9 PRD |

## 5. Prioritized User Journeys

### Journey 1: Chuyển đầu việc thành task có owner rõ ràng

- **User:** Chủ trì
- **Importance:** Critical
- **Trigger:** Biên bản publish có đầu việc cần giao.
- **Expected outcome:** Task tồn tại trên board đích, có assignee nội bộ,
  hạn, ưu tiên và link nguồn; đầu việc hiện "đã tạo task".
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-005, UN-006

1) Mở mục "Đầu việc" trên biên bản, chọn đầu việc "chưa tạo task".
2) Kiểm tra/chỉnh tiêu đề, mô tả; kiểm tra assignee đã resolve; chọn hạn,
   ưu tiên, workspace + board.
3) Bấm "Tạo công việc" → task tạo trên board, ghi nguồn, thông báo assignee.
4) Đầu việc chuyển "đã tạo task" kèm link.

**Independent verification:** Mở task vừa tạo — mục "Nguồn" trỏ đúng đầu
việc và biên bản; đầu việc hiện link task; bấm tạo lại từ cùng đầu việc bị
chặn.

### Journey 2: Resolve người chưa xác định rồi mới tạo task

- **User:** Chủ trì
- **Importance:** Critical
- **Trigger:** Đầu việc còn cờ "chưa xác định" từ bản đề xuất AI.
- **Expected outcome:** Đầu việc có resolved user nội bộ, sau đó mới tạo
  được task; hoặc đánh dấu bỏ qua khi phụ trách ngoài hệ thống.
- **Related needs:** UN-003, UN-009

1) Mở form chuyển đổi của đầu việc có cờ — nút tạo bị vô hiệu.
2) Chọn người dùng nội bộ trong danh bạ → đầu việc cập nhật resolved.
3) Tạo task bình thường; nếu phụ trách là khách ngoài → "Bỏ qua" kèm lý do.

**Independent verification:** Với đầu việc cờ "chưa xác định", nút tạo không
khả dụng cho tới khi có resolved_user; kiểm tra đầu việc cập nhật đúng người
đã chọn.

### Journey 3: Assignee nhận và truy nguyên task

- **User:** Assignee
- **Importance:** High
- **Trigger:** Được giao task từ đầu việc cuộc họp.
- **Expected outcome:** Nhận thông báo, mở task thấy đủ mô tả/hạn/ưu tiên và
  link về quyết định nguồn.
- **Related needs:** UN-005, UN-007

1) Nhận thông báo "được giao công việc".
2) Mở task → đọc mô tả, hạn, ưu tiên.
3) Bấm "Nguồn" → xem đầu việc và biên bản gốc để hiểu ngữ cảnh.

**Independent verification:** Từ task bất kỳ tạo bởi feature này, theo link
nguồn tới đúng đầu việc trên biên bản PUBLISHED của đúng cuộc họp.

### Journey 4: Theo dõi đầu việc đã chuyển và xử lý lệch nguồn

- **User:** Chủ trì (và quản lý trong scope)
- **Importance:** High
- **Trigger:** Cần biết đầu việc họp đã thực thi tới đâu.
- **Expected outcome:** Thấy trạng thái task hiện tại ngay trên đầu việc;
  khi nguồn đổi, task có cờ để đối chiếu.
- **Related needs:** UN-008, UN-010

1) Mở danh sách đầu việc của biên bản → xem trạng thái task từng mục.
2) Đầu việc bị sửa trong revision → task hiện "nguồn đã cập nhật".
3) Đối chiếu và xác nhận đã kiểm tra → cờ tắt.

**Independent verification:** Sửa một đầu việc nguồn trong revision biên bản
— task liên kết hiện cờ cập nhật; task bị xóa thì đầu việc hiện "task đã
xóa" và cho tạo lại.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Đầu việc chưa resolve người | Không tạo được task | Nút vô hiệu + lý do; resolve trong form hoặc bỏ qua | J2 / UN-003 |
| Phụ trách là khách ngoài tổ chức | Không giao được trong hệ thống | Hướng dẫn đánh dấu bỏ qua "phụ trách ngoài hệ thống"; đầu việc vẫn trong biên bản | J2 / UN-003 |
| Đầu việc đã có task | Sợ tạo trùng | Chặn tạo + link task hiện có; chỉ tạo lại khi task cũ bị xóa | J1 / UN-006 |
| Board đích đã có task tương tự | Có thể duplicate | Cảnh báo nghi trùng kèm link; chủ trì quyết tạo hay không | J1 / UN-006 |
| Chưa có workspace/board nào | Không có đích để tạo | Thông báo tạo board trước; đầu việc giữ "chưa tạo task" | J1 / UN-004 |
| Không có quyền trên board đích | Không tạo được | Báo rõ và gợi ý chọn board khác hoặc xin quyền | J1 / UN-004 |
| Đầu việc nguồn bị sửa trong revision | Task lệch nội dung | Cờ "nguồn đã cập nhật" trên task + đối chiếu tay | J4 / UN-010 |
| Task nguồn bị xóa | Mất theo dõi | Đầu việc hiện "task đã xóa" + cho tạo lại | J4 / UN-006 |
| Thông báo assignee thất bại | Assignee không biết | Task vẫn tồn tại; retry theo `contextual-notifications`, log thất bại | J3 / UN-005 |
| Đầu việc không có hạn | Task thiếu deadline | Cho tạo nhưng nhắc "chưa có hạn" để chủ trì quyết | J1 / UN-002 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt.
- Chỉ người dùng nội bộ; assignee bắt buộc có tài khoản còn hiệu lực.
- Quyền xem đầu việc/biên bản kế thừa `meeting-records`; quyền tạo task theo
  board của `kanban-workspaces`; deny-by-default.
- Một task có đúng một assignee trong v1 — trách nhiệm không chia.
- Đầu việc chỉ chuyển đổi được khi thuộc biên bản PUBLISHED.
- Form chuyển đổi hướng desktop; có thể thao tác trên tablet nhưng không
  thiết kế riêng mobile v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Chỉ chủ trì (hoặc admin theo scope) khởi tạo chuyển đổi | Nếu assignee tự tạo → tự gán việc không qua chủ trì | Resolved (đề xuất) — chờ Product owner | Xác nhận ở OQ-1 |
| Task chỉ giao cho người dùng nội bộ | Nếu cần khách ngoài → thiếu kênh giao việc | Resolved — OQ-2 | Theo dõi khi pilot có khách ngoài |
| Không auto-chọn board đích, chỉ gợi ý | Nếu auto → vi phạm "Chưa làm" PRD | Confirmed — PRD Mục 7.15 | — |
| Task giữ snapshot, không auto-sync khi nguồn đổi | Nếu auto-sync → ghi đè mất kiểm soát | Resolved (đề xuất) — OQ-4 | Xác nhận với Product owner |
| Một task đúng 1 assignee | Nếu cần nhiều owner → mô hình đổi | Assumption — bám `crm_tasks` nguồn | Chốt cùng `kanban-workspaces` |
| Mức ưu tiên 4 mức chung với `kanban-workspaces` | Nếu khác thang → mapping phức tạp | Assumption | Align khi `kanban-workspaces` đặc tả |
| Giới hạn số Mục 7.2 brainstorm | Nếu sai → đổi validation | Resolved (đề xuất) — OQ-5 | Chờ Product owner |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Đầu việc đã xác nhận trở thành task có owner | Chưa có — xác lập bằng thống kê đầu việc trong 1 tháng pilot | ≥80% đầu việc có task gắn assignee nội bộ hợp lệ (đề xuất — chờ OQ-2 PRD) | Tỷ lệ đầu việc publish có task liên kết | 1 tháng sau pilot |
| USC-002 | Task luôn truy nguyên được nguồn | Chưa có | 100% task có link nguồn hợp lệ | Kiểm task → đầu việc → biên bản | Liên tục |
| USC-003 | Không duplicate task từ cùng đầu việc | 0 sự cố | 0 đầu việc có ≥2 task còn hiệu lực | Audit liên kết | Liên tục |
| USC-004 | Assignee biết việc được giao | Chưa có — xác lập bằng log thông báo 1 tháng pilot | ≥95% task có thông báo giao thành công | Log notification vs task tạo | 1 tháng sau pilot |
| USC-005 | Đầu việc cần task không bị bỏ sót âm thầm | Chưa có | 100% đầu việc có trạng thái chuyển đổi rõ (task/bỏ qua/chưa xử lý) | Đối chiếu danh sách đầu việc | Hàng tháng |

## 10. Open Questions

- [x] OQ-1: Ai khởi tạo chuyển đổi? — Resolved (đề xuất): chủ trì/admin theo
  scope; chờ Product owner.
- [x] OQ-2: Giao cho khách ngoài? — Resolved: không, "bỏ qua" kèm lý do.
- [x] OQ-3: Tự chọn board đích? — Resolved: không, chỉ gợi ý (PRD "Chưa
  làm").
- [x] OQ-4: Auto-sync khi nguồn đổi? — Resolved (đề xuất): không, cờ cập
  nhật để đối chiếu tay (bám PRD OQ-9).
- [x] OQ-5: Giới hạn số (bulk 20, 200/5.000 ký tự, 5 gợi ý)? — Resolved (đề
  xuất): giá trị v1 — chờ Product owner.
- [x] OQ-6: Retention link nguồn/bản ghi chuyển đổi? — Resolved (đề xuất):
  theo vòng đời task + biên bản — chờ DPO/legal (PRD OQ-6).
- [~] OQ-7: Giao cho nhóm/đơn vị? — Out of scope v1.
- [~] OQ-8: Watchers ngoài assignee? — Out of scope v1 (P1).
