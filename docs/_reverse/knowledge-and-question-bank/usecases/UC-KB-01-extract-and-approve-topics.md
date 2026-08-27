# UC-KB-01 — Trích xuất và duyệt topics

- **Actor:** Content editor.
- **Flow:** register/upload source → request extraction → parse provider output →
  persist topics → editor merge/split → approve.
- **Failure:** invalid file/provider error/job failure phải giữ retry/audit path.
- **Postcondition:** Approved topics còn provenance tới source.
- **Evidence:** document-source extract/approve/merge/split BFF routes.
