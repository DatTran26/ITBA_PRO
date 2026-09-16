---
type: urd
feature: operational-email
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/operational-email/brainstorms/template-driven-operational-email.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# operational-email — User Requirements Document

## 1. Purpose

Cho HR và admin một kênh gửi email nghiệp vụ có kiểm soát: soạn từ mẫu đã
được duyệt, biến tự điền từ đúng ngữ cảnh nghiệp vụ, người nhận được kiểm
tra từ hồ sơ thay vì gõ tay, có gửi thử trước khi gửi thật, gửi đơn lẻ hoặc
hàng loạt có cổng kiểm soát, và mọi email giữ trạng thái giao nhận để truy
vết — không ai phải copy dữ liệu nhạy cảm vào hòm mail cá nhân.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Gửi email mời phỏng vấn, thông báo kết quả vòng, follow-up offer từ hòm mail cá nhân hoặc soạn tay | Phải copy tên/lịch/link từ hệ thống sang email; không biết email đã đến chưa | Sai người nhận, sai phiên bản nội dung, lộ dữ liệu nhạy cảm, không ai biết email đã gửi hay chưa | Confirmed — PRD Mục 7.35, JTBD-HR-01 |
| HR | Gửi thông báo cho một nhóm ứng viên cùng vòng | Không có cổng kiểm soát danh sách nhận | Gửi nhầm người không liên quan hoặc bỏ sót người đủ điều kiện | Confirmed — PRD Mục 7.35 (bulk send + eligibility gate trong "Chưa làm" phủ định hướng), R-08/R-12 |
| Admin | SMTP và quyền gửi email nằm rải rác | Không kiểm soát ai được gửi gì, credential dễ lộ | Email giả mạo/lộ khóa SMTP, không truy vết được | Confirmed — PRD Mục 9, Mục 7.35 (quyền cấu hình); Observed: reverse spec FR-PL-04 |
| Người duyệt mẫu (HR lead/admin) | Mẫu email do từng người tự soạn | Mẫu lỗi hoặc sai tone vẫn được dùng | Ứng viên nhận thông tin sai, phải đính chính | Assumption — suy từ invariant human-in-the-loop PRD Mục 12 và trạng thái mẫu PRD Mục 7.35 |
| Ứng viên / nhân viên (người nhận) | Nhận email từ nhiều người gửi khác nhau | Email rời rạc, thiếu hoặc sai thông tin | Trải nghiệm tuyển dụng kém chuyên nghiệp, miss lịch/offer | Confirmed — PRD Mục 7.35 (tự điền dữ liệu đúng ngữ cảnh), JTBD-CAN-01 |
| DPO/legal nominee | Email có thể chứa trường nhạy cảm bất kỳ | Payload không kiểm soát | Vi phạm privacy, khiếu nại ứng viên/nhân viên | Confirmed — PRD Mục 9, R-08 (minimal email) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Gửi email tuyển dụng/vận hành từ ngữ cảnh ứng viên, offer, nhân sự | Soạn từ mẫu đã duyệt, biến tự điền, biết email đã giao chưa | Copy dữ liệu tay dễ sai, không có log giao nhận, sợ gửi nhầm |
| secondary | Admin | Cấu hình provider, phân quyền gửi/duyệt mẫu | Một nơi kiểm soát SMTP và ai được gửi gì | Cấu hình rải rác, credential dễ lộ |
| secondary | Người duyệt mẫu | Được giao duyệt mẫu trước khi dùng | Hàng chờ duyệt rõ, quyết định có ghi nhận | Không có quy trình duyệt chính thức |
| secondary | DPO/legal nominee | Kiểm soát dữ liệu đưa vào email | Biến chỉ từ whitelist trường được duyệt | Payload có thể lộ trường nhạy cảm |
| out | Ứng viên / nhân viên (người nhận) | Chỉ nhận email, không thao tác hệ thống | (gián tiếp) nhận email đúng người, đúng dữ liệu | Không có nhu cầu trực tiếp với feature này |

## 3. Scope Boundaries

### In Scope

- Quản lý mẫu email: tạo/sửa kèm biến và ngữ cảnh áp dụng; trạng thái Bản
  nháp → Chờ duyệt → Đã duyệt → Ngừng dùng; chỉ mẫu "Đã duyệt" được gửi.
- Phiên bản mẫu: sửa lớn tạo phiên bản mới chờ duyệt; log gửi ghi nhận đúng
  phiên bản đã dùng.
- Soạn từ ngữ cảnh nghiệp vụ (ứng viên/application, offer, nhân sự): biến
  tự điền từ hồ sơ, biến bắt buộc thiếu thì chặn gửi.
- Whitelist trường được phép làm biến; chặn trường nhạy cảm (minimal
  payload).
- Kiểm tra người nhận từ hồ sơ; địa chỉ nhập tay ngoài hồ sơ cần xác nhận
  riêng + audit, không dùng cho bulk.
- Preview bắt buộc; test-send tới nội bộ đánh dấu THỬ.
- Single send và bulk send có eligibility gate + preview danh sách + giới
  hạn số lượng.
- Gửi idempotent (khóa batch + recipient), retry theo lịch rồi dead-letter
  FAILED, bounce ghi trạng thái, resend và manual fallback có ghi nhận.
- Delivery log từng người nhận đủ trường (mẫu + phiên bản, người gửi, trạng
  thái, mốc thời gian, lỗi cuối) + lọc/tìm.
- Cấu hình SMTP/provider: test connection, credential write-only mã hóa phía
  server, rollback — giá trị nằm trong catalog `platform-configuration` làm
  nguồn duy nhất.
- Phân quyền soạn mẫu/duyệt mẫu/gửi đơn/gửi hàng loạt/cấu hình theo vai trò
  `org-governance`.

### Out of Scope

- Marketing automation, campaign, gửi hàng loạt không có eligibility gate,
  đa kênh OTT/SMS (PRD "Chưa làm").
- Thông báo tự động theo event nghiệp vụ — thuộc `contextual-notifications`;
  feature này là email do con người chủ động soạn/gửi (hai feature dùng
  chung hạ tầng SMTP và quy ước delivery/retry).
- Đính kèm file trong v1 (đề xuất loại để giảm rủi ro payload — OQ-4).
- Lên lịch gửi trước (hướng P2).
- Bounce intelligence/feedback loop provider nâng cao, warmup IP, reputation
  — hạ tầng vận hành ngoài feature.
- Catalog setting và secret store — thuộc `platform-configuration`; feature
  này đọc-ghi cùng giá trị SMTP qua catalog đó.
- Nội dung/trạng thái quy trình ứng viên, offer, hồ sơ nhân sự — thuộc các
  module nguồn (`candidate-pipeline`, `offer-management`,
  `employee-profiles`); feature này chỉ đọc để điền biến và resolve người
  nhận.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi cần gửi email nghiệp vụ cho ứng viên/nhân sự | Chọn mẫu đã duyệt khớp ngữ cảnh, biến tự điền từ hồ sơ | Email đúng dữ liệu mà không copy tay | Critical | Confirmed — PRD Mục 7.35 |
| UN-002 | HR | Khi soạn email | Preview nội dung cuối + danh sách người nhận trước khi gửi; có thể gửi thử tới chính mình | Không gửi nhầm nội dung/người | Critical | Confirmed — PRD Mục 7.35 (test-send); rủi ro gửi sai người |
| UN-003 | HR | Khi gửi cho một nhóm đối tượng | Bulk send qua eligibility gate với preview danh sách + người bị loại kèm lý do | Chỉ người đủ điều kiện nhận email | Critical | Confirmed — PRD Mục 7.35; "Chưa làm" cấm bulk không gate |
| UN-004 | HR | Khi email gửi lỗi hoặc bounce | Log trạng thái rõ, retry tự động, resend được sau khi sửa nguyên nhân, ghi nhận fallback kênh khác | Không email nào mất âm thầm; xử lý được phần lỗi | Critical | Confirmed — PRD Mục 7.35 (trạng thái giao nhận), R-07/R-12 |
| UN-005 | Người duyệt mẫu | Khi có mẫu chờ duyệt | Hàng chờ mẫu kèm nội dung + danh sách biến; duyệt hoặc yêu cầu chỉnh có ghi chú | Mẫu sai/lỗi không lọt vào sử dụng | Critical | Assumption — invariant human review PRD Mục 12; vai trò chờ OQ-1 |
| UN-006 | HR | Khi cần sửa mẫu đang dùng | Sửa lớn tạo phiên bản mới chờ duyệt; email đã gửi giữ đúng phiên bản đã dùng | Không gửi sai version; truy vết được bản đã gửi | High | Confirmed — PRD Mục 7.35 (rủi ro sai version) |
| UN-007 | Admin | Khi thiết lập kênh email | Cấu hình SMTP có test connection; credential nhập một chiều không đọc lại | Kênh hoạt động trước khi dùng thật; secret không lộ | Critical | Confirmed — PRD Mục 9, Mục 7.35; reverse spec FR-PL-03/04 |
| UN-008 | Admin | Khi kiểm soát ai được gửi | Phân quyền riêng: soạn mẫu, duyệt mẫu, gửi đơn, gửi hàng loạt, cấu hình SMTP | Quyền gửi hàng loạt không lẫn quyền gửi thường | High | Assumption — rủi ro bulk gửi nhầm; `org-governance` |
| UN-009 | DPO | Khi rà soát dữ liệu đưa vào email | Biến chỉ từ whitelist trường được duyệt; trường nhạy cảm bị chặn | Không email nào chứa lương/điểm/giấy tờ tùy thân | Critical | Confirmed — PRD Mục 9, R-08 (minimal payload) |
| UN-010 | HR/Admin | Khi cần chứng minh email đã gửi | Delivery log từng người nhận đủ mẫu+phiên bản, người gửi, trạng thái, mốc thời gian, lỗi cuối | Truy vết đầy đủ khi ứng viên hỏi "tôi có nhận được mail không" | Critical | Confirmed — PRD Mục 7.35 (log, truy vết), R-12 |
| UN-011 | HR | Khi bấm gửi hai lần hoặc retry chạy | Hệ thống không gửi trùng cho cùng một người nhận trong một đợt | Người nhận chỉ nhận một email | High | Confirmed — R-12 (gửi trùng); OQ-10 |

## 5. Prioritized User Journeys

### Journey 1: Gửi email đơn từ ngữ cảnh nghiệp vụ

- **User:** HR
- **Importance:** Critical
- **Trigger:** Cần gửi lịch phỏng vấn/thông báo/offer cho một ứng viên.
- **Expected outcome:** Email từ mẫu đã duyệt được gửi tới đúng người, có
  log giao nhận để truy vết.
- **Related needs:** UN-001, UN-002, UN-010

1) Từ màn ứng viên/offer, HR chọn "Gửi email" → chọn mẫu đã duyệt khớp
   ngữ cảnh.
2) Hệ thống điền biến từ hồ sơ; biến bắt buộc thiếu thì chặn và liệt kê.
3) Người nhận resolve từ hồ sơ; địa chỉ ngoài hồ sơ phải xác nhận riêng.
4) Preview nội dung cuối + người nhận → (tùy chọn) gửi thử tới chính mình
   → xác nhận gửi.
5) Email vào hàng chờ → gửi qua SMTP → log SENT/DELIVERED; lỗi → retry →
   FAILED báo người gửi.

**Independent verification:** Gửi một email mẫu cho ứng viên thử — kiểm tra
delivery log có đủ mẫu + phiên bản, người gửi, địa chỉ, trạng thái và mốc
thời gian; nội dung nhận được khớp preview.

### Journey 2: Tạo và đưa mẫu email vào sử dụng

- **User:** HR (người soạn) + người duyệt mẫu
- **Importance:** Critical
- **Trigger:** Tổ chức cần mẫu mới cho một ngữ cảnh (vd "thư mời phỏng
  vấn").
- **Expected outcome:** Mẫu "Đã duyệt" xuất hiện khi soạn email, có đầy đủ
  vết ai soạn/ai duyệt.
- **Related needs:** UN-005, UN-009

1) Người soạn tạo mẫu: tên, ngữ cảnh áp dụng, tiêu đề, nội dung kèm biến
   trong whitelist.
2) Lưu "Bản nháp" → "Gửi duyệt" → "Chờ duyệt".
3) Người duyệt xem mẫu + biến dùng → "Duyệt" hoặc "Yêu cầu chỉnh" kèm ghi
   chú.
4) Mẫu "Đã duyệt" sẵn sàng được chọn khi gửi.

**Independent verification:** Tạo một mẫu qua đủ luồng — kiểm tra danh sách
chọn mẫu chỉ hiện mẫu "Đã duyệt" và bản ghi mẫu có người soạn + người duyệt
+ thời điểm.

### Journey 3: Gửi hàng loạt có kiểm soát

- **User:** HR có quyền gửi hàng loạt
- **Importance:** High
- **Trigger:** Thông báo cho tất cả ứng viên đạt vòng 1 của một vị trí.
- **Expected outcome:** Chỉ người thỏa tiêu chí nhận email; mỗi người nhận
  một email; kết quả tổng kết rõ phần lỗi.
- **Related needs:** UN-003, UN-008, UN-011

1) HR chọn nhóm đối tượng theo tiêu chí ngữ cảnh → hệ thống lọc danh sách
   hợp lệ.
2) Preview bắt buộc: số lượng, danh sách, người bị loại kèm lý do.
3) Xác nhận → tạo batch; mỗi người nhận là một delivery có khóa idempotent
   → gửi tuần tự → log từng người.
4) Kết thúc: tổng kết SENT/FAILED; resend chỉ phần FAILED.

**Independent verification:** Chạy một batch có cố ý vài người nhận lỗi —
preview liệt kê đúng người bị loại, phần SENT không nhận email thứ hai khi
resend phần FAILED.

### Journey 4: Xử lý email thất bại

- **User:** HR
- **Importance:** High
- **Trigger:** Email FAILED hết retry hoặc BOUNCED.
- **Expected outcome:** Nguyên nhân rõ, resend được sau khi sửa, hoặc đóng
  vết bằng ghi nhận liên hệ kênh khác.
- **Related needs:** UN-004, UN-010

1) Lọc log FAILED/BOUNCED → xem lý do, địa chỉ, mẫu đã dùng.
2) Sửa email trong hồ sơ người nhận → resend từ dead-letter; hoặc ghi nhận
   đã liên hệ kênh khác để đóng xử lý.

**Independent verification:** Với một delivery FAILED — sau khi sửa địa chỉ
và resend, log hiện chuỗi attempt đầy đủ và trạng thái cuối SENT; trường
hợp chọn "liên hệ kênh khác" thì log có bản ghi fallback kèm người ghi nhận.

### Journey 5: Admin cấu hình và kiểm chứng kênh email

- **User:** Admin
- **Importance:** High
- **Trigger:** Tenant mới hoặc đổi SMTP provider.
- **Expected outcome:** SMTP được cấu hình, test đạt, credential không lộ;
  cấu hình sai rollback được.
- **Related needs:** UN-007

1) Admin nhập cấu hình provider + credential qua field bảo mật → lưu.
2) "Test connection" → kết quả rõ; credential chỉ hiện dạng che.
3) Cấu hình sai → rollback về cấu hình trước; mọi thay đổi có audit.

**Independent verification:** Cấu hình SMTP mẫu → test đạt → màn hình chỉ
hiện trạng thái "đã cấu hình" không giá trị; đổi sang cấu hình lỗi rồi
rollback — giá trị hiệu lực về đúng bản trước.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Thiếu biến bắt buộc khi gửi | Không hiểu vì sao bị chặn | "Email chưa đủ dữ liệu cho biến: {danh sách} — bổ sung hồ sơ trước khi gửi" | Journey 1 / UN-001 |
| Chọn mẫu chưa duyệt | Tưởng gửi được | "Mẫu này chưa được duyệt — chỉ mẫu đã duyệt mới gửi được" | Journey 2 / UN-005 |
| Địa chỉ nhập tay ngoài hồ sơ | Lộ dữ liệu nếu lọt | Bắt buộc xác nhận riêng + audit; không cho trong bulk | Journey 1 / UN-002 |
| Người nhận thiếu email hợp lệ | Không gửi được | "Người nhận {tên} không có email hợp lệ trong hồ sơ"; bulk loại kèm lý do | Journey 1, 3 / UN-003 |
| Người nhận đã nghỉ (deactivate) | Gửi cho người không còn liên quan | Loại khỏi eligibility, hiện lý do trong preview | Journey 3 / UN-003 |
| Bấm gửi hai lần/double submit | Người nhận nhận 2 email | Khóa idempotent batch+recipient — chỉ một delivery tồn tại | Journey 1, 3 / UN-011 |
| SMTP lỗi giữa batch | Không biết phần nào đã đi | Phần gửi được SENT, phần còn lại QUEUED rồi retry/FAILED | Journey 3, 4 / UN-004 |
| Vượt giới hạn batch | Không gửi được nhóm lớn | "Một lần gửi tối đa 200 người nhận — chia nhỏ danh sách" | Journey 3 / UN-003 |
| Chưa cấu hình SMTP | Không gửi được gì | "Chưa có cấu hình email — liên hệ admin để thiết lập trước khi gửi" | Journey 1, 5 / UN-007 |
| Mẫu bị ngừng dùng giữa batch đang gửi | Lo nội dung lỗi vẫn đi tiếp | Batch đang chạy hoàn tất phần QUEUED; batch mới không chọn được mẫu | Journey 3 / UN-006 |
| Người nhận trùng trong batch | Nhận email lặp | Gộp một delivery + cảnh báo "Đã gộp {n} địa chỉ trùng" | Journey 3 / UN-011 |
| Biến không bắt buộc render rỗng | Email thiếu thông tin | Cảnh báo trong preview, người gửi quyết định | Journey 1 / UN-002 |
| Người duyệt xem mẫu trong lúc người soạn vừa sửa | Duyệt nhầm bản cũ | Cảnh báo mẫu đã đổi trước khi ghi nhận quyết định | Journey 2 / UN-005 |
| Gửi đúng người nhưng sai ngữ cảnh | Không thu hồi được email | Ghi sự cố + hướng dẫn gửi email đính chính + audit | Journey 1 / UN-010 |

## 7. User-side Constraints

- Giao diện, nội dung mẫu mặc định và toàn bộ thông báo là tiếng Việt tự
  nhiên; email hỗ trợ đầy đủ dấu tiếng Việt.
- Người gửi/soạn/duyệt phải đăng nhập và có vai trò được cấp trong
  `org-governance`; quyền "gửi hàng loạt" tách riêng "gửi đơn".
- Người nhận nghiệp vụ (ứng viên, nhân sự) phải có email hợp lệ trong hồ sơ;
  tài khoản nội bộ deactivate không còn hợp lệ nhận.
- Biến chỉ từ whitelist trường được duyệt — người soạn không chèn trường
  tùy ý; trường nhạy cảm (lương, điểm đánh giá, giấy tờ tùy thân) luôn bị
  chặn.
- Preview là bước bắt buộc — không có đường gửi nhanh bỏ qua preview.
- Chỉ mẫu "Đã duyệt" được dùng — không có ngoại lệ.
- Credential SMTP chỉ nhập qua field bảo mật; không bao giờ hiển thị lại.
- Màn soạn/gửi ưu tiên desktop; người nhận không có giao diện trong hệ
  thống.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Người duyệt mẫu là HR lead hoặc admin có quyền "duyệt mẫu" do org-governance gán | Nếu chỉ admin → hàng chờ nghẽn; nếu ai cũng duyệt → mẫu lỗi lọt | Assumption — chờ Product owner | Đã chốt đề xuất ở OQ-1 |
| Whitelist trường làm biến do owner nghiệp vụ đề nghị, DPO duyệt nhóm trường nhạy cảm bị cấm | Nếu whitelist rộng → rủi ro lộ payload | Assumption — chờ DPO/legal | Đã chốt đề xuất ở OQ-6 |
| Retry 5p/30p/2h → FAILED dead-letter; idempotent theo batch+recipient; bounce ghi trạng thái | Nếu SLA khác → số liệu retry/đo thành công đổi | Assumption — chờ Technical/Operations (PRD OQ-10) | Đã chốt đề xuất ở OQ-2 |
| Bulk tối đa 200 người nhận/batch; eligibility theo tiêu chí ngữ cảnh nghiệp vụ + preview bắt buộc | Nếu ngưỡng khác → limit đổi | Assumption — chờ Product owner | Đã chốt đề xuất ở OQ-3 |
| V1 không đính kèm file | Nếu offer/contract cần đính kèm → thêm capability | Assumption — chờ Product owner | Đã chốt đề xuất ở OQ-4 |
| Địa chỉ ngoài hồ sơ được phép cho gửi đơn kèm xác nhận riêng + audit; cấm trong bulk | Nếu cấm hẳn → case email tạm thời không gửi được | Assumption — chờ Product owner | Đã chốt đề xuất ở OQ-8 |
| Giá trị SMTP/provider nằm trong catalog `platform-configuration` làm nguồn duy nhất; màn cấu hình feature này đọc-ghi cùng giá trị | Nếu hai nơi lưu → lệch cấu hình kênh | Assumption — chờ Operations owner | Đã chốt đề xuất ở OQ-9 |
| `contextual-notifications` báo kết quả batch/FAILED cho người gửi; chưa có thì hiển thị trực tiếp trong log | Nếu không có kênh báo → người gửi không biết lỗi | Confirmed — dependency PRD Feature Map (2, 26) | — |
| Người nhận có email trong hồ sơ do cv-intake/employee-profiles/account-access quản lý | Nếu hồ sơ thiếu email → eligibility loại nhiều | Assumption — hợp đồng dữ liệu các feature nguồn | — |
| Log giao nhận giữ theo audit policy; nội dung render chỉ giữ metadata + snapshot tối thiểu | Nếu retention khác → dung lượng/privacy đổi | Assumption — chờ DPO (PRD OQ-6) | Đã chốt đề xuất ở OQ-5 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Email nghiệp vụ giao thành công | Chưa có — xác lập bằng delivery log trong 1 tháng pilot | ≥95% delivery đạt SENT/DELIVERED (đề xuất — chờ OQ-10/OQ-2) | Tỷ lệ delivery thành công / tổng delivery hợp lệ | 1 tháng sau pilot |
| USC-002 | Mọi email có vết truy vết | Chưa có | 100% delivery log đủ mẫu+phiên bản, người gửi, trạng thái | Kiểm tra mẫu log | Hàng tuần trong pilot |
| USC-003 | Chỉ mẫu đã duyệt được gửi | Chưa có | 100% email dùng mẫu "Đã duyệt"; 0 email từ mẫu chưa duyệt | Đối chiếu delivery log với trạng thái mẫu | Liên tục |
| USC-004 | Không lộ payload nhạy cảm | Chưa có | 0 email chứa trường ngoài whitelist; 0 incident gửi sai người do nhập tay chưa xác nhận | Số incident xác nhận (bám M-GR-01, R-08) | Liên tục |
| USC-005 | Không gửi trùng | Chưa có | 0 người nhận nhận 2 email cho cùng batch | Số delivery trùng khóa batch+recipient | Liên tục |
| USC-006 | Người gửi biết kết quả batch | Chưa có | 100% batch có tổng kết SENT/FAILED và phần FAILED được xử lý (resend hoặc fallback có ghi nhận) | Tỷ lệ batch có bản ghi kết quả + vết xử lý FAILED | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Ai là người duyệt mẫu hợp lệ — admin, HR lead hay cả hai? —
  Resolved (đề xuất): HR lead hoặc admin có quyền "duyệt mẫu" do
  `org-governance` gán — chờ Product owner xác nhận.
- [x] OQ-2: SLA, retry, idempotency, bounce và fallback cho email (PRD
  OQ-10, OQ-PL-03)? — Resolved (đề xuất): retry 5 phút/30 phút/2 giờ →
  FAILED dead-letter; idempotent theo batch+recipient; bounce ghi trạng
  thái + báo người gửi; fallback thủ công (resend sau sửa địa chỉ hoặc ghi
  nhận liên hệ kênh khác) — chờ Technical/Operations owner.
- [x] OQ-3: Bulk send giới hạn và eligibility gate? — Resolved (đề xuất):
  tối đa 200 người nhận/batch; eligibility theo tiêu chí ngữ cảnh nghiệp vụ
  + preview bắt buộc — chờ Product owner.
- [x] OQ-4: Email v1 có đính kèm file không? — Resolved (đề xuất): không,
  để giảm rủi ro payload — chờ Product owner nếu có nhu cầu đính kèm
  offer/contract.
- [x] OQ-5: Retention email log và consent người nhận (PRD OQ-6,
  OQ-PL-04)? — Resolved (đề xuất): delivery log giữ theo audit policy;
  nội dung render chỉ giữ siêu dữ liệu + snapshot tối thiểu — chờ
  DPO/legal.
- [x] OQ-6: Whitelist trường làm biến do ai duyệt? — Resolved (đề xuất):
  owner nghiệp vụ đề nghị, DPO/legal duyệt nhóm trường nhạy cảm bị cấm —
  chờ DPO/legal.
- [x] OQ-7: SMTP key rotation và khôi phục credential (OQ-PL-02)? —
  Resolved (đề xuất): rotation thủ công qua màn cấu hình có audit; lộ
  credential → thu hồi, đổi key mới, rà log gửi — chờ Technical/Operations
  owner.
- [x] OQ-8: Địa chỉ nhập tay ngoài hồ sơ có được phép? — Resolved (đề
  xuất): được cho gửi đơn kèm xác nhận riêng + audit; cấm trong bulk —
  chờ Product owner.
- [x] OQ-9: Giá trị SMTP nằm ở feature nào — `operational-email` hay
  `platform-configuration`? — Resolved (đề xuất): nằm trong catalog
  `platform-configuration` làm nguồn duy nhất; màn cấu hình của feature
  này đọc-ghi cùng giá trị đó — chờ Operations owner xác nhận.
- [x] OQ-10: Người nhận trùng trong một batch xử lý thế nào? — Resolved
  (đề xuất): gộp một delivery theo địa chỉ + cảnh báo trong preview — chờ
  Product owner.
