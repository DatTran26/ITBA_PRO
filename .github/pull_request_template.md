## Outcome

## Branch

- Source:
- Target: `develop` (personal/feature) or `main` (release/hotfix only)

Valid flows:

- `develop-<member>` or `feature/<slug>` → `develop`
- `develop` or `hotfix/<slug>` → `release/<version>`
- `release/<version>` or `hotfix/<slug>` → `main`

## Checks

- [ ] No secrets committed
- [ ] Source and target branches follow the valid flows above
- [ ] Tests / hygiene considered

## Notes
