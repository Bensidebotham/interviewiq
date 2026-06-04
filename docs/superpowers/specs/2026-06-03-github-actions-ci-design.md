# GitHub Actions CI — Design Spec

**Date:** 2026-06-03
**Status:** Approved

## Overview

Add a GitHub Actions workflow that runs on every push to `main` and every pull request targeting `main`. The workflow performs two quality checks in sequence: lint, then build (which includes TypeScript checking via Next.js). No test runner is included yet — tests are a future build target.

## Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- `push` to `main`
- `pull_request` targeting `main`

**Job: `ci`** — runs on `ubuntu-latest`, Node 20.

**Steps:**
1. `actions/checkout@v4` — check out the repository
2. `actions/setup-node@v4` with `node-version: 20` and `cache: 'npm'` — installs Node and caches `~/.npm` using `package-lock.json` as the cache key; subsequent runs skip the full install
3. `npm ci` — clean, reproducible install from lockfile
4. `npm run lint` — runs ESLint via `eslint-config-next`
5. `npm run build` — runs `prisma generate && next build`, which also performs TypeScript type-checking

## Environment Variables

The build step requires stub env vars so Prisma and NextAuth don't crash before compilation. These are not real secrets — nothing connects to a database or external service during CI.

Set via the workflow's `env` block on the build step:

| Variable | Stub Value |
|---|---|
| `DATABASE_URL` | `postgresql://fake:fake@localhost/fake` |
| `DIRECT_URL` | `postgresql://fake:fake@localhost/fake` |
| `NEXTAUTH_SECRET` | `ci-secret` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `GITHUB_CLIENT_ID` | `fake` |
| `GITHUB_CLIENT_SECRET` | `fake` |
| `GOOGLE_GEMINI_API_KEY` | `fake` |

No GitHub Secrets are required for this workflow.

## What Gets Checked

- **Lint:** ESLint with `eslint-config-next` (core-web-vitals + TypeScript rules)
- **TypeScript:** Checked implicitly by `next build` — type errors fail the build
- **Build output:** The full Next.js production build must succeed

## What Is Not In Scope

- Vercel preview deploy integration (Vercel handles previews automatically via its GitHub integration)
- Separate `tsc --noEmit` step (`next build` covers this)
- Jest / Playwright test runs (tests not yet added to the project)
- Docker or containerized build
