FINAL REVIEW docs/features — Max (Devin), branch develop-dat

== KẾT QUẢ: PASS — 0 lỗi P0; 2 file sửa + 1 checker mới; 1 finding hệ thống còn chờ quyết định convention ==

== ĐÃ SỬA (finding đã xác minh) ==

1. [P0→fixed] skill-gap-analysis/srs/skill-gap-analysis-spec.md — REWRITE theo contract 12 mục của docs/features/README.md:
   - type: srs-spec → srs (đúng convention 38 spec còn lại)
   - REQ-skill-gap-001..013 → FR-skill-gap-analysis-001..013 (bảng FR chuẩn: ID|Title|Description|Priority|Verify by|Source)
   - NFR-skill-gap-* → NFR-skill-gap-analysis-001..005 (Category+Acceptance)
   - BR-skill-gap-* → BR-skill-gap-analysis-001..007 (Trigger+Implements FR+Source)
   - Thêm Error Matrix E-...-001..012 (suy từ AC cũ + URD §6), SC-...-01..05 (map USC-001..005), Actors & Stakeholders, Data Entities, Flows, Screens, Constraints/Dependencies/Assumptions (owner+hệ quả), OQ 8 mục giữ nguyên.
   - Semantic giữ nguyên: chỉ level "đã xác nhận" vào mẫu, "chưa-đánh-giá" ≠ level 0, action chỉ từ run "đã-xác-nhận", run immutable, không ranking/quyết định nhân sự tự động, privacy gate synthetic.
   - Sources giữ: PRD Mục 7.34, R-13, OQ-11, URD UN-*, brainstorm D3/D5/D7, reverse spec talent-and-crm.
2. vision-ocr/srs/vision-ocr-spec.md — thêm 1 dòng "Contract format" vào bảng OQ §7: ghi nhận UC-* là ngoại lệ source-backed ĐỀ XUẤT GIỮ, chờ Product owner/BA chốt. Không đổi contract.
3. plans/260914-prd-feature-pipeline/final-review-check.mjs — checker mới (artifacts/frontmatter/links/tables/ID/placeholder/OQ owner+impact), tái dùng được.
4. Normalize LF cho 3 file đã sửa; UTF-8 no BOM; không trailing whitespace.

== FINDINGS THEO SEVERITY ==

P0: không còn (skill-gap-analysis đã sửa xong).
P1 — hệ thống, CẦN quyết định convention trước khi sửa hàng loạt:
  * 185 Open Question checkbox rỗng trong ~30 file (16 brainstorm, 7 URD, 4 spec gold: question-bank/document-intake/meeting-records/management-reporting). Theo README: "OQ có thể để checkbox rỗng, nhưng phải nêu owner cần quyết định và ảnh hưởng nếu chưa chốt" → 74 item chưa nêu owner, 171 item chưa nêu impact. KHÔNG mass-edit: gán owner bừa sẽ bịa quyết định; phần lớn đã được resolve ở spec cùng feature (ví dụ account-access URD OQ-1..7 ↔ spec OQ-1..7 đều [x] Resolved). Đề xuất 3 hướng: (a) annotation từng item owner+impact lấy từ spec đã resolve; (b) 1 dòng note mặc định owner+impact đầu mỗi mục Open Questions; (c) nới README cho phép gold-style khi decider đã nêu trong câu hỏi. Chờ anh/BA chọn.
  * vision-ocr UC-* : ĐÁNH GIÁ = nên GIỮ ngoại lệ. Căn cứ: spec ghi nhận module standalone ĐÃ hiện thực (modules/vision-ocr), session-only, không persistence/org/role → bộ FR/NFR/BR/E/SC không khớp bản chất; rewrite sẽ làm mất precondition/postcondition/exception map trực tiếp hợp đồng source. Đã hợp thức hóa thành OQ chờ Product owner/BA (không để ngoại lệ ngầm).
P2:
  * Chất lượng câu chữ/format lẻ trong một số doc (không ảnh hưởng contract).

== ĐÃ VERIFY SẠCH ==

- artifacts: 39/39 feature đủ 4 file; không tạo trùng.
- frontmatter: đủ type/feature/updated (+status/links cho brainstorm/urd/srs); không còn type srs-spec.
- links: 334 markdown link + frontmatter links — 0 hỏng.
- tables: 1046 bảng — 0 lệch cột; không còn pipe chưa escape.
- ID: mọi FR/NFR/BR/E/SC prefix khớp feature tồn tại; 0 REQ-*; cross-feature refs (vd BR-question-bank-* trong ai-question-generation) hợp lệ.
- placeholders: 0 TODO/TBD/FIXME trong artifacts.
- Semantic: mọi spec có human-confirm keywords + scope/permission; chỉ vision-ocr không "audit" (đúng — session-only); skill-gap run state (đã-tính→đã-xác-nhận→đã-thay-thế) nhất quán spec↔ERD.
- ERD: check-erd.mjs → 39 files, 39 mermaid blocks, 0 errors.
- git diff --check (no-index): sạch; warning CRLF conversion là bình thường trên Windows.
- Lưu ý: skill-gap-erd refs + interview-management table pipe đã được tiến trình khác sửa trong lúc review — Max verify pass, không ghi đè.
- mermaid-verify: toolchain thiếu — tự soi thủ công (không chạy được mmdc/Chrome).

== QUYẾT ĐỊNH CÒN CHỜ OWNER ==

- Convention OQ mở (finding P1 trên) — cần anh/BA chọn hướng xử lý.
- vision-ocr contract format — chờ Product owner/BA.
- PRD-level vẫn mở theo thiết kế: OQ-6 retention (DPO), OQ-10 email SLA (Ops), OQ-11 skill weights (Head of HR), OQ-12 camera policy (DPO), OQ-13 OCR masking (DPO/legal), provider selection external-integrations.
- skill-gap-analysis: employee_skill_id là FK khái niệm (khóa thực profile+skill); GAP_RUN.unit_id cần contract đọc org-unit khi triển khai.

== FILES ĐÃ SỬA ==

- docs/features/skill-gap-analysis/srs/skill-gap-analysis-spec.md (rewrite theo contract)
- docs/features/vision-ocr/srs/vision-ocr-spec.md (+1 dòng OQ contract-format)
- plans/260914-prd-feature-pipeline/final-review-check.mjs (checker mới)

Không sửa PRD/changelog/code/secrets; không commit/push; mọi file UTF-8, ERD LF.
