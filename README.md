# Ziaflow — Sample Logistics (Shopify embedded app)

npm install

npm run dev

Push changes to website to shopify

npx shopify app deploy 

## Backend auth contract (ziaBackendCall → ziaback)

All client-initiated calls go through `lib/authenticatedZiaBackendCall`, which
attaches a Shopify App Bridge session token that the Next server action
(`lib/ziaBackendCall`) forwards to ziaback as:

    Authorization: Bearer <jwt>

The JWT is signed by Shopify (RS256) and valid ~60 seconds. Verify it on ziaback:

1. Parse the JWT header, take `kid`.
2. Fetch public keys from `https://<dest-host>/admin/oauth/jwks.json`
   (cache by `kid`; rotate-safe).
3. Verify RS256 signature and `exp`/`nbf` (allow ~5s clock skew).
4. Require `aud == <app client id>` (bd002f5a207cd93266c00f18d94008e2 for prod,
   41c9d083837e1449bacc7221a0f5f236 for dev) and `dest` matching
   `https://<shop>.myshopify.com`.

Verified claims:

- `sub`  — Shopify admin user id of whoever submitted the request (identity for logging/authorization)
- `dest` — the shop the request came from
- `sid`  — the user's session id on that shop

### Which routes need the header

**All of them.** Every call to ziaback goes through
`authenticatedZiaBackendCall` and carries `Authorization: Bearer <jwt>` — return
401 whenever the header is missing or invalid.

Server components can't mint a session token, so no `page.tsx` calls the backend
at render time. Pages are thin shells (`embeddedGuard` → `ShopifyUserGate` →
content), and each content component loads its data client-side with
`useBackendData` (`print/printers`, `settings`, `ops/*`, `sampleOps/*`), which
only runs after the gate has confirmed the Shopify session. Adding a new
page-load fetch means adding it to that hook, not to the page.

Note: server-action calls *look* like they come from the Next server (same egress
IP as the request that triggered them), so ziaback can't distinguish them by
origin — presence of a valid Bearer token is the signal.

### Identity on the client

`useShopifyUser()` (from `lib/ShopifyUserProvider`) exposes `user` and `shop` on
every page. Both come from the **session token claims**, not the User API:
Shopify's User API returns only `accountAccess` for admin logins (name, email,
id and accountType are POS-only), so `user.id` is the token's `sub` and `shop` is
`dest`. `ShopifyUserGate` blocks page content until `shop` is confirmed.

Client-side values are for UI only — authorization decisions belong on ziaback,
using the verified token claims.
