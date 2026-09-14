---
type: urd
feature: employment-lifecycle
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/employment-lifecycle/brainstorms/contract-and-status-transitions.md
  - docs/_reverse/talent-and-crm/reverse-spec.md
---

# employment-lifecycle — User Requirements Document

## 1. Purpose

Cho HR và quản lý một quy trình duy nhất để đưa nhân viên qua các trạng thái
vòng đời — hợp đồng, thử việc, chính thức, tạm nghỉ, điều chuyển, nghỉ việc —
mà mọi chuyển trạng thái đều có người phê duyệt, đúng hạn, đủ tài liệu và lưu
vết evidence, thay cho quyết định qua email/giấy tờ/lời nói hiện nay.

Feature này ở mức `Could` trong Feature Map — KHÔNG thuộc cam kết pilot v1;
URD chuẩn bị cho slice Core HR sau `employee-profiles` (PRD Mục 6.1, Mục 7.4).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Chuyển trạng thái lao động xử lý qua email, giấy tờ và lời nói | Hết thử việc không ai ra quyết định, hợp đồng hết hạn không ai nhắc, nghỉ việc mất biên bản bàn giao | Rủi ro pháp lý lao động, tranh chấp không có bằng chứng, hồ sơ lệch thực tế | Confirmed — PRD Mục 7.4 (rủi ro chính); luồng "tạo thay đổi → phê duyệt → hiệu lực → lưu evidence" |
| Quản lý | Cần đề xuất điều chuyển/nghỉ việc của người trong team | Không có kênh chính thức — phải gửi email/chat và không theo dõi được | Đề xuất trôi, không biết đã được duyệt hay chưa | Confirmed — PRD JTBD-MGR-01; brainstorm Mục 3 |
| Người phê duyệt (HR lead/Head of HR) | Quyết định nhân sự được báo miệng hoặc ký giấy rời | Không có hàng chờ duyệt; quyết định không truy vết được | Không chứng minh được ai đã duyệt, khi nào, theo căn cứ nào | Assumption — suy từ invariant human-in-the-loop + audit (PRD Mục 9, 12) |
| Nhân viên | Không biết mình đang ở trạng thái nào, hợp đồng nằm ở đâu | Phải hỏi HR cho thông tin về chính mình | Lo lắng về thử việc/hợp đồng, mất thời gian hai phía | Confirmed — PRD JTBD-EMP-01 |
| Admin | Cần truy vết thay đổi trạng thái lao động | Không có log thống nhất giữa các quyết định giấy | Audit thất bại khi bị kiểm tra | Confirmed — PRD Mục 9 (audit boundary) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Vận hành vòng đời của toàn bộ nhân viên trong phạm vi | Mọi chuyển trạng thái đúng bước, đúng hạn, đủ evidence — không quên hạn thử việc/hợp đồng | Quy trình rời qua email/giấy, không nhắc hạn, mất tài liệu |
| secondary | Quản lý | Đề xuất và theo dõi thay đổi cho người trong team | Đề xuất trong phạm vi quyền, được xử lý có vết | Không có kênh chính thức, không biết trạng thái đề xuất |
| secondary | Người phê duyệt (HR lead/Head of HR) | Nhận hàng chờ thay đổi vòng đời | Duyệt/từ chối kèm ghi chú, có ghi nhận | Không có hàng chờ, quyết định miệng |
| secondary | Nhân viên | Xem trạng thái vòng đời và tài liệu của mình | Biết mình đang ở đâu trong vòng đời, lấy được hợp đồng/quyết định | Không có kênh tự phục vụ |
| secondary | Admin | Kiểm tra audit, xử lý sự cố quyền | Truy vết đầy đủ mọi chuyển trạng thái | Log rời, không đủ evidence |
| out | Ứng viên | Chưa là nhân viên | (gián tiếp qua `employee-onboarding`) | Không tương tác feature này |

## 3. Scope Boundaries

### In Scope

- Bản ghi việc làm (employment) gắn 1-1 với hồ sơ nhân viên HOAT_DONG:
  trạng thái vòng đời hiện tại, mốc hiệu lực, hợp đồng hiện hành.
- Quản lý hợp đồng: loại, số hợp đồng, ngày ký, hiệu lực từ–đến, file đính
  kèm; tại một thời điểm chỉ một hợp đồng hiện hành, giữ chuỗi thay thế.
- Thay đổi vòng đời theo loại (bắt đầu làm việc, kết thúc thử việc, tạm
  nghỉ, quay lại, điều chuyển, nghỉ việc, gia hạn/ký hợp đồng mới) với ngày
  hiệu lực, lý do và trường đích.
- Luồng phê duyệt: nháp → chờ duyệt → đã duyệt → có hiệu lực đúng ngày;
  từ chối/hủy có ghi chú; người đề xuất không tự duyệt khi còn approver
  khác.
- Kiểm tra điều kiện trước khi gửi duyệt: loại thay đổi hợp lệ với trạng
  thái hiện tại, đủ trường bắt buộc và tài liệu bắt buộc theo loại.
- Checklist theo loại thay đổi với owner + hạn từng đầu việc.
- Tài liệu đính kèm trên thay đổi/việc làm qua `document-intake`, quyền
  xem theo vai trò.
- Nhắc hạn: sắp hết thử việc, sắp hết hạn hợp đồng, checklist quá hạn,
  thay đổi đã duyệt chờ hiệu lực.
- Đồng bộ sang `employee-profiles`: nghỉ việc có hiệu lực → hồ sơ LUU_TRU;
  điều chuyển có hiệu lực → cập nhật đơn vị/vị trí/manager.
- Audit đầy đủ và nhân viên tự xem trạng thái/tài liệu của mình (phần được
  phép).

### Out of Scope

- Chữ ký số trên hợp đồng/quyết định — PRD "Chưa làm" khi chưa chọn
  provider.
- Tích hợp payroll, kế toán, thuế — PRD "Chưa làm", non-goal Mục 5.
- Tạo và quản lý hồ sơ nhân viên (thông tin cá nhân, liên hệ, định danh) —
  thuộc `employee-profiles`; feature này chỉ gắn vào hồ sơ HOAT_DONG.
- Checklist ngày đầu của người mới (thiết bị, tài khoản, đào tạo) — thuộc
  `employee-onboarding`.
- Định nghĩa cơ cấu đơn vị/chức danh/quyền approver — thuộc
  `org-governance`; feature này chỉ tham chiếu.
- Sinh văn bản từ mẫu, gia hạn hàng loạt — hướng P2.
- Đánh giá hiệu suất làm căn cứ thay đổi — kết quả `employee-evaluation`
  chỉ được đính kèm như tài liệu tham chiếu, không tự quyết định (PRD
  OQ-8).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi một sự kiện lao động cần ghi nhận (hết thử việc, điều chuyển, nghỉ việc...) | Tạo một "thay đổi vòng đời" đúng loại với ngày hiệu lực, lý do, trường đích và tài liệu bắt buộc | Thay đổi được ghi nhận có cấu trúc, sẵn sàng gửi duyệt | Critical | Confirmed — PRD Mục 7.4 (phạm vi v1: trạng thái, mốc hiệu lực) |
| UN-002 | HR | Khi tạo thay đổi | Được chặn sớm nếu loại thay đổi không hợp lệ với trạng thái hiện tại hoặc đã có thay đổi đang chờ | Không tạo được thay đổi sai/mâu thuẫn | Critical | Confirmed — brainstorm Mục 6.1 (D1, D2) |
| UN-003 | HR / quản lý | Khi thay đổi cần thẩm quyền | Gửi duyệt cho approver phù hợp; người đề xuất không tự duyệt khi còn approver khác | Thay đổi vào hàng chờ đúng người, có tách quyền đề xuất/phê duyệt | Critical | Confirmed — PRD Mục 7.4 (rủi ro chuyển trạng thái thiếu phê duyệt), Mục 12 |
| UN-004 | Approver | Khi có thay đổi chờ duyệt | Hàng chờ liệt kê thay đổi kèm loại, ngày hiệu lực, lý do, tài liệu và checklist | Quyết định duyệt/từ chối/trả về có ghi chú, được ghi nhận | Critical | Confirmed — PRD Mục 7.4 (luồng chính: phê duyệt); vai trò approver cụ thể ở OQ-1 |
| UN-005 | HR | Khi thay đổi đã duyệt | Hệ thống tự áp dụng trạng thái mới đúng ngày hiệu lực, ghi audit trước → sau | Không phải sửa status tay; trạng thái không lệch quyết định | Critical | Confirmed — PRD Mục 7.4; brainstorm Mục 5.1 |
| UN-006 | HR | Khi quản lý hợp đồng lao động | Ghi nhận hợp đồng (loại, số, ngày ký, hiệu lực, file); chỉ 1 hợp đồng hiện hành; hợp đồng mới thay thế có chuỗi | Chuỗi hợp đồng truy vết được, không hai hợp đồng hiện hành | Critical | Confirmed — PRD Mục 7.4 (hợp đồng); Observed: reverse spec `talent-and-crm` có tầng person/position |
| UN-007 | HR | Khi sắp đến hạn thử việc/hợp đồng/checklist | Được nhắc trước hạn và cảnh báo liên tục khi quá hạn | Không quên hạn pháp lý | High | Confirmed — PRD Mục 7.4 (đo thành công: đúng hạn); mốc nhắc là đề xuất ở OQ-7 |
| UN-008 | HR / owner checklist | Khi nghỉ việc hoặc điều chuyển có việc bàn giao | Checklist tự sinh theo loại với owner + hạn; theo dõi hoàn tất | Đầu việc bàn giao không bị sót | High | Confirmed — PRD Mục 7.4 (checklist) |
| UN-009 | HR | Khi cần chứng minh một chuyển trạng thái | Truy vết được: ai đề xuất, ai duyệt, hiệu lực khi nào, trạng thái trước → sau, tài liệu đính kèm | Evidence đủ cho kiểm tra/tranh chấp | Critical | Confirmed — PRD Mục 7.4 (rủi ro mất tài liệu), Mục 9 |
| UN-010 | Nhân viên | Khi muốn biết trạng thái và giấy tờ của mình | Xem trạng thái vòng đời hiện tại và tài liệu của mình (phần được phép) | Tự phục vụ được mà không hỏi HR | Medium | Confirmed — PRD JTBD-EMP-01; brainstorm Mục 6.2 |
| UN-011 | HR | Khi quyết định giấy đã ký trước, nhập sau | Nhập thay đổi với ngày hiệu lực trong quá khứ kèm lý do bắt buộc | Backdate có kiểm soát, có cờ audit | Medium | Assumption — nhu cầu thật của luồng giấy; ngưỡng ở OQ-6 |
| UN-012 | HR | Khi nghỉ việc/điều chuyển có hiệu lực | Hồ sơ nhân viên tự đồng bộ (LUU_TRU / đơn vị-vị trí-manager mới) | Một nguồn sự thật, không nhập lại | Critical | Confirmed — brainstorm Mục 4 (đồng bộ `employee-profiles`) |

## 5. Prioritized User Journeys

### Journey 1: Chuyển trạng thái qua phê duyệt (vd kết thúc thử việc)

- **User:** HR
- **Importance:** Critical
- **Trigger:** Nhân viên sắp hết thử việc (hoặc HR chủ động tạo sau nhắc
  hạn).
- **Expected outcome:** Trạng thái việc làm chuyển sang chính thức đúng
  ngày hiệu lực, có approver và audit đầy đủ.
- **Related needs:** UN-001, UN-003, UN-004, UN-005

1) HR mở việc làm của nhân viên → "Tạo thay đổi" → chọn "kết thúc thử
   việc".
2) Nhập ngày hiệu lực + lý do, đính kèm tài liệu bắt buộc → hệ thống kiểm
   tra hợp lệ → gửi duyệt.
3) Approver xem trong hàng chờ → "Duyệt".
4) Đến ngày hiệu lực → hệ thống áp dụng: trạng thái mới + audit + thông
   báo các bên.

**Independent verification:** Chọn một nhân viên vừa qua journey — bản ghi
việc làm hiển thị trạng thái mới, thay đổi ở trạng thái HIEU_LUC có đủ
người đề xuất + người duyệt + ngày hiệu lực, và audit ghi đúng trạng thái
trước → sau.

### Journey 2: Nghỉ việc có checklist bàn giao

- **User:** HR (hoặc quản lý đề xuất trong scope)
- **Importance:** Critical
- **Trigger:** Nhân viên/thỏa thuận chấm dứt hoặc hết hợp đồng.
- **Expected outcome:** Nghỉ việc có hiệu lực đúng ngày, checklist bàn
  giao có owner và hồ sơ chuyển LUU_TRU.
- **Related needs:** UN-001, UN-003, UN-008, UN-012

1) Tạo thay đổi "nghỉ việc": ngày làm việc cuối, lý do/loại nghỉ, đính
   kèm quyết định/đơn.
2) Hệ thống sinh checklist (thu hồi thiết bị, bàn giao công việc, quyết
   toán, khóa tài khoản) có owner + hạn.
3) Approver duyệt → owner checklist hoàn tất từng đầu việc.
4) Đến ngày hiệu lực → trạng thái NGHI_VIEC + báo `employee-profiles`
   chuyển LUU_TRU; checklist chưa xong gắn cờ và tiếp tục nhắc.

**Independent verification:** Với một nghỉ việc đã hiệu lực — hồ sơ
`employee-profiles` của nhân viên đó ở LUU_TRU, checklist hiển thị trạng
thái từng đầu việc với owner, và audit có đủ vết đề xuất → duyệt → áp
dụng.

### Journey 3: Điều chuyển sang đơn vị mới

- **User:** Quản lý (đề xuất) + approver
- **Importance:** High
- **Trigger:** Nhân viên chuyển phòng ban/vị trí/người quản lý.
- **Expected outcome:** Sau hiệu lực và xác nhận bàn giao, hồ sơ phản ánh
  đơn vị mới.
- **Related needs:** UN-001, UN-004, UN-005, UN-012

1) Quản lý/HR tạo "điều chuyển": đơn vị/vị trí/manager mới, ngày hiệu
   lực, lý do.
2) Approver duyệt → đến ngày hiệu lực → trạng thái DIEU_CHUYEN.
3) Xác nhận hoàn tất bàn giao tại đơn vị mới → trạng thái về CHINH_THUC,
   `employee-profiles` cập nhật; hai quản lý và nhân viên được thông báo.

**Independent verification:** Sau khi điều chuyển xác nhận — hồ sơ nhân
viên hiển thị đơn vị/vị trí/manager mới, audit hai phía (thay đổi vòng đời
+ cập nhật hồ sơ) trỏ cùng một quyết định.

### Journey 4: Nhắc hạn và xử lý hợp đồng sắp hết hạn

- **User:** HR
- **Importance:** High
- **Trigger:** Hợp đồng/thử việc sắp đến mốc nhắc.
- **Expected outcome:** HR tạo gia hạn hoặc chấm dứt trước hạn; không hợp
  đồng nào quá hạn âm thầm.
- **Related needs:** UN-006, UN-007

1) Hệ thống nhắc HR trước hạn (đề xuất: 30 ngày cho hợp đồng, 7 ngày cho
   thử việc).
2) HR tạo thay đổi gia hạn/ký mới hoặc nghỉ việc → duyệt → hiệu lực.
3) Nếu bỏ qua → cảnh báo "hợp đồng quá hạn" liên tục cho tới khi xử lý.

**Independent verification:** Với một hợp đồng sắp hết hạn mẫu — log nhắc
hạn có thông báo đúng mốc; nếu HR tạo gia hạn, chuỗi hợp đồng hiển thị hợp
đồng mới thay thế hợp đồng cũ.

### Journey 5: Nhân viên tự xem trạng thái của mình

- **User:** Nhân viên
- **Importance:** Medium
- **Trigger:** Nhân viên muốn biết mình đang thử việc/chính thức/tạm nghỉ
  và lấy hợp đồng.
- **Expected outcome:** Xem được trạng thái hiện tại, lịch sử vòng đời và
  tài liệu phần được phép.
- **Related needs:** UN-010

1) Nhân viên mở hồ sơ của mình → xem trạng thái vòng đời hiện tại và mốc
   hiệu lực.
2) Mở tài liệu của mình (hợp đồng, quyết định được phép xem) — tài liệu
   nội bộ HR không hiển thị.

**Independent verification:** Đăng nhập bằng tài khoản nhân viên mẫu —
thấy trạng thái và tài liệu đúng phần được phép; tài liệu nội bộ (ghi chú
HR) không xuất hiện.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tạo thay đổi không hợp lệ với trạng thái hiện tại | Người tạo không hiểu vì sao bị chặn | Thông báo rõ trạng thái hiện tại không cho phép loại thay đổi này | J1 / UN-002 |
| Đã có thay đổi đang chờ trên cùng việc làm | Tạo trùng mâu thuẫn | Chặn tạo mới + hiện thay đổi đang chờ để xử lý trước | J1 / UN-002 |
| Thiếu trường/tài liệu bắt buộc khi gửi duyệt | Thay đổi không vào được hàng chờ | Liệt kê đúng các mục còn thiếu, giữ bản nháp | J1 / UN-001 |
| Người đề xuất cũng là approver duy nhất | Tự duyệt quyết định của mình | Chặn khi còn approver khác; ngoại lệ tổ chức 1-approver thì cho phép và gắn cờ "tự duyệt" | UN-003 |
| Checklist chưa xong khi đến ngày hiệu lực | Sợ hiệu lực bị chặn sai pháp lý | Hiệu lực vẫn áp dụng, gắn cờ "checklist chưa hoàn tất" + nhắc owner (đề xuất — OQ-2) | J2 / UN-008 |
| Ngày hiệu lực trong quá khứ | Quyết định giấy nhập sau | Cho phép backdate ≤90 ngày kèm lý do bắt buộc + cờ audit | UN-011 |
| Điều chuyển trùng đơn vị/vị trí/manager hiện tại | Thay đổi vô nghĩa | Chặn: yêu cầu ít nhất 1 trường khác hiện tại | J3 / UN-001 |
| Điều chuyển khi nhân viên đang tạm nghỉ | Trạng thái chồng chéo | Cho tạo nhưng chỉ hiệu lực sau khi "quay lại làm việc" (đề xuất — OQ-4) | J3 / UN-002 |
| Đang tạm nghỉ cần nghỉ việc | Cần chấm dứt giữa giai đoạn nghỉ | Cho phép nghỉ việc từ TAM_NGHI, giữ vết giai đoạn tạm nghỉ trong timeline | J2 |
| Hợp đồng hết hạn chưa có quyết định | Hợp đồng chuyển ngầm sai pháp lý | Cảnh báo "hợp đồng quá hạn" liên tục; không tự đổi trạng thái việc làm | J4 / UN-007 |
| Job áp dụng hiệu lực bị trễ (quá ngày) | Trạng thái lệch ngày hiệu lực | Áp dụng lại khi job chạy, cờ "quá hạn áp dụng"; cảnh báo HR nếu quá 24 giờ | UN-005 |
| Hồ sơ bị LUU_TRU giữa chừng | Thay đổi treo vô định | Chặn tạo mới; thay đổi chờ bị hủy kèm ghi chú | J1 / UN-002 |
| Nhân viên xem tài liệu nội bộ HR | Lộ ghi chú nội bộ | Chỉ hiện tài liệu phần được phép; truy cập bị từ chối có ghi nhận | J5 / UN-010 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt; số hợp đồng, tên đơn vị/chức danh hiển
  thị đúng dữ liệu tổ chức.
- Chỉ người dùng nội bộ trong tổ chức; truy cập theo
  organization/role/data-scope, deny-by-default (PRD Mục 9).
- Việc làm chỉ tồn tại trên hồ sơ HOAT_DONG của `employee-profiles` — một
  hồ sơ hoạt động có đúng một việc làm.
- Trạng thái việc làm không sửa trực tiếp — chỉ đổi qua thay đổi đã duyệt
  và có hiệu lực.
- Tài liệu chỉ vào qua cổng `document-intake`; nhân viên chỉ thấy tài liệu
  của mình phần được phép.
- Tối đa một thay đổi đang chờ (nháp đã gửi/đã duyệt chờ hiệu lực) trên
  mỗi việc làm.
- Màn hình desktop là chính cho hàng chờ duyệt và checklist; nhân viên tự
  xem được trên thiết bị thường dùng.
- Trước khi privacy gate (OQ-3/OQ-6 PRD) đạt, chỉ dùng dữ liệu synthetic —
  hồ sơ nhân sự thật chờ DPO duyệt retention.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Approver là vai trò nghiệp vụ: HR lead duyệt thông thường; nghỉ việc/điều chuyển cần thêm quản lý cấp trên hoặc Head of HR | Nếu chỉ admin duyệt → hàng chờ nghẽn; nếu quản lý tự duyệt → mất tách quyền | Resolved (đề xuất) — OQ-1 | Chờ Head of HR xác nhận ma trận approver theo loại |
| Checklist chưa hoàn tất không chặn hiệu lực (gắn cờ + leo thang) | Nếu phải chặn → ngày nghỉ/hiệu lực pháp lý bị trôi | Resolved (đề xuất) — OQ-2 | Chờ Head of HR xác nhận |
| Điều chuyển khi đang TAM_NGHI: cho tạo, chỉ hiệu lực sau quay lại | Nếu chặn hoàn toàn → không lên lịch được điều chuyển | Resolved (đề xuất) — OQ-4 | Chờ Head of HR xác nhận |
| Backdate ngày hiệu lực cho phép ≤90 ngày kèm lý do | Nếu cấm → quyết định giấy không nhập được; nếu quá xa → audit giả | Resolved (đề xuất) — OQ-6 | Chờ Head of HR xác nhận ngưỡng |
| Kết quả `employee-evaluation` chỉ là tài liệu tham chiếu đính kèm, không tự quyết định thay đổi | Nếu dùng làm trigger tự động → vi phạm human-in-the-loop | Resolved — OQ-5 (bám PRD OQ-8, Mục 12) | Chu kỳ/phạm vi đánh giá chờ Product owner |
| Danh sách loại thay đổi, tài liệu bắt buộc và checklist mặc định theo loại do Head of HR duyệt trước dữ liệu thật | Nếu chưa duyệt → tài liệu bắt buộc thiếu căn cứ | Resolved (đề xuất) | Chốt catalog trước pilot |
| Giới hạn số (nhắc 7/30 ngày, SLA duyệt 2 ngày, ≤20 checklist, file ≤10 MB, backdate ≤90 ngày) là chuẩn slice này | Nếu sai → nhắc quá sớm/muộn, SLA phi thực tế | Resolved (đề xuất) — OQ-7 | Chờ Head of HR xác nhận |
| `employee-profiles` là source of truth hồ sơ; feature này chỉ báo tín hiệu, không tự sửa hồ sơ | Nếu hai nơi cùng sửa → dữ liệu lệch | Confirmed — brainstorm Mục 8; ranh giới employee-profiles | — |
| DIEU_CHUYEN là trạng thái quá đội, không phải trạng thái cuối | Nếu là trạng thái cuối → hồ sơ không bao giờ về CHINH_THUC | Confirmed — brainstorm Mục 8 | — |
| Retention việc làm/tài liệu sau nghỉ việc theo chính sách DPO; trước đó chỉ synthetic | Nếu giữ/xóa sai → rủi ro pháp lý | Resolved (đề xuất) — OQ-3 | Chờ DPO/legal (PRD OQ-6) |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Chuyển trạng thái đúng hạn và đủ evidence | Chưa có — xác lập bằng audit 20 thay đổi đầu tiên trong 1 tháng pilot | ≥95% thay đổi có hiệu lực đúng ngày + đủ tài liệu bắt buộc (đề xuất — chờ owner) | Tỷ lệ thay đổi HIEU_LUC đúng hạn và đủ evidence / tổng thay đổi | 1 tháng sau pilot |
| USC-002 | Mọi chuyển trạng thái có phê duyệt tách quyền | 0% (quyết định miệng) | 100% thay đổi HIEU_LUC có approver khác người đề xuất (hoặc cờ tự duyệt ngoại lệ được ghi nhận) | Đối chiếu requested_by vs reviewed_by trên audit | Liên tục |
| USC-003 | Không quên hạn pháp lý | Chưa có — xác lập bằng số hợp đồng quá hạn phát hiện muộn | 0 hợp đồng quá hạn không xử lý quá 7 ngày sau cảnh báo (đề xuất) | Số hợp đồng quá hạn >7 ngày chưa có thay đổi xử lý | Hàng tuần |
| USC-004 | Checklist nghỉ việc hoàn tất trước ngày hiệu lực | Chưa có — xác lập bằng thống kê checklist trong 1 tháng pilot | ≥90% đầu việc checklist nghỉ việc xong trước hiệu lực (đề xuất) | Tỷ lệ item hoàn tất trước applied_at | 1 tháng sau pilot |
| USC-005 | Audit trail đầy đủ cho truy vết | Chưa có | 0 thay đổi có hiệu lực thiếu audit đầy đủ | Kiểm mẫu audit: đề xuất → duyệt → áp dụng đủ vết | Mỗi release |
| USC-006 | Nhân viên tự xem được trạng thái của mình | Chưa có | ≥80% nhân viên xem được trạng thái + tài liệu của mình mà không cần hỏi HR (đề xuất) | Tỷ lệ tài khoản nhân viên có lượt xem self-service hợp lệ / số yêu cầu hỏi HR | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Ai là approver hợp lệ cho từng loại thay đổi? — Resolved (đề
  xuất): HR lead duyệt thông thường; nghỉ việc/điều chuyển cần thêm quản
  lý cấp trên hoặc Head of HR — chờ Head of HR xác nhận.
- [x] OQ-2: Checklist chưa xong có chặn hiệu lực không? — Resolved (đề
  xuất): không chặn (tránh vi phạm pháp lý ngày nghỉ/hiệu lực), gắn cờ +
  leo thang nhắc owner — chờ Head of HR xác nhận.
- [x] OQ-3: Retention việc làm/tài liệu sau nghỉ việc? — Resolved (đề
  xuất): giữ để truy vết theo chính sách DPO; trước khi OQ-6 PRD đóng chỉ
  dữ liệu synthetic — chờ DPO/legal xác nhận (PRD OQ-6).
- [x] OQ-4: Điều chuyển khi đang tạm nghỉ? — Resolved (đề xuất): cho tạo
  nhưng chỉ hiệu lực sau khi "quay lại làm việc" — chờ Head of HR xác
  nhận.
- [x] OQ-5: Kết quả `employee-evaluation` có được dùng làm evidence cho
  thay đổi? — Resolved: được đính kèm như tài liệu tham chiếu, không tự
  quyết định; quyền xem theo phạm vi — chu kỳ/phạm vi đánh giá chờ Product
  owner (PRD OQ-8).
- [x] OQ-6: Cho phép backdate ngày hiệu lực không, bao xa? — Resolved (đề
  xuất): cho phép ≤90 ngày kèm lý do bắt buộc + cờ audit — chờ Head of HR.
- [x] OQ-7: Các giới hạn đề xuất (nhắc 7/30 ngày, SLA duyệt 2 ngày, ≤20
  checklist, ≤10 MB/file, backdate ≤90 ngày)? — Resolved (đề xuất): chấp
  nhận làm chuẩn slice này — chờ Head of HR xác nhận.
- [~] OQ-8: Chữ ký số trên hợp đồng/quyết định? — Out of scope v1: PRD
  "Chưa làm" khi chưa chọn provider.
- [~] OQ-9: Tích hợp payroll từ trạng thái vòng đời? — Out of scope v1:
  non-goal PRD Mục 5 + "Chưa làm" Mục 7.4.
- [~] OQ-10: Sinh văn bản từ mẫu (quyết định điều chuyển, thông báo hết
  thử việc)? — Out of scope v1 (hướng P2).
