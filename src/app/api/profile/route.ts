import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  resumeText: z.string().optional(),
  targetRole: z.string().optional(),
  targetCompany: z.string().optional(),
  industry: z.string().optional(),
  experience: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ profile })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json({ profile })
}
