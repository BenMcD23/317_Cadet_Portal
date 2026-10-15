import { describe, expect, it } from "vitest"

import { safeCallback } from "@/lib/redirect"

describe("safeCallback", () => {
  it("keeps a path on this site, query and all", () => {
    expect(safeCallback("/lesson/abc123")).toBe("/lesson/abc123")
    expect(safeCallback("/my-orders?x=1")).toBe("/my-orders?x=1")
  })

  it("sends anything that could leave the site to the dashboard instead", () => {
    for (const raw of [
      "https://evil.example",
      "//evil.example/x",
      "/\\evil.example",
      "javascript:alert(1)",
      "lesson",
    ]) {
      expect(safeCallback(raw), raw).toBe("/")
    }
  })

  it("no callback is the dashboard", () => {
    expect(safeCallback(null)).toBe("/")
    expect(safeCallback(undefined)).toBe("/")
    expect(safeCallback("")).toBe("/")
  })
})
