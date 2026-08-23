# Contributing

- Default branch: `main` (production).
- Integration branch: `develop` (GitFlow).
- Work on `develop-<name>` (or `developN`), then open a PR into `develop`.
- Do not push or PR personal branches into `main`.
- Cut `release/x.y.z` from `develop` when shipping. Hotfix from `main`.
- The `branch-policy` workflow blocks invalid source/target combinations and comments with the correction.
- Do not commit `.env` or secrets.
- Commit messages: English Conventional Commits. Prefer `ak:git` if present; else `.claude/skills/principled-git-commit` + `.claude/skills/caveman-commit` (subject ≤50, no emoji, no AI trailer).
- Releases: update `CHANGELOG.md` + `docs/releases/x.y.z.md`, merge `release/x.y.z` to `main`, then GitHub Release (`create-release.ps1` or `ak:ship official` + `gh release`).

## Pull request branch policy

| Pull request target | Allowed source branches |
| --- | --- |
| `develop` | `develop-dat`, `develop-hieu`, `develop-kien`, `develop-thanh`, `feature/<slug>` |
| `main` | `release/<version>`, `hotfix/<slug>` |

The policy workflow is a required check once enabled in the GitHub ruleset. A personal or feature branch targeting `main` will fail and receive an explanatory comment.
