# Cẩm nang Git Toàn tập: GitHub & GitLab (Chuyên sâu)

> **Tài liệu tham khảo.** GitFlow bắt buộc của Town Hown nằm ở
> [`../../AGENTS.md`](../../AGENTS.md); khi có mâu thuẫn, `AGENTS.md` thắng.

Tài liệu này cung cấp đầy đủ các lệnh Git từ cơ bản đến nâng cao, được thiết kế riêng cho việc quản lý dự án ITBAAI trên cả **GitHub** (Lưu trữ chính) và **GitLab** (Triển khai VPS).

---

## 1. Các lệnh Cơ bản (Hàng ngày)

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `git status` | Kiểm tra trạng thái các file (đã sửa, đã stage, hay chưa track). |
| `git add .` | Đưa toàn bộ thay đổi vào "vùng chờ" (Staging area). |
| `git commit -m "mô tả"` | Lưu lại các thay đổi vào lịch sử kèm thông điệp. |
| `git log --oneline` | Xem lịch sử commit rút gọn. |

---

## 2. Quản lý Đa Remote (GitHub & GitLab)

Khi bạn dùng dự án này với 2 remote: `origin` (GitHub) và `gitlab` (GitLab).

### Đẩy code (Push)
- Đẩy lên GitHub: `git push origin [tên-nhánh]`
- Đẩy lên GitLab: `git push gitlab [tên-nhánh]`
- Đẩy lên cả hai (nếu đã gộp URL): `git push origin [tên-nhánh]`

### Lấy code (Pull/Fetch)
- Lấy code và gộp từ GitHub: `git pull origin main`
- Lấy code và gộp từ GitLab: `git pull gitlab main`
- Chỉ lấy thông tin, không gộp: `git fetch --all`

---

## 3. Làm việc với Nhánh (Branching)

Sử dụng nhánh giúp bạn phát triển tính năng mới mà không làm hỏng code đang chạy ổn định.

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `git branch` | Xem danh sách các nhánh hiện có. |
| `git checkout -b [tên-nhánh]` | Tạo nhánh mới và chuyển sang nhánh đó ngay. |
| `git checkout [tên-nhánh]` | Chuyển đổi giữa các nhánh. |
| `git merge [tên-nhánh]` | Gộp code từ nhánh khác vào nhánh hiện tại. |
| `git branch -d [tên-nhánh]` | Xóa một nhánh (sau khi đã gộp xong). |

---

## 4. Xử lý Xung đột (Conflict Resolution)

Xảy ra khi bạn và người khác (hoặc chính bạn trên 2 nền tảng) sửa cùng một dòng code.

1.  **Bước 1**: Git báo lỗi khi Pull/Merge -> Mở file bị lỗi (sẽ thấy các ký hiệu `<<<<`, `====`, `>>>>`).
2.  **Bước 2**: Giữ lại code đúng, xóa các ký hiệu của Git.
3.  **Bước 3**: `git add [file-đã-sửa]`
4.  **Bước 4**: `git commit -m "fix: resolve merge conflict"`

---

## 5. Các Lệnh Nâng cao (Cứu nguy)

### Lưu tạm thời (Stash)
Khi bạn đang code dở nhưng cần chuyển nhánh gấp để fix bug:
- `git stash`: Cất code đang làm dở vào "kho tạm".
- `git stash pop`: Lấy code từ kho tạm ra để làm tiếp.

### Quay ngược thời gian (Reset/Revert)
- `git commit --amend`: Sửa nội dung commit cuối cùng (nếu chưa push).
- `git reset --hard HEAD~1`: Xóa bỏ hoàn toàn commit cuối cùng (Cẩn thận!).
- `git revert [mã-commit]`: Tạo một commit mới để đảo ngược một commit cũ (An toàn hơn Reset).

### Lấy commit cụ thể (Cherry-pick)
- `git cherry-pick [mã-commit]`: Chỉ lấy 1 commit duy nhất từ nhánh khác đưa vào nhánh hiện tại.

---

## 6. Quy trình chuẩn cho Dự án ITBAAI

Để hệ thống hoạt động trơn tru, hãy tuân thủ trình tự sau:

1.  **Bắt đầu ngày mới**:
    ```bash
    git pull origin main  # Lấy code mới nhất từ GitHub
    ```
2.  **Làm việc**: Code, sửa lỗi...
3.  **Lưu lại**:
    ```bash
    git add .
    git commit -m "feat: mô tả tính năng vừa làm"
    ```
4.  **Đưa lên GitHub (Lưu trữ)**:
    ```bash
    git push origin main
    ```
5.  **Đưa lên GitLab (Triển khai VPS)**:
    ```bash
    git push gitlab main
    ```

---

## 7. Các tiện ích khác

- **Đổi tên Remote**: `git remote rename origin old-origin`
- **Xóa Remote**: `git remote remove gitlab`
- **Xem cấu hình**: `git config --list`

> [!IMPORTANT]
> Luôn sử dụng `git status` trước bất kỳ lệnh nào khác để biết bạn đang đứng ở đâu và code đang ở trạng thái nào.
