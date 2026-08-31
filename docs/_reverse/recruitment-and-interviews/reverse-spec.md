# Reverse SRS — Recruitment và interviews

## Scope

✅ Cluster bao phủ JD, CV upload/parse/AI screening, application pipeline, lịch
phỏng vấn, interviewer response, interview room/recording/result, offer và
onboarding. BFF dùng role gates và trong nhiều route dùng admin client; Backend
giữ schema, RLS, storage và Edge Function CV.

## Actors

| Actor | Hành vi quan sát được |
| --- | --- |
| HR/admin | Upload CV, quản lý pipeline, lịch và cấu hình recruitment |
| Recruiter | Pipeline/offer actions theo route gate |
| Interviewer | Nhận/từ chối lịch, thực hiện và submit result |
| Candidate | Subject của person/application; self-service offer chưa có evidence |
| AI/Edge Function | Parse và score CV; kết quả là input hỗ trợ quyết định |

## Functional requirements

- **FR-RC-01 ✅** Upload nhận PDF/DOCX tối đa 10 MB, tạo/resolve person, CV,
  application `NEW` và history (`Frontend/src/app/api/recruitment/upload/route.ts:5`,
  `:41`, `:98`).
- **FR-RC-02 ✅** CV analysis dùng JD/threshold, chuyển processing state, persist
  component scores/recommendation và kết thúc `SCREENED` hoặc `REJECTED`
  (`Frontend/src/app/api/recruitment/applications/[id]/cv-analysis/route.ts:40`,
  `:182`, `:255`).
- **FR-RC-03 ✅** Application transition phải qua state machine; invalid transition
  trả 422 (`Frontend/src/lib/recruitment/state-machine.ts:3`,
  `Frontend/src/app/api/recruitment/applications/[id]/status/route.ts:40`).
- **FR-RC-04 ✅** Schedule kiểm interviewer active/role, tạo pending appointment và
  chuyển application sang `INTERVIEW_SCHEDULED`
  (`Frontend/src/app/api/recruitment/applications/[id]/schedule-interview/route.ts:41`,
  `:72`, `:97`).
- **FR-RC-05 ✅** Interviewer có thể accept/decline/request reschedule; slot chưa
  assigned chỉ được claim bằng accept
  (`Frontend/src/app/api/recruitment/interviews/[id]/respond/route.ts:35`, `:76`).
- **FR-RC-06 ✅** Submit result pass/fail hoàn tất schedule và tự chuyển application
  (`Frontend/src/app/api/recruitment/interviews/[id]/result/route.ts:29`, `:72`).
- **FR-RC-07 ✅** Offer actions map tới OFFERED/ACCEPTED/OFFER_REJECTED/ONBOARDED;
  onboarding yêu cầu joined date và active employee conversion
  (`Frontend/src/app/api/recruitment/applications/[id]/offer/route.ts:8`, `:66`).

## States

Application graph quan sát được:

```text
NEW → SCREENED → SHORTLISTED → INTERVIEW_SCHEDULED
    → PASSED/FAILED → OFFERED → ACCEPTED/OFFER_REJECTED → ONBOARDED
```

CV: `PENDING | PROCESSING | COMPLETED | FAILED`. Interview schedule:
`scheduled | completed | cancelled`; interviewer response:
`pending | accepted | declined | reschedule_requested`.

## Business rules và conflicts

1. AI CV score thấp hơn threshold tự đưa application sang rejected; cần human
   review/override policy rõ.
2. ✅ Helper offer gate yêu cầu pass Round 1, Round 2 và Final nhưng negative
   search không tìm thấy caller (`Frontend/src/lib/recruitment/offer-gate.ts:15`).
3. ✅ Live interview result đầu tiên có thể chuyển thẳng PASSED/FAILED, xung đột
   intent ba vòng (`Frontend/src/app/api/recruitment/interviews/[id]/result/route.ts:72`).
4. ✅ Nhiều route dùng admin client sau broad role gate; record ownership/tenant
   scope chưa được chứng minh đầy đủ.
5. Candidate self-service accept/reject offer không được chứng minh; offer route
   hiện là staff action.

## Open questions

- **OQ-RC-01:** Pipeline yêu cầu một, ba hay số vòng phỏng vấn cấu hình được?
- **OQ-RC-02:** HR xem record do mình tạo hay toàn bộ tenant?
- **OQ-RC-03:** Candidate phản hồi offer qua kênh nào và audit ra sao?
- **OQ-RC-04:** Duplicate person/application theo email/JD được xử lý thế nào?
- **OQ-RC-05:** CV parse retry tối đa và recovery khỏi PROCESSING là gì?
- **OQ-RC-06:** AI rejection threshold là auto-decision hay recommendation?
