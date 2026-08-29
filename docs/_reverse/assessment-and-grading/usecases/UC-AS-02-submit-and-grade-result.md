# UC-AS-02 — Nộp và chấm bài

- **Primary actors:** Candidate, recruiter/grader.
- **Precondition:** Token/test hợp lệ; answer payload parse được.
- **Main flow:** candidate submit → BFF tự chấm câu khách quan → lưu manual
  overlays → grader cập nhật từng grade → recompute score/status.
- **Alternate:** Không có manual answer thì result đi thẳng `graded`.
- **Postcondition:** Result có derived score và grading status nhất quán.
- **Evidence:** `Frontend/src/app/api/results/route.ts:66`, `:82`,
  `Frontend/src/lib/grading/recompute-result-score.ts:39`.
