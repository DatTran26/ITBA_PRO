---
type: brainstorm
feature: assessment-authoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# Soạn và phát hành bài đánh giá — assessment-authoring

## 1. Idea Seed

Tạo một bài đánh giá từ câu hỏi đã được duyệt trong ngân hàng, từ mẫu cấu
hình tái sử dụng, hoặc bám theo mục tiêu (vị trí/JD, kỹ năng, trình độ);
cấu hình thời lượng, cách chấm, hướng dẫn làm bài và chính sách hiển thị
kết quả; xem trước bài như người làm bài sẽ thấy; rồi phát hành qua
link/token có hạn dùng và giới hạn lượt làm phù hợp từng đối tượng. Mọi
thay đổi sau phát hành đều có lý do và vết audit; đề đã phát hành không
bị sửa ngầm khi đã có người làm bài.

## 2. Context

HR và interviewer hiện soạn bài test thủ công cho từng đợt tuyển — mỗi lần
phải tự cấu hình lại thời lượng, số câu, cách gửi link, và không có bước
kiểm tra trước khi bài đến tay ứng viên. Nguồn ITBAAI đã có nền tạo/quản lý
bài test kèm `share_token` để phát hành (reverse spec `assessment-and-grading`,
FR-AS-01) — bằng chứng triển khai, chưa phải bằng chứng nhu cầu; đồng thời
reverse cũng cho thấy token chưa rõ hạn/thu hồi/giới hạn lượt (GAP-AS-03,
OQ-AS-01) và trang làm bài public từng trả cả đáp án (GAP-AS-06).

Feature này là `Must` trong lát cắt v1 (PRD Mục 7.21): là điểm nối giữa
`question-bank` (lấy câu đã duyệt), `assessment-templates` (lấy cấu hình
mẫu), `ai-question-generation` (luồng sinh câu bổ sung) và
`candidate-assessment` (tiêu thụ bài + link đã phát hành). Rủi ro chính theo
PRD: bài test không đo đúng job/level — vì vậy cần checklist kiểm tra và
preview trước khi phát hành. Invariant giữ nguyên: chỉ câu "Đã duyệt" được
vào bài; quyền xem kết quả/attempt/expiry/reopen do author công bố, có lý
do và audit (PRD Mục 7.22, Mục 12).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR (author) | Mỗi đợt tuyển soạn bài từ đầu, dễ cấu hình sai, phát link thủ công không kiểm soát | Tạo bài đúng mục tiêu, phát hành qua link có hạn, truy vết được |
| Interviewer (đồng tác giả) | Được giao soạn bài cho mảng mình phụ trách nhưng thiếu khung chuẩn | Soạn từ mẫu/ngân hàng đã duyệt, preview trước khi phát hành |
| Admin | Không kiểm soát ai được phát hành bài, link phát tán không hạn | Phân quyền author, audit phát hành và thay đổi |
| Ứng viên / nhân viên (người làm bài) | Nhận bài cấu hình sai, link không rõ hạn | (gián tiếp) nhận bài đúng chuẩn đã kiểm tra — làm bài qua `candidate-assessment` |

## 4. Capabilities Breakdown

### P0 — must have

- CRUD bài đánh giá ở trạng thái nháp: tên bài, mô tả, hướng dẫn làm bài,
  mục tiêu (vị trí/JD của tổ chức), trình độ, đối tượng làm bài (ứng viên
  / nhân viên), thời lượng, quy tắc chấm ghi nhận và chính sách hiển thị
  kết quả cho người làm bài.
- Áp mẫu (`assessment-templates`): chọn mẫu đã công bố → cấu hình điền sẵn
  vào bản nháp (bản sao độc lập, chỉnh tự do); ghi nhận bài sinh từ mẫu nào.
- Soạn đề: chọn câu từ `question-bank` — chỉ câu "Đã duyệt"; thêm/bớt/đổi
  thứ tự câu, gán điểm từng câu, xem tổng điểm; cảnh báo câu ngừng dùng
  hoặc có phiên bản mới trong bài nháp.
- Preview như người làm bài (không hiển thị đáp án/giải thích) + checklist
  trước phát hành: đủ câu, mọi câu đã duyệt, thời lượng hợp lệ, hướng dẫn
  và chính sách kết quả đã chọn.
- Phát hành: bài chuyển "Đã phát hành", đề được chốt snapshot theo phiên
  bản câu tại thời điểm phát hành; tạo link/token có hạn dùng + giới hạn
  lượt làm (cấu hình được), thu hồi link kèm lý do.
- Vòng đời bài: bản nháp → đã phát hành → đã đóng (ngừng nhận bài làm mới);
  sửa sau phát hành chỉ các field không ảnh hưởng đề (tên, mô tả, hướng
  dẫn, hạn link); thay đổi đề → nhân bản thành bản nháp mới.
- Provenance và audit: bài ghi nguồn (tạo tay / từ mẫu nào), người tạo,
  người phát hành, thời điểm; mọi thay đổi sau phát hành và mọi thao tác
  trên link (tạo/thu hồi) đều có audit kèm lý do.

### P1 — should have

- Gợi ý câu hỏi theo mục tiêu: lọc sẵn theo kỹ năng/trình độ của vị trí đã
  chọn (kế thừa bộ lọc của `question-bank`).
- Nhiều link trên một bài (theo đợt/đối tượng) với hạn và giới hạn riêng;
  đếm số attempt trên từng link (dữ liệu attempt thuộc
  `candidate-assessment`).
- Nhân bản bài thành bản nháp mới để tái sử dụng/chỉnh sửa.
- Giao bài cho nhân viên qua tài khoản (thay link public) — phối hợp với
  `candidate-assessment` và `employee-evaluation` về sau.

### P2 — nice to have

- Adaptive testing, random hóa đề theo ma trận độ khó, chia section có
  thời lượng riêng (PRD "Chưa làm": adaptive testing phức tạp).
- Yêu cầu người thứ hai duyệt trước phát hành (reviewer tùy chọn theo
  policy tổ chức).
- Phát hành định kỳ/lặp lịch; xáo trộn thứ tự câu/lựa chọn theo cấu hình.

## 5. Core Flows (Happy Path)

### 5.1 Tạo bài → cấu hình → chọn câu → preview → phát hành

1) Author tạo bài mới: đặt tên, chọn mục tiêu (vị trí/JD), trình độ, đối
   tượng làm bài — hoặc chọn "Tạo từ mẫu" để điền sẵn cấu hình.
2) Cấu hình: thời lượng, quy tắc chấm, hướng dẫn làm bài, chính sách hiển
   thị kết quả sau nộp (mặc định: chỉ biên nhận).
3) Soạn đề: mở "Chọn từ ngân hàng" → lọc kỹ năng/trình độ/loại câu → chọn
   câu "Đã duyệt" → sắp thứ tự, gán điểm từng câu.
4) Preview: xem bài như người làm bài (không đáp án); hệ thống chạy
   checklist phát hành.
5) Checklist đạt → "Phát hành" → bài chốt snapshot, tạo link đầu tiên với
   hạn và giới hạn lượt → gửi link cho đối tượng qua kênh nghiệp vụ.

```
Author                        Hệ thống                         Ngân hàng câu hỏi
─────────────────────────────────────────────────────────────────────────────
Tạo bài ──▶ chọn nguồn cấu hình
        ┌─────────────┬──────────────┐
        ▼ từ đầu      ▼ từ mẫu       ▼ theo mục tiêu
   nhập cấu hình  điền sẵn từ mẫu  gợi ý lọc theo
   (bản nháp)     (bản sao độc lập) vị trí/trình độ
        │             │               │
        └─────────────┴──────────────┘
                      ▼
        Soạn đề: chọn câu ────────▶ chỉ trả câu "Đã duyệt"
                      │
                      ▼
        Preview người làm bài (ẩn đáp án)
                      │
                      ▼
        ┌── Checklist phát hành ──┐
        │ đủ câu · đã duyệt hết   │
        │ thời lượng · hướng dẫn  │
        │ chính sách kết quả      │
        └───────────┬─────────────┘
                    ▼
           ── Đạt checklist? ──┐
              │                │
            Có ▼            Không ▼
        "Đã phát hành"    liệt kê mục thiếu,
        + snapshot đề     quay lại bước tương ứng
        + link/token có hạn & giới hạn lượt
                    │
                    ▼
        Sửa sau phát hành: field nhẹ sửa trực tiếp (audit + lý do);
        đổi đề → nhân bản thành bản nháp mới, bài cũ giữ nguyên.
```

### 5.2 Quản lý link phát hành

1) Trên bài "Đã phát hành", author tạo link: đặt hạn dùng, giới hạn lượt
   làm, ghi chú đợt/đối tượng → hệ thống sinh token duy nhất.
2) Author gửi link qua kênh nghiệp vụ (`contextual-notifications`/
   `operational-email`); mỗi link có trạng thái hoạt động/hết hạn/thu hồi.
3) Khi cần chặn: thu hồi link kèm lý do → attempt đang làm dở tiếp tục
   đến khi nộp hoặc hết giờ, nhưng không attempt mới nào được tạo.

### 5.3 Đóng bài và vòng đời sau phát hành

1) Hết đợt đánh giá → author "Đóng bài": bài ngừng nhận attempt mới trên
   mọi link; attempt đang chạy vẫn hoàn tất theo hợp đồng của
   `candidate-assessment`.
2) Cần sửa đề sau phát hành → "Nhân bản" tạo bản nháp mới mang toàn bộ
   cấu hình + danh sách câu → chỉnh → phát hành như bài mới; bài gốc giữ
   nguyên snapshot và lịch sử.

### 5.4 Sửa thông tin nhẹ trên bài đã phát hành

1) Author sửa tên/mô tả/hướng dẫn/hạn link → hệ thống yêu cầu nhập lý do.
2) Lưu thay đổi kèm audit (ai, khi nào, lý do, trước/sau); đề và snapshot
   câu không bị chạm vào.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Tạo bài từ mẫu? | Điền sẵn cấu hình từ mẫu đã công bố (bản sao độc lập) | Tạo trống, nhập cấu hình tay |
| D2 | 5.1 | Checklist phát hành đạt (đủ câu, đã duyệt hết, cấu hình đủ)? | Cho "Phát hành" | Liệt kê mục thiếu, giữ "Bản nháp" |
| D3 | 5.1 | Bài nháp chứa câu "Ngừng dùng"? | Chặn phát hành + yêu cầu thay câu | Cho qua nếu câu vẫn "Đã duyệt" |
| D4 | 5.1 | Câu trong bài có phiên bản mới được duyệt? | Cảnh báo trên bài nháp, cho cập nhật phiên bản trước phát hành | Giữ phiên bản đã chọn nếu author xác nhận |
| D5 | 5.2 | Link hết hạn/hết lượt/thu hồi khi người làm mở? | `candidate-assessment` chặn với lý do rõ | Cho tạo attempt bình thường |
| D6 | 5.4 | Sửa sau phát hành có chạm đề (câu hỏi, điểm, thời lượng, quy tắc chấm)? | Chặn + gợi ý "Nhân bản" | Cho sửa field nhẹ có audit + lý do |
| D7 | 5.3 | Còn attempt đang chạy khi đóng bài/thu hồi link? | Đóng nhận mới nhưng attempt đang chạy tiếp tục | Không có attempt → đóng ngay |

### 6.2 Scenario Matrix

| Vai trò | Bài bản nháp | Bài đã phát hành | Bài đã đóng |
|---|---|---|---|
| Author (người tạo) | xem/sửa/soạn đề/preview/phát hành/xóa | xem, sửa field nhẹ, quản lý link, đóng, nhân bản | xem lịch sử, nhân bản |
| Author khác (cùng quyền) | xem/sửa theo phạm vi tổ chức | như trên | xem |
| Admin | xem/sửa mọi bài | sửa field nhẹ, thu hồi link, đóng | xem/khôi phục (đề xuất) |
| Người làm bài | — | làm bài qua link/token hợp lệ (surface `candidate-assessment`) | — |

### 6.3 State Transitions

```
bài đánh giá: bản-nháp → đã-phát-hành → đã-đóng
                    │
                    └── (nhân bản) → bản-nháp mới (bài khác, không quay lại)
link phát hành: hoạt-động → hết-hạn (tự động theo hạn)
                        → thu-hồi (author/admin, kèm lý do)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| bài đánh giá | — | bản-nháp | tạo mới hoặc nhân bản | — |
| bài đánh giá | bản-nháp | đã-phát-hành | checklist đạt + author "Phát hành" | không |
| bài đánh giá | đã-phát-hành | đã-đóng | author/admin "Đóng bài" | có (đề xuất: mở lại có lý do + audit — OQ-7) |
| link | — | hoạt-động | author tạo link trên bài đã phát hành | — |
| link | hoạt-động | hết-hạn | qua `expires_at` hoặc đạt giới hạn lượt | không (tạo link mới) |
| link | hoạt-động | thu-hồi | author/admin thu hồi kèm lý do | không |
| đề (snapshot) | — | bất biến | tại thời điểm phát hành | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Author đóng trình duyệt giữa lúc soạn | bài "Bản nháp" với dữ liệu lưu lần cuối | mở lại bài nháp tiếp tục | nháp giữ vô hạn theo retention tổ chức |
| Lỗi giữa thao tác phát hành | bài vẫn "Bản nháp", chưa có link | bấm phát hành lại (idempotent — không nhân đôi link) | không tạo nửa trạng thái "đã phát hành" |
| Thu hồi link khi có attempt đang chạy | attempt cũ giữ snapshot + giờ còn lại | attempt chạy tiếp tới submit/hết giờ | chặn tạo attempt mới trên link đó |
| Đóng bài khi có attempt đang chạy | attempt đang chạy vẫn hợp lệ | tiếp tục theo hợp đồng `candidate-assessment` | chỉ chặn attempt mới |
| 2 author cùng sửa 1 bài nháp | bản lưu sau ghi đè | cảnh báo "bài vừa được {người} cập nhật — tải lại" | không merge tự động |

### 6.5 Other Edge Cases

- Bài nháp không có câu nào hoặc toàn câu bị gỡ: checklist chặn phát hành,
  liệt kê rõ mục thiếu.
- Mẫu đã chọn bị "Ngừng dùng" sau đó: bản sao cấu hình trong bài nháp
  không bị ảnh hưởng; chỉ hiện thông báo "mẫu gốc đã ngừng dùng".
- Vị trí/kỹ năng mục tiêu bị gỡ khỏi danh mục: bài giữ nguyên, hiện cảnh
  báo "mục tiêu không còn hợp lệ" để gán lại trước phát hành.
- Tổ chức chưa có câu "Đã duyệt" nào: màn chọn câu hiện empty state dẫn
  tới `question-bank` (soạn câu) hoặc `ai-question-generation` (sinh câu).
- Link bị phát tán ngoài đối tượng: giới hạn lượt + hạn + thu hồi là cơ
  chế chặn; audit ghi nhận thao tác thu hồi kèm lý do.
- Đối tượng "nhân viên": ưu tiên giao qua tài khoản thay link public
  (phối hợp `candidate-assessment` UN-011); link public vẫn khả dụng nhưng
  author phải chủ động chọn.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên bài | bắt buộc, không rỗng, tối đa 150 ký tự |
| Mục tiêu (vị trí/JD) | bắt buộc khi đối tượng là ứng viên; chọn từ danh mục vị trí của tổ chức |
| Trình độ | bắt buộc; 1 trong 6 mức: intern, fresher, junior, mid, senior, lead (thống nhất `question-bank`, `assessment-templates`) |
| Đối tượng làm bài | bắt buộc; ứng viên hoặc nhân viên |
| Thời lượng | bắt buộc; số nguyên 5–240 phút |
| Số câu trong đề | tối thiểu 1, tối đa 200 |
| Điểm mỗi câu | số dương, tối đa 2 chữ số thập phân; tổng điểm hệ thống tự tính |
| Quy tắc chấm | bắt buộc: thang điểm tổng + điểm đạt (số), phần mô tả tự do tùy chọn |
| Hướng dẫn làm bài | bắt buộc trước phát hành, tối đa 5.000 ký tự |
| Chính sách hiển thị kết quả | bắt buộc chọn 1: chỉ biên nhận / điểm tổng / điểm + nhận xét reviewer |
| Hạn link | bắt buộc; tối đa 90 ngày kể từ tạo |
| Giới hạn lượt làm mỗi link | bắt buộc; 1–1.000 lượt |
| Lý do thay đổi sau phát hành | bắt buộc, tối đa 500 ký tự |
| Thu hồi link | bắt buộc nhập lý do |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài tên bài | 150 ký tự | — | chặn lưu |
| Độ dài hướng dẫn | 5.000 ký tự | — | chặn lưu, báo số ký tự vượt |
| Số câu mỗi đề | 200 câu | — | chặn thêm câu |
| Thời lượng | 5–240 phút | — | chặn lưu ngoài khoảng |
| Hạn link | 90 ngày | mỗi link | chặn tạo link quá hạn |
| Giới hạn lượt mỗi link | 1.000 lượt | mỗi link | chặn tạo; hết lượt → link "hết hạn" |
| Số link hoạt động mỗi bài | 20 link | — | chặn tạo link mới, gợi ý thu hồi link cũ |
| Bài nháp mỗi tổ chức | 500 bài | — | chặn tạo mới, gợi ý dọn bài nháp cũ |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Checklist phát hành thiếu mục | "Chưa thể phát hành — còn thiếu: {danh sách mục}" | E-? |
| Bài có câu ngừng dùng | "Bài có {n} câu đã ngừng dùng — thay câu trước khi phát hành" | E-? |
| Sửa đề trên bài đã phát hành | "Bài đã phát hành không sửa được đề — hãy nhân bản để tạo phiên bản mới" | E-? |
| Tạo link thiếu hạn/giới hạn | "Link cần có hạn dùng và giới hạn lượt làm trước khi tạo" | E-? |
| Hạn link vượt tối đa | "Hạn link tối đa 90 ngày — chọn ngày sớm hơn" | E-? |
| Thu hồi link thiếu lý do | "Vui lòng nhập lý do thu hồi link" | E-? |
| Không có quyền phát hành | "Bạn không có quyền phát hành bài đánh giá" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu bản nháp | "Đã lưu bản nháp bài đánh giá" |
| Áp mẫu | "Đã điền cấu hình từ mẫu \"{tên}\" — bạn có thể chỉnh lại cho phù hợp" |
| Phát hành | "Bài \"{tên}\" đã phát hành — tạo link để gửi cho người làm bài" |
| Tạo link | "Đã tạo link (hạn {ngày}, tối đa {n} lượt) — sao chép để gửi" |
| Thu hồi link | "Link đã thu hồi — người đang làm bài vẫn hoàn tất được" |
| Đóng bài | "Bài đã đóng — không nhận bài làm mới" |
| Nhân bản | "Đã nhân bản thành bản nháp mới" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Câu có phiên bản mới | "Có {n} câu trong bài vừa có phiên bản mới được duyệt — cập nhật trước khi phát hành nếu cần" |
| Mẫu gốc đã ngừng | "Mẫu \"{tên}\" đã ngừng dùng — cấu hình trong bài này không bị ảnh hưởng" |
| Sửa đồng thời | "Bài vừa được {người} cập nhật — tải lại để xem bản mới nhất" |
| Empty state chọn câu | "Chưa có câu đã duyệt nào — soạn câu trong ngân hàng hoặc sinh câu từ tài liệu" |
| Empty state danh sách bài | "Chưa có bài đánh giá nào — tạo bài mới hoặc tạo từ mẫu" |
| Provenance bài | "Tạo bởi {người} · từ mẫu \"{tên}\" · phát hành {thời điểm} · {n} câu hỏi" |

## 8. Assumptions

- Phát hành bài là quyền nghiệp vụ của author (HR/interviewer được cấp)
  và không bắt buộc approver thứ hai trong v1 — rào chắn là checklist
  bắt buộc + preview + chỉ câu "Đã duyệt" (đề xuất — xem OQ-1).
- Sửa sau phát hành chỉ cho field không ảnh hưởng đề; mọi thay đổi đề sau
  phát hành đi qua nhân bản — bảo đảm snapshot bất biến theo PRD Mục 7.22.
- Link phát hành bắt buộc có hạn + giới hạn lượt + thu hồi được; token là
  duy nhất và giờ server là chuẩn đối chiếu hạn (align contract
  `candidate-assessment`).
- Chính sách người làm bài xem kết quả do author công bố trên bài; mặc
  định an toàn là "chỉ biên nhận" (liên quan OQ-AS-03 reverse spec).
- Vị trí/JD mục tiêu chọn từ danh mục vị trí của tổ chức
  (`recruitment-planning`), không nhập tự do — đồng bộ cách gán với
  `assessment-templates`.
- Câu trong đề tham chiếu `QUESTION_VERSION` bất biến — cùng mô hình
  snapshot của `question-bank`; bài đã phát hành không bị ảnh hưởng khi
  câu có phiên bản mới.
- Các giới hạn số ở Mục 7.2 là giá trị đề xuất (nguồn chứng minh test CRUD
  + share token nhưng chưa chốt ngưỡng) — cần owner xác nhận (xem OQ-3).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Bài không đo đúng job/level (rủi ro chính PRD) | thỉnh thoảng | kết quả đánh giá vô nghĩa, phải hủy bài và xin ứng viên làm lại — mất uy tín | mục tiêu (vị trí/trình độ) bắt buộc; preview + checklist trước phát hành; gợi ý câu theo mục tiêu |
| Câu lỗi/ngừng dùng lọt vào bài phát hành | thỉnh thoảng | ứng viên làm câu sai, tranh chấp kết quả | chỉ câu "Đã duyệt" được chọn; chặn phát hành khi có câu ngừng dùng; cảnh báo phiên bản mới |
| Link bị chia sẻ ngoài đối tượng/lạm dụng | thường | người không được mời làm bài, kết quả nhiễu, phải hủy attempt | hạn + giới hạn lượt + thu hồi kèm lý do; audit link; vá GAP-AS-03/OQ-AS-01 |
| Đề bị sửa ngầm khi đã có người làm | hiếm | hai ứng viên làm hai đề khác nhau — mất công bằng, tranh chấp | snapshot bất biến tại phát hành; đổi đề chỉ qua nhân bản |
| Mẫu lỗi/lỗi thời nhân rộng qua nhiều bài | thỉnh thoảng | hàng loạt bài sai cấu hình cùng lúc | chỉ mẫu "Đã công bố" được chọn; ghi nhận bài-sinh-từ-mẫu để khoanh vùng; cảnh báo mẫu ngừng (liên quan R-11) |
| Đáp án lộ qua preview/link | hiếm | gian lận, bài mất giá trị đo | preview ẩn đáp án; surface phát hành không trả answer key (vá GAP-AS-06) |

## 10. Success Criteria (preliminary)

- Tỷ lệ bài được hoàn tất (có submission hợp lệ) mà không phải hủy do
  cấu hình sai — mục tiêu theo PRD Mục 7.21; con số chờ OQ-2 của PRD.
- 100% bài phát hành chỉ chứa câu "Đã duyệt" và có snapshot phiên bản.
- 100% link phát hành có hạn + giới hạn lượt + trạng thái; 0 sự cố đáp án
  lộ qua preview/link (guardrail bám M-GR-01).
- Tỷ lệ bài tạo từ mẫu — đo mức tái sử dụng (bám `assessment-templates`).

## 11. Open Questions

- [x] OQ-1: Phát hành bài có cần approver thứ hai không? — Resolved (đề
  xuất): v1 không; author tự phát hành sau checklist + preview bắt buộc,
  reviewer thứ hai là cấu hình tùy chọn (P2) — chờ Product owner xác nhận.
- [x] OQ-2: Token/link cần expiry, revocation và attempt limit chính thức
  thế nào (OQ-AS-01)? — Resolved (đề xuất): cả ba bắt buộc — hạn ≤90 ngày,
  giới hạn 1–1.000 lượt, thu hồi kèm lý do — chờ Product owner xác nhận.
- [x] OQ-3: Các giới hạn Mục 7.2 (200 câu, 240 phút, 90 ngày, 1.000 lượt,
  20 link/bài) có làm chuẩn v1 không? — Resolved (đề xuất): dùng làm chuẩn
  draft — chờ Product owner xác nhận.
- [x] OQ-4: Đối tượng "nhân viên" phát hành bằng link public hay giao qua
  tài khoản? — Resolved (đề xuất): mặc định giao qua tài khoản (P1, phối
  hợp `candidate-assessment`); link public vẫn khả dụng khi author chủ
  động chọn — chờ Product owner xác nhận.
- [x] OQ-5: Người làm bài được xem gì sau nộp (OQ-AS-03)? — Resolved (đề
  xuất): author chọn 1 trong 3 mức (chỉ biên nhận / điểm tổng / điểm +
  nhận xét reviewer); mặc định chỉ biên nhận, không bao giờ hiện đáp án
  đúng — chờ Product owner + Head of HR xác nhận.
- [x] OQ-6: Một link nhiều người dùng hay một link một ứng viên? —
  Resolved (đề xuất): v1 link dùng chung có giới hạn lượt cấu hình được;
  link định danh per-candidate là P1 theo `candidate-assessment` — chờ
  Product owner xác nhận.
- [x] OQ-7: Bài đã đóng có được mở lại không? — Resolved (đề xuất): được,
  bởi author/admin kèm lý do + audit; tương đương phát hành lại cùng
  snapshot — chờ Product owner xác nhận.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd assessment-authoring` — capture user perspective
- `/brd assessment-authoring` — business case
- `/prd-epic assessment-authoring` — product scope
