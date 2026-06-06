# Playwright E2E Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright E2E tests covering landing, dashboard, new-session wizard, and interview flows — with mocked auth, mocked media APIs, mocked client-side API calls, and a real PostgreSQL service in CI.

**Architecture:** A shared `authedPage` fixture sets a valid NextAuth JWT cookie and injects `getUserMedia`/`MediaRecorder` stubs before each auth-gated test. Client-side API calls (`/api/sessions`, `/api/analyze`, etc.) are intercepted per-test via `page.route()`. The dashboard page is server-rendered (calls Prisma directly), so the e2e CI job spins up a real PostgreSQL service and deploys the schema with `prisma db push`; the empty DB causes the dashboard to render its empty state. A separate `e2e` job in CI (runs after `ci`) handles this.

**Tech Stack:** `@playwright/test`, `next-auth/jwt` (for JWT fixture), GitHub Actions `services.postgres`

---

## File Map

| Action | File |
|---|---|
| Create | `playwright.config.ts` |
| Create | `e2e/mocks/session.ts` |
| Create | `e2e/fixtures/auth.ts` |
| Create | `e2e/fixtures/media.ts` |
| Create | `e2e/fixtures/api.ts` |
| Create | `e2e/fixtures/index.ts` |
| Create | `e2e/landing.spec.ts` |
| Create | `e2e/dashboard.spec.ts` |
| Create | `e2e/new-session.spec.ts` |
| Create | `e2e/interview.spec.ts` |
| Modify | `package.json` (add test:e2e script) |
| Modify | `.github/workflows/ci.yml` (add e2e job) |

---

## Task 1: Install Playwright and create config

**Files:**
- Create: `playwright.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
cd ~/interviewiq
npm install --save-dev @playwright/test
```

Expected: `@playwright/test` appears in `package.json` devDependencies.

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm start' : 'npm run build && npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
})
```

- [ ] **Step 3: Add e2e script to `package.json`**

In the `"scripts"` section of `package.json`, add:

```json
"test:e2e": "playwright test"
```

- [ ] **Step 4: Verify config is valid**

```bash
cd ~/interviewiq
npx playwright test --list 2>&1 | head -5
```

Expected: output like `No tests found` or an empty list (no error about invalid config).

- [ ] **Step 5: Commit**

```bash
cd ~/interviewiq
git add playwright.config.ts package.json package-lock.json
git commit -m "feat(e2e): install Playwright and add config"
```

---

## Task 2: Create mock payloads

**Files:**
- Create: `e2e/mocks/session.ts`

- [ ] **Step 1: Create the mocks directory and file**

```bash
mkdir -p ~/interviewiq/e2e/mocks
```

- [ ] **Step 2: Write `e2e/mocks/session.ts`**

```ts
export const MOCK_SESSION_ID = 'test-session-id'
export const MOCK_RESPONSE_ID = 'test-response-id'
export const MOCK_USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

export const mockSession = {
  id: MOCK_SESSION_ID,
  sessionType: 'behavioral',
  companyName: 'Acme Corp',
  industry: 'tech',
  jobDescription: null,
  status: 'active',
  userId: MOCK_USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
  triggerRunId: null,
  questions: [
    {
      id: 'q1',
      text: 'Tell me about a time you overcame a challenge.',
      category: 'behavioral',
      tips: 'Use the STAR framework.',
    },
    {
      id: 'q2',
      text: 'Describe a project you are proud of.',
      category: 'behavioral',
      tips: 'Focus on your specific contributions.',
    },
  ],
  responses: [],
}

export const mockFeedback = {
  id: 'feedback-1',
  responseId: MOCK_RESPONSE_ID,
  overallScore: 8,
  contentScore: 8,
  deliveryScore: 7,
  eyeContactScore: 8,
  bodyLanguageScore: 7,
  contentFeedback: 'Strong answer with clear STAR structure.',
  deliveryFeedback: 'Good pace and clarity throughout.',
  eyeContactFeedback: 'Maintained good eye contact.',
  bodyLanguageFeedback: 'Confident posture throughout.',
  overallFeedback: 'Excellent response demonstrating relevant experience.',
  modelAnswer: 'A model answer would start with the situation...',
  fillerWords: ['um', 'like'],
  missingStarComponents: [],
  resumeAlignmentNotes: null,
  createdAt: new Date().toISOString(),
}

export const mockSessionsList = {
  sessions: [
    {
      id: 'session-past-1',
      sessionType: 'behavioral',
      companyName: 'Acme Corp',
      status: 'completed',
      createdAt: new Date().toISOString(),
      responses: [
        { id: 'r1', questionText: 'Q1', feedback: { overallScore: 8 } },
      ],
    },
    {
      id: 'session-past-2',
      sessionType: 'technical',
      companyName: null,
      status: 'completed',
      createdAt: new Date().toISOString(),
      responses: [
        { id: 'r2', questionText: 'Q2', feedback: { overallScore: 7 } },
        { id: 'r3', questionText: 'Q3', feedback: { overallScore: 9 } },
      ],
    },
  ],
}
```

- [ ] **Step 3: Commit**

```bash
cd ~/interviewiq
git add e2e/
git commit -m "feat(e2e): add mock payloads"
```

---

## Task 3: Create auth and media fixtures

**Files:**
- Create: `e2e/fixtures/auth.ts`
- Create: `e2e/fixtures/media.ts`
- Create: `e2e/fixtures/index.ts`

- [ ] **Step 1: Create fixtures directory**

```bash
mkdir -p ~/interviewiq/e2e/fixtures
```

- [ ] **Step 2: Write `e2e/fixtures/auth.ts`**

This generates a valid NextAuth v4 JWT (using the same `encode` function NextAuth itself uses) and sets it as a cookie. `getServerSession` will decode this cookie and return `{ user: { id: MOCK_USER_ID, name: 'Test User', email: 'test@example.com' } }`.

```ts
import { encode } from 'next-auth/jwt'
import type { BrowserContext } from '@playwright/test'
import { MOCK_USER_ID } from '../mocks/session'

export async function setAuthCookie(context: BrowserContext): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET ?? 'ci-secret'

  const token = await encode({
    token: {
      name: 'Test User',
      email: 'test@example.com',
      picture: null,
      sub: MOCK_USER_ID,
    },
    secret,
  })

  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}
```

- [ ] **Step 3: Write `e2e/fixtures/media.ts`**

This script is injected into the browser before any page loads, replacing `getUserMedia` with a canvas-based stub and replacing `MediaRecorder` with a fake that fires `ondataavailable` on start/stop. This lets `VideoRecorder` run its full flow without a real camera.

```ts
export const MEDIA_STUB_SCRIPT = `
  // Replace getUserMedia with a canvas-based stub stream
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      configurable: true,
      writable: true,
    })
  }
  navigator.mediaDevices.getUserMedia = async function () {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, 64, 64)
    return canvas.captureStream(1)
  }

  // Replace MediaRecorder with a stub that fires ondataavailable on start/stop
  class StubMediaRecorder {
    constructor(stream, options) {
      this.stream = stream
      this.options = options
      this.state = 'inactive'
      this.ondataavailable = null
      this._timer = null
    }
    start(timeslice) {
      this.state = 'recording'
      const ms = timeslice || 1000
      this._timer = setInterval(() => {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['x'], { type: 'audio/webm' }) })
        }
      }, ms)
    }
    stop() {
      clearInterval(this._timer)
      this.state = 'inactive'
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['x'], { type: 'audio/webm' }) })
      }
    }
    static isTypeSupported(mimeType) {
      return typeof mimeType === 'string' && mimeType.startsWith('audio/')
    }
  }
  Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    configurable: true,
    value: StubMediaRecorder,
  })
`
```

- [ ] **Step 4: Write `e2e/fixtures/index.ts`**

Exports a composed `test` with an `authedPage` fixture (auth cookie + media stubs), and re-exports `expect`.

```ts
import { test as base, expect } from '@playwright/test'
import { setAuthCookie } from './auth'
import { MEDIA_STUB_SCRIPT } from './media'
import type { Page } from '@playwright/test'

type Fixtures = {
  authedPage: Page
}

export const test = base.extend<Fixtures>({
  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await setAuthCookie(context)
    await page.addInitScript(MEDIA_STUB_SCRIPT)
    await use(page)
    await context.close()
  },
})

export { expect }
```

- [ ] **Step 5: Commit**

```bash
cd ~/interviewiq
git add e2e/fixtures/
git commit -m "feat(e2e): add auth, media, and composed test fixtures"
```

---

## Task 4: Create API mock helpers

**Files:**
- Create: `e2e/fixtures/api.ts`

These are plain functions (not Playwright fixtures) that call `page.route()`. Each test calls only the mocks it needs, before navigating.

- [ ] **Step 1: Write `e2e/fixtures/api.ts`**

```ts
import type { Page } from '@playwright/test'
import {
  MOCK_SESSION_ID,
  MOCK_RESPONSE_ID,
  mockSession,
  mockFeedback,
  mockSessionsList,
} from '../mocks/session'

export async function mockSessionsRoute(page: Page): Promise<void> {
  await page.route('/api/sessions', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ json: { session: { id: MOCK_SESSION_ID } } })
    } else {
      route.fulfill({ json: mockSessionsList })
    }
  })
}

export async function mockSessionDetailRoute(page: Page): Promise<void> {
  await page.route(/\/api\/sessions\/[^/]+$/, (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ json: { session: mockSession } })
    } else {
      route.continue()
    }
  })
}

export async function mockResponsesRoute(page: Page): Promise<void> {
  await page.route('/api/responses', (route) => {
    route.fulfill({ json: { response: { id: MOCK_RESPONSE_ID } } })
  })
}

export async function mockUploadRoute(page: Page): Promise<void> {
  await page.route('/api/upload', (route) => {
    route.fulfill({ json: { url: 'https://example.com/fake-audio.webm' } })
  })
}

export async function mockAnalyzeRoute(page: Page): Promise<void> {
  await page.route('/api/analyze', (route) => {
    route.fulfill({
      status: 202,
      json: { runId: 'fake-run-id', responseId: MOCK_RESPONSE_ID },
    })
  })
}

export async function mockResponseStatusRoute(page: Page): Promise<void> {
  await page.route(/\/api\/responses\/[^/]+\/status$/, (route) => {
    route.fulfill({
      json: {
        status: 'done',
        feedback: mockFeedback,
        transcript: 'This is a test transcript of the interview response.',
      },
    })
  })
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/interviewiq
git add e2e/fixtures/api.ts
git commit -m "feat(e2e): add API mock helpers"
```

---

## Task 5: Landing page spec

**Files:**
- Create: `e2e/landing.spec.ts`

No auth or API mocks needed — the landing page is fully public.

- [ ] **Step 1: Write `e2e/landing.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders hero heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /stop guessing/i })).toBeVisible()
  })

  test('has a Sign in link in the nav', async ({ page }) => {
    await page.goto('/')
    const signInLink = page.getByRole('link', { name: /sign in/i }).first()
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute('href', '/auth/signin')
  })

  test('CTA button links to sign-in', async ({ page }) => {
    await page.goto('/')
    const cta = page.getByRole('link', { name: /start practicing free/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/auth/signin')
  })
})
```

- [ ] **Step 2: Run the spec to verify it passes**

First build and start the app (if not already running):
```bash
cd ~/interviewiq
npm run build && npm start &
sleep 5
```

Then run just this spec:
```bash
cd ~/interviewiq
npx playwright test e2e/landing.spec.ts --reporter=list
```

Expected: `3 passed`

Kill the server after:
```bash
kill %1
```

- [ ] **Step 3: Commit**

```bash
cd ~/interviewiq
git add e2e/landing.spec.ts
git commit -m "test(e2e): add landing page spec"
```

---

## Task 6: Dashboard spec

**Files:**
- Create: `e2e/dashboard.spec.ts`

The dashboard is a **server component** that calls Prisma directly. Running this spec locally requires a real database. In CI, the e2e job (Task 10) provides a PostgreSQL service. With a valid auth cookie and an empty DB (no sessions for `MOCK_USER_ID`), the dashboard shows its empty state.

- [ ] **Step 1: Write `e2e/dashboard.spec.ts`**

```ts
import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('shows welcome message and New Session button', async ({ authedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /new session/i })).toBeVisible()
  })

  test('New Session button navigates to /session/new', async ({ authedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /new session/i }).click()
    await expect(page).toHaveURL('/session/new')
  })
})
```

- [ ] **Step 2: Commit**

```bash
cd ~/interviewiq
git add e2e/dashboard.spec.ts
git commit -m "test(e2e): add dashboard spec"
```

---

## Task 7: New session wizard spec

**Files:**
- Create: `e2e/new-session.spec.ts`

This page is a client component (`"use client"`), so Prisma is never called server-side. Auth cookie gets past any server-side auth guards and the POST /api/sessions is intercepted by `page.route()`.

- [ ] **Step 1: Write `e2e/new-session.spec.ts`**

```ts
import { test, expect } from './fixtures'
import { mockSessionsRoute } from './fixtures/api'
import { MOCK_SESSION_ID } from './mocks/session'

test.describe('New session wizard', () => {
  test('completes wizard and redirects to session page', async ({ authedPage: page }) => {
    await mockSessionsRoute(page)

    await page.goto('/session/new')
    await expect(page.getByRole('heading', { name: /new practice session/i })).toBeVisible()

    // Step 1: select session type
    await page.getByRole('button', { name: /behavioral/i }).click()
    await page.getByRole('button', { name: /^next$/i }).click()

    // Step 2: fill optional context
    await expect(page.getByText(/step 2 of 2/i)).toBeVisible()
    await page.getByLabel(/company/i).fill('Acme Corp')

    // Submit
    await page.getByRole('button', { name: /start session/i }).click()

    // Should redirect to the session page
    await expect(page).toHaveURL(`/session/${MOCK_SESSION_ID}`)
  })
})
```

- [ ] **Step 2: Commit**

```bash
cd ~/interviewiq
git add e2e/new-session.spec.ts
git commit -m "test(e2e): add new session wizard spec"
```

---

## Task 8: Interview happy path spec

**Files:**
- Create: `e2e/interview.spec.ts`

This is the most complex spec. The flow is:
1. Navigate to session page (client component — fetches `GET /api/sessions/:id`)
2. Question renders
3. Click "Start Recording" → `POST /api/responses` + mocked `getUserMedia`
4. Recording indicator appears
5. Click "Stop & Analyze" → upload + analyze + 3s poll → feedback renders

The poll fires after ~3 seconds (the `startPolling` setTimeout delay in `VideoRecorder`). The assertion uses `timeout: 10_000` to give it time.

- [ ] **Step 1: Write `e2e/interview.spec.ts`**

```ts
import { test, expect } from './fixtures'
import {
  mockSessionDetailRoute,
  mockResponsesRoute,
  mockUploadRoute,
  mockAnalyzeRoute,
  mockResponseStatusRoute,
} from './fixtures/api'
import { MOCK_SESSION_ID } from './mocks/session'

test.describe('Interview session — happy path', () => {
  test('renders question, records, and shows feedback panel', async ({ authedPage: page }) => {
    // Set up all mocks before navigating
    await mockSessionDetailRoute(page)
    await mockResponsesRoute(page)
    await mockUploadRoute(page)
    await mockAnalyzeRoute(page)
    await mockResponseStatusRoute(page)

    await page.goto(`/session/${MOCK_SESSION_ID}`)

    // Question should render
    await expect(
      page.getByText('Tell me about a time you overcame a challenge.')
    ).toBeVisible()

    // Start recording
    await page.getByRole('button', { name: /start recording/i }).click()

    // Recording indicator should appear (Stop & Analyze button)
    await expect(
      page.getByRole('button', { name: /stop & analyze/i })
    ).toBeVisible({ timeout: 5_000 })

    // Stop recording and trigger analysis
    await page.getByRole('button', { name: /stop & analyze/i }).click()

    // Feedback panel should appear after polling completes (~3s + instant mock response)
    await expect(
      page.getByText('Excellent response demonstrating relevant experience.')
    ).toBeVisible({ timeout: 10_000 })

    // Score value should be visible
    await expect(page.getByText('8')).toBeVisible()
  })
})
```

- [ ] **Step 2: Commit**

```bash
cd ~/interviewiq
git add e2e/interview.spec.ts
git commit -m "test(e2e): add interview happy path spec"
```

---

## Task 9: CI integration

**Files:**
- Modify: `.github/workflows/ci.yml`

Add an `e2e` job that:
1. Runs after `ci` passes (no point running E2E if lint/unit/build fails)
2. Spins up a PostgreSQL service (needed for the dashboard server component's Prisma call)
3. Deploys the schema with `prisma db push`
4. Builds the app
5. Installs Playwright Chromium only
6. Runs the E2E suite
7. Uploads the HTML report as an artifact

- [ ] **Step 1: Update `.github/workflows/ci.yml`**

Replace the full file content with:

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

      - name: Test
        run: npm test

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

  e2e:
    runs-on: ubuntu-latest
    needs: ci

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: interviewiq_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/interviewiq_test
      DIRECT_URL: postgresql://postgres:postgres@localhost:5432/interviewiq_test
      NEXTAUTH_SECRET: ci-secret
      NEXTAUTH_URL: http://localhost:3000
      GITHUB_CLIENT_ID: fake
      GITHUB_CLIENT_SECRET: fake
      GOOGLE_GEMINI_API_KEY: fake

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy database schema
        run: npx prisma db push --skip-generate --accept-data-loss

      - name: Build app
        run: npm run build

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 2: Commit and push**

```bash
cd ~/interviewiq
git add .github/workflows/ci.yml
git commit -m "feat(ci): add e2e job with PostgreSQL service and Playwright"
git push
```

- [ ] **Step 3: Verify CI passes**

Watch the Actions tab on GitHub. The `ci` job should pass first, then `e2e` should start. Both jobs should be green.

Expected: both `ci` and `e2e` jobs show green checkmarks. The `playwright-report` artifact appears on the run.

---

## Task 10: Run full suite locally and commit any fixes

- [ ] **Step 1: Build and start the app locally**

```bash
cd ~/interviewiq
npm run build && npm start &
sleep 8
```

- [ ] **Step 2: Run the full E2E suite**

```bash
cd ~/interviewiq
NEXTAUTH_SECRET=ci-secret npx playwright test --reporter=list
```

Expected output example:
```
  ✓ landing.spec.ts > Landing page > renders hero heading
  ✓ landing.spec.ts > Landing page > has a Sign in link in the nav
  ✓ landing.spec.ts > Landing page > CTA button links to sign-in
  ✓ new-session.spec.ts > New session wizard > completes wizard and redirects to session page
  ✓ interview.spec.ts > Interview session — happy path > renders question, records, and shows feedback panel
  - dashboard.spec.ts > Dashboard > shows welcome message (needs real DB — expected to skip locally unless DB is available)
```

The dashboard spec requires a real PostgreSQL DB. Locally, if `DATABASE_URL` points to a real DB, run it too. In CI it always runs with the PostgreSQL service.

- [ ] **Step 3: Kill background server**

```bash
kill %1
```

- [ ] **Step 4: Final commit**

```bash
cd ~/interviewiq
git add -A
git commit -m "feat(e2e): complete Playwright E2E suite with CI integration"
git push
```
