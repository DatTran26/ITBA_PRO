---
type: urd
feature: offer-management
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/offer-management/brainstorms/offer-version-approval-response.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# offer-management — User Requirements Document

## 1. Purpose

Cho HR một luồng offer minh bạch và truy vết được: soạn offer thành phiên
bản, qua phê duyệt của người có thẩm quyền, gửi đúng ứng viên, theo dõi đã
xem/chấp nhận/từ chối — để không còn tình trạng gửi sai version, sai người
nhận hoặc offer "treo" không ai biết. Lưu ý phạm vi: feature ở mức **Should**
trong PRD — KHÔNG thuộc cam kết lát cắt v1, là slice mở rộng hire-to-onboard.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Soạn offer bằng Word, gửi email cá nhân, duyệt qua chat | Không biết version nào đã gửi, ai duyệt, ứng viên đã đọc chưa | Gửi sai điều khoản/người nhận, offer treo quên xử lý, mất ứng viên | Confirmed — PRD Mục 7.11 (rủi ro "gửi sai version hoặc người nhận") |
| Người duyệt offer | Duyệt qua email/chat không chính thức | Không có bản ghi quyết định, khó truy vết khi tranh chấp | Điều khoản sai vẫn được gửi, không ai chịu trách nhiệm | Assumption — suy từ "approval" trong phạm vi PRD Mục 7.11 |
| Ứng viên | Nhận offer qua file đính kèm email | Không biết hạn trả lời chính xác, khó đối chiếu khi đàm phán | Trả lời trễ/lỡ hạn, trải nghiệm kém chuyên nghiệp | Confirmed — PRD Mục 7.11 (status xem/chấp nhận/từ chối); JTBD-CAN-01 |
| Quản lý | Muốn biết offer vị trí mình phụ trách tiến triển thế nào | Phải hỏi HR từng lần | Chậm ra quyết định thay thế khi offer thất bại | Confirmed — PRD JTBD-MGR-01 (xem trong phạm vi quyền) |
| Admin | Cần kiểm chứng ai gửi offer nào cho ai | Không có audit tập trung | Không điều tra được khiếu nại "gửi sai offer" | Confirmed — PRD Mục 9 (audit boundary) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Điều phối offer cho ứng viên đạt từ pipeline | Offer đúng người, đúng version, có duyệt, biết trạng thái phản hồi | Soạn tay, version rối, không theo dõi được ứng viên |
| secondary | Người duyệt offer (HR lead/quản lý có thẩm quyền) | Được giao duyệt offer trước khi gửi | Hàng chờ rõ, quyết định có ghi nhận | Duyệt rời, không bằng chứng |
| secondary | Ứng viên | Nhận offer qua link bảo mật | Xem rõ điều khoản + hạn, phản hồi một chạm | File đính kèm khó đọc, không rõ hạn |
| secondary | Quản lý | Vị trí mình phụ trách đang có offer | Thấy trạng thái trong scope, không vượt quyền | Phải hỏi HR |
| secondary | Admin | Kiểm tra/truy vết khi có sự cố | Audit đầy đủ, quyền deny-by-default | Không có log tập trung |

## 3. Scope Boundaries

### In Scope

- Tạo offer từ application đạt (`PASSED`), prefill ứng viên/vị trí; 1 offer
  đang mở mỗi application.
- Soạn nội dung offer có cấu trúc + phiên bản; phiên bản đã gửi bất biến.
- Luồng gửi duyệt → duyệt/từ chối duyệt kèm ghi chú → chỉ bản đã duyệt được
  gửi.
- Gửi offer cho đúng ứng viên qua email chứa link xem có hạn; theo dõi đã
  gửi/đã xem.
- Ghi nhận phản hồi: ứng viên tự chấp nhận/từ chối qua link, hoặc HR ghi thay
  kèm kênh/lý do.
- Hết hạn tự động, thu hồi có lý do, đồng bộ stage `OFFERED`/`ACCEPTED`/
  `OFFER_REJECTED` qua `candidate-pipeline`, phát sự kiện cho
  `employee-onboarding` khi chấp nhận.
- Audit đầy đủ; lương/điều khoản là dữ liệu hạn chế theo quyền.

### Out of Scope

- E-signature/legal workflow — PRD Mục 7.11 "Chưa làm" cho tới khi chọn
  provider.
- Soạn/gửi email nghiệp vụ nói chung — thuộc `operational-email`;
  `contextual-notifications` là kênh phát thông báo.
- Chuyển đổi thành hồ sơ nhân viên và checklist onboarding — thuộc
  `employee-onboarding` (feature này chỉ phát sự kiện offer chấp nhận).
- Quyết định đạt/loại và chuyển stage thủ công — thuộc `candidate-pipeline`
  + `interview-evaluation`.
- Mẫu offer, đàm phán nhiều vòng có UI riêng, AI soạn offer — hướng P1/P2.
- Đàm phán lương/hợp đồng lao động chính thức sau offer — ngoài phạm vi.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi application chuyển sang `PASSED` | Tạo offer prefill từ hồ sơ ứng viên/vị trí, không nhập lại | Offer nháp có đúng người/vị trí trong vài bước | Critical | Confirmed — PRD Mục 7.11 (tạo offer); Observed: reverse spec FR-RC-07 |
| UN-002 | HR | Khi soạn nội dung offer | Nhập vị trí, lương, ngày bắt đầu, hạn phản hồi, ghi chú trong một form có cấu trúc | Nội dung offer đầy đủ, sẵn sàng gửi duyệt | Critical | Confirmed — PRD Mục 7.11 (version) |
| UN-003 | Người duyệt | Khi có offer chờ duyệt | Hàng chờ liệt kê offer kèm nội dung + context application | Quyết định duyệt/từ chối có ghi chú, được ghi nhận | Critical | Confirmed — PRD Mục 7.11 (approval) |
| UN-004 | HR | Khi offer đã duyệt | Gửi cho đúng ứng viên qua kênh kiểm soát, biết chắc email đúng | Offer tới đúng người, chuyển "Đã gửi", pipeline `OFFERED` | Critical | Confirmed — PRD Mục 7.11 (send); rủi ro sai người nhận |
| UN-005 | HR | Khi đang chờ ứng viên | Biết ứng viên đã xem chưa, sắp hết hạn chưa | Trạng thái đã xem/sắp hết hạn hiển thị rõ, có nhắc | High | Confirmed — PRD Mục 7.11 (status) |
| UN-006 | Ứng viên | Khi nhận email offer | Mở link xem đủ điều khoản + hạn, chấp nhận/từ chối một chạm | Phản hồi được ghi nhận đúng phiên bản, 1 lần | Critical | Confirmed — PRD Mục 7.11 (response); kênh cụ thể là Assumption (OQ-RC-03) |
| UN-007 | HR | Khi ứng viên phản hồi ngoài hệ thống | Ghi nhận phản hồi thay kèm kênh và lý do | Trạng thái offer đúng thực tế, có audit ghi thay | High | Assumption — đường fallback cho tổ chức chưa mở self-service |
| UN-008 | HR | Khi offer cần sửa sau gửi (đàm phán) | Tạo phiên bản mới qua duyệt lại, link cũ vô hiệu | Ứng viên chỉ thấy phiên bản mới nhất, lịch sử đủ | High | Confirmed — PRD Mục 7.11 (version) |
| UN-009 | HR | Khi offer cần hủy | Thu hồi kèm lý do, link ứng viên vô hiệu ngay | Offer "Đã thu hồi", không ai phản hồi được nữa | High | Assumption — suy từ rủi ro sai version/người nhận |
| UN-010 | Admin | Khi điều tra sự cố offer | Truy vết đầy đủ ai soạn/duyệt/gửi/xem/phản hồi | Timeline offer đầy đủ trong audit | Critical | Confirmed — PRD Mục 9 |

## 5. Prioritized User Journeys

### Journey 1: Tạo → duyệt → gửi offer cho ứng viên đạt

- **User:** HR
- **Importance:** Critical
- **Trigger:** Application chuyển sang `PASSED` sau khi HR review đánh giá.
- **Expected outcome:** Offer phiên bản đã duyệt được gửi tới đúng email ứng
  viên; offer "Đã gửi"; application `OFFERED`.
- **Related needs:** UN-001, UN-002, UN-003, UN-004

1) HR mở application `PASSED` → "Tạo offer" → hệ thống prefill ứng viên/vị
   trí/email.
2) HR nhập nội dung offer → lưu "Nháp" → "Gửi duyệt".
3) Người duyệt mở hàng chờ → duyệt.
4) HR "Gửi offer" → hệ thống kiểm phiên bản đã duyệt + email đúng → tạo link
   có hạn → gửi email → offer "Đã gửi", application `OFFERED`.

**Independent verification:** Chọn một offer vừa gửi — bản ghi offer có đủ
phiên bản đã duyệt, người duyệt, email người nhận khớp application, thời điểm
gửi; application trên pipeline hiển thị `OFFERED`.

### Journey 2: Ứng viên xem và phản hồi offer

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** Ứng viên nhận email chứa link xem offer.
- **Expected outcome:** Ứng viên đọc đủ điều khoản, phản hồi chấp nhận/từ
  chối; hệ thống ghi đúng phiên bản + thời điểm; pipeline đồng bộ.
- **Related needs:** UN-005, UN-006

1) Ứng viên mở link → hệ thống kiểm link hợp lệ → hiển thị offer → ghi "đã
   xem".
2) Ứng viên chọn "Chấp nhận"/"Từ chối" (+ lý do tùy chọn) → xác nhận.
3) Hệ thống ghi phản hồi → offer "Đã chấp nhận"/"Đã từ chối" → application
   `ACCEPTED`/`OFFER_REJECTED` → thông báo HR.
4) Nếu chấp nhận → sự kiện cho `employee-onboarding`.

**Independent verification:** Với một offer đã phản hồi, kiểm tra bản ghi
phản hồi có phiên bản offer đúng bản đã gửi, thời điểm, kênh "tự phản hồi";
link mở lại hiển thị trạng thái đã phản hồi, không cho phản hồi lần hai.

### Journey 3: Theo dõi và xử lý offer sắp/quá hạn

- **User:** HR
- **Importance:** High
- **Trigger:** Offer đã gửi nhưng ứng viên chưa phản hồi gần hạn.
- **Expected outcome:** HR thấy offer sắp hết hạn, nhắc ứng viên hoặc chủ
  động xử lý; offer quá hạn tự "Hết hạn" không treo.
- **Related needs:** UN-005, UN-009

1) HR mở danh sách offer → lọc "Chưa phản hồi" → thấy cảnh báo sắp hết hạn.
2) HR bấm "Nhắc ứng viên" → hệ thống gửi nhắc qua cùng kênh (tối đa 2 lần).
3) Quá hạn: offer "Hết hạn", link vô hiệu → HR gia hạn (phiên bản mới) hoặc
   thu hồi/đóng.

**Independent verification:** Với offer đã quá hạn phản hồi trong dữ liệu
test — trạng thái tự chuyển "Hết hạn", link mở ra trang hết hạn, timeline
ghi nhận đúng mốc hết hạn và các lần nhắc.

### Journey 4: Sửa offer sau gửi / đàm phán

- **User:** HR
- **Importance:** High
- **Trigger:** Ứng viên đàm phán điều khoản hoặc HR phát hiện sai sót.
- **Expected outcome:** Phiên bản mới qua duyệt lại và gửi lại; ứng viên chỉ
  truy cập được phiên bản mới nhất; lịch sử từng vòng đầy đủ.
- **Related needs:** UN-008

1) HR "Tạo phiên bản mới" → sửa nội dung → "Gửi duyệt" → người duyệt duyệt.
2) HR "Gửi lại offer" → link mới phát hành, link cũ vô hiệu.
3) Ứng viên mở link cũ → thông báo offer đã cập nhật.

**Independent verification:** Đối chiếu lịch sử offer: mỗi phiên bản đã gửi
có bản ghi gửi riêng; link của phiên bản cũ vô hiệu; phiên bản hiệu lực là
bản mới nhất đã gửi.

### Journey 5: Ghi nhận phản hồi ngoài hệ thống

- **User:** HR
- **Importance:** Medium
- **Trigger:** Ứng viên gọi điện/email trực tiếp thay vì bấm link.
- **Expected outcome:** Trạng thái offer đúng thực tế, audit ghi rõ là ghi
  thay + kênh + người ghi.
- **Related needs:** UN-007

1) HR mở offer "Đã gửi"/"Đã xem" → "Ghi nhận phản hồi".
2) Chọn kết quả + kênh nhận + lý do ghi thay → xác nhận.
3) Hệ thống chuyển trạng thái + đồng bộ pipeline như Journey 2.

**Independent verification:** Bản ghi phản hồi của offer đó hiển thị kênh
"ghi thay", người ghi, lý do — khác biệt rõ với phản hồi tự phục vụ.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tạo offer khi application chưa đạt | HR thao tác bị chặn khó hiểu | Thông báo rõ chỉ tạo được khi `PASSED` | Journey 1 / UN-001 |
| Đã có offer đang mở | Tạo trùng offer | Chặn + dẫn tới offer hiện có | UN-001 |
| Gửi offer khi phiên bản chưa duyệt | Gửi nhầm bản chưa kiểm | Chặn gửi, báo "phiên bản chưa được duyệt" | Journey 1 / UN-004 |
| Email người nhận không khớp ứng viên | Gửi sai người | Chặn + yêu cầu kiểm email trước khi gửi | UN-004 |
| Ứng viên mở link đã hết hạn/thu hồi | Bối rối không hiểu | Trang thông báo lịch sự + hướng dẫn liên hệ HR | Journey 3 / UN-009 |
| Ứng viên bấm phản hồi hai lần | Sợ ghi sai | Báo "đã ghi nhận phản hồi trước đó", giữ phản hồi đầu | Journey 2 / UN-006 |
| Ứng viên mở link cũ sau khi có phiên bản mới | Xem điều khoản lỗi thời | Thông báo offer đã cập nhật, hướng xem email mới | Journey 4 / UN-008 |
| Thu hồi offer ứng viên đã chấp nhận | Trạng thái mâu thuẫn | Chặn thu hồi, hướng xử lý thủ công qua HR | UN-009 |
| Application rời `PASSED` khi offer đang nháp | Offer lệch thực tế | Cảnh báo trên offer + chặn gửi | Journey 1 |
| Người duyệt vắng, hàng chờ treo | Offer chậm gửi | Chuyển hàng chờ sang người duyệt khác có thẩm quyền | UN-003 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và nội dung mặc định tiếng Việt; email/link offer hiển
  thị tiếng Việt tự nhiên.
- Người dùng nội bộ phải đăng nhập và thuộc phạm vi được cấp; ứng viên KHÔNG
  cần tài khoản — chỉ qua link bảo mật có hạn.
- Lương và điều khoản offer là dữ liệu hạn chế: chỉ HR trong scope, người
  duyệt và đúng ứng viên của offer đó xem được; quản lý chỉ thấy trạng thái.
- Chỉ phiên bản đã duyệt mới được gửi; phiên bản đã gửi bất biến — điều kiện
  tiên quyết của mọi màn hình offer.
- Mọi phản hồi (tự phục vụ hay ghi thay) chỉ ghi nhận một lần; quyết định
  cuối luôn do con người — không có hành động tự động thay HR.
- Ứng viên thao tác chủ yếu trên điện thoại: trang xem/phản hồi offer phải
  đọc tốt trên mobile; phía HR ưu tiên desktop.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Điều kiện tạo offer = application `PASSED` do con người chốt (không gate "đủ N vòng") | Nếu cần gate vòng → FR tạo offer phải kiểm thêm điều kiện | Assumption — nguồn có gate nhưng không được gọi (GAP-RC-01) | Chốt ở OQ-2 brainstorm, chờ Recruitment owner |
| Ứng viên phản hồi qua link self-service; HR ghi thay là fallback | Nếu tổ chức không muốn mở link → luồng ghi thay là chính | Assumption — nguồn chưa chứng minh self-service (OQ-RC-03) | Chốt ở OQ-1, chờ Product owner |
| Một cấp duyệt bởi vai trò có thẩm quyền (không đa cấp) | Nếu cần đa cấp → approval flow thiếu tầng | Assumption | Chốt ở OQ-3, chờ Head of HR |
| Lương/điều khoản chỉ lộ cho HR scope + người duyệt + đúng ứng viên | Nếu quản lý cần xem → mở rộng surface dữ liệu hạn chế | Assumption | Chốt ở OQ-4, chờ DPO |
| Giới hạn (7 ngày phản hồi, 10 phiên bản, nhắc 2 lần, link +7 ngày) là chuẩn | Ngưỡng khác đổi validation + wording | Assumption | Chốt ở OQ-5, chờ Product owner |
| Thu hồi offer không tự đổi stage pipeline | Nếu cần tự đổi → phải thêm transition ở candidate-pipeline | Assumption — giữ state machine một nơi | Đối chiếu spec `candidate-pipeline` |
| Kênh gửi qua `contextual-notifications`/`operational-email`, email không chứa điều khoản | Nếu email chứa full offer → rủi ro lộ dữ liệu tăng | Assumption — bám R-08/R-12 PRD | Kiểm chứng khi tích hợp |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | HR gửi được offer đã duyệt cho đúng ứng viên nhanh | Chưa có — xác lập bằng đo thời gian từ `PASSED` đến "Đã gửi" trong 1 tháng pilot | Thời gian trung bình ≤1 ngày làm việc | Khoảng thời gian `PASSED` → "Đã gửi" trên offer events | 1 tháng sau pilot |
| USC-002 | Mọi offer gửi đi đều là phiên bản đã duyệt | 0% (hiện không có duyệt) | 100% | Tỷ lệ lần gửi có phiên bản `đã-duyệt` + người duyệt | Liên tục |
| USC-003 | Ứng viên phản hồi trước hạn | Chưa có — xác lập bằng cohort offer trong 1 quý pilot | ≥70% offer có phản hồi trước hạn (đề xuất — chờ OQ-2 PRD) | Tỷ lệ offer có phản hồi ≤ hạn / offer đã gửi | 1 quý sau pilot |
| USC-004 | Không offer nào treo vô thời hạn | Chưa có — xác lập bằng audit offer mở >14 ngày | 100% offer quá hạn tự chuyển "Hết hạn" và có owner xử lý ≤3 ngày làm việc | Số offer mở quá hạn chưa xử lý | Hàng tuần |
| USC-005 | Không gửi sai người/version | 0 sự cố | 0 sự cố gửi sai người nhận hoặc phiên bản chưa duyệt được xác nhận | Incident log (bám M-GR-01/R-08) | Liên tục |

## 10. Open Questions

- [x] OQ-1: Kênh ứng viên phản hồi offer (self-service link hay chỉ HR ghi
  thay) và cách audit? (OQ-RC-03) — Resolved (đề xuất): link xem offer có hạn
  cho phản hồi một lần + đường HR ghi thay kèm kênh/lý do; mọi phản hồi ghi
  phiên bản, thời điểm, kênh, người ghi — chờ Product owner xác nhận.
- [x] OQ-2: Điều kiện tạo offer — stage `PASSED` thôi hay gate "đủ vòng
  phỏng vấn" (GAP-RC-01)? — Resolved (đề xuất): `PASSED` là điều kiện duy
  nhất của v1; gate vòng do `interview-evaluation` chốt trước khi PASS —
  chờ Recruitment owner xác nhận.
- [x] OQ-3: Ai duyệt offer, một hay nhiều cấp? — Resolved (đề xuất): một cấp,
  vai trò có thẩm quyền qua `org-governance`; hàng chờ chuyển được khi vắng —
  chờ Head of HR xác nhận.
- [x] OQ-4: Phạm vi xem lương/điều khoản offer? — Resolved (đề xuất): dữ
  liệu hạn chế — HR trong scope, người duyệt, đúng ứng viên; quản lý chỉ thấy
  trạng thái — chờ DPO/legal xác nhận.
- [x] OQ-5: Giới hạn (hạn phản hồi 7 ngày mặc định, khung 1–30 ngày, 10
  phiên bản, nhắc 2 lần, link +7 ngày đệm)? — Resolved (đề xuất): giữ làm
  mặc định v1 — chờ Product owner xác nhận.
- [x] OQ-6: Retention dữ liệu offer (lương, phản hồi, access log)? — Resolved
  (đề xuất): theo retention hồ sơ tuyển dụng; trước DPO duyệt chỉ dữ liệu
  synthetic (PRD OQ-6, Mục 9).
- [~] OQ-7: E-signature có trong phạm vi? — Out of scope v1: PRD Mục 7.11
  "Chưa làm" cho tới khi chọn provider.
