# Chính sách version và release

## Nguồn chuẩn

- Version ứng dụng: trường `version` trong [`../package.json`](../package.json).
- Lockfile phải đồng bộ với manifest.
- Manifest khai báo `npm run version`, nhưng script target không tồn tại; lệnh
  này đang không khả dụng.
- [`.gitlab-ci.yml`](../.gitlab-ci.yml) là pipeline legacy chưa được nối vào root
  single-repo và không phải release authority vận hành.
- GitFlow cấp workspace: [`../../AGENTS.md`](../../AGENTS.md).

## SemVer

Dùng `MAJOR.MINOR.PATCH`:

- MAJOR: thay đổi contract không tương thích.
- MINOR: capability tương thích ngược.
- PATCH: sửa lỗi/tài liệu/nội bộ không phá contract.

Không bump version chỉ vì phase document hoàn tất; version phản ánh artifact
được release.

## Quy trình

1. Xác nhận scope và validation của release.
2. Cập nhật manifest/lockfile bằng tool được xác minh. Không dùng
   `npm run version` cho đến khi script target được phục hồi hoặc manifest sửa.
3. Kiểm tra diff không chứa `.env`, key, credential, build output hoặc unrelated
   changes.
4. Chạy lint/build và checks phù hợp risk.
5. Theo GitFlow workspace: personal/feature -> `develop`, cắt `release/x.y.z`,
   sau đó mới hợp nhất vào `main` theo authority gốc.
6. Pipeline GitLab legacy nằm ngoài root discovery, giả định app ở repo root và
   chỉ lắng nghe branch tên chính xác `release`. Cần sửa discovery/include,
   working directory và trigger `release/x.y.z` trước khi coi là automation.
7. Tag/publish chỉ sau khi commit và artifact đã được xác minh.

## Changelog và release notes

Changelog là release evidence, không phải architecture/product authority. Chỉ
ghi thay đổi user-visible hoặc maintainer-relevant đã thực sự có trong release;
không dùng nhãn phase/AI-generated attribution trong message.

## Trạng thái tích hợp

Source ứng dụng đã được nhập trực tiếp vào repository Town Hown. Version/tag
phải tuân theo GitFlow gốc. Không tự động merge/tag/push cho đến khi version
script và CI wiring/security được sửa, rồi release owner xác nhận validation.
