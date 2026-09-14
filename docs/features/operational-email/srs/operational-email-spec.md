---
type: srs
feature: operational-email
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/operational-email/brainstorms/template-driven-operational-email.md
  - docs/features/operational-email/operational-email-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# operational-email — Software Requirements Specification

## 1. Scope

SRS này cover kênh email nghiệp vụ có kiểm soát của một tổ chức: quản lý mẫu
email kèm biến và trạng thái duyệt, phiên bản mẫu, soạn từ ngữ cảnh nghiệp
vụ với biến tự điền theo whitelist, kiểm tra người nhận từ hồ sơ, preview
và test-send bắt buộc, gửi đơn/gửi hàng loạt có eligibility gate, gửi
idempotent, retry + dead-letter, bounce, resend và manual fallback, delivery
log truy vết, cấu hình SMTP/provider và phân quyền theo vai trò.

Feature này là `Should` trong Feature Map — KHÔNG nằm trong cam kết lát cắt
pilot v1 (PRD Mục 6.1); là slice mở rộng sau lát cắt recruitment.

KHÔNG cover: thông báo tự động theo event nghiệp vụ (`contextual-notifications`
— hai feature dùng chung hạ tầng SMTP và quy ước delivery/retry của OQ-10),
marketing automation/campaign/broadcast không eligibility gate, đa kênh OTT/
SMS, đính kèm file (v1), lên lịch gửi trước (P2), catalog cấu hình nền tảng
và secret store (`platform-configuration` — giá trị SMTP nằm ở đó làm nguồn
duy nhất), và dữ liệu nguồn của ngữ cảnh (application, offer, hồ sơ — thuộc
`candidate-pipeline`, `offer-management`, `employee-profiles`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Soạn/gửi email từ mẫu đã duyệt, theo dõi giao nhận, xử lý lỗi | Có |
| Người duyệt mẫu (HR lead/admin có quyền duyệt) | người | Duyệt/yêu cầu chỉnh mẫu trước khi dùng | Có |
| Admin | người | Cấu hình SMTP, phân quyền gửi/duyệt, giám sát log | Có |
| Ứng viên / nhân sự (người nhận) | người | Nhận email đúng dữ liệu qua địa chỉ trong hồ sơ | Có (chỉ là điểm đến, không giao diện) |
| DPO/legal nominee | người | Duyệt whitelist trường làm biến, kiểm soát payload | Có (stakeholder ràng buộc) |
| `org-governance` | hệ thống (feature khác) | Cung cấp vai trò/quyền/phạm vi + audit | Không (dependency) |
| `platform-configuration` | hệ thống (feature khác) | Giữ giá trị SMTP/provider trong catalog — nguồn duy nhất | Không (dependency, cùng slice Should) |
| `contextual-notifications` | hệ thống (feature khác) | Báo kết quả batch/FAILED tới người gửi | Không (dependency) |
| `candidate-pipeline` / `offer-management` / `employee-profiles` / `account-access` | hệ thống (feature khác) | Ngữ cảnh + hồ sơ email người nhận | Không (nguồn dữ liệu) |
| SMTP provider | ngoài | Giao email tới người nhận | Có (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-operational-email-001 | CRUD mẫu email kèm biến | Hệ thống phải cho người có quyền soạn tạo/sửa mẫu: tên duy nhất trong tổ chức, ngữ cảnh áp dụng từ danh sách công bố, tiêu đề, nội dung kèm biến định dạng `{ten_bien}` chỉ thuộc whitelist; trạng thái khởi tạo "Bản nháp" | P0 | demo | PRD Mục 7.35 (mẫu, biến); URD UN-001 |
| FR-operational-email-002 | Luồng duyệt mẫu | Khi người soạn "Gửi duyệt" trên mẫu đủ trường bắt buộc, hệ thống phải chuyển mẫu sang "Chờ duyệt" trong hàng chờ của người duyệt; khi người duyệt quyết định, hệ thống ghi nhận "Đã duyệt" hoặc "Yêu cầu chỉnh" kèm ghi chú, người duyệt và thời điểm | P0 | test | brainstorm Mục 5.1; URD UN-005; PRD Mục 12 |
| FR-operational-email-003 | Phiên bản mẫu | Khi mẫu "Đã duyệt" bị sửa lớn (tiêu đề, nội dung hoặc biến), hệ thống phải tạo phiên bản mới ở "Chờ duyệt" và giữ phiên bản cũ dùng được tới khi bản mới được duyệt; delivery log ghi nhận đúng phiên bản đã dùng | P0 | test | brainstorm Mục 4, 5.1 (D2); URD UN-006 |
| FR-operational-email-004 | Chỉ mẫu đã duyệt được gửi | Hệ thống phải chỉ cho chọn mẫu ở trạng thái "Đã duyệt" khi soạn/gửi, và chặn mọi lệnh gửi trên mẫu khác trạng thái | P0 | test | brainstorm Mục 6.1 (D1); PRD Mục 12 |
| FR-operational-email-005 | Soạn từ ngữ cảnh + điền biến | Khi HR chọn mẫu từ một ngữ cảnh nghiệp vụ (ứng viên/application, offer, nhân sự), hệ thống phải điền biến từ hồ sơ nguồn; nếu biến bắt buộc thiếu dữ liệu thì chặn gửi và liệt kê biến thiếu; biến không bắt buộc render rỗng thì cảnh báo trong preview | P0 | test | PRD Mục 7.35 (tự điền dữ liệu đúng ngữ cảnh); brainstorm D3 |
| FR-operational-email-006 | Whitelist biến (minimal payload) | Hệ thống phải quản whitelist trường được phép làm biến theo ngữ cảnh do owner nghiệp vụ + DPO duyệt; biến ngoài whitelist hoặc trường nhạy cảm (lương, điểm đánh giá, giấy tờ tùy thân) bị chặn khi lưu mẫu và khi render | P0 | test | PRD Mục 9, R-08; brainstorm Mục 4; URD UN-009 |
| FR-operational-email-007 | Resolve và kiểm tra người nhận | Khi gửi, hệ thống phải resolve người nhận từ hồ sơ nghiệp vụ và kiểm tra hợp lệ (địa chỉ email đúng định dạng, tài khoản nội bộ còn active); người không hợp lệ bị loại khỏi gửi kèm lý do | P0 | test | PRD Mục 7.35 (kiểm người nhận), R-08/R-12 |
| FR-operational-email-008 | Địa chỉ ngoài hồ sơ | Khi HR nhập địa chỉ không có trong hồ sơ cho gửi đơn, hệ thống phải yêu cầu xác nhận riêng và ghi audit; địa chỉ ngoài hồ sơ không được phép trong bulk send | P0 | test | brainstorm Mục 6.1 (D4); URD OQ-8; R-08 |
| FR-operational-email-009 | Preview bắt buộc | Trước mọi lệnh gửi (đơn/bulk), hệ thống phải hiển thị nội dung cuối đã điền biến + danh sách người nhận (với bulk: số lượng, người bị loại kèm lý do); không có đường gửi bỏ qua preview | P0 | demo | brainstorm Mục 4, 5.2/5.3 |
| FR-operational-email-010 | Test-send | Hệ thống phải cho gửi thử email đã soạn tới chính người gửi hoặc địa chỉ nội bộ (tối đa 5), đánh dấu rõ là email THỬ và không tính vào giao nhận nghiệp vụ | P0 | demo | PRD Mục 7.35 (test-send); brainstorm 7.1 |
| FR-operational-email-011 | Gửi đơn | Khi HR xác nhận gửi đơn sau preview, hệ thống phải tạo delivery vào hàng chờ gửi qua SMTP và ghi log kết quả | P0 | test | PRD Mục 7.35 (single send) |
| FR-operational-email-012 | Bulk send + eligibility gate | Khi HR có quyền gửi hàng loạt chọn nhóm đối tượng theo tiêu chí ngữ cảnh nghiệp vụ, hệ thống phải lọc danh sách hợp lệ (loại người thiếu email, không đủ điều kiện, tài khoản deactivate), bắt buộc preview danh sách + người bị loại kèm lý do, giới hạn 200 người nhận/batch | P0 | test | PRD Mục 7.35 (bulk send + "Chưa làm"); brainstorm D5; URD OQ-3 |
| FR-operational-email-013 | Gửi idempotent | Hệ thống phải bảo đảm mỗi (batch, địa chỉ người nhận) chỉ có một delivery: bấm gửi hai lần, double submit hoặc retry không tạo email trùng; địa chỉ trùng trong một batch được gộp + cảnh báo | P0 | test | R-12; brainstorm Mục 6.4, 6.5; URD UN-011 |
| FR-operational-email-014 | Retry + dead-letter + bounce | Khi SMTP trả lỗi, hệ thống phải retry theo lịch 5 phút/30 phút/2 giờ; hết lượt chuyển delivery sang FAILED (dead-letter) và báo người gửi; khi provider báo bounce, delivery chuyển BOUNCED kèm lý do | P0 | test | brainstorm Mục 6.1 (D6), 7.2; R-07/R-12; OQ-10 đề xuất |
| FR-operational-email-015 | Resend và manual fallback | Hệ thống phải cho resend phần FAILED của một batch sau khi nguyên nhân được sửa (vd đổi địa chỉ trong hồ sơ), không gửi lại phần đã SENT; và cho ghi nhận "đã liên hệ kênh khác" kèm người ghi/thời điểm để đóng vết xử lý | P0 | test | brainstorm Mục 5.4, 6.1 (D7); R-07 |
| FR-operational-email-016 | Delivery log truy vết | Mọi delivery phải có bản ghi: mẫu + phiên bản, batch, người nhận, người gửi, trạng thái, số lần thử, mốc thời gian và lỗi cuối; HR/admin lọc theo mẫu, người gửi, trạng thái, ngữ cảnh | P0 | kiểm tra | PRD Mục 7.35 (log, truy vết); R-12; URD UN-010 |
| FR-operational-email-017 | Cấu hình SMTP/provider | Hệ thống phải cho admin cấu hình SMTP (host, port, from, credential): nhập credential qua field bảo mật write-only mã hóa phía server, test connection, và rollback cấu hình trước; giá trị nằm trong catalog `platform-configuration` làm nguồn duy nhất | P0 | test | PRD Mục 7.35 (quyền cấu hình), Mục 9; reverse spec FR-PL-03/FR-PL-04; URD UN-007, OQ-9 |
| FR-operational-email-018 | Phân quyền chi tiết | Hệ thống phải tách quyền: soạn mẫu, duyệt mẫu, gửi đơn, gửi hàng loạt, cấu hình SMTP, xem log — gán theo vai trò trong `org-governance`; deny-by-default | P0 | test | brainstorm Mục 4, 6.2; PRD Mục 9; URD UN-008 |
| FR-operational-email-019 | Báo kết quả cho người gửi | Khi batch kết thúc hoặc có delivery FAILED, hệ thống phải báo người gửi qua `contextual-notifications` (fallback: hiển thị trong log) kèm tổng kết SENT/FAILED | P1 | test | brainstorm Mục 4 (P1); dependency PRD Feature Map #26 |
| FR-operational-email-020 | Ngừng dùng mẫu | Khi người có quyền đánh dấu "Ngừng dùng" kèm lý do, hệ thống phải ẩn mẫu khỏi chọn mới; batch đang gửi hoàn tất phần QUEUED; email đã gửi giữ nguyên phiên bản đã dùng | P0 | test | brainstorm Mục 5.1, 6.5 |
| FR-operational-email-021 | Snapshot nội dung đã gửi | Hệ thống phải giữ snapshot tối thiểu của email đã render (tiêu đề, nội dung cuối, địa chỉ tại thời điểm gửi) trên mỗi delivery để truy vết đúng những gì người nhận nhận được | P0 | kiểm tra | brainstorm Mục 6.4; URD OQ-5; R-12 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-operational-email-001 | security | Minimal payload: mọi email chỉ chứa trường trong whitelist; credential SMTP chỉ ở server boundary, không plaintext trên mọi surface | P0 | 0 email chứa trường ngoài whitelist; 0 sự cố lộ credential (bám M-GR-01, R-08) |
| NFR-operational-email-002 | reliability | Không email nào mất âm thầm: mọi delivery kết thúc ở trạng thái ghi nhận được, FAILED có người được báo, retry/resend không tạo trùng | P0 | 0 delivery không có trạng thái cuối; 0 email trùng cho cùng khóa batch+recipient |
| NFR-operational-email-003 | auditability | Mọi hành động soạn/duyệt/ngừng mẫu, mỗi lần gửi/resend/fallback và thay cấu hình đều có vết ai/khi nào/kết quả | P0 | 100% sự kiện trên mẫu kiểm tra có bản ghi đủ trường |
| NFR-operational-email-004 | performance | Batch 200 người nhận được xử lý mà không chặn thao tác khác của người gửi | P1 | Batch 200 hoàn tất dispatch trong ≤15 phút ở SMTP khỏe (đề xuất — chờ OQ-10) |
| NFR-operational-email-005 | usability | Toàn bộ giao diện, mẫu mặc định và thông báo là tiếng Việt tự nhiên; email hỗ trợ đầy đủ dấu tiếng Việt | P0 | Kiểm tra mẫu email tiếng Việt render đúng trước release |
| NFR-operational-email-006 | privacy | Delivery log và snapshot nội dung giữ theo retention đã duyệt (đề xuất: log theo audit policy, snapshot tối thiểu); consent/người nhận theo chính sách | P0 | Retention chính thức chờ DPO (OQ-6 PRD); chỉ dữ liệu synthetic trước privacy gate |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-operational-email-001 | Chỉ mẫu "Đã duyệt" được dùng gửi — không ngoại lệ, kể cả test-send cũng dùng mẫu đã duyệt | Khi chọn mẫu để gửi | FR-operational-email-004 | brainstorm Mục 4; PRD Mục 12 |
| BR-operational-email-002 | Sửa lớn (tiêu đề/nội dung/biến) trên mẫu đã duyệt buộc tạo phiên bản mới qua duyệt; sửa nhỏ giữ trạng thái | Khi lưu sửa trên mẫu "Đã duyệt" | FR-operational-email-003 | brainstorm Mục 6.1 (D2) |
| BR-operational-email-003 | Biến chỉ từ whitelist theo ngữ cảnh; trường nhạy cảm (lương, điểm đánh giá, giấy tờ tùy thân) luôn bị chặn ở lưu mẫu và render | Khi lưu mẫu hoặc render email | FR-operational-email-006 | PRD Mục 9, R-08; URD OQ-6 |
| BR-operational-email-004 | Người nhận resolve từ hồ sơ; địa chỉ ngoài hồ sơ chỉ cho gửi đơn kèm xác nhận riêng + audit; cấm trong bulk | Khi thêm người nhận | FR-operational-email-007, FR-operational-email-008 | brainstorm D4; R-08; URD OQ-8 |
| BR-operational-email-005 | Bulk send bắt buộc qua eligibility gate theo tiêu chí ngữ cảnh + preview danh sách; tối đa 200 người nhận/batch | Khi tạo batch | FR-operational-email-012 | PRD Mục 7.35 "Chưa làm"; URD OQ-3 |
| BR-operational-email-006 | Khóa idempotent = batch + địa chỉ người nhận; địa chỉ trùng trong batch gộp một delivery | Khi tạo delivery | FR-operational-email-013 | brainstorm 6.4/6.5; R-12 |
| BR-operational-email-007 | Retry tối đa 3 lần theo lịch 5 phút/30 phút/2 giờ; hết lượt → FAILED dead-letter; bounce → BOUNCED kèm lý do | Khi SMTP trả lỗi/bounce | FR-operational-email-014 | brainstorm 7.2; R-07/R-12; OQ-10 đề xuất |
| BR-operational-email-008 | Resend chỉ phần FAILED; manual fallback ghi nhận người liên hệ + thời điểm để đóng vết | Khi xử lý delivery lỗi | FR-operational-email-015 | brainstorm 5.4; R-07 |
| BR-operational-email-009 | Preview và xác nhận là bước bắt buộc trước mọi lệnh gửi; test-send chỉ tới nội bộ và đánh dấu THỬ | Khi gửi đơn/bulk/thử | FR-operational-email-009, FR-operational-email-010 | brainstorm 5.2; PRD Mục 7.35 |
| BR-operational-email-010 | Mẫu bị "Ngừng dùng" không chọn được cho batch mới; batch đang gửi hoàn tất phần QUEUED; delivery giữ phiên bản đã dùng | Khi ngừng dùng mẫu | FR-operational-email-020 | brainstorm 6.5 |
| BR-operational-email-011 | Quyền gửi hàng loạt tách riêng quyền gửi đơn; quyền cấu hình SMTP chỉ admin | Khi kiểm tra quyền thao tác | FR-operational-email-018 | brainstorm 8; PRD Mục 9 |
| BR-operational-email-012 | Delivery log giữ địa chỉ và snapshot tại thời điểm gửi — không cập nhật theo hồ sơ sau đó | Khi hồ sơ người nhận đổi sau gửi | FR-operational-email-016, FR-operational-email-021 | brainstorm 6.4 |
| BR-operational-email-013 | Credential SMTP chỉ nhập qua field bảo mật, lưu mã hóa phía server; đọc lại chỉ trả trạng thái | Khi lưu/đọc cấu hình SMTP | FR-operational-email-017 | PRD Mục 9; reverse spec FR-PL-04 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-operational-email-001 | Thiếu biến bắt buộc | Gửi/preview khi hồ sơ thiếu dữ liệu cho biến bắt buộc | major | FR-operational-email-005 | Hiện "Email chưa đủ dữ liệu cho biến: {danh sách biến} — bổ sung hồ sơ trước khi gửi" | Bổ sung hồ sơ hoặc chọn mẫu khác |
| E-operational-email-002 | Mẫu chưa duyệt | Chọn gửi trên mẫu không ở "Đã duyệt" | minor | FR-operational-email-004 | Hiện "Mẫu này chưa được duyệt — chỉ mẫu đã duyệt mới gửi được" | Gửi duyệt mẫu hoặc chọn mẫu khác |
| E-operational-email-003 | Biến ngoài whitelist | Lưu mẫu chứa biến không được phép | major | FR-operational-email-006 | Hiện "Biến {tên} không nằm trong danh sách trường được phép dùng trong email" | Bỏ biến hoặc đề nghị mở whitelist |
| E-operational-email-004 | Người nhận không hợp lệ | Địa chỉ sai định dạng/thiếu trong hồ sơ; tài khoản deactivate | major | FR-operational-email-007 | Hiện "Người nhận {tên} không có email hợp lệ trong hồ sơ"; bulk loại kèm lý do trong preview | Sửa email hồ sơ hoặc loại khỏi danh sách |
| E-operational-email-005 | Địa chỉ ngoài hồ sơ chưa xác nhận | Nhập tay địa chỉ không trong hồ sơ cho gửi đơn | minor | FR-operational-email-008 | Hiện "Địa chỉ này không có trong hồ sơ — xác nhận bạn muốn gửi tới {địa chỉ}" | Xác nhận (ghi audit) hoặc sửa lại |
| E-operational-email-006 | Vượt giới hạn batch | Danh sách bulk >200 người nhận | minor | FR-operational-email-012 | Hiện "Một lần gửi tối đa 200 người nhận — chia nhỏ danh sách" | Chia nhỏ danh sách gửi nhiều batch |
| E-operational-email-007 | Chưa cấu hình SMTP | Gửi khi chưa có cấu hình provider hợp lệ | critical | FR-operational-email-017 | Hiện "Chưa có cấu hình email — liên hệ admin để thiết lập trước khi gửi" | Admin cấu hình + test đạt |
| E-operational-email-008 | SMTP lỗi/hết retry | Provider trả lỗi liên tục qua 3 lần retry | major | FR-operational-email-014 | Delivery FAILED + lỗi cuối; báo "Email tới {địa chỉ} gửi thất bại sau 3 lần thử: {lý do}" | Sửa nguyên nhân rồi resend hoặc liên hệ kênh khác |
| E-operational-email-009 | Email bounce | Provider báo địa chỉ bị từ chối | major | FR-operational-email-014 | Delivery BOUNCED + lý do trong log | Cập nhật email hồ sơ rồi resend |
| E-operational-email-010 | Test connection lỗi | Admin test SMTP không kết nối được | major | FR-operational-email-017 | Hiện "Không kết nối được máy chủ email: {lý do} — kiểm tra lại cấu hình" | Sửa cấu hình rồi test lại; rollback nếu cần |
| E-operational-email-011 | Không có quyền gửi hàng loạt | Vai trò chỉ có quyền gửi đơn cố tạo bulk | major | FR-operational-email-018 | Hiện "Bạn không có quyền gửi email hàng loạt" | Xin admin cấp quyền; lượt từ chối ghi nhận |
| E-operational-email-012 | Người duyệt trên bản cũ | Mẫu bị sửa sau khi người duyệt mở màn review | minor | FR-operational-email-002 | Cảnh báo mẫu đã đổi trước khi ghi nhận quyết định | Người duyệt xem bản mới rồi quyết định |
| E-operational-email-013 | SMTP down giữa batch | Provider mất kết nối khi batch đang gửi | major | FR-operational-email-014 | Batch ĐANG-GỬI; phần chưa gửi ở QUEUED | Provider phục hồi → tiếp tục; hết retry → FAILED phần còn lại |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-operational-email-01 | Email nghiệp vụ giao thành công | Tỷ lệ delivery đạt SENT/DELIVERED / tổng delivery hợp lệ (đo thành công PRD Mục 7.35) | ≥95% (đề xuất — chờ OQ-10/OQ-2) |
| SC-operational-email-02 | Truy vết đầy đủ | Tỷ lệ delivery log đủ mẫu+phiên bản, người gửi, trạng thái, mốc thời gian | 100% |
| SC-operational-email-03 | Chỉ mẫu đã duyệt được gửi | Tỷ lệ email gửi từ mẫu "Đã duyệt" | 100%; 0 email từ mẫu chưa duyệt |
| SC-operational-email-04 | Không lộ payload | Số incident email chứa trường ngoài whitelist hoặc gửi sai người do nhập tay chưa xác nhận | 0 (bám M-GR-01, R-08/R-12) |
| SC-operational-email-05 | Không gửi trùng | Số delivery trùng cho cùng khóa batch+địa chỉ | 0 |
| SC-operational-email-06 | Lỗi được xử lý | Tỷ lệ delivery FAILED/BOUNCED có resend hoặc ghi nhận fallback trong ≤5 ngày làm việc (đề xuất) | ≥90% sau 1 tháng pilot |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Mẫu email (EMAIL_TEMPLATE)__ — tên, ngữ cảnh áp dụng, trạng thái duyệt,
  phiên bản hiện hành, người tạo/người duyệt, tổ chức sở hữu.
- __Phiên bản mẫu (TEMPLATE_VERSION)__ — snapshot tiêu đề/nội dung/biến của
  một phiên bản: trạng thái duyệt, người duyệt, ghi chú quyết định.
- __Trường được phép (ALLOWED_VARIABLE)__ — whitelist trường làm biến theo
  ngữ cảnh: mã trường, mô tả, trạng thái, ai duyệt.
- __Đợt gửi (EMAIL_BATCH)__ — một lần gửi: loại (đơn/bulk/test), ngữ cảnh
  nguồn, tiêu chí eligibility, người gửi, trạng thái, tổng kết.
- __Giao nhận (EMAIL_DELIVERY)__ — một người nhận trong batch: địa chỉ tại
  thời điểm gửi, khóa idempotent, snapshot nội dung, trạng thái
  QUEUED/SENT/DELIVERED/BOUNCED/FAILED, lỗi cuối, vết xử lý (resend/fallback).
- __Lần thử gửi (DELIVERY_ATTEMPT)__ — mỗi lần thử của một delivery: số lần,
  kết quả, lỗi, thời điểm.
- __Giá trị cấu hình (SETTING_VALUE)__ — tham chiếu ngoài, thuộc
  `platform-configuration`: giá trị SMTP/provider hiệu lực.
- __Người dùng (USERS)__, __Tổ chức (ORGANIZATION)__ — tham chiếu ngoài,
  thuộc `account-access`/`org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/operational-email-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Soạn mẫu → gửi duyệt → duyệt/yêu cầu chỉnh → "Đã duyệt" sẵn
  sàng dùng; sửa lớn → phiên bản mới chờ duyệt.
- __Flow 2:__ Chọn ngữ cảnh + mẫu → điền biến + resolve người nhận →
  preview → (gửi thử) → gửi → delivery QUEUED → SENT/DELIVERED; lỗi →
  retry → FAILED.
- __Flow 3:__ Chọn nhóm đối tượng → eligibility lọc → preview danh sách +
  người bị loại → xác nhận → batch gửi tuần tự → tổng kết → resend phần
  FAILED.
- __Flow 4:__ Xử lý FAILED/BOUNCED: xem lý do → sửa hồ sơ → resend, hoặc
  ghi nhận liên hệ kênh khác.
- __Flow 5:__ Admin cấu hình SMTP → test connection → lưu (credential
  write-only) → rollback khi cần.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __template-list__ — danh sách mẫu + trạng thái duyệt + ngữ cảnh.
- __template-editor__ — soạn/sửa mẫu, chèn biến từ whitelist.
- __template-review-queue__ — hàng chờ mẫu chờ duyệt + duyệt/yêu cầu chỉnh.
- __compose-send__ — chọn ngữ cảnh + mẫu → biến đã điền → người nhận →
  preview → gửi thử/gửi.
- __bulk-preview__ — danh sách người nhận bulk + người bị loại kèm lý do.
- __delivery-log__ — nhật ký giao nhận: lọc mẫu/người gửi/trạng thái/ngữ
  cảnh, chi tiết attempt, resend/fallback.
- __smtp-config__ — cấu hình provider + field bảo mật + test connection +
  rollback.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Recipient validation + minimal email payload — vi phạm chặn external rollout | PRD Mục 10 R-08 — Operations + Security owner |
| Idempotency + retry/dead-letter + manual fallback cho mọi gửi | PRD Mục 10 R-07/R-12 — Operations owner |
| Credential chỉ ở server boundary; audit cho gửi/cấu hình | PRD Mục 9 — Security owner |
| Chỉ mẫu đã duyệt được gửi — human-in-the-loop cho nội dung tới người nhận | PRD Mục 12 — Product owner |
| Quyền theo organization/role/data-scope, deny-by-default | PRD Mục 9 — Security owner (`org-governance`) |
| Tiếng Việt ưu tiên cho nội dung và thông báo | PRD Mục 9 — Product owner |
| Retention/consent cho email và log theo chính sách đã duyệt; OQ-6 mở thì chỉ dữ liệu synthetic | PRD Mục 9, R-04 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Vai trò/quyền/phạm vi + audit (`org-governance`, PRD #2) | org-governance owner | Không phân quyền soạn/duyệt/gửi/cấu hình |
| Kênh báo kết quả cho người gửi (`contextual-notifications`, PRD #26) | contextual-notifications owner | FR-019 degrade sang hiển thị trong log |
| Giá trị SMTP trong catalog (`platform-configuration`) | platform-configuration owner (cùng slice Should) | FR-017 cần bản ghi cấu hình riêng tạm thời theo cùng hợp đồng |
| Hồ sơ email người nhận + ngữ cảnh (`cv-intake`, `candidate-pipeline`, `offer-management`, `employee-profiles`, `account-access`) | Owner từng module | Không resolve được người nhận/biến |
| SLA/retry/bounce/fallback chính thức (PRD OQ-10) | Technical/Operations owner | BR-007 và SC-01 ở mức đề xuất |
| Whitelist trường được duyệt | Owner nghiệp vụ + DPO (URD OQ-6) | FR-006 không có danh sách chính thức |
| SMTP provider thật | Operations owner | Test/send chỉ chạy trên cấu hình giả |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Người duyệt mẫu là HR lead/admin có quyền riêng do org-governance gán | FR-002 hàng chờ nghẽn hoặc mẫu lỗi lọt |
| Giới hạn đề xuất: 200 người/batch, 5 địa chỉ test-send, 10 CC, 30 biến/mẫu, tiêu đề 200 ký tự, nội dung 20.000 ký tự, 50 mẫu chờ duyệt/trang | FR-001/010/012 và validation đổi ngưỡng |
| Retry 5p/30p/2h rồi dead-letter là chuẩn chung với `contextual-notifications` | BR-007 và NFR-004 phải chỉnh theo OQ-10 |
| Giá trị SMTP nằm trong catalog `platform-configuration`; màn cấu hình feature này đọc-ghi cùng giá trị đó | Hai nơi lưu SMTP → lệch cấu hình (OQ-9 URD) |
| Mọi người nhận nghiệp vụ có email hợp lệ trong hồ sơ nguồn | E-004 tăng, eligibility loại nhiều, USC-001 không đạt |
| Người nhận không có giao diện trong hệ thống; email là kênh duy nhất | Phải thêm surface cho người nhận (portal) |
| Log delivery giữ theo audit policy; snapshot nội dung tối thiểu | NFR-006 và retention đổi (OQ-6 PRD) |

## 12. Open Questions

- [x] OQ-1: Ai là người duyệt mẫu hợp lệ? — Resolved (đề xuất): HR lead
  hoặc admin có quyền "duyệt mẫu" do `org-governance` gán — chờ Product
  owner (kế thừa URD OQ-1).
- [x] OQ-2: SLA, retry, idempotency, bounce, fallback (PRD OQ-10,
  OQ-PL-03)? — Resolved (đề xuất): retry 5p/30p/2h → FAILED dead-letter;
  idempotent batch+recipient; bounce ghi trạng thái + báo người gửi;
  fallback thủ công có ghi nhận — chờ Technical/Operations owner.
- [x] OQ-3: Bulk giới hạn và eligibility gate? — Resolved (đề xuất): 200
  người nhận/batch; eligibility theo tiêu chí ngữ cảnh + preview bắt buộc —
  chờ Product owner.
- [x] OQ-4: Đính kèm file trong v1? — Resolved (đề xuất): không — chờ
  Product owner nếu cần đính kèm offer/contract.
- [x] OQ-5: Retention log và snapshot nội dung (PRD OQ-6, OQ-PL-04)? —
  Resolved (đề xuất): log theo audit policy; snapshot tối thiểu — chờ
  DPO/legal.
- [x] OQ-6: Whitelist trường làm biến do ai duyệt? — Resolved (đề xuất):
  owner nghiệp vụ đề nghị, DPO duyệt nhóm trường cấm — chờ DPO/legal.
- [x] OQ-7: SMTP key rotation và khôi phục (OQ-PL-02)? — Resolved (đề
  xuất): rotation thủ công có audit; lộ credential → thu hồi + đổi key +
  rà log — chờ Technical/Operations owner.
- [x] OQ-8: Địa chỉ ngoài hồ sơ? — Resolved (đề xuất): chỉ gửi đơn kèm
  xác nhận riêng + audit; cấm trong bulk — chờ Product owner.
- [x] OQ-9: Ranh giới sở hữu giá trị SMTP với `platform-configuration`? —
  Resolved (đề xuất): giá trị nằm trong catalog `platform-configuration`;
  màn cấu hình feature này đọc-ghi cùng giá trị — chờ Operations owner.
- [x] OQ-10: Người nhận trùng trong batch? — Resolved (đề xuất): gộp một
  delivery theo địa chỉ + cảnh báo — chờ Product owner.
