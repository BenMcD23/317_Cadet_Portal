import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

type Params = { params: Promise<{ section: string; id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { section, id } = await params
  return proxyToApi(`/cadets/me/activity-log/${section}/entries/${id}`, {
    method: "PATCH",
    body: await req.json(),
  })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { section, id } = await params
  return proxyToApi(`/cadets/me/activity-log/${section}/entries/${id}`, { method: "DELETE" })
}
