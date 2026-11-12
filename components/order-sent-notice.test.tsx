// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const query = vi.hoisted(() => ({ current: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query.current) }))

import { OrderSentNotice } from "@/components/order-sent-notice"

describe("OrderSentNotice", () => {
  it.each([
    ["sent=uniform", "Your uniform order has gone to stores."],
    ["sent=badge", "Your badge order has gone to stores."],
  ])("after ?%s, says the order went and where to watch it", (q, title) => {
    query.current = q
    render(<OrderSentNotice />)
    expect(screen.getByRole("status")).toHaveTextContent(title)
    expect(screen.getByRole("status")).toHaveTextContent(/under Active below/)
  })

  it.each(["", "sent=nonsense", "other=1"])("says nothing for ?%s", (q) => {
    query.current = q
    const { container } = render(<OrderSentNotice />)
    expect(container).toBeEmptyDOMElement()
  })
})
