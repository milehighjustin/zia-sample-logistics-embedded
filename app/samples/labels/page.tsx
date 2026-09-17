import AppShell from "@/lib/ui/AppShell"
import { ShopifyUserGate } from "@/lib/ShopifyUserProvider"
import { AccessDenied, isEmbeddedInShopifyAdmin } from "@/lib/embeddedGuard";
import LabelsData from "./LabelsData";

export const dynamic = 'force-dynamic';


export default async function ManualLabels(props: any) {
  const searchParams = await props.searchParams
  if (!(await isEmbeddedInShopifyAdmin(searchParams))) return <AccessDenied />

  return (
    <AppShell>
      <ShopifyUserGate>
        <LabelsData />
      </ShopifyUserGate>
    </AppShell>
  );
}
