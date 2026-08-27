# Brainstorm Report: Recruitment Operations Workspace

## Problem
`/dashboard/recruitment` đang bị dashboard hóa. Màn này không nên ưu tiên KPI/hero lớn. Đây là màn vận hành hồ sơ tuyển dụng: tìm, lọc, xử lý, mở hồ sơ, lên lịch, đổi trạng thái.

## Requirements
- Giữ dark theme hiện tại.
- Tối ưu cho role HR dùng hằng ngày.
- Hỗ trợ multi-use: table, kanban, quick action, preview.
- Giảm click khi xử lý ứng viên.
- Không biến thành dashboard analytics.
- Ưu tiên KISS/YAGNI: redesign đúng màn trước, drawer nâng cao có thể làm phase sau.

## Evaluated Approaches

### A. Operational Table Pro
- Main table là trung tâm.
- Header compact, action rõ.
- Filter mạnh: search, status, JD, CV status, score, date.
- Row actions: view, analyze CV, schedule PV, change status, reject.

Pros:
- Đúng bản chất trang recruitment.
- Scale tốt khi nhiều hồ sơ.
- Dễ implement, ít rủi ro.

Cons:
- Ít wow hơn dashboard/kanban.
- Cần polish table UX kỹ.

### B. Pipeline Workspace
- Kanban pipeline làm view chính.
- Column theo stage.
- Card có score, JD, CV status, actions.

Pros:
- Trực quan theo pipeline.
- Tốt cho điều phối trạng thái.

Cons:
- Nhiều ứng viên sẽ khó xem.
- Search/filter phức tạp hơn.

### C. Hybrid Split View
- Trái là list/table.
- Phải là preview panel ứng viên.
- Có quick actions trong panel.

Pros:
- Đa chức năng nhất.
- Giảm click mạnh.
- Cảm giác ATS chuyên nghiệp.

Cons:
- Công lớn nhất.
- Responsive khó hơn.
- State management cần kỹ.

## Recommended Direction
Chọn A + một phần C.

Tên UI: Recruitment Operations Workspace.

Mặc định:
- Operational table làm view chính.
- Kanban là alternate view.
- KPI cards lớn bỏ/thu nhỏ thành micro summary strip.
- Action/filter/table là trọng tâm.

Phase sau:
- Candidate preview drawer bên phải.
- Bulk status update.
- Save filter presets.

## Proposed Layout
```text
Recruitment
Quản lý hồ sơ ứng viên, sàng lọc CV, điều phối phỏng vấn

[Upload CV] [Lên lịch PV] [Báo cáo] [Export] [Table/Kanban]

[Search...] [Status] [JD] [CV Status] [Score] [Date] [Reset]

All 4 | New 2 | Screened 1 | Shortlisted 1 | Interview 0

Candidate | JD | Pipeline | AI Score | CV Status | Interview | Created | Actions
```

## UI Rules
- Không hero card lớn.
- Header compact.
- Primary action `Upload CV` nổi bật.
- Secondary actions nhẹ hơn.
- Filter bar sticky nếu cần.
- Row hover rõ.
- Status pill nhất quán.
- Empty/loading/error states rõ.
- Data density cao hơn dashboard.

## Functional Scope
Must-have:
- Compact header.
- Advanced filter bar visual structure.
- Status tabs with counts.
- Enhanced table panel.
- Row action cluster.
- Keep existing upload/report/JD/settings permissions.
- Preserve existing table/kanban behavior.

Nice-to-have:
- Preview drawer.
- Export selected.
- Move stage bulk action.
- Score range filter connected to API.
- JD filter connected to API.

## Risks
- Over-design again if adding big analytics cards.
- Too many filters without backend support can confuse users.
- Preview drawer adds state complexity; should be phase 2.
- Existing DataTable may limit fine-grained row design.

## Success Metrics
- HR can find candidate within 5 seconds.
- HR can schedule interview from row within 1 click.
- Visible status count without dashboard cards.
- Table remains readable at 4 and 100+ applications.
- No TypeScript/build regressions.

## Next Steps
1. Create implementation plan.
2. Redesign `/dashboard/recruitment` in phases.
3. Validate with typecheck.
4. Optional: add preview drawer after base UI approved.

## Unresolved Questions
- Có cần preview drawer ngay phase 1 không?
- Filter JD/CV status/score/date chỉ UI trước hay phải nối API ngay?
- Có cần export CSV từ màn này không?
