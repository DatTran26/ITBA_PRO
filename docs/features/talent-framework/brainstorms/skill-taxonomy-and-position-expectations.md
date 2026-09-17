---
type: brainstorm
feature: talent-framework
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/_reverse/talent-and-crm/reverse-spec.md, docs/_reverse/talent-and-crm/erd.md]
---

# Khung kỹ năng và kỳ vọng vị trí thống nhất — talent-framework

## 1. Idea Seed

Chuẩn hoá danh mục kỹ năng, nhóm kỹ năng, thang cấp độ và mức kỳ vọng theo
vị trí để recruitment, assessment và phát triển nhân viên dùng chung một
ngôn ngữ năng lực. Mỗi kỹ năng có thang level riêng được định nghĩa; mỗi vị
trí có khung kỳ vọng gồm kỹ năng + level yêu cầu + cờ bắt buộc. Mọi phần của
khung phải qua review của business owner trước khi công bố làm chuẩn chung.

## 2. Context

Hiện mỗi module tự nói về "năng lực" theo cách riêng: JD tuyển dụng ghi yêu
cầu dạng text tự do, bài đánh giá gắn câu hỏi theo topic lỏng lẻo, hồ sơ
nhân viên ghi kỹ năng không thống nhất tên gọi lẫn mức độ. Hậu quả: không so
sánh được ứng viên với vị trí, không nói được nhân viên đang ở mức nào so
với kỳ vọng, và phân tích khoảng trống kỹ năng (`skill-gap-analysis`) không
có chuẩn để đo. Nguồn hiện có đã có quan hệ persons–positions–skills–
requirements–evaluations, cho thấy mô hình dữ liệu nền đã đúng hướng nhưng
chưa có governance: ai tạo, ai duyệt, khi nào một kỹ năng/level trở thành
chuẩn. Feature này là phụ thuộc đầu vào cho `employee-evaluation` (đánh giá
theo khung đã duyệt) và `skill-gap-analysis` (so sánh với kỳ vọng đã công
bố), đồng thời cho `question-bank`/`assessment-authoring` gắn câu hỏi/bài
theo kỹ năng chuẩn.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Mỗi vị trí/JD tự viết yêu cầu kỹ năng, không trùng tên gọi lẫn mức độ | Một taxonomy chuẩn để chọn khi soạn JD, bài test, khung vị trí |
| Quản lý | Không có căn cứ chung để nói "vị trí này cần gì, ở mức nào" với team | Khung kỳ vọng vị trí đã duyệt, rõ level yêu cầu và kỹ năng bắt buộc |
| Business owner (vd Head of HR) | Taxonomy/level do từng người tự đặt, không ai chịu trách nhiệm chất lượng | Quyền duyệt/công bố khung trước khi thành chuẩn chung |
| Admin | Danh mục rời rạc, kỹ năng trùng tên, không truy vết được ai đổi gì | Cấu hình có kiểm soát + audit mọi thay đổi khung |
| Interviewer / người tạo bài đánh giá | Gắn câu hỏi vào "kỹ năng" không biết đúng chuẩn không | Chọn từ danh mục kỹ năng đã công bố |
| Nhân viên | Không biết vị trí của mình kỳ vọng những kỹ năng nào | Xem khung kỳ vọng của vị trí mình (chỉ đọc) |

## 4. Capabilities Breakdown

### P0 — must have

- Danh mục kỹ năng 2 tầng: nhóm kỹ năng (category) → kỹ năng. Tạo/sửa kỹ
  năng với tên, mô tả, category; kiểm tra trùng/gần giống trước khi lưu.
- Thang level cho kỹ năng: mỗi kỹ năng dùng thang level chung của tổ chức
  (đề xuất 5 mức — chờ duyệt, xem OQ-2), kèm mô tả hành vi mong đợi từng
  mức.
- Khung kỳ vọng vị trí: gắn kỹ năng vào vị trí kèm level yêu cầu và cờ
  "bắt buộc"; mỗi vị trí có 1 khung đang hiệu lực.
- Vòng đời có duyệt: kỹ năng và khung vị trí đều đi qua bản-nháp → chờ-duyệt
  → đã-công-bố → ngừng-dùng; chỉ bản "đã công bố" mới được các module khác
  tham chiếu làm chuẩn.
- Business owner bắt buộc: mỗi vị trí phải có owner chịu trách nhiệm khung;
  không có owner thì không công bố được khung cho vị trí đó.
- Kỹ năng/khung đang được tham chiếu (yêu cầu vị trí khác, kỹ năng nhân
  viên, câu hỏi, bài đánh giá) → chỉ được "ngừng dùng", không xoá; tham
  chiếu cũ giữ nguyên hiển thị.
- Phân quyền theo organization/role/data-scope; audit đầy đủ ai tạo/sửa/
  duyệt/ngừng dùng.
- Nhân viên xem khung kỳ vọng của vị trí mình (chỉ đọc, bản đã công bố).

### P1 — should have

- Nhập taxonomy ban đầu từ danh sách (import CSV/file) thay vì tạo tay từng
  kỹ năng.
- Nhân bản khung vị trí từ vị trí tương tự để chỉnh nhanh.
- Cảnh báo kỹ năng gần giống khi tạo mới (gợi ý dùng kỹ năng có sẵn).
- Lịch sử thay đổi khung vị trí (ai đổi, đổi gì, khi nào, qua duyệt nào).
- Đề xuất kỹ năng từ quản lý: quản lý gửi đề xuất, HR/business owner duyệt
  thành kỹ năng chuẩn thay vì chỉ HR tự tạo.

### P2 — nice to have

- AI gợi ý kỹ năng/level từ JD hoặc tài liệu mô tả vị trí (vẫn qua review
  của con người trước khi vào khung).
- So sánh khung giữa hai vị trí.
- Thư viện khung theo ngành/chức danh phổ biến làm điểm khởi đầu.

## 5. Core Flows (Happy Path)

### 5.1 Tạo kỹ năng → duyệt → công bố vào taxonomy

1) HR vào "Khung kỹ năng" → "Thêm kỹ năng" → điền tên, category, mô tả và
   mô tả hành vi từng level trên thang chung.
2) Hệ thống kiểm tra trùng/gần giống tên trong taxonomy: có kỹ năng tương
   tự → hiện gợi ý "đã có {tên}" để HR chọn dùng sẵn hoặc vẫn tạo mới.
3) HR gửi duyệt → kỹ năng chuyển "Chờ duyệt" tới business owner.
4) Business owner mở kỹ năng chờ duyệt → kiểm tên/mô tả/level → "Công bố"
   hoặc "Yêu cầu chỉnh" kèm ghi chú.
5) Kỹ năng "Đã công bố" hiện trong danh mục chuẩn; các module khác (JD,
   câu hỏi, khung vị trí, đánh giá) chỉ chọn được kỹ năng ở trạng thái này.

### 5.2 Định nghĩa khung kỳ vọng cho vị trí

1) HR/quản lý mở vị trí → tab "Khung kỳ vọng" → "Thêm kỹ năng yêu cầu".
2) Chọn kỹ năng từ danh mục đã công bố → chọn level yêu cầu → đánh dấu
   "bắt buộc" nếu là kỹ năng không-thể-thiếu của vị trí.
3) Lặp cho đủ bộ kỹ năng → hệ thống kiểm tra: vị trí đã có business owner
   chưa, khung có ít nhất 1 kỹ năng, không trùng kỹ năng trong khung.
4) Gửi duyệt → business owner của vị trí xem toàn khung → "Công bố" hoặc
   "Yêu cầu chỉnh".
5) Khung "Đã công bố" trở thành chuẩn để recruitment soạn JD, assessment
   gắn bài, và `skill-gap-analysis` đo coverage; nhân viên giữ vị trí xem
   được khung của mình.

```
Người soạn (HR/quản lý)        Hệ thống                    Business owner
──────────────────────────────────────────────────────────────────────────

A. KỸ NĂNG VÀO TAXONOMY
Thêm kỹ năng: tên, category,
mô tả + hành vi từng level
        │
        ▼
── Tên trùng/gần giống kỹ năng đã có? ──┐
   │                                   │
  Có ▶ gợi ý "đã có {tên}"            │
   │   ├─ dùng sẵn → kết thúc         │
   │   └─ vẫn tạo mới (ghi nhận       │
   │      kỹ năng tương tự)           │
  Không ▼                             │
┌──────────────────────┐              │
│ Kỹ năng: chờ-duyệt   │─────────────▶│
└──────────────────────┘              ▼
                          ── Owner đồng ý công bố? ──┐
                            │                        │
                          Có ▼                      Không ▼
                    Đã-công-bố (chuẩn,         Ở chờ-duyệt
                     module khác chọn           + ghi chú yêu cầu chỉnh
                     được)                            │
                            │                   người soạn sửa → gửi lại
                            ▼
B. KHUNG KỲ VỌNG VỊ TRÍ
Chọn vị trí → gắn kỹ năng đã công bố
+ level yêu cầu + cờ "bắt buộc"
        │
        ▼
── Vị trí đã có business owner ──▶ chưa có ▶ chặn: "gán owner trước"
   và khung hợp lệ (≥1 kỹ năng,              khi công bố
   không trùng kỹ năng)?
        │ hợp lệ
        ▼
┌──────────────────────┐              ┌──────────────────────────────┐
│ Khung vị trí:        │─────────────▶│ Owner duyệt toàn khung →     │
│ chờ-duyệt            │              │ Công bố / Yêu cầu chỉnh      │
└──────────────────────┘              └──────────────┬───────────────┘
                                                     ▼
                                        Đã-công-bố = chuẩn cho
                                        JD / assessment / gap analysis;
                                        nhân viên giữ vị trí xem được

Kỹ năng/khung đang được tham chiếu ──▶ chỉ "Ngừng dùng", không xoá;
 tham chiếu cũ (JD, bài test, kỹ năng nhân viên) giữ nguyên.
```

### 5.3 Sửa khung đã công bố và ngừng dùng

1) Sửa kỹ năng đã công bố: sửa mô tả/level → quay về "Chờ duyệt" để owner
   duyệt lại trước khi bản mới thành chuẩn; bản đang công bố vẫn được dùng
   trong lúc chờ.
2) Sửa khung vị trí: thêm/bớt kỹ năng, đổi level yêu cầu, đổi cờ bắt buộc
   → bản chỉnh đi qua duyệt lại; khi bản mới công bố thì thay bản cũ làm
   chuẩn hiệu lực.
3) Kỹ năng sai/thừa → "Ngừng dùng": ẩn khỏi danh mục chọn, chặn gán mới;
   mọi tham chiếu cũ (khung vị trí, kỹ năng nhân viên, câu hỏi, bài test)
   giữ nguyên và hiển thị nhãn "đã ngừng dùng".
4) Khung vị trí ngừng dùng → vị trí về trạng thái "chưa có khung hiệu lực"
   cho tới khi khung mới được công bố.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Tên kỹ năng mới trùng/gần giống kỹ năng đã có? | Gợi ý kỹ năng sẵn có; người tạo chọn dùng sẵn hoặc xác nhận tạo mới | Cho tạo thẳng |
| D2 | 5.1/5.2 | Business owner đồng ý công bố? | Chuyển "Đã công bố", thành chuẩn tham chiếu | Giữ "Chờ duyệt" + ghi chú yêu cầu chỉnh |
| D3 | 5.2 | Vị trí đã có business owner? | Cho gửi duyệt/công bố khung | Chặn công bố: "Vị trí chưa có người phụ trách khung kỹ năng" |
| D4 | 5.2 | Khung có trùng kỹ năng hoặc thiếu level yêu cầu? | Chặn gửi duyệt, chỉ rõ dòng lỗi | Cho gửi duyệt |
| D5 | 5.3 | Đối tượng đang được tham chiếu (khung vị trí, kỹ năng nhân viên, câu hỏi, bài test)? | Chỉ cho "Ngừng dùng", không xoá | Cho xoá khi chưa có tham chiếu nào |
| D6 | 5.3 | Sửa nội dung đã công bố? | Bản chỉnh quay về "Chờ duyệt"; bản cũ vẫn là chuẩn tới khi bản mới được duyệt | — (luôn qua duyệt lại) |
| D7 | 5.1 | Người tạo có quyền soạn taxonomy (HR/admin/owner được gán)? | Cho tạo/sửa bản nháp | Từ chối: "Bạn không có quyền chỉnh khung kỹ năng" |

### 6.2 Scenario Matrix

| Vai trò | Đối tượng | Xem | Tạo/sửa nháp | Gửi duyệt | Duyệt/công bố | Ngừng dùng |
|---|---|---|---|---|---|---|
| HR | kỹ năng, khung vị trí trong scope | ✓ | ✓ | ✓ | — | đề xuất |
| Quản lý | khung vị trí team mình | ✓ | ✓ (đề xuất) | ✓ | — | đề xuất |
| Quản lý | khung vị trí ngoài scope | — | — | — | — | — |
| Business owner | kỹ năng + khung thuộc phạm vi phụ trách | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | mọi kỹ năng/khung | ✓ | ✓ | ✓ | ✓ (khi được gán owner) | ✓ |
| Interviewer/người tạo bài | kỹ năng + khung đã công bố | ✓ (chọn để gắn) | — | — | — | — |
| Nhân viên | khung của vị trí mình | ✓ (chỉ đọc) | — | — | — | — |

### 6.3 State Transitions

```
kỹ năng:    bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng
                      ↑      │           │ (sửa → bản chỉnh chờ-duyệt,
                      └──────┘           │  bản cũ vẫn là chuẩn)
                      (yêu cầu chỉnh)    └─→ chờ-duyệt (phục hồi)

khung vị trí: bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng
                                        (mỗi vị trí ≤1 khung đã-công-bố)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| kỹ năng | — | bản-nháp | HR/quản lý tạo nháp | — |
| kỹ năng | bản-nháp | chờ-duyệt | gửi business owner duyệt | — |
| kỹ năng | chờ-duyệt | chờ-duyệt | owner yêu cầu chỉnh → người soạn sửa gửi lại | có |
| kỹ năng | chờ-duyệt | đã-công-bố | owner bấm "Công bố" | — |
| kỹ năng | đã-công-bố | chờ-duyệt | có bản chỉnh sửa mới | có (bản cũ vẫn là chuẩn tới khi bản mới duyệt) |
| kỹ năng | đã-công-bố | ngừng-dùng | owner/admin đánh dấu ngừng | có (phục hồi → chờ-duyệt) |
| kỹ năng | bản-nháp | — (xoá) | xoá khi chưa có tham chiếu | không |
| khung vị trí | bản-nháp | chờ-duyệt | gửi owner của vị trí duyệt | — |
| khung vị trí | chờ-duyệt | đã-công-bố | owner bấm "Công bố" (thay khung hiệu lực cũ nếu có) | — |
| khung vị trí | đã-công-bố | chờ-duyệt | bản chỉnh mới | có (khung cũ vẫn hiệu lực) |
| khung vị trí | đã-công-bố | ngừng-dùng | owner/admin ngừng | có (khung mới → chờ-duyệt) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người soạn đóng trình duyệt giữa form | bản-nháp đã lưu phần đã điền | mở lại tiếp tục soạn | bản-nháp mồ côi giữ nguyên, không tự xoá |
| Đang chờ duyệt mà người soạn sửa tiếp | bản chờ-duyệt cũ | sửa tạo thành bản chờ-duyệt mới thay thế bản đang chờ | — |
| 2 người cùng sửa 1 kỹ năng/khung | bản lưu trước | người lưu sau thấy cảnh báo "{người} vừa cập nhật — tải lại bản mới nhất" | — |
| Rút yêu cầu duyệt đã gửi | — | chờ-duyệt → bản-nháp | — |
| Owner nghỉ việc/vắng khi có yêu cầu chờ duyệt | yêu cầu chờ-duyệt treo | admin gán owner mới → yêu cầu chuyển sang owner mới | cảnh báo "khung không có owner" trên vị trí |

### 6.5 Other Edge Cases

- Vị trí chưa từng có khung: hiển thị "Chưa có khung kỳ vọng" + lối tạo;
  `skill-gap-analysis` không chọn được vị trí này làm chuẩn.
- Kỹ năng bị ngừng dùng trong khi đang nằm trong khung vị trí đã công bố:
  khung vẫn hiệu lực, dòng kỹ năng hiển thị "đã ngừng dùng"; khi sửa khung
  lần sau hệ thống nhắc gỡ/thay dòng đó.
- Đổi tên nhóm kỹ năng (category) đang chứa kỹ năng: cho đổi tên nhưng
  không xoá category còn kỹ năng — phải chuyển kỹ năng sang category khác
  trước.
- Owner duyệt nội dung do chính mình soạn: được phép nhưng audit ghi nhận
  "tự duyệt" để rà soát (đề xuất — chờ duyệt, xem OQ-4).
- Empty state: chưa có kỹ năng nào → "Chưa có kỹ năng nào trong khung —
  tạo kỹ năng đầu tiên hoặc nhập từ danh sách".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên kỹ năng | bắt buộc, không trùng toàn taxonomy (không phân biệt hoa thường); tối đa 100 ký tự (đề xuất — chờ duyệt) |
| Category | bắt buộc, chọn từ danh mục nhóm kỹ năng của tổ chức |
| Mô tả level | bắt buộc mô tả hành vi cho từng mức trên thang chung trước khi gửi duyệt |
| Level yêu cầu trong khung vị trí | bắt buộc; một mức trong thang chung của kỹ năng đó |
| Cờ "bắt buộc" | tùy chọn; mặc định không bắt buộc |
| Khung vị trí | ≥1 kỹ năng, không trùng kỹ năng, vị trí phải có business owner trước khi công bố |
| Ghi chú "Yêu cầu chỉnh" | bắt buộc khi owner từ chối công bố |
| Tham chiếu | kỹ năng/khung đang được dùng → cấm xoá, chỉ ngừng dùng |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Thang level chung | 5 mức (đề xuất — chờ duyệt, OQ-2) | — | dùng chung cho mọi kỹ năng, không tự thêm mức riêng |
| Số kỹ năng trong taxonomy | 500 (đề xuất — chờ duyệt) | — | chặn tạo mới + gợi ý rà soát/ngừng dùng kỹ năng thừa |
| Số kỹ năng trong 1 khung vị trí | 30 (đề xuất — chờ duyệt) | — | chặn thêm + gợi ý gom nhóm |
| Số nhóm kỹ năng (category) | 50 (đề xuất — chờ duyệt) | — | chặn tạo category mới |
| Khung hiệu lực mỗi vị trí | 1 | — | công bố khung mới thay khung cũ |
| Yêu cầu duyệt đang chờ mỗi owner | không giới hạn cứng; cảnh báo khi >20 (đề xuất — chờ duyệt) | — | hiện cảnh báo trên danh sách chờ duyệt |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Trùng tên kỹ năng | "Đã có kỹ năng \"{tên}\" trong khung — chọn tên khác hoặc dùng kỹ năng sẵn có" | E-? |
| Kỹ năng gần giống | "Có kỹ năng tương tự: {tên} — bạn có thể dùng kỹ năng này thay vì tạo mới" | E-? |
| Vị trí chưa có owner | "Vị trí này chưa có người phụ trách khung kỹ năng — gán người phụ trách trước khi công bố" | E-? |
| Khung trùng kỹ năng/thiếu level | "Khung chưa hợp lệ: {lý do cụ thể từng dòng}" | E-? |
| Xoá kỹ năng đang được dùng | "Kỹ năng này đang được dùng ở {số} nơi — chỉ có thể ngừng dùng, không xoá" | E-? |
| Không có quyền | "Bạn không có quyền chỉnh khung kỹ năng" | E-? |
| Không lưu được | "Không lưu được thay đổi — thử lại sau" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi duyệt kỹ năng | "Đã gửi kỹ năng \"{tên}\" cho {owner} duyệt" |
| Công bố kỹ năng | "Kỹ năng \"{tên}\" đã được công bố vào khung chung" |
| Công bố khung vị trí | "Khung kỳ vọng cho vị trí {vị trí} đã được công bố" |
| Ngừng dùng | "\"{tên}\" đã ngừng dùng — các nơi đang dùng không bị ảnh hưởng" |
| Lưu nháp | "Đã lưu bản nháp" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang chờ duyệt | "\"{tên}\" đang chờ {owner} duyệt" |
| Owner yêu cầu chỉnh | "\"{tên}\" cần chỉnh: {ghi chú của người duyệt}" |
| Kỹ năng đã ngừng trong khung cũ | "Kỹ năng này đã ngừng dùng — nên gỡ hoặc thay khi cập nhật khung" |
| Bị sửa đồng thời | "\"{tên}\" vừa được {người} cập nhật — tải lại để xem bản mới nhất" |
| Vị trí chưa có khung | "Vị trí này chưa có khung kỳ vọng" |
| Empty state taxonomy | "Chưa có kỹ năng nào trong khung — tạo kỹ năng đầu tiên hoặc nhập từ danh sách" |
| Nhãn trên tham chiếu cũ | "đã ngừng dùng" (hiển thị cạnh kỹ năng trong khung/JD/bài test cũ) |

## 8. Assumptions

- Taxonomy là chung cho toàn tổ chức (1 tenant = 1 khung), không có khung
  riêng từng phòng ban — khác biệt giữa phòng thể hiện qua khung vị trí.
- Vị trí (position) đã tồn tại từ `employee-profiles`/hồ sơ tổ chức; feature
  này chỉ gắn kỳ vọng lên vị trí, không quản lý vị trí.
- Mỗi vị trí có đúng 1 business owner phụ trách khung; nếu owner thiếu thì
  khung không được công bố — không cho "công bố tạm không owner".
- Chỉ bản "đã công bố" được các module khác tham chiếu làm chuẩn; bản nháp/
  chờ duyệt không lộ ra ngoài vùng soạn.
- Mọi tham chiếu cũ giữ nguyên khi kỹ năng/khung ngừng dùng — lịch sử
  đánh giá, JD, bài test không bị viết lại.
- Kết quả đánh giá năng lực gắn với kỹ năng của taxonomy (level được xác
  nhận trong `employee-evaluation`) — taxonomy là ngôn ngữ chung duy nhất.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Taxonomy trùng/chồng (cùng kỹ năng nhiều tên) | thường | khung vị trí và đánh giá lệch nhau, không so sánh được | kiểm trùng + gợi ý gần giống khi tạo; duyệt trước khi vào chuẩn |
| Kỳ vọng vị trí không có business owner → khung vô chủ | thỉnh thoảng | khung sai được công bố, gap analysis tính trên chuẩn không ai chịu trách nhiệm | chặn công bố khi vị trí chưa có owner; audit người duyệt |
| Khung bị dùng để kết luận lương/thăng chức/kỷ luật | thỉnh thoảng | tranh chấp nhân sự, mất niềm tin, rủi ro pháp lý | invariant: khung chỉ là chuẩn tham chiếu; mọi quyết định nhân sự phải qua con người ngoài feature này — ghi rõ trong wording và phạm vi |
| Thang level đổi sau khi đã dùng rộng | hiếm | level cũ của nhân viên/đánh giá lệch chuẩn | thang level là cấu hình cấp tổ chức có duyệt (OQ-2); đổi thang phải có quy trình migrate riêng |
| Quản lý/người khác tự tạo kỹ năng song song taxonomy | thỉnh thoảng | phân tán, taxonomy mất vai trò chuẩn | chỉ HR/owner được gán mới tạo trực tiếp; quản lý đi qua "đề xuất kỹ năng" |
| Owner duyệt hàng loạt không đọc nội dung | thỉnh thoảng | khung kém chất lượng thành chuẩn chung | owner phải mở từng mục; audit + cảnh báo khi hàng chờ duyệt lớn |

## 10. Success Criteria (preliminary)

- Tỷ lệ vị trí trọng yếu có khung kỹ năng được phê duyệt — định nghĩa "vị
  trí trọng yếu"; định nghĩa và target chờ Product owner xác nhận tại OQ-5.
- 100% kỹ năng/khung đang là chuẩn đều đi qua trạng thái duyệt có owner
  ghi nhận.
- Tỷ lệ kỹ năng trùng/lặp được phát hiện trước khi công bố — đo qua số
  lần gợi ý "đã có" được chấp nhận.
- Các module downstream (`employee-evaluation`, `skill-gap-analysis`,
  `assessment-authoring`) chỉ tham chiếu kỹ năng/khung ở trạng thái đã
  công bố = 100%.

## 11. Open Questions

- [ ] OQ-1: Kế thừa OQ-11 sản phẩm: ai duyệt taxonomy, level, weight và
  threshold kỹ năng — business owner là Head of HR, hay tách owner theo
  mảng kỹ năng/vị trí?
- [ ] OQ-2: Thang level chung là mấy mức và tên gọi từng mức (đề xuất 5
  mức)? Có cho phép thang riêng theo nhóm kỹ năng không?
- [ ] OQ-3: Ai được tạo/sửa kỹ năng trực tiếp — chỉ HR, hay cả quản lý qua
  luồng "đề xuất"? Ai gán business owner cho vị trí?
- [ ] OQ-4: Owner có được tự duyệt nội dung do chính mình soạn không, hay
  bắt buộc người thứ hai?
- [ ] OQ-5: "Vị trí trọng yếu" trong chỉ số thành công định nghĩa thế nào
  và target bao nhiêu %?
- [ ] OQ-6: Giới hạn đề xuất (500 kỹ năng, 30 kỹ năng/khung, 50 category)
  có được duyệt?
- [ ] OQ-7: Khi thang level chung đổi, dữ liệu level cũ của nhân viên và
  khung vị trí migrate thế nào?
- [ ] OQ-8: Kỹ năng đã ngừng dùng có được "phục hồi" về đã-công-bố trực
  tiếp hay bắt buộc qua duyệt lại (hiện đề xuất: qua chờ-duyệt)?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd talent-framework` — capture user perspective
- `/brd talent-framework` — business case
- `/prd-epic talent-framework` — product scope
