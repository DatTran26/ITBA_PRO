---
type: brainstorm
feature: employee-profiles
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Unified Employee Record — employee-profiles

## 1. Idea Seed

Một nguồn hồ sơ nhân viên thống nhất làm "source of truth" cho thông tin liên
hệ, giấy tờ định danh, vị trí/phòng ban, người quản lý trực tiếp và kỹ năng.
Hồ sơ được tạo khi ứng viên trúng tuyển chấp nhận offer (chuyển đổi, không nhập
lại) hoặc HR tạo tay; phải qua bước review trước khi kích hoạt; mọi thay đổi
sau đó có audit. Nhân viên tự xem và cập nhật phần được phép.

## 2. Context

Hồ sơ nhân sự hiện rải trên Excel, file giấy, email và hệ thống tuyển dụng:
khi ứng viên chấp nhận offer, dữ liệu CV và offer phải gõ lại tay → trùng
người, sai dữ liệu, không biết bản nào mới nhất. Quản lý muốn xem thông tin
cơ bản của người trong team cũng phải hỏi HR. PRD Mục 7.3 xếp feature này ở
mức `Should` — là nền Core HR mà `employment-lifecycle`, `employee-onboarding`
và cụm talent dựa vào; phụ thuộc `org-governance` (đơn vị, vị trí, role,
phạm vi quyền).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Nhập lại hồ sơ từ CV/offer, trùng người, không biết hồ sơ nào thiếu dữ liệu | Tạo/chuyển đổi hồ sơ có prefill, cảnh báo trùng, checklist field bắt buộc |
| Nhân viên | Muốn sửa số điện thoại/địa chỉ phải nhờ HR; không biết hồ sơ mình có gì | Tự xem hồ sơ mình, tự cập nhật trường được phép |
| Quản lý | Không biết thông tin cơ bản của người trong team | Xem hồ sơ trong phạm vi quyền, không vượt scope |
| Admin | Cần kiểm chứng ai đã sửa gì trên hồ sơ nhạy cảm | Lịch sử thay đổi truy vết được, quyền deny-by-default |

## 4. Capabilities Breakdown

### P0 - must have

- Tạo hồ sơ nhân viên 2 cách: (a) chuyển đổi từ ứng viên đã chấp nhận offer —
  prefill từ CV đã HR xác nhận + dữ liệu offer; (b) HR tạo tay.
- Hồ sơ gồm: thông tin cá nhân/liên hệ, giấy tờ định danh, vị trí, phòng ban,
  người quản lý trực tiếp, ngày bắt đầu, trạng thái hồ sơ.
- Checklist trường bắt buộc: hồ sơ thiếu trường ở trạng thái NHÁP, đủ mới gửi
  review; người có quyền review → kích hoạt.
- Kiểm tra trùng theo email / số định danh / số điện thoại trước khi tạo —
  cảnh báo + cho chọn gộp / tạo mới / hủy.
- Nhân viên xem hồ sơ của mình; tự sửa trường trong whitelist (liên hệ, địa
  chỉ, liên hệ khẩn cấp, ảnh đại diện); trường định danh/tên/ngày sinh chỉ sửa
  qua yêu cầu chờ HR duyệt.
- HR cập nhật mọi trường trong scope; trường trọng yếu (vị trí, phòng ban,
  manager, trạng thái, định danh) bắt buộc ghi lý do.
- Lịch sử thay đổi: ai / khi nào / trường nào / trước → sau / lý do.
- Tìm kiếm + lọc hồ sơ theo trạng thái, đơn vị, vị trí, manager — chỉ trong
  phạm vi quyền (org/role/data-scope, deny-by-default).

### P1 - should have

- Gộp 2 hồ sơ trùng có phê duyệt và audit (không auto-merge).
- Màn "hồ sơ thiếu dữ liệu" — danh sách hồ sơ ACTIVE còn thiếu trường bắt
  buộc/khuyến nghị + nhắc nhân viên tự bổ sung.
- Gắn kỹ năng nhân viên từ taxonomy chung (`talent-framework`), phân biệt kỹ
  năng tự khai và đã xác nhận.
- Export hồ sơ (CSV/PDF) theo quyền, có log ai export.
- Timeline hiển thị lịch sử thay đổi dạng dòng thời gian.

### P2 - nice to have

- Sơ đồ tổ chức (org chart) từ quan hệ manager.
- Import hàng loạt từ file có review từng dòng.
- Trường tùy biến theo tổ chức (custom field).
- Đồng bộ hai chiều với HRM/payroll ngoài khi có quyết định tích hợp.

## 5. Core Flows (Happy Path)

### 5.1 Chuyển ứng viên trúng tuyển thành hồ sơ nhân viên

1) HR mở ứng viên có offer đã chấp nhận → chọn "Tạo hồ sơ nhân viên".
2) Hệ thống prefill: họ tên, liên hệ, giấy tờ từ CV đã xác nhận + vị trí,
   phòng ban, ngày bắt đầu từ offer.
3) Kiểm tra trùng theo email / số định danh / điện thoại:
   trùng → cảnh báo kèm hồ sơ hiện có → HR chọn gộp / tạo mới / hủy.
4) HR bổ sung trường bắt buộc còn thiếu (manager, mã nhân viên, ...).
5) Gửi review → hồ sơ chuyển CHO_DUYET.
6) Reviewer (HR có quyền duyệt) kiểm tra → kích hoạt → HOAT_DONG.
7) Hệ thống ghi audit đầy đủ + báo nhân viên "hồ sơ của bạn đã được tạo",
   mời xác nhận/bổ sung phần được phép.

```
HR/Recruiter                       Hệ thống                          Reviewer
────────────────────────────────────────────────────────────────────────────────

Offer đã chấp nhận
        │
        ▼
"Chuyển thành hồ sơ
 nhân viên"
        │
        ▼
┌─────────────────────────────┐
│ Prefill từ CV đã xác nhận   │
│ + offer (tên, liên hệ,      │
│ vị trí, ngày bắt đầu)       │
└───────────┬─────────────────┘
            ▼
   ── Trùng email/định danh/SĐT
      với hồ sơ hiện có? ──┐
   │                       │
  Có ▶ hiện cảnh báo +     │
       hồ sơ trùng         │
   │   ├─▶ gộp hồ sơ (P1, cần duyệt)
   │   ├─▶ tạo mới (ghi chú trùng)
   │   └─▶ hủy
   │                       │
 Không ▼                   │
┌─────────────────────────┐ │
│ HR bổ sung trường bắt   │ │
│ buộc còn thiếu          │ │
└───────────┬─────────────┘ │
            ▼               │
   ── Đủ trường bắt buộc? ──┤
   │                       │
 Không ▶ ở NHAP, hiện      │
         danh sách thiếu   │
   │                       │
  Đủ ▼                     │
 gửi review ───────────────┼──────────────▶ kiểm tra → KÍCH HOẠT
            │                                              │
            ▼                                              ▼
     hồ sơ CHO_DUYET                              hồ sơ HOAT_DONG
                                                  + audit + thông báo
                                                  cho nhân viên
```

### 5.2 Nhân viên tự cập nhật hồ sơ

1) Nhân viên mở "Hồ sơ của tôi" → thấy đúng các trường được phép xem.
2) Sửa trường whitelist (điện thoại, email cá nhân, địa chỉ, liên hệ khẩn
   cấp, ảnh) → lưu ngay → audit ghi "tự cập nhật".
3) Trường hạn chế (tên, ngày sinh, số định danh) → nhập giá trị mới + lý do
   → tạo YÊU CẦU CẬP NHẬT → HR duyệt → áp dụng + audit; từ chối → giữ giá
   trị cũ + báo nhân viên.
4) Trường chỉ HR (vị trí, phòng ban, manager, trạng thái) → hiển thị chỉ-đọc.

### 5.3 HR cập nhật hồ sơ có audit

1) HR tìm/mở hồ sơ trong scope → sửa trường cần thiết.
2) Trường trọng yếu (vị trí, phòng ban, manager, trạng thái, định danh) →
   bắt buộc nhập lý do.
3) Lưu → audit ghi trước/sau/ai/lý do → thông báo nhân viên khi trường ảnh
   hưởng trải nghiệm của họ (đổi manager, đổi vị trí).

### 5.4 Xử lý hồ sơ trùng (gộp — P1)

1) Từ cảnh báo trùng hoặc màn "hồ sơ trùng" → chọn 2 hồ sơ.
2) Hệ thống hiển thị so sánh từng trường → HR chọn giá trị giữ lại.
3) Gửi duyệt gộp → reviewer xác nhận → hồ sơ phụ chuyển LUU_TRU, dữ liệu
   liên quan (vòng đời, tài liệu, tài khoản) trỏ về hồ sơ chính → audit ghi
   cả 2 phía.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Trùng email/định danh/SĐT với hồ sơ hiện có? | Hiện cảnh báo + cho chọn gộp/tạo mới/hủy | Tiếp tục tạo |
| D2 | 5.1 | Đủ trường bắt buộc để gửi review? | Cho gửi review → CHO_DUYET | Ở NHAP + liệt kê trường thiếu |
| D3 | 5.2 | Trường nhân viên sửa thuộc whitelist tự phục vụ? | Lưu ngay + audit | Tạo yêu cầu chờ HR duyệt (trường hạn chế) hoặc chặn chỉ-đọc (trường chỉ HR) |
| D4 | 5.3 | Trường bị sửa thuộc nhóm trọng yếu? | Bắt buộc lý do trước khi lưu | Lưu không cần lý do |
| D5 | mọi | Người truy cập trong phạm vi quyền (org/role/scope)? | Cho xem/sửa đúng phần được cấp | Chặn + ghi nhận truy cập bị từ chối |
| D6 | 5.4 | Reviewer duyệt gộp hồ sơ? | Gộp + chuyển phụ LUU_TRU + audit | Giữ 2 hồ sơ riêng |

### 6.2 Scenario Matrix

| Actor | Hành động | Đối tượng | Kết quả |
|---|---|---|---|
| HR | Tạo/chuyển đổi hồ sơ | trong scope | Được, qua review trước kích hoạt |
| HR | Sửa trường trọng yếu | hồ sơ trong scope | Được, bắt buộc lý do + audit |
| HR | Xem/sửa | hồ sơ ngoài scope | Chặn, ghi nhận truy cập từ chối |
| Nhân viên | Sửa whitelist | hồ sơ của mình | Lưu ngay + audit |
| Nhân viên | Sửa trường hạn chế | hồ sơ của mình | Tạo yêu cầu chờ HR duyệt |
| Nhân viên | Xem | hồ sơ người khác | Chặn |
| Quản lý | Xem trường cơ bản | người trong scope | Được |
| Quản lý | Sửa bất kỳ trường | người trong scope | Chặn — chỉ HR sửa |
| Reviewer (HR) | Kích hoạt/duyệt gộp/duyệt yêu cầu | trong scope | Được nếu không phải hồ sơ mình tự tạo chờ duyệt (tránh tự duyệt khi policy yêu cầu — xem OQ-4) |

### 6.3 State Transitions

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| hồ sơ | — | NHAP | tạo tay/chuyển đổi chưa đủ trường | — |
| hồ sơ | NHAP | CHO_DUYET | đủ trường bắt buộc + gửi review | có (trả về NHAP khi bị trả) |
| hồ sơ | CHO_DUYET | HOAT_DONG | reviewer kích hoạt | không |
| hồ sơ | CHO_DUYET | NHAP | reviewer trả về kèm ghi chú | — |
| hồ sơ | HOAT_DONG | LUU_TRU | nhân viên nghỉ việc (từ employment-lifecycle) hoặc bị gộp | không — khôi phục cần HR mở lại bằng quy trình riêng |
| yêu cầu cập nhật | — | CHO_DUYET | nhân viên gửi trường hạn chế | — |
| yêu cầu cập nhật | CHO_DUYET | DA_DUYET / TU_CHOI | HR quyết định | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| HR đóng giữa lúc chuyển đổi | hồ sơ NHAP với dữ liệu prefill | mở lại hồ sơ NHAP tiếp tục | không cần |
| Offer bị hủy khi hồ sơ đang CHO_DUYET | hồ sơ CHO_DUYET treo | reviewer quyết định vẫn kích hoạt hoặc hủy kèm ghi chú | — |
| 2 HR sửa cùng hồ sơ đồng thời | bản gốc + phiên sửa của từng người | người lưu sau thấy cảnh báo "hồ sơ vừa bị {ai} đổi — xem lại trước khi ghi" | không ghi đè im lặng |
| Nhân viên gửi yêu cầu rồi HR đã sửa trường đó | yêu cầu CHO_DUYET với giá trị cũ | HR duyệt/từ chối trên giá trị hiện tại được hiển thị kèm | — |
| Tài khoản nhân viên chưa mời khi kích hoạt | hồ sơ HOAT_DONG | gửi lời mời tài khoản sau, hồ sơ vẫn độc lập | — |

### 6.5 Other Edge Cases

- Hồ sơ ACTIVE sau đó bổ sung trường bắt buộc mới (policy đổi) → hồ sơ hiện
  có vào danh sách "thiếu dữ liệu", không tự hạ trạng thái.
- Ứng viên trúng tuyển đã từng là nhân viên cũ (re-hire): hệ thống gợi ý hồ
  sơ LUU_TRU để mở lại thay vì tạo mới.
- Số định danh trùng nhưng tên khác → cảnh báo trùng mạnh hơn, bắt buộc HR
  kiểm tra trước khi tạo mới.
- Nhân viên chưa có tài khoản (chưa accept invite): vẫn xem được qua hồ sơ
  do HR quản lý; self-service bật khi có tài khoản.
- Manager bị nghỉ việc: hồ sơ cấp dưới vào danh sách "thiếu manager".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Họ tên | bắt buộc, ≤100 ký tự |
| Ngày sinh | bắt buộc; tuổi ≥15 khi kích hoạt (ngưỡng lao động VN — Assumption, xác nhận với HR) |
| Số định danh (CCCD/CMND) | 9 hoặc 12 chữ số; duy nhất trong tổ chức |
| Email cá nhân | định dạng email hợp lệ; cảnh báo trùng |
| Số điện thoại | 9-11 chữ số, bắt đầu 0 hoặc +84; cảnh báo trùng |
| Phòng ban / vị trí / manager | bắt buộc trước kích hoạt; phải thuộc cơ cấu org-governance còn hiệu lực |
| Ngày bắt đầu làm việc | bắt buộc; cảnh báo nếu trong quá khứ >30 ngày |
| Lý do thay đổi trường trọng yếu | bắt buộc, ≥10 ký tự, ≤500 ký tự |
| Trường tự phục vụ (nhân viên) | chỉ: điện thoại, email cá nhân, địa chỉ, liên hệ khẩn cấp, ảnh đại diện |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Trường bắt buộc tối thiểu để kích hoạt | họ tên, ngày sinh, định danh, email, điện thoại, phòng ban, vị trí, manager, ngày bắt đầu | — | ở NHAP + liệt kê thiếu |
| Kích thước trang danh sách | 25 hồ sơ/trang (Assumption) | — | phân trang |
| Độ dài lý do thay đổi | 10-500 ký tự | — | chặn lưu + báo lỗi |
| Retention hồ sơ/lịch sử thay đổi | chờ PRD OQ-6 (DPO duyệt) | — | trước pilot chỉ dữ liệu synthetic |
| SLA duyệt yêu cầu tự cập nhật | 2 ngày làm việc (Assumption) | rolling | nhắc HR qua thông báo |
| Quy mô hồ sơ | ≤300 nhân sự active (theo quy mô dự án) | — | theo dõi hiệu năng danh sách |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Trùng định danh khi tạo | "Số định danh này đã thuộc hồ sơ {tên} — chọn gộp hồ sơ hoặc kiểm tra lại" | E-? |
| Thiếu trường khi kích hoạt | "Còn {n} thông tin bắt buộc chưa có — hồ sơ chưa thể gửi duyệt" | E-? |
| Sửa ngoài quyền | "Bạn không có quyền cập nhật hồ sơ này" | E-? |
| Lý do quá ngắn | "Nhập lý do thay đổi (tối thiểu 10 ký tự)" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Kích hoạt hồ sơ | "Đã kích hoạt hồ sơ nhân viên {tên}" |
| Nhân viên tự lưu | "Đã lưu thông tin của bạn" |
| Gửi yêu cầu trường hạn chế | "Đã gửi yêu cầu cập nhật — HR sẽ xử lý trong 2 ngày làm việc" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Hồ sơ chờ duyệt | "Hồ sơ đang chờ {reviewer} kích hoạt" |
| Cảnh báo trùng nhẹ (email/SĐT) | "Có hồ sơ dùng {email/điện thoại} này — kiểm tra trước khi tạo mới" |
| Nhân viên có hồ sơ mới | "Hồ sơ của bạn đã được tạo — xem và bổ sung thông tin" |
| Yêu cầu bị từ chối | "Yêu cầu cập nhật {trường} không được duyệt: {lý do}" |
| Manager nghỉ việc | "{n} hồ sơ đang thiếu người quản lý" |

## 8. Assumptions

- `org-governance` đã có cơ cấu đơn vị/vị trí/role/scope để gán và kiểm quyền.
- `employee-onboarding`/`offer-management` cung cấp điểm chuyển đổi (offer
  đã chấp nhận) và dữ liệu offer để prefill.
- Email/điện thoại từ CV đã HR xác nhận ở `cv-intake` là dữ liệu nguồn đáng
  tin để prefill.
- Mỗi nhân viên tối đa 1 hồ sơ ACTIVE; tài khoản đăng nhập liên kết 1-1 với
  hồ sơ khi được mời.
- Danh sách trường whitelist tự phục vụ do Head of HR duyệt trước pilot.
- Trạng thái vòng đời (thử việc/chính thức/nghỉ) sống ở
  `employment-lifecycle`; hồ sơ chỉ giữ trạng thái bản ghi.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Trùng người / nguồn không nhất quán (data) | thường | 2 hồ sơ cho 1 người, báo cáo sai headcount, giao việc nhầm | kiểm tra trùng 3 khóa trước khi tạo + gộp có duyệt |
| HR tiếp tục dùng Excel song song (adoption) | thỉnh thoảng | hồ sơ hệ thống lỗi thời, mất niềm tin dữ liệu | prefill từ CV/offer giảm nhập tay; màn thiếu dữ liệu |
| Nhân viên thấy/sửa hồ sơ người khác hoặc trường nhạy cảm (compliance) | thỉnh thoảng | lộ dữ liệu cá nhân, vi phạm privacy gate | deny-by-default theo org/role/scope; trường nhạy cảm chỉ role được cấp; audit truy cập |
| Retention hồ sơ sau nghỉ việc chưa được duyệt (compliance — OQ-6) | thường | giữ/xóa sai chính sách, rủi ro pháp lý | chỉ dữ liệu synthetic trước khi DPO duyệt |
| Quy trình review bị bỏ qua vì vội (process) | thỉnh thoảng | hồ sơ chưa kiểm đã dùng cho vòng đời/onboarding | bắt buộc CHO_DUYET → kích hoạt bởi người có quyền |
| Timeline: org-governance chưa sẵn sàng (timeline) | thỉnh thoảng | không gán được phòng ban/quyền | pilot chỉ sau khi org-governance đạt R0 gate |

## 10. Success Criteria (preliminary)

- Tỷ lệ hồ sơ ACTIVE đủ trường bắt buộc — target chốt cùng PRD OQ-2.
- Tỷ lệ hồ sơ tạo từ chuyển đổi không cần nhập lại dữ liệu nguồn ≥80%.
- Thời gian từ "offer chấp nhận" đến hồ sơ HOAT_DONG ≤1 ngày làm việc.
- 0 sự cố truy cập vượt org/role/data-scope được xác nhận (theo `M-GR-01`).

## 11. Open Questions

- [ ] OQ-1: Danh sách trường bắt buộc cuối cùng và whitelist trường nhân viên
  tự sửa do ai duyệt (Head of HR?)?
- [ ] OQ-2: Retention/lưu trữ hồ sơ và lịch sử thay đổi sau nghỉ việc —
  phụ thuộc PRD OQ-6, owner DPO.
- [ ] OQ-3: Nhân viên sửa trường định danh/ngày sinh qua yêu cầu duyệt, hay
  chỉ HR được sửa?
- [ ] OQ-4: Người tạo hồ sơ có được tự kích hoạt hồ sơ mình tạo không (cần
  người thứ 2)?
- [ ] OQ-5: Quy tắc gộp hồ sơ trùng: ai duyệt, dữ liệu nào ưu tiên khi
  conflict?
- [ ] OQ-6: Target cụ thể cho tỷ lệ hồ sơ đủ trường bắt buộc (% và cửa sổ đo)
  — phụ thuộc PRD OQ-1/OQ-2.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd employee-profiles` — capture user perspective
- `/brd employee-profiles` — business case
- `/prd-epic employee-profiles` — product scope
