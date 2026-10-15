import { describe, expect, it } from "vitest"

import { itemSummary, orderStatus } from "@/lib/order-status"

const item = (
  over: { givenAt?: string | null; readyToCollect?: string | null; needSizing?: boolean } = {}
) => ({
  givenAt: null,
  readyToCollect: null,
  needSizing: false,
  ...over,
})

describe("orderStatus", () => {
  it("is with the stores until something happens", () => {
    expect(orderStatus({ completed: false, items: [item(), item()] })).toEqual({
      label: "With the stores",
      tone: "progress",
    })
  })

  // Collecting is the one thing the cadet has to act on, so it wins.
  it("says ready to collect when everything outstanding is ready", () => {
    expect(orderStatus({ completed: false, items: [item({ readyToCollect: "t" })] }).label).toBe(
      "Ready to collect"
    )
  })

  it("counts what's ready when only some of it is", () => {
    const status = orderStatus({
      completed: false,
      items: [item({ readyToCollect: "t" }), item({ needSizing: true }), item()],
    })
    expect(status).toEqual({ label: "1 ready to collect", tone: "ready" })
  })

  it("ignores items already handed over when deciding what's ready", () => {
    const status = orderStatus({
      completed: false,
      items: [item({ givenAt: "t", readyToCollect: "t" }), item({ readyToCollect: "t" })],
    })
    expect(status.label).toBe("Ready to collect")
  })

  it("asks for sizing before anything can be issued", () => {
    expect(orderStatus({ completed: false, items: [item({ needSizing: true }), item()] }).label).toBe(
      "Needs sizing"
    )
  })

  it("is all issued once every item is handed over, or the order is closed", () => {
    expect(orderStatus({ completed: false, items: [item({ givenAt: "t" })] }).tone).toBe("done")
    expect(orderStatus({ completed: true, items: [item()] }).label).toBe("All issued")
  })

  // An order emptied by removing its last item isn't "all issued".
  it("doesn't call an empty, open order issued", () => {
    expect(orderStatus({ completed: false, items: [] }).tone).toBe("progress")
  })
})

describe("itemSummary", () => {
  it.each([
    [[], "No items"],
    [["Beret"], "Beret"],
    [["Beret", "Belt"], "Beret and Belt"],
    [["Beret", "Belt", "Jumper"], "Beret, Belt and Jumper"],
    [["Beret", "Belt", "Jumper", "Shirt", "Tie"], "Beret, Belt and 3 more"],
  ])("%j reads as %s", (names, expected) => {
    expect(itemSummary(names)).toBe(expected)
  })
})
