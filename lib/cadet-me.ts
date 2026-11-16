import { useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * The signed-in cadet's own record (`/cadets/me`). Home, My Details, Order
 * Uniform and My Orders all need it, and each used to fetch it again; through
 * this one cached query, moving between them doesn't wait on the API.
 *
 * `null` means "not a cadet": an adult volunteer signed in, and the API answers
 * 404. Any other failure is an error, never a quiet switch to the adult pages:
 * a cadet must not end up ordering as an adult because the API had a bad
 * moment.
 */
export type CadetMe = {
  cin: number
  name: string
  email: string | null
  phone_number: string
  // Empty until staff have set one; the join card only shows when there is
  // somewhere to send people.
  whatsapp_invite_url: string
}

export const CADET_ME_KEY = ["cadet", "me"] as const

export class CadetMeError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function fetchCadetMe(): Promise<CadetMe | null> {
  let res: Response
  try {
    res = await fetch("/api/cadet/me")
  } catch {
    throw new CadetMeError("Could not reach the server.", 0)
  }
  if (res.status === 404) return null
  const data = await res.json().catch(() => null)
  if (!res.ok || !data || typeof data !== "object") {
    throw new CadetMeError(data?.detail ?? "Could not load your details.", res.status)
  }
  return data as CadetMe
}

export function useCadetMe() {
  return useQuery<CadetMe | null, CadetMeError>({
    queryKey: CADET_ME_KEY,
    queryFn: fetchCadetMe,
    // A network blip or a 5xx is worth one more go; a 4xx won't change.
    retry: (count, err) => (err.status === 0 || err.status >= 500) && count < 1,
  })
}

/** Puts a changed record (a saved phone number) straight into the cache, so Home stops asking for it. */
export function useSetCadetMe() {
  const client = useQueryClient()
  return (update: (prev: CadetMe | null | undefined) => CadetMe | null | undefined) =>
    client.setQueryData<CadetMe | null>(CADET_ME_KEY, update)
}
