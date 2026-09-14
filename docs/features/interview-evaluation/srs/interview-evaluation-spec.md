---
type: srs
feature: interview-evaluation
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/interview-evaluation/brainstorms/structured-evaluation-and-ai-summary.md
  - docs/features/interview-evaluation/interview-evaluation-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# interview-evaluation — Software Requirements Specification

## 1. Scope

SRS này cover việc ghi nhận và tổng hợp đánh giá phỏng vấn của một phiên:
phiếu đánh giá theo rubric cho từng interviewer (điểm tiêu chí, nhận
xét, evidence, khuyến nghị), draft/submit idempotent, hạn nộp và nhắc,
trả về yêu cầu bổ sung, AI tóm tắt các phiếu đã nộp có giữ bất đồng và
trích nguồn, HR review tóm tắt, và quyết định vòng của con người kích
sự kiện cho pipeline. KHÔNG cover: AI ra quyết định pass/fail (invariant
PRD Mục 12), lập lịch/phân công/phản hồi phiên (`interview-management`),
ghi âm/transcript (`interview-recording`), transition application
(`candidate-pipeline` — feature này chỉ phát sự kiện quyết định đã
review), chia sẻ kết quả cho ứng viên (v1 không chia sẻ), chấm bài đánh
giá (`assessment-grading`) và định nghĩa khung kỹ năng
(`talent-framework`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Interviewer | người | Ghi phiếu theo rubric, lưu nháp, nộp đúng hạn, sửa khi bị trả về | Có |
| HR | người | Theo dõi trạng thái nộp, yêu cầu tóm tắt AI, review, trả về phiếu, ghi quyết định vòng | Có |
| HR lead / vai trò được cấp quyết định | người | Ghi quyết định vòng có căn cứ, đảo quyết định khi cần | Có |
| Quản lý | người | Xem quyết định và căn cứ trong phạm vi quyền | Có |
| Admin | người | Kiểm soát quyền xem phiếu/tóm tắt, truy vết truy cập | Có |
| Job tóm tắt AI (provider qua server) | hệ thống | Sinh tóm tắt từ các phiếu đã nộp khi HR yêu cầu | Có (chỉ qua ranh giới server; không giao diện) |
| Ứng viên | người | (gián tiếp) quyết định công bằng có căn cứ | Không (không có giao diện, không được chia sẻ phiếu trong v1) |
| `interview-management` | hệ thống (feature khác) | Cung cấp phiên, participant và trạng thái "đã diễn ra" | Không (nguồn đầu vào) |
| `interview-recording` | hệ thống (feature khác) | Cung cấp tham chiếu recording/transcript làm evidence | Không (nguồn evidence) |
| `candidate-pipeline` | hệ thống (feature khác) | Nhận sự kiện quyết định vòng để chuyển stage | Không (consumer quyết định) |
| `contextual-notifications` | hệ thống (feature khác) | Nhận sự kiện nhắc nộp/trả về/quyết định để gửi thông báo | Không (consumer sự kiện) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-interview-evaluation-001 | Phiếu theo rubric của phiên | Khi interviewer là participant đã chấp nhận của một phiên "đã diễn ra", hệ thống phải cho mở đúng một phiếu đánh giá theo rubric của phiên gồm: điểm từng tiêu chí (thang 1–5), nhận xét theo tiêu chí, nhận xét tổng bắt buộc và khuyến nghị tổng (đạt / không đạt / cần trao đổi thêm) | P0 | demo | PRD Mục 7.10 (evaluation form, khung thống nhất); URD UN-001 |
| FR-interview-evaluation-002 | Evidence trên phiếu | Hệ thống phải cho đính kèm trên phiếu: ghi chú tự do, link hợp lệ, file (≤10 MB, tối đa 5 file) hoặc tham chiếu recording/transcript đã có | P0 | test | PRD Mục 7.10 (note, evidence); URD UN-005 |
| FR-interview-evaluation-003 | Lưu nháp | Hệ thống phải lưu nháp phiếu tự động và khi người dùng bấm lưu, cho mở lại tiếp tục từ bản nháp mới nhất trên server | P0 | test | brainstorm Mục 4, 6.4; URD UN-002 |
| FR-interview-evaluation-004 | Submit idempotent và khóa | Khi interviewer bấm "Nộp đánh giá", hệ thống phải kiểm tra đủ trường bắt buộc (điểm mọi tiêu chí + nhận xét tổng + khuyến nghị), yêu cầu xác nhận, rồi chuyển phiếu "đã nộp" và khóa chỉnh sửa; submit phải idempotent — gọi lại trả trạng thái hiện tại, không tạo phiếu thứ hai | P0 | test | PRD Mục 7.10 (submit); brainstorm Mục 6.4; URD UN-003 |
| FR-interview-evaluation-005 | Hạn nộp và nhắc | Hệ thống phải gán mỗi phiếu một hạn nộp (mặc định 48 giờ sau giờ kết thúc phiên), nhắc interviewer trước hạn và khi quá hạn; phiếu nộp sau hạn vẫn hợp lệ nhưng mang cờ "nộp trễ" | P0 | test | PRD Mục 7.10 (đo: đúng hạn); brainstorm Mục 7.2; URD UN-004 |
| FR-interview-evaluation-006 | Trạng thái nộp theo phiên | Hệ thống phải hiển thị cho HR trạng thái nộp của phiên (đã nộp x/y theo số participant đã chấp nhận) kèm danh sách phiếu thiếu và phiếu quá hạn | P0 | demo | PRD Mục 7.10 (đo: đánh giá đầy đủ); URD UN-006 |
| FR-interview-evaluation-007 | Trả về yêu cầu bổ sung | Khi phiên chưa có quyết định, hệ thống phải cho HR trả về một phiếu "đã nộp" kèm lý do bắt buộc; phiếu về "bị trả về", interviewer sửa và nộp lại, history giữ cả lần nộp đầu và nộp lại; tối đa 2 lần trả về trên một phiếu | P1 | test | brainstorm Mục 4 P1, 6.3, 7.2; URD UN-010 |
| FR-interview-evaluation-008 | AI tóm tắt theo yêu cầu | Khi HR bấm "Tổng hợp AI" trên phiên có ≥1 phiếu "đã nộp", hệ thống phải sinh một tóm tắt "chờ review" từ các phiếu đã nộp tại thời điểm chạy, gồm: điểm trung bình theo tiêu chí, điểm đồng thuận, điểm bất đồng giữ nguyên kèm trích nguồn từng ý, evidence nổi bật, danh sách phiếu nguồn và phiếu còn thiếu; tóm tắt phải ghi phiên bản, model/version và thời điểm sinh | P0 | test | PRD Mục 7.10 (summary, rủi ro mất bất đồng); URD UN-007 |
| FR-interview-evaluation-009 | Review và chấp nhận tóm tắt | Hệ thống phải hiển thị tóm tắt cạnh các phiếu gốc; khi HR chấp nhận (có thể chỉnh sửa trước), tóm tắt trở thành bản hiệu lực của phiên vẫn trỏ về phiếu nguồn; khi HR "Tạo lại", bản mới ở "chờ review" và bản cũ chuyển "bị thay thế" giữ làm phiên bản | P0 | test | PRD Mục 12 (AI output có review/override); URD UN-008 |
| FR-interview-evaluation-010 | Cảnh báo phiếu nộp sau tóm tắt | Khi một phiếu chuyển "đã nộp" sau thời điểm tóm tắt hiệu lực được tạo, hệ thống phải hiển thị cảnh báo "phiếu {người} nộp sau khi tóm tắt" và gợi ý tạo lại | P1 | demo | brainstorm Mục 6.4; URD Mục 6 |
| FR-interview-evaluation-011 | Quyết định vòng của con người | Khi vai trò được cấp chọn "Ghi quyết định", hệ thống phải nhận kết quả vòng (đạt / không đạt / cần thêm vòng) và nhận xét căn cứ bắt buộc; quyết định phải ghi người quyết định, thời điểm và tóm tắt đã dùng (nếu có); khi quyết định được ghi trong lúc còn phiếu thiếu, căn cứ phải ghi nhận danh sách phiếu thiếu | P0 | test | PRD Mục 7.10 (HR review), Mục 12; URD UN-009 |
| FR-interview-evaluation-012 | Kích sự kiện cho pipeline | Khi quyết định vòng là "đạt" hoặc "không đạt", hệ thống phải phát sự kiện quyết định đã review để `candidate-pipeline` chuyển PASSED/FAILED; khi "cần thêm vòng", application giữ stage hiện tại và hệ thống gợi ý tạo phiên mới | P0 | test | PRD Mục 7.10 (luồng → HR review); sửa GAP-RC-02; URD UN-009 |
| FR-interview-evaluation-013 | Khóa phiếu sau quyết định | Khi phiên đã có quyết định vòng, hệ thống phải khóa vĩnh viễn mọi phiếu của phiên (read-only) và chặn trả về | P0 | test | brainstorm Mục 6.3; URD Journey 3 |
| FR-interview-evaluation-014 | Đảo quyết định | Khi cần thay đổi quyết định đã ghi, hệ thống phải tạo bản ghi quyết định mới trỏ tới quyết định bị đảo kèm lý do bắt buộc; quyết định gốc giữ làm lịch sử và chỉ vai trò được cấp được đảo | P1 | test | brainstorm OQ-5 (đề xuất); URD Mục 8 |
| FR-interview-evaluation-015 | Quyền xem phiếu | Hệ thống phải chỉ cho interviewer xem phiếu của chính mình; HR/HR lead và vai trò được cấp xem trong data-scope; mọi lượt xem phiếu của người khác và truy cập bị từ chối phải ghi audit | P0 | test | PRD Mục 9; brainstorm Mục 8 (nhận xét về con người); URD UN-011 |
| FR-interview-evaluation-016 | So sánh song song phiếu | Hệ thống phải cho HR xem bảng điểm theo tiêu chí × interviewer của cùng một phiên | P1 | demo | brainstorm Mục 4 P1; URD UN-012 |
| FR-interview-evaluation-017 | Cảnh báo phiếu mỏng | Khi tạo tóm tắt, hệ thống phải cảnh báo các phiếu "mỏng" (ít nhận xét hoặc không evidence) để HR cân nhắc trước khi quyết | P1 | demo | brainstorm Mục 4 P1 |
| FR-interview-evaluation-018 | Quản lý rubric | Hệ thống phải cho HR lead/admin soạn bộ tiêu chí (tên, mô tả, thứ tự, thang điểm 1–5, 3–10 tiêu chí) và gán theo vị trí/vòng; v1 có một rubric mặc định của tổ chức; phiếu khóa rubric tại thời điểm mở | P1 | test | brainstorm Mục 4 P1, OQ-2/OQ-4; URD UN-001 |
| FR-interview-evaluation-019 | Audit đầy đủ | Hệ thống phải ghi vết: ai xem phiếu người khác, ai nộp/trả về/nộp lại, ai yêu cầu/chấp nhận/tạo lại tóm tắt, ai ghi/đảo quyết định — kèm thời điểm và lý do khi bắt buộc | P0 | kiểm tra | PRD Mục 9, Mục 12; URD UN-011 |
| FR-interview-evaluation-020 | Đường thủ công khi AI lỗi | Khi job tóm tắt thất bại sau retry, hệ thống phải báo HR và giữ đường review thủ công — phiếu gốc và bảng so sánh luôn xem được không phụ thuộc AI | P0 | test | PRD Mục 10 (R-07); brainstorm Mục 6.4 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-interview-evaluation-001 | decision-safety | AI không bao giờ quyết định pass/fail: tóm tắt luôn ở "chờ review" tới khi HR xử lý, không có thao tác "áp kết quả AI" và chỉ quyết định đã ghi của con người mới kích transition pipeline | P0 | 0 transition pipeline bắt nguồn từ phiếu interviewer đơn lẻ hoặc tóm tắt AI (guardrail; sửa GAP-RC-02) |
| NFR-interview-evaluation-002 | explainability | Mọi tóm tắt phải trỏ được về phiếu nguồn và giữ nguyên ý kiến bất đồng kèm trích nguồn | P0 | 100% tóm tắt có danh sách phiếu nguồn/thiếu + mục bất đồng |
| NFR-interview-evaluation-003 | security | Phiếu, tóm tắt và quyết định chứa nhận xét về con người: deny-by-default ngoài data-scope, interviewer chỉ thấy phiếu của mình, lượt xem có audit | P0 | 0 sự cố xem phiếu vượt phạm vi được xác nhận (bám M-GR-01) |
| NFR-interview-evaluation-004 | reliability | Submit phiếu idempotent và không mất dữ liệu: autosave có server acknowledgement, một interviewer một phiếu "đã nộp" duy nhất trên một phiên | P0 | 0 phiếu trùng và 0 phiếu mất nội dung đã ack trong recovery test |
| NFR-interview-evaluation-005 | auditability | Quyết định vòng truy vết được ai/khi nào/căn cứ/tóm tắt đã dùng; trả về và đảo quyết định có lý do | P0 | Truy vết được 100% quyết định, trả về và đảo trên mẫu kiểm tra |
| NFR-interview-evaluation-006 | performance | Job tóm tắt AI trả kết quả trong thời gian HR chấp nhận chờ và báo tiến độ | P1 | 95% job tóm tắt hoàn tất trong ≤2 phút, retry tối đa 3 lần rồi báo đường thủ công (giá trị đề xuất — xem OQ-9) |
| NFR-interview-evaluation-007 | usability | Toàn bộ giao diện, nhắc hạn và thông báo tiếng Việt; mọi tóm tắt AI hiển thị disclaimer "kiểm tra phiếu gốc trước khi quyết định" | P0 | Kiểm tra form, thông báo và màn tóm tắt hiển thị đúng wording |
| NFR-interview-evaluation-008 | data-retention | Phiếu, tóm tắt và quyết định giữ theo retention hồ sơ tuyển dụng chung | P1 | Thời gian giữ theo quyết định retention — chờ DPO (PRD OQ-6); trước khi duyệt chỉ dữ liệu synthetic |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-interview-evaluation-001 | Phiếu của interviewer không phải quyết định tuyển — chỉ quyết định vòng đã ghi của vai trò được cấp mới kích transition pipeline | Khi phiếu được nộp hoặc quyết định được ghi | FR-interview-evaluation-011, FR-interview-evaluation-012 | PRD Mục 12; sửa reverse spec FR-RC-06/GAP-RC-02 |
| BR-interview-evaluation-002 | Tóm tắt AI chỉ là hỗ trợ: luôn "chờ review", không tự thành bản hiệu lực, không là điều kiện bắt buộc để quyết định | Khi tóm tắt được sinh | FR-interview-evaluation-008, FR-interview-evaluation-009 | PRD Mục 7.10 "Chưa làm", Mục 12 |
| BR-interview-evaluation-003 | Mọi tóm tắt bắt buộc có: điểm TB theo tiêu chí, đồng thuận, bất đồng kèm trích nguồn, evidence nổi bật, danh sách phiếu nguồn/thiếu | Khi job tóm tắt hoàn tất | FR-interview-evaluation-008 | PRD Mục 7.10 (rủi ro chính) |
| BR-interview-evaluation-004 | Phiếu đã nộp khóa với interviewer; chỉ mở lại qua trả về có lý do; khóa vĩnh viễn khi phiên có quyết định | Khi có yêu cầu sửa phiếu "đã nộp" | FR-interview-evaluation-004, FR-interview-evaluation-007, FR-interview-evaluation-013 | brainstorm Mục 6.3 |
| BR-interview-evaluation-005 | Submit bắt buộc: điểm mọi tiêu chí của rubric + nhận xét tổng (10–2.000 ký tự) + khuyến nghị; nhận xét tiêu chí tùy chọn ≤1.000 ký tự | Khi interviewer submit | FR-interview-evaluation-004 | brainstorm Mục 7.1 |
| BR-interview-evaluation-006 | Trả về tối đa 2 lần trên một phiếu; lần thứ 3 yêu cầu HR trao đổi trực tiếp | Khi HR trả về phiếu | FR-interview-evaluation-007 | brainstorm Mục 7.2 |
| BR-interview-evaluation-007 | Quyết định vòng bắt buộc căn cứ (10–2.000 ký tự); quyết khi còn phiếu thiếu phải ghi nhận danh sách thiếu; đảo quyết định là bản ghi mới kèm lý do | Khi ghi hoặc đảo quyết định | FR-interview-evaluation-011, FR-interview-evaluation-014 | brainstorm Mục 7.1, OQ-3/OQ-5 |
| BR-interview-evaluation-008 | Chỉ participant đã chấp nhận của phiên "đã diễn ra" được ghi phiếu; một participant một phiếu trên một phiên | Khi mở/tạo phiếu | FR-interview-evaluation-001 | brainstorm Mục 6.1 (D1) |
| BR-interview-evaluation-009 | Interviewer chỉ xem phiếu của chính mình; không ẩn danh tác giả trong v1 | Khi render danh sách/chi tiết phiếu | FR-interview-evaluation-015 | brainstorm OQ-6 (đề xuất) |
| BR-interview-evaluation-010 | Phiếu khóa rubric tại thời điểm mở; thay đổi rubric chỉ ảnh hưởng phiếu mở sau | Khi rubric của phiên bị sửa | FR-interview-evaluation-018 | brainstorm OQ-4 (đề xuất) |
| BR-interview-evaluation-011 | Hạn nộp 48 giờ sau giờ kết thúc phiên; phiếu nộp sau hạn hợp lệ nhưng mang cờ "nộp trễ" | Khi phiếu được tạo và khi submit sau hạn | FR-interview-evaluation-005 | brainstorm Mục 7.2, OQ-1 (đề xuất) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-interview-evaluation-001 | Submit thiếu trường bắt buộc | "Nộp đánh giá" khi thiếu điểm tiêu chí/nhận xét tổng/khuyến nghị | minor | FR-interview-evaluation-004 | Form hiện lỗi tại field + "Vui lòng chấm đủ {n} tiêu chí, nhập nhận xét tổng và chọn khuyến nghị trước khi nộp" | Bổ sung rồi nộp lại |
| E-interview-evaluation-002 | Không phải participant | Người không được gán hoặc participant chưa chấp nhận cố mở form | major | FR-interview-evaluation-001 | "Bạn không được gán vào phiên phỏng vấn này — không thể ghi đánh giá" | Liên hệ HR; sự kiện ghi audit |
| E-interview-evaluation-003 | Sửa phiếu đã nộp | Interviewer cố sửa phiếu "đã nộp" | minor | FR-interview-evaluation-004 | "Phiếu đánh giá đã được nộp — chỉ có thể sửa khi HR trả về yêu cầu bổ sung" | Chờ HR trả về |
| E-interview-evaluation-004 | Submit trùng | Double-click/retry submit cùng phiếu | minor | FR-interview-evaluation-004 | Trả trạng thái hiện tại "đã nộp", không tạo phiếu mới | Không cần xử lý (idempotent) |
| E-interview-evaluation-005 | Trả về thiếu lý do | HR trả về phiếu khi lý do rỗng | minor | FR-interview-evaluation-007 | "Vui lòng nhập lý do để interviewer biết cần bổ sung gì" | Nhập lý do rồi xác nhận |
| E-interview-evaluation-006 | Trả về quá giới hạn | Trả về lần thứ 3 trên cùng phiếu | minor | FR-interview-evaluation-007 | "Phiếu này đã được trả về 2 lần — trao đổi trực tiếp với interviewer" | Trao đổi ngoài rồi quyết định |
| E-interview-evaluation-007 | Tổng hợp khi chưa có phiếu | Bấm "Tổng hợp AI" khi 0 phiếu "đã nộp" | minor | FR-interview-evaluation-008 | Nút mờ + "Chưa có phiếu đánh giá nào được nộp — tổng hợp AI cần ít nhất một phiếu" | Chờ phiếu đầu tiên |
| E-interview-evaluation-008 | Job tóm tắt lỗi | Provider fail hoặc quá hạn sau 3 lần retry | major | FR-interview-evaluation-020 | Job trạng thái lỗi + "Không tạo được tóm tắt lúc này — xem trực tiếp các phiếu hoặc thử lại" | Thử lại hoặc review thủ công trên phiếu gốc |
| E-interview-evaluation-009 | Quyết định thiếu căn cứ | "Ghi quyết định" khi nhận xét căn cứ rỗng/quá ngắn | minor | FR-interview-evaluation-011 | "Vui lòng nhập nhận xét căn cứ cho quyết định (tối thiểu 10 ký tự)" | Nhập căn cứ rồi ghi |
| E-interview-evaluation-010 | Không có quyền quyết định | Vai trò chưa được cấp cố ghi quyết định | major | FR-interview-evaluation-011 | "Bạn không có quyền ghi quyết định cho phiên này" | Xin cấp quyền; ghi audit |
| E-interview-evaluation-011 | Kích transition thất bại | Application đã đổi stage trước khi quyết định được phát | major | FR-interview-evaluation-012 | Quyết định đã ghi + cảnh báo "application đã đổi trạng thái — kiểm tra pipeline" | HR xử lý thủ công trên `candidate-pipeline`; retry phát sự kiện |
| E-interview-evaluation-012 | Không có quyền xem | Người ngoài scope cố xem phiếu/tóm tắt | major | FR-interview-evaluation-015 | Ẩn dữ liệu + "Bạn không có quyền xem đánh giá của phiên này" | Xin cấp quyền; sự kiện ghi audit |
| E-interview-evaluation-013 | Phiếu nộp sau tóm tắt | Phiếu chuyển "đã nộp" sau khi tóm tắt hiệu lực tạo | minor | FR-interview-evaluation-010 | Cảnh báo "{Người} vừa nộp phiếu sau khi tóm tắt được tạo — tạo lại để cập nhật" | Tạo lại tóm tắt để phủ phiếu mới |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-interview-evaluation-01 | Phiên có đánh giá đầy đủ đúng hạn | Tỷ lệ phiên đủ phiếu "đã nộp" trước hạn / phiên đã diễn ra | Đạt mức sponsor duyệt — baseline/target chờ OQ-2 sản phẩm |
| SC-interview-evaluation-02 | Quyết định vòng của con người có căn cứ | Tỷ lệ quyết định có người quyết định + căn cứ + thời điểm | 100% |
| SC-interview-evaluation-03 | AI không tự quyết định | Số transition pipeline bắt nguồn từ phiếu đơn lẻ/tóm tắt AI chưa qua quyết định HR | 0 (guardrail; sửa GAP-RC-02) |
| SC-interview-evaluation-04 | Tóm tắt giữ bất đồng và nguồn | Tỷ lệ tóm tắt có mục bất đồng trích nguồn + danh sách phiếu nguồn/thiếu | 100% |
| SC-interview-evaluation-05 | Phiếu được nộp đúng hạn | Tỷ lệ phiếu "đã nộp" trong 48 giờ sau phiên | Baseline xác lập trong 1 tháng pilot, target chờ OQ-2 |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Phiếu đánh giá__ — một phiếu của một participant trên một phiên:
  trạng thái, điểm/khuyến nghị tổng, hạn nộp, cờ nộp trễ, rubric khóa
  tại thời điểm mở.
- __Điểm tiêu chí__ — điểm và nhận xét của phiếu trên từng tiêu chí của
  rubric.
- __Evidence phiếu__ — link/file/tham chiếu transcript đính kèm phiếu.
- __Sự kiện phiếu__ — lịch sử nộp/trả về/nộp lại/khóa kèm actor và lý do.
- __Rubric + tiêu chí__ — bộ tiêu chí đánh giá của tổ chức/vị trí/vòng.
- __Tóm tắt AI__ — bản tóm tắt có phiên bản và trạng thái review, nội
  dung giữ bất đồng trích nguồn, model/version.
- __Nguồn tóm tắt__ — junction trỏ tóm tắt về các phiếu nguồn.
- __Quyết định vòng__ — quyết định của con người: kết quả, căn cứ,
  tóm tắt đã dùng, chuỗi đảo.
- __Phiên / Participant / Người dùng__ — tham chiếu từ
  `interview-management` và `org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/interview-evaluation-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Interviewer mở phiên → ghi phiếu theo rubric → lưu nháp →
  nộp → khóa; nhắc khi sắp/quá hạn.
- __Flow 2:__ HR bấm "Tổng hợp AI" → tóm tắt "chờ review" giữ bất đồng
  → HR chấp nhận/sửa/tạo lại.
- __Flow 3:__ HR ghi quyết định vòng có căn cứ → phát sự kiện → pipeline
  chuyển PASSED/FAILED (hoặc giữ stage khi cần thêm vòng).
- __Flow 4:__ HR trả về phiếu có lý do → interviewer sửa → nộp lại →
  history giữ hai lần.
- __Flow 5:__ Đảo quyết định → bản ghi mới trỏ bản gốc + lý do.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __evaluation-form__ — phiếu theo rubric: điểm tiêu chí, nhận xét,
  evidence, khuyến nghị; trạng thái nháp/nộp/nộp trễ.
- __session-evaluation-board__ — trạng thái nộp x/y của phiên, phiếu
  thiếu/quá hạn, bảng so sánh tiêu chí × interviewer.
- __summary-review__ — tóm tắt AI cạnh phiếu gốc, mục bất đồng trích
  nguồn, nút chấp nhận/tạo lại.
- __round-decision__ — ghi quyết định vòng + căn cứ + tóm tắt đã dùng.
- __evaluation-history__ — sự kiện phiếu và chuỗi phiên bản tóm tắt,
  quyết định đảo.
- __rubric-admin__ — soạn/gán bộ tiêu chí theo vị trí/vòng (P1).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Human-in-the-loop: AI chỉ tóm tắt/hỗ trợ, không quyết định pass/fail; mọi output có review | PRD Mục 12 + Mục 7.10 "Chưa làm" — Product owner |
| Nhận xét về con người là dữ liệu nhạy cảm: access theo scope, audit, retention theo policy | PRD Mục 9 — Security owner + DPO (OQ-6 PRD) |
| Rubric/weight là tài sản có business authority — quyền soạn và chốt cấu trúc do Head of HR | PRD Mục 10 (R-13 tinh thần), OQ-11 PRD — Head of HR |
| Transition application chỉ qua state machine của `candidate-pipeline` | PRD Mục 7.8; reverse spec FR-RC-03 — Recruitment owner |
| AI output phải parse/review; credential provider chỉ ở server boundary | PRD Mục 9 — Technical owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Phiên "đã diễn ra" + participant đã chấp nhận + rubric gán theo phiên | `interview-management` | FR-001/008 — không có đầu vào phiếu |
| Recording/transcript làm evidence (khi có) | `interview-recording` | FR-002 phần tham chiếu transcript (không chặn evidence khác) |
| State machine nhận sự kiện quyết định PASSED/FAILED | `candidate-pipeline` | FR-012 — quyết định không đi tiếp được |
| Gửi nhắc nộp/trả về/quyết định | `contextual-notifications` | FR-005 phần nhắc (phiếu vẫn theo dõi được trong app) |
| Role/scope cho vai trò quyết định và xem phiếu | `org-governance` | FR-011/015 |
| Rubric mặc định tổ chức được Head of HR chốt | Head of HR (OQ-2 spec) | FR-018 dùng rubric đề xuất |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Hạn nộp 48 giờ + nộp trễ hợp lệ mang cờ (đề xuất OQ-1) | FR-005 và USC-001 đổi nhịp đo |
| Rubric v1: 3–10 tiêu chí, thang 1–5, một bộ mặc định tổ chức (đề xuất OQ-2) | FR-001/018 phải thiết kế lại form và scoring |
| HR được quyết khi còn phiếu thiếu, miễn ghi nhận thiếu (đề xuất OQ-3) | FR-011 phải chặn quyết định khi thiếu phiếu |
| Phiếu khóa rubric tại thời điểm mở (đề xuất OQ-4) | FR-018 phải migrate phiếu nháp sang rubric mới |
| Đảo quyết định = bản ghi mới + lý do (đề xuất OQ-5) | FR-014 thay bằng sửa trực tiếp — mất vết |
| Interviewer chỉ thấy phiếu mình, không ẩn danh (đề xuất OQ-6) | FR-015/016 phải thêm tầng ẩn danh |
| AI tóm tắt chạy khi HR bấm từ phiếu đã nộp tại thời điểm chạy | FR-008/010 phải xử lý tóm tắt tự động lỗi thời |
| Không chia sẻ kết quả cho ứng viên trong v1 (OQ-7) | Phải thêm surface + policy nội dung được lộ |

## 12. Open Questions

- [x] OQ-1: Hạn nộp phiếu và nộp trễ — Resolved (đề xuất): 48 giờ sau
  giờ kết thúc phiên; nộp trễ hợp lệ mang cờ "nộp trễ" — chờ Recruitment
  owner xác nhận.
- [x] OQ-2: Cấu trúc rubric và quyền soạn — Resolved (đề xuất): 3–10
  tiêu chí, thang 1–5, mặc định tổ chức gán theo vị trí/vòng; HR
  lead/admin soạn — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-3: Quyết định khi còn thiếu phiếu — Resolved (đề xuất): được,
  bắt buộc ghi nhận danh sách phiếu thiếu trong căn cứ — chờ Head of HR
  xác nhận.
- [x] OQ-4: Rubric đổi giữa chừng — Resolved (đề xuất): phiếu khóa
  rubric tại thời điểm mở — chờ Product owner xác nhận.
- [x] OQ-5: Đảo quyết định — Resolved (đề xuất): bản ghi mới trỏ bản
  gốc + lý do bắt buộc; chỉ vai trò được cấp — chờ Head of HR xác nhận.
- [x] OQ-6: Ai xem phiếu người khác — Resolved (đề xuất): interviewer
  chỉ phiếu mình; HR/HR lead trong scope xem đủ có audit; không ẩn danh
  v1 — chờ Head of HR xác nhận.
- [x] OQ-7: Chia sẻ kết quả cho ứng viên — Resolved: không chia sẻ trong
  v1; cần quyết định riêng về nội dung được lộ khi có nhu cầu.
- [x] OQ-8: Retention phiếu/tóm tắt/quyết định — Resolved (đề xuất):
  theo retention hồ sơ tuyển dụng chung; trước DPO duyệt chỉ synthetic
  (PRD OQ-6).
- [x] OQ-9: Ngưỡng hiệu năng job tóm tắt (≤2 phút, retry 3 lần) —
  Resolved (đề xuất): giữ làm mặc định — chờ Product owner xác nhận.
