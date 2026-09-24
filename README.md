<<<<<<< HEAD
# DOWN TOWN — AI HRMS workspace

DOWN TOWN là một repository cho sản phẩm HRMS tích hợp AI. Repository gốc sở
hữu tầm nhìn sản phẩm, quy tắc cộng tác và GitFlow. Source ứng dụng được tách
thẳng tại `Frontend/` và `Backend/` để tiếp tục tích hợp/mở rộng tại đây.
=======
# Town Hown — Hệ thống quản lý nhân sự tích hợp AI (AI-powered HRMS)

[![License: MIT](LICENSE)](https://github.com/DatTran26/down-town/blob/main/LICENSE)
[![Release](https://img.shields.io/github/v/release/DatTran26/down-town)](https://github.com/DatTran26/down-town/releases)
[![Repo](https://img.shields.io/badge/github-down--town-blue)](https://github.com/DatTran26/down-town)
>>>>>>> origin/develop

Town Hown là một hệ thống quản lý nhân sự (HRMS) B2B mã nguồn mở, tích hợp AI
có kiểm soát: AI trích xuất, so khớp, tóm tắt và soạn thảo, còn mọi quyết định
nhân sự đều do người có thẩm quyền xác nhận và lưu vết đầy đủ.

## Giới thiệu

Doanh nghiệp thường vận hành hồ sơ nhân sự, tuyển dụng, phỏng vấn, bài đánh
giá, biên bản họp và giao việc trên nhiều công cụ rời: trạng thái thất lạc,
evidence phân tán, quyết định khó truy nguyên. Town Hown giữ một luồng dữ liệu
xuyên suốt từ nguồn (CV, tài liệu, cuộc họp, bài test, camera) đến hồ sơ, quyết
định và công việc — với nguyên tắc AI chỉ đề xuất, con người quyết định.

Hợp đồng sản phẩm đầy đủ: [`PRODUCT.md`](PRODUCT.md). Phạm vi thương mại v1:
[`docs/downtown/prd.md`](docs/downtown/prd.md).

## Tính năng chính

- **Tuyển dụng đầu-cuối:** tiếp nhận CV, bóc tách dữ liệu, so khớp có giải
  thích, pipeline trạng thái có kiểm soát, lịch và kết quả phỏng vấn, offer.
- **Đánh giá năng lực:** ngân hàng câu hỏi, sinh câu hỏi bằng AI, bài test
  public/assigned, chấm điểm và phân tích đã review.
- **Document AI:** OCR tài liệu/ảnh scan, trích xuất chủ đề, soạn thảo và thẩm
  định văn bản hành chính theo Nghị định 30/2020/NĐ-CP.
- **Chấm công sinh trắc học:** đăng ký khuôn mặt 6 góc, đăng nhập Face ID,
  chống giả mạo (anti-spoofing), điểm danh và tổng hợp công.
- **Giám sát hành vi:** phát hiện vi phạm tại khu vực đã công bố bằng computer
  vision; sự kiện là cảnh báo cho đến khi quản lý xác nhận.
- **Nền tảng:** phân quyền theo vai trò và phạm vi quản lý, email thông báo,
  nhật ký hoạt động và audit.

Phạm vi mục tiêu theo feature: [`docs/features/`](docs/features/README.md).
Tính năng chỉ được coi là đã triển khai khi có source và validation tương ứng.

## Công nghệ sử dụng

| Tầng | Công nghệ | Manifest |
| --- | --- | --- |
| Web app | Next.js (App Router, React, TypeScript strict), Tailwind CSS, BFF same-origin `/api/*` | [`Frontend/package.json`](Frontend/package.json) |
| Platform dữ liệu | Supabase (PostgreSQL, Auth, RLS, Storage, Edge Functions Deno) | [`Backend/`](Backend) |
| Vision services | FastAPI — ArcFace/InsightFace (nhận diện mặt), YOLO (hành vi), Gemini Vision + Pytesseract (OCR) | `modules/*/backend/requirements.txt` |
| AI providers | OpenAI, Google Gemini | biến môi trường server-only |
| Đóng gói | Docker multi-stage (Next.js standalone), Docker Compose, GHCR | [`Frontend/Dockerfile`](Frontend/Dockerfile), [`docker-compose.yml`](docker-compose.yml) |

Toàn bộ toolchain build là mã nguồn mở (Node.js/npm, Python, Docker). Danh mục
thư viện đầy đủ do các manifest trên sở hữu; dự án không chỉnh sửa mã nguồn
thư viện bên thứ ba và không đóng gói kèm source của dự án khác.

## Yêu cầu

- Node.js 20+ và npm (build/chạy `Frontend/`).
- Docker + Docker Compose (chạy đủ stack: web, vision-ai, vision-ocr).
- Một Supabase project (hoặc instance Postgres + Auth tương thích) cho
  schema/RLS/Storage — migrations tại `Backend/supabase/migrations`.
- Python 3.x chỉ khi chạy vision services ngoài Docker.

## Cài đặt và chạy từ mã nguồn

### Cách 1 — Docker Compose (đủ stack)

```bash
cp .env.example .env          # điền NEXT_PUBLIC_SUPABASE_URL / ANON_KEY và các key server
docker compose config         # kiểm tra cấu hình
docker compose up --build -d
curl -fsS http://127.0.0.1:3000/api/health
```

Mặc định web chạy tại `http://localhost:3000` (`APP_PORT` đổi được trong `.env`).

### Cách 2 — Chạy dev thủ công (chỉ web)

```bash
cd Frontend
cp .env.example .env.local    # điền public Supabase config + key server cần thiết
npm ci
npm run dev                   # http://localhost:3000
```

### Build production từ source

```bash
cd Frontend
npm ci && npm run lint && npm run build && npm start
```

Hoặc build image trực tiếp (public config được bake lúc build qua build-arg —
xem [`Frontend/Dockerfile`](Frontend/Dockerfile)).

Vision services chạy độc lập được: xem [`modules/README.md`](modules/README.md)
và README từng module. Chi tiết vận hành đầy đủ:
[`docs/downtown/operations.md`](docs/downtown/operations.md).

## Sử dụng

Sau khi stack chạy và Supabase đã apply migrations: tạo tài khoản qua trang
đăng ký (kèm đăng ký khuôn mặt 6 góc nếu bật luồng sinh trắc học), đăng nhập
tại `/login` (Face ID hoặc email + mật khẩu). Các phân hệ nằm dưới `/dashboard`
(tuyển dụng, assessment, tài liệu, chấm công, giám sát). Dữ liệu demo phải là
synthetic hoặc đã có consent — xem chính sách trong
[`docs/project-overview-pdr.md`](docs/project-overview-pdr.md).

## Cấu trúc repository

| Path | Vai trò |
| --- | --- |
| `Frontend/` | Web app Next.js duy nhất (UI + BFF `/api/*`) |
| `Backend/` | Supabase migrations, RLS, RPC, Storage policies, Edge Functions, DB utilities |
| `modules/` | Vertical slices AI độc lập (vision-ai, vision-ocr, face-attendance) — chạy standalone hoặc tích hợp vào product |
| `docs/` | Tài liệu hiện hành — index tại [`docs/README.md`](docs/README.md) |
| `deploy/` | Reverse proxy/VPS config |
| `scripts/` | Script vận hành (release, migrations) |

Một repository Git duy nhất — không tạo nested Git trong `Frontend`/`Backend`.

## Tài liệu

- Điều hướng toàn bộ: [`docs/README.md`](docs/README.md)
- Bộ tài liệu chuẩn: [`docs/downtown/`](docs/downtown/README.md) (PRD, kiến
  trúc, phát triển, vận hành, bảo mật, design guidelines)
- Tuyến yêu cầu theo feature: [`docs/features/`](docs/features/README.md)
- Lộ trình và intent-vs-shipped: [`docs/project-roadmap.md`](docs/project-roadmap.md)

## Phát hành và changelog

- Releases: [GitHub Releases](https://github.com/DatTran26/down-town/releases);
  tag `v*` tương ứng image GHCR `:x.y.z`.
- [`CHANGELOG.md`](CHANGELOG.md) ghi thay đổi đáng chú ý; notes từng bản tại
  [`docs/releases/`](docs/releases/).
- Quy trình release: `develop → release/x.y.z → main` — chi tiết trong
  [`CONTRIBUTING.md`](CONTRIBUTING.md) và [`docs/deployment-guide.md`](docs/deployment-guide.md).

## Báo lỗi và đóng góp

- Bug tracker: [GitHub Issues](https://github.com/DatTran26/down-town/issues).
- Báo lỗ hổng bảo mật: theo kênh trong [`SECURITY.md`](SECURITY.md), không mở
  issue công khai.
- Quy trình đóng góp (GitFlow, PR policy, commit convention):
  [`CONTRIBUTING.md`](CONTRIBUTING.md); quy tắc cho agent/tooling:
  [`AGENTS.md`](AGENTS.md).

## Giấy phép

Phát hành theo giấy phép [MIT](LICENSE) (OSI-approved). © 2026 Tran Tan Dat và
contributors.

## Nhóm phát triển

WPC Team — Dat, Hieu, Kien, Thanh (nhánh cá nhân `develop-<name>` tương ứng).
Danh sách contributors: GitHub → Insights → Contributors.
