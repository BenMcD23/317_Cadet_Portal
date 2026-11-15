import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"

/**
 * Render a page that reads through React Query (useCadetMe, useActivityLog),
 * with a fresh cache per call so no test sees another's data, and no retries
 * so an error state shows straight away. Pass a client to start from a cache
 * another page has already filled.
 */
export function renderWithQuery(
  ui: ReactElement,
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
) {
  return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) }
}
