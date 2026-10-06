'use client';

import Button from "@/lib/ui/Button";
import InputText from "@/lib/ui/InputText";
import ListContainer from "@/lib/ui/ListContainer";
import MasterList from "@/lib/ui/MasterList";
import Notification from "@/lib/ui/Notification";
import PageStandard from "@/lib/ui/PageStandard";
import TopBarContainer from "@/lib/ui/TopBarContainer";
import authenticatedZiaBackendCall from "@/lib/authenticatedZiaBackendCall";
import { addDaysToDayKey, pacificToday } from "@/lib/pacificTime";
import { useRef, useState } from "react";

const fmtMoney = (value: any): string => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtCount = (value: any): string => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
};

/** Weekday (0 = Sunday) of a YYYY-MM-DD day key, without touching time zones. */
const weekdayOf = (dayKey: string): number => new Date(`${dayKey}T00:00:00Z`).getUTCDay();

/**
 * Items sold for a Shopify tag over a date range — the item-level twin of
 * ShopifyOrdersByDate (reports/shopifyItemsByTagByDate vs
 * reports/shopifyOrdersByTagByDateByStatus). Same presets, but instead of one
 * line per order it aggregates by variant: how many were sold, across how many
 * orders, and what they were worth.
 *
 * `tag` is expected pre-encoded (the reporting nav passes "Sample%20Order"), the
 * same convention the sibling reports use.
 */
export default function ShopifyItemsByDate(props: { tag: string }) {
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<any>(null)
    const [range, setRange] = useState<{ start: string, end: string } | null>(null)
    const [alert, setAlert] = useState<{ type: string, text: string } | undefined>(undefined)

    const startDateRef = useRef<HTMLInputElement>(null)
    const endDateRef = useRef<HTMLInputElement>(null)

    // The backend bounds startDate/endDate as Pacific calendar days, so the
    // presets are computed from the shop's day rather than the browser's — a
    // viewer outside Pacific would otherwise ask for the wrong day.
    const fetchRange = (startDate: string, endDate: string) => {
        setLoading(true)
        setTimeout(async () => {
            const response = await authenticatedZiaBackendCall(`reports/shopifyItemsByTagByDate?tag=${props.tag}&startDate=${startDate}&endDate=${endDate}&format=json&status=any`, 'GET', undefined)
            if (response?.error) {
                // The report 400s on bad params and 500s when Shopify fails; the
                // backend puts the reason in `error`, so surface it rather than
                // leaving the previous range's rows on screen.
                setData(null)
                setRange(null)
                setAlert({ type: 'error', text: typeof response.error === 'string' ? response.error : 'Could not load the items report.' })
            } else {
                setData(response?.data)
                setRange({ start: startDate, end: endDate })
            }
            setLoading(false)
        }, 1)
    }

    const getToday = () => {
        const today = pacificToday()
        fetchRange(today, today)
    }

    const getWtd = () => {
        const today = pacificToday()
        fetchRange(addDaysToDayKey(today, -weekdayOf(today)), today)
    }

    const get30Days = () => {
        const today = pacificToday()
        fetchRange(addDaysToDayKey(today, -30), today)
    }

    const getRange = () => {
        const today = pacificToday()
        const startDate = startDateRef.current?.value || today
        const endDate = endDateRef.current?.value || startDate
        if (startDate && endDate) {
            fetchRange(startDate, endDate)
        }
    }

    const items: any[] = data?.items ?? []
    const summary = data?.summary ?? null
    const rangeLabel = range ? `${range.start} → ${range.end}` : ''

    const displayItems = items.map((item: any) => ({
        image: item.imageUrl
            ? <img src={item.imageUrl} className="max-w-[20px]" alt={item.productTitle || item.sku || ''} />
            : <span className="text-gray-400">—</span>,
        product: item.productTitle || '—',
        variant: item.variantTitle && item.variantTitle != 'Default Title' ? item.variantTitle : '—',
        sku: item.sku || '—',
        quantitySold: fmtCount(item.quantitySold),
        orderCount: fmtCount(item.orderCount),
    }))

    return (
        <PageStandard>
            {alert && <Notification type={alert.type == 'error' ? 'error' : 'success'} text={alert.text} close={() => setAlert(undefined)} />}
            <TopBarContainer>
                <div className="flex justify-between w-full">
                    <div className="flex gap-5 items-center">
                        <Button size="md" loading={loading} clickAction={getToday}>
                            Today
                        </Button>
                        <Button size="md" loading={loading} clickAction={getWtd}>
                            WTD
                        </Button>
                        <Button size="md" loading={loading} clickAction={get30Days}>
                            30 Days
                        </Button>
                    </div>

                    <div className="flex gap-2 items-center">
                        <InputText type="date" refX={startDateRef}></InputText>
                        <span>-</span>
                        <InputText type="date" refX={endDateRef}></InputText>
                        <Button size="sm" loading={loading} clickAction={getRange}>
                            Date Range
                        </Button>
                    </div>
                </div>
            </TopBarContainer>
            <ListContainer>
                {data && <MasterList
                    shadedRows={true}
                    hideHeader={true}
                    list={[
                        { name: 'Distinct Items', value: fmtCount(summary?.distinctItemCount) },
                        { name: 'Orders', value: fmtCount(summary?.orderCount) },
                        { name: 'Items Sold', value: fmtCount(summary?.quantitySold) },
                    ]}
                    alignFinalRight={true}
                    actionFunction={() => { }}
                    actionFunctions={[]}
                    headers={[{ name: 'Item Summary' }, { name: '' }]}
                    keys={['name', 'value']}
                />}

                {data && items.length > 0 && <div className="px-4 sm:px-6 lg:px-8 pt-6 text-sm font-semibold text-gray-900 dark:text-white">
                    Items Sold <span className="font-normal text-gray-500 dark:text-gray-300">{rangeLabel}</span>
                </div>}

                {data && items.length > 0 && <MasterList
                    shadedRows={true}
                    list={[
                        ...displayItems,
                        // Divider rows render item[key], not item.name — the label
                        // has to live in a mapped column (see MasterList).
                        { isDivider: true, product: 'Totals' },
                        {
                            image: '',
                            product: `${fmtCount(summary?.distinctItemCount)} items · ${fmtCount(summary?.orderCount)} orders`,
                            sku: '',
                            quantitySold: fmtCount(summary?.quantitySold),
                            orderCount: fmtCount(summary?.orderCount),
                        },
                    ]}
                    alignFinalRight={true}
                    actionFunction={() => { }}
                    actionFunctions={[]}
                    headers={[{ name: '' }, { name: 'Item' }, { name: 'SKU' }, { name: 'Qty Sold' }, { name: 'Orders' }]}
                    keys={['image', 'product', 'sku', 'quantitySold', 'orderCount']}
                />}

                {data && items.length == 0 && <div className="p-5 text-sm text-gray-500 dark:text-gray-300">
                    No items sold in this range ({rangeLabel}).
                </div>}
            </ListContainer>
        </PageStandard>
    );
}
