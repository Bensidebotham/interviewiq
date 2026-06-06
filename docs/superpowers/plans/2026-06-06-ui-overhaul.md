# UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin every page of InterviewIQ to match the approved gradient-glow design — indigo/violet accents on a purple-tinted near-black base, with full gradient treatment on the landing page and subtle gradient accents only inside the app.

**Architecture:** Pure visual reskin — no backend, API, or data model changes. All changes are in Tailwind classes, CSS variables, and JSX structure. The existing component boundaries (Navigation, FeedbackPanel, VideoRecorder) are preserved; only their styling changes. The landing page bento grid section is rebuilt to embed real product UI content.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, Bricolage Grotesque + Geist fonts (already installed)

**Design spec:** `docs/superpowers/specs/2026-06-06-ui-overhaul-design.md`

---

## File Map

| File | Change type | What changes |
|---|---|---|
| `src/app/globals.css` | Modify | Update CSS vars to new color tokens; add `.gradient-text` utility |
| `src/app/layout.tsx` | Modify | Body bg `#09090b` → `#0a0a0f` |
| `src/components/Navigation.tsx` | Modify | Gradient logo mark, "New session" pill, new active state, bottom user row |
| `src/app/page.tsx` | Modify | Bento grid rebuilt with real product UI; background token update |
| `src/app/dashboard/page.tsx` | Modify | Stats cards with top-border accent; session list reskin; greeting |
| `src/app/auth/signin/page.tsx` | Modify | Gradient-glow full-screen background; card reskin |
| `src/app/session/new/page.tsx` | Modify | Step dots indicator; selection card hover states; input styling |
| `src/components/FeedbackPanel.tsx` | Modify | Gradient progress bars; gradient overall score; filler chip colors |
| `src/app/profile/page.tsx` | Modify | Gradient save button; input/textarea/chip styling |

---

## Task 1: CSS tokens + layout base

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

The body background and all shadcn-derived color references currently use `#09090b` (zinc-950). Replace the dark-mode CSS variables and body color with the new purple-tinted tokens so every page picks up the new base automatically.

- [ ] **Step 1: Update the `.dark` CSS variables block in `globals.css`**

Replace the entire `.dark { ... }` block (lines 86–118) with:

```css
.dark {
  --background: #0a0a0f;
  --foreground: #f5f5f8;
  --card: #111116;
  --card-foreground: #f5f5f8;
  --popover: #111116;
  --popover-foreground: #f5f5f8;
  --primary: #6366f1;
  --primary-foreground: #ffffff;
  --secondary: #18181f;
  --secondary-foreground: #f5f5f8;
  --muted: #18181f;
  --muted-foreground: #52525c;
  --accent: #18181f;
  --accent-foreground: #f5f5f8;
  --destructive: oklch(0.704 0.191 22.216);
  --border: #1e1e25;
  --input: #1e1e25;
  --ring: #6366f1;
  --chart-1: #6366f1;
  --chart-2: #8b5cf6;
  --chart-3: #a3e635;
  --chart-4: #fbbf24;
  --chart-5: #f87171;
  --sidebar: #0d0d12;
  --sidebar-foreground: #f5f5f8;
  --sidebar-primary: #6366f1;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #18181f;
  --sidebar-accent-foreground: #f5f5f8;
  --sidebar-border: #1e1e25;
  --sidebar-ring: #6366f1;
}
```

- [ ] **Step 2: Add gradient utility classes at the bottom of `globals.css`**

Append after the `@layer base` block:

```css
@layer utilities {
  .gradient-text {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-score {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}
```

- [ ] **Step 3: Update `layout.tsx` body class**

In `src/app/layout.tsx`, change the body className from:
```tsx
className={`${geist.variable} ${bricolage.variable} font-[family-name:var(--font-geist)] h-full bg-[#09090b] text-gray-100 antialiased`}
```
to:
```tsx
className={`${geist.variable} ${bricolage.variable} font-[family-name:var(--font-geist)] h-full bg-[#0a0a0f] text-[#f5f5f8] antialiased`}
```

- [ ] **Step 4: Verify build is clean**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully` with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "style: update design tokens to gradient-glow palette"
```

---

## Task 2: Navigation component

**Files:**
- Modify: `src/components/Navigation.tsx`

Replace the full file with the elevated design: gradient logo mark (square with gradient bg + mic icon), "New session" gradient pill above the nav links, new active state using indigo-tinted bg + border, and bottom user row with avatar + sign out.

- [ ] **Step 1: Replace `Navigation.tsx` entirely**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, User, LogOut, Mic, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[#1e1e25] bg-[#0d0d12]">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Mic className="h-3.5 w-3.5 text-white" />
        </div>
        <span
          className="text-sm font-bold tracking-tight text-[#f5f5f8]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          InterviewIQ
        </span>
      </Link>

      {/* New session pill */}
      <div className="px-3 pb-3">
        <Link
          href="/session/new"
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New session
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "border border-indigo-500/25 bg-indigo-500/10 text-indigo-300"
                : "text-[#52525c] hover:bg-[#18181f] hover:text-[#a0a0ac]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom user row */}
      <div className="border-t border-[#1e1e25] px-3 py-4 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full bg-[#18181f] border border-[#1e1e25]" />
          )}
          <span className="truncate text-sm text-[#52525c]">{session?.user?.name}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#52525c] transition-colors hover:bg-[#18181f] hover:text-[#a0a0ac]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "style: elevate Navigation with gradient logo, new session pill, indigo active state"
```

---

## Task 3: Landing page — bento grid rebuild

**Files:**
- Modify: `src/app/page.tsx`

The existing landing page is already well-structured (hero, marquee strip, how-it-works, CTA). The only major structural change needed is replacing the current feature cards section with the Chronicle-style bento grid that embeds real product UI content inside each card. Also update a few color references from `bg-white/[0.02]` to `bg-[#111116]` and `border-white/[0.07]` to `border-[#1e1e25]`.

- [ ] **Step 1: Replace the feature bento section (lines 347–473 in page.tsx)**

Find the section that starts with `{/* ── Feature bento grid */}` and ends just before `{/* ── How it works */}`. Replace the entire section with:

```tsx
{/* ── Bento grid (Chronicle-style) ───────────────────────────────── */}
<section className="px-6 py-24 lg:px-12">
  <div className="mx-auto max-w-6xl">
    <div className="mb-12">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">What you get</p>
      <h2
        className="text-3xl font-bold text-white lg:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Feedback that&apos;s actually useful.
      </h2>
    </div>

    {/* Row 1 */}
    <div className="mb-4 grid grid-cols-3 gap-4">
      {/* Score breakdown — col-span-2 */}
      <div className="col-span-2 rounded-2xl border border-[#1e1e25] bg-[#111116] p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#52525c]">5-dimension scoring</p>
        <p className="mb-5 text-lg font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Every dimension, scored independently.
        </p>
        <div className="space-y-3">
          {[
            { label: "Content & STAR", score: 84 },
            { label: "Verbal Delivery", score: 72 },
            { label: "Eye Contact", score: 88 },
            { label: "Body Language", score: 79 },
            { label: "Filler Words", score: 65 },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-[#52525c]">{s.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e1e25]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${s.score}%`,
                    background: s.score >= 80
                      ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                      : s.score >= 65
                      ? "#fbbf24"
                      : "#f87171",
                  }}
                />
              </div>
              <span className="w-7 text-right text-xs text-[#52525c]">{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filler word detection — col-span-1 */}
      <div className="rounded-2xl border border-[#1e1e25] bg-[#111116] p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#52525c]">Filler word detection</p>
        <p className="mb-5 text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Every &ldquo;um&rdquo; caught and counted.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { word: "um", count: 3 },
            { word: "like", count: 5 },
            { word: "uh", count: 2 },
            { word: "you know", count: 1 },
            { word: "basically", count: 4 },
          ].map((f) => (
            <span
              key={f.word}
              className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400"
            >
              {f.word}
              <span className="font-bold">×{f.count}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#52525c]">
          Track improvement across sessions as the count drops.
        </p>
      </div>
    </div>

    {/* Row 2 */}
    <div className="grid grid-cols-3 gap-4">
      {/* STAR check */}
      <div className="rounded-2xl border border-[#1e1e25] bg-[#111116] p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#52525c]">STAR framework</p>
        <p className="mb-4 text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Pinpoints what was missing.
        </p>
        <div className="space-y-2.5">
          {[
            { label: "Situation", present: true },
            { label: "Task", present: true },
            { label: "Action", present: true },
            { label: "Result", present: false },
          ].map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-sm text-[#a0a0ac]">{c.label}</span>
              {c.present ? (
                <span className="text-xs font-medium text-emerald-400">✓ Present</span>
              ) : (
                <span className="text-xs font-medium text-red-400">✗ Missing</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Transcript excerpt */}
      <div className="rounded-2xl border border-[#1e1e25] bg-[#111116] p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#52525c]">Transcript</p>
        <p className="mb-4 text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          See exactly what you said.
        </p>
        <p className="font-mono text-xs leading-relaxed text-[#52525c]">
          &ldquo;So I was working on, <span className="rounded bg-red-500/15 px-0.5 text-red-400">um</span>, the growth team and we had this project where{" "}
          <span className="rounded bg-red-500/15 px-0.5 text-red-400">like</span> the retention numbers
          were dropping and I had to figure out why…&rdquo;
        </p>
      </div>

      {/* Eye contact */}
      <div className="rounded-2xl border border-[#1e1e25] bg-[#111116] p-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#52525c]">Eye contact</p>
        <p className="mb-4 text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
          Body language matters.
        </p>
        <p
          className="mb-1 text-4xl font-black"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          73%
        </p>
        <p className="text-xs leading-relaxed text-[#52525c]">
          Looked away frequently in the first 30s. Maintain camera contact during transitions.
        </p>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Update remaining `bg-white/[0.02]` and `border-white/[0.07]` references in how-it-works and CTA sections**

In `page.tsx`, find and replace all instances:
- `bg-white/[0.02]` → `bg-[#111116]`
- `border-white/[0.07]` → `border-[#1e1e25]`
- `hover:bg-white/[0.04]` → `hover:bg-[#18181f]`
- `hover:border-white/[0.12]` → `hover:border-[#2a2a35]`

- [ ] **Step 3: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: rebuild landing bento grid with real product UI content"
```

---

## Task 4: Dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

Replace the generic gray cards with the spec's stats cards (indigo top-border accent, gradient text for key metrics), reskin the session list rows, and add the proper empty state.

- [ ] **Step 1: Replace the stats card JSX block**

Find the `{/* Stats */}` section (lines 62–83) and replace with:

```tsx
{/* Stats */}
<div className="grid grid-cols-3 gap-4">
  <div className="rounded-lg border border-[#1e1e25] border-t-indigo-500/30 bg-[#111116] p-5"
       style={{ borderTopWidth: "1px", borderTopColor: "rgba(99,102,241,0.3)" }}>
    <p className="text-3xl font-black text-[#f5f5f8]">{sessions.length}</p>
    <p className="mt-1 text-sm text-[#52525c]">Sessions</p>
  </div>
  <div className="rounded-lg border border-[#1e1e25] bg-[#111116] p-5"
       style={{ borderTopWidth: "1px", borderTopColor: "rgba(99,102,241,0.3)" }}>
    <p
      className="text-3xl font-black"
      style={avg !== null ? {
        background: "linear-gradient(135deg, #818cf8, #a78bfa)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      } : { color: "#52525c" }}
    >
      {avg ?? "—"}
    </p>
    <p className="mt-1 text-sm text-[#52525c]">Avg. score</p>
  </div>
  <div className="rounded-lg border border-[#1e1e25] bg-[#111116] p-5"
       style={{ borderTopWidth: "1px", borderTopColor: "rgba(99,102,241,0.3)" }}>
    <p className="text-3xl font-black text-[#f5f5f8]">{totalResponses}</p>
    <p className="mt-1 text-sm text-[#52525c]">Questions answered</p>
  </div>
</div>
```

- [ ] **Step 2: Replace the header section**

Find the `{/* Header */}` section (lines 44–60) and replace with:

```tsx
{/* Header */}
<div className="flex items-center justify-between">
  <div>
    <h1
      className="text-2xl font-bold text-[#f5f5f8]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      Good morning, {session.user.name ? session.user.name.split(" ")[0] : "there"}
    </h1>
    <p className="mt-1 text-sm text-[#52525c]">
      {sessions.length === 0 ? "Start your first practice session." : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} completed`}
    </p>
  </div>
  <Link href="/session/new">
    <button
      className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
    >
      <PlusCircle className="h-4 w-4" />
      New Session
    </button>
  </Link>
</div>
```

Remove the `Button` and `Card`/`CardContent`/`Badge` imports — replace with the raw elements above. Keep `PlusCircle`, `ChevronRight`, `Link` imports.

Updated import line:
```tsx
import { PlusCircle, ChevronRight } from "lucide-react"
```

- [ ] **Step 3: Replace the session list rows**

Find the session row `<Link key={s.id} ...>` block (lines 106–140) and replace its inner `<div>` content with:

```tsx
<Link key={s.id} href={`/session/${s.id}`}>
  <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-[#18181f]">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-[#1e1e25] bg-[#18181f] px-2 py-0.5 text-xs font-medium capitalize text-[#a0a0ac]">
          {s.sessionType}
        </span>
        {s.companyName && (
          <span className="text-sm font-medium text-[#f5f5f8]">{s.companyName}</span>
        )}
      </div>
      <p className="text-xs text-[#52525c]">
        {new Date(s.createdAt).toLocaleDateString()} · {s.responses.length} question{s.responses.length !== 1 ? "s" : ""} answered
      </p>
    </div>
    <div className="flex items-center gap-3">
      {sessionAvg !== null && (
        <span
          className="text-xl font-black"
          style={
            sessionAvg >= 8
              ? { background: "linear-gradient(135deg, #818cf8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
              : sessionAvg >= 6
              ? { color: "#fbbf24" }
              : { color: "#f87171" }
          }
        >
          {sessionAvg}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-[#3a3a45]" />
    </div>
  </div>
</Link>
```

And wrap the list in:
```tsx
<div className="overflow-hidden rounded-lg border border-[#1e1e25] bg-[#111116] divide-y divide-[#1e1e25]">
  {sessions.map(...)}
</div>
```

- [ ] **Step 4: Replace the empty state**

Find the empty state block and replace with:

```tsx
<div className="rounded-xl border border-dashed border-[#1e1e25] p-16 text-center">
  <div
    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
  >
    <PlusCircle className="h-6 w-6 text-indigo-400" />
  </div>
  <p className="mb-1 font-semibold text-[#f5f5f8]">No sessions yet</p>
  <p className="mb-5 text-sm text-[#52525c]">Start your first practice session to see your progress.</p>
  <Link href="/session/new">
    <button
      className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
    >
      Start practicing
    </button>
  </Link>
</div>
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "style: elevate dashboard with gradient stats, reskinned session list"
```

---

## Task 5: Sign-in page

**Files:**
- Modify: `src/app/auth/signin/page.tsx`

Wrap the existing centered card in the gradient-glow background used by the landing page hero, and reskin the card itself.

- [ ] **Step 1: Replace `signin/page.tsx` entirely**

```tsx
"use client"

import { signIn } from "next-auth/react"
import { Mic } from "lucide-react"

export default function SignInPage() {
  return (
    <div
      className="relative flex min-h-full items-center justify-center px-6"
      style={{ background: "#0a0a0f" }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-bold text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              InterviewIQ
            </h1>
            <p className="mt-1 text-sm text-[#52525c]">Sign in to start practicing</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-6">
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-[#1e1e25] bg-[#18181f] px-4 py-2.5 text-sm font-semibold text-[#f5f5f8] transition-colors hover:bg-[#1e1e25] hover:border-[#2a2a35]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Continue with GitHub
          </button>
          <p className="mt-4 text-center text-xs text-[#52525c]">
            We only use your GitHub account for authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/signin/page.tsx
git commit -m "style: sign-in page with gradient-glow background"
```

---

## Task 6: New session wizard

**Files:**
- Modify: `src/app/session/new/page.tsx`

Replace the simple progress bar with step dots, update session type card selected states, update input/button styling throughout.

- [ ] **Step 1: Replace `session/new/page.tsx` entirely**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { cn } from "@/lib/utils"

const SESSION_TYPES = [
  {
    id: "behavioral",
    label: "Behavioral",
    description: "Tell me about a time… questions using STAR format",
  },
  {
    id: "technical",
    label: "Technical",
    description: "System design and CS fundamentals",
  },
  {
    id: "company-specific",
    label: "Company-specific",
    description: "Tailored to a job description you paste",
  },
]

const INDUSTRIES = ["tech", "finance", "consulting", "general"]

const inputClass =
  "w-full rounded-md border border-[#1e1e25] bg-[#111116] px-3 py-2 text-sm text-[#f5f5f8] placeholder:text-[#3a3a45] outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState("")
  const [industry, setIndustry] = useState("general")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleStart = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType, industry, companyName, jobDescription }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const { session } = await res.json()
      router.push(`/session/${session.id}`)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-xl space-y-8">
          {/* Header */}
          <div>
            <h1
              className="text-2xl font-bold text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              New Practice Session
            </h1>
            <p className="mt-1 text-sm text-[#52525c]">Step {step} of 2</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-2 w-2 rounded-full transition-all"
                style={{
                  background:
                    n <= step
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "#1e1e25",
                  width: n === step ? "24px" : "8px",
                  borderRadius: "4px",
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#f5f5f8]">What type of session?</h2>
              <div className="grid gap-3">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSessionType(t.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      sessionType === t.id
                        ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]"
                        : "border-[#1e1e25] bg-[#111116] hover:border-[#2a2a35]"
                    )}
                  >
                    <p className="font-medium text-[#f5f5f8]">{t.label}</p>
                    <p className="mt-0.5 text-sm text-[#52525c]">{t.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!sessionType}
                className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-[#f5f5f8]">Add context (optional)</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#a0a0ac]">Industry</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                        industry === ind
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-[#1e1e25] bg-[#111116] text-[#52525c] hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium text-[#a0a0ac]">
                  Company (optional)
                </label>
                <input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, McKinsey"
                  className={inputClass}
                />
              </div>

              {sessionType === "company-specific" && (
                <div className="space-y-2">
                  <label htmlFor="jd" className="text-sm font-medium text-[#a0a0ac]">
                    Job description
                  </label>
                  <textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here…"
                    rows={6}
                    className={inputClass}
                    style={{ resize: "vertical" }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-md border border-[#1e1e25] px-4 py-2 text-sm font-medium text-[#52525c] transition-colors hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                >
                  Back
                </button>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
                >
                  {loading ? "Starting…" : "Start Session"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/session/new/page.tsx
git commit -m "style: new session wizard with step dots, gradient buttons, updated inputs"
```

---

## Task 7: Feedback panel

**Files:**
- Modify: `src/components/FeedbackPanel.tsx`

Update the `ScoreRow` component to use gradient progress bars and gradient/colored numbers. Update filler word chips to red. Update the overall score to use gradient text. Update all card/border colors to new tokens.

- [ ] **Step 1: Replace `FeedbackPanel.tsx` entirely**

```tsx
import type { CSSProperties } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

type Feedback = {
  overallScore: number
  contentScore: number
  deliveryScore: number
  eyeContactScore: number
  bodyLanguageScore: number
  contentFeedback: string
  deliveryFeedback: string
  eyeContactFeedback: string
  bodyLanguageFeedback: string
  overallFeedback: string
  modelAnswer: string
  fillerWords: string[]
  missingStarComponents: string[]
  resumeAlignmentNotes: string | null
  transcript?: string
}

function scoreBarColor(score: number): string {
  if (score >= 8) return "linear-gradient(90deg, #6366f1, #8b5cf6)"
  if (score >= 6) return "#fbbf24"
  return "#f87171"
}

function scoreTextStyle(score: number): CSSProperties {
  if (score >= 8)
    return {
      background: "linear-gradient(135deg, #818cf8, #a78bfa)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }
  if (score >= 6) return { color: "#fbbf24" }
  return { color: "#f87171" }
}

function ScoreRow({
  label,
  score,
  feedback,
}: {
  label: string
  score: number
  feedback: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#a0a0ac]">{label}</span>
        <span className="text-sm font-bold" style={scoreTextStyle(score)}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e25]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score * 10}%`, background: scoreBarColor(score) }}
        />
      </div>
      <p className="text-xs text-[#52525c]">{feedback}</p>
    </div>
  )
}

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const [showModel, setShowModel] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-center gap-4 rounded-xl border border-[#1e1e25] bg-[#111116] p-5">
        <span
          className="text-5xl font-black"
          style={scoreTextStyle(feedback.overallScore)}
        >
          {feedback.overallScore}
        </span>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#52525c]">Overall Score</p>
          <p className="mt-1 text-sm text-[#a0a0ac]">{feedback.overallFeedback}</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-5 space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525c]">Breakdown</h3>
        <ScoreRow label="Content & Structure" score={feedback.contentScore} feedback={feedback.contentFeedback} />
        <ScoreRow label="Verbal Delivery" score={feedback.deliveryScore} feedback={feedback.deliveryFeedback} />
        <ScoreRow label="Eye Contact" score={feedback.eyeContactScore} feedback={feedback.eyeContactFeedback} />
        <ScoreRow label="Body Language" score={feedback.bodyLanguageScore} feedback={feedback.bodyLanguageFeedback} />
      </div>

      {/* Filler words + missing STAR */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52525c]">Filler Words</p>
          {feedback.fillerWords.length === 0 ? (
            <p className="text-xs text-emerald-400">None detected</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {feedback.fillerWords.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52525c]">Missing STAR</p>
          {feedback.missingStarComponents.length === 0 ? (
            <p className="text-xs text-emerald-400">Full STAR present</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {feedback.missingStarComponents.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resume alignment */}
      {feedback.resumeAlignmentNotes && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">Resume Alignment</p>
          <p className="text-sm text-[#a0a0ac]">{feedback.resumeAlignmentNotes}</p>
        </div>
      )}

      {/* Model answer */}
      <div className="rounded-xl border border-[#1e1e25] bg-[#111116]">
        <button
          onClick={() => setShowModel(!showModel)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="text-sm font-semibold text-[#f5f5f8]">How you could have said it</span>
          {showModel ? (
            <ChevronUp className="h-4 w-4 text-[#52525c]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#52525c]" />
          )}
        </button>
        {showModel && (
          <div className="border-t border-[#1e1e25] p-4">
            <p className="text-sm leading-relaxed text-[#a0a0ac] whitespace-pre-wrap">{feedback.modelAnswer}</p>
          </div>
        )}
      </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div className="rounded-xl border border-[#1e1e25] bg-[#111116]">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-[#f5f5f8]">Your transcript</span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4 text-[#52525c]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#52525c]" />
            )}
          </button>
          {showTranscript && (
            <div className="border-t border-[#1e1e25] p-4">
              <p className="font-mono text-sm leading-relaxed text-[#52525c] italic">&ldquo;{feedback.transcript}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build and existing tests pass**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5 && npm test -- --passWithNoTests 2>&1 | tail -10
```
Expected: build succeeds, 25 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/FeedbackPanel.tsx
git commit -m "style: FeedbackPanel with gradient score bars, red filler chips, new tokens"
```

---

## Task 8: Profile page

**Files:**
- Modify: `src/app/profile/page.tsx`

Update all color classes from gray-* to the new tokens. Replace the shadcn `Button`, `Input`, `Label`, `Textarea` usages with plain HTML elements styled per the spec (the shadcn components still work, but their default dark-mode colors no longer match after the CSS var update — overriding inline ensures exact spec fidelity).

- [ ] **Step 1: Replace `profile/page.tsx` entirely**

```tsx
"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const INDUSTRIES = ["tech", "finance", "consulting", "general"]
const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry-level" },
  { id: "mid", label: "Mid-level" },
  { id: "senior", label: "Senior" },
]

const inputClass =
  "w-full rounded-md border border-[#1e1e25] bg-[#111116] px-3 py-2 text-sm text-[#f5f5f8] placeholder:text-[#3a3a45] outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"

export default function ProfilePage() {
  const [resumeText, setResumeText] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [targetCompany, setTargetCompany] = useState("")
  const [industry, setIndustry] = useState("tech")
  const [experience, setExperience] = useState("mid")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return
        setResumeText(profile.resumeText ?? "")
        setTargetRole(profile.targetRole ?? "")
        setTargetCompany(profile.targetCompany ?? "")
        setIndustry(profile.industry ?? "tech")
        setExperience(profile.experience ?? "mid")
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, targetRole, targetCompany, industry, experience }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl space-y-8">
          <div>
            <h1
              className="text-2xl font-bold text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your Profile
            </h1>
            <p className="mt-1 text-sm text-[#52525c]">
              This context is injected into every feedback prompt so the AI can reference your actual experience.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-[#a0a0ac]">
                Target role
              </label>
              <input
                id="role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium text-[#a0a0ac]">
                Target company (optional)
              </label>
              <input
                id="company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Stripe"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#a0a0ac]">Industry</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                      industry === ind
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-[#1e1e25] bg-[#111116] text-[#52525c] hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#a0a0ac]">Experience level</label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm transition-colors",
                      experience === lvl.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-[#1e1e25] bg-[#111116] text-[#52525c] hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                    )}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="resume" className="text-sm font-medium text-[#a0a0ac]">
                Resume (paste as plain text)
              </label>
              <p className="text-xs text-[#52525c]">
                The AI uses this to reference your specific experience when evaluating answers and writing model answers.
              </p>
              <textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here…"
                rows={14}
                className={`${inputClass} font-mono`}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
              >
                {saved ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Saved
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**

```bash
git add src/app/profile/page.tsx
git commit -m "style: profile page with gradient save button, new token colors"
```

---

## Task 9: Session / interview page

**Files:**
- Modify: `src/app/session/[id]/page.tsx`

Replace all `gray-*` classes with the new tokens, swap shadcn `Button`/`Badge` components for raw elements, and update the progress bar, question card, recording-complete panel, and done-state buttons.

- [ ] **Step 1: Update imports — remove Button and Badge, keep the rest**

Replace the imports block with:

```tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { VideoRecorder } from "@/components/VideoRecorder"
import { FeedbackPanel } from "@/components/FeedbackPanel"
import { ChevronRight, CheckCircle } from "lucide-react"
```

- [ ] **Step 2: Replace the loading state JSX**

Find the loading return (lines 96–105) and replace with:

```tsx
if (loading) {
  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </main>
    </div>
  )
}
```

(no change needed — already correct)

- [ ] **Step 3: Replace the "done" state JSX**

Find the `phase === "done"` return and replace its inner `<main>` content with:

```tsx
<main className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
  <div
    className="flex h-16 w-16 items-center justify-center rounded-full"
    style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
  >
    <CheckCircle className="h-8 w-8 text-indigo-400" />
  </div>
  <h2
    className="text-2xl font-bold text-[#f5f5f8]"
    style={{ fontFamily: "var(--font-display)" }}
  >
    Session complete
  </h2>
  <p className="text-[#52525c]">You answered {questions.length} question{questions.length !== 1 ? "s" : ""}.</p>
  <div className="flex gap-3">
    <button
      onClick={() => router.push("/dashboard")}
      className="rounded-md border border-[#1e1e25] px-4 py-2 text-sm font-medium text-[#52525c] transition-colors hover:border-[#2a2a35] hover:text-[#a0a0ac]"
    >
      Dashboard
    </button>
    <button
      onClick={() => router.push("/session/new")}
      className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
    >
      New session
    </button>
  </div>
</main>
```

- [ ] **Step 4: Replace the progress bar and question header (lines 144–160)**

```tsx
{/* Progress */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="rounded-md border border-[#1e1e25] bg-[#18181f] px-2 py-0.5 text-xs font-medium capitalize text-[#a0a0ac]">
      {session?.sessionType}
    </span>
    <span className="text-sm text-[#52525c]">
      Question {questionIndex + 1} of {questions.length}
    </span>
  </div>
  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#1e1e25]">
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{
        width: `${((questionIndex + 1) / questions.length) * 100}%`,
        background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
      }}
    />
  </div>
</div>
```

- [ ] **Step 5: Replace the question card (lines 162–173)**

```tsx
{/* Question */}
<div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-6">
  <p className="mb-2 text-xs uppercase tracking-widest text-[#52525c]">
    {currentQuestion.category}
  </p>
  <h2
    className="text-xl font-semibold leading-snug text-[#f5f5f8]"
    style={{ fontFamily: "var(--font-display)" }}
  >
    {currentQuestion.text}
  </h2>
  {currentQuestion.tips && (
    <p className="mt-3 border-l-2 border-indigo-800 pl-3 text-sm text-indigo-300/70">
      Tip: {currentQuestion.tips}
    </p>
  )}
</div>
```

- [ ] **Step 6: Replace the recording-complete panel and Next button (lines 187–210)**

```tsx
{phase === "feedback" && (
  <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-4 h-full">
    <p className="mb-3 text-xs uppercase tracking-wider text-[#52525c]">Recording complete</p>
    <p className="text-sm text-[#52525c]">
      Your response has been analyzed. Review your feedback on the right.
    </p>
  </div>
)}
```

And replace the Next/Finish button:

```tsx
<button
  onClick={nextQuestion}
  className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
  style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
>
  {isLastQuestion ? "Finish session" : "Next question"}
  <ChevronRight className="h-4 w-4" />
</button>
```

- [ ] **Step 7: Verify build**

```bash
cd /Users/ben/interviewiq && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add src/app/session/[id]/page.tsx
git commit -m "style: session page with gradient progress bar, new token colors"
```

---

## Task 10: Smoke test — full suite + visual check

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/ben/interviewiq && npm test 2>&1 | tail -15
```
Expected: `Tests: 25 passed, 25 total` (all Jest unit tests pass)

- [ ] **Step 2: Start dev server and visually verify each route**

```bash
cd /Users/ben/interviewiq && npm run dev
```

Open each of these routes in the browser and confirm they render without errors:
- `http://localhost:3030/` — landing page; bento grid has real product UI in cards
- `http://localhost:3030/auth/signin` — gradient glow background behind card
- `http://localhost:3030/dashboard` — requires sign-in; stats cards have indigo top border
- `http://localhost:3030/session/new` — step dots, gradient "Next" button
- `http://localhost:3030/profile` — gradient save button, new input colors

- [ ] **Step 3: Push to GitHub**

```bash
cd /Users/ben/interviewiq && git push origin main
```

- [ ] **Step 4: Confirm CI passes**

Go to `https://github.com/Bensidebotham/interviewiq/actions` and confirm the `ci` workflow passes on the push (lint → test → build → e2e).
