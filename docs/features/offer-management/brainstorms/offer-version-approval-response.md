---
type: brainstorm
feature: offer-management
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# Offer có phiên bản, phê duyệt và theo dõi phản hồi — offer-management

## 1. Idea Seed

Một luồng offer minh bạch cho ứng viên đã đạt: HR soạn offer thành phiên bản
có nội dung chốt (vị trí, lương, ngày bắt đầu, hạn phản hồi), gửi người có
thẩm quyền duyệt, chỉ phiên bản đã duyệt mới được gửi cho đúng ứng viên qua
kênh có kiểm soát; hệ thống theo dõi ứng viên đã xem chưa, ghi nhận chấp
nhận/từ chối (ứng viên tự phản hồi hoặc HR ghi thay kèm kênh), xử lý hết hạn
và thu hồi — mọi bước có audit, và offer chấp nhận mở đường sang onboarding.

## 2. Context

HR hiện soạn offer bằng file Word, gửi qua email cá nhân: không biết bản nào
đã gửi, ai đã duyệt, ứng viên đã đọc chưa, và khi đàm phán thì version nào là
cuối cùng. Sai version hoặc sai người nhận là rủi ro thật (PRD Mục 7.11).
Feature này là mắt xích giữa quyết định tuyển và onboarding trong hành trình
recruitment (PRD Mục 7, bước 6): application đạt ở `candidate-pipeline` với
đánh giá đã review ở `interview-evaluation` → offer → ứng viên chấp nhận →
`employee-onboarding` chuyển đổi.

PRD xếp feature ở mức **Should** — KHÔNG thuộc cam kết lát cắt v1 (15 feature
Must); đây là slice mở rộng "hire-to-onboard". Bằng chứng nguồn (reverse spec
`recruitment-and-interviews`): đã quan sát offer actions chuyển application
sang `OFFERED`/`ACCEPTED`/`OFFER_REJECTED`/`ONBOARDED` (FR-RC-07) nhưng đó là
staff action; kênh ứng viên tự phản hồi chưa được chứng minh (OQ-RC-03), và
gate "đủ vòng phỏng vấn mới được offer" tồn tại nhưng không được gọi
(GAP-RC-01) — v1 feature phải tự chốt điều kiện tạo offer.

Nguyên tắc bất biến: con người soạn, duyệt và gửi offer — không có quyết định
tự động; mọi hành động nhạy cảm có audit; lương và điều khoản là dữ liệu hạn
chế theo quyền.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Offer soạn tay, không biết version nào đã gửi, không theo dõi được ứng viên xem chưa | Một luồng duy nhất: soạn → duyệt → gửi đúng người → thấy trạng thái xem/phản hồi |
| Người duyệt offer (HR lead/quản lý có thẩm quyền) | Duyệt qua email/chat, không có bản ghi quyết định | Hàng chờ duyệt rõ ràng + quyết định duyệt/từ chối có ghi nhận |
| Ứng viên | Nhận offer qua email đính kèm, khó so sánh khi đàm phán, không biết hạn trả lời | Xem offer rõ ràng, biết hạn phản hồi, chấp nhận/từ chối một chạm |
| Quản lý | Không biết vị trí mình phụ trách đang chờ offer nào | Xem trạng thái offer trong phạm vi quyền |
| Admin | Cần truy vết ai gửi offer nào, version nào, cho ai | Audit đầy đủ, quyền deny-by-default |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo offer từ application ở trạng thái đạt (`PASSED`) của `candidate-pipeline`,
  prefill ứng viên + vị trí; mỗi application tại một thời điểm chỉ có 1 offer
  đang mở.
- Soạn nội dung offer có cấu trúc: vị trí, phòng ban, mức lương/thù lao, ngày
  bắt đầu dự kiến, hạn phản hồi, phúc lợi/ghi chú, nội dung thư mời tự do.
- Version offer: mỗi lần sửa trước khi gửi tạo phiên bản mới; phiên bản đã
  gửi là bất biến; sửa sau gửi bắt buộc phiên bản mới qua duyệt lại.
- Luồng phê duyệt: gửi duyệt → người có thẩm quyền duyệt hoặc từ chối kèm ghi
  chú; chỉ phiên bản "Đã duyệt" mới được gửi cho ứng viên.
- Gửi offer cho đúng ứng viên: kiểm tra người nhận = ứng viên của application;
  kênh email chứa link xem offer có hạn truy cập (không đính kèm nội dung
  nhạy cảm trong email).
- Theo dõi trạng thái: đã gửi → ứng viên đã xem (thời điểm đầu + số lần) →
  đã phản hồi; cảnh báo sắp hết hạn.
- Ghi nhận phản hồi: ứng viên tự chấp nhận/từ chối qua link (idempotent, 1
  lần), hoặc HR ghi thay kèm kênh ngoài (điện thoại/email trực tiếp) và lý do
  ghi thay.
- Hết hạn và thu hồi: offer quá hạn phản hồi tự chuyển "Hết hạn"; HR thu hồi
  được offer chưa chấp nhận kèm lý do bắt buộc.
- Đồng bộ pipeline: gửi offer → `OFFERED`; chấp nhận → `ACCEPTED`; từ chối →
  `OFFER_REJECTED` — qua `candidate-pipeline`, không tự ý đổi stage.
- Khi ứng viên chấp nhận: phát sự kiện nghiệp vụ để `employee-onboarding`
  bắt đầu chuyển đổi + thông báo cho owner.
- Audit đầy đủ: ai soạn, ai duyệt, version nào gửi cho ai, khi nào xem, phản
  hồi gì.

### P1 — should have

- Nhắc ứng viên chưa phản hồi trước hạn (gửi lại nhắc nhở qua cùng kênh).
- Đàm phán: ứng viên/HR đánh dấu "đang đàm phán"; tạo phiên bản mới đàm phán
  → duyệt lại → gửi lại, giữ lịch sử từng vòng.
- Mẫu offer (template) theo vị trí để soạn nhanh.
- Xem trước offer đúng như ứng viên sẽ thấy trước khi gửi.

### P2 — nice to have

- E-signature/legal workflow — PRD "Chưa làm" cho tới khi chọn provider.
- AI đề xuất nội dung offer từ JD + đánh giá (vẫn qua duyệt của con người).
- Đa ngôn ngữ offer; đính kèm tài liệu phúc lợi từ `document-library`.

## 5. Core Flows (Happy Path)

### 5.1 Soạn offer → duyệt → gửi ứng viên

1) HR mở application đang ở `PASSED` trên `candidate-pipeline` → chọn "Tạo
   offer". Hệ thống prefill ứng viên, vị trí, email liên hệ.
2) HR nhập nội dung offer (vị trí, lương, ngày bắt đầu, hạn phản hồi, ghi
   chú) → lưu phiên bản ở "Nháp".
3) HR bấm "Gửi duyệt" → hệ thống kiểm tra đủ trường bắt buộc → phiên bản
   chuyển "Chờ duyệt", xuất hiện trong hàng chờ của người duyệt + thông báo.
4) Người duyệt mở offer → xem nội dung + thông tin application/đánh giá tóm
   tắt → "Duyệt" (phiên bản "Đã duyệt") hoặc "Từ chối duyệt" kèm ghi chú →
   HR sửa tạo phiên bản mới gửi lại.
5) HR bấm "Gửi offer" → hệ thống kiểm phiên bản đã duyệt + email ứng viên
   đúng → tạo link xem có hạn → gửi email mời xem offer → offer chuyển
   "Đã gửi", application sang `OFFERED`.

```
HR                          Hệ thống                          Người duyệt              Ứng viên
────────────────────────────────────────────────────────────────────────────────────────────────
Application PASSED
   │ "Tạo offer"
   ▼
Soạn nội dung ──▶ phiên bản "Nháp"
   │ "Gửi duyệt"
   ▼
              ┌── Đủ trường bắt buộc? ──┐
           Không▶ báo field thiếu    Có ▼
                                   "Chờ duyệt" ──────────────▶ mở hàng chờ, xem offer
                                                                    │
                                              ┌── Duyệt? ──┐
                                            Có ▼        Không ▼
                                        "Đã duyệt"   "Từ chối duyệt" + ghi chú
                                            │           → HR sửa → phiên bản mới
                                            ▼            → "Chờ duyệt" lại
   "Gửi offer" ◀────────────────────────────┘
   │
   ▼
┌── Kiểm: phiên bản đã duyệt? email đúng ứng viên? ──┐
│                                                   ▼
│                              Tạo link xem có hạn ────────────────▶ nhận email
│                              Gửi email mời xem offer                  "mở link"
│                              offer "Đã gửi"                              │
│                              application → OFFERED                       ▼
└──────────────────────────────────────────────────────────────────  xem offer (ghi
                                                                       "đã xem")
```

### 5.2 Ứng viên xem và phản hồi offer

1) Ứng viên mở link trong email → hệ thống kiểm link còn hạn + offer còn
   hiệu lực → hiển thị nội dung offer → ghi nhận "đã xem" (lần đầu + số lần).
2) Ứng viên chọn "Chấp nhận" hoặc "Từ chối" (từ chối có thể kèm lý do); có
   bước xác nhận trước khi ghi.
3) Hệ thống ghi phản hồi kèm phiên bản đã xem, thời điểm, kênh "tự phản hồi";
   offer chuyển "Đã chấp nhận"/"Đã từ chối"; application sang `ACCEPTED`/
   `OFFER_REJECTED`; thông báo HR/owner.
4) Nếu chấp nhận → phát sự kiện để `employee-onboarding` bắt đầu.

### 5.3 HR ghi nhận phản hồi thay (kênh ngoài)

1) Ứng viên gọi điện/email trực tiếp phản hồi → HR mở offer "Đã gửi"/"Đã xem"
   → "Ghi nhận phản hồi".
2) Chọn kết quả (chấp nhận/từ chối), kênh nhận (điện thoại/email/trực tiếp),
   lý do ghi thay bắt buộc → xác nhận.
3) Hệ thống ghi phản hồi kênh "ghi thay bởi {người}" + audit; chuyển trạng
   thái và đồng bộ pipeline như 5.2.

### 5.4 Sửa offer đã gửi / đàm phán tạo phiên bản mới

1) Offer "Đã gửi"/"Đã xem" cần sửa nội dung (đàm phán lương, đổi ngày bắt
   đầu) → HR chọn "Tạo phiên bản mới" → sửa nội dung → gửi duyệt lại.
2) Phiên bản mới "Chờ duyệt" → duyệt → "Gửi lại offer" → link mới thay thế
   link cũ (link cũ mất hiệu lực, mở ra báo "offer đã được cập nhật").
3) Lịch sử giữ đủ từng phiên bản đã gửi + phản hồi (nếu có) của từng vòng.

### 5.5 Thu hồi và hết hạn offer

1) HR chọn "Thu hồi offer" trên offer chưa chấp nhận → nhập lý do bắt buộc →
   offer "Đã thu hồi", link ứng viên vô hiệu, audit + thông báo owner; stage
   application giữ nguyên (HR quyết định tiếp trên pipeline).
2) Đến hạn phản hồi mà ứng viên chưa phản hồi → offer tự "Hết hạn", link vô
   hiệu, thông báo HR; HR chọn gia hạn (phiên bản mới gửi lại) hoặc đóng.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Application đủ điều kiện tạo offer (đang `PASSED`, chưa có offer đang mở)? | Cho "Tạo offer" | Ẩn/chặn + báo trạng thái hiện tại |
| D2 | 5.1 | Nội dung offer đủ trường bắt buộc? | Cho gửi duyệt → "Chờ duyệt" | Liệt kê field thiếu, giữ "Nháp" |
| D3 | 5.1 | Người duyệt đồng ý? | Phiên bản "Đã duyệt" | "Từ chối duyệt" + ghi chú → HR sửa phiên bản mới |
| D4 | 5.1 | Phiên bản gửi là bản đã duyệt + email đúng ứng viên application? | Gửi + "Đã gửi" + OFFERED | Chặn gửi + báo lỗi kiểm tra |
| D5 | 5.2 | Link còn hạn + offer còn hiệu lực? | Hiển thị offer, ghi "đã xem" | Trang thông báo hết hạn/thu hồi |
| D6 | 5.2/5.3 | Offer chưa có phản hồi? | Ghi phản hồi (idempotent) | Báo đã phản hồi trước đó, hiện kết quả |
| D7 | 5.4 | Sửa sau khi đã gửi? | Bắt buộc phiên bản mới → duyệt lại | (không cho sửa trực tiếp bản đã gửi) |
| D8 | 5.5 | Offer chưa chấp nhận? | Cho thu hồi + lý do | Chặn — offer đã chấp nhận không thu hồi được |
| D9 | mọi | Người thao tác trong phạm vi quyền (org/role/scope)? | Cho phép | Chặn + ghi audit truy cập từ chối |

### 6.2 Scenario Matrix

| Vai trò | Offer nháp/chờ duyệt | Offer đã duyệt chưa gửi | Offer đã gửi/đã xem | Offer đã chấp nhận |
|---|---|---|---|---|
| HR (trong scope) | soạn/sửa/gửi duyệt/hủy | xem, gửi, tạo phiên bản mới, thu hồi | xem, nhắc, ghi thay phản hồi, tạo phiên bản mới, thu hồi | xem, bắt đầu onboarding |
| Người duyệt | xem + duyệt/từ chối duyệt | xem | xem | xem |
| Quản lý | — | xem trong scope | xem trạng thái trong scope | xem |
| Ứng viên | — | — | xem qua link có hạn + phản hồi 1 lần | xem lại offer đã chấp nhận (read-only) |
| Admin | xem/audit | xem/audit | xem/audit | xem/audit |

### 6.3 State Transitions

```
offer: nháp → chờ-duyệt → đã-duyệt → đã-gửi → đã-xem → đã-chấp-nhận
              ↑      │                        │   ↘ đã-từ-chối
              └──────┘ (từ chối duyệt → phiên bản mới → chờ-duyệt)
        đã-gửi/đã-xem → hết-hạn (quá hạn phản hồi)
        nháp/chờ-duyệt/đã-duyệt/đã-gửi/đã-xem/hết-hạn → thu-hồi (HR + lý do)
        đã-từ-chối/hết-hạn/thu-hồi → (HR tạo offer mới cho cùng application)
phiên bản offer: nháp → chờ-duyệt → đã-duyệt → đã-gửi (bất biến)
                    ↘ từ-chối-duyệt
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| offer | — | nháp | HR tạo offer từ application PASSED | — |
| offer | nháp | chờ-duyệt | HR "Gửi duyệt" đủ trường | — |
| offer | chờ-duyệt | đã-duyệt | người duyệt "Duyệt" | không |
| offer | chờ-duyệt | nháp (phiên bản mới chờ duyệt) | người duyệt "Từ chối duyệt" | có (lặp vòng duyệt) |
| offer | đã-duyệt | đã-gửi | HR "Gửi offer" + kiểm người nhận | không |
| offer | đã-gửi | đã-xem | ứng viên mở link lần đầu | — |
| offer | đã-gửi/đã-xem | đã-chấp-nhận | phản hồi chấp nhận (tự hoặc ghi thay) | không |
| offer | đã-gửi/đã-xem | đã-từ-chối | phản hồi từ chối | không — tạo offer mới nếu cần |
| offer | đã-gửi/đã-xem | hết-hạn | quá hạn phản hồi | có — gia hạn bằng phiên bản mới gửi lại |
| offer | mọi trạng thái chưa chấp nhận | thu-hồi | HR "Thu hồi" + lý do | không |
| phiên bản offer | — | nháp | tạo/sửa nội dung | — |
| phiên bản offer | nháp | chờ-duyệt | gửi duyệt | — |
| phiên bản offer | chờ-duyệt | đã-duyệt / từ-chối-duyệt | quyết định người duyệt | không |
| phiên bản offer | đã-duyệt | đã-gửi | gửi cho ứng viên | không — bất biến |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Ứng viên mở link sau khi offer thu hồi/hết hạn | offer "Thu hồi"/"Hết hạn", link vô hiệu | trang thông báo offer không còn hiệu lực + liên hệ HR | không cho phản hồi |
| Email gửi offer thất bại | offer vẫn "Đã duyệt", chưa "Đã gửi" | HR gửi lại; kênh retry theo `contextual-notifications`/`operational-email` | log lỗi giao nhận |
| Ứng viên bấm phản hồi 2 lần / 2 tab | phản hồi đầu đã ghi | lần sau báo "đã ghi nhận phản hồi trước đó" | idempotent, không ghi đè |
| HR ghi thay phản hồi trong lúc ứng viên vừa tự phản hồi | phản hồi đầu tiên theo thời điểm ghi | người sau thấy "đã có phản hồi" + tải lại | không ghi đè |
| 2 HR cùng sửa 1 phiên bản nháp | bản lưu sau ghi đè | cảnh báo "offer vừa được {người} cập nhật — tải lại" | không merge tự động |
| Ứng viên đang xem thì HR gửi phiên bản mới | link cũ mất hiệu lực | mở lại → thông báo offer đã cập nhật + link mới (qua email mới) | phiên bản cũ vẫn giữ trong lịch sử |
| HR đóng trình duyệt giữa lúc soạn | phiên bản "Nháp" đã lưu | mở lại offer tiếp tục | — |

### 6.5 Other Edge Cases

- Application bị chuyển khỏi `PASSED` (ví dụ `ON_HOLD`/`WITHDRAWN`) trong khi
  offer đang nháp/chờ duyệt → offer vẫn tồn tại nhưng hiện cảnh báo "hồ sơ
  không còn ở trạng thái đạt"; chặn gửi cho tới khi hồ sơ hợp lệ.
- Ứng viên từ chối rồi đổi ý → offer đã "Đã từ chối" không mở lại; HR tạo
  offer mới (phiên bản 1 mới) nếu tổ chức đồng ý.
- Một người có nhiều application (nộp 2 vị trí) → mỗi application có offer
  riêng, link chỉ mở đúng offer của application đó.
- Email ứng viên thay đổi sau khi CV xác nhận → HR sửa email nhận trước khi
  gửi; hệ thống hiển thị rõ email sẽ gửi để kiểm lần cuối.
- Offer chờ duyệt nhưng người duyệt nghỉ/vắng → admin/HR lead chuyển hàng chờ
  sang người duyệt khác có thẩm quyền (giả định — OQ-3).
- Lương/điều khoản trong offer là dữ liệu hạn chế: chỉ HR trong scope, người
  duyệt và ứng viên của offer đó xem được; quản lý chỉ thấy trạng thái, không
  thấy con số (giả định — OQ-4).
- Không cho xóa offer đã gửi: chỉ thu hồi; offer nháp chưa gửi duyệt được xóa
  (giữ vết audit).

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Application nguồn | bắt buộc ở trạng thái `PASSED`; không có offer khác đang mở |
| Vị trí offer | bắt buộc; mặc định theo vị trí tuyển dụng của application |
| Mức lương/thù lao | bắt buộc nhập con số hoặc đánh dấu "thỏa thuận" kèm ghi chú |
| Ngày bắt đầu dự kiến | bắt buộc; ngày trong tương lai hoặc ≤30 ngày quá khứ (cảnh báo) |
| Hạn phản hồi | bắt buộc; 1–30 ngày kể từ ngày gửi (giả định — OQ-5) |
| Nội dung thư mời | bắt buộc, không rỗng, tối đa 10.000 ký tự (giả định) |
| Email người nhận | định dạng email hợp lệ; phải khớp ứng viên của application (hoặc email ứng viên cập nhật có xác nhận) |
| Lý do thu hồi | bắt buộc, 10–500 ký tự |
| Lý do ghi thay phản hồi | bắt buộc kèm kênh nhận, 10–500 ký tự |
| Ghi chú từ chối của ứng viên | tùy chọn, ≤1.000 ký tự |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Hạn phản hồi mặc định | 7 ngày | mỗi offer | HR đổi được trong 1–30 ngày (giả định — OQ-5) |
| Hạn truy cập link xem offer | = hạn phản hồi + 7 ngày đệm | mỗi lần gửi | link tự vô hiệu; ứng viên thấy trang hết hạn (giả định) |
| Số phiên bản mỗi offer | 10 | mỗi offer | chặn tạo thêm, gợi ý tạo offer mới (giả định — OQ-5) |
| Nhắc ứng viên chưa phản hồi | tối đa 2 lần | trước hạn phản hồi | không gửi thêm (giả định — OQ-5) |
| Offer đang mở mỗi application | 1 | — | chặn "Tạo offer" khi còn offer mở |
| Độ dài nội dung thư mời | 10.000 ký tự | — | chặn lưu, báo số ký tự vượt |
| Độ dài lý do (thu hồi/ghi thay) | 10–500 ký tự | mỗi lần nhập | chặn lưu |
| Giữ lịch sử offer + phản hồi | toàn vòng đời hồ sơ | — | không xóa; retention theo OQ-6 |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Tạo offer khi application chưa đạt | "Chỉ tạo offer cho ứng viên đang ở trạng thái «Đạt phỏng vấn»" | E-? |
| Còn offer đang mở | "Ứng viên này đang có một offer chưa kết thúc — xử lý offer hiện có trước" | E-? |
| Gửi duyệt thiếu trường | "Vui lòng điền đủ thông tin offer trước khi gửi duyệt: {danh sách field}" | E-? |
| Gửi phiên bản chưa duyệt | "Phiên bản này chưa được duyệt — offer phải được duyệt trước khi gửi" | E-? |
| Email không khớp ứng viên | "Email người nhận không khớp hồ sơ ứng viên — kiểm tra lại trước khi gửi" | E-? |
| Link hết hạn/không hiệu lực | "Offer này đã hết hạn hoặc không còn hiệu lực — vui lòng liên hệ {tên công ty/HR}" | E-? |
| Phản hồi trùng | "Phản hồi của bạn đã được ghi nhận trước đó — cảm ơn bạn" | E-? |
| Thu hồi thiếu lý do | "Vui lòng nhập lý do thu hồi offer (tối thiểu 10 ký tự)" | E-? |
| Thu hồi offer đã chấp nhận | "Offer đã được ứng viên chấp nhận — không thể thu hồi, liên hệ HR xử lý thủ công" | E-? |
| Hết quyền | "Bạn không có quyền thao tác offer thuộc vị trí này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu nháp | "Đã lưu bản nháp offer" |
| Gửi duyệt | "Đã gửi offer cho {người duyệt} phê duyệt" |
| Duyệt | "Offer đã được duyệt — sẵn sàng gửi cho ứng viên" |
| Gửi offer | "Đã gửi offer tới {email ứng viên} — hạn phản hồi {DD/MM/YYYY}" |
| Ứng viên chấp nhận | "Cảm ơn bạn! Phản hồi đã được ghi nhận — {tên công ty} sẽ liên hệ các bước tiếp theo" |
| Ghi thay phản hồi | "Đã ghi nhận phản hồi của ứng viên (kênh: {kênh}, ghi bởi {người})" |
| Thu hồi | "Đã thu hồi offer — đường link của ứng viên không còn hiệu lực" |
| Gửi lại phiên bản mới | "Đã gửi offer cập nhật — đường link cũ đã vô hiệu" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Chờ duyệt | "Offer đang chờ {người duyệt} phê duyệt" |
| Từ chối duyệt | "Offer cần chỉnh: {ghi chú của người duyệt}" |
| Ứng viên đã xem | "Ứng viên đã xem offer lúc {HH:mm DD/MM} (xem {n} lần)" |
| Sắp hết hạn | "Offer sẽ hết hạn phản hồi sau {n} ngày — cân nhắc nhắc ứng viên" |
| Đã hết hạn | "Offer đã hết hạn phản hồi — gia hạn bằng phiên bản mới hoặc đóng" |
| Phiên bản mới thay thế | "Offer này đã được cập nhật phiên bản mới — vui lòng xem email mới nhất" |
| Đang đàm phán | "Offer đang trong quá trình đàm phán — phiên bản {n} là bản mới nhất" |
| Lịch sử item | "{Người} {hành động} lúc {HH:mm DD/MM} — phiên bản {n} — {ghi chú}" |

## 8. Assumptions

- Điều kiện tạo offer v1: application đang `PASSED` trong `candidate-pipeline`
  và đã có đánh giá phỏng vấn được HR review (`interview-evaluation`). Gate
  "đủ N vòng" của nguồn không được chứng minh (GAP-RC-01) — v1 chốt 1 điều
  kiện đơn: stage `PASSED` do con người chốt.
- Ứng viên phản hồi qua link xem offer (self-service) — nguồn chưa chứng minh
  kênh này (OQ-RC-03); đây là thiết kế đề xuất, vẫn giữ đường "HR ghi thay"
  cho tổ chức chưa muốn mở self-service.
- Người duyệt offer là vai trò có thẩm quyền được gán qua `org-governance`
  (HR lead/quản lý vị trí), không nhất thiết là admin.
- Kênh gửi: email qua `operational-email`/`contextual-notifications` chứa
  link xem offer — email không chứa lương/điều khoản (dữ liệu hạn chế chỉ
  hiện sau khi mở link hợp lệ).
- Hạn phản hồi 7 ngày, link +7 ngày đệm, tối đa 10 phiên bản, nhắc tối đa 2
  lần — giá trị đề xuất chờ owner chốt (OQ-5).
- Mỗi application chỉ 1 offer đang mở; offer kết thúc (từ chối/hết hạn/thu
  hồi) không mở lại — tạo offer mới.
- Thu hồi offer KHÔNG tự đổi stage pipeline — `candidate-pipeline` giữ stage,
  HR quyết định (tránh state machine lệch nhau giữa 2 feature).
- Offer chứa dữ liệu cá nhân + lương → theo consent/retention policy (OQ-6
  PRD); trước khi DPO duyệt chỉ dùng dữ liệu synthetic (PRD Mục 9).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Gửi sai version hoặc sai người nhận (rủi ro chính PRD) | thỉnh thoảng | ứng viên nhận điều khoản sai/lộ lương người khác, mất uy tín, tranh chấp | chỉ gửi bản đã duyệt; kiểm email khớp application; link vô hiệu khi thay phiên bản/thu hồi; audit đầy đủ |
| Lương/điều khoản lộ qua email hoặc link bị forward | thỉnh thoảng | lộ dữ liệu nhạy cảm, vi phạm privacy gate | email chỉ chứa link có hạn; nội dung offer chỉ sau link hợp lệ; link vô hiệu sau phản hồi/hết hạn/thu hồi |
| Không ai duyệt — offer treo ở "Chờ duyệt" | thường | ứng viên chờ, mất ứng viên tốt cho đối thủ | hàng chờ duyệt có owner; nhắc quá hạn duyệt; chuyển người duyệt khi vắng |
| Ứng viên không phản hồi, HR quên xử lý | thường | offer treo, pipeline ảo, không chốt được headcount | cảnh báo sắp hết hạn; tự "Hết hạn"; nhắc tối đa 2 lần |
| Ghi thay phản hồi sai/bị lạm dụng | hiếm | trạng thái offer sai thật, tranh chấp với ứng viên | ghi thay bắt buộc kênh + lý do; audit; chỉ HR trong scope |
| Thu hồi offer sau khi ứng viên đã xem | thỉnh thoảng | trải nghiệm ứng viên xấu, rủi ro pháp lý miễn cường | link báo rõ "không còn hiệu lực"; lý do thu hồi bắt buộc + audit |
| Process: tổ chức quen offer bằng file giấy/ký tay | thỉnh thoảng | không dùng feature, offer vẫn gửi ngoài hệ thống | giữ đường ghi thay phản hồi; cho phép đính kèm scan offer đã ký (ghi nhận evidence) |

## 10. Success Criteria (preliminary)

- Thời gian từ quyết định đạt (`PASSED`) đến phản hồi offer — mục tiêu theo
  PRD Mục 7.11; baseline/target chờ OQ-1/OQ-2 của PRD sản phẩm.
- 100% offer gửi cho ứng viên là phiên bản đã duyệt (guardrail).
- 100% offer có đủ vết: người soạn, người duyệt, version gửi, người nhận,
  thời điểm xem, phản hồi + kênh.
- Tỷ lệ offer có phản hồi trước hạn — đo được sau khi có baseline (OQ-1/2).
- 0 sự cố gửi sai người nhận được xác nhận (bám M-GR-01/R-08 PRD).

## 11. Open Questions

- [x] OQ-1: Ứng viên phản hồi offer qua kênh nào và audit ra sao? (kế thừa
  OQ-RC-03) — Resolved (đề xuất): link xem offer có hạn cho phản hồi tự phục
  vụ (1 lần, idempotent) + đường "HR ghi thay" kèm kênh/lý do; mọi phản hồi
  ghi phiên bản, thời điểm, kênh, người ghi — chờ Product owner xác nhận.
- [x] OQ-2: Điều kiện được tạo offer là gì (đủ vòng phỏng vấn? GAP-RC-01 cho
  thấy gate nguồn không được gọi)? — Resolved (đề xuất): application đang
  `PASSED` (do con người chốt qua `interview-evaluation`/`candidate-pipeline`)
  là điều kiện duy nhất của v1 — chờ Recruitment owner xác nhận.
- [x] OQ-3: Ai là người duyệt offer hợp lệ và có cần nhiều cấp duyệt không?
  — Resolved (đề xuất): một cấp duyệt bởi vai trò có thẩm quyền qua
  `org-governance` (HR lead/quản lý vị trí); hàng chờ chuyển được cho người
  duyệt khác khi vắng — chờ Head of HR xác nhận.
- [x] OQ-4: Quản lý có được xem con số lương trong offer hay chỉ trạng thái?
  — Resolved (đề xuất): chỉ trạng thái; lương/điều khoản là dữ liệu hạn chế
  (HR trong scope + người duyệt + ứng viên của offer đó) — chờ DPO/legal xác
  nhận cùng privacy gate.
- [x] OQ-5: Các giới hạn Mục 7.2 (hạn phản hồi 7 ngày, 1–30 ngày, 10 phiên
  bản, nhắc 2 lần, link +7 ngày đệm) có làm chuẩn v1 không? — Resolved (đề
  xuất): giữ làm mặc định — chờ Product owner xác nhận.
- [x] OQ-6: Retention offer (lương, phản hồi, link access log) giữ bao lâu?
  — Resolved (đề xuất): theo retention chung của hồ sơ tuyển dụng; trước khi
  DPO duyệt policy chỉ dùng dữ liệu synthetic (PRD OQ-6, PRD Mục 9).
- [~] OQ-7: E-signature trên offer có trong phạm vi không? — Out of scope v1:
  PRD Mục 7.11 "Chưa làm" cho tới khi chọn provider (đưa P2 roadmap).

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd offer-management` — capture user perspective
- `/brd offer-management` — business case
- `/prd-epic offer-management` — product scope
