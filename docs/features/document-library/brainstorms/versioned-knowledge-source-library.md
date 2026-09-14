---
type: brainstorm
feature: document-library
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md, docs/features/document-intake/srs/document-intake-spec.md]
---

# Thư viện tài liệu nguồn có phiên bản và provenance — document-library

## 1. Idea Seed

Một thư viện tài liệu nguồn của tổ chức phục vụ sinh kiến thức và câu hỏi:
mỗi tài liệu có metadata, lịch sử phiên bản và trạng thái xử lý rõ ràng;
mỗi phiên bản giữ quan hệ truy nguyên giữa file gốc → text đã trích xuất
và xác nhận → topic → nội dung phát sinh (câu hỏi). Chỉ phiên bản đã duyệt
mới được dùng làm nguồn; khi tài liệu đổi, phiên bản mới phải qua review
của con người trước khi thay thế, và nội dung đã sinh từ bản cũ được đánh
dấu để rà soát — không tự ghi đè, không tự đồng bộ từ ngoài.

## 2. Context

`document-library` thuộc theme Document AI, mức `Should` trong Feature Map
(PRD Mục 7.30) — không nằm trong cam kết v1, là slice mở rộng phục vụ
`ai-question-generation` và `question-bank`. Bài toán: tài liệu nguồn
(quy trình nội bộ, tài liệu đào tạo, khung năng lực) là đầu vào để AI sinh
câu hỏi; nếu không quản lý phiên bản có kiểm soát thì khi tài liệu đổi,
câu hỏi đã sinh vẫn trỏ bản cũ — nội dung lệch chuẩn hiện hành (rủi ro
R-11 của PRD). Nguồn ITBAAI đã triển khai cụm này: `document-sources` có
upload, extraction job, topics, route approve và generate-questions;
topic hỗ trợ merge/split; provenance qua schema riêng; RLS trên document
library (reverse spec `knowledge-and-question-bank`, FR-KB-02..05) — đây
là bằng chứng triển khai, chưa phải bằng chứng nhu cầu. Upload của feature
này đi qua cổng `document-intake` (không đường upload riêng), và text
nguồn dùng được phải là text đã qua xác nhận ở `document-review` — hai
dependency này đã được PRD ghi nhận (phụ thuộc 17, 18).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Content editor (HR phụ trách nội dung) | Tài liệu nguồn nằm rải rác, không biết bản nào đang dùng để sinh câu hỏi | Một thư viện có phiên bản, trạng thái và provenance rõ ràng |
| HR/interviewer soạn câu | Câu hỏi sinh ra từ tài liệu cũ, lệch chuẩn hiện hành | Chọn đúng nguồn đã duyệt, biết khi nào nguồn đổi bản |
| Reviewer/owner nội dung | Tài liệu mới được đưa vào mà không qua kiểm tra | Duyệt phiên bản trước khi phát hành làm nguồn |
| Admin | Không kiểm soát được ai đưa tài liệu vào, ai duyệt | Quyền theo ngữ cảnh + audit đầy đủ |
| `ai-question-generation` (consumer) | Sinh câu từ nguồn không rõ phiên bản → provenance vô nghĩa | Chỉ đọc phiên bản đã duyệt, trỏ đúng version |

## 4. Capabilities Breakdown

### P0 — must have

- Thêm tài liệu nguồn qua cổng `document-intake` với ngữ cảnh "thư viện
  nguồn": metadata bắt buộc (tên, loại, chủ sở hữu nội dung, mô tả).
- Phiên bản tài liệu: mỗi lần thay file tạo phiên bản mới có số thứ tự;
  toàn bộ phiên bản được giữ lại và xem lại được.
- Trạng thái xử lý từng phiên bản: chờ xử lý → đang xử lý → chờ duyệt →
  đã duyệt (hiệu lực) / từ chối / đã thay thế — người dùng luôn biết bản
  nào đang là bản hiệu lực.
- Liên kết text đã trích xuất: phiên bản gắn kết quả trích xuất đã xác
  nhận từ `document-review`; chưa xác nhận thì chưa được đưa lên duyệt.
- Duyệt phiên bản: người có thẩm quyền duyệt/từ chối kèm ghi chú; chỉ một
  phiên bản "đã duyệt" là bản hiệu lực tại một thời điểm — duyệt bản mới
  tự chuyển bản cũ sang "đã thay thế" (không ghi đè, giữ truy vết).
- Topic của phiên bản: gắn/tách topic trên phiên bản đã duyệt; topic giữ
  provenance trỏ về phiên bản nguồn (kể cả sau merge/split — bám business
  rule reverse spec).
- Chọn nguồn cho sinh nội dung: `ai-question-generation` chỉ đọc được
  phiên bản "đã duyệt"; mỗi nội dung sinh ra ghi nhận đúng phiên bản đã
  dùng.
- Cảnh báo drift: khi phiên bản mới được duyệt, nội dung đã sinh từ bản
  cũ được đánh dấu "cần rà soát" (không tự chuyển, không tự mất).
- Tìm kiếm/lọc theo tên, loại, trạng thái, chủ sở hữu, topic.
- Audit: ai thêm, ai duyệt, khi nào, thay phiên bản nào.

### P1 — should have

- So sánh hai phiên bản (diff text đã trích xuất) để reviewer thấy phần
  thay đổi trước khi duyệt bản mới.
- Ngừng dùng tài liệu: ẩn khỏi chọn nguồn nhưng giữ provenance cho nội
  dung đã sinh.
- Phân quyền xem/tải/duyệt theo ngữ cảnh và vai trò (kế thừa RLS của
  reverse spec FR-KB-05).
- Danh sách nội dung phát sinh của một phiên bản (câu hỏi nào sinh từ
  bản này) để rà soát khi có bản mới.

### P2 — nice to have

- Đồng bộ từ nguồn ngoài (drive/link) khi integration được duyệt — PRD
  "Chưa làm": tự đồng bộ thay đổi ngoài hệ thống.
- Gợi ý topic bằng AI trên text đã duyệt (vẫn cần người xác nhận).
- Cảnh báo trùng nội dung giữa các tài liệu nguồn.

## 5. Core Flows (Happy Path)

### 5.1 Thêm nguồn → xử lý → duyệt phiên bản → sẵn sàng dùng

1) Content editor vào thư viện → "Thêm tài liệu nguồn" → chọn file qua
   cổng `document-intake` + nhập metadata (tên, loại, chủ sở hữu).
2) File được xử lý (trích xuất qua `document-review`): phiên bản 1 của
   tài liệu ở trạng thái "đang xử lý" → khi text được xác nhận → "chờ
   duyệt".
3) Reviewer/owner mở phiên bản: xem file gốc + text đã xác nhận + topic
   gợi ý → "Duyệt" hoặc "Từ chối" kèm ghi chú.
4) Được duyệt → phiên bản chuyển "đã duyệt" (hiệu lực), sẵn sàng làm
   nguồn cho `ai-question-generation`.

```
Content editor          document-intake       document-review        document-library          Reviewer
─────────────────────────────────────────────────────────────────────────────────────────────────────────
Thêm tài liệu + metadata
        │
        ▼
   File qua cổng ──▶ kiểm quyền/định dạng
                        │
                        ▼
                   job xử lý ──▶ text + field ──▶ reviewer xác nhận
                        │                              │
                        ▼                              ▼
              Phiên bản 1: "đang xử lý" ──────────▶ "chờ duyệt"
                                                           │
                                                           ▼
                                        ┌────────────────────────────┐
                                        │ Reviewer xem file + text   │
                                        │ đã xác nhận + topic        │
                                        └─────────────┬──────────────┘
                                                      ▼
                                       ── Duyệt? ──┐
                                        │          │
                                      Có ▼      Từ chối ▼
                                 "đã duyệt"    "từ chối" + ghi chú
                                 (bản hiệu lực,  (giữ vết, có thể
                                  dùng làm        nộp bản sửa)
                                  nguồn sinh)
```

### 5.2 Cập nhật tài liệu → phiên bản mới → duyệt thay thế

1) Tài liệu thay đổi → editor tải file mới lên cùng tài liệu → tạo phiên
   bản kế tiếp ở "đang xử lý" (bản hiệu lực cũ vẫn "đã duyệt").
2) Xử lý + xác nhận xong → bản mới "chờ duyệt"; reviewer so sánh với bản
   đang hiệu lực (diff nếu có).
3) Reviewer duyệt bản mới → bản mới "đã duyệt"/hiệu lực, bản cũ chuyển
   "đã thay thế" — không xóa, vẫn xem được.
4) Hệ thống đánh dấu "cần rà soát" trên các nội dung đã sinh từ bản cũ;
   owner nội dung quyết định rà soát/tạo lại — hệ thống không tự chuyển
   câu hỏi sang bản mới.

### 5.3 Chọn nguồn để sinh nội dung

1) Trong `ai-question-generation`, người dùng mở "Chọn tài liệu nguồn" →
   chỉ thấy tài liệu có phiên bản "đã duyệt".
2) Chọn tài liệu → hệ thống khóa tham chiếu vào đúng phiên bản hiệu lực
   tại thời điểm chọn.
3) Nội dung sinh ra ghi nhận (tài liệu, phiên bản) — truy nguyên được từ
   câu hỏi về nguồn và ngược lại.

### 5.4 Gắn và quản lý topic của phiên bản

1) Trên phiên bản đã duyệt, editor gắn topic (từ gợi ý trích xuất hoặc
   tự thêm).
2) Topic trùng/lệch → gộp (merge) hoặc tách (split); mọi thao tác giữ
   vết nguồn — topic sau merge/split vẫn truy nguyên về phiên bản gốc.
3) Topic được dùng để lọc khi chọn nguồn và gom phạm vi sinh câu hỏi.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | File qua intake được xử lý + text đã xác nhận? | Phiên bản → "chờ duyệt" | Giữ "đang xử lý"; lỗi → "thất bại" kèm lý do |
| D2 | 5.1/5.2 | Reviewer đồng ý duyệt phiên bản? | "đã duyệt" hiệu lực; nếu có bản hiệu lực cũ → bản cũ "đã thay thế" + đánh dấu nội dung phát sinh "cần rà soát" | "từ chối" + ghi chú bắt buộc |
| D3 | 5.2 | File mới khác nội dung bản hiệu lực? | Tạo phiên bản mới | Cảnh báo trùng nội dung, hỏi có tạo phiên bản không |
| D4 | 5.3 | Phiên bản được chọn còn "đã duyệt" tại thời điểm sinh? | Cho sinh nội dung, khóa tham chiếu phiên bản | Chặn + báo phiên bản đã bị thay thế/ngừng |
| D5 | 5.4 | Topic mới trùng topic đã có? | Cảnh báo + gợi ý merge | Cho tạo topic mới |
| D6 | tất cả | Người dùng có quyền trên ngữ cảnh thư viện? | Cho thao tác theo vai trò | Từ chối, deny by default |
| D7 | 5.2 | Tài liệu đang có nội dung phát sinh "cần rà soát"? | Cho thao tác bình thường, hiện nhãn cảnh báo trên tài liệu | — |
| D8 | 5.1 | Ngừng dùng tài liệu có nội dung phát sinh đang dùng? | Chặn xóa, chỉ "ngừng dùng" + cảnh báo trên nội dung phát sinh | Tài liệu chưa có nội dung phát sinh → cho ngừng/xóa theo quyền |

### 6.2 Scenario Matrix

| Vai trò | Phiên bản đang xử lý | Phiên bản chờ duyệt | Phiên bản đã duyệt | Phiên bản thay thế/từ chối | Tài liệu ngừng dùng |
|---|---|---|---|---|---|
| Content editor (owner) | xem, theo dõi | xem, sửa metadata, rút nộp | xem, tải bản mới | xem | xem lịch sử |
| Reviewer/owner nội dung | xem | xem + duyệt/từ chối | xem | xem | xem/khôi phục |
| HR/interviewer (consumer) | — | — | chọn làm nguồn | xem (để đối chiếu provenance) | — |
| Admin | xem | xem + duyệt | xem/ngừng dùng | xem | xem/khôi phục |

### 6.3 State Transitions

```
phiên bản tài liệu nguồn:
  đang-xử-lý → chờ-duyệt → đã-duyệt → đã-thay-thế
      │           │           │
      ▼           ▼           ▼
   thất-bại   từ-chối     ngừng-dùng (khi tài liệu ngừng)
      │           │
      └─ retry ───┘ (nộp bản sửa → chờ-duyệt)
tài liệu nguồn: hoạt-động → ngừng-dùng → (khôi phục) → hoạt-động
nội dung phát sinh: hợp-lệ → cần-rà-soát (khi nguồn bị thay thế) → hợp-lệ (sau rà soát)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| phiên bản | — | đang-xử-lý | file được intake nhận cho tài liệu nguồn | — |
| phiên bản | đang-xử-lý | chờ-duyệt | text trích xuất được xác nhận (document-review) | — |
| phiên bản | đang-xử-lý | thất-bại | job xử lý lỗi hết retry | có (xử lý lại) |
| phiên bản | chờ-duyệt | đã-duyệt | reviewer duyệt | không |
| phiên bản | chờ-duyệt | từ-chối | reviewer từ chối kèm ghi chú | có (nộp bản sửa → chờ-duyệt) |
| phiên bản | đã-duyệt | đã-thay-thế | phiên bản mới của cùng tài liệu được duyệt | không |
| phiên bản | đã-duyệt | ngừng-dùng | tài liệu bị ngừng dùng | có (khôi phục tài liệu) |
| tài liệu | hoạt-động | ngừng-dùng | người có quyền đánh dấu kèm lý do | có (khôi phục) |
| nội dung phát sinh | hợp-lệ | cần-rà-soát | phiên bản nguồn bị thay thế | có (sau khi owner rà soát) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Xử lý file bị ngắt giữa chừng | phiên bản "đang-xử-lý", job có trạng thái ở intake | theo retry của document-intake/document-review | job thất bại cuối → phiên bản "thất-bại" |
| Reviewer đóng giữa lúc duyệt | phiên bản "chờ-duyệt" | mở lại duyệt tiếp | — |
| Hai phiên bản mới chờ duyệt cùng lúc | cả hai ở "chờ-duyệt" | duyệt bản mới nhất → bản kia tự hết ý nghĩa, chuyển "từ-chối/lạc hậu" kèm ghi chú hệ thống | reviewer được cảnh báo khi duyệt bản không mới nhất |
| Người khác tải phiên bản mới trong khi reviewer đang xem bản chờ duyệt | reviewer đang xem bản cũ | khi bấm duyệt → cảnh báo có phiên bản mới hơn chờ duyệt | — |
| Tài liệu bị ngừng dùng trong lúc phiên bản đang xử lý | phiên bản xử lý tiếp nhưng không thể "đã duyệt" | khi khôi phục tài liệu → tiếp tục chờ duyệt | — |

### 6.5 Other Edge Cases

- File mới trùng nội dung bản hiệu lực: cảnh báo trùng, hỏi có thật sự
  tạo phiên bản mới (tránh rác phiên bản).
- Tài liệu nguồn không cần OCR (file text thuần): vẫn qua cùng pipeline
  — "trích xuất" là đọc trực tiếp, vẫn cần xác nhận trước khi chờ duyệt.
- Phiên bản bị từ chối nhiều lần: giữ toàn bộ lịch sử; editor có thể rút
  nộp để sửa file nguồn rồi tải phiên bản khác.
- Nội dung phát sinh "cần rà soát" tồn tại lâu: tài liệu hiện nhãn cảnh
  báo để owner chủ động xử lý; không tự động vô hiệu câu hỏi.
- Tài liệu được dùng làm nguồn bởi nhiều đợt sinh khác nhau ở các phiên
  bản khác nhau: mỗi nội dung phát sinh trỏ đúng phiên bản của nó —
  không gom về bản mới nhất.
- Empty state: thư viện trống → gợi ý thêm tài liệu nguồn đầu tiên.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên tài liệu nguồn | bắt buộc, không rỗng, tối đa 200 ký tự, duy nhất trong thư viện của tổ chức (cảnh báo khi trùng) |
| Loại tài liệu nguồn | bắt buộc, chọn từ danh sách đã công bố (quy trình, đào tạo, khung năng lực, khác) |
| Chủ sở hữu nội dung | bắt buộc, là người dùng nội bộ còn hiệu lực |
| File phiên bản | qua cổng document-intake: whitelist + giới hạn của intake; tài liệu nguồn chấp nhận thêm định dạng text/markdown |
| Ghi chú khi từ chối duyệt | bắt buộc, tối đa 500 ký tự |
| Lý do ngừng dùng | bắt buộc, tối đa 500 ký tự |
| Topic trên phiên bản | tùy chọn, tối đa 20 topic mỗi phiên bản (đề xuất) |
| Duyệt phiên bản | chỉ phiên bản "chờ-duyệt" mới được duyệt/từ chối; duyệt phải là phiên bản mới nhất chờ duyệt hoặc có xác nhận khi duyệt bản cũ hơn |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số phiên bản giữ mỗi tài liệu | không giới hạn | — | — (audit) |
| Số topic mỗi phiên bản | 20 | — | chặn gán thêm (đề xuất — OQ-4) |
| Kết quả tìm kiếm thư viện | 50 tài liệu/trang | — | phân trang |
| Nhắc nội dung "cần rà soát" | 7 ngày | mỗi nội dung | nhắc owner nội dung (đề xuất — OQ-5) |
| Kích thước file nguồn | theo giới hạn document-intake (đề xuất 20 MB) | mỗi file | theo hành vi của intake |
| Số phiên bản "chờ-duyệt" đồng thời/tài liệu | không giới hạn cứng | — | cảnh báo khi duyệt bản không mới nhất |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thiếu metadata khi thêm tài liệu | "Vui lòng điền đủ tên, loại và chủ sở hữu nội dung trước khi thêm tài liệu" | E-? |
| Duyệt phiên bản không mới nhất | "Đã có phiên bản {n} mới hơn đang chờ duyệt — xác nhận duyệt phiên bản {m} này?" | E-? |
| Từ chối không ghi chú | "Vui lòng ghi rõ lý do từ chối để người đăng biết cần sửa gì" | E-? |
| Chọn nguồn chưa duyệt | "Tài liệu này chưa có phiên bản đã duyệt — chỉ phiên bản đã duyệt mới dùng làm nguồn" | E-? |
| Xóa tài liệu có nội dung phát sinh | "Tài liệu đã được dùng để sinh nội dung — chỉ có thể ngừng dùng" | E-? |
| File trùng nội dung bản hiệu lực | "File tải lên giống nội dung phiên bản {n} đang dùng — xác nhận tạo phiên bản mới?" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Thêm tài liệu | "Đã thêm \"{tên}\" vào thư viện — phiên bản 1 đang được xử lý" |
| Duyệt phiên bản | "Phiên bản {n} đã được duyệt và là bản hiệu lực của \"{tên}\"" |
| Tải phiên bản mới | "Đã nhận file — phiên bản {n} đang được xử lý, bản hiệu lực vẫn là {m}" |
| Ngừng dùng | "\"{tên}\" đã ngừng dùng — nội dung đã sinh trước đó không bị ảnh hưởng" |
| Rà soát xong nội dung | "Đã đánh dấu {n} nội dung là đã rà soát theo phiên bản mới" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Nội dung cần rà soát | "{n} nội dung đã sinh từ phiên bản {m} — bản này đã bị thay thế, cần rà soát" |
| Phiên bản đang xử lý | "Phiên bản {n} đang được trích xuất — sẽ chuyển chờ duyệt khi text được xác nhận" |
| Empty state | "Chưa có tài liệu nguồn nào — thêm tài liệu đầu tiên để bắt đầu" |
| Provenance nội dung | "Nội dung này sinh từ \"{tài liệu}\" phiên bản {n} (duyệt bởi {người} lúc {thời điểm})" |
| Bản đã thay thế | "Phiên bản {n} đã bị thay thế bởi phiên bản {m} — chỉ xem để đối chiếu" |

## 8. Assumptions

- Upload tài liệu nguồn đi qua `document-intake` với `context_type` thư
  viện nguồn; feature này không có đường upload riêng (bám
  BR-document-intake-009).
- Text dùng để sinh nội dung phải là text đã xác nhận ở `document-review`
  — provenance yêu cầu cả mắt xích "đã kiểm chứng", không dùng output
  máy trực tiếp.
- "Duyệt phiên bản" là quyết định nghiệp vụ của owner nội dung/HR lead,
  được gán quyền qua `org-governance` — approval authority cần owner
  chốt (GAP-KB-02, OQ-KB-01 của reverse spec).
- Khi phiên bản mới được duyệt, nội dung phát sinh từ bản cũ chỉ bị đánh
  dấu "cần rà soát", KHÔNG tự chuyển/tự vô hiệu — đây là đáp án đề xuất
  cho OQ-9 của PRD (tài liệu đổi → owner review trước khi phát hành lại,
  không tự sync) và bám "Chưa làm: tự ghi đè bản đã duyệt".
- Chỉ một phiên bản "đã duyệt" hiệu lực tại một thời điểm mỗi tài liệu;
  các phiên bản cũ giữ nguyên để truy vết.
- Nội dung phát sinh (câu hỏi) nằm ở `question-bank`/`ai-question-
  generation`; feature này chỉ giữ tham chiếu provenance hai chiều.
- Giới hạn topic/phiên bản ở Mục 7.2 là đề xuất — nguồn chứng minh merge/
  split và provenance tồn tại nhưng chưa chốt ngưỡng.
- Retention file gốc và phiên bản cũ gắn theo chính sách retention
  chung của tài liệu (OQ-6 sản phẩm, OQ-KB-02).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Bản cũ tiếp tục sinh câu hỏi sau khi tài liệu đổi (R-11 PRD) | thường | câu hỏi lệch chuẩn tài liệu hiện hành, bài đánh giá sai | chỉ bản "đã duyệt" được chọn; khóa tham chiếu phiên bản khi sinh; đánh dấu "cần rà soát" khi thay thế |
| Phiên bản được duyệt qua loa (không ai đọc diff) | thỉnh thoảng | nội dung sai trở thành nguồn chính thức | chỉ reviewer được cấp mới duyệt; ghi chú từ chối bắt buộc; diff giữa phiên bản (P1) |
| Tài liệu nguồn bị xóa/ngừng trong khi câu hỏi còn dùng | thỉnh thoảng | mất provenance, không giải thích được câu hỏi từ đâu | chặn xóa khi có nội dung phát sinh; ngừng dùng vẫn giữ bản ghi |
| Nhiều phiên bản chờ duyệt chồng nhau, duyệt nhầm bản cũ | thỉnh thoảng | phát hành nội dung đã lạc hậu | cảnh báo khi duyệt bản không mới nhất |
| Topic merge/split làm mất trace về nguồn | thỉnh thoảng | không truy nguyên được câu sinh từ phần nào của tài liệu | provenance topic → phiên bản là bất biến (business rule reverse spec) |
| Upload vượt kiểm soát (bỏ qua intake) | hiếm | file độc hại/sai quyền vào thư viện | mọi file qua cổng document-intake, không đường riêng |
| Retention cascade của file gốc chưa rõ (OQ-KB-02) | thỉnh thoảng | xóa file gốc làm hỏng provenance phiên bản đã dùng | chính sách retention gắn vòng đời tài liệu — chờ OQ-6 sản phẩm |

## 10. Success Criteria (preliminary)

- Tỷ lệ nội dung sinh ra trỏ đúng phiên bản nguồn đã duyệt tại thời điểm
  sinh — theo PRD Mục 7.30; mục tiêu 100% (điều kiện tiên quyết, không
  phải target cải thiện).
- 100% phiên bản "đã duyệt" có reviewer + ghi nhận thời điểm duyệt.
- 0 nội dung phát sinh nào tồn tại mà không có tham chiếu phiên bản.
- Thời gian từ "chờ-duyệt" đến quyết định duyệt — đề xuất ≤3 ngày làm
  việc (chờ OQ-5).

## 11. Open Questions

- [x] OQ-1: Ai là reviewer được duyệt phiên bản tài liệu nguồn —
  Resolved (đề xuất): owner nội dung/HR lead được gán quyền qua
  org-governance — chờ Head of HR xác nhận (OQ-KB-01, GAP-KB-02).
- [x] OQ-2: Tài liệu đổi thì tự sync hay owner review trước khi phát
  hành lại (OQ-9 PRD) — Resolved (đề xuất): phiên bản mới phải qua duyệt
  của con người; nội dung phát sinh bản cũ chỉ bị đánh dấu "cần rà soát",
  không tự chuyển — chờ Technical/Operations owner xác nhận.
- [x] OQ-3: Retention/deletion cascade của file gốc, phiên bản cũ và
  nội dung phát sinh — Resolved (đề xuất): gắn vòng đời retention tài
  liệu chung; phiên bản đã được nội dung phát sinh tham chiếu không xóa
  hẳn — chờ DPO/legal (OQ-KB-02, OQ-6 PRD).
- [x] OQ-4: Giới hạn topic mỗi phiên bản và ngưỡng cảnh báo trùng —
  Resolved (đề xuất): 20 topic/phiên bản; trùng nội dung file chỉ cảnh
  báo xác nhận — chờ Document AI owner xác nhận.
- [x] OQ-5: SLA duyệt phiên bản và chu kỳ nhắc "cần rà soát" — Resolved
  (đề xuất): duyệt trong ≤3 ngày làm việc, nhắc rà soát sau 7 ngày —
  chờ Operations owner xác nhận.
- [x] OQ-6: Nội dung phát sinh "cần rà soát" có tự vô hiệu sau thời hạn
  không — Resolved (đề xuất): không tự vô hiệu; chỉ hiện cảnh báo, owner
  nội dung quyết định (human-in-the-loop) — chờ Knowledge owner xác nhận.
- [~] OQ-7: Đồng bộ tài liệu từ nguồn ngoài (drive/link) — Out of scope
  v1: PRD "Chưa làm" (tự đồng bộ thay đổi ngoài hệ thống); chờ
  external-integrations được chọn provider.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd document-library` — capture user perspective
- `/brd document-library` — business case
- `/prd-epic document-library` — product scope
