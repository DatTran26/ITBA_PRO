# Hướng dẫn Chuyên sâu: Triển khai ITBAAI lên VPS với GitLab CI/CD

> **Runbook hỗ trợ.** Pipeline/config hiện tại và
> [`deployment-guide.md`](deployment-guide.md) là authority. Không coi claim
> “hoàn thiện 100%” bên dưới là bằng chứng production readiness.

Tài liệu này hướng dẫn cách sử dụng hệ thống CI/CD tự động mà tôi đã cấu hình để đưa dự án ITBAAI lên VPS mỗi khi bạn đẩy code lên GitLab.

## 1. Luồng hoạt động (Workflow)

Hệ thống hoạt động theo mô hình **Push-to-Deploy**:

1. **Developer**: Bạn `git push` code lên nhánh `main` trên GitLab.
2. **GitLab Build Stage**: Hệ thống tự động đọc file `Dockerfile`, đóng gói ứng dụng thành một "Docker Image" và đẩy vào kho lưu trữ (GitLab Container Registry).
3. **GitLab Deploy Stage**: GitLab dùng SSH để đăng nhập vào VPS của bạn, tải (pull) bản image mới nhất về và khởi động lại container bằng Docker Compose.

---

## 2. Chuẩn bị VPS (Một lần duy nhất)

Trước khi hệ thống CI/CD có thể hoạt động, bạn cần chuẩn bị môi trường trên VPS:

### Bước 1: Cài đặt Docker

```bash
# Cài đặt docker trên VPS (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Bước 2: Tạo thư mục chứa app

```bash
mkdir -p /app/itba-ai
cd /app/itba-ai
```

### Bước 3: Tạo file .env và docker-compose.yml trên VPS

Bạn cần tạo sẵn file `.env` trên VPS vì GitLab sẽ không gửi file này qua (để bảo mật):

```bash
nano .env
# Dán các biến như NEXT_PUBLIC_SUPABASE_URL, OPENAI_API_KEY... vào đây
```

Và tạo file `docker-compose.yml` (Nội dung tương tự như file trong code):

```bash
nano docker-compose.yml
```

---

## 3. Thiết lập SSH để GitLab kết nối VPS

Để GitLab CI/CD có thể login vào VPS, bạn cần tạo một cặp SSH Key:

1. **Trên máy cá nhân (hoặc VPS)**: Chạy lệnh `ssh-keygen -t rsa -b 4096`. Nhấn Enter hết để lưu vào `~/.ssh/id_rsa`.
2. **Trên VPS**: Truy cập file `~/.ssh/authorized_keys` và dán nội dung của file public key (`id_rsa.pub`) vào cuối file.
3. **Trên GitLab**: Bạn sẽ dùng nội dung của file private key (`id_rsa`) cho biến `SSH_PRIVATE_KEY`.

---

## 4. Cấu hình CI/CD Variables trên GitLab

Vào Project của bạn trên GitLab -> **Settings** -> **CI/CD** -> **Variables**. Thêm 5 biến sau:

| Biến | Giá trị ví dụ | Ý nghĩa |
| :--- | :--- | :--- |
| **`SSH_PRIVATE_KEY`** | `-----BEGIN RSA PRIVATE KEY-----...` | Nội dung file `id_rsa` bạn vừa tạo. |
| **`VPS_IP`** | `123.456.78.9` | Địa chỉ IP của VPS của bạn. |
| **`VPS_USER`** | `root` hoặc `ubuntu` | Tên người dùng để SSH vào VPS. |
| **`CI_REGISTRY_USER`** | (Tự động có) | Thường là `your-gitlab-username`. |
| **`CI_REGISTRY_PASSWORD`** | (Tự động có) | Token đăng nhập registry (GitLab tự cấp). |

---

## 5. Cài đặt Nginx làm Reverse Proxy (HTTPS)

Để ứng dụng có thể truy cập qua tên miền (ví dụ: `itbaai.vn`), hãy dùng Nginx:

1. **Cài đặt**: `sudo apt install nginx`
2. **Cấu hình**: `sudo nano /etc/nginx/sites-available/itbaai`

```nginx
server {
    listen 80;
    server_name itbaai.vn; # Thay bằng domain của bạn

    location / {
        proxy_pass http://localhost:3000; # Container port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Kích hoạt & SSL**:
    - `sudo ln -s /etc/nginx/sites-available/itbaai /etc/nginx/sites-enabled/`
    - `sudo service nginx restart`

# 1. Cài đặt Certbot và plugin cho Nginx

apt update
apt install certbot python3-certbot-nginx -y

# 2. Chạy lệnh cấp chứng chỉ (Nhớ gõ đúng CERTBOT)

certbot --nginx -d testhub.hitek.com.vn

---

## 6. Kiểm tra & Bảo trì

Sau khi build hoàn tất trên GitLab, bạn có thể kiểm tra trạng thái trên VPS:

- **Xem log ứng dụng**:

    ```bash
    cd /app/itba-ai
    docker compose logs -f itba-ai
    ```

- **Kiểm tra container đang chạy**:

    ```bash
    docker ps
    ```

- **Nếu cần khởi động lại thủ công**:

    ```bash
    docker compose restart itba-ai
    ```

> [!TIP]
> Nếu build thất bại trên GitLab, hãy kiểm tra tab **CI/CD -> Jobs**. Thường là do lỗi SSH hoặc thiếu quyền ghi file trên VPS.

Tài liệu này mô tả runbook tham khảo; production readiness chỉ được xác nhận bằng
pipeline, smoke checks, backup/rollback và ownership vận hành thực tế.
