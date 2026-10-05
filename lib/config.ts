/** Backend API origin. Only read on the server (route handlers), never sent to the browser. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

/** Google Workspace domain whose accounts may sign in. */
export const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "317atc.co.uk"
