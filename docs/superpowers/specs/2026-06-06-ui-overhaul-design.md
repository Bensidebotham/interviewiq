# UI Overhaul Design Spec

**Date:** 2026-06-06
**Status:** Approved

---

## Goal

Elevate InterviewIQ from a generic dark CRUD app to a product that looks like it was built by an actual company. The landing page should match the aesthetic quality of Fey (fey.com) and Chronicle (chroniclehq.com). The app shell should feel like a polished professional tool.

---

## Design Decisions

| Decision | Choice |
|---|---|
| Visual direction | B — Gradient Glow (indigo/violet, modern AI startup) |
| Treatment scope | 3 — Full gradient on landing; subtle gradient accents only in app |
| Navigation | A — Text sidebar with labels (elevated from current) |
| References | Fey (real product UI as hero, feature specificity), Chronicle (bento grid, editorial) |

---

## Design Tokens

```css
/* Backgrounds */
--bg-base:    #0a0a0f   /* slightly purple-tinted near-black */
--bg-surface: #111116
--bg-raised:  #18181f

/* Borders */
--border:     #1e1e25
--border-subtle: #161620

/* Accent */
--gradient:   linear-gradient(135deg, #6366f1, #8b5cf6)
--indigo:     #6366f1
--violet:     #8b5cf6

/* Text */
--text-primary:   #f5f5f8
--text-secondary: #52525c
--text-muted:     #3a3a45

/* Score accent */
--lime:  #a3e635   /* good scores, positive delta */
--amber: #fbbf24   /* medium scores */
--red:   #f87171   /* low scores, filler words */
```

**Typography:** Bricolage Grotesque (headlines, already installed) + Geist (body, already installed). No font changes needed.

---

## Reusable Patterns

These patterns appear across all app pages:

**Stats card:**
```
bg-[#111116] border border-[#1e1e25] border-t-indigo-500/30
rounded-lg p-4
```
- Large number: gradient text for key metrics (avg score, improvement)
- Plain white for counts
- Small muted label below

**Primary button:**
```
bg-gradient-to-r from-indigo-500 to-violet-600
hover:from-indigo-400 hover:to-violet-500
text-white font-semibold rounded-md px-4 py-2
```

**Ghost button:**
```
border border-[#1e1e25] text-[#52525c]
hover:border-indigo-500/40 hover:text-indigo-300
rounded-md px-4 py-2
```

**Active nav item:**
```
bg-indigo-500/10 border border-indigo-500/25 text-indigo-300
```

**Score/progress bar:**
```
bg-[#1e1e25] rounded-full h-1.5
fill: bg-gradient-to-r from-indigo-500 to-violet-500 (high)
      bg-amber-400 (mid)
      bg-red-400 (low)
```

**Filler word chip:**
```
bg-red-500/10 border border-red-500/20 text-red-400
text-xs px-2 py-0.5 rounded-full
```

---

## Landing Page (`/`)

### Nav bar
- Fixed, `backdrop-blur-md bg-[#0a0a0f]/80 border-b border-[#1e1e25]`
- Left: gradient logo mark (18×18px rounded square) + "InterviewIQ" wordmark
- Right: "Sign in" ghost link
- No other nav items

### Hero section
Two-column layout, `min-h-screen` with vertical centering:

**Left column:**
- Eyebrow: small uppercase tag — "AI Interview Coach" — with subtle border
- Headline: large (text-5xl/6xl), Bricolage Grotesque, tight tracking. Example: "Stop rehearsing. *Start performing.*" — italic on second line in muted white
- Subtext (text-lg, muted): "Record your answer. Gemini watches every frame and tells you exactly what to fix."
- Primary CTA button: "Start free — it takes 2 minutes"
- Social proof line below button: "Used by candidates targeting Google, Meta, Amazon"

**Right column:**
- Floating product card: real feedback UI mockup showing a session result
  - Question text at top
  - Overall score (large, gradient text)
  - 3 score bars (STAR, Delivery, Eye contact) with gradient fills
  - 2 filler word chips
- Radial gradient glow (`from-indigo-500/20`) behind the card
- Card has `backdrop-blur border border-indigo-500/15 rounded-xl`

**Background:**
- `#0a0a0f` base
- Radial gradient from top-center: `from-indigo-500/10 via-transparent`
- Subtle noise texture overlay (CSS or SVG)

### How it works (3 columns)
- Numbered 01 / 02 / 03
- Tight border cards, `bg-[#111116]`
- Each has: number (muted), bold title, 1-line description, small product preview image/mock
- Titles: "Record", "Analyze", "Improve"

### Bento grid (Chronicle-style)
3-column CSS grid, 2 rows:
- Row 1: Score breakdown card (col-span-2, tall) + Filler word detection card (col-span-1)
- Row 2: STAR framework check (col-span-1) + Transcript excerpt (col-span-1) + Eye contact note (col-span-1)

Each card: `bg-[#111116] border border-[#1e1e25] rounded-xl p-5`

Card content (real UI, not placeholder):
- **Score breakdown**: 5 labeled progress bars (Content, Delivery, Eye Contact, Body Language, Filler Words) with gradient fills and numeric scores
- **Filler words**: cluster of red chips (`um ×3`, `like ×5`, `uh ×2`)
- **STAR check**: 4 rows (Situation ✓, Task ✓, Action ✓, Result ✗) with muted missing-component label
- **Transcript**: 3-4 lines of monospace text with a "um" word highlighted in red
- **Eye contact**: large percentage number (e.g. "73%") + brief note ("Looked away frequently in the first 30s")

### Final CTA
- Centered, `py-24`
- Gradient headline: "Ready to ace your next interview?"
- Large primary button
- Muted subtext: "Free forever. No credit card."

---

## App Shell — Navigation (`Navigation.tsx`)

Sidebar: `w-56 bg-[#0d0d12] border-r border-[#1e1e25] flex flex-col`

**Top section:**
- Logo area: gradient logo mark + "InterviewIQ" wordmark, `px-4 py-5`
- "New session" button: gradient pill, `mx-3 mb-4`

**Nav items:** `px-3 space-y-0.5`
Each item: icon (lucide, 16px) + label, `rounded-md px-3 py-2 text-sm`
- Default: `text-[#52525c] hover:text-[#a0a0ac] hover:bg-[#18181f]`
- Active: `bg-indigo-500/10 border border-indigo-500/25 text-indigo-300`

Items: Dashboard → `/dashboard`, Profile → `/profile`
(No separate Sessions route exists — dashboard IS the session list)

**Bottom section:** `mt-auto px-3 pb-4`
- User row: GitHub avatar (24px circle) + name + settings icon
- Muted, `text-[#52525c]`

---

## Dashboard (`/dashboard`)

**Header:**
```
"Good morning, {firstName}"   text-2xl font-bold Bricolage  (use first word of session.user.name; fall back to "there" if unavailable)
"{N} sessions this week"      text-sm text-muted
```

**Stats row** (3 cards):
- Total sessions: white number
- Avg score: gradient number (`bg-gradient-to-r from-indigo-400 to-violet-400`)
- Score trend: lime if positive (`↑N pts`), muted if flat

**Session list:**
Table-like rows, `bg-[#111116] border border-[#1e1e25] rounded-lg divide-y divide-[#1e1e25]`

Each row:
- Left: session type badge + company name (bold) + date (muted)
- Right: score number (gradient if ≥80, amber if 60-79, red if <60) + chevron

**Empty state:**
Centered, gradient icon, "No sessions yet", "Start your first session to see your progress", gradient button.

---

## New Session Wizard (`/session/new`)

Centered layout, `max-w-lg mx-auto`, no sidebar overlap.

**Step indicator:** 2 dots — filled gradient for current/done, muted for pending.

**Step 1 — Session type:**
- Heading: "What type of session?"
- 3 cards (behavioral / technical / company-specific), each selectable
- Selected state: `border-indigo-500/50 bg-indigo-500/5`
- "Next" button (gradient, disabled until selection)

**Step 2 — Context:**
- Heading: "Tell us about the role"
- Company name input
- Job description textarea
- "Start session" button (gradient)

Form inputs: `bg-[#111116] border border-[#1e1e25] rounded-md focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30`

---

## Session / Interview Page (`/session/[id]`)

Two-column layout when feedback is visible; single column during recording.

**Question display:**
- Question number: muted small text
- Question text: `text-xl font-semibold` Bricolage, centered or left-aligned
- "Skip question" ghost link

**Video recorder:**
- Camera preview: rounded-xl, `border border-[#1e1e25]`
- Record button: gradient background, pulsing ring animation when recording
- Timer: monospace, appears during recording
- Stop button: replaces record button, red accent

**Feedback panel** (slides in after analysis):
- Overall score: large gradient number + label
- 5 score bars with labels + gradient fill — dimensions: Content/STAR, Delivery, Eye Contact, Body Language, Filler Words (matches Gemini feedback schema)
- Filler words section: chips
- STAR components: checkmarks or ✗
- Model answer: collapsible
- Transcript: collapsible, monospace

---

## Profile Page (`/profile`)

Standard form layout, `max-w-2xl`:
- Section heading: "Your Profile"
- Resume text: `<textarea>` with monospace font
- Target role / company / industry: text inputs
- Experience level: select
- Save button: gradient, right-aligned
- Success toast on save

---

## Sign-in Page (`/auth/signin`)

Full-screen centered card on gradient-glow background (same as landing hero background — `#0a0a0f` + radial indigo glow).

Card: `bg-[#111116] border border-[#1e1e25] rounded-xl p-8 max-w-sm`
- Logo mark + "InterviewIQ"
- Heading: "Sign in to continue"
- GitHub OAuth button: `border border-[#1e1e25] bg-[#18181f] hover:bg-[#1e1e25]` with GitHub icon
- Muted footnote: "We only use your GitHub account for authentication."

---

## Out of Scope

- Dark/light mode toggle
- Animations (GSAP scroll, entrance transitions) — static CSS only
- Mobile responsive layout — desktop first
- Component library changes (shadcn/ui stays)
- Any backend / API changes

---

## Implementation Notes

- All colors defined as Tailwind arbitrary values or CSS variables in `globals.css`
- `bg-base` should replace `bg-background` / `bg-zinc-950` throughout
- Keep existing component structure — this is a reskin, not a rewrite
- Navigation.tsx can be refactored in place
- Landing page (`src/app/page.tsx`) will be a near-complete rewrite — most complex file
- Each page is its own task; start with Navigation + design tokens, then landing, then app pages
