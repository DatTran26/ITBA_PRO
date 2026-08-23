# Enforce pull request flow

## Outcome

Make the repository automatically reject pull requests that target the wrong integration branch and explain the correction to the author.

## Constraints

- Personal/member and feature branches merge into `develop`.
- Only `release/*` and `hotfix/*` branches merge into `main`.
- Do not change GitHub rulesets or existing pull requests from the repository workspace.

## Non-goals

- Changing GitHub branch rulesets, reviewer requirements, or PR #4.
- Automatically merging or closing pull requests.

## Acceptance criteria

- A required workflow fails for invalid `head`/`base` combinations.
- Same-repository invalid PRs receive an actionable comment without duplicate comments.
- Valid workflow combinations pass.
- Contributor and PR template guidance matches the executable policy.

## Files

- `.github/workflows/branch-policy.yml`
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
