import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const response = await prisma.response.findFirst({
    where: {
      id,
      session: { userId: session.user.id },
    },
    include: { feedback: true },
  })

  if (!response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (response.analysisStatus === "done" && response.feedback) {
    return NextResponse.json({
      status: "done",
      feedback: response.feedback,
      transcript: response.transcript,
    })
  }

  if (response.analysisStatus === "failed") {
    return NextResponse.json({ status: "failed", error: "Analysis failed" })
  }

  return NextResponse.json({ status: response.analysisStatus })
}
