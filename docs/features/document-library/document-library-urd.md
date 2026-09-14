---
type: urd
feature: document-library
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/document-library/brainstorms/versioned-knowledge-source-library.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md]
---

# document-library — User Requirements Document

## 1. Purpose

Cho content editor một thư viện tài liệu nguồn có phiên bản và provenance
đầy đủ — từ file gốc qua text đã xác nhận tới topic và nội dung phát sinh —
để việc sinh câu hỏi/kiến thức luôn bám vào bản đã duyệt, và khi tài liệu
đổi thì không nội dung nào âm thầm chạy trên bản cũ. Feature ở mức
`Should` — không thuộc cam kết v1, là slice mở rộng của Document AI.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Content editor | Tài liệu nguồn nằm rải trong ổ đĩa/file cá nhân | Không biết bản nào mới nhất, bản nào đang được dùng để sinh câu hỏi | Sinh nội dung từ bản cũ/lạc hậu, không truy nguyên được | Confirmed — PRD Mục 7.30 (version, trạng thái, quan hệ provenance); Observed: reverse spec `knowledge-and-question-bank` FR-KB-02 |
| HR/interviewer | Câu hỏi được sinh từ tài liệu đã thay đổi | Nội dung lệch chuẩn hiện hành nhưng không có cảnh báo | Bài đánh giá sai nội dung, mất uy tín quy trình | Confirmed — PRD Mục 7.30 (rủi ro chính), R-11 |
| Reviewer/owner nội dung | Không có bước duyệt chính thức cho tài liệu làm nguồn | File chưa kiểm tra cũng được dùng sinh nội dung | Nguồn kém chất lượng lan vào ngân hàng câu hỏi | Assumption — suy từ invariant human-in-the-loop (PRD Mục 12) và route approve của reverse spec FR-KB-02 |
| Admin | Không kiểm soát ai đưa/duyệt tài liệu nguồn | Truy vết thiếu khi có tranh chấp nội dung | Không xác định được trách nhiệm | Confirmed — PRD Mục 9 (audit); Observed: reverse spec FR-KB-05 (RLS) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Content editor (HR phụ trách nội dung) | Duy trì tài liệu nguồn phục vụ sinh kiến thức/câu hỏi | Thư viện có phiên bản rõ, biết bản nào hiệu lực và nội dung nào sinh từ bản nào | Tài liệu rải rác, không version, không provenance |
| secondary | Reviewer/owner nội dung | Được giao duyệt phiên bản trước khi làm nguồn | Hàng chờ duyệt rõ, duyệt/từ chối có ghi nhận | Không có kênh duyệt chính thức |
| secondary | HR/interviewer (consumer) | Chọn tài liệu nguồn khi sinh câu hỏi | Chỉ thấy nguồn đã duyệt, trỏ đúng phiên bản | Chọn nhầm bản cũ |
| secondary | Admin | Kiểm soát quyền và truy vết | Audit đầy đủ, ngừng dùng có kiểm soát | Không truy vết được thay đổi |
| out | `ai-question-generation`, `question-bank` | Đọc nguồn đã duyệt, ghi provenance nội dung phát sinh | Consumer hệ thống, không phải người dùng | — |

## 3. Scope Boundaries

### In Scope

- Thêm tài liệu nguồn qua cổng `document-intake` kèm metadata (tên, loại,
  chủ sở hữu nội dung, mô tả).
- Phiên bản tài liệu có trạng thái xử lý và duyệt; một phiên bản hiệu
  lực duy nhất mỗi tài liệu; lịch sử phiên bản giữ lại.
- Liên kết provenance: file gốc (intake) ↔ text đã xác nhận
  (`document-review`) ↔ topic ↔ nội dung phát sinh.
- Topic trên phiên bản đã duyệt, gồm merge/split không mất trace.
- Chọn nguồn cho sinh nội dung — chỉ phiên bản "đã duyệt"; khóa tham
  chiếu phiên bản khi dùng.
- Đánh dấu "cần rà soát" nội dung phát sinh từ bản bị thay thế.
- Tìm kiếm/lọc, ngừng dùng có kiểm soát, audit đầy đủ.

### Out of Scope

- Tự đồng bộ thay đổi từ nguồn ngoài hệ thống (PRD "Chưa làm").
- Tự ghi đè bản đã duyệt khi có file mới (PRD "Chưa làm") — mọi bản mới
  qua review.
- Cổng tiếp nhận/kiểm tra file và job xử lý — thuộc `document-intake`.
- Trích xuất và xác nhận text/field — thuộc `document-review`; feature
  này chỉ tiêu thụ kết quả đã xác nhận.
- Sinh câu hỏi và quản lý câu hỏi — thuộc `ai-question-generation` và
  `question-bank`; feature này chỉ giữ tham chiếu provenance.
- Cam kết v1: đây là slice mở rộng (`Should`), không thuộc 15 capability
  `Must`.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Content editor | Khi có tài liệu nguồn mới cần đưa vào | Thêm tài liệu kèm metadata đủ, file qua cổng an toàn chung | Tài liệu trong thư viện với phiên bản 1 đang xử lý | Critical | Confirmed — PRD Mục 7.30 (upload, metadata); Observed: reverse spec FR-KB-02 |
| UN-002 | Content editor | Khi tài liệu thay đổi | Tải file mới tạo phiên bản kế tiếp, bản hiệu lực cũ không bị ảnh hưởng cho tới khi bản mới được duyệt | Cập nhật không phá nguồn đang dùng | Critical | Confirmed — PRD Mục 7.30 (version, "Chưa làm: tự ghi đè") |
| UN-003 | Reviewer | Khi có phiên bản chờ duyệt | Xem file gốc + text đã xác nhận + topic rồi duyệt/từ chối kèm ghi chú | Mỗi phiên bản có quyết định rõ ràng, có audit | Critical | Confirmed — PRD Mục 12 (human-in-the-loop); Observed: reverse spec FR-KB-02 approve route |
| UN-004 | HR/interviewer | Khi chọn tài liệu làm nguồn sinh | Chỉ thấy và chọn được phiên bản đã duyệt; tham chiếu khóa vào đúng phiên bản | Không sinh nội dung từ bản chưa kiểm tra | Critical | Confirmed — PRD Mục 7.30 (chọn nguồn, đo thành công), R-11 |
| UN-005 | Content editor | Khi phiên bản nguồn bị thay thế | Biết nội dung nào đã sinh từ bản cũ để rà soát | Nội dung phát sinh được đánh dấu "cần rà soát", có danh sách | High | Confirmed — PRD Mục 7.30 (rủi ro), R-11; đáp án đề xuất OQ-9 |
| UN-006 | Content editor | Khi cần tìm tài liệu | Tìm/lọc theo tên, loại, trạng thái, chủ sở hữu, topic | Tìm đúng tài liệu trong vài giây | High | Confirmed — PRD Mục 7.30 (tìm kiếm) |
| UN-007 | Content editor | Khi gom phạm vi nội dung | Gắn/gộp/tách topic trên phiên bản đã duyệt mà không mất truy nguyên | Topic luôn trỏ được về phiên bản nguồn | High | Observed: reverse spec FR-KB-03 + business rule 3; mức ưu tiên là Assumption |
| UN-008 | Admin | Khi tài liệu lỗi/hết giá trị | Ngừng dùng kèm lý do, không mất provenance nội dung đã sinh | Tài liệu ẩn khỏi chọn nguồn, lịch sử còn nguyên | Medium | Confirmed — PRD Mục 9 (audit); suy từ rủi ro mất provenance |
| UN-009 | Content editor | Khi xem một nội dung phát sinh | Truy ngược về đúng tài liệu + phiên bản + người duyệt | Provenance hai chiều đầy đủ | High | Confirmed — PRD Mục 7.30 (quan hệ nội dung phát sinh); Observed: reverse spec FR-KB-04 |

## 5. Prioritized User Journeys

### Journey 1: Đưa tài liệu nguồn đầu tiên vào thư viện và duyệt làm nguồn

- **User:** Content editor + reviewer
- **Importance:** Critical
- **Trigger:** Tổ chức có tài liệu (quy trình, đào tạo, khung năng lực)
  cần dùng để sinh câu hỏi.
- **Expected outcome:** Phiên bản 1 ở trạng thái "đã duyệt", sẵn sàng
  được chọn làm nguồn.
- **Related needs:** UN-001, UN-003

1) Editor "Thêm tài liệu nguồn": chọn file qua intake + nhập tên/loại/
   chủ sở hữu/mô tả.
2) File được xử lý và text được xác nhận ở `document-review` → phiên bản
   chuyển "chờ duyệt".
3) Reviewer mở phiên bản, đối chiếu file + text + topic → "Duyệt".
4) Phiên bản hiệu lực, xuất hiện trong danh sách chọn nguồn.

**Independent verification:** Trên một tài liệu vừa duyệt — kiểm tra nó
hiện trong danh sách chọn nguồn của `ai-question-generation`, và bản ghi
phiên bản có đủ file gốc + kết quả trích xuất đã xác nhận + người duyệt.

### Journey 2: Cập nhật tài liệu sang phiên bản mới

- **User:** Content editor + reviewer
- **Importance:** Critical
- **Trigger:** Tài liệu nguồn có bản sửa mới.
- **Expected outcome:** Phiên bản mới được duyệt thay thế có kiểm soát;
  nội dung phát sinh từ bản cũ được đánh dấu rà soát.
- **Related needs:** UN-002, UN-003, UN-005

1) Editor tải file mới lên cùng tài liệu → phiên bản kế tiếp "đang xử
   lý".
2) Xử lý xong → "chờ duyệt"; reviewer xem (diff nếu có) → duyệt.
3) Bản mới hiệu lực; bản cũ "đã thay thế"; nội dung sinh từ bản cũ được
   đánh dấu "cần rà soát" + thông báo owner.

**Independent verification:** Sau khi duyệt bản mới — bản cũ còn xem
được ở "đã thay thế", mọi nội dung phát sinh của bản cũ mang cờ "cần rà
soát", và danh sách chọn nguồn chỉ còn bản mới.

### Journey 3: Chọn nguồn đã duyệt để sinh nội dung

- **User:** HR/interviewer
- **Importance:** Critical
- **Trigger:** Trong `ai-question-generation` cần chọn tài liệu nguồn.
- **Expected outcome:** Chỉ chọn được tài liệu có phiên bản "đã duyệt";
  nội dung sinh ra trỏ đúng phiên bản đó.
- **Related needs:** UN-004, UN-009

1) Mở danh sách nguồn → lọc theo loại/topic/tên.
2) Chọn tài liệu → hệ thống khóa tham chiếu phiên bản hiệu lực.
3) Sinh nội dung; nội dung ghi nhận (tài liệu, phiên bản).

**Independent verification:** Lấy một câu hỏi vừa sinh — truy ngược về
đúng phiên bản nguồn còn "đã duyệt" (hoặc "đã thay thế" nếu sau đó đổi
bản), đủ người duyệt + thời điểm.

### Journey 4: Rà soát nội dung phát sinh sau khi nguồn đổi bản

- **User:** Content editor
- **Importance:** High
- **Trigger:** Phiên bản nguồn bị thay thế (Journey 2).
- **Expected outcome:** Toàn bộ nội dung phát sinh từ bản cũ được liệt kê
  và xử lý có ý thức — rà soát giữ lại hoặc tạo lại.
- **Related needs:** UN-005, UN-009

1) Editor mở tài liệu → thấy danh sách nội dung phát sinh "cần rà soát".
2) Từng nội dung: xem nó trỏ bản nào, so sánh bản mới, quyết định giữ/
   đề xuất tạo lại.
3) Đánh dấu "đã rà soát" → cờ cảnh báo tắt.

**Independent verification:** Với một phiên bản bị thay thế có 3 nội dung
phát sinh — đếm đủ 3 trong danh sách cần rà soát; sau rà soát, cờ tắt và
bản ghi giữ người rà soát + thời điểm.

### Journey 5: Gắn và gộp topic trên phiên bản đã duyệt

- **User:** Content editor
- **Importance:** Medium
- **Trigger:** Cần gom phạm vi nội dung của tài liệu để sinh câu theo
  chủ đề.
- **Expected outcome:** Topic gắn trên phiên bản đã duyệt, merge/split
  giữ được trace về nguồn.
- **Related needs:** UN-007

1) Mở phiên bản đã duyệt → xem topic gợi ý → gắn/thêm topic.
2) Topic trùng → merge; topic quá rộng → split; mỗi thao tác giữ vết.
3) Topic hiện trong bộ lọc khi chọn nguồn.

**Independent verification:** Sau merge hai topic — topic kết quả vẫn
truy nguyên về đúng phiên bản và lịch sử merge xem được.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Thêm tài liệu thiếu metadata | Không hiểu vì sao bị chặn | Thông báo liệt kê field bắt buộc còn thiếu | Journey 1 / UN-001 |
| File mới trùng nội dung bản hiệu lực | Tạo phiên bản rác | Cảnh báo trùng + xác nhận có tạo phiên bản mới không | Journey 2 / UN-002 |
| Chọn nguồn tài liệu chưa có bản duyệt | Không sinh được nội dung | Thông báo rõ chỉ phiên bản đã duyệt được dùng + trạng thái hiện tại | Journey 3 / UN-004 |
| Duyệt phiên bản không mới nhất | Phát hành nội dung lạc hậu | Cảnh báo có phiên bản mới hơn chờ duyệt, yêu cầu xác nhận | Journey 2 / UN-003 |
| Từ chối duyệt không ghi chú | Người đăng không biết sửa gì | Bắt buộc ghi chú trước khi ghi nhận từ chối | Journey 2 / UN-003 |
| Xóa tài liệu đã có nội dung phát sinh | Mất provenance | Chặn xóa, hướng dẫn "ngừng dùng" | UN-008 |
| Tài liệu ngừng dùng trong lúc có phiên bản đang xử lý | Trạng thái mập mờ | Phiên bản xử lý tiếp nhưng không thể duyệt; hiện rõ tài liệu ngừng dùng | Journey 2 |
| Nội dung "cần rà soát" tồn tại lâu | Quên rà soát | Nhắc định kỳ owner; không tự vô hiệu nội dung | Journey 4 / UN-005 |
| Hai người cùng tải phiên bản mới | Hai bản chờ duyệt chồng nhau | Cả hai được ghi nhận; duyệt bản không mới nhất bị cảnh báo | Journey 2 |
| Thư viện trống | Không biết bắt đầu | Empty state gợi ý thêm tài liệu đầu tiên | Journey 1 |

## 7. User-side Constraints

- Giao diện/thông báo tiếng Việt; nội dung tài liệu giữ nguyên ngôn ngữ
  gốc.
- Chỉ người dùng nội bộ có quyền trên ngữ cảnh thư viện; quyền xem/
  tải/duyệt/ngừng tách theo vai trò (kế thừa RLS của reverse spec
  FR-KB-05).
- Upload file bắt buộc qua `document-intake` — người dùng không thấy
  đường upload riêng.
- Phiên bản chỉ lên "chờ duyệt" khi text đã được xác nhận ở
  `document-review` — người dùng không thể bỏ qua bước kiểm chứng.
- Chỉ một phiên bản "đã duyệt" hiệu lực mỗi tài liệu — luôn rõ bản nào
  đang là nguồn chính thức.
- Desktop là surface chính (đối chiếu file + text + diff); không yêu cầu
  mobile cho slice này.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Reviewer duyệt phiên bản là owner nội dung/HR lead được gán quyền qua org-governance | Nếu chưa định nghĩa vai trò → hàng chờ duyệt nghẽn | Assumption — đề xuất | Chốt ở OQ-1 brainstorm (OQ-KB-01, GAP-KB-02) |
| Khi nguồn đổi bản, nội dung phát sinh chỉ bị đánh dấu "cần rà soát", không tự chuyển/vô hiệu | Nếu tự sync → vi phạm human-in-the-loop; nếu tự vô hiệu → mất nội dung đang dùng | Assumption — đề xuất (OQ-9 PRD) | Chờ Technical/Operations owner xác nhận |
| Text làm nguồn phải đã xác nhận ở document-review | Nếu cho dùng text máy → nguồn chưa kiểm chứng sinh nội dung lỗi | Confirmed — PRD Mục 12 + dependency 17,18 | — |
| Một phiên bản hiệu lực duy nhất mỗi tài liệu | Nếu nhiều bản hiệu lực → "chọn nguồn" mập mờ | Assumption — bám trạng thái "đã duyệt" | Đối chiếu khi spec consumer |
| Giới hạn 20 topic/phiên bản, nhắc rà soát 7 ngày là chuẩn | Nếu sai → lọc thiếu linh hoạt hoặc nhắc spam | Assumption — đề xuất | Chốt ở OQ-4/OQ-5 brainstorm |
| Merge/split topic không mất trace về phiên bản nguồn | Nếu mất trace → provenance nội dung sai | Confirmed — business rule 3 reverse spec `knowledge-and-question-bank` | — |
| File gốc/phiên bản cũ giữ theo retention tài liệu chung | Nếu xóa sớm → provenance hỏng (OQ-KB-02) | Assumption — chờ OQ-6 PRD | Theo dõi quyết định retention |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Nội dung sinh ra luôn trỏ nguồn đã duyệt | Chưa có — xác lập bằng audit provenance trong pilot | 100% nội dung phát sinh có tham chiếu phiên bản "đã duyệt" | Tỷ lệ nội dung phát sinh có (tài liệu, phiên bản đã duyệt) đầy đủ | Liên tục |
| USC-002 | Không nội dung nào âm thầm chạy trên bản cũ | Chưa có — xác lập bằng đếm cờ "cần rà soát" | 100% nội dung từ bản bị thay thế được đánh dấu trong ≤1 ngày | Tỷ lệ nội dung phát sinh của phiên bản đã thay thế mang cờ rà soát | Liên tục |
| USC-003 | Phiên bản chờ duyệt được quyết định kịp thời | Chưa có — đo thời gian chờ trong 1 tháng pilot | ≤3 ngày làm việc (đề xuất) | Thời gian từ "chờ-duyệt" đến quyết định | 1 tháng sau pilot |
| USC-004 | Editor tìm đúng tài liệu nguồn nhanh | Chưa có — quan sát 5 phiên tìm đầu | ≥90% lượt tìm ra tài liệu trong ≤30 giây | Thời gian từ mở thư viện đến chọn được tài liệu | 1 tháng sau pilot |
| USC-005 | Provenance hai chiều đầy đủ | Chưa có | 100% nội dung phát sinh truy ngược được về tài liệu + phiên bản + người duyệt | Kiểm tra mẫu nội dung phát sinh | Mỗi release |

## 10. Open Questions

- [x] OQ-1: Ai duyệt phiên bản tài liệu nguồn — Resolved (đề xuất):
  owner nội dung/HR lead được gán quyền qua org-governance — chờ Head of
  HR (OQ-KB-01, GAP-KB-02).
- [x] OQ-2: Tài liệu đổi → tự sync hay owner review trước khi phát hành
  lại (OQ-9 PRD) — Resolved (đề xuất): bản mới qua duyệt con người; nội
  dung phát sinh bản cũ chỉ đánh dấu "cần rà soát" — chờ
  Technical/Operations owner.
- [x] OQ-3: Retention/cascade file gốc, phiên bản cũ, nội dung phát sinh
  — Resolved (đề xuất): theo retention tài liệu chung; bản đã được tham
  chiếu không xóa hẳn — chờ DPO/legal (OQ-KB-02, OQ-6 PRD).
- [x] OQ-4: Giới hạn topic và ngưỡng cảnh báo trùng — Resolved (đề
  xuất): 20 topic/phiên bản; trùng nội dung chỉ cảnh báo — chờ Document
  AI owner.
- [x] OQ-5: SLA duyệt phiên bản + chu kỳ nhắc rà soát — Resolved (đề
  xuất): duyệt ≤3 ngày làm việc; nhắc rà soát sau 7 ngày — chờ
  Operations owner.
- [x] OQ-6: Nội dung "cần rà soát" có tự vô hiệu — Resolved (đề xuất):
  không tự vô hiệu, chỉ cảnh báo cho owner (human-in-the-loop) — chờ
  Knowledge owner.
- [~] OQ-7: Đồng bộ từ nguồn ngoài — Out of scope v1: PRD "Chưa làm";
  chờ external-integrations.
