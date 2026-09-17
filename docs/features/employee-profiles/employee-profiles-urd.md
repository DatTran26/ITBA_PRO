---
type: urd
feature: employee-profiles
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/employee-profiles/brainstorms/unified-employee-record.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# employee-profiles — User Requirements Document

## 1. Purpose

Cho HR một nguồn hồ sơ nhân viên thống nhất làm "source of truth" cho thông tin
liên hệ, giấy tờ định danh, vị trí/phòng ban, người quản lý và trạng thái hồ
sơ — tạo được từ ứng viên trúng tuyển mà không phải nhập lại, luôn qua review
trước khi kích hoạt, mọi thay đổi sau đó có audit. Nhân viên tự xem và cập
nhật phần được phép; quản lý xem đúng trong phạm vi quyền.

Feature này ở mức `Should` trong Feature Map — là nền Core HR cho
`employment-lifecycle`, `employee-onboarding` và cụm talent, nhưng KHÔNG nằm
trong cam kết v1 (v1 chỉ gồm 15 feature `Must`).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Hồ sơ nhân sự rải trên Excel, file giấy, email và hệ tuyển dụng | Khi ứng viên chấp nhận offer, dữ liệu CV/offer phải gõ lại; trùng người, không biết bản nào mới nhất | Mất thời gian nhập lại, sai dữ liệu nguồn, 2 hồ sơ cho 1 người | Confirmed — PRD Mục 2, Mục 7.3 (luồng chính + rủi ro chính) |
| Nhân viên | Muốn sửa số điện thoại/địa chỉ phải nhờ HR; không biết hồ sơ mình đang có gì | Không tự phục vụ được, thông tin cá nhân lỗi thời | Dữ liệu liên hệ sai khi cần, phụ thuộc HR cho thay đổi nhỏ | Assumption — suy từ JTBD-EMP-01 (PRD Mục 3) |
| Quản lý | Cần thông tin cơ bản của người trong team phải hỏi HR | Không tự xem được trong phạm vi quyền | Chậm khi cần liên hệ/điều phối, hoặc nhờ HR thủ công | Assumption — suy từ JTBD-MGR-01 (PRD Mục 3) |
| Admin | Cần kiểm chứng ai đã sửa gì trên hồ sơ nhạy cảm | Không có vết truy nguyên trên dữ liệu cá nhân | Không chứng minh được kiểm soát truy cập khi kiểm tra | Confirmed — PRD Mục 9 (audit boundary) |
| HR | Không biết hồ sơ nào còn thiếu trường bắt buộc | Hồ sơ thiếu dữ liệu vẫn được dùng cho các bước sau | Onboarding/vòng đời chạy trên dữ liệu khuyết | Confirmed — PRD Mục 7.3 (đo thành công = tỷ lệ hồ sơ đủ trường) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Tạo/chuyển đổi hồ sơ, bổ sung dữ liệu, duy trì hồ sơ trong phạm vi | Hồ sơ đầy đủ, không trùng, mọi thay đổi có audit | Nhập lại từ CV/offer, trùng người, không biết hồ sơ nào thiếu |
| secondary | Nhân viên | Xem hồ sơ của mình, tự cập nhật trường được phép | Tự phục vụ thông tin liên hệ mà không nhờ HR | Không biết hồ sơ có gì, sửa nhỏ cũng phải nhờ người khác |
| secondary | Quản lý | Xem thông tin cơ bản của người trong phạm vi quản lý | Tra cứu nhanh trong scope mà không nhờ HR | Không tự xem được, phải đi hỏi HR |
| secondary | Admin | Kiểm chứng quyền và lịch sử thay đổi | Truy vết được mọi thay đổi trên dữ liệu nhạy cảm | Không có audit để đối chiếu |
| out | Ứng viên | Chỉ là nguồn dữ liệu trước khi chuyển đổi thành nhân viên | (gián tiếp) hồ sơ mới đúng dữ liệu đã cung cấp | Không thao tác trực tiếp với feature này |
| out | Đơn vị payroll/phúc lợi | Tiêu thụ dữ liệu hồ sơ ở giai đoạn tích hợp sau | — | Ngoài phạm vi (PRD "Chưa làm") |

## 3. Scope Boundaries

### In Scope

- Tạo hồ sơ nhân viên bằng 2 cách: chuyển đổi từ ứng viên có offer đã chấp
  nhận (prefill từ CV đã xác nhận + dữ liệu offer) và HR tạo thủ công.
- Kiểm tra trùng theo email / số định danh / số điện thoại trước khi tạo,
  cảnh báo và cho chọn gộp / tạo mới / hủy.
- Checklist trường bắt buộc: hồ sơ thiếu trường ở trạng thái NHAP, đủ mới
  gửi review, reviewer kích hoạt thành HOAT_DONG.
- Nhân viên xem hồ sơ của mình; tự sửa trường whitelist (điện thoại, email
  cá nhân, địa chỉ, liên hệ khẩn cấp, ảnh đại diện); trường hạn chế (tên,
  ngày sinh, định danh) sửa qua yêu cầu chờ HR duyệt.
- HR cập nhật mọi trường trong scope; trường trọng yếu (vị trí, phòng ban,
  manager, trạng thái, định danh) bắt buộc ghi lý do.
- Lịch sử thay đổi đầy đủ: ai / khi nào / trường nào / trước → sau / lý do.
- Tìm kiếm + lọc hồ sơ theo trạng thái, đơn vị, vị trí, manager — chỉ trong
  phạm vi quyền (org/role/data-scope, deny-by-default).
- (P1) Gộp 2 hồ sơ trùng có phê duyệt; màn "hồ sơ thiếu dữ liệu"; gắn kỹ
  năng từ taxonomy chung; export có log.

### Out of Scope

- Tính lương, phúc lợi, payroll — PRD Mục 7.3 "Chưa làm".
- Trạng thái vòng đời việc làm (hợp đồng, thử việc, chính thức, tạm nghỉ,
  điều chuyển, nghỉ việc) và tài liệu nhân sự — thuộc `employment-lifecycle`;
  hồ sơ ở đây chỉ giữ trạng thái bản ghi (NHAP/CHO_DUYET/HOAT_DONG/LUU_TRU).
- Checklist và điều phối onboarding ngày đầu — thuộc `employee-onboarding`.
- Định nghĩa cơ cấu tổ chức, chức danh, role/scope — thuộc `org-governance`;
  feature này chỉ tham chiếu.
- Định nghĩa khung kỹ năng — thuộc `talent-framework`; feature này chỉ gắn
  kỹ năng đã có.
- Sơ đồ tổ chức (org chart), import hàng loạt, trường tùy biến, đồng bộ
  HRM/payroll ngoài — hướng P2 của brainstorm.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi ứng viên có offer đã chấp nhận | Tạo hồ sơ nhân viên prefill từ dữ liệu CV đã xác nhận + offer, không nhập lại | Hồ sơ NHAP có sẵn dữ liệu nguồn, chỉ bổ sung phần thiếu | Critical | Confirmed — PRD Mục 7.3 (luồng chính) |
| UN-002 | HR | Khi tạo hồ sơ mới | Được cảnh báo khi email/định danh/SĐT trùng hồ sơ hiện có | Quyết định gộp/tạo mới/hủy một cách có thông tin | Critical | Confirmed — PRD Mục 7.3 (rủi ro chính: trùng người) |
| UN-003 | HR | Khi hồ sơ chưa đủ dữ liệu | Biết chính xác còn thiếu trường bắt buộc nào trước khi gửi duyệt | Hồ sơ ở NHAP kèm danh sách trường thiếu rõ ràng | Critical | Confirmed — PRD Mục 7.3 (đo thành công) |
| UN-004 | HR (reviewer) | Khi có hồ sơ chờ kích hoạt | Một hàng chờ review để kiểm tra và kích hoạt hoặc trả về | Chỉ hồ sơ đủ và đã kiểm mới chuyển HOAT_DONG | Critical | Confirmed — PRD Mục 7.3 (luồng review → kích hoạt) |
| UN-005 | Nhân viên | Khi cần xem/cập nhật thông tin liên hệ | Tự xem hồ sơ mình và sửa ngay trường whitelist | Lưu ngay có audit, không phải nhờ HR | High | Confirmed — PRD Mục 7.3 (phục vụ job nhân viên) |
| UN-006 | Nhân viên | Khi cần sửa tên/ngày sinh/định danh | Gửi yêu cầu cập nhật kèm lý do để HR duyệt | Giá trị chỉ đổi khi HR duyệt; bị từ chối thì biết lý do | Medium | Assumption — brainstorm Mục 5.2 |
| UN-007 | HR | Khi cập nhật trường trọng yếu | Bắt buộc nhập lý do và hệ thống ghi vết trước/sau | Mọi thay đổi quan trọng truy nguyên được | Critical | Confirmed — PRD Mục 9 (audit) + Mục 7.3 (cập nhật có audit) |
| UN-008 | Quản lý | Khi cần thông tin người trong team | Xem trường cơ bản của người trong scope, không xem được ngoài scope | Tra cứu nhanh mà không vượt quyền | High | Assumption — JTBD-MGR-01 (PRD Mục 3) |
| UN-009 | Admin | Khi kiểm tra truy cập dữ liệu nhạy cảm | Truy vết lịch sử thay đổi và truy cập bị từ chối | Audit đủ cho điều tra, deny-by-default | Critical | Confirmed — PRD Mục 9 |
| UN-010 | HR | Khi phát hiện 2 hồ sơ cùng một người | Gộp hồ sơ có phê duyệt, chọn giá trị giữ lại từng trường | 1 hồ sơ ACTIVE duy nhất, hồ sơ phụ LUU_TRU, audit 2 phía | Medium | Assumption — brainstorm Mục 4 (P1), Mục 5.4 |
| UN-011 | HR | Khi muốn rà soát chất lượng dữ liệu | Xem danh sách hồ sơ ACTIVE còn thiếu trường và nhắc nhân viên bổ sung | Hồ sơ hoàn thiện dần, không phải lọc tay | Medium | Assumption — brainstorm Mục 4 (P1) |

## 5. Prioritized User Journeys

### Journey 1: Chuyển ứng viên trúng tuyển thành hồ sơ HOAT_DONG

- **User:** HR
- **Importance:** Critical
- **Trigger:** Offer được ứng viên chấp nhận trong `offer-management` /
  `employee-onboarding`.
- **Expected outcome:** Hồ sơ nhân viên ở HOAT_DONG với dữ liệu prefill,
  không trùng, audit đầy đủ, nhân viên được báo để bổ sung phần được phép.
- **Related needs:** UN-001, UN-002, UN-003, UN-004

1) HR mở ứng viên có offer đã chấp nhận → chọn "Tạo hồ sơ nhân viên".
2) Hệ thống prefill từ CV đã xác nhận + offer; kiểm tra trùng 3 khóa
   (email/định danh/SĐT) — trùng thì hiện cảnh báo và các lựa chọn.
3) HR bổ sung trường bắt buộc còn thiếu (manager, mã nhân viên...).
4) Đủ trường → gửi review → hồ sơ CHO_DUYET.
5) Reviewer kiểm tra → kích hoạt → HOAT_DONG + audit + thông báo nhân viên.

**Independent verification:** Chọn một ứng viên vừa được chuyển đổi — hồ sơ
mới ở HOAT_DONG, các trường có nguồn khớp dữ liệu CV/offer đã xác nhận, bản
ghi audit có đủ người tạo + người kích hoạt, và không có hồ sơ ACTIVE khác
cùng định danh trong tổ chức.

### Journey 2: HR cập nhật hồ sơ có lý do và audit

- **User:** HR
- **Importance:** Critical
- **Trigger:** Thay đổi vị trí/phòng ban/manager hoặc sửa dữ liệu hồ sơ.
- **Expected outcome:** Thay đổi được ghi với lý do, trước/sau rõ ràng;
  nhân viên được báo khi thay đổi ảnh hưởng họ.
- **Related needs:** UN-007, UN-009

1) HR tìm và mở hồ sơ trong scope → sửa trường cần thiết.
2) Trường trọng yếu bị sửa → bắt buộc nhập lý do (≥10 ký tự).
3) Lưu → audit ghi ai/khi nào/trường/trước → sau/lý do.
4) Thay đổi ảnh hưởng nhân viên (đổi manager, vị trí) → thông báo cho họ.

**Independent verification:** Sửa vị trí trên một hồ sơ — bản ghi audit hiện
đúng giá trị trước/sau + lý do + người sửa; nhân viên có thông báo thay đổi;
người ngoài scope không mở được hồ sơ đó.

### Journey 3: Nhân viên tự xem và cập nhật hồ sơ

- **User:** Nhân viên
- **Importance:** High
- **Trigger:** Nhân viên đổi số điện thoại/địa chỉ hoặc muốn kiểm tra hồ sơ
  của mình.
- **Expected outcome:** Nhân viên thấy đúng các trường được phép, sửa trường
  whitelist lưu ngay; trường chỉ-đọc hiển thị rõ là chỉ-đọc.
- **Related needs:** UN-005

1) Nhân viên mở "Hồ sơ của tôi" → thấy các trường được phép xem.
2) Sửa trường whitelist → lưu ngay → audit ghi "tự cập nhật".
3) Trường hạn chế và trường chỉ HR hiển thị phù hợp (form yêu cầu / chỉ-đọc).

**Independent verification:** Với tài khoản nhân viên thường — sửa số điện
thoại lưu được và audit ghi "tự cập nhật"; field định danh không cho sửa
trực tiếp mà mở form yêu cầu; không xem được hồ sơ đồng nghiệp.

### Journey 4: Nhân viên gửi yêu cầu sửa trường hạn chế

- **User:** Nhân viên → HR
- **Importance:** High
- **Trigger:** Nhân viên phát hiện tên/ngày sinh/định danh trong hồ sơ sai.
- **Expected outcome:** Yêu cầu được HR duyệt hoặc từ chối có lý do trong
  SLA; giá trị chỉ đổi khi được duyệt.
- **Related needs:** UN-006, UN-007

1) Nhân viên nhập giá trị mới + lý do → yêu cầu CHO_DUYET.
2) HR xem yêu cầu kèm giá trị hiện tại → duyệt → áp dụng + audit; hoặc từ
   chối kèm lý do → giữ giá trị cũ + báo nhân viên.

**Independent verification:** Gửi yêu cầu sửa ngày sinh trên hồ sơ thử —
trước khi duyệt hồ sơ vẫn giá trị cũ; sau duyệt giá trị đổi và audit có cả
người yêu cầu lẫn người duyệt.

### Journey 5: Xử lý hồ sơ trùng (gộp)

- **User:** HR + reviewer
- **Importance:** Medium
- **Trigger:** Cảnh báo trùng khi tạo, hoặc phát hiện 2 hồ sơ ACTIVE cùng
  người.
- **Expected outcome:** Còn đúng 1 hồ sơ ACTIVE; hồ sơ phụ LUU_TRU; dữ liệu
  liên quan trỏ về hồ sơ chính; audit ghi cả 2 phía.
- **Related needs:** UN-002, UN-010

1) Chọn 2 hồ sơ trùng → hệ thống hiển thị so sánh từng trường.
2) HR chọn giá trị giữ lại từng trường → gửi duyệt gộp.
3) Reviewer xác nhận → hồ sơ phụ LUU_TRU, dữ liệu liên quan (vòng đời, tài
   liệu, tài khoản) trỏ về hồ sơ chính → audit 2 phía.

**Independent verification:** Gộp 2 hồ sơ thử — sau khi duyệt chỉ còn 1 hồ
sơ ACTIVE; truy vết hồ sơ phụ vẫn xem được lịch sử và ghi nhận "đã gộp vào
hồ sơ {mã}".

### Journey 6: Quản lý xem người trong team

- **User:** Quản lý
- **Importance:** Medium
- **Trigger:** Quản lý cần thông tin liên hệ/vị trí của người trong phạm vi.
- **Expected outcome:** Xem được trường cơ bản trong scope; truy cập ngoài
  scope bị chặn và ghi nhận.
- **Related needs:** UN-008, UN-009

1) Quản lý mở danh sách người trong phạm vi → mở hồ sơ một thành viên.
2) Xem trường cơ bản (tên, vị trí, liên hệ công việc); trường nhạy cảm ẩn
   theo quyền.
3) Truy cập hồ sơ ngoài scope → chặn + ghi nhận truy cập bị từ chối.

**Independent verification:** Với tài khoản quản lý — mở được hồ sơ cấp dưới
trong scope, không mở được hồ sơ phòng khác; sự kiện bị chặn có trong audit.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Trùng số định danh nhưng tên khác | Có thể tạo nhầm hồ sơ cho người khác | Cảnh báo trùng mạnh, bắt buộc kiểm tra trước khi tạo mới | Journey 1 / UN-002 |
| Gửi duyệt khi thiếu trường bắt buộc | Không hiểu vì sao bị chặn | Danh sách trường thiếu liệt kê rõ, hồ sơ ở NHAP | Journey 1 / UN-003 |
| Ứng viên trúng tuyển là nhân viên cũ (re-hire) | Tạo hồ sơ thứ 2 cho cùng người | Gợi ý mở lại hồ sơ LUU_TRU (về CHO_DUYET) thay tạo mới | Journey 1 / UN-002 |
| Offer bị hủy khi hồ sơ đang CHO_DUYET | Hồ sơ treo không rõ xử lý | Reviewer quyết định vẫn kích hoạt hoặc hủy kèm ghi chú | Journey 1 |
| Hai HR sửa cùng hồ sơ đồng thời | Người lưu sau ghi đè mất dữ liệu | Cảnh báo "hồ sơ vừa bị {ai} đổi — xem lại trước khi ghi" | Journey 2 / UN-007 |
| Nhân viên gửi yêu cầu nhưng HR đã sửa trường đó trước | Duyệt trên giá trị đã cũ | HR thấy giá trị hiện tại khi duyệt yêu cầu | Journey 4 / UN-006 |
| Nhân viên chưa có tài khoản đăng nhập | Không tự xem được hồ sơ | Hồ sơ vẫn HOAT_DONG độc lập tài khoản; self-service bật khi có tài khoản | Journey 3 / UN-005 |
| Manager nghỉ việc | Cấp dưới thiếu người quản lý | Hồ sơ cấp dưới vào danh sách "thiếu manager" để HR gán lại | UN-011 |
| Truy cập hồ sơ ngoài phạm vi | Lộ dữ liệu cá nhân | Chặn + ghi nhận truy cập bị từ chối (deny-by-default) | Journey 6 / UN-009 |
| Policy đổi danh sách trường bắt buộc | Hồ sơ ACTIVE bỗng "thiếu" dữ liệu | Hồ sơ vào màn "thiếu dữ liệu", không tự hạ trạng thái | UN-011 |
| Nhân viên sửa trường ngoài whitelist | Sửa nhầm dữ liệu nghiệp vụ | Trường ngoài whitelist hiển thị chỉ-đọc hoặc mở form yêu cầu | Journey 3 / UN-005 |

## 7. User-side Constraints

- Giao diện và thông báo tiếng Việt; dữ liệu hồ sơ hỗ trợ đầy đủ dấu tiếng
  Việt.
- Người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; deny-by-
  default trên mọi truy cập hồ sơ (org/role/data-scope — PRD Mục 9).
- Hồ sơ chỉ chuyển HOAT_DONG sau khi reviewer kích hoạt — không có đường
  tắt tạo-là-active.
- Trường nhạy cảm (định danh, ngày sinh, liên hệ khẩn cấp) chỉ lộ cho vai
  trò được cấp — kể cả trong kết quả tìm kiếm và export.
- Nhân viên chỉ thao tác trên hồ sơ của chính mình; quản lý chỉ xem trong
  scope, không sửa.
- Trước khi privacy gate (OQ-3/OQ-6 của PRD) được duyệt, chỉ dùng dữ liệu
  synthetic/de-identified.
- Desktop là màn hình chính cho quản lý hồ sơ; self-service của nhân viên
  cần dùng được trên mobile.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| `org-governance` đã có đơn vị/vị trí/role/scope để gán và kiểm quyền | Không gán được phòng ban/quyền → hồ sơ không kích hoạt được | Confirmed — PRD Mục 7.2 là dependency khai báo | Pilot sau khi org-governance đạt R0 gate |
| `offer-management`/`employee-onboarding` cung cấp điểm chuyển đổi và dữ liệu offer để prefill | Không có prefill → nhập tay, mất giá trị cốt lõi | Assumption — suy từ PRD Mục 7 (hành trình bước 6→7) | Đối chiếu khi 2 feature kia đặc tả |
| Email/SĐT/định danh từ CV đã HR xác nhận ở `cv-intake` là nguồn đáng tin | Prefill sai → hồ sơ sai từ đầu | Assumption — bám trạng thái "đã xác nhận" của PRD Mục 7.6 | Chỉ prefill từ field có trạng thái xác nhận |
| Mỗi người tối đa 1 hồ sơ ACTIVE trong 1 tổ chức; tài khoản liên kết 1-1 | Trùng hồ sơ ACTIVE → báo cáo headcount sai | Assumption — suy từ rủi ro "trùng người" PRD Mục 7.3 | Kiểm tra trùng 3 khóa + gộp có duyệt |
| Danh sách trường bắt buộc và whitelist tự phục vụ do Head of HR duyệt | Danh sách sai → hồ sơ kẹt NHAP hoặc nhân viên sửa được trường không nên | Assumption | Chốt ở OQ-1 — chờ Head of HR xác nhận |
| Trạng thái vòng đời việc làm sống ở `employment-lifecycle`; hồ sơ chỉ giữ trạng thái bản ghi | Chồng trạng thái → không rõ nguồn sự thật | Assumption — tách theo ranh giới PRD Mục 7.3/7.4 | Giữ 1 chiều: lifecycle báo LUU_TRU về hồ sơ |
| Người tạo hồ sơ không được tự kích hoạt hồ sơ mình tạo (khi tổ chức có reviewer khác) | Tự duyệt → review chỉ là hình thức | Assumption — bám human-in-the-loop PRD Mục 12 | Chốt ở OQ-4 — chờ Head of HR xác nhận |
| Quy mô hồ sơ mục tiêu ≤300 nhân sự ACTIVE | Vượt quy mô → hiệu năng danh sách chưa kiểm chứng | Confirmed — project-profile (50-300 người nội bộ) | Theo dõi hiệu năng khi dữ liệu tăng |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Hồ sơ ACTIVE đủ trường bắt buộc | Chưa có — xác lập bằng kiểm kê hồ sơ đầu tiên sau 1 tháng pilot | ≥95% (đề xuất — chờ Product owner, PRD OQ-1/OQ-2) | Tỷ lệ hồ sơ ACTIVE đủ trường bắt buộc / tổng hồ sơ ACTIVE | Hàng tuần, review hàng tháng |
| USC-002 | Chuyển đổi ứng viên không phải nhập lại dữ liệu nguồn | 0% (hiện nhập tay toàn bộ) | ≥80% trường có nguồn được prefill không cần sửa | Tỷ lệ trường prefill giữ nguyên / trường prefill trên hồ sơ từ chuyển đổi | 1 tháng sau pilot |
| USC-003 | Hồ sơ kích hoạt nhanh sau khi offer chấp nhận | Chưa có — xác lập bằng đo thời gian trung bình trong 1 tháng pilot | ≤1 ngày làm việc từ offer chấp nhận đến HOAT_DONG | Thời gian từ accepted_at đến activated_at trên hồ sơ từ chuyển đổi | 1 tháng sau pilot |
| USC-004 | Không truy cập vượt phạm vi | 0 sự cố | 0 sự cố vượt org/role/data-scope được xác nhận | Số incident theo M-GR-01 | Liên tục |
| USC-005 | Mọi thay đổi trọng yếu đều truy nguyên | Chưa có — hiện không có audit | 100% thay đổi trường trọng yếu có lý do + vết audit | Kiểm tra mẫu audit trên hồ sơ thay đổi trong kỳ | Hàng tháng |
| USC-006 | Yêu cầu tự cập nhật được xử lý đúng hạn | Chưa có — xác lập bằng đo SLA trong 1 tháng pilot | ≥90% yêu cầu có quyết định trong 2 ngày làm việc (SLA đề xuất) | Thời gian từ gửi yêu cầu đến quyết định | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Danh sách trường bắt buộc cuối cùng và whitelist trường nhân
  viên tự sửa do ai duyệt? — Resolved (đề xuất): Head of HR duyệt trước
  pilot; danh sách whitelist mặc định gồm điện thoại, email cá nhân, địa
  chỉ, liên hệ khẩn cấp, ảnh đại diện — chờ Head of HR xác nhận.
- [x] OQ-2: Retention hồ sơ và lịch sử thay đổi sau nghỉ việc? — Resolved
  (đề xuất): hồ sơ chuyển LUU_TRU khi nghỉ việc, giữ nguyên để truy vết;
  thời hạn giữ/xóa theo chính sách DPO duyệt; trước khi OQ-6 PRD đóng chỉ
  dùng dữ liệu synthetic — chờ DPO/legal xác nhận (PRD OQ-6).
- [x] OQ-3: Nhân viên sửa trường định danh/ngày sinh qua yêu cầu duyệt, hay
  chỉ HR được sửa? — Resolved: qua yêu cầu chờ HR duyệt (self-service
  whitelist không gồm trường định danh) — bám brainstorm Mục 5.2.
- [x] OQ-4: Người tạo hồ sơ có được tự kích hoạt hồ sơ mình tạo không? —
  Resolved (đề xuất): không — reviewer phải khác người tạo khi tổ chức có
  ≥2 người có quyền duyệt; tổ chức chỉ 1 reviewer thì cho phép nhưng audit
  gắn cờ "tự duyệt" — chờ Head of HR xác nhận.
- [x] OQ-5: Quy tắc gộp hồ sơ trùng — ai duyệt, dữ liệu nào ưu tiên? —
  Resolved (đề xuất): reviewer HR duyệt; mặc định giữ giá trị hồ sơ chính,
  HR chọn lại từng trường khi so sánh; dữ liệu liên quan (vòng đời, tài
  liệu, tài khoản) trỏ về hồ sơ chính — chờ Head of HR xác nhận.
- [x] OQ-6: Target cho tỷ lệ hồ sơ đủ trường bắt buộc? — Resolved (đề
  xuất): ≥95% hồ sơ ACTIVE, đo rolling hàng tuần — chờ Product owner xác
  nhận (PRD OQ-1/OQ-2).
- [x] OQ-7: Re-hire thì tạo hồ sơ mới hay mở lại hồ sơ cũ? — Resolved: mở
  lại hồ sơ LUU_TRU về CHO_DUYET để giữ liên tục lịch sử; tạo mới chỉ khi
  HR xác nhận là người khác sau cảnh báo trùng.
