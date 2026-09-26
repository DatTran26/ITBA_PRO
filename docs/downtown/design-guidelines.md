---
type: design-guidelines
status: active
updated: 2026-09-13
scope:
  - ../../Frontend/
links:
  - README.md
  - development.md
  - ../../Frontend/src/app/globals.css
  - ../../Frontend/src/app/layout.tsx
  - ../archive/itbaai-legacy/design-guidelines.md
---

# Town Hown Design Guidelines

> **Phạm vi chủ đề.** Tài liệu này mô tả chủ đề tối `.dark`, vẫn là mặc định của
> toàn app. Bốn route demo (`/`, `/login`, `/dashboard`,
> `/dashboard/recruitment`) đã chuyển sang chủ đề sáng `.tg`, xem
> [design-tokens-topgo.md](design-tokens-topgo.md) và
> [design-guidelines-topgo.md](design-guidelines-topgo.md).

Tài liệu này là chuẩn thiết kế hiện hành cho giao diện sản phẩm Town Hown trong
`Frontend/`. Nó kế thừa hướng thiết kế Deep Intelligence của ITBA.AI, đổi phạm
vi sở hữu sang Town Hown và làm rõ phần nào thuộc contract, phần nào còn là nợ
di trú trong source.

CSS, component và hành vi runtime vẫn là bằng chứng cuối cùng cho WHAT/HOW.
Tài liệu này sở hữu WHY, nguyên tắc sử dụng, vai trò semantic và tiêu chí review.

## 1. Phạm vi và authority

- Áp dụng cho toàn bộ trang, layout và component được phát hành từ `Frontend/`.
- `Frontend/src/app/globals.css` sở hữu giá trị token runtime.
- `Frontend/src/components/ui/` là lớp primitive và composite dùng chung ưu tiên.
- Tài liệu này sở hữu visual direction, semantic role, quy tắc composition,
  accessibility và tiêu chí handoff.
- Bản ITBA.AI trong `docs/archive/itbaai-legacy/` chỉ dùng để truy nguyên lịch sử.

### Chính sách đối với `modules/`

`modules/` chứa các lát cắt chức năng độc lập, demo hoặc prototype kỹ thuật.
Giao diện, stylesheet, token, component và visual language nằm trong đó không
phải template hay nguồn thiết kế của Town Hown.

Khi một chức năng từ `modules/` được tích hợp vào sản phẩm:

1. Giữ lại contract nghiệp vụ, state, API và hành vi đã được xác minh.
2. Không sao chép UI, CSS, token hoặc component presentation của module.
3. Thiết kế lại giao diện trong `Frontend/` bằng shell, token và component chuẩn
   được mô tả tại tài liệu này.
4. Kiểm tra lại responsive, accessibility, empty/loading/error state trong ngữ
   cảnh sản phẩm chính.

## 2. Visual direction

Hướng thiết kế của Town Hown là **Deep Intelligence — dark-first, Arctic
Minimalist**.

- Nền navy sâu, surface tăng sáng theo độ cao và indigo làm màu tương tác chính.
- Ưu tiên khả năng đọc, thao tác nhanh và mật độ dữ liệu có kiểm soát.
- Glass, gradient và glow chỉ tạo chiều sâu; chúng không được cạnh tranh với dữ liệu.
- Navigation, page header và action hierarchy phải nhất quán giữa các module.
- Màu success, warning và danger chỉ mang nghĩa trạng thái, không dùng để trang trí.
- Dark theme là theme sản phẩm hiện hành. Light token trong `:root` chưa phải bề
  mặt được hỗ trợ cho tới khi có quyết định và kiểm thử riêng.

## 3. Nền tảng kỹ thuật

- Next.js App Router và React.
- Tailwind CSS v4 qua `@import "tailwindcss"` và `@theme inline`.
- Primitive theo shadcn-style, xây trên Base UI.
- `class-variance-authority` cho variant; `cn()`/`tailwind-merge` cho composition.
- `lucide-react` là thư viện icon mặc định.
- `framer-motion` và `tw-animate-css` chỉ dùng cho motion có mục đích.
- Locale gốc là tiếng Việt (`lang="vi"`).

## 4. Design tokens

### 4.1 Nguyên tắc token

- Dùng semantic utility như `bg-background`, `bg-card`, `text-foreground`,
  `text-muted-foreground`, `border-border` và `ring-ring`.
- Không thêm hex mới trực tiếp trong page hoặc feature component.
- Nếu vai trò chưa có token, bổ sung token ở `globals.css` trước rồi mới sử dụng.
- Không dùng tên màu vật lý như `blue`, `purple` hoặc `green` khi ý nghĩa thực sự
  là primary, AI, success hoặc warning.
- Di trú literal cũ theo từng component/feature; không blanket codemod khi chưa
  kiểm tra contrast và state.

### 4.2 Surface và text

| Semantic role | Runtime token | Giá trị hiện hành | Sử dụng |
| --- | --- | --- | --- |
| App canvas | `--background` | `#121A2E` | Dashboard và shell chính |
| Immersive canvas | Chưa token hóa | `#0A0F1E` | Test-taking, profile hoặc focus workspace |
| Sidebar | `--sidebar` | `#101828` | Navigation shell |
| Surface 1 | `--card` | `#161E30` | Card/panel mặc định |
| Surface 2 | `--popover`, `--secondary`, `--muted` | `#1B2540` | Raised panel, popover, muted fill |
| Surface 3 | `--accent` | `#212C4A` | Selected, overlay và hover mạnh |
| Text chính | `--foreground` | `#ECF0F7` | Heading và nội dung chính |
| Text phụ | `--sidebar-foreground` | `#AEB9CC` | Body emphasis trên nền tối |
| Text muted | `--muted-foreground` | `#8B99B0` | Metadata, hint và label phụ |
| Text dim | Chưa token hóa | `#5A6882` | Chỉ dùng cho text lớn/decorative sau khi kiểm tra contrast |
| Border | `--border` | White 8% | Hairline |
| Input border | `--input` | White 12% | Control boundary |

Surface phải thể hiện thứ bậc bằng màu nền, border và spacing trước khi dùng shadow.
Không dùng một màu surface gần giống nhưng khác mã, ví dụ `#1B253B` thay cho
`#1B2540` hoặc `#222C4A` thay cho `#212C4A`.

### 4.3 Brand và semantic colors

| Role | Token/giá trị hiện hành | Sử dụng |
| --- | --- | --- |
| Primary | `--primary: #5B6CF0` | CTA, active navigation, selected data, focus |
| Primary light | `#7C8FFF` | Icon, border, gradient tail; cần promote thành token trước khi dùng mới |
| AI insight | `#A78BFA` | AI-generated insight/chip; cần promote thành token |
| Violet light | `#B48EFF` | Brand gradient; không dùng làm flat fill lớn |
| Secondary accent | `--accent-orange: #FFB86C` | Emphasis phụ có chủ đích |
| Success | `#34D399` | Thành công, pass, live |
| Warning | `#FBBF24` | Chờ review hoặc cần chú ý |
| Danger | `--destructive: #FB7185` | Lỗi, fail, destructive action |
| Info | `--primary: #5B6CF0` | Trạng thái thông tin |

Status chip, dot và label phải đi qua `lib/ui/status-tone` và component dùng
chung. Không tạo map màu trạng thái riêng trong từng feature. Màu luôn đi kèm
text hoặc icon, không được là tín hiệu duy nhất.

### 4.4 Chart colors

`--chart-1` đến `--chart-5` tạo ramp blue–indigo. Chart pass/fail dùng success
và danger semantic. Grid và axis dùng border/muted token, không thêm palette
trang trí riêng. Số liệu so sánh dùng `tabular-nums`.

### 4.5 Typography

| Role | Font | Mục đích |
| --- | --- | --- |
| UI sans | Geist | Navigation và control |
| Body | Plus Jakarta Sans | Nội dung dài và mô tả |
| Display | Outfit | Page/section heading |
| Mono | Geist Mono | ID, code và metric cần canh số |

Type scale mục tiêu:

| Role | Size | Weight |
| --- | --- | --- |
| Page title | 28–32px | 700 |
| Section title | 20–24px | 600–700 |
| Card title | 16–18px | 600–700 |
| KPI value | 28–36px | 700 |
| Body | 14–16px | 400–500 |
| Small | 12–13px | 400–500 |
| Micro | 10–11px | Chỉ cho dense label |

- Heading dùng `text-wrap: balance` hoặc tương đương khi có thể xuống dòng.
- Body dài dùng line-height tối thiểu 1.45.
- Uppercase và letter spacing rộng chỉ dành cho eyebrow, trạng thái ngắn hoặc
  table header; không dùng cho nội dung đọc dài.
- Loading copy kết thúc bằng ký tự ellipsis `…`, không dùng ba dấu chấm.

### 4.6 Radius

Radius gốc là `--radius: 0.625rem` (10px):

| Token | Kích thước | Vai trò |
| --- | --- | --- |
| `radius-sm` | 6px | Chi tiết nhỏ |
| `radius-md` | 8px | Compact control |
| `radius-lg` | 10px | Button/input mặc định |
| `radius-xl` | 14px | Raised control/small card |
| `radius-2xl` | 18px | Card và glass surface |
| `radius-3xl` | 22px | Hero/major panel |
| `radius-4xl` | 26px | Feature panel đặc biệt |

Không trộn nhiều card radius trong cùng một viewport. `rounded-full` chỉ dành
cho avatar, status dot, chip, segmented control hoặc hình tròn có chủ đích.

### 4.7 Spacing và layout

Base spacing là 4px; ưu tiên nhịp `4, 8, 12, 16, 20, 24, 32`.

- Card padding: 20–24px.
- Section gap: 16–24px.
- Label/icon/chip gap: 6–10px.
- Page container dùng wrapper chuẩn thay vì tự lặp max-width/padding.
- Dashboard KPI: 1 cột → 2 cột tại `md` → tối đa 4 cột tại `lg`.
- Split layout xếp chồng dưới `md`; table cho phép scroll ngang có kiểm soát.

Breakpoints theo Tailwind: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.

### 4.8 Elevation

| Tier | Shadow | Sử dụng |
| --- | --- | --- |
| e1 | `0 1px 2px rgba(0,0,0,.4)` | Card mặc định |
| e2 | `0 8px 24px rgba(0,0,0,.45)` | Popover/card hover |
| e3 | `0 24px 60px rgba(0,0,0,.55)` | Modal/sheet |
| glow | `0 8px 28px rgba(91,108,240,.35)` | CTA/focus đặc biệt |

Không tạo arbitrary shadow cho từng page. Shadow mới phải được đưa vào scale và
có semantic role rõ ràng.

## 5. App shell và navigation

Town Hown hỗ trợ hai layout mode do `data-ui-layout` điều khiển:

- Sidebar: navigation cố định/collapsible và sticky content header.
- Top navigation: floating navbar với khoảng trống đầu trang tương ứng.

Page không tự dựng shell. Sidebar, header, user menu, notification và breadcrumb
phải đi qua component dùng chung. Trạng thái collapse được lưu bằng cookie hiện có.

Z-index ladder:

| Tier | Giá trị | Dùng cho |
| --- | --- | --- |
| Base | `z-0`, `z-10` | In-flow content/card |
| Sticky | `z-20` | Sticky header/table column |
| Sidebar | `z-30` | Sidebar/rail |
| Floating nav | `z-40` | Top navigation |
| Overlay | `z-50` | Dialog, sheet, popover, tooltip |
| Toast | `z-[100]` | Toast/banner hệ thống |

Không tạo z-index trung gian tùy ý. Nested overlay phải dùng portal thay vì tăng
z-index vượt ladder.

## 6. Component guidelines

### Reuse-first

1. Tìm component trong `src/components/ui/` trước khi tạo mới.
2. Nếu gần phù hợp, mở rộng variant/prop của component hiện có.
3. Feature chỉ map dữ liệu và nghiệp vụ; không fork một primitive bằng chuỗi
   class dài trong page.
4. Shared component mới phải có semantic API, không nhận màu hex tùy ý nếu có
   thể nhận `tone`, `variant` hoặc `status`.

### Controls

- Action dùng `<button>`/`Button`; navigation dùng `<a>`/`Link`.
- Không dùng `div` hoặc `span` có `onClick` làm control.
- Button/icon button phải có accessible name; icon trang trí có `aria-hidden`.
- Touch target tối thiểu 36px, ưu tiên 40–44px trên mobile.
- Input phải có label liên kết, `name`, type/inputmode và autocomplete phù hợp.
- Focus dùng `focus-visible`; không xóa outline nếu không có ring thay thế.

### Cards và KPI

- Card chuẩn dùng surface token, border hairline và một radius nhất quán.
- KPI giữ label nhỏ, metric là phần lớn nhất, delta có icon/dấu và màu semantic.
- Metric so sánh dùng `tabular-nums` và chiều cao ổn định để tránh layout shift.
- Glass/gradient không được làm giảm độ tương phản của số liệu.

### Tables

- Dùng semantic `<table>`, header và caption phù hợp.
- Header có nhịp uppercase/letter spacing vừa phải.
- Row separator dùng `border-border`; status dùng shared status component.
- Cột số/thời gian canh phải và dùng `tabular-nums` khi cần so sánh.
- Dataset lớn phải có pagination hoặc virtualization.

### Overlay và feedback

- Dialog, sheet, popover, select và tooltip dùng primitive trong `ui/`.
- Modal/sheet phải giữ focus, khóa overscroll và đóng được bằng keyboard.
- Async update cần `aria-live="polite"` hoặc primitive đã cung cấp live region.
- Error đặt gần field, nói rõ cách sửa; destructive action cần confirm hoặc undo.
- Loading, empty, success và error là state bắt buộc của data surface.

## 7. Motion

- Micro interaction: khoảng 150ms.
- Enter/expand/overlay: 200–300ms.
- Ambient: 500–700ms và không ảnh hưởng thao tác.
- Chỉ animate `transform` và `opacity` khi có thể.
- Không dùng `transition-all`; liệt kê property thay đổi.
- Mọi motion không thiết yếu phải tắt hoặc giảm dưới
  `prefers-reduced-motion: reduce`.
- Animation lặp quá 5 giây phải có cơ chế pause/stop/hide hoặc bị loại bỏ.

## 8. Accessibility baseline

- WCAG AA cho text và control trên mọi surface được hỗ trợ.
- `#8B99B0` có thể dùng cho normal text trên surface hiện hành;
  `#5A6882` không dùng cho normal-size text nếu chưa tăng contrast.
- Heading có thứ bậc hợp lý và mỗi page có một `h1` rõ ràng.
- Có skip link tới main content trong app shell.
- Keyboard vận hành được navigation, menu, tab, form, table action và overlay.
- Không truyền đạt trạng thái chỉ bằng màu.
- Text dài phải wrap/truncate có chủ đích và vẫn truy cập được nội dung đầy đủ.
- Hình ảnh có `alt`, kích thước xác định và lazy-load khi ở dưới fold.
- Dark shell đặt `color-scheme: dark`; browser theme color khớp app canvas.

## 9. Responsive baseline

- `< 1024px`: sidebar chuyển rail hoặc off-canvas; KPI giảm cột.
- `< 768px`: split panel xếp dọc, secondary action đưa vào overflow menu,
  table scroll ngang và không làm tràn page.
- Full-bleed surface xử lý safe-area inset trên thiết bị có notch.
- Gesture phải có click/tap và keyboard alternative.
- Không dùng JavaScript đo layout khi flex/grid giải quyết được.

## 10. Migration contract

Source hiện tại còn nhiều literal color, arbitrary radius/shadow, component tự
dựng và visual alias gần trùng. Đây là nợ di trú, không phải tiền lệ cho code mới.

Khi chạm vào một feature:

1. Thay literal surface/text/border bằng semantic token tương ứng.
2. Hợp nhất status color qua `status-tone` và shared status component.
3. Thay control tự dựng bằng primitive chuẩn.
4. Kiểm tra focus, keyboard, reduced motion và contrast.
5. Chỉ thay đổi visual contract ngoài feature khi có quyết định thiết kế riêng.

Không sao chép giao diện từ `modules/` trong quá trình này.

## 11. Handoff checklist

- Dùng app shell, page container và page header chuẩn.
- Không thêm hex mới trong feature khi semantic token có thể sở hữu vai trò.
- Primary CTA, focus và selected state dùng primary semantic.
- Status dùng shared tone mapping và không dựa vào màu đơn độc.
- Typography đúng role; micro text và uppercase được giới hạn.
- Card/surface dùng radius và elevation scale nhất quán.
- Hover, active, focus-visible, disabled, loading, empty và error đều được thiết kế.
- Keyboard flow, label, accessible name, contrast và reduced motion đã kiểm tra.
- Desktop, tablet và mobile không có horizontal overflow ngoài table có chủ đích.
- UI của `modules/` không được dùng làm template cho `Frontend/`.

## 12. Quyết định còn mở

- Có tiếp tục tách app canvas `#121A2E` và immersive canvas `#0A0F1E` hay không.
- Có loại bỏ light token dormant hay phát triển thành theme được hỗ trợ.
- Thời điểm promote primary-light, AI violet, text-dim, success và warning thành
  semantic CSS token runtime.
