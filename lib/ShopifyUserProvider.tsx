"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useAppBridge } from "@shopify/app-bridge-react"

export type ShopifyUser = {
  /**
   * Shopify admin user id, taken from the session token's `sub` claim.
   * The User API does NOT return an id for admin logins, so the token is the
   * only reliable source.
   */
  id: string | null
  /**
   * Only populated on Shopify POS. On the (embedded) admin, Shopify's User API
   * returns accountAccess and nothing else, so name/email stay undefined.
   */
  name?: string
  email?: string
  /** e.g. "full" | "limited" — all the admin User API gives us */
  accountAccess?: string | null
}

type ShopifyUserContextValue = {
  /** Logged-in Shopify admin user (id + accountAccess, name/email on POS only) */
  user: ShopifyUser | null
  /** e.g. "your-store.myshopify.com", from the session token's `dest` claim */
  shop: string | null
  /** Fresh session token (JWT) — claims include sub (user id), dest (shop), iss, exp */
  getIdToken: () => Promise<string | null>
  /** Decoded payload of a fresh session token */
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

const stripScheme = (value?: string) => value?.replace(/^https?:\/\//, "").replace(/\/$/, "")

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
      // The session token is the authoritative identity: `sub` is the admin user
      // id and `dest` is the shop. This works even though shopify.user() only
      // returns accountAccess for admin logins.
      const token = await getIdToken()
      const claims = token ? decodeJwtPayload(token) : null

      let accountAccess: string | null = null
      let name: string | undefined
      let email: string | undefined
      try {
        const u: any = await shopify.user()
        accountAccess = u?.accountAccess ?? null
        name = u?.name ?? u?.firstName
        email = u?.email
      } catch {
        // User API unavailable in this context — identity still comes from the token.
      }

      if (cancelled) return
      setUser({
        id: claims?.sub ? String(claims.sub) : null,
        name,
        email,
        accountAccess,
      })
      setShop(stripScheme(claims?.dest || claims?.shop) || null)
      setError(token ? null : "No Shopify session token available")
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [shopify, getIdToken])

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
 * Blocks rendering until App Bridge confirms a Shopify admin session (a verified
 * shop from the session token). Name/email are not required — Shopify's admin
 * User API doesn't return them.
 */
export function ShopifyUserGate({ children }: { children: React.ReactNode }) {
  const { shop, loading } = useShopifyUser()

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="inline-block h-24 w-24 animate-spin rounded-full border-4 border-black text-black border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
        </div>
      </div>
    )
  }

  if (!shop) {
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
