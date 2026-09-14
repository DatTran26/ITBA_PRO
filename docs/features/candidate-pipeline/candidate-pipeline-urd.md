---
type: urd
feature: candidate-pipeline
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/candidate-pipeline/brainstorms/stage-tracked-pipeline.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# candidate-pipeline — User Requirements Document

## 1. Purpose

Cho HR một bảng pipeline duy nhất nơi mọi application luôn nằm ở đúng một
stage hợp lệ, mọi chuyển trạng thái đi qua cùng một state machine (UI và xử
lý nền không lệch nhau), mọi thay đổi có lý do và lịch sử trước/sau — để
không ứng viên nào bị "treo" vô hình và không quyết định nào mất vết.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Theo dõi ứng viên bằng spreadsheet + email/chat | Trạng thái rải rác, không biết chắc ai đang ở bước nào, hồ sơ treo hàng tuần không ai hay | Ứng viên chờ không hạn, trải nghiệm xấu, quyết định chậm | Confirmed — PRD Mục 2, Mục 7.8 (JTBD-HR-01) |
| HR | Chuyển giao phụ trách giữa các đợt | Lịch sử xử lý mất theo người cũ | Người mới không biết vì sao ứng viên đến stage hiện tại | Confirmed — PRD Mục 7.8 (activity history); Observed: reverse spec FR-RC-01 đã có status history |
| HR | Cần xử lý nhiều hồ sơ cùng lúc (vd sàng lọc đợt mới) | Thao tác từng hồ sơ một, dễ chuyển nhầm | Mất thời gian, ứng viên bị chuyển sai stage | Confirmed — PRD Mục 7.8 (thao tác hàng loạt có xác nhận) |
| Quản lý | Muốn xem tiến độ tuyển các vị trí mình phụ trách | Không có góc nhìn chung, phải hỏi từng HR | Phát hiện nghẽn muộn, không chứng minh được điểm kẹt | Confirmed — PRD Mục 3 (JTBD-MGR-01), Mục 7.8 |
| Interviewer | Được phân công phỏng vấn | Không rõ ứng viên đang ở vòng nào | Chuẩn bị sai context | Assumption — suy từ JTBD-INT-01 và liên kết `interview-management` |
| Admin | Rule chuyển trạng thái nằm rải ở UI và xử lý nền | Hai đường cho phép transition khác nhau | Dữ liệu pipeline không nhất quán, không truy vết được | Confirmed — PRD Mục 7.8 (rủi ro chính); Observed: reverse spec FR-RC-03 state machine tồn tại nhưng GAP-RC-02 cho thấy đường tắt phá vỡ |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Vận hành pipeline tuyển dụng hằng ngày trên nhiều vị trí | Biết chính xác mỗi ứng viên đang ở đâu, bước tiếp theo là gì, chuyển trạng thái đúng luật và có vết | Trạng thái rải rác, sót hạn, mất lịch sử khi bàn giao, thao tác lặp thủ công |
| secondary | Quản lý | Xem pipeline các vị trí trong phạm vi quản lý | Thấy điểm nghẽn và hồ sơ quá hạn mà không vượt quyền | Không có góc nhìn tổng hợp, sợ dữ liệu lẫn phạm vi |
| secondary | Interviewer | Được gán vào phiên phỏng vấn của một application | Xem stage và context của ứng viên được phân công | Không biết ứng viên đang ở vòng nào |
| secondary | Admin | Cấu hình SLA và kiểm tra quyền trên pipeline | Một bộ quy tắc duy nhất, truy vết ai đổi gì | Rule lệch giữa màn hình và xử lý nền |
| out | Ứng viên | Subject của application | (gián tiếp) trạng thái đúng khi nhận thông báo/offer | Không có giao diện pipeline trong v1 |

## 3. Scope Boundaries

### In Scope

- Bảng pipeline theo vị trí tuyển dụng với bộ stage cố định v1: `NEW`,
  `SCREENED`, `SHORTLISTED`, `INTERVIEW_SCHEDULED`, `PASSED`, `FAILED`,
  `OFFERED`, `ACCEPTED`, `OFFER_REJECTED`, `ONBOARDED`, `REJECTED`,
  `WITHDRAWN`, `ON_HOLD`.
- Chuyển stage đơn lẻ và hàng loạt (bulk có preview + xác nhận + kết quả
  từng hồ sơ), mọi transition qua một state machine duy nhất.
- Bắt buộc lý do cho `REJECTED`/`WITHDRAWN`/`ON_HOLD`/restore; `ON_HOLD`
  bắt buộc hạn xem lại.
- Filter/tìm kiếm theo vị trí, stage, owner, tình trạng quá hạn SLA,
  nguồn hồ sơ, tên/email ứng viên.
- Owner phụ trách mỗi application; hiển thị thời điểm vào stage và hạn
  SLA hiện tại.
- Activity history: trước → sau, actor, thời điểm, lý do, nguồn (thủ
  công / từ feature khác / thao tác hàng loạt).
- Restore application đã `REJECTED`/`WITHDRAWN`/`FAILED` trong hạn cho
  phép về stage ngay trước khi kết thúc.
- Phát sự kiện nghiệp vụ khi transition để `contextual-notifications`
  thông báo và `management-reporting` đo M-IN-01.
- SLA mỗi stage (mặc định cấu hình được), badge sắp/quá hạn, danh sách
  hồ sơ treo.
- Ghi chú/tag trên application, chuyển application sang vị trí khác,
  đổi owner hàng loạt, xuất CSV danh sách đang lọc (nhóm P1).

### Out of Scope

- Workflow builder cho tổ chức tự định nghĩa stage (PRD Mục 7.8 "Chưa
  làm" — roadmap).
- Automation tự chuyển stage (đề xuất từ AI/matching chỉ là gợi ý, không
  tự thực thi — human-in-the-loop invariant, PRD Mục 12).
- Tạo/duyệt vị trí tuyển dụng — thuộc `recruitment-planning`.
- Tiếp nhận, parse, xác nhận dữ liệu CV — thuộc `cv-intake`/
  `document-review`; pipeline chỉ nhận application đã review.
- Đối chiếu điểm AI giữa CV và JD — thuộc `candidate-matching`.
- Tạo phiên phỏng vấn và vòng đời phiên — thuộc `interview-management`;
  ghi nhận đánh giá — thuộc `interview-evaluation`.
- Offer và onboarding — thuộc `offer-management`/`employee-onboarding`
  (các feature đó kích transition qua state machine của pipeline).
- Candidate portal cho ứng viên tự xem/rút hồ sơ — hướng P2.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi mở pipeline của một vị trí | Thấy mọi application ở đúng stage hiện tại, kèm owner và hạn SLA | Một màn hình trả lời "ai đang ở đâu, đến hạn chưa" mà không cần hỏi ai | Critical | Confirmed — PRD Mục 7.8 (filters, state machine) |
| UN-002 | HR | Khi application đủ điều kiện sang bước tiếp | Chuyển stage với chỉ các stage đích hợp lệ được hiển thị; bị buộc nhập lý do khi loại/tạm dừng | Transition đúng luật, có lý do, có vết | Critical | Confirmed — PRD Mục 7.8; Observed: reverse spec FR-RC-03 (invalid transition bị từ chối) |
| UN-003 | HR | Khi phải xử lý hàng chục hồ sơ cùng lúc | Chọn nhiều application, xem preview hồ sơ hợp lệ/không hợp lệ, xác nhận rồi mới chạy | Biết trước {N}/{M} hồ sơ sẽ chuyển và vì sao phần còn lại không | Critical | Confirmed — PRD Mục 7.8 (bulk action có xác nhận) |
| UN-004 | HR | Khi cần biết vì sao ứng viên đến stage hiện tại | Xem toàn bộ history: ai chuyển, từ đâu sang đâu, lúc nào, lý do, nguồn | Truy vết đầy đủ không cần hỏi người cũ | Critical | Confirmed — PRD Mục 7.8 (activity history) |
| UN-005 | HR | Khi phát hiện đã từ chối/đánh fail nhầm | Mở lại application đã kết thúc trong hạn cho phép, về đúng stage trước đó, có lý do | Sửa được sai lầm mà không mất dấu vết quyết định cũ | High | Confirmed — PRD Mục 7.8 (restore) |
| UN-006 | HR | Khi ứng viên xin tạm dừng (đợi giấy tờ, lịch cá nhân) | Đưa hồ sơ sang tạm dừng kèm lý do + hạn xem lại; hồ sơ hold không bị tính quá hạn SLA | Không bị báo động giả, không quên hồ sơ đang chờ | High | Confirmed — PRD Mục 8 (M-IN-01 loại trừ hold có reason) |
| UN-007 | HR | Khi hồ sơ ở một stage quá lâu | Được thấy badge quá hạn và danh sách hồ sơ treo; owner được nhắc | Không hồ sơ nào treo vô hình | Critical | Confirmed — PRD Mục 8 (M-IN-01) |
| UN-008 | Quản lý | Khi cần biết tuyển các vị trí mình phụ trách đang kẹt đâu | Xem board/đếm theo stage và danh sách quá hạn trong đúng phạm vi quyền | Phát hiện nghẽn sớm mà không thấy dữ liệu ngoài scope | High | Confirmed — PRD Mục 3 (JTBD-MGR-01), Mục 9 |
| UN-009 | HR | Khi bàn giao hoặc HR nghỉ | Đổi owner một hoặc nhiều application, lịch sử vẫn nguyên | Không hồ sơ nào mồ côi | High | Assumption — suy từ "owner phụ trách" của brainstorm và rủi ro bàn giao |
| UN-010 | HR | Khi một người ứng tuyển phù hợp vị trí khác hơn | Chuyển application sang vị trí khác, giữ history, ghi lý do | Không phải tạo hồ sơ mới mất lịch sử | Medium | Assumption — mở rộng hợp lý từ "restore và activity history" PRD Mục 7.8 |
| UN-011 | Admin | Khi nghi ngờ quyền thao tác không nhất quán | Mọi action (kể cả từ feature khác) đi qua cùng một bộ kiểm quyền và state machine | Không còn đường tắt vượt luật | Critical | Confirmed — PRD Mục 7.8 (rủi ro chính), Mục 9 |

## 5. Prioritized User Journeys

### Journey 1: Điều phối một application qua các stage

- **User:** HR
- **Importance:** Critical
- **Trigger:** Application mới vào `NEW` sau khi `cv-intake`/`candidate-matching`
  hoàn tất (hoặc HR thêm thủ công hồ sơ đã review).
- **Expected outcome:** Application đi qua chuỗi stage hợp lệ đến quyết định
  cuối (`PASSED`/`FAILED`/`REJECTED`/vào offer), mỗi bước có owner, lý do khi
  cần và history đầy đủ.
- **Related needs:** UN-001, UN-002, UN-004

1) HR mở board vị trí, thấy application ở `NEW` kèm owner và hạn SLA.
2) HR review → chuyển `SCREENED` → `SHORTLISTED` (mỗi lần chọn trong danh
   sách stage đích hợp lệ).
3) `interview-management` tạo phiên → application sang `INTERVIEW_SCHEDULED`
   với nguồn "hệ thống".
4) Sau khi `interview-evaluation` có quyết định đã review → application
   sang `PASSED` hoặc `FAILED` với nguồn "hệ thống".
5) HR mở activity history: thấy đủ chuỗi trước → sau, ai/nguồn nào chuyển,
   lúc nào, lý do nếu có.

**Independent verification:** Chọn một application đã đi qua ≥3 stage — đối
chiếu board hiển thị stage hiện tại với dòng cuối của history, và mọi dòng
history đều có actor/nguồn/thời điểm; không dòng nào thiếu trường trước/sau.

### Journey 2: Xử lý hàng loạt hồ sơ một stage

- **User:** HR
- **Importance:** Critical
- **Trigger:** Đợt CV mới về nhiều, HR cần sàng lọc hoặc từ chối theo đợt.
- **Expected outcome:** Một đợt bulk chuyển đúng phần hợp lệ, phần không hợp
  lệ bị bỏ qua kèm lý do từng dòng, và mọi transition có history gắn mã đợt.
- **Related needs:** UN-003, UN-002, UN-004

1) HR lọc board (vd "tất cả `NEW` quá 5 ngày của vị trí X") và chọn tối đa
   50 application.
2) Chọn bulk action «Chuyển sang {stage}» hoặc «Từ chối hàng loạt» (nhập lý
   do khi stage đích yêu cầu).
3) Xem preview: nhóm sẽ chuyển + nhóm bỏ qua kèm lý do từng dòng.
4) Xác nhận → hệ thống xử lý từng hồ sơ độc lập → báo "Đã chuyển {N}/{M}
   hồ sơ" và hiển thị chi tiết phần bỏ qua.

**Independent verification:** Chạy một đợt bulk có cố ý vài hồ sơ không hợp
lệ — phần hợp lệ có history nguồn "thao tác hàng loạt #{mã đợt}", phần không
hợp lệ giữ nguyên stage và có lý do bỏ qua trong kết quả đợt.

### Journey 3: Phát hiện và xử lý hồ sơ treo

- **User:** HR (và quản lý xem trong scope)
- **Importance:** High
- **Trigger:** Application ở một stage quá hạn SLA.
- **Expected outcome:** Hồ sơ treo nổi lên qua badge/danh sách, owner được
  nhắc, HR quyết định chuyển tiếp / từ chối / tạm dừng có lý do.
- **Related needs:** UN-006, UN-007, UN-008

1) HR mở danh sách "quá hạn" của board (hoặc thấy badge trên card).
2) Với hồ sơ ứng viên xin chờ: chọn «Tạm dừng» → lý do + hạn xem lại → hồ
   sơ sang `ON_HOLD`, thoát khỏi đếm quá hạn.
3) Đến hạn xem lại: owner được nhắc; HR chọn hold tiếp (hạn mới) hoặc đưa
   về stage trước khi hold để xử lý tiếp.
4) Với hồ sơ không còn phù hợp: chuyển `REJECTED` kèm lý do.

**Independent verification:** Tạo một application quá hạn giả lập — nó xuất
hiện trong danh sách treo và bị loại khỏi đếm quá hạn ngay khi `ON_HOLD` có
lý do + hạn xem lại; khi hết hạn xem lại mà không ai xử lý, hồ sơ quay về
stage trước và tính lại SLA (đề xuất — xem OQ-4).

### Journey 4: Mở lại hồ sơ đã kết thúc

- **User:** HR
- **Importance:** High
- **Trigger:** Phát hiện từ chối/đánh fail nhầm, hoặc ứng viên quay lại sau
  khi rút hồ sơ.
- **Expected outcome:** Application `REJECTED`/`WITHDRAWN`/`FAILED` được mở
  lại về stage ngay trước khi kết thúc, trong hạn 30 ngày, kèm lý do bắt
  buộc và history "restore".
- **Related needs:** UN-005, UN-004

1) HR mở application đã kết thúc còn trong hạn restore → «Mở lại hồ sơ».
2) Nhập lý do → xác nhận → application về stage ngay trước khi kết thúc.
3) History ghi transition "restore" kèm actor, lý do; owner cũ được báo.

**Independent verification:** Restore một application `REJECTED` — kiểm tra
stage sau restore khớp stage ngay trước dòng history kết thúc, và history có
dòng mới nguồn "mở lại hồ sơ" kèm lý do.

### Journey 5: Bàn giao phụ trách

- **User:** HR
- **Importance:** Medium
- **Trigger:** HR phụ trách nghỉ hoặc đổi vị trí phụ trách.
- **Expected outcome:** Owner của các application đang mở được chuyển sang
  người mới (đơn lẻ hoặc hàng loạt), không hồ sơ nào thiếu owner.
- **Related needs:** UN-009, UN-001

1) HR lọc theo owner cũ → chọn các application đang mở → đổi owner (đơn lẻ
   trên card hoặc hàng loạt).
2) Owner mới phải là người dùng hoạt động trong phạm vi vị trí.
3) History/ghi chú vẫn nguyên; owner mới thấy đầy đủ quá khứ của hồ sơ.

**Independent verification:** Sau khi đổi owner một nhóm hồ sơ — báo cáo
"application đang mở thiếu owner" bằng 0 và owner mới đọc được toàn bộ
history như owner cũ.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| HR cố chuyển sang stage không hợp lệ | Không hiểu vì sao không chọn được | Stage đích không hợp lệ không hiện trong danh sách; nếu gọi trực tiếp thì bị từ chối kèm "hồ sơ đang ở «{stage}» không được phép chuyển bước này" | Journey 1 / UN-002 |
| Chuyển sang REJECTED/WITHDRAWN/ON_HOLD thiếu lý do | Không lưu được, không rõ thiếu gì | Thông báo "Vui lòng nhập lý do để chuyển sang «{stage đích}»"; ON_HOLD còn yêu cầu hạn xem lại | Journey 1, 3 / UN-002 |
| Hai HR cùng chuyển một application | Người sau tưởng mình chuyển thành công | Người sau nhận "Hồ sơ đã được {tên} chuyển sang «{stage}» lúc {giờ}" + màn hình tải lại trạng thái mới | Journey 1 / UN-002 |
| Bulk có hồ sơ không hợp lệ lẫn hợp lệ | Sợ chuyển nhầm cả loạt | Preview tách rõ 2 nhóm trước khi chạy; phần lỗi có lý do từng dòng và giữ nguyên stage | Journey 2 / UN-003 |
| Application kết thúc quá hạn restore | Vẫn muốn mở lại | «Mở lại hồ sơ» không hiển thị; thông báo "Hồ sơ đã kết thúc hơn 30 ngày — không thể mở lại" | Journey 4 / UN-005 |
| `ON_HOLD` hết hạn xem lại không ai xử lý | Hồ sơ quên trong hold | Tự quay về stage trước khi hold + báo owner + tính lại SLA (đề xuất — OQ-4) | Journey 3 / UN-006 |
| Vị trí bị đóng khi còn application mở | Không biết xử lý hồ sơ tồn | Application vẫn hiển thị, HR quyết định từ chối/chuyển vị trí thủ công | UN-001, UN-010 |
| HR bị thu hồi quyền giữa chừng | Thao tác tiếp theo bị chặn | Mọi action sau đó từ chối "Bạn không có quyền thao tác hồ sơ thuộc vị trí này"; history cũ giữ nguyên tên người thực hiện | UN-011 |
| Feature khác (offer, onboarding) đổi stage khi HR đang xem board | Card hiển thị cũ | Khi thao tác, hệ thống phát hiện stage đã đổi và báo tải lại — không ghi đè | Journey 1 / UN-011 |
| Board trống / vị trí chưa có application | Không biết bắt đầu | Empty state: "Chưa có ứng viên nào trong pipeline — hồ sơ sẽ xuất hiện sau khi CV được xác nhận" | UN-001 |
| Ứng viên trùng (nộp 2 vị trí) | Nhầm lẫn giữa 2 hồ sơ | Mỗi application là hồ sơ độc lập; hiển thị cảnh báo trùng nếu `cv-intake` đã đánh dấu (đề xuất — OQ-5) | UN-001 |

## 7. User-side Constraints

- Giao diện và thông báo tiếng Việt; tên stage hiển thị nhãn tiếng Việt tự
  nhiên (vd `ON_HOLD` → "Tạm dừng"), mã kỹ thuật chỉ ở lớp dữ liệu.
- Chỉ người dùng nội bộ đã đăng nhập, thuộc tổ chức và có role/data-scope
  phù hợp mới xem/thao tác pipeline; ứng viên không có giao diện v1.
- Quản lý chỉ đọc trong phạm vi; thao tác chuyển/restore/bulk chỉ cho vai
  trò HR được cấp trong data-scope của application.
- Lý do bắt buộc khi chuyển sang `REJECTED`/`WITHDRAWN`/`ON_HOLD` và khi
  restore — người dùng không thể bỏ qua bước này.
- `ON_HOLD` bắt buộc hạn xem lại là ngày tương lai, tối đa 90 ngày (giá
  trị đề xuất — OQ-1).
- Bulk action tối đa 50 application mỗi đợt (giá trị đề xuất — OQ-2).
- Màn hình desktop là chính (board nhiều cột); không yêu cầu mobile v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Bộ stage v1 cố định cho mọi tổ chức; stage map 1:1 với state machine quan sát được ở nguồn (cộng thêm `WITHDRAWN`, `ON_HOLD`) | Nếu tổ chức cần stage riêng → phải đưa workflow builder vào sớm | Observed: reverse spec states; bộ stage bổ sung là Assumption | Chốt ở OQ-1/OQ-6 với Head of HR |
| SLA mặc định 5 ngày làm việc/stage, cấu hình được theo stage (và theo vị trí khi cần) | Nếu ngưỡng khác → badge quá hạn và M-IN-01 đo sai | Assumption — chờ Recruitment owner | Chốt ở OQ-1 |
| Bulk tối đa 50 application/đợt; bulk reject chỉ vai trò HR được cấp trong scope | Nếu cần đợt lớn hơn → UX chia đợt | Assumption — chờ Product owner | Chốt ở OQ-2 |
| Hạn restore 30 ngày kể từ ngày kết thúc; quyền restore = HR trong data-scope | Nếu hạn khác → hồ sơ không mở lại được hoặc mở quá muộn | Assumption — chờ Product owner | Chốt ở OQ-3 |
| `ON_HOLD` hết hạn xem lại tự quay về stage trước + thông báo owner | Nếu chỉ nhắc → hồ sơ treo trong hold | Assumption — chờ Recruitment owner | Chốt ở OQ-4 |
| Application vào pipeline đã qua xác nhận dữ liệu ở `cv-intake`/`document-review`; không có hồ sơ thô trên board | Nếu cho hồ sơ thô → pipeline trộn dữ liệu chưa kiểm chứng | Confirmed — PRD Mục 7.6 luồng "HR xác nhận → tạo application" | — |
| `contextual-notifications` nhận sự kiện transition để thông báo; pipeline chỉ phát sự kiện | Nếu chưa sẵn → owner/interviewer không được báo | Assumption — bám dependency PRD Mục 7 | Kiểm chứng khi `contextual-notifications` đặc tả |
| `INTERVIEW_SCHEDULED` gom mọi vòng phỏng vấn; số vòng lưu trên phiên của `interview-management` | Nếu stage theo vòng → bộ stage phình, migration | Assumption — khớp OQ-1 đã giải của interview-management | Chốt ở OQ-6 với Head of HR |
| Ứng viên rút hồ sơ: v1 do HR ghi nhận thay (`WITHDRAWN` + lý do), chưa có cổng self-service | Nếu cần self-service → thêm surface ứng viên | Assumption — chờ Product owner | Chốt ở OQ-7 |
| Ứng viên trùng: pipeline chỉ hiển thị cảnh báo nếu `cv-intake` đánh dấu; không gộp application | Nếu cần gộp → thiếu thao tác merge | Assumption — chờ Product owner | Chốt ở OQ-5 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Không application nào "treo" vô hình | Chưa có — xác lập bằng đo phân phối thời gian ở stage trong 1 tháng pilot | Tỷ lệ application mở ở cùng stage quá SLA giảm dần; mốc chính thức theo OQ-1/OQ-2 PRD | M-IN-01: application ở cùng trạng thái quá SLA / application đang mở (loại trừ hold có reason) | Rolling 7 ngày trong pilot |
| USC-002 | Mọi transition đều đi qua một bộ luật duy nhất | 0% (không có pipeline chung) | 100% transition ghi nhận qua state machine; 0 transition chỉ tồn tại ở UI hoặc chỉ ở tác vụ nền | Đối chiếu history với bảng transition hợp lệ trên mẫu audit | Liên tục, review hàng tháng |
| USC-003 | Mọi thay đổi trạng thái truy vết được | 0% | 100% transition có trước → sau + actor + thời điểm + nguồn; 100% transition vào REJECTED/WITHDRAWN/ON_HOLD/restore có lý do | Kiểm tra history trên mẫu application bất kỳ | Liên tục |
| USC-004 | Không hồ sơ mồ côi | Chưa có — xác lập bằng báo cáo thiếu owner sau 2 tuần pilot | 100% application đang mở có owner hoạt động | Tỷ lệ application mở có owner hợp lệ | Hàng tuần trong pilot |
| USC-005 | Bulk action không gây chuyển nhầm | Chưa có | 0 sự cố "chuyển nhầm hàng loạt" được xác nhận mà không restore được | Số incident bulk sai / số đợt bulk; tỷ lệ đợt có preview được xác nhận | 1 tháng sau pilot |
| USC-006 | Quản lý phát hiện nghẽn trong phạm vi | Chưa có — xác lập bằng phỏng vấn quản lý sau 1 tháng | Quản lý xem được board trong scope và không có sự cố vượt quyền | Số incident vượt scope (bám M-GR-01 = 0); feedback quản lý | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: SLA chuẩn cho từng stage là bao nhiêu và ai duyệt? — Resolved
  (đề xuất): mặc định 5 ngày làm việc/stage, cấu hình được theo stage và
  theo vị trí (P1) — chờ Recruitment owner xác nhận (kế thừa OQ-1
  brainstorm; liên quan OQ-1/OQ-2 PRD cho target M-IN-01).
- [x] OQ-2: Giới hạn bulk action và vai trò được bulk reject? — Resolved
  (đề xuất): tối đa 50 application/đợt; bulk action (kể cả từ chối hàng
  loạt) chỉ vai trò HR được cấp trong data-scope — chờ Product owner xác
  nhận (kế thừa OQ-2 brainstorm).
- [x] OQ-3: Hạn restore và quyền restore? — Resolved (đề xuất): 30 ngày kể
  từ ngày kết thúc; HR trong data-scope được restore — chờ Product owner
  xác nhận (kế thừa OQ-3 brainstorm).
- [x] OQ-4: `ON_HOLD` hết hạn xem lại thì tự quay về hay chỉ nhắc? —
  Resolved (đề xuất): tự quay về stage ngay trước khi hold + thông báo
  owner + tính lại SLA, tránh hồ sơ treo trong hold — chờ Recruitment
  owner xác nhận (kế thừa OQ-4 brainstorm).
- [x] OQ-5: Ứng viên trùng/nộp nhiều vị trí cần cảnh báo hay gộp? —
  Resolved (đề xuất): mỗi application là hồ sơ độc lập; pipeline chỉ
  hiển thị cảnh báo trùng khi `cv-intake` đánh dấu, không gộp — chờ
  Product owner xác nhận (kế thừa OQ-5 brainstorm; liên quan OQ-RC-04).
- [x] OQ-6: Số vòng phỏng vấn có làm thay đổi bộ stage? — Resolved (đề
  xuất): `INTERVIEW_SCHEDULED` là một stage gom mọi vòng; số vòng là
  trường trên phiên của `interview-management` — chờ Head of HR xác nhận
  (kế thừa OQ-6 brainstorm, OQ-RC-01; khớp OQ-1 đã giải của
  interview-management).
- [x] OQ-7: Ứng viên rút hồ sơ qua kênh nào? — Resolved (đề xuất): v1 do
  HR ghi nhận thay (`WITHDRAWN` + lý do); cổng self-service là P2 — chờ
  Product owner xác nhận (kế thừa OQ-7 brainstorm).
- [x] OQ-8: Retention cho history application và hồ sơ đã kết thúc? —
  Resolved (đề xuất): giữ toàn vòng đời cho audit và truy vết; chính sách
  xóa/anonymize theo quyết định retention chung — chờ DPO/legal xác nhận
  (PRD OQ-6).
