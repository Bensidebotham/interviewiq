# Jest Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Jest unit tests for `questions.ts`, `gemini.ts`, and three API routes, all running in CI between lint and build.

**Architecture:** ts-jest transforms TypeScript in a Node test environment. All external deps (Prisma, NextAuth, Trigger.dev, Google AI) are module-level mocks. API routes are tested by importing handlers directly and calling them with a `NextRequest`. No database or network access required.

**Tech Stack:** Jest 29, ts-jest, @types/jest, Next.js 16 (next/server), TypeScript

---

## File Structure

- **Create:** `jest.config.js` — Jest config with ts-jest transform and `@/` path alias
- **Modify:** `package.json` — add `"test": "jest"` script
- **Create:** `src/__tests__/lib/questions.test.ts` — pure function tests, no mocks
- **Create:** `src/__tests__/lib/gemini.test.ts` — mocks `@google/generative-ai`
- **Create:** `src/__tests__/api/sessions.test.ts` — mocks next-auth + prisma
- **Create:** `src/__tests__/api/analyze.test.ts` — mocks next-auth + prisma + trigger.dev
- **Create:** `src/__tests__/api/responses.test.ts` — mocks next-auth + prisma
- **Modify:** `.github/workflows/ci.yml` — add `npm test` step between lint and build

---

### Task 1: Install Jest and create configuration

**Files:**
- Create: `jest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

```bash
cd /Users/ben/interviewiq && npm install --save-dev jest ts-jest @types/jest
```

Expected: packages added to `devDependencies` in `package.json`, `package-lock.json` updated.

- [ ] **Step 2: Create `jest.config.js`**

Note: using `.js` (not `.ts`) to avoid needing `ts-node` as an extra dependency. The `@type` JSDoc provides full IntelliSense.

```javascript
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

module.exports = config
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` section, add `"test": "jest"` after the `"lint"` line:

```json
"scripts": {
  "dev": "node scripts/dev.js",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint",
  "test": "jest"
},
```

- [ ] **Step 4: Create test directories**

```bash
mkdir -p /Users/ben/interviewiq/src/__tests__/lib /Users/ben/interviewiq/src/__tests__/api
```

- [ ] **Step 5: Verify config works with no tests yet**

```bash
cd /Users/ben/interviewiq && npm test -- --passWithNoTests
```

Expected output contains: `Test Suites: 0 skipped` or similar, exit code 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/ben/interviewiq
git add jest.config.js package.json package-lock.json
git commit -m "feat(tests): install Jest with ts-jest configuration"
```

---

### Task 2: questions.ts tests

**Files:**
- Create: `src/__tests__/lib/questions.test.ts`

These test a pure function with no external deps — no mocks needed. All tests should pass immediately.

- [ ] **Step 1: Create `src/__tests__/lib/questions.test.ts`**

```typescript
import { getQuestionsForSession } from '@/lib/questions'

describe('getQuestionsForSession', () => {
  it('returns only behavioral and situational questions for behavioral session type', () => {
    const questions = getQuestionsForSession('behavioral', undefined, 20)
    questions.forEach((q) => {
      expect(['behavioral', 'situational']).toContain(q.category)
    })
  })

  it('returns only technical questions for technical session type', () => {
    const questions = getQuestionsForSession('technical', undefined, 20)
    questions.forEach((q) => {
      expect(q.category).toBe('technical')
    })
  })

  it('returns questions from all categories for company-specific session type', () => {
    // Run many times to overcome randomness and confirm multiple categories appear
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      getQuestionsForSession('company-specific', undefined, 20).forEach((q) =>
        seen.add(q.category)
      )
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('applies industry filter when enough matching questions exist', () => {
    // 'tech' industry matches all behavioral questions — count(11) >= 3
    const questions = getQuestionsForSession('behavioral', 'tech', 3)
    questions.forEach((q) => {
      expect(q.industries).toContain('tech')
    })
  })

  it('falls back to full filtered set when fewer than count industry matches exist', () => {
    // No technical questions have 'finance' industry → 0 < 3 → falls back to all technical
    const questions = getQuestionsForSession('technical', 'finance', 3)
    expect(questions.length).toBeGreaterThan(0)
    questions.forEach((q) => {
      expect(q.category).toBe('technical')
    })
  })

  it('never returns more questions than count', () => {
    const questions = getQuestionsForSession('behavioral', undefined, 3)
    expect(questions.length).toBeLessThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
cd /Users/ben/interviewiq && npm test -- src/__tests__/lib/questions.test.ts
```

Expected: `6 tests passed`, exit code 0. If any fail, debug before continuing.

- [ ] **Step 3: Commit**

```bash
cd /Users/ben/interviewiq
git add src/__tests__/lib/questions.test.ts
git commit -m "test(questions): add unit tests for getQuestionsForSession"
```

---

### Task 3: gemini.ts tests

**Files:**
- Create: `src/__tests__/lib/gemini.test.ts`

Mocks `@google/generative-ai` so no API calls are made. The `mockGenerateContent` variable name starts with `mock` — this is required so Jest allows it inside the hoisted `jest.mock()` factory.

- [ ] **Step 1: Create `src/__tests__/lib/gemini.test.ts`**

```typescript
import { analyzeInterview, AnalyzeInput, FeedbackResult } from '@/lib/gemini'

const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

const mockFeedback: FeedbackResult = {
  transcript: 'Test transcript',
  overallScore: 8,
  contentScore: 7,
  deliveryScore: 8,
  eyeContactScore: 9,
  bodyLanguageScore: 7,
  contentFeedback: 'Good content',
  deliveryFeedback: 'Good delivery',
  eyeContactFeedback: 'Good eye contact',
  bodyLanguageFeedback: 'Good posture',
  overallFeedback: 'Good overall',
  modelAnswer: 'Model answer here',
  fillerWords: ['um', 'uh'],
  missingStarComponents: [],
  resumeAlignmentNotes: 'Good alignment',
}

const baseInput: AnalyzeInput = {
  questionText: 'Tell me about yourself',
  sessionType: 'behavioral',
  audioBase64: 'fakeaudiodata',
  frames: ['fakeframe1'],
}

describe('analyzeInterview', () => {
  beforeEach(() => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockFeedback) },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns parsed FeedbackResult from model response', async () => {
    const result = await analyzeInterview(baseInput)
    expect(result).toEqual(mockFeedback)
  })

  it('includes optional fields in context when provided', async () => {
    await analyzeInterview({
      ...baseInput,
      targetRole: 'Software Engineer',
      targetCompany: 'Google',
      industry: 'tech',
    })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('Target role: Software Engineer')
    expect(contextText).toContain('Target company: Google')
    expect(contextText).toContain('Industry: tech')
  })

  it('omits optional fields from context when not provided', async () => {
    await analyzeInterview(baseInput)
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).not.toContain('Target role:')
    expect(contextText).not.toContain('Target company:')
    expect(contextText).not.toContain('CANDIDATE RESUME')
    expect(contextText).not.toContain('JOB DESCRIPTION')
  })

  it('truncates resumeText to 1000 characters', async () => {
    const longResume = 'a'.repeat(1500)
    await analyzeInterview({ ...baseInput, resumeText: longResume })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('a'.repeat(1000))
    expect(contextText).not.toContain('a'.repeat(1001))
  })

  it('truncates jobDescription to 600 characters', async () => {
    const longJD = 'b'.repeat(900)
    await analyzeInterview({ ...baseInput, jobDescription: longJD })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('b'.repeat(600))
    expect(contextText).not.toContain('b'.repeat(601))
  })
})
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
cd /Users/ben/interviewiq && npm test -- src/__tests__/lib/gemini.test.ts
```

Expected: `5 tests passed`, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/ben/interviewiq
git add src/__tests__/lib/gemini.test.ts
git commit -m "test(gemini): add unit tests for analyzeInterview"
```

---

### Task 4: sessions API route tests

**Files:**
- Create: `src/__tests__/api/sessions.test.ts`

Mocks `next-auth`, `@/lib/auth`, and `@/lib/prisma`. The route handler is imported directly and called with a `NextRequest`.

- [ ] **Step 1: Create `src/__tests__/api/sessions.test.ts`**

```typescript
import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    interviewSession: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/sessions/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCreate = prisma.interviewSession.create as jest.MockedFunction<
  typeof prisma.interviewSession.create
>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/sessions', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ sessionType: 'behavioral' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionType is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionType is an invalid enum value', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ sessionType: 'invalid-type' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with session data when request is valid', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const fakeSession = { id: 'session-1', sessionType: 'behavioral', userId: 'user-1' }
    mockCreate.mockResolvedValue(fakeSession as never)

    const res = await POST(makeRequest({ sessionType: 'behavioral' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session).toEqual(fakeSession)
  })
})
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
cd /Users/ben/interviewiq && npm test -- src/__tests__/api/sessions.test.ts
```

Expected: `4 tests passed`, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/ben/interviewiq
git add src/__tests__/api/sessions.test.ts
git commit -m "test(api): add unit tests for POST /api/sessions"
```

---

### Task 5: analyze API route tests

**Files:**
- Create: `src/__tests__/api/analyze.test.ts`

Also mocks `@trigger.dev/sdk/v3`. The 503 test verifies that a failed `tasks.trigger` call returns a service error without crashing the route.

- [ ] **Step 1: Create `src/__tests__/api/analyze.test.ts`**

```typescript
import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    response: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))
jest.mock('@trigger.dev/sdk/v3', () => ({
  tasks: { trigger: jest.fn() },
}))

import { POST } from '@/app/api/analyze/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { tasks } from '@trigger.dev/sdk/v3'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockFindFirst = prisma.response.findFirst as jest.MockedFunction<
  typeof prisma.response.findFirst
>
const mockUpdate = prisma.response.update as jest.MockedFunction<typeof prisma.response.update>
const mockTrigger = tasks.trigger as jest.MockedFunction<typeof tasks.trigger>

const validBody = {
  responseId: 'resp-1',
  questionText: 'Tell me about yourself',
  sessionType: 'behavioral',
  audioUrl: 'https://example.com/audio.webm',
  frames: ['frame1'],
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/analyze', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ responseId: 'resp-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when response does not belong to user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 503 when tasks.trigger throws', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'resp-1' } as never)
    mockUpdate.mockResolvedValue({} as never)
    mockTrigger.mockRejectedValue(new Error('Trigger service unavailable'))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(503)
  })

  it('returns 202 with runId and responseId on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'resp-1' } as never)
    mockUpdate.mockResolvedValue({} as never)
    mockTrigger.mockResolvedValue({ id: 'run-123' } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body).toEqual({ runId: 'run-123', responseId: 'resp-1' })
  })
})
```

- [ ] **Step 2: Run tests and verify all pass**

```bash
cd /Users/ben/interviewiq && npm test -- src/__tests__/api/analyze.test.ts
```

Expected: `5 tests passed`, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/ben/interviewiq
git add src/__tests__/api/analyze.test.ts
git commit -m "test(api): add unit tests for POST /api/analyze"
```

---

### Task 6: responses API route tests

**Files:**
- Create: `src/__tests__/api/responses.test.ts`

- [ ] **Step 1: Create `src/__tests__/api/responses.test.ts`**

```typescript
import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    interviewSession: {
      findFirst: jest.fn(),
    },
    response: {
      create: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/responses/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockFindFirst = prisma.interviewSession.findFirst as jest.MockedFunction<
  typeof prisma.interviewSession.findFirst
>
const mockCreate = prisma.response.create as jest.MockedFunction<typeof prisma.response.create>

const validBody = {
  sessionId: 'session-1',
  questionText: 'Tell me about yourself',
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/responses', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/responses', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionId is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ questionText: 'Tell me about yourself' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when questionText is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ sessionId: 'session-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when session does not belong to user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 200 with created response on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'session-1', userId: 'user-1' } as never)
    const fakeResponse = { id: 'resp-1', sessionId: 'session-1', questionText: 'Tell me about yourself' }
    mockCreate.mockResolvedValue(fakeResponse as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.response).toEqual(fakeResponse)
  })
})
```

- [ ] **Step 2: Run all tests and verify all pass**

```bash
cd /Users/ben/interviewiq && npm test
```

Expected: `20 tests passed` across 5 suites, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/ben/interviewiq
git add src/__tests__/api/responses.test.ts
git commit -m "test(api): add unit tests for POST /api/responses"
```

---

### Task 7: Update CI workflow and verify

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Add the Test step to `.github/workflows/ci.yml`**

Replace the Lint → Build sequence with Lint → Test → Build:

```yaml
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
```

- [ ] **Step 2: Commit and push**

```bash
cd /Users/ben/interviewiq
git add .github/workflows/ci.yml
git commit -m "feat(ci): add npm test step to CI workflow"
git push origin main
```

- [ ] **Step 3: Verify CI passes on GitHub**

```bash
cd /Users/ben/interviewiq && gh run watch
```

Or navigate to `https://github.com/Bensidebotham/interviewiq/actions` and confirm the workflow run shows green for all steps: Install → Lint → Test → Build.

If the Test step fails, run `npm test` locally to reproduce, fix the issue, and push again.
