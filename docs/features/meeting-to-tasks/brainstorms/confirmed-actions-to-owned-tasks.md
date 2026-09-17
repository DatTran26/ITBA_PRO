---
type: brainstorm
feature: meeting-to-tasks
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md]
---

# Từ đầu việc đã xác nhận thành task có chủ — meeting-to-tasks

## 1. Idea Seed

Từ biên bản đã được chủ trì xác nhận, từng đầu việc được chuyển thành một
task thật trên board Kanban: có mô tả, có đúng một người phụ trách nội bộ,
có hạn và mức ưu tiên, nằm đúng workspace mà chủ trì chọn — và task luôn
giữ liên kết ngược về đầu việc/biên bản nguồn để ai cũng truy nguyên được
việc này sinh ra từ quyết định nào.

## 2. Context

Biên bản họp (kể cả biên bản AI đã xác nhận từ `ai-meeting-minutes`) thường
chết ở dạng văn bản: đầu việc nằm trong trang biên bản nhưng không ai chịu
trách nhiệm thực thi vì không có task trong công cụ theo dõi công việc. Hai
rủi ro chính theo PRD Mục 7.15 là duplicate task (cùng một việc bị tạo nhiều
lần) và task mất liên kết biên bản (không biết task sinh ra từ đâu). Invariant
human-in-the-loop và mục "Chưa làm" của PRD Mục 7.15 cấm tự giao việc khi
người phụ trách hoặc đơn vị đích chưa được xác định — mọi task phải qua bước
resolve assignee và chọn workspace của con người. Feature này là `Should`
trong theme Meetings & Work — không thuộc cam kết pilot v1. Phụ thuộc theo
Feature Map: `ai-meeting-minutes` (đầu việc đã xác nhận kèm cờ resolve) và
`kanban-workspaces` (workspace/board/task đích). Nguồn ITBAAI có lớp task CRM
đơn giản (`crm_tasks`: title, description, status, assignee, due_date —
reverse spec `talent-and-crm` FR-TL-06) — đây là bằng chứng triển khai của
mô hình task tối thiểu, không phải bằng chứng nhu cầu.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Chủ trì | Đầu việc trong biên bản không thành trách nhiệm thật; phải nhắc tay từng người | Chuyển từng đầu việc thành task có owner/hạn đúng board trong vài bước |
| Assignee (người được giao) | Việc được giao bằng lời/chat dễ trôi, không có chỗ theo dõi | Nhận task rõ mô tả, hạn, ưu tiên + biết task xuất phát từ quyết định nào |
| Quản lý | Không kiểm soát được đầu việc họp có được thực thi không | Thấy đầu việc đã thành task, đang ở trạng thái nào, ai giữ |
| Participant khác | Không nhớ cuộc họp đã giao việc gì cho mình | Xem từ biên bản sang task liên quan mình |

## 4. Capabilities Breakdown

### P0 — must have

- Danh sách đầu việc đã xác nhận: trên biên bản PUBLISHED, liệt kê các đầu
  việc (đã giữ/đã sửa/thêm tay) kèm trạng thái chuyển đổi — "chưa tạo task",
  "đã tạo task", "đã bỏ qua".
- Review action trước khi tạo: chủ trì mở đầu việc, chỉnh lại tiêu đề/mô tả
  cho phù hợp ngữ cảnh task (bản đề xuất AI có thể thiếu ngữ cảnh).
- Resolve assignee bắt buộc: người phụ trách phải là người dùng nội bộ cụ
  thể — kế thừa kết quả resolve của `ai-meeting-minutes` hoặc chủ trì gán
  trực tiếp; đầu việc còn "chưa xác định" thì không tạo được task.
- Chọn đích thủ công: workspace + board mà task sẽ vào; gợi ý board của đơn
  vị sở hữu cuộc họp nhưng không tự chọn.
- Tạo task kèm đầy đủ: tiêu đề, mô tả, assignee, hạn, mức ưu tiên; task ghi
  nguồn (biên bản + đầu việc + cuộc họp) và hiển thị link ngược.
- Chống trùng: một đầu việc chỉ tạo được một task còn hiệu lực; cảnh báo khi
  trên board đích đã có task tương tự.
- Thông báo assignee khi task được tạo (qua `contextual-notifications`).
- Theo dõi hai chiều: từ đầu việc xem task đã tạo + trạng thái hiện tại; từ
  task nhảy về đầu việc và biên bản nguồn.
- Bỏ qua đầu việc có lý do: không phải đầu việc nào cũng cần task — chủ trì
  đánh dấu "bỏ qua" kèm lý do, đầu việc vẫn nằm trong biên bản.

### P1 — should have

- Chuyển nhiều đầu việc cùng lúc (bulk) khi đã đủ assignee/hạn.
- Gán watchers/người liên quan ngoài assignee chính.
- Cảnh báo khi đầu việc nguồn bị sửa trong revision biên bản sau khi task
  đã tạo ("nguồn đã cập nhật — kiểm tra task").
- Đồng bộ một chiều trạng thái tóm tắt của task về hiển thị trên đầu việc
  (đang làm / hoàn tất / quá hạn).

### P2 — nice to have

- Đề xuất board đích bằng AI theo nội dung đầu việc.
- Tự tạo task mẫu định kỳ từ đầu việc lặp (họp tuần).
- Giao cho nhóm/đơn vị thay vì cá nhân (khi mô hình group-assignee được
  chốt ở `kanban-workspaces`).

## 5. Core Flows (Happy Path)

### 5.1 Chọn action → xác nhận owner/hạn → tạo task → thông báo → theo dõi

1) Trên biên bản PUBLISHED, chủ trì mở mục "Đầu việc" — danh sách hiện từng
   đầu việc kèm trạng thái chuyển đổi.
2) Chủ trì chọn một đầu việc "chưa tạo task" → mở form chuyển đổi: tiêu đề
   và mô tả lấy sẵn từ đầu việc (chỉnh được), người phụ trách đã resolve
   (đổi được), hạn đề xuất, mức ưu tiên, workspace + board đích.
3) Chủ trì kiểm tra: assignee là người dùng nội bộ cụ thể, hạn và ưu tiên
   hợp lệ, board đích đúng.
4) Bấm "Tạo công việc" → hệ thống tạo task trên board đích, ghi nguồn
   (cuộc họp + biên bản + đầu việc), đánh dấu đầu việc "đã tạo task".
5) Hệ thống gửi thông báo cho assignee; chủ trì và participant thấy từ đầu
   việc link sang task và trạng thái hiện tại của task.

```
Chủ trì                     Hệ thống                        Assignee
─────────────────────────────────────────────────────────────────────────
Biên bản PUBLISHED
        │
        ▼ chọn đầu việc "chưa tạo task"
   ┌─────────────────────────────────────┐
   │ Form chuyển đổi:                    │
   │  tiêu đề/mô tả (sửa được)           │
   │  assignee (đã resolve, đổi được)    │
   │  hạn + ưu tiên + workspace/board    │
   └───────────────┬─────────────────────┘
                   ▼
        ── Đủ điều kiện tạo? ──┐
          │                   │
        Có ▼               Không ▼
     Tạo task trên      Chặn + báo lý do:
     board đích         thiếu assignee /
     + ghi nguồn        chưa chọn board /
     + link ngược       đã có task
          │
          ▼
     Đầu việc → "đã tạo task" ──▶ thông báo ──▶ assignee nhận task
          │
          ▼
     Từ đầu việc xem task + trạng thái; từ task nhảy về biên bản
```

### 5.2 Resolve assignee trước khi tạo task

1) Đầu việc có cờ "chưa xác định" (tên nguyên văn từ transcript) → form
   chuyển đổi bắt buộc chọn người dùng nội bộ trước khi nút "Tạo công việc"
   khả dụng.
2) Chủ trì chọn người trong danh bạ → đầu việc cập nhật resolved user (ghi
   ngược về `ai-meeting-minutes`).
3) Nếu việc thực sự thuộc người ngoài tổ chức (khách): không tạo task được —
   chủ trì đánh dấu "bỏ qua" kèm lý do "phụ trách ngoài hệ thống".

### 5.3 Chống trùng task

1) Đầu việc đã "đã tạo task" → nút tạo vô hiệu, hiện link task hiện có.
2) Khi tạo, hệ thống kiểm tra board đích có task tiêu đề/nội dung tương tự
   → cảnh báo "có thể trùng" kèm link task nghi trùng; chủ trì quyết định
   tạo mới hay hủy.
3) Task nguồn bị xóa sau đó → đầu việc hiện "task đã xóa", cho phép tạo lại
   task mới từ cùng đầu việc.

### 5.4 Theo dõi và xử lý lệch nguồn

1) Từ đầu việc trong biên bản: xem task đã tạo + trạng thái hiện tại
   (đang làm/hoàn tất/quá hạn).
2) Từ task trên board: mục "Nguồn" nhảy về đầu việc và biên bản PUBLISHED.
3) Khi đầu việc nguồn bị sửa trong revision biên bản sau khi task đã tạo →
   task hiện cờ "nguồn đã cập nhật" để assignee/chủ trì tự đối chiếu — hệ
   thống không tự ghi đè nội dung task.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Đầu việc thuộc biên bản đã PUBLISHED? | Cho phép chuyển đổi | Không hiện trong danh sách (đầu việc nháp/đề xuất không đủ điều kiện) |
| D2 | 5.1/5.2 | Assignee đã resolve thành người dùng nội bộ? | Cho tạo task | Chặn + bắt buộc chọn người; nếu phụ trách ngoài hệ thống → "bỏ qua" |
| D3 | 5.1 | Workspace + board đích đã chọn và chủ trì có quyền tạo task trên đó? | Cho tạo task | Chặn + báo chọn board hợp lệ hoặc xin quyền |
| D4 | 5.3 | Đầu việc đã có task còn hiệu lực? | Chặn tạo, hiện link task hiện có | Cho tạo bình thường |
| D5 | 5.3 | Board đích có task tương tự? | Cảnh báo nghi trùng + link, chủ trì quyết | Tạo bình thường |
| D6 | 5.1 | Người được giao là khách ngoài (không tài khoản)? | Không tạo task — chỉ ghi trong biên bản | — |
| D7 | 5.1 | Gửi thông báo assignee thành công? | Ghi log đã thông báo | Task vẫn tồn tại; thông báo retry theo `contextual-notifications` |
| D8 | 5.4 | Đầu việc nguồn bị sửa sau khi task tạo? | Task hiện cờ "nguồn đã cập nhật" | Task giữ nguyên snapshot |

### 6.2 Scenario Matrix

| Vai trò | Đầu việc chưa tạo task | Đầu việc có cờ chưa xác định | Đầu việc đã tạo task | Đầu việc đã bỏ qua |
|---|---|---|---|---|
| Chủ trì | mở form chuyển đổi, tạo task, bỏ qua | resolve người rồi tạo, hoặc bỏ qua | xem task + trạng thái | xem, mở lại chuyển đổi |
| Assignee | — | — | nhận thông báo, mở task, xem nguồn biên bản | — |
| Participant | xem đầu việc | xem đầu việc + cờ | xem link task + trạng thái | xem |
| Quản lý trong scope | xem danh sách | xem | xem task + trạng thái | xem |
| Admin theo scope | như chủ trì (ghi rõ thay) | như chủ trì | xem | xem |

### 6.3 State Transitions

```
đầu việc (trên biên bản publish):
   chưa-tạo-task ──▶ đã-tạo-task ──▶ (task bị xóa) ──▶ chưa-tạo-task (cho tạo lại)
        │                ▲
        └──▶ đã-bỏ-qua ──┘ (mở lại chuyển đổi)

task liên kết: (vòng đời chi tiết thuộc kanban-workspaces)
   đã tạo → đang thực hiện → hoàn tất / bị xóa
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| đầu việc | — | chưa-tạo-task | biên bản publish có đầu việc | — |
| đầu việc | chưa-tạo-task | đã-tạo-task | chủ trì "Tạo công việc" thành công | không (trừ khi task bị xóa) |
| đầu việc | đã-tạo-task | chưa-tạo-task | task nguồn bị xóa | có (tạo lại) |
| đầu việc | chưa-tạo-task | đã-bỏ-qua | chủ trì "Bỏ qua" kèm lý do | có (mở lại chuyển đổi) |
| đầu việc | đã-bỏ-qua | chưa-tạo-task | chủ trì mở lại chuyển đổi | — |
| task | — | (tồn tại trên board) | tạo thành công | vòng đời theo `kanban-workspaces` |
| cờ nguồn trên task | — | nguồn-đã-cập-nhật | đầu việc gốc bị sửa trong revision biên bản | có (sau khi đối chiếu xong) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Chủ trì đóng form chuyển đổi giữa chừng | đầu việc vẫn "chưa tạo task" | mở lại form, nhập lại (dữ liệu form không lưu) | — |
| Tạo task thành công nhưng thông báo lỗi | task đã tồn tại + link | thông báo retry theo `contextual-notifications` | log thông báo thất bại |
| Task vừa bị xóa trong lúc chủ trì xem đầu việc | đầu việc vẫn hiện "đã tạo task" cũ | tải lại → "task đã xóa" + cho tạo lại | — |
| 2 người có quyền cùng bấm tạo từ 1 đầu việc | chỉ 1 task được tạo (chống trùng theo đầu việc) | người sau thấy "đã có task" + link | — |
| Đầu việc bị sửa trong revision khi đang mở form | form giữ snapshot cũ | khi bấm tạo → cảnh báo nguồn đã đổi, hỏi tiếp tục | — |
| Biên bản bị archive sau khi task tạo | task vẫn tồn tại, link nguồn hiện trạng thái archived | xem nguồn bình thường (read-only) | — |

### 6.5 Other Edge Cases

- Đầu việc không có hạn (AI không trích được): hạn task để trống được — hạn
  không bắt buộc, nhưng hiện nhắc nhở "chưa có hạn" để chủ trì quyết.
- Đầu việc do chủ trì thêm tay (không phải AI): chuyển đổi bình thường như
  đầu việc AI.
- Tổ chức chưa có workspace/board nào: form báo cần tạo board trước ở
  `kanban-workspaces`, giữ đầu việc "chưa tạo task".
- Assignee bị vô hiệu tài khoản sau khi tạo: task xử lý theo
  `kanban-workspaces`; đầu việc vẫn hiện link task.
- Cuộc họp bị hủy sau khi đã tạo task: task không tự xóa; link nguồn hiện
  cuộc họp CANCELLED để người đọc có ngữ cảnh.
- Empty state: biên bản không có đầu việc nào → mục "Đầu việc" hiện thông
  báo trống, không hiện nút chuyển đổi.
- Bulk: chọn nhiều đầu việc đã đủ điều kiện → tạo lần lượt, báo kết quả
  từng mục (mục lỗi không chặn mục hợp lệ).

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Điều kiện chuyển đổi | đầu việc thuộc biên bản PUBLISHED, trạng thái "chưa tạo task" hoặc "đã bỏ qua" (mở lại) |
| Assignee | bắt buộc là 1 người dùng nội bộ còn hiệu lực; đầu việc "chưa xác định" phải resolve trước |
| Workspace + board | bắt buộc chọn; chủ trì phải có quyền tạo task trên board đích |
| Tiêu đề task | bắt buộc, không rỗng, tối đa 200 ký tự |
| Mô tả task | tùy chọn, tối đa 5.000 ký tự; mặc định lấy nội dung đầu việc |
| Hạn | tùy chọn, ngày hợp lệ; cho phép quá khứ nhưng cảnh báo |
| Mức ưu tiên | bắt buộc; 1 trong: thấp, trung bình, cao, khẩn (thống nhất với `kanban-workspaces`) |
| Lý do bỏ qua | bắt buộc khi đánh dấu "bỏ qua" |
| Chống trùng | 1 đầu việc chỉ gắn với tối đa 1 task còn hiệu lực |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Đầu việc chuyển đổi mỗi lần bulk | 20 mục | mỗi thao tác | chặn chọn thêm, báo giới hạn |
| Độ dài tiêu đề task | 200 ký tự | — | chặn lưu, báo số ký tự vượt |
| Độ dài mô tả task | 5.000 ký tự | — | chặn lưu |
| Gợi ý task tương tự hiển thị | 5 task | mỗi cảnh báo | chỉ hiện top theo độ giống |
| Thời gian giữ cờ "nguồn đã cập nhật" | đến khi người dùng xác nhận đã đối chiếu | — | tự tắt sau xác nhận |
| Retry thông báo assignee | theo chính sách `contextual-notifications` | — | log thất bại cuối cùng |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Chưa resolve assignee | "Chưa thể tạo công việc — đầu việc chưa xác định được người phụ trách" | E-? |
| Chưa chọn board | "Vui lòng chọn workspace và bảng đích cho công việc" | E-? |
| Không có quyền trên board | "Bạn không có quyền tạo công việc trên bảng này — chọn bảng khác hoặc xin quyền" | E-? |
| Đầu việc đã có task | "Đầu việc này đã được tạo thành công việc — xem {liên kết task}" | E-? |
| Thiếu tiêu đề | "Tiêu đề công việc không được để trống" | E-? |
| Chưa có board nào | "Chưa có bảng công việc nào — hãy tạo bảng trong workspace trước" | E-? |
| Phụ trách ngoài hệ thống | "Không thể giao công việc cho người ngoài tổ chức — đánh dấu bỏ qua kèm lý do" | E-? |
| Nguồn đã đổi khi tạo | "Đầu việc nguồn vừa được cập nhật trong biên bản — kiểm tra lại trước khi tạo" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo task xong | "Đã tạo công việc và giao cho {tên assignee}" |
| Bulk xong | "Đã tạo {x}/{n} công việc — {y} đầu việc lỗi cần kiểm tra" |
| Bỏ qua | "Đã đánh dấu bỏ qua đầu việc — vẫn giữ trong biên bản" |
| Resolve người | "Đã gán {tên người} làm người phụ trách" |
| Mở lại chuyển đổi | "Đầu việc đã mở lại — có thể tạo công việc" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Cảnh báo nghi trùng | "Bảng {tên} đã có {n} công việc có thể trùng — xem trước khi tạo" |
| Task đã xóa | "Công việc đã tạo trước đó bị xóa — có thể tạo lại" |
| Nguồn đã cập nhật | "Đầu việc nguồn đã thay đổi trong biên bản — đối chiếu lại nội dung" |
| Nhãn nguồn trên task | "Nguồn: biên bản cuộc họp \"{tên cuộc họp}\" ngày {ngày} — đầu việc #{n}" |
| Empty state | "Biên bản này không có đầu việc nào cần chuyển thành công việc" |
| Trạng thái chuyển đổi | "Chưa tạo công việc / Đã tạo công việc / Đã bỏ qua" |

## 8. Assumptions

- Chỉ đầu việc thuộc biên bản PUBLISHED mới được chuyển đổi — đầu việc trong
  bản đề xuất chưa xác nhận không phải cam kết chính thức (bám invariant
  human-in-the-loop).
- Chủ trì là người khởi tạo chuyển đổi; admin theo scope làm thay có ghi rõ.
  Assignee không tự chuyển đổi đầu việc của mình (tránh tự gán việc không qua
  chủ trì) — Assumption, chờ Product owner.
- Task chỉ giao cho người dùng nội bộ có tài khoản; phụ trách ngoài hệ thống
  thì đầu việc nằm lại trong biên bản (đánh dấu bỏ qua kèm lý do).
- Không tự chọn workspace/board đích — việc "đơn vị chưa xác định" thuộc
  "Chưa làm" của PRD Mục 7.15; hệ thống chỉ gợi ý board của đơn vị sở hữu
  cuộc họp.
- Task giữ snapshot nội dung tại thời điểm tạo; sửa đầu việc trong revision
  biên bản không tự ghi đè task — chỉ bật cờ "nguồn đã cập nhật" (bám hướng
  owner-review của PRD OQ-9).
- Một task có đúng 1 assignee trong v1 (bám mô hình `crm_tasks` của nguồn và
  giữ trách nhiệm rõ); watchers là P1.
- Mức ưu tiên 4 mức (thấp/trung bình/cao/khẩn) dùng chung với
  `kanban-workspaces` — Assumption cần align khi feature đó đặc tả.
- Giới hạn số ở Mục 7.2 (bulk 20 mục, 200/5.000 ký tự, 5 gợi ý trùng) là
  giá trị đề xuất thận trọng — chờ owner chốt (xem OQ-5).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Duplicate task cho cùng một việc | thường | hai người cùng làm một việc hoặc board nhiễu, mất niềm tin vào hệ thống | 1 đầu việc ↔ tối đa 1 task còn hiệu lực; cảnh báo task tương tự trên board đích |
| Task mất liên kết biên bản nguồn | thỉnh thoảng | không truy nguyên được quyết định gốc, tranh chấp "ai nói giao việc này" | task ghi nguồn bắt buộc; link hai chiều; cờ khi nguồn đổi |
| Chủ trì tạo task khi assignee sai | thỉnh thoảng | việc rơi vào người không liên quan, task bị bỏ quên | bắt buộc resolve người dùng nội bộ cụ thể; thông báo assignee để phản hồi sớm |
| Đầu việc được tạo task nhưng không ai theo dõi | thường | đầu việc họp vẫn trôi dù có task | trạng thái task hiển thị ngược trên biên bản; quản lý xem được trong scope |
| Assignee vắng/nghỉ ngay sau khi giao | thỉnh thoảng | task treo không owner | task chuyển xử lý theo `kanban-workspaces` (reassign); cảnh báo khi assignee vô hiệu |
| Biên bản sửa làm nội dung task lệch | hiếm | assignee làm theo nội dung cũ | cờ "nguồn đã cập nhật" + đối chiếu tay; không auto-sync âm thầm |
| Chuyển đổi hàng loạt không kiểm soát | hiếm | spam task, board nhiễu | giới hạn bulk 20 mục; báo kết quả từng mục |

## 10. Success Criteria (preliminary)

- Tỷ lệ đầu việc đã xác nhận được giao đúng owner — mục tiêu theo PRD Mục
  7.15; con số chờ OQ-2 PRD (đề xuất ≥80% đầu việc có task gắn assignee nội
  bộ hợp lệ trong pilot).
- 100% task tạo từ feature này có link nguồn hợp lệ tới đầu việc + biên bản.
- 0 đầu việc có 2 task còn hiệu lực cùng lúc (guardrail chống trùng).
- 100% task có assignee là người dùng nội bộ (0 task giao cho người chưa
  xác định hoặc ngoài hệ thống).
- Tỷ lệ task từ biên bản được hoàn tất đúng hạn — đo chung với
  `kanban-workspaces` (SC của feature đó).

## 11. Open Questions

- [x] OQ-1: Ai được khởi tạo chuyển đổi — chỉ chủ trì hay cả assignee tự
  tạo task cho mình? — Resolved (đề xuất): chủ trì (hoặc admin theo scope
  làm thay) khởi tạo; assignee nhận task qua thông báo — tránh tự gán việc
  không qua chủ trì, chờ Product owner xác nhận.
- [x] OQ-2: Giao task cho khách ngoài/người không tài khoản? — Resolved:
  không — task cần người dùng nội bộ; đầu việc đó đánh dấu "bỏ qua" kèm lý
  do, vẫn nằm trong biên bản.
- [x] OQ-3: Có tự chọn workspace/board đích không? — Resolved: không — chủ
  trì chọn thủ công, hệ thống chỉ gợi ý board đơn vị sở hữu cuộc họp (bám
  "Chưa làm" PRD Mục 7.15).
- [x] OQ-4: Đầu việc nguồn bị sửa sau khi task tạo thì sync không? —
  Resolved (đề xuất): không auto-sync; task giữ snapshot + cờ "nguồn đã cập
  nhật" để con người đối chiếu (bám hướng owner-review của PRD OQ-9).
- [x] OQ-5: Giới hạn số Mục 7.2 (bulk 20, 200/5.000 ký tự, 5 gợi ý trùng)?
  — Resolved (đề xuất): giá trị v1 thận trọng — chờ Product owner.
- [x] OQ-6: Retention cho bản ghi chuyển đổi và link nguồn? — Resolved (đề
  xuất): giữ theo vòng đời task + biên bản; biên bản/task xóa theo chính
  sách thì link ghi "nguồn đã xóa" — chờ DPO/legal (PRD OQ-6).
- [~] OQ-7: Giao task cho nhóm/đơn vị thay vì cá nhân? — Out of scope v1:
  cần mô hình group-assignee ở `kanban-workspaces` trước.
- [~] OQ-8: Watchers/người liên quan ngoài assignee? — Out of scope v1
  (P1); v1 giữ đúng 1 assignee rõ trách nhiệm.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd meeting-to-tasks` — capture user perspective
- `/brd meeting-to-tasks` — business case
- `/prd-epic meeting-to-tasks` — product scope
