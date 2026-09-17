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

- **Tokenless** (no `Authorization` header): page-load fetches made by Next
  server components (`app/**/page.tsx`) — e.g. `print/printers`, `settings`,
  `sampleOps/*` GETs at render time. Treat these as your public/optional-auth
  surface; they originate from your own server, not the browser.
- **Bearer required**: every call from `authenticatedZiaBackendCall` (all client
  components — order lists, shipping, labels, reporting, settings mutations).
  ziaback should return 401 for these routes when the header is missing/invalid.

Note: server-action calls *look* like they come from the Next server (same egress
IP as page-load fetches), so ziaback can't distinguish them by origin — presence
of a valid Bearer token is the signal.
