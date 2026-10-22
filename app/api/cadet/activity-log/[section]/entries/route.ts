import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function POST(req: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return proxyToApi(`/cadets/me/activity-log/${section}/entries`, { method: "POST", body: await req.json() })
}
