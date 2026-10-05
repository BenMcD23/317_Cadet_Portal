import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function GET() {
  return proxyToApi(`/cadets/me/badge-orders`)
}

export async function POST(req: NextRequest) {
  return proxyToApi(`/cadets/me/badge-orders`, { method: "POST", body: await req.json() })
}
