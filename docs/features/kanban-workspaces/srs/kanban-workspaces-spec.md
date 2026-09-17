---
type: srs
feature: kanban-workspaces
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/kanban-workspaces/brainstorms/kanban-board-and-handover-approval.md
  - docs/features/kanban-workspaces/kanban-workspaces-urd.md
  - docs/features/meeting-to-tasks/srs/meeting-to-tasks-spec.md
---

# kanban-workspaces — Software Requirements Specification

## 1. Scope

SRS này cover workspace công việc của một tổ chức: workspace theo
nhóm/phòng ban/dự án với thành viên theo vai trò, board và cột Kanban,
task có một assignee/hạn/ưu tiên/trạng thái, bình luận, file đính kèm qua
`document-intake`, luồng bàn giao có ghi chú kết quả bắt buộc và duyệt của
reviewer, lịch sử hoạt động đầy đủ, thông báo qua
`contextual-notifications` và hiển thị link nguồn cho task tạo bởi
`meeting-to-tasks`.

Đây là feature `Should` trong theme Meetings & Work — KHÔNG thuộc cam kết
pilot v1; spec này chuẩn bị cho slice mở rộng sau v1 (PRD Mục 6.1, Mục
7.16).

KHÔNG cover: chuyển đầu việc biên bản thành task (`meeting-to-tasks` —
feature này chỉ là đích nhận), project portfolio management đầy đủ
(timeline/Gantt/portfolio — PRD "Chưa làm"), giao cho nhóm/đơn vị hoặc
nhiều assignee (P2), đồng bộ công cụ ngoài (`external-integrations`),
subtask/automation (P2), watchers (P1), báo cáo liên domain
(`management-reporting` chỉ đọc outcome ở đây).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Nhân viên (assignee) | người | Nhận task, cập nhật, bình luận, đính kèm, bàn giao | Có |
| Người giao việc (chủ trì/quản lý/HR) | người | Tạo task, giao, theo dõi, duyệt bàn giao | Có |
| Quản lý | người | Xem board/task trong phạm vi, lọc trễ/chờ duyệt | Có (theo scope) |
| Workspace owner | người | Quản lý workspace, thành viên, board/cột | Có |
| Viewer | người | Xem board/task trong workspace mình thuộc | Có (chỉ đọc) |
| Admin | người | Truy vết lịch sử, kiểm tra quyền | Có (kiểm tra, không duyệt thay) |
| `meeting-to-tasks` | hệ thống | Tạo task vào board đích kèm link nguồn | Có — nguồn task |
| `org-governance` | hệ thống | Đơn vị, role/scope, audit | Có — dependency |
| `account-access` | hệ thống | Danh bạ người dùng nội bộ | Có — dependency |
| `document-intake` | hệ thống | Cổng file đính kèm | Có — dependency |
| `contextual-notifications` | hệ thống | Thông báo giao/hạn/bàn giao/duyệt | Có — dependency |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-kanban-workspaces-001 | Tạo và quản lý workspace | Khi người có quyền tạo workspace, hệ thống phải ghi tên (duy nhất trong tổ chức), loại (phòng ban/dự án/nhóm), đơn vị liên quan và người tạo làm owner đầu tiên | P0 | test | PRD Mục 7.16; brainstorm Mục 5.1; URD UN-007 |
| FR-kanban-workspaces-002 | Thành viên workspace theo vai trò | Hệ thống phải cho owner thêm/bớt thành viên là người dùng nội bộ với vai trò owner/member/viewer; viewer chỉ xem, member tham gia đầy đủ, owner quản trị workspace | P0 | test | brainstorm Mục 6.2; URD UN-007 |
| FR-kanban-workspaces-003 | Board trong workspace | Hệ thống phải cho owner/member có quyền tạo board trong workspace, sửa tên/mô tả và lưu trữ/khôi phục; board LUU_TRU ẩn khỏi danh sách nhưng giữ task để truy vết | P0 | test | PRD Mục 7.16 (board); brainstorm Mục 5.4 |
| FR-kanban-workspaces-004 | Cột và nhóm trạng thái | Hệ thống phải tạo bộ cột mặc định khi tạo board (Việc mới/Đang làm/Chờ duyệt/Hoàn tất); mỗi cột gán đúng một trong 4 nhóm trạng thái cố định và có thứ tự; cho đổi tên/thêm/xếp lại cột trong giới hạn 20 cột/board (đề xuất — OQ-6) | P0 | test | brainstorm Mục 7.1, OQ-3; URD UN-007 |
| FR-kanban-workspaces-005 | Tạo task | Khi member tạo task trên board HOAT_DONG, hệ thống phải ghi tiêu đề (bắt buộc ≤200 ký tự), mô tả, một assignee, hạn, ưu tiên và đặt task ở cột nhóm "mới" (MOI); assignee bắt buộc là thành viên workspace còn hiệu lực | P0 | test | PRD Mục 7.16 (task, assignee); URD UN-005 |
| FR-kanban-workspaces-006 | Giao cho người hợp lệ | Nếu assignee được chọn không phải thành viên workspace hoặc tài khoản hết hiệu lực, thì hệ thống phải chặn tạo/gán và yêu cầu chọn người hợp lệ; một task có đúng một assignee | P0 | test | brainstorm Mục 6.1 (D1); bám BR-meeting-to-tasks-006 |
| FR-kanban-workspaces-007 | Hạn và ưu tiên | Hệ thống phải cho hạn trống nhưng hiển thị nhắc "chưa có hạn", cảnh báo khi hạn trong quá khứ, và tô sáng + nhắc task quá hạn; ưu tiên bắt buộc một trong 4 mức (thấp, trung bình, cao, khẩn) | P0 | test | brainstorm Mục 7.1, 6.1 (D7, D10); URD UN-001 |
| FR-kanban-workspaces-008 | Di chuyển giữa cột mở | Khi người có quyền kéo task giữa các cột nhóm "mới" và "đang làm", hệ thống phải cập nhật trạng thái theo nhóm cột đích và ghi lịch sử | P0 | test | PRD Mục 7.16 (status); brainstorm Mục 6.3 |
| FR-kanban-workspaces-009 | Chặn kéo vào cột có cổng | Hệ thống phải chặn kéo trực tiếp vào cột nhóm "chờ duyệt" hoặc "hoàn tất": vào chờ duyệt chỉ qua thao tác Bàn giao, vào hoàn tất chỉ qua duyệt | P0 | test | brainstorm Mục 6.1 (D9); PRD Mục 12 |
| FR-kanban-workspaces-010 | Bình luận | Hệ thống phải cho member trở lên bình luận trên task (≤2.000 ký tự), sửa trong 15 phút với vết "đã sửa" và xóa bình luận của chính mình (giữ vết "đã xóa"); admin xóa được mọi bình luận | P0 | test | PRD Mục 7.16 (comment); brainstorm Mục 6.5, 7.2 |
| FR-kanban-workspaces-011 | File đính kèm | Hệ thống phải cho đính kèm file trên task qua `document-intake` (tối đa 20 file, ≤10 MB/file — đề xuất OQ-6), hiển thị trạng thái xử lý và áp quyền xem theo membership | P0 | test | PRD Mục 7.16 (attachment); brainstorm Mục 7.2 |
| FR-kanban-workspaces-012 | Gửi bàn giao | Khi assignee bấm "Bàn giao", hệ thống phải yêu cầu ghi chú kết quả (≥10 ký tự), nhắc khi thiếu file evidence, rồi chuyển task sang CHO_DUYET và tạo bản ghi bàn giao chờ reviewer | P0 | test | PRD Mục 7.16 (bàn giao); brainstorm Mục 6.1 (D2, D3); URD UN-003 |
| FR-kanban-workspaces-013 | Hàng chờ và quyết định duyệt | Hệ thống phải hiển thị hàng chờ bàn giao cho reviewer (người giao mặc định; quản lý scope và owner duyệt được — OQ-1) kèm ghi chú kết quả, evidence và lịch sử task; khi reviewer quyết định, hệ thống phải ghi DA_DUYET (task HOAN_TAT) hoặc TU_CHOI kèm phản hồi bắt buộc (task về DANG_LAM, phản hồi thành bình luận) | P0 | test | PRD Mục 7.16 (approval); brainstorm Mục 6.1 (D4); URD UN-004 |
| FR-kanban-workspaces-014 | Đóng không hoàn tất | Hệ thống phải cho người có quyền đóng task ở MOI/DANG_LAM/CHO_DUYET sang DA_HUY kèm lý do bắt buộc; DA_HUY không mở lại | P0 | test | brainstorm Mục 6.3; URD UN-011 |
| FR-kanban-workspaces-015 | Xóa task chưa có hoạt động | Nếu task chưa có bình luận/đính kèm/bàn giao, thì hệ thống phải cho xóa hẳn và ghi audit; task đã có hoạt động chỉ được đóng không hoàn tất | P1 | test | brainstorm Mục 6.1 (D6) |
| FR-kanban-workspaces-016 | Mở lại task hoàn tất | Khi task HOAN_TAT cần làm lại, hệ thống phải cho mở lại kèm lý do bắt buộc → về DANG_LAM và ghi lịch sử | P1 | test | brainstorm Mục 6.1 (D8); URD UN-011 |
| FR-kanban-workspaces-017 | Lịch sử hoạt động | Hệ thống phải ghi lịch sử trên task cho mọi thay đổi: tạo, sửa trường, đổi cột/trạng thái, đổi assignee, bình luận, đính kèm, bàn giao (gửi/duyệt/từ chối), đóng/mở lại — ai, khi nào, trước → sau | P0 | kiểm tra | PRD Mục 7.16 (history), Mục 9; URD UN-008 |
| FR-kanban-workspaces-018 | Thông báo | Hệ thống phải gửi thông báo qua `contextual-notifications` cho: được giao, đổi assignee/hạn, task sắp/quá hạn (hằng ngày tới khi xử lý), bàn giao chờ duyệt quá SLA 2 ngày, quyết định duyệt — đúng người liên quan | P0 | test | brainstorm Mục 4, 7.2; URD UN-009 |
| FR-kanban-workspaces-019 | Hiển thị link nguồn | Khi task có nguồn từ `meeting-to-tasks`, hệ thống phải hiển thị link về đầu việc/biên bản và cờ "nguồn đã cập nhật" cho tới khi có người xác nhận đối chiếu; feature này không tự đồng bộ nội dung nguồn | P0 | demo | upstream spec FR-meeting-to-tasks-011; brainstorm Mục 5.5 |
| FR-kanban-workspaces-020 | Chặn tạo vào board lưu trữ | Nếu board đích ở LUU_TRU (kể cả khi `meeting-to-tasks` tạo task), hệ thống phải từ chối tạo và báo chọn board khác hoặc khôi phục | P0 | test | brainstorm Mục 6.5 |
| FR-kanban-workspaces-021 | Cờ thiếu owner | Khi assignee bị gỡ khỏi workspace hoặc tài khoản hết hiệu lực, hệ thống phải gắn cờ "assignee ngoài workspace", đưa task vào danh sách thiếu owner và báo owner | P1 | test | brainstorm Mục 6.4, 6.5 |
| FR-kanban-workspaces-022 | Lọc và tìm trên board | Hệ thống phải cho lọc task theo assignee, ưu tiên, nhóm trạng thái, quá hạn và tìm theo từ khóa tiêu đề; viewer lọc được nhưng không thao tác | P1 | demo | brainstorm Mục 4 (P1); URD UN-006 |
| FR-kanban-workspaces-023 | Thao tác hàng loạt | Hệ thống phải cho chọn nhiều task và đổi assignee/hạn/cột có xác nhận, báo kết quả từng task; task lỗi không chặn task hợp lệ | P1 | test | brainstorm Mục 4 (P1) |
| FR-kanban-workspaces-024 | Báo cáo workspace | Hệ thống phải cung cấp số liệu trên workspace: task quá hạn, bàn giao chờ >SLA, hoàn tất theo kỳ — phục vụ đọc của `management-reporting` | P1 | demo | brainstorm Mục 4 (P1); PRD Mục 7.25 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-kanban-workspaces-001 | human-in-the-loop | 100% task ở HOAN_TAT đi qua bàn giao có reviewer người duyệt — không đường tự đóng, không tác nhân tự động kết luận | P0 | Kiểm join TASK–HANDOVER: 0 task HOAN_TAT thiếu bàn giao DA_DUYET (bám PRD Mục 12) |
| NFR-kanban-workspaces-002 | permission | Truy cập workspace/board/task theo membership + organization/role/data-scope, deny-by-default; viewer chỉ đọc | P0 | Access test: người ngoài workspace bị từ chối có audit; 0 incident (bám M-GR-01) |
| NFR-kanban-workspaces-003 | integrity | Một task có đúng một assignee người dùng nội bộ; trạng thái task luôn khớp nhóm cột đang chứa hoặc trạng thái cổng (CHO_DUYET/HOAN_TAT/DA_HUY) | P0 | Kiểm dữ liệu: 0 task thiếu assignee, 0 task HOAN_TAT nằm ngoài cột hoàn tất |
| NFR-kanban-workspaces-004 | auditability | Mọi thay đổi trên task truy vết được qua lịch sử hoạt động (ai, khi nào, trước → sau) | P0 | Truy vết đủ vết của một task mẫu từ tạo đến HOAN_TAT |
| NFR-kanban-workspaces-005 | performance | Board với ≤500 task và ≤20 cột tải trong ≤3 giây (phân trang 50 task/cột) | P1 | Đo thời gian tải trên mẫu pilot (giá trị đề xuất — OQ-6) |
| NFR-kanban-workspaces-006 | data-retention | Task, bình luận, đính kèm, lịch sử giữ theo vòng đời workspace; xóa theo chính sách DPO | P1 | Chính sách retention được duyệt — chờ DPO/legal (PRD OQ-6, spec OQ-7) |
| NFR-kanban-workspaces-007 | resilience | Thông báo lỗi không làm mất thao tác task; retry theo `contextual-notifications` và log thất bại | P0 | Test notification fail: task/trạng thái đúng, log retry đầy đủ |
| NFR-kanban-workspaces-008 | language | Toàn bộ giao diện và thông báo tiếng Việt tự nhiên | P0 | Kiểm tra wording mẫu brainstorm Mục 7.3 |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-kanban-workspaces-001 | Task chỉ đạt HOAN_TAT qua bàn giao DA_DUYET của reviewer — cấm kéo trực tiếp vào cột hoàn tất | Mọi yêu cầu đổi trạng thái | FR-009, FR-013 | brainstorm Mục 6.1 (D9); PRD Mục 12 |
| BR-kanban-workspaces-002 | Bàn giao bắt buộc ghi chú kết quả ≥10 ký tự; file evidence tùy chọn nhưng nhắc khi thiếu | Gửi bàn giao | FR-012 | PRD Mục 7.16 rủi ro chính; brainstorm OQ-2 |
| BR-kanban-workspaces-003 | Từ chối bàn giao bắt buộc phản hồi ≥10 ký tự, phản hồi trở thành bình luận trên task | Reviewer từ chối | FR-013 | brainstorm Mục 7.1 |
| BR-kanban-workspaces-004 | Một task có đúng một assignee là thành viên workspace còn hiệu lực | Tạo/gán assignee | FR-005, FR-006 | BR-meeting-to-tasks-006; brainstorm OQ-4 |
| BR-kanban-workspaces-005 | Assignee chỉ chọn trong thành viên workspace; khách ngoài không làm assignee | Chọn assignee | FR-006 | brainstorm Mục 8; upstream convention |
| BR-kanban-workspaces-006 | Mỗi cột gán đúng một trong 4 nhóm trạng thái cố định; di chuyển giữa cột mở đổi trạng thái theo nhóm | Tạo/sửa cột, kéo task | FR-004, FR-008 | brainstorm OQ-3 |
| BR-kanban-workspaces-007 | Task đã có hoạt động (comment/đính kèm/bàn giao) không được xóa hẳn — chỉ đóng không hoàn tất | Yêu cầu xóa task | FR-015 | brainstorm Mục 6.1 (D6) |
| BR-kanban-workspaces-008 | Đóng không hoàn tất và mở lại task hoàn tất đều bắt buộc lý do ≥10 ký tự | Đóng/mở lại task | FR-014, FR-016 | brainstorm Mục 7.1 |
| BR-kanban-workspaces-009 | Board LUU_TRU không nhận task mới từ bất kỳ nguồn nào | Tạo task | FR-020 | brainstorm Mục 6.5 |
| BR-kanban-workspaces-010 | Sửa bình luận chỉ trong 15 phút và hiển thị "đã sửa"; xóa bình luận giữ vết | Sửa/xóa comment | FR-010 | brainstorm Mục 6.5, 7.2 |
| BR-kanban-workspaces-011 | Reviewer mặc định là người tạo task; quản lý scope và workspace owner duyệt được; admin không duyệt thay | Phân hàng chờ duyệt | FR-013 | brainstorm OQ-1 (đề xuất) |
| BR-kanban-workspaces-012 | Task có nguồn `meeting-to-tasks` giữ link bắt buộc; cờ "nguồn đã cập nhật" chỉ tắt khi có người xác nhận đối chiếu | Hiển thị/sửa task | FR-019 | upstream spec; bám PRD OQ-9 |
| BR-kanban-workspaces-013 | Hệ thống không tự đóng task, không tự duyệt bàn giao, không suy luận chất lượng | Mọi tác nhân tự động | FR-012, FR-013 | PRD Mục 12 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-kanban-workspaces-001 | Assignee không hợp lệ | Giao cho người không phải thành viên hoặc hết hiệu lực | major | FR-006 | Hiện "Người phụ trách phải là thành viên còn hiệu lực của workspace — chọn người khác" | Chọn thành viên khác hoặc thêm thành viên |
| E-kanban-workspaces-002 | Bàn giao thiếu ghi chú kết quả | Gửi bàn giao bỏ trống/<10 ký tự | minor | FR-012 | Hiện "Vui lòng ghi kết quả bàn giao trước khi gửi duyệt" | Nhập ghi chú kết quả |
| E-kanban-workspaces-003 | Từ chối thiếu phản hồi | Reviewer từ chối không nhập phản hồi | minor | FR-013 | Hiện "Vui lòng nhập phản hồi khi từ chối bàn giao" | Nhập phản hồi |
| E-kanban-workspaces-004 | Kéo vào cột có cổng | Kéo task vào cột nhóm chờ duyệt/hoàn tất | minor | FR-009 | Hiện "Chuyển sang chờ duyệt qua thao tác Bàn giao — không kéo trực tiếp" | Dùng thao tác Bàn giao |
| E-kanban-workspaces-005 | Xóa task đã có hoạt động | Xóa task có comment/đính kèm/bàn giao | major | FR-015 | Hiện "Công việc đã có hoạt động — chỉ có thể đóng không hoàn tất" | Đóng không hoàn tất kèm lý do |
| E-kanban-workspaces-006 | Thiếu lý do bắt buộc | Đóng/mở lại không nhập lý do | minor | FR-014, FR-016 | Hiện "Vui lòng nhập lý do ..." | Nhập lý do |
| E-kanban-workspaces-007 | Không có quyền workspace | Người ngoài/thiếu vai trò thao tác | major | FR-002, FR-008 | Hiện "Bạn không có quyền trên workspace này — xin quyền từ owner" | Xin quyền; sự kiện ghi audit |
| E-kanban-workspaces-008 | Tạo vào board lưu trữ | Tạo task trên board LUU_TRU | major | FR-020 | Hiện "Bảng này đã lưu trữ — chọn bảng khác hoặc khôi phục trước" | Chọn board khác/khôi phục |
| E-kanban-workspaces-009 | Thiếu tiêu đề | Lưu task bỏ trống tiêu đề | minor | FR-005 | Hiện "Tiêu đề công việc không được để trống" | Điền tiêu đề |
| E-kanban-workspaces-010 | Sửa đồng thời | Người thứ hai lưu khi task vừa được cập nhật | minor | FR-017 | Hiện "Công việc vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-kanban-workspaces-011 | Thông báo thất bại | Notification lỗi sau retry | minor | FR-018 | Task vẫn đúng trạng thái; log hiện "thông báo chưa gửi được" | Retry theo contextual-notifications; báo tay |
| E-kanban-workspaces-012 | Upload đính kèm lỗi | File vượt giới hạn/lỗi document-intake | minor | FR-011 | Báo lỗi theo wording document-intake | Tải lại file hợp lệ |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-kanban-workspaces-01 | Task hoàn tất đúng hạn và đủ kết quả (metric chính PRD Mục 7.16) | Tỷ lệ task HOAN_TAT đúng hạn và có ghi chú kết quả / tổng task HOAN_TAT | ≥80% sau 1 tháng pilot (đề xuất — chờ OQ-2 PRD) |
| SC-kanban-workspaces-02 | Mọi task hoàn tất qua duyệt | Tỷ lệ task HOAN_TAT có HANDOVER DA_DUYET kèm ghi chú kết quả | 100% |
| SC-kanban-workspaces-03 | Task luôn có owner hợp lệ | Tỷ lệ task có assignee nội bộ còn hiệu lực | 100% (guardrail) |
| SC-kanban-workspaces-04 | Bàn giao được quyết định kịp thời | Tỷ lệ bàn giao có quyết định trong ≤2 ngày làm việc | ≥95% (đề xuất) |
| SC-kanban-workspaces-05 | Lịch sử đầy đủ | Số task đổi trạng thái/trường thiếu bản ghi lịch sử | 0 |
| SC-kanban-workspaces-06 | Task từ biên bản giữ liên kết nguồn | Tỷ lệ task có source hiển thị link hợp lệ | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __WORKSPACE__ — không gian công việc theo nhóm/phòng ban/dự án: tên,
  loại, đơn vị liên quan, trạng thái.
- __WORKSPACE_MEMBER__ — thành viên workspace và vai trò
  owner/member/viewer.
- __BOARD__ — bảng Kanban trong workspace: tên, mô tả, trạng thái lưu
  trữ.
- __BOARD_COLUMN__ — cột trên board: tên, thứ tự, nhóm trạng thái cố
  định.
- __TASK__ — công việc trên board/cột: tiêu đề, mô tả, assignee, hạn, ưu
  tiên, trạng thái, link nguồn.
- __TASK_COMMENT__ — bình luận trên task: tác giả, nội dung, vết sửa/
  xóa.
- __TASK_DOCUMENT__ — file đính kèm trên task qua `document-intake`.
- __HANDOVER__ — một lần bàn giao: ghi chú kết quả, evidence, reviewer,
  quyết định, phản hồi.
- __TASK_ACTIVITY__ — lịch sử hoạt động trên task: ai, hành động, trường,
  trước → sau.
- __APP_USER__, __ORG_UNIT__, __INTAKE_DOCUMENT__ — tham chiếu tối thiểu
  sang `account-access`, `org-governance`, `document-intake`.

Chi tiết quan hệ + thuộc tính ở `srs/kanban-workspaces-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo workspace → thành viên → board + cột → tạo task → giao
  → thông báo.
- __Flow 2:__ Assignee làm task → cập nhật/bình luận/đính kèm → bàn giao
  → reviewer duyệt → HOAN_TAT.
- __Flow 3:__ Bàn giao bị từ chối → về đang làm + phản hồi → làm lại →
  bàn giao lại.
- __Flow 4:__ Task không cần → đóng không hoàn tất kèm lý do; task hoàn
  tất thiếu sót → mở lại kèm lý do; board hết dùng → lưu trữ/khôi phục.
- __Flow 5:__ Task từ `meeting-to-tasks` → hiển thị link nguồn → cờ nguồn
  đổi → đối chiếu → tắt cờ.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __workspace-list__ — danh sách workspace của tôi + tạo workspace.
- __board-view__ — bảng Kanban: cột, task card, lọc, tô sáng quá hạn.
- __task-detail__ — chi tiết task: trường, bình luận, đính kèm, link
  nguồn, lịch sử.
- __handover-form__ — gửi bàn giao: ghi chú kết quả + đính kèm evidence.
- __handover-queue__ — hàng chờ bàn giao của reviewer + duyệt/từ chối.
- __board-settings__ — quản lý cột, tên board, lưu trữ.
- __workspace-members__ — thành viên và vai trò.
- __workspace-reports__ — task trễ, chờ duyệt lâu, hoàn tất theo kỳ.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Task HOAN_TAT chỉ qua bàn giao có người duyệt — không tự đóng, không AI kết luận | PRD Mục 12 (invariant) — Product owner |
| Truy cập theo membership + organization/role/data-scope + audit | PRD Mục 9 — Security owner |
| Một task đúng một assignee người dùng nội bộ | BR-meeting-to-tasks-006 — Product owner (align upstream) |
| File đính kèm chỉ qua `document-intake`; thông báo chỉ qua `contextual-notifications` | Brainstorm Mục 8 — Document AI/Platform owner |
| Ghi chú kết quả bắt buộc khi bàn giao | PRD Mục 7.16 (rủi ro chính) — Product owner |
| Feature `Should` — không thuộc cam kết pilot v1 | PRD Mục 6.1, Feature Map — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO/legal |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| `org-governance`: đơn vị, role/scope, audit | Platform | Toàn bộ feature (phụ thuộc khai báo Feature Map) |
| `account-access`: danh bạ người dùng nội bộ | Platform | FR-002, FR-006 |
| `document-intake`: cổng file đính kèm | Document AI | FR-011 |
| `contextual-notifications`: kênh thông báo | Platform | FR-018 |
| `meeting-to-tasks`: tạo task có link nguồn vào board | Meetings & Work | FR-019 (không chặn task thủ công) |
| `management-reporting`: đọc outcome task/bàn giao | Insights | FR-024 (không chặn vận hành) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Reviewer bàn giao mặc định là người tạo task; quản lý scope + owner duyệt được | FR-013 phân hàng chờ sai — chờ Product owner (OQ-1) |
| Ghi chú kết quả bắt buộc; evidence tùy chọn có nhắc | FR-012 đổi điều kiện — chờ Product owner (OQ-2) |
| Chỉ 4 nhóm trạng thái cột cố định | FR-004/009 và state machine đổi — chờ Product owner (OQ-3) |
| Quản lý/HR hoặc vai trò được gán mới tạo workspace/board | FR-001 mở rộng quyền tạo — chờ Product owner (OQ-5) |
| Giới hạn số (20 cột, 50 board, 50 task/trang, 20 file, 10 MB, 100 thành viên, comment 15 phút, SLA 2 ngày, tải ≤3 giây) là chuẩn slice này | FR-004/010/011, NFR-005 đổi ngưỡng (OQ-6) |
| Task từ upstream xử lý như task thường + link nguồn bắt buộc | FR-019 phải tách kiểu task |
| Retention theo vòng đời workspace, xóa theo DPO | NFR-006 đổi mô hình vòng đời (OQ-7) |

## 12. Open Questions

- [x] OQ-1: Ai là reviewer mặc định của bàn giao? — Resolved (đề xuất):
  người tạo/giao task; quản lý trong scope và workspace owner duyệt
  được; admin không duyệt thay — chờ Product owner xác nhận.
- [x] OQ-2: Evidence đính kèm có bắt buộc khi bàn giao? — Resolved (đề
  xuất): ghi chú kết quả bắt buộc; file evidence tùy chọn nhưng nhắc khi
  thiếu — chờ Product owner xác nhận.
- [x] OQ-3: Nhóm trạng thái cột có tùy biến không? — Resolved (đề xuất):
  chỉ 4 nhóm cố định, tên/số cột tùy biến trong giới hạn — chờ Product
  owner xác nhận.
- [x] OQ-4: Một task nhiều assignee? — Resolved: không, đúng một assignee
  nội bộ trong v1 (bám `meeting-to-tasks` BR-006); nhóm/đơn vị là P2.
- [x] OQ-5: Ai tạo workspace/board? — Resolved (đề xuất): quản lý/HR hoặc
  vai trò được gán qua `org-governance` — chờ Product owner xác nhận.
- [x] OQ-6: Các giới hạn đề xuất (20 cột, 50 board, 50 task/trang, 20
  file, 10 MB, 100 thành viên, comment 15 phút, SLA duyệt 2 ngày, tải ≤3
  giây, ≤500 task/board)? — Resolved (đề xuất): chấp nhận làm chuẩn
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
