import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("audio") as File | null
  if (!file) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
  }

  const blob = await put(
    `recordings/${session.user.id}/${Date.now()}.webm`,
    file,
    { access: "public" }
  )

  return NextResponse.json({ url: blob.url })
}
