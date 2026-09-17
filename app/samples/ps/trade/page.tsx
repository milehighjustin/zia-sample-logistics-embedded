import AppShell from "@/lib/ui/AppShell"
import { ShopifyUserGate } from "@/lib/ShopifyUserProvider"
import { AccessDenied, isEmbeddedInShopifyAdmin } from "@/lib/embeddedGuard";
import OrderQueue from "../OrderQueue";

export const dynamic = 'force-dynamic';


export default async function Trade(props: any) {
  const searchParams = await props.searchParams
  if (!(await isEmbeddedInShopifyAdmin(searchParams))) return <AccessDenied />

  return (
    <AppShell>
      <ShopifyUserGate>
        <OrderQueue tag="TRADE-SAMPLE-ORDER" />
      </ShopifyUserGate>
    </AppShell>
  );
}
