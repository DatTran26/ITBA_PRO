---
type: srs
feature: ai-question-generation
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/ai-question-generation/brainstorms/doc-grounded-question-generation.md
  - docs/features/ai-question-generation/ai-question-generation-urd.md
  - docs/_reverse/knowledge-and-question-bank/reverse-spec.md
---

# ai-question-generation — Software Requirements Specification

## 1. Scope

SRS này cover việc sinh câu hỏi bằng AI từ tài liệu nguồn đã duyệt của một
tổ chức: chọn nguồn + review topic, job sinh có cấu hình/trạng thái/retry
/quota, staging câu nháp kèm evidence đoạn trích, review của con người
(duyệt/sửa/loại), đưa câu duyệt vào `question-bank` ở "Chờ review" với
provenance đầy đủ, và cờ "cần rà soát" khi tài liệu nguồn đổi phiên bản.
Đây là feature `Should` — slice mở rộng, KHÔNG nằm trong cam kết v1 (PRD
Mục 7.20, Mục 6.1).

KHÔNG cover: upload/trích xuất/duyệt tài liệu (`document-intake`,
`document-review`, `document-library`), vòng đời câu hỏi trong bank
(`question-bank` — feature này chỉ đẩy câu vào "Chờ review"), tự động
phát hành câu chưa kiểm duyệt (cấm), chọn câu vào bài
(`assessment-authoring`), và merge/split topic (`document-library`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR / content editor | người | Chọn nguồn, duyệt topic, cấu hình và chạy job, theo dõi kết quả | Có |
| Reviewer | người | Review câu sinh trong staging: duyệt/sửa/loại có căn cứ | Có |
| Admin | người | Giám sát job/quota, hủy job, truy vết audit | Có |
| AI provider | ngoài | Sinh câu nháp theo cấu hình từ nội dung tài liệu | Không (dependency, output luôn qua review) |
| `document-library` | hệ thống (feature khác) | Cung cấp tài liệu "Đã duyệt" + phiên bản + topic trích xuất | Không (nguồn) |
| `question-bank` | hệ thống (feature khác) | Tiếp nhận câu duyệt vào "Chờ review", cảnh báo trùng, vòng đời câu | Không (consumer đầu ra) |
| `ai-usage-monitoring` | hệ thống (feature khác) | Ghi nhận usage/cost của job sinh | Không (quan sát) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-ai-question-generation-001 | Chọn nguồn tài liệu đã duyệt | Khi HR mở màn sinh câu, hệ thống phải chỉ liệt kê tài liệu ở trạng thái "Đã duyệt" trong `document-library` và chốt phiên bản hiện tại của tài liệu vào job khi đăng ký | P0 | test | PRD Mục 7.20 (sinh từ document đã chọn, giữ source reference); R-11 |
| FR-ai-question-generation-002 | Review topic trước khi sinh | Hệ thống phải liệt kê topic trích xuất của tài liệu để người dùng duyệt/chỉnh/chọn phạm vi; job chỉ chạy được khi có ≥1 topic được chọn (hoặc chọn "toàn văn" kèm cảnh báo) | P0 | test | PRD Mục 7.20 (topic review); reverse states Extracted → Approved |
| FR-ai-question-generation-003 | Cấu hình job sinh | Khi tạo job, hệ thống phải ghi nhận: tài liệu + phiên bản, topic phạm vi, loại câu, số câu mục tiêu (1–50), trình độ và kỹ năng gán sẵn (từ taxonomy) | P0 | demo | PRD Mục 7.20 (theo topic/level); brainstorm Mục 7.1 |
| FR-ai-question-generation-004 | Job async có trạng thái | Hệ thống phải chạy job bất đồng bộ với trạng thái (đăng ký → đang chạy → hoàn tất/lỗi/thất bại/hủy), tiến độ và lý do lỗi; không chặn thao tác khác của người dùng | P0 | test | PRD Mục 7.20 (generation job); brainstorm Mục 6.4 |
| FR-ai-question-generation-005 | Retry có kiểm soát | Khi job lỗi (provider timeout/output sai), hệ thống phải cho retry tối đa 3 lần theo phần còn thiếu mà không nhân đôi câu đã sinh; hết retry chuyển "thất bại" giữ cấu hình | P0 | test | brainstorm Mục 5.4; OQ-KB-04 |
| FR-ai-question-generation-006 | Quota job | Hệ thống phải giới hạn 1 job chạy đồng thời mỗi tổ chức và 10 job mỗi người mỗi ngày; vượt thì xếp hàng hoặc từ chối kèm lý do | P0 | test | brainstorm Mục 7.2 (đề xuất); OQ-KB-04 |
| FR-ai-question-generation-007 | Staging câu nháp | Khi job hoàn tất, hệ thống phải đưa mỗi câu hợp lệ vào staging ở "Chờ review" với đầy đủ trường theo loại câu (nội dung, lựa chọn, đáp án hoặc hướng dẫn chấm, giải thích), phân loại đề xuất, đoạn trích evidence + vị trí nguồn (hoặc cờ "không có evidence"); câu sai định dạng ghi lỗi theo câu, không vào staging | P0 | test | PRD Mục 7.20 (draft question); reverse rule "draft không đáng tin" |
| FR-ai-question-generation-008 | Review câu có căn cứ | Khi reviewer mở câu staging, hệ thống phải hiển thị nội dung câu cùng đoạn trích evidence, phân loại đề xuất và cảnh báo near-duplicate với bank; quyết định ghi nhận người + thời điểm | P0 | test | PRD Mục 7.20 (buộc review), Mục 12 |
| FR-ai-question-generation-009 | Sửa trước khi duyệt | Hệ thống phải cho reviewer sửa mọi trường câu trước khi duyệt và ghi nhận cờ "đã chỉnh sửa" + người sửa | P0 | test | PRD Mục 7.20 (review/sửa → approve) |
| FR-ai-question-generation-010 | Duyệt đưa vào bank | Khi reviewer "Duyệt" câu đủ trường bắt buộc, hệ thống phải tạo `QUESTION` trong `question-bank` ở trạng thái "Chờ review" với nguồn "sinh bởi AI" và provenance đầy đủ (tài liệu + phiên bản + đoạn trích + job + người duyệt staging); câu chưa đủ trường phải báo thiếu | P0 | test | PRD Mục 7.20 (approve trước khi vào bank), Mục 12; BR-question-bank-001 |
| FR-ai-question-generation-011 | Loại câu kèm lý do | Khi reviewer "Loại", hệ thống phải bắt buộc lý do, chuyển câu sang "bị-loại" giữ trong staging cho tham khảo/audit và không đưa vào bank | P0 | test | brainstorm Mục 5.2 |
| FR-ai-question-generation-012 | Thao tác hàng loạt | Hệ thống phải cho loại nhiều câu kèm một lý do và duyệt nhiều câu đã kiểm tra trong staging | P1 | demo | brainstorm Mục 4 (P1) |
| FR-ai-question-generation-013 | Cờ cần rà soát khi nguồn đổi bản | Khi `document-library` công bố phiên bản mới của tài liệu đã từng sinh câu, hệ thống phải đánh dấu "cần rà soát" mọi câu trỏ bản cũ (staging và câu đã trong bank) và thông báo owner; không tự đồng bộ nội dung | P0 | test | PRD R-11, OQ-9; brainstorm Mục 5.3 |
| FR-ai-question-generation-014 | Xử lý cờ cần rà soát | Hệ thống phải cho owner xem danh sách câu cần rà soát kèm phiên bản mới và quyết định: giữ (bỏ cờ), sửa theo bản mới (qua luồng bank) hoặc ngừng dùng; mọi quyết định ghi nhận | P0 | test | brainstorm Mục 5.3; URD Journey 3 |
| FR-ai-question-generation-015 | Sinh bổ sung/chạy lại | Hệ thống phải cho chạy job bổ sung trên cùng nguồn với cấu hình mới/cũ; câu mới vào staging riêng theo job | P1 | demo | brainstorm Mục 4 (P1) |
| FR-ai-question-generation-016 | Hết hạn staging | Khi câu "Chờ review" quá 90 ngày, hệ thống phải cảnh báo trước hạn rồi tự chuyển "bị-loại" lý do hết hạn | P1 | test | brainstorm Mục 7.2 (đề xuất) |
| FR-ai-question-generation-017 | Audit đầy đủ | Hệ thống phải ghi vết cho: đăng ký/chạy/hủy/retry job, từng quyết định duyệt/sửa/loại, đưa câu vào bank, cờ cần rà soát và xử lý cờ | P0 | kiểm tra | PRD Mục 9; URD UN-009 |
| FR-ai-question-generation-018 | Thống kê chất lượng job | Hệ thống phải hiển thị theo job: tỷ lệ duyệt/sửa/loại để điều chỉnh cấu hình lần sau | P1 | demo | brainstorm Mục 4 (P1); PRD Mục 7.20 (đo thành công) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-ai-question-generation-001 | human-oversight | Không có đường nào đưa câu AI vào bank hoặc trạng thái dùng được mà thiếu review của con người — invariant | P0 | 0 câu nguồn AI trong bank thiếu bản ghi duyệt staging (bám M-GR-02) |
| NFR-ai-question-generation-002 | provenance | Mọi câu nguồn AI truy nguyên được tài liệu + phiên bản + job + người duyệt; câu trong bank giữ liên kết về câu sinh gốc | P0 | 100% câu AI có provenance đủ trên mẫu kiểm tra |
| NFR-ai-question-generation-003 | security | Truy cập theo organization/role/data-scope; quyền sinh, quyền review staging và quyền hủy job tách bạch — deny-by-default | P0 | 0 incident vượt quyền được xác nhận (bám M-GR-01) |
| NFR-ai-question-generation-004 | reliability | Job idempotent: retry không nhân đôi câu; lỗi provider không làm mất câu đã sinh hoặc cấu hình job | P0 | Test retry/lỗi không sinh câu trùng và không mất staging |
| NFR-ai-question-generation-005 | performance | Job ≤50 câu hoàn tất trong thời gian hợp lý cho thao tác nền | P1 | 95% job ≤50 câu xong trong ≤15 phút [đề xuất — xem OQ-5] |
| NFR-ai-question-generation-006 | usability | Giao diện/thông báo tiếng Việt; câu sinh hỗ trợ đầy đủ dấu tiếng Việt | P0 | Kiểm tra mẫu câu tiếng Việt lưu/hiển thị đúng |
| NFR-ai-question-generation-007 | data-retention | Staging và câu bị loại giữ 90 ngày cho audit rồi xóa; câu đã vào bank theo retention `question-bank` | P1 | Chính sách retention được áp dụng (chờ OQ-6; liên quan OQ-6 PRD) |
| NFR-ai-question-generation-008 | cost-control | Mức dùng AI của job ghi nhận được qua `ai-usage-monitoring` để reconcile chi phí | P1 | 100% job có usage record (bám R-14) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-ai-question-generation-001 | Chỉ tài liệu "Đã duyệt" được làm nguồn sinh; job chốt phiên bản tại đăng ký | Khi chọn nguồn và khi tài liệu đổi bản | FR-001, FR-013 | PRD R-11; brainstorm Mục 8 |
| BR-ai-question-generation-002 | Không chạy job khi chưa có topic được chọn (hoặc "toàn văn" có cảnh báo) | Khi bấm chạy job | FR-002, FR-003 | PRD Mục 7.20 (topic review) |
| BR-ai-question-generation-003 | Câu AI là draft không đáng tin cho đến khi con người duyệt — không có đường tự động vào bank hay bài | Khi job đổ staging và khi có yêu cầu bypass review | FR-007, FR-008, FR-010 | PRD Mục 12, Mục 7.20 "Chưa làm"; reverse rule 1 |
| BR-ai-question-generation-004 | "Duyệt" staging tạo QUESTION ở "Chờ review" trong bank — bank review là cổng duy nhất tạo câu "Đã duyệt" | Khi reviewer duyệt câu | FR-010 | align `question-bank` BR-001; đề xuất OQ-1 |
| BR-ai-question-generation-005 | Loại câu bắt buộc lý do; câu bị loại không vào bank nhưng giữ cho audit | Khi reviewer loại | FR-011 | brainstorm Mục 7.1 |
| BR-ai-question-generation-006 | Tài liệu đổi phiên bản → cờ "cần rà soát" + owner quyết định; cấm tự đồng bộ/sửa câu không qua review | Khi nguồn có phiên bản mới được duyệt | FR-013, FR-014 | PRD OQ-9, R-11 |
| BR-ai-question-generation-007 | Câu duyệt vào bank phải đủ trường bắt buộc theo loại câu (đáp án đúng hoặc hướng dẫn chấm) | Khi reviewer bấm duyệt | FR-010 | BR-question-bank-006/007 |
| BR-ai-question-generation-008 | Quota: 1 job đồng thời/tổ chức, 10 job/ngày/người, retry ≤3 — vượt thì xếp hàng hoặc từ chối | Khi tạo/chạy/retry job | FR-005, FR-006 | brainstorm Mục 7.2; OQ-KB-04 |
| BR-ai-question-generation-009 | Quyết định staging theo người nhanh hơn — không ghi đè quyết định đã ghi nhận | Khi 2 reviewer xử lý cùng câu | FR-008 | brainstorm Mục 6.4 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-ai-question-generation-001 | Tài liệu chưa duyệt | Chọn tài liệu không ở "Đã duyệt" | major | FR-001 | Tài liệu không hiện trong danh sách; khi cố chọn: "Tài liệu này chưa được duyệt — chỉ sinh câu từ tài liệu đã duyệt" | Duyệt tài liệu trong `document-library` trước |
| E-ai-question-generation-002 | Chưa chọn topic | Chạy job khi chưa duyệt/chọn topic | minor | FR-002 | "Vui lòng duyệt và chọn topic phạm vi trước khi sinh câu" | Chọn topic hoặc "toàn văn" |
| E-ai-question-generation-003 | Job đồng thời thứ hai | Chạy job khi đã có job đang chạy | minor | FR-006 | "Đang có một job sinh câu chạy — chờ hoàn tất hoặc hủy job đó" | Chờ, hoặc admin hủy job cũ |
| E-ai-question-generation-004 | Vượt quota ngày | Tạo job thứ 11 trong ngày | minor | FR-006 | "Bạn đã đạt giới hạn 10 job sinh câu trong ngày — thử lại ngày mai" | Chờ reset quota |
| E-ai-question-generation-005 | Job lỗi provider | Provider timeout/output sai | major | FR-004, FR-005 | Job "lỗi" + lý do + nút retry | Retry (≤3); hết → "thất bại", chạy lại job mới |
| E-ai-question-generation-006 | Câu thiếu trường khi duyệt | Duyệt câu thiếu đáp án đúng/trường bắt buộc | minor | FR-010 | "Câu này thiếu {trường} — sửa trước khi duyệt vào ngân hàng" | Sửa bổ sung rồi duyệt |
| E-ai-question-generation-007 | Loại câu thiếu lý do | Bấm "Loại" không nhập lý do | minor | FR-011 | "Vui lòng nhập lý do loại câu" | Nhập lý do rồi xác nhận |
| E-ai-question-generation-008 | Câu đã được người khác xử lý | Reviewer quyết định trên câu vừa được xử lý | minor | FR-008 | "Câu này vừa được {người} {duyệt/loại}" | Chuyển câu khác; không ghi đè |
| E-ai-question-generation-009 | Đưa câu vào bank thất bại | Lỗi khi tạo QUESTION trong bank | major | FR-010 | "Chưa chuyển được câu vào ngân hàng — thử lại" | Retry; câu giữ "Chờ review" staging, không mất |
| E-ai-question-generation-010 | Staging quá hạn | Câu chờ review >90 ngày | minor | FR-016 | Cảnh báo "{n} câu chờ review sắp quá 90 ngày" trước hạn; quá hạn tự loại | Xử lý trước hạn; khôi phục từ bị-loại nếu cần (đề xuất) |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-ai-question-generation-01 | Câu AI được approve sau review | Tỷ lệ câu staging → đưa bank / tổng câu sinh | ≥60% (chốt cùng OQ-2 PRD) |
| SC-ai-question-generation-02 | Câu AI luôn qua review của con người | Tỷ lệ câu nguồn AI trong bank có bản ghi duyệt staging + duyệt bank | 100% (invariant) |
| SC-ai-question-generation-03 | Provenance đầy đủ | Tỷ lệ câu AI có tài liệu + phiên bản + job + người duyệt | 100% |
| SC-ai-question-generation-04 | Drift nguồn được kiểm soát | Tỷ lệ câu ảnh hưởng bởi đổi phiên bản được cờ và xử lý | 100% cờ; quyết định trong ≤7 ngày (đề xuất) |
| SC-ai-question-generation-05 | Job ổn định | Tỷ lệ job hoàn tất không cần retry thủ công | ≥80% sau 1 tháng bật feature |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Job sinh câu__ — cấu hình (nguồn + phiên bản + topic + loại + số câu +
  trình độ + kỹ năng), trạng thái, retry, người tạo, tổ chức.
- __Câu sinh (staging)__ — nội dung theo loại câu, phân loại đề xuất,
  đoạn trích evidence + vị trí, trạng thái review, cờ đã sửa/không có
  evidence, liên kết câu bank được tạo.
- __Lựa chọn câu sinh__ — phương án và cờ đáp án đúng của câu trắc nghiệm
  trong staging.
- __Tài liệu nguồn / Topic tài liệu__ — tham chiếu từ `document-library`.
- __Kỹ năng / Topic__ — tham chiếu taxonomy (`talent-framework`,
  `question-bank`).
- __Câu hỏi__ — tham chiếu `question-bank` (đích của câu được duyệt).
- __Người dùng__ — tham chiếu `org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/ai-question-generation-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Chọn tài liệu đã duyệt → duyệt/chọn topic → cấu hình → job
  async → staging câu nháp.
- __Flow 2:__ Review staging — xem evidence + cảnh báo trùng → duyệt/sửa/
  loại → câu duyệt vào bank "Chờ review".
- __Flow 3:__ Tài liệu đổi phiên bản → cờ cần rà soát → owner quyết định
  giữ/sửa/ngừng dùng.
- __Flow 4:__ Job lỗi → retry có giới hạn → thất bại giữ cấu hình.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __generation-source-picker__ — chọn tài liệu đã duyệt + phiên bản.
- __topic-review__ — danh sách topic trích xuất, duyệt/chỉnh/chọn phạm vi.
- __job-config__ — cấu hình loại câu, số câu, trình độ, kỹ năng.
- __job-list__ — danh sách job: trạng thái, tiến độ, lỗi, retry.
- __staging-review__ — hàng chờ câu nháp: câu + evidence + cảnh báo trùng
  + duyệt/sửa/loại.
- __recheck-list__ — danh sách câu "cần rà soát" khi nguồn đổi bản.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi job/câu staging thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Câu AI phải qua review của con người trước khi vào bank — không tự phát hành | PRD Mục 7.20, Mục 12 — Product owner |
| Chỉ sinh từ tài liệu đã duyệt; provenance theo phiên bản nguồn | PRD R-11, Mục 7.30 — Knowledge owner |
| Tài liệu đổi → owner review, không tự sync (giải OQ-9 theo hướng review) | PRD OQ-9 — Technical/Operations owner |
| Audit cho action nhạy cảm (duyệt, đưa vào bank, hủy job) | PRD Mục 9 — Security owner |
| AI output phải parse/review; service credential chỉ ở server boundary | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Tài liệu "Đã duyệt" + phiên bản + text trích xuất + topic | `document-intake`, `document-review`, `document-library` | FR-001, FR-002 — không có nguồn sinh |
| Điểm tạo QUESTION "Chờ review" + cảnh báo near-duplicate | `question-bank` | FR-010, FR-008 — đầu ra của duyệt staging |
| Taxonomy kỹ năng/trình độ/topic | `talent-framework`, `question-bank` | FR-003 — phân loại đề xuất |
| Role/scope cho quyền sinh/review/hủy | `org-governance` | Kiểm soát ai được sinh/duyệt |
| AI provider + credential server-side | `platform-configuration`, `external-integrations` | Job sinh chạy được |
| Ghi nhận usage/cost | `ai-usage-monitoring` | NFR-008 reconcile chi phí |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Duyệt staging → QUESTION "Chờ review" trong bank (cổng duy nhất) | FR-010 đổi đích — hoặc lặp hai hàng chờ review |
| Topic phải duyệt/chọn trước khi sinh | FR-002 mất rào chắn — câu sinh lan man |
| Câu không có đoạn trích vẫn vào staging kèm cờ | FR-007 chặn mất câu đúng khi provider thiếu vị trí |
| Staging reviewer ≠ bắt buộc khác reviewer bank nhưng khuyến nghị | Nếu bắt buộc khác → cần phân quyền chặt hơn |
| Quota Mục 7.2 là chuẩn draft | FR-006/NFR-005 đổi ngưỡng — chờ OQ-5 |
| Job async không chặn thao tác khác | UX phải chờ đồng bộ — thiết kế khác |

## 12. Open Questions

- [x] OQ-1: Câu AI duyệt vào bank ở trạng thái nào? — Resolved (đề
  xuất): "Chờ review" — bank review là cổng duy nhất tạo câu "Đã duyệt" —
  chờ Product owner xác nhận.
- [x] OQ-2: Ai được sinh câu và ai review staging (OQ-KB-01)? — Resolved
  (đề xuất): HR/content editor sinh; reviewer là vai trò nghiệp vụ do
  `org-governance` cấp — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-3: Tài liệu đổi phiên bản: tự sync hay owner review (OQ-9 PRD)?
  — Resolved (đề xuất): cờ "cần rà soát" + owner quyết định, không tự
  sync — chờ Technical/Operations owner xác nhận.
- [x] OQ-4: Câu không có đoạn trích evidence có được duyệt? — Resolved
  (đề xuất): vào staging kèm cờ "không có evidence"; khuyến nghị loại
  hoặc sửa gán đoạn trích trước duyệt — chờ Product owner xác nhận.
- [x] OQ-5: Quota (50 câu/job, 10 job/ngày, retry ×3, staging 90 ngày,
  job ≤15 phút) có làm chuẩn? — Resolved (đề xuất): dùng làm chuẩn draft —
  chờ Product owner + Admin lead xác nhận (OQ-KB-04).
- [x] OQ-6: Retention câu "bị-loại"/staging (OQ-KB-02)? — Resolved (đề
  xuất): 90 ngày rồi xóa; câu vào bank theo retention `question-bank` —
  chờ DPO/legal xác nhận (liên quan OQ-6 PRD).
- [~] OQ-7: Sinh câu từ nhiều tài liệu gộp trong một job? — Out of scope
  v1: slice mở rộng P2 — nguồn chỉ chứng minh sinh theo 1 tài liệu.
- [~] OQ-8: AI đề xuất taxonomy mới (kỹ năng/topic chưa có)? — Out of
  scope v1: P2; taxonomy do `talent-framework`/owner duyệt (OQ-11 PRD).
