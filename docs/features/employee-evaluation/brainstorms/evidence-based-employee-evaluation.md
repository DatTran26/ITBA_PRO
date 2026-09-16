---
type: brainstorm
feature: employee-evaluation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/talent-and-crm/reverse-spec.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# Đánh giá năng lực nhân viên có reviewer xác nhận — employee-evaluation

## 1. Idea Seed

Tổ chức các đợt đánh giá năng lực nội bộ: HR/quản lý chọn nhóm nhân viên
theo vị trí, giao bài đánh giá theo khung kỹ năng đã công bố, nhân viên làm
bài, kết quả được chấm và suy ra level đề xuất — rồi reviewer (con người)
xác nhận evidence, điều chỉnh level nếu cần kèm lý do, ghi điểm mạnh và
nhu cầu phát triển trước khi kết quả trở thành hồ sơ năng lực chính thức.
Điểm bài đánh giá là một nguồn evidence, không phải kết luận toàn diện về
con người.

## 2. Context

Đánh giá năng lực nhân viên hiện chạy cảm tính: quản lý nhận xét theo ấn
tượng, không có khung chung, không có evidence để đối chiếu khi tranh chấp,
và kết quả không tích lũy thành dữ liệu phát triển. Ngược lại, nếu chỉ lấy
điểm bài test làm kết luận thì đánh giá trở nên phiến diện — đúng rủi ro
PRD Mục 7.33 chỉ ra. Nguồn hiện có đã có mô hình skill evaluations gắn với
kết quả bài đánh giá (`SKILL_EVALUATIONS` trỏ `RESULTS`), cho thấy hướng
"kỹ năng được chấm từ bài làm" khả thi nhưng chưa có governance: ai xác
nhận level, evidence nào được tính, ai được xem kết quả (OQ-8 PRD). Feature
này nối ba mảnh đã có: `talent-framework` (chuẩn kỹ năng/level đã duyệt),
`candidate-assessment` (làm bài), `assessment-grading` (chấm + breakdown
theo kỹ năng), và là đầu vào cho `skill-gap-analysis` (so sánh level đã xác
nhận với kỳ vọng vị trí).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý (reviewer) | Đánh giá cấp dưới theo cảm tính, không có evidence chung, dễ bị tranh chấp | Kết quả bài + evidence để xác nhận level, ghi điểm mạnh/nhu cầu phát triển có căn cứ |
| Nhân viên | Không biết mình được đánh giá thế nào, trên căn cứ gì; sợ điểm test bị dùng như kết luận con người | Làm bài công bằng, xem kết quả đã xác nhận của mình và phần nhận xét phát triển |
| HR | Điều phối đợt đánh giá bằng email/file, không biết ai đã làm, ai chưa review | Đợt đánh giá có phạm vi, hạn, trạng thái rõ; theo dõi tiến độ đến khi ghi nhận |
| Business owner (Head of HR) | Level/điểm số không có ai chịu trách nhiệm khi bị tranh chấp | Quy tắc đề xuất level và vai trò reviewer có governance (liên quan OQ-11) |
| Admin | Kết quả đánh giá là dữ liệu nhạy cảm, chưa rõ ai được xem | Phân quyền xem theo scope + audit truy cập/quyết định |

## 4. Capabilities Breakdown

### P0 — must have

- Đợt đánh giá (campaign): tạo đợt theo kỳ hoặc theo nhu cầu, chọn phạm vi
  nhân viên theo nhóm/vị trí, đặt hạn làm bài và hạn xác nhận, gán reviewer
  (mặc định quản lý trực tiếp).
- Giao bài: chọn bài đánh giá phù hợp khung kỹ năng đã công bố của vị trí;
  mỗi nhân viên một assignment có hạn và trạng thái; làm bài qua engine
  `candidate-assessment` (không tái tạo).
- Kết quả chấm: nhận breakdown điểm theo kỹ năng từ `assessment-grading`
  kèm level đề xuất theo quy tắc chuyển đổi đã được duyệt.
- Hàng chờ xác nhận của reviewer: xem evidence (điểm theo kỹ năng, bài làm
  theo quyền, lịch sử), xác nhận hoặc điều chỉnh level từng kỹ năng —
  điều chỉnh bắt buộc lý do.
- Ghi nhận kết quả: reviewer ghi điểm mạnh + nhu cầu phát triển (bắt buộc)
  rồi "ghi nhận"; kết quả cập nhật hồ sơ năng lực nhân viên với provenance
  (đợt nào, ai xác nhận, khi nào).
- Ghi nhận thủ công: với kỹ năng không đo được bằng bài, reviewer ghi nhận
  level bằng evidence đính kèm + lý do.
- Nhân viên xem kết quả của mình: level đã xác nhận, điểm mạnh, nhu cầu
  phát triển và phần kết quả bài được công bố — không thấy đáp án.
- Phân quyền xem kết quả theo scope (chính nhân viên, quản lý trực tiếp,
  HR trong scope); không ranking công khai; không trigger tự động quyết
  định lương/thăng chức/kỷ luật.
- Audit đầy đủ: giao bài, điều chỉnh level, ghi nhận, xem kết quả.

### P1 — should have

- Self-assessment: nhân viên tự đánh mức trước đợt, reviewer đối chiếu khi
  xác nhận.
- Nhắc hạn/escalation khi nhân viên chưa làm bài hoặc reviewer chưa xác
  nhận quá SLA.
- Đính kèm evidence bổ sung (ghi chú quan sát, chứng chỉ) vào phần xác
  nhận của reviewer.
- Sửa kết quả đã ghi nhận qua bản chỉnh có audit (không ghi đè).
- So sánh kết quả giữa hai đợt đánh giá của cùng nhân viên.
- Đánh giá theo nhu cầu cho một người/nhóm nhỏ không cần đợt lớn.

### P2 — nice to have

- AI đề xuất draft điểm mạnh/nhu cầu phát triển từ kết quả + ghi chú —
  vẫn qua reviewer xác nhận (human-in-the-loop).
- Đề xuất nội dung đào tạo theo nhu cầu phát triển, liên kết action của
  `skill-gap-analysis`.
- Phản hồi đa chiều (peer feedback) làm evidence bổ sung.

## 5. Core Flows (Happy Path)

### 5.1 Tạo đợt đánh giá và giao bài

1) HR (hoặc quản lý cho nhu cầu) tạo đợt: đặt tên, chọn loại "theo kỳ" /
   "theo nhu cầu", chọn phạm vi nhân viên theo nhóm/vị trí, đặt hạn làm
   bài và hạn reviewer xác nhận.
2) Hệ thống đối chiếu từng nhân viên với khung kỳ vọng đã công bố của vị
   trí họ: ai có khung → gợi ý bài đánh giá phù hợp; ai chưa có khung →
   liệt kê riêng để HR chọn bài thủ công hoặc loại khỏi đợt.
3) HR xác nhận danh sách + bài + reviewer (mặc định quản lý trực tiếp của
   từng người) → phát hành đợt.
4) Hệ thống tạo assignment cho từng nhân viên và thông báo: có bài cần
   làm, hạn, ai review.

### 5.2 Nhân viên làm bài → chấm → level đề xuất

1) Nhân viên mở assignment → làm bài trên engine `candidate-assessment`
   (timer, autosave, submit idempotent như đã đặc tả ở feature đó).
2) Nộp xong → `assessment-grading` chấm và trả breakdown điểm theo kỹ
   năng kèm evidence bài làm.
3) Hệ thống áp quy tắc chuyển đổi đã duyệt → level đề xuất cho từng kỹ
   năng trong bài; assignment chuyển "Chờ xác nhận" vào hàng chờ của
   reviewer.

### 5.3 Reviewer xác nhận và ghi nhận kết quả

1) Reviewer mở hàng chờ → mở assignment: xem điểm theo kỹ năng, level đề
   xuất, evidence bài làm (theo quyền), self-assessment nếu có.
2) Từng kỹ năng: "Xác nhận" level đề xuất, hoặc điều chỉnh level + bắt
   buộc nhập lý do; kỹ năng không có bài đo được thì ghi nhận thủ công
   kèm evidence đính kèm.
3) Reviewer điền điểm mạnh và nhu cầu phát triển (bắt buộc) → "Ghi nhận".
4) Kết quả trở thành hồ sơ năng lực chính thức của nhân viên: level đã
   xác nhận + provenance (đợt, reviewer, thời điểm); nhân viên nhận thông
   báo xem kết quả.

```
HR / Quản lý              Hệ thống                     Nhân viên        Reviewer
─────────────────────────────────────────────────────────────────────────────────
A. ĐỢT ĐÁNH GIÁ
Tạo đợt: loại (kỳ/nhu cầu),
phạm vi theo nhóm/vị trí, hạn
        │
        ▼
── Nhân viên có khung vị trí đã công bố? ──┐
   │                                        │
  Có ▶ gợi ý bài theo khung               Không ▶ liệt kê riêng:
   │                                        chọn bài thủ công hoặc loại khỏi đợt
   ▼                                        │
Xác nhận danh sách + reviewer              │
(mặc định quản lý trực tiếp)               │
        │                                   │
        ▼                                   ▼
   ┌─────────────────────────┐
   │ Assignment từng nhân viên│── thông báo ──▶ nhận bài + hạn
   │ đã-giao + hạn làm bài    │
   └───────────┬─────────────┘
               ▼
B. LÀM BÀI → CHẤM → ĐỀ XUẤT                    Làm bài trên engine
                                               assessment: timer,
                                               autosave, submit
                                               │ nộp
               ┌───────────────────────────────┘
               ▼
   assessment-grading chấm → breakdown theo
   kỹ năng + evidence → quy tắc đã duyệt → LEVEL ĐỀ XUẤT
               │
               ▼
C. XÁC NHẬN                                  assignment "chờ-xác-nhận" ──▶ Reviewer mở:
                                                            điểm/skill + level đề xuất
                                                            + evidence + self-assessment
                                                            │
                                              ── Đồng ý level đề xuất? ──┐
                                                │                       │
                                              Có ▼                    Không ▼
                                          xác nhận level         điều chỉnh level
                                                                   + LÝ DO bắt buộc
                                                │                       │
                                                ▼                       ▼
                                       điểm mạnh + nhu cầu phát triển (bắt buộc)
                                                │
                                                ▼
                                          "GHI NHẬN" → hồ sơ năng lực chính thức
                                          + provenance ── thông báo ──▶ nhân viên
                                                                      xem kết quả mình

Điểm bài = evidence, KHÔNG phải kết luận — level cuối do reviewer xác nhận.
Không ranking công khai; không trigger tự động lương/thăng chức/kỷ luật.
```

### 5.4 Nhân viên xem kết quả của mình

1) Nhân viên mở "Kết quả đánh giá của tôi" → xem từng kỹ năng: level đã
   xác nhận, phần kết quả bài được công bố, điểm mạnh, nhu cầu phát
   triển, tên reviewer, thời điểm.
2) Không thấy đáp án câu hỏi; không thấy kết quả của người khác; không
   thấy bảng xếp hạng.

### 5.5 Sửa kết quả đã ghi nhận

1) Kết quả đã ghi nhận là snapshot; cần sửa → reviewer (hoặc HR) tạo bản
   chỉnh kèm lý do → audit ghi trước/sau → nhân viên thấy bản mới và
   thấy rằng có chỉnh sửa.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Nhân viên trong phạm vi có khung vị trí đã công bố? | Gợi ý bài phù hợp khung | Liệt kê riêng: chọn bài thủ công hoặc loại khỏi đợt |
| D2 | 5.1 | Reviewer được gán khác người được đánh giá? | Cho giao | Chặn: không cho reviewer tự đánh giá chính mình (đề xuất — OQ-2) |
| D3 | 5.2 | Bài đã chấm xong từ `assessment-grading`? | Suy ra level đề xuất, chuyển "chờ-xác-nhận" | Giữ "đang-chấm", không cho reviewer xác nhận |
| D4 | 5.3 | Reviewer đồng ý level đề xuất? | Xác nhận nhanh | Điều chỉnh level + bắt buộc lý do |
| D5 | 5.3 | Kỹ năng trong khung không có bài nào đo được? | Cho ghi nhận thủ công kèm evidence đính kèm + lý do | Không bắt buộc đánh giá kỹ năng đó nếu thiếu evidence — để "chưa đánh giá" |
| D6 | 5.3 | Đủ phần bắt buộc (mọi kỹ năng có level + điểm mạnh + nhu cầu)? | Cho "Ghi nhận" | Chặn, liệt kê phần còn thiếu |
| D7 | 5.1/5.4 | Người xem trong phạm vi được xem kết quả? | Hiển thị phần được phép | Chặn + ghi audit truy cập bị từ chối |
| D8 | 5.5 | Kết quả đã ghi nhận cần sửa? | Tạo bản chỉnh kèm lý do + audit; nhân viên thấy có chỉnh | Không cho ghi đè im lặng |

### 6.2 Scenario Matrix

| Vai trò | Đối tượng | Xem | Tạo đợt/giao bài | Làm bài | Xác nhận/ghi nhận | Sửa đã ghi nhận |
|---|---|---|---|---|---|---|
| HR | đợt + kết quả trong scope | ✓ | ✓ | — | ✓ (khi được gán reviewer) | ✓ có audit |
| Quản lý | đợt nhu cầu + kết quả cấp dưới trong scope | ✓ | ✓ (nhu cầu) | — | ✓ (mặc định reviewer) | đề xuất, HR duyệt |
| Quản lý | kết quả người ngoài scope | — | — | — | — | — |
| Nhân viên | bài của mình | — | — | ✓ | — | — |
| Nhân viên | kết quả đã ghi nhận của mình | ✓ (phần công bố) | — | — | — | — |
| Nhân viên | kết quả người khác | — | — | — | — | — |
| Admin | mọi đợt/kết quả | ✓ (vận hành) | — | — | — | ✓ có audit |

### 6.3 State Transitions

```
đợt đánh giá:  bản-nháp → đang-mở → hết-hạn → đóng/hoàn-tất
assignment:    đã-giao → đang-làm → đã-nộp → đang-chấm → chờ-xác-nhận
                    │        │         │                       │
                    └── quá-hạn (nhắc/gia hạn)                 ▼
                                                     đã-ghi-nhận → (chỉnh → bản-chỉnh)
kết quả kỹ năng:   đề-xuất → đã-xác-nhận / điều-chỉnh-có-lý-do / ghi-nhận-thủ-công
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| đợt | — | bản-nháp | HR/quản lý tạo | — |
| đợt | bản-nháp | đang-mở | phát hành đợt | có (hủy đợt chưa ai làm) |
| đợt | đang-mở | hết-hạn | quá hạn làm bài, còn assignment chưa xử lý | có (gia hạn) |
| đợt | đang-mở/hết-hạn | hoàn-tất | mọi assignment đã-ghi-nhận hoặc hủy | không |
| assignment | — | đã-giao | đợt phát hành | có (rút nếu chưa làm) |
| assignment | đã-giao | đang-làm | nhân viên mở bài | — |
| assignment | đang-làm/đã-giao | quá-hạn | hết hạn chưa nộp | có (gia hạn → đã-giao) |
| assignment | đã-nộp | đang-chấm | submit thành công | — |
| assignment | đang-chấm | chờ-xác-nhận | grading trả kết quả | — |
| assignment | chờ-xác-nhận | đã-ghi-nhận | reviewer "Ghi nhận" | chỉ qua bản chỉnh |
| kết quả kỹ năng | đề-xuất | đã-xác-nhận | reviewer xác nhận level | — |
| kết quả kỹ năng | đề-xuất | điều-chỉnh | reviewer đổi level + lý do | — |
| kết quả kỹ năng | — | ghi-nhận-thủ-công | reviewer nhập level + evidence | — |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Nhân viên mất mạng/đóng tab giữa bài | attempt trên engine assessment (autosave đã ack) | mở lại assignment tiếp tục từ bản server xác nhận | theo contract `candidate-assessment` |
| HR đóng giữa lúc tạo đợt | đợt "bản-nháp" phần đã điền | mở lại tiếp tục | nháp mồ côi giữ nguyên |
| Reviewer mở assignment nhưng kết quả chấm vừa cập nhật lại | reviewer đang xem bản cũ | cảnh báo "kết quả vừa thay đổi — tải lại" trước khi ghi nhận | — |
| Bài bị thu hồi/hết hạn token khi nhân viên chưa làm | assignment vẫn "đã-giao" | HR gia hạn/phát lại bài → assignment hoạt động lại | — |
| Reviewer nghỉ/vắng khi có assignment chờ-xác-nhận | assignment treo | HR/phân công lại reviewer mới trong scope | cảnh báo đợt thiếu reviewer |
| Đợt bị hủy khi đã có nhân viên làm bài | assignment đã nộp/đang làm | quyết định của HR: giữ xử lý phần đã nộp hoặc hủy hẳn có audit | assignment chưa mở bị hủy |

### 6.5 Other Edge Cases

- Nhân viên được giao bài nhưng nghỉ việc giữa đợt: assignment hủy kèm
  lý do; kết quả đã ghi nhận trước đó giữ nguyên trong hồ sơ.
- Nhân viên giữ 2 vị trí có 2 khung: đề xuất giao theo khung của vị trí
  chính (chờ duyệt — OQ-5).
- Reviewer bị đổi giữa đợt: assignment chờ-xác-nhận chuyển reviewer mới
  trong scope; audit ghi cả hai.
- Điểm bài bị override trong `assessment-grading` sau khi đã sang chờ-xác-
  nhận: cảnh báo reviewer trước khi ghi nhận (bám BR chống lệch điểm).
- Nhân viên làm bài nhưng chưa từng có self-assessment: phần đối chiếu
  hiển thị "chưa có", không chặn reviewer.
- Empty state đợt: "Chưa có đợt đánh giá nào — tạo đợt đầu tiên".
- Kết quả đã ghi nhận khi khung vị trí đổi bản mới: kết quả giữ nguyên
  theo khung tại thời điểm đánh giá (snapshot provenance).

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên đợt | bắt buộc, ≤120 ký tự |
| Loại đợt | bắt buộc; 1 trong: theo-kỳ, theo-nhu-cầu (đề xuất — OQ-1, liên quan OQ-8 PRD) |
| Phạm vi nhân viên | bắt buộc ≥1 nhân viên còn hiệu lực trong scope của người tạo |
| Hạn làm bài / hạn xác nhận | bắt buộc; hạn xác nhận sau hạn làm bài |
| Bài đánh giá giao | bắt buộc ≥1 bài đã phát hành; gợi ý theo khung vị trí đã công bố |
| Reviewer | bắt buộc mỗi assignment; mặc định quản lý trực tiếp; phải khác người được đánh giá (đề xuất — OQ-2) |
| Lý do điều chỉnh level | bắt buộc khi reviewer đổi level đề xuất; 10–500 ký tự |
| Evidence ghi nhận thủ công | bắt buộc đính kèm evidence hoặc ghi chú quan sát khi không có bài đo được |
| Điểm mạnh / nhu cầu phát triển | bắt buộc trước "Ghi nhận", mỗi mục ≤1.000 ký tự (đề xuất) |
| Lý do chỉnh kết quả đã ghi nhận | bắt buộc, 10–500 ký tự |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Nhân viên trong 1 đợt | 300 (bám quy mô dự án; đề xuất — OQ-6) | mỗi đợt | chặn thêm, gợi ý chia đợt |
| Số bài giao mỗi nhân viên/đợt | 5 (đề xuất — OQ-6) | mỗi assignment | chặn giao thêm |
| SLA reviewer xác nhận | 10 ngày làm việc (đề xuất — OQ-6) | sau hạn làm bài | nhắc reviewer + cảnh báo HR |
| Nhắc hạn làm bài | 2 lần (đề xuất — OQ-6) | trước hạn 3 ngày và 1 ngày | sau đó assignment "quá-hạn" |
| Số level điều chỉnh tối đa so với đề xuất | ±2 mức (đề xuất — OQ-6) | mỗi kỹ năng | vẫn cho điều chỉnh nhưng bắt buộc lý do chi tiết hơn |
| Lịch sử kết quả giữ lại | không giới hạn | — | retention theo OQ-6 PRD |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Reviewer là chính người được đánh giá | "Người xác nhận phải khác người được đánh giá — chọn reviewer khác" | E-? |
| Giao bài khi nhân viên chưa có khung | "{n} nhân viên chưa có khung vị trí đã công bố — chọn bài thủ công hoặc loại khỏi đợt" | E-? |
| Xác nhận khi bài chưa chấm xong | "Bài đánh giá chưa được chấm xong — chưa thể xác nhận kết quả" | E-? |
| Điều chỉnh không lý do | "Nhập lý do điều chỉnh level (tối thiểu 10 ký tự)" | E-? |
| Ghi nhận thiếu phần bắt buộc | "Còn thiếu: {danh sách phần thiếu} — hoàn tất trước khi ghi nhận" | E-? |
| Xem kết quả ngoài scope | "Bạn không có quyền xem kết quả đánh giá này" | E-? |
| Đợt vượt quy mô | "Đợt đánh giá tối đa 300 nhân viên — chia nhỏ phạm vi" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Phát hành đợt | "Đã giao bài đánh giá cho {n} nhân viên — hạn làm bài {ngày}" |
| Ghi nhận kết quả | "Đã ghi nhận kết quả đánh giá của {tên} — kết quả đã vào hồ sơ năng lực" |
| Gia hạn | "Đã gia hạn bài cho {tên} đến {ngày}" |
| Chỉnh kết quả | "Đã cập nhật kết quả — thay đổi được ghi lại trong lịch sử" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Assignment chờ nhân viên | "Bạn có bài đánh giá cần hoàn thành trước {ngày}" |
| Chờ reviewer | "Kết quả đang chờ {reviewer} xác nhận" |
| Reviewer điều chỉnh | "Level đề xuất {x} đã được điều chỉnh thành {y}: {lý do}" |
| Kết quả bị chỉnh | "Kết quả của bạn đã được cập nhật vào {ngày} — xem lịch sử thay đổi" |
| Empty state | "Chưa có đợt đánh giá nào — tạo đợt đầu tiên" |
| Nhãn trên kết quả | "Kết quả đánh giá năng lực — không phải đánh giá toàn diện về cá nhân" |

## 8. Assumptions

- Đợt đánh giá hỗ trợ cả "theo kỳ" (HR lên lịch định kỳ) lẫn "theo nhu cầu"
  (quản lý/HR tạo khi cần, vd trước đào tạo, sau thử việc) — đề xuất trả
  lời OQ-8 PRD phần một.
- Người xem kết quả gồm: chính nhân viên (phần được công bố), quản lý
  trực tiếp trong scope, HR trong scope; không công khai, không bảng xếp
  hạng — đề xuất trả lời OQ-8 PRD phần hai.
- Reviewer mặc định là quản lý trực tiếp của nhân viên; HR được phân công
  lại trong scope; reviewer phải khác người được đánh giá.
- Level đề xuất suy ra từ điểm bài theo quy tắc chuyển đổi do business
  owner duyệt (liên quan OQ-11 PRD); điểm chỉ là evidence, level cuối do
  reviewer xác nhận — tôn trọng invariant human-in-the-loop.
- Engine làm bài dùng lại `candidate-assessment` nguyên contract (timer
  server, autosave ack, submit idempotent, snapshot) — feature này không
  tái tạo.
- Breakdown điểm theo kỹ năng và evidence bài làm lấy từ
  `assessment-grading`; khung vị trí lấy từ `talent-framework` bản đã
  công bố.
- Hồ sơ năng lực nhân viên (person skill) nằm ở `employee-profiles`;
  feature này ghi kết quả đã xác nhận sang đó với provenance, không sở
  hữu hồ sơ gốc.
- Kết quả đánh giá là dữ liệu nhạy cảm: chỉ hiển thị phần được công bố
  cho nhân viên; trước khi privacy gate đạt chỉ dùng dữ liệu synthetic.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Điểm bài test bị dùng như kết luận toàn diện về con người | thường | quyết định sai về người, tranh chấp, mất niềm tin hệ thống (rủi ro chính PRD 7.33) | invariant: điểm = evidence; level cuối do reviewer xác nhận; wording nhãn "không phải đánh giá toàn diện"; điều chỉnh bắt buộc lý do |
| Kết quả bị lộ ra ngoài scope / ranking công khai | thỉnh thoảng | vi phạm privacy, cãi nội bộ, công bằng bị nghi ngờ | deny-by-default theo scope; không tính năng ranking; audit xem kết quả |
| Kết quả tự động trigger lương/thăng chức/kỷ luật | thỉnh thoảng | quyết định nhân sự không qua con người — vi phạm invariant PRD | cấm trong scope; kết quả chỉ là đầu vào cho quyết định của con người |
| Reviewer xác nhận cho có (không đọc evidence) | thường | level sai thành chuẩn, gap analysis tính trên dữ liệu rác | bắt buộc mở evidence trước ghi nhận; điều chỉnh ghi lý do; audit; SLA + cảnh báo |
| Quy tắc đề xuất level chưa owner duyệt nhưng đã áp | thỉnh thoảng | level đề xuất sai hệ thống, tranh chấp (R-13) | quy tắc chuyển đổi phải "đã duyệt" trước khi đợt mở; ghi phiên bản quy tắc trong provenance |
| Giao bài không khớp khung vị trí | thỉnh thoảng | đo sai kỹ năng, level không so sánh được | gợi ý theo khung đã công bố; chặn giao khi không có khung (trừ chọn thủ công có lý do) |
| Đợt treo vì reviewer vắng/nghỉ | thỉnh thoảng | đợt không bao giờ hoàn tất, nhân viên không có kết quả | phân công lại reviewer; SLA cảnh báo; escalation cho HR |

## 10. Success Criteria (preliminary)

- Tỷ lệ kỳ đánh giá hoàn tất với reviewer/evidence đầy đủ — chỉ số theo
  PRD Mục 7.33; con số target chờ OQ-1/OQ-2 PRD.
- 100% kết quả đã ghi nhận có: reviewer ≠ người được đánh giá, level từng
  kỹ năng, điểm mạnh, nhu cầu phát triển và provenance đợt.
- Tỷ lệ assignment được xác nhận trong SLA (đề xuất ≤10 ngày làm việc sau
  hạn làm bài).
- 0 sự cố xem kết quả vượt scope được xác nhận (guardrail bám M-GR-01).
- Tỷ lệ điều chỉnh level có lý do hợp lệ = 100%.

## 11. Open Questions

- [x] OQ-1: Đánh giá theo kỳ hay theo nhu cầu? — Resolved (đề xuất): hỗ
  trợ cả hai — đợt "theo kỳ" do HR tạo định kỳ, đánh giá "theo nhu cầu"
  do quản lý trực tiếp/HR tạo khi cần — chờ Product owner xác nhận (PRD
  OQ-8).
- [x] OQ-2: Ai được xem và dùng kết quả đánh giá? — Resolved (đề xuất):
  chính nhân viên (phần công bố: level đã xác nhận + điểm mạnh + nhu cầu
  phát triển + phần kết quả bài được author công bố), quản lý trực tiếp
  trong scope, HR trong scope; không công khai, không ranking — chờ
  Product owner xác nhận (PRD OQ-8).
- [x] OQ-3: Reviewer hợp lệ là ai — quản lý trực tiếp, HR, hay người thứ
  ba? — Resolved (đề xuất): mặc định quản lý trực tiếp; HR phân công lại
  khi vắng/đổi; reviewer phải khác người được đánh giá — chờ Head of HR
  xác nhận.
- [x] OQ-4: Quy tắc chuyển điểm thành level đề xuất do ai duyệt? —
  Resolved (đề xuất): business owner (Head of HR) duyệt quy tắc chuyển
  đổi trước khi áp, mỗi đợt ghi phiên bản quy tắc — chờ Head of HR xác
  nhận (liên quan PRD OQ-11, R-13).
- [x] OQ-5: Nhân viên giữ nhiều vị trí thì giao bài theo khung nào? —
  Resolved (đề xuất): theo khung của vị trí chính; trường hợp đặc biệt HR
  chọn khung khác khi tạo đợt — chờ Head of HR xác nhận.
- [x] OQ-6: Ngưỡng đề xuất (300 nhân viên/đợt, 5 bài/người, SLA 10 ngày,
  ±2 mức điều chỉnh) có được duyệt? — Resolved (đề xuất): giữ ngưỡng đề
  xuất — chờ Head of HR xác nhận.
- [x] OQ-7: Kỹ năng không đo được bằng bài trắc nghiệm/tự luận thì đánh
  giá thế nào? — Resolved: reviewer ghi nhận thủ công kèm evidence đính
  kèm + lý do; nếu thiếu evidence thì để "chưa đánh giá", không bịa mức.
- [x] OQ-8: Kết quả đánh giá có hiệu lực bao lâu? — Resolved (đề xuất):
  hiệu lực đến khi có kết quả mới của cùng kỹ năng thay thế; lịch sử đợt
  giữ nguyên để truy vết — chờ Head of HR xác nhận.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd employee-evaluation` — capture user perspective
- `/brd employee-evaluation` — business case
- `/prd-epic employee-evaluation` — product scope
