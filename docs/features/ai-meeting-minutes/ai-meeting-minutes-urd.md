---
type: urd
feature: ai-meeting-minutes
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/ai-meeting-minutes/brainstorms/human-confirmed-ai-minutes.md
---

# ai-meeting-minutes — User Requirements Document

## 1. Purpose

Cho chủ trì một bản nháp biên bản do AI đề xuất từ transcript — có cấu trúc,
có trích dẫn nguồn, có cảnh báo người chưa xác định — để giảm thời gian tổng
hợp sau họp mà không mất quyền kiểm soát: chỉ khi chủ trì sửa và xác nhận,
biên bản mới trở thành bản ghi nghiệp vụ được công bố.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Chủ trì | Sau họp phải đọc lại toàn văn transcript hoặc nghe lại file ghi để viết biên bản | Tổng hợp thủ công mất nhiều thời gian, dễ sót quyết định và đầu việc | Biên bản chậm, thiếu cam kết đã chốt, đầu việc trôi | Confirmed — PRD Mục 7.14 |
| Người tham gia | Biên bản do người khác tổng hợp, không đối chiếu được với điều mình nói | Không kiểm chứng được biên bản có đúng không | Cam kết bị gán sai hoặc bị bỏ sót mà không biết | Assumption — suy từ yêu cầu truy nguyên PRD Mục 7.13/7.14 |
| Quản lý | Nhận biên bản qua email/chat, không biết phần nào là chốt thật | Đầu việc không rõ người, rõ hạn | Khó giao việc và kiểm tra tiến độ | Confirmed — PRD JTBD-MGR-01, Mục 7.15 |
| Admin | Nếu AI tự publish, output AI trở thành bản ghi chính thức không qua kiểm chứng | Vi phạm nguyên tắc human-in-the-loop | Quyết định sai được chính thức hóa | Confirmed — PRD Mục 12, Mục 7.14 "Chưa làm" |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Chủ trì | Cuộc họp có transcript READY, cần biên bản để chốt kết quả | Có bản nháp AI để review nhanh, sửa và xác nhận publish | Đọc lại toàn văn transcript mất thời gian; sợ AI gán sai người/bỏ sót quyết định |
| secondary | Người tham gia | Xem lại biên bản đã publish | Đối chiếu biên bản với trích dẫn transcript | Không kiểm chứng được nội dung được ghi nhận |
| secondary | Quản lý | Xem biên bản trong phạm vi quản lý | Đầu việc rõ người rõ hạn để theo dõi | Biên bản tay thiếu cấu trúc, không biết ai làm gì |
| secondary | Admin | Vận hành quyền và audit | Mọi biên bản publish đều qua xác nhận con người, truy vết được | AI có thể viết thẳng bản ghi nếu không chặn |

## 3. Scope Boundaries

### In Scope

- Sinh bản đề xuất biên bản từ transcript READY (job có trạng thái, retry).
- Nội dung có cấu trúc: tóm tắt, quyết định, vấn đề mở, rủi ro, đầu việc
  (người + hạn đề xuất).
- Trích dẫn đoạn transcript nguồn cho từng mục đề xuất (provenance).
- Đối chiếu danh bạ cho tên người trong đầu việc; cờ "chưa xác định" khi
  không khớp.
- Màn review của chủ trì: giữ/sửa/đổi loại/loại bỏ/thêm mục tay/resolve
  người.
- Xác nhận biên bản → publish vào meeting record; bỏ đề xuất → viết tay;
  sinh lại có kiểm soát; cảnh báo lệch nguồn khi transcript đổi.

### Out of Scope

- Tự động công bố biên bản khi chưa có con người xác nhận (PRD Mục 7.14
  "Chưa làm", Mục 12).
- Tạo task từ đầu việc — thuộc `meeting-to-tasks` (feature này chỉ resolve
  người trong biên bản).
- Tạo/xử lý transcript — thuộc `meeting-records`.
- Ghi âm, consent, retention media — thuộc `meeting-records`.
- Soạn biên bản tay và revision — thuộc `meeting-records` (đường fallback
  khi bỏ đề xuất).
- Mẫu biên bản theo loại họp, đa ngôn ngữ, học style chủ trì (P2).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Chủ trì | Khi transcript cuộc họp đã READY | Một nút sinh bản đề xuất biên bản AI có trạng thái job rõ ràng | Có bản nháp có cấu trúc để review thay vì đọc toàn văn | Critical | Confirmed — PRD Mục 7.14 |
| UN-002 | Chủ trì | Khi xem bản đề xuất | Mỗi mục (quyết định/vấn đề/rủi ro/đầu việc) kèm trích dẫn đoạn transcript nguồn | Kiểm chứng nhanh một mục có đúng không mà không đọc lại toàn bộ | Critical | Confirmed — PRD Mục 7.14 rủi ro; Mục 12 provenance |
| UN-003 | Chủ trì | Khi đầu việc có tên người | Hệ thống đối chiếu tên với participant/danh bạ và báo rõ người "chưa xác định" | Không có gán người ngầm sai; biết chỗ nào cần resolve | Critical | Confirmed — PRD Mục 7.14 (unknown-person warnings) |
| UN-004 | Chủ trì | Khi review bản đề xuất | Sửa nội dung, đổi loại mục, loại bỏ mục sai, thêm mục tay | Bản cuối phản ánh đúng ý chủ trì, không bị trói theo AI | Critical | Confirmed — PRD Mục 7.14 (chủ trì sửa/xác nhận), Mục 12 |
| UN-005 | Chủ trì | Khi nội dung đã đúng | Xác nhận để biên bản publish trên meeting record, ghi nhận người xác nhận | Biên bản chính thức hiển thị cho người trong phạm vi | Critical | Confirmed — PRD Mục 7.14 luồng chính |
| UN-006 | Chủ trì | Khi đề xuất AI quá kém hoặc transcript đổi | Bỏ bản đề xuất để viết tay, hoặc sinh lại bản mới có kiểm soát | Không bị kẹt với bản AI tệ; bản sửa tay không mất âm thầm | High | Assumption — suy từ "Chưa làm" + rủi ro PRD Mục 7.14 |
| UN-007 | Người tham gia | Khi đọc biên bản đã publish | Nhảy từ mục biên bản tới đoạn transcript gốc để đối chiếu | Tự kiểm chứng được cam kết/quyết định liên quan mình | High | Assumption — suy từ yêu cầu xem lại của URD meeting-records UN-007 |
| UN-008 | Admin | Khi kiểm tra vận hành | Truy vết ai xác nhận biên bản, khi nào, bản AI nào | 100% biên bản publish có xác nhận con người | High | Confirmed — PRD Mục 9 (audit), Mục 12 |
| UN-009 | Chủ trì | Khi transcript bị sửa sau khi đã có đề xuất | Được cảnh báo bản đề xuất lệch nguồn trước khi publish | Không publish biên bản không khớp nội dung thật | Medium | Assumption — suy từ rủi ro provenance |

## 5. Prioritized User Journeys

### Journey 1: Sinh, review và xác nhận biên bản AI

- **User:** Chủ trì
- **Importance:** Critical
- **Trigger:** Cuộc họp có transcript READY, chủ trì cần biên bản.
- **Expected outcome:** Biên bản PUBLISHED trên meeting record, mọi mục đã
  qua mắt chủ trì, có ghi nhận xác nhận.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-005

1) Chủ trì mở meeting record, bấm "Sinh biên bản bằng AI", thấy trạng thái
   đang tạo.
2) Bản đề xuất hiện: tóm tắt + các mục quyết định/vấn đề mở/rủi ro/đầu việc,
   mỗi mục kèm trích dẫn; người trong đầu việc đã được đối chiếu danh bạ.
3) Chủ trì duyệt từng mục: giữ/sửa/đổi loại/loại bỏ/thêm tay; resolve người
   "chưa xác định".
4) Bấm "Xác nhận biên bản" → biên bản publish, ghi người xác nhận + thời
   điểm.

**Independent verification:** Mở meeting record thấy MINUTES ở trạng thái
PUBLISHED với nguồn "AI đề xuất", đủ confirmed_by/confirmed_at; đối chiếu
ngẫu nhiên một mục với trích dẫn transcript khớp nội dung.

### Journey 2: Resolve người "chưa xác định" trong đầu việc

- **User:** Chủ trì
- **Importance:** Critical
- **Trigger:** Bản đề xuất có đầu việc gắn cờ "chưa xác định".
- **Expected outcome:** Mỗi đầu việc hoặc được gán người cụ thể, hoặc chủ
  trì chủ động giữ tên nguyên văn — không có gán ngầm sai.
- **Related needs:** UN-003, UN-004

1) Chủ trì mở đầu việc có cờ cảnh báo, đọc tên nguyên văn AI trích được.
2) Chọn gán participant cuộc họp / người trong danh bạ, hoặc giữ nguyên văn.
3) Xác nhận biên bản; đầu việc chưa resolve vẫn publish kèm cờ.

**Independent verification:** Với một biên bản đã publish có đầu việc "chưa
xác định", kiểm tra đầu việc đó ghi đúng tên nguyên văn và cờ chưa resolve —
không có user_id nào bị gán mà chủ trì không chọn.

### Journey 3: Người tham gia đối chiếu biên bản với transcript

- **User:** Người tham gia
- **Importance:** High
- **Trigger:** Nhận/xem biên bản đã publish của cuộc họp mình tham gia.
- **Expected outcome:** Kiểm chứng được phần liên quan mình qua trích dẫn
  transcript.
- **Related needs:** UN-007

1) Mở biên bản publish trong meeting record.
2) Bấm trích dẫn của một mục → nhảy tới đoạn transcript nguồn.
3) Đối chiếu nội dung; nếu sai, báo chủ trì sửa qua revision.

**Independent verification:** Chọn một mục bất kỳ trong biên bản publish —
trích dẫn dẫn tới đúng đoạn transcript chứa nội dung tương ứng.

### Journey 4: Chủ trì bỏ đề xuất hoặc sinh lại

- **User:** Chủ trì
- **Importance:** High
- **Trigger:** Bản đề xuất quá kém, hoặc transcript vừa bị sửa.
- **Expected outcome:** Chủ trì quay lại viết tay hoặc có bản đề xuất mới
  khớp transcript hiện tại, không mất vết.
- **Related needs:** UN-006, UN-009

1) Thấy cảnh báo "lệch nguồn" hoặc đánh giá bản đề xuất kém.
2) Chọn "Sinh lại" (xác nhận thay thế nếu đã sửa tay) hoặc "Bỏ bản đề xuất".
3) Bản mới review từ đầu / màn biên bản tay mở ra.

**Independent verification:** Sau sinh lại, bản cũ ở trạng thái "đã thay
thế" vẫn xem được vết; sau bỏ, record không còn đề xuất chờ xử lý và biên
bản tay lưu bình thường.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Cuộc họp chưa có transcript READY | Không sinh được bản đề xuất | Nút vô hiệu + giải thích; hướng dẫn tải file ghi hoặc viết tay | J1 / UN-001 |
| Job AI lỗi hết retry | Không có bản đề xuất | Trạng thái FAILED + thông báo + nút chạy lại; viết tay vẫn được | J4 / UN-006 |
| AI trích được tên khách ngoài không có trong danh bạ | Đầu việc không gán được | Cờ "chưa xác định" + cho gán participant khách của cuộc họp | J2 / UN-003 |
| Transcript bị sửa giữa lúc review | Đề xuất lệch nguồn | Cảnh báo rõ + hỏi lại trước khi publish | J4 / UN-009 |
| Bấm "Sinh lại" khi đã sửa tay nhiều | Sợ mất phần đã sửa | Hỏi xác nhận "bản sửa hiện tại sẽ bị thay thế" trước khi chạy | J4 / UN-006 |
| Xác nhận khi còn người chưa resolve | Sợ bị chặn | Vẫn publish được; đầu việc ghi tên nguyên văn + cờ chưa resolve | J2 / UN-003 |
| Người không phải chủ trì bấm xác nhận | Hành động vượt vai trò | Chặn + thông báo chỉ chủ trì được xác nhận (admin theo scope xác nhận thay có ghi rõ) | J1 / UN-005 |
| AI không trích được mục nào | Đề xuất trống gây bối rối | Thông báo "chưa trích được mục nào ngoài tóm tắt" + cho thêm mục tay | J1 / UN-004 |
| Vượt giới hạn sinh lại trong ngày | Không tạo được bản mới | Thông báo giới hạn 3 lần/24 giờ; đợi hoặc viết tay | J4 / UN-006 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt; biên bản và transcript hỗ trợ đầy đủ dấu
  tiếng Việt.
- Chỉ người dùng nội bộ đã đăng nhập, thuộc phạm vi của cuộc họp mới thấy
  biên bản/bản đề xuất; deny-by-default (kế thừa `meeting-records`).
- Chỉ chủ trì được xác nhận biên bản — không có ngoại lệ cho người tham gia
  thường.
- Bản đề xuất luôn hiển thị nhãn "do AI đề xuất" — người đọc không bao giờ
  nhầm đây là bản ghi đã chốt.
- Đầu việc có người "chưa xác định" hiển thị cờ cảnh báo rõ trước khi xác
  nhận.
- Thiết bị: màn hình desktop là chính (review bảng nhiều mục + trích dẫn).

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Chủ trì chủ động bấm sinh biên bản, không tự động chạy | Nếu cần tự động → thiếu trigger nền, chủ trì chờ | Resolved (đề xuất) — chờ Product owner | Xác nhận ở OQ-1 |
| Đối chiếu danh bạ chỉ trong participant + danh bạ nội bộ cùng tổ chức | Nếu cần khách ngoài → thiếu scope resolve | Assumption | Chốt khi pilot có họp khách ngoài |
| Admin theo scope được xác nhận thay chủ trì (ghi rõ) | Nếu không → cuộc họp kẹt khi chủ trì vắng | Assumption | Chốt với Security owner |
| Không dùng confidence để auto-accept/auto-reject | Nếu cần auto → vi phạm human-in-the-loop | Confirmed — PRD Mục 12 | — |
| Giới hạn số (150.000 ký tự, 50 mục, 3 lần/24 giờ, 48 giờ nhắc) là v1 | Nếu sai → đổi FR/NFR tương ứng | Resolved (đề xuất) — chờ Product owner | Xác nhận ở OQ-4 |
| Biên bản publish kế thừa quyền xem của `meeting-records` | Nếu mở rộng → lộ nội dung nhạy cảm | Confirmed — PRD Mục 9, URD meeting-records | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Chủ trì có biên bản sẵn sàng xác nhận nhanh hơn viết tay | Chưa có — xác lập bằng đo thời gian từ kết thúc họp đến biên bản publish trong 1 tháng pilot | Giảm ≥50% thời gian trung vị so với biên bản tay (đề xuất) | Thời gian end→publish, tách nguồn AI/tay | 1 tháng sau pilot |
| USC-002 | Đề xuất AI đáng tin để giữ lại | Chưa có — xác lập bằng diff trong 1 tháng pilot | ≥70% mục đề xuất được giữ nguyên hoặc sửa nhỏ (đề xuất — chờ OQ-2 PRD) | Tỷ lệ mục giữ/(giữ+sửa+loại) | 1 tháng sau pilot |
| USC-003 | Mọi biên bản publish qua tay con người | 100% (mặc định theo invariant) | 100% biên bản có confirmed_by + thời điểm | Kiểm bản ghi xác nhận | Liên tục |
| USC-004 | Không có đầu việc bị gán người ngầm | 0 sự cố | 100% đầu việc có resolved_user do chủ trì chọn hoặc cờ chưa resolve | Audit đầu việc publish | Liên tục |
| USC-005 | Mục biên bản đối chiếu được với nguồn | Chưa có | ≥95% mục đề xuất có trích dẫn transcript hợp lệ | Kiểm mẫu trích dẫn | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Sinh biên bản tự động hay thủ công? — Resolved (đề xuất): thủ
  công bấm nút; chờ Product owner xác nhận (brainstorm OQ-1).
- [x] OQ-2: Retention transcript/bản đề xuất? — Resolved (đề xuất): theo
  chính sách `meeting-records` + vòng đời biên bản; chờ DPO/legal (PRD OQ-6).
- [x] OQ-3: Transcript đổi thì tự sinh lại hay cảnh báo? — Resolved (đề
  xuất): cảnh báo + chủ trì quyết (bám hướng owner-review của PRD OQ-9).
- [x] OQ-4: Giới hạn số Mục 7.2 của brainstorm? — Resolved (đề xuất): giữ
  thận trọng; chờ Product owner.
- [x] OQ-5: Publish khi còn người chưa resolve? — Resolved: được, ghi cờ;
  chặn giao task thuộc `meeting-to-tasks`.
- [x] OQ-6: Dùng confidence để auto-accept? — Resolved: không, mọi mục qua
  review (PRD Mục 12).
