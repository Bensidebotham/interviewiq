# Trigger.dev Async Analysis — Design Spec
_InterviewIQ Part 4_
_Date: 2026-06-02_

## Problem

`/api/analyze` currently blocks for ~15 seconds while Gemini processes audio + video frames. This will hit Vercel's serverless function timeout in production. The fix is to move the Gemini call into a Trigger.dev background task.

---

## Architecture

```
Client (VideoRecorder)
  │
  ├─ POST /api/upload          → Vercel Blob → returns audioUrl
  │
  ├─ POST /api/analyze         → validates, enqueues Trigger.dev task
  │    └─ returns { runId, responseId }  (HTTP 202, immediate)
  │
  └─ GET /api/responses/[id]/status  (poll every 3s)
       └─ returns { status, feedback? }

Trigger.dev worker
  └─ analyze-interview task
       ├─ fetch audio from Blob URL
       ├─ call analyzeInterview() (gemini.ts, unchanged)
       ├─ save Feedback to DB
       └─ update Response.analysisStatus → done | failed
```

---

## Schema Changes

Two new fields on `Response`:

```prisma
analysisStatus  String   @default("pending")   // pending | analyzing | done | failed
triggerRunId    String?                          // stored for Part 5 SSE subscription
```

One Prisma migration. No data loss on existing rows (defaults to "pending").

---

## Trigger.dev Task (`trigger/analyze-interview.ts`)

- Uses `schemaTask` with Zod for validated input
- Payload: `{ responseId, questionText, sessionType, audioUrl, frames, durationSeconds?, userId }`
- Retry: 3 attempts, exponential backoff (Gemini is occasionally flaky)
- Steps:
  1. Update `Response.analysisStatus` → `"analyzing"`
  2. Fetch audio from `audioUrl`, convert to base64
  3. Fetch user profile from DB for resume context
  4. Call `analyzeInterview()` from `src/lib/gemini.ts`
  5. Save `Feedback` record to DB
  6. Update `Response`: set `transcript`, `durationSeconds`, `audioUrl`, `analysisStatus` → `"done"`
- On unrecoverable error: update `analysisStatus` → `"failed"`, rethrow so Trigger.dev marks run as failed

---

## Modified `/api/analyze`

Becomes a thin enqueue endpoint:

1. Auth check (unchanged)
2. Validate request body with Zod (unchanged schema)
3. Verify `Response` belongs to authenticated user (unchanged)
4. Update `Response`: `analysisStatus = "analyzing"`
5. `tasks.trigger("analyze-interview", payload)` — fire and forget
6. Update `Response.triggerRunId` with returned handle's `id`
7. Return `{ runId, responseId }` with HTTP 202

---

## New `/api/responses/[id]/status`

- **Method:** GET
- **Auth:** session required; verifies response belongs to user
- **Response:**
  - `{ status: "pending" | "analyzing" | "done" | "failed" }`
  - When `status === "done"`: also includes `{ feedback, transcript }` inline (avoids second fetch)
  - When `status === "failed"`: includes `{ error: "Analysis failed" }`

---

## VideoRecorder Changes

New internal phase: `"waiting"` (between current `"processing"` and `"done"`).

Flow after stop:
1. Upload audio → get `audioUrl`
2. POST `/api/analyze` → get `{ runId, responseId }` (fast, HTTP 202)
3. Enter `waiting` phase — show "Analyzing your response…" with spinner
4. Poll `/api/responses/:id/status` every 3s
5. On `done`: call `onComplete(feedback, transcript)` — same interface as today
6. On `failed`: show error, return to `idle`

Part 5 will replace the `setInterval` polling with an SSE stream. The `onComplete` interface stays the same.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Gemini API error (transient) | Trigger.dev retries up to 3x with backoff |
| Gemini API error (permanent) | Task marks status `failed`; UI shows error |
| Audio fetch fails in task | Task throws; Trigger.dev retries |
| `/api/analyze` enqueue fails | Returns 500; VideoRecorder shows error immediately |
| Poll endpoint returns `failed` | VideoRecorder shows error, resets to idle |

---

## Files Changed / Created

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `analysisStatus`, `triggerRunId` to `Response` |
| `trigger/analyze-interview.ts` | New — Trigger.dev task |
| `trigger.config.ts` | New — Trigger.dev project config |
| `src/app/api/analyze/route.ts` | Replace Gemini call with `tasks.trigger()` |
| `src/app/api/responses/[id]/status/route.ts` | New — polling endpoint |
| `src/components/VideoRecorder.tsx` | Add `waiting` phase + polling loop |

---

## Out of Scope (Part 5)

- SSE stream replacing the polling loop
- Real-time progress metadata via `metadata.set()`
- Run subscription via Trigger.dev's `runs.subscribe()`
