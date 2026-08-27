# Evidence matrix — Platform, communications và governance

| Requirement | Code | Schema/ops | Confidence |
| --- | --- | --- | --- |
| FR-PL-01 | middleware/auth helpers | users/RLS | High |
| FR-PL-02 | settings route | system_settings + RLS | High |
| FR-PL-03 | email routes/helpers | templates/config/logs | High |
| FR-PL-04 | SMTP credential helper | encryption RPC | High |
| FR-PL-05 | version routes/UI | versions/read markers | High |
| FR-PL-06 | activity route | activity_logs + RLS | High |

Validation evidence: `npm run build` pass sau folder split. `npm run lint` thực
thi nhưng fail do source baseline; các warning overrides có sẵn được giữ nguyên,
không hạ thêm rule để giả pass.
