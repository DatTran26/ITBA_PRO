# UC-AS-01 — Tạo và chia sẻ bài đánh giá

- **Primary actor:** Recruiter/admin.
- **Precondition:** Actor có authenticated context và quyền tạo test.
- **Trigger:** Actor gửi cấu hình test/questions.
- **Main flow:** validate request → tạo test/share token → tạo questions → trả
  test cho UI → actor chia sẻ `/test/{token}`.
- **Alternate:** validation/persist thất bại thì BFF trả error, không tuyên bố
  transaction atomic vì chưa có evidence.
- **Postcondition:** Test và questions tồn tại; token trở thành candidate entry.
- **Evidence:** `Frontend/src/app/api/tests/route.ts:49`, `:124`.
