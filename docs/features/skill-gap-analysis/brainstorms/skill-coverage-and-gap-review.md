---
type: brainstorm
feature: skill-gap-analysis
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# Phân tích độ phủ và khoảng trống kỹ năng có reviewer xác nhận — skill-gap-analysis

## 1. Idea Seed

So sánh năng lực đã được xác nhận của một nhân viên hoặc một nhóm với khung
kỳ vọng vị trí đã công bố: hệ thống tính độ phủ theo quy tắc có business
owner duyệt, hiển thị từng kỹ năng đạt/thiếu/vượt/chưa-đánh-giá kèm
evidence truy nguyên, reviewer (con người) xác nhận kết quả phân tích rồi
tạo action đào tạo hoặc điều phối có owner và hạn. Kết quả phân tích là
căn cứ để con người quyết định — không phải bảng xếp hạng, không phải
quyết định nhân sự tự động.

## 2. Context

Quản lý và HR hiện quyết định đào tạo/điều phối bằng cảm tính: không biết
team đang thiếu kỹ năng nào so với kỳ vọng, không có con số chung để ưu
tiên, và khi bị hỏi "vì sao chọn đào tạo này" thì không có evidence. Nguồn
hiện có đã có mô hình person match trả score + missing skills + gap
details và group coverage (`FR-TL-03`, `FR-TL-04` trong reverse spec
`talent-and-crm`) — bằng chứng hướng tính này khả thi, nhưng governance
còn thiếu: ai duyệt công thức match/weight/threshold (OQ-TL-02), ai xem
kết quả (OQ-8 PRD). Feature này nối ba mảnh đã có: `employee-profiles`
(hồ sơ năng lực — kỹ năng đã xác nhận), `talent-framework` (khung kỳ vọng
+ thang level đã công bố) và `employee-evaluation` (level đã xác nhận có
provenance). Đây là feature `Should` — slice mở rộng, không nằm trong cam
kết v1; rủi ro lõi là R-13: công thức/weight chưa owner duyệt nhưng bị
dùng để kết luận.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý | Không biết team thiếu kỹ năng gì so với kỳ vọng; quyết định đào tạo/điều phối cảm tính | Coverage rõ ràng theo khung đã duyệt, drill được evidence, tạo action có owner |
| HR | Chạy phân tích cho nhiều nhóm bằng tay; không có số liệu chuẩn để lập kế hoạch | Phân tích theo đơn vị/nhóm có trạng thái, lặp lại được, truy vết được |
| Business owner (Head of HR) | Công thức coverage/weight/threshold chưa ai chịu trách; con số bị tranh chấp | Công thức qua duyệt trước khi áp, mỗi phân tích ghi phiên bản công thức |
| Nhân viên | Không biết mình đang thiếu gì so với kỳ vọng vị trí | Xem gap của chính mình (phần được công bố) kèm hướng action |
| Admin | Kết quả phân tích là dữ liệu nhạy cảm, chưa rõ phạm vi xem | Phân quyền theo scope, audit truy cập |

## 4. Capabilities Breakdown

### P0 — must have

- Chọn đối tượng phân tích: một nhân viên, hoặc một nhóm (đơn vị/phòng ban
  trong scope); chọn chuẩn so sánh = khung vị trí "đã-công-bố" (mặc định
  khung của vị trí hiện tại; có thể chọn khung khác).
- Tính coverage theo từng kỹ năng trong khung: level yêu cầu so với level
  đã xác nhận mới nhất; trạng thái đạt / dưới-yêu-cầu / vượt / chưa-đánh-
  giá; chỉ tính level "đã xác nhận", không tính tự khai chưa xác nhận.
- Hiển thị breakdown: độ phủ % theo công thức đã duyệt, danh sách kỹ năng
  thiếu/dưới yêu cầu, cờ bắt buộc từ khung.
- Drill evidence: mỗi dòng gap trỏ nguồn level (kết quả đánh giá đã ghi
  nhận hoặc ghi nhận thủ công) và thời điểm xác nhận.
- Công thức coverage (cách tính %, trọng số kỹ năng bắt buộc, xử lý "chưa
  đánh giá") là đối tượng có vòng đời duyệt của business owner; mỗi lần
  phân tích ghi phiên bản công thức đã áp.
- Group coverage: tổng hợp theo nhóm — số người đạt/tổng số theo từng kỹ
  năng, kỹ năng thiếu phổ biến; KHÔNG hiển thị bảng xếp hạng cá nhân.
- Xác nhận của reviewer: lần phân tích có trạng thái "đã-tính → chờ-review
  → đã-xác-nhận"; action chỉ tạo từ lần phân tích đã xác nhận.
- Action từ gap: đào tạo, điều phối, đánh giá bổ sung — có mô tả, owner,
  hạn và trạng thái theo dõi.
- Phân quyền xem theo scope; nhân viên xem gap của chính mình (phần công
  bố); audit truy cập và quyết định.

### P1 — should have

- Lưu lần phân tích (run) để xem lại và so sánh hai lần của cùng đối tượng.
- Cảnh báo dữ liệu cũ: level đã xác nhận quá ngưỡng thời gian thì hiển thị
  nhãn "dữ liệu cũ" cạnh dòng gap.
- Xuất CSV kết quả trong scope, có audit lượt xuất.
- So gap "giả định": chọn khung của một vị trí khác (vd xét chuyển nội bộ).

### P2 — nice to have

- Đề xuất nội dung đào tạo từ kho tài liệu theo kỹ năng thiếu.
- AI tóm tắt gap nhóm thành đoạn nhận xét — vẫn qua reviewer xác nhận.
- Xu hướng coverage theo thời gian trên dashboard (giao `management-
  reporting`).

## 5. Core Flows (Happy Path)

### 5.1 Phân tích cá nhân đến action

1) Quản lý/HR mở "Phân tích kỹ năng" → chọn một nhân viên trong scope →
   chọn chuẩn (mặc định khung "đã-công-bố" của vị trí hiện tại, hoặc chọn
   khung khác).
2) Hệ thống kiểm tra: có khung đã công bố + công thức coverage đã công bố
   → tính từng kỹ năng: level yêu cầu vs level đã xác nhận mới nhất →
   trạng thái đạt/dưới/vượt/chưa-đánh-giá + % coverage + cờ bắt buộc.
3) Màn kết quả: danh sách kỹ năng thiếu trước; mở từng dòng xem evidence
   (nguồn level, thời điểm xác nhận, nhãn "dữ liệu cũ" nếu có).
4) Reviewer xem xong → "Xác nhận kết quả" → run chuyển "đã-xác-nhận".
5) Từ run đã xác nhận, chọn dòng gap → "Tạo action": loại (đào tạo/điều
   phối/đánh giá bổ sung), mô tả, owner, hạn → action "mở".

### 5.2 Phân tích nhóm đến action

1) HR/quản lý chọn một đơn vị/nhóm trong scope → chọn chuẩn khung.
2) Hệ thống tính cho từng thành viên có khung tương thích: thành viên
   thiếu khung hoặc chưa có level nào được liệt kê riêng (không bịa số).
3) Màn coverage nhóm: từng kỹ năng — số người đạt/tổng số, % độ phủ nhóm,
   kỹ năng thiếu phổ biến nhất; drill vào thành viên theo scope (không
   xếp hạng).
4) Reviewer xác nhận run → tạo action ở mức nhóm (vd "đào tạo SQL cho
   team") hoặc mức cá nhân.

### 5.3 Duyệt và công bố công thức coverage

1) HR soạn/sửa công thức coverage (cách tính %, trọng số kỹ năng bắt
   buộc, cách xử lý "chưa đánh giá") → gửi duyệt.
2) Business owner xem → "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú.
3) Công thức "đã-công-bố" là bản duy nhất được áp cho run mới; run cũ giữ
   phiên bản công thức đã áp (provenance).

```
Quản lý/HR                Hệ thống                      Business owner   Reviewer
──────────────────────────────────────────────────────────────────────────────────
Chọn người/nhóm + chuẩn
        │
        ▼
── Có khung + công thức đã công bố? ──┐
   │                                   │
  Có ▶ tính coverage từng kỹ năng:    Không ▶ chặn run, hướng dẫn:
   yêu cầu vs đã xác nhận              thiếu khung → công bố khung;
   │                                   thiếu công thức ─────────────▶ owner duyệt
   ▼                                                              công thức trước
Breakdown: % coverage + kỹ năng thiếu
+ cờ bắt buộc + drill evidence
        │
        ▼
Run "đã-tính" ──────────────────────────────────────────────▶ Reviewer xem:
                                                             breakdown + evidence
                                                             │
                                              ── Đồng ý kết quả? ──┐
                                                │                   │
                                              Có ▼                Không ▼
                                        "đã-xác-nhận"        ghi chú + giữ
                                                │            "đã-tính" để
                                                ▼            tính lại/bổ sung
                              Tạo action: đào tạo / điều phối /
                              đánh giá bổ sung + owner + hạn
                                                │
                                                ▼
                              Theo dõi action: mở → đang-làm → xong

Kết quả chỉ là căn cứ cho con người — KHÔNG ranking công khai,
KHÔNG tự động quyết định lương/thăng chức/kỷ luật.
```

### 5.4 Nhân viên xem gap của mình

1) Nhân viên mở "Kỹ năng của tôi so với vị trí" → xem phần được công bố:
   kỹ năng đạt/thiếu theo khung vị trí mình + action đang giao cho mình.
2) Không thấy dữ liệu người khác, không thấy điểm số nội bộ hay xếp hạng.

### 5.5 Theo dõi action đến hoàn tất

1) Owner action nhận thông báo → cập nhật trạng thái đang-làm → xong.
2) Người tạo/quản lý xem danh sách action theo run; action quá hạn được
   nhắc.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1/5.2 | Đối tượng có khung vị trí "đã-công-bố" làm chuẩn? | Tính coverage theo khung | Với cá nhân: chặn run + hướng dẫn; với nhóm: loại thành viên thiếu khung, liệt kê riêng |
| D2 | 5.1/5.2 | Kỹ năng có level "đã xác nhận"? | So sánh với yêu cầu → đạt/dưới/vượt | Đánh dấu "chưa-đánh-giá" — không suy thành 0 điểm |
| D3 | 5.1/5.2 | Công thức coverage đã "đã-công-bố"? | Áp quy tắc, ghi phiên bản | Chặn run mới, hướng dẫn gửi duyệt công thức |
| D4 | 5.1–5.4 | Người xem trong scope được xem kết quả? | Hiển thị phần được phép | Chặn + ghi audit truy cập bị từ chối |
| D5 | 5.1/5.2 | Run đã được reviewer "xác nhận"? | Cho tạo action từ run | Chặn tạo action, nhắc reviewer xác nhận trước |
| D6 | 5.1/5.2 | Level đã xác nhận cũ quá ngưỡng (đề xuất 180 ngày)? | Hiển thị nhãn "dữ liệu cũ" cạnh dòng gap | Hiển thị bình thường |
| D7 | 5.2 | Thành viên nhóm có khung và có level đã xác nhận? | Đưa vào mẫu tính coverage | Liệt kê riêng "chưa đủ dữ liệu", không tính vào mẫu |

### 6.2 Scenario Matrix

| Vai trò | Run cá nhân trong scope | Run nhóm trong scope | Xác nhận run | Tạo action | Xem gap người khác |
|---|---|---|---|---|---|
| Quản lý | ✓ tạo/xem cấp dưới | ✓ team mình | ✓ (reviewer) | ✓ | chỉ trong scope |
| HR | ✓ | ✓ | ✓ (khi được gán reviewer) | ✓ | trong scope |
| Nhân viên | — | — | — | — | chỉ của mình (phần công bố) |
| Business owner | xem | xem | — | — | — (duyệt công thức) |
| Admin | ✓ (vận hành) | ✓ | — | — | ✓ có audit |

### 6.3 State Transitions

```
lần phân tích (run):  đã-tính → đã-xác-nhận → (khoá snapshot)
công thức coverage:   bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng
action:               mở → đang-làm → xong
                       └── hủy (kèm lý do)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| run | — | đã-tính | hệ thống tính xong coverage | — |
| run | đã-tính | đã-xác-nhận | reviewer "Xác nhận kết quả" | không (tính lại = run mới) |
| run | đã-tính | đã-tính | reviewer trả ghi chú yêu cầu tính lại/bổ sung | có (lặp) |
| công thức | — | bản-nháp | HR soạn | — |
| công thức | bản-nháp | chờ-duyệt | gửi duyệt | có (rút lại) |
| công thức | chờ-duyệt | đã-công-bố | owner công bố | — |
| công thức | chờ-duyệt | chờ-duyệt | owner yêu cầu chỉnh → soạn lại → gửi lại | có (lặp) |
| công thức | đã-công-bố | ngừng-dùng | owner ngừng kèm lý do | có (phục hồi → chờ-duyệt) |
| action | — | mở | tạo từ run đã xác nhận | — |
| action | mở | đang-làm | owner bắt đầu xử lý | — |
| action | mở/đang-làm | xong | owner hoàn tất | không |
| action | mở/đang-làm | hủy | người tạo/quản lý hủy kèm lý do | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người tạo đóng giữa lúc cấu hình run | form nháp phần đã chọn | mở lại chọn tiếp | — |
| Khung vị trí có bản công bố mới sau khi run đã tính | run giữ khung đã áp | hiện cảnh báo "khung đã có bản mới — tạo run mới để cập nhật" | run cũ giữ provenance |
| Level mới được ghi nhận sau khi run đã tính | run giữ snapshot level lúc tính | cảnh báo "có level mới — tính lại" khi reviewer mở | run cũ giữ nguyên |
| Reviewer vắng khi run chờ xác nhận | run "đã-tính" treo | HR/phân công reviewer khác trong scope | cảnh báo hàng chờ |
| 2 người cùng tạo run trùng đối tượng + chuẩn | cả hai run được tạo | hiển thị "đã có run gần đây" để chọn dùng lại | admin gộp/xóa run nháp có audit |
| Tính nhóm lớn bị gián đoạn | job tính có trạng thái | xem trạng thái, chạy lại khi lỗi | job lỗi → trạng thái lỗi + log |

### 6.5 Other Edge Cases

- Nhân viên chưa có kỹ năng nào "đã xác nhận": run vẫn tạo, mọi dòng hiển
  thị "chưa-đánh-giá" và không hiển thị % coverage dạng 0% gây hiểu lầm —
  hiển thị "chưa đủ dữ liệu để đánh giá".
- Nhóm có thành viên giữ vị trí khác nhau: chuẩn áp theo khung từng người
  (mỗi người so với khung của mình); coverage nhóm tổng hợp theo kỹ năng
  chung trong các khung liên quan.
- Kỹ năng trong khung bị ngừng dùng sau khi khung công bố: dòng hiển thị
  nhãn "kỹ năng đã ngừng dùng", vẫn tính theo khung đã áp cho run cũ.
- Vị trí chưa có khung nhưng cần so: HR chọn một khung "đã-công-bố" khác
  làm chuẩn tham chiếu (ghi rõ chuẩn thay thế trong run).
- Run đã xác nhận bị phát hiện sai nguồn dữ liệu: không sửa run — tạo run
  mới, đánh dấu run cũ "đã thay thế" kèm liên kết.
- Empty state: "Chưa có lần phân tích nào — chọn người hoặc nhóm để bắt
  đầu".
- Action giao cho người nghỉ việc giữa chừng: action chuyển owner mới do
  người tạo phân công lại; audit ghi cả hai.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Đối tượng phân tích | bắt buộc: đúng 1 nhân viên HOẶC 1 đơn vị/nhóm trong scope của người tạo |
| Chuẩn so sánh | bắt buộc: 1 khung vị trí ở "đã-công-bố"; mặc định khung của vị trí hiện tại |
| Công thức coverage | bắt buộc ở "đã-công-bố" trước khi tạo run |
| Mô tả action | bắt buộc, ≤500 ký tự |
| Owner action | bắt buộc, là người trong scope quản lý của người tạo |
| Hạn action | tùy chọn; nếu có phải là ngày tương lai |
| Ghi chú reviewer khi trả run | bắt buộc khi không xác nhận, 10–500 ký tự |
| Lý do hủy action | bắt buộc, 10–500 ký tự |
| Lý do đánh dấu run "đã thay thế" | bắt buộc khi có run mới thay thế |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Thành viên trong một run nhóm | 300 (bám quy mô dự án; đề xuất — OQ-5) | mỗi run | chặn run, gợi ý chia nhóm nhỏ |
| Số run giữ lại mỗi đối tượng | không giới hạn (truy vết) | — | — |
| Ngưỡng "dữ liệu cũ" của level đã xác nhận | 180 ngày (đề xuất — OQ-5) | tại thời điểm tính | hiển thị nhãn, không chặn |
| Số action mở trên một run | 20 (đề xuất — OQ-5) | mỗi run | chặn tạo thêm, gợi ý gộp action |
| Dòng CSV xuất | 10.000 (đề xuất — OQ-5) | mỗi lượt | chặn, gợi ý lọc thêm |
| Hiển thị % coverage | 1 chữ số thập phân | — | — |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Đối tượng chưa có khung đã công bố | "{Tên} chưa có khung kỹ năng đã công bố cho vị trí — chọn khung khác làm chuẩn hoặc công bố khung trước" | E-? |
| Chưa có công thức đã duyệt | "Chưa có công thức tính độ phủ được phê duyệt — gửi duyệt công thức trước khi phân tích" | E-? |
| Tạo action khi run chưa xác nhận | "Kết quả phân tích cần được người xác nhận duyệt trước khi tạo hành động" | E-? |
| Xem kết quả ngoài scope | "Bạn không có quyền xem phân tích kỹ năng này" | E-? |
| Nhóm vượt quy mô | "Nhóm phân tích tối đa 300 thành viên — chia nhỏ nhóm" | E-? |
| Thiếu phần bắt buộc khi tạo action | "Vui lòng điền đủ: {danh sách field} — trước khi tạo hành động" | E-? |
| Run nhóm không ai đủ dữ liệu | "Không thành viên nào có đủ dữ liệu kỹ năng đã xác nhận — kiểm tra khung và kết quả đánh giá" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tính xong run | "Đã phân tích xong — {n} kỹ năng trong chuẩn, {m} kỹ năng đạt yêu cầu" |
| Xác nhận run | "Kết quả phân tích đã được xác nhận — có thể tạo hành động" |
| Tạo action | "Đã tạo hành động \"{loại}\" cho {owner} — hạn {ngày}" |
| Công bố công thức | "Công thức tính độ phủ đã được công bố và áp dụng cho lần phân tích mới" |
| Hoàn tất action | "Hành động đã được đánh dấu hoàn tất" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Kỹ năng chưa đánh giá | "Chưa đánh giá — chưa có level được xác nhận cho kỹ năng này" |
| Dữ liệu cũ | "Level được xác nhận từ {ngày} — dữ liệu cũ, cân nhắc đánh giá lại" |
| Khung có bản mới | "Khung vị trí đã có bản công bố mới — tạo phân tích mới để cập nhật" |
| Thành viên thiếu dữ liệu | "{n} thành viên chưa đủ dữ liệu để tính — xem danh sách" |
| Nhãn trên kết quả | "Phân tích độ phủ kỹ năng — căn cứ tham khảo, không phải quyết định nhân sự" |
| Run bị thay thế | "Phân tích này đã được thay thế bởi bản ngày {ngày} — xem bản mới" |
| Empty state | "Chưa có lần phân tích nào — chọn người hoặc nhóm để bắt đầu" |

## 8. Assumptions

- "Level đã xác nhận" là kỹ năng trên hồ sơ năng lực (`employee-profiles`)
  ở trạng thái "đã xác nhận" — ghi bởi `employee-evaluation` hoặc xác nhận
  thủ công có reviewer; kỹ năng tự khai chưa xác nhận KHÔNG được tính vào
  coverage.
- "Nhóm" trong phạm vi first release là đơn vị/phòng ban của
  `org-governance`; nhóm ad-hoc tự tạo là hướng mở rộng (đề xuất — OQ-1).
- Công thức coverage (cách tính %, trọng số bắt buộc, xử lý "chưa đánh
  giá") do business owner duyệt — đề xuất là Head of HR theo OQ-11/R-13.
- Đề xuất công thức v1: % coverage = số kỹ năng đạt hoặc vượt yêu cầu /
  tổng kỹ năng trong khung; "chưa-đánh-giá" tính vào mẫu số và hiển thị
  riêng; kỹ năng "bắt buộc" có trọng số riêng trong quy tắc — tất cả chờ
  owner chốt (OQ-4).
- Reviewer của run mặc định là quản lý trực tiếp của đối tượng (cá nhân)
  hoặc quản lý đơn vị (nhóm); HR phân công lại trong scope khi vắng.
- Nhân viên được xem gap của chính mình ở phần công bố (trạng thái kỹ
  năng + action giao cho mình), không xem điểm số người khác — đề xuất
  trả lời OQ-8 PRD phần hai, chờ Product owner.
- Action là đối tượng theo dõi nội bộ của feature này; khi cần task đầy
  đủ (kanban) sẽ liên kết `kanban-workspaces` — first release giữ action
  đơn giản có owner/hạn/trạng thái.
- Run là snapshot tại thời điểm tính; dữ liệu nguồn đổi không viết lại
  run cũ — tạo run mới và đánh dấu thay thế.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Công thức/weight chưa business owner duyệt nhưng được dùng để kết luận | thỉnh thoảng | gap sai hệ thống, tranh chấp, quyết định đào tạo/điều phối sai (R-13) | công thức là đối tượng có duyệt; chặn run khi chưa "đã-công-bố"; ghi phiên bản công thức vào run |
| Level tự khai chưa xác nhận lọt vào tính coverage | thường | độ phủ ảo, quản lý tin số sai | chỉ tính level "đã xác nhận"; "chưa-đánh-giá" hiển thị riêng, không suy thành 0 |
| Dữ liệu level cũ làm gap sai lệch | thường | đánh giá nhầm người, action sai mục tiêu | nhãn "dữ liệu cũ" theo ngưỡng; cảnh báo tính lại khi có level mới; reviewer bắt buộc xác nhận |
| Aggregate nhóm làm lộ cá nhân ngoài scope / tạo ranking lậu | thỉnh thoảng | vi phạm privacy, cãi nội bộ | deny-by-default theo scope; drill thành viên chỉ trong scope; không surface xếp hạng; audit xem |
| Kết quả phân tích bị dùng như quyết định lương/thăng chức/kỷ luật | thỉnh thoảng | quyết định nhân sự không qua con người — vi phạm invariant PRD | cấm trong scope; nhãn "căn cứ tham khảo, không phải quyết định nhân sự" |
| Action được tạo từ run chưa ai xem kỹ | thường | đào tạo/điều phối theo dữ liệu lỗi | action chỉ từ run "đã-xác-nhận" (D5); run trả về có ghi chú |
| Khung vị trí thiếu phổ biến làm coverage không tính được | thường | feature không dùng được cho nhóm lớn | liệt kê thiếu khung rõ ràng; phụ thuộc rollout `talent-framework` |

## 10. Success Criteria (preliminary)

- Tỷ lệ gap được reviewer xác nhận và dẫn tới action phù hợp — chỉ số theo
  PRD Mục 7.34; con số target chờ OQ-1/OQ-2 PRD.
- 100% run ghi phiên bản công thức "đã-công-bố" và khung đã áp.
- 100% action được tạo từ run "đã-xác-nhận".
- Tỷ lệ action hoàn tất trong hạn — đo sau rollout.
- 0 sự cố xem kết quả phân tích vượt scope được xác nhận (guardrail bám
  M-GR-01).

## 11. Open Questions

- [x] OQ-1: "Nhóm" trong phân tích nhóm là gì — đơn vị tổ chức hay nhóm
  tự tạo? — Resolved (đề xuất): first release dùng đơn vị/phòng ban của
  `org-governance`; nhóm ad-hoc là hướng mở rộng — chờ Product owner xác
  nhận.
- [x] OQ-2: Ai được xem kết quả phân tích — và nhân viên có xem gap của
  mình không? — Resolved (đề xuất): quản lý trong scope + HR trong scope
  xem đầy đủ; nhân viên xem gap của chính mình ở phần công bố (trạng thái
  kỹ năng + action được giao); không ranking — chờ Product owner xác
  nhận (PRD OQ-8).
- [x] OQ-3: Ai duyệt công thức coverage, weight và threshold? — Resolved
  (đề xuất): business owner là Head of HR (hoặc người Head of HR gán),
  duyệt qua vòng đời công thức — chờ Head of HR xác nhận (PRD OQ-11,
  R-13; OQ-TL-02 reverse spec).
- [x] OQ-4: Công thức coverage v1 cụ thể là gì? — Resolved (đề xuất): %
  coverage = kỹ năng đạt/vượt yêu cầu trên tổng kỹ năng khung; "chưa-
  đánh-giá" tính vào mẫu số nhưng hiển thị riêng; trọng số kỹ năng bắt
  buộc nằm trong quy tắc do owner công bố — chờ Head of HR xác nhận.
- [x] OQ-5: Ngưỡng đề xuất (300 thành viên/nhóm, dữ liệu cũ 180 ngày, 20
  action mở/run, 10.000 dòng CSV) có được duyệt? — Resolved (đề xuất):
  giữ ngưỡng đề xuất — chờ Head of HR xác nhận.
- [x] OQ-6: Run có bắt buộc reviewer xác nhận trước khi tạo action? —
  Resolved: có — action chỉ tạo từ run "đã-xác-nhận", bám luồng "tính
  coverage → review → tạo action" và chỉ số thành công của PRD Mục 7.34.
- [x] OQ-7: Có cho so gap theo khung của vị trí khác hiện tại không? —
  Resolved: có — chọn bất kỳ khung "đã-công-bố" làm chuẩn, mặc định khung
  vị trí hiện tại; run ghi rõ chuẩn đã áp (phục vụ kịch bản chuyển nội
  bộ, P1).
- [x] OQ-8: Retention của run và action? — Resolved (đề xuất): giữ để
  truy vết và so sánh; thời gian giữ chính thức theo OQ-6 PRD — chờ DPO.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd skill-gap-analysis` — capture user perspective
- `/brd skill-gap-analysis` — business case
- `/prd-epic skill-gap-analysis` — product scope
