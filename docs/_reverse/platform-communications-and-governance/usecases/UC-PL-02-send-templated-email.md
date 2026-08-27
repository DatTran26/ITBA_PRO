# UC-PL-02 — Gửi email có template

- **Actor:** Authorized staff.
- **Flow:** chọn recipients/template → validate/render → đọc SMTP credential ở
  server → send → ghi email log → trả partial/success result.
- **Security:** Không trả password plaintext; bulk send cần giới hạn/idempotency.
- **Evidence:** email send/send-bulk/templates/SMTP routes và email migrations.
