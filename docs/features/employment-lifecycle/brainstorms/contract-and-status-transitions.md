---
type: brainstorm
feature: employment-lifecycle
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# Vòng đời việc làm có phê duyệt — employment-lifecycle

## 1. Idea Seed

Một bản ghi "việc làm" (employment) gắn với mỗi hồ sơ nhân viên đang hoạt
động, theo dõi trạng thái vòng đời: hợp đồng → thử việc → chính thức → tạm
nghỉ → điều chuyển → nghỉ việc. Mọi chuyển trạng thái là một "thay đổi vòng
đời" có ngày hiệu lực, lý do, checklist và tài liệu đính kèm — phải được
người có thẩm quyền phê duyệt trước khi có hiệu lực, và toàn bộ được lưu
lại làm evidence.

## 2. Context

Thay đổi trạng thái lao động hiện được xử lý qua email, giấy tờ và lời nói:
hết thử việc nhưng không ai ra quyết định, nhân viên điều chuyển mà hồ sơ
cũ chưa cập nhật, nghỉ việc mất biên bản bàn giao, hợp đồng hết hạn không
ai nhắc. Đây là rủi ro pháp lý và vận hành thật của đội HR — PRD Mục 7.4
nêu rủi ro chính là "chuyển trạng thái thiếu phê duyệt hoặc mất tài liệu"
và đo thành công bằng "tỷ lệ chuyển trạng thái đúng hạn và đủ evidence".

Feature này ở mức `Could` trong Feature Map — KHÔNG thuộc cam kết v1 (v1
chỉ gồm 15 feature `Must` tuyển dụng/assessment). Nó là slice Core HR sau
`employee-profiles` (phụ thuộc khai báo: hồ sơ nhân viên đang hoạt động làm
đầu vào) và cần `org-governance` cho quyền phê duyệt, `document-intake` làm
cổng tài liệu. Nguồn ITBAAI có tầng person/position/employment trong cụm
talent-and-crm — bằng chứng triển khai, chưa phải bằng chứng nhu cầu.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Thay đổi trạng thái qua email/giấy, quên hạn thử việc/hợp đồng, mất tài liệu | Một quy trình duy nhất: tạo thay đổi → duyệt → hiệu lực → evidence, có nhắc hạn |
| Quản lý | Đề xuất điều chuyển/nghỉ việc của người trong team nhưng không có kênh chính thức | Đề xuất thay đổi trong phạm vi quyền, được HR/approver xử lý có vết |
| Người phê duyệt (HR lead/Head of HR) | Không có hàng chờ duyệt; quyết định miệng không truy vết được | Hàng chờ rõ ràng, duyệt/từ chối kèm ghi chú có ghi nhận |
| Nhân viên | Không biết mình đang ở trạng thái nào, hợp đồng/quyết định nằm ở đâu | Xem trạng thái và tài liệu của mình (phần được phép) |
| Admin | Cần truy vết ai đổi trạng thái ai, khi nào, theo quyết định nào | Audit đầy đủ mọi chuyển trạng thái |

## 4. Capabilities Breakdown

### P0 — must have

- Bản ghi việc làm (employment) 1-1 với hồ sơ nhân viên HOAT_DONG: trạng
  thái vòng đời hiện tại, mốc hiệu lực, hợp đồng hiện hành.
- Quản lý hợp đồng: loại (thử việc, xác định thời hạn, không xác định thời
  hạn), số hợp đồng, ngày ký, hiệu lực từ–đến, file đính kèm; tại một thời
  điểm chỉ 1 hợp đồng hiện hành.
- Tạo thay đổi vòng đời theo loại: bắt đầu thử việc, kết thúc thử việc →
  chính thức, tạm nghỉ, quay lại làm việc, điều chuyển, nghỉ việc, gia hạn/
  ký hợp đồng mới — với ngày hiệu lực, lý do, trường đích (đơn vị/vị trí/
  manager mới khi điều chuyển).
- Luồng phê duyệt: nháp → chờ duyệt → đã duyệt → có hiệu lực đúng ngày;
  từ chối/hủy có ghi chú; người đề xuất không tự duyệt khi còn approver
  khác.
- Kiểm tra điều kiện trước khi gửi duyệt: loại thay đổi phải hợp lệ với
  trạng thái hiện tại, đủ trường bắt buộc và tài liệu bắt buộc theo loại.
- Checklist theo loại thay đổi: mỗi đầu việc có owner + hạn (vd nghỉ việc:
  thu hồi thiết bị, bàn giao công việc, khóa tài khoản).
- Tài liệu đính kèm trên thay đổi/việc làm (quyết định, biên bản) qua
  `document-intake`; quyền xem theo vai trò.
- Nhắc hạn: sắp hết thử việc, sắp hết hạn hợp đồng, checklist quá hạn,
  thay đổi đã duyệt chờ hiệu lực.
- Khi nghỉ việc có hiệu lực: báo `employee-profiles` chuyển hồ sơ LUU_TRU;
  khi điều chuyển có hiệu lực: cập nhật đơn vị/vị trí/manager trên hồ sơ.
- Audit đầy đủ: ai đề xuất, ai duyệt, hiệu lực khi nào, trước → sau.
- Nhân viên xem trạng thái vòng đời và tài liệu của mình (phần được phép).

### P1 — should have

- Mẫu checklist cấu hình theo loại thay đổi (mỗi tổ chức tự định nghĩa).
- Timeline lịch sử vòng đời trên hồ sơ nhân viên.
- Cảnh báo xung đột: điều chuyển khi đang tạm nghỉ, nghỉ việc khi còn thay
  đổi chờ hiệu lực.
- Báo cáo: danh sách sắp hết thử việc / hết hạn hợp đồng / thay đổi quá
  hạn.
- Khóa tài khoản truy cập khi nghỉ việc có hiệu lực (qua `account-access`).

### P2 — nice to have

- Chữ ký số trên hợp đồng/quyết định — PRD "Chưa làm" khi chưa chọn
  provider.
- Tích hợp payroll — PRD "Chưa làm".
- Sinh văn bản từ mẫu (quyết định điều chuyển, thông báo hết thử việc).
- Gia hạn hợp đồng hàng loạt.

## 5. Core Flows (Happy Path)

### 5.1 Tạo thay đổi vòng đời → duyệt → có hiệu lực

1) HR (hoặc quản lý trong scope) mở việc làm của nhân viên → "Tạo thay
   đổi" → chọn loại (vd: kết thúc thử việc → chính thức).
2) Nhập ngày hiệu lực + lý do + trường đích nếu cần → đính kèm tài liệu
   bắt buộc → hệ thống kiểm tra loại thay đổi có hợp lệ với trạng thái
   hiện tại không.
3) Gửi duyệt → thay đổi CHO_DUYET, vào hàng chờ approver.
4) Approver xem + tài liệu + checklist → "Duyệt" (DA_DUYET) hoặc "Từ
   chối" kèm ghi chú.
5) Đến ngày hiệu lực → hệ thống áp dụng: trạng thái việc làm chuyển, audit
   ghi trước → sau, thông báo các bên liên quan.

```
HR/Quản lý                    Hệ thống                        Approver
─────────────────────────────────────────────────────────────────────────
"Tạo thay đổi" trên việc làm
        │
        ▼
 chọn loại + ngày hiệu lực
 + lý do + tài liệu
        │
        ▼
   ── Loại thay đổi hợp lệ với
      trạng thái hiện tại? ──┐
   │                        │
  Không ▶ báo lỗi, giữ NHAP │
   │                        │
  Có ▼                      │
   ── Có thay đổi khác      │
      đang chờ duyệt/hiệu   │
      lực? ──┐              │
   │        │               │
  Có ▶ cảnh báo, chặn tạo   │
      mới (xử lý cái cũ)    │
   │                        │
 Không ▼                    │
 gửi duyệt ─────────────────┼─────────────▶ hàng chờ CHO_DUYET
                                             │
                                             ▼
                                    ── Duyệt? ──┐
                                       │        │
                                     Có ▼     Không ▼
                                   DA_DUYET   TU_CHOI + ghi chú
                                       │        → báo người đề xuất
                                       ▼
                              đến ngày hiệu lực
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Áp dụng: trạng thái  │
                            │ mới + audit + thông  │
                            │ báo + đồng bộ hồ sơ  │
                            └──────────────────────┘
                                       │
                                       ▼
                                  HIEU_LUC
```

### 5.2 Nghỉ việc có checklist

1) HR/quản lý tạo thay đổi "nghỉ việc": ngày hiệu lực (ngày làm việc cuối),
   lý do, loại nghỉ việc (tự nguyện/thỏa thuận/hết hợp đồng — ghi trong lý
   do), đính kèm quyết định/đơn.
2) Hệ thống sinh checklist theo loại: thu hồi thiết bị, bàn giao công việc,
   quyết toán, khóa tài khoản — mỗi đầu việc có owner + hạn.
3) Approver duyệt → DA_DUYET; owner checklist hoàn tất từng đầu việc.
4) Đến ngày hiệu lực → trạng thái NGHI_VIEC + báo `employee-profiles`
   chuyển hồ sơ LUU_TRU + (P1) khóa tài khoản. Checklist chưa xong không
   chặn hiệu lực nhưng gắn cờ và tiếp tục nhắc owner (đề xuất — OQ-2).

### 5.3 Điều chuyển

1) Quản lý/HR tạo thay đổi "điều chuyển": đơn vị/vị trí/manager mới, ngày
   hiệu lực, lý do.
2) Duyệt → đến ngày hiệu lực → trạng thái DIEU_CHUYEN trong thời gian bàn
   giao → khi xác nhận xong, trạng thái về CHINH_THUC dưới đơn vị mới và
   `employee-profiles` được cập nhật (đơn vị, vị trí, manager — có audit
   hai phía).
3) Nhân viên và 2 quản lý (cũ/mới) được thông báo.

### 5.4 Tạm nghỉ và quay lại làm việc

1) Tạo "tạm nghỉ": lý do (nghỉ phép dài hạn/đình chỉ), từ ngày – dự kiến
   đến ngày → duyệt → hiệu lực → TAM_NGHI.
2) Khi nhân viên quay lại: tạo "quay lại làm việc" → duyệt → hiệu lực →
   CHINH_THUC; nếu quá ngày dự kiến mà chưa có thay đổi → nhắc HR.

### 5.5 Quản lý hợp đồng và nhắc hạn

1) HR thêm hợp đồng (loại, số HĐ, ngày ký, hiệu lực, file) — hợp đồng mới
   thay thế hợp đồng hiện hành cũ (ghi nhận chuỗi hợp đồng).
2) Trước ngày hết hạn hợp đồng 30 ngày (đề xuất) → nhắc HR tạo gia hạn
   hoặc quyết định chấm dứt; trước hết thử việc 7 ngày → nhắc tạo thay đổi
   kết thúc thử việc.
3) Hợp đồng hết hạn mà không có thay đổi → cảnh báo "hợp đồng quá hạn" cho
   tới khi xử lý.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Loại thay đổi hợp lệ với trạng thái hiện tại? (vd kết thúc thử việc chỉ khi đang THU_VIEC) | Cho tạo và gửi duyệt | Báo lỗi trạng thái không cho phép, giữ NHAP |
| D2 | 5.1 | Có thay đổi khác đang CHO_DUYET/DA_DUYET chờ hiệu lực trên cùng việc làm? | Chặn tạo mới + cảnh báo xử lý thay đổi cũ trước | Cho tạo |
| D3 | 5.1 | Đủ trường bắt buộc và tài liệu bắt buộc theo loại? | Cho gửi duyệt | Liệt kê thiếu, giữ NHAP |
| D4 | 5.1 | Approver đồng ý duyệt? | DA_DUYET, chờ ngày hiệu lực | TU_CHOI + ghi chú, báo người đề xuất |
| D5 | 5.1 | Ngày hiệu lực đã đến? | Áp dụng trạng thái mới + audit | Giữ DA_DUYET chờ |
| D6 | 5.2 | Checklist hoàn tất trước hiệu lực? | Hiệu lực bình thường | Vẫn áp dụng hiệu lực nhưng gắn cờ "checklist chưa hoàn tất" + nhắc owner (đề xuất — OQ-2) |
| D7 | 5.1 | Ngày hiệu lực trong quá khứ (backdate)? | Cho phép kèm lý do bắt buộc + cờ audit "backdated" | Không cho backdate khi thiếu lý do |
| D8 | mọi | Người xem tài liệu/trạng thái có quyền? | Hiển thị phần được cấp | Chặn + ghi nhận truy cập bị từ chối |
| D9 | 5.1 | Người duyệt trùng người đề xuất? | Chặn khi tổ chức còn approver khác; ngoại lệ 1-approver gắn cờ "tự duyệt" | Cho duyệt bình thường |

### 6.2 Scenario Matrix

| Vai trò | Tạo thay đổi | Duyệt thay đổi | Xem việc làm | Xem tài liệu |
|---|---|---|---|---|
| HR | mọi loại, trong scope | khi có quyền approver | trong scope | theo vai trò |
| Quản lý | điều chuyển, nghỉ việc, tạm nghỉ cho người trong scope | chỉ khi là approver được gán | người trong scope | phần được cấp |
| Approver (HR lead/Head of HR) | như HR | hàng chờ trong scope | trong scope | theo vai trò |
| Nhân viên | — | — | việc làm của mình | tài liệu của mình (phần được phép) |
| Admin | — | — | audit/kiểm tra | theo vai trò |

### 6.3 State Transitions

Hai state machine lồng nhau: (a) trạng thái việc làm chỉ đổi qua "thay đổi
vòng đời" đã duyệt và có hiệu lực; (b) vòng đời của chính bản ghi thay đổi.

```
trạng thái việc làm (EMPLOYMENT):

HOP_DONG ──bắt đầu làm việc──▶ THU_VIEC ──kết thúc thử việc──▶ CHINH_THUC
    │                            │                               │
    │                            └──không đạt──▶ NGHI_VIEC       │
    │                                                            │
    │                          ┌─────────────tạm nghỉ────────────┤
    │                          ▼                                 │
    │                      TAM_NGHI ──quay lại──▶ CHINH_THUC     │
    │                          │                                 │
    │                          └──────▶ NGHI_VIEC                │
    │                                                            │
    │                       ┌──điều chuyển──┐                    │
    │                       ▼              │                    │
    │                   DIEU_CHUYEN ──xác nhận──▶ CHINH_THUC     │
    │                       │              (đơn vị/vị trí mới)   │
    │                       └──────▶ NGHI_VIEC                   │
    │                                                            │
    └──────────hủy trước nhận việc──▶ NGHI_VIEC ◀────────────────┘

thay đổi vòng đời (LIFECYCLE_CHANGE):

NHAP ──gửi duyệt──▶ CHO_DUYET ──duyệt──▶ DA_DUYET ──đến ngày hiệu lực──▶ HIEU_LUC
                     │                    │
                     ├──từ chối──▶ TU_CHOI├──hủy trước hiệu lực──▶ HUY
                     └──trả về──▶ NHAP
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| việc làm | — | HOP_DONG | tạo việc làm khi hồ sơ HOAT_DONG + hợp đồng ký | — |
| việc làm | HOP_DONG | THU_VIEC | thay đổi "bắt đầu làm việc" có hiệu lực | không |
| việc làm | THU_VIEC | CHINH_THUC | thay đổi "kết thúc thử việc" có hiệu lực | không |
| việc làm | CHINH_THUC | TAM_NGHI | thay đổi "tạm nghỉ" có hiệu lực | có (qua "quay lại") |
| việc làm | TAM_NGHI | CHINH_THUC | thay đổi "quay lại làm việc" có hiệu lực | — |
| việc làm | CHINH_THUC | DIEU_CHUYEN | thay đổi "điều chuyển" có hiệu lực | không |
| việc làm | DIEU_CHUYEN | CHINH_THUC | xác nhận hoàn tất điều chuyển tại đơn vị mới | không |
| việc làm | mọi trạng thái | NGHI_VIEC | thay đổi "nghỉ việc" có hiệu lực | không — re-hire mở lại qua hồ sơ (employee-profiles) |
| việc làm | HOP_DONG | NGHI_VIEC | hủy trước ngày nhận việc | không |
| thay đổi | — | NHAP | tạo thay đổi chưa gửi | — |
| thay đổi | NHAP | CHO_DUYET | gửi duyệt khi đủ điều kiện | có (bị trả về) |
| thay đổi | CHO_DUYET | DA_DUYET | approver duyệt | — |
| thay đổi | CHO_DUYET | TU_CHOI | approver từ chối kèm ghi chú | không |
| thay đổi | CHO_DUYET | NHAP | approver trả về yêu cầu bổ sung | — |
| thay đổi | DA_DUYET | HIEU_LUC | đến ngày hiệu lực, hệ thống áp dụng | không |
| thay đổi | DA_DUYET | HUY | hủy trước ngày hiệu lực kèm lý do | không |
| hợp đồng | — | HIEU_LUC | ký + ngày hiệu lực đến | — |
| hợp đồng | HIEU_LUC | HET_HAN / THAY_THE | quá ngày kết thúc hoặc bị hợp đồng mới thay | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| HR đóng giữa lúc tạo thay đổi | thay đổi NHAP đã lưu | mở lại thay đổi NHAP tiếp tục | không cần |
| Ngày hiệu lực đã qua mà áp dụng chưa chạy | thay đổi DA_DUYET gắn cờ "quá hạn áp dụng" | áp dụng lại khi job chạy; cảnh báo HR nếu quá 24h | audit ghi thời điểm áp dụng thực tế |
| Nhân viên nghỉ việc đột xuất khi có thay đổi đang chờ | thay đổi cũ CHO_DUYET/DA_DUYET | tạo nghỉ việc ưu tiên; cảnh báo hủy/xử lý thay đổi cũ | thay đổi cũ bị hủy kèm lý do |
| 2 người tạo thay đổi trên cùng việc làm | chỉ 1 thay đổi pending được tồn tại | người sau thấy cảnh báo + xem thay đổi đang chờ | — |
| Hồ sơ nhân viên bị LUU_TRU giữa chừng | việc làm/thay đổi treo | chặn tạo thay đổi mới; thay đổi chờ bị hủy kèm ghi chú | — |
| Upload tài liệu bắt buộc gián đoạn | thay đổi thiếu tài liệu | tải lại tài liệu qua document-intake rồi gửi duyệt | file lỗi theo luồng document-intake |

### 6.5 Other Edge Cases

- Ngày hiệu lực trong quá khứ (backdate): cho phép kèm lý do bắt buộc +
  cờ audit "backdated" — nhu cầu thật khi quyết định giấy ký trước, nhập
  sau (đề xuất ngưỡng ≤90 ngày — OQ-6).
- Hợp đồng hết hạn nhưng chưa có quyết định gia hạn/chấm dứt: cảnh báo
  "hợp đồng quá hạn" liên tục cho tới khi xử lý — không tự đổi trạng thái
  việc làm.
- Nhân viên đang TAM_NGHI khi có quyết định nghỉ việc: cho phép, giữ vết
  giai đoạn tạm nghỉ trong timeline.
- Điều chuyển sang cùng đơn vị + vị trí + manager hiện tại: chặn — không
  có gì thay đổi.
- Điều chuyển khi đang TAM_NGHI: cho tạo nhưng chỉ hiệu lực sau khi quay
  lại làm việc (đề xuất — OQ-4).
- Hai thay đổi trùng ngày hiệu lực: không xảy ra vì chỉ 1 thay đổi pending;
  nếu backdate chồng ngày, áp dụng theo thứ tự tạo.
- Kết thúc thử việc sớm/hoặc kéo dài thử việc: là thay đổi cùng loại "kết
  thúc thử việc" với ngày hiệu lực tùy chọn; gia hạn thử việc cần lý do.
- Nhân viên hỏi trạng thái của mình: xem được trạng thái + tài liệu phần
  được phép; tài liệu nội bộ (ghi chú HR) không lộ.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Loại thay đổi | bắt buộc; phải hợp lệ với trạng thái việc làm hiện tại theo transition matrix |
| Ngày hiệu lực | bắt buộc; backdate cho phép ≤90 ngày kèm lý do (đề xuất — OQ-6) |
| Lý do thay đổi | bắt buộc với nghỉ việc, tạm nghỉ, điều chuyển; ≥10 ký tự, ≤500 ký tự |
| Điều chuyển | bắt buộc chọn đơn vị/vị trí/manager mới; ít nhất 1 trường khác hiện tại |
| Số hợp đồng | bắt buộc, duy nhất trong tổ chức |
| Hợp đồng | loại bắt buộc: thử việc / xác định thời hạn / không xác định thời hạn; hiệu lực đến > hiệu lực từ (riêng loại không xác định được để trống ngày kết thúc) |
| Tài liệu bắt buộc | theo loại thay đổi (vd nghỉ việc: quyết định/đơn); thiếu → không gửi duyệt được |
| Checklist item | tiêu đề bắt buộc, owner bắt buộc, hạn ≥ ngày tạo |
| Ngày kết thúc tạm nghỉ dự kiến | > ngày bắt đầu tạm nghỉ; quá hạn nhắc HR |
| Tạm nghỉ | khi đang TAM_NGHI chỉ cho thay đổi "quay lại" hoặc "nghỉ việc" |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Thay đổi pending trên 1 việc làm | 1 | — | chặn tạo mới, cảnh báo xử lý cái cũ |
| Nhắc hết thử việc | trước 7 ngày (đề xuất — OQ-7) | mốc hiệu lực | thông báo HR hằng ngày tới khi tạo thay đổi |
| Nhắc hết hạn hợp đồng | trước 30 ngày (đề xuất — OQ-7) | ngày kết thúc | thông báo HR hằng tuần tới khi xử lý |
| SLA duyệt thay đổi | 2 ngày làm việc (đề xuất — OQ-7) | rolling | nhắc approver + leo thang HR lead |
| Checklist tối đa mỗi thay đổi | 20 đầu việc (đề xuất — OQ-7) | — | chặn thêm, gợi ý gộp đầu việc |
| Kích thước tài liệu đính kèm | ≤10 MB/file (đề xuất — OQ-7) | mỗi file | từ chối file, theo giới hạn document-intake |
| Backdate tối đa | 90 ngày (đề xuất — OQ-6) | — | chặn ngày hiệu lực xa hơn |
| Retention tài liệu/việc làm sau nghỉ việc | chờ PRD OQ-6 (DPO duyệt) | — | trước pilot chỉ dữ liệu synthetic |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Loại thay đổi không hợp lệ | "Trạng thái hiện tại không cho phép thay đổi này — xem lại vòng đời của nhân viên" | E-? |
| Còn thay đổi đang chờ | "Nhân viên đang có thay đổi chờ duyệt/hiệu lực — xử lý trước khi tạo mới" | E-? |
| Thiếu tài liệu bắt buộc | "Chưa đủ tài liệu bắt buộc: {danh sách} — đính kèm trước khi gửi duyệt" | E-? |
| Backdate thiếu lý do | "Ngày hiệu lực trong quá khứ cần lý do rõ ràng" | E-? |
| Điều chuyển không khác hiện tại | "Đơn vị, vị trí và người quản lý mới phải khác hiện tại" | E-? |
| Tự duyệt thay đổi mình tạo | "Bạn không thể duyệt thay đổi do chính mình đề xuất — chuyển người duyệt khác" | E-? |
| Số hợp đồng trùng | "Số hợp đồng {số} đã tồn tại — kiểm tra lại" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi duyệt thay đổi | "Đã gửi thay đổi cho {approver} duyệt" |
| Duyệt thay đổi | "Đã duyệt thay đổi {loại} cho {tên} — hiệu lực từ {ngày}" |
| Áp dụng hiệu lực | "Đã ghi nhận {loại thay đổi} của {tên} — hiệu lực từ {ngày}" |
| Hoàn tất nghỉ việc | "Đã ghi nhận nghỉ việc của {tên} — hồ sơ chuyển lưu trữ" |
| Hoàn tất checklist item | "Đã hoàn tất '{đầu việc}' trong checklist {loại thay đổi}" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Sắp hết thử việc | "Sắp hết thử việc: {tên} — còn {n} ngày, tạo thay đổi kết thúc thử việc" |
| Sắp hết hạn hợp đồng | "Hợp đồng {số} của {tên} hết hạn sau {n} ngày — gia hạn hoặc chấm dứt" |
| Checklist quá hạn | "Checklist {loại} của {tên} còn {n} việc chưa xong quá hạn" |
| Checklist chưa xong khi hiệu lực | "Thay đổi có hiệu lực nhưng checklist còn {n} việc — đã nhắc người phụ trách" |
| Từ chối thay đổi | "Thay đổi {loại} của {tên} không được duyệt: {lý do}" |
| Hợp đồng quá hạn | "Hợp đồng {số} của {tên} đã quá hạn {n} ngày — cần xử lý" |
| Backdate notice | "Thay đổi này có hiệu lực trong quá khứ ({ngày}) — được ghi nhận là backdate" |

## 8. Assumptions

- `employee-profiles` cung cấp hồ sơ HOAT_DONG và nhận tín hiệu LUU_TRU khi
  nghỉ việc hiệu lực; việc làm gắn 1-1 với hồ sơ ACTIVE.
- `org-governance` cung cấp role/scope cho approver và quản lý; approver là
  vai trò nghiệp vụ (HR lead/Head of HR), không chỉ admin.
- `document-intake` là cổng duy nhất đưa tài liệu vào; `contextual-notifications`
  là kênh nhắc hạn/thông báo.
- Danh sách loại thay đổi, tài liệu bắt buộc và checklist mặc định theo loại
  do Head of HR duyệt trước khi dùng dữ liệu thật.
- Trạng thái việc làm chỉ đổi qua thay đổi có hiệu lực — không sửa trực tiếp
  status (đây là cách chặn "chuyển trạng thái thiếu phê duyệt").
- Điều chuyển là trạng thái quá đội (DIEU_CHUYEN) giữa hiệu lực và xác nhận
  tại đơn vị mới — không phải trạng thái cuối.
- Human-in-the-loop: hệ thống không tự quyết định nghỉ việc/kết thúc thử
  việc/kỷ luật; mọi chuyển trạng thái qua người duyệt (PRD Mục 12).
- Tính năng Could — kỳ vọng triển khai sau khi employee-profiles ổn định;
  giới hạn số ở Mục 7.2 là giá trị đề xuất cần owner chốt.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Chuyển trạng thái thiếu phê duyệt (quyết định miệng nhập vào sau, hoặc sửa status trực tiếp) | thường | mất bằng chứng pháp lý, tranh chấp lao động không bênh được | chỉ đổi trạng thái qua thay đổi đã duyệt; audit bắt buộc; chặn sửa status trực tiếp |
| Mất/thiếu tài liệu đính kèm (quyết định, đơn, biên bản) | thường | không chứng minh được căn cứ khi kiểm tra/khiếu nại | tài liệu bắt buộc theo loại thay đổi; quyền truy cập theo vai trò |
| Quên hạn thử việc/hợp đồng → hợp đồng không xác định ngầm hoặc vi phạm luật | thỉnh thoảng | rủi ro pháp lý lao động, mất quyền chủ động chấm dứt đúng luật | nhắc trước 7/30 ngày + cảnh báo quá hạn liên tục |
| Checklist nghỉ việc chưa xong nhưng đã hiệu lực (thiết bị/tài khoản chưa thu) | thỉnh thoảng | mất tài sản, tài khoản còn sống sau nghỉ việc — rủi ro bảo mật | cờ "chưa hoàn tất" + leo thang nhắc; không chặn hiệu lực (đề xuất — OQ-2) |
| Trạng thái bị dùng để kỷ luật/kết luận nhân sự tự động | hiếm | vi phạm invariant human-in-the-loop, tranh chấp | mọi chuyển trạng thái qua người duyệt; AI không tự quyết (PRD Mục 12) |
| Retention tài liệu/hồ sơ nghỉ việc chưa được DPO duyệt | thường | giữ/xóa sai chính sách, rủi ro pháp lý | chỉ dữ liệu synthetic trước khi OQ-6 PRD đóng |
| Phụ thuộc employee-profiles chưa sẵn sàng (timeline) | thỉnh thoảng | không có hồ sơ ACTIVE để gắn việc làm | triển khai sau employee-profiles (phụ thuộc khai báo) |

## 10. Success Criteria (preliminary)

- Tỷ lệ chuyển trạng thái đúng hạn và đủ evidence — metric chính của PRD
  Mục 7.4; target ≥95% (đề xuất — chờ owner chốt).
- 100% chuyển trạng thái có approver khác người đề xuất (hoặc cờ tự duyệt
  ngoại lệ được ghi nhận).
- 0 thay đổi có hiệu lực thiếu audit đầy đủ.
- ≥90% checklist nghỉ việc hoàn tất trước ngày hiệu lực (đề xuất).
- 0 hợp đồng quá hạn không xử lý quá 7 ngày sau cảnh báo (đề xuất).

## 11. Open Questions

- [x] OQ-1: Ai là approver hợp lệ cho từng loại thay đổi? — Resolved (đề
  xuất): HR lead duyệt thông thường; nghỉ việc/điều chuyển cần thêm quản
  lý cấp trên hoặc Head of HR — chờ Head of HR xác nhận.
- [x] OQ-2: Checklist chưa xong có chặn hiệu lực không? — Resolved (đề
  xuất): không chặn (tránh vi phạm pháp lý ngày nghỉ/hiệu lực), nhưng gắn
  cờ + leo thang nhắc owner — chờ Head of HR xác nhận.
- [x] OQ-3: Retention việc làm/tài liệu sau nghỉ việc? — Resolved (đề
  xuất): giữ để truy vết theo chính sách DPO; trước khi OQ-6 PRD đóng chỉ
  dữ liệu synthetic — chờ DPO/legal xác nhận (PRD OQ-6).
- [x] OQ-4: Điều chuyển khi đang tạm nghỉ? — Resolved (đề xuất): cho tạo
  nhưng chỉ hiệu lực sau khi "quay lại làm việc" — chờ Head of HR xác nhận.
- [x] OQ-5: Kết quả đánh giá (employee-evaluation) có được dùng làm
  evidence cho thay đổi (vd kết thúc thử việc)? — Resolved: được đính kèm
  như tài liệu tham chiếu, không tự quyết định; quyền xem theo phạm vi —
  chu kỳ/phạm vi đánh giá chờ Product owner (PRD OQ-8).
- [x] OQ-6: Cho phép backdate ngày hiệu lực không, bao xa? — Resolved (đề
  xuất): cho phép ≤90 ngày kèm lý do bắt buộc + cờ audit — chờ Head of HR.
- [x] OQ-7: Các giới hạn đề xuất ở Mục 7.2 (7/30 ngày nhắc, SLA 2 ngày, 20
  checklist, 10 MB, 90 ngày backdate) có được owner chấp nhận? — Resolved
  (đề xuất): chấp nhận làm chuẩn slice này — chờ Head of HR xác nhận.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd employment-lifecycle` — capture user perspective
- `/brd employment-lifecycle` — business case
- `/prd-epic employment-lifecycle` — product scope
