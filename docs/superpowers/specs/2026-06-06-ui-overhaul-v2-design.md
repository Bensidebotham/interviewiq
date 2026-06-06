# UI Overhaul v2 — Design Spec

**Date:** 2026-06-06
**Status:** Approved

---

## Goal

Replace the sparse, text-only recording and dashboard layouts with a rich, analytics-forward UI that feels like a professional coaching tool. Three screens are changing: the recording/session page, the post-recording analytics page, and the dashboard.

---

## Design Decisions

| Screen | Current | New |
|---|---|---|
| Recording page | Question card + VideoRecorder stacked, empty right column | Studio Focus: question card above large centered video, waveform, controls below |
| Post-recording | FeedbackPanel in a side column | Full-page analytics: video replay + annotated timeline + transcript + coaching panel |
| Dashboard | 3 stat cards + flat list | Sparkline chart + rich session rows with mini bar charts |

---

## Screen 1: Recording page (`/session/[id]` — phase: "recording")

### Layout

Single centered column, `max-w-2xl mx-auto`, no two-column split during recording:

```
┌─────────────────────────────────────┐
│  Q2 of 5  [Behavioral]   ████░░  ← progress bar (gradient fill)
│                                      │
│  ┌───────────────────────────────┐   │
│  │  CATEGORY (muted uppercase)   │   │ ← question card
│  │  Question text — large, bold  │   │
│  │  ── Tip: ... (indigo border)  │   │
│  └───────────────────────────────┘   │
│                                      │
│  ┌───────────────────────────────┐   │
│  │                               │   │
│  │   [REC 0:23]    video feed    │   │ ← video recorder (large, 16:9)
│  │                               │   │
│  │   ▁▃▅▃▁▂▅▇▅▂▁ ← waveform    │   │
│  └───────────────────────────────┘   │
│                                      │
│     [●  Stop & submit answer]        │ ← gradient button, centered
└─────────────────────────────────────┘
```

### Details

- **Progress bar**: gradient fill `linear-gradient(90deg, #6366f1, #8b5cf6)`, sits inline with "Q2 of 5 · Behavioral" label at top
- **Question card**: `bg-[#111116] border border-[#1e1e25] rounded-xl p-6`, category label `text-xs uppercase tracking-widest text-[#52525c]`, question text `text-xl font-semibold` with `var(--font-display)`, tip as `border-l-2 border-indigo-800 pl-3 text-sm text-indigo-300/70`
- **Video element**: `rounded-xl border border-[#1e1e25]`, aspect ratio 16:9, fills full column width. Recording indicator top-left: red dot + "REC 0:23" in `bg-red-500/15 border border-red-500/30 rounded-full`. Waveform animation positioned at bottom of video.
- **Waveform**: 12 bars, heights animated with CSS `@keyframes` pulse at staggered delays. Color: `#6366f1`/`#8b5cf6`. Plays only while recording, hidden otherwise.
- **Stop button**: full-width, gradient, below video. Text: "Stop & submit answer" with a square stop icon left.

### State: not yet recording (before record button pressed)

VideoRecorder already handles its own internal state. This spec only changes the outer page layout wrapping it — the VideoRecorder component itself is unchanged.

---

## Screen 2: Analytics page (`/session/[id]` — phase: "feedback")

Replaces the current side-panel FeedbackPanel. This is a full-page layout that appears after the user submits their answer.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Answer Review  ·  Behavioral · Q2 of 5  [← Q1]  [Q3 →]    │ ← top bar
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│  VIDEO PLAYER (16:9)         │  [Coaching] [Scores] [Model] │ ← tabs
│  ┌────────────────────────┐  │                              │
│  │  [⚠ Missing Result]    │  │  ✓ What went well            │
│  │                        │  │  ──────────────────────────  │
│  │    [score badge: 8.2]  │  │  ⚠ Missing: Result  → 1:18  │
│  │                        │  │  ──────────────────────────  │
│  │      [▶ play]          │  │  ✗ Filler words (10)         │
│  └────────────────────────┘  │    [um×3] [like×5] [uh×2]   │
│                              │    Before/after example      │
│  ANNOTATED TIMELINE          │  ──────────────────────────  │
│  [S███][T██][A████░][R??]    │  ↑ Delivery tip              │
│  ● ●        ● ● ●            │                              │
│                              │  [Re-record]  [Next Q →]     │
│  TRANSCRIPT                  │                              │
│  0:00 [S] "So there was…"    │                              │
│  0:07 [S] "um we both…"      │                              │
│  0:16 [T] "My job was…"      │                              │
│  0:28 [A] "I scheduled…"     │                              │
│  1:18 [R?] — missing —       │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Components

#### Video player
- Replays the recorded video. The `videoUrl` blob URL is passed down from the VideoRecorder via `onComplete` callback (add `videoUrl: string` to the callback signature alongside feedback and transcript).
- Score badge top-right: `bg-black/75 backdrop-blur border border-indigo-500/20 rounded-lg`, shows `overallScore` with gradient text
- Active segment label top-left: shows which STAR component is currently playing (derived from playback position + timeline segments). Uses amber for Action/needs-work, red for missing, green for present components.
- Play/pause button centered when paused.

#### Annotated timeline

A `div` bar below the video. Segments are calculated from transcript word counts as proportional widths (no timestamps required — approximated from word count distribution):

```
segment width = (word count in segment / total words) * 100%
```

**Segment colors:**
- Situation present → `bg-green-500/20 border-r border-green-500/30`
- Task present → same
- Action present but missing Result → `bg-amber-400/12 border-r border-amber-400/30`
- Result missing → `bg-red-400/8`

**STAR labels**: `S`, `T`, `A`, `R?` positioned at segment start, `text-[6px] font-bold` in matching color.

**Filler word dots**: Red `●` dots positioned at approximate timestamps. Position = `(filler_word_index / total_filler_words) * action_segment_width + action_segment_start`. Rendered as `w-2 h-2 rounded-full bg-red-500 absolute`.

**Playhead**: A `w-0.5 bg-indigo-500 absolute` line that advances as video plays. Updates on `timeupdate` event.

Clicking anywhere on the timeline seeks the video to that position.

#### Transcript panel

Scrollable panel below the timeline. Each line is a `div` with:
- Timestamp (approximate, derived from word position in transcript)
- STAR label badge: `[S]` green, `[T]` green, `[A]` amber, `[R?]` red
- Transcript text — filler words wrapped in `<span class="bg-red-500/15 text-red-400 rounded px-0.5">`
- Hover state: `hover:bg-indigo-500/5 cursor-pointer`, click seeks video
- Active line (currently playing): `bg-indigo-500/5 border border-indigo-500/10 rounded`

The transcript string is split into sentences. STAR segments are assigned by splitting sentences proportionally (S = first ~25%, T = next ~15%, A = next ~45%, R = last ~15%). If `missingStarComponents` includes "Result", the last segment renders as the missing state.

Filler word highlighting: scan each sentence for strings matching items in `fillerWords[]` array, wrap matches in the red span.

#### Coaching panel (right column, tabbed)

**Tab 1 — Coaching:**

Four sections with colored left borders:

1. **What went well** (green `border-l-2 border-green-500`): Derived from `overallFeedback` + high scores. Static positive framing.
2. **Missing components** (amber `border-l-2 border-amber-400`): One card per item in `missingStarComponents[]`. Each card has a "→ timestamp" jump button that seeks the video to the end of the Action segment.
3. **Filler words** (red `border-l-2 border-red-500`): Lists each filler word as a chip with count. Below the chips: a before/after example block. "Before: `…I, um, scheduled…`" → "After: `…I scheduled…` (pause instead of um)". The "before" example is extracted from the first transcript sentence containing the filler word.
4. **Delivery tip** (indigo `border-l-2 border-indigo-500`): `eyeContactFeedback` or `deliveryFeedback`, whichever is lower score.

**Tab 2 — Scores:**
The existing FeedbackPanel score bars, reused as-is inside the tab.

**Tab 3 — Model answer:**
`deliveryFeedback` + `modelAnswer` in a readable prose layout.

**Buttons:**
- "Re-record": resets phase back to "recording", clears feedback state
- "Next question" / "Finish session": existing `nextQuestion()` logic

### New component: `AnalyticsPanel`

Extract the entire feedback phase layout into `src/components/AnalyticsPanel.tsx`.

Props:
```ts
type AnalyticsPanelProps = {
  feedback: FeedbackData
  transcript: string
  videoUrl: string
  questionIndex: number
  totalQuestions: number
  isLastQuestion: boolean
  onNext: () => void
  onReRecord: () => void
}
```

The session page passes these props and renders `<AnalyticsPanel>` when `phase === "feedback"`.

### VideoRecorder callback change

Update `onComplete` callback signature to include the video blob URL:

```ts
// Before
onComplete: (feedback: unknown, transcript: string) => void

// After
onComplete: (feedback: unknown, transcript: string, videoUrl: string) => void
```

Inside VideoRecorder, after recording stops, create `URL.createObjectURL(blob)` and pass it to `onComplete`. Store `videoUrl` in session page state alongside `currentFeedback` and `currentTranscript`.

---

## Screen 3: Dashboard (`/dashboard`)

### Layout changes

**Stats row** — unchanged (3 cards, same tokens).

**New: score trend sparkline** — add between stats row and session list:

```
┌─────────────────────────────────────┐
│  Score trend            last 6 →    │
│                                      │
│  ···················/               │  ← SVG polyline, gradient stroke
└─────────────────────────────────────┘
```

- `bg-[#111116] border border-[#1e1e25] rounded-lg p-4`
- SVG with `viewBox="0 0 300 48"`, `preserveAspectRatio="none"`, `width="100%"`
- Data points: last 6 session avg scores, mapped to y position (`y = 48 - (score/10)*40 + 4`)
- Polyline stroke: `url(#sparkGradient)` linear gradient indigo→violet, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`
- Area fill: same gradient with `opacity="0.15"`
- Last point dot: `r="3"` filled `#a78bfa`, white inner stroke
- If fewer than 2 sessions: hide the sparkline, show "Complete 2+ sessions to see your trend" in muted text

**Session list rows** — richer layout:

```
[icon] Company · Type · N questions     [████▄▄] 8.2
       Jun 5 · 12 min                              ↑ mini bar + score
```

Each row adds:
- **Session type icon**: `rounded-lg w-8 h-8 flex items-center justify-center` — `B` for behavioral (indigo bg), `T` for technical (amber bg), `C` for company-specific (violet bg). Text `text-xs font-bold`.
- **Mini bar chart**: 4 vertical bars (`contentScore`, `deliveryScore`, `eyeContactScore`, `bodyLanguageScore`) each `w-1 rounded-sm`. Height proportional to score. Color follows score threshold: ≥8 → gradient, ≥6 → amber, <6 → red.
- **Score**: existing gradient/amber/red coloring, bumped to `text-lg font-black`.
- Row hover: `hover:bg-[#18181f]`

---

## File Map

| File | Change |
|---|---|
| `src/app/session/[id]/page.tsx` | New recording layout (Studio Focus), new feedback phase (renders AnalyticsPanel), store `videoUrl` in state |
| `src/components/AnalyticsPanel.tsx` | New component — full analytics page layout |
| `src/components/VideoRecorder.tsx` | Add `videoUrl` to `onComplete` callback |
| `src/app/dashboard/page.tsx` | Add sparkline, richer session rows |
| `src/components/FeedbackPanel.tsx` | Kept as-is — reused inside AnalyticsPanel's Scores tab |

---

## Out of Scope

- Backend/API changes (no new fields, no timestamp data from Gemini — timeline is approximated from word count)
- Animations beyond the waveform pulse and CSS transitions
- Mobile layout
- New session page, profile page, sign-in page — already overhauled in v1
