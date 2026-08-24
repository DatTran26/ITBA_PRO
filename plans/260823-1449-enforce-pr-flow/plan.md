# Enforce pull request flow

## Outcome

Make the repository automatically reject pull requests that target the wrong integration branch and explain the correction to the author.

## Constraints

- Personal/member and feature branches merge into `develop`.
- Only `release/*` and `hotfix/*` branches merge into `main`.
- Protect `main`, `develop`, and `release/*` with the required policy check.

## Non-goals

- Changing reviewer requirements or PR #4.
- Automatically merging or closing pull requests.

## Acceptance criteria

- A required workflow fails for invalid `head`/`base` combinations.
- Required rulesets block invalid merges on `main`, `develop`, and `release/*`.
- Same-repository invalid PRs receive an actionable comment without duplicate comments.
- Valid workflow combinations pass.
- Contributor and PR template guidance matches the executable policy.

## Files

- `.github/workflows/branch-policy.yml`
- `.github/pull_request_template.md`
- `CONTRIBUTING.md`
