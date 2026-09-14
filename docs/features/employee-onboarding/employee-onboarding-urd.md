---
type: urd
feature: employee-onboarding
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/employee-onboarding/brainstorms/candidate-conversion-onboarding-checklist.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# employee-onboarding — User Requirements Document

## 1. Purpose

Khi ứng viên chấp nhận offer, cho HR một hồ sơ onboarding được tạo sẵn:
kéo dữ liệu từ offer và CV đã xác nhận để khởi tạo hồ sơ nhân viên không
phải nhập lại, sinh checklist chuẩn bị mà mỗi việc đều có người phụ
trách và hạn rõ ràng, và chỉ đóng khi mọi việc bắt buộc xong cùng hồ sơ
nhân viên đã kích hoạt — để nhân viên mới đến ngày đầu mà không thiếu
chuẩn bị.

Lưu ý phạm vi: PRD xếp feature này ở mức **Should** — là slice mở rộng
hire-to-onboard, KHÔNG nằm trong 15 capability cam kết của lát cắt v1.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Sau khi ứng viên nhận offer, chuẩn bị ngày đầu qua email/chat | Nhắc từng người, giấy tờ thiếu không ai hay, thiết bị/tài khoản cấp chậm | Nhân viên mới đến mà chưa có gì sẵn sàng; HR chạy khắc phục | Confirmed — PRD Mục 7.12, JTBD-HR-01 |
| HR | Chuyển ứng viên thành nhân viên bằng nhập lại tay | Trùng người, sai dữ liệu giữa CV/offer và hồ sơ nhân viên | Hai hồ sơ cho một người, vị trí/ngày bắt đầu sai | Confirmed — PRD Mục 7.12 (conversion), Mục 7.3 (rủi ro trùng người) |
| Assignee (IT, hành chính, quản lý trực tiếp) | Được nhờ cấp thiết bị/tài khoản qua tin nhắn | Không có hạn rõ, không có context nhân viên mới | Việc bị quên hoặc làm sai người | Assumption — suy từ "checklist, assignee, due date" PRD Mục 7.12 |
| Nhân viên mới | Đến ngày đầu chưa biết cần nộp gì | Không có một nơi xem việc của mình | Giấy tờ thiếu, trải nghiệm ngày đầu tệ | Confirmed — PRD Mục 3 (JTBD-EMP-01) |
| Quản lý | Không biết người mới vào team đã sẵn sàng chưa | Không có nơi xem tiến độ chuẩn bị | Không chủ động được kế hoạch đón người | Assumption — suy từ JTBD-MGR-01 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Điều phối onboarding sau khi offer được chấp nhận | Case tự tạo với checklist có owner/hạn, theo dõi tiến độ một nơi, đóng khi đủ điều kiện | Checklist quản bằng chat, task không chủ, quá hạn không ai biết, nhập lại hồ sơ |
| secondary | Assignee (IT, hành chính, quản lý trực tiếp) | Được giao việc chuẩn bị cho nhân viên mới | Task có hạn + context rõ, xác nhận xong một chạm | Được nhờ qua tin nhắn, không hạn, không context |
| secondary | Nhân viên mới | Sắp và đang trong giai đoạn onboarding | Biết rõ việc của mình, được nhắc đúng hạn, xác nhận khi xong | Không biết cần nộp gì, đến ngày đầu chưa sẵn sàng |
| secondary | Quản lý | Có người mới sắp vào đơn vị | Xem tiến độ onboarding trong phạm vi quyền | Không có nơi theo dõi |
| secondary | Admin | Kiểm soát quyền và audit | Biết ai xác nhận việc gì, khi nào | Không truy vết được |
| out | Ứng viên (chưa nhận việc) | Trước khi có case onboarding | (gián tiếp) trải nghiệm chuyển tiếp mượt | Không thao tác trong feature này |

## 3. Scope Boundaries

### In Scope

- Tạo hồ sơ onboarding (case) khi offer được chấp nhận — tự động từ sự
  kiện `offer-management` hoặc HR tạo tay trên application `ACCEPTED`;
  một case đang mở mỗi application.
- Conversion: khởi tạo hồ sơ nhân viên ở `employee-profiles` với prefill
  từ CV đã xác nhận + offer; case gắn ngày bắt đầu (joined date) bắt
  buộc.
- Checklist có nhóm (giấy tờ, thiết bị, tài khoản, đào tạo, khác): task
  từ mẫu theo vị trí + task thêm tay; mọi task bắt buộc có assignee và
  hạn trước khi bắt đầu.
- Assignee xác nhận hoàn tất kèm ghi chú; task quá hạn đánh dấu + nhắc;
  HR giao lại, đổi hạn, hủy task kèm lý do.
- Tiến độ case: % hoàn tất, task quá hạn/sắp hạn, đếm ngược ngày bắt
  đầu.
- Đóng case chỉ khi task bắt buộc hoàn tất VÀ hồ sơ nhân viên đã kích
  hoạt → phát sự kiện cho `candidate-pipeline` chuyển `ONBOARDED`.
- Hủy case kèm lý do (offer thu hồi, ứng viên không nhận việc) — task
  đang mở chuyển "Đã hủy".
- Nhân viên mới xem và xác nhận phần việc của mình khi đã có tài khoản;
  trước đó HR xác nhận thay.
- Mẫu checklist do HR quản lý (P1); task đính kèm tài liệu từ
  `document-library` (P1); reopen case trong hạn kèm lý do (P1).
- Audit: ai tạo case, giao, xác nhận, đổi hạn, hủy, đóng.

### Out of Scope

- Tự cấp quyền/tài khoản trên hệ thống ngoài (email, chat, VPN) — PRD
  "Chưa làm" cho tới khi `external-integrations` sẵn sàng.
- Quyết định chấp nhận offer và gửi offer — thuộc `offer-management`.
- Tạo/duyệt/kích hoạt hồ sơ nhân viên — thuộc `employee-profiles`;
  feature này kích khởi và theo dõi điều kiện đóng, không tự kích hoạt.
- Chuyển stage application — thuộc `candidate-pipeline`; feature này
  chỉ phát sự kiện "case hoàn tất".
- Vòng đời việc làm sau ngày bắt đầu (thử việc, chính thức, nghỉ) —
  thuộc `employment-lifecycle`.
- Cấp tài khoản đăng nhập — thuộc `account-access`; feature này chỉ
  kiểm tra nhân viên đã có tài khoản chưa để hiện self-service.
- Đào tạo đầu vào có bài test — roadmap mở rộng (P2).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi offer chuyển "Đã chấp nhận" | Hồ sơ onboarding được tạo sẵn gắn application + offer + ngày bắt đầu | Không bỏ sót ứng viên nhận việc; không phải tạo tay từ đầu | Critical | Confirmed — PRD Mục 7.12 (conversion, luồng accept offer → tạo hồ sơ) |
| UN-002 | HR | Khi khởi tạo nhân viên mới | Dữ liệu prefill từ CV đã xác nhận + offer sang hồ sơ nhân viên | Không nhập lại, không trùng người | Critical | Confirmed — PRD Mục 7.12 (conversion), Mục 7.3 (rủi ro trùng); reverse spec FR-RC-07 |
| UN-003 | HR | Khi chuẩn bị checklist | Task sinh từ mẫu theo vị trí + thêm tay; mọi task bắt buộc có owner + hạn | Không có việc nào "không chủ" hoặc không hạn | Critical | Confirmed — PRD Mục 7.12 (checklist, assignee, due date; rủi ro chính) |
| UN-004 | Assignee | Khi được giao việc onboarding | Thấy task của mình kèm tên nhân viên mới, hạn và context; xác nhận xong một chạm | Việc được làm đúng hạn, có người chịu trách | Critical | Confirmed — PRD Mục 7.12 (assignee, due date) |
| UN-005 | HR | Khi theo dõi nhiều case cùng lúc | Một nơi thấy % hoàn tất, task quá hạn, sắp hạn và ngày bắt đầu còn lại | Phát hiện chậm trễ trước ngày đầu | Critical | Confirmed — PRD Mục 7.12 (progress; rủi ro task quá hạn) |
| UN-006 | HR | Khi đủ điều kiện hoàn tất | Đóng case → application chuyển ONBOARDED; nút đóng chặn kèm điều kiện thiếu khi chưa đủ | Chỉ đóng khi thật sự sẵn sàng | Critical | Confirmed — PRD Mục 7.12 (luồng → đóng); reverse spec FR-RC-07 (joined date + active conversion) |
| UN-007 | HR | Khi ứng viên không nhận việc/offer bị thu hồi | Hủy case kèm lý do; task đang mở hủy theo và báo assignee | Không còn việc treo vô nghĩa | High | Assumption — suy từ luồng offer PRD Mục 7.11/7.12 |
| UN-008 | Nhân viên mới | Sau khi có tài khoản | Xem và xác nhận việc của mình trong checklist | Tự hoàn tất phần mình đúng hạn | High | Confirmed — PRD Mục 3 (JTBD-EMP-01); phụ thuộc account-access |
| UN-009 | HR | Khi assignee vắng/sai người | Giao lại task cho người khác, đổi hạn, hủy task kèm lý do | Task luôn có chủ khả thi | High | Assumption — suy từ rủi ro "task không owner/quá hạn" PRD 7.12 |
| UN-010 | Quản lý | Khi có người mới sắp vào team | Xem tiến độ onboarding của người trong scope | Chủ động kế hoạch đón người | Medium | Assumption — suy từ JTBD-MGR-01 |
| UN-011 | HR | Khi quy trình chuẩn bị lặp theo vị trí | Mẫu checklist quản lý được: nhóm, mục, offset hạn, assignee mặc định | Không dựng checklist từ đầu mỗi lần | Medium | Assumption — mở rộng hợp lý từ "checklist" PRD Mục 7.12 |
| UN-012 | HR | Khi phát hiện thiếu sau khi đã đóng case | Mở lại case đã đóng trong thời hạn kèm lý do | Sửa sai sót mà vẫn có vết | Low | Assumption — trường hợp ngoại lệ hiếm |

## 5. Prioritized User Journeys

### Journey 1: Offer chấp nhận → tạo case và bắt đầu checklist

- **User:** HR
- **Importance:** Critical
- **Trigger:** Offer của application chuyển "Đã chấp nhận".
- **Expected outcome:** Case onboarding ở "Đang thực hiện" với checklist
  có đủ owner/hạn; hồ sơ nhân viên được khởi tạo theo luồng của
  `employee-profiles`.
- **Related needs:** UN-001, UN-002, UN-003

1) Sự kiện offer chấp nhận tạo case "Mới tạo" gắn application + offer +
   ngày bắt đầu (hoặc HR tạo tay trên application ACCEPTED).
2) Case áp mẫu checklist theo vị trí → sinh task kèm assignee + hạn mặc
   định; HR gán owner case, bổ sung/điều chỉnh.
3) HR "Bắt đầu onboarding" → case "Đang thực hiện", task phát cho
   assignee; hồ sơ nhân viên khởi tạo với prefill ở `employee-profiles`.

**Independent verification:** Cho một offer vừa chấp nhận — kiểm tra có
đúng một case mở gắn application đó, mọi task có assignee + hạn, và hồ
sơ nhân viên tồn tại ở trạng thái khởi tạo trỏ về application nguồn.

### Journey 2: Assignee thực hiện và xác nhận task

- **User:** Assignee
- **Importance:** Critical
- **Trigger:** Task được phát cho assignee khi case bắt đầu.
- **Expected outcome:** Task hoàn tất có người xác nhận + thời điểm;
  tiến độ case cập nhật.
- **Related needs:** UN-004, UN-005

1) Assignee nhận thông báo task kèm context (tên nhân viên mới, hạn) →
   mở task → thực hiện ngoài đời thật.
2) Bấm "Hoàn tất" (ghi chú tùy chọn) → task "Hoàn tất" + audit.
3) Task quá hạn chưa xong → cờ "Quá hạn" + nhắc; hoàn tất sau hạn ghi
   "hoàn tất trễ".

**Independent verification:** Xác nhận một task — bản ghi task có người
xác nhận, thời điểm và tiến độ case trên màn HR tăng đúng một việc.

### Journey 3: Đóng case khi đủ điều kiện

- **User:** HR
- **Importance:** Critical
- **Trigger:** Mọi task bắt buộc của case đã hoàn tất và hồ sơ nhân viên
  đã kích hoạt.
- **Expected outcome:** Case "Hoàn tất" → sự kiện phát ra → application
  chuyển `ONBOARDED` trên pipeline.
- **Related needs:** UN-005, UN-006

1) HR mở case thấy đủ điều kiện → "Đóng onboarding" → xác nhận.
2) Hệ thống ghi case "Hoàn tất" và phát sự kiện; `candidate-pipeline`
   chuyển application `ONBOARDED`; các bên liên quan được thông báo.
3) Nếu chưa đủ điều kiện → nút đóng chặn kèm danh sách còn thiếu.

**Independent verification:** Đóng một case — kiểm tra trên pipeline
application đó ở `ONBOARDED` với transition ghi nguồn là case này, và
case có hồ sơ nhân viên `HOAT_DONG` liên kết.

### Journey 4: Hủy case khi ứng viên không nhận việc

- **User:** HR
- **Importance:** High
- **Trigger:** Offer bị thu hồi hoặc ứng viên báo không nhận việc.
- **Expected outcome:** Case "Đã hủy" kèm lý do; mọi task đang mở hủy
  theo; assignee được báo.
- **Related needs:** UN-007

1) HR mở case → "Hủy onboarding" → nhập lý do bắt buộc → xác nhận.
2) Case "Đã hủy"; task đang mở chuyển "Đã hủy" + thông báo assignee.
3) Application trên pipeline không tự đổi — HR xử lý ở
   `candidate-pipeline`.

**Independent verification:** Hủy một case có task đang mở — mọi task mở
chuyển "Đã hủy" và không còn nhắc hạn nào phát đi.

### Journey 5: Nhân viên mới tự xác nhận việc của mình

- **User:** Nhân viên mới
- **Importance:** Medium
- **Trigger:** Task được gắn cờ "giao cho nhân viên mới" và nhân viên đã
  có tài khoản.
- **Expected outcome:** Nhân viên thấy task của mình, xác nhận xong;
  trước khi có tài khoản thì HR xác nhận thay.
- **Related needs:** UN-008

1) Nhân viên mở "Onboarding của tôi" → thấy task giao cho mình + ngày
   bắt đầu.
2) Xác nhận hoàn tất phần mình → HR/owner thấy cập nhật trên case.

**Independent verification:** Giao một task cho nhân viên mới có tài
khoản — nhân viên thấy task trong surface của mình và xác nhận được;
với nhân viên chưa có tài khoản, task hiện cho HR xác nhận thay.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tạo case cho application chưa ACCEPTED | Case treo không nguồn | Chặn + "Chỉ tạo onboarding cho ứng viên đã chấp nhận offer" | Journey 1 / UN-001 |
| Sự kiện offer chấp nhận phát lại | Hai case cho một ứng viên | Kiểm tra case mở theo application → bỏ qua bản trùng | Journey 1 / UN-001 |
| Bắt đầu khi còn task thiếu owner/hạn | Task "không chủ" trôi | Chặn + liệt kê {n} việc thiếu người phụ trách hoặc hạn | Journey 1 / UN-003 |
| Đóng case khi chưa đủ điều kiện | Nhân viên "tồn tại" mà chưa sẵn sàng | Chặn + liệt kê: việc bắt buộc chưa xong / hồ sơ chưa kích hoạt | Journey 3 / UN-006 |
| Hủy case/task thiếu lý do | Mất vết quyết định | Chặn + yêu cầu lý do tối thiểu 10 ký tự | Journey 4 / UN-007 |
| Offer bị thu hồi sau khi case đã tạo | Case chạy cho người không đến | Cảnh báo "offer đã bị thu hồi — cân nhắc hủy onboarding" | Journey 4 / UN-007 |
| Assignee vắng khi task sắp hạn | Task trễ không ai biết | Nhắc assignee + owner; HR giao lại được | Journey 2 / UN-009 |
| Hai người cùng xác nhận một task | Ghi đè xác nhận | Xác nhận đầu ghi; người sau thấy "đã hoàn tất" | Journey 2 / UN-004 |
| Nhân viên chưa có tài khoản | Task giao nhân viên không ai làm | Task hiện cho HR xác nhận thay khi việc xong ngoài hệ thống | Journey 5 / UN-008 |
| Ngày bắt đầu bị dời | Hạn task lệch thực tế | Cập nhật ngày bắt đầu + đề xuất dời hạn task theo offset (xác nhận trước khi áp) | Journey 1 / UN-003 |
| Hồ sơ nhân viên bị trả về (`employee-profiles`) | Case không đóng được | Case giữ "Đang thực hiện" + điều kiện đóng liệt kê rõ | Journey 3 / UN-006 |
| Checklist trống (không mẫu) | Không biết cần việc gì | Cho "Bắt đầu" khi HR xác nhận rõ "onboarding không cần task" | Journey 1 / UN-003 |
| Người thao tác ngoài phạm vi | Sửa case của đơn vị khác | Chặn + ghi audit truy cập bị từ chối | UN-010 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và thông báo tiếng Việt (PRD Mục 9).
- Chỉ application `ACCEPTED` mới tạo được case; một application tối đa
  một case đang mở — điều kiện tiên quyết.
- Mọi task phải có assignee + hạn trước khi "Bắt đầu" — không có việc
  "không chủ" trong checklist.
- Đóng case chỉ khi hai điều kiện cùng đạt: task bắt buộc xong VÀ hồ sơ
  nhân viên `HOAT_DONG` — không ngoại lệ.
- Việc trong checklist là do con người thực hiện rồi xác nhận — hệ
  thống không tự cấp quyền/tài khoản/thiết bị (PRD "Chưa làm").
- Hủy case, hủy task và đảo trạng thái đều bắt buộc lý do — điều kiện
  tiên quyết của các hành động hủy.
- Giấy tờ đính kèm task theo quyền của `document-library`; dữ liệu
  nhân viên tuân theo consent/access/retention.
- Truy cập case/task theo organization/role/data-scope; nhân viên mới
  chỉ thấy task của chính mình.
- Màn hình chính desktop cho HR (bảng case, checklist); nhân viên và
  assignee xem/xác nhận trên thiết bị thường dùng, không yêu cầu mobile
  riêng cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Điều kiện tạo case là application `ACCEPTED`; một case mở mỗi application, idempotent theo sự kiện | Nếu điều kiện khác → case tạo thiếu/trùng | Confirmed — reverse spec FR-RC-07 (offer actions → ONBOARDED); PRD Mục 7.12 | — |
| `employee-profiles` cung cấp conversion NHAP → CHO_DUYET → HOAT_DONG; feature này kích khởi và chờ, không tự kích hoạt | Nếu tự kích hoạt → bypass review hồ sơ | Confirmed — PRD Mục 7.3 (luồng review → kích hoạt); spec employee-profiles | Đối chiếu khi employee-profiles chốt |
| Mẫu checklist (P1) gán assignee mặc định theo vai trò; HR đổi được; không mẫu thì gán tay | Nếu mẫu không gán được → sinh task thiếu owner | Assumption — đã giải OQ-1 (đề xuất) | Head of HR xác nhận |
| Nhân viên mới có self-service khi đã có tài khoản; trước đó HR xác nhận thay | Nếu bắt buộc self-service → task treo chờ tài khoản | Assumption — đã giải OQ-2 (đề xuất) | Product owner xác nhận |
| Điều kiện đóng = task bắt buộc xong + hồ sơ HOAT_DONG; "đã đến nhận việc" là một task checklist | Nếu đóng chỉ cần checklist → hồ sơ chưa kích hoạt mà đã ONBOARDED | Assumption — đã giải OQ-3 (đề xuất) | Head of HR xác nhận |
| Checklist trống được "Bắt đầu" khi HR xác nhận rõ và ghi audit | Nếu bắt buộc ≥1 task → case đơn giản bị kẹt | Assumption — đã giải OQ-4 (đề xuất) | Product owner xác nhận |
| Giới hạn (50 task/case, offset 1–14 ngày, nhắc tối đa 5 lần, reopen 30 ngày, 50 mẫu/tổ chức) | Nếu ngưỡng khác → validation đổi | Assumption — đã giải OQ-5 (đề xuất) | Product owner xác nhận |
| Mẫu checklist thay đổi chỉ ảnh hưởng case tạo sau (snapshot tại thời điểm tạo case) | Nếu áp ngược → task đang chạy đổi khung | Assumption — bám nguyên tắc snapshot | — |
| Retention case/task/giấy tờ theo retention hồ sơ nhân viên | Nếu khác → thiếu policy xóa riêng | Assumption — đã giải OQ-6 (PRD OQ-6) | DPO duyệt policy |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Checklist hoàn tất trước ngày bắt đầu | Chưa có — xác lập bằng tỷ lệ case đủ điều kiện trước ngày bắt đầu trong pilot | Tỷ lệ checklist hoàn tất trước ngày bắt đầu đạt mức sponsor duyệt (chờ OQ-2 sản phẩm) | Case đóng có mọi task bắt buộc xong trước start_date / case đóng | 1 tháng sau pilot |
| USC-002 | Không có việc "không chủ" | 0% trước feature | 100% task có assignee + hạn khi case bắt đầu | Kiểm tra mẫu case đang chạy | Liên tục |
| USC-003 | Case đóng luôn kèm hồ sơ hợp lệ | 0% trước feature | 100% case "Hoàn tất" có hồ sơ nhân viên HOAT_DONG liên kết | Kiểm tra mẫu case đã đóng | Hàng tháng |
| USC-004 | Không case trùng, không task treo vô chủ | 0 sự cố | 0 case trùng trên một application; 0 task mở không assignee | Giám sát sự kiện tạo case/task | Liên tục |
| USC-005 | Onboarding khởi động nhanh sau chấp nhận | Chưa có — xác lập trong pilot | ≤1 ngày làm việc từ "offer chấp nhận" đến "bắt đầu onboarding" (đề xuất) | Thời gian giữa hai sự kiện trên case | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Ai gán owner/assignee mặc định — Resolved (đề xuất): mẫu
  checklist (P1) gán vai trò mặc định, HR đổi được khi tạo case; không
  có mẫu thì HR gán tay — chờ Head of HR xác nhận.
- [x] OQ-2: Nhân viên mới có self-service trong v1 không — Resolved (đề
  xuất): có nhưng phụ thuộc tài khoản (`account-access`); trước khi có
  tài khoản HR xác nhận thay — chờ Product owner xác nhận.
- [x] OQ-3: Điều kiện đóng case — Resolved (đề xuất): task bắt buộc
  xong + hồ sơ HOAT_DONG; "đã đến nhận việc" là một task checklist do
  HR/quản lý xác nhận — chờ Head of HR xác nhận.
- [x] OQ-4: Checklist trống có được bắt đầu — Resolved (đề xuất): được,
  khi HR xác nhận rõ "không cần task" — ghi audit lựa chọn đó.
- [x] OQ-5: Giới hạn (50 task/case, offset 1–14 ngày, nhắc tối đa 5
  lần, reopen 30 ngày, 50 mẫu/tổ chức) — Resolved (đề xuất): giữ làm
  mặc định — chờ Product owner xác nhận.
- [x] OQ-6: Retention case + task + giấy tờ đính kèm — Resolved (đề
  xuất): theo retention hồ sơ nhân viên; trước DPO duyệt chỉ synthetic
  (PRD OQ-6, Mục 9).
- [~] OQ-7: Tự cấp tài khoản/quyền hệ thống ngoài — Out of scope v1:
  PRD Mục 7.12 "Chưa làm" cho tới khi `external-integrations` sẵn sàng.
