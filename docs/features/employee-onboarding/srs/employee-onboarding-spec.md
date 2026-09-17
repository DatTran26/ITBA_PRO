---
type: srs
feature: employee-onboarding
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/employee-onboarding/brainstorms/candidate-conversion-onboarding-checklist.md
  - docs/features/employee-onboarding/employee-onboarding-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# employee-onboarding — Software Requirements Specification

## 1. Scope

SRS này cover việc thực hiện onboarding sau khi ứng viên chấp nhận offer:
tạo hồ sơ onboarding (case) từ sự kiện hoặc thủ công trên application
`ACCEPTED`, khởi tạo hồ sơ nhân viên có prefill ở `employee-profiles`,
sinh checklist có nhóm từ mẫu hoặc thêm tay với assignee + hạn bắt
buộc, theo dõi tiến độ và quá hạn, đóng case khi đủ điều kiện để phát
sự kiện `ONBOARDED`, và hủy case có lý do. KHÔNG cover: tự cấp quyền/
tài khoản hệ thống ngoài (PRD "Chưa làm"), quyết định và gửi offer
(`offer-management`), tạo/duyệt/kích hoạt hồ sơ nhân viên
(`employee-profiles` — feature này kích khởi và theo dõi, không tự kích
hoạt), chuyển stage application (`candidate-pipeline` — chỉ phát sự
kiện), cấp tài khoản đăng nhập (`account-access`) và vòng đời việc làm
sau ngày bắt đầu (`employment-lifecycle`).

> Lưu ý MoSCoW: PRD xếp feature này ở mức **Should** — KHÔNG nằm trong
> cam kết lát cắt v1 (15 capability Must). Đây là slice mở rộng
> hire-to-onboard; các "Phạm vi v1" ở đây chỉ first release của riêng
> feature khi được lên lịch.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo/điều phối case, dựng checklist, theo dõi tiến độ, đóng/hủy case | Có |
| Assignee (IT, hành chính, quản lý trực tiếp) | người | Nhận task có hạn + context, xác nhận hoàn tất | Có |
| Nhân viên mới | người | Xem và xác nhận task của mình khi có tài khoản | Có |
| Quản lý | người | Xem tiến độ onboarding của người trong scope | Có |
| Admin | người | Kiểm soát quyền, truy vết audit | Có |
| `offer-management` | hệ thống (feature khác) | Phát sự kiện offer "Đã chấp nhận" và dữ liệu offer làm nguồn | Không (nguồn sự kiện + prefill) |
| `employee-profiles` | hệ thống (feature khác) | Nhận yêu cầu khởi tạo hồ sơ, cung cấp trạng thái kích hoạt | Không (đích conversion + điều kiện đóng) |
| `candidate-pipeline` | hệ thống (feature khác) | Nhận sự kiện case hoàn tất để chuyển `ONBOARDED` | Không (consumer sự kiện) |
| `account-access` | hệ thống (feature khác) | Cung cấp trạng thái tài khoản của nhân viên mới | Không (điều kiện self-service) |
| `contextual-notifications` | hệ thống (feature khác) | Nhận sự kiện giao/nhắc/hủy task để gửi thông báo | Không (consumer sự kiện) |
| `document-library` | hệ thống (feature khác) | Cung cấp tài liệu đính kèm task (P1) | Không (nguồn đính kèm) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-employee-onboarding-001 | Tạo case từ sự kiện offer | Khi offer của một application chuyển "Đã chấp nhận", hệ thống phải tạo một case onboarding ở "Mới tạo" gắn application + offer + ngày bắt đầu từ offer; việc tạo phải idempotent theo application — sự kiện phát lại không tạo case thứ hai | P0 | test | PRD Mục 7.12 (luồng accept offer → tạo hồ sơ); URD UN-001 |
| FR-employee-onboarding-002 | Tạo case thủ công | Khi application ở `ACCEPTED` và chưa có case đang mở, hệ thống phải cho HR tạo case thủ công với các trường bắt buộc tương tự (ngày bắt đầu bắt buộc); một application tối đa một case đang mở | P0 | test | brainstorm Mục 4 P0, 6.1 (D1); URD UN-001 |
| FR-employee-onboarding-003 | Prefill conversion | Khi case bắt đầu, hệ thống phải kích khởi tạo hồ sơ nhân viên ở `employee-profiles` với dữ liệu prefill từ CV đã xác nhận + offer (tên, liên hệ, vị trí, phòng ban, ngày bắt đầu) và giữ liên kết hồ sơ trên case; trạng thái kích hoạt hồ sơ do `employee-profiles` quyết định | P0 | test | PRD Mục 7.12 (conversion), Mục 7.3; reverse spec FR-RC-07; URD UN-002 |
| FR-employee-onboarding-004 | Ngày bắt đầu bắt buộc | Hệ thống phải yêu cầu ngày bắt đầu (joined date) trên mọi case — mặc định lấy từ offer, cho HR sửa, và cảnh báo khi ngày bắt đầu ở quá khứ quá 30 ngày | P0 | test | reverse spec FR-RC-07 (joined date); brainstorm Mục 7.1 |
| FR-employee-onboarding-005 | Sinh task từ mẫu và thêm tay | Khi case được tạo và có mẫu checklist khớp vị trí, hệ thống phải sinh task theo mẫu (nhóm, tiêu đề, assignee mặc định, hạn theo offset trước ngày bắt đầu); HR thêm task tay với cùng trường bắt buộc: tiêu đề, nhóm, assignee (hoặc cờ "giao cho nhân viên mới"), hạn | P0 | test | PRD Mục 7.12 (checklist, assignee, due date); URD UN-003 |
| FR-employee-onboarding-006 | Chặn bắt đầu khi thiếu chủ | Khi HR bấm "Bắt đầu onboarding", hệ thống phải kiểm tra mọi task có assignee + hạn; nếu thiếu, chặn và liệt kê các task thiếu; nếu checklist trống, chỉ cho bắt đầu khi HR xác nhận rõ "onboarding không cần task" | P0 | test | PRD Mục 7.12 (rủi ro task không owner); brainstorm OQ-4; URD UN-003 |
| FR-employee-onboarding-007 | Assignee xác nhận task | Hệ thống phải cho assignee xem task được giao kèm context nhân viên mới và hạn, thực hiện ngoài hệ thống rồi bấm "Hoàn tất" (ghi chú tùy chọn ≤1.000 ký tự); xác nhận phải ghi người + thời điểm và idempotent — xác nhận lại trả trạng thái hiện tại | P0 | test | PRD Mục 7.12 (assignee, progress); URD UN-004 |
| FR-employee-onboarding-008 | Quá hạn và nhắc | Khi task đến hạn chưa hoàn tất, hệ thống phải đánh dấu "Quá hạn" và nhắc assignee + owner case (qua `contextual-notifications`, tối đa 1 lần/ngày và dừng sau 5 lần); task quá hạn vẫn hoàn tất được và ghi "hoàn tất trễ" | P0 | test | PRD Mục 7.12 (rủi ro quá hạn); brainstorm Mục 7.2; URD UN-005 |
| FR-employee-onboarding-009 | Giao lại, đổi hạn, hủy task | Hệ thống phải cho HR giao lại task cho người dùng đang hoạt động khác, đổi hạn, và hủy task kèm lý do bắt buộc; mọi thay đổi ghi audit trước/sau | P0 | test | brainstorm Mục 4 P0; URD UN-009 |
| FR-employee-onboarding-010 | Tiến độ case | Hệ thống phải hiển thị trên mỗi case: % task hoàn tất, danh sách task quá hạn và sắp hạn, số ngày còn lại tới ngày bắt đầu | P0 | demo | PRD Mục 7.12 (progress); URD UN-005 |
| FR-employee-onboarding-011 | Đóng case có điều kiện kép | Hệ thống phải chỉ cho "Đóng onboarding" khi mọi task bắt buộc ở "Hoàn tất" (hoặc đã hủy/bỏ qua có lý do) VÀ hồ sơ nhân viên liên kết đã `HOAT_DONG`; khi chưa đủ, nút đóng chặn kèm danh sách điều kiện thiếu; khi đóng, phát sự kiện để `candidate-pipeline` chuyển `ONBOARDED` | P0 | test | PRD Mục 7.12 (luồng → đóng); reverse spec FR-RC-07; URD UN-006 |
| FR-employee-onboarding-012 | Hủy case | Hệ thống phải cho HR hủy case đang mở kèm lý do bắt buộc (10–500 ký tự); khi hủy, mọi task đang mở chuyển "Đã hủy" và assignee được thông báo; application trên pipeline không tự đổi | P0 | test | brainstorm Mục 4 P0, 5.4; URD UN-007 |
| FR-employee-onboarding-013 | Self-service nhân viên mới | Khi task được gắn cờ "giao cho nhân viên mới" và nhân viên đã có tài khoản liên kết hồ sơ, hệ thống phải hiển thị task đó trong surface của nhân viên để tự xác nhận; khi chưa có tài khoản, task hiện cho HR xác nhận thay | P1 | test | brainstorm Mục 4 P0/P1, OQ-2; URD UN-008 |
| FR-employee-onboarding-014 | Mẫu checklist | Hệ thống phải cho HR quản lý mẫu checklist theo tổ chức: nhóm, tiêu đề mục, cờ bắt buộc, offset hạn trước ngày bắt đầu, vai trò assignee mặc định và vị trí áp dụng; case sinh task theo snapshot mẫu tại thời điểm tạo — sửa mẫu không ảnh hưởng case đang chạy | P1 | test | brainstorm Mục 4 P1, 8; URD UN-011 |
| FR-employee-onboarding-015 | Task tùy chọn và bỏ qua | Hệ thống phải phân biệt task bắt buộc và tùy chọn; task tùy chọn cho phép "Bỏ qua" kèm lý do và không chặn điều kiện đóng case | P1 | test | brainstorm Mục 6.5, 7.1 |
| FR-employee-onboarding-016 | Đính kèm tài liệu vào task | Hệ thống phải cho đính kèm tài liệu từ `document-library` vào task (giấy tờ mẫu, quy định cần đọc), hiển thị theo quyền của thư viện | P1 | demo | brainstorm Mục 4 P1 |
| FR-employee-onboarding-017 | Dời ngày bắt đầu | Khi HR cập nhật ngày bắt đầu trên case đang chạy, hệ thống phải đề xuất dời hạn các task chưa hoàn tất theo cùng offset và chỉ áp dụng sau khi HR xác nhận | P1 | test | brainstorm Mục 6.5 |
| FR-employee-onboarding-018 | Reopen case đã đóng | Hệ thống phải cho vai trò được cấp mở lại case "Hoàn tất" trong 30 ngày kể từ ngày đóng kèm lý do bắt buộc; quá hạn thì ẩn thao tác | P1 | test | brainstorm Mục 4 P1, 7.2; URD UN-012 |
| FR-employee-onboarding-019 | Cảnh báo offer thu hồi | Khi offer nguồn của case bị thu hồi, hệ thống phải hiển thị cảnh báo trên case để HR cân nhắc hủy, không tự hủy | P0 | demo | brainstorm Mục 6.4; URD Mục 6 |
| FR-employee-onboarding-020 | Audit đầy đủ | Hệ thống phải ghi vết: ai tạo case, gán owner, giao/giao lại/đổi hạn/hủy task, xác nhận hoàn tất (kể cả xác nhận thay), bắt đầu, đóng, hủy, reopen — kèm thời điểm và lý do khi bắt buộc | P0 | kiểm tra | PRD Mục 9; URD Mục 3 (audit) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-employee-onboarding-001 | decision-safety | Việc trong checklist do con người thực hiện và xác nhận — hệ thống không tự cấp quyền, tài khoản hay thiết bị; mọi xác nhận có người chịu trách | P0 | 0 task được đánh dấu hoàn tất mà không có người xác nhận ghi nhận |
| NFR-employee-onboarding-002 | reliability | Tạo case idempotent theo application và xác nhận task idempotent — sự kiện/thao tác phát lại không tạo bản trùng | P0 | 0 case trùng trên một application và 0 task hoàn tất ghi đè trong recovery test |
| NFR-employee-onboarding-003 | security | Case, task và giấy tờ đính kèm tuân theo organization/role/data-scope; nhân viên mới chỉ thấy task của mình; deny-by-default | P0 | 0 sự cố xem/sửa case vượt phạm vi được xác nhận (bám M-GR-01) |
| NFR-employee-onboarding-004 | auditability | Mọi hành động trên case và task truy vết được ai/khi nào/lý do/trước-sau | P0 | Truy vết được 100% sự kiện trên mẫu case kiểm tra |
| NFR-employee-onboarding-005 | usability | Toàn bộ giao diện, thông báo nhắc và trạng thái tiếng Việt; tiến độ case luôn hiển thị được mà không cần tính tay | P0 | Kiểm tra màn case và thông báo hiển thị đúng wording |
| NFR-employee-onboarding-006 | performance | Màn danh sách case và tiến độ tải nhanh ở quy mô pilot | P1 | 95% lượt mở danh sách case (≤100 case đang chạy) trả trong ≤3 giây (giá trị đề xuất — xem OQ-5) |
| NFR-employee-onboarding-007 | data-retention | Case, task, sự kiện và giấy tờ đính kèm giữ theo retention hồ sơ nhân viên | P1 | Thời gian giữ theo quyết định retention — chờ DPO (PRD OQ-6); trước khi duyệt chỉ dữ liệu synthetic |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-employee-onboarding-001 | Chỉ application `ACCEPTED` mới tạo được case; một application tối đa một case đang mở — sự kiện offer phát lại bị bỏ qua | Khi có yêu cầu tạo case (sự kiện hoặc tay) | FR-employee-onboarding-001, FR-employee-onboarding-002 | brainstorm Mục 6.1 (D1), 6.4; reverse spec FR-RC-07 |
| BR-employee-onboarding-002 | Mọi task phải có assignee (hoặc cờ "giao cho nhân viên mới") + hạn trước khi case "Bắt đầu"; hạn sau ngày bắt đầu chỉ cảnh báo, không chặn | Khi HR bấm "Bắt đầu onboarding" | FR-employee-onboarding-005, FR-employee-onboarding-006 | PRD Mục 7.12 (rủi ro chính); brainstorm Mục 7.1 |
| BR-employee-onboarding-003 | Đóng case đòi hai điều kiện cùng đạt: mọi task bắt buộc hoàn tất/hủy/bỏ qua có lý do VÀ hồ sơ nhân viên liên kết `HOAT_DONG` | Khi HR bấm "Đóng onboarding" | FR-employee-onboarding-011 | PRD Mục 7.12; reverse spec FR-RC-07 (active employee conversion); brainstorm OQ-3 |
| BR-employee-onboarding-004 | Hủy case, hủy task và reopen đều bắt buộc lý do; task/case đã hủy không mở lại — cần thì tạo mới | Khi hủy hoặc reopen | FR-employee-onboarding-009, FR-employee-onboarding-012, FR-employee-onboarding-018 | brainstorm Mục 6.3, 7.1 |
| BR-employee-onboarding-005 | Hệ thống không tự cấp quyền/tài khoản/thiết bị — task "tài khoản", "thiết bị" là việc con người làm rồi xác nhận | Khi thực hiện task nhóm tài khoản/thiết bị | FR-employee-onboarding-007 | PRD Mục 7.12 "Chưa làm" |
| BR-employee-onboarding-006 | Mẫu checklist thay đổi chỉ ảnh hưởng case tạo sau — case giữ task đã sinh theo snapshot mẫu tại thời điểm tạo | Khi mẫu bị sửa trong lúc case đang chạy | FR-employee-onboarding-014 | brainstorm Mục 8 |
| BR-employee-onboarding-007 | Transition `ONBOARDED` do `candidate-pipeline` thực hiện qua state machine — feature này chỉ phát sự kiện "case hoàn tất"; hủy case không tự đổi stage | Khi case đóng hoặc hủy | FR-employee-onboarding-011, FR-employee-onboarding-012 | PRD Mục 7.8; brainstorm Mục 5.4 |
| BR-employee-onboarding-008 | Task "giao cho nhân viên mới" chỉ hiện self-service khi hồ sơ đã liên kết tài khoản; trước đó HR xác nhận thay | Khi render task cho nhân viên | FR-employee-onboarding-013 | brainstorm OQ-2 (đề xuất) |
| BR-employee-onboarding-009 | Task quá hạn vẫn hoàn tất được và ghi "hoàn tất trễ" — nhắc tối đa 1 lần/ngày, dừng sau 5 lần | Khi task quá hạn | FR-employee-onboarding-008 | brainstorm Mục 7.2 |
| BR-employee-onboarding-010 | Offer nguồn bị thu hồi không tự hủy case — chỉ cảnh báo cho HR quyết | Khi offer của case chuyển "thu hồi" | FR-employee-onboarding-019 | brainstorm Mục 6.4; human-in-the-loop |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-employee-onboarding-001 | Tạo case khi chưa đủ điều kiện | Tạo case trên application chưa `ACCEPTED` | major | FR-employee-onboarding-002 | "Chỉ tạo onboarding cho ứng viên đã chấp nhận offer" | Chờ offer được chấp nhận |
| E-employee-onboarding-002 | Đã có case mở | Tạo case (tay hoặc sự kiện) khi application đã có case mở | minor | FR-employee-onboarding-001, FR-employee-onboarding-002 | "Ứng viên này đang có hồ sơ onboarding — mở hồ sơ hiện có" | Mở case hiện có; sự kiện trùng bị bỏ qua |
| E-employee-onboarding-003 | Thiếu ngày bắt đầu | Tạo case khi offer không có ngày bắt đầu và HR chưa nhập | minor | FR-employee-onboarding-004 | "Cần ngày bắt đầu làm việc trước khi tạo checklist" | Nhập ngày bắt đầu |
| E-employee-onboarding-004 | Task thiếu owner/hạn khi bắt đầu | "Bắt đầu onboarding" khi còn task thiếu assignee/hạn | major | FR-employee-onboarding-006 | "Còn {n} việc chưa có người phụ trách hoặc hạn — bổ sung trước khi bắt đầu" | Gán đủ rồi bắt đầu lại |
| E-employee-onboarding-005 | Đóng case chưa đủ điều kiện | "Đóng onboarding" khi task bắt buộc chưa xong hoặc hồ sơ chưa HOAT_DONG | major | FR-employee-onboarding-011 | "Chưa thể đóng onboarding: {n} việc bắt buộc chưa xong / hồ sơ nhân viên chưa kích hoạt" | Hoàn tất task thiếu hoặc chờ hồ sơ kích hoạt |
| E-employee-onboarding-006 | Hủy thiếu lý do | Hủy case/task khi lý do rỗng hoặc <10 ký tự | minor | FR-employee-onboarding-012 | "Vui lòng nhập lý do hủy (tối thiểu 10 ký tự)" | Nhập lý do rồi xác nhận |
| E-employee-onboarding-007 | Xác nhận task trùng | Hai người cùng xác nhận một task | minor | FR-employee-onboarding-007 | Người sau thấy "đã hoàn tất" + người đã xác nhận | Không cần xử lý (idempotent) |
| E-employee-onboarding-008 | Hết quyền thao tác | Người ngoài scope cố sửa case/task | major | FR-employee-onboarding-009 | "Bạn không có quyền thao tác hồ sơ onboarding này" | Xin cấp quyền; sự kiện ghi audit |
| E-employee-onboarding-009 | Hồ sơ nhân viên bị trả về | `employee-profiles` trả hồ sơ về bổ sung | major | FR-employee-onboarding-011 | Case giữ "Đang thực hiện" + điều kiện đóng liệt kê "hồ sơ đang chờ bổ sung" | Bổ sung hồ sơ ở `employee-profiles` rồi đóng case |
| E-employee-onboarding-010 | Reopen quá hạn | Mở lại case đã đóng quá 30 ngày | minor | FR-employee-onboarding-018 | Thao tác reopen ẩn; khi cố gọi: "Hồ sơ đã đóng quá 30 ngày — không mở lại được" | Tạo case mới nếu thật sự cần |
| E-employee-onboarding-011 | Vượt giới hạn task/mẫu | Thêm task thứ 51 hoặc mẫu thứ 51 | minor | FR-employee-onboarding-005, FR-employee-onboarding-014 | "Đã đạt giới hạn {50 việc/case hoặc 50 mẫu} — gộp hoặc xóa bớt" | Gộp/xóa bớt rồi thêm lại |
| E-employee-onboarding-012 | Assignee không hợp lệ | Giao task cho người dùng đã vô hiệu/ngoài tổ chức | minor | FR-employee-onboarding-009 | "Người được giao phải là người dùng đang hoạt động trong tổ chức" | Chọn assignee khác |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-employee-onboarding-01 | Checklist hoàn tất trước ngày bắt đầu | Tỷ lệ case đóng có mọi task bắt buộc xong trước start_date / case đóng | Đạt mức sponsor duyệt — baseline/target chờ OQ-1/OQ-2 sản phẩm |
| SC-employee-onboarding-02 | Không việc nào "không chủ" | Tỷ lệ task có assignee + hạn khi case bắt đầu | 100% (guardrail, rủi ro chính) |
| SC-employee-onboarding-03 | Case đóng kèm hồ sơ hợp lệ | Tỷ lệ case "Hoàn tất" có hồ sơ nhân viên `HOAT_DONG` liên kết | 100% |
| SC-employee-onboarding-04 | Không trùng case, không task vô chủ | Số case trùng trên một application; số task mở không assignee | 0 và 0 |
| SC-employee-onboarding-05 | Onboarding khởi động nhanh | Thời gian từ "offer chấp nhận" đến "bắt đầu onboarding" | ≤1 ngày làm việc (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Case onboarding__ — hồ sơ onboarding của một application: trạng thái,
  ngày bắt đầu, owner, offer nguồn, hồ sơ nhân viên liên kết, mẫu đã áp.
- __Task onboarding__ — một việc trong checklist: nhóm, tiêu đề,
  assignee/cờ nhân viên mới, hạn, cờ bắt buộc, trạng thái, xác nhận.
- __Mẫu checklist + mục mẫu__ — cấu trúc checklist tái sử dụng theo vị
  trí: nhóm, tiêu đề, offset hạn, vai trò assignee mặc định.
- __Sự kiện onboarding__ — audit mọi tác động trên case và task.
- __Đính kèm task__ — tài liệu từ `document-library` gắn vào task (P1).
- __Application / Offer / Hồ sơ nhân viên / Người dùng / Tài liệu__ —
  tham chiếu từ `candidate-pipeline`, `offer-management`,
  `employee-profiles`, `org-governance`, `document-library`.

Chi tiết quan hệ + thuộc tính ở `srs/employee-onboarding-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Offer chấp nhận → case "Mới tạo" → sinh task từ mẫu → HR
  gán owner + kiểm → "Bắt đầu" → task phát cho assignee + hồ sơ nhân
  viên khởi tạo.
- __Flow 2:__ Assignee nhận task → thực hiện → xác nhận → tiến độ cập
  nhật; quá hạn → cờ + nhắc.
- __Flow 3:__ HR theo dõi → đủ điều kiện → "Đóng" → sự kiện → pipeline
  `ONBOARDED`.
- __Flow 4:__ Offer thu hồi/không nhận việc → "Hủy onboarding" + lý do →
  task mở hủy theo.
- __Flow 5:__ Nhân viên mới có tài khoản → "Onboarding của tôi" → tự
  xác nhận phần mình.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __onboarding-case-list__ — danh sách case theo trạng thái/ngày bắt
  đầu/owner + cảnh báo quá hạn.
- __onboarding-case-detail__ — thông tin case, checklist theo nhóm,
  tiến độ %, điều kiện đóng, nút bắt đầu/đóng/hủy.
- __onboarding-task__ — task của assignee: context nhân viên mới, hạn,
  nút hoàn tất + ghi chú.
- __my-onboarding__ — surface nhân viên mới: task của mình + ngày bắt
  đầu.
- __checklist-template-admin__ — quản lý mẫu checklist và mục mẫu (P1).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Feature là Should — không thuộc cam kết v1; triển khai sau khi sponsor duyệt slice hire-to-onboard | PRD Feature Map + Mục 7 ("Must mới là v1") — Product owner |
| Việc checklist do con người làm và xác nhận; không tự cấp quyền hệ thống ngoài | PRD Mục 7.12 "Chưa làm" + Mục 12 — Product owner |
| Conversion chỉ kích khởi — duyệt/kích hoạt hồ sơ theo luồng của `employee-profiles` | PRD Mục 7.3 (luồng review → kích hoạt) — HR owner |
| Truy cập theo organization/role/data-scope, deny-by-default; audit hành động nhạy cảm | PRD Mục 9 — Security owner |
| Giấy tờ/dữ liệu nhân viên theo consent/access/retention đã duyệt | PRD Mục 9 — DPO (OQ-6 PRD) |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Sự kiện offer "Đã chấp nhận" + dữ liệu offer (ngày bắt đầu, vị trí) | `offer-management` | FR-001/003/004 — không có nguồn tạo case tự động |
| Conversion ứng viên → hồ sơ + trạng thái kích hoạt | `employee-profiles` | FR-003/011 — không khởi tạo và đóng được |
| Application `ACCEPTED` + state machine nhận sự kiện `ONBOARDED` | `candidate-pipeline` | FR-001/011 |
| Tài khoản nhân viên mới + liên kết hồ sơ | `account-access` | FR-013 — self-service (không chặn luồng HR xác nhận thay) |
| Thông báo giao/nhắc/hủy task | `contextual-notifications` | FR-008 phần nhắc (task vẫn theo dõi trong app) |
| Tài liệu đính kèm task (P1) | `document-library` | FR-016 |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Một application tối đa một case đang mở; case hủy thì tạo case mới | FR-001/002 phải hỗ trợ nhiều case song song |
| Mẫu gán assignee mặc định theo vai trò, HR đổi được (đề xuất OQ-1) | FR-005 sinh task luôn thiếu owner — bắt đầu luôn bị chặn |
| Nhân viên self-service chỉ khi có tài khoản (đề xuất OQ-2) | FR-013 phải có surface khách hoặc bỏ tính năng |
| Đóng case = task bắt buộc xong + hồ sơ HOAT_DONG (đề xuất OQ-3) | FR-011 lỏng hơn → nhân viên ONBOARDED mà hồ sơ chưa hợp lệ |
| Checklist trống được bắt đầu khi HR xác nhận (đề xuất OQ-4) | FR-006 phải bắt buộc ≥1 task |
| Giới hạn 50 task/case, offset 1–14 ngày, nhắc tối đa 5 lần, reopen 30 ngày, 50 mẫu/tổ chức (đề xuất OQ-5) | Validation và NFR-006 đổi ngưỡng |
| Task/case hủy không mở lại | FR-009/012 phải thêm khôi phục |

## 12. Open Questions

- [x] OQ-1: Ai gán owner/assignee mặc định — Resolved (đề xuất): mẫu
  checklist gán vai trò mặc định, HR đổi được; không mẫu thì gán tay —
  chờ Head of HR xác nhận.
- [x] OQ-2: Nhân viên mới self-service — Resolved (đề xuất): có khi đã
  có tài khoản (`account-access`); trước đó HR xác nhận thay — chờ
  Product owner xác nhận.
- [x] OQ-3: Điều kiện đóng case — Resolved (đề xuất): task bắt buộc
  xong + hồ sơ `HOAT_DONG`; "đã đến nhận việc" là một task checklist —
  chờ Head of HR xác nhận.
- [x] OQ-4: Checklist trống có được bắt đầu — Resolved (đề xuất): được
  khi HR xác nhận rõ "không cần task", ghi audit.
- [x] OQ-5: Giới hạn và ngưỡng (50 task/case, offset 1–14 ngày, nhắc
  tối đa 5 lần, reopen 30 ngày, 50 mẫu/tổ chức, danh sách ≤3 giây) —
  Resolved (đề xuất): giữ làm mặc định — chờ Product owner xác nhận.
- [x] OQ-6: Retention case/task/giấy tờ — Resolved (đề xuất): theo
  retention hồ sơ nhân viên; trước DPO duyệt chỉ synthetic (PRD OQ-6).
- [~] OQ-7: Tự cấp tài khoản/quyền hệ thống ngoài — Out of scope v1:
  PRD Mục 7.12 "Chưa làm" cho tới khi `external-integrations` sẵn sàng.
