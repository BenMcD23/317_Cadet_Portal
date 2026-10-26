/** Backend API origin. Only read on the server (route handlers), never sent to the browser.
 *  API_INTERNAL_BASE is read at runtime, so the cluster's preview image (built
 *  once, run in many stacks) can point at its own stack's API. */
export const API_BASE =
  process.env.API_INTERNAL_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

/** Whether this build may offer the dev sign-in: `next dev`, or the cluster's
 *  preview image, whose Dockerfile sets NEXT_PUBLIC_PREVIEW_BUILD. That flag is
 *  inlined at build time, so it can't be switched on in an existing deployment;
 *  Vercel never sets it. The sign-in still needs AUTH_DEV_BYPASS=1 too
 *  (auth.config.ts). */
export const devSignInBuild = () =>
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PREVIEW_BUILD === "1"

/** Google Workspace domain whose accounts may sign in. */
export const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "317atc.co.uk"
