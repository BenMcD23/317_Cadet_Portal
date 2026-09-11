import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { API_BASE } from "@/lib/config"

/**
 * Server-side proxy to the backend API, authenticated with the current
 * session's Google id_token. Every route under app/api/* is a thin wrapper
 * over this so token lookup, headers and error handling live in one place.
 *
 * The backend's status code and JSON body (including `detail`) pass through
 * unchanged so the page can show the real error. A backend that can't be
 * reached becomes a clean 503 (which the API-down overlay understands) rather
 * than a Next.js 500.
 */
export async function proxyToApi(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<NextResponse> {
  const session = await auth()
  const token = session?.id_token
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
  } catch {
    return NextResponse.json({ error: "API unreachable" }, { status: 503 })
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  const data = await res.json().catch(() => null)
  return NextResponse.json(data ?? { error: res.statusText }, { status: res.status })
}
