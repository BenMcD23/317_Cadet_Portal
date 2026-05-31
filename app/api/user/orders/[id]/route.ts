import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"

async function getToken() {
  const session = await auth()
  return session?.id_token ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const res = await fetch(`${API_BASE}/users/me/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await getToken()
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const res = await fetch(`${API_BASE}/users/me/orders/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
