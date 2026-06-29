import AppShell from "@/lib/ui/AppShell"
import ziaBackendCall from "@/lib/ziaBackendCall";
import SettingsContent from "./SettingsContent";


export default async function Home() {

  const printers = await ziaBackendCall('print/printers', 'GET', undefined)
  const boxPackingRules = await ziaBackendCall('sampleOps/boxPacking', 'GET', undefined)
  const labelCountRules = await ziaBackendCall('sampleOps/labelCount', 'GET', undefined)
  const overrides = await ziaBackendCall('sampleOps/overrides', 'GET', undefined)
  const products = await ziaBackendCall('sampleOps/productList', 'GET', undefined)
  const settings = await ziaBackendCall('settings', 'GET', undefined)
  console.log(settings, 'settings')
  return (
    <AppShell>
      <SettingsContent printers={printers.data} settings={settings.data} boxPackingRules={boxPackingRules.data} labelCountRules={labelCountRules.data} overrides={overrides.data} products={products.data}></SettingsContent>
    </AppShell>
  );
}
