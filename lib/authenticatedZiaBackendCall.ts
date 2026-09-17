"use client"

import ziaBackendCall from "./ziaBackendCall"

/**
 * Client-side wrapper for ziaBackendCall. Grabs a fresh Shopify session token
 * (App Bridge `idToken`, ~60s TTL) on every call and passes it through the
 * server action, which forwards it to the backend as
 * `Authorization: Bearer <token>`.
 *
 * The token's JWT claims (verified on the backend against Shopify's JWKS):
 *   sub  — the Shopify admin user id who submitted the request
 *   dest — https://<shop>.myshopify.com, the shop the user is logged into
 *   aud  — this app's client id
 *
 * Use this for any call the backend should authenticate/authorize.
 */
export default async function authenticatedZiaBackendCall(
  route: string,
  method: string,
  data?: any
) {
  let token: string | undefined
  try {
    token = (await window.shopify?.idToken?.()) ?? undefined
  } catch {
    // No App Bridge available (e.g. dev outside iframe) — send without token and
    // let the backend decide per-route whether that's allowed.
  }
  return ziaBackendCall(route, method, data, token)
}
