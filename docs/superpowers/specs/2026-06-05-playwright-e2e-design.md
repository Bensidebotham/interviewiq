# Playwright E2E Tests — Design Spec

**Date:** 2026-06-05  
**Part:** 9 of InterviewIQ roadmap  
**Status:** Approved

---

## Goal

Add Playwright end-to-end tests covering the four main user flows: landing page, dashboard, new session wizard, and live interview. Tests run in CI (GitHub Actions) without real secrets or a real database, using Playwright route interception for auth and API mocking.

---

## Directory Structure

```
e2e/
  fixtures/
    auth.ts          # intercepts /api/auth/session → fake signed-in user
    media.ts         # page.addInitScript() stubs getUserMedia + MediaRecorder
    api.ts           # page.route() handlers for all DB-hitting API routes
  mocks/
    session.ts       # static mock payloads (session, feedback, profile)
  landing.spec.ts
  dashboard.spec.ts
  new-session.spec.ts
  interview.spec.ts
playwright.config.ts
```

---

## Auth Mocking

Playwright intercepts `GET /api/auth/session` and returns:

```json
{
  "user": { "name": "Test User", "email": "test@example.com", "image": null },
  "expires": "2099-01-01T00:00:00.000Z"
}
```

NextAuth's `useSession()` fetches this endpoint on the client, so the app treats the user as signed in. No app code changes required.

---

## API Mocking

All routes that hit the database are intercepted via `page.route()` and return static payloads. No test database or real secrets needed beyond what CI already provides.

| Route | Method | Mock response |
|---|---|---|
| `/api/auth/session` | GET | Fake signed-in user |
| `/api/sessions` | GET | Array of 2 mock sessions + stats |
| `/api/sessions/:id` | GET | Single session with questions array |
| `/api/sessions` | POST | `{ id: 'test-session-id' }` |
| `/api/responses` | POST | `{ id: 'test-response-id' }` |
| `/api/analyze` | POST | Full `FeedbackResult` with scores across all 5 dimensions |
| `/api/profile` | GET | Mock profile (resumeText, targetRole, etc.) |

All fixtures compose into a single `test` export so specs get auth + API mocking automatically.

---

## Media Mocking

`page.addInitScript()` injects before page load:

- **`navigator.mediaDevices.getUserMedia`**: returns a fake `MediaStream` with a silent audio track
- **`MediaRecorder`**: fake class that accepts a stream, starts/stops on demand, and fires `dataavailable` with an empty `Blob` on stop

This lets `VideoRecorder` run its full client-side flow (request camera → record → stop → encode → submit) without a real camera or microphone.

---

## Test Coverage

### `landing.spec.ts` — no auth
- Hero heading is visible
- CTA button is present and links to `/auth/signin`

### `dashboard.spec.ts` — auth + mocked GET `/api/sessions`
- Stats render (session count, avg score)
- Session list shows mocked sessions
- "New Session" button navigates to `/session/new`

### `new-session.spec.ts` — auth + mocked POST `/api/sessions`
- Step 1: select session type, click Next
- Step 2: fill in company name and job description, click Submit
- Redirects to `/session/test-session-id`

### `interview.spec.ts` — auth + mocked GET `/api/sessions/:id` + media + mocked POST `/api/analyze`
- Question text renders on page load
- Click Record → recording state indicator appears
- Click Stop → `/api/analyze` is called
- Feedback panel renders with score values

---

## CI Integration

`playwright.config.ts` uses `webServer` to build and start the app before tests:

```ts
webServer: {
  command: 'npm run build && npm start',
  port: 3000,
  reuseExistingServer: !process.env.CI,
  env: { /* same fake env vars as existing CI */ }
}
```

Only Chromium is installed (`--with-deps chromium`) to keep CI fast.

GitHub Actions workflow gains a new job step after lint → test → build:

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npx playwright test
  env:
    DATABASE_URL: postgresql://fake:fake@localhost/fake
    DIRECT_URL: postgresql://fake:fake@localhost/fake
    NEXTAUTH_SECRET: ci-secret
    NEXTAUTH_URL: http://localhost:3000
    GITHUB_CLIENT_ID: fake
    GITHUB_CLIENT_SECRET: fake
    GOOGLE_GEMINI_API_KEY: fake
```

---

## Out of Scope

- Firefox / WebKit browsers (Chromium only for portfolio CI)
- Profile page E2E (covered by unit tests; low value here)
- Visual regression / screenshot diffing
- Real OAuth login flow
