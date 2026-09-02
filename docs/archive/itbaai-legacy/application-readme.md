# ITBAAI — tuyển dụng và đánh giá năng lực có AI hỗ trợ

ITBAAI là ứng dụng web phục vụ recruiter, interviewer, admin và candidate trong
quy trình tạo bài đánh giá, làm bài, phân tích kết quả, tuyển dụng và quản lý
năng lực. Ứng dụng là phân hệ đang được triển khai trong tầm nhìn HRMS Town Hown.

## Phạm vi hiện có trong source

- Tạo, chia sẻ và quản lý bài test; candidate làm bài qua token công khai.
- Chấm điểm, manual grading, AI analysis và follow-up interview questions.
- Quản lý persons, positions, skills, groups và scoring.
- Recruitment pipeline, CV processing, lịch/phòng phỏng vấn và recording.
- Question bank, document library, trích xuất topic và sinh câu hỏi từ tài liệu.
- Email template, SMTP configuration và delivery logs.
- Dashboard, system settings, version management và activity/audit surfaces.

Danh sách trên là bản đồ domain, không phải cam kết rằng mọi luồng đã sẵn sàng
production. Source, migrations và validation của từng feature là bằng chứng cuối
cùng. Xem [`docs/README.md`](docs/README.md) để đi tới owner tương ứng.

## Stack và executable owners

| Concern | Owner |
| --- | --- |
| Frontend runtime/dependencies | [`Frontend/package.json`](Frontend/package.json) |
| TypeScript/compiler | [`Frontend/tsconfig.json`](Frontend/tsconfig.json) |
| Next.js UI và BFF | [`Frontend/src/app`](Frontend/src/app), gồm `Frontend/src/app/api` |
| Shared UI/domain helpers | [`Frontend/src/components`](Frontend/src/components), [`Frontend/src/lib`](Frontend/src/lib) |
| Auth and route protection | [`Frontend/src/middleware.ts`](Frontend/src/middleware.ts), [`Frontend/src/lib/supabase`](Frontend/src/lib/supabase) |
| Database/RLS | [`Backend/supabase/migrations`](Backend/supabase/migrations) |
| Edge functions | [`Backend/supabase/functions`](Backend/supabase/functions) |
| Container build | [`Frontend/Dockerfile`](Frontend/Dockerfile), [`docker-compose.yml`](docker-compose.yml) |
| Legacy CI reference (chưa nối vào root repo) | [`.gitlab-ci.yml`](.gitlab-ci.yml) |

Các phiên bản framework/library thay đổi theo manifest; không sao chép chúng vào
tài liệu khác.

## Chạy local

Yêu cầu: Node.js tương thích với lockfile, npm và một Supabase project hợp lệ.

```powershell
cd Frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`. Cấu hình local dùng `.env.local` hoặc `.env`; không
commit các file này. Tên biến được source hiện tại sử dụng:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` khi cần override model
- `NEXT_PUBLIC_APP_URL` khi luồng cần URL tuyệt đối

Không có `.env.example` được version-control tại thời điểm chuẩn hoá tài liệu.
Lấy giá trị qua kênh quản lý secret của đội, không sao chép từ máy khác vào docs.

## Lệnh project

```powershell
cd Frontend
npm run dev
npm run lint
npm run build
npm start
```

`package.json` hiện không có test script. Chỉ ghi nhận test command sau khi
project thực sự cung cấp runner và cấu hình tương ứng.

Frontend manifest có entry `npm run version` nhưng target
`.claude/scripts/version-manager.mjs` không tồn tại trong source đã tích hợp;
không chạy lệnh này cho đến khi script được phục hồi hoặc manifest được sửa.

## Tài liệu

- [Bộ tài liệu canonical](../docs/downtown/README.md)
- [SRS tái lập từ code](../docs/_reverse/README.md)
- [Chỉ mục legacy và authority order](docs/README.md)
- [Bảo mật ứng dụng](SECURITY.md)

## Repository boundary

Thư mục này là source ứng dụng trong repository Town Hown, không phải nested Git
repository. Quy tắc nhánh nằm ở [`../AGENTS.md`](../AGENTS.md). Không stage
`.env*`, `Frontend/.next`, `*.tsbuildinfo` hoặc `Backend/supabase/.temp`.
