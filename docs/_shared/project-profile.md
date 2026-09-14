---
type: project-profile
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Project Profile

> Kho thông tin cấp dự án tích lũy dần — skill thiếu thông tin sẽ hỏi rồi ghi vào đây, skill sau
> đọc lại không hỏi nữa (xem `.claude/rules/project-profile.md`). Chỉ tạo section khi có nội dung
> thật; mỗi mục kèm ngày ghi.

## Domain

Town Hown là HRMS B2B tiếng Việt: tuyển dụng (CV intake → matching → phỏng vấn → offer), đánh giá năng lực (question bank, assessment, grading), document AI (intake, review, thư viện nguồn), và quản trị nội bộ (users, groups, email, versions). Nền: Next.js Frontend + Supabase Backend; `modules/vision-ocr` là module tách biệt. — 2026-09-13

## Người dùng & thuật ngữ

| Nhóm user | Gọi là gì trong doc | Ghi chú | Ngày |
|---|---|---|---|
| HR / tuyển dụng | HR | Operator chính của recruitment pipeline | 2026-09-13 |
| Quản lý / lãnh đạo | quản lý | Duyệt nhu cầu, xem KPI, xác nhận cảnh báo | 2026-09-13 |
| Nhân viên | nhân viên | Task, meeting, profile của mình | 2026-09-13 |
| Ứng viên | ứng viên | Nộp CV, làm bài đánh giá qua public link | 2026-09-13 |
| Người phỏng vấn | interviewer | Nhận lịch, ghi đánh giá | 2026-09-13 |
| Quản trị | admin | Cấu hình nền tảng, quyền, versions | 2026-09-13 |

## Ghi chú khác

| Câu hỏi | Trả lời | Ngày | Skill hỏi |
|---|---|---|---|
| Quy mô người dùng (calibrate Reach RICE) | 50-300 người nội bộ, vài trăm ứng viên/quý | 2026-09-13 | /roadmap |
| CV service cho cv-event-monitoring | Đang build ở ngoài repo (Python riêng) | 2026-09-13 | /roadmap |
| external-integrations | Trì hoãn — chưa chọn provider | 2026-09-13 | /roadmap |
