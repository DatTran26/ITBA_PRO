# UC-KB-02 — Sinh và chọn câu hỏi

- **Actor:** Recruiter/content editor.
- **Precondition:** Source/topic usable.
- **Flow:** request generation → validate output → persist draft → review/edit →
  pull selected questions into test.
- **Postcondition:** Selected questions có source reference khi feature hỗ trợ.
- **Evidence:** `Frontend/src/app/api/document-sources/[id]/generate-questions/route.ts:8`,
  `Frontend/src/app/api/question-bank/pull/route.ts:8`.
