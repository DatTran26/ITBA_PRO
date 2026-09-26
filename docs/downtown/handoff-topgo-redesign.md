---
type: handoff
status: active
updated: 2026-09-16
scope:
  - ../../Frontend/
links:
  - design-tokens-topgo.md
  - design-guidelines-topgo.md
  - ../../Frontend/src/app/globals.css
  - ../../Frontend/src/components/ui/theme-scope.tsx
---

# Handoff — Chuyển giao diện ITBA sang chủ đề sáng TopGo

Tài liệu bàn giao cho người tiếp tục công việc. Đọc `design-tokens-topgo.md`
trước để biết token, `design-guidelines-topgo.md` để biết quy tắc.

## 1. Việc đã xong

| Màn hình | Route | Tình trạng |
|---|---|---|
| Trang giới thiệu | `/` | Xong. Viết lại toàn bộ, nội dung tiếng Việt. Đã xem ở 1440px và 400px. |
| Đăng nhập | `/login` | Xong. Đã xem bằng trình duyệt chưa đăng nhập. |
| Bảng điều hành | `/dashboard` | Xong. |
| Pipeline | `/dashboard/recruitment` | Xong. |
| Phân tích CV | `/dashboard/recruitment/[id]/cv-analyze` | Code đã chuyển màu, **chưa xem được bằng mắt** vì cơ sở dữ liệu đang có 0 ứng viên. |

**57 file thay đổi, khoảng 1.400 lượt đổi màu.** Phân bố: 26 file
`components/dashboard/`, 13 file `components/recruitment/`, 8 file
`components/ui/` (lớp vỏ điều hướng), 7 file `app/dashboard/`, cùng
`globals.css`, `layout.tsx`, `app/page.tsx`, `app/login/page.tsx`.

Màn ứng viên làm bài test (`/test/[token]`) **cố ý để ngoài phạm vi**, giữ nền
tối như cũ.

## 2. Cách tiếp cận, và vì sao chọn nó

Vấn đề gốc: app có khoảng **5.400 mã màu viết cứng trong 234 file**, chỉ 27 file
dùng token ngữ nghĩa. Đổi biến CSS thôi thì chỉ 27 file kia đổi theo.

Ba hướng đã cân nhắc:

1. Sửa cứng màu sáng vào component — hỏng 34 trang ngoài phạm vi vì chúng dùng
   chung component.
2. Bật sáng toàn app — quá lớn cho thời gian có, và 34 trang kia chưa được rà.
3. **Đã chọn:** cho component đọc token ngữ nghĩa, chủ đề do class trên nhánh
   cha quyết định.

Hướng 3 tốn công bằng hướng 1 nhưng sửa đúng gốc: component chạy đúng ở cả hai
chủ đề, và muốn mở rộng sang trang mới thì chỉ cần thêm route.

## 3. Ba file cần hiểu

| File | Vai trò |
|---|---|
| `Frontend/src/app/globals.css` | Khối `.tg` (token), `@layer utilities` (lớp tiện ích `.tg-*`), quy tắc `html:has(.tg)` |
| `Frontend/src/components/ui/theme-scope.tsx` | Quyết định route nào dùng chủ đề sáng, qua mảng `TG_ROUTES` |
| `Frontend/src/app/dashboard/layout.tsx` | Bọc `ThemeScope` ở ngoài cùng, gốc layout dùng `bg-background` |

## 4. Mở rộng sang trang mới

Bốn bước, không có bước ẩn:

1. Thêm regex route vào `TG_ROUTES` trong `theme-scope.tsx`.
2. Mở trang, tìm mã màu cứng còn lại:
   `grep -o '\[#[0-9A-Fa-f]\{6\}\]' <file> | sort | uniq -c | sort -rn`
3. Thay theo bảng chuyển đổi ở `design-guidelines-topgo.md` mục 2.
4. Mở trang ở 1440px và 400px, kiểm tra ngưỡng tiếp cận ở mục 6 của tài liệu đó.

Nếu trang vẫn còn mảng tối sau khi làm xong, chạy đoạn này trong console để tìm
phần tử tối còn sót:

```js
[...document.querySelectorAll('*')].filter(n => {
  const m = getComputedStyle(n).backgroundColor
    .match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return false;
  const a = m[4] === undefined ? 1 : +m[4];
  return a > 0.25 && (+m[1]*0.299 + +m[2]*0.587 + +m[3]*0.114) < 110;
}).map(n => n.className);
```

## 5. Việc còn lại

| Việc | Ghi chú |
|---|---|
| Xem và chỉnh màn phân tích CV | Cần tạo một ứng viên mẫu. Đây là màn khác biệt nhất của sản phẩm, đáng đầu tư nhất khi demo. |
| 19 mã màu cứng còn lại trong `/` và `/login` | Toàn bộ là màu thương hiệu TopGo dùng cho gradient trang trí (`#00a9ff`, `#89cff3`, `#a0e9ff`, `#cdf5fd`, `#0077cc`). Không gây lỗi tương phản. Có thể để nguyên. |
| Toast và Dialog | Render qua portal ở `body`, nằm ngoài nhánh `.tg` nên vẫn ăn màu tối. Không xuất hiện trong luồng demo. Khi cần, thêm class `.tg` vào container portal. |
| 34 trang còn lại | Vẫn nền tối, hoạt động bình thường. |
| Chế độ sáng/tối bật tắt được | TopGo có sẵn `body.dark`. `next-themes` đã cài nhưng chưa có `ThemeProvider`. Để dành đợt sau. |

## 6. Kiểm chứng đã chạy

- `npx tsc --noEmit` sạch.
- `npm run lint`: 34 lỗi trước và sau khi sửa, **không phát sinh lỗi mới** (đã
  đối chiếu bằng `git stash`). Số cảnh báo giảm từ 162 xuống 157.
- `npm run build` thành công.
- Ảnh chụp ở 1440px và 400px cho `/`, `/dashboard`, `/dashboard/recruitment`.
- `/dashboard/users` mở để xác nhận trang ngoài phạm vi vẫn tối nguyên vẹn.

## 7. Hai cái bẫy đã mất thời gian, đừng lặp lại

### 7.1 Đừng chạy `npm run build` khi dev server đang chạy

Nó ghi đè `.next` và làm CSS biên dịch mất hẳn khối `.tg`, khiến trang render
tối trong khi DOM và computed style đều báo sáng. Triệu chứng rất dễ gây lạc
hướng. Cách xử lý:

```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

Muốn build thì dừng dev server trước.

### 7.2 Mảng mờ trên nền tối trông như mảng tối

Nhiều container dùng nền mờ kiểu `bg-card/40`. Nếu phía sau còn một phần tử nền
tối chưa chuyển, chúng sẽ trông tối dù computed style báo màu trắng. Thủ phạm
trong đợt này là `bg-[#0A1120]` ở `app/dashboard/recruitment/page.tsx` và
`bg-[#0D1625]/90` trong thanh lọc. Dùng đoạn script ở mục 4 để tìm.

## 8. Lịch sử quyết định

Nhóm đã thử và loại hai hướng trước khi chốt TopGo:

1. **Cam cháy `#E8590C` trên nền kem `#FDF0E6`** — loại vì màu đối đầu teal
   `#0E5F63` bị đánh giá là chỏi với cam.
2. **Dashboard xanh dương kiểu PeopleFlow** — loại vì nhóm tìm được TopGo và
   muốn dùng lại chính ngôn ngữ hình ảnh của dự án mình.

Bản dựng trực quan của cả ba hướng: https://claude.ai/artifact/HxeaaLWa91JYqsKbZQUcNU
(nội dung hiện tại là hướng TopGo đã chốt).
