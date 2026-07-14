import { NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"

// Same-origin liveness probe for the API-down overlay. Runs server-side so the
// browser never talks to the backend cross-origin (which would be CORS-blocked
// from this app's origin) — it just pings our own /api/ping, and we forward to
// the backend's unauthenticated /ping here.
export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/ping`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return NextResponse.json({ ok: true })
  } catch {
    // fall through to the 503 below
  }
  return NextResponse.json({ ok: false }, { status: 503 })
}
