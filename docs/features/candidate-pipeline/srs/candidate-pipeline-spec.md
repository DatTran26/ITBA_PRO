---
type: srs
feature: candidate-pipeline
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/candidate-pipeline/brainstorms/stage-tracked-pipeline.md
  - docs/features/candidate-pipeline/candidate-pipeline-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# candidate-pipeline — Software Requirements Specification

## 1. Scope

SRS này cover bảng pipeline tuyển dụng của một tổ chức: mỗi application ở
đúng một stage trong bộ stage cố định v1, chuyển stage đơn lẻ và hàng loạt
qua một state machine duy nhất (UI, API và tác vụ nền/feature khác dùng
chung một bộ kiểm tra), bắt buộc lý do cho các transition nhạy cảm, tạm
dừng có hạn xem lại, restore trong hạn, owner phụ trách, SLA theo stage,
filter/tìm kiếm và activity history trước → sau có nguồn. KHÔNG cover:
workflow builder tùy biến stage (PRD Mục 7.8 "Chưa làm"), tự động chuyển
stage bằng AI/automation (human-in-the-loop invariant), tiếp nhận/parse/xác
nhận CV (`cv-intake`, `document-review`), scoring AI (`candidate-matching`),
vòng đời phiên phỏng vấn (`interview-management`), ghi đánh giá
(`interview-evaluation`), offer (`offer-management`) và onboarding
(`employee-onboarding`) — các feature đó chỉ KÍCH transition qua state
machine của feature này.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Điều phối application qua các stage, bulk action, restore, gán owner | Có |
| Quản lý | người | Xem pipeline và hồ sơ quá hạn trong phạm vi quyền | Có (read-only) |
| Interviewer | người | Xem stage + context của ứng viên được phân công | Có (read-only, giới hạn) |
| Admin | người | Cấu hình SLA stage, kiểm tra audit transition | Có |
| Ứng viên | người | Subject của application | Không (không có giao diện v1) |
| `cv-intake` / `candidate-matching` | hệ thống (feature khác) | Đưa application đã review vào pipeline | Không (nguồn tạo application) |
| `interview-management` / `interview-evaluation` / `offer-management` / `employee-onboarding` | hệ thống (feature khác) | Kích transition khi có sự kiện nghiệp vụ của mình | Không (consumer của state machine) |
| `contextual-notifications` | hệ thống (feature khác) | Nhận sự kiện transition để gửi thông báo | Không (consumer sự kiện) |
| `management-reporting` | hệ thống (feature khác) | Đọc sự kiện/trạng thái để đo M-IN-01 | Không (consumer sự kiện) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-candidate-pipeline-001 | Board pipeline theo vị trí | Hệ thống phải hiển thị board pipeline theo vị trí tuyển dụng, mỗi application xuất hiện ở đúng một cột stage trong bộ stage cố định v1, kèm owner, thời điểm vào stage và hạn SLA hiện tại | P0 | demo | PRD Mục 7.8; URD UN-001 |
| FR-candidate-pipeline-002 | Nhận application vào `NEW` | Khi application được tạo từ `cv-intake` (sau xác nhận dữ liệu), `candidate-matching` (HR chấp nhận) hoặc HR thêm thủ công hồ sơ đã review, hệ thống phải đưa application vào stage `NEW` của vị trí tương ứng, gán owner hợp lệ và bắt đầu tính SLA stage | P0 | test | brainstorm Mục 5.5; URD Journey 1 |
| FR-candidate-pipeline-003 | Chuyển stage qua state machine duy nhất | Khi HR chuyển stage (đơn lẻ hoặc bulk) hoặc một feature khác kích transition, hệ thống phải kiểm tra transition trên cùng một bảng transition hợp lệ; UI chỉ hiển thị stage đích hợp lệ, transition không hợp lệ bị từ chối kèm lý do | P0 | test | PRD Mục 7.8 (rủi ro chính); Observed: reverse spec FR-RC-03; URD UN-002 |
| FR-candidate-pipeline-004 | Bắt buộc lý do cho transition nhạy cảm | Khi chuyển sang `REJECTED`, `WITHDRAWN`, `ON_HOLD` hoặc khi restore, hệ thống phải yêu cầu lý do (3–500 ký tự); `ON_HOLD` phải thêm hạn xem lại là ngày tương lai ≤90 ngày (đề xuất — OQ-1 spec) | P0 | test | brainstorm Mục 4, 7.1; URD UN-002 |
| FR-candidate-pipeline-005 | Kiểm đồng thời trước khi ghi | Khi xác nhận transition, hệ thống phải kiểm stage hiện tại của application còn khớp dữ liệu người thao tác đang thấy; nếu đã đổi, từ chối ghi và báo ai đã đổi lúc nào | P0 | test | brainstorm Mục 5.1 (D3), 6.4; URD Mục 6 |
| FR-candidate-pipeline-006 | Kiểm quyền theo data-scope | Mọi thao tác đọc/ghi trên application phải kiểm organization/role/data-scope; vai trò không được cấp trong scope bị từ chối; quản lý/interviewer chỉ đọc trong phạm vi được cấp | P0 | test | PRD Mục 9; brainstorm Mục 4; URD UN-011 |
| FR-candidate-pipeline-007 | Bulk action có preview và kết quả | Khi HR chọn 1–50 application và một bulk action (chuyển stage hoặc từ chối), hệ thống phải preview tách nhóm hợp lệ/không hợp lệ kèm lý do từng dòng trước khi chạy; sau xác nhận, xử lý từng hồ sơ độc lập và báo kết quả {N}/{M} | P0 | test | PRD Mục 7.8; brainstorm Mục 5.2; URD Journey 2 |
| FR-candidate-pipeline-008 | Ghi activity history mọi transition | Khi một transition xảy ra (bất kể nguồn), hệ thống phải ghi history: stage trước → sau, actor (người hoặc nguồn hệ thống), thời điểm, lý do (nếu có) và nguồn (thủ công / thao tác hàng loạt #{mã đợt} / hệ thống kèm tham chiếu feature gốc) | P0 | test | PRD Mục 7.8 (activity history); Observed: reverse spec FR-RC-01; URD UN-004 |
| FR-candidate-pipeline-009 | Owner phụ trách | Hệ thống phải giữ owner là người dùng hoạt động thuộc phạm vi vị trí cho mọi application đang mở; cho phép đổi owner đơn lẻ và hàng loạt | P0 | test | brainstorm Mục 4; URD UN-009 |
| FR-candidate-pipeline-010 | Restore trong hạn | Khi application ở `REJECTED`/`WITHDRAWN`/`FAILED` còn trong hạn restore (30 ngày — đề xuất, OQ-3 spec), hệ thống phải cho HR được cấp «Mở lại hồ sơ» về stage ngay trước khi kết thúc, bắt buộc lý do, ghi history "restore" | P0 | test | PRD Mục 7.8 (restore); brainstorm Mục 5.3; URD Journey 4 |
| FR-candidate-pipeline-011 | Tạm dừng và quay lại | Khi application ở `ON_HOLD`, hệ thống phải loại nó khỏi đếm quá hạn SLA; đến hạn xem lại phải nhắc owner; hết hạn xem lại mà không có quyết định mới thì tự quay về stage trước khi hold và tính lại SLA (đề xuất — OQ-4 spec) | P0 | test | PRD Mục 8 (M-IN-01 loại trừ hold); brainstorm Mục 5.4; URD UN-006 |
| FR-candidate-pipeline-012 | Filter và tìm kiếm | Hệ thống phải cho lọc theo vị trí, stage, owner, tình trạng quá hạn SLA, nguồn hồ sơ và tìm theo tên/email ứng viên, chỉ trong phạm vi quyền của người xem | P0 | test | PRD Mục 7.8 (filters); URD UN-001 |
| FR-candidate-pipeline-013 | Danh sách hồ sơ treo và badge quá hạn | Hệ thống phải hiển thị badge "sắp/quá hạn" trên card theo SLA stage hiện tại và cung cấp danh sách application đang mở quá hạn (loại trừ `ON_HOLD` có lý do hợp lệ) | P0 | demo | PRD Mục 8 (M-IN-01); brainstorm Mục 4 (P1→kéo lên cho đo lường); URD UN-007 |
| FR-candidate-pipeline-014 | Phát sự kiện transition | Khi transition thành công, hệ thống phải phát sự kiện nghiệp vụ mang application, trước → sau, actor và nguồn để `contextual-notifications` thông báo cho owner/interviewer liên quan và `management-reporting` đo; lỗi thông báo không được rollback transition | P0 | test | brainstorm Mục 4, 6.4; PRD Mục 7.26 |
| FR-candidate-pipeline-015 | Transition từ feature khác | Khi `interview-management` (phiên được tạo), `interview-evaluation` (kết quả đã review), `offer-management` (offer/phản hồi) hoặc `employee-onboarding` (chuyển đổi) kích transition, hệ thống phải áp cùng bộ kiểm tra + quyền và ghi nguồn "hệ thống" kèm tham chiếu đối tượng gốc | P0 | test | brainstorm Mục 6.2; PRD Mục 7.8 (rủi ro UI/API khác nhau); GAP-RC-02 reverse spec |
| FR-candidate-pipeline-016 | SLA cấu hình theo stage | Hệ thống phải cho vai trò được cấp cấu hình số ngày SLA theo stage (mặc định 5 ngày làm việc — đề xuất, OQ-1 spec), và theo vị trí khi cần; SLA mới áp cho application vào stage sau thời điểm đổi | P1 | test | brainstorm Mục 4 (P1); URD Mục 8 |
| FR-candidate-pipeline-017 | Ghi chú và tag trên application | Hệ thống phải cho người được cấp thêm ghi chú (≤500 ký tự) và tag trên application; ghi chú/tag hiển thị trong chi tiết và lọc được theo tag | P1 | demo | brainstorm Mục 4 (P1); URD Mục 3 |
| FR-candidate-pipeline-018 | Chuyển application sang vị trí khác | Khi HR được cấp chuyển application sang vị trí khác, hệ thống phải giữ nguyên history, ghi lý do và một dòng history "chuyển vị trí", đặt lại stage về `NEW` của vị trí đích (đề xuất — OQ-9 spec) | P1 | test | brainstorm Mục 4 (P1); URD UN-010 |
| FR-candidate-pipeline-019 | Xuất CSV danh sách đang lọc | Hệ thống phải cho xuất CSV danh sách application trong phạm vi bộ lọc hiện tại (chỉ trường được phép xem) | P1 | demo | brainstorm Mục 4 (P1); URD Mục 3 |
| FR-candidate-pipeline-020 | Saved view cá nhân | Hệ thống phải cho mỗi người lưu bộ lọc thường dùng làm view cá nhân | P2 | demo | brainstorm Mục 4 (P1) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-candidate-pipeline-001 | consistency | Một bảng transition hợp lệ duy nhất là nguồn chân lý cho UI, API và tác vụ nền; không transition nào chỉ tồn tại ở một đường | P0 | Audit chéo: mọi transition ghi nhận đều khớp bảng; không có đường tắt (bám rủi ro chính PRD Mục 7.8 và GAP-RC-02) |
| NFR-candidate-pipeline-002 | security | Truy cập application deny-by-default theo organization/role/data-scope trên mọi surface (board, chi tiết, filter, export, API) | P0 | 0 sự cố vượt scope được xác nhận (bám M-GR-01) |
| NFR-candidate-pipeline-003 | auditability | 100% transition và hành động nhạy cảm (đổi owner, chuyển vị trí, restore) có vết trước → sau, actor, nguồn | P0 | Truy vết được 100% sự kiện trên mẫu application kiểm tra |
| NFR-candidate-pipeline-004 | performance | Board và filter trả kết quả nhanh ở quy mô pilot | P1 | 95% lượt mở board/lọc ≤3 giây ở quy mô ≤5.000 application mở/tổ chức (đề xuất — OQ-9 spec) |
| NFR-candidate-pipeline-005 | reliability | Bulk action xử lý từng hồ sơ độc lập; lỗi một phần không làm mất kết quả phần đã thành công và đợt có trạng thái truy vết | P0 | Chạy bulk cố ý lỗi một phần: phần thành công giữ history, phần lỗi có lý do, đợt báo {N}/{M} đúng |
| NFR-candidate-pipeline-006 | usability | Toàn bộ giao diện/thông báo tiếng Việt tự nhiên; tên stage có nhãn tiếng Việt | P0 | Kiểm tra mẫu wording brainstorm Mục 7.3 hiển thị đúng |
| NFR-candidate-pipeline-007 | data-retention | History application giữ toàn vòng đời phục vụ audit; dữ liệu hồ sơ kết thúc theo retention chung | P1 | Không xóa history; chính sách xóa/anonymize theo quyết định retention (PRD OQ-6 — chờ DPO) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-candidate-pipeline-001 | Mọi thay đổi stage của application đi qua một bảng transition hợp lệ duy nhất — áp dụng cho UI, API, bulk và transition do feature khác kích | Bất kỳ yêu cầu đổi stage nào | FR-candidate-pipeline-003, FR-candidate-pipeline-015 | PRD Mục 7.8 (rủi ro chính); Observed: reverse spec FR-RC-03 |
| BR-candidate-pipeline-002 | Transition hợp lệ v1: `NEW→SCREENED`; `SCREENED→SHORTLISTED`; `SHORTLISTED→INTERVIEW_SCHEDULED` (qua `interview-management`); `INTERVIEW_SCHEDULED→PASSED`/`FAILED` (qua `interview-evaluation`); `PASSED→OFFERED` (qua `offer-management`); `OFFERED→ACCEPTED`/`OFFER_REJECTED` (qua `offer-management`); `ACCEPTED→ONBOARDED` (qua `employee-onboarding`); `NEW`/`SCREENED`/`SHORTLISTED`/`INTERVIEW_SCHEDULED`→`REJECTED` (thủ công, có lý do); stage đang mở →`WITHDRAWN` (có lý do); stage đang mở →`ON_HOLD` (lý do + hạn xem lại); `ON_HOLD`→stage trước khi hold; `REJECTED`/`WITHDRAWN`/`FAILED`→stage ngay trước (restore, trong hạn) | Khi kiểm tra transition | FR-candidate-pipeline-003 | Observed: reverse spec states.md; brainstorm Mục 6.2/6.3 |
| BR-candidate-pipeline-003 | `REJECTED`, `WITHDRAWN`, `ON_HOLD` và restore bắt buộc lý do 3–500 ký tự; `ON_HOLD` bắt buộc hạn xem lại tương lai ≤90 ngày | Khi xác nhận transition vào các stage đó | FR-candidate-pipeline-004 | brainstorm Mục 4, 7.1 |
| BR-candidate-pipeline-004 | `ON_HOLD` miễn tính quá hạn SLA; hết hạn xem lại không có quyết định → tự quay về stage trước và tính lại SLA (đề xuất) | Khi vào/ra `ON_HOLD` và khi đến hạn xem lại | FR-candidate-pipeline-011 | PRD Mục 8 (M-IN-01 loại trừ hold); OQ-4 |
| BR-candidate-pipeline-005 | Restore chỉ trong 30 ngày kể từ ngày kết thúc và chỉ về stage ngay trước khi kết thúc | Khi gọi «Mở lại hồ sơ» | FR-candidate-pipeline-010 | brainstorm Mục 5.3, 7.2; OQ-3 |
| BR-candidate-pipeline-006 | Bulk action tối đa 50 application/đợt; xử lý từng hồ sơ độc lập; phần không hợp lệ bị bỏ qua kèm lý do | Khi tạo và chạy đợt bulk | FR-candidate-pipeline-007 | brainstorm Mục 7.1/7.2; OQ-2 |
| BR-candidate-pipeline-007 | Quyết định loại/đạt/rút luôn do con người có quyền thực hiện — đề xuất AI (từ `candidate-matching`) không tự chuyển stage | Khi có đề xuất từ AI/matching | FR-candidate-pipeline-003 | PRD Mục 12 (human-in-the-loop invariant), Mục 7.7 |
| BR-candidate-pipeline-008 | Xác nhận transition chỉ khi stage hiện tại còn khớp dữ liệu người thao tác đang thấy | Khi submit transition | FR-candidate-pipeline-005 | brainstorm Mục 5.1 (D3), 6.4 |
| BR-candidate-pipeline-009 | Application đang mở phải có owner là người dùng hoạt động thuộc phạm vi vị trí | Khi tạo application và khi đổi owner | FR-candidate-pipeline-002, FR-candidate-pipeline-009 | brainstorm Mục 7.1 |
| BR-candidate-pipeline-010 | Transition do feature khác kích ghi nguồn "hệ thống" + tham chiếu đối tượng gốc (phiên, offer, onboarding) | Khi feature khác gọi state machine | FR-candidate-pipeline-015, FR-candidate-pipeline-008 | brainstorm Mục 6.2 |
| BR-candidate-pipeline-011 | Lỗi phát thông báo sau transition không rollback transition đã ghi | Khi `contextual-notifications` lỗi sau transition | FR-candidate-pipeline-014 | brainstorm Mục 6.4 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-candidate-pipeline-001 | Transition không hợp lệ | Chuyển sang stage không nằm trong transition hợp lệ (kể cả gọi API trực tiếp) | major | FR-candidate-pipeline-003 | "Không thể chuyển sang «{stage đích}» — hồ sơ đang ở «{stage hiện tại}» không được phép chuyển bước này" | Chọn lại stage đích hợp lệ trong danh sách |
| E-candidate-pipeline-002 | Thiếu lý do bắt buộc | Xác nhận sang `REJECTED`/`WITHDRAWN`/`ON_HOLD`/restore chưa nhập lý do | minor | FR-candidate-pipeline-004 | "Vui lòng nhập lý do để chuyển sang «{stage đích}»" | Nhập lý do rồi xác nhận lại |
| E-candidate-pipeline-003 | Thiếu/sai hạn xem lại ON_HOLD | Vào `ON_HOLD` không có hạn xem lại hoặc hạn quá khứ/>90 ngày | minor | FR-candidate-pipeline-004 | "Chọn ngày xem lại trong tương lai (tối đa 90 ngày)" | Chọn hạn hợp lệ |
| E-candidate-pipeline-004 | Stage đã đổi bởi người khác | Stage hiện tại không khớp khi xác nhận | minor | FR-candidate-pipeline-005 | "Hồ sơ đã được {tên người} chuyển sang «{stage}» lúc {HH:mm DD/MM} — đã tải lại trạng thái mới" | Màn hình tải lại; thao tác lại trên trạng thái mới |
| E-candidate-pipeline-005 | Không có quyền trên hồ sơ | Thao tác application ngoài data-scope hoặc vai trò không được cấp | major | FR-candidate-pipeline-006 | "Bạn không có quyền thao tác hồ sơ thuộc vị trí này" | Xin cấp quyền; sự kiện ghi audit |
| E-candidate-pipeline-006 | Hết hạn restore | «Mở lại hồ sơ» sau 30 ngày kết thúc | minor | FR-candidate-pipeline-010 | "Hồ sơ đã kết thúc hơn 30 ngày — không thể mở lại" | Không mở lại được; tạo application mới nếu cần |
| E-candidate-pipeline-007 | Bulk vượt 50 hồ sơ | Chọn >50 application trong một đợt | minor | FR-candidate-pipeline-007 | "Chỉ chọn được tối đa 50 hồ sơ mỗi lần — lọc nhỏ hơn hoặc chia nhiều đợt" | Giảm selection hoặc chia đợt |
| E-candidate-pipeline-008 | Bulk có phần tử không hợp lệ | Một số hồ sơ trong đợt không chuyển được (sai stage nguồn/hết quyền) | minor | FR-candidate-pipeline-007 | Preview: "{N} trong {M} hồ sơ không thể chuyển sang «{stage}» — xem chi tiết từng dòng" | Xác nhận phần hợp lệ hoặc sửa rồi chạy lại |
| E-candidate-pipeline-009 | Owner không hợp lệ | Gán owner là người bị vô hiệu hoặc ngoài phạm vi vị trí | minor | FR-candidate-pipeline-009 | "{Người} không còn hoạt động hoặc không thuộc phạm vi vị trí này" | Chọn owner khác trong danh sách hợp lệ |
| E-candidate-pipeline-010 | Đợt bulk gián đoạn | Lỗi hạ tầng giữa đợt bulk | major | FR-candidate-pipeline-007 | Đợt hiện "xử lý {N}/{M}, một phần lỗi" + danh sách lỗi | Chạy lại phần thất bại; phần đã chuyển không bị ảnh hưởng |
| E-candidate-pipeline-011 | Transition từ feature khác thất bại | `interview-management`/offer/onboarding kích transition nhưng stage hiện tại không hợp lệ | major | FR-candidate-pipeline-015 | Sự kiện bị từ chối, ghi log và báo owner application: "Không chuyển được hồ sơ {id} sang «{stage}» từ {feature} — trạng thái hiện tại «{stage}»" | HR xử lý thủ công trên board; feature gốc nhận lỗi |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-candidate-pipeline-01 | Không hồ sơ treo vô hình | M-IN-01: application ở cùng trạng thái quá SLA / application đang mở (loại trừ hold có reason) | Mốc chính thức theo OQ-1/OQ-2 PRD; đo rolling 7 ngày trong pilot |
| SC-candidate-pipeline-02 | Một bộ luật transition duy nhất | Tỷ lệ transition ghi nhận khớp bảng transition hợp lệ | 100% |
| SC-candidate-pipeline-03 | Truy vết đầy đủ | Tỷ lệ transition có trước → sau + actor + thời điểm + nguồn; tỷ lệ transition nhạy cảm có lý do | 100% |
| SC-candidate-pipeline-04 | Không hồ sơ mồ côi | Tỷ lệ application đang mở có owner hoạt động | 100% |
| SC-candidate-pipeline-05 | Bulk an toàn | Số sự cố "chuyển nhầm hàng loạt" không restore được | 0 trong pilot |
| SC-candidate-pipeline-06 | Không vượt quyền | Số incident xem/thao tác ngoài scope được xác nhận | 0 (bám M-GR-01) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Application__ — hồ sơ ứng tuyển trên pipeline: person, vị trí, stage
  hiện tại, owner, thời điểm vào stage, hạn SLA, trạng thái hold và mốc
  kết thúc.
- __Stage transition__ — một lần chuyển stage: trước → sau, actor/nguồn,
  lý do, tham chiếu đợt bulk hoặc đối tượng gốc của feature kích.
- __Bulk action batch__ — một đợt thao tác hàng loạt: action, stage đích,
  lý do, số lượng tổng/thành công/bỏ qua, trạng thái đợt.
- __Ghi chú application__ — note của người được cấp trên application.
- __Tag application__ — nhãn tự do gán trên application để lọc.
- __Cấu hình SLA stage__ — số ngày SLA theo stage (và theo vị trí khi cần).
- __Saved view__ — bộ lọc cá nhân đã lưu của người dùng.
- __Person / Vị trí / User__ — tham chiếu từ `cv-intake`,
  `recruitment-planning` và `account-access`/`org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/candidate-pipeline-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Application vào `NEW` → HR chuyển qua `SCREENED` →
  `SHORTLISTED` → các feature sau kích transition tiếp theo.
- __Flow 2:__ Bulk action: lọc → chọn ≤50 → preview hợp lệ/không hợp lệ →
  xác nhận → kết quả từng hồ sơ.
- __Flow 3:__ Tạm dừng: `ON_HOLD` + hạn xem lại → nhắc owner → hold tiếp
  hoặc về stage trước; hết hạn tự quay về (đề xuất).
- __Flow 4:__ Restore: application kết thúc còn hạn → «Mở lại hồ sơ» + lý
  do → về stage trước khi kết thúc.
- __Flow 5:__ Bàn giao: lọc theo owner cũ → đổi owner đơn lẻ/hàng loạt.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __pipeline-board__ — board theo vị trí, cột theo stage, card có owner +
  badge SLA.
- __application-detail__ — chi tiết hồ sơ: stage hiện tại, action chuyển,
  history, ghi chú/tag.
- __bulk-action-panel__ — chọn hồ sơ + action + preview hai nhóm + kết quả.
- __transition-dialog__ — chọn stage đích hợp lệ + lý do/hạn xem lại khi
  cần.
- __overdue-list__ — danh sách hồ sơ quá hạn/đang hold.
- __sla-config__ — cấu hình SLA theo stage (vai trò được cấp).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Bộ stage cố định v1 cho mọi tổ chức; không workflow builder | PRD Mục 7.8 "Chưa làm" — Product owner |
| Mọi transition qua một state machine duy nhất (UI = API = nền) | PRD Mục 7.8 (rủi ro chính) — Product owner |
| Quyết định loại/đạt/rút do con người có quyền; AI chỉ gợi ý | PRD Mục 12 (human-in-the-loop) — Product owner |
| Truy cập theo organization/role/data-scope + audit action nhạy cảm | PRD Mục 9 — Security owner |
| Dữ liệu ứng viên theo consent/access/retention policy; chỉ synthetic trước privacy gate | PRD Mục 9, OQ-3/OQ-6 — Product + DPO |
| Ứng viên không có giao diện pipeline trong v1 | PRD Mục 7.8 (không liệt kê surface ứng viên) — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Application đã review (person + dữ liệu CV xác nhận) | `cv-intake` / `document-review` | FR-candidate-pipeline-002 (có đường thủ công dự phòng) |
| Vị trí tuyển dụng đã duyệt/mở | `recruitment-planning` | Board theo vị trí và scope |
| Role/data-scope và danh sách owner hợp lệ | `org-governance` / `account-access` | FR-candidate-pipeline-006, FR-candidate-pipeline-009 |
| Nhận sự kiện để gửi thông báo/nhắc | `contextual-notifications` | Thông báo sau transition, nhắc hạn xem lại |
| Consumer sự kiện để đo M-IN-01 | `management-reporting` | Đo lường (không chặn vận hành) |
| Kích transition khi phiên/offer/onboarding đổi | `interview-management`, `interview-evaluation`, `offer-management`, `employee-onboarding` | FR-candidate-pipeline-015 |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| SLA mặc định 5 ngày làm việc/stage, hạn restore 30 ngày, bulk ≤50, ON_HOLD ≤90 ngày là chuẩn v1 | FR-candidate-pipeline-004/007/010/011/016 đổi ngưỡng |
| `INTERVIEW_SCHEDULED` gom mọi vòng phỏng vấn; số vòng nằm trên phiên | BR-candidate-pipeline-002 đổi bộ stage |
| Restore tự suy ra "stage ngay trước khi kết thúc" từ history | FR-candidate-pipeline-010 cần lưu stage trước kết thúc riêng |
| Bulk reject được phép cho mọi stage đích là `REJECTED` từ stage đang mở hợp lệ | FR-candidate-pipeline-007 cần tách quyền riêng cho bulk reject |
| History không bao giờ bị xóa trong v1 | NFR-candidate-pipeline-007 cần thêm cơ chế archive |
| Ứng viên trùng chỉ cần cảnh báo hiển thị, không gộp | URD Mục 6 cần thao tác merge |

## 12. Open Questions

- [x] OQ-1: SLA chuẩn từng stage và cấu hình theo vị trí? — Resolved (đề
  xuất): mặc định 5 ngày làm việc/stage, cấu hình theo stage + theo vị trí
  khi cần — chờ Recruitment owner xác nhận (URD OQ-1; PRD OQ-1/OQ-2 cho
  target M-IN-01).
- [x] OQ-2: Giới hạn và quyền bulk action? — Resolved (đề xuất): ≤50
  application/đợt; vai trò HR được cấp trong scope — chờ Product owner
  xác nhận (URD OQ-2).
- [x] OQ-3: Hạn restore và quyền restore? — Resolved (đề xuất): 30 ngày;
  HR trong data-scope — chờ Product owner xác nhận (URD OQ-3).
- [x] OQ-4: `ON_HOLD` hết hạn xem lại xử lý thế nào? — Resolved (đề
  xuất): tự quay về stage trước + thông báo owner + tính lại SLA — chờ
  Recruitment owner xác nhận (URD OQ-4).
- [x] OQ-5: Ứng viên trùng giữa các vị trí? — Resolved (đề xuất): chỉ
  cảnh báo hiển thị khi `cv-intake` đánh dấu, không gộp — chờ Product
  owner (URD OQ-5; OQ-RC-04 reverse spec).
- [x] OQ-6: Số vòng phỏng vấn ảnh hưởng bộ stage? — Resolved (đề xuất):
  `INTERVIEW_SCHEDULED` gom mọi vòng — chờ Head of HR (URD OQ-6;
  OQ-RC-01).
- [x] OQ-7: Kênh rút hồ sơ của ứng viên? — Resolved (đề xuất): HR ghi
  nhận thay trong v1; self-service là P2 — chờ Product owner (URD OQ-7).
- [x] OQ-8: Retention history và hồ sơ kết thúc? — Resolved (đề xuất):
  giữ toàn vòng đời; xóa/anonymize theo retention chung — chờ DPO/legal
  (PRD OQ-6).
- [x] OQ-9: Stage đích khi chuyển application sang vị trí khác? —
  Resolved (đề xuất): về `NEW` của vị trí đích + history "chuyển vị trí",
  giữ toàn bộ history cũ — chờ Recruitment owner xác nhận.
