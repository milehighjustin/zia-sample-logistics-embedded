import AppShell from "@/lib/ui/AppShell"
import ziaBackendCall from "@/lib/ziaBackendCall";
import OrderList from "../OrderList";


export default async function Home() {

  const printers = await ziaBackendCall('print/printers', 'GET', undefined)
  const settings = await ziaBackendCall('settings', 'GET', undefined)

  return (
    <AppShell>
      <OrderList tag="PRIORITY-SAMPLE-ORDER" printers={printers?.data} settings={settings?.data} />
    </AppShell>
  );
}
