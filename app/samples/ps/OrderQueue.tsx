'use client';

import DataGate from "@/lib/ui/DataGate";
import useBackendData from "@/lib/useBackendData";
import OrderList from "./OrderList";

/**
 * Order queues plus order search. Printers/settings are loaded client-side so
 * the request carries the Shopify session token (see lib/useBackendData).
 */
export default function OrderQueue(props: { tag: string, search?: boolean }) {
  const { data, loading, error, reload } = useBackendData({
    printers: 'print/printers',
    settings: 'settings',
  });

  return (
    <DataGate loading={loading} error={error} reload={reload} label="orders">
      <OrderList
        tag={props.tag}
        printers={data?.printers ?? []}
        settings={data?.settings ?? []}
        search={props.search}
      />
    </DataGate>
  );
}
