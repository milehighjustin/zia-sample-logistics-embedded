'use client';

import DataGate from "@/lib/ui/DataGate";
import useBackendData from "@/lib/useBackendData";
import ReportingContent from "./ReportingContent";

/**
 * Reporting loads its carriers client-side so the request carries the Shopify
 * session token (see lib/useBackendData); each report fetches its own data on
 * demand from the client components below.
 */
export default function ReportingData() {
  const { data, loading, error, reload } = useBackendData({
    carriers: 'sampleOps/carriers',
  });

  return (
    <DataGate loading={loading} error={error} reload={reload} label="reporting">
      <ReportingContent carriers={data?.carriers?.carriers ?? []} />
    </DataGate>
  );
}
