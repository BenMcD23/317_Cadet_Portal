import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return proxyToApi(`/cadets/me/lessons/${code}`, { method: "POST" })
}
