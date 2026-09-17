import AppShell from "@/lib/ui/AppShell"
import { ShopifyUserGate } from "@/lib/ShopifyUserProvider"
import { AccessDenied, isEmbeddedInShopifyAdmin } from "@/lib/embeddedGuard";
import OrderQueue from "../samples/ps/OrderQueue";

export const dynamic = 'force-dynamic';


export default async function Search(props: any) {
  const searchParams = await props.searchParams
  if (!(await isEmbeddedInShopifyAdmin(searchParams))) return <AccessDenied />

  return (
    <AppShell>
      <ShopifyUserGate>
        {/* No tag: the list starts empty and the top-bar search drives it. */}
        <OrderQueue tag="noneneededhere" search={true}/>
      </ShopifyUserGate>
    </AppShell>
  );
}
