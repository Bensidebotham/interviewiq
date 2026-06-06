import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { PlusCircle, ChevronRight } from "lucide-react"

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
