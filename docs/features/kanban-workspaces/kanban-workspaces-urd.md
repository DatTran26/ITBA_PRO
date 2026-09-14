---
type: urd
feature: kanban-workspaces
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/kanban-workspaces/brainstorms/kanban-board-and-handover-approval.md
---

# kanban-workspaces — User Requirements Document

## 1. Purpose

Cho nhân viên và quản lý một nơi duy nhất để giao, làm và chốt công việc:
task trên board Kanban có đúng một người phụ trách, hạn và mức ưu tiên rõ
ràng, và quan trọng nhất — task chỉ "hoàn tất" khi có bàn giao kèm kết quả
được người có thẩm quyền duyệt, thay cho việc giao qua chat/lời nói mà
không ai biết "xong tới đâu".

Feature này ở mức `Should` trong Feature Map — KHÔNG thuộc cam kết pilot
v1; URD chuẩn bị cho slice Meetings & Work sau v1 (PRD Mục 6.1, Mục 7.16).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Nhân viên | Việc được giao qua chat, email hoặc lời nói | Không có task rõ mô tả/hạn/ưu tiên; "xong" không có nghĩa chung | Làm sai việc, trễ hạn, tranh chấp "có giao không" | Confirmed — PRD Mục 7.16 (phạm vi v1: task, assignee, due date, status) |
| Người giao việc (chủ trì/quản lý/HR) | Giao việc rồi phải nhắc tay từng người | Không có chỗ theo dõi trạng thái và kết quả bàn giao | Việc trôi mất, không kiểm soát được cam kết của đội | Confirmed — PRD Mục 7.16 (luồng chính: bàn giao/duyệt); JTBD-MGR-01 |
| Quản lý | Muốn biết task nào trễ, chờ duyệt, quá tải trong đội | Không có board theo phạm vi quản lý | Phát hiện tắc nghẽn muộn | Confirmed — PRD JTBD-MGR-01; Mục 7.16 (theo nhóm/phòng ban/dự án) |
| Nhân viên (assignee) | Báo "xong" bằng miệng | Không có bằng chứng kết quả khi bị hỏi lại | Bị khiển trách oan hoặc phải làm lại | Confirmed — PRD Mục 7.16 (rủi ro chính: status cập nhật nhưng outcome/evidence thiếu) |
| Admin | Cần truy vết ai đổi gì trên task | Không có lịch sử hoạt động thống nhất | Không điều tra được tranh chấp | Confirmed — PRD Mục 9 (audit boundary), Mục 7.16 (history) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Nhân viên | Nhận và thực hiện task trong workspace của đội | Biết rõ việc của mình, hạn, ưu tiên; cập nhật và bàn giao có chốt | Việc giao rời, không rõ hạn, "xong" không được ghi nhận |
| secondary | Người giao việc | Tạo task và giao cho thành viên | Task có owner + hạn, theo dõi trạng thái, duyệt bàn giao | Phải nhắc tay, không biết việc tới đâu |
| secondary | Quản lý | Theo dõi khối lượng công việc trong phạm vi | Thấy task trễ, chờ duyệt, quá tải | Không có góc nhìn tổng hợp của đội |
| secondary | Workspace owner | Quản lý workspace/board/thành viên của nhóm hoặc dự án | Kiểm soát ai vào board và cấu trúc cột | Không có ranh giới workspace |
| secondary | Admin | Truy vết hoạt động, xử lý tranh chấp | Lịch sử đầy đủ mọi thay đổi | Không có audit trail |
| out | Khách ngoài tổ chức | Được giao việc trong cuộc họp | (không có task — theo dõi qua biên bản) | Không có tài khoản hệ thống |

## 3. Scope Boundaries

### In Scope

- Workspace theo nhóm/phòng ban/dự án: thành viên với vai trò
  owner/member/viewer, gán đơn vị liên quan.
- Board trong workspace với cột có thứ tự; mỗi cột gán một trong 4 nhóm
  trạng thái cố định (mới, đang làm, chờ duyệt, hoàn tất).
- Task: tiêu đề, mô tả, một assignee người dùng nội bộ, hạn, ưu tiên 4
  mức, trạng thái; di chuyển giữa cột mở.
- Bình luận và file đính kèm (qua `document-intake`) trên task.
- Bàn giao + duyệt: ghi chú kết quả bắt buộc, evidence tùy chọn có nhắc,
  reviewer duyệt → hoàn tất hoặc từ chối kèm phản hồi.
- Lịch sử hoạt động đầy đủ trên task (ai, khi nào, trước → sau).
- Thông báo qua `contextual-notifications`: giao việc, đổi hạn, quá hạn,
  bàn giao chờ duyệt, quyết định duyệt.
- Hiển thị link nguồn và cờ "nguồn đã cập nhật" trên task tạo bởi
  `meeting-to-tasks`.
- Đóng không hoàn tất có lý do; mở lại task hoàn tất kèm lý do; lưu trữ/
  khôi phục board.

### Out of Scope

- Chuyển đầu việc biên bản thành task — thuộc `meeting-to-tasks` (feature
  này chỉ là đích nhận).
- Sinh đầu việc từ transcript — thuộc `ai-meeting-minutes`; biên bản và
  consent — thuộc `meeting-records`.
- Project portfolio management đầy đủ: timeline/Gantt, portfolio đa board,
  resource planning — PRD "Chưa làm".
- Giao task cho nhóm/đơn vị hoặc nhiều assignee — P2 (v1 đúng 1 assignee
  bám `meeting-to-tasks` BR-006).
- Đồng bộ task ra công cụ ngoài — thuộc `external-integrations`.
- Subtask/checklist trong task, automation rule — hướng P2.
- Watchers ngoài assignee — hướng P1.
- Báo cáo liên domain — thuộc `management-reporting` (feature này chỉ cung
  cấp dữ liệu outcome).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Nhân viên | Khi được giao việc | Một task rõ tiêu đề, mô tả, hạn, ưu tiên trong board của đội, kèm thông báo | Không bỏ sót việc, biết phải làm gì trước | Critical | Confirmed — PRD Mục 7.16 (task, assignee, due date) |
| UN-002 | Nhân viên | Khi đang làm task | Cập nhật trạng thái qua cột, bình luận trao đổi, đính kèm file | Tiến độ minh bạch với người giao/quản lý | Critical | Confirmed — PRD Mục 7.16 (status, comment, attachment) |
| UN-003 | Nhân viên | Khi xong việc | Gửi bàn giao kèm ghi chú kết quả (và evidence) cho reviewer | "Xong" được ghi nhận có chốt, không bị hỏi lại | Critical | Confirmed — PRD Mục 7.16 (bàn giao, rủi ro outcome thiếu) |
| UN-004 | Reviewer (người giao/quản lý) | Khi có bàn giao chờ duyệt | Hàng chờ liệt kê bàn giao kèm kết quả, evidence, lịch sử task | Quyết định duyệt/từ chối có phản hồi, được ghi nhận | Critical | Confirmed — PRD Mục 7.16 (approval); reviewer mặc định ở OQ-1 |
| UN-005 | Người giao việc | Khi cần giao việc mới | Tạo task, chọn assignee là thành viên workspace còn hiệu lực, đặt hạn/ưu tiên | Task vào board đúng người, có thông báo | Critical | Confirmed — PRD Mục 7.16 |
| UN-006 | Quản lý | Khi theo dõi đội trong phạm vi | Xem board/task theo phạm vi, lọc task quá hạn và chờ duyệt | Phát hiện tắc nghẽn sớm | High | Confirmed — PRD JTBD-MGR-01 |
| UN-007 | Workspace owner | Khi thiết lập workspace cho nhóm/dự án | Tạo workspace, gán đơn vị, thêm thành viên với vai trò, cấu hình board/cột | Ranh giới workspace rõ, ai vào được gì | High | Confirmed — PRD Mục 7.16 (theo nhóm/phòng ban/dự án) |
| UN-008 | Bất kỳ ai có quyền | Khi cần biết task đã qua những gì | Xem lịch sử hoạt động đầy đủ: trạng thái, assignee, hạn, bình luận, bàn giao | Truy vết "ai đổi gì, khi nào" không cần hỏi | High | Confirmed — PRD Mục 7.16 (history), Mục 9 |
| UN-009 | Assignee/người giao | Khi task sắp/quá hạn hoặc bàn giao chờ lâu | Được nhắc đúng người đúng lúc | Không quên hạn, bàn giao không treo | High | Confirmed — PRD Mục 7.16 (đo thành công: đúng hạn) |
| UN-010 | Người giao việc/quản lý | Khi task tạo từ biên bản cuộc họp | Mở link nguồn về đầu việc/biên bản từ task | Truy nguyên cam kết họp khi cần | Medium | Confirmed — PRD Mục 7.15/7.16; upstream `meeting-to-tasks` |
| UN-011 | Người có quyền | Khi task không còn cần làm hoặc cần làm lại | Đóng không hoàn tất kèm lý do; mở lại task hoàn tất kèm lý do | Trạng thái cuối rõ ràng, có audit | Medium | Assumption — suy từ yêu cầu history + audit |

## 5. Prioritized User Journeys

### Journey 1: Giao task → thực hiện → bàn giao được duyệt

- **User:** Người giao việc + nhân viên
- **Importance:** Critical
- **Trigger:** Một việc cần giao cho thành viên trong đội.
- **Expected outcome:** Task hoàn tất có bàn giao được duyệt, đúng hạn,
  đủ kết quả.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-005

1) Người giao tạo task trên board: tiêu đề, mô tả, assignee, hạn, ưu
   tiên → assignee nhận thông báo.
2) Assignee kéo sang "Đang làm", cập nhật tiến độ qua bình luận, đính
   kèm file.
3) Xong việc → "Bàn giao" + ghi chú kết quả + evidence → task CHO_DUYET.
4) Reviewer xem bàn giao → "Duyệt" → HOAN_TAT, cả hai được thông báo.

**Independent verification:** Chọn một task vừa HOAN_TAT — bản ghi có đủ
assignee + hạn, bàn giao có ghi chú kết quả và reviewer, lịch sử hiển thị
đầy đủ tạo → làm → bàn giao → duyệt.

### Journey 2: Bàn giao bị từ chối → làm lại → duyệt

- **User:** Nhân viên + reviewer
- **Importance:** Critical
- **Trigger:** Reviewer thấy kết quả chưa đạt.
- **Expected outcome:** Phản hồi rõ ràng thành bình luận, assignee làm
  lại và bàn giao lại thành công.
- **Related needs:** UN-003, UN-004, UN-008

1) Reviewer mở bàn giao CHO_DUYET → "Từ chối" kèm phản hồi bắt buộc.
2) Task về "Đang làm", phản hồi hiển thị như bình luận; assignee được
   thông báo.
3) Assignee làm tiếp, gửi bàn giao lần 2 → reviewer duyệt → HOAN_TAT;
  lịch sử giữ cả hai bản ghi bàn giao.

**Independent verification:** Với task có ≥2 bàn giao — lịch sử hiển thị
bàn giao 1 từ chối kèm phản hồi, bàn giao 2 được duyệt, và trạng thái cuối
là HOAN_TAT.

### Journey 3: Thiết lập workspace cho đội/dự án

- **User:** Workspace owner
- **Importance:** High
- **Trigger:** Một nhóm/dự án mới cần board chung.
- **Expected outcome:** Workspace có thành viên đúng vai trò và board sẵn
  sàng nhận task.
- **Related needs:** UN-007

1) Owner tạo workspace (loại phòng ban/dự án/nhóm), gán đơn vị.
2) Thêm thành viên: owner/member/viewer.
3) Tạo board với bộ cột mặc định, đổi tên/thêm cột theo cách làm của đội.

**Independent verification:** Đăng nhập bằng tài khoản member — thấy
workspace và board; tài khoản viewer không tạo được task; người ngoài
workspace không xem được.

### Journey 4: Theo dõi task trễ và bàn giao treo

- **User:** Quản lý
- **Importance:** High
- **Trigger:** Quản lý rà soát công việc của đội cuối tuần.
- **Expected outcome:** Thấy được task quá hạn và bàn giao chờ duyệt lâu
  để can thiệp.
- **Related needs:** UN-006, UN-009

1) Quản lý mở board trong scope → lọc "quá hạn" và "chờ duyệt".
2) Task quá hạn tô sáng; bàn giao chờ >2 ngày có nhắc reviewer.
3) Quản lý bình luận hỏi tiến độ hoặc đề nghị owner gán lại.

**Independent verification:** Với board có cố ý task quá hạn và bàn giao
chờ >2 ngày — bộ lọc trả đúng các task đó và log nhắc có thông báo đúng
người.

### Journey 5: Task từ biên bản cuộc họp

- **User:** Assignee + người giao
- **Importance:** Medium
- **Trigger:** `meeting-to-tasks` tạo task vào board từ đầu việc đã xác
  nhận.
- **Expected outcome:** Task hiển thị link nguồn; khi đầu việc gốc bị
  sửa, cờ cảnh báo hiện trên task.
- **Related needs:** UN-010

1) Task xuất hiện trên board đích với mục "Nguồn" trỏ đầu việc/biên bản.
2) Khi đầu việc nguồn bị sửa trong revision → cờ "nguồn đã cập nhật" hiện
   trên task.
3) Assignee mở link đối chiếu rồi xác nhận tắt cờ.

**Independent verification:** Tạo task qua upstream rồi sửa đầu việc nguồn
— task hiển thị cờ cho tới khi có người xác nhận đối chiếu.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Giao cho người không phải thành viên/hết hiệu lực | Không giao được | Báo rõ và yêu cầu chọn thành viên còn hiệu lực | J1 / UN-005 |
| Bàn giao quên ghi chú kết quả | Không gửi được | Chặn + yêu cầu nhập kết quả — chốt "status đổi nhưng outcome thiếu" | J1 / UN-003 |
| Bàn giao không đính kèm evidence | Sợ thiếu bằng chứng | Cho gửi nhưng hiện nhắc "chưa đính kèm evidence" | J1 / UN-003 |
| Từ chối bàn giao không ghi phản hồi | Assignee không biết sửa gì | Chặn từ chối trần — phản hồi bắt buộc thành bình luận | J2 / UN-004 |
| Kéo thẳng task vào cột chờ duyệt/hoàn tất | Bỏ qua bước bàn giao | Chặn — chỉ qua thao tác Bàn giao/Duyệt | J1 / UN-003 |
| Task để trống hạn | Thiếu deadline | Cho lưu nhưng nhắc "chưa có hạn" | J1 / UN-001 |
| Xóa task đã có hoạt động | Mất vết công việc | Chặn xóa, hướng dẫn "Đóng không hoàn tất" kèm lý do | UN-011 |
| Người ngoài workspace cố xem/sửa | Lộ task giữa các đội | Deny-by-default + ghi nhận truy cập bị từ chối | J3 / UN-007 |
| Reviewer nghỉ việc khi có bàn giao chờ | Bàn giao treo | Owner/quản lý scope nhận hàng chờ, gán reviewer mới | J2 / UN-004 |
| Assignee nghỉ việc/bị gỡ khỏi workspace | Task mất owner | Cờ "assignee ngoài workspace" + vào danh sách thiếu owner | J3 / UN-001 |
| Hai người cùng sửa một task | Người lưu sau ghi đè | Cảnh báo "task vừa được {người} cập nhật — tải lại" | J1 / UN-002 |
| Board đích bị lưu trữ khi upstream tạo task | Task không vào được | Chặn tạo vào board LUU_TRU, upstream báo chọn board khác | J5 / UN-010 |
| Task HOAN_TAT phát hiện thiếu sót | Không sửa được | Mở lại kèm lý do bắt buộc → về đang làm, có audit | UN-011 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt.
- Chỉ người dùng nội bộ; assignee bắt buộc là thành viên workspace còn
  hiệu lực — khách ngoài không có task (bám `meeting-to-tasks`).
- Quyền theo workspace membership + organization/role/data-scope;
  deny-by-default (PRD Mục 9).
- Một task có đúng một assignee trong v1 — trách nhiệm không chia.
- Task chỉ HOAN_TAT qua bàn giao được reviewer duyệt — không đường tự
  đóng, không AI tự kết luận (PRD Mục 12).
- File đính kèm chỉ qua cổng `document-intake`; thông báo chỉ qua
  `contextual-notifications`.
- Màn hình desktop là chính cho thao tác board (kéo cột, hàng chờ duyệt);
  xem/bình luận dùng được trên thiết bị thường dùng.
- Trước khi privacy gate (OQ-3/OQ-6 PRD) đạt, chỉ dùng dữ liệu synthetic.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Reviewer bàn giao mặc định là người tạo/giao task; quản lý scope và owner duyệt được | Nếu vai trò khác → hàng chờ sai người | Resolved (đề xuất) — OQ-1 | Chờ Product owner |
| Ghi chú kết quả bắt buộc; evidence tùy chọn có nhắc | Nếu evidence bắt buộc → ma sát lớn; nếu không bắt buộc gì → rủi ro chính còn nguyên | Resolved (đề xuất) — OQ-2 | Chờ Product owner |
| Chỉ 4 nhóm trạng thái cố định; tên/số cột tùy biến | Nếu trạng thái tự do → mất state machine bàn giao | Resolved (đề xuất) — OQ-3 | Chờ Product owner |
| Đúng một assignee nội bộ mỗi task | Nếu cần nhiều owner → mô hình đổi | Resolved — OQ-4 (bám upstream) | — |
| Quản lý/HR hoặc vai trò được gán tạo workspace/board | Nếu ai cũng tạo → workspace rác, quyền loạn | Resolved (đề xuất) — OQ-5 | Chờ Product owner |
| Giới hạn số Mục 7.2 brainstorm là chuẩn v1 | Nếu sai → đổi validation | Resolved (đề xuất) — OQ-6 | Chờ Product owner |
| Retention theo vòng đời workspace, xóa theo DPO | Nếu khác → mô hình vòng đời đổi | Resolved (đề xuất) — OQ-7 | Chờ DPO/legal (PRD OQ-6) |
| Task từ `meeting-to-tasks` xử lý như task thường; chỉ thêm link nguồn | Nếu có luồng riêng → hai kiểu task | Confirmed — upstream spec FR-005 | — |
| Sửa bình luận trong 15 phút, vết "đã sửa" hiển thị | Nếu cho sửa vô hạn → lịch sử mất tin cậy | Resolved (đề xuất) — OQ-6 | Chờ Product owner |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Task hoàn tất đúng hạn và đủ kết quả (metric chính PRD Mục 7.16) | Chưa có — xác lập bằng thống kê task trong 1 tháng pilot | ≥80% task HOAN_TAT đúng hạn + có ghi chú kết quả (đề xuất — chờ OQ-2 PRD) | Tỷ lệ task HOAN_TAT đúng hạn và có outcome / tổng task HOAN_TAT | 1 tháng sau pilot |
| USC-002 | Mọi task hoàn tất qua duyệt có kết quả | 0% | 100% task HOAN_TAT có bàn giao DA_DUYET với ghi chú kết quả không rỗng | Đối chiếu task HOAN_TAT với HANDOVER | Liên tục |
| USC-003 | Task luôn có owner hợp lệ | Chưa có | 100% task có assignee nội bộ còn hiệu lực (guardrail) | Kiểm task → APP_USER | Liên tục |
| USC-004 | Bàn giao không treo | Chưa có — xác lập bằng đo thời gian chờ trong 1 tháng pilot | ≥95% bàn giao được quyết định trong ≤2 ngày làm việc (đề xuất) | Thời gian submitted_at → decided_at | 1 tháng sau pilot |
| USC-005 | Mọi thay đổi task có vết | Chưa có | 0 task đổi trạng thái/trường không có bản ghi lịch sử | Kiểm mẫu lịch sử hoạt động | Mỗi release |
| USC-006 | Không lộ task giữa các đội | 0 sự cố | 0 incident vượt workspace/scope được xác nhận | Security incident log (bám M-GR-01) | Liên tục |

## 10. Open Questions

- [x] OQ-1: Ai là reviewer mặc định của bàn giao? — Resolved (đề xuất):
  người tạo/giao task; quản lý trong scope và workspace owner duyệt
  được; admin không duyệt thay — chờ Product owner xác nhận.
- [x] OQ-2: Evidence đính kèm có bắt buộc khi bàn giao? — Resolved (đề
  xuất): ghi chú kết quả bắt buộc; file evidence tùy chọn nhưng nhắc khi
  thiếu — chờ Product owner xác nhận.
- [x] OQ-3: Nhóm trạng thái cột có tùy biến không? — Resolved (đề xuất):
  tên/số cột tùy biến trong giới hạn nhưng chỉ 4 nhóm trạng thái cố định
  — chờ Product owner xác nhận.
- [x] OQ-4: Một task nhiều assignee? — Resolved: không, đúng một assignee
  nội bộ trong v1 (bám `meeting-to-tasks` BR-006); nhóm/đơn vị là P2.
- [x] OQ-5: Ai tạo workspace/board? — Resolved (đề xuất): quản lý/HR hoặc
  vai trò được gán qua `org-governance` — chờ Product owner xác nhận.
- [x] OQ-6: Các giới hạn đề xuất (20 cột, 50 board, 50 task/trang, 20
  file, 10 MB, 100 thành viên, sửa comment 15 phút, SLA duyệt 2 ngày,
  nhắc quá hạn hằng ngày)? — Resolved (đề xuất): chấp nhận làm chuẩn
  slice này — chờ Product owner xác nhận.
- [x] OQ-7: Retention task/comment/đính kèm/lịch sử? — Resolved (đề
  xuất): giữ theo vòng đời workspace; xóa theo chính sách DPO — chờ
  DPO/legal xác nhận (PRD OQ-6).
- [~] OQ-8: Watchers, subtask, giao cho nhóm? — Out of scope v1 (hướng
  P1/P2).
- [~] OQ-9: Đồng bộ task sang công cụ ngoài? — Out of scope v1 (thuộc
  `external-integrations`).
- [~] OQ-10: Timeline/Gantt/portfolio đa board? — Out of scope v1: PRD
  "Chưa làm".
