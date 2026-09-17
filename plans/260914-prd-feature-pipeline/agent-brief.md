# Agent Brief — Pipeline /brainstorm → /urd → /srs → /erd cho Feature Map PRD

> Đọc kỹ toàn bộ file này trước khi làm. Bạn là 1 worker trong đội nhiều agent chạy
> song song trên cùng workspace `D:\Projects\Town_Hown`. Mỗi agent chỉ sở hữu đúng
> các feature được giao — KHÔNG đụng file của feature khác, KHÔNG sửa PRD, KHÔNG
> sửa `docs/_shared/changelog.md` (Max sẽ ghi log tập trung sau).

## 1. Nhiệm vụ

Với MỖI feature được giao, sản xuất theo thứ tự pipeline 4 artifact (bỏ qua artifact
đã tồn tại — xem mục 6):

1. `docs/features/{feature}/brainstorms/{idea-slug}.md` — theo `_templates/brainstorm.md`
2. `docs/features/{feature}/{feature}-urd.md` — theo `_templates/urd.md`
3. `docs/features/{feature}/srs/{feature}-spec.md` — theo `_templates/srs-spec.md` (chỉ Tầng 1 core spec)
4. `docs/features/{feature}/srs/{feature}-erd.md` — theo `_templates/diagram-erd.md`

Bạn đang chạy **autonomous**: KHÔNG có user để hỏi. Toàn bộ câu hỏi mà skill sẽ hỏi
user phải được BẠN trả lời bằng suy luận có căn cứ từ PRD + nguồn, và mọi suy luận
đó phải được GẮN NHÃN `Assumption` / `đề xuất` trong doc (xem mục 7). Đây là chế độ
"giải quyết toàn bộ question answer" — không để câu hỏi nào treo không câu trả lời.

## 2. Nguồn đọc (bắt buộc, theo thứ tự)

1. `docs/downtown/prd.md` — ĐỌC TOÀN BỘ (867 dòng). Nguồn sự thật duy nhất cho scope.
   Đặc biệt: Mục 3 (persona/JTBD), Mục 6 (themes, capability v1), Mục 7 (Feature Map +
   mini-brief từng feature ở Mục 7.{n}), Mục 8 (metrics), Mục 9 (constraints), Mục 10
   (risks), Mục 11 (OQ-1..13), Mục 12 (quyết định cần giữ).
2. `docs/_shared/project-profile.md` — thuật ngữ user, quy mô, quyết định đã có.
3. `docs/features/question-bank/brainstorms/question-bank-governance.md` và
   `docs/features/question-bank/question-bank-urd.md` — GOLD STANDARD về độ sâu,
   văn phong, cấu trúc bảng, cách gắn nhãn Evidence/Assumption. Bắt chước chất lượng này.
4. Templates: `_templates/brainstorm.md`, `_templates/urd.md`, `_templates/srs-spec.md`,
   `_templates/diagram-erd.md` — điền đúng cấu trúc, BỎ các dòng hướng-dẫn dạng
   `*...*`/comment ra khỏi doc thành phẩm.
5. Nguồn provenance (khi feature có): `docs/_reverse/` gồm `recruitment-and-interviews`,
   `assessment-and-grading`, `knowledge-and-question-bank`, `talent-and-crm`,
   `platform-communications-and-governance`. Chỉ đọc `reverse-gaps.md` + skim spec nếu
   feature bạn được map tới cụm đó — dùng làm evidence, KHÔNG copy nguyên văn.
6. Nếu feature đã có `brainstorms/*.md` hoặc `{feature}-urd.md` — đọc hết, dùng làm
   nguồn cho bước sau, KHÔNG viết lại.

## 3. Quy ước doc (bắt buộc)

- **Ngôn ngữ**: tiếng Việt, văn phong BA tự nhiên. Không dùng `§`, `¶`; `→` chỉ trong
  flow/diagram/bảng, prose dùng "sang/đến/dẫn tới". Bold dùng bình thường cho số liệu/
  key term.
- **Doc sạch**: KHÔNG chèn meta-text vào doc sinh ra (không "seed lấy từ...", không
  "chạy /skill-x để fill", không hướng dẫn cho người viết). Mục 12 của brainstorm chỉ
  chứa list lệnh next.
- **Frontmatter**: brainstorm/urd/spec dùng FULL frontmatter
  (`type`, `feature`, `status: draft`, `updated: 2026-09-14`, `links`); erd dùng slim
  (`type: srs-erd`, `feature`, `updated`). `links` = path tương đối từ root, luôn gồm
  `docs/downtown/prd.md` + upstream doc của feature + reverse-spec path nếu có.
- **ID prefix feature**: `FR-{feature}-NNN`, `NFR-{feature}-NNN`, `BR-{feature}-NNN`,
  `E-{feature}-NNN`, `SC-{feature}-NN`. URD dùng `UN-NNN`, `USC-NNN`. OQ dùng `OQ-n`.
- **Mức ưu tiên**: URD dùng `Critical/High/Medium/Low` (ảnh hưởng user); spec dùng
  `P0/P1/P2`. Không trộn hai thang.
- **Slug**: kebab-case ASCII ≤50 ký tự.

## 4. Ranh giới nội dung

- **BRD/PRD lọt vào URD**: cấm ROI, cost-benefit, business timeline, P0/P1/P2, release
  plan trong URD.
- **Solution design lọt vào spec.md**: spec chỉ chứa requirement nghiệp vụ + ràng buộc
  ĐÃ có trong PRD (ghi source). CẤM nền tảng/thuật toán/endpoint/DB schema/SDK cụ thể
  do bạn tự chọn. NFR viết thành outcome đo được ("người dùng thấy kết quả trong ≤3
  giây"), không phải hướng dẫn implement.
- **Human-in-the-loop là invariant** (PRD Mục 12): AI không tự quyết định tuyển/loại/
  kỷ luật/kết luận phẩm chất; mọi AI output có review/override/provenance. Tôn trọng
  điều này trong mọi flow.
- **Tôn trọng "Phạm vi v1" và "Chưa làm"** của mini-brief Mục 7.x — scope của spec/URD
  bám đúng; "Chưa làm" vào Out of Scope.
- **MoSCoW**: feature `Should`/`Could` vẫn làm đủ 4 doc nhưng ghi rõ trong spec rằng
  đây KHÔNG nằm trong cam kết v1 (slice mở rộng); feature `Must` mới là v1.
- **Provenance thận trọng**: ITBAAI/reverse spec = bằng chứng triển khai, KHÔNG phải
  bằng chứng nhu cầu. Khi cite làm Evidence: `Observed: reverse spec {cluster}`.

## 5. Chi tiết từng artifact

### 5.1 Brainstorm (`brainstorms/{idea-slug}.md`)

- `idea-slug`: semantic slug từ trọng tâm feature (vd `consent-gated-recording-and-summary`).
  Nếu feature đã có brainstorm — KHÔNG tạo thêm, dùng file đó làm nguồn cho URD.
- Điền đủ 12 Mục theo template. Mỗi Core Flow có numbered steps + ASCII diagram khi flow
  có ≥2 nhánh hoặc external call (box-drawing `┌ ─ ┐ │ ▼` trong code block, KHÔNG mermaid).
- Bảng 6.1 Decision Points bắt buộc; 6.2/6.3/6.4 chỉ khi có tín hiệu tương ứng
  (multi-role/state machine/external-async). State machine rất hay gặp ở domain này
  (status entity) — nghiêng về CÓ 6.3.
- Mục 7.2 limits/quota: luôn ghi số cụ thể; nếu là số đề xuất → nói rõ trong Assumptions
  + tạo OQ (đã giải) hỏi owner xác nhận.
- Mục 7.3 wording: exact strings tiếng Việt tự nhiên, chia 3 bảng error/success/info.

### 5.2 URD (`{feature}-urd.md`)

- Theo `_templates/urd.md`: Purpose + bảng User Problem (Evidence = `Confirmed — PRD
  Mục 7.x` / `Observed: {source}` / `Assumption`), đúng 1 primary user, In/Out scope
  rõ, User Needs `UN-*` đủ cột, Journeys xếp quan trọng giảm dần với **Independent
  verification** kiểm chứng được, Edge Conditions user-facing (không error matrix kỹ
  thuật), Constraints user-side, Assumptions có validation, USC đo được (baseline thiếu
  → `Chưa có — xác lập bằng {measurement} trong {period}`), OQ đã giải (mục 7).

### 5.3 Spec (`srs/{feature}-spec.md`)

- Theo `_templates/srs-spec.md` 12 Mục. FR derive từ "Phạm vi v1" + "Luồng chính" của
  PRD Mục 7.x (mỗi capability ~2-5 FR, atomic). FR/Error viết theo mẫu When/If-then
  khi mô tả sự kiện/lỗi. Mỗi BR map `Implements FR`. Error Matrix phủ các FR P0 có
  thể fail. Mục 8 entities là bullet tóm tắt (chi tiết ở erd.md). Mục 11: constraints
  có source/owner, dependencies (kéo từ cột "Phụ thuộc" của Feature Map), assumptions.
- ID continuity: nếu file đã tồn tại (hiếm) → append, không renumber.

### 5.4 ERD (`srs/{feature}-erd.md`)

- Mermaid `erDiagram`: entity UPPERCASE; attribute ĐÚNG 2 token `type name` (vd
  `string id PK`); type chỉ `string|int|decimal|date|datetime|boolean`; nghĩa nghiệp
  vụ + enum vào comment `"..."`; KHÔNG `uuid`/`jsonb`/`varchar(n)`, KHÔNG index.
- Cardinality đúng chiều: `A ||--o{ B` = 1 A có nhiều B. Quan hệ phải có FK chống
  lưng (cột `*_id FK` ở entity con). N:N → junction entity. Self-ref cần label.
- Cross-feature: khi cần trỏ entity của feature khác (vd `USER` của account-access),
  khai entity đó TỐI THIỂU (chỉ `string id PK` + 1-2 attr cốt) + ghi chú trong
  "Notes & Assumptions" rằng entity thuộc feature X. Không sao chép đầy đủ.
- SAU KHI Write: chạy `node .claude/scripts/mermaid-verify.mjs --file docs/features/{feature}/srs/{feature}-erd.md`.
  Nếu script fail vì thiếu mmdc/Chrome (exit 2, báo "Không tìm thấy Chrome") —
  toolchain không sẵn trong môi trường này: BỎ QUA và tự soi syntax bằng mắt
  (2-token attribute, label quan hệ có quote, không `;`/`&`/`<`/`>` trần trong label),
  ghi vào report "mermaid-verify: toolchain thiếu — tự soi thủ công". Nếu script chạy
  được mà FAIL → sửa tối đa 2 lần.

## 6. File đã tồn tại (update mode)

- Brainstorm đã có → skip bước brainstorm, dùng nó làm nguồn.
- URD đã có → đọc toàn bộ; nếu đã đủ chuẩn template + chất lượng gold-standard thì
  GIỮ NGUYÊN, chỉ sửa khi thiếu section bắt buộc rõ rệt; preserve nội dung có sẵn.
- Spec/ERD đã có → giữ ID, append mới, không renumber.

## 7. Chính sách Open Questions — "giải quyết toàn bộ"

Mọi OQ trong doc bạn tạo PHẢI có trạng thái đóng:

- `[x]` kèm `— Resolved: {câu trả lời}` khi bạn tự suy được đáp án hợp lý từ PRD/
  nguồn. Nếu là quyết định nghiệp vụ cần owner duyệt: `— Resolved (đề xuất): {đáp án}
  — chờ {owner} xác nhận`. Ví dụ owner: "Product owner", "DPO/legal", "Head of HR",
  "Admin lead".
- `[~]` kèm `— Out of scope v1: {lý do}` khi câu hỏi thuộc "Chưa làm"/roadmap mở rộng.
- KHÔNG để `[ ]` trần trừ khi câu hỏi thật sự chặn toàn bộ feature và không suy được —
  nếu vậy, báo trong report cho Max.

Khi OQ resolved, đảm bảo section liên quan (Assumptions/Risks/Validation) phản ánh đáp
án — không để doc tự mâu thuẫn (OQ nói A nhưng Mục 7 vẫn ghi B).

PRD-level OQ-1..13: KHÔNG sửa PRD. Khi feature của bạn bị 1 OQ PRD ảnh hưởng (vd OQ-6
retention, OQ-11 skill approval), giải quyết trong phạm vi feature bằng đáp án đề xuất
bám PRD và cite `(PRD OQ-n)` trong dòng resolved.

## 8. Báo cáo về cho Max

Kết thúc trả về structured summary (markdown, ≤80 dòng):

```
## Report: {agent-name}
- Features: {list}
- Files written/updated: {paths}
- OQ resolved: {n} (đề xuất chờ owner: {m})
- OQ hold/OOS: {list ngắn}
- Mermaid verify: {pass | toolchain-missing-manual-check}
- 🔶 Quyết định thay user đáng chú ý: {bullet}
- Vấn đề/blocker: {nếu có}
```

## 9. Cấm tuyệt đối

- KHÔNG sửa `docs/downtown/prd.md`, `docs/_shared/*`, `docs/_product/*`, file của
  feature không được giao, code trong `Frontend/`/`Backend/`/`modules/`.
- KHÔNG commit/push/chạy git mutation.
- KHÔNG bịa số liệu trình bày như fact — số tự đặt phải là "đề xuất"/Assumption.
- KHÔNG để doc mâu thuẫn nội tại (flow nói X, bảng quyền nói Y).
- KHÔNG viết tiếng Anh trừ khi thuật ngữ kỹ thuật cố định (workflow tên riêng).
