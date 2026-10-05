import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function GET() {
  return proxyToApi(`/users/me/orders`)
}

export async function POST(req: NextRequest) {
  return proxyToApi(`/users/me/orders`, { method: "POST", body: await req.json() })
}
