import { NextResponse } from "next/server"
import { auth } from "@/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"

export async function PATCH(request: Request) {
  const session = await auth()
  const token = session?.id_token
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const res = await fetch(`${API_BASE}/cadets/me/phone-number`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: body.phone_number ?? "" }),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
