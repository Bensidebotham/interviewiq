# GitHub Actions CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a GitHub Actions workflow that lints and builds InterviewIQ on every push to `main` and every pull request targeting `main`.

**Architecture:** Single workflow file with one job. Steps run sequentially: checkout → install (with npm cache) → lint → build. Stub env vars are set on the build step only so Prisma and NextAuth don't crash before compilation. No real secrets needed.

**Tech Stack:** GitHub Actions, `actions/checkout@v4`, `actions/setup-node@v4`, npm, ESLint, Next.js build

---

## File Structure

- **Create:** `.github/workflows/ci.yml` — the workflow definition

---

### Task 1: Create the CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflows directory**

```bash
mkdir -p /Users/ben/interviewiq/.github/workflows
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: postgresql://fake:fake@localhost/fake
          DIRECT_URL: postgresql://fake:fake@localhost/fake
          NEXTAUTH_SECRET: ci-secret
          NEXTAUTH_URL: http://localhost:3000
          GITHUB_CLIENT_ID: fake
          GITHUB_CLIENT_SECRET: fake
          GOOGLE_GEMINI_API_KEY: fake
```

- [ ] **Step 3: Verify lint passes locally before pushing**

```bash
cd /Users/ben/interviewiq && npm run lint
```

Expected: exits 0 with no errors. If there are lint errors, fix them before continuing.

- [ ] **Step 4: Commit and push**

```bash
cd /Users/ben/interviewiq
git add .github/workflows/ci.yml
git commit -m "feat(ci): add GitHub Actions workflow for lint and build"
git push origin main
```

---

### Task 2: Verify CI passes on GitHub

**Files:** (no changes)

- [ ] **Step 1: Open the Actions tab on GitHub**

Navigate to `https://github.com/Bensidebotham/interviewiq/actions`. The push from Task 1 should have triggered a `CI` workflow run.

- [ ] **Step 2: Confirm all steps pass**

The workflow run should show green checkmarks for: Install dependencies → Lint → Build. If any step fails, check the logs:

  - **Lint failure:** Fix the ESLint errors locally (`npm run lint`), commit, and push.
  - **Build failure due to missing env var:** Add the missing var to the `env:` block in `ci.yml` with a stub value, commit, and push.
  - **Build failure due to TypeScript error:** Fix the type error locally (`npm run build` to reproduce), commit, and push.

- [ ] **Step 3: Confirm PR protection is working (optional smoke test)**

Create a test branch, open a draft PR targeting `main`, and verify the CI workflow triggers on the PR. Once confirmed, close the draft PR without merging.

```bash
cd /Users/ben/interviewiq
git checkout -b test/ci-check
git push origin test/ci-check
# Open PR on GitHub, verify CI triggers, then close it
git checkout main
git push origin --delete test/ci-check
git branch -d test/ci-check
```
