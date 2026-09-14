---
type: prd-product
status: in-review
updated: 2026-09-13
links:
  - README.md
  - architecture.md
  - security.md
  - ../../plans/archive/itbaai-legacy/imported-requirements/hitek-testhub/hitek-testhub-requirements.md
  - ../archive/itbaai-legacy/README.md
  - ../_reverse/README.md
---

# PRD sản phẩm Town Hown

## 1. One-line pitch

Town Hown là nền tảng HRMS tích hợp AI; lát cắt thương mại v1 giúp đội tuyển
dụng đưa một hồ sơ từ tiếp nhận đến quyết định đã được con người review, đúng
bước, có evidence và không thất lạc trạng thái.

## 2. Vấn đề và why now

Doanh nghiệp thường vận hành hồ sơ nhân sự, tuyển dụng, phỏng vấn, bài đánh giá,
biên bản họp và giao việc trên nhiều file/công cụ rời. Dữ liệu bị nhập lại, trạng
thái khó truy nguyên, người phụ trách bỏ sót hạn và lãnh đạo không có góc nhìn
thống nhất. AI có thể giảm công việc thủ công ở CV, tài liệu, câu hỏi, transcript
và báo cáo, nhưng nếu không có quyền dữ liệu, evidence và human review thì nó làm
tăng rủi ro quyết định sai hoặc lộ dữ liệu.

Source ITBAAI hiện đã cung cấp nền tuyển dụng, assessment, Document AI và email.
Đây là bằng chứng về khả năng triển khai, chưa phải bằng chứng về nhu cầu thị
trường. V1 vì vậy tập trung kiểm chứng một hành trình có sẵn trong source: tiếp
nhận hồ sơ → review dữ liệu → assessment/phỏng vấn → quyết định đã review. Mức
độ cấp bách, willingness-to-pay và buyer fit vẫn phải được xác nhận tại OQ-7.

Giải pháp thay thế hiện tại gồm spreadsheet, email/chat, lịch rời, ATS hoặc HRM
đơn lẻ và thao tác thủ công giữa các hệ thống. Town Hown khác biệt ở hành trình
liên thông từ dữ liệu nguồn đến quyết định, task và báo cáo, cùng nguyên tắc AI
giải thích được và không tự quyết định thay con người.

## 3. Người dùng và Jobs to Be Done

| ID | Persona | Job trong ngữ cảnh | Kết quả mong muốn |
| --- | --- | --- | --- |
| `JTBD-BUY-01` | Head of HR/HR Director (economic buyer) | Khi thời gian tuyển kéo dài và evidence phân tán, cần một luồng có thể kiểm soát để giảm thất thoát và chứng minh chất lượng quyết định | Pilot được chấp nhận khi hành trình v1 đo được, không vượt quyền và giảm thao tác thủ công |
| `JTBD-HR-01` | HR/Recruiter | Khi một vị trí được mở, cần điều phối hồ sơ đến quyết định xuyên suốt | Không mất trạng thái, hạn hoặc evidence |
| `JTBD-INT-01` | Interviewer | Khi được giao một phiên đánh giá, cần chuẩn bị và ghi nhận kết quả nhất quán | Có đủ CV, JD, câu hỏi, ghi chú và kết quả |
| `JTBD-MGR-01` | Quản lý/Lãnh đạo | Khi cần phê duyệt hoặc xử lý chậm trễ, cần xem dữ liệu trong đúng phạm vi quyền | Thấy rủi ro và tiến độ mà không vượt phạm vi quyền |
| `JTBD-EMP-01` | Nhân viên | Khi tham gia onboarding/đánh giá/công việc, cần biết việc và dữ liệu liên quan đến mình | Hoàn tất đúng hạn và hiểu evidence được sử dụng |
| `JTBD-CAN-01` | Ứng viên | Khi tham gia quy trình tuyển, cần biết yêu cầu, trạng thái và cách dữ liệu được xử lý | Trải nghiệm rõ ràng, công bằng và bảo vệ dữ liệu |
| `JTBD-ADM-01` | Admin | Khi thiết lập/vận hành hệ thống, cần cấu hình quyền và provider có kiểm chứng | Hệ thống kiểm soát được, truy vết được |

Người ngoài phạm vi v1: đơn vị trả lương/thuế, nhà cung cấp phúc lợi và người
dùng không thuộc tổ chức hoặc quy trình tuyển dụng đã được mời.

## 4. Giá trị và khác biệt

- Một luồng dữ liệu xuyên suốt từ CV/tài liệu/cuộc họp/bài test đến hồ sơ, quyết
  định và công việc thay vì copy giữa công cụ.
- AI hỗ trợ trích xuất, sinh nội dung, đối chiếu và tóm tắt nhưng mọi kết quả có
  đường review, override và provenance phù hợp.
- Quyền truy cập theo vai trò, tổ chức và phạm vi quản lý được xem là product
  constraint, không phải tùy chọn triển khai sau.
- Assessment, recruitment và talent model dùng chung persons, positions, skills
  và evidence, giúp kết quả đánh giá có ngữ cảnh.
- Tài liệu, audit và operational data được phân biệt để điều tra mà không biến
  log thành nguồn quyết định nhân sự.

## 5. Goals và non-goals

### Goals

1. Chuẩn hóa các quy trình nhân sự và tuyển dụng quan trọng thành trạng thái,
   trách nhiệm, hạn và evidence rõ ràng.
2. Giảm nhập liệu và tổng hợp thủ công bằng AI có human review.
3. Chứng minh lát cắt tuyển dụng + assessment trước khi mở rộng sang Core HR,
   họp và công việc.
4. Cho lãnh đạo góc nhìn quản trị theo đúng phạm vi quyền.
5. Bảo vệ dữ liệu nhân sự và truy nguyên quyết định có tác động đến con người.

### Non-goals

- Không để AI tự động tuyển, loại, kỷ luật hoặc kết luận phẩm chất con người.
- Không giám sát bí mật, keylogging hoặc thu thập hoạt động ngoài chính sách đã
  công bố.
- Không thay thế payroll, kế toán, thuế hoặc hệ thống pháp lý trong v1.
- Không tuyên bố đáp ứng PDPA/GDPR hoặc production-ready khi chưa có policy,
  retention, DPA và validation được owner phê duyệt.
- Không xây marketplace/consumer HR platform; sản phẩm ưu tiên tổ chức B2B.
- Không đưa Core HR đầy đủ, Meetings & Work, workforce monitoring hoặc báo cáo
  liên domain vào cam kết phát hành v1.

## 6. Capability themes

### 6.1 Lát cắt thương mại v1

V1 chỉ cam kết 15 capability tạo thành một hành trình tuyển dụng có thể pilot:
identity/governance, planning, document intake/review, CV intake, matching tùy
chọn, pipeline, question bank, assessment authoring/taking/grading, interview
management/evaluation và notification nền. Offer, onboarding, Core HR đầy đủ,
Meetings & Work, reporting liên domain và integration rộng là roadmap mở rộng.

| Outcome v1 | Điều kiện hoàn thành |
| --- | --- |
| Thiết lập tenant pilot an toàn | Role, scope và audit cho action nhạy cảm được kiểm tra |
| Đưa CV thành application đã review | File hợp lệ; extraction có provenance; HR xác nhận facts |
| Điều phối application đến assessment/phỏng vấn | Trạng thái, owner, hạn và đường manual fallback rõ |
| Thu bài assessment không mất dữ liệu | Snapshot, autosave, expiry, attempt và submit contract được kiểm chứng |
| Tạo quyết định có evidence | Score/evaluation có reviewer; AI không tự pass/fail |
| Đo pilot | North Star, guardrail và nguồn event được sponsor chấp nhận |

### 6.2 Phạm vi dài hạn

| Theme | Mục tiêu |
| --- | --- |
| Identity & Governance | Xác định ai được làm gì và truy nguyên hành động |
| Core HR | Duy trì hồ sơ và vòng đời nhân sự có kiểm soát |
| Recruitment | Điều phối từ nhu cầu tuyển dụng đến onboarding |
| Meetings & Work | Biến trao đổi thành quyết định và công việc |
| Document AI | Chuyển file thành dữ liệu có provenance và review |
| Assessment & Talent | Tạo, thực hiện và phân tích đánh giá năng lực |
| Insights & Integrations | Thông báo, báo cáo và kết nối hệ thống ngoài |

### 6.3 Nguồn yêu cầu và quy tắc nhập PRD

| Cụm feature | Nguồn yêu cầu | Bằng chứng hiện trạng |
| --- | --- | --- |
| Assessment, question bank | Hitek TestHub phase 1, 2 và BE feedback | `assessment-and-grading`, `knowledge-and-question-bank` reverse SRS |
| Recruitment, interview, offer | Hitek AI CV Screening; ITBA recruitment/interview plans | `recruitment-and-interviews` reverse SRS |
| Talent, person, position, skill, group | Hitek BE feedback backlog; ITBA talent/CRM plans | `talent-and-crm` reverse SRS |
| Document library và AI pipeline | Hitek BE feedback; ITBA document pipeline plans | `knowledge-and-question-bank` reverse SRS |
| Email, version, setting, AI usage | ITBA admin/email/version plans | `platform-communications-and-governance` reverse SRS |

Hitek/ITBA là provenance, không phải chỉ dẫn hay bằng chứng hoàn tất; source/reverse SRS chỉ xác nhận hành vi.

## 7. Luồng người dùng tổng quan và Feature Map

### Hành trình HR/Recruiter

1. Đăng nhập và làm việc trong đúng tổ chức/phạm vi (`account-access`,
   `org-governance`).
2. Tạo nhu cầu/vị trí tuyển dụng (`recruitment-planning`).
3. Tiếp nhận file, kiểm tra, trích xuất và xác nhận dữ liệu (`document-intake`,
   `document-review`, `cv-intake`); với ảnh giấy tờ cần scan nhanh ngoài
   pipeline: `vision-ocr`.
4. Đối chiếu ứng viên với vị trí nếu HR chọn dùng matching
   (`candidate-matching`); application đã review vẫn có thể vào pipeline thủ công.
5. Điều phối pipeline, assessment và phỏng vấn (`candidate-pipeline`,
   `assessment-templates`, `assessment-authoring`, `interview-management`).
6. Ghi nhận đánh giá, offer và onboarding (`interview-evaluation`,
   `offer-management`, `employee-onboarding`).
7. Chuyển người trúng tuyển thành hồ sơ/vòng đời nhân sự (`employee-profiles`, `employment-lifecycle`).
8. Theo dõi kết quả và rủi ro (`management-reporting`).
9. Khi cần, gửi email nghiệp vụ có kiểm soát (`operational-email`).

### Hành trình Nhân viên/Quản lý

1. Truy cập workspace và hồ sơ được phép xem (`account-access`,
   `employee-profiles`).
2. Tạo hoặc tham gia cuộc họp (`meeting-records`).
3. Xác nhận biên bản/đầu việc AI đề xuất (`ai-meeting-minutes`,
   `meeting-to-tasks`).
4. Thực hiện và bàn giao công việc (`kanban-workspaces`).
5. Tham gia đánh giá năng lực (`candidate-assessment`, `assessment-grading`).
6. Duy trì khung kỹ năng, đánh giá và xem khoảng trống phù hợp
   (`talent-framework`, `employee-evaluation`, `skill-gap-analysis`).
7. Xem tiến độ/cảnh báo trong phạm vi quyền (`management-reporting`,
   `contextual-notifications`).

### Hành trình Ứng viên

1. Gửi hồ sơ và đồng ý xử lý dữ liệu (`cv-intake`).
2. Nhận bài đánh giá/lịch phỏng vấn (`contextual-notifications`).
3. Làm bài qua link được cấp (`candidate-assessment`).
4. Tham gia phỏng vấn và cung cấp evidence (`interview-management`).
5. Nhận kết quả/offer/onboarding theo chính sách (`offer-management`,
   `employee-onboarding`).

### Hành trình Interviewer

1. Nhận session và dữ liệu đúng phạm vi (`interview-management`).
2. Chuẩn bị câu hỏi đã review (`question-bank`, `ai-question-generation`, `assessment-authoring`).
3. Ghi evaluation/evidence; recording chỉ bật khi có consent
   (`interview-evaluation`, `interview-recording`).
4. Submit; HR review kết quả trước quyết định (`interview-evaluation`).

### Hành trình Admin

1. Bootstrap tài khoản và tổ chức (`account-access`, `org-governance`).
2. Xác minh role, scope và audit bằng test account (`org-governance`).
3. Cấu hình provider bằng secret phía server, test connection và rollback
   (`platform-configuration`, `external-integrations`).
4. Quản lý tài liệu, email, phiên bản và mức dùng AI (`document-library`,
   `operational-email`, `release-announcements`, `ai-usage-monitoring`).
5. Xác minh notification, log lỗi và runbook (`contextual-notifications`).
6. Chỉ mở pilot dữ liệu nhạy cảm khi privacy gate ở Mục 9 đã đạt.

### Feature Map

| # | Tính năng | Slug | Theme | Persona | MoSCoW | Phụ thuộc | Chi tiết hóa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Quản lý tài khoản và truy cập | `account-access` | Identity & Governance | Tất cả | Must | Không | ✅ đã chi tiết |
| 2 | Quản lý tổ chức, quyền và audit | `org-governance` | Identity & Governance | Admin, quản lý | Must | 1 | ✅ đã chi tiết |
| 3 | Quản lý hồ sơ nhân viên | `employee-profiles` | Core HR | HR, nhân viên | Should | 2 | ✅ đã chi tiết |
| 4 | Quản lý vòng đời và tài liệu nhân sự | `employment-lifecycle` | Core HR | HR, quản lý | Could | 3 | ✅ đã chi tiết |
| 5 | Lập và phê duyệt nhu cầu tuyển dụng | `recruitment-planning` | Recruitment | HR, quản lý | Must | 2 | ✅ đã chi tiết |
| 6 | Tiếp nhận và chuẩn hóa CV | `cv-intake` | Recruitment | HR, ứng viên | Must | 5, 17, 18 | ✅ đã chi tiết |
| 7 | Đối chiếu ứng viên với vị trí | `candidate-matching` | Recruitment | HR | Must | 5, 6 | ✅ đã chi tiết |
| 8 | Điều phối pipeline ứng viên | `candidate-pipeline` | Recruitment | HR | Must | 6 | ✅ đã chi tiết |
| 9 | Lập lịch và điều phối phỏng vấn | `interview-management` | Recruitment | HR, interviewer | Must | 8 | ✅ đã chi tiết |
| 10 | Ghi nhận và tổng hợp đánh giá phỏng vấn | `interview-evaluation` | Recruitment | Interviewer, HR | Must | 9 | ✅ đã chi tiết |
| 11 | Tạo và theo dõi offer | `offer-management` | Recruitment | HR, ứng viên | Should | 8, 10 | ✅ đã chi tiết |
| 12 | Thực hiện onboarding | `employee-onboarding` | Recruitment | HR, nhân viên | Should | 3, 11 | ✅ đã chi tiết |
| 13 | Quản lý cuộc họp và transcript | `meeting-records` | Meetings & Work | Nhân viên, quản lý | Should | 1 | ✅ đã chi tiết |
| 14 | Tạo và xác nhận biên bản bằng AI | `ai-meeting-minutes` | Meetings & Work | Chủ trì | Should | 13 | ✅ đã chi tiết |
| 15 | Chuyển biên bản thành công việc | `meeting-to-tasks` | Meetings & Work | Chủ trì, assignee | Should | 14, 16 | ✅ đã chi tiết |
| 16 | Quản lý Kanban và bàn giao công việc | `kanban-workspaces` | Meetings & Work | Nhân viên, quản lý | Should | 2 | ✅ đã chi tiết |
| 17 | Tiếp nhận và xử lý tài liệu | `document-intake` | Document AI | HR, admin | Must | 2 | ✅ đã chi tiết |
| 18 | Trích xuất và xác nhận dữ liệu tài liệu | `document-review` | Document AI | HR, reviewer | Must | 17 | ✅ đã chi tiết |
| 19 | Quản lý ngân hàng câu hỏi | `question-bank` | Assessment & Talent | HR, interviewer | Must | 2 | ✅ đã chi tiết |
| 20 | Sinh câu hỏi từ tài liệu bằng AI | `ai-question-generation` | Assessment & Talent | HR, interviewer | Should | 17, 18, 19 | ✅ đã chi tiết |
| 21 | Tạo và phát hành bài đánh giá | `assessment-authoring` | Assessment & Talent | HR, interviewer | Must | 19 | ✅ đã chi tiết |
| 22 | Thực hiện bài đánh giá | `candidate-assessment` | Assessment & Talent | Ứng viên, nhân viên | Must | 21 | ✅ đã chi tiết |
| 23 | Chấm điểm và phân tích năng lực | `assessment-grading` | Assessment & Talent | HR, interviewer | Must | 22 | ✅ đã chi tiết |
| 24 | Ghi âm và tóm tắt phiên phỏng vấn | `interview-recording` | Assessment & Talent | Interviewer | Should | 9, 10 | ✅ đã chi tiết |
| 25 | Tạo báo cáo và cảnh báo quản trị | `management-reporting` | Insights & Integrations | Quản lý, lãnh đạo | Should | 2, 8, 16, 22, 23 | ✅ đã chi tiết |
| 26 | Gửi thông báo theo ngữ cảnh | `contextual-notifications` | Insights & Integrations | Tất cả | Must | 1, 2 | ✅ đã chi tiết |
| 27 | Kết nối lịch, webhook và công cụ ngoài | `external-integrations` | Insights & Integrations | HR, admin | Should | 2 | ✅ đã chi tiết |
| 28 | Quản lý cấu hình nền tảng | `platform-configuration` | Identity & Governance | Admin | Should | 1, 2 | ✅ đã chi tiết |
| 29 | Theo dõi vận hành nhân viên minh bạch | `workforce-monitoring` | Insights & Integrations | Quản lý, nhân viên | Could | 2, 16, 25 | ✅ đã chi tiết |
| 30 | Quản lý thư viện và phiên bản tài liệu | `document-library` | Document AI | HR, content editor | Should | 17, 18 | ✅ đã chi tiết |
| 31 | Quản lý mẫu bài đánh giá | `assessment-templates` | Assessment & Talent | Admin, HR | Should | 19, 21 | ✅ đã chi tiết |
| 32 | Quản lý khung kỹ năng và kỳ vọng vị trí | `talent-framework` | Assessment & Talent | HR, quản lý | Should | 2, 3 | ✅ đã chi tiết |
| 33 | Đánh giá năng lực nhân viên | `employee-evaluation` | Assessment & Talent | Quản lý, nhân viên | Should | 22, 23, 32 | ✅ đã chi tiết |
| 34 | Phân tích độ phủ và khoảng trống kỹ năng | `skill-gap-analysis` | Assessment & Talent | HR, quản lý | Should | 3, 32, 33 | ✅ đã chi tiết |
| 35 | Gửi email nghiệp vụ có mẫu và nhật ký | `operational-email` | Insights & Integrations | HR, admin | Should | 2, 26 | ✅ đã chi tiết |
| 36 | Công bố phiên bản và thông báo thay đổi | `release-announcements` | Identity & Governance | Admin, người dùng | Could | 1, 2, 28 | ✅ đã chi tiết |
| 37 | Theo dõi mức sử dụng AI | `ai-usage-monitoring` | Identity & Governance | Admin | Should | 2, 28 | ✅ đã chi tiết |
| 38 | Giám sát sự kiện vi phạm bằng Computer Vision | `cv-event-monitoring` | Insights & Integrations | Quản lý, admin | Could | 2, 16, 25, 26, 27 | ✅ đã chi tiết |
| 39 | Bóc tách văn bản từ ảnh có con người xác nhận | `vision-ocr` | Document AI | HR | Should | Không | ✅ đã chi tiết |

`Must` là phạm vi pilot v1; `Should`/`Could` không được ngầm kéo vào cam kết chỉ
vì có mini-brief. Reverse SRS là evidence tái lập từ code, không phải feature
spec đã được stakeholder phê duyệt. Pilot lần lượt qua safety foundation,
recruitment decision, hire-to-onboard, Meetings & Work rồi Insights; mỗi lát cắt
phải có owner, privacy gate, recovery test và rollback trước khi cam kết lịch.

### 7.1 Quản lý tài khoản và truy cập — account-access

Các mục **Phạm vi v1** từ đây là first release của từng feature. Chỉ feature
`Must` mới thuộc product v1; feature `Should`/`Could` nằm ở các slice sau.

Thiết lập danh tính và phiên làm việc cho mọi vai trò, bảo đảm người dùng chỉ
vào các surface được cấp. Đây là feature nền cho toàn bộ sản phẩm.

- **Phục vụ job:** Mọi persona cần truy cập an toàn và biết mình đang hành động
  trong tổ chức nào.
- **Phạm vi v1:** đăng nhập/đăng xuất, reset mật khẩu, trạng thái tài khoản và
  hồ sơ người dùng tối thiểu.
- **Chưa làm:** social login hoặc federation phức tạp nếu chưa có quyết định SSO.
- **Luồng chính:** được tạo/mời → xác thực → thiết lập phiên → vào workspace → kết
  thúc/khôi phục phiên.
- **Rủi ro chính:** người dùng có tài khoản nhưng sai phạm vi tổ chức.
- **Đo thành công:** tỷ lệ người được mời truy cập thành công; target là OQ-2.

### 7.2 Quản lý tổ chức, quyền và audit — org-governance

Quản lý công ty, chi nhánh, phòng ban, chức danh, vai trò và phạm vi dữ liệu,
đồng thời lưu evidence cho action nhạy cảm.

- **Phục vụ job:** Admin/quản lý kiểm soát ai được xem và thay đổi dữ liệu nào.
- **Phạm vi v1:** cơ cấu tổ chức, role/scope, quan hệ quản lý và audit hành động
  quan trọng.
- **Chưa làm:** policy builder tùy biến không giới hạn.
- **Luồng chính:** tạo đơn vị → gán thành viên/vai trò → xác định phạm vi → thực
  hiện action → truy vết.
- **Rủi ro chính:** rule quyền không nhất quán giữa các module.
- **Đo thành công:** số sự cố vượt quyền; guardrail là 0 sự cố xác nhận.

### 7.3 Quản lý hồ sơ nhân viên — employee-profiles

Tạo nguồn hồ sơ nhân viên thống nhất cho thông tin liên hệ, vị trí, người quản
lý, kỹ năng và dữ liệu nghiệp vụ liên quan.

- **Phục vụ job:** HR duy trì hồ sơ; nhân viên xem/cập nhật dữ liệu được phép.
- **Phạm vi v1:** thông tin cơ bản, vị trí/phòng ban, manager và trạng thái hồ sơ.
- **Chưa làm:** payroll/benefit calculation.
- **Luồng chính:** tạo/chuyển ứng viên → bổ sung hồ sơ → review → kích hoạt → cập
  nhật có audit.
- **Rủi ro chính:** trùng người hoặc dữ liệu nguồn không nhất quán.
- **Đo thành công:** tỷ lệ hồ sơ bắt buộc đầy đủ; target là OQ-2.

### 7.4 Quản lý vòng đời và tài liệu nhân sự — employment-lifecycle

Theo dõi hợp đồng, thử việc, chính thức, tạm nghỉ, điều chuyển và nghỉ việc cùng
tài liệu có quyền truy cập phù hợp.

- **Phục vụ job:** HR/quản lý hoàn tất chuyển trạng thái đúng bước và hạn.
- **Phạm vi v1:** trạng thái, mốc hiệu lực, checklist và tài liệu liên quan.
- **Chưa làm:** chữ ký số hoặc payroll integration nếu chưa được chọn.
- **Luồng chính:** tạo thay đổi → kiểm tra hồ sơ → phê duyệt → có hiệu lực → lưu
  evidence.
- **Rủi ro chính:** chuyển trạng thái thiếu phê duyệt hoặc mất tài liệu.
- **Đo thành công:** tỷ lệ chuyển trạng thái đúng hạn và đủ evidence.

### 7.5 Lập và phê duyệt nhu cầu tuyển dụng — recruitment-planning

Cho quản lý đề xuất nhu cầu, HR chuẩn hóa vị trí/JD và cấp thẩm quyền phê duyệt
trước khi mở tuyển.

- **Phục vụ job:** HR/quản lý thống nhất vì sao tuyển, cần ai và khi nào.
- **Phạm vi v1:** request, position/JD, headcount, owner và approval.
- **Chưa làm:** workforce budgeting hoặc marketplace posting tự động.
- **Luồng chính:** đề xuất → bổ sung JD → duyệt → mở vị trí → theo dõi.
- **Rủi ro chính:** mở tuyển khi requirement/authority chưa rõ.
- **Đo thành công:** thời gian từ request đến vị trí được duyệt.

### 7.6 Tiếp nhận và chuẩn hóa CV — cv-intake

Tiếp nhận hồ sơ qua upload/form/integration, lưu consent/provenance và đề xuất
trích xuất dữ liệu để HR xác nhận.

- **Phục vụ job:** Ứng viên nộp hồ sơ; HR có dữ liệu nhất quán để xử lý.
- **Phạm vi v1:** upload, storage, parse, hồ sơ ứng viên và review dữ liệu thiếu.
- **Chưa làm:** thu thập dữ liệu từ nguồn không có consent.
- **Luồng chính:** nộp CV → kiểm tra file → trích xuất → HR xác nhận → tạo
  application.
- **Rủi ro chính:** parse sai làm sai facts ứng viên.
- **Đo thành công:** tỷ lệ CV được HR xác nhận không cần nhập lại nhiều.

### 7.7 Đối chiếu ứng viên với vị trí — candidate-matching

So sánh CV đã xác nhận với yêu cầu vị trí, phân rã score theo kỹ năng, kinh
nghiệm và domain, đồng thời hiển thị evidence.

- **Phục vụ job:** HR ưu tiên hồ sơ nhưng vẫn giữ quyền review/override.
- **Phạm vi v1:** score, breakdown, evidence, threshold và override có lý do.
- **Chưa làm:** auto-reject quyết định cuối cùng chỉ dựa trên AI.
- **Luồng chính:** chọn application/JD → tính score → xem evidence → HR xác nhận
  hoặc override → đưa vào pipeline.
- **Rủi ro chính:** bias hoặc score không giải thích được.
- **Đo thành công:** tỷ lệ đề xuất AI được HR chấp nhận sau review; target OQ-2.

### 7.8 Điều phối pipeline ứng viên — candidate-pipeline

Quản lý trạng thái ứng viên theo transition hợp lệ, thao tác hàng loạt có xác
nhận và lịch sử trước/sau.

- **Phục vụ job:** HR biết mỗi ứng viên đang ở đâu và bước tiếp theo là gì.
- **Phạm vi v1:** state machine, filters, transition, restore và activity history.
- **Chưa làm:** workflow builder tùy ý cho mọi tổ chức.
- **Luồng chính:** nhận application → review → chuyển trạng thái → thực hiện bước
  vòng tuyển → đóng/onboard.
- **Rủi ro chính:** UI/API cho phép transition khác nhau.
- **Đo thành công:** tỷ lệ application không bị treo quá SLA.

### 7.9 Lập lịch và điều phối phỏng vấn — interview-management

Tạo lịch, phân công interviewer, gửi thông tin cần thiết và quản lý việc nhận/
từ chối phiên phỏng vấn.

- **Phục vụ job:** HR/interviewer phối hợp mà không bỏ lịch hoặc thiếu context.
- **Phạm vi v1:** lịch, participants, assignment, acceptance và session context.
- **Chưa làm:** tối ưu lịch tự động đa múi giờ nếu chưa có nhu cầu xác nhận.
- **Luồng chính:** chọn ứng viên → đề xuất lịch → interviewer phản hồi → xác nhận
  → thực hiện.
- **Rủi ro chính:** lịch thay đổi nhưng notification/context không đồng bộ.
- **Đo thành công:** tỷ lệ phiên diễn ra đúng lịch.

### 7.10 Ghi nhận và tổng hợp đánh giá phỏng vấn — interview-evaluation

Cho interviewer ghi score/note/evidence theo khung thống nhất và AI hỗ trợ tóm
tắt nhiều nhận xét cho HR.

- **Phục vụ job:** Interviewer đánh giá nhất quán; HR ra quyết định có căn cứ.
- **Phạm vi v1:** evaluation form, note, result, summary và HR review.
- **Chưa làm:** AI ra quyết định pass/fail cuối cùng.
- **Luồng chính:** mở session → ghi đánh giá → submit → AI tổng hợp → HR review.
- **Rủi ro chính:** summary làm mất ý kiến bất đồng hoặc evidence.
- **Đo thành công:** tỷ lệ phiên có đánh giá đầy đủ đúng hạn.

### 7.11 Tạo và theo dõi offer — offer-management

Tạo phiên bản offer cho ứng viên đạt, gửi và theo dõi trạng thái xem/chấp nhận/
từ chối có audit.

- **Phục vụ job:** HR hoàn tất đề nghị tuyển dụng minh bạch.
- **Phạm vi v1:** version, approval, send, status và response.
- **Chưa làm:** e-signature/legal workflow nếu chưa chọn provider.
- **Luồng chính:** tạo offer → duyệt → gửi → ứng viên phản hồi → chuyển onboarding.
- **Rủi ro chính:** gửi sai version hoặc người nhận.
- **Đo thành công:** thời gian từ quyết định đạt đến phản hồi offer.

### 7.12 Thực hiện onboarding — employee-onboarding

Chuyển ứng viên đã chấp nhận thành nhân viên và điều phối checklist giấy tờ,
thiết bị, tài khoản, đào tạo cùng owner/hạn.

- **Phục vụ job:** HR/nhân viên hoàn tất ngày đầu mà không bỏ sót chuẩn bị.
- **Phạm vi v1:** conversion, checklist, assignee, due date và progress.
- **Chưa làm:** tự động cấp quyền mọi hệ thống ngoài nếu chưa tích hợp.
- **Luồng chính:** accept offer → tạo hồ sơ/checklist → giao việc → xác nhận → đóng.
- **Rủi ro chính:** task onboarding không có owner hoặc quá hạn.
- **Đo thành công:** tỷ lệ checklist hoàn tất trước ngày bắt đầu.

### 7.13 Quản lý cuộc họp và transcript — meeting-records

Lưu cuộc họp, participants, audio/video/transcript, biên bản và lịch sử chỉnh
sửa trong đúng phạm vi quyền.

- **Phục vụ job:** Chủ trì có nguồn dữ liệu duy nhất để xác nhận kết quả họp.
- **Phạm vi v1:** meeting record, participants, upload/recording và transcript.
- **Chưa làm:** thu âm ngầm hoặc không có consent.
- **Luồng chính:** tạo meeting → ghi/tải file → xử lý transcript → review → lưu.
- **Rủi ro chính:** recording chứa dữ liệu nhạy cảm vượt retention cần thiết.
- **Đo thành công:** tỷ lệ cuộc họp cần biên bản có transcript khả dụng.

### 7.14 Tạo và xác nhận biên bản bằng AI — ai-meeting-minutes

AI trích quyết định, vấn đề mở, rủi ro, người và hạn từ transcript; chủ trì phải
xác nhận trước khi trở thành bản ghi nghiệp vụ.

- **Phục vụ job:** Chủ trì giảm thời gian tổng hợp nhưng không mất quyền kiểm soát.
- **Phạm vi v1:** summary, decisions, actions, unknown-person warnings và review.
- **Chưa làm:** tự công bố biên bản khi chưa xác nhận.
- **Luồng chính:** transcript → AI đề xuất → đối chiếu danh bạ → chủ trì sửa/xác
  nhận → publish.
- **Rủi ro chính:** gán sai người hoặc bỏ mất quyết định.
- **Đo thành công:** thời gian review biên bản và tỷ lệ đề xuất được giữ lại.

### 7.15 Chuyển biên bản thành công việc — meeting-to-tasks

Chuyển action item đã được chủ trì xác nhận thành task có mô tả, owner, hạn và
priority trong workspace phù hợp.

- **Phục vụ job:** Chủ trì/assignee biến quyết định thành trách nhiệm thực thi.
- **Phạm vi v1:** review action, resolve assignee, create task và source link.
- **Chưa làm:** tự giao việc khi người/đơn vị chưa được xác định.
- **Luồng chính:** chọn action → xác nhận owner/hạn → tạo task → thông báo → theo dõi.
- **Rủi ro chính:** duplicate task hoặc task mất liên kết biên bản.
- **Đo thành công:** tỷ lệ action đã xác nhận được giao đúng owner.

### 7.16 Quản lý Kanban và bàn giao công việc — kanban-workspaces

Quản lý workspace/board/column/task, bình luận, attachment, tiến độ, bàn giao và
approval theo nhóm/phòng ban/dự án.

- **Phục vụ job:** Nhân viên/quản lý theo dõi việc, hạn và kết quả bàn giao.
- **Phạm vi v1:** board, task, assignee, due date, status, comment và history.
- **Chưa làm:** thay thế toàn bộ project portfolio management.
- **Luồng chính:** tạo/giao task → thực hiện → cập nhật → bàn giao/duyệt → đóng.
- **Rủi ro chính:** status cập nhật nhưng outcome/evidence thiếu.
- **Đo thành công:** tỷ lệ task hoàn tất đúng hạn và đủ kết quả.

### 7.17 Tiếp nhận và xử lý tài liệu — document-intake

Tiếp nhận file dùng chung cho HR/recruitment/onboarding/meeting/task, kiểm tra
quyền, loại/kích thước và tạo processing job có trạng thái.

- **Phục vụ job:** Người dùng đưa tài liệu vào một cách an toàn và biết tiến độ.
- **Phạm vi v1:** upload, classification, storage, queue/status và retry.
- **Chưa làm:** chấp nhận mọi định dạng/kích thước không giới hạn.
- **Luồng chính:** upload → validate → classify → enqueue → xử lý/thông báo.
- **Rủi ro chính:** file độc hại, sai quyền hoặc job bị treo.
- **Đo thành công:** tỷ lệ file hợp lệ được xử lý trong SLA.

### 7.18 Trích xuất và xác nhận dữ liệu tài liệu — document-review

OCR/trích xuất text và field có cấu trúc, giữ confidence/source location để con
người sửa và xác nhận trước khi đẩy sang module nghiệp vụ.

- **Phục vụ job:** HR/reviewer giảm nhập liệu mà vẫn kiểm chứng được.
- **Phạm vi v1:** OCR tiếng Việt, extraction, confidence, diff/review và publish.
- **Chưa làm:** ghi đè hồ sơ nghiệp vụ trực tiếp khi chưa review.
- **Luồng chính:** nhận output → hiển thị evidence → sửa/xác nhận → publish → audit.
- **Rủi ro chính:** OCR sai nhưng được coi là fact.
- **Đo thành công:** tỷ lệ field được xác nhận và mức chỉnh sửa trung bình.

### 7.19 Quản lý ngân hàng câu hỏi — question-bank

Tổ chức câu hỏi theo kỹ năng, topic, level, loại và nguồn; hỗ trợ review, version
và tái sử dụng trong bài đánh giá.

- **Phục vụ job:** HR/interviewer có kho câu hỏi chất lượng, truy nguyên được.
- **Phạm vi v1:** CRUD, taxonomy, search/filter, review/status và source reference.
- **Chưa làm:** marketplace chia sẻ câu hỏi giữa tổ chức.
- **Luồng chính:** tạo/nhập → phân loại → review → approve → dùng trong assessment.
- **Rủi ro chính:** câu hỏi trùng, lỗi hoặc lộ đáp án.
- **Đo thành công:** tỷ lệ câu hỏi approved được tái sử dụng hợp lệ.

### 7.20 Sinh câu hỏi từ tài liệu bằng AI — ai-question-generation

Sinh câu hỏi từ document/topic/level đã chọn, giữ source reference và buộc review
trước khi vào ngân hàng câu hỏi.

- **Phục vụ job:** HR/interviewer tạo bộ câu hỏi bám tài liệu nhanh hơn.
- **Phạm vi v1:** topic review, generation job, draft question, approve/reject.
- **Chưa làm:** tự động phát hành câu hỏi chưa kiểm duyệt.
- **Luồng chính:** chọn source/topic → cấu hình → sinh → review/sửa → approve.
- **Rủi ro chính:** hallucination hoặc câu hỏi không khớp evidence.
- **Đo thành công:** tỷ lệ câu AI được approve sau review.

### 7.21 Tạo và phát hành bài đánh giá — assessment-authoring

Tạo bài từ câu hỏi/template/JD/kỹ năng, cấu hình thời gian, scoring, hướng dẫn và
phát hành link phù hợp đối tượng.

- **Phục vụ job:** HR/interviewer tạo assessment nhất quán và đúng mục tiêu.
- **Phạm vi v1:** test config, question composition, preview, token/link và publish.
- **Chưa làm:** adaptive testing phức tạp nếu chưa có bằng chứng nhu cầu.
- **Luồng chính:** chọn mục tiêu → cấu hình → chọn/sinh câu → review → publish.
- **Rủi ro chính:** bài test không đo đúng job/level.
- **Đo thành công:** tỷ lệ bài được hoàn tất mà không phải hủy do cấu hình sai.

### 7.22 Thực hiện bài đánh giá — candidate-assessment

Cho ứng viên/nhân viên làm bài theo token/quyền, timer, progress và submission
contract rõ ràng, không lộ dữ liệu nội bộ hoặc đáp án.

- **Phục vụ job:** Người làm bài hoàn tất công bằng và biết trạng thái nộp.
- **Phạm vi v1:** access, instruction, timer, autosave có server acknowledgement,
  recovery, submit idempotent và receipt.
- **Chưa làm:** giám sát xâm phạm quyền riêng tư.
- **Luồng chính:** mở link → xác minh quyền → làm bài → review → submit/result.
- **Rủi ro chính:** mất bài, submit trùng hoặc token bị chia sẻ.
- **Đo thành công:** tỷ lệ người bắt đầu hoàn tất bài hợp lệ.

Submission phải dùng thời gian server, autosave có xác nhận, khôi phục bản đã
xác nhận gần nhất, snapshot bất biến và submit idempotent. Quyền xem kết quả,
attempt, expiry, reopen/regrade và override phải được author công bố, có lý do và
audit; recovery, expiry và duplicate-submit là release gate của pilot.

### 7.23 Chấm điểm và phân tích năng lực — assessment-grading

Kết hợp auto/manual grading, score breakdown, skill evidence và AI insight để
người đánh giá review, override và tạo follow-up.

- **Phục vụ job:** HR/interviewer hiểu năng lực thay vì chỉ xem tổng điểm.
- **Phạm vi v1:** objective/manual grade, recompute, analysis, note, PDF/CSV khi
  được phép.
- **Chưa làm:** AI tự quyết định tuyển dụng hoặc thăng chức.
- **Luồng chính:** nhận submission → chấm → AI phân tích → reviewer xác nhận →
  phát hành kết quả được phép.
- **Rủi ro chính:** score aggregate không đồng bộ với manual override.
- **Đo thành công:** thời gian từ submission đến kết quả đã review.

### 7.24 Ghi âm và tóm tắt phiên phỏng vấn — interview-recording

Ghi/tải audio phiên phỏng vấn khi có consent, tạo transcript/summary và liên kết
evidence với session/application.

- **Phục vụ job:** Interviewer giảm ghi chép và HR truy nguyên kết quả.
- **Phạm vi v1:** consent, recording/upload, processing, summary review và export.
- **Chưa làm:** recording mặc định không thông báo.
- **Luồng chính:** xác nhận consent → ghi/tải → xử lý → review → lưu/xuất.
- **Rủi ro chính:** retention/quyền truy cập recording không rõ.
- **Đo thành công:** tỷ lệ recording được xử lý và review trong SLA.

### 7.25 Tạo báo cáo và cảnh báo quản trị — management-reporting

Tổng hợp HR, recruitment, assessment và work outcomes theo phạm vi quyền; AI hỗ
trợ executive summary và chỉ ra evidence/rủi ro cần kiểm tra.

- **Phục vụ job:** Quản lý/lãnh đạo nhận biết chậm trễ và ra quyết định có căn cứ.
- **Phạm vi v1:** KPI nghiệp vụ, filter scope, trend, overdue/risk và export hợp lệ.
- **Chưa làm:** AI kết luận vi phạm hoặc chấm phẩm chất.
- **Luồng chính:** chọn phạm vi/kỳ → xem KPI → drill evidence → xác nhận action.
- **Rủi ro chính:** aggregate làm lộ dữ liệu ngoài phạm vi hoặc dẫn đến suy diễn.
- **Đo thành công:** tỷ lệ cảnh báo dẫn tới action được xác nhận.

### 7.26 Gửi thông báo theo ngữ cảnh — contextual-notifications

Gửi in-app/email khi được giao việc, thay đổi hạn, có lịch, bài test, offer hoặc
phê duyệt; theo dõi delivery và lỗi.

- **Phục vụ job:** Mọi persona biết đúng việc cần làm và thời hạn.
- **Phạm vi v1:** template, recipient context, send/log, preference tối thiểu.
- **Chưa làm:** marketing automation hoặc spam broadcast.
- **Luồng chính:** event nghiệp vụ → xác định recipient/template → gửi → log → retry.
- **Rủi ro chính:** gửi sai người hoặc lộ dữ liệu trong email.
- **Đo thành công:** tỷ lệ thông báo nghiệp vụ được giao thành công.

### 7.27 Kết nối lịch, webhook và công cụ ngoài — external-integrations

Cho phép trao đổi lịch, biểu mẫu, webhook, file hoặc task với hệ thống ngoài theo
cấu hình và audit rõ.

- **Phục vụ job:** HR/admin giảm thao tác lặp giữa công cụ.
- **Phạm vi v1:** calendar và integration contract được owner chọn trước.
- **Chưa làm:** connector marketplace không giới hạn.
- **Luồng chính:** cấu hình/kết nối → authorize → sync/event → reconcile → xử lý lỗi.
- **Rủi ro chính:** duplicate, stale data hoặc quyền provider quá rộng.
- **Đo thành công:** tỷ lệ sync thành công không cần sửa thủ công.

### 7.28 Quản lý cấu hình nền tảng — platform-configuration

Quản lý setting AI, assessment, email, version và feature behavior ở phạm vi phù
hợp, có validation và audit.

- **Phục vụ job:** Admin điều chỉnh vận hành mà không sửa source tùy tiện.
- **Phạm vi v1:** categorized settings, safe defaults, test connection và history
  cho thay đổi nhạy cảm.
- **Chưa làm:** cho phép cấu hình vượt security/business invariants.
- **Luồng chính:** mở setting → chỉnh/validate → lưu → áp dụng → audit/rollback.
- **Rủi ro chính:** setting sai ảnh hưởng toàn tổ chức hoặc lộ credential.
- **Đo thành công:** tỷ lệ thay đổi cấu hình thành công không gây incident.

### 7.29 Theo dõi vận hành nhân viên minh bạch — workforce-monitoring

Theo dõi progress, overdue, workload và sự kiện quy trình đã được công bố, đồng
thời cho nhân viên xem dữ liệu liên quan đến mình khi policy cho phép.

- **Phục vụ job:** Quản lý phát hiện gián đoạn; nhân viên hiểu dữ liệu đang được
  dùng.
- **Phạm vi v1:** chỉ dữ liệu công việc/quy trình trong hệ thống và policy rõ.
- **Chưa làm:** keylogging, screen capture, suy luận phẩm chất hoặc kỷ luật tự động.
- **Luồng chính:** công bố policy → thu event hợp lệ → tổng hợp → cảnh báo → review.
- **Rủi ro chính:** biến cảnh báo vận hành thành giám sát xâm phạm quyền riêng tư.
- **Đo thành công:** cảnh báo có action hữu ích mà không phát sinh privacy complaint;
  target là OQ-2.

### 7.30 Quản lý thư viện và phiên bản tài liệu — document-library

Tổ chức tài liệu nguồn dùng để tạo kiến thức và câu hỏi, giữ phiên bản, trạng
thái xử lý và quan hệ giữa bản gốc, text trích xuất, topic và nội dung phát sinh.

- **Phục vụ job:** Content editor duy trì nguồn kiến thức cập nhật, truy nguyên được.
- **Phạm vi v1:** upload, metadata, version, trạng thái, tìm kiếm và chọn nguồn.
- **Chưa làm:** tự đồng bộ mọi thay đổi ngoài hệ thống hoặc tự ghi đè bản đã duyệt.
- **Luồng chính:** thêm nguồn → xử lý → review → phát hành phiên bản → tái sử dụng.
- **Rủi ro chính:** bản cũ tiếp tục sinh câu hỏi sau khi tài liệu thay đổi.
- **Đo thành công:** tỷ lệ nội dung sinh ra trỏ đúng phiên bản nguồn đã duyệt.
- **Nguồn:** Hitek BE feedback; ITBA document-library/pipeline plans; reverse SRS KB.

### 7.31 Quản lý mẫu bài đánh giá — assessment-templates

Lưu cấu hình bài đánh giá có thể tái sử dụng theo mục tiêu, đối tượng, vị trí,
trình độ, thời lượng và quy tắc chấm để giảm lỗi cấu hình lặp lại.

- **Phục vụ job:** Admin/HR tạo bài nhất quán mà không cấu hình lại từ đầu.
- **Phạm vi v1:** tạo, sửa, phân loại, dùng mẫu và phân biệt mẫu chung/cá nhân.
- **Chưa làm:** marketplace mẫu giữa nhiều tổ chức.
- **Luồng chính:** tạo mẫu → review → publish → chọn khi tạo bài → điều chỉnh bản dùng.
- **Rủi ro chính:** mẫu lỗi hoặc lỗi thời được dùng hàng loạt.
- **Đo thành công:** tỷ lệ bài tạo từ mẫu không phải huỷ do sai cấu hình.
- **Nguồn:** Hitek TestHub/BE feedback; ITBA admin plans; source templates routes.

### 7.32 Quản lý khung kỹ năng và kỳ vọng vị trí — talent-framework

Chuẩn hoá kỹ năng, category, cấp độ và mức kỳ vọng theo vị trí để recruitment,
assessment và phát triển nhân viên dùng cùng một ngôn ngữ năng lực.

- **Phục vụ job:** HR/quản lý xác định một vai trò cần năng lực gì ở mức nào.
- **Phạm vi v1:** taxonomy kỹ năng, level, yêu cầu vị trí và cờ bắt buộc.
- **Chưa làm:** tự áp khung kỹ năng lên quyết định lương/thăng chức.
- **Luồng chính:** tạo kỹ năng → định nghĩa level → gắn vị trí → review → công bố.
- **Rủi ro chính:** taxonomy trùng hoặc kỳ vọng không có business owner.
- **Đo thành công:** tỷ lệ vị trí trọng yếu có khung kỹ năng được phê duyệt.
- **Nguồn:** Hitek BE feedback; ITBA talent/CRM plans; reverse SRS Talent.

### 7.33 Đánh giá năng lực nhân viên — employee-evaluation

Cho nhân viên thực hiện bài đánh giá nội bộ và cho reviewer xác nhận evidence,
level đề xuất, điểm mạnh và nhu cầu phát triển theo khung kỹ năng đã duyệt.

- **Phục vụ job:** Nhân viên/quản lý có căn cứ nhất quán cho phát triển năng lực.
- **Phạm vi v1:** giao bài, hoàn thành, chấm, review level và ghi nhận kết quả.
- **Chưa làm:** tự quyết định KPI, lương, kỷ luật hoặc thăng chức.
- **Luồng chính:** chọn nhóm/vị trí → giao bài → làm bài → chấm → reviewer xác nhận.
- **Rủi ro chính:** dùng điểm bài test như kết luận toàn diện về con người.
- **Đo thành công:** tỷ lệ kỳ đánh giá hoàn tất với reviewer/evidence đầy đủ.
- **Nguồn:** Hitek BE feedback/backlog; ITBA talent platform; reverse SRS AS/Talent.

### 7.34 Phân tích độ phủ và khoảng trống kỹ năng — skill-gap-analysis

So sánh năng lực đã được xác nhận của cá nhân/nhóm với kỳ vọng vị trí, hiển thị
độ phủ, kỹ năng thiếu và evidence để quản lý ưu tiên đào tạo hoặc điều phối.

- **Phục vụ job:** HR/quản lý nhận biết gap có thể hành động, không đánh giá cảm tính.
- **Phạm vi v1:** score breakdown, missing skills, group coverage và drill evidence.
- **Chưa làm:** ranking công khai hoặc quyết định nhân sự tự động.
- **Luồng chính:** chọn người/nhóm → chọn chuẩn → tính coverage → review → tạo action.
- **Rủi ro chính:** công thức/weight không được business owner phê duyệt.
- **Đo thành công:** tỷ lệ gap được reviewer xác nhận và dẫn tới action phù hợp.
- **Nguồn:** Hitek Phase 2 backlog; ITBA CRM analytics; reverse SRS Talent.

### 7.35 Gửi email nghiệp vụ có mẫu và nhật ký — operational-email

Cho HR/Admin gửi thông điệp tuyển dụng và vận hành từ mẫu đã duyệt, tự điền dữ
liệu đúng ngữ cảnh, kiểm người nhận và giữ trạng thái giao nhận để truy vết.

- **Phục vụ job:** HR giao tiếp nhất quán mà không copy dữ liệu nhạy cảm thủ công.
- **Phạm vi v1:** mẫu, biến, single/bulk send, test-send, log và quyền cấu hình.
- **Chưa làm:** marketing automation hoặc gửi hàng loạt không có eligibility gate.
- **Luồng chính:** chọn ngữ cảnh/mẫu → kiểm nội dung/người nhận → gửi → log → xử lý lỗi.
- **Rủi ro chính:** gửi sai người, sai version hoặc lộ payload.
- **Đo thành công:** tỷ lệ email nghiệp vụ giao thành công; target chờ OQ-10.
- **Nguồn:** ITBA email plans/reports; reverse SRS Platform; source email routes.

### 7.36 Công bố phiên bản và thông báo thay đổi — release-announcements

Quản lý bản ghi phiên bản sản phẩm và thông báo đã được phê duyệt để người dùng
biết thay đổi ảnh hưởng đến mình mà không nhầm với Git release kỹ thuật.

- **Phục vụ job:** Admin công bố thay đổi; người dùng nhận biết nội dung chưa đọc.
- **Phạm vi v1:** draft, pending, approved, archived, lịch công bố và read marker.
- **Chưa làm:** tự động suy release note từ commit hoặc thay release automation.
- **Luồng chính:** soạn → review → duyệt/lên lịch → công bố → người dùng xác nhận đọc.
- **Rủi ro chính:** trạng thái thông báo lệch với phiên bản thực tế đang chạy.
- **Đo thành công:** tỷ lệ người dùng mục tiêu đọc thông báo quan trọng đúng hạn.
- **Nguồn:** ITBA version plans; reverse SRS Platform; source version routes.

### 7.37 Theo dõi mức sử dụng AI — ai-usage-monitoring

Tổng hợp request, token và chi phí ước tính theo thao tác/người dùng/kỳ để Admin
phát hiện bất thường và quản lý ngân sách mà không biến log thành dữ liệu HR.

- **Phục vụ job:** Admin kiểm soát chi phí và rủi ro vận hành của AI provider.
- **Phạm vi v1:** usage log, xu hướng, breakdown, pricing setting và cảnh báo thủ công.
- **Chưa làm:** tự khóa người dùng hoặc đánh giá hiệu suất nhân viên từ mức dùng AI.
- **Luồng chính:** ghi usage → tổng hợp → xem breakdown → điều tra → điều chỉnh policy.
- **Rủi ro chính:** số liệu thiếu/redact sai hoặc bị dùng ngoài mục đích vận hành.
- **Đo thành công:** tỷ lệ request AI có usage record hợp lệ và reconcile được.
- **Nguồn:** ITBA admin/token plans; reverse SRS Platform; source AI usage routes.

### 7.38 Giám sát sự kiện vi phạm bằng Computer Vision — cv-event-monitoring

Một service Computer Vision chạy tách biệt (Python backend riêng) nhận luồng
camera tại các khu vực đã công bố, phát hiện sự kiện như hút thuốc hoặc rời vị
trí quá lâu, rồi chỉ gửi sự kiện đã xử lý kèm bằng chứng về HRMS. Website chính
không xử lý video realtime; nó tiếp nhận sự kiện, hiển thị trên dashboard và
điều phối việc kiểm tra của manager.

- **Phục vụ job:** `JTBD-MGR-01` (quản lý thấy sự kiện cần kiểm tra trong phạm
  vi quyền) và `JTBD-ADM-01` (admin cấu hình camera, model và ngưỡng có kiểm
  chứng).
- **Phạm vi v1:** tiếp nhận sự kiện từ CV service qua API/webhook có retry, lưu
  sự kiện và bằng chứng, dashboard theo phòng/camera/loại/trạng thái, thông báo
  manager và xác nhận/từ chối có lý do.
- **Chưa làm:** xử lý stream realtime trong HRMS, nhận diện danh tính qua camera,
  PPE/xâm nhập khu vực (phase 2 của service), tự kết luận vi phạm hay kỷ luật.
- **Luồng chính:** CV backend phát hiện sự kiện → gửi event và evidence → HRMS
  lưu và cảnh báo → manager review/xác nhận → dashboard/báo cáo → tạo task xử
  lý khi cần.
- **Rủi ro chính:** cảnh báo AI bị dùng như kết luận vi phạm chính thức khi chưa
  có người xác nhận, hoặc bằng chứng hình ảnh được giữ quá retention đã công bố.
- **Đo thành công:** tỷ lệ sự kiện được manager xác nhận/từ chối trong SLA và
  tỷ lệ false positive theo camera; target chờ OQ-12.
- **Nguồn:** đặc tả đề xuất module Computer Vision (hệ thống ngoài source
  ITBAAI); ràng buộc privacy kế thừa PRODUCT.md.

### 7.39 Bóc tách văn bản từ ảnh có con người xác nhận — vision-ocr

Module Vision OCR chạy tách biệt (`modules/vision-ocr`, backend FastAPI +
frontend React riêng) nhận tối đa 5 ảnh (PNG/JPG/WEBP, ≤10 MB mỗi ảnh), bóc
tách văn bản bằng mô hình thị giác (Gemini Vision, fallback Tesseract nội bộ
khi provider lỗi), rồi đưa qua workspace cho HR đối chiếu ảnh gốc, sửa và xác
nhận. Module giữ riêng ba bản text (gốc OCR, đã sửa, đã xác nhận); dữ liệu chỉ
tồn tại trong phiên, chưa lưu trữ hay đẩy sang module nghiệp vụ.

- **Phục vụ job:** `JTBD-HR-01` — HR có nhanh văn bản đã kiểm chứng từ ảnh
  giấy tờ (CCCD, biểu mẫu, chứng chỉ) mà không nhập tay; là lát cắt engine và
  review chạy độc lập trước khi tích hợp `document-intake`/`document-review`.
- **Phạm vi v1:** upload tối đa 5 ảnh, hàng đợi xử lý tuần tự, OCR chữ in/viết
  tay/bảng giữ ngôn ngữ gốc, review–sửa–xác nhận từng tài liệu, retry/reopen,
  dùng kết quả trong phiên.
- **Chưa làm:** lưu trữ/lịch sử, đăng nhập và phạm vi quyền, trích xuất field
  có cấu trúc, confidence/vùng nguồn, đẩy kết quả sang hồ sơ nghiệp vụ — các
  phần này thuộc `document-intake`/`document-review` khi tích hợp.
- **Luồng chính:** tải ảnh → hàng đợi tuần tự → đối chiếu ảnh gốc với text OCR
  → sửa → xác nhận → dùng kết quả trong phiên.
- **Rủi ro chính:** ảnh giấy tờ chứa dữ liệu nhạy cảm được gửi tới AI provider
  bên ngoài khi chưa có chính sách che/lọc.
- **Đo thành công:** tỷ lệ tài liệu được xác nhận sau review và mức sửa trung
  bình; target chờ OQ-2.
- **Nguồn:** module `modules/vision-ocr` trong repo (standalone, đã có test);
  ràng buộc Document AI và privacy kế thừa PRODUCT.md Mục 9.

## 8. Success metrics

**North Star v1:** tỷ lệ application đủ điều kiện đi từ CV đã được HR xác nhận
đến quyết định tuyển dụng đã được con người review trong SLA đã công bố.

| ID | Chỉ số và công thức | Nguồn/cửa sổ | Owner | Baseline → target |
| --- | --- | --- | --- | --- |
| `M-NS-01` | application có `cv_reviewed_at` và `human_decision_reviewed_at` trong SLA / toàn bộ application đủ điều kiện đóng trong cohort | Audit/domain events; cohort theo tháng và vị trí | Product owner + Head of HR pilot | OQ-1 → OQ-2 |
| `M-IN-01` | application không ở cùng trạng thái quá SLA / application đang mở; loại trừ hold có reason | Pipeline events; rolling 7 ngày | Recruitment owner | OQ-1 → OQ-2 |
| `M-IN-02` | submission hợp lệ có receipt / assessment đã bắt đầu; tách candidate/internal | Assessment events; theo test version | Assessment owner | OQ-1 → OQ-2 |
| `M-IN-03` | CV fields được HR giữ nguyên / fields được extraction đề xuất | Review diff; theo parser/model version | Document AI owner | OQ-1 → OQ-2 |
| `M-GR-01` | Số incident vượt organization/role/data-scope được xác nhận | Security incident log; liên tục | Security owner | OQ-1 → **0** |
| `M-GR-02` | quyết định bị đảo do AI suggestion sai / quyết định có AI suggestion | Decision audit; theo rollout/model version | Product owner | OQ-1 → không tăng sau rollout |
| `M-GR-03` | submission mất answer đã được server ack | Recovery test + incident log; mỗi release | Assessment owner | OQ-1 → **0** |

SLA, target và source event phải được sponsor duyệt ở OQ-1/OQ-2; không dùng UI pageview thay domain event.

## 9. Constraints và dependencies

- Sản phẩm B2B, tiếng Việt là ngôn ngữ ưu tiên; multi-language chỉ khi có scope.
- Mọi module tuân theo organization/role/data-scope và audit boundary.
- Supabase, AI, email và external integration là dependency có dữ liệu/quyền riêng.
- AI output phải parse/review; service credential chỉ ở server boundary.
- Recording, CV, hồ sơ, email và assessment cần consent, access và retention policy.
- `Frontend`/`Backend` là nền triển khai; `modules/` giữ module tách biệt (hiện
  có `vision-ocr`). Feature Map không khẳng định đã hoàn tất.
- CI/release automation chưa được xác minh sau khi app được nhập vào single-repo.

Mỗi dependency cần owner, health check, fallback và rollback; không bypass quyền khi lỗi.
Trước dữ liệu thật, Product/DPO phải duyệt purpose, lawful basis, access,
retention/delete, withdrawal, legal hold và audit; OQ-3/OQ-6 mở thì chỉ dùng dữ liệu synthetic.

## 10. Risks và assumptions

| ID/type | Risk và evidence | Owner | Trigger | Response/gate | Residual |
| --- | --- | --- | --- | --- | --- |
| `R-01` Assumption | Buyer muốn platform liên thông; chỉ có tín hiệu từ scope/source | Product owner | Interview/pilot không xác nhận pain hoặc willingness-to-pay | Không mở rộng roadmap; đóng OQ-7 trước R2 | Cao đến khi validate |
| `R-02` Product | AI suggestion gây review overhead/quyết định sai; capability mới là bằng chứng gián tiếp | AI + Product owner | Acceptance thấp hoặc `M-GR-02` tăng | Evidence, manual path, model/version tracking; dừng rollout | Vừa sau human review |
| `R-03` Security | Rule quyền lệch giữa module; giả định kiến trúc | Security owner | Access test/incident vượt scope | R0 gate, deny by default, incident response | Cao nếu R0 chưa đạt |
| `R-04` Privacy | Consent/retention chưa được duyệt | Product + DPO/legal nominee | OQ-3/OQ-6 còn mở trước pilot | Chỉ synthetic/de-identified data | Cao đến khi policy duyệt |
| `R-05` Data | OCR/source data sai thành fact | Document AI owner | Review diff hoặc invalid fact tăng | Provenance, confidence, mandatory review | Vừa |
| `R-06` Assessment | Mất bài, submit trùng, stale overwrite | Assessment owner | Recovery/idempotency test fail hoặc incident | Contract Mục 7.22; chặn R1 | Thấp sau gate |
| `R-07` Operations | Processing job treo/provider fail | Operations owner | SLA breach/retry exhausted | Idempotent retry, dead-letter/manual fallback, runbook | Vừa |
| `R-08` Communication | Gửi sai người hoặc lộ payload | Operations + Security | Recipient/payload validation fail | Minimal email, scope check, audit; chặn external rollout | Vừa |
| `R-09` Integration | Duplicate/stale sync | Integration owner | Reconciliation mismatch | Idempotency, source-of-truth rule, manual reconciliation | Vừa |
| `R-10` Privacy | Workforce monitoring thành covert surveillance | Product + DPO/legal nominee | Không có notice/employee visibility | Giữ Could; cấm release nếu policy chưa duyệt | Cao |
| `R-11` Knowledge | Tài liệu thay đổi nhưng câu hỏi vẫn trỏ bản cũ | Knowledge owner | Source/version drift hoặc provenance thiếu | Review version; chặn publish nếu source chưa duyệt | Vừa |
| `R-12` Communication | Email lỗi, gửi trùng/sai người hoặc không truy vết được | Operations owner | Delivery/retry/reconciliation fail | Eligibility gate, idempotency, log và manual fallback | Cao |
| `R-13` Talent | Skill/weight không có business authority nhưng được dùng để kết luận | Head of HR | Gap/level bị tranh chấp | Approval, evidence và human override; đóng OQ-11 | Cao |
| `R-14` Cost | AI usage thiếu hoặc tăng bất thường | Admin + Product owner | Usage không reconcile hoặc vượt ngân sách | Cảnh báo, quota/policy review; không dùng usage đánh giá nhân sự | Vừa |
| `R-15` Privacy | Sự kiện CV bị dùng như kết luận vi phạm tự động hoặc bằng chứng hình ảnh giữ quá retention | Product + DPO/legal nominee | Manager bỏ qua review hoặc truy cập evidence vượt phạm vi | Giữ Could; bắt buộc human review, retention/xóa evidence và access audit trước khi bật | Cao |
| `R-16` Privacy | Ảnh giấy tờ chứa PII gửi tới AI provider bên ngoài khi chưa duyệt che/lọc | Product + DPO/legal nominee | Dùng vision-ocr với dữ liệu thật trước khi masking/provider được duyệt | Giữ Should; chỉ dữ liệu không nhạy cảm/synthetic; masking hoặc provider gate trước dữ liệu thật | Cao |

## 11. Open Questions

- [ ] **OQ-1:** Baseline recruitment, onboarding, assessment và task lấy từ đâu?
- [ ] **OQ-2:** North Star, target 3/6/12 tháng và mốc rollout nào được duyệt?
- [ ] **OQ-3:** Thị trường/compliance chính là Việt Nam/PDPA hay còn khu vực khác?
- [ ] **OQ-4:** Pricing B2B theo tổ chức, user hay module?
- [ ] **OQ-5:** GitHub Actions hay GitLab/VPS là deployment authority?
- [ ] **OQ-6:** Retention/consent cho CV, recording, transcript, email và hồ sơ?
- [ ] **OQ-7:** Economic buyer, pain, urgency, adoption và willingness-to-pay đã có bằng chứng nào?
- [ ] **OQ-8:** Đánh giá nhân viên theo kỳ hay nhu cầu; ai xem và dùng kết quả?
- [ ] **OQ-9:** Tài liệu đổi thì tự sync hay owner review trước khi phát hành lại?
- [ ] **OQ-10:** Email cần SLA, retry, idempotency, bounce và fallback nào?
- [ ] **OQ-11:** Ai duyệt taxonomy, level, weight và threshold kỹ năng?
- [ ] **OQ-12:** Ai duyệt chính sách công bố khu vực camera, ngưỡng cảnh báo và
  retention bằng chứng của CV service?
- [ ] **OQ-13:** Ai duyệt chính sách gửi ảnh giấy tờ chứa dữ liệu nhạy cảm tới
  AI provider bên ngoài và mức che/lọc bắt buộc của vision-ocr?

Owner: Product/sponsor (OQ-1/2/4/7/8), DPO/legal (OQ-3/6/12/13), Technical/Operations
(OQ-5/9/10), Head of HR (OQ-11). Các OQ tương ứng chặn roadmap, dữ liệu người
thật, release automation hoặc commercial launch.

## 12. Quyết định cần giữ

- Human-in-the-loop là invariant cho quyết định nhân sự và AI-generated content.
- ITBAAI là nền source đang có, không phải product boundary cuối cùng.
- `workforce-monitoring` là Could, chỉ làm khi policy minh bạch được duyệt.
- `cv-event-monitoring` là Could và chạy như hệ thống ngoài; HRMS chỉ nhận sự
  kiện đã xử lý, mọi cảnh báo phải qua manager xác nhận.
- `vision-ocr` là Should và chạy như module độc lập; tích hợp vào pipeline
  Document AI chỉ sau khi masking/retention cho ảnh giấy tờ được duyệt.
- Không dùng số lượng source hoặc nhãn phase làm bằng chứng hoàn tất.
- V1 có 15 Must recruitment/assessment; domain khác cần sponsor duyệt roadmap.
- Head of HR/HR Director là economic buyer giả định; cần đóng OQ-7.
- North Star đo CV-reviewed → human-reviewed decision trong SLA; target chờ OQ-1/2.
