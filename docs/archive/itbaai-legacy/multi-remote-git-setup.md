# Hướng dẫn: Thiết lập và Quản lý Đa nền tảng (GitHub & GitLab)

> **Tài liệu tham khảo.** Không thay remote/push target nếu chưa xác minh với
> [`../../AGENTS.md`](../../AGENTS.md) và repository config hiện tại.

Tài liệu này hướng dẫn cách kết cấu dự án ITBAAI để có thể lưu trữ đồng thời trên GitHub (Cộng tác) và GitLab (CI/CD để Deploy VPS).

## 1. Tại sao cần dùng cả GitHub và GitLab?

Sử dụng song song hai nền tảng mang lại các lợi thế:
- **Dự phòng (Redundancy)**: Nếu một trang web bảo trì, bạn vẫn có trang kia để làm việc.
- **Tối ưu hóa tính năng**:
  - Dùng **GitHub** làm kho lưu trữ chính vì sự phổ biến, dễ cộng tác.
  - Dùng **GitLab** như một "Công cụ triển khai" (Deployment Tool) vì hệ thống CI/CD mạnh mẽ và Registry miễn phí.

---

## 2. Thiết lập Remotes (Phương pháp 1: Tách biệt)

Đây là cách an toàn và rõ ràng nhất để kiểm soát code đi về đâu.

### Bước 1: Thêm Remote GitLab
Giả sử bạn đã có dự án trên GitHub (tên mặc định là `origin`). Hãy thêm URL của GitLab:
```bash
git remote add gitlab https://gitlab.com/your-username/itba-ai.git
```

### Bước 2: Kiểm tra cấu hình
```bash
git remote -v
```
Kết quả mong đợi:
```text
origin  https://github.com/user/itba-ai.git (fetch)
origin  https://github.com/user/itba-ai.git (push)
gitlab  https://gitlab.com/user/itba-ai.git (fetch)
gitlab  https://gitlab.com/user/itba-ai.git (push)
```

### Bước 3: Cách làm việc hàng ngày
- **Lấy code mới** (thường từ nơi chính - GitHub):
  `git pull origin main`
- **Đẩy code lên GitHub**:
  `git push origin main`
- **Đẩy code lên GitLab** (Kích hoạt CI/CD deploy VPS):
  `git push gitlab main`

---

## 3. Thiết lập Remotes (Phương pháp 2: Đẩy đồng thời)

Dùng khi bạn muốn "Một bước lên trời" - một lệnh đẩy code lên cả hai nơi.

### Bước 1: Thêm cả hai URL vào remote `origin`
```bash
# Xóa URL đẩy mặc định
git remote set-url --add --push origin https://github.com/user/itba-ai.git
# Thêm URL đẩy GitLab
git remote set-url --add --push origin https://gitlab.com/user/itba-ai.git
```

### Bước 2: Kiểm tra lệnh
Bây giờ, khi bạn gõ:
```bash
git push origin main
```
Git sẽ liệt kê cả hai nền tảng:
```text
Everything up-to-date (GitHub)
Everything up-to-date (GitLab)
```

---

## 4. Quy trình đề xuất cho ITBAAI

Để tránh xung đột, hãy tuân thủ quy trình sau:

1.  **Code & Commit**: Thực hiện thay đổi trên máy local.
2.  **Pull origin**: Luôn chạy `git pull origin main` trước khi push để đảm bảo không có thay đổi nào bị bỏ sót từ đồng nghiệp (nếu có).
3.  **Push origin**: Đẩy code lên GitHub để lưu trữ và cộng tác.
4.  **Push gitlab**: Đẩy code lên GitLab để hệ thống CI/CD tự động build và đưa lên VPS.

---

## 5. Xử lý lỗi phổ biến

### Lỗi Auth (Authentication failed)
- Nếu bạn dùng HTTPS, hãy đảm bảo đã cài đặt **Personal Access Token** (PAT) cho cả hai nền tảng nếu mật khẩu bình thường không hoạt động.
- Khuyên dùng: **SSH Key** để đăng nhập không cần mật khẩu cho cả hai.

### Lỗi Conflict (Rejected)
Nếu bạn lỡ tay sửa code trực tiếp trên GitLab (hoặc GitHub) thông qua giao diện Web:
1.  `git fetch --all`
2.  `git merge origin/main` (hoặc `gitlab/main`)
3.  Xử lý xung đột tay và commit lại.

---

> [!TIP]
> Hãy coi **GitHub** là "Trung tâm phát triển" (Development Hub) và **GitLab** là "Cỗ máy triển khai" (Deployment Engine) cho VPS của bạn.
