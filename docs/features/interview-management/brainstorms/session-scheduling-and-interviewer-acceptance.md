---
type: brainstorm
feature: interview-management
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# Lập lịch, phân công và xác nhận phiên phỏng vấn — interview-management

## 1. Idea Seed

Từ một application đã đến bước phỏng vấn trong pipeline, HR tạo phiên phỏng
vấn: chọn vòng, đặt thời gian và hình thức, phân công interviewer hợp lệ, gửi
thư mời kèm context (CV đã xác nhận, JD, câu hỏi, ghi chú vòng trước).
Interviewer nhận, chấp nhận, từ chối hoặc đề xuất đổi lịch; khi đủ xác nhận,
phiên được chốt và mọi bên được thông báo đồng bộ; sau buổi, phiên được ghi
nhận đã diễn ra để bước đánh giá tiếp nối.

## 2. Context

Điều phối phỏng vấn hiện chạy qua email/chat và lịch cá nhân: HR gõ lại thời
gian, interviewer quên phản hồi, ứng viên nhận thông tin thiếu context, và khi
lịch đổi thì một bên nào đó không được báo. Nguồn ITBAAI đã có nền lịch phỏng
vấn (schedule có kiểm interviewer active/role, interviewer
accept/decline/reschedule, chuyển application sang trạng thái đã lên lịch) —
đây là bằng chứng triển khai, chưa phải bằng chứng nhu cầu. Feature này là mắt
xích giữa `candidate-pipeline` (application đến bước) và `interview-evaluation`
(ghi nhận kết quả), đồng thời là nơi `interview-recording` gắn evidence và
`contextual-notifications` phát thông báo. Nếu lịch và acceptance không được
quản trong một chỗ, mọi bước sau đều thiếu nền trạng thái đáng tin.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Phối hợp lịch qua email/chat lặp lại, không biết ai đã xác nhận, dễ gửi thiếu context | Tạo phiên một lần, thấy trạng thái phản hồi, mọi thay đổi tự thông báo lại |
| Interviewer | Nhận lịch rời, không có CV/JD/câu hỏi trước buổi | Một thư mời có đủ context và nút chấp nhận/từ chối/đổi lịch rõ ràng |
| Ứng viên | Lịch hẹn mơ hồ, đổi lịch không được báo | Nhận thông báo lịch rõ (giờ, hình thức, địa điểm/link, người phỏng vấn) và cập nhật khi đổi |
| Quản lý | Không nắm được phỏng vấn tuần này của team trong phạm vi mình | Xem lịch phiên theo data-scope |
| Admin | Quyền xem lịch lệch giữa màn hình và dữ liệu | Truy cập theo organization/role/scope nhất quán, có audit |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo phiên phỏng vấn từ application đã đến bước phỏng vấn trong
  `candidate-pipeline`: chọn vòng (round), thời gian bắt đầu/kết thúc, hình
  thức (trực tuyến/trực tiếp/điện thoại), địa điểm hoặc link họp.
- Phân công một hoặc nhiều interviewer cho phiên; chỉ người có vai trò
  interviewer còn hiệu lực trong tổ chức mới được gán (điều kiện cứng).
- Gửi thư mời cho interviewer với phản hồi ba lựa chọn: chấp nhận / từ chối
  (kèm lý do) / đề xuất đổi lịch (kèm khung giờ đề xuất).
- Thông báo lịch cho ứng viên theo kênh liên hệ đã đăng ký trong hồ sơ, kèm
  giờ, hình thức, địa điểm/link và thông tin cần chuẩn bị.
- Session context gắn vào phiên: CV đã xác nhận, JD vị trí, câu hỏi gợi ý từ
  `question-bank` (đã duyệt), ghi chú/kết quả các vòng trước trong cùng
  application.
- Xác nhận phiên: phiên chỉ chuyển "đã xác nhận" khi có ít nhất một interviewer
  chấp nhận và thời gian còn hiệu lực; thiếu chấp nhận thì phiên ở "chờ xác
  nhận" và HR được nhắc.
- Đổi lịch và hủy phiên: mọi thay đổi sau khi đã xác nhận bắt buộc có lý do,
  thông báo lại cho toàn bộ participant và ứng viên, ghi lịch sử trước/sau.
- Ghi nhận kết quả diễn ra sau buổi: hoàn thành / ứng viên vắng / hủy sát giờ
  — làm đầu vào cho `interview-evaluation`.
- Nhắc lịch tự động cho interviewer và ứng viên trước giờ hẹn qua
  `contextual-notifications`.
- Audit đầy đủ: ai tạo, đổi lịch, gán/gỡ participant, ghi nhận kết quả phiên.

### P1 — should have

- Panel interview: nhiều interviewer + vai trò quan sát (observer chỉ xem
  context, không bắt buộc phản hồi).
- Luồng đổi lịch hai chiều: interviewer hoặc ứng viên (qua HR) đề xuất khung
  giờ mới, HR chốt, hệ thống thông báo lại.
- Cảnh báo trùng lịch: interviewer đã có phiên "đã xác nhận" trùng khung giờ
  thì cảnh báo cho HR trước khi lưu (không chặn cứng — HR quyết định).
- Nhắc khi phiên "chờ xác nhận" quá lâu so với giờ hẹn.

### P2 — nice to have

- Tối ưu lịch tự động đa múi giờ — PRD Mục 7.9 "Chưa làm", chỉ làm khi có nhu
  cầu xác nhận.
- Đồng bộ calendar bên ngoài qua `external-integrations` khi provider được
  chọn.
- Đề xuất interviewer theo kỹ năng/khung vị trí (`talent-framework`).
- Ứng viên tự chọn slot trong khung giờ HR mở (self-scheduling).

## 5. Core Flows (Happy Path)

### 5.1 Tạo phiên → phản hồi → xác nhận → diễn ra

1) HR mở application đang ở bước phỏng vấn → "Tạo phiên phỏng vấn" → chọn
   vòng, thời gian, hình thức, địa điểm/link → gán interviewer (chỉ danh sách
   hợp lệ) → phiên ở "chờ xác nhận".
2) Hệ thống gửi thư mời cho từng interviewer (kèm context) và thông báo lịch
   cho ứng viên.
3) Interviewer mở thư mời → xem context (CV/JD/câu hỏi) → chấp nhận, từ chối
   kèm lý do, hoặc đề xuất khung giờ khác.
4) Khi có ít nhất một interviewer chấp nhận và thời gian còn hiệu lực → phiên
   "đã xác nhận"; nếu tất cả từ chối → phiên về "cần gán lại", HR được báo để
   gán người khác.
5) Đến giờ, hệ thống đã nhắc trước; interviewer thực hiện buổi phỏng vấn (ghi
   âm nếu có consent — `interview-recording`).
6) Sau buổi, HR/interviewer ghi nhận "hoàn thành" hoặc "ứng viên vắng" → phiên
   sẵn sàng cho bước đánh giá trong `interview-evaluation`.

```
HR                        Hệ thống                      Interviewer        Ứng viên
──────────────────────────────────────────────────────────────────────────────────────
Tạo phiên từ application
(chọn vòng/giờ/hình thức,
gán interviewer hợp lệ)
        │
        ▼
   "Chờ xác nhận" ──▶ thư mời + context ──▶ mở thư mời
        │                                        │
        │                            ┌───────────┼────────────┐
        │                       chấp nhận    từ chối      đề xuất
        │                            │        (lý do)     đổi lịch
        │                            │            │            │
        │                            ▼            ▼            ▼
        │                     ── Đủ ≥1 chấp nhận? ──    HR xem đề xuất,
        │                        │            │         chốt giờ mới →
        │                      Có ▼        Tất cả từ    thông báo lại
        │                 "Đã xác nhận"    chối ▼           │
        │                        │       "Cần gán lại" ◀────┘
        │                        │            │
        ▼                        ▼            ▼
   thông báo lịch + nhắc ──────────────────────────▶ nhận lịch,
        │                        │                     được báo khi đổi
        ▼                        ▼
   đến giờ ──▶ diễn ra ──▶ ghi nhận "hoàn thành" / "vắng"
                              │
                              ▼
                 sẵn sàng cho interview-evaluation

Mọi đổi lịch/hủy sau xác nhận ──▶ bắt buộc lý do +
 thông báo lại toàn bộ participant + ứng viên + lịch sử trước/sau.
```

### 5.2 Đổi lịch phiên đã xác nhận

1) Người có quyền (HR, hoặc interviewer qua đề xuất đổi lịch) mở phiên → "Đổi
   lịch" → chọn khung giờ mới, nhập lý do.
2) Hệ thống cập nhật phiên, đưa participant về trạng thái cần xác nhận lại
   khung giờ mới, gửi thông báo đổi lịch cho interviewer và ứng viên.
3) Khi đủ chấp nhận lại → phiên "đã xác nhận" với giờ mới; lịch sử giữ cả giờ
   cũ lẫn giờ mới.

### 5.3 Interviewer từ chối và gán lại

1) Interviewer từ chối kèm lý do → participant đó "từ chối", HR nhận thông báo.
2) Nếu còn interviewer khác đã chấp nhận → phiên vẫn "đã xác nhận"; nếu không
   còn ai → phiên "cần gán lại" và nổi trong danh sách việc của HR.
3) HR gán interviewer mới → thư mời mới gửi đi, vòng phản hồi lặp lại; ứng
   viên được cập nhật nếu thông tin buổi thay đổi.

### 5.4 Hủy phiên

1) HR/interviewer được cấp chọn "Hủy phiên" → bắt buộc lý do → xác nhận.
2) Phiên chuyển "đã hủy", thông báo hủy gửi toàn bộ participant và ứng viên;
   evaluation liên quan (nếu có bản nháp) được đánh dấu phiên đã hủy.
3) Ứng viên/application có thể được xếp phiên mới khi HR tạo lại.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Application đang ở bước cho phép tạo phiên? | Cho tạo phiên | Chặn + nêu trạng thái hiện tại của application |
| D2 | 5.1 | Người được gán có vai trò interviewer còn hiệu lực? | Cho gán vào phiên | Không hiện trong danh sách chọn / chặn khi gán |
| D3 | 5.1 | Interviewer đã có phiên "đã xác nhận" trùng khung giờ? | Cảnh báo trùng, HR vẫn quyết định lưu | Lưu bình thường |
| D4 | 5.1 | Có ≥1 interviewer chấp nhận và giờ còn hiệu lực? | Phiên "đã xác nhận" | Giữ "chờ xác nhận"; tất cả từ chối → "cần gán lại" |
| D5 | 5.1/5.3 | Interviewer từ chối? | Ghi lý do, đánh dấu participant, kiểm lại D4 | — |
| D6 | 5.2 | Đổi lịch khi phiên chưa hủy/hoàn thành? | Cập nhật + yêu cầu xác nhận lại + thông báo | Chặn trên phiên đã hủy/đã kết thúc |
| D7 | 5.4 | Hủy phiên kèm lý do? | Hủy + thông báo toàn bộ | Không cho hủy thiếu lý do |
| D8 | tất cả | Người xem thuộc data-scope của phiên? | Hiển thị phiên/context | Từ chối hiển thị, ghi audit |

### 6.2 Scenario Matrix

| Vai trò | Phiên chờ xác nhận | Phiên đã xác nhận | Phiên cần gán lại | Phiên đã hủy/hoàn thành |
|---|---|---|---|---|
| HR (trong scope) | sửa/đổi lịch/hủy/gán thêm | đổi lịch/hủy/ghi nhận kết quả | gán interviewer mới | xem lịch sử |
| Interviewer được gán | xem context + chấp nhận/từ chối/đề xuất đổi | xem context, đề xuất đổi, ghi nhận kết quả | — | xem phiên của mình |
| Interviewer khác | — | — | — | — |
| Ứng viên | nhận thông báo lịch | nhận nhắc/cập nhật đổi | — | nhận thông báo hủy |
| Quản lý trong scope | xem | xem | xem | xem |

### 6.3 State Transitions

```
phiên phỏng vấn: chờ-xác-nhận → đã-xác-nhận → hoàn-thành
                     │              │    │
                     │              │    └──▶ ứng-viên-vắng
                     ▼              ▼
                cần-gán-lại      đã-hủy (từ mọi trạng thái trước kết thúc)
                     │
                     └──(gán lại)──▶ chờ-xác-nhận

participant (interviewer): chờ-phản-hồi → chấp-nhận / từ-chối / đề-xuất-đổi-lịch
      đổi lịch phiên ──▶ toàn bộ participant về chờ-phản-hồi (vòng mới)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| phiên | — | chờ-xác-nhận | HR tạo phiên + gửi thư mời | — |
| phiên | chờ-xác-nhận | đã-xác-nhận | ≥1 interviewer chấp nhận, giờ còn hiệu lực | — |
| phiên | chờ-xác-nhận | cần-gán-lại | tất cả interviewer từ chối | có (gán mới → chờ-xác-nhận) |
| phiên | đã-xác-nhận | chờ-xác-nhận | đổi lịch → participant phải xác nhận lại | có |
| phiên | đã-xác-nhận | hoàn-thành | ghi nhận buổi đã diễn ra | không |
| phiên | đã-xác-nhận | ứng-viên-vắng | ghi nhận ứng viên không tham gia | có (tạo phiên mới) |
| phiên | chờ-xác-nhận/đã-xác-nhận/cần-gán-lại | đã-hủy | hủy kèm lý do | không |
| participant | — | chờ-phản-hồi | được gán + thư mời gửi | — |
| participant | chờ-phản-hồi | chấp-nhận | bấm chấp nhận | — |
| participant | chờ-phản-hồi | từ-chối | bấm từ chối kèm lý do | không (gán lại là participant mới) |
| participant | chờ-phản-hồi | đề-xuất-đổi-lịch | gửi khung giờ đề xuất | có (HR chốt hoặc từ chối đề xuất) |
| participant | bất kỳ | chờ-phản-hồi | phiên đổi lịch | có (lặp) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| HR tạo phiên dở rồi đóng trình duyệt | phiên chưa lưu hoặc bản nháp đã lưu | mở lại application → tiếp tục từ nháp | nháp quá hạn tự dọn |
| Thư mời interviewer không gửi được | phiên "chờ xác nhận", participant "chờ phản hồi" | hàng gửi retry qua `contextual-notifications`; HR thấy trạng thái gửi lỗi | báo HR nếu hết retry |
| Interviewer mở thư mời sau khi phiên đã đổi giờ | thư mời cũ trỏ phiên hiện tại | trang phản hồi luôn hiện giờ mới nhất; phản hồi ghi cho giờ đang hiệu lực | — |
| Hai HR cùng sửa một phiên | bản lưu sau ghi đè | cảnh báo "phiên vừa được {người} cập nhật — tải lại" | không merge tự động |
| Đề xuất đổi lịch đến khi phiên đã bị hủy | đề xuất treo | đề xuất tự đóng "không còn hiệu lực", báo người đề xuất | — |
| Phiên qua giờ hẹn nhưng chưa ai xác nhận | phiên "chờ xác nhận" quá giờ | đánh dấu "quá hạn xác nhận", HR quyết đổi lịch hoặc hủy | nhắc HR xử lý |

### 6.5 Other Edge Cases

- Application bị chuyển trạng thái lùi (vd ứng viên bị loại) trong khi phiên
  chưa diễn ra: phiên hiện cảnh báo "application đã đổi trạng thái", HR quyết
  hủy hoặc giữ.
- Nhiều phiên của cùng application chạy song song (vòng 2 trước khi vòng 1 có
  đánh giá): cho phép, hiển thị thứ tự vòng rõ ràng — đề xuất, chờ xác nhận.
- Phiên vòng sau nhưng vòng trước chưa có kết quả: cảnh báo cho HR khi tạo
  (không chặn), vì quyết định pipeline thuộc `candidate-pipeline`.
- Ứng viên thiếu kênh liên hệ hợp lệ trong hồ sơ: chặn gửi thông báo, báo HR
  bổ sung liên hệ trước khi xác nhận phiên.
- Interviewer bị vô hiệu hóa tài khoản giữa chừng: participant đó đánh dấu
  không còn hiệu lực, phiên kiểm lại điều kiện xác nhận.
- Múi giờ: mọi thời điểm hiển thị theo múi giờ tổ chức/người xem; v1 không tối
  ưu đa múi giờ (PRD "Chưa làm") nhưng lưu kèm múi giờ tổ chức.
- Empty state: application chưa có phiên nào → gợi ý "Tạo phiên phỏng vấn".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Application | bắt buộc; phải ở trạng thái cho phép tạo phiên (bước phỏng vấn trong `candidate-pipeline`) |
| Vòng phỏng vấn | bắt buộc; số nguyên ≥1, tăng dần theo vòng trước trừ khi HR xác nhận tạo song song |
| Thời gian bắt đầu/kết thúc | bắt buộc; kết thúc sau bắt đầu; không cho đặt trong quá khứ |
| Hình thức | bắt buộc; 1 trong: trực tuyến / trực tiếp / điện thoại |
| Địa điểm/link họp | bắt buộc khi hình thức tương ứng (link khi trực tuyến, địa điểm khi trực tiếp) |
| Interviewer | bắt buộc ≥1; chỉ người có vai trò interviewer còn hiệu lực |
| Lý do từ chối/đổi lịch/hủy | bắt buộc khi thực hiện hành động tương ứng |
| Thông báo ứng viên | bắt buộc có kênh liên hệ hợp lệ trước khi xác nhận phiên |
| Session context | CV đã xác nhận + JD là tối thiểu; câu hỏi gợi ý và ghi chú vòng trước hiển thị khi có |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số interviewer mỗi phiên | 5 (đề xuất — chờ duyệt) | mỗi phiên | chặn gán thêm |
| Số observer mỗi phiên | 3 (đề xuất — chờ duyệt) | mỗi phiên | chặn gán thêm |
| Thời lượng phiên | 4 giờ (đề xuất — chờ duyệt) | mỗi phiên | chặn lưu, gợi ý chia phiên |
| Số lần đổi lịch | 3 (đề xuất — chờ duyệt) | mỗi phiên | lần thứ 4 yêu cầu hủy + tạo phiên mới |
| Hạn phản hồi thư mời | 48 giờ (đề xuất — chờ duyệt) | từ lúc gửi | hết hạn → nhắc; vẫn im → báo HR |
| Nhắc lịch trước giờ hẹn | 24 giờ và 1 giờ (đề xuất — chờ duyệt) | mỗi phiên | — |
| Cảnh báo chờ xác nhận | 24 giờ trước giờ hẹn (đề xuất) | mỗi phiên | phiên chưa đủ chấp nhận → báo HR |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Application chưa đến bước phỏng vấn | "Ứng viên chưa đến bước phỏng vấn — không thể tạo phiên" | E-? |
| Gán người không hợp lệ | "{Người} không có vai trò interviewer hoặc đã bị vô hiệu hóa" | E-? |
| Thời gian không hợp lệ | "Giờ kết thúc phải sau giờ bắt đầu và không nằm trong quá khứ" | E-? |
| Thiếu địa điểm/link | "Phiên {hình thức} cần {địa điểm hoặc link họp} trước khi gửi thư mời" | E-? |
| Hủy/đổi thiếu lý do | "Vui lòng nhập lý do để thông báo cho người tham gia" | E-? |
| Thiếu liên hệ ứng viên | "Chưa có kênh liên hệ của ứng viên — bổ sung trước khi xác nhận phiên" | E-? |
| Phiên đã kết thúc/hủy | "Phiên này đã {hoàn thành hoặc hủy} — không thể thay đổi" | E-? |
| Không có quyền xem | "Bạn không có quyền xem phiên phỏng vấn này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo phiên + gửi thư mời | "Đã tạo phiên và gửi thư mời cho {n} interviewer" |
| Xác nhận phiên | "Phiên đã được xác nhận — ứng viên và interviewer đã được thông báo" |
| Interviewer chấp nhận | "Bạn đã chấp nhận phiên phỏng vấn lúc {HH:mm DD/MM}" |
| Đổi lịch | "Đã đổi lịch sang {giờ mới} — mọi người tham gia đã được thông báo" |
| Hủy phiên | "Đã hủy phiên — thông báo hủy đã gửi kèm lý do" |
| Ghi nhận kết quả | "Đã ghi nhận phiên {hoàn thành hoặc ứng viên vắng} — sẵn sàng cho bước đánh giá" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Chờ phản hồi | "Đang chờ phản hồi từ {x}/{n} interviewer" |
| Trùng lịch | "{Interviewer} đã có phiên khác trong khung giờ này — bạn vẫn có thể lưu" |
| Đề xuất đổi lịch | "{Interviewer} đề xuất {khung giờ} — xác nhận hoặc từ chối đề xuất" |
| Vòng trước chưa đánh giá | "Vòng {n-1} chưa có đánh giá — bạn vẫn có thể tạo phiên vòng {n}" |
| Sắp diễn ra | "Phiên phỏng vấn với {ứng viên} bắt đầu sau {1 giờ}" |
| Empty state | "Chưa có phiên phỏng vấn nào — tạo phiên đầu tiên" |

## 8. Assumptions

- Application và state machine pipeline đã có từ `candidate-pipeline`; feature
  này đọc trạng thái/bước để cho phép tạo phiên, không tự quyết định pipeline.
- Danh sách interviewer hợp lệ (vai trò + trạng thái active + phạm vi tổ chức)
  do `org-governance`/`account-access` cung cấp.
- Context phiên lấy từ nguồn đã xác nhận: CV facts do `cv-intake`/
  `document-review` xác nhận, JD từ `recruitment-planning`, câu hỏi "đã duyệt"
  từ `question-bank`; feature chỉ tham chiếu, không sao chép nội dung.
- Thông báo gửi qua `contextual-notifications`/`operational-email`; kênh ứng
  viên lấy từ hồ sơ liên hệ của `cv-intake`.
- Ứng viên v1 nhận thông báo lịch/nhắc/đổi nhưng KHÔNG bắt buộc xác nhận
  tham gia trong hệ thống; HR ghi nhận vắng/hoàn thành — đề xuất, chờ duyệt.
- Consent ghi âm có thể được hỏi kèm trong thư mời, nhưng việc ghi nhận và
  chặn ghi thuộc `interview-recording` — feature này chỉ truyền nội dung.
- Giới hạn số ở Mục 7.2 là giá trị đề xuất thận trọng — chờ owner chốt (OQ-3).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Lịch đổi nhưng một bên không được báo | thỉnh thoảng | interviewer/ứng viên đến sai giờ, mất lịch, trải nghiệm ứng viên xấu | thông báo lại bắt buộc kèm lý do; trạng thái gửi hiển thị; audit |
| Interviewer không phản hồi, phiên treo | thường | vòng tuyển chậm, application kẹt ở bước phỏng vấn | hạn phản hồi + nhắc + trạng thái "cần gán lại" nổi cho HR |
| Gán nhầm interviewer thiếu vai trò/quyền | thỉnh thoảng | người không được cấp thấy CV/JD ứng viên | chỉ chọn trong danh sách hợp lệ; deny-by-default trên context |
| Thiếu context làm buổi phỏng vấn kém chất lượng | thường | interviewer hỏi lệch, đánh giá thiếu căn cứ | context tối thiểu (CV đã xác nhận + JD) bắt buộc trước khi gửi thư mời |
| Quyền xem lệch giữa màn hình và dữ liệu (GAP-RC-05) | thỉnh thoảng | lộ thông tin ứng viên ngoài phạm vi | một nguồn kiểm quyền; kiểm tra truy cập vượt scope trong pilot |
| Số vòng/phỏng vấn không thống nhất giữa tổ chức | thỉnh thoảng | pipeline và phiên lệch nhau, báo cáo sai | round là trường rõ trên phiên; số vòng chuẩn chờ OQ-1 (OQ-RC-01) |
| Phụ thuộc notification provider lỗi | thỉnh thoảng | không ai nhận thư mời/nhắc | trạng thái gửi hiển thị cho HR, retry, đường báo thủ công |

## 10. Success Criteria (preliminary)

- Tỷ lệ phiên diễn ra đúng lịch đã xác nhận — chỉ số chính theo PRD Mục 7.9;
  con số chờ OQ-2 sản phẩm.
- 100% phiên "đã xác nhận" có ít nhất một interviewer chấp nhận và context tối
  thiểu (CV + JD) đầy đủ — guardrail.
- Tỷ lệ đổi lịch/hủy có thông báo đến đủ participant = 100% — guardrail bám
  rủi ro chính của PRD.
- Thời gian trung bình từ "application đến bước phỏng vấn" đến "phiên đã xác
  nhận" — baseline chưa có, xác lập trong pilot.

## 11. Open Questions

- [x] OQ-1: Pipeline yêu cầu một, ba hay số vòng phỏng vấn cấu hình được?
  — Resolved (đề xuất): v1 lưu số vòng trên từng phiên và cho phép nhiều vòng;
  việc cấu hình số vòng chuẩn theo vị trí là roadmap mở rộng — chờ Head of HR
  xác nhận (kế thừa OQ-RC-01 reverse spec).
- [x] OQ-2: Ứng viên có phải xác nhận tham gia trong hệ thống không?
  — Resolved (đề xuất): v1 chỉ thông báo + nhắc; HR ghi nhận vắng/hoàn thành;
  xác nhận hai chiều của ứng viên là P2 — chờ Product owner xác nhận.
- [x] OQ-3: Các giới hạn Mục 7.2 (5 interviewer, đổi lịch 3 lần, hạn phản hồi
  48 giờ, nhắc 24 giờ/1 giờ) có là chuẩn v1 không? — Resolved (đề xuất): dùng
  giá trị trên làm mặc định cấu hình được — chờ Product owner xác nhận.
- [x] OQ-4: Trùng lịch interviewer nên chặn hay chỉ cảnh báo? — Resolved:
  cảnh báo mềm, HR giữ quyết định (tránh chặn nhầm panel/phiên ngắn).
- [x] OQ-5: Consent ghi âm có đi kèm thư mời không? — Resolved: thư mời có
  thể kèm nội dung xin consent; ghi nhận và thực thi consent thuộc
  `interview-recording` (PRD Mục 7.24).
- [~] OQ-6: Có cho ứng viên tự chọn slot (self-scheduling)? — Out of scope
  v1: cần trang ứng viên có xác thực và quy tắc slot, chưa có trong "Phạm vi
  v1" PRD Mục 7.9.
- [x] OQ-7: HR xem phiên do mình tạo hay toàn bộ trong scope? — Resolved:
  theo data-scope của `org-governance` (không phải chỉ record tự tạo) — kế
  thừa OQ-RC-02, chờ Admin lead/Security xác nhận cấu hình scope.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd interview-management` — capture user perspective
- `/brd interview-management` — business case
- `/prd-epic interview-management` — product scope
