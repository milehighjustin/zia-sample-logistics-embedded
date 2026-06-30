import AppShell from "@/lib/ui/AppShell"
import ziaBackendCall from "@/lib/ziaBackendCall";
import OrderList from "../OrderList";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';


export default async function Home(props: any) {
  const params = await props.params
  const searchParams = await props.searchParams
  const host = searchParams.host as string | undefined;
  const shop = searchParams.shop as string | undefined;
  const headerList = await headers();
  const referer = headerList.get('referer') || '';
  const fetchDest = headerList.get('sec-fetch-dest') || '';
  const isEmbeddedInIframe = fetchDest === 'iframe' || referer.includes('shopify.com');
  const hasShopifyTokens = Boolean(host && shop);
  if (!isEmbeddedInIframe || !hasShopifyTokens) {
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



  const printers = await ziaBackendCall('print/printers', 'GET', undefined)
  const settings = await ziaBackendCall('settings', 'GET', undefined)

  return (
    <AppShell>
      <OrderList tag="PRIORITY-SAMPLE-ORDER" printers={printers?.data} settings={settings?.data} />
    </AppShell>
  );
}
