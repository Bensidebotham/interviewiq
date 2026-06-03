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

  // Mark analyzing before enqueuing to avoid race where task completes
  // before this update runs and overwrites "done" back to "analyzing"
  await prisma.response.update({
    where: { id: responseId },
    data: { analysisStatus: "analyzing" },
  })

  let handle: Awaited<ReturnType<typeof tasks.trigger>>
  try {
    handle = await tasks.trigger("analyze-interview", {
      responseId,
      questionText,
      sessionType,
      audioUrl,
      frames,
      durationSeconds,
      userId: session.user.id,
    })
  } catch (err) {
    console.error("tasks.trigger failed:", err)
    await prisma.response
      .update({ where: { id: responseId }, data: { analysisStatus: "failed" } })
      .catch(() => {})
    return NextResponse.json({ error: "Failed to queue analysis" }, { status: 503 })
  }

  await prisma.response.update({
    where: { id: responseId },
    data: { triggerRunId: handle.id },
  })

  return NextResponse.json({ runId: handle.id, responseId }, { status: 202 })
}
