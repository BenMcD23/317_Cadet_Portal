// @vitest-environment jsdom
/// <reference types="vite/client" />
// Renders every page while its data is loading and after the API has answered
// every request with a 500, and fails if either throws — a page that
// white-screens when the backend has a bad moment is what cadets notice.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, render } from "@testing-library/react"
import { Suspense, type ComponentType } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// One stable object, like the real hook — pages key effects on `session`.
const SESSION = {
  data: { id_token: "tok", user: { email: "cadet@317atc.co.uk", name: "Cara Cadet" } },
  status: "authenticated",
  update: () => Promise.resolve(null),
}
vi.mock("next-auth/react", () => ({
  useSession: () => SESSION,
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

vi.mock("@/lib/reference", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/reference")>()
  return {
    ...real,
    useReference: () => ({
      loaded: true,
      itemTypes: ["Beret", "Tie"],
      noSizeItems: new Set(["Tie"]),
      sizes: { Beret: ["55", "56"] },
      sizingFields: {},
      issuanceCategories: ["Beret", "Tie"],
      badgeCategories: [{ id: "core", name: "Core", items: ["Squadron"] }],
      categoriesWithoutGainedWhere: new Set(["core"]),
      gainedWhereOptions: [{ value: "camp", label: "Camp" }],
    }),
  }
})

// Asserted rather than passed as a type argument: Next 16.3's own `import.meta.glob`
// typing is non-generic and shadows Vite's.
const PAGES = import.meta.glob(["../app/**/page.tsx", "!../app/login/**"]) as Record<
  string,
  () => Promise<{ default: ComponentType<Record<string, unknown>> }>
>

let fetchMode: "pending" | "error"

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  Element.prototype.scrollIntoView = vi.fn()
  window.matchMedia ??= (q: string) =>
    ({
      matches: false,
      media: q,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }) as unknown as MediaQueryList
  vi.spyOn(console, "error").mockImplementation(() => {})
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      fetchMode === "pending"
        ? new Promise<Response>(() => {})
        : Promise.resolve(new Response(JSON.stringify({ detail: "Internal Server Error" }), { status: 500 }))
    )
  )
})

async function renderPage(path: string) {
  const { default: Page } = await PAGES[path]()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(
      <QueryClientProvider client={client}>
        <Suspense fallback={null}>
          <Page params={Promise.resolve({})} searchParams={Promise.resolve({})} />
        </Suspense>
      </QueryClientProvider>
    )
  })
  for (let i = 0; i < 5; i++) await act(async () => void (await new Promise((r) => setTimeout(r, 0))))
  return result!
}

const paths = Object.keys(PAGES).sort()

describe("every page renders", () => {
  it("finds the pages", () => {
    expect(paths.length).toBeGreaterThan(5)
  })

  it.each(paths)("%s — while loading", async (path) => {
    fetchMode = "pending"
    expect((await renderPage(path)).container).toBeTruthy()
  })

  it.each(paths)("%s — when the API errors", async (path) => {
    fetchMode = "error"
    expect((await renderPage(path)).container).toBeTruthy()
  })
})
