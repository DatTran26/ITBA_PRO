---
type: design-guidelines
status: active
updated: 2026-09-16
scope:
  - ../../Frontend/src/app/page.tsx
  - ../../Frontend/src/app/login/
  - ../../Frontend/src/app/dashboard/
links:
  - design-tokens-topgo.md
  - handoff-topgo-redesign.md
  - design-guidelines.md
---

# TopGo Light — Quy tắc sử dụng

Tài liệu này sở hữu **WHY và quy tắc**; giá trị token nằm ở
`design-tokens-topgo.md`; hành vi runtime nằm ở `globals.css`.

Bối cảnh: nhóm muốn một giao diện sáng và nhiều màu hơn để gây ấn tượng với ban
giám khảo, lấy nguyên ngôn ngữ hình ảnh của dự án TopGo. Nhưng TopGo là trang du
lịch còn ITBA là phần mềm làm việc, nên có những chỗ hai bên bắt buộc phải khác
nhau. Đó là nội dung chính của tài liệu này.

## 1. Bốn quy tắc màu

### 1.1 Chỉ xanh dương mới được bấm

Mọi thứ mang màu xanh đặc là hành động. Không tô xanh cho thứ chỉ để đọc.
**Mỗi màn hình chỉ có một nút xanh đặc**; nếu thấy hai nút xanh cạnh nhau nghĩa
là chưa quyết được đâu là việc chính.

### 1.2 Tím là dấu hiệu của máy

Điểm AI, gợi ý AI, nhãn AI đều mang màu tím (`--ai`). Người dùng nhìn màu là biết
đâu là số máy chấm, đâu là số người nhập. Tím không có trong bảng màu TopGo gốc,
đây là phần thêm riêng cho ITBA và là chi tiết nhận diện của sản phẩm.

### 1.3 Đỏ chỉ có nghĩa là hỏng hoặc trễ

Không dùng đỏ để trang trí hay làm nổi. Nếu một màn hình có quá ba chỗ đỏ thì
màn hình đó đang báo rằng có việc cần xử lý gấp.

### 1.4 Chữ màu luôn dùng bản đậm

Xem bảng hai bản màu ở `design-tokens-topgo.md` mục 3. Dùng nhầm bản vẽ cho chữ
là lỗi tiếp cận, không phải lỗi thẩm mỹ.

## 2. Không viết mã màu vào component

Đây là quy tắc quan trọng nhất về kỹ thuật.

```tsx
// Sai — component tự quyết định chủ đề, hỏng khi đổi nền
<div className="bg-[#161E30] text-[#ECF0F7] border-[#8B99B0]/10">

// Đúng — component đọc token, chủ đề do nhánh cha quyết định
<div className="bg-card text-foreground border-border/10">
```

Bảng chuyển đổi khi gặp mã cũ:

| Mã tối cũ | Thay bằng | Mã tối cũ | Thay bằng |
|---|---|---|---|
| `#ECF0F7` | `text-foreground` | `#5B6CF0`, `#7C8FFF` | `*-primary` |
| `#8B99B0`, `#5A6882` | `text-muted-foreground` | `#B48EFF`, `#8B5CF6` | `*-ai` |
| `#121A2E`, `#0F172A` | `bg-background` | `#36DDAB`, `#10B981`, `#22C55E` | `*-success` |
| `#161E30`, `#111827` | `bg-card` | `#FFB86C`, `#F59E0B`, `#F97316` | `*-warning` |
| `#1B2540`, `#1B253B` | `bg-muted` | `#FB7185`, `#EF4444`, `#FF6B82` | `*-danger` |
| `#212C4A`, `#222C4A` | `bg-accent` | viền bất kỳ | `border-border` |

Với màu truyền qua props hoặc inline style (biểu đồ, chấm trạng thái), dùng
chuỗi `"var(--success)"` thay vì `"#36DDAB"`.

Hai cạm bẫy không nằm trong bảng trên, nhưng hỏng y hệt trên nền sáng:

- **`text-white` đứng một mình** là chữ trắng trên nền trắng. Chỉ giữ `text-white`
  khi chính phần tử đó có nền màu đặc (`bg-primary`, `bg-success`, ...). Các
  trường hợp còn lại dùng `text-foreground`. Tương tự, `bg-white/5` và
  `border-white/10` vốn là mặt phẳng nổi của chủ đề tối, ở nền sáng chúng biến
  mất — thay bằng `bg-muted` và `border-border`.
- **Gradient chữ trong suốt** (`WebkitTextFillColor: "transparent"` cộng
  `linear-gradient` từ `#ECF0F7` tới `#8B99B0`) làm tiêu đề vô hình hoàn toàn.
  Bỏ gradient, dùng `text-foreground`.

Lợi ích kép: component chạy đúng ở **cả hai** chủ đề, và khi muốn mở rộng chủ đề
sáng sang trang mới thì không phải sửa lại component.

## 3. Bố cục

- **Nền trang** luôn là dải chuyển sắc 135° trắng xanh, không phải màu phẳng.
- **Card nổi trên nền**, viền 1px và bóng ám xanh rất nhẹ. Không dùng bóng đen.
- **Sidebar là card trắng bo tròn**, không phải mảng đặc chạm mép màn hình.
- **Mục điều hướng đang chọn** là viên thuốc chuyển sắc xanh, chữ trắng.
- **Nút bo tròn hoàn toàn** (`999px`), cả nút chính lẫn nút phụ.

## 3b. Khung bốn tầng của một trang chức năng

Mọi trang dưới `/dashboard` xếp theo đúng thứ tự này. Mục đích: bấm vào một tab
là thấy ngay số liệu, không phải cuộn.

```
SharedDashboardPageHeader   tiêu đề + nút hành động
KpiCardGrid                 hàng thẻ số, xl:grid-cols-6
OverviewBand                dải biểu đồ, lg:grid-cols-3
<nội dung>                  bảng, kanban, hoặc danh sách
```

Không trang nào tự dựng `<h1>` riêng nữa. Nếu cần thêm nút, truyền qua prop
`actions` của `SharedDashboardPageHeader`.

**Chỉ thêm hai tầng giữa khi trang thật sự có số liệu tổng hợp.** Các trang
`ocr`, `interview-room`, `users`, `versions` không có, và để trống là đúng: bịa
một chỉ số để lấp chỗ còn tệ hơn là bỏ trống.

### Bốn primitive biểu đồ

Nằm ở `Frontend/src/components/charts/`. Không thêm thư viện biểu đồ nào.

| Primitive | Dùng khi |
|---|---|
| `DonutStat` | chia một tổng thành vài phần (trạng thái, vòng phỏng vấn) |
| `MiniBar` | so sánh vài chuỗi theo thời gian (đạt/không đạt theo tháng) |
| `HBarList` | xếp hạng, nhãn dài (kỹ năng thiếu hụt, số người theo nhóm) |
| `Sparkline` | chỉ cần thấy xu hướng, không cần đọc giá trị (CV nộp theo ngày) |

Cả bốn nhận màu qua props dạng `"var(--success)"`, có sẵn empty state, và dùng
chung khung `ChartFrame` nên không cái nào tự dựng card riêng.

### Độ trong suốt

Không nối alpha vào mã màu (`${color}30`) — cách đó vỡ ngay khi `color` là
`var(--token)`. Dùng `alpha(color, percent)` trong `lib/utils.ts`, nó bọc
`color-mix()` và chạy với cả hex lẫn `var()`.

## 4. Chữ

- Dela Gothic One **chỉ** cho tiêu đề và con số lớn, luôn viết hoa. Font này rất
  nặng nét; đặt vào bảng dữ liệu hay nhãn nhỏ là không đọc được.
- Nội dung, bảng, nhãn dùng Josefin Sans.
- Số liệu xếp cột dùng `tabular-nums`.

## 5. Bỏ hình trang trí ở màn hình làm việc

Mây, vali, vé máy bay hợp với trang du lịch. Ở dashboard và pipeline chúng che
dữ liệu. Chỉ trang giới thiệu được giữ mảng nền mềm; các màn còn lại để trống.

## 6. Ngưỡng tiếp cận bắt buộc

Kiểm tra trước khi coi một màn hình là xong:

- Chữ trên nút chính ≥ **4.5:1**. Đây là lý do `--p-deep` tồn tại.
- Chữ trong mọi chip trạng thái ≥ **4.5:1**.
- Placeholder và chữ trợ giúp ≥ **4.5:1**.
- Mark trong biểu đồ ≥ **3:1** so với nền.
- Vòng focus luôn nhìn thấy được, dùng `--ring`.

Số đo đã xác minh: `#264e6b` trên trắng = 8.1:1. `#6b8ca0` trên trắng = 5.1:1.
Trắng trên `#0077cc` = 4.66:1. Trắng trên `#00a9ff` = **2.36:1, không đạt**.

## 7. Tiếng Việt

Toàn bộ chuỗi hiển thị viết bằng tiếng Việt. Kiểm tra dấu ở tiêu đề Dela Gothic
One, đặc biệt các chữ có dấu chồng như "Ứng viên", "Phỏng vấn", "Đề xuất".
Trước khi ship, đọc lại mọi chuỗi hiển thị và bỏ những câu tiếng Anh kiểu
"Neural System Online" còn sót từ giao diện cũ.

## 8. Tiêu chí review

Một pull request chạm vào giao diện trong nhánh `.tg` cần trả lời được:

1. Có mã màu cứng nào mới không? Nếu có, vì sao không dùng token?
2. Màn hình có đúng một nút xanh đặc không?
3. Mọi số do AI sinh ra có mang màu tím không?
4. Đã xem ở 1440px và 400px chưa?
5. Trang ngoài phạm vi có còn tối không? (mở `/dashboard/users` để đối chiếu)
