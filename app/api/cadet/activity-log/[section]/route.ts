import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return proxyToApi(`/cadets/me/activity-log/${section}`, { method: "PUT", body: await req.json() })
}
