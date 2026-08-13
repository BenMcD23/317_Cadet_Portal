import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { API_BASE } from "@/lib/api-base"

export async function GET() {
  const session = await auth()
  const token = session?.id_token
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_BASE}/cadets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
