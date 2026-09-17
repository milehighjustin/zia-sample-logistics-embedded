"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAppBridge } from "@shopify/app-bridge-react"

export type ShopifyUser = {
  id?: number
  name?: string
  email?: string
  accountAccess?: string
}

type ShopifyUserContextValue = {
  /** Logged-in Shopify admin user (id, name, email, accountAccess) */
  user: ShopifyUser | null
  /** e.g. "your-store.myshopify.com" */
  shop: string | null
  /** Fresh session token (JWT) — decoded payload includes sub (user id), dest/shop domain, iss, exp */
  getIdToken: () => Promise<string | null>
  /** Decoded payload of a fresh id token */
  getIdTokenClaims: () => Promise<Record<string, any> | null>
  loading: boolean
  error: string | null
}

const ShopifyUserContext = createContext<ShopifyUserContextValue>({
  user: null,
  shop: null,
  getIdToken: async () => null,
  getIdTokenClaims: async () => null,
  loading: true,
  error: null,
})

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function ShopifyUserProvider({ children }: { children: React.ReactNode }) {
  const shopify = useAppBridge()
  const [user, setUser] = useState<ShopifyUser | null>(null)
  const [shop, setShop] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      return (await shopify.idToken()) ?? null
    } catch {
      return null
    }
  }, [shopify])

  const getIdTokenClaims = useCallback(async (): Promise<Record<string, any> | null> => {
    const token = await getIdToken()
    return token ? decodeJwtPayload(token) : null
  }, [getIdToken])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // idToken's `dest` claim is the canonical shop domain; fall back to `shop` claim.
        const token = await shopify.idToken()
        const claims = token ? decodeJwtPayload(token) : null
        const shopDomain =
          (claims?.dest as string | undefined)?.replace(/^https?:\/\//, "") ||
          (claims?.shop as string | undefined)?.replace(/^https?:\/\//, "") ||
          null
        const u = await shopify.user()
        if (cancelled) return
        setShop(shopDomain)
        setUser({
          id: u?.id,
          name: u?.name,
          email: u?.email,
          accountAccess: u?.accountAccess,
        })
        setError(null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Could not load Shopify user")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [shopify])

  return (
    <ShopifyUserContext.Provider value={{ user, shop, getIdToken, getIdTokenClaims, loading, error }}>
      {children}
    </ShopifyUserContext.Provider>
  )
}

export function useShopifyUser() {
  return useContext(ShopifyUserContext)
}

/**
 * Blocks rendering until App Bridge confirms a logged-in Shopify admin user and
 * shop. Use it to wrap page content so nothing loads until identity is known.
 */
export function ShopifyUserGate({ children }: { children: React.ReactNode }) {
  const { user, shop, loading, error } = useShopifyUser()

  if (loading) {
    // Skeleton while App Bridge resolves the session. No shop flash.
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-black text-black border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
        </div>
      </div>
    )
  }

  if (error || !user || !shop) {
    return (
      <div style={{
        padding: '40px',
        maxWidth: '500px',
        margin: '100px auto',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        border: '1px solid #e1e3e5',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h1 style={{ color: '#bf0711', fontSize: '22px', marginBottom: '12px' }}>
          Sign-In Required
        </h1>
        <p style={{ color: '#6d7175', fontSize: '14px', lineHeight: '1.5' }}>
          A logged-in Shopify admin session is required to use this application.
          Please reopen the app from your Shopify Admin dashboard.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
