/**
 * The SMS API's origin, shared by every route handler under app/api/.
 *
 * Deployed, this is the Lambda Function URL. AWS shows that URL *with* a
 * trailing slash and every caller concatenates `${API_BASE}/path`, so it's
 * stripped here once rather than depending on whoever pastes it into the
 * environment having noticed — a stray slash makes every request a 404.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"
).replace(/\/+$/, "")
