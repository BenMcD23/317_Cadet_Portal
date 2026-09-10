import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyToApi(`/cadets/me/badge-orders/${id}`, { method: "PATCH", body: await req.json() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyToApi(`/cadets/me/badge-orders/${id}`, { method: "DELETE" })
}
