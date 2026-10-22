/**
 * Response headers for every page: a Content-Security-Policy plus the usual
 * transport and framing headers.
 *
 * Built here rather than inline in next.config.ts so it can be tested. Cadets
 * are 12-18 and this site shows their own orders and details, so it gets the
 * same headers as the staff SMS site. Unlike that site, the browser here only
 * ever talks to this app's own /api routes (the API call happens server side,
 * in lib/api-proxy.ts), so connect-src is just 'self'.
 *
 * `script-src` keeps 'unsafe-inline' because the App Router injects inline
 * bootstrap scripts and no nonce is plumbed through the auth proxy. That
 * weakens containment of an injection but not the exfiltration limit; a nonce
 * is the follow-up.
 */

type Header = { key: string; value: string }

export function contentSecurityPolicy(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next's dev server needs eval for React's debugging; production doesn't.
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(isDev ? ["ws:", "wss:"] : [])],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "base-uri": ["'self'"],
    // Sign-in is a form POST that redirects to Google, and Chrome checks
    // form-action against the redirect target too.
    "form-action": ["'self'", "https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
  }
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ")
}

export function securityHeaders(isDev: boolean): Header[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(isDev) },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    // Browsers ignore HSTS on plain http, so this is harmless on localhost.
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ]
}
