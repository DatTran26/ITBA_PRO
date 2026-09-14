---
type: urd
feature: platform-configuration
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/platform-configuration/brainstorms/platform-settings-governance.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# platform-configuration — User Requirements Document

## 1. Purpose

Cho admin một trung tâm cấu hình nền tảng có kiểm chứng: mọi tham số vận
hành (AI, email, assessment, phiên bản, hành vi nghiệp vụ) nằm trong một
catalog theo nhóm, thay đổi qua validation, secret không bao giờ lộ,
provider test được kết nối trước khi dùng, và mọi thay đổi nhạy cảm có
lịch sử để xem lại hoặc rollback — admin điều chỉnh vận hành mà không cần
sửa source hay nhờ kỹ thuật.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Admin | Muốn đổi tham số vận hành (SMTP, AI provider, ngưỡng module) | Phải nhờ kỹ thuật sửa source/env, không biết giá trị nào an toàn | Mỗi thay đổi nhỏ chậm và rủi ro; sợ chỉnh sai ảnh hưởng toàn tổ chức | Confirmed — PRD Mục 7.28, JTBD-ADM-01 |
| Admin | Cấu hình thay đổi nhiều lần trong quá trình vận hành | Không biết ai đã đổi gì, giá trị trước là gì | Không điều tra được khi có incident, không chứng minh cho khách hàng | Confirmed — PRD Mục 7.28 (history cho thay đổi nhạy cảm) |
| Admin | Cấu hình provider mới (SMTP, AI key) | Không biết cấu hình đúng chưa cho tới khi tính năng fail thật | Lời mời/thông báo/AI chết ngay khi cần dùng | Confirmed — PRD Mục 7.28 (test connection); hành trình Admin PRD Mục 7 |
| Security owner | Credential nằm trong form cấu hình, file env, log | Dễ lộ qua màn hình, export hoặc lịch sử | Lộ khóa AI/SMTP — phải thu hồi khẩn, mất uy tín | Confirmed — PRD Mục 9 (credential chỉ ở server boundary); Observed: reverse spec FR-PL-02/FR-PL-04 (mask + encryption có nền) |
| Vận hành nền tảng | Setting hệ thống và setting tenant lẫn nhau | Không rõ ai được sửa cái nào | Thay đổi nhầm phạm vi ảnh hưởng nhiều khách hàng | Assumption — suy từ mô hình B2B đa tenant của PRD Mục 3/9 |
| Feature owner (email, AI usage, release) | Đọc cấu hình từ nguồn rời rạc | Không biết nguồn nào là chuẩn | Feature đọc sai giá trị, khó debug | Observed: reverse spec FR-PL-02 (settings endpoint có nền) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Admin | Vận hành tenant: cấu hình provider, tham số module, cờ hành vi | Tự chỉnh setting theo nhóm, validate trước lưu, test trước khi dùng, rollback khi sai | Phụ thuộc kỹ thuật; sợ chỉnh sai gây incident; không truy vết được thay đổi |
| secondary | Vận hành nền tảng (platform operator) | Quản setting phạm vi hệ thống cho toàn platform | Phân biệt rõ setting hệ thống vs tổ chức, chỉ mình được sửa setting hệ thống | Hai phạm vi lẫn nhau gây sửa nhầm |
| secondary | Security owner | Kiểm soát credential và audit cấu hình | Secret không lộ; mọi thay đổi có vết | Secret có thể nằm trong form/log/history |
| secondary | Feature consumer (operational-email, ai-usage-monitoring, release-announcements, external-integrations) | Đọc cấu hình để hoạt động | Một nguồn cấu hình chuẩn có chủ | Cấu hình phân tán, không biết đọc đâu |
| out | HR/quản lý/nhân viên | Chịu ảnh hưởng của cấu hình nhưng không thao tác | (gián tiếp) hệ thống chạy đúng | Không có nhu cầu trực tiếp với feature này |

## 3. Scope Boundaries

### In Scope

- Catalog setting theo nhóm có chủ (AI, Email/SMTP, Assessment, Version,
  Feature behavior): key, kiểu giá trị, phạm vi hệ thống/tổ chức, giá trị
  mặc định an toàn, mô tả tác động — admin đọc và sửa theo phạm vi được
  cấp.
- Validation khi lưu: kiểu, miền, format, ràng buộc chéo và chặn giá trị
  vượt security/business invariant.
- Secret write-only: nhập một chiều, hiển thị masked mọi surface, xóa là
  hành động riêng có cảnh báo.
- Test connection cho provider setting (SMTP, AI): kết quả ghi lại, trạng
  thái "đã kiểm chứng/chưa kiểm chứng" rõ ràng.
- Lịch sử thay đổi append-only (revision: trước/sau + ai + khi nào + lý
  do) và rollback giá trị không-secret.
- Cảnh báo xác nhận cho setting ảnh hưởng toàn tổ chức; checklist trạng
  thái cấu hình bắt buộc khi bootstrap.
- Lọc "khác mặc định" và export cấu hình không-secret (P1).

### Out of Scope

- Nội dung và quy trình phê duyệt thông báo phiên bản — thuộc
  `release-announcements`; feature này chỉ giữ setting version hiển thị.
- Gửi email, mẫu email và log giao nhận — thuộc `operational-email`;
  feature này chỉ giữ cấu hình SMTP/provider.
- Đo lường và cảnh báo mức dùng AI — thuộc `ai-usage-monitoring`; feature
  này chỉ giữ setting provider/ngưỡng.
- Kết nối lịch/webhook/công cụ ngoài — thuộc `external-integrations`.
- Deployment authority và release automation (OQ-5 PRD) — quyết định vận
  hành hạ tầng, không phải setting nghiệp vụ.
- Tự tạo key cấu hình ngoài catalog, policy builder cấu hình tùy ý —
  catalog do sản phẩm công bố.
- Quản lý vai trò/quyền — thuộc `org-governance`; feature này tiêu thụ
  vai trò admin và audit boundary.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi cần xem/đổi tham số vận hành | Một nơi liệt kê setting theo nhóm với giá trị hiện tại, phạm vi và mô tả tác động | Tìm đúng setting cần chỉnh mà không hỏi kỹ thuật | Critical | Confirmed — PRD Mục 7.28 (categorized settings) |
| UN-002 | Admin | Khi sửa một setting | Được validate trước lưu và báo rõ lỗi nếu giá trị không hợp lệ hoặc vượt giới hạn an toàn | Không lưu được giá trị sai gây incident | Critical | Confirmed — PRD Mục 7.28 (validation, "Chưa làm" vượt invariants) |
| UN-003 | Admin | Khi nhập credential (SMTP password, AI key) | Nhập một chiều qua field bảo mật; hệ thống không hiển thị lại giá trị | Secret không lộ qua màn hình/log/lịch sử | Critical | Confirmed — PRD Mục 9; reverse spec FR-PL-04 |
| UN-004 | Admin | Khi cấu hình provider mới | Chạy "kiểm tra kết nối" và biết rõ cấu hình đã/chưa kiểm chứng | Phát hiện cấu hình sai trước khi tính năng fail thật | Critical | Confirmed — PRD Mục 7.28 (test connection), hành trình Admin |
| UN-005 | Admin | Khi cần điều tra hoặc sửa sai | Xem lịch sử thay đổi đủ trước/sau + ai + lý do; rollback giá trị cũ của setting không-secret | Truy vết và khôi phục được mà không cần kỹ thuật | Critical | Confirmed — PRD Mục 7.28 (history, rollback trong hành trình Admin) |
| UN-006 | Admin | Khi bootstrap tenant mới | Checklist setting bắt buộc kèm trạng thái chưa/đã/đã kiểm chứng | Không quên cấu hình khiến feature phụ thuộc chết | High | Assumption — suy từ hành trình Admin PRD Mục 7 và rủi ro vận hành |
| UN-007 | Vận hành nền tảng | Khi quản setting phạm vi hệ thống | Phân biệt rõ và chỉ mình được chỉnh setting hệ thống | Org admin không đụng được setting ảnh hưởng nhiều tenant | High | Assumption — mô hình B2B đa tenant; OQ-1 |
| UN-008 | Admin | Khi muốn biết cấu hình nào đã tùy chỉnh | Lọc các setting "khác mặc định" và so sánh với safe default | Nắm nhanh phần đã thay đổi khi bàn giao/điều tra | Medium | Assumption — mở rộng hợp lý từ "safe defaults" PRD Mục 7.28 |
| UN-009 | Admin | Khi onboard tenant tương tự tenant cũ | Export cấu hình không-secret và nhập lại | Giảm cấu hình tay lặp lại | Low | Assumption — nhu cầu onboard; P1 |
| UN-010 | Security owner | Khi kiểm tra ai đổi cấu hình nhạy cảm | Lịch sử append-only, không ai sửa/xóa; secret chỉ ghi "đã thay đổi" | Audit cấu hình chứng minh được | Critical | Confirmed — PRD Mục 9 (audit boundary), Mục 7.28 |

## 5. Prioritized User Journeys

### Journey 1: Cấu hình provider và kiểm chứng trước khi dùng

- **User:** Admin
- **Importance:** Critical
- **Trigger:** Tenant cần bật kênh email/AI — hành trình Admin bước 3
  trong PRD.
- **Expected outcome:** Provider được cấu hình, test connection đạt và
  trạng thái "đã kiểm chứng" hiển thị; kênh phụ thuộc sẵn sàng.
- **Related needs:** UN-003, UN-004, UN-006

1) Admin mở nhóm Email → nhập host/port/username; nhập password qua field
   bảo mật.
2) Lưu → validate đạt → revision + audit được ghi.
3) Bấm "Kiểm tra kết nối" → thành công → trạng thái "đã kiểm chứng".
4) Nếu lỗi → thông điệp rõ (không chứa secret) → sửa → test lại.

**Independent verification:** Cấu hình một SMTP mẫu → test đạt → bản ghi
test có ai/khi nào/kết quả; kênh email chỉ bật sau khi test đạt.

### Journey 2: Chỉnh sửa setting vận hành an toàn

- **User:** Admin
- **Importance:** Critical
- **Trigger:** Cần đổi tham số module (vd ngưỡng AI, tham số assessment).
- **Expected outcome:** Giá trị mới được validate, lưu kèm lý do, áp dụng
  ngay và có revision truy vết được.
- **Related needs:** UN-001, UN-002, UN-005, UN-010

1) Admin mở nhóm setting → sửa giá trị → nhập lý do (bắt buộc với setting
   nhạy cảm).
2) Validate đạt → xác nhận nếu ảnh hưởng toàn tổ chức → lưu → áp dụng.
3) Revision mới xuất hiện trong lịch sử với trước/sau + ai + lý do.

**Independent verification:** Đổi một setting rồi mở lịch sử — thấy đúng
giá trị trước/sau, người đổi và lý do; giá trị sai format bị chặn ngay
tại form.

### Journey 3: Rollback sau khi phát hiện cấu hình sai

- **User:** Admin
- **Importance:** High
- **Trigger:** Một thay đổi gây lỗi vận hành (vd cờ tắt nhầm tính năng).
- **Expected outcome:** Admin tự khôi phục giá trị trước trong vài phút,
  rollback có vết như thay đổi thường.
- **Related needs:** UN-005, UN-010

1) Mở lịch sử setting → chọn revision trước → xem diff → "Khôi phục".
2) Nhập lý do → hệ thống áp giá trị cũ như revision mới + audit.
3) Kiểm tra tính năng phụ thuộc hoạt động lại.

**Independent verification:** Đổi một setting sang giá trị lỗi → rollback
về revision trước → giá trị hiện hành đúng như cũ và lịch sử có 2 bản
ghi (đổi + khôi phục).

### Journey 4: Bootstrap checklist cấu hình bắt buộc

- **User:** Admin
- **Importance:** High
- **Trigger:** Tenant mới trước khi mở cho người dùng.
- **Expected outcome:** Mọi setting bắt buộc đạt trạng thái "đã kiểm
  chứng"; setting thiếu hiện cảnh báo với đường dẫn xử lý.
- **Related needs:** UN-006, UN-001

1) Mở "Trạng thái cấu hình" → thấy checklist bắt buộc + trạng thái.
2) Xử lý từng mục thiếu theo đường dẫn → test khi cần.
3) Checklist đạt → các feature phụ thuộc sẵn sàng.

**Independent verification:** Để trống một setting bắt buộc — checklist
báo thiếu và feature phụ thuộc không được đánh dấu sẵn sàng.

### Journey 5: Điều tra thay đổi cấu hình

- **User:** Admin / security owner
- **Importance:** Medium
- **Trigger:** Incident hoặc khách hàng hỏi "ai đã đổi cái này".
- **Expected outcome:** Lọc lịch sử theo setting/người/thời gian; chứng
  minh được chuỗi thay đổi; không ai sửa/xóa được bản ghi.
- **Related needs:** UN-005, UN-010

1) Vào lịch sử thay đổi → lọc theo nhóm/người/khoảng thời gian.
2) Mở revision → xem trước/sau + lý do.
3) Secret chỉ hiện "đã thay đổi secret" — không giá trị.

**Independent verification:** Thực hiện 5 thay đổi bởi 2 admin khác nhau —
lọc theo từng người trả đúng bản ghi của người đó, đủ trường, không sửa
được.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Nhập giá trị sai kiểu/miền/format | Không hiểu vì sao không lưu được | Báo lỗi tại field: "Giá trị không hợp lệ: {lý do}" | Journey 2 / UN-002 |
| Nhập secret vào field thường | Lộ credential nếu lọt | Chặn + "Không nhập thông tin bí mật vào trường này — dùng trường bảo mật riêng" | Journey 1 / UN-003 |
| Cố tắt setting bị khóa bởi invariant (vd audit) | Cấu hình mất an toàn nếu lọt | Chặn + "giá trị này vượt giới hạn an toàn của hệ thống" | Journey 2 / UN-002 |
| Test connection timeout/lỗi | Không biết cấu hình đúng chưa | Kết quả lỗi + thông điệp không chứa secret; trạng thái "chưa kiểm chứng" | Journey 1 / UN-004 |
| Org admin mở setting phạm vi hệ thống | Tưởng được sửa | Hiện "Cấu hình này thuộc phạm vi hệ thống — liên hệ vận hành nền tảng" | UN-007 |
| Sửa setting secret nhưng để trống field | Tưởng đã xóa secret | Giữ nguyên secret cũ; thông báo "để trống = giữ nguyên giá trị hiện tại" | Journey 1 / UN-003 |
| Xóa secret đang dùng | Kênh phụ thuộc chết đột ngột | Cảnh báo "kênh phụ thuộc sẽ ngừng" + audit | Journey 1 / UN-003 |
| Hai admin sửa cùng setting | Ghi đè không hay | Cảnh báo "Cấu hình vừa được {người} cập nhật — tải lại trước khi sửa" | Journey 2 / UN-005 |
| Rollback setting secret | Không khôi phục được như thường | "Không thể khôi phục giá trị bảo mật — vui lòng nhập giá trị mới" | Journey 3 / UN-005 |
| Setting bắt buộc chưa cấu hình | Feature phụ thuộc chết âm thầm | Checklist cảnh báo "Còn {n} cấu hình bắt buộc chưa hoàn tất" + đường dẫn | Journey 4 / UN-006 |
| Không phải admin truy cập màn cấu hình | Lộ tham số vận hành | Từ chối deny-by-default + ghi nhận lượt từ chối | UN-010 |

## 7. User-side Constraints

- Giao diện và toàn bộ thông báo tiếng Việt; mô tả tác động của setting
  viết cho admin hiểu, không phải thuật ngữ kỹ thuật.
- Chỉ vai trò admin (phạm vi tổ chức) và vận hành nền tảng (phạm vi hệ
  thống) thao tác; người khác không thấy màn cấu hình — qua
  `org-governance`.
- Secret chỉ nhập qua field bảo mật; không bao giờ hiển thị lại trên bất
  kỳ surface nào.
- Catalog key do sản phẩm công bố — admin không tự tạo setting mới.
- Màn cấu hình ưu tiên desktop (bảng setting, diff, lịch sử).
- Thay đổi áp dụng ngay — admin cần được cảnh báo trước khi lưu setting
  ảnh hưởng toàn tổ chức.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Catalog setting do sản phẩm công bố (key/nhóm/kiểu/phạm vi/mặc định/bắt buộc); admin không tạo key | Nếu cần key tự do → mất kiểm soát cấu hình | Assumption — chuẩn hóa cấu hình có chủ | Chốt danh sách key ở OQ-4 |
| Phạm vi 2 mức: hệ thống (vận hành nền tảng) và tổ chức (admin tenant) | Nếu thiếu phân biệt → org admin đụng setting toàn platform | Assumption — chờ owner | Chốt ở OQ-1 |
| Secret chỉ ở server boundary: write-only, không trả plaintext mọi surface | Nếu vi phạm → sự cố bảo mật nghiêm trọng | Confirmed — PRD Mục 9; reverse spec FR-PL-02/FR-PL-04 | — |
| SMTP/AI key mặc định nền tảng cấp ở scope hệ thống; tenant override được ở scope tổ chức | Nếu buộc BYOK → onboard phức tạp hơn; nếu cấm override → tenant lớn phàn nàn | Assumption — chờ Product owner + DPO | Chốt ở OQ-2 |
| Test connection không chặn lưu nhưng kênh phụ thuộc chỉ bật khi test đạt | Nếu chặn lưu → khó lưu nháp cấu hình; nếu không kiểm soát kênh → kênh chết khi dùng | Assumption — chờ owner | Chốt ở OQ-3 |
| Thay đổi áp dụng ngay, không cần restart | Nếu cần restart → phải có chế độ "chờ áp dụng" | Assumption — kiến trúc consumer đọc cấu hình | Xác nhận với Technical owner |
| Giới hạn đề xuất: 2.000 ký tự, 10 giây test, 50 revision/trang, giữ 20 test/setting, history ≥12 tháng | Nếu khác → wording/limit đổi | Assumption — chờ duyệt | Chốt ở OQ-5/OQ-7 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Thay đổi cấu hình không gây incident | Chưa có — xác lập bằng audit incident trong 1 tháng pilot | ≥98% thay đổi không kèm incident liên quan (đề xuất) | Tỷ lệ thay đổi có incident / tổng thay đổi (đo thành công PRD Mục 7.28) | 1 tháng sau pilot |
| USC-002 | Mọi thay đổi có vết truy vết | Chưa có | 100% thay đổi có revision đủ trước/sau + ai + thời điểm | Kiểm tra mẫu revision | Hàng tuần trong pilot |
| USC-003 | Không lộ secret | 0 sự cố | 0 sự cố lộ secret qua mọi surface (guardrail bám M-GR-01) | Số incident lộ credential | Liên tục |
| USC-004 | Provider được kiểm chứng trước khi dùng | Chưa có | 100% kênh phụ thuộc đi vào hoạt động có test đạt trước đó | Tỷ lệ kênh bật có bản ghi test đạt | Mỗi lần bật kênh |
| USC-005 | Admin tự cấu hình provider không cần kỹ thuật | Chưa có — xác lập bằng đo 3 lần cấu hình đầu | ≤30 phút từ mở form đến test đạt (đề xuất) | Thời gian hoàn tất journey 1 | Mỗi lần cấu hình mới |

## 10. Open Questions

- [x] OQ-1: Ai sở hữu setting phạm vi hệ thống? — Resolved (đề xuất):
  "vận hành nền tảng" là vai trò mức platform ngoài catalog vai trò của
  tổ chức; org admin chỉ thao tác setting phạm vi tổ chức của mình — chờ
  Operations owner xác nhận.
- [x] OQ-2: SMTP/AI key do nền tảng cấp hay tenant tự cấp (BYOK)? —
  Resolved (đề xuất): mặc định nền tảng cung cấp ở scope hệ thống; tenant
  được override bằng key riêng ở scope tổ chức khi có nhu cầu — chờ
  Product owner + DPO xác nhận.
- [x] OQ-3: Bắt buộc test connection đạt trước khi lưu? — Resolved (đề
  xuất): không chặn lưu (cho phép lưu nháp cấu hình) nhưng kênh phụ thuộc
  chỉ được bật khi test đạt — chờ Operations owner xác nhận.
- [x] OQ-4: Danh sách key catalog v1 theo nhóm? — Resolved (đề xuất):
  nhóm AI (provider, model mặc định, ngưỡng sử dụng), Email (SMTP host/
  port/from + secret), Assessment (tham số mặc định module), Version
  (phiên bản hiển thị), Feature behavior (cờ được công bố) — chờ
  Operations owner chốt danh sách chính thức.
- [x] OQ-5: Retention lịch sử thay đổi và kết quả test (OQ-6 PRD)? —
  Resolved (đề xuất): revision append-only giữ tối thiểu 12 tháng rolling
  thống nhất với audit `org-governance`; kết quả test giữ 20 lần gần nhất
  mỗi setting — chờ DPO/legal xác nhận.
- [~] OQ-6: Version setting có cần đối chiếu release thật (OQ-5 PRD)? —
  Out of scope v1: version setting chỉ là bản ghi hiển thị phục vụ
  `release-announcements`; deployment authority và đối chiếu release là
  quyết định vận hành hạ tầng — chờ Technical owner.
- [x] OQ-7: Các giới hạn (2.000 ký tự, 10 giây test, 50 revision/trang,
  20 test giữ lại, ~200 key catalog)? — Resolved (đề xuất): giữ các giá
  trị trên làm chuẩn v1 — chờ Operations owner xác nhận.
