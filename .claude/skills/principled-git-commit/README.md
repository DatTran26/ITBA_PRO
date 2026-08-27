# principled-git-commit

English-only vendor copy of [rhino-ty/principled-git-commit](https://github.com/rhino-ty/principled-git-commit) for down-town.

Skip this skill when `ak:git` is present. Without `ak:git`, use this skill for atomic commits and secret blocking, then `caveman-commit` for the subject line (≤50).

This copy does **not** include `lang/ko` or non-English trigger lists. Commit subjects and bodies stay English. Project dialect: [`docs/features/references/COMMIT.md`](../../docs/features/references/COMMIT.md).

## What it adds on top of Conventional Commits

- Five principles: atomic, leaves-repo-green, why-over-what, imperative, searchable
- Five-step workflow: diff inspection → staging → type tree → secrets blocklist → checklist
- Breaking change / revert / amend protocols
- Dialect file for project-specific nouns and trailers

## Layout

```text
principled-git-commit/
├── SKILL.md
├── templates/
├── scripts/
├── references/
└── examples/
```

## Source attribution

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- Tim Pope, [A Note About Git Commit Messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
- `github/awesome-copilot@git-commit`
