/**
 * Where to send someone after they sign in, from the `callbackUrl` the
 * middleware put on the login link. Only a path on this site is allowed: a full
 * URL or "//host" would let a crafted link bounce a cadet off to another site
 * straight after a real Google sign-in.
 */
export function safeCallback(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/"
  return raw
}
