---
type: brainstorm
feature: assessment-grading
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/assessment-and-grading/reverse-spec.md, docs/_reverse/assessment-and-grading/gaps.md]
---

# Chấm điểm có con người xác nhận và phân tích năng lực — assessment-grading

## 1. Idea Seed

Khi một submission được chốt từ `candidate-assessment`, hệ thống tự chấm các
câu khách quan theo đáp án của snapshot, đưa các câu tự luận vào hàng chờ chấm
tay kèm hướng dẫn chấm, recompute điểm tổng từ một nguồn duy nhất, tạo phân
tích năng lực và gợi ý follow-up bằng AI như một đề xuất có provenance — rồi
reviewer xác nhận hoặc override với lý do bắt buộc trước khi phần kết quả được
phép phát hành. AI không bao giờ tự quyết pass/fail.

## 2. Context

`candidate-assessment` sản sinh submission đã chốt (idempotent, có biên nhận);
nếu không có lớp chấm có kiểm soát thì dữ liệu làm bài không trở thành quyết
định — và với domain tuyển dụng, một con số tổng điểm trần không đủ để người
đánh giá ra quyết định có evidence. Reverse SRS cho thấy nền ITBAAI đã có:
tách câu manual/auto khi nhận submission, overlay rows chờ chấm, recompute từ
một owner duy nhất, score = auto-correct + manual-pass, follow-up session và
AI analysis (FR-AS-03 đến FR-AS-07) — đây là bằng chứng triển khai. Ba lỗ
hổng đang mở: rubric/quyền re-grade chưa có governance (GAP-AS-04), ranh giới
AI outcome chưa được test (GAP-AS-05), và threshold pass/fail + quyền override
chưa rõ (OQ-AS-04). PRD Mục 7.22 siết contract: reopen/regrade/override phải
được author công bố, có lý do và audit; PRD Mục 12 giữ invariant AI không tự
quyết định nhân sự. Đây là feature `Must` — điều kiện hoàn thành v1 "Tạo
quyết định có evidence: score/evaluation có reviewer; AI không tự pass/fail".

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Reviewer (HR/interviewer được giao chấm) | Chấm câu tự luận không nhất quán giữa người chấm, không có hướng dẫn chấm kèm câu, sợ sót bài | Hàng chờ chấm rõ, chấm theo hướng dẫn chấm, biết bài nào còn thiếu |
| HR | Phải đối chiếu tay điểm từng câu để hiểu ứng viên mạnh/yếu ở đâu; kết quả chưa review mà đã dùng | Breakdown theo kỹ năng + kết quả đã reviewer xác nhận mới đi vào quyết định |
| Author bài đánh giá | Không kiểm soát được ai được chấm/override/phát hành | Vai trò chấm/override/phát hành theo công bố, có audit |
| Ứng viên/nhân viên | Không biết bài được chấm tới đâu, thấy kết quả không nhất quán | Nhận đúng phần kết quả được phép, rõ trạng thái |
| Quản lý/Head of HR | Không biết chất lượng chấm và tín hiệu nào cần follow-up | Insight đã review + follow-up có owner |

## 4. Capabilities Breakdown

### P0 — must have

- Tiếp nhận submission đã chốt: tạo bản ghi kết quả, tách câu khách quan và
  câu cần chấm tay, đặt trạng thái chấm ban đầu.
- Chấm tự động câu khách quan (trắc nghiệm/đúng-sai) theo đáp án của snapshot
  đề — ghi điểm từng câu.
- Hàng chờ chấm thủ công: mỗi câu tự luận là một mục chờ chấm kèm nội dung trả
  lời và hướng dẫn chấm của câu; biết còn thiếu bao nhiêu câu.
- Chấm tay có trách nhiệm: grader cho điểm trong thang câu, ghi nhận xét; mọi
  lượt chấm có người chấm và thời điểm.
- Recompute một nguồn: điểm tổng và trạng thái chỉ được tính lại qua một
  đường recompute duy nhất sau mỗi thay đổi chấm — không vá tay ở nhiều nơi.
- Score breakdown: điểm theo từng câu, nhóm theo kỹ năng của câu trong
  snapshot, và tổng; phân biệt phần auto và phần manual.
- AI insight là đề xuất: phân tích điểm mạnh/điểm cần kiểm tra/gợi ý
  follow-up, gắn provenance (model/version, thời điểm); hiển thị như đề xuất,
  không tự ghi điểm hay quyết định.
- Reviewer xác nhận/override: xác nhận kết quả hoặc override điểm/nhận định
  với lý do bắt buộc; mọi override ghi ai, khi nào, giá trị trước/sau và giữ
  trong audit.
- Phát hành kết quả theo công bố: chỉ phát hành phần author đã công bố cho
  người làm bài/bên trong; ghi nhận người phát hành.
- Ghi chú reviewer: note kèm kết quả, hiển thị đúng nhóm quyền.
- Trạng thái rõ ràng: submission luôn biết mình đang ở chờ-chấm / đã-chấm /
  đã-review / đã-phát-hành; kết quả chỉ "đủ" khi mọi câu manual đã chấm.
- Quyền và data-scope: chỉ vai trò được cấp trong phạm vi mới xem/chấm/
  phát hành; deny-by-default.

### P1 — should have

- Regrade có kiểm soát: chấm lại một câu/cả bài tạo phiên bản chấm mới, giữ
  lịch sử, recompute, bắt buộc lý do và audit; chỉ vai trò được author công
  bố (contract PRD Mục 7.22).
- Export PDF/CSV khi được phép: chỉ vai trò được cấp trong data-scope; lượt
  export có audit.
- Follow-up từ kết quả: tạo follow-up (vòng đánh giá/phỏng vấn bổ sung, yêu
  cầu làm lại) gắn nguồn submission, có owner và trạng thái theo dõi.
- Giao việc chấm: phân công grader cho hàng chờ; nhắc khi hàng chờ treo quá
  ngưỡng.
- Đánh dấu kết quả đã phát hành bị thay đổi sau regrade/override để quyết
  định phát hành lại.

### P2 — nice to have

- Độ khó thực nghiệm của câu hỏi suy từ thống kê chấm, trả tín hiệu về
  `question-bank`.
- So sánh kết quả theo cohort/vị trí (phục vụ `management-reporting` sau).
- AI gợi ý điểm cho câu tự luận — vẫn chỉ là đề xuất grader phải xác nhận.

## 5. Core Flows (Happy Path)

### 5.1 Submission → chấm → reviewer xác nhận → phát hành

1) Submission từ `candidate-assessment` được ghi nhận → hệ thống tạo bản ghi
   kết quả, tách câu khách quan (chấm ngay theo đáp án snapshot) và câu tự
   luận (tạo mục chờ chấm).
2) Grader mở hàng chờ → chấm từng câu tự luận theo hướng dẫn chấm → điểm +
   nhận xét → lưu.
3) Khi mọi câu manual đã chấm → recompute điểm tổng + breakdown → kết quả
   chuyển "đã-chấm".
4) Hệ thống tạo AI insight (đề xuất, có provenance) → reviewer mở trang kết
   quả: xem breakdown, insight, note → "Xác nhận kết quả" (hoặc override có
   lý do trước khi xác nhận).
5) Kết quả "đã-review" → HR/vai trò được phép phát hành phần author công bố
   cho người làm bài → ghi nhận người và thời điểm phát hành.

```
submission đã chốt
        │
        ▼
┌─────────────────────┐     ┌──────────────────────┐
│ auto-grade câu       │     │ câu tự luận → hàng   │
│ khách quan (snapshot)│     │ chờ chấm của grader  │
└─────────┬───────────┘     └──────────┬───────────┘
          │                            │ grader chấm từng câu
          │                            ▼ (điểm + nhận xét + ai/khi nào)
          │                     đủ câu manual?
          │                            │
          └────────────┬───────────────┘
                       ▼
              recompute (một nguồn)
              → tổng + breakdown kỹ năng
                       ▼
              "đã-chấm" → AI insight
              (đề xuất + provenance)
                       ▼
              reviewer xem → ── override? ──┐
                       │          │         │
                       │        không      có: bắt buộc lý do
                       │          │         + audit + trước/sau
                       ▼          ▼         ▼
              "Xác nhận kết quả" → "đã-review"
                       ▼
              phát hành phần author công bố
              → "đã-phát-hành" (ghi người phát hành)
```

### 5.2 Chấm một câu tự luận trong hàng chờ

1) Grader mở hàng chờ của bài/submission → chọn câu chờ chấm.
2) Hệ thống hiển thị đề (snapshot), câu trả lời và hướng dẫn chấm của câu.
3) Grader nhập điểm trong thang câu + nhận xét → lưu → mục chuyển "đã-chấm";
   nếu là câu cuối còn thiếu của submission thì recompute ngay.

### 5.3 Xử lý AI insight và override

1) AI insight sinh ra ở trạng thái "đề-xuất" kèm model/version.
2) Reviewer đọc insight đối chiếu breakdown → giữ nguyên hoặc override phần
   nhận định/điểm (bắt buộc lý do).
3) Hệ thống ghi quyết định của reviewer: insight chỉ trở thành nội dung dùng
   được khi reviewer đã xác nhận kết quả.

### 5.4 Regrade sau khi đã chấm (kể cả đã phát hành)

1) Vai trò được công bố chọn "Chấm lại" trên câu/bài → nhập lý do bắt buộc.
2) Hệ thống tạo phiên bản chấm mới (giữ phiên bản cũ), mở lại mục chấm cho
   grader → chấm → recompute.
3) Nếu kết quả đã phát hành và điểm thay đổi → đánh dấu "kết quả đã phát
   hành đã thay đổi" để vai trò có quyền quyết định phát hành lại; mọi bước
   có audit.

### 5.5 Export và follow-up

1) HR trong scope chọn kết quả "đã-review" → "Xuất" → PDF/CSV theo quyền →
   lượt xuất ghi audit.
2) Từ kết quả, reviewer/HR tạo follow-up (vòng đánh giá bổ sung, yêu cầu làm
   lại, chuyển bước pipeline) → gắn submission, có owner → theo dõi trạng
   thái.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Submission có câu tự luận? | Tạo mục chờ chấm, trạng thái "chờ-chấm-tay" | Auto-grade toàn bộ → thẳng "đã-chấm" |
| D2 | 5.2 | Mọi câu manual của submission đã chấm? | Recompute → "đã-chấm" | Giữ "chờ-chấm-tay"/"đang-chấm" |
| D3 | 5.1/5.3 | Người xem/chấm thuộc vai trò và data-scope được cấp? | Cho thao tác + audit | Từ chối + thông báo không có quyền |
| D4 | 5.3 | Reviewer muốn override điểm/nhận định? | Bắt buộc lý do → ghi trước/sau + audit → recompute | Xác nhận nguyên bản |
| D5 | 5.4 | Regrade sau khi kết quả đã phát hành? | Cho phép (vai trò được công bố + lý do) → đánh dấu "đã phát hành đã thay đổi" | Không cho phép nếu vai trò không được công bố |
| D6 | 5.1 | AI insight sinh thành công? | Hiển thị đề xuất + provenance | Đánh dấu "insight lỗi" — không chặn kết quả |
| D7 | 5.5 | Vai trò có quyền export theo policy? | Cho xuất PDF/CSV + audit | Ẩn/chặn nút xuất |
| D8 | 5.1 | Author công bố phần nào của kết quả cho người làm bài? | Phát hành đúng phần được phép | Mặc định chỉ trạng thái đã chấm xong |
| D9 | 5.2 | Hai grader mở cùng một mục chấm? | Người lưu sau thấy cảnh báo bản vừa đổi, tải lại | (ghi đè bị chặn) |

### 6.2 Scenario Matrix

| Vai trò | Xem submission/breakdown | Chấm câu manual | Xem AI insight | Xác nhận kết quả | Override | Phát hành | Export |
|---|---|---|---|---|---|---|---|
| Grader được giao | ✓ trong scope | ✓ | ✓ | — | — | — | — |
| Reviewer (được công bố) | ✓ trong scope | ✓ | ✓ | ✓ | ✓ có lý do | theo công bố | theo quyền |
| HR trong scope | ✓ | theo giao | ✓ (đã review) | theo công bố | theo công bố | ✓ | ✓ có audit |
| Author bài | cấu hình công bố | — | — | — | — | công bố | — |
| HR/quản lý ngoài scope | — | — | — | — | — | — | — |
| Ứng viên/nhân viên | chỉ phần đã phát hành | — | — | — | — | — | — |
| Admin | điều tra có audit | — | — | — | — | — | — |

### 6.3 State Transitions

```
grading result:  nhận-submission → chờ-chấm-tay → đang-chấm → đã-chấm
                      │                                    │
                      └────(không có câu manual)──────────▶│
                                                           ▼
                              đã-phát-hành ◀── đã-review ◀──┘
                                   │            ▲
                                   └──đánh dấu──┘ (regrade/override
                                     "đã thay đổi" sau phát hành)

grade item (câu manual):  chờ-chấm → đã-chấm
                              ▲        │
                              └──regrade (phiên bản mới + lý do)

ai insight:  đề-xuất → (reviewer xác nhận kết quả) → được-dùng
             đề-xuất → lỗi-sinh (không chặn kết quả)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| grading result | — | chờ-chấm-tay | submission có câu manual | — |
| grading result | — | đã-chấm | submission toàn câu khách quan | — |
| grading result | chờ-chấm-tay | đang-chấm | grader lưu câu đầu tiên | — |
| grading result | đang-chấm | đã-chấm | câu manual cuối được chấm + recompute | — |
| grading result | đã-chấm | đã-review | reviewer xác nhận (có/không override) | có (regrade) |
| grading result | đã-review | đã-phát-hành | vai trò được phép phát hành | có (đánh dấu thay đổi, phát hành lại) |
| grade item | chờ-chấm | đã-chấm | grader lưu điểm + nhận xét | có (regrade → phiên bản mới) |
| ai insight | — | đề-xuất | job phân tích xong | — |
| ai insight | đề-xuất | được-dùng | reviewer xác nhận kết quả | không (override tạo bản mới) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| AI provider lỗi khi sinh insight | kết quả "đã-chấm", insight "lỗi-sinh" | retry tạo insight thủ công/tự động có giới hạn | báo admin nếu hết retry; kết quả không bị chặn |
| Grader đóng tab giữa chấm | mục chấm giữ "chờ-chấm" (điểm chưa lưu mất) | mở lại mục chấm, nhập lại | — |
| Hai grader lưu cùng mục | bản lưu trước đã ghi | người lưu sau thấy cảnh báo "vừa được cập nhật" | không ghi đè âm thầm |
| Regrade khi reviewer đang xem kết quả | reviewer đang xem bản cũ | cảnh báo "kết quả vừa đổi — tải lại" trước khi xác nhận | — |
| Submission đến khi bài đã đóng phát hành | submission vẫn hợp lệ (attempt hoàn tất theo snapshot) | chấm bình thường theo snapshot | — |
| Export job gián đoạn | file xuất dở | tạo lại lượt xuất, audit cả hai lần | file dở tự dọn |

### 6.5 Other Edge Cases

- Submission có câu trả lời trống (người làm bài bỏ qua): câu khách quan
  chấm 0/hoặc theo rule bài; câu tự luận trống vẫn vào hàng chờ để grader
  quyết định — không tự bỏ qua.
- Câu tự luận thiếu hướng dẫn chấm trong snapshot: hiển thị cảnh báo "câu
  không có hướng dẫn chấm" để grader biết chấm theo judgment — ghi nhận tình
  trạng này.
- Override kéo điểm dưới 0 hoặc quá thang câu: chặn ngay tại input.
- Insight chứa nội dung nhạy cảm/kết luận vượt quyền (vd gợi ý "loại"): vẫn
  chỉ là đề xuất; reviewer quyết — invariant Mục 12.
- Submission bị thu hồi/hủy sau khi đã vào chấm: đánh dấu "không cần chấm",
  giữ vết, loại khỏi hàng chờ.
- Empty state: hàng chờ trống → "Không có bài nào đang chờ chấm".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Điểm câu manual | bắt buộc; số trong khoảng 0 đến điểm tối đa của câu theo snapshot |
| Nhận xét khi chấm | tùy chọn theo cấu hình bài (đề xuất: khuyến khích, không bắt buộc) |
| Lý do override | bắt buộc, tối thiểu 10 ký tự (đề xuất — xem OQ-4) |
| Lý do regrade | bắt buộc, tối thiểu 10 ký tự (đề xuất — xem OQ-4) |
| Xác nhận kết quả | chỉ khi mọi câu manual đã "đã-chấm" và recompute đã chạy |
| Phát hành kết quả | chỉ trên kết quả "đã-review"; chỉ phần author công bố |
| Export | chỉ vai trò được cấp trong data-scope; loại dữ liệu theo policy |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| SLA hàng chờ chấm | 3 ngày làm việc/submission (đề xuất — xem OQ-5) | từ lúc nhận submission | nhắc grader/owner; báo cáo treo |
| Retry sinh AI insight | 3 lần tự động (đề xuất) | mỗi submission | sau đó "lỗi-sinh" + báo admin |
| Độ dài lý do override/regrade | 10–500 ký tự (đề xuất) | mỗi thao tác | chặn lưu, báo nhập lý do đủ rõ |
| Độ dài nhận xét chấm | 2.000 ký tự (đề xuất) | mỗi câu | chặn nhập thêm |
| Độ dài note reviewer | 2.000 ký tự (đề xuất) | mỗi note | chặn nhập thêm |
| Số phiên bản chấm giữ lại | toàn bộ (audit) | mỗi câu | không áp dụng — bắt buộc giữ |
| Kích thước file export | CSV tối đa 50.000 dòng/lần (đề xuất — xem OQ-6) | mỗi lượt | yêu cầu lọc nhỏ hơn |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Chấm quá thang điểm câu | "Điểm phải nằm trong khoảng 0 đến {điểm tối đa của câu}" | E-? |
| Override thiếu lý do | "Vui lòng nhập lý do điều chỉnh (tối thiểu 10 ký tự) trước khi lưu" | E-? |
| Xác nhận khi còn câu chưa chấm | "Còn {n} câu chưa chấm — hoàn tất chấm trước khi xác nhận kết quả" | E-? |
| Không có quyền | "Bạn không có quyền thực hiện thao tác này trên kết quả này" | E-? |
| Insight lỗi | "Chưa tạo được phân tích AI — kết quả chấm vẫn đầy đủ, bạn có thể thử tạo lại" | E-? |
| Bản kết quả vừa đổi | "Kết quả vừa được cập nhật bởi {người} — tải lại để xem bản mới nhất" | E-? |
| Export quá lớn | "Kết quả xuất vượt quá giới hạn — lọc nhỏ hơn rồi xuất lại" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu điểm câu | "Đã lưu điểm câu {n}" |
| Hoàn tất chấm | "Đã chấm xong — kết quả đã được tính lại" |
| Xác nhận kết quả | "Kết quả đã được xác nhận và sẵn sàng phát hành" |
| Override thành công | "Đã ghi nhận điều chỉnh kèm lý do — thao tác đã được ghi lại" |
| Phát hành | "Đã phát hành kết quả theo chính sách của bài" |
| Xuất xong | "Đã xuất {định dạng} — lượt xuất đã được ghi lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Hàng chờ trống | "Không có bài nào đang chờ chấm" |
| Đang chấm | "Đang chấm — còn {n}/{m} câu tự luận" |
| Insight đề xuất | "Phân tích dưới đây là đề xuất của AI — cần bạn kiểm tra và xác nhận" |
| Insight lỗi | "Phân tích AI chưa sẵn sàng — kết quả chấm không bị ảnh hưởng" |
| Đã phát hành đã thay đổi | "Kết quả đã phát hành vừa thay đổi sau khi chấm lại — xem xét phát hành lại" |
| Câu thiếu hướng dẫn chấm | "Câu này chưa có hướng dẫn chấm — chấm theo đánh giá chuyên môn" |
| Chờ AI | "Đang tạo phân tích — thường mất vài phút" |

## 8. Assumptions

- Submission đến từ `candidate-assessment` là bất biến và gắn snapshot đề có
  đáp án/hướng dẫn chấm phía server (surface người làm bài không chứa đáp án,
  nhưng đường chấm có quyền truy cập được).
- Rubric v1 = "hướng dẫn chấm" của câu trong `question-bank`/snapshot; chưa có
  ngân hàng rubric được phê duyệt riêng (đề xuất — xem OQ-1).
- Grader và reviewer là vai trò nghiệp vụ gán qua `org-governance`; author
  công bố vai trò được chấm/override/phát hành theo từng bài.
- AI insight chạy qua provider do admin cấu hình (`platform-configuration`),
  credential chỉ phía server; insight lỗi không chặn nghiệp vụ chấm.
- "Phát hành kết quả" v1 nghĩa là mở phần kết quả đã công bố cho đúng đối
  tượng trong/ngoài hệ thống; kênh thông báo đi kèm thuộc
  `contextual-notifications`.
- Không có auto pass/fail trong v1: hệ thống trình bày điểm/breakdown/
  insight; ngưỡng đạt (nếu có) do author công bố và quyết định là của con
  người (đề xuất — xem OQ-2).
- Các giá trị Mục 7.2 (SLA 3 ngày, lý do 10–500 ký tự, nhận xét 2.000 ký tự,
  retry 3 lần, export 50.000 dòng) là đề xuất chờ owner chốt.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Aggregate lệch manual override (rủi ro chính PRD) | thỉnh thoảng | điểm hiển thị sai → quyết định sai, tranh chấp | recompute một nguồn duy nhất + test "aggregate = tổng grade item" mỗi release |
| AI insight bị dùng như quyết định | thỉnh thoảng | AI thực chất quyết pass/fail — vi phạm invariant | insight là đề xuất không ghi điểm; reviewer xác nhận bắt buộc; M-GR-02 guardrail |
| Grader chấm không nhất quán | thường | kết quả không công bằng giữa ứng viên | hướng dẫn chấm kèm câu; báo cáo phân tán điểm cho owner (P1) |
| Hàng chờ chấm treo | thỉnh thoảng | quyết định tuyển chậm, ứng viên chờ | SLA + nhắc + báo cáo treo (P1); đo thời gian submission → review |
| Override/regrade không lý do hoặc sai quyền | hiếm | tranh chấp tính công bằng, mất niềm tin | bắt buộc lý do + vai trò được công bố + audit trước/sau (contract 7.22) |
| Xuất kết quả lộ ngoài data-scope | hiếm | lộ dữ liệu ứng viên | export theo quyền + audit; deny-by-default |
| Rubric thiếu chuẩn (GAP-AS-04) | thường | chấm cảm tính, không bảo vệ được khi tranh chấp | v1 dùng hướng dẫn chấm của câu; OQ-1 chốt governance rubric |

## 10. Success Criteria (preliminary)

- Thời gian từ submission đến kết quả đã review — đo theo PRD Mục 7.23;
  baseline chưa có, xác lập trong pilot (liên quan OQ-1/OQ-2 sản phẩm).
- 100% kết quả phát hành đã qua reviewer xác nhận (guardrail human-in-loop).
- 0 quyết định pass/fail do AI tự sinh (guardrail, bám M-GR-02).
- 100% override/regrade có lý do + người thực hiện + giá trị trước/sau.
- Aggregate luôn khớp tổng grade item sau recompute — test regression mỗi
  release.

## 11. Open Questions

- [x] OQ-1: Rubric chấm câu tự luận v1 là gì và ai phê duyệt (OQ-AS-02,
  GAP-AS-04)? — Resolved (đề xuất): v1 dùng "hướng dẫn chấm" của câu trong
  snapshot làm rubric; governance rubric riêng để phase sau — chờ Assessment
  owner + Head of HR xác nhận.
- [x] OQ-2: Score threshold nào dẫn đến pass/fail và ai có quyền override
  (OQ-AS-04)? — Resolved (đề xuất): v1 không auto pass/fail — hệ thống trình
  bày điểm + breakdown + insight; ngưỡng đạt do author công bố như tham
  chiếu, quyết định do reviewer/HR; quyền override là vai trò được author
  công bố — chờ Assessment owner xác nhận.
- [x] OQ-3: Regrade sau khi kết quả đã phát hành được xử lý thế nào? —
  Resolved (đề xuất): cho phép với vai trò được công bố + lý do + phiên bản
  chấm mới + audit; kết quả đã phát hành được đánh dấu "đã thay đổi" để
  quyết định phát hành lại — chờ Assessment owner xác nhận.
- [x] OQ-4: Độ dài/hình thức tối thiểu của lý do override/regrade? —
  Resolved (đề xuất): 10–500 ký tự, bắt buộc — chờ owner xác nhận.
- [x] OQ-5: SLA hàng chờ chấm và ngưỡng nhắc treo? — Resolved (đề xuất): 3
  ngày làm việc/submission — chờ Assessment owner chốt.
- [x] OQ-6: Giới hạn export (định dạng, kích thước, ai được xuất)? —
  Resolved (đề xuất): PDF/CSV, CSV ≤50.000 dòng/lượt, vai trò được cấp trong
  data-scope — chờ owner xác nhận.
- [x] OQ-7: Retention cho kết quả chấm, insight và lịch sử override? —
  Resolved (đề xuất): theo quyết định retention chung — chờ OQ-6 PRD; trước
  đó chỉ dữ liệu synthetic cho pilot.
- [~] OQ-8: Độ khó thực nghiệm của câu hỏi trả về `question-bank`? — Out of
  scope v1: hướng P2 sau khi đủ dữ liệu chấm.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd assessment-grading` — capture user perspective
- `/brd assessment-grading` — business case
- `/prd-epic assessment-grading` — product scope
