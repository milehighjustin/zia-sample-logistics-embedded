import { headers } from "next/headers";

/**
 * Every page only renders inside the Shopify Admin iframe. This mirrors the
 * check the app has always used: the request must come from an iframe (or a
 * shopify.com referer) and carry the `host` + `shop` query params.
 *
 * Server-only — call it at the top of a page before rendering anything.
 */
export async function isEmbeddedInShopifyAdmin(searchParams: any): Promise<boolean> {
  const host = searchParams?.host as string | undefined;
  const shop = searchParams?.shop as string | undefined;
  const headerList = await headers();
  const referer = headerList.get("referer") || "";
  const fetchDest = headerList.get("sec-fetch-dest") || "";
  const isEmbeddedInIframe = fetchDest === "iframe" || referer.includes("shopify.com");
  return isEmbeddedInIframe && Boolean(host && shop);
}

export function AccessDenied() {
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
        Access Denied
      </h1>
      <p style={{ color: '#6d7175', fontSize: '14px', lineHeight: '1.5' }}>
        This application can only be securely accessed directly from within your
        Shopify Admin dashboard panel. Direct external browsing is restricted.
      </p>
    </div>
  );
}
