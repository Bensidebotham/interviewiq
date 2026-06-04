# Jest Unit Tests — Design Spec

**Date:** 2026-06-04
**Status:** Approved

## Overview

Add Jest unit tests for `questions.ts`, `gemini.ts`, and three API routes (`/api/sessions`, `/api/analyze`, `/api/responses`). All external dependencies (Prisma, NextAuth, Trigger.dev, Google AI SDK) are mocked — no database or network required. Tests run in CI between the lint and build steps.

## Setup

**New dev dependencies:** `jest`, `ts-jest`, `@types/jest`

**New files:**
- `jest.config.ts` — Jest configuration at project root
- `src/__tests__/lib/questions.test.ts`
- `src/__tests__/lib/gemini.test.ts`
- `src/__tests__/api/sessions.test.ts`
- `src/__tests__/api/analyze.test.ts`
- `src/__tests__/api/responses.test.ts`

**Modified files:**
- `package.json` — add `"test": "jest"` script
- `.github/workflows/ci.yml` — add `npm test` step between lint and build

## Jest Configuration (`jest.config.ts`)

```typescript
import type { Config } from 'jest'

const config: Config = {
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

export default config
```

Two tsconfig overrides are required: Next.js uses `module: esnext` and `moduleResolution: bundler`, but Jest runs in Node and needs CommonJS modules.

## Mocking Strategy

All external deps are mocked at the module level in each test file:

| Dependency | Mock target | What is mocked |
|---|---|---|
| NextAuth | `next-auth` | `getServerSession` returns `null` or a fake session |
| Prisma | `@/lib/prisma` | `prisma.interviewSession.*`, `prisma.response.*` as `jest.fn()` |
| Trigger.dev | `@trigger.dev/sdk/v3` | `tasks.trigger` as `jest.fn()` |
| Google AI | `@google/generative-ai` | `GoogleGenerativeAI` constructor → `getGenerativeModel` → `generateContent` |

API routes are tested by importing the handler directly and calling it with a real `NextRequest` constructed from `new Request(url, { method, body, headers })`.

## Test Coverage

### `src/__tests__/lib/questions.test.ts`

No mocks. Tests the `getQuestionsForSession` pure function:

1. `behavioral` session type → result contains only `behavioral` or `situational` questions
2. `technical` session type → result contains only `technical` questions
3. `company-specific` session type → result may include any category
4. Industry filter applies when enough matching questions exist (≥ count)
5. Industry filter falls back to full filtered set when fewer than `count` industry matches exist
6. Result length never exceeds `count`

### `src/__tests__/lib/gemini.test.ts`

Mocks `@google/generative-ai`. Tests `analyzeInterview`:

1. Context block includes `targetRole`, `targetCompany`, `industry` when provided
2. Context block omits optional fields when not provided
3. `resumeText` is truncated to first 1000 characters
4. `jobDescription` is truncated to first 600 characters
5. Returns parsed `FeedbackResult` from mock JSON response

### `src/__tests__/api/sessions.test.ts`

Mocks `next-auth` and `@/lib/prisma`. Tests `POST /api/sessions`:

1. Returns 401 when `getServerSession` returns `null`
2. Returns 400 when body is missing `sessionType`
3. Returns 400 when `sessionType` is not a valid enum value
4. Returns 200 with session data when body is valid

### `src/__tests__/api/analyze.test.ts`

Mocks `next-auth`, `@/lib/prisma`, and `@trigger.dev/sdk/v3`. Tests `POST /api/analyze`:

1. Returns 401 when `getServerSession` returns `null`
2. Returns 400 when body is invalid (missing required fields)
3. Returns 404 when `prisma.response.findFirst` returns `null` (response not owned by user)
4. Returns 503 when `tasks.trigger` throws
5. Returns 202 with `{ runId, responseId }` on success

### `src/__tests__/api/responses.test.ts`

Mocks `next-auth` and `@/lib/prisma`. Tests `POST /api/responses`:

1. Returns 401 when `getServerSession` returns `null`
2. Returns 400 when body is missing `sessionId` or `questionText`
3. Returns 404 when `prisma.interviewSession.findFirst` returns `null`
4. Returns 200 with created response on success

## CI Integration

The `npm test` step is added to `.github/workflows/ci.yml` between lint and build:

```yaml
- name: Lint
  run: npm run lint

- name: Test
  run: npm test

- name: Build
  run: npm run build
  env:
    # ... stub env vars unchanged
```

Tests run in `node` environment with no real services, so no additional env vars are needed in CI.

## What Is Not In Scope

- Integration tests against a real database (Part 9 / Playwright)
- Component or UI tests (no React Testing Library)
- Snapshot tests
- Coverage thresholds or coverage reporting
