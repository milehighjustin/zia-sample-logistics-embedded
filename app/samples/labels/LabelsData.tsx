'use client';

import DataGate from "@/lib/ui/DataGate";
import useBackendData from "@/lib/useBackendData";
import ManualLabelsContent from "./ManualLabelsContent";

/**
 * Create Labels loads products/printers/settings client-side so each request
 * carries the Shopify session token (see lib/useBackendData).
 */
export default function LabelsData() {
  const { data, loading, error, reload } = useBackendData({
    products: 'sampleOps/productList',
    printers: 'print/printers',
    settings: 'settings',
  });

  return (
    <DataGate loading={loading} error={error} reload={reload} label="labels">
      <ManualLabelsContent
        products={data?.products ?? []}
        printers={data?.printers ?? []}
        settings={data?.settings ?? []}
      />
    </DataGate>
  );
}
