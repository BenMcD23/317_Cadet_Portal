import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"

import { format, resolveConfig } from "prettier"
import { describe, expect, it, vi } from "vitest"

import { findDrift, SHARED } from "@/scripts/shared-files.mjs"

const root = join(import.meta.dirname, "..")

/** A fake SMS site checkout holding `files` (path → content). */
function siteCheckout(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "sms-site-"))
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}

/** Our copy of `path` as the SMS site formats it (with semicolons). */
async function asTheSiteWritesIt(path: string) {
  const ours = readFileSync(join(root, path), "utf8")
  const options = await resolveConfig(join(root, path))
  return format(ours, { ...options, semi: true, filepath: join(root, path) })
}

describe("shared files with the SMS site", () => {
  it("lists only files this repo has", () => {
    // A typo in the list would otherwise be "drift" the sync quietly creates.
    for (const path of SHARED) expect(() => readFileSync(join(root, path))).not.toThrow()
  })

  it("treats a copy that only differs in semicolons as the same file", async () => {
    const path = "components/order-disclosure.tsx"
    const site = siteCheckout({ [path]: await asTheSiteWritesIt(path) })

    expect(await findDrift({ from: site, files: [path] })).toEqual([])
  })

  it("reports a real change on the site's side", async () => {
    const path = "components/section-heading.tsx"
    const changed = (await asTheSiteWritesIt(path)).replace("flex-wrap", "flex-nowrap")
    const site = siteCheckout({ [path]: changed })

    expect(await findDrift({ from: site, files: [path] })).toEqual([path])
  })

  it("compares components/ui byte for byte, since prettier skips it here", async () => {
    const path = "components/ui/badge.tsx"
    const ours = readFileSync(join(root, path), "utf8")
    const site = siteCheckout({ [path]: ours.replace(/;?\n/, ";\n") + "\n" })

    expect(await findDrift({ from: site, files: [path] })).toEqual([path])
  })

  it("syncs a drifted file to the site's version in this repo's style", async () => {
    const path = "components/page-header.tsx"
    const local = siteCheckout({ [path]: readFileSync(join(root, path), "utf8") })
    const site = siteCheckout({
      [path]: (await asTheSiteWritesIt(path)).replace("Standard page header", "Page header"),
    })

    expect(await findDrift({ from: site, files: [path], root: local, write: true })).toEqual([path])
    const synced = readFileSync(join(local, path), "utf8")
    expect(synced).toContain("Page header")
    expect(synced).not.toMatch(/;\n/)
    expect(await findDrift({ from: site, files: [path], root: local })).toEqual([])
  })

  it("fails when GitHub can't be reached instead of passing as no drift", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 }))
    )

    await expect(findDrift({ files: ["lib/utils.ts"] })).rejects.toThrow(/answered 429/)
  })
})
