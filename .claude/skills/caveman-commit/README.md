# caveman-commit

Terse English Conventional Commits. Why over what.

This folder is a down-town vendor copy of [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman). Skip it when `ak:git` is present.

## What it does

Generates commit messages in Conventional Commits format. Subject ≤50 chars, hard cap 72. Imperative mood. English only. Body only when the *why* is non-obvious or there are breaking changes. No AI attribution, no "this commit does X", no emoji. Body always required for breaking changes, security fixes, data migrations, and reverts.

Outputs only the message. Does not stage, commit, or amend.

## How to invoke

```text
/caveman-commit
```

Also triggers on "write a commit", "commit message", "generate commit" — unless `ak:git` is installed.

## See also

- [`SKILL.md`](./SKILL.md) — agent instructions
- [`../principled-git-commit`](../principled-git-commit) — atomic split and secret blocklist
- [`../../docs/features/references/COMMIT.md`](../../docs/features/references/COMMIT.md) — project dialect
