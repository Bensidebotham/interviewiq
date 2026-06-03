import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { analyzeInterview } from "@/lib/gemini"
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

  // Verify response belongs to the authenticated user
  const response = await prisma.response.findFirst({
    where: {
      id: responseId,
      session: { userId: session.user.id },
    },
    include: { session: true },
  })
  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 })
  }

  // Get user's profile for resume context
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  // Fetch audio from Blob and convert to base64 for Gemini
  let audioBase64: string
  try {
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`)
    const audioBuffer = await audioRes.arrayBuffer()
    audioBase64 = Buffer.from(audioBuffer).toString("base64")
  } catch (err) {
    console.error("Audio fetch failed:", err)
    return NextResponse.json({ error: "Failed to retrieve audio recording" }, { status: 500 })
  }

  let feedback
  try {
    feedback = await analyzeInterview({
      questionText,
      sessionType,
      audioBase64,
      frames,
      resumeText: profile?.resumeText ?? undefined,
      targetRole: profile?.targetRole ?? undefined,
      targetCompany: profile?.targetCompany ?? (response.session.companyName ?? undefined),
      industry: profile?.industry ?? (response.session.industry ?? undefined),
      jobDescription: response.session.jobDescription ?? undefined,
    })
  } catch (err) {
    console.error("Gemini analysis failed:", err)
    const message = err instanceof Error ? err.message : "Unknown Gemini error"
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 })
  }

  // Persist transcript, duration, and audio URL on the response
  await prisma.response.update({
    where: { id: responseId },
    data: {
      transcript: feedback.transcript,
      durationSeconds: durationSeconds ?? null,
      audioUrl,
    },
  })

  // Persist feedback
  const saved = await prisma.feedback.create({
    data: {
      responseId,
      overallScore: feedback.overallScore,
      contentScore: feedback.contentScore,
      deliveryScore: feedback.deliveryScore,
      eyeContactScore: feedback.eyeContactScore,
      bodyLanguageScore: feedback.bodyLanguageScore,
      contentFeedback: feedback.contentFeedback,
      deliveryFeedback: feedback.deliveryFeedback,
      eyeContactFeedback: feedback.eyeContactFeedback,
      bodyLanguageFeedback: feedback.bodyLanguageFeedback,
      overallFeedback: feedback.overallFeedback,
      modelAnswer: feedback.modelAnswer,
      fillerWords: feedback.fillerWords,
      missingStarComponents: feedback.missingStarComponents,
      resumeAlignmentNotes: feedback.resumeAlignmentNotes,
    },
  })

  return NextResponse.json({ feedback: saved, transcript: feedback.transcript })
}
