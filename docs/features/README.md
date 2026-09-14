# Tuyến tài liệu theo tính năng

Thư mục này chứa các bản nháp yêu cầu theo từng feature trong Feature Map của
[`../downtown/prd.md`](../downtown/prd.md). Đây là tài liệu mục tiêu để BA,
Product, Dev và QA cùng làm rõ trước khi triển khai; `status: draft` không phải
bằng chứng tính năng đã có trong source.

## Thứ tự đọc và quyền sở hữu

1. PRD sở hữu phạm vi sản phẩm, mức ưu tiên và các quyết định xuyên feature.
2. `brainstorms/*.md` ghi phương án khám phá, giả định và quyết định đang chờ
   owner xác nhận.
3. `{feature}-urd.md` sở hữu nhu cầu, hành trình và kết quả theo góc nhìn người
   dùng; không chứa thiết kế kỹ thuật.
4. `srs/{feature}-spec.md` sở hữu yêu cầu có thể kiểm thử, business rule, lỗi,
   dependency và tiêu chí thành công.
5. `srs/{feature}-erd.md` mô tả mô hình khái niệm phục vụ SRS; migration/schema
   trong source mới là nguồn chuẩn khi tính năng đã được triển khai.

Khi các nguồn mâu thuẫn, không tự hợp nhất âm thầm. Ghi rõ mâu thuẫn và đưa
quyết định về PRD hoặc đúng artifact đang sở hữu claim đó.

## Quy ước chất lượng

- Frontmatter phải có `type`, `feature`, `updated`; brainstorm, URD và SRS phải
  có thêm `status` và `links`.
- ID dùng prefix feature: `FR-{feature}-NNN`, `NFR-{feature}-NNN`,
  `BR-{feature}-NNN`, `E-{feature}-NNN`, `SC-{feature}-NN`.
- Mọi yêu cầu P0/P1/P2 phải có nguồn và cách xác minh. Giả định phải ghi rõ
  owner cần xác nhận và hệ quả nếu giả định sai.
- AI chỉ đề xuất; quyết định tuyển dụng, đánh giá, phân công, kỷ luật hoặc kết
  luận nhạy cảm phải có người đủ quyền xác nhận và có provenance/audit.
- Không ghi secret, giá trị `.env`, endpoint nội bộ hoặc dữ liệu thật vào tài
  liệu. Chỉ trỏ tới executable owner khi mô tả hành vi đã có trong code.
- Không để placeholder chưa phân loại như `TODO` hoặc `TBD` trong artifact bàn
  giao. Open Question có thể để checkbox rỗng, nhưng phải nêu owner cần quyết
  định và ảnh hưởng nếu chưa chốt.

## Kiểm tra trước khi bàn giao

Từ repository root:

```powershell
node plans/260914-prd-feature-pipeline/check-erd.mjs docs/features
rg -n "TODO|TBD|FIXME" docs/features
rg -n -- "- \[ \]" docs/features
```

Ngoài các kiểm tra cơ học, reviewer phải đối chiếu prose theo chuỗi
PRD -> brainstorm -> URD -> SRS -> ERD. Một lần chạy parser thành công không
chứng minh requirement đúng nghiệp vụ hoặc đủ nhánh error/edge.
