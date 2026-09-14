---
type: urd
feature: ai-question-generation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/ai-question-generation/brainstorms/doc-grounded-question-generation.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md]
---

# ai-question-generation — User Requirements Document

## 1. Purpose

Cho HR/content editor cách tạo nhanh bộ câu hỏi nháp bám sát tài liệu đã
duyệt của tổ chức, với mỗi câu kèm evidence đoạn trích và provenance đầy
đủ — và cho reviewer một khu vực kiểm soát nơi mọi câu AI phải được con
người xem, sửa, chọn hoặc loại trước khi chạm tới ngân hàng câu hỏi. Đây
là feature `Should` — slice mở rộng, không nằm trong cam kết v1 (PRD Mục
7.20, Mục 6.1).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR / content editor | Soạn câu hỏi từ giáo trình/quy trình/JD bằng tay | Đọc tài liệu dài rồi viết từng câu — rất chậm, câu dễ lệch chuẩn | Kho câu hỏi tăng chậm, phụ thuộc vài người giỏi soạn | Confirmed — PRD Mục 7.20 ("tạo bộ câu hỏi bám tài liệu nhanh hơn") |
| Reviewer | Câu do AI sinh có thể bịa hoặc không khớp tài liệu | Không có cách đối chiếu câu với nguồn trước khi nó vào bank | Câu sai lọt vào bài đánh giá — rủi ro hallucination | Confirmed — PRD Mục 7.20 (rủi ro chính); Observed: reverse spec `knowledge-and-question-bank` rule "generated question là draft không đáng tin" |
| HR | Tài liệu nguồn được cập nhật phiên bản mới | Câu đã sinh vẫn trỏ nội dung cũ, không ai biết để rà soát | Ngân hàng lẫn câu lệch chuẩn tài liệu hiện hành | Confirmed — PRD R-11, OQ-9 |
| Admin | Job AI chạy không rõ trạng thái/quota | Provider lỗi hoặc chi phí bất thường không ai phát hiện | Feature không đáng tin, vượt ngân sách | Observed: OQ-KB-04 reverse spec; PRD R-14 |
| Ứng viên / người làm bài | Làm bài từ câu AI chưa kiểm duyệt | Câu lỗi, lạ đề, không đo đúng năng lực | Kết quả không công bằng, khiếu nại | Confirmed — PRD Mục 12 (invariant human-in-the-loop) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR / content editor | Được giao xây dựng kho câu hỏi cho kỹ năng/vị trí từ tài liệu chuẩn | Sinh nhanh bộ câu nháp bám tài liệu, chọn lọc đưa vào bank | Soạn tay chậm; sợ câu AI kém chất lượng không kiểm soát được |
| secondary | Reviewer | Được giao kiểm duyệt câu sinh trước khi vào bank | Xem câu kèm evidence để duyệt/sửa/loại có căn cứ | Không có đoạn trích nguồn để đối chiếu; không có hàng chờ rõ |
| secondary | Admin | Quản trị quota AI, quyền và audit | Biết job nào đang chạy, ai duyệt câu, chi phí ra sao | Job/quota không trong tầm kiểm soát |
| out | Ứng viên / nhân viên | Làm bài từ câu đã qua kiểm duyệt | (gián tiếp) chỉ gặp câu đã duyệt | Không thao tác trong feature này |

## 3. Scope Boundaries

### In Scope

- Chọn tài liệu "Đã duyệt" trong `document-library` làm nguồn (chốt phiên
  bản); review/chọn topic trích xuất trước khi sinh.
- Job sinh câu hỏi có cấu hình (loại, số câu, trình độ, kỹ năng), trạng
  thái, tiến độ, lỗi và retry có kiểm soát + quota.
- Staging câu nháp sinh ra: nội dung đầy đủ theo loại câu + evidence đoạn
  trích + phân loại đề xuất; review từng câu (duyệt/sửa/loại kèm lý do).
- Đưa câu duyệt vào `question-bank` ở "Chờ review" mang nguồn "sinh bởi
  AI" + provenance (tài liệu, phiên bản, đoạn trích, job, người duyệt).
- Cờ "cần rà soát" khi tài liệu nguồn có phiên bản mới; luồng owner xử lý
  cờ (giữ/sửa/ngừng dùng).
- Cảnh báo near-duplicate với câu bank hiện có; audit job và quyết định.

### Out of Scope

- Upload/xử lý/trích xuất/duyệt tài liệu — thuộc `document-intake`,
  `document-review`, `document-library` (feature này chỉ tiêu thụ tài
  liệu đã duyệt).
- Vòng đời câu hỏi trong bank (review chính thức, phiên bản, ngừng dùng)
  — thuộc `question-bank`; feature này chỉ đẩy câu vào "Chờ review".
- Tự động phát hành câu hỏi chưa kiểm duyệt — cấm theo PRD "Chưa làm" và
  invariant human-in-the-loop.
- Chọn câu vào bài đánh giá — thuộc `assessment-authoring`.
- Merge/split topic — thuộc `document-library` (feature này chỉ duyệt/
  chọn topic phạm vi).
- Marketplace chia sẻ câu sinh giữa tổ chức — ngoài phạm vi.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi cần bộ câu hỏi cho một tài liệu chuẩn | Chọn tài liệu đã duyệt làm nguồn, chốt đúng phiên bản | Job gắn đúng phiên bản tài liệu tại thời điểm chạy | Critical | Confirmed — PRD Mục 7.20 (sinh từ document đã chọn, giữ source reference) |
| UN-002 | HR | Trước khi sinh câu | Xem và chọn topic AI trích xuất từ tài liệu làm phạm vi | Chỉ sinh trên topic đã xem/duyệt, không sinh mù | High | Confirmed — PRD Mục 7.20 (topic review); Observed: states reverse (Extracted → Approved → QuestionsGenerated) |
| UN-003 | HR | Khi cấu hình job | Chọn loại câu, số câu, trình độ, kỹ năng mục tiêu | Job sinh đúng hồ sơ yêu cầu | Critical | Confirmed — PRD Mục 7.20 (theo topic/level đã chọn) |
| UN-004 | HR | Khi job đang chạy | Biết trạng thái, khi nào xong, lỗi vì sao và retry được | Không job treo âm thầm; lỗi có lý do | High | Confirmed — PRD Mục 7.20 (generation job); Observed: OQ-KB-04 |
| UN-005 | Reviewer | Khi review câu sinh | Xem từng câu cùng đoạn trích evidence, đáp án, phân loại đề xuất và cảnh báo trùng | Quyết định duyệt/sửa/loại có căn cứ | Critical | Confirmed — PRD Mục 7.20 (buộc review trước khi vào bank); PRD Mục 12 |
| UN-006 | Reviewer | Khi câu AI gần đúng | Sửa câu rồi mới duyệt, phần sửa được ghi nhận | Câu vào bank đúng ý reviewer | High | Confirmed — PRD Mục 7.20 (review/sửa → approve) |
| UN-007 | HR | Khi câu được duyệt | Câu vào `question-bank` mang nguồn "sinh bởi AI" + provenance đầy đủ và qua luồng review chung | Bank review là cổng cuối trước khi câu dùng được | Critical | Confirmed — PRD Mục 7.20, Mục 12; align `question-bank` BR-001 |
| UN-008 | HR | Khi tài liệu nguồn có bản mới | Được đánh dấu câu nào trỏ bản cũ để rà soát — không tự đồng bộ | Danh sách "cần rà soát" rõ ràng, quyết định có chủ | High | Confirmed — PRD R-11, OQ-9 |
| UN-009 | Admin | Khi giám sát mức dùng | Xem job đang chạy, lịch sử, quota và ai duyệt câu | Kiểm soát chi phí + truy vết | Medium | Confirmed — PRD Mục 9; Observed: OQ-KB-04 |
| UN-010 | Reviewer | Khi staging tồn đọng | Biết câu nào chờ lâu/sắp quá hạn để xử lý | Không tồn câu nháp vô thời hạn | Medium | Assumption — suy từ giới hạn staging (đề xuất) |
| UN-011 | HR | Khi job sinh câu trùng bank | Được cảnh báo câu gần giống trước khi duyệt | Không đổ trùng vào bank | Medium | Assumption — kế thừa cơ chế `question-bank` (GAP-KB-04) |

## 5. Prioritized User Journeys

### Journey 1: Sinh bộ câu hỏi từ tài liệu đã duyệt

- **User:** HR / content editor
- **Importance:** Critical
- **Trigger:** Cần bổ sung câu hỏi cho một kỹ năng/mảng có tài liệu chuẩn.
- **Expected outcome:** Job hoàn tất, staging có bộ câu nháp kèm evidence
  sẵn sàng review.
- **Related needs:** UN-001, UN-002, UN-003, UN-004

1) Chọn tài liệu "Đã duyệt" trong `document-library` (hệ thống chốt phiên
   bản hiện tại).
2) Xem danh sách topic trích xuất → duyệt/chọn topic phạm vi sinh.
3) Cấu hình job (loại câu, số câu, trình độ, kỹ năng) → "Chạy".
4) Job chạy nền → hoàn tất → staging hiện câu nháp "Chờ review" kèm đoạn
   trích evidence.

**Independent verification:** Chọn một job vừa hoàn tất — staging có đúng
số câu mục tiêu (hoặc rõ phần thiếu), mỗi câu có job_id + tài liệu +
phiên bản + (đoạn trích hoặc cờ "không có evidence").

### Journey 2: Review và đưa câu vào ngân hàng

- **User:** Reviewer
- **Importance:** Critical
- **Trigger:** Staging có câu nháp chờ review.
- **Expected outcome:** Mỗi câu có quyết định (duyệt/sửa rồi duyệt/loại
  kèm lý do); câu duyệt xuất hiện trong bank ở "Chờ review" với
  provenance đầy đủ.
- **Related needs:** UN-005, UN-006, UN-007, UN-011

1) Mở staging theo job → lọc "Chờ review".
2) Mở câu: đọc nội dung + đoạn trích nguồn + phân loại đề xuất + cảnh báo
   trùng.
3) "Duyệt" / sửa rồi "Duyệt" / "Loại" kèm lý do.
4) Câu duyệt tạo `QUESTION` trong bank ở "Chờ review" (nguồn "sinh bởi
   AI") → reviewer bank xử lý như câu thường.

**Independent verification:** Duyệt một câu trong staging — bank có
`QUESTION` tương ứng ở "Chờ review" mang source_type AI + trỏ đúng tài
liệu/phiên bản + ghi nhận người duyệt staging; câu đó chưa thể vào bài
đánh giá cho tới khi bank duyệt.

### Journey 3: Rà soát câu khi tài liệu đổi phiên bản

- **User:** HR (owner mảng nội dung)
- **Importance:** High
- **Trigger:** `document-library` công bố phiên bản mới của tài liệu đã
  từng sinh câu.
- **Expected outcome:** Câu trỏ bản cũ được đánh dấu và xử lý có chủ:
  giữ, sửa theo bản mới, hoặc ngừng dùng.
- **Related needs:** UN-008

1) Nhận thông báo/danh sách "cần rà soát" kèm số câu ảnh hưởng.
2) Mở từng câu → so sánh với phiên bản tài liệu mới.
3) Quyết định: xác nhận giữ (bỏ cờ), sửa (tạo phiên bản câu mới qua
   luồng bank), hoặc ngừng dùng.

**Independent verification:** Phát hành phiên bản mới của một tài liệu đã
sinh câu — mọi câu trỏ bản cũ có cờ "cần rà soát"; sau khi owner xử lý,
không còn cờ và quyết định có vết.

### Journey 4: Xử lý job lỗi

- **User:** HR / admin
- **Importance:** Medium
- **Trigger:** Job sinh câu lỗi (provider timeout, output sai).
- **Expected outcome:** Lỗi có lý do rõ, retry có kiểm soát, không nhân
  đôi câu đã sinh.
- **Related needs:** UN-004

1) Job chuyển "lỗi" kèm lý do; câu đã sinh được phần nào vẫn trong
   staging.
2) Bấm retry → chạy lại phần thiếu; hết 3 lần → "thất-bại", giữ cấu hình
   để chạy lại sau.

**Independent verification:** Cho job lỗi retry — staging không có câu
trùng lặp giữa các lần chạy; bản ghi job thể hiện đủ số lần retry.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tài liệu chưa duyệt/chưa trích xuất xong | Không hiểu vì sao không chọn được | Tài liệu không hiện trong danh sách nguồn + empty state dẫn tới thư viện | Journey 1 / UN-001 |
| Tài liệu không có topic nào | Không sinh được | Cho "toàn văn" kèm cảnh báo phạm vi rộng hoặc yêu cầu tạo topic | UN-002 |
| Provider trả output sai/thiếu đáp án | Một phần câu không vào staging | Báo số câu lỗi format theo job; câu hợp lệ vẫn nhận | Journey 4 / UN-004 |
| Reviewer khác đã xử lý câu đang xem | Sợ ghi đè quyết định | Hiện "câu vừa được {người} {duyệt/loại}", chuyển sang câu khác | Journey 2 / UN-005 |
| Câu sinh trùng câu bank | Đổ trùng vào bank | Cảnh báo near-duplicate trước quyết định duyệt | Journey 2 / UN-011 |
| Job đang chạy khi tài liệu đổi bản | Câu sinh trỏ bản cũ | Job chốt phiên bản tại đăng ký; câu sinh sau đó được cờ cần-rà-soát | Journey 3 / UN-008 |
| Câu duyệt vào bank bị bank yêu cầu chỉnh | Tưởng đã xong | Câu quay về "Chờ review" bank kèm ghi chú; provenance giữ nguyên | Journey 2 / UN-007 |
| Staging quá hạn 90 ngày | Mất câu nháp chưa xử lý | Cảnh báo trước hạn; quá hạn tự "bị-loại" lý do hết hạn | UN-010 |
| Vượt quota job/ngày | Không chạy được khi cần | Thông báo quota rõ ràng + thời điểm reset | Journey 1 / UN-004 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt; câu sinh hỗ trợ tiếng Việt đầy đủ.
- Người dùng phải đăng nhập, thuộc tổ chức/phạm vi được cấp; quyền sinh
  câu và quyền review staging do `org-governance` cấp.
- Chỉ tài liệu "Đã duyệt" được làm nguồn — điều kiện tiên quyết.
- Không có đường nào đưa câu AI vào bank mà không qua review của con
  người ở staging; và không câu nào dùng được khi bank chưa duyệt.
- Reviewer phải thấy đoạn trích evidence (hoặc cờ "không có evidence")
  trong màn review — không review mù.
- Màn review staging (đối chiếu câu + evidence) thiết kế cho desktop;
  không yêu cầu mobile cho feature này.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Câu AI duyệt vào bank ở "Chờ review" — bank review là cổng duy nhất tạo câu "Đã duyệt" | Nếu vào thẳng "Đã duyệt" → một reviewer quyết định câu AI dùng được, yếu rào chắn | Assumption — đề xuất | Chốt ở OQ-1 (chờ Product owner) |
| Topic phải được duyệt/chọn trước khi sinh | Nếu sinh không qua topic → câu lan man, review nặng | Confirmed — PRD Mục 7.20 (topic review); states reverse | — |
| Reviewer staging và reviewer bank là cùng vai trò nghiệp vụ do org-governance cấp | Nếu chỉ admin → hàng chờ nghẽn | Assumption — đề xuất | Chốt ở OQ-2 (liên quan OQ-11 PRD) |
| Câu không có đoạn trích vẫn vào staging nhưng có cờ | Nếu chặn hẳn → mất câu đúng khi provider không trả vị trí | Assumption — đề xuất | Chốt ở OQ-4 |
| Khi tài liệu đổi bản: cờ "cần rà soát", không tự sync | Nếu tự sync → nội dung câu đổi không qua review | Assumption — đề xuất giải OQ-9 PRD | Chốt ở OQ-3 |
| Quota Mục 7.2 (50 câu/job, 10 job/ngày, retry ×3, staging 90 ngày/2.000) là chuẩn draft | Quá chặt/lỏng → đổi cấu hình | Assumption | Chốt ở OQ-5 (OQ-KB-04) |
| Job sinh chạy async, không chặn thao tác khác | Nếu đồng bộ → UX chờ dài | Assumption — bám pattern job của `document-intake` | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Câu AI được duyệt sau review ở tỷ lệ đáng tin (mục tiêu PRD) | Chưa có — xác lập bằng 5 job đầu trong 1 tháng | ≥60% câu sinh được duyệt (chốt cùng OQ-2 PRD) | Tỷ lệ câu staging → đưa bank / tổng câu sinh | 1 tháng sau khi bật feature |
| USC-002 | Không câu AI nào vào bank/dùng được mà chưa qua review | 0% | 100% câu AI trong bank có bản ghi duyệt staging + duyệt bank | Audit provenance trên câu nguồn AI | Liên tục |
| USC-003 | Mọi câu AI truy nguyên được nguồn | 0% | 100% câu AI có tài liệu + phiên bản + job + người duyệt | Audit provenance | Liên tục |
| USC-004 | Câu trỏ bản tài liệu cũ được phát hiện và rà soát | Chưa có — xác lập sau lần đổi phiên bản đầu tiên | 100% câu ảnh hưởng được cờ và có quyết định trong ≤7 ngày | Tỷ lệ cờ cần-rà-soát được xử lý trong SLA đề xuất | Mỗi lần đổi phiên bản |
| USC-005 | Job ổn định không cần can thiệp thủ công | Chưa có — xác lập qua 5 job đầu | ≥80% job hoàn tất không cần retry thủ công | Tỷ lệ job hoàn-tất lần đầu / tổng job | 1 tháng sau khi bật |

## 10. Open Questions

- [x] OQ-1: Câu AI duyệt xong vào bank ở trạng thái nào? — Resolved (đề
  xuất): "Chờ review" — bank review là cổng duy nhất tạo câu "Đã duyệt" —
  chờ Product owner xác nhận.
- [x] OQ-2: Ai được sinh câu và ai review staging (OQ-KB-01)? — Resolved
  (đề xuất): HR/content editor sinh; reviewer là vai trò nghiệp vụ do
  `org-governance` cấp — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-3: Tài liệu đổi phiên bản thì tự sync hay owner review (OQ-9
  PRD)? — Resolved (đề xuất): cờ "cần rà soát" + owner quyết định, không
  tự sync — chờ Technical/Operations owner xác nhận.
- [x] OQ-4: Câu không có đoạn trích evidence có được duyệt? — Resolved
  (đề xuất): vào staging kèm cờ "không có evidence"; khuyến nghị loại
  hoặc sửa gán đoạn trích trước duyệt — chờ Product owner xác nhận.
- [x] OQ-5: Quota (50 câu/job, 10 job/ngày, retry ×3, staging 90 ngày)
  có làm chuẩn? — Resolved (đề xuất): dùng làm chuẩn draft — chờ Product
  owner + Admin lead xác nhận (OQ-KB-04).
- [x] OQ-6: Retention câu "bị-loại" và staging (OQ-KB-02)? — Resolved
  (đề xuất): giữ 90 ngày cho audit rồi xóa — chờ DPO/legal xác nhận
  (liên quan OQ-6 PRD).
- [x] OQ-7: Topic AI trích sai có được sửa tay? — Resolved: có — reviewer
  duyệt/chỉnh/chọn topic trước khi sinh, merge/split theo cơ chế của
  `document-library` (bám reverse FR-KB-03).
