import type { NextRequest } from "next/server"
import { proxyToApi } from "@/lib/api-proxy"

export async function PATCH(req: NextRequest) {
  return proxyToApi(`/cadets/me/phone-number`, { method: "PATCH", body: await req.json() })
}
