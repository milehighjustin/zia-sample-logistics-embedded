'use client';

import DataGate from "@/lib/ui/DataGate";
import useBackendData from "@/lib/useBackendData";
import SettingsContent from "./SettingsContent";

/**
 * Settings loads every dataset client-side so each request carries the Shopify
 * session token (see lib/useBackendData).
 */
export default function SettingsData() {
  const { data, loading, error, reload } = useBackendData({
    printers: 'print/printers',
    settings: 'settings',
    boxPackingRules: 'sampleOps/boxPacking',
    labelCountRules: 'sampleOps/labelCount',
    overrides: 'sampleOps/overrides',
    products: 'sampleOps/productList',
  });

  return (
    <DataGate loading={loading} error={error} reload={reload} label="settings">
      <SettingsContent
        printers={data?.printers ?? []}
        settings={data?.settings ?? []}
        boxPackingRules={data?.boxPackingRules ?? []}
        labelCountRules={data?.labelCountRules ?? []}
        overrides={data?.overrides ?? []}
        products={data?.products ?? []}
      />
    </DataGate>
  );
}
