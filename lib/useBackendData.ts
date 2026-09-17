"use client"

import { useCallback, useEffect, useState } from "react"
import authenticatedZiaBackendCall from "./authenticatedZiaBackendCall"

/**
 * Loads backend data from a client component so every request carries a fresh
 * Shopify session token (`Authorization: Bearer <jwt>`).
 *
 * Server components can't mint session tokens, so anything a page needs at
 * render time is loaded here instead — always from inside `ShopifyUserGate`, so
 * the gate has already confirmed the Shopify session.
 *
 * Pass a stable map of key -> route:
 *
 *   const { data, loading, error, reload } = useBackendData({
 *     printers: 'print/printers',
 *     settings: 'settings',
 *   })
 *
 * `data` is null while loading, then a map of key -> payload (null for any
 * route that failed). `error` is true only when every route failed.
 */
export default function useBackendData(routes: Record<string, string>) {
  const [data, setData] = useState<Record<string, any> | null>(null)
  const [failed, setFailed] = useState<string[]>([])
  const [nonce, setNonce] = useState(0)

  // Stable dependency: routes are keyed by value, so a new object literal on
  // each render never triggers a refetch.
  const routesKey = JSON.stringify(routes)

  useEffect(() => {
    let cancelled = false
    const parsed: Record<string, string> = JSON.parse(routesKey)
    const keys = Object.keys(parsed)

    setData(null)
    setFailed([])

    const load = async () => {
      const results = await Promise.all(
        keys.map(async (key) => {
          const response = await authenticatedZiaBackendCall(parsed[key], 'GET', undefined)
          const payload = response?.error ? undefined : response?.data ?? null
          return [key, payload] as const
        })
      )
      const next: Record<string, any> = {}
      const failures: string[] = []
      for (const [key, payload] of results) {
        if (payload === undefined) failures.push(key)
        next[key] = payload === undefined ? null : payload
      }
      return { next, failures }
    }

    load()
      .then(({ next, failures }) => {
        if (cancelled) return
        setData(next)
        setFailed(failures)
      })
      .catch(() => {
        if (cancelled) return
        setData(Object.fromEntries(keys.map((key) => [key, null])))
        setFailed(keys)
      })

    return () => {
      cancelled = true
    }
  }, [routesKey, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return {
    data,
    loading: data === null,
    failed,
    // Nothing loaded at all — a dead backend, not a partially-missing payload.
    error: data !== null && Object.keys(data).length > 0 && failed.length === Object.keys(data).length,
    reload,
  }
}
