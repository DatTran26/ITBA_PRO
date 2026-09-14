---
type: brainstorm
feature: candidate-matching
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md, docs/_reverse/recruitment-and-interviews/gaps.md]
---

# Điểm đối chiếu ứng viên có evidence và override của con người — candidate-matching

## 1. Idea Seed

Một bộ đối chiếu giữa CV đã được HR xác nhận và yêu cầu của vị trí đang
mở: hệ thống tính điểm khớp, phân rã thành các thành phần (kỹ năng, kinh
nghiệm, domain), mỗi điểm đều kèm evidence trỏ về field CV và yêu cầu JD
để HR hiểu vì sao ra điểm đó; ngưỡng điểm chỉ đổi nhãn "đề xuất" chứ
không tự quyết định — HR xem score + evidence rồi chấp nhận hoặc
override kèm lý do bắt buộc, mọi quyết định ghi audit trước khi
application đi tiếp trong pipeline.

## 2. Context

Khi một vị trí nhận nhiều CV, HR phải đọc lần lượt từng hồ sơ để quyết
định ai được ưu tiên — chậm, thiếu nhất quán giữa người review và khó
giải thích lại vì sao một ứng viên được chọn hay loại. AI có thể giúp
đối chiếu nhanh, nhưng nguồn ITBAAI hiện có một xung đột trực tiếp với
invariant human-in-the-loop (PRD Mục 12): CV analysis trong nguồn tự
đưa application sang REJECTED khi điểm dưới threshold (reverse spec rule
1, OQ-RC-06). Feature này vá xung đột đó: score của AI chỉ là đề xuất có
evidence, con người giữ quyền quyết định cuối. Đây là feature `Must`
(PRD Mục 7.7) phụ thuộc `recruitment-planning` (vị trí/JD + yêu cầu) và
`cv-intake` (facts ứng viên đã xác nhận); roadmap ghi nhận phần chấm điểm
đã có trong code nên trọng tâm v1 là đưa evidence, threshold có kiểm
soát và override có lý do lên đúng vai trò. Kết quả review của feature
này là input cho `candidate-pipeline` điều phối bước tiếp.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Đọc từng CV để quyết ưu tiên, không nhất quán giữa người review | Score + breakdown + evidence để ưu tiên hồ sơ nhanh mà vẫn giữ quyền quyết |
| HR lead / Reviewer | Không giải thích được vì sao ứng viên được đề xuất hay loại | Mọi score có evidence truy ngược; mọi override có lý do + audit |
| Quản lý | Không biết tiêu chí sàng lọc của đội là gì | Threshold và tiêu chí rõ, thống nhất trên một vị trí |
| Ứng viên | Quyết định loại không rõ căn cứ, có thể do bias máy | (gián tiếp) quyết định của con người trên score giải thích được |
| Admin/DPO | Score AI có thể bias hoặc dùng sai mục đích | Score chỉ là đề xuất; audit override; model version truy vết được |

## 4. Capabilities Breakdown

### P0 — must have

- Tính match score cho một application: so CV đã xác nhận (facts +
  field đã review) với yêu cầu của vị trí đích (JD + kỹ năng/level kỳ
  vọng nếu đã gắn); tổng điểm thang 0–100 (đề xuất).
- Phân rã score theo thành phần: kỹ năng, kinh nghiệm, domain — mỗi
  thành phần có điểm riêng để HR thấy điểm mạnh/yếu.
- Evidence cho từng thành phần: trỏ tới field CV đã xác nhận và yêu cầu
  tương ứng của vị trí — score phải giải thích được, không "hộp đen".
- Threshold có kiểm soát: ngưỡng điểm cấu hình theo tổ chức/vị trí do
  vai trò được cấp đặt; threshold chỉ đổi nhãn đề xuất (đạt/chưa đạt),
  KHÔNG tự đổi trạng thái application hay tự loại.
- Review của con người: HR xem score + breakdown + evidence → chấp nhận
  đề xuất (đi tiếp / đề xuất dừng) hoặc override — override bắt buộc
  lý do; mọi quyết định ghi người + thời điểm + lý do.
- Đưa kết quả vào pipeline: sau khi HR quyết định, application được
  điều phối tiếp qua `candidate-pipeline` — matching không tự chuyển
  trạng thái.
- Chạy lại matching: khi CV được xác nhận lại hoặc JD/yêu cầu vị trí
  đổi, cho tính lại score; giữ lịch sử các lần chạy kèm phiên bản
  model/tiêu chí.
- Đánh dấu thiếu dữ liệu: CV thiếu field cần đối chiếu → score gắn cờ
  "không đủ dữ liệu để đánh giá" thay vì điểm thấp giả.
- Audit: ai chạy score, ai quyết định, override lý do gì, khi nào.

### P1 — should have

- Batch matching: chạy score cho nhiều application của một vị trí; bảng
  kết quả xếp theo điểm để HR ưu tiên review — không thao tác hàng loạt
  tự động.
- Màn so sánh trong cùng vị trí: xem nhiều ứng viên cùng breakdown để
  ra quyết định nhất quán.
- Cảnh báo khi JD/yêu cầu vị trí đổi sau khi đã có score → đánh dấu
  score "cũ" cần chạy lại.
- Ghi nhận tỷ lệ đề xuất được HR chấp nhận để đo chất lượng gợi ý (bám
  M-GR-02).

### P2 — nice to have

- Gợi ý vị trí khác đang mở phù hợp hơn cho ứng viên/pool.
- Báo cáo bias/fairness trên tập quyết định matching.
- Đề xuất điều chỉnh threshold từ lịch sử quyết định của HR (vẫn do con
  người chốt).

## 5. Core Flows (Happy Path)

### 5.1 Chấm điểm và review một application

1) HR mở application có CV "Đã xác nhận" gắn vị trí đang mở → bấm "Tính
   điểm đối chiếu" (hoặc hệ thống tự chạy khi CV vừa được xác nhận).
2) Hệ thống đọc facts ứng viên + yêu cầu vị trí → tính tổng điểm 0–100,
   phân rã kỹ năng/kinh nghiệm/domain, gắn evidence từng thành phần →
   so với threshold → nhãn đề xuất "Đạt đề xuất"/"Chưa đạt đề xuất".
3) HR mở màn matching: xem tổng điểm, breakdown, evidence từng thành
   phần (field CV ↔ yêu cầu JD).
4) HR quyết định: "Chấp nhận đề xuất" → application đi tiếp theo hướng
   đề xuất; hoặc "Override" → chọn kết quả khác + bắt buộc lý do.
5) Quyết định ghi audit; `candidate-pipeline` điều phối bước tiếp.

```
HR                    Hệ thống matching                 Pipeline
────────────────────────────────────────────────────────────────────
Mở application
(CV đã xác nhận)
   │
   ▼ "Tính điểm"
Đọc facts + yêu cầu vị trí
   │
   ▼
Tính score 0-100 + breakdown
(kỹ năng/kinh nghiệm/domain)
+ evidence từng phần
   │
   ▼
So threshold ──▶ nhãn đề xuất
                 (chỉ là gợi ý)
   │
   ▼
HR xem score + evidence
   │
   ▼
── Đồng ý với đề xuất? ──┐
   │                      │
 Có ▼                  Không ▼
"Chấp nhận"        "Override" + lý do
   │                bắt buộc
   └──────┬───────────────┘
          ▼
Ghi quyết định + audit ──────▶ application đi tiếp
                               (con người điều phối
                                qua candidate-pipeline)
```

### 5.2 Chấm điểm hàng loạt cho một vị trí

1) HR mở vị trí đang mở → "Tính điểm cho hồ sơ đã xác nhận" → hệ thống
   chạy score cho từng application đủ điều kiện (CV đã xác nhận, chưa có
   quyết định matching).
2) Bảng kết quả xếp theo điểm kèm nhãn đề xuất và cờ "không đủ dữ liệu";
   HR mở từng hồ sơ review như flow 5.1 — batch chỉ tính điểm, không
   quyết định.

### 5.3 Override có lý do

1) Khi đề xuất của hệ thống không khớp đánh giá của HR (ví dụ ứng viên
   điểm thấp nhưng có kinh nghiệm đặc thù), HR chọn "Override" → chọn
   kết quả mong muốn → nhập lý do bắt buộc → xác nhận.
2) Hệ thống ghi: đề xuất gốc, quyết định override, lý do, người, thời
   điểm — truy vết được để đo tỷ lệ đề xuất bị đảo (M-GR-02).

### 5.4 Chạy lại khi dữ liệu nguồn đổi

1) CV được xác nhận lại (sửa facts) hoặc JD/yêu cầu vị trí thay đổi →
   score hiện có bị đánh dấu "cũ".
2) HR bấm "Tính lại" → tạo lần chạy mới (giữ lần cũ trong lịch sử kèm
   model/tiêu chí version) → review như flow 5.1.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1/5.2 | CV của application đã "Đã xác nhận" và gắn vị trí? | Cho tính điểm | Chặn, báo cần CV đã xác nhận gắn vị trí |
| D2 | 5.1 | Đủ dữ liệu để đối chiếu (CV có field tối thiểu + vị trí có yêu cầu)? | Tính score bình thường | Gắn cờ "không đủ dữ liệu", score chỉ tham khảo |
| D3 | 5.1 | Tổng điểm ≥ threshold hiệu lực? | Nhãn đề xuất "Đạt đề xuất" | Nhãn "Chưa đạt đề xuất" — KHÔNG auto-reject |
| D4 | 5.1/5.3 | HR đồng ý với đề xuất? | Ghi quyết định "chấp nhận" | "Override" → bắt buộc lý do trước khi lưu |
| D5 | 5.4 | CV/JD thay đổi sau khi có score? | Đánh dấu score "cũ", đề xuất tính lại | Giữ score mới nhất làm tham chiếu |
| D6 | 5.2 | Application đã có quyết định matching? | Bỏ qua trong batch (không tính lại âm thầm) | Đưa vào batch tính điểm |
| D7 | tất cả | Người xem có quyền trên vị trí/application đó? | Hiển thị score + evidence | Từ chối + ghi audit |

### 6.2 Scenario Matrix

| Trạng thái dữ liệu | Kết quả hiển thị | Hành động cho phép |
|---|---|---|
| CV đã xác nhận + JD có yêu cầu + đủ field | Score đầy đủ + evidence từng thành phần | Review, chấp nhận, override |
| CV đã xác nhận nhưng thiếu field đối chiếu | Score kèm cờ "không đủ dữ liệu" | Review thận trọng, yêu cầu bổ sung CV, override có lý do |
| Vị trí chưa gắn yêu cầu/kỹ năng kỳ vọng | Chỉ so theo JD text; cảnh báo "yêu cầu vị trí chưa chuẩn" | Review được nhưng đề xuất gắn kỹ năng kỳ vọng |
| CV chưa xác nhận | Không cho tính điểm | Quay lại `cv-intake` xác nhận trước |
| Score đã có nhưng CV/JD đổi | Score "cũ" + nút tính lại | Tính lại rồi review |
| Đã có quyết định matching | Hiện quyết định + audit; không tự tính lại | HR chủ động tính lại nếu cần |

### 6.3 State Transitions

```
MATCHING_RUN (lần chấm điểm trên application):
  đã-tính → chờ-review → đã-quyết-định
     │          │
     │          └──(HR chưa quyết, giữ chờ-review)
     └──(dữ liệu nguồn đổi)──▶ đánh dấu "cũ" → lần chạy mới ở đã-tính

Nhãn đề xuất (không phải trạng thái quyết định):
  đạt-đề-xuất | chưa-đạt-đề-xuất | không-đủ-dữ-liệu
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| Matching run | — | đã-tính | score + breakdown + evidence được tạo | — |
| Matching run | đã-tính | chờ-review | đưa vào hàng chờ review của HR | — |
| Matching run | chờ-review | đã-quyết-định | HR chấp nhận hoặc override | không (quyết định mới = run mới) |
| Matching run | đã-tính/chờ-review | cũ (stale) | CV/JD nguồn thay đổi | có (tính lại tạo run mới) |
| Quyết định | — | chấp-nhận-đề-xuất | HR đồng ý đề xuất | không |
| Quyết định | — | override | HR chọn kết quả khác + lý do | không (ghi audit bất biến) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Job tính điểm lỗi giữa chừng (provider fail) | run ở trạng thái lỗi, không có score nửa vời | thử lại tạo run mới | run lỗi ghi trạng thái + lý do |
| HR mở review khi score vừa bị đánh dấu "cũ" | màn review cảnh báo dữ liệu nguồn đã đổi | cho tính lại trước khi quyết | không cho quyết định trên score cũ |
| Hai HR cùng quyết định một run | quyết định đầu tiên được ghi | người sau thấy đã có quyết định + ai đã quyết | không ghi đè quyết định |
| Batch matching bị ngắt giữa | phần đã tính giữ nguyên trạng thái riêng | chạy lại phần chưa tính | không score trùng cho cùng run |
| Threshold bị đổi sau khi có score | score cũ giữ nhãn theo threshold tại thời điểm tính | cảnh báo threshold mới, đề xuất tính lại | nhãn cũ không tự đổi |

### 6.5 Other Edge Cases

- Vị trí chưa có yêu cầu chuẩn (JD nghèo): score tính trên JD text, cờ
  "yêu cầu vị trí chưa chuẩn" để HR cân nhắc; đề xuất gắn kỹ năng kỳ
  vọng từ `talent-framework`.
- CV "không đủ dữ liệu": không ép điểm thấp — hiện cờ và gợi ý bổ sung
  CV hoặc quyết định thủ công.
- Ứng viên trong pool (không gắn vị trí): không tính score vì thiếu
  chuẩn đối chiếu; chỉ tính khi gắn vào vị trí cụ thể.
- Score bằng đúng threshold: tính là "Đạt đề xuất" (đề xuất, chốt OQ).
- Nhiều CV trên một hồ sơ: matching dùng CV mà application tham chiếu
  (mới nhất đã xác nhận — theo quy ước `cv-intake`).
- Người từng override nhiều: không giới hạn; mọi override đều có lý do +
  audit để phân tích bias ngược.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Điều kiện tính điểm | application có CV "Đã xác nhận" + gắn vị trí; vị trí có JD |
| Tổng điểm | số 0–100 (đề xuất); thành phần cùng thang |
| Threshold | số 0–100 (đề xuất); chỉ vai trò được cấp sửa; ghi người sửa + hiệu lực từ |
| Lý do override | bắt buộc không rỗng khi chọn kết quả khác đề xuất |
| Lý do sửa threshold | bắt buộc không rỗng; lưu lịch sử ngưỡng |
| Quyết định review | 1 trong: chấp nhận đề xuất / override đi tiếp / override dừng — mỗi application một quyết định hiệu lực trên run mới nhất |
| Chạy lại | chỉ khi có run mới hơn hoặc score bị đánh dấu cũ; run cũ giữ nguyên |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Thang tổng điểm | 0–100 | mỗi run | — (đề xuất) |
| Thành phần breakdown | 3 nhóm: kỹ năng, kinh nghiệm, domain | mỗi run | — (theo PRD 7.7) |
| Số application mỗi lần batch | 50 | mỗi lượt | chia đợt, báo tiến độ (đề xuất) |
| Threshold mặc định tổ chức | 60/100 | toàn tổ chức | chỉ đề xuất — chờ owner chốt (OQ) |
| Thời gian tính 1 score | 2 phút | mỗi run | timeout → run lỗi + thử lại (đề xuất) |
| Kết quả bảng batch | 50 hồ sơ/trang | — | phân trang |
| Lịch sử run giữ lại | không giới hạn (audit) | — | — |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| CV chưa xác nhận | "Chưa thể tính điểm — CV của ứng viên này chưa được xác nhận" | E-? |
| Application chưa gắn vị trí | "Ứng viên chưa gắn vị trí nào — chọn vị trí trước khi đối chiếu" | E-? |
| Vị trí thiếu JD | "Vị trí này chưa có JD/yêu cầu — bổ sung trước khi tính điểm" | E-? |
| Job tính điểm lỗi | "Không tính được điểm lúc này — thử lại sau" | E-? |
| Override thiếu lý do | "Nhập lý do trước khi xác nhận thay đổi so với đề xuất" | E-? |
| Sửa threshold thiếu lý do | "Nhập lý do thay đổi ngưỡng điểm" | E-? |
| Quyết định trên score cũ | "Dữ liệu đã thay đổi — tính lại điểm trước khi quyết định" | E-? |
| Đã có quyết định | "Hồ sơ này đã được {người} quyết định lúc {thời điểm}" | E-? |
| Không có quyền | "Bạn không có quyền xem đối chiếu của vị trí này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tính điểm xong | "Đã tính điểm đối chiếu — xem phân rã và bằng chứng" |
| Chấp nhận đề xuất | "Đã ghi nhận quyết định theo đề xuất" |
| Override xong | "Đã ghi nhận quyết định của bạn kèm lý do" |
| Batch xong | "Đã tính điểm cho {x}/{n} hồ sơ — {y} hồ sơ không đủ dữ liệu" |
| Sửa threshold | "Đã cập nhật ngưỡng đề xuất — áp dụng cho lần tính tiếp theo" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đề xuất đạt | "Đề xuất: hồ sơ đạt ngưỡng ({score}/{ngưỡng}) — quyết định là của bạn" |
| Đề xuất chưa đạt | "Đề xuất: hồ sơ dưới ngưỡng ({score}/{ngưỡng}) — đây chỉ là gợi ý, quyết định là của bạn" |
| Không đủ dữ liệu | "CV thiếu dữ liệu để đối chiếu {thành phần} — điểm chỉ mang tính tham khảo" |
| Score cũ | "Điểm này tính trước khi CV/JD thay đổi — nên tính lại" |
| Evidence | "Điểm {thành phần} dựa trên: {field CV} ↔ {yêu cầu vị trí}" |
| Empty state | "Chưa có hồ sơ nào đủ điều kiện tính điểm cho vị trí này" |

## 8. Assumptions

- Đầu vào là CV "Đã xác nhận" của `cv-intake` — matching không đọc field
  chưa xác nhận hay file thô (bám luồng PRD Mục 7: review dữ liệu →
  matching).
- Chuẩn đối chiếu = JD + yêu cầu của POSITION (`recruitment-planning`),
  ưu tiên kỹ năng/level kỳ vọng nếu vị trí đã gắn từ `talent-framework`;
  khi chưa gắn thì so trên JD text và gắn cờ "chưa chuẩn".
- Thang điểm 0–100 và 3 thành phần breakdown là đề xuất — PRD chỉ nêu
  "kỹ năng, kinh nghiệm và domain" chưa chốt thang/trọng số; trọng số
  thành phần do chủ sở hữu nghiệp vụ chốt (liên quan tinh thần OQ-11
  PRD — ai duyệt weight/threshold).
- Threshold có 2 tầng: mặc định tổ chức + tùy chỉnh theo vị trí; người
  sửa phải có quyền (đề xuất HR lead/admin), lưu lịch sử và lý do.
- Nhãn đề xuất chỉ có 2 trạng thái chính (đạt/chưa đạt) + cờ không đủ
  dữ liệu; KHÔNG có hành động tự động trên application — sửa xung đột
  auto-reject của reverse spec rule 1 (OQ-RC-06 → resolved: đề xuất).
- Một application có nhiều run theo thời gian; quyết định hiệu lực là
  quyết định trên run mới nhất; run cũ + quyết định cũ giữ làm lịch sử.
- "Đưa vào pipeline" sau quyết định nghĩa là application đủ điều kiện
  để HR chuyển bước trong `candidate-pipeline` — matching không tự gọi
  transition.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Score bias hoặc không giải thích được → quyết định sai | thỉnh thoảng | loại nhầm ứng viên tốt, khiếu nại công bằng (rủi ro chính PRD 7.7) | evidence bắt buộc từng thành phần; breakdown thay vì 1 điểm; đo M-GR-02 tỷ lệ đảo quyết định |
| HR bấm theo đề xuất không đọc evidence (automation bias) | thường | review hình thức, lỗi lặp theo model | hiển thị evidence trước nút quyết định; cờ "không đủ dữ liệu"; đo tỷ lệ chấp nhận mù (USC) |
| Score được dùng như quyết định cuối (auto-reject ngầm) | thỉnh thoảng | vi phạm invariant, rủi ro pháp lý/công bằng | cấm auto-action trong FR/BR; threshold chỉ đổi nhãn; audit mọi quyết định |
| Trọng số/threshold không có business authority | thỉnh thoảng | điểm bị tranh chấp, mất niềm tin vào công cụ (R-13 PRD tương tự) | chỉ vai trò được cấp sửa; lý do + lịch sử ngưỡng; chờ owner chốt (OQ) |
| Model thay đổi làm score trước/sau không so được | thỉnh thoảng | không giải thích được chênh điểm giữa các đợt | mọi run ghi model/tiêu chí version; score cũ đánh dấu "cũ" khi nguồn đổi |
| Thiếu dữ liệu CV → điểm thấp giả | thường | ứng viên bị đánh giá thấp oan | cờ "không đủ dữ liệu" thay cho điểm thấp; đề xuất bổ sung CV |

## 10. Success Criteria (preliminary)

- Tỷ lệ đề xuất AI được HR chấp nhận sau review — chỉ số chính theo PRD
  Mục 7.7; con số chờ OQ-2 sản phẩm.
- 100% quyết định trên score có người quyết định + thời điểm; 100%
  override có lý do.
- 100% score có evidence truy ngược về field CV và yêu cầu vị trí.
- 0 application tự đổi trạng thái chỉ vì score (guardrail auto-reject).
- Tỷ lệ score có cờ "không đủ dữ liệu" — giám sát chất lượng đầu vào
  `cv-intake`.

## 11. Open Questions

- [x] OQ-1: Ai được đặt và sửa threshold — Resolved (đề xuất): vai trò
  HR lead/admin theo cấu hình tổ chức; mặc định Head of HR phê duyệt
  ngưỡng tổ chức và từng vị trí — chờ Head of HR xác nhận (liên quan
  OQ-11 PRD về authority trên weight/threshold).
- [x] OQ-2: Thang điểm và trọng số thành phần — Resolved (đề xuất):
  tổng 0–100; 3 thành phần kỹ năng/kinh nghiệm/domain có trọng số mặc
  định bằng nhau, cấu hình được theo tổ chức — chờ Head of HR xác nhận.
- [x] OQ-3: Threshold mặc định ban đầu — Resolved (đề xuất): 60/100 cho
  tổ chức, điều chỉnh theo vị trí — chờ Head of HR xác nhận.
- [x] OQ-4: Score dưới ngưỡng có auto-reject không — Resolved: KHÔNG;
  score chỉ là đề xuất, mọi quyết định do con người (invariant PRD Mục
  12; trả lời OQ-RC-06 = recommendation).
- [x] OQ-5: Matching tự chạy khi CV xác nhận hay do HR bấm — Resolved
  (đề xuất): tự chạy tạo score ở "chờ-review" khi CV xác nhận và vị trí
  còn mở, HR vẫn có nút tính lại — chờ Product owner xác nhận.
- [x] OQ-6: Score bằng đúng threshold tính thế nào — Resolved: tính
  "Đạt đề xuất".
- [~] OQ-7: Gợi ý vị trí khác cho ứng viên/pool — Out of scope v1: cần
  matching đa vị trí; đưa roadmap mở rộng.
- [~] OQ-8: Báo cáo bias/fairness định kỳ — Out of scope v1: chỉ ghi
  nhận đủ dữ liệu (quyết định + override + lý do) để phân tích sau.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd candidate-matching` — capture user perspective
- `/brd candidate-matching` — business case
- `/prd-epic candidate-matching` — product scope
