---
type: srs
feature: ai-meeting-minutes
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/ai-meeting-minutes/brainstorms/human-confirmed-ai-minutes.md
  - docs/features/ai-meeting-minutes/ai-meeting-minutes-urd.md
  - docs/features/meeting-records/srs/meeting-records-spec.md
---

# ai-meeting-minutes — Software Requirements Specification

## 1. Scope

SRS này cover việc sinh, review và xác nhận bản đề xuất biên bản do AI trích
xuất từ transcript của một cuộc họp: job sinh biên bản có trạng thái và retry,
nội dung đề xuất có cấu trúc (tóm tắt, quyết định, vấn đề mở, rủi ro, đầu
việc), trích dẫn đoạn transcript nguồn cho từng mục, đối chiếu danh bạ và cờ
"chưa xác định" cho người, màn review của chủ trì (giữ/sửa/đổi loại/loại
bỏ/thêm tay/resolve người), xác nhận để publish biên bản vào meeting record,
bỏ đề xuất, sinh lại có kiểm soát và cảnh báo lệch nguồn.

Đây là feature `Should` trong theme Meetings & Work — KHÔNG thuộc cam kết
pilot v1; spec này chuẩn bị cho slice mở rộng sau v1 (PRD Mục 6.1, Feature
Map).

KHÔNG cover: tự động công bố biên bản khi chưa xác nhận (cấm — PRD Mục 7.14
"Chưa làm", Mục 12), tạo task từ đầu việc (`meeting-to-tasks`), tạo/xử lý
transcript và biên bản tay (`meeting-records`), ghi âm/consent/retention
media (`meeting-records`), đồng bộ lịch ngoài (`external-integrations`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Chủ trì | người | Sinh bản đề xuất, review từng mục, resolve người, xác nhận publish | Có |
| Người tham gia | người | Xem biên bản đã publish, đối chiếu trích dẫn transcript | Có (chỉ đọc trong phạm vi) |
| Quản lý | người | Xem biên bản publish trong phạm vi quản lý | Có (chỉ đọc) |
| Admin | người | Audit xác nhận, xử lý tranh chấp, xác nhận thay khi chủ trì không khả dụng (ghi rõ) | Có (hạn chế) |
| AI provider (dịch vụ sinh biên bản) | ngoài | Trích xuất biên bản có cấu trúc từ transcript | Có — dependency ngoài |
| `meeting-records` | hệ thống | Nguồn transcript READY, participants, đích publish MINUTES | Có — dependency |
| `account-access` | hệ thống | Danh bạ người dùng để đối chiếu tên | Có — dependency |
| `org-governance` | hệ thống | Phạm vi dữ liệu, audit | Có — dependency |
| `contextual-notifications` | hệ thống | Nhắc review, báo job FAILED | Có — dependency |
| `meeting-to-tasks` | hệ thống | Đọc đầu việc đã xác nhận để tạo task | Không (consumer downstream) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-ai-meeting-minutes-001 | Sinh bản đề xuất từ transcript | Khi chủ trì bấm "Sinh biên bản bằng AI" trên cuộc họp có ≥1 transcript ở trạng thái READY, hệ thống phải tạo job sinh biên bản và hiển thị trạng thái đang xử lý; nếu transcript chưa READY hoặc không có, hệ thống phải vô hiệu hành động và giải thích | P0 | test | PRD Mục 7.14; brainstorm Mục 6.1 (D1) |
| FR-ai-meeting-minutes-002 | Trạng thái và retry job | Hệ thống phải theo dõi job sinh biên bản (QUEUED/PROCESSING/READY/FAILED); khi job lỗi, hệ thống phải tự chạy lại tối đa 3 lần (sau 5 phút, 30 phút, 2 giờ), hết số lần thì chuyển FAILED và thông báo chủ trì kèm chạy lại thủ công | P0 | test | Brainstorm Mục 6.4; bám pattern FR-meeting-records-009 |
| FR-ai-meeting-minutes-003 | Nội dung đề xuất có cấu trúc | Khi job hoàn tất, hệ thống phải tạo bản đề xuất gồm tóm tắt cuộc họp và các mục có loại: quyết định, vấn đề mở, rủi ro, đầu việc (nội dung việc + người đề xuất + hạn đề xuất); mục AI không trích được hạn/người thì để trống, không tự điền | P0 | demo | PRD Mục 7.14 (summary, decisions, actions) |
| FR-ai-meeting-minutes-004 | Trích dẫn nguồn mỗi mục | Hệ thống phải gắn mỗi mục đề xuất (trừ mục chủ trì thêm tay) với ≥1 đoạn transcript nguồn làm trích dẫn để chủ trì đối chiếu | P0 | test | PRD Mục 7.14 rủi ro chính, Mục 12 (provenance) |
| FR-ai-meeting-minutes-005 | Đối chiếu danh bạ người | Khi bản đề xuất có đầu việc mang tên người, hệ thống phải đối chiếu với participant cuộc họp và danh bạ nội bộ: khớp thì gán sẵn (chủ trì đổi được), không khớp thì gắn cờ "chưa xác định" và giữ tên nguyên văn — cấm tự gán người không khớp | P0 | test | PRD Mục 7.14 (unknown-person warnings, rủi ro gán sai người) |
| FR-ai-meeting-minutes-006 | Màn review của chủ trì | Hệ thống phải cho chủ trì review từng mục kèm trích dẫn và thực hiện: giữ nguyên, sửa nội dung, đổi loại mục, loại bỏ mục, thêm mục thủ công; mọi thao tác được lưu và ghi trạng thái review của mục | P0 | test | PRD Mục 7.14 (chủ trì sửa/xác nhận); URD UN-004 |
| FR-ai-meeting-minutes-007 | Resolve người chưa xác định | Khi đầu việc có người "chưa xác định", hệ thống phải cho chủ trì gán participant cuộc họp, gán người trong danh bạ nội bộ, hoặc chủ động giữ tên nguyên văn | P0 | test | PRD Mục 7.14; URD UN-003 |
| FR-ai-meeting-minutes-008 | Xác nhận và publish | Khi chủ trì bấm "Xác nhận biên bản", hệ thống phải ghi nội dung đã duyệt thành biên bản PUBLISHED của cuộc họp (nguồn "AI đề xuất") trên meeting record, ghi người xác nhận và thời điểm; chỉ chủ trì (hoặc admin theo scope xác nhận thay có ghi rõ) được thực hiện | P0 | test | PRD Mục 7.14, Mục 12; entity MINUTES của `meeting-records` |
| FR-ai-meeting-minutes-009 | Publish khi còn người chưa resolve | Nếu đầu việc còn người "chưa xác định" khi xác nhận, hệ thống phải vẫn cho publish, ghi tên nguyên văn và cờ chưa resolve lên đầu việc để `meeting-to-tasks` biết phải xử lý trước khi tạo task | P0 | test | Brainstorm OQ-5; PRD Mục 7.15 "Chưa làm" |
| FR-ai-meeting-minutes-010 | Bỏ bản đề xuất | Khi chủ trì chọn "Bỏ bản đề xuất", hệ thống phải chuyển bản đề xuất sang trạng thái đã hủy (giữ vết) và mở luồng biên bản tay của `meeting-records` | P0 | demo | Brainstorm Mục 5.4; URD UN-006 |
| FR-ai-meeting-minutes-011 | Sinh lại có kiểm soát | Khi chủ trì bấm "Sinh lại", hệ thống phải hỏi xác nhận nếu bản hiện tại đã có sửa tay, rồi tạo job mới; bản đề xuất mới thay thế bản cũ chưa xác nhận (SUPERSEDED) và giữ vết bản cũ; tối đa 3 lần sinh lại mỗi cuộc họp trong 24 giờ | P0 | test | Brainstorm Mục 5.3, 6.1 (D7), 7.2 |
| FR-ai-meeting-minutes-012 | Cảnh báo lệch nguồn | Khi transcript bị sửa sau khi bản đề xuất đã tồn tại (chưa publish), hệ thống phải hiển thị cảnh báo "đề xuất không còn khớp transcript hiện tại" và hỏi xác nhận trước khi publish | P0 | test | Brainstorm Mục 5.3, 6.1 (D6); URD UN-009 |
| FR-ai-meeting-minutes-013 | Audit xác nhận | Hệ thống phải ghi audit cho: tạo job, mọi quyết định review mục, resolve người, xác nhận publish (ai, khi nào, trên bản đề xuất nào), bỏ và thay thế | P0 | kiểm tra | PRD Mục 9, Mục 12; URD UN-008 |
| FR-ai-meeting-minutes-014 | Nhảy trích dẫn tới transcript | Khi xem biên bản đã publish hoặc đang review, hệ thống phải cho nhảy từ trích dẫn của mục tới đúng đoạn transcript nguồn | P1 | demo | Brainstorm Mục 4 (P1); URD UN-007 |
| FR-ai-meeting-minutes-015 | Nhắc review quá hạn | Khi bản đề xuất READY mà sau 48 giờ chưa được review, hệ thống phải gửi nhắc cho chủ trì qua `contextual-notifications` | P1 | kiểm tra | Brainstorm Mục 7.2 |
| FR-ai-meeting-minutes-016 | Diff đề xuất và bản đã sửa | Hệ thống phải giữ được nội dung đề xuất gốc của AI bên cạnh nội dung chủ trì đã sửa để đo tỷ lệ đề xuất được giữ lại | P1 | kiểm tra | PRD Mục 7.14 (đo thành công); brainstorm Mục 4 (P1) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-ai-meeting-minutes-001 | human-in-the-loop | Không biên bản nào được publish mà thiếu bản ghi xác nhận của chủ trì (hoặc admin theo scope ghi rõ xác nhận thay); không có đường tắt auto-publish | P0 | Kiểm toàn bộ MINUTES nguồn "AI đề xuất": 100% có confirmed_by + confirmed_at; 0 sự cố publish không xác nhận |
| NFR-ai-meeting-minutes-002 | provenance | ≥95% mục đề xuất AI có trích dẫn transcript hợp lệ; mục không có trích dẫn phải đánh dấu nguồn "thêm tay" | P0 | Kiểm mẫu bản đề xuất: tỷ lệ trích dẫn hợp lệ đạt ngưỡng |
| NFR-ai-meeting-minutes-003 | permission | Truy cập bản đề xuất/biên bản kế thừa participant + organization/role/data-scope của `meeting-records`, deny-by-default; số incident vượt scope xác nhận là 0 (theo M-GR-01) | P0 | Access test: người ngoài phạm vi không xem được đề xuất/biên bản |
| NFR-ai-meeting-minutes-004 | performance | Job sinh biên bản cho transcript ~60 phút họp hoàn tất trong SLA đề xuất tối đa 10 phút; trạng thái job hiển thị trong ≤5 giây khi mở record | P1 | Đo thời gian QUEUED→READY trên mẫu pilot; SLA chính thức chờ OQ-2 PRD |
| NFR-ai-meeting-minutes-005 | resilience | Khi AI provider lỗi/chưa cấu hình, chủ trì vẫn viết biên bản tay bình thường; không mất dữ liệu đề xuất đã có | P0 | Test tắt provider: luồng biên bản tay hoạt động đầy đủ |
| NFR-ai-meeting-minutes-006 | auditability | Mọi quyết định review mục và xác nhận publish truy vết được (ai, khi nào, trước/sau) | P0 | Truy vết đầy đủ vết của một bản đề xuất mẫu từ sinh đến publish |
| NFR-ai-meeting-minutes-007 | cost | Việc sinh biên bản chỉ chạy theo hành động chủ động của chủ trì; sinh lại giới hạn 3 lần/cuộc họp/24 giờ | P1 | Audit job: 0 job được tạo không do chủ trì kích hoạt |
| NFR-ai-meeting-minutes-008 | language | Giao diện, thông báo và wording tiếng Việt tự nhiên; transcript/biên bản hỗ trợ dấu tiếng Việt | P0 | Kiểm tra wording mẫu trong brainstorm Mục 7.3 |
| NFR-ai-meeting-minutes-009 | data-retention | Bản đề xuất (kể cả DISCARDED/SUPERSEDED) và trích dẫn giữ theo vòng đời biên bản để đối chiếu provenance; transcript theo chính sách `meeting-records` | P1 | Chính sách retention được duyệt — chờ DPO/legal (PRD OQ-6) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-ai-meeting-minutes-001 | Chỉ cuộc họp có ≥1 transcript READY mới sinh được bản đề xuất | Bấm "Sinh biên bản bằng AI" | FR-ai-meeting-minutes-001 | Brainstorm Mục 6.1 (D1) |
| BR-ai-meeting-minutes-002 | Chỉ chủ trì được xác nhận biên bản; admin theo scope xác nhận thay phải ghi rõ "xác nhận thay chủ trì" | Xác nhận biên bản | FR-ai-meeting-minutes-008 | PRD Mục 7.14; mở rộng BR-meeting-records-003 |
| BR-ai-meeting-minutes-003 | AI không được tự công bố biên bản — mọi nội dung AI chỉ là đề xuất cho tới khi chủ trì xác nhận | Bất kỳ đường publish nào | FR-ai-meeting-minutes-008 | PRD Mục 7.14 "Chưa làm", Mục 12 |
| BR-ai-meeting-minutes-004 | Tên người không khớp danh bạ thì cờ "chưa xác định" — cấm tự gán người gần giống | Đối chiếu danh bạ | FR-ai-meeting-minutes-005 | PRD Mục 7.14 rủi ro gán sai người |
| BR-ai-meeting-minutes-005 | Bản đề xuất sau khi publish là bất biến; sửa biên bản sau đó đi qua revision của `meeting-records` | Yêu cầu sửa đề xuất đã confirm | FR-ai-meeting-minutes-008 | BR-meeting-records-006 |
| BR-ai-meeting-minutes-006 | Mỗi cuộc họp chỉ có 1 bản đề xuất đang mở; sinh lại thay thế bản chưa xác nhận, bản đã confirm/publish không bị thay thế | Sinh lại | FR-ai-meeting-minutes-011 | Brainstorm Mục 7.2 |
| BR-ai-meeting-minutes-007 | Mục đề xuất AI phải kèm ≥1 trích dẫn đoạn transcript; mục không trích được đánh dấu riêng | Tạo bản đề xuất | FR-ai-meeting-minutes-004 | PRD Mục 12 (provenance) |
| BR-ai-meeting-minutes-008 | Đầu việc có người "chưa xác định" vẫn publish được nhưng giữ cờ chưa resolve; `meeting-to-tasks` chặn tạo task từ đầu việc đó | Xác nhận biên bản | FR-ai-meeting-minutes-009 | Brainstorm OQ-5; PRD Mục 7.15 |
| BR-ai-meeting-minutes-009 | AI không trích được hạn/người thì để trống — cấm tự điền giá trị | Tạo mục đầu việc | FR-ai-meeting-minutes-003 | Brainstorm Mục 7.1 |
| BR-ai-meeting-minutes-010 | Mục thêm tay của chủ trì đánh dấu nguồn "thêm tay", không bắt buộc trích dẫn | Thêm mục trong review | FR-ai-meeting-minutes-006 | Brainstorm Mục 7.1 |
| BR-ai-meeting-minutes-011 | Bản đề xuất lệch nguồn (transcript đổi) phải cảnh báo và hỏi xác nhận trước khi publish | Xác nhận khi cờ lệch nguồn bật | FR-ai-meeting-minutes-012 | Brainstorm Mục 6.1 (D6); OQ-3 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-ai-meeting-minutes-001 | Transcript chưa sẵn sàng | Bấm sinh khi transcript đang PROCESSING/FAILED | minor | FR-001 | Nút vô hiệu + "Chưa thể tạo biên bản bằng AI — transcript của cuộc họp chưa sẵn sàng" | Đợi transcript READY hoặc viết tay |
| E-ai-meeting-minutes-002 | Không có transcript | Cuộc họp không có media/transcript | minor | FR-001 | "Cuộc họp này chưa có transcript — hãy tải file ghi hoặc viết biên bản thủ công" | Upload media ở `meeting-records` hoặc viết tay |
| E-ai-meeting-minutes-003 | Job thất bại hết retry | Provider lỗi/timeout sau 3 lần chạy lại | major | FR-002 | Trạng thái FAILED + "Không tạo được bản đề xuất biên bản — thử tạo lại hoặc viết biên bản thủ công" | Chạy lại thủ công hoặc viết tay |
| E-ai-meeting-minutes-004 | Transcript quá dài | Transcript vượt 150.000 ký tự | major | FR-001 | "Transcript vượt quá 150.000 ký tự — chia nhỏ file ghi rồi tạo lại" | Chia nhỏ media ở `meeting-records` rồi sinh lại |
| E-ai-meeting-minutes-005 | Vượt giới hạn sinh lại | Sinh lại lần thứ 4 trong 24 giờ | minor | FR-011 | "Đã đạt tối đa 3 lần tạo lại trong 24 giờ cho cuộc họp này" | Đợi hết window hoặc tiếp tục bản hiện tại |
| E-ai-meeting-minutes-006 | Không có quyền xác nhận | Người không phải chủ trì bấm xác nhận | major | FR-008 | "Chỉ chủ trì cuộc họp mới được xác nhận biên bản" | Nhờ chủ trì xác nhận; admin theo scope xác nhận thay |
| E-ai-meeting-minutes-007 | Mục rỗng khi lưu review | Sửa/thêm mục bỏ trống nội dung | minor | FR-006 | "Nội dung mục không được để trống — điền nội dung hoặc loại bỏ mục này" | Điền nội dung hoặc loại bỏ |
| E-ai-meeting-minutes-008 | Xác nhận khi lệch nguồn | Bấm xác nhận trong khi transcript đã đổi | major | FR-012 | "Bản đề xuất không còn khớp transcript hiện tại — vẫn xác nhận xuất bản?" | Xác nhận tiếp hoặc sinh lại bản mới |
| E-ai-meeting-minutes-009 | Sửa đồng thời một bản đề xuất | Hai người có quyền cùng sửa | minor | FR-006 | "Bản đề xuất vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-ai-meeting-minutes-010 | Sinh lại mất sửa tay | Bấm sinh lại khi bản hiện tại đã có sửa | major | FR-011 | "Bản đề xuất đang có chỉnh sửa của bạn — tạo lại sẽ thay thế toàn bộ" | Xác nhận thay thế hoặc hủy thao tác |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-ai-meeting-minutes-01 | Chủ trì có biên bản nhanh hơn viết tay | Thời gian trung vị từ kết thúc họp đến biên bản publish (nguồn AI vs tay) | Giảm ≥50% so với biên bản tay sau 1 tháng pilot (đề xuất — chờ OQ-2 PRD) |
| SC-ai-meeting-minutes-02 | Đề xuất AI đáng tin để giữ lại | Tỷ lệ mục đề xuất được giữ nguyên hoặc sửa nhỏ / tổng mục | ≥70% sau 1 tháng pilot (đề xuất — chờ OQ-2 PRD) |
| SC-ai-meeting-minutes-03 | Không biên bản AI nào publish thiếu xác nhận | Tỷ lệ MINUTES nguồn AI có confirmed_by + confirmed_at | 100% (guardrail human-in-the-loop) |
| SC-ai-meeting-minutes-04 | Không gán người ngầm | Tỷ lệ đầu việc publish có resolved_user do chủ trì chọn hoặc cờ chưa resolve | 100% |
| SC-ai-meeting-minutes-05 | Mục đối chiếu được với nguồn | Tỷ lệ mục đề xuất có trích dẫn transcript hợp lệ | ≥95% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __MINUTES_JOB__ — một lần sinh biên bản AI: transcript đầu vào, trạng thái,
  số lần retry, lý do lỗi, người kích hoạt.
- __MINUTES_PROPOSAL__ — bản đề xuất biên bản của một job: tóm tắt, trạng thái
  vòng đời (PROPOSED/REVIEWING/CONFIRMED/DISCARDED/SUPERSEDED), cờ lệch nguồn,
  người xác nhận.
- __PROPOSAL_ITEM__ — một mục trong bản đề xuất: loại (tóm tắt/quyết định/vấn
  đề mở/rủi ro/đầu việc), nội dung đề xuất và nội dung đã sửa, trạng thái
  review, người đề xuất (tên nguyên văn + resolved user + cờ chưa xác định),
  hạn đề xuất, nguồn AI/thêm tay.
- __ITEM_EVIDENCE__ — trích dẫn từ mục tới đoạn transcript nguồn.
- __TRANSCRIPT__, __TRANSCRIPT_SEGMENT__, __MEETING__, __MEETING_PARTICIPANT__,
  __MINUTES__, __APP_USER__ — entity ngoài feature (`meeting-records`,
  `account-access`), chỉ tham chiếu.

Chi tiết quan hệ + thuộc tính ở `srs/ai-meeting-minutes-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Luồng chính:__ transcript READY → chủ trì bấm sinh → job → bản đề xuất →
  đối chiếu danh bạ → chủ trì review/resolve → xác nhận → MINUTES PUBLISHED.
- __Luồng resolve:__ đầu việc cờ "chưa xác định" → chủ trì gán participant/
  danh bạ hoặc giữ nguyên văn → publish kèm cờ.
- __Luồng sinh lại:__ transcript đổi hoặc đề xuất kém → cảnh báo → sinh lại
  (hỏi khi có sửa tay) → bản mới thay thế bản cũ.
- __Luồng lỗi:__ job FAILED sau retry → thông báo chủ trì → chạy lại thủ công
  hoặc viết tay; bỏ đề xuất → biên bản tay.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __proposal-review__ — màn review bản đề xuất: các phần có cấu trúc, trích
  dẫn từng mục, cờ người chưa xác định, nhãn "do AI đề xuất".
- __item-editor__ — sửa nội dung/loại mục, resolve người, xem trích dẫn.
- __job-status__ — trạng thái job sinh biên bản trên meeting record + nút
  chạy lại khi FAILED.
- __stale-warning__ — cảnh báo lệch nguồn + lựa chọn sinh lại/tiếp tục.
- __published-minutes__ — biên bản publish trên meeting record (của
  `meeting-records`) kèm nhảy trích dẫn tới transcript.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| AI không tự công bố biên bản; chủ trì xác nhận trước publish | PRD Mục 7.14 "Chưa làm", Mục 12 — Product owner |
| Truy cập theo participant + organization/role/data-scope | PRD Mục 9 — Security owner |
| Transcript/bản đề xuất là dữ liệu nhạy cảm, retention cần duyệt trước dữ liệu thật; OQ-3/OQ-6 mở thì chỉ dữ liệu synthetic | PRD Mục 9 — Product + DPO/legal |
| Mọi mục AI đề xuất phải có provenance tới transcript | PRD Mục 12, Mục 7.14 rủi ro — Product owner |
| Tiếng Việt là ngôn ngữ ưu tiên | PRD Mục 9 — Product owner |
| Feature `Should` — không thuộc cam kết pilot v1 | PRD Mục 6.1, Feature Map — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| `meeting-records`: transcript READY, participants/danh bạ participant, MINUTES đích publish | Meetings & Work | Toàn bộ feature (FR-001/005/008) |
| `account-access`: danh bạ người dùng nội bộ | Platform | Đối chiếu người (FR-005/007) |
| `org-governance`: phạm vi, role, audit | Platform | Kiểm soát truy cập, audit |
| AI provider sinh biên bản cấu hình qua `platform-configuration` | Admin/Operations | FR-001/002 — chưa có thì chỉ biên bản tay |
| `contextual-notifications`: báo job FAILED, nhắc review | Platform | FR-002/015 |
| `meeting-to-tasks`: đọc đầu việc đã xác nhận + cờ resolve | Meetings & Work | Không chặn feature này; consumer downstream |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Sinh biên bản do chủ trì chủ động bấm, không tự động | FR-001 cần trigger nền; NFR-007 mất ý nghĩa |
| Đối chiếu danh bạ chỉ trong participant + danh bạ nội bộ tổ chức | FR-005/007 thiếu scope cho khách ngoài |
| Giới hạn số (150.000 ký tự, 50 mục, 3 lần/24 giờ, nhắc 48 giờ) là chuẩn v1 | FR-001/011/015 và E-004/005 đổi ngưỡng |
| Publish khi còn người chưa resolve là chấp nhận được (ghi cờ) | FR-009 phải đổi thành chặn publish |
| Admin theo scope được xác nhận thay chủ trì | BR-002 thu hẹp — cuộc họp kẹt khi chủ trì vắng |
| Một cuộc họp chỉ cần 1 bản đề xuất đang mở | BR-006 phải đổi nếu cần so sánh nhiều bản |

## 12. Open Questions

- [x] OQ-1: Sinh biên bản tự động khi transcript READY hay thủ công? —
  Resolved (đề xuất): thủ công bấm nút (URD OQ-1) — chờ Product owner xác
  nhận.
- [x] OQ-2: Retention cho transcript và bản đề xuất (DISCARDED/SUPERSEDED)?
  — Resolved (đề xuất): transcript theo `meeting-records`; bản đề xuất theo
  vòng đời biên bản — chờ DPO/legal (PRD OQ-6).
- [x] OQ-3: Transcript đổi thì tự sinh lại hay chỉ cảnh báo? — Resolved (đề
  xuất): cảnh báo + chủ trì quyết (bám hướng owner-review của PRD OQ-9).
- [x] OQ-4: Giới hạn số (150.000 ký tự, 50 mục, 3 lần/24 giờ, nhắc 48 giờ,
  SLA job 10 phút)? — Resolved (đề xuất): giá trị v1 thận trọng — chờ
  Product owner.
- [x] OQ-5: Publish khi còn người "chưa xác định"? — Resolved: được, giữ cờ
  chưa resolve; chặn tạo task thuộc `meeting-to-tasks`.
- [x] OQ-6: Dùng confidence để auto-accept/auto-reject mục? — Resolved:
  không — mọi mục qua review (PRD Mục 12).
- [~] OQ-7: Chia đề xuất theo agenda và mẫu biên bản theo loại họp? — Out
  of scope v1 (P1/P2 backlog).
- [~] OQ-8: Biên bản đa ngôn ngữ? — Out of scope v1 (tiếng Việt ưu tiên,
  PRD Mục 9).
