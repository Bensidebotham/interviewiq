import Link from "next/link"
import { Mic, BarChart2, FileText, MessageSquare, ArrowRight, CheckCircle, Zap } from "lucide-react"

// ─── Mock data for the live feedback preview card ───────────────────────────

const previewScores = [
  { label: "Content & STAR", value: 84 },
  { label: "Verbal Delivery", value: 76 },
  { label: "Eye Contact", value: 80 },
  { label: "Body Language", value: 88 },
]

const previewFeedback =
  "Strong opening with a clear career arc. Your transition from engineering to product is well-framed — but anchor it with a specific metric. Replace 'I worked on growth' with 'I shipped the onboarding redesign that lifted D7 retention by 18%'."

const previewFillers = [
  { word: "um", count: 3 },
  { word: "like", count: 2 },
  { word: "you know", count: 1 },
]

// ─── Feature bento data ─────────────────────────────────────────────────────

const features = [
  {
    icon: BarChart2,
    title: "5-dimension scoring",
    body: "Content, delivery, eye contact, body language, and STAR structure — each scored independently so you see exactly what to fix.",
    span: "col-span-2",
  },
  {
    icon: FileText,
    title: "Resume-aware",
    body: "Paste your resume. The AI flags stronger examples from your actual experience that you could have used.",
    span: "col-span-1",
  },
  {
    icon: MessageSquare,
    title: "STAR breakdown",
    body: "Pinpoints exactly which parts of Situation, Task, Action, Result were missing.",
    span: "col-span-1",
  },
  {
    icon: Mic,
    title: "Filler word detection",
    body: "Every 'um', 'like', and 'you know' caught and counted — so you can track improvement session over session.",
    span: "col-span-2",
  },
]

// ─── How it works steps ─────────────────────────────────────────────────────

const steps = [
  {
    number: "01",
    title: "Record your answer",
    body: "Pick a real behavioral, technical, or company-specific question. Your camera and mic capture everything — just like the actual interview.",
  },
  {
    number: "02",
    title: "Gemini watches everything",
    body: "The AI analyzes your video frame-by-frame, listens for filler words, scores your STAR structure, and checks your answer against your resume.",
  },
  {
    number: "03",
    title: "Get feedback that's actually specific",
    body: "Not 'speak more confidently' — actual examples, exact quotes from your answer, and concrete suggestions tied to your experience.",
  },
]

// ─── Score bar component ─────────────────────────────────────────────────────

function ScoreBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs font-semibold text-zinc-200">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
          style={{
            width: `${value}%`,
            animation: `barGrow 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}ms both`,
          }}
        />
      </div>
    </div>
  )
}

// ─── Feedback preview card ───────────────────────────────────────────────────

function FeedbackPreviewCard() {
  return (
    <div
      className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm"
      style={{
        boxShadow: "0 0 0 1px rgba(99,102,241,0.15), 0 24px 80px -12px rgba(99,102,241,0.25), 0 8px 32px -8px rgba(0,0,0,0.6)",
      }}
    >
      {/* Glow orb behind card */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl"
        style={{
          background: "radial-gradient(ellipse at 60% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 items-center justify-center">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px rgba(52,211,153,0.8)" }} />
          </span>
          <span className="text-xs text-zinc-500">Recording analyzed</span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-bold"
          style={{
            background: "rgba(99,102,241,0.15)",
            color: "#a5b4fc",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        >
          82 / 100
        </span>
      </div>

      {/* Question */}
      <p className="mb-4 text-sm font-medium text-zinc-200 leading-snug">
        "Tell me about yourself."
      </p>

      {/* Score bars */}
      <div className="mb-4 space-y-2.5">
        {previewScores.map((s, i) => (
          <ScoreBar key={s.label} label={s.label} value={s.value} delay={200 + i * 80} />
        ))}
      </div>

      {/* Divider */}
      <div className="mb-3 h-px bg-white/5" />

      {/* Feedback text */}
      <p className="mb-3 text-xs leading-relaxed text-zinc-400">
        {previewFeedback}
      </p>

      {/* Divider */}
      <div className="mb-3 h-px bg-white/5" />

      {/* Filler words */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-zinc-600">Filler words:</span>
        {previewFillers.map((f) => (
          <span
            key={f.word}
            className="rounded-full px-2 py-0.5 text-xs text-zinc-400"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {f.word} ×{f.count}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes barGrow {
          from { width: 0% }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        .anim-fade-up {
          opacity: 0;
          animation: fadeUp 0.7s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .anim-fade-in {
          opacity: 0;
          animation: fadeIn 0.8s ease forwards;
        }
      `}</style>

      <div className="flex min-h-full flex-col">

        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Mic className="h-3.5 w-3.5 text-white" />
            </div>
            <span
              className="text-sm font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              InterviewIQ
            </span>
          </div>
          <Link
            href="/auth/signin"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            Sign in
          </Link>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 lg:px-12">
          {/* Background gradient */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%)",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_420px]">
            {/* Left: text */}
            <div>
              {/* Eyebrow */}
              <div
                className="anim-fade-up mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1"
                style={{
                  animationDelay: "0ms",
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "rgba(99,102,241,0.08)",
                }}
              >
                <Zap className="h-3 w-3 text-indigo-400" />
                <span className="text-xs text-indigo-300">Powered by Gemini 1.5 Flash</span>
              </div>

              {/* Headline */}
              <h1
                className="anim-fade-up mb-5 text-5xl font-extrabold leading-[1.08] tracking-tight text-white lg:text-6xl"
                style={{ animationDelay: "80ms", fontFamily: "var(--font-display)" }}
              >
                Stop guessing
                <br />
                what went wrong.
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #818cf8, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Find out exactly.
                </span>
              </h1>

              {/* Subtext */}
              <p
                className="anim-fade-up mb-8 max-w-lg text-base leading-relaxed text-zinc-400"
                style={{ animationDelay: "160ms" }}
              >
                Record yourself answering interview questions. Gemini AI watches your video, listens to your words,
                and checks your answer against your actual resume — then tells you specifically what to fix.
              </p>

              {/* CTAs */}
              <div
                className="anim-fade-up flex flex-wrap items-center gap-3"
                style={{ animationDelay: "240ms" }}
              >
                <Link
                  href="/auth/signin"
                  className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                  }}
                >
                  Start practicing free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-400 transition-all hover:border-white/20 hover:text-zinc-200"
                >
                  See how it works
                </Link>
              </div>

              {/* Trust line */}
              <div
                className="anim-fade-up mt-8 flex items-center gap-4 text-xs text-zinc-600"
                style={{ animationDelay: "320ms" }}
              >
                {["No credit card required", "Free to start", "Built for job seekers"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-zinc-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: feedback card */}
            <div
              className="anim-fade-in"
              style={{ animationDelay: "400ms" }}
            >
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-xs text-zinc-600">Live feedback example</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <FeedbackPreviewCard />
            </div>
          </div>
        </section>

        {/* ── Divider marquee strip ─────────────────────────────────────────── */}
        <div
          className="overflow-hidden border-y border-white/[0.05] py-3"
          style={{ background: "rgba(99,102,241,0.04)" }}
        >
          <div className="flex whitespace-nowrap text-xs font-medium uppercase tracking-widest text-zinc-700">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="flex shrink-0 items-center">
                {["Video Analysis", "·", "STAR Framework", "·", "Resume Alignment", "·", "Filler Word Detection", "·", "5-Dimension Scoring", "·", "Eye Contact Scoring", "·", "Body Language", "·", "Behavioral Questions", "·", "Technical Questions", "·"].map((t, j) => (
                  <span key={j} className="px-4">{t}</span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Feature bento grid ───────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">What you get</p>
              <h2
                className="text-3xl font-bold text-white lg:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Feedback that's actually useful.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Card 1 — large */}
              <div
                className="group relative col-span-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] md:col-span-2"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <BarChart2 className="h-5 w-5 text-indigo-400" />
                </div>
                <h3
                  className="mb-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  5-dimension scoring
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-zinc-500">
                  Content, delivery, eye contact, body language, and STAR structure — each scored independently so you know exactly what to fix next session.
                </p>
                {/* Mini score preview */}
                <div className="space-y-2">
                  {[{ l: "Content & STAR", v: 84 }, { l: "Verbal Delivery", v: 76 }, { l: "Eye Contact", v: 80 }].map((s) => (
                    <div key={s.l} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs text-zinc-600">{s.l}</span>
                      <div className="h-1 flex-1 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-400"
                          style={{ width: `${s.v}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-zinc-500">{s.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2 — small */}
              <div className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <FileText className="h-5 w-5 text-violet-400" />
                </div>
                <h3
                  className="mb-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Resume-aware feedback
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Paste your resume and target role. The AI references your actual experience and flags stronger examples you could have used.
                </p>
              </div>

              {/* Card 3 — small */}
              <div className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(165,180,252,0.1)", border: "1px solid rgba(165,180,252,0.15)" }}
                >
                  <MessageSquare className="h-5 w-5 text-indigo-300" />
                </div>
                <h3
                  className="mb-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  STAR breakdown
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  Pinpoints exactly which parts of Situation, Task, Action, Result were missing from your answer — not just that it was "unclear."
                </p>
              </div>

              {/* Card 4 — large */}
              <div className="group relative col-span-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] md:col-span-2">
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <Mic className="h-5 w-5 text-indigo-400" />
                </div>
                <h3
                  className="mb-2 text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Filler word detection
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-zinc-500">
                  Every "um", "like", and "you know" is caught, counted, and flagged — so you can track how you improve over multiple sessions.
                </p>
                {/* Filler chips */}
                <div className="flex flex-wrap gap-2">
                  {[{ w: "um", c: 3 }, { w: "like", c: 5 }, { w: "you know", c: 2 }, { w: "basically", c: 4 }, { w: "sort of", c: 1 }].map((f) => (
                    <span
                      key={f.w}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a" }}
                    >
                      <span className="font-medium text-zinc-300">{f.w}</span>
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
                      >
                        {f.c}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="px-6 py-24 lg:px-12" style={{ background: "rgba(255,255,255,0.01)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-16">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">The process</p>
              <h2
                className="text-3xl font-bold text-white lg:text-4xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Three steps. One better answer.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.number} className="relative flex gap-5 py-8 md:flex-col md:gap-4 md:px-8 md:py-0">
                  {/* Connecting line between steps */}
                  {i < steps.length - 1 && (
                    <div
                      className="pointer-events-none absolute hidden md:block"
                      style={{
                        top: "2rem",
                        left: "calc(50% + 2.5rem)",
                        right: "-50%",
                        height: "1px",
                        background: "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(99,102,241,0.05))",
                      }}
                    />
                  )}
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      fontFamily: "var(--font-display)",
                      background: "rgba(99,102,241,0.12)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      color: "#818cf8",
                    }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3
                      className="mb-2 text-base font-bold text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-zinc-500">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div
              className="relative overflow-hidden rounded-3xl p-12 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
                border: "1px solid rgba(99,102,241,0.2)",
                boxShadow: "0 0 80px -20px rgba(99,102,241,0.3)",
              }}
            >
              {/* Background glow */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse 60% 80% at 50% 120%, rgba(99,102,241,0.2) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-indigo-400">Get started</p>
                <h2
                  className="mb-4 text-3xl font-extrabold text-white lg:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Your next interview is
                  <br />
                  <span
                    style={{
                      background: "linear-gradient(90deg, #818cf8, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    closer than you think.
                  </span>
                </h2>
                <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-zinc-400">
                  Sign in with GitHub and start your first practice session in under two minutes. No setup, no credit card.
                </p>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                    boxShadow: "0 4px 24px rgba(99,102,241,0.4)",
                  }}
                >
                  Start practicing free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="mt-auto border-t border-white/[0.05] px-6 py-8 lg:px-12">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                <Mic className="h-3 w-3 text-white" />
              </div>
              <span
                className="text-sm font-bold text-zinc-500"
                style={{ fontFamily: "var(--font-display)" }}
              >
                InterviewIQ
              </span>
            </div>
            <p className="text-xs text-zinc-700">Built with Next.js, Gemini AI, and Neon PostgreSQL.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
