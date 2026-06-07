import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { PlusCircle, ChevronRight } from "lucide-react"

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return (
      <p className="text-xs text-[#3a3a45]">
        Complete 2+ sessions to see your score trend.
      </p>
    )
  }
  const W = 300
  const H = 48
  const pad = 4
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1
  const points = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2)
    const y = H - pad - ((s - min) / range) * (H - pad * 2)
    return `${x},${y}`
  })
  const lastX = parseFloat(points[points.length - 1].split(",")[0])
  const lastY = parseFloat(points[points.length - 1].split(",")[1])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="sparkStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${points.join(" L")} L${W - pad},${H} L${pad},${H} Z`}
        fill="url(#sparkFill)"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="url(#sparkStroke)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill="#a78bfa" stroke="#0a0a0f" strokeWidth="2" />
    </svg>
  )
}

function SessionTypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  const label = t.startsWith("b") ? "B" : t.startsWith("t") ? "T" : "C"
  const bg =
    label === "B" ? "rgba(99,102,241,0.12)"
    : label === "T" ? "rgba(251,191,36,0.1)"
    : "rgba(139,92,246,0.12)"
  const border =
    label === "B" ? "rgba(99,102,241,0.25)"
    : label === "T" ? "rgba(251,191,36,0.2)"
    : "rgba(139,92,246,0.25)"
  const color =
    label === "B" ? "#818cf8" : label === "T" ? "#fbbf24" : "#a78bfa"

  return (
    <div
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
      style={{ background: bg, border: `1px solid ${border}`, color }}
    >
      {label}
    </div>
  )
}

function MiniBarChart({ scores }: { scores: (number | null)[] }) {
  const validScores = scores.filter((s): s is number => s !== null)
  if (validScores.length === 0) return null
  return (
    <div className="flex items-end gap-0.5" style={{ height: 16 }}>
      {validScores.map((score, i) => {
        const height = Math.max(3, (score / 10) * 16)
        const bg =
          score >= 8 ? "linear-gradient(to top, #6366f1, #8b5cf6)"
          : score >= 6 ? "#fbbf24"
          : "#f87171"
        return (
          <div
            key={i}
            className="w-1 rounded-sm flex-shrink-0"
            style={{ height, background: bg }}
          />
        )
      })}
    </div>
  )
}

function avgScore(sessions: Awaited<ReturnType<typeof getSessions>>) {
  const scores = sessions.flatMap((s) =>
    s.responses.flatMap((r) => (r.feedback ? [r.feedback.overallScore] : []))
  )
  if (scores.length === 0) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

async function getSessions(userId: string) {
  return prisma.interviewSession.findMany({
    where: { userId },
    include: {
      responses: { include: { feedback: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/auth/signin")

  const sessions = await getSessions(session.user.id)
  const avg = avgScore(sessions)
  const totalResponses = sessions.flatMap((s) => s.responses).length

  const sparklineScores = sessions
    .slice()
    .reverse()
    .slice(-6)
    .map((s) => {
      const sc = s.responses.flatMap((r) =>
        r.feedback ? [r.feedback.overallScore] : []
      )
      return sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null
    })
    .filter((s): s is number => s !== null)

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl space-y-8">
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="rounded-lg border border-[#1e1e25] bg-[#111116] p-5"
              style={{ borderTopColor: "rgba(99,102,241,0.3)", borderTopWidth: "1px" }}
            >
              <p className="text-3xl font-black text-[#f5f5f8]">{sessions.length}</p>
              <p className="mt-1 text-sm text-[#52525c]">Sessions</p>
            </div>
            <div
              className="rounded-lg border border-[#1e1e25] bg-[#111116] p-5"
              style={{ borderTopColor: "rgba(99,102,241,0.3)", borderTopWidth: "1px" }}
            >
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
            <div
              className="rounded-lg border border-[#1e1e25] bg-[#111116] p-5"
              style={{ borderTopColor: "rgba(99,102,241,0.3)", borderTopWidth: "1px" }}
            >
              <p className="text-3xl font-black text-[#f5f5f8]">{totalResponses}</p>
              <p className="mt-1 text-sm text-[#52525c]">Questions answered</p>
            </div>
          </div>

          {/* Score sparkline */}
          {sparklineScores.length >= 1 && (
            <div className="rounded-lg border border-[#1e1e25] bg-[#111116] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#52525c]">Score trend</span>
                <span className="text-xs text-[#3a3a45]">last {sparklineScores.length} session{sparklineScores.length !== 1 ? "s" : ""}</span>
              </div>
              <Sparkline scores={sparklineScores} />
            </div>
          )}

          {/* Session list */}
          {sessions.length === 0 ? (
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
          ) : (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#52525c]">Recent sessions</h2>
              <div className="overflow-hidden rounded-lg border border-[#1e1e25] bg-[#111116] divide-y divide-[#1e1e25]">
                {sessions.map((s) => {
                  const scores = s.responses.flatMap((r) =>
                    r.feedback ? [r.feedback.overallScore] : []
                  )
                  const sessionAvg = scores.length
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : null

                  return (
                    <Link key={s.id} href={`/session/${s.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#18181f]">
                        <SessionTypeIcon type={s.sessionType} />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            {s.companyName && (
                              <span className="text-sm font-semibold text-[#f5f5f8]">{s.companyName}</span>
                            )}
                            <span className="rounded-md border border-[#1e1e25] bg-[#18181f] px-1.5 py-0.5 text-xs capitalize text-[#52525c]">
                              {s.sessionType}
                            </span>
                          </div>
                          <p className="text-xs text-[#52525c]">
                            {new Date(s.createdAt).toLocaleDateString()} · {s.responses.length} question{s.responses.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <MiniBarChart
                            scores={[
                              s.responses[0]?.feedback?.contentScore ?? null,
                              s.responses[0]?.feedback?.deliveryScore ?? null,
                              s.responses[0]?.feedback?.eyeContactScore ?? null,
                              s.responses[0]?.feedback?.bodyLanguageScore ?? null,
                            ]}
                          />
                          {sessionAvg !== null && (
                            <span
                              className="text-lg font-black"
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
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
