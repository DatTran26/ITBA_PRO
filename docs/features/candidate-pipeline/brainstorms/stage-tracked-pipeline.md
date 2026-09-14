---
type: brainstorm
feature: candidate-pipeline
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Stage-tracked Candidate Pipeline — candidate-pipeline

## 1. Idea Seed

Một bảng pipeline tuyển dụng nơi mỗi application luôn nằm ở đúng một stage hợp
lệ: HR chuyển stage qua state machine duy nhất (UI và API cùng một bộ quy tắc),
thao tác hàng loạt có preview + xác nhận, mở lại được hồ sơ đã kết thúc trong
thời hạn cho phép, và mọi thay đổi đều có lịch sử trước/sau kèm lý do.

## 2. Context

HR đang theo dõi ứng viên bằng spreadsheet + chat/email: trạng thái nằm rải rác,
không ai biết chắc ứng viên đang ở bước nào, hồ sơ "treo" hàng tuần không ai hay,
và khi chuyển người khác phụ trách thì mất toàn bộ lịch sử. Đây là mắt xích trung
tâm của hành trình tuyển dụng v1 (PRD Mục 7, bước 5): application từ `cv-intake`
(và tùy chọn `candidate-matching`) vào pipeline, rồi được điều phối tới
assessment/phỏng vấn (`interview-management`) và quyết định
(`interview-evaluation` → `offer-management` → `employee-onboarding`).

Bằng chứng nguồn (reverse spec `recruitment-and-interviews`): đã quan sát được
state machine application `NEW → SCREENED → SHORTLISTED → INTERVIEW_SCHEDULED →
PASSED/FAILED → OFFERED → ACCEPTED/OFFER_REJECTED → ONBOARDED`, có `REJECTED`,
và transition không hợp lệ bị từ chối. Rủi ro chính theo PRD: UI/API cho phép
transition khác nhau → v1 chốt một state machine duy nhất làm nguồn chân lý.

Nguyên tắc bất biến áp dụng: mọi quyết định loại/đạt đều do con người có quyền
thực hiện (AI chỉ đề xuất ở `candidate-matching`); mọi transition ghi audit và
tuân organization/role/data-scope; dữ liệu ứng viên (CV, ghi chú) theo
consent/access/retention policy.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Không biết mỗi ứng viên đang ở đâu, sót hạn, mất lịch sử khi bàn giao | Một board duy nhất: stage rõ, owner rõ, hạn rõ, chuyển trạng thái đúng luật và có vết |
| Quản lý | Muốn xem tiến độ tuyển các vị trí mình phụ trách nhưng sợ dữ liệu lẫn phạm vi | Xem pipeline đúng phạm vi quyền, thấy điểm nghẽn/quá hạn |
| Interviewer | Không rõ ứng viên mình sẽ phỏng vấn đang ở vòng nào | Xem stage + context của ứng viên được phân công |
| Admin | Rule chuyển trạng thái lệch giữa màn hình và xử lý nền | Một bộ quy tắc duy nhất, truy vết được ai đổi gì |
| Ứng viên | Không biết hồ sơ mình đi tới đâu (gián tiếp) | Trạng thái được phản ánh đúng khi hệ thống gửi thông báo/offer |

## 4. Capabilities Breakdown

### P0 — must have

- Bảng pipeline theo vị trí tuyển dụng: mỗi application thuộc đúng 1 stage; bộ
  stage cố định của v1 (dịch từ state machine nguồn): `NEW` "Mới tiếp nhận",
  `SCREENED` "Đã sàng lọc CV", `SHORTLISTED` "Vào danh sách ngắn",
  `INTERVIEW_SCHEDULED` "Đã xếp lịch phỏng vấn", `PASSED` "Đạt phỏng vấn",
  `FAILED` "Không đạt phỏng vấn", `OFFERED` "Đã gửi offer", `ACCEPTED` "Ứng
  viên đã chấp nhận", `OFFER_REJECTED` "Ứng viên từ chối offer", `ONBOARDED`
  "Đã chuyển onboarding", `REJECTED` "Đã từ chối", `WITHDRAWN` "Ứng viên rút
  hồ sơ", `ON_HOLD` "Tạm dừng (có lý do + hạn xem lại)".
- Transition chỉ qua state machine duy nhất: UI chỉ hiển thị stage đích hợp lệ;
  mọi transition (kể cả từ tác vụ nền/feature khác) đi qua cùng một bộ kiểm
  tra; transition không hợp lệ bị từ chối kèm lý do.
- Bắt buộc lý do khi chuyển sang `REJECTED`, `WITHDRAWN`, `ON_HOLD` và khi mở
  lại (restore); `ON_HOLD` bắt buộc thêm hạn xem lại.
- Chuyển stage đơn lẻ và hàng loạt: bulk action có preview danh sách hợp lệ /
  không hợp lệ, xác nhận trước khi chạy, báo kết quả từng hồ sơ.
- Filter/tìm kiếm: theo vị trí, stage, owner phụ trách, tình trạng quá hạn SLA,
  nguồn hồ sơ; tìm theo tên/email ứng viên.
- Activity history: mỗi transition lưu trạng thái trước → sau, người thực hiện,
  thời điểm, lý do và nguồn (thủ công / từ kết quả phỏng vấn / từ offer).
- Owner phụ trách cho mỗi application + hiển thị thời điểm vào stage và hạn SLA
  của stage hiện tại.
- Restore: mở lại application đã `REJECTED`/`WITHDRAWN`/`FAILED` về stage trước
  đó trong thời hạn cho phép, ghi lý do và người thực hiện.
- Phát sinh sự kiện nghiệp vụ khi transition để `contextual-notifications` báo
  cho owner/interviewer liên quan (và để `management-reporting` đo M-IN-01).
- Phân quyền theo organization/role/data-scope: HR chỉ thao tác application
  thuộc phạm vi mình quản lý; quản lý chỉ xem.

### P1 — should have

- SLA cấu hình được theo stage (và theo vị trí nếu cần); badge "sắp/quá hạn"
  trên card; danh sách hồ sơ treo.
- Ghi chú và tag trên application; saved view/filter cá nhân.
- Chuyển application sang vị trí tuyển dụng khác (giữ nguyên history, ghi lý
  do).
- Xuất danh sách application đang lọc (CSV) cho họp định kỳ.
- Đổi owner hàng loạt khi HR nghỉ/bàn giao.

### P2 — nice to have

- Workflow builder cho tổ chức tự định nghĩa stage (PRD ghi "Chưa làm" — đưa
  vào roadmap, không nằm trong v1).
- Automation rules (tự động nhắc, tự động đề xuất chuyển stage khi có kết quả
  assessment) — chỉ ở mức đề xuất, quyết định vẫn của con người.
- Candidate portal cho ứng viên tự xem trạng thái.
- Kanban nâng cao: swimlane theo owner, WIP limit mỗi stage.

## 5. Core Flows (Happy Path)

### 5.1 Chuyển stage một application

1) HR mở board pipeline của vị trí (hoặc mở chi tiết application) và chọn
   «Chuyển trạng thái».
2) Hệ thống hiển thị chỉ các stage đích hợp lệ từ stage hiện tại (ví dụ từ
   `SCREENED`: `SHORTLISTED`, `REJECTED`, `WITHDRAWN`, `ON_HOLD`).
3) Nếu stage đích bắt buộc lý do (`REJECTED`/`WITHDRAWN`/`ON_HOLD`), HR nhập lý
   do; `ON_HOLD` nhập thêm hạn xem lại.
4) HR xác nhận. Hệ thống kiểm tra stage hiện tại còn đúng (chống 2 người cùng
   thao tác), kiểm tra quyền theo phạm vi, rồi ghi transition + history
   (trước→sau, actor, thời điểm, lý do, nguồn "thủ công").
5) Hệ thống phát sự kiện cho thông báo tới owner/interviewer liên quan; board
   cập nhật card sang cột mới kèm hạn SLA mới.

```
HR trên board pipeline                Hệ thống                              Kết quả
──────────────────────────────────────────────────────────────────────────────────────

Mở card ứng viên → «Chuyển trạng thái»
        │
        ▼
┌────────────────────────────┐
│ Danh sách stage đích CHỈ   │
│ gồm stage hợp lệ từ stage  │
│ hiện tại (state machine)   │
└───────────┬────────────────┘
            ▼
   ── Stage đích bắt buộc lý do? ──
   (Từ chối / Rút / Tạm dừng)
   │                              │
  Có ▶ nhập lý do                 Không
   (+ hạn xem lại nếu Tạm dừng)    │
   └──────────────┬───────────────┘
                  ▼
        HR bấm «Xác nhận chuyển»
                  ▼
   ── Stage hiện tại còn đúng? ── (kiểm concurrent)
   │                             │
  Không ▶ "Hồ sơ đã được {ai}     Có ▼
   chuyển sang {stage} lúc   ┌────────────────────────────┐
   {giờ}" + tải lại màn      │ Ghi transition + history   │
                             │ trước→sau + actor + lý do  │
                             └───────────┬────────────────┘
                                         ▼
                             Phát sự kiện → thông báo cho
                             owner/interviewer liên quan
                                         ▼
                             Card sang cột mới + hạn SLA mới
```

### 5.2 Thao tác hàng loạt có xác nhận

1) HR lọc board (ví dụ "tất cả `NEW` quá 5 ngày của vị trí X") rồi chọn nhiều
   application (tối đa 50/lần).
2) Chọn bulk action «Chuyển sang {stage}» hoặc «Từ chối hàng loạt».
3) Hệ thống preview: nhóm hợp lệ sẽ chuyển + nhóm không hợp lệ (sai stage nguồn
   / không đủ quyền) kèm lý do từng dòng.
4) HR xác nhận phần hợp lệ (bắt buộc lý do nếu stage đích yêu cầu).
5) Hệ thống chạy từng hồ sơ độc lập, ghi history từng transition với nguồn
   "thao tác hàng loạt #{mã đợt}"; xong báo "Đã chuyển {N}/{M} hồ sơ".

### 5.3 Restore (mở lại) application đã kết thúc

1) HR mở application đang `REJECTED`/`WITHDRAWN`/`FAILED`.
2) Chọn «Mở lại hồ sơ» — chỉ hiện khi còn trong hạn restore (30 ngày, giả định)
   và người thao tác có quyền.
3) Nhập lý do bắt buộc → hệ thống đưa application về stage ngay trước khi kết
   thúc, ghi history "restore", phát sự kiện cho owner cũ.

### 5.4 Tạm dừng và quay lại (hold/unhold)

1) HR chọn «Tạm dừng» → nhập lý do + hạn xem lại → application sang `ON_HOLD`,
   không tính vi phạm SLA treo trong thời gian hold.
2) Đến hạn xem lại: hệ thống báo owner qua thông báo; HR chọn tiếp tục hold
   (hạn mới) hoặc đưa về stage trước khi hold.

### 5.5 Nhận application vào pipeline

1) Application được tạo từ `cv-intake` (sau khi HR xác nhận dữ liệu CV) hoặc từ
   `candidate-matching` (HR chấp nhận đề xuất) hoặc HR thêm thủ công hồ sơ đã
   review.
2) Application vào `NEW` của vị trí tương ứng, gán owner mặc định = người tạo/
   HR phụ trách vị trí, bắt đầu tính SLA stage `NEW`.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Stage đích nằm trong transition hợp lệ? | Cho chọn + xác nhận | Không hiển thị trong danh sách (API từ chối nếu cố gọi) |
| D2 | 5.1 | Stage đích thuộc nhóm bắt buộc lý do? | Hiện ô lý do (+ hạn xem lại nếu ON_HOLD) | Xác nhận ngay |
| D3 | 5.1 | Stage hiện tại còn khớp dữ liệu màn hình? | Ghi transition | Báo đã đổi bởi ai/lúc nào + tải lại |
| D4 | 5.1 | HR có quyền trên phạm vi application? | Cho phép | "Bạn không có quyền thao tác hồ sơ thuộc vị trí này" |
| D5 | 5.2 | Bulk preview: hồ sơ hợp lệ? | Đưa vào nhóm sẽ chuyển | Đưa vào nhóm bỏ qua + lý do từng dòng |
| D6 | 5.3 | Application kết thúc còn trong hạn restore? | Cho «Mở lại hồ sơ» | Ẩn action / báo hết hạn restore |
| D7 | 5.4 | Đến hạn xem lại của ON_HOLD? | Báo owner; owner chọn hold tiếp hoặc quay lại | Tiếp tục đếm ngược |

### 6.2 Scenario Matrix

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| NEW | SCREENED | HR đã review dữ liệu CV | Chuyển đơn/bulk | Ghi history, bắt SLA mới |
| NEW/SCREENED/SHORTLISTED | REJECTED | Bắt buộc lý do | Chuyển đơn/bulk | Ghi history + báo owner |
| NEW/SCREENED/SHORTLISTED | WITHDRAWN | Bắt buộc lý do (ứng viên rút) | Chuyển đơn | Ghi history |
| SCREENED | SHORTLISTED | — | Chuyển đơn/bulk | Ghi history |
| SHORTLISTED | INTERVIEW_SCHEDULED | Có phiên phỏng vấn được tạo | Từ `interview-management` (nguồn "hệ thống") | Ghi history |
| INTERVIEW_SCHEDULED | PASSED/FAILED | Kết quả vòng đã được HR chốt | Từ `interview-evaluation` (nguồn "hệ thống") | Ghi history |
| PASSED | OFFERED | Offer đã gửi | Từ `offer-management` | Ghi history |
| OFFERED | ACCEPTED/OFFER_REJECTED | Ứng viên phản hồi hoặc HR ghi thay | Từ `offer-management` | Ghi history |
| ACCEPTED | ONBOARDED | Onboarding hoàn tất chuyển đổi | Từ `employee-onboarding` | Ghi history |
| Bất kỳ stage mở | ON_HOLD | Bắt buộc lý do + hạn xem lại | Chuyển đơn | Miễn tính quá hạn SLA |
| ON_HOLD | stage trước khi hold | Hết hạn xem lại hoặc HR chủ động | Chuyển đơn | Tính lại SLA |
| REJECTED/WITHDRAWN/FAILED | stage ngay trước khi kết thúc | Trong hạn restore + lý do | «Mở lại hồ sơ» | Ghi history "restore" |
| REJECTED/WITHDRAWN | bất kỳ | HR vẫn có thể xem | — | Read-only |

### 6.3 State Transitions

```
application: NEW → SCREENED → SHORTLISTED → INTERVIEW_SCHEDULED → PASSED → OFFERED → ACCEPTED → ONBOARDED
                  ↘            ↘                    ↘ FAILED        ↘ OFFER_REJECTED
                   ↘ REJECTED ←┘ (từ NEW/SCREENED/SHORTLISTED, có thể từ stage khác khi có lý do)
                   ↘ WITHDRAWN, ON_HOLD (từ mọi stage đang mở) — ON_HOLD quay về stage trước
                   REJECTED/WITHDRAWN/FAILED → restore về stage trước (trong hạn)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| application | — | NEW | application được tạo vào pipeline | — |
| application | stage đang mở | stage hợp lệ kế tiếp | HR chuyển (đơn/bulk) | chỉ qua restore nếu sang stage kết thúc |
| application | stage đang mở | REJECTED / WITHDRAWN | HR chuyển + lý do | có, trong hạn restore |
| application | stage đang mở | ON_HOLD | HR + lý do + hạn xem lại | có, về stage trước |
| application | ON_HOLD | stage trước khi hold | hết hạn xem lại / HR chủ động | — |
| application | REJECTED/WITHDRAWN/FAILED | stage ngay trước | HR «Mở lại hồ sơ» + lý do | — |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Bulk action chạy giữa chừng bị lỗi (mất mạng/server) | Phần đã xử lý đã ghi history; đợt bulk có trạng thái | HR xem kết quả đợt, chạy lại phần thất bại | Không rollback phần đã thành công |
| Hai HR cùng chuyển 1 application | Người sau thấy stage đã đổi | Màn hình tải lại trạng thái mới + báo ai đã đổi | Không ghi đè |
| Application bị feature khác chuyển (offer accepted) trong lúc HR đang thao tác | Stage mới trên server | Giống xử lý concurrent ở trên | — |
| Thông báo sau transition bị lỗi | Transition đã ghi | Notification retry theo `contextual-notifications` | Transition KHÔNG bị rollback vì lỗi thông báo |
| HR đóng trình duyệt giữa form chuyển stage | Không ghi gì (chưa xác nhận) | Mở lại, thao tác lại | — |

### 6.5 Other Edge Cases

- Board đang mở mà stage application đã đổi ở nơi khác → card hiển thị stale;
  khi thao tác hệ thống kiểm tra và báo tải lại.
- `ON_HOLD` hết hạn xem lại nhưng owner không xử lý → application tự quay về
  stage trước khi hold và bắt đầu tính lại SLA, kèm thông báo cho owner
  (giả định — OQ-4).
- Vị trí tuyển dụng bị đóng trong khi còn application đang mở → application
  vẫn hiển thị, HR quyết định từ chối/chuyển vị trí thủ công.
- Ứng viên trùng (cùng người nộp cho 2 vị trí) → mỗi application là một hồ sơ
  độc lập trên pipeline; việc phát hiện trùng thuộc `cv-intake`, pipeline chỉ
  hiển thị cảnh báo trùng nếu được đánh dấu (giả định — OQ-5).
- HR bị thu hồi quyền giữa chừng → mọi action tiếp theo bị từ chối; history đã
  ghi vẫn giữ nguyên tên người thực hiện.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Stage đích | Phải thuộc danh sách transition hợp lệ của stage hiện tại |
| Lý do (REJECTED/WITHDRAWN/ON_HOLD/restore) | Bắt buộc, 3–500 ký tự |
| Hạn xem lại (ON_HOLD) | Bắt buộc, là ngày trong tương lai, tối đa 90 ngày (giả định) |
| Bulk selection | 1–50 application/lần (giả định); chỉ chọn được stage đích chung hợp lệ |
| Owner | Phải là người dùng đang hoạt động, thuộc phạm vi vị trí |
| Quyền | Chuyển/restore/bulk chỉ cho role HR trong data-scope; quản lý read-only |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số application mỗi bulk action | 50 | mỗi đợt | Chặn chọn thêm + gợi ý lọc nhỏ hơn (giả định — OQ-2) |
| SLA mặc định mỗi stage | 5 ngày làm việc | mỗi stage | Badge "quá hạn", đưa vào danh sách treo, báo owner (giả định — OQ-1) |
| Hạn restore | 30 ngày | từ ngày kết thúc | Ẩn action «Mở lại hồ sơ» (giả định — OQ-3) |
| Hạn xem lại ON_HOLD | ≤ 90 ngày | mỗi lần hold | Bắt chọn ngày gần hơn |
| Giới hạn lý do/ghi chú | 500 ký tự | mỗi lần nhập | Chặn nhập thêm |
| Giữ lịch sử application | toàn vòng đời | — | Không xóa; archive chỉ ẩn khỏi board mặc định |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Transition không hợp lệ | "Không thể chuyển sang «{stage đích}» — hồ sơ đang ở «{stage hiện tại}» không được phép chuyển bước này" | E-? |
| Thiếu lý do | "Vui lòng nhập lý do để chuyển sang «{stage đích}»" | E-? |
| Concurrent change | "Hồ sơ đã được {tên người} chuyển sang «{stage}» lúc {HH:mm DD/MM} — đã tải lại trạng thái mới" | E-? |
| Hết hạn restore | "Hồ sơ đã kết thúc hơn 30 ngày — không thể mở lại" | E-? |
| Bulk có phần tử không hợp lệ | "{N} trong {M} hồ sơ không thể chuyển sang «{stage}» — xem chi tiết từng dòng" | E-? |
| Hết quyền | "Bạn không có quyền thao tác hồ sơ thuộc vị trí này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Chuyển đơn lẻ | "Đã chuyển {tên ứng viên} sang «{stage}»" |
| Bulk | "Đã chuyển {N}/{M} hồ sơ sang «{stage}»" |
| Restore | "Đã mở lại hồ sơ của {tên ứng viên} — quay về «{stage}»" |
| Hold | "Hồ sơ tạm dừng đến {DD/MM/YYYY} — sẽ nhắc bạn xem lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Card quá hạn | "Quá hạn {N} ngày tại «{stage}»" |
| Đang hold | "Đang tạm dừng: {lý do} — xem lại trước {DD/MM/YYYY}" |
| History item | "{Người} chuyển {stage trước} → {stage sau} lúc {HH:mm DD/MM} — {lý do}" |
| Bulk preview | "{N} hồ sơ sẽ chuyển; {M} hồ sơ bị bỏ qua" |

## 8. Assumptions

- Bộ stage v1 cố định cho mọi tổ chức (workflow builder là roadmap); stage
  mapping 1:1 với state machine đã quan sát ở nguồn.
- SLA mặc định 5 ngày làm việc/stage, hạn restore 30 ngày, bulk tối đa 50 —
  đều là giá trị đề xuất chờ owner chốt (OQ-1/2/3).
- Mọi application vào pipeline đã qua bước HR xác nhận dữ liệu ở `cv-intake`;
  không có hồ sơ thô chưa review trên board.
- `contextual-notifications` sẵn sàng nhận sự kiện transition để gửi thông báo;
  pipeline chỉ phát sự kiện, không tự gửi.
- Quyết định từ chối/đạt luôn do người có quyền thực hiện; đề xuất AI (nếu có
  từ matching) chỉ là gợi ý hiển thị, không tự chuyển stage.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Adoption: HR quen spreadsheet, không cập nhật board → pipeline không phản ánh thật | thường | Số liệu tiến độ sai, lãnh đạo mất niềm tin, ứng viên vẫn "treo" | Board đơn giản, badge quá hạn, owner rõ ràng; đo tỷ lệ application có cập nhật trong tuần |
| Process: bộ stage cố định không khớp quy trình của một số tổ chức | thỉnh thoảng | HR lách bằng ghi chú ngoài, dữ liệu stage mất nghĩa | ON_HOLD + lý do + restore linh hoạt; thu nhận cầu cấu hình cho workflow builder phase sau |
| Data: application cũ/migrate thiếu owner hoặc stage sai | thỉnh thoảng | Không ai chịu trách nhiệm, SLA đo sai | Bắt buộc owner khi tạo; báo cáo hồ sơ thiếu owner cho admin |
| Compliance: người ngoài phạm vi xem/thao tác hồ sơ ứng viên | hiếm | Lộ dữ liệu cá nhân, vi phạm privacy gate | Deny-by-default, kiểm scope mọi action, audit transition |
| Timeline: phụ thuộc `cv-intake`/`candidate-matching` hoàn tất mới có dữ liệu thật chạy pipeline | thỉnh thoảng | Pilot trễ | Cho phép HR thêm application thủ công từ hồ sơ đã review |
| Quyết định sai: transition nhầm hàng loạt | hiếm | Ứng viên bị từ chối oan, mất hồ sơ đạt | Preview + xác nhận bulk; restore trong hạn; history đầy đủ |

## 10. Success Criteria (preliminary)

- M-IN-01 (PRD Mục 8): tỷ lệ application không ở cùng trạng thái quá SLA /
  application đang mở, loại trừ hold có reason — baseline/target chờ OQ-1/OQ-2
  của PRD.
- 100% transition đi qua state machine duy nhất (không có transition chỉ tồn
  tại ở UI hoặc chỉ ở xử lý nền).
- 100% transition có history trước→sau + actor + nguồn.
- 100% application đang mở có owner.

## 11. Open Questions

- [ ] OQ-1: SLA chuẩn cho từng stage là bao nhiêu (mặc định đề xuất 5 ngày làm
  việc)? Ai duyệt — Recruitment owner?
- [ ] OQ-2: Giới hạn bulk action 50 hồ sơ/lần và vai trò nào được phép bulk
  reject có đúng không?
- [ ] OQ-3: Hạn restore 30 ngày và quyền restore (HR owner hay chỉ HR lead) thế
  nào?
- [ ] OQ-4: ON_HOLD hết hạn xem lại thì tự quay về stage trước hay chỉ nhắc
  owner?
- [ ] OQ-5: Ứng viên trùng/cùng người nộp nhiều vị trí cần cảnh báo hoặc gộp
  trên pipeline không?
- [ ] OQ-6: Số vòng phỏng vấn (1 vòng hay nhiều vòng có tên) có làm thay đổi bộ
  stage không? (kế thừa OQ-RC-01 của reverse spec)
- [ ] OQ-7: Ứng viên rút hồ sơ qua kênh nào — HR ghi thay hay có cổng
  self-service?

## 12. Next Steps

- `/urd candidate-pipeline` — capture user perspective
- `/brd candidate-pipeline` — business case
- `/prd-epic candidate-pipeline` — product scope
