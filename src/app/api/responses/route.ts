import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  sessionId: z.string(),
  questionText: z.string(),
  questionCategory: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Verify session belongs to user
  const interviewSession = await prisma.interviewSession.findFirst({
    where: { id: parsed.data.sessionId, userId: session.user.id },
  })
  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  const response = await prisma.response.create({
    data: parsed.data,
  })

  return NextResponse.json({ response })
}
