---
type: srs
feature: release-announcements
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/release-announcements/brainstorms/approved-release-announcements.md
  - docs/features/release-announcements/release-announcements-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# release-announcements — Software Requirements Specification

## 1. Scope

SRS này cover kênh công bố thay đổi sản phẩm trong ứng dụng: soạn thông
báo phiên bản (tiêu đề, nội dung, nhãn phiên bản, đối tượng nhận, mức
quan trọng), luồng gửi duyệt → reviewer quyết định, công bố ngay hoặc
theo lịch, danh sách thông báo + badge chưa đọc cho người dùng, read
marker theo từng người, theo dõi tỷ lệ đọc, thu hồi/lưu trữ kèm lý do
và audit cho action nhạy cảm. Đây là bản ghi nghiệp vụ, KHÔNG phải Git
release/tag kỹ thuật.

Feature xếp MoSCoW `Could` (PRD Feature Map #36) — KHÔNG nằm trong cam
kết pilot v1; đây là slice mở rộng, áp dụng khi sponsor duyệt roadmap
tiếp theo.

KHÔNG cover: tự động suy nội dung từ commit/Git tag hay thay release
automation (PRD Mục 7.36 "Chưa làm"); nhắc người chưa đọc qua
notification (P1, phụ thuộc `contextual-notifications`); sửa sau công
bố (P1); mẫu thông báo, thống kê theo vai trò, đối chiếu hiển thị với
Git tag (P2); nhắm đối tượng theo đơn vị/chi nhánh (P2).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Admin | người | Soạn, gửi duyệt, lên lịch/công bố, thu hồi, theo dõi tỷ lệ đọc | Có |
| Reviewer (người giữ quyền "duyệt thông báo") | người | Duyệt hoặc trả về thông báo chờ duyệt kèm ghi chú | Có |
| Người dùng nội bộ | người | Xem thông báo đang công bố trong đối tượng của mình, đánh dấu đã đọc | Có |
| Product owner / quản lý | người | Đọc số liệu tỷ lệ đọc để quyết định truyền thông | Có (xem dashboard, không thao tác quản trị) |
| Tác vụ lên lịch của hệ thống | hệ thống | Chuyển thông báo đã duyệt sang "đã công bố" khi đến lịch | Có |
| `contextual-notifications` | hệ thống (feature khác) | Kênh nhắc lại người chưa đọc (P1) | Không |
| `org-governance` | hệ thống (feature khác) | Cung cấp role/scope/audit cho quyền duyệt và phạm vi đối tượng | Không (dependency) |
| `platform-configuration` | hệ thống (feature khác) | Nơi đặt cấu hình liên quan (ngưỡng quan trọng, hạn hiển thị) | Không (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-release-announcements-001 | Soạn thông báo nháp | Khi admin tạo thông báo, hệ thống phải ghi nhận tiêu đề, nội dung thay đổi, nhãn phiên bản hiển thị, đối tượng nhận (toàn bộ / theo vai trò) và mức quan trọng (thường / quan trọng), đặt trạng thái "nháp" | P0 | demo | PRD Mục 7.36 (draft); URD UN-001 |
| FR-release-announcements-002 | Sửa và xóa nháp | Trong khi thông báo ở "nháp", hệ thống phải cho người soạn (và vai trò được cấp) sửa tự do; chỉ thông báo "nháp" mới được xóa hẳn và xóa phải giữ vết audit | P0 | test | brainstorm Mục 6.2; URD UN-009 |
| FR-release-announcements-003 | Gửi duyệt | Khi người soạn bấm "Gửi duyệt", nếu đủ trường bắt buộc thì hệ thống phải chuyển thông báo sang "chờ duyệt" và đưa vào hàng chờ của người giữ quyền duyệt; nếu thiếu trường thì giữ "nháp" và liệt kê field thiếu | P0 | test | PRD Mục 7.36 (approved); URD UN-002 |
| FR-release-announcements-004 | Hàng chờ và quyết định duyệt | Khi reviewer mở hàng chờ, hệ thống phải liệt kê thông báo "chờ duyệt" kèm toàn bộ nội dung và đối tượng nhận; khi reviewer quyết định, hệ thống phải ghi nhận "duyệt" (→ "đã duyệt") hoặc "trả về" kèm ghi chú bắt buộc (→ "nháp"), gồm người duyệt và thời điểm | P0 | test | PRD Mục 7.36; URD UN-003 |
| FR-release-announcements-005 | Chặn tự duyệt | Khi người giữ quyền duyệt mở thông báo "chờ duyệt" do chính mình soạn, nếu tổ chức có ≥2 người giữ quyền duyệt thì hệ thống phải chặn hành động duyệt và báo lý do (đề xuất — chờ Admin lead xác nhận) | P0 | test | brainstorm Mục 6.1 (D6); URD UN-002 |
| FR-release-announcements-006 | Công bố ngay | Khi admin bấm "công bố ngay" trên thông báo "đã duyệt", hệ thống phải chuyển sang "đã công bố", ghi thời điểm công bố và làm thông báo hiển thị cho đúng đối tượng | P0 | test | PRD Mục 7.36 (công bố); URD UN-004 |
| FR-release-announcements-007 | Lên lịch công bố | Khi admin đặt lịch công bố trên thông báo "đã duyệt", hệ thống phải kiểm tra thời điểm là tương lai, giữ trạng thái "đã duyệt" kèm lịch, và tự chuyển "đã công bố" khi đến lịch (dung sai tối đa 1 chu kỳ kiểm tra) | P0 | test | PRD Mục 7.36 (lịch công bố); URD UN-004 |
| FR-release-announcements-008 | Cảnh báo quá lịch chưa công bố | Khi thông báo "đã duyệt" có lịch đã quá hạn mà chưa chuyển "đã công bố" (tác vụ lên lịch lỗi), hệ thống phải hiện cảnh báo "đã quá lịch công bố" trên màn admin và vẫn cho "công bố ngay" | P1 | test | brainstorm Mục 6.4; URD Mục 6 |
| FR-release-announcements-009 | Danh sách thông báo của người dùng | Khi người dùng nội bộ mở khu vực thông báo, hệ thống chỉ trả thông báo "đã công bố" thuộc đối tượng của người đó (toàn bộ, hoặc vai trò khớp), sắp mới nhất trước, đánh dấu chưa đọc/đã đọc | P0 | test | PRD Mục 7.36 (người dùng nhận biết); URD UN-005 |
| FR-release-announcements-010 | Badge chưa đọc | Hệ thống phải hiển thị số thông báo chưa đọc của người dùng trên khu vực thông báo, cập nhật ngay khi có read marker mới | P0 | demo | PRD Mục 7.36 (read marker); URD UN-005 |
| FR-release-announcements-011 | Ghi read marker | Khi người dùng mở xem nội dung một thông báo "đã công bố", hệ thống phải ghi read marker (người, thông báo, thời điểm) một lần và không đảo; đóng thông báo mà chưa mở nội dung không tính đã đọc | P0 | test | PRD Mục 7.36 (read marker); brainstorm Mục 6.1 (D7) |
| FR-release-announcements-012 | Người dùng mới vẫn thấy thông báo còn hạn | Khi tài khoản được tạo sau ngày công bố, hệ thống vẫn trả thông báo "đã công bố" còn trong hạn hiển thị (đề xuất 90 ngày) thuộc đối tượng của người đó, ở trạng thái chưa đọc | P1 | test | brainstorm Mục 6.4, 8; URD UN-010 |
| FR-release-announcements-013 | Theo dõi tỷ lệ đọc | Hệ thống phải cho admin xem trên mỗi thông báo đã công bố: số người mục tiêu đang hoạt động, số đã đọc, tỷ lệ đọc; lọc theo trạng thái/kỳ/mức quan trọng | P0 | demo | PRD Mục 7.36 (đo thành công); URD UN-008 |
| FR-release-announcements-014 | Thu hồi thông báo đã công bố | Khi admin thu hồi thông báo "đã công bố", hệ thống phải bắt buộc lý do ≥10 ký tự, chuyển thông báo sang "lưu trữ", ẩn khỏi mọi danh sách/badge của người dùng ngay, và vẫn cho admin xem lại kèm lý do + người thu hồi | P0 | test | PRD Mục 7.36 (rủi ro lệch phiên bản); URD UN-007 |
| FR-release-announcements-015 | Audit action nhạy cảm | Hệ thống phải ghi audit cho mọi action: gửi duyệt, duyệt, trả về, công bố (ngay/theo lịch), thu hồi, xóa nháp — đủ ai, khi nào, thông báo nào, lý do nếu có | P0 | kiểm tra | PRD Mục 9, Mục 7.2; URD UN-009 |
| FR-release-announcements-016 | Cảnh báo trùng nhãn phiên bản | Khi admin lưu nháp có nhãn phiên bản trùng với thông báo khác (bất kể trạng thái), hệ thống phải cảnh báo trùng nhãn nhưng vẫn cho lưu | P1 | demo | brainstorm Mục 6.5; URD Mục 6 |
| FR-release-announcements-017 | Nhắc người chưa đọc (thủ công) | Khi thông báo quan trọng quá hạn đọc mà tỷ lệ đọc thấp, hệ thống phải cho admin gửi nhắc lại tới người chưa đọc qua `contextual-notifications`; không tự gửi nếu admin không yêu cầu | P1 | demo | brainstorm Mục 4 (P1); URD Journey 4 |
| FR-release-announcements-018 | Sửa sau công bố có audit | Khi admin sửa nội dung thông báo "đã công bố", hệ thống phải ghi audit đầy đủ trước/sau và đánh dấu "đã chỉnh sửa" hiển thị cho người dùng; KHÔNG reset read marker trừ khi admin chọn "bắt buộc đọc lại" | P2 | test | brainstorm Mục 4 (P1), OQ-4; URD OQ-5 (OOS v1) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-release-announcements-001 | security | Thông báo chỉ hiển thị cho người đăng nhập thuộc đối tượng nhận và đúng organization/role/data-scope; màn quản trị chỉ cho vai trò được cấp | P0 | 0 sự cố lộ thông báo ngoài đối tượng được xác nhận (guardrail bám M-GR-01) |
| NFR-release-announcements-002 | auditability | Mọi thay đổi trạng thái và action nhạy cảm phải có vết audit đủ ai-khi nào-lý do | P0 | Truy vết được 100% sự kiện trên mẫu thông báo kiểm tra bất kỳ |
| NFR-release-announcements-003 | performance | Danh sách thông báo và badge của người dùng tải nhanh trong phiên làm việc | P1 | 95% lượt mở danh sách trả kết quả trong ≤3 giây ở quy mô ≤500 thông báo/tổ chức (giá trị đề xuất — xem OQ-4 URD) |
| NFR-release-announcements-004 | reliability | Tác vụ lên lịch công bố phải idempotent: chạy lại không tạo công bố trùng, và mọi thông báo quá lịch đều có đường phát hiện | P1 | Test chạy lại tác vụ không sinh bản ghi trùng; thông báo quá lịch xuất hiện cảnh báo ≤1 chu kỳ |
| NFR-release-announcements-005 | usability | Toàn bộ giao diện, thông báo hệ thống và nội dung công bố hỗ trợ tiếng Việt đầy đủ (dấu, ký tự đặc biệt) | P0 | Kiểm tra mẫu thông báo tiếng Việt có dấu lưu và hiển thị đúng |
| NFR-release-announcements-006 | data-retention | Thông báo đã lưu trữ và read marker vẫn truy vết được phục vụ audit và số liệu đọc lịch sử | P1 | Thời gian giữ theo quyết định retention — chờ OQ-6 PRD (đề xuất 24 tháng) |
| NFR-release-announcements-007 | integrity | Trạng thái thông báo không tự lệch với hành động con người: mọi chuyển trạng thái đều có actor (người hoặc tác vụ lên lịch) và vết audit | P0 | Không có chuyển trạng thái nào thiếu actor trong audit mẫu kiểm tra |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-release-announcements-001 | Chỉ thông báo "đã duyệt" mới được công bố — không có đường tắt từ nháp/chờ duyệt sang đã công bố | Khi có yêu cầu công bố trên trạng thái chưa duyệt | FR-release-announcements-004, 006, 007 | PRD Mục 12 (human-in-the-loop), Mục 7.36 |
| BR-release-announcements-002 | Từ chối duyệt bắt buộc ghi chú ≥10 ký tự và trả thông báo về "nháp" | Khi reviewer chọn "trả về" | FR-release-announcements-004 | brainstorm Mục 7.1 |
| BR-release-announcements-003 | Người soạn không được tự duyệt khi tổ chức có ≥2 người giữ quyền duyệt | Khi reviewer = người soạn trên thông báo chờ duyệt | FR-release-announcements-005 | brainstorm Mục 6.1 (D6) — đề xuất chờ Admin lead |
| BR-release-announcements-004 | Chỉ thông báo "nháp" được xóa hẳn; trạng thái khác chỉ được thu hồi/lưu trữ | Khi có yêu cầu xóa | FR-release-announcements-002, 014 | brainstorm Mục 6.2 |
| BR-release-announcements-005 | Thu hồi bắt buộc lý do ≥10 ký tự và audit; thông báo thu hồi ẩn khỏi người dùng ngay | Khi admin thu hồi | FR-release-announcements-014 | PRD Mục 7.36 (rủi ro chính) |
| BR-release-announcements-006 | Read marker ghi một lần, không đảo; chỉ mở xem nội dung mới tính đã đọc | Khi người dùng tương tác thông báo | FR-release-announcements-011 | brainstorm Mục 6.1 (D7), Mục 6.3 |
| BR-release-announcements-007 | Lịch công bố phải là thời điểm trong tương lai tại thời điểm đặt | Khi admin lưu lịch công bố | FR-release-announcements-007 | brainstorm Mục 7.1 |
| BR-release-announcements-008 | Thông báo chỉ hiển thị cho đối tượng nhận: "toàn bộ" hoặc vai trò khớp vai trò hiện tại của người xem | Khi render danh sách/badge | FR-release-announcements-009 | PRD Mục 9; brainstorm OQ-2 |
| BR-release-announcements-009 | Nhãn phiên bản là chuỗi hiển thị do admin nhập — hệ thống không bắt khớp Git tag và không tự suy nội dung | Khi lưu nhãn phiên bản | FR-release-announcements-001, 016 | PRD Mục 7.36 "Chưa làm"; OQ-5 PRD |
| BR-release-announcements-010 | Thông báo đã lưu trữ giữ nguyên read marker cũ để đo tỷ lệ đọc lịch sử | Khi thu hồi/lưu trữ | FR-release-announcements-014 | brainstorm Mục 6.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-release-announcements-001 | Thiếu trường bắt buộc khi gửi duyệt | "Gửi duyệt" trên nháp thiếu tiêu đề/nội dung/đối tượng | minor | FR-release-announcements-003 | Form hiện lỗi tại field + "Còn {n} thông tin bắt buộc chưa có — chưa thể gửi duyệt" | Người soạn bổ sung rồi gửi lại |
| E-release-announcements-002 | Lịch công bố trong quá khứ | Đặt lịch với thời điểm đã qua | minor | FR-release-announcements-007 | Hiện "Thời điểm công bố phải sau thời điểm hiện tại" | Chọn lại thời điểm |
| E-release-announcements-003 | Tự duyệt thông báo mình soạn | Người duyệt = người soạn khi tổ chức có ≥2 người duyệt | major | FR-release-announcements-005 | Hiện "Bạn không thể duyệt thông báo do chính mình soạn" | Người giữ quyền duyệt khác xử lý |
| E-release-announcements-004 | Xóa thông báo không phải nháp | Yêu cầu xóa trên chờ duyệt/đã duyệt/đã công bố/lưu trữ | major | FR-release-announcements-002 | Hiện "Chỉ có thể xóa thông báo ở trạng thái nháp" | Dùng thu hồi/lưu trữ thay thế |
| E-release-announcements-005 | Thu hồi thiếu lý do | Thu hồi với lý do rỗng hoặc <10 ký tự | minor | FR-release-announcements-014 | Hiện "Nhập lý do thu hồi (tối thiểu 10 ký tự)" | Nhập lý do rồi xác nhận |
| E-release-announcements-006 | Không có quyền quản trị | Người dùng không giữ quyền cố vào màn quản trị thông báo | major | FR-release-announcements-001 | Hiện "Bạn không có quyền quản lý thông báo phiên bản" | Xin cấp quyền qua admin; sự kiện ghi audit |
| E-release-announcements-007 | Tác vụ lên lịch lỗi — quá hạn chưa công bố | Thông báo đã duyệt quá `scheduled_at` vẫn chưa công bố | major | FR-release-announcements-008 | Cảnh báo "Thông báo đã quá lịch công bố — kiểm tra lại" trên màn admin | Tác vụ chạy lại ở chu kỳ kế hoặc admin "công bố ngay" |
| E-release-announcements-008 | Sửa đồng thời một nháp | Người thứ hai lưu khi nháp vừa được người khác cập nhật | minor | FR-release-announcements-002 | Cảnh báo "Thông báo vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-release-announcements-009 | Truy cập thông báo ngoài đối tượng | Người dùng cố mở thông báo không thuộc đối tượng của mình | major | FR-release-announcements-009 | Thông báo không hiển thị (ẩn hoàn toàn); truy cập trực tiếp báo không có quyền | —; sự kiện ghi audit |
| E-release-announcements-010 | Reviewer quyết định trên nội dung đã đổi | Người soạn sửa trong lúc reviewer đang mở màn duyệt | major | FR-release-announcements-004 | Cảnh báo nội dung vừa đổi trước khi ghi nhận quyết định | Reviewer xem lại bản mới rồi quyết định |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-release-announcements-01 | Người dùng mục tiêu đọc thông báo quan trọng đúng hạn | Tỷ lệ người mục tiêu có read marker ≤7 ngày sau công bố | ≥80% (đề xuất — chờ OQ-2 PRD chốt target) |
| SC-release-announcements-02 | Mọi thông báo đã công bố đều đã qua duyệt của người khác người soạn | Tỷ lệ thông báo "đã công bố" có review decision hợp lệ | 100% |
| SC-release-announcements-03 | Thông báo lệch phiên bản được xử lý kịp thời | Thời gian từ ghi nhận lệch đến thu hồi | ≤1 ngày làm việc |
| SC-release-announcements-04 | Action nhạy cảm truy vết được | Tỷ lệ action duyệt/trả/công bố/thu hồi có audit đủ | 100% |
| SC-release-announcements-05 | Công bố theo lịch đáng tin | Tỷ lệ thông báo đặt lịch được công bố trong dung sai 1 chu kỳ | 100% (ngoại trừ sự cố có cảnh báo) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Thông báo phiên bản__ — tiêu đề, nội dung, nhãn phiên bản, mức quan
  trọng, trạng thái vòng đời (nháp → chờ duyệt → đã duyệt → đã công bố →
  lưu trữ), lịch công bố, người soạn, lý do thu hồi.
- __Đối tượng nhận__ — phạm vi của một thông báo: toàn bộ người dùng hoặc
  danh sách vai trò.
- __Quyết định duyệt__ — bản ghi duyệt/trả về của reviewer kèm ghi chú
  và thời điểm.
- __Read marker__ — dấu đã đọc theo từng người dùng × thông báo, ghi một
  lần không đảo.
- __Người dùng nội bộ / Đơn vị tổ chức / Vai trò__ — entity neo tham
  chiếu từ `account-access`/`org-governance`, không sở hữu ở đây.

Chi tiết quan hệ + thuộc tính ở `srs/release-announcements-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Soạn nháp → gửi duyệt → reviewer duyệt/trả về → đã duyệt.
- __Flow 2:__ Đã duyệt → công bố ngay hoặc đến lịch → đã công bố → người
  dùng thấy badge.
- __Flow 3:__ Người dùng mở thông báo → ghi read marker → badge giảm.
- __Flow 4:__ Phát hiện lệch phiên bản → thu hồi kèm lý do → lưu trữ,
  (đề xuất) thông báo đính chính qua lại duyệt.
- __Flow 5:__ Admin xem theo dõi tỷ lệ đọc → quyết định nhắc lại (P1)
  hoặc kênh khác.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __announcement-list-admin__ — danh sách thông báo theo trạng thái/kỳ +
  số liệu đọc.
- __announcement-editor__ — soạn/sửa nháp với đủ trường bắt buộc và cảnh
  báo trùng nhãn.
- __review-queue__ — hàng chờ "chờ duyệt" của reviewer.
- __announcement-review-detail__ — xem toàn bộ nội dung + đối tượng +
  duyệt/trả về.
- __user-announcement-center__ — danh sách thông báo của người dùng +
  badge chưa đọc + xem nội dung.
- __announcement-tracking__ — bảng theo dõi tỷ lệ đọc (mục tiêu/đã đọc/
  tỷ lệ) theo thông báo.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi truy cập theo organization/role/data-scope; thông báo chỉ trong đối tượng nhận | PRD Mục 9 — Security owner |
| Mọi thông báo phải qua duyệt của con người trước công bố | PRD Mục 12 (invariant) — Product owner |
| Audit cho action nhạy cảm (duyệt, công bố, thu hồi, xóa) | PRD Mục 9 — Security owner |
| Không tự suy nội dung từ commit/Git tag; nhãn phiên bản do admin nhập | PRD Mục 7.36 "Chưa làm" — Product owner; OQ-5 PRD — Technical/Operations |
| Feature `Could` — không nằm trong cam kết v1, chỉ triển khai khi sponsor duyệt slice | PRD Feature Map #36 + Mục 12 — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Danh tính/phiên người dùng nội bộ | `account-access` | Read marker, badge, đối tượng nhận |
| Role/scope + vai trò + audit hành động | `org-governance` | Quyền soạn/duyệt, đối tượng theo vai trò, truy vết |
| Cấu hình nền tảng (ngưỡng quan trọng, hạn hiển thị, chu kỳ lịch) | `platform-configuration` | FR-007/012 vận hành theo cấu hình thay vì hardcode |
| Kênh gửi nhắc lại người chưa đọc | `contextual-notifications` | FR-017 (P1) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Vai trò "duyệt thông báo" gán được qua org-governance và có ≥2 người giữ trong tổ chức pilot | FR-005 chặn tự duyệt không áp dụng được — phải nới rule |
| Tác vụ lên lịch chạy theo chu kỳ 5 phút là đủ cho truyền thông nội bộ | FR-007/008 đổi dung sai và wording cảnh báo |
| Giới hạn số (150/10.000 ký tự, 90 ngày, 7 ngày, 20 dòng/trang, badge 9+) là chuẩn vận hành | FR-001/009/012 và NFR-003 đổi ngưỡng |
| Người dùng mục tiêu "đang hoạt động" xác định được từ trạng thái tài khoản của account-access | FR-013 đổi mẫu số tỷ lệ đọc |
| Thông báo không chứa dữ liệu cá nhân nhạy cảm — retention nhẹ hơn dữ liệu HR | NFR-006 phải siết theo chính sách PII |

## 12. Open Questions

- [x] OQ-1: Nhãn phiên bản có bắt buộc khớp Git tag/image release không?
  — Resolved (đề xuất): không — chuỗi hiển thị do admin nhập; deployment
  authority còn là OQ-5 PRD nên không ràng buộc tích hợp — chờ Admin
  lead/Technical owner xác nhận.
- [x] OQ-2: Đối tượng nhận gồm những lựa chọn nào? — Resolved (đề xuất):
  toàn bộ + theo vai trò; theo đơn vị/chi nhánh để P2 — chờ Product
  owner xác nhận.
- [x] OQ-3: Ai là reviewer hợp lệ và có chặn tự duyệt không? — Resolved
  (đề xuất): quyền "duyệt thông báo" qua org-governance; chặn tự duyệt
  khi ≥2 người giữ quyền — chờ Admin lead xác nhận.
- [x] OQ-4: Các giới hạn/ngưỡng số có được owner chấp nhận? — Resolved
  (đề xuất): chấp nhận làm giá trị vận hành ban đầu, tinh chỉnh sau 1
  tháng đo — chờ Admin lead xác nhận.
- [~] OQ-5: Sửa sau công bố và nhắc người chưa đọc? — Out of scope v1:
  FR-017/018 là P1/P2; v1 xử lý sai sót bằng thu hồi + thông báo đính
  chính mới.
- [~] OQ-6: Tự động gợi ý nội dung từ thay đổi kỹ thuật? — Out of scope
  v1: PRD "Chưa làm"; OQ-5 PRD phải đóng trước khi xét đối chiếu hiển
  thị (P2).
- [~] OQ-7: Retention thông báo + read marker? — Out of scope feature:
  thuộc OQ-6 PRD (DPO duyệt); đề xuất 24 tháng, trước đó chỉ synthetic.
