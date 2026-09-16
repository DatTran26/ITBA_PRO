---
title: Configure Cloudflare Turnstile for Supabase authentication
status: awaiting-provider-configuration
created: 2026-09-12
---

# Turnstile authentication repair

## Outcome

Password sign-in uses the Cloudflare Turnstile widget whose site key matches
the secret configured for the corresponding Supabase project.

## Constraints

- Keep CAPTCHA protection enabled; do not bypass or weaken it.
- Never commit, log, or request a Turnstile secret in source control.
- Preserve the existing Supabase `captchaToken` authentication contract.

## Non-goals

- Changing account, password-reset, or Supabase schema behavior.
- Rotating unrelated Cloudflare or Supabase credentials.

## Acceptance criteria

- The login page renders Turnstile only when explicitly enabled and a public
  site key is provided at build time.
- Staging and production image builds receive that public site key through the
  documented GitHub Environment variable.
- The runbook states how to pair the site key with the provider secret in the
  matching Supabase project without exposing the secret.
- Frontend typecheck/lint/build validation completes without new errors.

## Phases

- [x] Scout the login, image-build, deployment, and operations owners.
- [x] Diagnose the provider-side `invalid-input-secret` response.
- [x] Make the site key an explicit public build configuration.
- [x] Document the provider configuration and recovery steps.
- [x] Verify source, compose, typecheck, scoped lint, and build behavior.
- [x] Review the diff and affected auth paths.
- [x] Production `itba-ai`: secret saved via Management API on 2026-09-12;
  auth probe now returns `invalid-input-response` for a bogus token instead
  of `invalid-input-secret` (secret verified against site key
  `0x4AAAAAACwDOJ4K8U9X9Ci7`). Real-login smoke test pending user check.
- [ ] Staging `itba-ai-staging` (`kxpunppvqfxfqdwpqpmp`): BLOCKED — the
  project host no longer resolves (NXDOMAIN via Google DoH on 2026-09-12;
  production ref resolves fine). Project appears deleted/paused-gone, not
  just misconfigured. Staging login is fully down regardless of captcha.
  Once a staging project exists again, update `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the GitHub `staging` environment,
  save this widget's secret in its auth config, then republish the
  staging image.
