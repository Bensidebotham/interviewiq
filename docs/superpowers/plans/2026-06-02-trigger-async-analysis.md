# Trigger.dev Async Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Gemini AI analysis off the HTTP request cycle into a Trigger.dev background task, so `/api/analyze` returns immediately with a run ID and the client polls for completion.

**Architecture:** `/api/analyze` enqueues a Trigger.dev task and returns `{ runId, responseId }` (HTTP 202). The task fetches audio from Blob, calls Gemini, saves feedback to DB, and updates `Response.analysisStatus`. A new `/api/responses/[id]/status` endpoint serves the polling client. `VideoRecorder` gains a `waiting` phase that polls every 3s until analysis completes.

**Tech Stack:** `@trigger.dev/sdk` (v3 schemaTask API), Prisma, Zod, Next.js App Router

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `trigger/analyze-interview.ts` | Create | Trigger.dev background task — fetches audio, calls Gemini, saves feedback |
| `trigger.config.ts` | Create | Trigger.dev project config |
| `prisma/schema.prisma` | Modify | Add `analysisStatus`, `triggerRunId` to `Response` |
| `src/app/api/analyze/route.ts` | Modify | Replace sync Gemini call with `tasks.trigger()` enqueue |
| `src/app/api/responses/[id]/status/route.ts` | Create | Polling endpoint — returns status + feedback when done |
| `src/components/VideoRecorder.tsx` | Modify | Add `waiting` phase, poll interval, poll cleanup |

---

## Task 1: Create Trigger.dev account and project

**Files:**
- Modify: `.env.local`
- Create: `trigger.config.ts`

- [ ] **Step 1: Sign up and create a project**

Go to https://trigger.dev, sign up (GitHub OAuth works), and create a new project. Choose "Next.js" as the framework. Copy:
- **Project ref** — looks like `proj_xxxxxxxxxxxxxxxx` (shown in project settings)
- **Secret key** — looks like `tr_dev_xxxx` (from API Keys → Dev)

- [ ] **Step 2: Install the SDK**

```bash
cd /Users/ben/interviewiq && npm install @trigger.dev/sdk
```

Expected: `@trigger.dev/sdk` added to `package.json` dependencies.

- [ ] **Step 3: Create `trigger.config.ts`**

Create `/Users/ben/interviewiq/trigger.config.ts`:

```ts
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "proj_xxxxxxxxxxxxxxxx", // replace with your actual project ref
  dirs: ["./trigger"],
});
```

- [ ] **Step 4: Add secret key to `.env.local`**

Add to `/Users/ben/interviewiq/.env.local`:

```
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxxxxxxxxxx
```

- [ ] **Step 5: Commit**

```bash
cd /Users/ben/interviewiq && git add trigger.config.ts package.json package-lock.json && git commit -m "feat(trigger): install sdk and add project config"
```

---

## Task 2: Add Prisma schema fields and migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add fields to the `Response` model**

In `/Users/ben/interviewiq/prisma/schema.prisma`, replace the current `Response` model:

```prisma
model Response {
  id               String           @id @default(cuid())
  sessionId        String
  session          InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  questionText     String           @db.Text
  questionCategory String?
  transcript       String?          @db.Text
  audioUrl         String?
  durationSeconds  Int?
  analysisStatus   String           @default("pending")
  triggerRunId     String?
  feedback         Feedback?
  createdAt        DateTime         @default(now())
}
```

- [ ] **Step 2: Create and run the migration**

```bash
cd /Users/ben/interviewiq && npx prisma migrate dev --name add-analysis-status
```

Expected output: `✓ Database migrated` and a new file in `prisma/migrations/`.

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd /Users/ben/interviewiq && npx prisma generate
```

Expected: `✓ Generated Prisma Client`.

- [ ] **Step 4: Commit**

```bash
cd /Users/ben/interviewiq && git add prisma/ && git commit -m "feat(db): add analysisStatus and triggerRunId to Response"
```

---

## Task 3: Create the Trigger.dev background task

**Files:**
- Create: `trigger/analyze-interview.ts`

- [ ] **Step 1: Create the trigger directory and task file**

Create `/Users/ben/interviewiq/trigger/analyze-interview.ts`:

```ts
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { analyzeInterview } from "../src/lib/gemini";

const schema = z.object({
  responseId: z.string(),
  questionText: z.string(),
  sessionType: z.string(),
  audioUrl: z.string().url(),
  frames: z.array(z.string()).min(1).max(10),
  durationSeconds: z.number().optional(),
  userId: z.string(),
});

export const analyzeInterviewTask = schemaTask({
  id: "analyze-interview",
  schema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload) => {
    const {
      responseId,
      questionText,
      sessionType,
      audioUrl,
      frames,
      durationSeconds,
      userId,
    } = payload;

    try {
      // Fetch audio from Blob and convert to base64
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`);
      const audioBuffer = await audioRes.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");

      // Get user profile and session context
      const [profile, response] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.response.findUnique({
          where: { id: responseId },
          include: { session: true },
        }),
      ]);

      if (!response) throw new Error("Response not found");

      // Call Gemini
      const feedback = await analyzeInterview({
        questionText,
        sessionType,
        audioBase64,
        frames,
        resumeText: profile?.resumeText ?? undefined,
        targetRole: profile?.targetRole ?? undefined,
        targetCompany: profile?.targetCompany ?? (response.session.companyName ?? undefined),
        industry: profile?.industry ?? (response.session.industry ?? undefined),
        jobDescription: response.session.jobDescription ?? undefined,
      });

      // Save feedback
      await prisma.feedback.create({
        data: {
          responseId,
          overallScore: feedback.overallScore,
          contentScore: feedback.contentScore,
          deliveryScore: feedback.deliveryScore,
          eyeContactScore: feedback.eyeContactScore,
          bodyLanguageScore: feedback.bodyLanguageScore,
          contentFeedback: feedback.contentFeedback,
          deliveryFeedback: feedback.deliveryFeedback,
          eyeContactFeedback: feedback.eyeContactFeedback,
          bodyLanguageFeedback: feedback.bodyLanguageFeedback,
          overallFeedback: feedback.overallFeedback,
          modelAnswer: feedback.modelAnswer,
          fillerWords: feedback.fillerWords,
          missingStarComponents: feedback.missingStarComponents,
          resumeAlignmentNotes: feedback.resumeAlignmentNotes,
        },
      });

      // Update response with results
      await prisma.response.update({
        where: { id: responseId },
        data: {
          transcript: feedback.transcript,
          durationSeconds: durationSeconds ?? null,
          audioUrl,
          analysisStatus: "done",
        },
      });

      return { transcript: feedback.transcript };
    } catch (err) {
      // Mark as failed so the poll endpoint can surface the error
      await prisma.response
        .update({ where: { id: responseId }, data: { analysisStatus: "failed" } })
        .catch(() => {});
      throw err;
    }
  },
});
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ben/interviewiq && git add trigger/ && git commit -m "feat(trigger): add analyze-interview background task"
```

---

## Task 4: Modify `/api/analyze` to enqueue the task

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Replace the route with the enqueue version**

Replace the entire contents of `/Users/ben/interviewiq/src/app/api/analyze/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk/v3"
import { z } from "zod"

const analyzeSchema = z.object({
  responseId: z.string(),
  questionText: z.string(),
  sessionType: z.string(),
  audioUrl: z.string().url(),
  frames: z.array(z.string()).min(1).max(10),
  durationSeconds: z.number().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = analyzeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { responseId, questionText, sessionType, audioUrl, frames, durationSeconds } = parsed.data

  const response = await prisma.response.findFirst({
    where: {
      id: responseId,
      session: { userId: session.user.id },
    },
  })
  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 })
  }

  const handle = await tasks.trigger("analyze-interview", {
    responseId,
    questionText,
    sessionType,
    audioUrl,
    frames,
    durationSeconds,
    userId: session.user.id,
  })

  await prisma.response.update({
    where: { id: responseId },
    data: {
      analysisStatus: "analyzing",
      triggerRunId: handle.id,
    },
  })

  return NextResponse.json({ runId: handle.id, responseId }, { status: 202 })
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ben/interviewiq && git add src/app/api/analyze/route.ts && git commit -m "feat(api): make /api/analyze async — enqueue Trigger.dev task"
```

---

## Task 5: Create the polling status endpoint

**Files:**
- Create: `src/app/api/responses/[id]/status/route.ts`

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p /Users/ben/interviewiq/src/app/api/responses/\[id\]/status
```

Create `/Users/ben/interviewiq/src/app/api/responses/[id]/status/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const response = await prisma.response.findFirst({
    where: {
      id,
      session: { userId: session.user.id },
    },
    include: { feedback: true },
  })

  if (!response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (response.analysisStatus === "done" && response.feedback) {
    return NextResponse.json({
      status: "done",
      feedback: response.feedback,
      transcript: response.transcript,
    })
  }

  if (response.analysisStatus === "failed") {
    return NextResponse.json({ status: "failed", error: "Analysis failed" })
  }

  return NextResponse.json({ status: response.analysisStatus })
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ben/interviewiq && git add src/app/api/responses/ && git commit -m "feat(api): add response status polling endpoint"
```

---

## Task 6: Update VideoRecorder with waiting phase and polling

**Files:**
- Modify: `src/components/VideoRecorder.tsx`

- [ ] **Step 1: Replace VideoRecorder with the updated version**

Replace the entire contents of `/Users/ben/interviewiq/src/components/VideoRecorder.tsx`:

```ts
"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Mic, MicOff, Square, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

type Phase = "idle" | "recording" | "processing" | "waiting" | "done"

type Props = {
  sessionId: string
  questionText: string
  questionCategory: string
  sessionType: string
  onComplete: (feedback: unknown, transcript: string) => void
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = 480
  canvas.height = 270
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.6).split(",")[1]
}

async function uploadAudio(audioBlob: Blob, responseId: string): Promise<string> {
  const formData = new FormData()
  formData.append("audio", new File([audioBlob], `recording-${responseId}.webm`, { type: audioBlob.type || "audio/webm" }))
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Audio upload failed")
  return data.url
}

export function VideoRecorder({ sessionId, questionText, questionCategory, sessionType, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capturedFramesRef = useRef<string[]>([])
  const startTimeRef = useRef<number>(0)
  const responseIdRef = useRef<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => () => {
    stopStream()
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
  }, [stopStream])

  const startPolling = useCallback((responseId: string) => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/responses/${responseId}/status`)
        const data = await res.json()

        if (data.status === "done") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          setPhase("done")
          onComplete(data.feedback, data.transcript ?? "")
        } else if (data.status === "failed") {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          setError(data.error ?? "Analysis failed. Please try again.")
          setPhase("idle")
        }
      } catch {
        // Network error during poll — keep trying
      }
    }, 3000)
  }, [onComplete])

  const startRecording = async () => {
    setError(null)
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionText, questionCategory }),
      })
      if (!res.ok) throw new Error("Failed to create response record")
      const { response } = await res.json()
      responseIdRef.current = response.id

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      audioChunksRef.current = []
      capturedFramesRef.current = []

      const audioMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"

      const audioRecorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), { mimeType: audioMime })
      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      audioRecorderRef.current = audioRecorder
      audioRecorder.start(1000)

      startTimeRef.current = Date.now()
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      frameTimerRef.current = setInterval(() => {
        if (videoRef.current) {
          capturedFramesRef.current.push(captureFrame(videoRef.current))
          if (capturedFramesRef.current.length > 8) capturedFramesRef.current.shift()
        }
      }, 5000)

      setPhase("recording")
    } catch {
      setError("Camera/microphone access denied. Please allow permissions and try again.")
    }
  }

  const stopAndAnalyze = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)

    if (videoRef.current) capturedFramesRef.current.push(captureFrame(videoRef.current))

    audioRecorderRef.current?.stop()
    await new Promise((r) => setTimeout(r, 300))

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
    audioChunksRef.current = []

    const all = capturedFramesRef.current
    const frames =
      all.length <= 6
        ? all
        : Array.from({ length: 6 }, (_, i) => all[Math.round((i * (all.length - 1)) / 5)])
    capturedFramesRef.current = []

    stopStream()
    setPhase("processing")

    try {
      setProcessingStep("Uploading recording…")
      const audioUrl = await uploadAudio(audioBlob, responseIdRef.current!)

      setProcessingStep("Queuing analysis…")
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: responseIdRef.current,
          questionText,
          sessionType,
          audioUrl,
          frames,
          durationSeconds: elapsed,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to queue analysis")
      }

      const { responseId } = await res.json()
      setPhase("waiting")
      startPolling(responseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("idle")
    }
  }

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 border border-gray-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Video className="h-10 w-10" />
            <span className="text-sm">Camera preview will appear here</span>
          </div>
        )}
        {phase === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold text-white">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {phase === "idle" && (
          <Button onClick={startRecording} size="lg" className="bg-indigo-600 hover:bg-indigo-500 gap-2">
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {phase === "recording" && (
          <Button
            onClick={stopAndAnalyze}
            size="lg"
            className="bg-red-600 hover:bg-red-500 gap-2 animate-pulse"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop & Analyze
          </Button>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">{processingStep}</p>
          </div>
        )}

        {phase === "waiting" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">Analyzing your response…</p>
            <p className="text-xs text-gray-600">This takes about 15–20 seconds</p>
          </div>
        )}

        {phase === "idle" && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MicOff className="h-3 w-3" /> Speak clearly and look at the camera
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/ben/interviewiq && git add src/components/VideoRecorder.tsx && git commit -m "feat(ui): add waiting phase and polling to VideoRecorder"
```

---

## Task 7: Connect Trigger.dev env vars to Vercel and test locally

**Files:**
- `.env.local` (already updated in Task 1)

- [ ] **Step 1: Pull current Vercel env**

```bash
cd /Users/ben/interviewiq && npx vercel env pull .env.local
```

- [ ] **Step 2: Add TRIGGER_SECRET_KEY to Vercel**

```bash
cd /Users/ben/interviewiq && npx vercel env add TRIGGER_SECRET_KEY
```

When prompted: paste the `tr_dev_xxxx` key, select "Development" environment.

For production you'll need a separate `tr_live_xxxx` key from Trigger.dev → API Keys → Production.

- [ ] **Step 3: Start the Trigger.dev dev worker in a second terminal**

In a new terminal tab (keep `npm run dev` running in the first):

```bash
cd /Users/ben/interviewiq && npx trigger.dev@latest dev
```

Expected: `Connected to Trigger.dev` and the worker registers the `analyze-interview` task. You'll see task runs appear in the Trigger.dev dashboard at https://trigger.dev.

- [ ] **Step 4: Verify the app typechecks**

```bash
cd /Users/ben/interviewiq && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual smoke test**

With both `npm run dev` and `npx trigger.dev@latest dev` running:

1. Open http://localhost:3030, sign in
2. Start a new session, record a short response (10–15 seconds), click Stop & Analyze
3. Verify: the UI immediately shows "Analyzing your response…" spinner
4. After 15–20 seconds: verify feedback panel appears with scores and transcript
5. Check Trigger.dev dashboard — the run should appear as "Completed"

- [ ] **Step 6: Push to GitHub**

```bash
cd /Users/ben/interviewiq && git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** All sections covered — schema changes (Task 2), Trigger.dev task (Task 3), modified API (Task 4), status endpoint (Task 5), VideoRecorder (Task 6), env setup (Task 7).
- **No placeholders:** All steps have complete code.
- **Type consistency:** `analyzeInterviewTask` exported from `trigger/analyze-interview.ts`, but not imported by name in the API route — `tasks.trigger("analyze-interview", ...)` uses the string ID, so no type mismatch risk. The status endpoint returns `{ feedback, transcript }` matching what `onComplete(feedback, transcript)` in the session page already handles.
- **Path aliases:** `trigger/analyze-interview.ts` uses relative imports (`../src/lib/...`) rather than `@/` aliases to avoid any bundler ambiguity in the Trigger.dev worker.
