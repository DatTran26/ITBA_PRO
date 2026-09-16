---
type: srs
feature: interview-recording
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/interview-recording/brainstorms/consent-gated-recording-and-summary.md
  - docs/features/interview-recording/interview-recording-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# interview-recording — Software Requirements Specification

## 1. Scope

SRS này cover ghi âm/tải audio phiên phỏng vấn khi có consent, xử lý tạo
transcript + bản tóm tắt đề xuất bằng AI, review/xác nhận của interviewer,
gắn evidence với session/application, truy cập/xuất theo data-scope có audit,
và áp dụng retention/rút consent theo policy. Feature này là `Should` —
KHÔNG nằm trong cam kết lát cắt v1 (15 feature `Must`); đây là slice mở
rộng chỉ triển khai khi sponsor duyệt và privacy gate cho recording/transcript
được thông qua (PRD Mục 7, OQ-6). KHÔNG cover: lập lịch/phân công phỏng vấn
(`interview-management`), form đánh giá (`interview-evaluation`), ghi mặc
định không thông báo (cấm theo PRD), ghi video/live transcript (P2/roadmap),
và định nghĩa chính sách retention/consent chi tiết — do Product + DPO duyệt
ở OQ-6 PRD.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Interviewer | người | Xin/ghi nhận consent, ghi/tải audio, review và xác nhận summary, trích evidence vào đánh giá | Có |
| HR | người | Truy nguyên recording/transcript/summary trong scope, xuất evidence, ghi nhận rút consent | Có |
| Ứng viên | người (ngoài hệ thống) | Được hỏi consent rõ ràng, đồng ý/từ chối/rút | Có (qua thư mời/trong phiên, không có tài khoản) |
| Quản lý | người | Nghe/xem evidence trong data-scope | Có |
| Admin | người | Cấu hình provider + retention/access policy, điều tra | Có (cấu hình qua `platform-configuration`) |
| `interview-management` | hệ thống (feature khác) | Cung cấp session/participant/trạng thái phiên | Không (nguồn đầu vào) |
| `interview-evaluation` | hệ thống (feature khác) | Tiêu thụ evidence đã review vào đánh giá | Không (consumer) |
| AI provider (transcription/summary) | ngoài | Tạo transcript + summary đề xuất | Không (server-side dependency qua `platform-configuration`/`external-integrations`) |
| `contextual-notifications` | hệ thống (feature khác) | Báo xử lý xong/lỗi | Không (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-interview-recording-001 | Hiển thị trạng thái consent của session | Khi interviewer mở phiên phỏng vấn, hệ thống phải hiển thị trạng thái consent ghi âm của ứng viên (chưa hỏi / đang chờ / đã đồng ý / từ chối / đã rút) | P0 | demo | PRD Mục 7.24 (consent); URD UN-001 |
| FR-interview-recording-002 | Xin và ghi nhận consent | Khi chưa có consent, hệ thống phải cho gửi/đọc nội dung xin phép (mục đích, ai xem, lưu bao lâu) và ghi consent record khi ứng viên quyết định: ai, khi nào, kênh nào (thư mời/trong phiên), phiên bản nội dung consent | P0 | test | PRD Mục 7.24 (consent), Mục 12; URD UN-007 |
| FR-interview-recording-003 | Không consent không ghi | Hệ thống phải khóa mọi đường tạo recording (ghi trong phiên và tải file) khi session chưa có consent hợp lệ; khi ứng viên từ chối phải ghi nhận từ chối và gợi ý ghi chú tay | P0 | test | PRD Mục 7.24 (Chưa làm: recording mặc định không thông báo); URD UN-007 |
| FR-interview-recording-004 | Ghi âm trong phiên | Khi consent hợp lệ và nền ghi sẵn có, hệ thống phải cho interviewer bắt đầu/dừng ghi trong phiên và lưu recording gắn đúng session | P0 | demo | PRD Mục 7.24 (recording); brainstorm Mục 5.1 |
| FR-interview-recording-005 | Tải file audio sau buổi | Hệ thống phải cho tải file audio gắn session đã diễn ra khi consent hợp lệ, kiểm tra định dạng/dung lượng/thời lượng theo giới hạn trước khi nhận | P0 | test | PRD Mục 7.24 (upload); brainstorm Mục 5.2 |
| FR-interview-recording-006 | Xử lý nền có trạng thái | Khi recording hoàn chỉnh, hệ thống phải đưa vào hàng xử lý tạo transcript (tiếng Việt ưu tiên) rồi summary đề xuất qua AI provider server-side, và hiển thị trạng thái (chờ/đang xử lý/sẵn sàng/lỗi) | P0 | test | PRD Mục 7.24 (processing); URD UN-002 |
| FR-interview-recording-007 | Review và xác nhận summary | Hệ thống phải cho interviewer nghe file gốc, đọc transcript, sửa bản tóm tắt đề xuất và xác nhận; chỉ bản "đã-review" mới được dùng làm evidence | P0 | test | PRD Mục 7.24 (summary review), Mục 12; URD UN-003 |
| FR-interview-recording-008 | Gắn evidence với session/application | Recording, transcript và summary phải hiển thị trong trang session và liên kết với application tương ứng | P0 | demo | PRD Mục 7.24 (liên kết evidence); URD UN-005 |
| FR-interview-recording-009 | Trích đoạn vào đánh giá kèm nguồn | Khi viết đánh giá trong `interview-evaluation`, hệ thống phải cho trích đoạn transcript/summary đã review vào note kèm liên kết về đoạn gốc | P1 | demo | PRD Mục 7.24; URD UN-004 |
| FR-interview-recording-010 | Truy cập theo data-scope có audit | Mọi lượt xem/nghe/đọc recording/transcript/summary phải kiểm tra data-scope của người truy cập và ghi audit; ngoài scope phải từ chối rõ | P0 | test | PRD Mục 7.24 (rủi ro quyền truy cập), Mục 9; URD UN-005 |
| FR-interview-recording-011 | Xuất dữ liệu theo policy | Hệ thống phải cho xuất transcript/summary (file gốc chỉ khi policy cho phép) cho vai trò được cấp trong scope; lượt xuất ghi audit | P1 | test | PRD Mục 7.24 (export); URD UN-006 |
| FR-interview-recording-012 | Rút consent | Khi consent bị rút (bởi ứng viên hoặc HR/admin ghi nhận), hệ thống phải chuyển dữ liệu liên quan sang "chờ-xóa": chặn mọi truy cập mới, dừng xử lý đang chạy nếu có thể, xếp lịch xóa theo policy và audit lượt rút | P0 | test | PRD Mục 9 (withdrawal); brainstorm Mục 5.4; URD UN-008 |
| FR-interview-recording-013 | Retention hết hạn | Theo lịch nền, dữ liệu quá thời hạn policy phải chuyển "hết-hạn-lưu-trữ" rồi lưu trữ nguội hoặc xóa theo policy; đoạn đã trích vào evaluation giữ nguyên kèm ghi chú nguồn đã hết hạn | P0 | test | PRD Mục 9 (retention), OQ-6; brainstorm Mục 5.5 |
| FR-interview-recording-014 | Báo lỗi và retry xử lý | Khi xử lý transcript/summary thất bại, hệ thống phải giữ nguyên file gốc, báo người tạo + admin, retry tự động có giới hạn và mở retry thủ công | P0 | test | brainstorm Mục 4 (P0); URD UN-009 |
| FR-interview-recording-015 | Transcript có timestamp và nhãn người nói | Hệ thống nên giữ transcript theo đoạn có timestamp (bấm câu nhảy tới đoạn âm thanh) và cho interviewer xác nhận nhãn người nói | P1 | demo | brainstorm Mục 4 (P1); URD UN-003 |
| FR-interview-recording-016 | Thông báo xử lý xong/lỗi | Khi xử lý hoàn tất hoặc lỗi hết retry, hệ thống nên báo cho interviewer qua `contextual-notifications` | P1 | demo | brainstorm Mục 4 (P1) |
| FR-interview-recording-017 | Đánh dấu đoạn trích khi nguồn bị rút/xóa | Khi recording/transcript chuyển "chờ-xóa"/"đã-xóa", các đoạn đã trích vào evaluation phải được đánh dấu "nguồn đã rút/xóa" để HR xử lý | P1 | test | brainstorm Mục 9 (rủi ro); URD UN-008 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-interview-recording-001 | privacy/consent | Không recording nào tồn tại mà thiếu consent record hợp lệ đi kèm; consent ghi nhận phiên bản nội dung đã đồng ý | P0 | 100% recording có consent record hợp lệ — guardrail bắt buộc |
| NFR-interview-recording-002 | security | Recording/transcript/summary là dữ liệu nhạy cảm: deny-by-default, chỉ interviewer của session, HR/quản lý trong data-scope, admin khi điều tra; mọi truy cập có audit | P0 | 0 incident truy cập vượt data-scope được xác nhận (bám M-GR-01) |
| NFR-interview-recording-003 | human-in-the-loop | Transcript/summary AI chỉ là đề xuất; chỉ bản interviewer xác nhận mới được dùng làm evidence | P0 | 100% đoạn trích vào evaluation đến từ bản "đã-review" |
| NFR-interview-recording-004 | reliability | File gốc không bao giờ mất do lỗi xử lý; retry tự động có giới hạn + retry thủ công | P0 | 0 recording mất file gốc do lỗi xử lý; dead-letter báo admin |
| NFR-interview-recording-005 | performance | Xử lý transcript + summary trong SLA công bố | P1 | ≥80% recording xử lý xong trong SLA đề xuất 30 phút (xem OQ-3); quá SLA hiện "xử lý chậm" + báo admin |
| NFR-interview-recording-006 | data-retention | Recording/transcript/summary có thời hạn lưu trữ theo policy; hết hạn tự chuyển lưu trữ/xóa | P0 | Thời hạn theo policy được duyệt — chờ OQ-6 PRD; kiểm tra job retention trên dữ liệu mẫu |
| NFR-interview-recording-007 | usability | Nội dung consent đọc được bởi ứng viên không chuyên; giao diện tiếng Việt | P0 | Kiểm tra thủ công màn consent trên desktop + mobile (thư mời) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-interview-recording-001 | Consent là điều kiện cứng: không consent hợp lệ = không tạo recording, kể cả đường tải file sau buổi | Khi bắt đầu ghi hoặc nhận file | FR-interview-recording-002, -003, -004, -005 | PRD Mục 7.24, Mục 12 |
| BR-interview-recording-002 | Consent ghi theo session và kèm phiên bản nội dung đã đồng ý; đổi nội dung consent không thay đổi bản ghi cũ | Khi ghi consent record | FR-interview-recording-002 | brainstorm Mục 7.1, 6.5 (OQ-4) |
| BR-interview-recording-003 | Transcript/summary AI chỉ là đề xuất — chỉ bản interviewer xác nhận ("đã-review") được dùng làm evidence và trích vào evaluation | Khi trích/dùng nội dung | FR-interview-recording-007, -009 | PRD Mục 12 (human-in-the-loop) |
| BR-interview-recording-004 | Mọi truy cập/xuất recording/transcript/summary phải qua kiểm tra data-scope và ghi audit — kể cả từ chối | Khi xem/nghe/đọc/xuất | FR-interview-recording-010, -011 | PRD Mục 9, Mục 7.24 (rủi ro chính) |
| BR-interview-recording-005 | Consent bị rút → chặn truy cập mới, dừng xử lý nếu có thể, xếp lịch xóa theo policy; đoạn đã trích được đánh dấu nguồn đã rút | Khi ghi nhận rút consent | FR-interview-recording-012, -017 | PRD Mục 9 (withdrawal); brainstorm Mục 5.4 |
| BR-interview-recording-006 | Hết hạn retention → chuyển lưu trữ nguội/xóa theo policy; bản đã trích trong evaluation giữ nguyên kèm ghi chú nguồn hết hạn | Khi job retention chạy | FR-interview-recording-013 | brainstorm Mục 5.5; OQ-6 PRD |
| BR-interview-recording-007 | File tải lên phải đúng định dạng/dung lượng/thời lượng trong giới hạn; file lỗi không vào hàng xử lý | Khi nhận file upload | FR-interview-recording-005 | brainstorm Mục 7.1/7.2 |
| BR-interview-recording-008 | Xử lý lỗi không được mất file gốc; hết retry phải có đường báo admin | Khi job xử lý thất bại | FR-interview-recording-014 | brainstorm Mục 4 (P0) |
| BR-interview-recording-009 | Ứng viên từ chối consent vẫn được phỏng vấn bình thường — chỉ không có recording | Khi ứng viên từ chối | FR-interview-recording-003 | brainstorm Mục 5.4; URD Journey 2 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-interview-recording-001 | Ghi/tải khi chưa có consent | Bấm ghi hoặc tải file khi consent "chưa hỏi/đang chờ" | major | FR-interview-recording-003 | Hiện "Chưa có đồng ý ghi âm của ứng viên — xin phép trước khi ghi" + nút xin consent | Hoàn tất consent trước |
| E-interview-recording-002 | Ứng viên từ chối consent | Ứng viên chọn từ chối | minor | FR-interview-recording-003 | Hiện "Ứng viên không đồng ý ghi âm — buổi phỏng vấn sẽ không được ghi"; khóa nút ghi/tải | Interviewer ghi chú tay; hỏi lại khi ứng viên đổi ý |
| E-interview-recording-003 | File sai định dạng | Upload file không thuộc danh sách audio | minor | FR-interview-recording-005 | Hiện "Định dạng không hỗ trợ — chỉ nhận mp3, m4a, wav, webm, ogg" | Chọn file đúng định dạng |
| E-interview-recording-004 | File quá lớn/quá dài | Upload >500 MB hoặc recording >4 giờ | minor | FR-interview-recording-005 | Hiện "File vượt quá 500 MB — nén hoặc tải file nhỏ hơn" / tự dừng ghi | Tải file nhỏ hơn; file dở xử lý theo luồng riêng |
| E-interview-recording-005 | Xử lý thất bại | AI provider lỗi/timeout tạo transcript/summary | major | FR-interview-recording-014 | Recording "lỗi-xử-lý" + "Chưa tạo được transcript — file gốc vẫn an toàn, bạn có thể thử lại" | Retry tự động/thủ công; hết retry báo admin; file gốc nguyên vẹn |
| E-interview-recording-006 | Truy cập ngoài scope | Người không thuộc data-scope mở recording | major | FR-interview-recording-010 | Hiện "Bạn không có quyền truy cập ghi âm này" + audit từ chối | Xin cấp quyền; không ngoại lệ |
| E-interview-recording-007 | Truy cập dữ liệu đã rút consent | Mở recording ở "chờ-xóa" | major | FR-interview-recording-012 | Hiện "Ghi âm này đã bị rút đồng ý và đang chờ xóa — không thể truy cập" | Không khôi phục; đoạn trích được đánh dấu |
| E-interview-recording-008 | Upload gián đoạn | Mất mạng giữa upload | minor | FR-interview-recording-005 | Part dở hiện trạng thái, cho tải lại cùng file | Tải lại ghi đè part dở; part dở quá hạn tự dọn |
| E-interview-recording-009 | Xin consent trùng | Gửi yêu cầu khi đã có yêu cầu chờ | minor | FR-interview-recording-002 | Hiện "Đang chờ ứng viên đồng ý ghi âm", không gửi trùng | Chờ phản hồi hoặc hỏi trong phiên |
| E-interview-recording-010 | Hai người sửa cùng summary | Lưu summary trên bản đã đổi | minor | FR-interview-recording-007 | Cảnh báo "bản vừa được cập nhật — tải lại" | Tải lại, sửa trên bản mới |
| E-interview-recording-011 | Xuất không được phép | Xuất file gốc khi policy cấm hoặc ngoài quyền | major | FR-interview-recording-011 | Chặn/ẩn lựa chọn không được phép + thông báo | Chỉ xuất loại được phép; audit |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-interview-recording-01 | Recording được xử lý và review trong SLA | Tỷ lệ recording "đã-review" trong SLA / tổng recording đủ consent (PRD Mục 7.24) | ≥80% trong SLA 30 phút + review trước khi evaluation đóng (đề xuất — xem OQ-3) |
| SC-interview-recording-02 | Mọi recording đều có consent hợp lệ | Số recording thiếu consent record hợp lệ | 0 — guardrail bắt buộc |
| SC-interview-recording-03 | Evidence truy nguyên được | Tỷ lệ phiên có recording/transcript/summary "đã-review" mở được từ evaluation trong scope | 100% phiên có evidence "đã-review" |
| SC-interview-recording-04 | Không sự cố vượt quyền truy cập | Số incident truy cập ngoài data-scope được xác nhận | 0 — guardrail (bám M-GR-01) |
| SC-interview-recording-05 | Rút/xóa theo policy được thực thi | Tỷ lệ recording "chờ-xóa" được xóa đúng hạn policy; 0 truy cập sau rút | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Phiên phỏng vấn__ — tham chiếu từ `interview-management`: định danh,
  application, participant.
- __Consent record__ — quyết định của ứng viên theo session: trạng thái,
  kênh, phiên bản nội dung, ai/khi nào, rút.
- __Recording__ — file âm thanh gắn session: nguồn (ghi trong phiên/tải
  file), trạng thái vòng đời (đang ghi → chờ xử lý → sẵn sàng → đã review /
  lỗi / chờ xóa / hết hạn lưu trữ), người tạo.
- __Transcript + đoạn transcript__ — nội dung bóc băng có timestamp và nhãn
  người nói (interviewer xác nhận).
- __Summary__ — bản tóm tắt đề xuất → đã review: người xác nhận, thời điểm,
  phiên bản.
- __Đoạn trích evidence__ — đoạn đã trích vào evaluation kèm liên kết nguồn
  và cờ "nguồn đã rút/xóa".
- __Lượt truy cập__ — audit xem/nghe/xuất: ai, hành động, khi nào.
- __Job xử lý__ — trạng thái xử lý transcript/summary, số lần retry, lỗi.

Chi tiết quan hệ + thuộc tính ở `srs/interview-recording-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Mở session → kiểm consent → (xin consent nếu chưa) → ghi/tải →
  xử lý → review → xác nhận → gắn session/application.
- __Flow 2:__ Ứng viên từ chối consent → khóa ghi → ghi chú tay; rút sau ghi
  → chờ xóa → chặn truy cập → xóa theo policy.
- __Flow 3:__ HR truy nguyên/xuất evidence trong scope → audit mọi lượt.
- __Flow 4:__ Xử lý lỗi → retry có giới hạn → báo admin; hết hạn retention →
  lưu trữ nguội/xóa.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __session-recording-panel__ — trong trang session: trạng thái consent, nút
  ghi/tải, danh sách recording + trạng thái xử lý.
- __consent-request__ — nội dung xin phép ghi âm để đọc/gửi ứng viên + trạng
  thái chờ.
- __recording-review__ — nghe file gốc, transcript có timestamp, sửa summary
  đề xuất, nút xác nhận.
- __evidence-tab__ — tab evidence của session/application cho HR trong scope.
- __export-dialog__ — chọn loại dữ liệu được phép xuất.
- __processing-status__ — trạng thái xử lý/lỗi + nút retry.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Recording chỉ khi có consent; cấm ghi mặc định không thông báo | PRD Mục 7.24 (consent, "Chưa làm"), Mục 12 — Product + DPO |
| Recording/CV/hồ sơ/transcript cần consent, access và retention policy được duyệt | PRD Mục 9; OQ-6 — Product + DPO |
| AI chỉ tạo đề xuất; nội dung làm evidence do con người xác nhận | PRD Mục 12 (invariant) — Product owner |
| Truy cập theo organization/role/data-scope + audit | PRD Mục 9 — Security owner |
| Credential provider chỉ phía server; dữ liệu qua provider trong chính sách được duyệt | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate đạt | PRD Mục 9 — Product + DPO |
| Feature `Should` — không nằm trong cam kết v1 | PRD Mục 7 (MoSCoW) — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Session phỏng vấn + participant + trạng thái | `interview-management` | Toàn bộ luồng ghi gắn session |
| Form đánh giá + điểm đính evidence trích nguồn | `interview-evaluation` | FR-interview-recording-009 (không chặn ghi/xử lý) |
| Policy retention/consent được duyệt | Product + DPO (OQ-6 PRD) | Pilot dữ liệu thật — chỉ synthetic trước đó |
| Provider transcription/summary + credential server-side | `platform-configuration`/`external-integrations` | FR-interview-recording-006 |
| Kênh thông báo xử lý xong/lỗi | `contextual-notifications` | FR-interview-recording-016 |
| Liên hệ ứng viên để gửi consent trước buổi | `cv-intake` (dữ liệu liên hệ) | Kênh consent qua thư mời |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Consent hỏi được qua hai kênh: thư mời trước buổi và trong phiên; consent ghi theo session | Nếu chỉ một kênh được chấp nhận → flow xin consent đổi (OQ-1, OQ-4 brainstorm) |
| Đường "ghi trong phiên" có sẵn nền kỹ thuật; nếu không thì tải file là đường chuẩn | FR-interview-recording-004 xuống P1 (OQ-2) |
| Ứng viên có email/kênh liên hệ từ hồ sơ để nhận nội dung consent | Consent chỉ hỏi được trong phiên (OQ-1) |
| Ngưỡng đề xuất (định dạng mp3/m4a/wav/webm/ogg, 500 MB, 4 giờ/session, 5 recording/session, retry 3 lần, SLA 30 phút, retention mặc định 90 ngày) được chấp nhận | Giá trị FR/NFR đổi theo quyết định (OQ-2, OQ-3) |
| Panel interview: consent ứng viên là bắt buộc; thành viên nội bộ theo chính sách lao động | Nếu cần consent từng người → flow consent mở rộng (OQ-5 brainstorm) |
| Policy retention/access sẽ được duyệt trước pilot dữ liệu thật | Feature chỉ chạy synthetic — chặn release |

## 12. Open Questions

- [x] OQ-1 (brainstorm OQ-4): kênh consent bắt buộc — thư mời trước buổi,
  trong phiên, hay cả hai? Consent theo session hay theo quy trình? —
  Resolved (đề xuất): hỗ trợ cả hai kênh, consent ghi theo session (mỗi
  buổi hỏi lại) — chờ Product + DPO xác nhận.
- [x] OQ-2 (brainstorm OQ-6): nền "ghi trong phiên" có sẵn hay bắt buộc
  đường tải file? — Resolved (đề xuất): thiết kế cả hai đường; nếu nền họp
  không cho ghi phía server thì tải file sau buổi là đường chuẩn — chờ
  Technical owner xác nhận.
- [x] OQ-3 (brainstorm OQ-3): SLA xử lý transcript + summary và target
  review? — Resolved (đề xuất): 30 phút xử lý, ≥80% recording "đã-review"
  trước khi evaluation đóng — chờ Assessment owner xác nhận.
- [x] OQ-4 (brainstorm OQ-2): giới hạn đề xuất (định dạng, 500 MB, 4 giờ,
  5 recording/session, retry 3 lần)? — Resolved (đề xuất): áp dụng làm
  chuẩn v1 của feature — chờ owner xác nhận.
- [x] OQ-5 (brainstorm OQ-5): panel interview nhiều người bị ghi? —
  Resolved (đề xuất): consent bắt buộc của ứng viên; thành viên nội bộ
  theo chính sách lao động đã công bố — chờ DPO/legal xác nhận.
- [x] OQ-6 (brainstorm OQ-1 / OQ-6 PRD): retention/consent chính thức cho
  recording, transcript, summary? — Resolved (đề xuất): mặc định 90 ngày
  từ "đã-review", lưu trữ nguội trước xóa, legal hold theo policy — chờ
  Product + DPO duyệt ở OQ-6 PRD; pilot chỉ dữ liệu synthetic trước khi
  duyệt.
- [x] OQ-7 (brainstorm OQ-7): ai được xuất file gốc và định dạng nào? —
  Resolved (đề xuất): transcript/summary cho vai trò trong scope; file gốc
  chỉ khi policy cho phép và luôn audit — chờ Product + DPO xác nhận.
