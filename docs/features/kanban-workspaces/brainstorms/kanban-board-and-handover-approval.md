---
type: brainstorm
feature: kanban-workspaces
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/meeting-to-tasks/srs/meeting-to-tasks-spec.md
---

# Kanban workspace có bàn giao và phê duyệt — kanban-workspaces

## 1. Idea Seed

Một workspace công việc theo nhóm/phòng ban/dự án chứa các board Kanban:
board gồm cột, task có tiêu đề, mô tả, một assignee, hạn, mức ưu tiên và
trạng thái; task có bình luận, file đính kèm và lịch sử hoạt động đầy đủ.
Điểm khác biệt so với kanban thông thường: task không tự đóng — khi xong
việc, assignee "bàn giao" kèm ghi chú kết quả (và evidence), một người có
thẩm quyền duyệt bàn giao thì task mới HOAN_TAT. Mọi thay đổi trạng thái
đều lưu vết: ai đổi, khi nào, từ đâu sang đâu.

## 2. Context

Việc nội bộ hiện được giao qua chat, email và lời nói: không ai biết task
đang ở đâu, ai phụ trách, hạn nào, và "xong" nghĩa là gì — người làm bảo
xong nhưng không có kết quả bàn giao, người giao phải đuổi hỏi. PRD Mục
7.16 đặt feature này trong theme Meetings & Work với luồng chính "tạo/
giao task → thực hiện → cập nhật → bàn giao/duyệt → đóng", rủi ro chính
là "status cập nhật nhưng outcome/evidence thiếu" và đo thành công bằng
"tỷ lệ task hoàn tất đúng hạn và đủ kết quả".

Feature này ở mức `Should` trong Feature Map — KHÔNG thuộc cam kết pilot
v1 (v1 chỉ gồm 15 feature `Must`). Nó là đích đổ của `meeting-to-tasks`
(task từ biên bản đã xác nhận được tạo vào board ở đây), đọc phạm vi qua
`org-governance` (phụ thuộc khai báo), nhận file qua `document-intake` và
báo việc qua `contextual-notifications`; `management-reporting` đọc
outcome công việc từ đây. Nguồn ITBAAI có tầng CRM tasks (notes/tasks/
tags trong `talent-and-crm`) — bằng chứng triển khai, chưa phải bằng chứng
nhu cầu.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Nhân viên | Việc được giao qua chat/lời nói, không rõ hạn, không biết "xong" tới đâu | Task rõ mô tả, hạn, ưu tiên; cập nhật tiến độ và bàn giao có chốt |
| Người giao việc (chủ trì/quản lý/HR) | Giao việc rồi mất dấu, phải nhắc tay | Giao task có owner + hạn, theo dõi trạng thái, duyệt bàn giao có kết quả |
| Quản lý | Không thấy khối lượng và tắc nghẽn của đội trong phạm vi | Board theo đội: task nào trễ, chờ duyệt, quá tải |
| Workspace owner (trưởng nhóm/dự án) | Không kiểm soát ai vào board, cột lộn xộn | Quản lý thành viên, cột và quyền trên workspace của mình |
| Admin | Truy vết ai đổi gì trên task, xử lý tranh chấp "có giao không" | Lịch sử hoạt động đầy đủ, audit truy cập |

## 4. Capabilities Breakdown

### P0 — must have

- Workspace theo nhóm/phòng ban/dự án: tạo workspace, gán đơn vị liên
  quan, quản lý thành viên với vai trò owner/member/viewer.
- Board trong workspace: tạo/sửa/lưu trữ board; cột có thứ tự, mỗi cột
  gán một nhóm trạng thái cố định (mới / đang làm / chờ duyệt / hoàn
  tất); đổi tên và thêm cột trong giới hạn.
- Task đầy đủ: tiêu đề, mô tả, một assignee là người dùng nội bộ, hạn
  (không bắt buộc nhưng nhắc khi trống), mức ưu tiên 4 mức (thấp, trung
  bình, cao, khẩn — thống nhất với `meeting-to-tasks`), trạng thái.
- Kéo/di chuyển task giữa các cột = đổi trạng thái có kiểm soát (vào cột
  "chờ duyệt" chỉ qua thao tác bàn giao — không kéo thẳng vào "hoàn tất").
- Bình luận trên task; file đính kèm qua `document-intake`.
- Bàn giao + duyệt: assignee gửi bàn giao kèm ghi chú kết quả bắt buộc
  (đính kèm evidence tùy chọn, nhắc khi thiếu); reviewer duyệt → HOAN_TAT
  hoặc từ chối kèm phản hồi → về đang làm.
- Lịch sử hoạt động trên task: mọi thay đổi trường, trạng thái, assignee,
  comment, bàn giao — ai, khi nào, trước → sau.
- Thông báo: được giao, đổi hạn, sắp/quá hạn, bàn giao chờ duyệt, quyết
  định duyệt — qua `contextual-notifications`.
- Hiển thị link nguồn trên task được tạo từ `meeting-to-tasks` (về đầu
  việc/biên bản).
- Xóa task chỉ khi chưa có hoạt động; còn lại dùng "đóng không hoàn tất".

### P1 — should have

- Lọc/tìm task trên board theo assignee, ưu tiên, quá hạn, nhãn trạng
  thái; tô sáng task quá hạn.
- Thao tác hàng loạt trên task (đổi assignee, đổi hạn, chuyển cột) có xác
  nhận.
- Mẫu board mặc định theo loại workspace (bộ cột gợi ý).
- Báo cáo đơn giản trên workspace: task quá hạn, chờ duyệt lâu, hoàn tất
  theo kỳ — phục vụ `management-reporting`.
- Watchers ngoài assignee (người quan tâm nhận thông báo).

### P2 — nice to have

- Subtask/checklist trong task.
- Giao task cho nhóm/đơn vị thay một người cụ thể.
- Timeline/Gantt, portfolio đa board — PRD "Chưa làm" (không thay thế
  project portfolio management).
- Đồng bộ task ra công cụ ngoài — thuộc `external-integrations`.
- Automation rule (tự đổi cột khi sự kiện X).

## 5. Core Flows (Happy Path)

### 5.1 Tạo workspace/board → tạo và giao task

1) Người có quyền tạo workspace (loại: phòng ban/dự án/nhóm), gán đơn vị
   liên quan → thêm thành viên với vai trò.
2) Tạo board trong workspace → bộ cột mặc định (Việc mới / Đang làm /
   Chờ duyệt / Hoàn tất), đổi tên/thêm cột nếu cần.
3) Trên board, "Tạo công việc": nhập tiêu đề, mô tả, chọn assignee từ
   thành viên workspace (người dùng nội bộ còn hiệu lực), hạn, ưu tiên.
4) Task vào cột "Việc mới" (MOI) → assignee nhận thông báo.

```
Người giao việc                Hệ thống                       Assignee
─────────────────────────────────────────────────────────────────────────
Tạo workspace + thành viên
        │
        ▼
Tạo board (cột mặc định)
        │
        ▼
"Tạo công việc"
tiêu đề + mô tả + assignee
+ hạn + ưu tiên
        │
        ▼
   ── Assignee là người nội
      bộ còn hiệu lực? ──┐
   │                    │
  Không ▶ chặn, báo     │
   chọn người khác      │
   │                    │
  Có ▼                  │
 task ở cột MOI ────────┼─── thông báo ───▶ assignee thấy task
```

### 5.2 Thực hiện task: cập nhật, bình luận, đính kèm

1) Assignee mở task → kéo sang "Đang làm" (DANG_LAM), cập nhật mô tả/
   tiến độ qua bình luận, đính kèm file qua `document-intake`.
2) Người giao/quản lý bình luận trao đổi; mọi thay đổi trường (hạn, ưu
   tiên, assignee) đều vào lịch sử.
3) Đổi assignee/hạn → hệ thống thông báo cho người liên quan; task quá
   hạn được tô sáng và nhắc.

### 5.3 Bàn giao → duyệt → hoàn tất

1) Assignee bấm "Bàn giao" → nhập ghi chú kết quả (bắt buộc) + đính kèm
   evidence (tùy chọn, nhắc khi thiếu) → task sang CHO_DUYET, vào hàng
   chờ của reviewer.
2) Reviewer (người giao việc mặc định, hoặc quản lý có quyền) mở bàn
   giao: xem ghi chú kết quả + evidence + lịch sử task.
3) "Duyệt" → task HOAN_TAT, chuyển cột "Hoàn tất", thông báo assignee.
   "Từ chối" kèm phản hồi → task về DANG_LAM, phản hồi thành bình luận.
4) Bàn giao bị từ chối: assignee làm tiếp rồi bàn giao lại — mỗi lần bàn
   giao là một bản ghi riêng trong lịch sử.

```
Assignee                      Hệ thống                      Reviewer
─────────────────────────────────────────────────────────────────────────
"Bàn giao"
        │
        ▼
   ── Có ghi chú kết quả? ──┐
   │                        │
  Không ▶ chặn, yêu cầu     │
   nhập kết quả             │
   │                        │
  Có ▼                      │
 task CHO_DUYET ────────────┼─────────────▶ hàng chờ bàn giao
                                             │
                                             ▼
                                    ── Duyệt bàn giao? ──┐
                                       │                  │
                                     Có ▼               Không ▼
                                  HOAN_TAT           về DANG_LAM
                                  + thông báo        + phản hồi thành
                                                     bình luận
                                                     → assignee làm
                                                       tiếp, bàn giao lại
```

### 5.4 Đóng/mở lại task và vòng đời board

1) Task không còn cần làm → người có quyền "Đóng không hoàn tất"
   (DA_HUY) kèm lý do; task giữ trong lịch sử.
2) Task HOAN_TAT phát hiện thiếu → mở lại kèm lý do → về DANG_LAM, ghi
   audit.
3) Board hết dùng → owner lưu trữ board: ẩn khỏi danh sách, task giữ
   nguyên để truy vết; khôi phục được.

### 5.5 Task từ biên bản cuộc họp

1) `meeting-to-tasks` tạo task vào board đích (đã chọn thủ công ở
   upstream) — task mang link nguồn về đầu việc/biên bản.
2) Task xử lý như task thường; mục "Nguồn" trên task hiển thị link về
   biên bản; khi nguồn bị sửa, cờ "nguồn đã cập nhật" do upstream đặt
   được hiển thị tới khi có người xác nhận đối chiếu.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Assignee là người dùng nội bộ còn hiệu lực và là thành viên workspace? | Cho giao, task vào MOI | Chặn, yêu cầu chọn người hợp lệ |
| D2 | 5.3 | Bàn giao có ghi chú kết quả? | Cho gửi, task CHO_DUYET | Chặn, yêu cầu nhập kết quả |
| D3 | 5.3 | Bàn giao thiếu file evidence? | Cho gửi nhưng hiện nhắc "chưa đính kèm evidence" | Gửi bình thường |
| D4 | 5.3 | Reviewer đồng ý duyệt bàn giao? | HOAN_TAT + thông báo | Về DANG_LAM + phản hồi bắt buộc thành bình luận |
| D5 | 5.2 | Người di chuyển/sửa task có quyền trên workspace? | Cho thao tác | Chặn + ghi nhận truy cập bị từ chối |
| D6 | 5.4 | Task đã có hoạt động (comment/attachment/bàn giao)? | Chỉ cho "Đóng không hoàn tất", chặn xóa | Cho xóa hẳn |
| D7 | 5.1/5.2 | Hạn task để trống? | Cho lưu nhưng hiện nhắc "chưa có hạn" | Không nhắc |
| D8 | 5.4 | Mở lại task HOAN_TAT? | Cho phép kèm lý do bắt buộc → DANG_LAM + audit | — |
| D9 | 5.2 | Kéo task vào cột nhóm "chờ duyệt"/"hoàn tất" trực tiếp? | Chặn — phải qua thao tác bàn giao | Cho kéo giữa các cột mở |
| D10 | 5.1 | Hạn trong quá khứ khi tạo task? | Cho lưu + cảnh báo | Không làm gì |

### 6.2 Scenario Matrix

| Vai trò | Tạo board/cột | Tạo task | Được gán/làm task | Bình luận | Bàn giao | Duyệt bàn giao |
|---|---|---|---|---|---|---|
| Workspace owner | có, trong workspace mình | có | có | có | khi là assignee | khi là reviewer |
| Member | không | có | có | có | task của mình | khi được gán reviewer |
| Viewer | không | không | không | xem | không | không |
| Quản lý trong scope | xem | xem/giao khi là member | khi được gán | có | khi là assignee | có trong scope |
| Admin | kiểm tra | kiểm tra | không | xem | không | kiểm tra (không duyệt thay) |

### 6.3 State Transitions

```
trạng thái task (TASK):

MOI ──bắt đầu làm──▶ DANG_LAM ──gửi bàn giao──▶ CHO_DUYET ──duyệt──▶ HOAN_TAT
 ▲                    ▲                            │                    │
 │                    └──từ chối bàn giao───────────┘                    │
 │                    (kèm phản hồi)                                    │
 │                                                                     │
 └────────────────mở lại kèm lý do─────────────────────────────────────┘

MOI/DANG_LAM/CHO_DUYET ──đóng không hoàn tất──▶ DA_HUY (không mở lại)

bàn giao (HANDOVER): CHO_DUYET ──duyệt──▶ DA_DUYET
                     CHO_DUYET ──từ chối──▶ TU_CHOI (task về DANG_LAM)

board: HOAT_DONG ──lưu trữ──▶ LUU_TRU ──khôi phục──▶ HOAT_DONG
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| task | — | MOI | tạo task (thủ công hoặc từ `meeting-to-tasks`) | — |
| task | MOI | DANG_LAM | assignee/người có quyền kéo sang cột đang làm | có (kéo về) |
| task | DANG_LAM | CHO_DUYET | assignee gửi bàn giao đủ ghi chú kết quả | — |
| task | CHO_DUYET | HOAN_TAT | reviewer duyệt bàn giao | có (mở lại kèm lý do → DANG_LAM) |
| task | CHO_DUYET | DANG_LAM | reviewer từ chối bàn giao kèm phản hồi | — |
| task | MOI/DANG_LAM/CHO_DUYET | DA_HUY | người có quyền đóng không hoàn tất kèm lý do | không |
| task | HOAN_TAT | DANG_LAM | mở lại kèm lý do bắt buộc | — |
| bàn giao | — | CHO_DUYET | assignee gửi bàn giao | — |
| bàn giao | CHO_DUYET | DA_DUYET | reviewer duyệt | không |
| bàn giao | CHO_DUYET | TU_CHOI | reviewer từ chối kèm phản hồi | không (bàn giao mới khi gửi lại) |
| board | HOAT_DONG | LUU_TRU | owner lưu trữ | có (khôi phục) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người tạo đóng giữa lúc soạn task | nội dung chưa lưu mất (hoặc bản nháp local) | mở lại form tạo | không cần |
| 2 người cùng sửa 1 task | bản lưu sau ghi đè | cảnh báo "task vừa được {người} cập nhật — tải lại" | không merge tự động |
| Upload đính kèm gián đoạn | task thiếu file | tải lại qua document-intake | file lỗi theo luồng document-intake |
| Thông báo giao/duyệt thất bại | task vẫn ở trạng thái đúng | retry theo `contextual-notifications`; log thất bại | báo tay khi cần |
| Reviewer nghỉ việc khi có bàn giao chờ | bàn giao CHO_DUYET treo | workspace owner/quản lý scope nhận hàng chờ; gán reviewer mới | — |
| Assignee nghỉ việc khi đang giữ task | task MOI/DANG_LAM treo | workspace owner được cảnh báo để gán lại | task vào danh sách "thiếu owner" |

### 6.5 Other Edge Cases

- Task do `meeting-to-tasks` tạo vào board mà người đó không còn quyền:
  task tồn tại bình thường; quyền xem/sửa theo membership hiện tại.
- Board đích bị lưu trữ trong khi `meeting-to-tasks` đang tạo task: chặn
  tạo vào board LUU_TRU — upstream báo lỗi chọn board khác.
- Assignee bị gỡ khỏi workspace khi đang giữ task: task hiện cờ "assignee
  ngoài workspace", owner gán lại.
- Xóa workspace: chỉ khi không còn board HOAT_DONG; khuyến khích lưu trữ.
- Task HOAN_TAT bị mở lại nhiều lần: mỗi lần mở lại kèm lý do và vào
  lịch sử — không giới hạn số lần nhưng báo cáo đếm được.
- Bình luận xóa/sửa: sửa được trong 15 phút (đề xuất — OQ-6), vết "đã
  sửa" hiển thị; xóa bình luận chỉ tác giả/admin, giữ vết "bình luận đã
  xóa".
- Empty state: workspace chưa có board → gợi ý tạo board đầu tiên; board
  chưa có task → gợi ý tạo task hoặc nhận từ biên bản.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên workspace | bắt buộc, ≤100 ký tự, duy nhất trong tổ chức |
| Loại workspace | bắt buộc; 1 trong: phòng ban, dự án, nhóm |
| Tên board | bắt buộc, ≤100 ký tự |
| Tên cột | bắt buộc, ≤50 ký tự, duy nhất trong board |
| Nhóm trạng thái cột | bắt buộc; 1 trong 4: mới, đang làm, chờ duyệt, hoàn tất |
| Tiêu đề task | bắt buộc, không rỗng, ≤200 ký tự |
| Mô tả task | tùy chọn, ≤5.000 ký tự |
| Assignee | bắt buộc; người dùng nội bộ còn hiệu lực, thành viên workspace |
| Hạn | tùy chọn; trống thì nhắc "chưa có hạn"; quá khứ thì cảnh báo |
| Ưu tiên | bắt buộc; 1 trong 4: thấp, trung bình, cao, khẩn |
| Ghi chú kết quả bàn giao | bắt buộc, ≥10 ký tự, ≤2.000 ký tự |
| Phản hồi từ chối bàn giao | bắt buộc, ≥10 ký tự, ≤2.000 ký tự |
| Lý do đóng không hoàn tất / mở lại | bắt buộc, ≥10 ký tự |
| Bình luận | bắt buộc nội dung, ≤2.000 ký tự |
| File đính kèm | theo whitelist `document-intake`; ≤10 MB/file (đề xuất — OQ-6) |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số cột mỗi board | 20 (đề xuất — OQ-6) | mỗi board | chặn thêm cột |
| Số board mỗi workspace | 50 (đề xuất — OQ-6) | mỗi workspace | chặn tạo, gợi ý lưu trữ bớt |
| Task hiển thị mỗi cột | 50 task/trang | — | phân trang trong cột |
| Số file đính kèm mỗi task | 20 file (đề xuất — OQ-6) | mỗi task | chặn thêm |
| Kích thước file đính kèm | ≤10 MB/file (đề xuất — OQ-6) | mỗi file | từ chối file, theo document-intake |
| Thành viên mỗi workspace | 100 (đề xuất — OQ-6) | mỗi workspace | chặn thêm thành viên |
| Sửa bình luận | trong 15 phút sau đăng (đề xuất — OQ-6) | — | sau đó chỉ đọc |
| Nhắc quá hạn | hằng ngày tới khi xử lý (đề xuất — OQ-6) | rolling | thông báo assignee + người giao |
| Nhắc bàn giao chờ duyệt | SLA 2 ngày làm việc (đề xuất — OQ-6) | rolling | nhắc reviewer + owner |
| Retention task/comment/attachment | chờ PRD OQ-6 (DPO duyệt) | — | trước pilot chỉ dữ liệu synthetic |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Assignee không hợp lệ | "Người phụ trách phải là thành viên còn hiệu lực của workspace — chọn người khác" | E-? |
| Bàn giao thiếu ghi chú kết quả | "Vui lòng ghi kết quả bàn giao trước khi gửi duyệt" | E-? |
| Từ chối thiếu phản hồi | "Vui lòng nhập phản hồi khi từ chối bàn giao" | E-? |
| Kéo thẳng vào cột chờ duyệt | "Chuyển sang chờ duyệt qua thao tác Bàn giao — không kéo trực tiếp" | E-? |
| Xóa task đã có hoạt động | "Công việc đã có hoạt động — chỉ có thể đóng không hoàn tất" | E-? |
| Đóng không hoàn tất thiếu lý do | "Vui lòng nhập lý do đóng công việc" | E-? |
| Mở lại task hoàn tất thiếu lý do | "Vui lòng nhập lý do mở lại công việc" | E-? |
| Không có quyền trên workspace | "Bạn không có quyền trên workspace này — xin quyền từ owner" | E-? |
| Tạo task vào board lưu trữ | "Bảng này đã lưu trữ — chọn bảng khác hoặc khôi phục trước" | E-? |
| Thiếu tiêu đề | "Tiêu đề công việc không được để trống" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo task | "Đã tạo công việc '{tiêu đề}' và giao cho {assignee}" |
| Gửi bàn giao | "Đã gửi bàn giao cho {reviewer} duyệt" |
| Duyệt bàn giao | "Công việc '{tiêu đề}' đã hoàn tất" |
| Từ chối bàn giao | "Đã trả công việc về đang làm kèm phản hồi" |
| Hoàn tất thao tác hàng loạt | "Đã cập nhật {x}/{n} công việc" |
| Lưu trữ board | "Đã lưu trữ bảng '{tên}' — có thể khôi phục bất cứ lúc nào" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Task chưa có hạn | "Công việc chưa có hạn — đặt hạn để theo dõi" |
| Task quá hạn | "Công việc '{tiêu đề}' quá hạn {n} ngày" |
| Bàn giao thiếu evidence | "Chưa đính kèm evidence — vẫn gửi bàn giao?" |
| Bàn giao chờ duyệt lâu | "Bàn giao '{tiêu đề}' chờ duyệt {n} ngày — nhắc {reviewer}" |
| Task từ biên bản | "Nguồn: đầu việc trong biên bản '{cuộc họp}'" |
| Cờ nguồn đổi | "Đầu việc nguồn vừa được cập nhật trong biên bản — đối chiếu lại" |
| Assignee ngoài workspace | "Người phụ trách không còn trong workspace — cần gán lại" |
| Sửa đồng thời | "Công việc vừa được {người} cập nhật — tải lại để xem bản mới nhất" |
| Empty state board | "Chưa có công việc nào — tạo việc đầu tiên hoặc nhận từ biên bản họp" |

## 8. Assumptions

- Một task có đúng một assignee người dùng nội bộ trong v1 — bám
  BR-meeting-to-tasks-006 và `crm_tasks` nguồn; giao cho nhóm/đơn vị là
  P2.
- Reviewer của bàn giao mặc định là người giao việc (người tạo task);
  quản lý trong scope và workspace owner có thể duyệt — đề xuất, chờ
  Product owner (OQ-1).
- Ghi chú kết quả là bắt buộc khi bàn giao — đây là chốt trực tiếp rủi
  ro chính của PRD Mục 7.16 ("status cập nhật nhưng outcome/evidence
  thiếu"); file evidence khuyến khích nhưng không bắt buộc (đề xuất —
  OQ-2).
- Cột là cách nhìn, trạng thái là sự thật: mỗi cột gán một trong 4 nhóm
  trạng thái cố định; chỉ bàn giao mới đưa task vào nhóm "chờ duyệt",
  chỉ duyệt mới vào "hoàn tất".
- Workspace membership kiểm soát quyền: viewer chỉ xem; deny-by-default
  với người ngoài workspace, trừ quản lý có data-scope bao phủ.
- `meeting-to-tasks` chỉ TẠO task vào board — toàn bộ vòng đời sau đó
  thuộc feature này; link nguồn do upstream ghi, feature này chỉ hiển
  thị.
- `document-intake` là cổng duy nhất cho file đính kèm;
  `contextual-notifications` là kênh thông báo duy nhất;
  `org-governance` cung cấp đơn vị/scope cho workspace.
- Giới hạn số ở Mục 7.2 là giá trị đề xuất — cần owner chốt (OQ-6).
- Human-in-the-loop: trạng thái HOAN_TAT chỉ đạt được qua duyệt của con
  người; không tự đóng task, không tự kết luận chất lượng (PRD Mục 12).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Task được đánh dấu "xong" nhưng không có kết quả (rủi ro chính PRD Mục 7.16) | thường | việc bỏ dở ngầm, tranh chấp "đã làm chưa", báo cáo sai | bàn giao bắt buộc ghi chú kết quả + duyệt của reviewer; nhắc evidence |
| Board trở thành nghĩa địa task — không ai cập nhật, trạng thái ảo | thường | mất niềm tin vào số liệu tiến độ, quản lý không còn nhìn được tắc nghẽn | nhắc quá hạn hằng ngày, báo cáo task trễ/chờ duyệt lâu, đóng không hoàn tất có lý do |
| Quyền workspace lỏng → người ngoài scope xem/sửa task nhạy cảm | thỉnh thoảng | lộ thông tin nội bộ giữa các đội | membership + deny-by-default + audit truy cập bị từ chối (PRD Mục 9) |
| Hai người tranh quyền sửa task (assignee vs người giao) | thỉnh thoảng | mất dữ liệu cập nhật, cãi nhau phiên bản | cảnh báo sửa đồng thời, lịch sử trước → sau để truy vết |
| Bàn giao chờ duyệt mãi khi reviewer bận/nghỉ | thỉnh thoảng | task treo không hoàn tất, tiến độ ảo | SLA duyệt 2 ngày + nhắc, owner/quản lý scope nhận hàng chờ thay |
| Task tạo từ biên bản mất liên kết nguồn | thỉnh thoảng | không truy nguyên được cam kết cuộc họp (rủi ro PRD Mục 7.15) | hiển thị link nguồn bắt buộc trên task có source; cờ nguồn đổi |
| Retention comment/file/lịch sử chưa được DPO duyệt | thường | giữ/xóa sai chính sách | chỉ dữ liệu synthetic trước khi OQ-6 PRD đóng |

## 10. Success Criteria (preliminary)

- Tỷ lệ task hoàn tất đúng hạn và đủ kết quả — metric chính của PRD Mục
  7.16; target ≥80% (đề xuất — chờ owner chốt).
- 100% task HOAN_TAT có bàn giao được duyệt với ghi chú kết quả không
  rỗng.
- 100% task có assignee là người dùng nội bộ còn hiệu lực.
- ≥95% bàn giao được quyết định trong SLA 2 ngày làm việc (đề xuất).
- 0 task đổi trạng thái không có vết trong lịch sử hoạt động.
- 0 sự cố vượt workspace/scope được xác nhận (guardrail bám M-GR-01).

## 11. Open Questions

- [x] OQ-1: Ai là reviewer mặc định của bàn giao? — Resolved (đề xuất):
  người tạo/giao task; quản lý trong scope và workspace owner duyệt
  được; admin không duyệt thay — chờ Product owner xác nhận.
- [x] OQ-2: Evidence đính kèm có bắt buộc khi bàn giao? — Resolved (đề
  xuất): ghi chú kết quả bắt buộc; file evidence tùy chọn nhưng nhắc khi
  thiếu — chờ Product owner xác nhận.
- [x] OQ-3: Nhóm trạng thái cột có tùy biến không? — Resolved (đề xuất):
  tên/số cột tùy biến trong giới hạn nhưng chỉ 4 nhóm trạng thái cố định
  (mới/đang làm/chờ duyệt/hoàn tất) — chờ Product owner xác nhận.
- [x] OQ-4: Một task nhiều assignee? — Resolved: không, đúng một assignee
  nội bộ trong v1 (bám `meeting-to-tasks` BR-006); nhóm/đơn vị là P2.
- [x] OQ-5: Ai tạo workspace/board? — Resolved (đề xuất): quản lý/HR
  hoặc vai trò được gán qua `org-governance`; member tạo task tự do
  trong board mình là thành viên — chờ Product owner xác nhận.
- [x] OQ-6: Các giới hạn đề xuất (20 cột, 50 board, 50 task/trang, 20
  file, 10 MB, 100 thành viên, sửa comment 15 phút, SLA duyệt 2 ngày)? —
  Resolved (đề xuất): chấp nhận làm chuẩn slice này — chờ Product owner
  xác nhận.
- [x] OQ-7: Retention task/comment/đính kèm/lịch sử? — Resolved (đề
  xuất): giữ theo vòng đời workspace; xóa theo chính sách DPO — chờ
  DPO/legal xác nhận (PRD OQ-6).
- [~] OQ-8: Watchers, subtask, giao cho nhóm? — Out of scope v1 (hướng
  P1/P2).
- [~] OQ-9: Đồng bộ task sang công cụ ngoài? — Out of scope v1 (thuộc
  `external-integrations`).
- [~] OQ-10: Timeline/Gantt/portfolio đa board? — Out of scope v1: PRD
  "Chưa làm" (không thay thế project portfolio management).

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd kanban-workspaces` — capture user perspective
- `/brd kanban-workspaces` — business case
- `/prd-epic kanban-workspaces` — product scope
