import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
              <h1 className="text-2xl font-bold">
                Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {sessions.length === 0 ? "Start your first practice session." : `${sessions.length} sessions completed`}
              </p>
            </div>
            <Link href="/session/new">
              <Button className="bg-indigo-600 hover:bg-indigo-500 gap-2">
                <PlusCircle className="h-4 w-4" />
                New Session
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-3xl font-black text-indigo-400">{sessions.length}</p>
                <p className="mt-1 text-sm text-gray-400">Sessions</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-3xl font-black text-indigo-400">{totalResponses}</p>
                <p className="mt-1 text-sm text-gray-400">Questions answered</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <p className="text-3xl font-black text-indigo-400">{avg ?? "—"}</p>
                <p className="mt-1 text-sm text-gray-400">Avg. score</p>
              </CardContent>
            </Card>
          </div>

          {/* Session list */}
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-16 text-center">
              <p className="text-gray-500">No sessions yet.</p>
              <Link href="/session/new" className="mt-4 inline-block">
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Start practicing
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Recent sessions</h2>
              {sessions.map((s) => {
                const scores = s.responses.flatMap((r) =>
                  r.feedback ? [r.feedback.overallScore] : []
                )
                const sessionAvg = scores.length
                  ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                  : null

                return (
                  <Link key={s.id} href={`/session/${s.id}`}>
                    <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 hover:border-gray-700 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-gray-800 text-gray-300 capitalize">
                            {s.sessionType}
                          </Badge>
                          {s.companyName && (
                            <span className="text-sm text-gray-400">{s.companyName}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString()} · {s.responses.length} question{s.responses.length !== 1 ? "s" : ""} answered
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {sessionAvg !== null && (
                          <span
                            className={`text-xl font-black ${
                              sessionAvg >= 8
                                ? "text-emerald-400"
                                : sessionAvg >= 6
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {sessionAvg}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
