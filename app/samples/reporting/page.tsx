import AppShell from "@/lib/ui/AppShell"
import { ShopifyUserGate } from "@/lib/ShopifyUserProvider"
import { AccessDenied, isEmbeddedInShopifyAdmin } from "@/lib/embeddedGuard";
import ReportingData from "./ReportingData";

export const dynamic = 'force-dynamic';


export default async function Reporting(props: any) {
  const searchParams = await props.searchParams
  if (!(await isEmbeddedInShopifyAdmin(searchParams))) return <AccessDenied />

  return (
    <AppShell>
      <ShopifyUserGate>
        <ReportingData />
      </ShopifyUserGate>
    </AppShell>
  );
}
