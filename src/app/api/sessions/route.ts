import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getQuestionsForSession } from "@/lib/questions"
import { z } from "zod"

const createSchema = z.object({
  sessionType: z.enum(["behavioral", "technical", "company-specific"]),
  industry: z.string().optional(),
  companyName: z.string().optional(),
  jobDescription: z.string().optional(),
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

  const { sessionType, industry, companyName, jobDescription } = parsed.data
  const questions = getQuestionsForSession(sessionType, industry, 5)

  const interviewSession = await prisma.interviewSession.create({
    data: {
      userId: session.user.id,
      sessionType,
      industry,
      companyName,
      jobDescription,
      questions,
    },
  })

  return NextResponse.json({ session: interviewSession })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sessions = await prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    include: {
      responses: {
        include: { feedback: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ sessions })
}
