# InterviewIQ — Project Context for Claude

## What This Is

An AI-powered interview practice platform. Users record themselves answering interview questions (behavioral, technical, company-specific), and Gemini AI analyzes the video/audio to score and give feedback on: content & STAR structure, verbal delivery, eye contact, body language, filler words, and resume alignment.

**Resume purpose:** This is a portfolio project intended to showcase: full-stack TypeScript, relational database design, multimodal AI integration, OAuth, background job processing, real-time features, testing, and CI/CD deployment. It is the primary project replacing the resume's weaker entries.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI components | shadcn/ui (base-ui), lucide-react |
| Auth | NextAuth v4 (OAuth — Google) |
| Database | PostgreSQL via Neon, Prisma ORM |
| AI | Google Gemini 1.5 Flash (multimodal: audio + video frames) |
| Validation | Zod |
| Package manager | npm |

**Not yet added (build targets):**
- Trigger.dev — background job processing for async AI analysis
- Vercel Blob — cloud storage for audio/video recordings
- Jest + Playwright — unit and E2E tests
- GitHub Actions — CI/CD pipeline
- Docker — containerized dev/prod environment

---

## What's Already Built

### Pages & Routes

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Done | Landing page with feature cards |
| `/auth/signin` | ✅ Done | OAuth sign-in page |
| `/dashboard` | ✅ Done | Session list, stats (sessions, questions answered, avg score) |
| `/profile` | ✅ Done | Resume text, target role/company/industry inputs |
| `/session/new` | ✅ Done | 2-step wizard: session type → context (company, job description) |
| `/session/[id]` | ✅ Done | Live interview: question display, video recorder, feedback panel |

### API Routes

| Endpoint | Method | What it does |
|---|---|---|
| `/api/auth/[...nextauth]` | — | NextAuth OAuth handler |
| `/api/sessions` | POST | Create new interview session |
| `/api/sessions/[id]` | GET, PATCH | Fetch session; PATCH marks it complete |
| `/api/responses` | POST | Create a response record before recording starts |
| `/api/analyze` | POST | Accepts audio (base64) + video frames, calls Gemini, saves Feedback to DB |
| `/api/profile` | GET, PUT | Fetch and update user profile |

### Core Components

- **`VideoRecorder`** — captures audio (MediaRecorder) and video frames (canvas snapshot every 5s), encodes to base64, calls `/api/analyze`, surfaces status to parent
- **`FeedbackPanel`** — displays all 5 scores with progress bars, filler words, missing STAR components, resume alignment notes, expandable model answer and transcript
- **`Navigation`** — sidebar nav

### Libraries

- **`src/lib/gemini.ts`** — wraps Gemini 1.5 Flash; sends system prompt + audio inline data + up to 6 evenly-spaced JPEG frames; returns typed `FeedbackResult` (13 fields)
- **`src/lib/questions.ts`** — question bank (behavioral, situational, technical); `getQuestionsForSession()` filters by type/industry and randomizes
- **`src/lib/auth.ts`** — NextAuth config
- **`src/lib/prisma.ts`** — Prisma client singleton

### Database Schema (Prisma)

```
User → Profile (1:1)
User → InterviewSession (1:many)
InterviewSession → Response (1:many)
Response → Feedback (1:1)
```

Key models:
- `Profile` — resumeText, targetRole, targetCompany, industry, experience
- `InterviewSession` — sessionType, industry, companyName, jobDescription, status, questions (JSON)
- `Response` — questionText, transcript, durationSeconds
- `Feedback` — overallScore, contentScore, deliveryScore, eyeContactScore, bodyLanguageScore, all feedback strings, fillerWords[], missingStarComponents[], resumeAlignmentNotes

---

## What Is NOT Built Yet

These are the remaining build targets, roughly in priority order:

1. **Deploy to Vercel** — highest priority; the app needs a live URL for the resume
2. **Trigger.dev async analysis** — move the Gemini call off the request/response cycle; currently blocks for ~15s which will timeout in prod
3. **SSE/polling for analysis status** — frontend needs to poll or stream while Trigger.dev processes
4. **Vercel Blob storage** — store audio/video recordings for replay and to support async processing
5. **Docker + docker-compose** — containerize for dev/prod parity
6. **GitHub Actions CI** — lint, typecheck, test on push
7. **Jest tests** — unit tests for lib functions (gemini.ts, questions.ts, API route logic)
8. **Playwright E2E** — at minimum: sign-in, new session, session completion flows

---

## Environment Variables Required

```
DATABASE_URL=           # Neon PostgreSQL connection string
DIRECT_URL=             # Neon direct connection (for Prisma migrations)
GOOGLE_GEMINI_API_KEY=  # Google AI Studio API key
NEXTAUTH_SECRET=        # Random secret for NextAuth
NEXTAUTH_URL=           # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=       # OAuth app client ID
GOOGLE_CLIENT_SECRET=   # OAuth app client secret
```

---

## Development

```bash
npm run dev     # starts Next.js dev server (via scripts/dev.js)
npm run build   # production build
npm run lint    # eslint
```

---

## Architecture Notes

- The analyze API call is currently synchronous — Gemini takes ~15s, which will hit Vercel's function timeout. The fix is Trigger.dev: move analysis to a background task, poll/stream the result from the frontend.
- Video frames are captured client-side via canvas snapshot (480×270 JPEG at 0.6 quality) every 5s, capped at 8 frames. On stop, 6 evenly-spaced frames are selected and sent to the API as base64.
- Audio is captured separately from video using the audio tracks of the MediaStream, encoded as `audio/webm;codecs=opus`.
- Questions are stored as JSON in `InterviewSession.questions` on session creation (not normalized), since the question bank is static.
