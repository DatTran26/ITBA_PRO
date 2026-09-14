---
type: brainstorm
feature: recruitment-planning
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md, docs/_reverse/recruitment-and-interviews/gaps.md]
---

# Nhu cầu tuyển dụng có phê duyệt trước khi mở vị trí — recruitment-planning

## 1. Idea Seed

Một đầu mối thống nhất cho nhu cầu tuyển dụng: quản lý đề xuất nhu cầu
(tuyển ai, vì sao, bao nhiêu người, khi nào cần), HR chuẩn hóa thành vị
trí/JD rõ ràng kèm owner và headcount, cấp thẩm quyền phê duyệt có ghi
nhận trước khi vị trí được mở; vị trí "đang mở" là điều kiện để CV ứng
viên được tiếp nhận và gắn vào đúng chỗ. Không vị trí nào được mở khi
requirement hoặc thẩm quyền chưa rõ, và mọi quyết định duyệt/từ chối/đóng
đều truy vết được.

## 2. Context

Nhu cầu tuyển dụng hiện đến qua email, chat hoặc trao đổi miệng: quản lý
nói "cần thêm 2 người", HR tự viết JD rồi đăng — không ai chắc yêu cầu đã
được cấp có thẩm quyền duyệt chưa, headcount bao nhiêu là đủ, và vị trí
nào đang thực sự mở. Đây là mắt xích đầu của hành trình tuyển dụng v1
(PRD Mục 7.5, MoSCoW `Must`, roadmap xếp `Now`): `cv-intake` chỉ nhận CV
gắn vị trí đang mở, `candidate-matching` so CV với yêu cầu vị trí,
`candidate-pipeline` điều phối ứng viên theo vị trí. Nguồn ITBAAI đã có
bảng `job_descriptions` và JD trong luồng upload CV (reverse spec
`recruitment-and-interviews`) — bằng chứng triển khai, chưa phải bằng
chứng nhu cầu; phần request → approval → headcount chưa có trong nguồn
và là khuyếm khuyết roadmap cần bổ sung ("request→approval + headcount
trên JD"). Feature phụ thuộc `org-governance` (vai trò, phạm vi, người có
thẩm quyền) và chịu invariant human-in-the-loop của PRD Mục 12: quyết
định duyệt/mở/đóng vị trí luôn do con người ra.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý | Nhu cầu tuyển truyền miệng/email, không biết đã được duyệt chưa, đến đâu rồi | Một form đề xuất rõ ràng + trạng thái theo dõi được |
| HR | JD tự viết lại mỗi lần, không rõ ai là owner, headcount nào đã đủ | Chuẩn hóa vị trí/JD một lần, gán owner, theo dõi headcount |
| Cấp phê duyệt (Head of HR/lãnh đạo) | Không có hàng chờ duyệt chính thức; vị trí mở mà không qua tay mình | Hàng chờ request chờ duyệt + quyết định duyệt/từ chối có ghi nhận |
| Quản lý cấp trên / lãnh đạo | Không nhìn được tổng nhu cầu tuyển đang chờ/đang mở | Danh sách request và vị trí theo phạm vi quyền |
| Admin | Không truy vết được ai đã mở vị trí nào, theo quyết định nào | Audit đầy đủ đề xuất → duyệt → mở → đóng |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo recruitment request: quản lý hoặc HR đề xuất nhu cầu gồm tên vị
  trí dự kiến, đơn vị, lý do tuyển, số lượng cần (headcount), thời điểm
  cần người, mức ưu tiên; lưu nháp hoặc gửi duyệt.
- HR chuẩn hóa vị trí/JD: bổ sung nội dung JD (mô tả, yêu cầu, mức kinh
  nghiệm/kỹ năng kỳ vọng), gán HR owner phụ trách vị trí trước khi gửi
  duyệt.
- Luồng phê duyệt có ghi nhận: request ở "Chờ duyệt" đi vào hàng chờ của
  cấp thẩm quyền; approver duyệt / từ chối / yêu cầu chỉnh kèm ghi chú;
  yêu cầu chỉnh → người đề xuất/HR sửa rồi gửi lại.
- Mở vị trí: chỉ request "Đã duyệt" mới tạo được vị trí ở trạng thái
  "Đang mở" kèm headcount — vị trí đang mở là điều kiện để `cv-intake`
  nhận CV gắn vị trí và mở form ứng viên.
- Theo dõi request và vị trí: trạng thái từng request, danh sách vị trí
  đang mở/tạm dừng/đã đóng, headcount đã tuyển/còn lại trên mỗi vị trí.
- Đóng/tạm dừng vị trí: HR owner hoặc cấp thẩm quyền đóng/tạm dừng kèm
  lý do; khi headcount đủ hệ thống cảnh báo đề xuất đóng nhưng KHÔNG tự
  đóng — quyết định của con người.
- Hủy request: người đề xuất/HR hủy request chưa mở vị trí kèm lý do.
- Audit: ai đề xuất, ai chuẩn hóa JD, ai duyệt/từ chối/yêu cầu chỉnh, ai
  mở/tạm dừng/đóng vị trí, khi nào — truy vết được.

### P1 — should have

- Cảnh báo request "Chờ duyệt" quá hạn cho approver và người đề xuất (qua
  `contextual-notifications`).
- Cảnh báo "vị trí đã đủ headcount" đề xuất đóng; cảnh báo vị trí mở lâu
  chưa có ứng viên.
- Nhân bản JD từ một vị trí đã có để soạn request nhanh hơn.
- Lọc danh sách request/vị trí theo đơn vị, trạng thái, owner, mức ưu
  tiên.
- Gắn kỹ năng/level kỳ vọng của vị trí từ taxonomy `talent-framework` để
  `candidate-matching` và assessment dùng chung.

### P2 — nice to have

- Workforce budgeting: đối chiếu headcount với ngân sách/định biên (PRD
  "Chưa làm").
- Đăng vị trí ra kênh ngoài/job board tự động (PRD "Chưa làm"; chờ
  `external-integrations`).
- AI gợi ý nháp JD từ tên vị trí/lý do tuyển — vẫn qua review của HR.
- Kế hoạch tuyển theo quý/năm và báo cáo headcount plan (hướng
  `management-reporting`).

## 5. Core Flows (Happy Path)

### 5.1 Đề xuất nhu cầu → chuẩn hóa JD → duyệt → mở vị trí

1) Quản lý (hoặc HR hộ) mở "Đề xuất tuyển dụng" → điền tên vị trí dự
   kiến, đơn vị, lý do, headcount, thời điểm cần, mức ưu tiên → lưu nháp
   hoặc gửi ngay.
2) HR mở request → chuẩn hóa JD (mô tả, yêu cầu, mức kỳ vọng) → gán HR
   owner → gửi duyệt; request chuyển "Chờ duyệt" vào hàng chờ approver.
3) Approver mở request → xem nhu cầu + JD → "Duyệt".
4) Hệ thống ghi quyết định, request chuyển "Đã duyệt", tạo vị trí ở
   "Đang mở" mang theo JD + headcount + owner → vị trí xuất hiện trong
   danh sách đang tuyển và sẵn sàng nhận CV.

```
Quản lý/HR                Hệ thống                    Approver
─────────────────────────────────────────────────────────────────────
Tạo request (nháp)
   │
   ▼ HR chuẩn hóa JD + gán owner + gửi duyệt
"Chờ duyệt" ─────────────────────────────▶ hàng chờ approver
   │                                          │
   │              ┌── từ chối + lý do ────────┤
   │              ▼                           │
   │         "Từ chối"                        ▼
   │         (kết thúc,               ── Đồng ý duyệt? ──┐
   │          giữ audit)                  │              │
   │              ┌── yêu cầu chỉnh ──────┘            Có ▼
   │              ▼                                    "Đã duyệt"
   │        "Yêu cầu chỉnh"                               │
   │              │                                       ▼
   └── sửa rồi gửi lại ──┘                     Tạo VỊ TRÍ "Đang mở"
        (quay lại "Chờ duyệt")                 (JD + headcount + owner)
                                                      │
                                                      ▼
                                    cv-intake nhận CV gắn vị trí;
                                    form ứng viên của vị trí mở
```

### 5.2 Approver xử lý hàng chờ

1) Approver mở "Chờ duyệt" → danh sách request sắp theo thời gian gửi,
   request quá hạn được đánh dấu.
2) Mở request → xem nhu cầu, JD, người đề xuất, owner → chọn "Duyệt" /
   "Từ chối" / "Yêu cầu chỉnh" — hai lựa chọn sau bắt buộc ghi chú.
3) Quyết định được ghi nhận kèm người và thời điểm; người đề xuất và HR
   owner được thông báo kết quả.

### 5.3 Theo dõi headcount → đóng vị trí

1) HR owner theo dõi vị trí đang mở: mỗi vị trí hiển thị headcount cần,
   số ứng viên đã chốt tuyển (trạng thái cuối pipeline do
   `candidate-pipeline` ghi nhận) và số còn lại.
2) Khi số đã chốt đạt headcount → hệ thống hiện cảnh báo "đã đủ số
   lượng" đề xuất đóng; HR owner xác nhận đóng kèm lý do hoặc giữ mở.
3) HR owner/approver cũng có thể đóng hoặc tạm dừng vị trí bất cứ lúc
   nào kèm lý do; vị trí tạm dừng mở lại được, vị trí đã đóng không mở
   lại — tạo request mới nếu cần tuyển tiếp.

### 5.4 Sửa hoặc hủy request

1) Request còn "Nháp" hoặc "Yêu cầu chỉnh": người đề xuất/HR sửa tự do
   rồi gửi lại.
2) Request "Chờ duyệt": người đề xuất rút về "Nháp" để sửa, hoặc hủy kèm
   lý do.
3) Request "Đã duyệt" nhưng vị trí chưa đóng: không sửa trực tiếp — HR
   owner điều chỉnh JD/headcount trên vị trí (ghi audit) hoặc đóng vị
   trí rồi tạo request mới.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Request đủ trường bắt buộc khi gửi duyệt? | Chuyển "Chờ duyệt", đưa vào hàng chờ approver | Giữ trạng thái hiện tại, liệt kê trường thiếu |
| D2 | 5.1/5.2 | Approver đồng ý duyệt? | "Đã duyệt" → tạo vị trí "Đang mở" | "Từ chối" hoặc "Yêu cầu chỉnh" + ghi chú bắt buộc |
| D3 | 5.1 | JD đã được chuẩn hóa và có HR owner? | Cho phép gửi duyệt | Chặn gửi duyệt, yêu cầu bổ sung JD/owner |
| D4 | 5.3 | Số ứng viên đã chốt đạt headcount? | Cảnh báo đề xuất đóng vị trí | Không làm gì |
| D5 | 5.3 | HR xác nhận đóng vị trí? | "Đã đóng" + lý do; form ứng viên của vị trí ngừng nhận | Giữ "Đang mở" |
| D6 | 5.4 | Request đang "Chờ duyệt" và người đề xuất muốn sửa? | Rút về "Nháp" để sửa | Phải chờ quyết định hoặc hủy |
| D7 | 5.3 | Vị trí "Đã đóng" cần tuyển tiếp? | Tạo request mới (có thể nhân bản JD cũ) | Không mở lại vị trí đã đóng |
| D8 | tất cả | Người thao tác có quyền trên đơn vị/vị trí đó? | Cho thực hiện | Từ chối + ghi audit từ chối |

### 6.2 Scenario Matrix

| Vai trò | Request nháp | Request chờ duyệt | Request yêu cầu chỉnh | Vị trí đang mở | Vị trí tạm dừng/đã đóng |
|---|---|---|---|---|---|
| Quản lý (người đề xuất) | tạo/sửa/gửi/hủy | xem, rút về, hủy | sửa gửi lại | xem tiến độ | xem |
| HR | tạo hộ/sửa/chuẩn hóa JD | xem, rút về | sửa gửi lại | quản lý, điều chỉnh JD/headcount có audit, đóng/tạm dừng | mở lại (tạm dừng), xem |
| Approver | — | xem + duyệt/từ chối/yêu cầu chỉnh | xem lại khi gửi lại | xem, có thể yêu cầu đóng | xem |
| Lãnh đạo (phạm vi được cấp) | xem | xem | xem | xem tổng quan | xem |

### 6.3 State Transitions

```
RECRUITMENT_REQUEST:
  nháp → chờ-duyệt → đã-duyệt ──(tạo vị trí)──▶ POSITION "đang-mở"
    ↑       │  ↘ từ-chối (kết thúc, giữ audit)
    │       │  ↘ yêu-cầu-chỉnh ──(sửa, gửi lại)──▶ chờ-duyệt
    └── rút về ◀──┘
  nháp/chờ-duyệt/yêu-cầu-chỉnh → đã-hủy (kèm lý do)

POSITION:
  đang-mở ⇄ tạm-dừng → đã-đóng (đủ headcount hoặc quyết định thủ công)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| Request | — | nháp | tạo mới, chưa gửi | — |
| Request | nháp | chờ-duyệt | gửi duyệt đủ trường | — |
| Request | chờ-duyệt | nháp | người đề xuất/HR rút về | có |
| Request | chờ-duyệt | đã-duyệt | approver duyệt | không |
| Request | chờ-duyệt | từ-chối | approver từ chối kèm lý do | không (tạo request mới) |
| Request | chờ-duyệt | yêu-cầu-chỉnh | approver yêu cầu chỉnh kèm ghi chú | có (gửi lại → chờ-duyệt) |
| Request | yêu-cầu-chỉnh | chờ-duyệt | sửa rồi gửi lại | — |
| Request | nháp/chờ-duyệt/yêu-cầu-chỉnh | đã-hủy | hủy kèm lý do | không |
| Position | — | đang-mở | request được duyệt | — |
| Position | đang-mở | tạm-dừng | HR owner/approver tạm dừng kèm lý do | có (mở lại → đang-mở) |
| Position | đang-mở/tạm-dừng | đã-đóng | đủ headcount + HR xác nhận, hoặc đóng thủ công | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người đề xuất đóng trình duyệt giữa form | request "Nháp" đã lưu lần cuối (hoặc mất phần chưa lưu) | mở lại nháp tiếp tục | không có |
| Approver duyệt trong lúc request vừa bị rút về nháp | request đã về "Nháp" | hệ thống kiểm tra trạng thái trước khi ghi quyết định, cảnh báo nếu đã đổi | quyết định trên bản cũ không được ghi |
| Hai người cùng sửa 1 request | bản lưu sau ghi đè | cảnh báo "request vừa được {người} cập nhật — tải lại" | không merge tự động |
| Vị trí đang mở khi HR điều chỉnh headcount xuống dưới số đã chốt | vị trí giữ nguyên, số đã chốt không giảm | hệ thống cảnh báo mâu thuẫn, HR quyết định đóng hoặc giữ | không mất dữ liệu |
| Approver nghỉ việc khi còn hàng chờ | request vẫn "Chờ duyệt" | admin gán lại approver cho hàng chờ | hàng chờ không mất |

### 6.5 Other Edge Cases

- Request trùng với vị trí đang mở cùng tên/đơn vị: cảnh báo "đã có vị
  trí tương tự đang mở" khi gửi duyệt — người gửi quyết định tiếp tục
  hay không.
- Headcount = 0 hoặc số âm: chặn tại validation.
- Đơn vị của request bị đổi tên/giải thể sau khi duyệt: vị trí giữ nguyên
  snapshot đơn vị tại thời điểm duyệt, hiện cảnh báo để HR cập nhật.
- Vị trí đóng khi còn application đang xử lý: application không bị mất —
  `candidate-pipeline` vẫn điều phối tiếp; chỉ form ứng viên và tiếp nhận
  CV mới gắn vị trí ngừng.
- Tổ chức chưa có approver nào được gán: chặn gửi duyệt với hướng dẫn
  admin gán thẩm quyền (liên quan `org-governance`).
- Empty state: chưa có request nào → gợi ý tạo đề xuất đầu tiên.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên vị trí dự kiến | bắt buộc, không rỗng, tối đa 150 ký tự |
| Đơn vị | bắt buộc, chọn từ cơ cấu tổ chức (`org-governance`) |
| Lý do tuyển | bắt buộc, không rỗng |
| Headcount | bắt buộc, số nguyên 1–50 (đề xuất) |
| Thời điểm cần người | tùy chọn, nếu có phải là ngày tương lai |
| Mức ưu tiên | bắt buộc: thấp / trung bình / cao / gấp |
| Nội dung JD | bắt buộc trước khi gửi duyệt: mô tả + yêu cầu tối thiểu không rỗng, tối đa 20.000 ký tự (đề xuất) |
| HR owner | bắt buộc trước khi gửi duyệt; là người dùng nội bộ còn hoạt động |
| Ghi chú từ chối / yêu cầu chỉnh / đóng / tạm dừng / hủy | bắt buộc không rỗng |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Headcount mỗi request | 1–50 | mỗi request | chặn gửi duyệt (đề xuất, chờ owner — OQ) |
| Độ dài tên vị trí | 150 ký tự | — | chặn lưu |
| Độ dài JD | 20.000 ký tự | — | chặn lưu (đề xuất) |
| SLA chờ duyệt trước khi cảnh báo | 5 ngày làm việc | mỗi request | đánh dấu quá hạn + thông báo approver (đề xuất) |
| Số lần yêu cầu chỉnh | không giới hạn | — | mọi vòng ghi lịch sử |
| Số vị trí tạo từ 1 request | 1 | — | tuyển đợt mới tạo request mới (đề xuất) |
| Kết quả danh sách | 50 dòng/trang | — | phân trang |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thiếu trường khi gửi duyệt | "Vui lòng điền đủ thông tin trước khi gửi duyệt: {danh sách trường}" | E-? |
| Chưa chuẩn hóa JD/owner | "Cần hoàn thiện JD và chọn HR phụ trách trước khi gửi duyệt" | E-? |
| Headcount không hợp lệ | "Số lượng cần tuyển phải từ 1 đến 50" | E-? |
| Không có approver | "Tổ chức chưa có người phê duyệt — liên hệ admin để gán thẩm quyền" | E-? |
| Thiếu ghi chú quyết định | "Nhập lý do trước khi {từ chối/yêu cầu chỉnh/đóng/tạm dừng/hủy}" | E-? |
| Request đã đổi trạng thái | "Request này vừa được cập nhật — tải lại để xem trạng thái mới nhất" | E-? |
| Trùng vị trí đang mở | "Đã có vị trí «{tên}» đang mở cho đơn vị này — xác nhận vẫn gửi duyệt?" | E-? |
| Không có quyền trên đơn vị | "Bạn không có quyền thao tác trên nhu cầu của đơn vị này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu nháp | "Đã lưu nháp đề xuất tuyển dụng" |
| Gửi duyệt | "Đã gửi đề xuất cho người phê duyệt" |
| Duyệt | "Đã duyệt — vị trí «{tên}» đang mở và sẵn sàng nhận hồ sơ" |
| Yêu cầu chỉnh | "Đã trả đề xuất kèm yêu cầu chỉnh cho người đề xuất" |
| Đóng vị trí | "Vị trí «{tên}» đã đóng — không nhận thêm hồ sơ mới" |
| Mở lại vị trí | "Vị trí «{tên}» đang mở trở lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đủ headcount | "Vị trí «{tên}» đã đủ {n}/{n} số lượng — xác nhận đóng hay giữ mở?" |
| Quá hạn duyệt | "Đề xuất «{tên}» đã chờ duyệt {n} ngày làm việc" |
| Request được duyệt | "Đề xuất «{tên}» của bạn đã được duyệt — vị trí đang mở" |
| Request bị từ chối | "Đề xuất «{tên}» không được duyệt: {lý do}" |
| Empty state request | "Chưa có đề xuất tuyển dụng nào — tạo đề xuất đầu tiên" |
| Empty state hàng chờ | "Không có đề xuất nào đang chờ duyệt" |

## 8. Assumptions

- Cấp thẩm quyền phê duyệt là một vai trò được gán trong `org-governance`
  (đề xuất: Head of HR hoặc người được ủy quyền theo đơn vị) — một cấp
  duyệt trong v1, không phải chuỗi nhiều cấp.
- Một request tạo tối đa một vị trí trong v1; tuyển nhiều đợt cho cùng
  nhu cầu thì tạo request mới (có thể nhân bản JD).
- "Số đã chốt tuyển" của vị trí được đếm từ application đạt trạng thái
  cuối pipeline (chấp nhận offer/onboarded theo state machine do
  `candidate-pipeline`/`offer-management` ghi nhận); khi offer chưa có
  trong v1 thì đếm theo trạng thái kết thúc đạt mà pipeline công bố.
- Vị trí đã đóng không mở lại — tuyển tiếp thì tạo request mới; điều
  chỉnh JD/headcount trên vị trí đang mở được phép nhưng ghi audit.
- Headcount tối đa 50/request, JD ≤20.000 ký tự, SLA duyệt 5 ngày làm
  việc là giá trị đề xuất thận trọng — nguồn không chốt ngưỡng.
- Đóng vị trí là quyết định của con người: hệ thống chỉ cảnh báo khi đủ
  headcount, không tự đóng (bám invariant human-in-the-loop PRD Mục 12).
- Người đề xuất thấy các request của đơn vị mình theo phạm vi
  `org-governance`; lãnh đạo xem trong phạm vi được cấp.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Vị trí mở khi requirement/thẩm quyền chưa rõ | thỉnh thoảng | tuyển sai nhu cầu, lãng phí chi phí tuyển, tranh chấp trách nhiệm (rủi ro chính PRD 7.5) | chỉ request "Đã duyệt" mới mở được vị trí; audit đầy đủ |
| Hàng chờ duyệt bị bỏ quên → nhu cầu tuyển trễ | thường | vị trí cần gấp không kịp mở, quản lý mất niềm tin | cảnh báo quá hạn SLA + hàng chờ rõ ràng có owner |
| Headcount theo dõi sai (đếm thừa/thiếu) | thỉnh thoảng | đóng vị trí sai lúc hoặc tuyển vượt định mức | đếm từ trạng thái pipeline có nguồn; cảnh báo chỉ là đề xuất, con người xác nhận đóng |
| Approver duy nhất vắng mặt → nghẽn toàn bộ | thỉnh thoảng | mọi request treo, tuyển dừng | gán approver thay thế trong org-governance; cảnh báo quá hạn cho admin |
| Sửa JD sau khi duyệt không có audit | thỉnh thoảng | không truy vết được vị trí đang tuyển theo JD nào | mọi điều chỉnh trên vị trí đang mở ghi audit trước/sau |
| Người đề xuất lạm dụng gửi nhiều request rác | hiếm | hàng chờ nhiễu, approver mệt | validation + trạng thái nháp; phạm vi quyền theo đơn vị |

## 10. Success Criteria (preliminary)

- Thời gian từ request đến vị trí được duyệt — chỉ số chính theo PRD Mục
  7.5; mốc mục tiêu chờ OQ-2 sản phẩm.
- 100% vị trí "Đang mở" xuất phát từ request "Đã duyệt" có đủ JD + owner
  + headcount (không có vị trí mở không qua duyệt).
- 100% quyết định duyệt/từ chối/yêu cầu chỉnh/đóng có người thực hiện,
  thời điểm và lý do.
- Request "Chờ duyệt" không treo quá SLA mà không có cảnh báo — 0 request
  quá hạn không được đánh dấu.

## 11. Open Questions

- [x] OQ-1: Ai là cấp thẩm quyền duyệt nhu cầu tuyển dụng — Resolved (đề
  xuất): vai trò "người phê duyệt tuyển dụng" gán trong `org-governance`,
  mặc định Head of HR hoặc người được ủy quyền theo đơn vị; một cấp duyệt
  trong v1 — chờ Head of HR xác nhận.
- [x] OQ-2: Một request có tạo được nhiều vị trí/nhiều đợt tuyển không —
  Resolved (đề xuất): v1 một request = một vị trí; đợt tuyển mới tạo
  request mới, có thể nhân bản JD — chờ Product owner xác nhận.
- [x] OQ-3: Headcount được đếm thế nào và ai chốt ngưỡng "đủ" — Resolved
  (đề xuất): đếm application đạt trạng thái chốt tuyển do
  `candidate-pipeline`/offer ghi nhận; hệ thống chỉ cảnh báo, HR xác nhận
  đóng — chờ Head of HR xác nhận.
- [x] OQ-4: Vị trí đủ headcount có tự đóng không — Resolved: KHÔNG tự
  đóng; cảnh báo đề xuất và con người quyết định (bám invariant
  human-in-the-loop PRD Mục 12).
- [x] OQ-5: Ngưỡng số học (headcount ≤50, JD ≤20.000 ký tự, SLA duyệt 5
  ngày làm việc) — Resolved (đề xuất): dùng giá trị trên làm chuẩn v1 —
  chờ Product owner xác nhận.
- [x] OQ-6: Request bị từ chối có được mở lại không — Resolved: không;
  lý do được giữ trong audit, nhu cầu còn thì tạo request mới tham chiếu
  request cũ.
- [~] OQ-7: Có cần chuỗi phê duyệt nhiều cấp (quản lý → Head of HR →
  giám đốc) không — Out of scope v1: PRD 7.5 chỉ nêu "cấp thẩm quyền"
  số ít; nhu cầu đa cấp đưa vào roadmap mở rộng.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd recruitment-planning` — capture user perspective
- `/brd recruitment-planning` — business case
- `/prd-epic recruitment-planning` — product scope
