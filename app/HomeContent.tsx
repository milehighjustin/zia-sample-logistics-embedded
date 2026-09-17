'use client';

import {
  ArrowRightIcon,
  BoltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  TagIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import BadgeV2 from "@/lib/ui/BadgeV2";
import PageStandard from "@/lib/ui/PageStandard";
import { useShopifyUser } from "@/lib/ShopifyUserProvider";
import useBackendData from "@/lib/useBackendData";
import { countExpeditedToShip } from "@/lib/pacificTime";

const fmtNum = (n: any) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US");

const fmtMoney = (n: any) =>
  n === null || n === undefined
    ? "—"
    : `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const QUICK_LINKS = [
  {
    title: "Process Samples",
    desc: "Fulfill today's sample orders",
    href: "/samples/ps",
    icon: Squares2X2Icon,
    iconWrap: "bg-sky-100 text-sky-700",
  },
  {
    title: "Expedited Queue",
    desc: "2-day & overnight deliveries",
    href: "/samples/ps/expedited",
    icon: BoltIcon,
    iconWrap: "bg-orange-100 text-orange-700",
  },
  {
    title: "Priority Queue",
    desc: "Priority sample orders",
    href: "/samples/ps/priority",
    icon: ExclamationTriangleIcon,
    iconWrap: "bg-red-100 text-red-700",
  },
  {
    title: "Trade Samples",
    desc: "Trade & partner samples",
    href: "/samples/ps/trade",
    icon: GiftIcon,
    iconWrap: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "Create Labels",
    desc: "Batch print shipping labels",
    href: "/samples/labels",
    icon: TagIcon,
    iconWrap: "bg-purple-100 text-purple-700",
  },
  {
    title: "Reporting",
    desc: "Orders, shipments & sales",
    href: "/samples/reporting",
    icon: ChartBarIcon,
    iconWrap: "bg-green-100 text-green-700",
  },
  {
    title: "Search Orders",
    desc: "Find any order by name",
    href: "/search",
    icon: MagnifyingGlassIcon,
    iconWrap: "bg-blue-100 text-blue-700",
  },
  {
    title: "Settings",
    desc: "Printers, rules & overrides",
    href: "/samples/settings",
    icon: Cog6ToothIcon,
    iconWrap: "bg-gray-100 text-gray-700",
  },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}



export default function HomeContent() {
  const { user, shop } = useShopifyUser();

  // Today's date for the summary query (local time, like the reporting page).
  const now = new Date();
  const todayParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Render-time data is fetched client-side so every call carries the Shopify
  // session token; server components can't mint one.
  const { data, error, reload } = useBackendData({
    printers: 'print/printers',
    settings: 'settings',
    summary: `reports/shopifyOrdersByTagByDateByStatus?tag=${encodeURIComponent('Sample Order')}&startDate=${todayParam}&endDate=${todayParam}&format=json&status=any`,
    expedited: `reports/shopifyOrdersByTagByDateByStatus?tag=${encodeURIComponent('Expedited Sample Delivery')}&startDate=${todayParam}&endDate=${todayParam}&format=json&status=open`,
    shipping: `reports/labelSpendReport?startDate=${todayParam}&endDate=${todayParam}&format=json`,
  });

  // The embedded admin User API only returns accountAccess, so name/email are
  // usually absent — fall back gracefully instead of showing "undefined".
  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const today = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const printers = data?.printers ?? [];
  const settings = data?.settings ?? [];
  const onlinePrinters = printers.filter((p: any) => p?.state === "online");

  const printerName = (code: string): string | null => {
    const id = settings.find((s: any) => s?.code === code)?.value;
    if (!id) return null;
    return printers.find((p: any) => String(p?.id) === String(id))?.name || null;
  };

  const configuredPrinters = [
    { label: "Shipping Printer", code: "shippingShippingPrinterId" },
    { label: "Label Printer", code: "shippingLabelPrinterId" },
    { label: "Letter Printer", code: "shippingLetterPrinterId" },
  ];

  const summary = data?.summary?.summary ?? null;
  const shipSummary = data?.shipping?.summary ?? null;

  // Expedited orders that still need shipping and came in before the 11:00am
  // Pacific cutoff (see lib/pacificTime). The report is already scoped to today
  // with status=open, so this only checks the hour and drops fulfilled orders.
  const expeditedToShip = countExpeditedToShip(data?.expedited?.orders);

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: "Sample Orders Today", value: fmtNum(summary?.orderCount) },
    { label: "Items Today", value: fmtNum(summary?.itemCount) },
    { label: "Net Sales Today", value: fmtMoney(summary?.netTotal) },
    {
      label: "Expedited To Ship",
      hint: "ordered before 11am",
      value: data === null ? "—" : String(expeditedToShip),
    },
    {
      label: "Shipments Today",
      value: data === null ? "—" : fmtNum(shipSummary?.labelCount),
    },
    {
      label: "Shipping Cost Today",
      value: data === null ? "—" : fmtMoney(shipSummary?.totalCost),
    },
    {
      label: "Printers Online",
      value: data === null ? "—" : `${onlinePrinters.length}/${printers.length}`,
    },
  ];

  return (
    <PageStandard>
      {/* Header */}
      <div className="flex flex-row flex-wrap justify-between items-center gap-4 w-full">
        <div>
          <div className="text-3xl font-bold text-gray-900">
            {greeting()}!
          </div>
          <div className="text-sm text-gray-500 mt-1">{today}</div>
        </div>
        <div className="flex flex-row gap-2 items-center flex-wrap">
          {shop && <BadgeV2 color="green">{shop}</BadgeV2>}
        </div>
      </div>

      {/* Today at a glance */}
      <div className="w-full">
        <div className="flex flex-row items-center justify-between mb-3">
          <div className="text-lg font-semibold text-gray-900">Today</div>
          {error && (
            <button
              onClick={reload}
              className="text-xs text-blue-700 hover:underline"
            >
              Couldn't load today's numbers — retry
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="text-xs uppercase tracking-wide text-gray-500">
                {stat.label}
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</div>
              {stat.hint && (
                <div className="text-[11px] text-gray-400">{stat.hint}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="w-full">
        <div className="text-lg font-semibold text-gray-900 mb-3">Go To</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.iconWrap}`}
              >
                <link.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-900">
                  {link.title}
                </div>
                <div className="truncate text-xs text-gray-500">{link.desc}</div>
              </div>
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </a>
          ))}
        </div>
      </div>

      {/* Printers */}
      <div className="w-full">
        <div className="text-lg font-semibold text-gray-900 mb-3">Printers</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-row items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Cog6ToothIcon className="h-4 w-4" />
              Configured Printers
            </div>
            <div className="flex flex-col gap-2">
              {configuredPrinters.map((entry) => {
                const name = printerName(entry.code);
                return (
                  <div
                    key={entry.code}
                    className="flex flex-row items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-gray-600">{entry.label}</span>
                    {name ? (
                      <span className="text-gray-900 font-medium truncate">{name}</span>
                    ) : (
                      <a href="/samples/settings" className="text-xs text-blue-700 hover:underline">
                        Not set — configure
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageStandard>
  );
}
