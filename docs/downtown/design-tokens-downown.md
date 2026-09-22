---
type: design-tokens
status: active
updated: 2026-09-16
scope:
  - ../../Frontend/src/app/globals.css
  - ../../Frontend/src/app/layout.tsx
links:
  - design-guidelines-topgo.md
  - handoff-topgo-redesign.md
  - design-guidelines.md
---

# TopGo Light — Design Token

Bảng token cho chủ đề sáng `.tg`, dùng cho các màn hình demo của ITBA. Giá trị
gốc lấy từ dự án TopGo (`~/Documents/TopGo/frontend/css/base.css`), giữ nguyên
tên biến để hai dự án nói cùng một ngôn ngữ.

**Nguồn sự thật là `Frontend/src/app/globals.css`, khối `.tg`.** Tài liệu này mô
tả ý nghĩa và ràng buộc; khi hai bên lệch nhau thì CSS đúng, tài liệu sai.

Chủ đề tối `.dark` vẫn là chủ đề mặc định của app và không đổi. Xem
`design-guidelines.md` cho chủ đề tối.

## 1. Cách chủ đề được gắn

`<html class="dark">` giữ nguyên trong `layout.tsx`. Biến CSS kế thừa theo cây
DOM, nên đặt class `.tg` ở gốc một nhánh sẽ ghi đè `.dark` trong đúng nhánh đó.

```
<html class="dark">          ← 34 trang còn lại vẫn tối
  └── <div class="tg">       ← nhánh này sáng
```

Danh sách route dùng `.tg` nằm trong `Frontend/src/components/ui/theme-scope.tsx`.
Thêm route mới = thêm một regex vào `TG_ROUTES`, không sửa gì khác.

## 2. Token gốc TopGo

| Biến | Giá trị | Vai trò |
|---|---|---|
| `--p1` | `#00a9ff` | Xanh thương hiệu. Mảng, biểu đồ, chuyển sắc, vòng focus. **Không** dùng làm nền cho chữ trắng. |
| `--p2` | `#89cff3` | Đầu nhạt của chuyển sắc, chữ nhấn trên nền đậm. |
| `--a1` | `#a0e9ff` | Viền phụ, icon mờ. |
| `--a2` | `#cdf5fd` | Nền chip icon, hàng đang chọn, nền ô trợ giúp. |
| `--bg` | `#f0faff` | Nền màn hình. |
| `--bg2` | `#f8fdff` | Nền nổi nhẹ. |
| `--stub` | `#f5fbfe` | Nền chìm, hàng chẵn, ô nhập. |
| `--tg-white` | `#ffffff` | Card, sidebar, thanh trên. |
| `--tg-border` | `#cde9f5` | Viền chuẩn 1px. |
| `--tg-border-light` | `#e5f3fa` | Viền phân cách bên trong card. |
| `--tg-text` | `#264e6b` | Chữ chính. |
| `--tg-muted` | `#6b8ca0` | Chữ phụ, nhãn, đơn vị. |
| `--tg-success` | `#2e7d64` | Đạt, tăng trưởng, hoàn tất. |
| `--tg-error` | `#d62929` | Lỗi, quá hạn, loại. |
| `--tg-gold` | `#ffb347` | Mảng cảnh báo, huy hiệu. |
| `--sh` / `--sh-m` / `--sh-l` | bóng `rgba(0,169,255,…)` | Ba mức đổ bóng ánh xanh. |
| `--t` | `0.2s cubic-bezier(.4,0,.2,1)` | Nhịp chuyển động chuẩn. |

## 3. Token bổ sung cho HRMS

TopGo là trang giới thiệu: nút to, chữ to, tương phản thấp không sao. HRMS có
bảng dày và chữ nhỏ, nên cần thêm các biến sau. **Đây là phần bắt buộc, không
phải tuỳ chọn.**

| Biến | Giá trị | Lý do tồn tại |
|---|---|---|
| `--p-deep` | `#0077cc` | Chữ trắng trên `--p1` chỉ đạt **2.36:1**, dưới chuẩn WCAG AA (4.5) rất xa. Trên `--p-deep` đạt **4.66:1**. Mọi nút, link, chữ xanh dùng biến này. |
| `--p-ink` | `#005fa3` | Trạng thái hover của `--p-deep`, và chữ xanh trên nền `--a2`. |
| `--tg-faint` | `#8ba9bd` | Chữ placeholder. Nhạt hơn `--tg-muted` nhưng vẫn đọc được. |
| `--ai` | `#7a5cf0` | **Tím là dấu hiệu của máy.** Mọi điểm và gợi ý do AI sinh ra. |
| `--ai-txt` | `#5b3fd1` | Bản đậm của tím, dùng cho chữ. |
| `--ai-bg` | `#efeafe` | Nền chip AI. |
| `--warn-txt` | `#a35b00` | `--tg-gold` không đủ tương phản để làm chữ. |
| `--warn-bg` | `#fff3e0` | Nền chip cảnh báo. |
| `--ok-bg` | `#e4f5ee` | Nền chip thành công. |
| `--err-bg` | `#fdeaea` | Nền chip lỗi. |
| `--cyan` / `--cyan-txt` / `--cyan-bg` | `#00bcd4` / `#00798a` / `#e0f7fa` | Bài test, kỹ năng kỹ thuật. |

### Quy tắc hai bản màu

Màu để **vẽ** và màu để **viết chữ** không thể là một. Mark trong biểu đồ chỉ
cần 3:1; chữ nhỏ cần 4.5:1. Dùng chung một mã thì chữ trạng thái sẽ mờ.

| Ý nghĩa | Bản vẽ (mảng, biểu đồ, chấm) | Bản chữ (nhãn, trạng thái) | Nền nhạt |
|---|---|---|---|
| Thương hiệu | `--p1` | `--p-deep` | `--a2` |
| AI | `--ai` | `--ai-txt` | `--ai-bg` |
| Thành công | `--tg-success` | `--tg-success` | `--ok-bg` |
| Cảnh báo | `--tg-gold` | `--warn-txt` | `--warn-bg` |
| Lỗi | `--tg-error` | `--tg-error` | `--err-bg` |
| Bài test | `--cyan` | `--cyan-txt` | `--cyan-bg` |

## 4. Ánh xạ sang token shadcn

Khối `.tg` ánh xạ toàn bộ biến shadcn, nhờ đó mọi utility có sẵn (`bg-card`,
`text-muted-foreground`, `border-border`…) tự đổi màu mà component không cần
biết mình đang ở chủ đề nào.

| Token shadcn | Trỏ tới | Token shadcn | Trỏ tới |
|---|---|---|---|
| `--background` | `--bg` | `--border` / `--input` | `--tg-border` |
| `--foreground` | `--tg-text` | `--ring` | `--p1` |
| `--card` / `--popover` | `--tg-white` | `--radius` | `18px` |
| `--primary` | `--p-deep` | `--sidebar` | `--tg-white` |
| `--primary-foreground` | `#ffffff` | `--sidebar-primary` | `--p-deep` |
| `--secondary` / `--muted` | `--stub` | `--sidebar-accent` | `--a2` |
| `--muted-foreground` | `--tg-muted` | `--chart-1..5` | `#00a9ff`, `#00bcd4`, `#7a5cf0`, `#2e7d64`, `#ffb347` |
| `--accent` | `--a2` | `--destructive` | `--tg-error` |

## 5. Token ngữ nghĩa dùng chung hai chủ đề

Bốn token này khai báo trong `@theme inline` và có giá trị riêng ở cả `.dark`
lẫn `.tg`. Chúng cho phép viết `text-ai`, `bg-success/10`, `border-l-warning`
mà không cần biết chủ đề.

| Utility | `.dark` | `.tg` |
|---|---|---|
| `*-ai` | `#B48EFF` | `#7a5cf0` |
| `*-success` | `#36DDAB` | `#2e7d64` |
| `*-warning` | `#FFB86C` | `#a35b00` |
| `*-danger` | `#FB7185` | `#d62929` |

## 6. Chữ

Nạp qua `next/font/google` trong `layout.tsx`, cả hai đều có subset
`vietnamese`.

| Biến | Font | Dùng cho |
|---|---|---|
| `--font-dela-gothic` | Dela Gothic One 400 | Tiêu đề lớn và con số lớn. Viết hoa. **Không** dùng trong bảng dữ liệu hay nhãn nhỏ. |
| `--font-josefin-sans` | Josefin Sans 300–700 | Toàn bộ nội dung trong nhánh `.tg`. |

Cal Sans (font tiêu đề phụ của TopGo) chưa có trong `next/font/google`, nên
`.tg-heading` dùng Josefin Sans 600 thay thế.

## 7. Bo góc và đổ bóng

| Biến | Giá trị | Dùng cho |
|---|---|---|
| `--r-s` | `8px` | Chip, tag nhỏ |
| `--r` | `10px` | Ô nhập, nút vuông |
| `--r-l` | `18px` | Card nhỏ, card ứng viên |
| `--r-xl` | `24px` | Card lớn, sidebar, thanh trên |
| (nút) | `999px` | Mọi nút chính và nút phụ đều bo tròn hoàn toàn |

Đổ bóng luôn ám xanh, không bao giờ dùng bóng đen thuần.

## 8. Lớp tiện ích

Khai báo trong `@layer utilities` của `globals.css`, chỉ dùng bên trong `.tg`.

| Class | Tác dụng |
|---|---|
| `.tg-card` | Nền trắng, viền `--tg-border`, bo 24px, bóng `--sh` |
| `.tg-card-sm` | Như trên nhưng bo 18px |
| `.tg-sunken` | Nền `--stub`, viền nhạt, bo 18px |
| `.tg-pill` | Nút chính: nền `--p-deep`, chữ trắng, bo tròn, bóng xanh |
| `.tg-pill-ghost` | Nút phụ: nền trắng, chữ `--p-deep`, viền |
| `.tg-nav-active` | Viên thuốc điều hướng đang chọn, chuyển sắc `--p1 → #0090dd` |
| `.tg-grad` | Nền chuyển sắc 135° của trang |
| `.tg-display` | Dela Gothic One, viết hoa, `line-height 1.14` |
| `.tg-heading` | Josefin Sans 600 |
| `.tg-ico` | Ô icon 40px bo 13px, dùng với cặp nền/chữ từ bảng ở mục 3 |

## 9. Hai cái bẫy đã gặp

1. **Không dùng `background-attachment: fixed` cho nền trang.** Nó chỉ phủ đúng
   một khung nhìn; phần trang phía dưới sẽ lộ nền tối của `.dark`.
2. **Sơn lại gốc tài liệu.** `<body>` vẫn mang nền tối của `.dark`, lộ ra ở rìa
   và vùng overscroll. Quy tắc `html:has(.tg), body:has(.tg)` trong `globals.css`
   xử lý việc này.
