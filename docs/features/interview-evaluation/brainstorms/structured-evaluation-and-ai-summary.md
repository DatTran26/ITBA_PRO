---
type: brainstorm
feature: interview-evaluation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# Đánh giá phỏng vấn theo khung + AI tóm tắt có giữ bất đồng — interview-evaluation

## 1. Idea Seed

Mỗi interviewer được gán vào một phiên phỏng vấn ghi một phiếu đánh giá
riêng theo khung tiêu chí thống nhất của tổ chức: điểm theo tiêu chí, nhận
xét, evidence đính kèm và khuyến nghị tổng. Phiếu lưu nháp được, submit
một lần, hết hạn nộp thì nhắc. Khi HR cần, AI tổng hợp các phiếu đã submit
của một phiên thành bản tóm tắt — bắt buộc giữ nguyên điểm bất đồng và
trỏ về từng phiếu nguồn — rồi HR review tóm tắt cùng các phiếu gốc để ra
quyết định cuối: đạt / không đạt / cần thêm vòng. AI không bao giờ tự
quyết định; quyết định của HR mới là đầu vào để pipeline chuyển stage.

## 2. Context

Đánh giá phỏng vấn hiện nằm rải rác: interviewer ghi vào file cá nhân,
chat hoặc không ghi gì; HR phải đuổi từng người xin nhận xét, tự tổng hợp
bằng tay và khi ý kiến mâu thuẫn thì không còn ai nhớ ai nói gì. Quyết
định vì vậy thiếu căn cứ truy vết — vấn đề trọng tâm của hành trình v1
("quyết định có evidence", PRD Mục 6.1). Feature này là mắt xích cuối của
lát cắt phỏng vấn: nhận phiên đã diễn ra từ `interview-management`, cho
interviewer ghi phiếu theo khung chung, dùng AI tóm tắt có kiểm soát, và
trả quyết định đã review cho `candidate-pipeline` (PASSED/FAILED) —
downstream là `offer-management`.

Bằng chứng nguồn (reverse spec `recruitment-and-interviews`): đã quan sát
được interviewer submit result pass/fail làm hoàn tất schedule và tự
chuyển application (FR-RC-06) — nhưng đây chính là lỗ hổng: một kết quả
đầu tiên có thể chốt pipeline xung đột với intent nhiều vòng (GAP-RC-02,
OQ-RC-01). V1 vì vậy tách rõ: phiếu của interviewer ≠ quyết định tuyển;
chỉ quyết định đã HR review mới kích transition.

Nguyên tắc bất biến (PRD Mục 12): AI chỉ tóm tắt và trỏ nguồn, không ra
quyết định pass/fail; mọi AI output có người review, sửa hoặc bỏ; quyết
định ghi rõ người quyết định, căn cứ và thời điểm. Dữ liệu đánh giá chứa
nhận xét về con người — theo consent/access/retention policy (OQ-6 PRD).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Interviewer | Phải nhớ và viết nhận xét tự do sau buổi, không có khung chung, hay quên deadline | Form đánh giá theo tiêu chí quen thuộc, lưu nháp được, submit một lần, được nhắc khi quá hạn |
| HR | Đuổi phiếu từng người, tự tổng hợp ý kiến nhiều interviewer, mất dấu ý kiến bất đồng | Một màn hình thấy ai đã nộp, bản tóm tắt AI giữ nguyên bất đồng + trỏ phiếu gốc, rồi quyết định có căn cứ |
| Quản lý | Muốn biết vì sao ứng viên đạt/trượt | Xem quyết định và căn cứ trong phạm vi quyền |
| Ứng viên | Kết quả phỏng vấn là hộp đen (gián tiếp) | Quyết định công bằng, có căn cứ ghi nhận |
| Admin | Phiếu đánh giá có nhận xét nhạy cảm về con người | Kiểm soát ai xem phiếu/tóm tắt, audit truy cập, retention rõ |

## 4. Capabilities Breakdown

### P0 — must have

- Phiếu đánh giá theo khung tiêu chí thống nhất: mỗi phiên (theo vòng) gắn
  một bộ tiêu chí (rubric) của tổ chức/vị trí; mỗi interviewer một phiếu
  riêng gồm điểm từng tiêu chí (thang 1–5), nhận xét theo tiêu chí, nhận
  xét tổng bắt buộc và khuyến nghị tổng (đạt / không đạt / cần trao đổi
  thêm).
- Evidence trên phiếu: ghi chú tự do và đính kèm liên kết/file/tham chiếu
  recording-transcript (khi `interview-recording` có) làm căn cứ.
- Draft + submit: lưu nháp tự động/khi bấm, submit là hành động có xác
  nhận và idempotent; sau submit phiếu khóa, chỉ mở lại khi HR "trả về
  yêu cầu bổ sung" kèm lý do.
- Hạn nộp và nhắc: mỗi phiếu có hạn nộp (48 giờ sau giờ kết thúc phiên —
  đề xuất); nhắc interviewer khi sắp/quá hạn; HR thấy danh sách phiếu
  thiếu/quá hạn của từng phiên.
- Trạng thái phiếu và phiên rõ ràng: phiếu `nháp → đã nộp → bị trả về →
  đã nộp lại`; phiên theo dõi "đủ/thiếu phiếu" theo số interviewer đã
  chấp nhận.
- AI tóm tắt theo yêu cầu của HR: tổng hợp các phiếu đã nộp của một phiên
  thành bản tóm tắt — điểm trung bình theo tiêu chí, điểm đồng thuận,
  **điểm bất đồng giữ nguyên kèm trích nguồn từng ý**, evidence nổi bật,
  và danh sách phiếu nguồn/phiếu còn thiếu. Summary có phiên bản, ghi
  model/version và thời điểm sinh.
- HR review: xem tóm tắt cạnh các phiếu gốc; chấp nhận, chỉnh sửa hoặc
  tạo lại tóm tắt; mọi tóm tắt AI ở "chờ review" cho tới khi HR xử lý.
- Quyết định của con người: HR (vai trò được cấp) ghi quyết định vòng —
  đạt / không đạt / cần thêm vòng — kèm nhận xét căn cứ; chỉ quyết định
  này mới kích `candidate-pipeline` chuyển stage (`PASSED`/`FAILED` hoặc
  giữ nguyên khi cần thêm vòng).
- Audit và quyền: ai xem/nộp/trả về/tóm tắt/quyết định đều có vết; phiếu
  và tóm tắt chỉ hiển thị trong data-scope; interviewer chỉ thấy phiếu
  của mình (và trạng thái nộp chung của phiên), không thấy phiếu người
  khác trừ khi được cấp.

### P1 — should have

- Trả về yêu cầu bổ sung: HR mở lại một phiếu đã nộp kèm lý do, phiếu về
  "bị trả về", interviewer sửa và nộp lại — history giữ cả hai lần nộp.
- So sánh song song các phiếu của cùng phiên (bảng điểm theo tiêu chí ×
  interviewer).
- Rubric quản lý được: HR lead/admin soạn bộ tiêu chí (tên, mô tả, thứ
  tự, thang điểm) gán cho vị trí/vòng; v1 có rubric mặc định tổ chức.
- Cảnh báo phiếu "mỏng" (ít nhận xét/không evidence) trước khi tóm tắt.
- Đồng bộ kết quả đánh giá vòng sang `candidate-assessment`/
  `assessment-grading` khi cùng chuỗi đánh giá (liên kết tham chiếu).

### P2 — nice to have

- Gợi ý câu hỏi follow-up từ AI dựa trên tiêu chí chưa đủ evidence —
  chỉ là gợi ý cho vòng sau, con người quyết định dùng.
- Xuất phiếu/tóm tắt PDF cho hồ sơ quyết định.
- Chia sẻ kết quả/nhận xét cho ứng viên theo chính sách — cần quyết định
  riêng về nội dung được phép lộ.
- Phân tích drift chất lượng đánh giá giữa interviewer (nghiêm vs dễ)
  khi đủ dữ liệu.

## 5. Core Flows (Happy Path)

### 5.1 Interviewer ghi và submit phiếu đánh giá

1) Interviewer mở phiên đã diễn ra (từ danh sách phiên của mình hoặc từ
   thông báo sau buổi) → «Ghi đánh giá» → form theo rubric của phiên.
2) Chấm từng tiêu chí (1–5) + nhận xét tùy chọn theo tiêu chí; đính kèm
   evidence (link/file/tham chiếu transcript) khi cần.
3) Nhận xét tổng (bắt buộc) + chọn khuyến nghị: đạt / không đạt / cần
   trao đổi thêm → lưu nháp bất cứ lúc nào.
4) Bấm «Nộp đánh giá» → hệ thống kiểm tra đủ trường bắt buộc → xác nhận
   → phiếu "đã nộp", khóa chỉnh sửa, HR thấy trạng thái nộp.
5) Quá hạn nộp mà chưa submit → nhắc interviewer và phiếu hiện "quá hạn"
   trong danh sách của HR.

```
Interviewer                  Hệ thống                              HR
──────────────────────────────────────────────────────────────────────────────────
Mở phiên đã diễn ra
→ «Ghi đánh giá»
        │
        ▼
┌──────────────────────────────┐
│ Form theo rubric của phiên:  │
│ điểm 1–5 / tiêu chí + nhận   │
│ xét + evidence + khuyến nghị │
└───────────┬──────────────────┘
            ▼
   ── Đủ trường bắt buộc? ──
   (nhận xét tổng + khuyến nghị)
   │                          │
 Chưa ▶ lưu nháp / báo       Đủ ▼
  thiếu field           «Nộp đánh giá» + xác nhận
            │                  │
            │                  ▼
            │        ┌──────────────────────┐
            │        │ Phiếu "đã nộp", khóa │
            │        │ sửa; idempotent      │
            │        └──────────┬───────────┘
            │                   ▼
            │            trạng thái phiên
            │            "đã nộp x/y" ─────────▶ thấy ai nộp/
            │                                      ai còn thiếu
            ▼
   Quá hạn chưa nộp ──▶ nhắc interviewer + cờ "quá hạn" ──▶ HR
```

### 5.2 HR yêu cầu AI tóm tắt và review

1) HR mở phiên có ≥1 phiếu "đã nộp" → «Tổng hợp AI» (có thể khi còn
   thiếu phiếu — tóm tắt ghi rõ thiếu của ai).
2) Hệ thống sinh tóm tắt "chờ review": điểm trung bình theo tiêu chí,
   đồng thuận, **bất đồng kèm trích nguồn**, evidence nổi bật, danh sách
   phiếu nguồn.
3) HR xem tóm tắt cạnh các phiếu gốc → chấp nhận (kèm chỉnh sửa nếu
   cần) hoặc «Tạo lại» khi có phiếu mới nộp thêm.
4) Tóm tắt được chấp nhận trở thành bản hiệu lực của phiên, vẫn luôn trỏ
   về các phiếu nguồn.

```
HR                           Hệ thống (AI job)                  Kết quả
──────────────────────────────────────────────────────────────────────────────────
Mở phiên (x/y phiếu đã nộp)
→ «Tổng hợp AI»
        │
        ▼
   ┌─────────────────────────────┐
   │ AI đọc các phiếu đã nộp     │
   │ → tóm tắt "chờ review":     │
   │ • điểm TB theo tiêu chí     │
   │ • đồng thuận                │
   │ • BẤT ĐỒNG + trích nguồn    │
   │ • evidence nổi bật          │
   │ • danh sách phiếu nguồn/    │
   │   phiếu thiếu               │
   └───────────┬─────────────────┘
               ▼
   ── HR review: chấp nhận? ──
   │              │                │
 Chấp nhận    Chỉnh sửa        Tạo lại (khi có
 (có thể sửa)  rồi chấp nhận    phiếu mới)
   └──────┬───────┘                │
          ▼                        ▼
   Tóm tắt "đã chấp nhận"    Tóm tắt mới "chờ review",
   = bản hiệu lực, trỏ       bản cũ giữ phiên bản
   phiếu nguồn + model ver
```

### 5.3 HR ra quyết định vòng (con người quyết)

1) HR mở phiên (đã có tóm tắt hoặc chưa — tóm tắt là hỗ trợ, không điều
   kiện bắt buộc) → «Ghi quyết định».
2) Chọn kết quả vòng: đạt / không đạt / cần thêm vòng + nhận xét căn cứ
   bắt buộc → xác nhận.
3) Hệ thống ghi quyết định kèm người quyết định/thời điểm/tóm tắt đã
   dùng (nếu có) → phát sự kiện cho `candidate-pipeline` chuyển
   `PASSED`/`FAILED` (hoặc giữ stage khi cần thêm vòng) và thông báo các
   bên liên quan.

### 5.4 Trả về phiếu yêu cầu bổ sung (P1)

1) HR mở phiếu đã nộp → «Yêu cầu bổ sung» → nhập lý do bắt buộc.
2) Phiếu về "bị trả về", interviewer được thông báo, mở lại sửa và nộp
   lại; history giữ nộp lần 1 và lần 2.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Interviewer có trong phiên (participant đã chấp nhận) và phiên đã diễn ra? | Cho ghi/sửa phiếu của mình | Không hiện form / từ chối ghi |
| D2 | 5.1 | Đủ trường bắt buộc (điểm mọi tiêu chí + nhận xét tổng + khuyến nghị)? | Cho submit | Báo field thiếu, giữ nháp |
| D3 | 5.1 | Phiếu còn trong hạn nộp? | Submit bình thường | Vẫn cho nộp nhưng phiếu mang cờ "nộp trễ" (đề xuất) |
| D4 | 5.2 | Có ≥1 phiếu "đã nộp" trong phiên? | Cho «Tổng hợp AI» | Nút mờ + gợi ý chờ phiếu đầu tiên |
| D5 | 5.2 | HR chấp nhận tóm tắt? | Tóm tắt "đã chấp nhận" làm bản hiệu lực | Tạo lại / giữ "chờ review" |
| D6 | 5.3 | Người quyết định có vai trò được cấp trong scope? | Ghi quyết định | "Bạn không có quyền ghi quyết định cho phiên này" |
| D7 | 5.3 | Kết quả vòng là đạt/không đạt? | Kích pipeline PASSED/FAILED | "Cần thêm vòng" → giữ stage, gợi ý tạo phiên mới |
| D8 | 5.4 | Phiếu đang "đã nộp" và phiên chưa có quyết định? | Cho trả về bổ sung | Không cho trả về khi đã có quyết định vòng |
| D9 | tất cả | Người xem thuộc data-scope và vai trò được phép xem phiếu? | Hiển thị | Ẩn + ghi audit khi cố truy cập |

### 6.2 Scenario Matrix

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| Phiếu: nháp | đã nộp | Đủ trường bắt buộc + xác nhận | Interviewer submit | Khóa sửa, báo HR |
| Phiếu: đã nộp | bị trả về | HR yêu cầu bổ sung + lý do, chưa có quyết định | HR trả về | Interviewer sửa lại được |
| Phiếu: bị trả về | đã nộp | Submit lần 2 | Interviewer nộp lại | History giữ cả 2 lần |
| Phiếu: đã nộp | (khóa) | Phiên đã có quyết định vòng | — | Read-only vĩnh viễn |
| Tóm tắt: — | chờ review | HR bấm tổng hợp, job AI xong | Sinh tóm tắt | Chờ HR xử lý |
| Tóm tắt: chờ review | đã chấp nhận | HR chấp nhận (kèm sửa nếu có) | HR review | Bản hiệu lực của phiên |
| Tóm tắt: chờ review/đã chấp nhận | bị thay thế | HR tạo lại khi có phiếu mới | «Tạo lại» | Bản mới chờ review, bản cũ giữ version |
| Quyết định: — | đã ghi | HR chọn kết quả + căn cứ | «Ghi quyết định» | Kích pipeline nếu đạt/không đạt |
| Phiên: thiếu phiếu | đủ phiếu | Tất cả participant đã chấp nhận đều có phiếu "đã nộp" | Submit cuối | Báo HR có thể quyết định |

### 6.3 State Transitions

```
phiếu đánh giá (evaluation):  nháp → đã-nộp → bị-trả-về → đã-nộp (lần 2)
                                 │      │
                                 │      └──▶ (khóa vĩnh viễn khi phiên có quyết định)
                                 └─▶ đã-nộp-trễ (cờ, vẫn hợp lệ)

tóm tắt AI (summary):  (chưa có) → chờ-review → đã-chấp-nhận
                                      │            │
                                      └──▶ tạo-lại ──▶ bản mới chờ-review,
                                                       bản cũ "bị-thay-thế"

quyết định vòng (decision):  (chưa có) → đã-ghi {đạt | không-đạt | cần-thêm-vòng}
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| evaluation | — | nháp | interviewer mở/lưu form | — |
| evaluation | nháp | đã-nộp | submit đủ trường | chỉ qua trả về |
| evaluation | đã-nộp | bị-trả-về | HR yêu cầu bổ sung + lý do | có, nộp lại |
| evaluation | bị-trả-về | đã-nộp | interviewer nộp lại | — |
| evaluation | đã-nộp | (read-only) | phiên có quyết định vòng | không |
| summary | — | chờ-review | job AI hoàn tất | — |
| summary | chờ-review | đã-chấp-nhận | HR chấp nhận (có thể kèm sửa) | chỉ qua tạo lại |
| summary | bất kỳ | bị-thay-thế | HR «Tạo lại» | không (giữ version) |
| decision | — | đã-ghi | HR ghi quyết định + căn cứ | không (ghi đảo là bản ghi mới — đề xuất OQ-5) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Interviewer đóng trình duyệt giữa form | Nháp đã autosave | Mở lại phiếu, tiếp tục từ bản nháp server | — |
| Submit trùng (double-click/retry) | Một phiếu "đã nộp" duy nhất | Submit idempotent — lần 2 trả trạng thái hiện tại | — |
| Job AI tóm tắt lỗi/timeout | Tóm tắt không được tạo; job có trạng thái | HR bấm lại «Tổng hợp AI» (retry) | Báo HR khi hết retry; phiếu gốc không ảnh hưởng |
| Có phiếu mới nộp trong lúc AI đang tổng hợp | Tóm tắt chỉ phủ phiếu đã nộp tại thời điểm chạy | Tóm tắt ghi rõ danh sách nguồn; HR «Tạo lại» để phủ phiếu mới | Cảnh báo "phiếu {người} nộp sau khi tóm tắt" |
| HR ghi quyết định trong lúc interviewer đang sửa phiếu trả về | Phiếu bị khóa theo quyết định | Interviewer thấy phiếu đã khóa | — |
| Kích transition pipeline thất bại | Quyết định đã ghi | Retry phát sự kiện; báo HR nếu application ở stage không hợp lệ | Không rollback quyết định |
| Notification sau sự kiện lỗi | Sự kiện đã ghi | Retry theo `contextual-notifications` | Không rollback |

### 6.5 Other Edge Cases

- Phiên chỉ có 1 interviewer (đa số): tóm tắt AI vẫn hữu ích để chuẩn hóa
  nhưng phần "bất đồng" trống — hiển thị "chỉ có một phiếu".
- Phiên có participant đã chấp nhận nhưng không ghi phiếu (quá hạn mãi):
  HR quyết định được trên phần phiếu có sẵn; tóm tắt và quyết định đều
  ghi "thiếu phiếu của {người}".
- Interviewer ghi phiếu cho phiên bị hủy sau đó: phiếu giữ nguyên, đánh
  dấu "phiên đã hủy" (khớp `interview-management`).
- Application đổi stage (vd bị loại bởi lý do khác) khi phiếu chưa nộp:
  phiếu vẫn nhận được nhưng cảnh báo "application đã đổi trạng thái";
  quyết định vòng mới vẫn ghi được nhưng không kích transition nếu stage
  không hợp lệ — báo HR xử lý (liên kết `candidate-pipeline`).
- Interviewer bị vô hiệu sau khi nộp: phiếu vẫn hợp lệ, tên người giữ
  trong history.
- Rubric của phiên bị đổi giữa chừng (đang có phiếu nháp): phiếu nháp giữ
  rubric tại thời điểm mở; cảnh báo khi rubric mới khác biệt (đề xuất —
  OQ-4).
- Người được cấp xem phiếu người khác (HR lead): hiển thị đầy đủ, ghi
  audit lượt xem — nhận xét về con người là dữ liệu nhạy cảm.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Điểm tiêu chí | Bắt buộc mọi tiêu chí của rubric; số nguyên 1–5 (đề xuất) |
| Nhận xét theo tiêu chí | Tùy chọn, ≤1.000 ký tự (đề xuất) |
| Nhận xét tổng | Bắt buộc, 10–2.000 ký tự (đề xuất) |
| Khuyến nghị tổng | Bắt buộc; 1 trong: đạt / không đạt / cần trao đổi thêm |
| Evidence đính kèm | Tùy chọn; link hợp lệ, file ≤10 MB, hoặc tham chiếu recording/transcript đã có |
| Lý do trả về phiếu | Bắt buộc khi HR trả về, 3–500 ký tự |
| Quyết định vòng | Bắt buộc kết quả + nhận xét căn cứ 10–2.000 ký tự; chỉ vai trò được cấp |
| Submit | Idempotent; phiếu đã nộp không nhận submit thứ hai như thao tác mới |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Hạn nộp phiếu | 48 giờ | sau giờ kết thúc phiên | Nhắc; phiếu nộp vẫn hợp lệ nhưng cờ "nộp trễ" (đề xuất — OQ-1) |
| Số tiêu chí mỗi rubric | 3–10 | mỗi rubric | Chặn lưu rubric ngoài khoảng (đề xuất — OQ-2) |
| Số lần trả về một phiếu | 2 | mỗi phiếu | Lần 3 yêu cầu HR trao đổi trực tiếp (đề xuất) |
| File evidence | 10 MB, ≤5 file | mỗi phiếu | Chặn đính kèm thêm (đề xuất) |
| Nhắc nộp phiếu | 24 giờ trước hạn + khi quá hạn | mỗi phiếu | — (đề xuất) |
| Retry job tóm tắt AI | 3 lần | mỗi lần bấm | Báo HR dùng đường thủ công (đề xuất) |
| Số phiên bản tóm tắt | 10 | mỗi phiên | Bản cũ nhất archive khỏi danh sách chính (đề xuất) |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Submit thiếu trường | "Vui lòng chấm đủ {n} tiêu chí, nhập nhận xét tổng và chọn khuyến nghị trước khi nộp" | E-? |
| Không phải participant của phiên | "Bạn không được gán vào phiên phỏng vấn này — không thể ghi đánh giá" | E-? |
| Phiếu đã khóa | "Phiếu đánh giá đã được nộp — chỉ có thể sửa khi HR trả về yêu cầu bổ sung" | E-? |
| Trả về thiếu lý do | "Vui lòng nhập lý do để interviewer biết cần bổ sung gì" | E-? |
| Quyết định thiếu căn cứ | "Vui lòng nhập nhận xét căn cứ cho quyết định (tối thiểu 10 ký tự)" | E-? |
| Không có quyền quyết định | "Bạn không có quyền ghi quyết định cho phiên này" | E-? |
| Phiên chưa có phiếu nào | "Chưa có phiếu đánh giá nào được nộp — tổng hợp AI cần ít nhất một phiếu" | E-? |
| Không có quyền xem | "Bạn không có quyền xem đánh giá của phiên này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Submit phiếu | "Đã nộp đánh giá cho phiên vòng {n} — cảm ơn bạn" |
| Tóm tắt xong | "Đã tạo tóm tắt từ {x}/{y} phiếu — đang chờ bạn review" |
| Chấp nhận tóm tắt | "Tóm tắt đã được chấp nhận làm bản hiệu lực của phiên" |
| Ghi quyết định | "Đã ghi quyết định {kết quả} cho vòng {n} — pipeline đã được cập nhật" |
| Trả về phiếu | "Đã trả phiếu về cho {interviewer} kèm yêu cầu bổ sung" |
| Nộp lại | "Đã nộp lại phiếu đánh giá — HR đã được thông báo" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Trạng thái nộp | "Đã nộp {x}/{y} phiếu của phiên này" |
| Nhắc hạn | "Phiếu đánh giá của bạn cần nộp trước {HH:mm DD/MM}" |
| Nộp trễ | "Phiếu này được nộp sau hạn {N} giờ" |
| Bất đồng trong tóm tắt | "Ý kiến khác biệt ở tiêu chí «{tiêu chí}»: {interviewer A} chấm {a}, {interviewer B} chấm {b} — xem phiếu gốc" |
| Thiếu phiếu khi tóm tắt | "Tóm tắt này chưa gồm phiếu của {người} (chưa nộp)" |
| Phiếu mới sau tóm tắt | "{Người} vừa nộp phiếu sau khi tóm tắt được tạo — tạo lại để cập nhật" |
| AI disclaimer | "Tóm tắt do AI tạo từ các phiếu đã nộp — kiểm tra phiếu gốc trước khi quyết định" |
| Empty state | "Chưa có phiếu đánh giá nào — phiếu xuất hiện sau khi interviewer nộp" |

## 8. Assumptions

- Phiên phỏng vấn và participant đã chấp nhận do `interview-management`
  cung cấp; feature này chỉ nhận phiên "đã diễn ra" làm đầu vào.
- Rubric v1: một bộ tiêu chí mặc định của tổ chức, gán theo vị trí/vòng
  khi cần; quyền soạn rubric là HR lead/admin — đề xuất, chờ Head of HR
  (liên quan OQ-11 PRD về authority khung đánh giá).
- Thang điểm 1–5 mỗi tiêu chí + khuyến nghị tổng ba lựa chọn — đề xuất,
  chờ Head of HR.
- AI tóm tắt chạy khi HR bấm (không tự chạy), từ phiếu đã nộp tại thời
  điểm chạy; summary luôn ghi danh sách phiếu nguồn + model/version —
  bám invariant provenance (PRD Mục 12).
- Quyết định vòng chỉ do người có vai trò được cấp; AI/interviewer không
  tự chốt pipeline — sửa trực tiếp lỗ hổng GAP-RC-02 của nguồn.
- Phiếu/tóm tắt/quyết định chứa nhận xét về con người: interviewer chỉ
  thấy phiếu của mình; người được cấp khác xem theo data-scope, lượt xem
  có audit; không chia sẻ cho ứng viên trong v1 — đề xuất, chờ DPO (PRD
  OQ-6).
- Giới hạn ở Mục 7.2 là giá trị đề xuất thận trọng chờ owner chốt.
- `contextual-notifications` nhận sự kiện (nhắc nộp, trả về, quyết định)
  để gửi thông báo; feature chỉ phát sự kiện.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Tóm tắt AI làm phẳng/mất ý kiến bất đồng hoặc evidence | thỉnh thoảng | Quyết định sai căn cứ, ứng viên bị đánh giá thiếu công bằng — rủi ro chính PRD Mục 7.10 | Bắt buộc mục bất đồng + trích nguồn trong mọi tóm tắt; luôn hiển thị phiếu gốc cạnh tóm tắt; disclaimer AI; đo tỷ lệ tóm tắt bị HR chỉnh/tạo lại |
| Interviewer xem tóm tắt/quyết định AI như kết luận cuối | thỉnh thoảng | AI âm thầm quyết định thay con người — vi phạm invariant | Tóm tắt luôn "chờ review"; không có nút "áp kết quả AI"; quyết định bắt buộc người có vai trò + căn cứ |
| Phiếu nộp trễ/không nộp làm vòng tuyển kẹt | thường | Application treo ở INTERVIEW_SCHEDULED, ứng viên chờ | Hạn nộp + nhắc + danh sách thiếu cho HR; HR quyết định được trên phiếu có sẵn |
| Phiếu chứa nhận xét nhạy cảm bị xem ngoài phạm vi | thỉnh thoảng | Lộ đánh giá về con người, khiếu nại privacy | Deny-by-default + audit lượt xem; interviewer chỉ thấy phiếu mình; retention theo OQ-6 |
| Rubric không thống nhất giữa các phiên/vòng | thỉnh thoảng | Điểm không so sánh được, quyết định thiếu nhất quán | Rubric gán theo vị trí/vòng; bản phiếu khóa rubric tại thời điểm mở |
| Đánh giá bị dùng làm kết luận toàn diện về con người | hiếm | Dùng sai mục đích, rủi ro pháp lý/đạo đức | Wording form là "đánh giá theo tiêu chí vòng phỏng vấn", không phải kết luận nhân sự; tài liệu hướng dẫn |
| Job AI lỗi/provider chết | thỉnh thoảng | HR không có tóm tắt khi cần | Retry + trạng thái job + đường review thủ công (phiếu gốc luôn xem được) |

## 10. Success Criteria (preliminary)

- Tỷ lệ phiên có đánh giá đầy đủ đúng hạn — chỉ số chính PRD Mục 7.10;
  mốc chờ OQ-2 sản phẩm.
- 100% quyết định vòng có người quyết định + căn cứ + thời điểm; 0 quyết
  định do AI/auto tạo ra — guardrail invariant.
- 100% tóm tắt AI ở "chờ review" cho tới khi HR xử lý; 100% tóm tắt có
  danh sách phiếu nguồn và giữ mục bất đồng.
- 0 sự cố "một phiếu interviewer tự chốt pipeline" — sửa GAP-RC-02.
- Tỷ lệ phiếu được nộp trong hạn 48 giờ — baseline xác lập trong pilot.

## 11. Open Questions

- [ ] OQ-1: Hạn nộp phiếu 48 giờ sau buổi và chính sách "nộp trễ vẫn hợp
  lệ" có đúng không? Ai duyệt — Recruitment owner?
- [ ] OQ-2: Cấu trúc rubric v1 (số tiêu chí 3–10, thang 1–5) và ai có
  quyền soạn/sửa rubric — Head of HR hay admin tổ chức? (liên quan OQ-11
  PRD)
- [ ] OQ-3: Quyết định vòng cần đủ phiếu của tất cả interviewer đã chấp
  nhận, hay HR được quyết định khi còn thiếu?
- [ ] OQ-4: Rubric đổi khi phiên đang có phiếu nháp — khóa rubric theo
  phiên hay bắt nộp lại theo rubric mới?
- [ ] OQ-5: Quyết định vòng đã ghi có được đảo (ghi đảo là bản ghi mới
  kèm lý do) hay bất biến? Ai được đảo?
- [ ] OQ-6: Ai xem được phiếu của người khác — chỉ HR, hay cả interviewer
  cùng phiên? Nhận xét có được ẩn danh tác giả với interviewer khác
  không?
- [ ] OQ-7: Kết quả/feedback có được chia sẻ cho ứng viên không, ở mức
  nào? (v1 giả định không chia sẻ)
- [ ] OQ-8: Retention cho phiếu đánh giá, tóm tắt AI và quyết định —
  theo retention hồ sơ tuyển dụng chung? (PRD OQ-6)

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd interview-evaluation` — capture user perspective
- `/brd interview-evaluation` — business case
- `/prd-epic interview-evaluation` — product scope
