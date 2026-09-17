"use client"

import { useMemo, useRef, useState } from "react"
import BadgeV2 from "@/lib/ui/BadgeV2"
import Button from "@/lib/ui/Button"
import { useShopifyUser } from "@/lib/ShopifyUserProvider"
import { BsBoxSeam, BsClipboard, BsGeoAlt, BsPerson, BsTruck, BsUpcScan } from "react-icons/bs"

/**
 * Presentation for ziaback's `ops/orderDetail` payload.
 *
 * The payload fans out to Shopify (raw order node + normalized summary),
 * ShipStation (labels/shipments per tracking number) and the draft order
 * timeline. Every field is read defensively, and every part of the response is
 * surfaced somewhere below — including the parts that only matter occasionally
 * (fulfillment orders, advanced shipping options, lookup diagnostics).
 *
 * Field-placement gotcha to remember: `confirmationNumber` lives on `order` and
 * is NOT on `summary`; most other display fields exist on both.
 */
export default function OrderDetailView(props: { detail: any }) {
  const detail = props.detail
  const order = detail.order || {}
  const summary = detail.summary || {}
  const shipstation = detail.shipstation || {}
  const shopifyLookup = detail.shopify || {}
  const draftTimeline = detail.draftTimeline
  const tracking: any[] = shipstation.tracking || []
  const fulfillments: any[] = order.fulfillments || []
  const fulfillmentOrders: any[] = order.fulfillmentOrders?.nodes || []
  const orderEvents: any[] = order.events?.nodes || []
  const lineItems: any[] = order.lineItems?.nodes || []

  const fulfillmentCount = order.fulfillmentsCount?.count ?? summary.fulfillmentCount ?? fulfillments.length
  const estimatedDelivery = firstDefined(fulfillments.map((f) => f.estimatedDeliveryAt))
  const inTransit = firstDefined(fulfillments.map((f) => f.inTransitAt))
  const delivered = firstDefined(fulfillments.map((f) => f.deliveredAt))
  const isCancelled = !!summary.cancelledAt
  const isClosed = !!summary.closed
  const currency = summary.currencyCode || order.currencyCode

  const labelSpend = tracking.reduce(
    (acc, entry) => acc + (entry.labels || []).reduce((sum: number, label: any) => sum + (Number(label.totalCost) || 0), 0),
    0
  )
  const shipmentSpend = tracking.reduce(
    (acc, entry) => acc + (entry.labels || []).reduce((sum: number, label: any) => sum + (Number(label.shipmentCost) || 0), 0),
    0
  )
  const insuranceSpend = tracking.reduce(
    (acc, entry) => acc + (entry.labels || []).reduce((sum: number, label: any) => sum + (Number(label.insuranceCost) || 0), 0),
    0
  )
  const labelCount = shipstation.labelCount ?? tracking.reduce((acc, e) => acc + (e.labels?.length || 0), 0)
  const shipmentCount = shipstation.shipmentCount ?? tracking.reduce((acc, e) => acc + (e.shipments?.length || 0), 0)
  const itemWeightLb = lineItems.reduce((acc, item) => {
    const w = itemWeight(item)
    if (!w) return acc
    const value = Number(w.value) || 0
    return acc + toPounds(value, w.unit) * (Number(item.quantity) || 0)
  }, 0)
  const itemWeightGrams = lineItems.reduce((acc, item) => {
    const w = itemWeight(item)
    if (!w) return acc
    return acc + toGrams(Number(w.value) || 0, w.unit) * (Number(item.quantity) || 0)
  }, 0)
  const unfulfilledCount = lineItems.reduce((acc, i) => acc + (Number(i.unfulfilledQuantity) || 0), 0)
  // Shopify's summary.totalWeight carries no unit; infer it by cross-checking the
  // order total against the summed item weights, and say "shop units" if unsure.
  const summaryWeightUnit = inferShopWeightUnit(summary.totalWeight, itemWeightGrams)

  // The provider's shop (from the session token's `dest`) is the reliable way to
  // build admin links; the payload's own admin URL is a fallback for when this
  // view is rendered outside the provider.
  const { shop } = useShopifyUser()
  const adminOrigin = shop ? `https://${shop}` : adminOriginOf(detail)

  const json = useMemo(() => JSON.stringify(detail, null, 2), [detail])
  const jsonRef = useRef<HTMLTextAreaElement>(null)
  const [copyFailed, setCopyFailed] = useState(false)

  const fileName = `order-${String(summary.name || order.name || "detail").replace(/[^a-zA-Z0-9._-]/g, "")}.json`

  /**
   * Copies the payload as JSON. Two ways in, and if both are blocked it says so
   * rather than silently putting something else on the clipboard:
   *
   *  1. the async clipboard API (what the admin iframe usually denies), then
   *  2. a selection-based copy — but only trusted when the textarea actually
   *     owns the selection, since `focus()` can no-op inside the iframe and
   *     `execCommand('copy')` would then copy whatever the page had selected.
   */
  const copyJson = async () => {
    const el = jsonRef.current

    try {
      if (el) {
        el.focus()
        el.select()
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(json)
        setCopyFailed(false)
        window.shopify?.toast?.show("Order JSON copied", { duration: 2000 })
        return
      }
    } catch {
      // Permission denied / not focused — fall through to the selection copy.
    }

    try {
      const focused = el && document.activeElement === el
      if (el && focused && document.execCommand("copy")) {
        setCopyFailed(false)
        window.shopify?.toast?.show("Order JSON copied", { duration: 2000 })
        return
      }
    } catch {
      // execCommand unavailable — fall through.
    }

    // Nothing worked. Point at the download instead of pretending it copied.
    setCopyFailed(true)
    window.shopify?.toast?.show(`Clipboard blocked — use Download JSON`, { duration: 4000 })
  }

  /** Always-works escape hatch: save the payload as a real .json file. */
  const downloadJson = () => {
    try {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }))
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      window.shopify?.toast?.show("Could not download the JSON", { duration: 3000 })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ================= Header ================= */}
      <div className="rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-5 flex flex-col gap-3">
          <div className="flex flex-row flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold">{summary.name || order.name || "Order"}</span>
                <div className="flex flex-row gap-2 flex-wrap">
                  <BadgeV2
                    color={
                      summary.displayFulfillmentStatus === "FULFILLED"
                        ? "green"
                        : summary.displayFulfillmentStatus === "PARTIALLY_FULFILLED"
                        ? "orange"
                        : "blue"
                    }
                  >
                    {prettifyKey(summary.displayFulfillmentStatus)}
                  </BadgeV2>
                  <BadgeV2 color={summary.fullyPaid ? "green" : "red"}>
                    {prettifyKey(summary.displayFinancialStatus)}
                  </BadgeV2>
                  {isCancelled && <BadgeV2 color="red">Cancelled</BadgeV2>}
                  {isClosed && !isCancelled && <BadgeV2 color="gray">Archived</BadgeV2>}
                  {summary.returnStatus && summary.returnStatus !== "NO_RETURN" && (
                    <BadgeV2 color="orange">{prettifyKey(summary.returnStatus)}</BadgeV2>
                  )}
                  {summary.edited && <BadgeV2 color="purple">Edited</BadgeV2>}
                  {summary.test && <BadgeV2 color="yellow">Test</BadgeV2>}
                </div>
              </div>
              <div className="text-sm text-gray-600 flex flex-row gap-2 flex-wrap items-center">
                <BsPerson className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">{summary.customer || order.customer?.displayName || "No customer"}</span>
                {summary.email && <span className="text-gray-500">· {summary.email}</span>}
                {summary.phone && <span className="text-gray-500">· {summary.phone}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {adminOrigin && summary.legacyResourceId && (
                <a
                  href={`${adminOrigin}/admin/orders/${summary.legacyResourceId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 hover:underline whitespace-nowrap"
                >
                  Open in Shopify ↗
                </a>
              )}
              {/* confirmationNumber is only on the raw order node, never on summary */}
              {(order.confirmationNumber || summary.confirmationNumber) && (
                <div className="text-xs text-gray-500 font-mono">
                  <BsUpcScan className="h-3.5 w-3.5 inline mr-1" />
                  {order.confirmationNumber || summary.confirmationNumber}
                </div>
              )}
            </div>
          </div>

          {/* Operational tags, resolved to readable labels */}
          <div className="flex flex-row gap-2 flex-wrap">
            {orderFlags(summary.tags || order.tags || []).map((flag, i) => (
              <BadgeV2 key={i} color={flag.color}>
                {flag.label}
              </BadgeV2>
            ))}
            {(summary.tags || order.tags || [])
              .filter((t: string) => !orderFlags([t]).length)
              .map((tag: string, i: number) => (
                <span key={i} className="text-xs text-gray-500 bg-white ring-1 ring-gray-200 rounded-md px-2 py-1">
                  {tag}
                </span>
              ))}
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
          <Stat label="Created" value={fmtDate(summary.createdAt)} sub={fmtTime(summary.createdAt)} />
          <Stat label="Items" value={`${summary.itemCount ?? lineItems.length}`} sub={`${summary.lineItemCount ?? 0} line items`} />
          <Stat
            label="Fulfilled"
            value={`${fulfillmentCount}`}
            sub={fulfillments.length ? fmtDate(fulfillments[0].createdAt) : "nothing shipped"}
          />
          <Stat label="Deliver By" value={fmtDate(estimatedDelivery)} sub={estimatedDelivery ? "estimated" : "no estimate"} />
          <Stat
            label="Shipments"
            value={`${shipmentCount}`}
            sub={`${tracking.length} tracking number${tracking.length === 1 ? "" : "s"}`}
          />
          <Stat label="Labels" value={`${labelCount}`} sub={labelSpend > 0 ? `${money(labelSpend, currency)} spend` : "no spend"} />
          <Stat
            label="Weight"
            value={summary.totalWeight ? `${summary.totalWeight} ${summaryWeightUnit}` : `${itemWeightLb.toFixed(2)} lb`}
            sub={
              summary.totalWeight
                ? `${itemWeightLb.toFixed(2)} lb of items`
                : "summed from item weights"
            }
          />
          <Stat
            label="Refunds"
            value={`${summary.refundCount ?? order.refunds?.length ?? 0}`}
            sub={`${summary.transactionCount ?? order.transactions?.length ?? 0} transactions`}
          />
        </div>
      </div>

      {/* ================= Alerts ================= */}
      {!!shopifyLookup.otherMatches?.length && (
        <Notice tone="orange" title="Other orders matched this lookup">
          {shopifyLookup.otherMatches.map((m: any) => `${m.name} (${fmtDate(m.createdAt)})`).join(", ")}
        </Notice>
      )}
      {!!summary.truncated?.length && (
        <Notice tone="orange" title="Some Shopify data was truncated">
          {summary.truncated.join(", ")}
        </Notice>
      )}
      {!!summary.moreFulfillments && (
        <Notice tone="orange" title={`${summary.moreFulfillments} more fulfillments not shown`}>
          Shopify returned only the first page of fulfillments for this order.
        </Notice>
      )}
      {!!summary.moreTransactions && (
        <Notice tone="orange" title={`${summary.moreTransactions} more transactions not shown`}>
          Shopify returned only the first page of transactions for this order.
        </Notice>
      )}
      {shipstation.error && <Notice tone="red" title="ShipStation lookup failed">{shipstation.error}</Notice>}
      {!!shipstation.errors?.length && (
        <Notice tone="orange" title="ShipStation reported problems">
          {shipstation.errors.join(", ")}
        </Notice>
      )}
      {detail.draftError && <Notice tone="orange" title="Draft order lookup failed">{detail.draftError}</Notice>}

      {/* ================= Fulfillment status ================= */}
      <Section
        icon={BsTruck}
        title="Fulfillment"
        badges={[
          `${fulfillmentCount} fulfillment${fulfillmentCount === 1 ? "" : "s"}`,
          `${unfulfilledCount} unfulfilled item${unfulfilledCount === 1 ? "" : "s"}`,
        ]}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
          <Row label="Status" value={prettifyKey(summary.displayFulfillmentStatus)} />
          <Row label="Fulfillable" value={flagText(order.fulfillable)} />
          <Row label="Requires Shipping" value={flagText(order.requiresShipping)} />
          <Row label="Shipped" value={fmtDateTime(fulfillments[0]?.createdAt)} />
          <Row label="In Transit" value={fmtDateTime(inTransit)} />
          <Row label="Delivered" value={fmtDateTime(delivered)} />
          <Row label="Estimated Delivery" value={fmtDate(estimatedDelivery)} />
          <Row label="Total Shipped Qty" value={fulfillments.reduce((acc, f) => acc + (Number(f.totalQuantity) || 0), 0)} />
          <Row
            label="Unfulfilled Qty"
            value={lineItems.reduce((acc, i) => acc + (Number(i.unfulfilledQuantity) || 0), 0)}
          />
        </div>

        {/* Fulfillment orders: what Shopify still expects you to ship */}
        {!!fulfillmentOrders.length && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-500">Fulfillment Orders</div>
            {fulfillmentOrders.map((fo: any, i: number) => (
              <div key={i} className="rounded-lg ring-1 ring-gray-200 p-3 flex flex-col gap-2">
                <div className="flex flex-row justify-between gap-3 flex-wrap items-center">
                  <div className="flex flex-row gap-2 flex-wrap items-center">
                    <BadgeV2 color={fo.status === "CLOSED" ? "gray" : fo.status === "OPEN" ? "blue" : "orange"}>
                      {prettifyKey(fo.status)}
                    </BadgeV2>
                    <span className="text-xs text-gray-500">{prettifyKey(fo.requestStatus)}</span>
                    {fo.assignedLocation?.name && <BadgeV2 color="gray">{fo.assignedLocation.name}</BadgeV2>}
                  </div>
                  <span className="text-xs text-gray-500">
                    {fmtDateTime(fo.createdAt)}
                    {fo.updatedAt && ` → ${fmtDateTime(fo.updatedAt)}`}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {(fo.lineItems?.nodes || []).map((li: any, li2: number) => (
                    <div key={li2} className="flex flex-row justify-between gap-3 text-xs">
                      <span className="truncate text-gray-600">{li.lineItem?.name}</span>
                      <span className={`whitespace-nowrap ${li.remainingQuantity ? "text-orange-600 font-medium" : "text-gray-400"}`}>
                        {li.remainingQuantity} of {li.totalQuantity} remaining
                      </span>
                    </div>
                  ))}
                </div>
                {!!fo.supportedActions?.length && (
                  <div className="text-xs text-gray-400">Supported actions: {fo.supportedActions.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ================= Shipping method ================= */}
      <Section icon={BsTruck} title="Shipping Method">
        {!(summary.shippingLines || []).length && !(order.shippingLines?.nodes || []).length ? (
          <div className="text-sm text-gray-500">No shipping lines on this order.</div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {(summary.shippingLines?.length ? summary.shippingLines : order.shippingLines?.nodes || []).map(
              (line: any, i: number) => (
                <div key={i} className="flex flex-row justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <div className="flex flex-col min-w-0">
                    <div className="font-medium text-sm">{line.title}</div>
                    <div className="text-xs text-gray-500">
                      {[line.code, line.carrierIdentifier, line.source, line.custom ? "custom" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {line.shippingRateHandle && (
                      <div className="text-xs text-gray-400 font-mono">{line.shippingRateHandle}</div>
                    )}
                    {!!line.taxLines?.length && (
                      <div className="text-xs text-gray-400">
                        {line.taxLines
                          .map((t: any) => `${t.title} @ ${((Number(t.rate) || 0) * 100).toFixed(2)}%`)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium whitespace-nowrap">
                    {line.amount
                      ? money(line.amount, currency)
                      : pickMoney(line.originalPriceSet) || pickMoney(line.discountedPriceSet)
                      ? money(pickMoney(line.originalPriceSet) ?? pickMoney(line.discountedPriceSet), currency)
                      : "free"}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Section>

      {/* ================= Addresses ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Section icon={BsGeoAlt} title="Ship To">
          <AddressBlock address={order.shippingAddress} />
        </Section>
        <Section icon={BsGeoAlt} title="Bill To">
          <AddressBlock address={order.billingAddress} />
          {sameAddress(order.shippingAddress, order.billingAddress) && (
            <div className="text-xs text-gray-400 mt-2">Same as shipping address.</div>
          )}
        </Section>
      </div>

      {/* ================= Customer ================= */}
      {order.customer && (
        <Section icon={BsPerson} title="Customer">
          <div className="flex flex-row justify-between gap-4 flex-wrap">
            <div className="flex flex-col text-sm">
              <span className="font-medium">{order.customer.displayName}</span>
              <span className="text-gray-500">{order.customer.email}</span>
              {order.customer.phone && <span className="text-gray-500">{order.customer.phone}</span>}
              <span className="text-xs text-gray-400 mt-1">
                Customer since {fmtDate(order.customer.createdAt)} · {order.customer.numberOfOrders} orders
                {order.customer.state ? ` · ${prettifyKey(order.customer.state)}` : ""}
              </span>
              {order.customer.updatedAt && (
                <span className="text-xs text-gray-400">Updated {fmtDateTime(order.customer.updatedAt)}</span>
              )}
              {!!order.customer.note && <span className="text-xs text-gray-600 mt-1">{order.customer.note}</span>}
            </div>
            <div className="flex flex-row gap-2 flex-wrap items-start">
              {(order.customer.tags || []).map((tag: string, i: number) => (
                <span key={i} className="text-xs text-gray-500 bg-gray-50 ring-1 ring-gray-200 rounded-md px-2 py-1">
                  {tag}
                </span>
              ))}
              {adminOrigin && idTail(order.customer.id) && (
                <a
                  href={`${adminOrigin}/admin/customers/${idTail(order.customer.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-700 hover:underline"
                >
                  Open customer ↗
                </a>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* ================= Items ================= */}
      <Section icon={BsBoxSeam} title="Items" badges={[`${summary.itemCount ?? lineItems.length} items`]}>
        <div className="flex flex-col divide-y divide-gray-100">
          {lineItems.map((item: any, i: number) => {
            const weight = itemWeight(item)
            return (
              <div key={i} className="flex flex-row gap-3 py-3 first:pt-0">
                {item.product?.featuredImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.featuredImage.url}
                    alt={item.title}
                    className="h-14 w-14 flex-none rounded-lg object-cover ring-1 ring-gray-200"
                  />
                ) : (
                  <div className="h-14 w-14 flex-none rounded-lg bg-gray-100 ring-1 ring-gray-200" />
                )}
                <div className="flex flex-col min-w-0 grow">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {item.sku}
                    {item.variant?.sku && item.variant.sku !== item.sku ? ` · ${item.variant.sku}` : ""}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex flex-row gap-2 flex-wrap">
                    <span>{item.vendor}</span>
                    {item.variant?.inventoryItem?.countryCodeOfOrigin && (
                      <span>· origin {item.variant.inventoryItem.countryCodeOfOrigin}</span>
                    )}
                    {weight && (
                      <span>
                        · {weight.value} {unitLabel(weight.unit)}
                      </span>
                    )}
                    {item.requiresShipping === false && <span>· no shipping</span>}
                    {item.taxable === false && <span>· not taxable</span>}
                    {item.variant?.inventoryItem?.harmonizedSystemCode && (
                      <span>· HS {item.variant.inventoryItem.harmonizedSystemCode}</span>
                    )}
                  </div>
                  {!!item.unfulfilledQuantity && (
                    <div className="mt-1">
                      <BadgeV2 color="blue">{item.unfulfilledQuantity} unfulfilled</BadgeV2>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end text-sm whitespace-nowrap">
                  <div className="text-xs text-gray-500">
                    {item.quantity} × {money(pickMoney(item.originalUnitPriceSet), currency)}
                  </div>
                  <div className="font-medium">{money(pickMoney(item.discountedTotalSet), currency)}</div>
                  {item.totalDiscountSet && Number(pickMoney(item.totalDiscountSet)) > 0 && (
                    <div className="text-xs text-green-700">
                      −{money(pickMoney(item.totalDiscountSet), currency)} off
                    </div>
                  )}
                  {item.currentQuantity !== item.quantity && (
                    <div className="text-xs text-gray-400">{item.currentQuantity} remaining</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
          {summary.totals && (
            <>
              <TotalRow label="Subtotal" value={money(summary.totals.subtotal, currency)} />
              {!!summary.totals.discounts && (
                <TotalRow label="Discounts" value={`− ${money(summary.totals.discounts, currency)}`} />
              )}
              <TotalRow label="Shipping" value={summary.totals.shipping ? money(summary.totals.shipping, currency) : "free"} />
              {!!summary.totals.tax && <TotalRow label="Tax" value={money(summary.totals.tax, currency)} />}
              {!!summary.totals.refunded && (
                <TotalRow label="Refunded" value={`− ${money(summary.totals.refunded, currency)}`} />
              )}
              {!!summary.totals.refundedShipping && (
                <TotalRow label="Refunded Shipping" value={`− ${money(summary.totals.refundedShipping, currency)}`} />
              )}
              <TotalRow label="Total" value={money(summary.totals.total, currency)} strong />
            </>
          )}
          <div className="flex flex-row justify-between gap-3 text-xs text-gray-400 pt-1">
            <span>{order.lineItems?.pageInfo?.hasNextPage ? "Line items truncated by Shopify" : "All line items shown"}</span>
            <span>Σ item weight {itemWeightLb.toFixed(2)} lb</span>
          </div>
          {!!(order.discountCodes || []).length && (
            <div className="flex flex-row justify-end gap-2 pt-1">
              {order.discountCodes.map((code: string, i: number) => (
                <BadgeV2 key={i} color="purple">
                  {code}
                </BadgeV2>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ================= Fulfillments & tracking ================= */}
      <Section
        icon={BsTruck}
        title="Fulfillments & Tracking"
        badges={[`${fulfillments.length} fulfillment${fulfillments.length === 1 ? "" : "s"}`]}
      >
        {!fulfillments.length && <div className="text-sm text-gray-500">Nothing has shipped yet.</div>}
        <div className="flex flex-col gap-3">
          {fulfillments.map((f: any, i: number) => (
            <div key={i} className="rounded-lg ring-1 ring-gray-200 p-3 flex flex-col gap-2">
              <div className="flex flex-row justify-between items-start gap-3 flex-wrap">
                <div className="flex flex-row items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{f.name}</span>
                  {f.displayStatus && (
                    <BadgeV2 color={f.status === "SUCCESS" ? "green" : "gray"}>{prettifyKey(f.displayStatus)}</BadgeV2>
                  )}
                  {f.location?.name && <BadgeV2 color="gray">{f.location.name}</BadgeV2>}
                  {f.totalQuantity !== undefined && <BadgeV2 color="gray">{f.totalQuantity} items</BadgeV2>}
                  {f.requiresShipping === false && <BadgeV2 color="gray">No shipping</BadgeV2>}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  <div>{fmtDateTime(f.createdAt)}</div>
                  {f.updatedAt && f.updatedAt !== f.createdAt && <div className="text-gray-400">updated {fmtDateTime(f.updatedAt)}</div>}
                  {f.estimatedDeliveryAt && (
                    <div className="text-gray-400">est. delivery {fmtDate(f.estimatedDeliveryAt)}</div>
                  )}
                  {f.inTransitAt && <div className="text-gray-400">in transit {fmtDate(f.inTransitAt)}</div>}
                  {f.deliveredAt && <div className="text-green-700">delivered {fmtDate(f.deliveredAt)}</div>}
                </div>
              </div>

              {/* Tracking numbers with carrier links */}
              <div className="flex flex-col gap-1">
                {(f.trackingInfo || []).map((t: any, ti: number) => (
                  <div key={ti} className="flex flex-row items-center gap-2 flex-wrap">
                    <BsTruck className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm">{t.company}</span>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-sm font-mono text-sky-700 hover:underline">
                        {t.number} ↗
                      </a>
                    ) : (
                      <span className="text-sm font-mono">{t.number}</span>
                    )}
                  </div>
                ))}
                {!(f.trackingInfo || []).length && (
                  <div className="text-xs text-gray-400">No tracking on this fulfillment.</div>
                )}
              </div>

              {/* What was in it */}
              <div className="flex flex-col gap-1">
                {(f.fulfillmentLineItems?.nodes || []).map((fli: any, fi: number) => (
                  <div key={fi} className="flex flex-row justify-between gap-3 text-xs text-gray-600">
                    <span className="truncate">
                      {fli.lineItem?.name}
                      {fli.lineItem?.sku ? <span className="text-gray-400 font-mono"> · {fli.lineItem.sku}</span> : null}
                    </span>
                    <span className="whitespace-nowrap">×{fli.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Fulfillment events */}
              {!!f.events?.nodes?.length && (
                <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
                  {f.events.nodes.map((e: any, ei: number) => (
                    <div key={ei} className="flex flex-row justify-between text-xs text-gray-500">
                      <span>{prettifyKey(e.status)}</span>
                      <span>{fmtDateTime(e.happenedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ================= ShipStation ================= */}
      <Section
        icon={BsTruck}
        title="ShipStation"
        badges={[
          `${labelCount} label${labelCount === 1 ? "" : "s"}`,
          `${shipmentCount} shipment${shipmentCount === 1 ? "" : "s"}`,
          ...(labelSpend > 0 ? [`${money(labelSpend, currency)} spend`] : []),
        ]}
      >
        {!tracking.length && !shipstation.error && (
          <div className="text-sm text-gray-500">No labels have been purchased for this order.</div>
        )}

        {!!tracking.length && (
          <div className="flex flex-col gap-4">
            {tracking.map((entry: any, i: number) => (
              <div key={i} className="rounded-lg ring-1 ring-gray-200 p-3 flex flex-col gap-3">
                <div className="flex flex-row justify-between items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm font-semibold">{entry.trackingNumber}</span>                      <div className="flex flex-row gap-2">
                    {entry.fromOrder && <BadgeV2 color="gray">From order</BadgeV2>}
                    <BadgeV2 color="gray">{entry.labels?.length ?? 0} labels</BadgeV2>
                    <BadgeV2 color="gray">{entry.shipments?.length ?? 0} shipments</BadgeV2>
                  </div>
                </div>

                {/* Labels purchased */}
                {(entry.labels || []).map((label: any, li: number) => (
                  <div key={li} className="bg-gray-50 rounded-md p-3 flex flex-col gap-2">
                    <div className="flex flex-row justify-between gap-3 flex-wrap">
                      <div className="flex flex-row items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {label.carrierName} {titleFromCode(label.serviceCode)}
                        </span>
                        <BadgeV2 color={label.voided ? "red" : label.status === "completed" ? "green" : "gray"}>
                          {label.voided ? "Voided" : prettifyKey(label.status)}
                        </BadgeV2>
                        {label.isReturnLabel && <BadgeV2 color="orange">Return</BadgeV2>}
                        {label.isInternational && <BadgeV2 color="orange">International</BadgeV2>}
                      </div>
                      <div className="text-sm font-semibold">{money(label.totalCost, currency)}</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                      <Row label="Label ID" value={label.labelId} mono />
                      <Row label="Purchased" value={fmtDateTime(label.createdAt)} />
                      <Row label="Ship Date" value={fmtShipStationDate(label.shipDate)} />
                      <Row label="Carrier" value={carrierLabel(label.carrierName, label.carrierCode)} />
                      <Row label="Carrier ID" value={label.carrierId} mono />
                      <Row label="Package" value={label.packageCode} />
                      <Row label="Packages" value={label.packages} />
                      <Row label="Shipment" value={label.shipmentId} mono />
                      <Row label="Shipped By" value={label.shippedBy} />
                      <Row label="Shipment Cost" value={label.shipmentCost !== undefined ? money(label.shipmentCost, currency) : undefined} />
                      <Row
                        label="Insurance"
                        value={label.insuranceCost !== undefined ? money(label.insuranceCost, currency) : undefined}
                      />
                    </div>
                  </div>
                ))}

                {/* Shipments + parcels */}
                {(entry.shipments || []).map((shipment: any, si: number) => {
                  const raw = shipment.shipment || {}
                  const advanced = raw.advanced_options || {}
                  const enabledAdvanced = Object.entries(advanced).filter(
                    ([key, value]) => value === true && key !== "event_notification"
                  )
                  return (
                    <div key={si} className="flex flex-col gap-2">
                      <div className="flex flex-row justify-between gap-3 flex-wrap">
                        <div className="flex flex-row items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {shipment.carrierName} {titleFromCode(shipment.serviceCode)}
                          </span>
                          <BadgeV2 color={shipment.shipmentStatus === "label_purchased" ? "green" : "gray"}>
                            {prettifyKey(shipment.shipmentStatus)}
                          </BadgeV2>
                          {!!raw.is_return && <BadgeV2 color="orange">Return</BadgeV2>}
                          {!!raw.is_gift && <BadgeV2 color="purple">Gift</BadgeV2>}
                          {advanced.address_residential_indicator === "yes" && <BadgeV2 color="gray">Residential</BadgeV2>}
                          {!!advanced.saturday_delivery && <BadgeV2 color="orange">Saturday</BadgeV2>}
                          {!!advanced.fragile && <BadgeV2 color="orange">Fragile</BadgeV2>}
                          {!!advanced.contains_alcohol && <BadgeV2 color="red">Alcohol</BadgeV2>}
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{shipment.shipmentId}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                        <Row label="Ship Date" value={fmtShipStationDate(shipment.shipDate)} />
                        <Row label="Ship By" value={fmtShipStationDate(raw.ship_by_date)} />
                        <Row label="Deliver By" value={fmtShipStationDate(raw.deliver_by_date)} />
                        <Row label="Ship Datetime" value={fmtDateTime(raw.ship_datetime)} />
                        <Row label="Created" value={fmtDateTime(shipment.createdAt)} />
                        <Row label="Modified" value={fmtDateTime(shipment.modifiedAt)} />
                        <Row label="Packages" value={shipment.packageCount} />
                        <Row
                          label="Weight"
                          value={raw.total_weight?.value ? `${raw.total_weight.value} ${unitLabel(raw.total_weight.unit)}` : undefined}
                        />
                        <Row label="Confirmation" value={raw.confirmation && raw.confirmation !== "none" ? prettifyKey(raw.confirmation) : undefined} />
                        <Row label="Insurance" value={raw.insurance_provider && raw.insurance_provider !== "none" ? prettifyKey(raw.insurance_provider) : undefined} />
                        <Row label="Zone" value={raw.zone} />
                        <Row label="Store" value={raw.store_id} mono />
                        <Row label="Warehouse" value={shipment.warehouseId} />
                        <Row label="Shipped By" value={shipment.shippedBy} />
                      <Row label="Amount Paid" value={moneyWithCode(raw.amount_paid)} />
                      <Row label="Shipping Paid" value={moneyWithCode(raw.shipping_paid)} />
                      <Row label="Tax Paid" value={moneyWithCode(raw.tax_paid)} />
                      <Row label="Shipment Number" value={raw.shipment_number} />
                      <Row label="External Shipment" value={raw.external_shipment_id} />
                      <Row label="Hold Until" value={fmtShipStationDate(raw.hold_until_date)} />
                      <Row
                        label="Requested Service"
                        value={raw.requested_shipment_service ? titleFromCode(raw.requested_shipment_service) : undefined}
                      />
                      <Row label="Custom Field 1" value={shipment.customFields?.custom_field1} />
                      <Row label="Custom Field 2" value={shipment.customFields?.custom_field2} />
                      <Row label="Custom Field 3" value={shipment.customFields?.custom_field3} />
                        <Row label="Batch IDs" value={raw.batch_ids?.length ? raw.batch_ids.join(", ") : undefined} />
                        <Row label="Tags" value={shipment.tags?.length ? shipment.tags.join(", ") : undefined} />
                        <Row label="Assigned User" value={raw.assigned_user} />
                      </div>

                      {/* Parcel details */}
                      {!!raw.packages?.length && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {raw.packages.map((parcel: any, pi: number) => (
                            <div key={pi} className="bg-gray-50 rounded-md p-2 text-xs flex flex-col gap-0.5">
                              <span className="font-medium text-gray-600">{parcel.package_name || parcel.package_code}</span>
                              {parcel.weight?.value !== undefined && (
                                <span>
                                  {parcel.weight.value} {unitLabel(parcel.weight.unit)}
                                </span>
                              )}
                              {parcel.dimensions && (
                                <span>
                                  {parcel.dimensions.length} × {parcel.dimensions.width} × {parcel.dimensions.height}{" "}
                                  {unitLabel(parcel.dimensions.unit)}
                                </span>
                              )}
                              {!!Number(parcel.insured_value?.amount) && (
                                <span>
                                  insured {parcel.insured_value.amount} {String(parcel.insured_value.currency).toUpperCase()}
                                </span>
                              )}
                              {parcel.content_description && <span>{parcel.content_description}</span>}
                              {[
                                parcel.label_messages?.reference1,
                                parcel.label_messages?.reference2,
                                parcel.label_messages?.reference3,
                              ]
                                .filter(Boolean)
                                .map((ref: string, ri: number) => (
                                  <span key={ri} className="text-gray-400">
                                    ref: {ref}
                                  </span>
                                ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {(raw.ship_from || raw.ship_to) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <ShipStationAddress title="Ship From" address={raw.ship_from} />
                          <ShipStationAddress title="Ship To" address={raw.ship_to} />
                        </div>
                      )}

                      {raw.return_to && !sameAddress(raw.return_to, raw.ship_from) && (
                        <ShipStationAddress title="Return To" address={raw.return_to} />
                      )}

                      {!!enabledAdvanced.length && (
                        <div className="text-xs text-gray-500">
                          <span className="text-gray-400">Options: </span>
                          {enabledAdvanced.map(([key, value]) => prettifyKey(key)).join(", ")}
                        </div>
                      )}

                      {!!raw.internal_notes && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
                          <span className="font-medium">Internal notes: </span>
                          {raw.internal_notes}
                        </div>
                      )}
                      {!!raw.notes_from_buyer && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
                          <span className="font-medium">Buyer notes: </span>
                          {raw.notes_from_buyer}
                        </div>
                      )}
                      {!!raw.notes_for_gift && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
                          <span className="font-medium">Gift note: </span>
                          {raw.notes_for_gift}
                        </div>
                      )}
                      {!!raw.notes_to_buyer && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-md p-2">
                          <span className="font-medium">Notes to buyer: </span>
                          {raw.notes_to_buyer}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Live carrier tracking, attached per tracking number by the endpoint */}
                {!!(entry.tracking || []).length && (
                  <div className="flex flex-col gap-2">
                    {(entry.tracking || []).map((leg: any, li: number) => (
                      <TrackingStatus
                        key={li}
                        leg={leg}
                        fallbackUrl={findTrackingUrl(fulfillments, leg.trackingNumber || entry.trackingNumber)}
                      />
                    ))}
                  </div>
                )}

                {/* Anything the tracking endpoint adds later shows up here automatically */}
                <ExtraFields
                  object={entry}
                  exclude={[
                    "trackingNumber",
                    "labels",
                    "shipments",
                    "tracking",
                    "fromOrder",
                    "errors",
                    "error",
                  ]}
                />
                {entry.error && <Notice tone="red" title="Tracking lookup failed">{entry.error}</Notice>}
                {!!entry.errors?.length && (
                  <Notice tone="orange" title="Tracking reported problems">{entry.errors.join(", ")}</Notice>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Label spend breakdown + the tracking numbers the payload resolved */}
        {!!(tracking.length || detail.trackingNumbers?.length) && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
            <Row label="Labels" value={labelCount} />
            {labelSpend > 0 && <Row label="Shipment Cost" value={money(shipmentSpend, currency)} />}
            {labelSpend > 0 && <Row label="Insurance" value={money(insuranceSpend, currency)} />}
            {labelSpend > 0 && <Row label="Total Spend" value={money(labelSpend, currency)} mono />}
            {!!detail.trackingNumbers?.length && (
              <Row label="Tracking Numbers" value={detail.trackingNumbers.join(", ")} mono />
            )}
          </div>
        )}
      </Section>

      {/* ================= Financials ================= */}
      <Section icon={BsClipboard} title="Financials" badges={[prettifyKey(summary.displayFinancialStatus)]}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
          <Row label="Financial Status" value={prettifyKey(summary.displayFinancialStatus)} />
          <Row label="Fully Paid" value={flagText(summary.fullyPaid)} />
          <Row label="Fully Paid (order)" value={flagText(order.fullyPaid)} />
          {/* Shopify reports both fullyPaid and unpaid as true on some orders (this
              one included) — surfaced verbatim rather than silently reconciled. */}
          <Row label="Unpaid" value={flagText(order.unpaid)} />
          <Row label="Refundable" value={flagText(order.refundable)} />
          <Row label="Currency" value={summary.currencyCode || order.currencyCode} />
          {summary.presentmentCurrencyCode !== (summary.currencyCode || order.currencyCode) && (
            <Row label="Presentment" value={summary.presentmentCurrencyCode} />
          )}
          <Row label="Discount Code" value={order.discountCode} />
          <Row label="Payment Gateways" value={order.paymentGatewayNames?.length ? order.paymentGatewayNames.join(", ") : "none"} />
          <Row label="Transactions" value={summary.transactionCount ?? order.transactions?.length ?? 0} />
          <Row label="Refunds" value={summary.refundCount ?? order.refunds?.length ?? 0} />
          <Row label="Tax Exempt" value={flagText(order.taxExempt)} />
          <Row label="Taxes Included" value={flagText(order.taxesIncluded)} />
        </div>
        {!!order.fullyPaid && !!order.unpaid && (
          <div className="text-xs text-gray-400 mt-2">
            Shopify reports fullyPaid and unpaid as true on the same order; the PAID badge follows displayFinancialStatus,
            which is what the admin shows.
          </div>
        )}

        {!!(order.transactions || []).length && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
            {(order.transactions || []).map((t: any, i: number) => (
              <div key={i} className="flex flex-row justify-between gap-3 text-xs">
                <span className="text-gray-600">{prettifyKey(t.kind)}</span>
                <span>
                  {t.status} · {t.gateway}
                </span>
              </div>
            ))}
          </div>
        )}
        {!!(order.refunds || []).length && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-1">
            {(order.refunds || []).map((r: any, i: number) => (
              <div key={i} className="flex flex-row justify-between gap-3 text-xs">
                <span className="text-gray-600">Refund {idTail(r.id)}</span>
                <span>{r.note || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ================= Order timeline ================= */}
      <Section icon={BsBoxSeam} title="Order Timeline" badges={[`${orderEvents.length} events`]}>
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto scrollbar pr-1">
          {orderEvents.map((event: any, i: number) => (
            <div key={i} className="flex flex-row gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className={`h-2 w-2 rounded-full ${event.criticalAlert ? "bg-red-500" : "bg-gray-300"}`} />
                {i < orderEvents.length - 1 && <div className="w-px grow bg-gray-200" />}
              </div>
              <div className="flex flex-col gap-0.5 pb-1 min-w-0">
                <div className="flex flex-row items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{prettifyKey(event.action)}</span>
                  {event.appTitle && <BadgeV2 color="gray">{event.appTitle}</BadgeV2>}
                  {event.attributeToUser && <BadgeV2 color="blue">By user</BadgeV2>}
                  {event.attributeToApp && <BadgeV2 color="purple">By app</BadgeV2>}
                  {event.criticalAlert && <BadgeV2 color="red">Critical</BadgeV2>}
                </div>
                <div className="text-xs text-gray-600">
                  <HtmlText text={event.message} />
                </div>
                <div className="text-xs text-gray-400">{fmtDateTime(event.createdAt)}</div>
              </div>
            </div>
          ))}
          {!orderEvents.length && <div className="text-sm text-gray-500">No events.</div>}
        </div>
      </Section>

      {/* ================= Draft order ================= */}
      {draftTimeline && (
        <Section
          icon={BsBoxSeam}
          title="Draft Order"
          badges={[draftTimeline.draft?.name, draftTimeline.draft?.status ? prettifyKey(draftTimeline.draft.status) : ""].filter(
            Boolean
          ) as string[]}
        >
          {draftTimeline.fromDraft ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                <Row label="Draft" value={draftTimeline.draft?.name} />
                <Row label="Draft ID" value={idTail(draftTimeline.draft?.id)} mono />
                <Row label="Status" value={prettifyKey(draftTimeline.draft?.status)} />
                <Row label="Created" value={fmtDateTime(draftTimeline.draft?.createdAt)} />
                <Row label="Completed" value={fmtDateTime(draftTimeline.draft?.completedAt)} />
                <Row label="Updated" value={fmtDateTime(draftTimeline.draft?.updatedAt)} />
                <Row label="Invoice Sent" value={fmtDateTime(draftTimeline.draft?.invoiceSentAt)} />
                <Row label="Draft → Paid" value={formatMinutes(draftTimeline.timing?.draftToPaidMinutes)} />
                <Row label="Draft → Invoice" value={formatMinutes(draftTimeline.timing?.draftToInvoiceMinutes)} />
                <Row label="Invoice → Paid" value={formatMinutes(draftTimeline.timing?.invoiceToPaidMinutes)} />                <Row label="Paid At Creation" value={flagText(draftTimeline.timing?.completedAtMatchesOrderCreation)} />
                <Row label="Order" value={draftTimeline.draft?.orderName} />
                <Row label="Order Created" value={fmtDateTime(draftTimeline.order?.createdAt)} />
                <Row label="Order Source" value={draftTimeline.order?.sourceName ? prettifyKey(draftTimeline.order.sourceName) : undefined} />
                <Row label="Draft Customer" value={draftTimeline.order?.customerName} />
              </div>
              {!!draftTimeline.draft?.note && <div className="text-xs text-gray-600">{draftTimeline.draft.note}</div>}
              {!!(draftTimeline.draft?.tags || []).length && (
                <div className="flex flex-row gap-2 flex-wrap">
                  {draftTimeline.draft.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs text-gray-500 bg-gray-50 ring-1 ring-gray-200 rounded-md px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {!!draftTimeline.draft?.adminUrl && (
                <a href={draftTimeline.draft.adminUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-700 hover:underline">
                  Open draft order ↗
                </a>
              )}
              <div className="flex flex-col gap-3 pt-1">
                {(draftTimeline.timeline || []).map((event: any, i: number) => (
                  <div key={i} className="flex flex-row gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="h-2 w-2 rounded-full bg-gray-300" />
                      {i < (draftTimeline.timeline.length || 0) - 1 && <div className="w-px grow bg-gray-200" />}
                    </div>
                    <div className="flex flex-col gap-0.5 pb-1 min-w-0">
                      <div className="flex flex-row items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{prettifyKey(event.action)}</span>
                        {event.appTitle && <BadgeV2 color="gray">{event.appTitle}</BadgeV2>}
                        {event.byUser && <BadgeV2 color="blue">By user</BadgeV2>}
                        {event.byApp && <BadgeV2 color="purple">By app</BadgeV2>}
                      </div>
                      <div className="text-xs text-gray-600">
                        <HtmlText text={event.message} />
                      </div>
                      <div className="text-xs text-gray-400">{fmtDateTime(event.at)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lookup diagnostics — how the draft was found */}
              {draftTimeline.lookup && (
                <div className="pt-1 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                  <Row label="Search Term" value={draftTimeline.lookup.orderSearchTerm} mono />
                  <Row label="Matched In" value={prettifyKey(draftTimeline.lookup.matchedIn)} />
                  <Row label="Drafts Scanned" value={draftTimeline.lookup.draftsScanned} />
                  <Row label="API Requests" value={draftTimeline.lookup.apiRequests} />
                  <Row label="Stopped Early" value={flagText(draftTimeline.lookup.stoppedEarly)} />
                  <Row label="Hit Page Cap" value={flagText(draftTimeline.lookup.deepSearchHitPageCap)} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">This order did not come from a draft order.</div>
          )}
        </Section>
      )}

      {/* ================= Order metadata ================= */}
      <Section icon={BsClipboard} title="Order Metadata">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
          <Row label="Order ID" value={order.legacyResourceId || idTail(order.id)} mono />
          <Row label="Number" value={order.number} />
          <Row label="Processed" value={fmtDateTime(summary.processedAt || order.processedAt)} />
          <Row label="Updated" value={fmtDateTime(summary.updatedAt || order.updatedAt)} />
          <Row label="Closed" value={flagText(order.closed)} />
          <Row label="Closed At" value={fmtDateTime(summary.closedAt || order.closedAt)} />
          <Row label="Cancelled" value={flagText(isCancelled)} />
          <Row label="Cancel Reason" value={order.cancelReason ? prettifyKey(order.cancelReason) : undefined} />
          <Row label="Confirmed" value={flagText(order.confirmed)} />
          <Row label="Edited" value={flagText(order.edited)} />
          <Row label="Test Order" value={flagText(order.test)} />
          <Row label="Return Status" value={prettifyKey(order.returnStatus)} />
          <Row label="Source" value={order.sourceName ? prettifyKey(order.sourceName) : undefined} />
          <Row label="Source Identifier" value={order.sourceIdentifier} />
          <Row label="PO Number" value={order.poNumber} />
          <Row label="Customer Locale" value={order.customerLocale} />
          <Row label="Client IP" value={order.clientIp} mono />
          <Row label="Note" value={order.note || summary.note || undefined} />
          <Row label="Subtotal Qty" value={summary.subtotalLineItemsQuantity ?? order.subtotalLineItemsQuantity} />
          <Row label="Current Qty" value={order.currentSubtotalLineItemsQuantity} />
          <Row label="Total Weight" value={order.totalWeight ? `${order.totalWeight} ${inferShopWeightUnit(order.totalWeight, itemWeightGrams)}` : undefined} />
          <Row label="Current Weight" value={order.currentTotalWeight ? `${order.currentTotalWeight} ${inferShopWeightUnit(order.currentTotalWeight, itemWeightGrams)}` : undefined} />
          <Row label="Events" value={summary.eventCount ?? orderEvents.length} />
          <Row label="Metafields" value={summary.metafieldCount ?? order.metafields?.nodes?.length ?? 0} />
          <Row
            label="Custom Attributes"
            value={summary.customAttributeCount ?? order.customAttributes?.length ?? 0}
          />
        </div>
        {!!(order.customAttributes || []).length && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
            {(order.customAttributes || []).map((attr: any, i: number) => (
              <div key={i} className="flex flex-row justify-between gap-3 text-xs">
                <span className="text-gray-500">{attr.key}</span>
                <span>{attr.value}</span>
              </div>
            ))}
          </div>
        )}
        {!!(order.metafields?.nodes || []).length && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
            {(order.metafields?.nodes || []).map((mf: any, i: number) => (
              <div key={i} className="flex flex-row justify-between gap-3 text-xs">
                <span className="text-gray-500 font-mono">{mf.namespace}.{mf.key}</span>
                <span className="text-right">{String(mf.value ?? "—")}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ================= Raw payload ================= */}
      <details className="rounded-xl ring-1 ring-gray-200 overflow-hidden">
        <summary className="cursor-pointer select-none bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-semibold flex flex-row justify-between items-center gap-3 flex-wrap">
          <span>Raw Payload</span>
          <span className="text-xs font-normal text-gray-500">
            {shopifyLookup.apiRequests ?? 0} Shopify request{shopifyLookup.apiRequests === 1 ? "" : "s"} ·{" "}
            {shopifyLookup.searchTerm}
          </span>
        </summary>
        <div className="p-3 flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center gap-3 flex-wrap">
            <Button size="xs" clickAction={downloadJson}>
              Download JSON
            </Button>
            <Button size="xs" clickAction={copyJson}>
              Copy JSON
            </Button>
          </div>
          {copyFailed && (
            <div className="text-xs text-orange-700 bg-orange-50 ring-1 ring-orange-200 rounded-md p-2">
              Your browser blocked the clipboard for this embedded page. Use <strong>Download JSON</strong>, or
              click inside the box below and press Cmd/Ctrl + C.
            </div>
          )}
          {/* A read-only textarea rather than a <pre>, so the payload is always
              selectable by hand and the copy fallback has something to select. */}
          <textarea
            ref={jsonRef}
            readOnly
            spellCheck={false}
            value={json}
            onFocus={(e) => e.target.select()}
            className="text-xs font-mono w-full h-64 resize-y overflow-auto bg-gray-50 rounded-md p-3 ring-1 ring-gray-200"
          />
        </div>
      </details>
    </div>
  )
}

/* ======================= building blocks ======================= */

function Section(props: {
  icon?: React.ElementType
  title: string
  badges?: string[]
  children: React.ReactNode
}) {
  const Icon = props.icon
  return (
    <div className="rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-row justify-between items-center gap-3 flex-wrap">
        <div className="flex flex-row items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-gray-500" />}
          <span className="text-sm font-semibold">{props.title}</span>
        </div>
        {!!props.badges?.filter(Boolean).length && (
          <div className="flex flex-row gap-2 flex-wrap">
            {props.badges.filter(Boolean).map((badge, i) => (
              <span key={i} className="text-xs text-gray-500">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">{props.children}</div>
    </div>
  )
}

function Stat(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-3 flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{props.label}</span>
      <span className="text-sm font-semibold truncate">{props.value}</span>
      {props.sub && <span className="text-xs text-gray-400 truncate">{props.sub}</span>}
    </div>
  )
}

/** Label/value pair. Blank values render nothing at all. */
function Row(props: { label: string; value: any; mono?: boolean; hide?: boolean }) {
  if (props.hide) return null
  const value = props.value === null || props.value === undefined || props.value === "" ? "—" : props.value
  if (value === "—") return null
  return (
    <div className="flex flex-row justify-between gap-3">
      <span className="text-gray-500">{props.label}</span>
      <span className={`text-right ${props.mono ? "font-mono" : ""}`}>{String(value)}</span>
    </div>
  )
}

function TotalRow(props: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-row justify-between gap-3 text-sm">
      <span className={props.strong ? "font-semibold" : "text-gray-500"}>{props.label}</span>
      <span className={props.strong ? "font-semibold" : ""}>{props.value}</span>
    </div>
  )
}

function Notice(props: { tone: "red" | "orange" | "gray"; title: string; children: React.ReactNode }) {
  const tone =
    props.tone === "red"
      ? "ring-red-200 bg-red-50 text-red-700"
      : props.tone === "orange"
      ? "ring-orange-200 bg-orange-50 text-orange-700"
      : "ring-gray-200 bg-gray-50 text-gray-700"
  return (
    <div className={`rounded-xl ring-1 p-4 flex flex-col gap-1 ${tone}`}>
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="text-xs">{props.children}</div>
    </div>
  )
}

function AddressBlock(props: { address: any }) {
  const a = props.address
  if (!a) return <div className="text-sm text-gray-500">No address on file.</div>
  return (
    <div className="text-sm flex flex-col">
      {a.name && <span className="font-medium">{a.name}</span>}
      {a.company && <span className="text-gray-600">{a.company}</span>}
      {a.address1 && <span className="text-gray-600">{a.address1}</span>}
      {a.address2 && <span className="text-gray-600">{a.address2}</span>}
      <span className="text-gray-600">{[a.city, a.provinceCode || a.province, a.zip].filter(Boolean).join(", ")}</span>
      {a.country && <span className="text-gray-600">{a.country}</span>}
      {a.phone && <span className="text-xs text-gray-500 mt-1">{a.phone}</span>}
    </div>
  )
}

function ShipStationAddress(props: { title: string; address: any }) {
  const a = props.address
  if (!a) return null
  return (
    <div className="bg-gray-50 rounded-md p-3 text-xs flex flex-col gap-0.5">
      <span className="text-gray-500">{props.title}</span>
      {a.name && <span className="font-medium">{a.name}</span>}
      {a.company_name && <span>{a.company_name}</span>}
      {a.address_line1 && (
        <span>
          {a.address_line1}
          {a.address_line2 ? `, ${a.address_line2}` : ""}
          {a.address_line3 ? `, ${a.address_line3}` : ""}
        </span>
      )}
      <span>{[a.city_locality, a.state_province, a.postal_code].filter(Boolean).join(", ")}</span>
      {a.country_code && <span>{a.country_code}</span>}
      {a.phone && <span className="text-gray-500">{a.phone}</span>}
      {a.email && <span className="text-gray-500">{a.email}</span>}
      {a.instructions && <span className="text-gray-500">{a.instructions}</span>}
    </div>
  )
}

/**
 * Renders any keys the endpoint starts returning that this view doesn't know
 * about yet, so new payload fields stay visible without a rebuild — but never as
 * a raw JSON dump, which is unreadable in the modal.
 */
function ExtraFields(props: { object: any; exclude: string[] }) {
  const entries = Object.entries(props.object || {}).filter(
    ([key, value]) => !props.exclude.includes(key) && value !== null && value !== undefined && value !== ""
  )
  if (!entries.length) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs border-t border-gray-100 pt-2">
      {entries.map(([key, value]) => (
        <Row key={key} label={prettifyKey(key)} value={describeValue(value)} />
      ))}
    </div>
  )
}

/** Unknown values get a one-line summary — arrays and objects are not dumped. */
function describeValue(value: any) {
  if (Array.isArray(value)) {
    return value.length === 0 ? "none" : `${value.length} item${value.length === 1 ? "" : "s"}`
  }
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    return keys.length === 0 ? "none" : `${keys.length} field${keys.length === 1 ? "" : "s"}`
  }
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

/**
 * Live carrier tracking for one tracking number, as attached by the endpoint.
 */
function TrackingStatus(props: { leg: any; fallbackUrl?: string }) {
  const leg = props.leg || {}
  const raw = leg.raw || {}
  const events: any[] = leg.events || []
  const url = raw.tracking_url || props.fallbackUrl
  const carrierCode = raw.carrier_code ? String(raw.carrier_code).toUpperCase() : ""

  return (
    <div className="rounded-md ring-1 ring-gray-200 bg-white p-3 flex flex-col gap-2">
      <div className="flex flex-row justify-between gap-3 flex-wrap items-start">
        <div className="flex flex-row items-center gap-2 flex-wrap">
          <BsTruck className="h-3.5 w-3.5 text-gray-400" />
          <BadgeV2 color={trackingTone(leg.statusCode, leg.statusDescription, leg.exceptionDescription)}>
            {leg.statusDescription || leg.statusCode || "Unknown"}
          </BadgeV2>
          {leg.carrierStatusDescription && (
            <span className="text-xs text-gray-600">{leg.carrierStatusDescription}</span>
          )}
          {leg.eventCount !== undefined && (
            <BadgeV2 color="gray">
              {leg.eventCount} event{leg.eventCount === 1 ? "" : "s"}
            </BadgeV2>
          )}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-700 hover:underline whitespace-nowrap"
          >
            Track{carrierCode ? ` with ${carrierCode}` : ""} ↗
          </a>
        )}
      </div>

      {raw.status_detail_description && (
        <div className="text-xs text-gray-500">{raw.status_detail_description}</div>
      )}
      {leg.exceptionDescription && <div className="text-xs text-red-600">{leg.exceptionDescription}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
        <Row label="Estimated Delivery" value={fmtDate(leg.estimatedDeliveryDate)} />
        <Row label="Actual Delivery" value={fmtDate(leg.actualDeliveryDate)} />
        <Row label="Shipped" value={fmtDate(leg.shippedDate)} />
        <Row label="Status Detail" value={raw.status_detail_code} mono />
        <Row label="Carrier Detail" value={raw.carrier_detail_code} mono />
        <Row label="Proof of Delivery" value={raw.proof_of_delivery_url ? "available" : undefined} />
      </div>

      {/* The latest scan gets called out; the full list only when there's more than one */}
      {leg.lastEvent?.description && (
        <div className="text-xs text-gray-600">
          <span className="text-gray-400">Latest scan: </span>
          {leg.lastEvent.description}
          <span className="text-gray-400"> · {fmtDateTime(leg.lastEvent.occurredAt)}</span>
        </div>
      )}

      {events.length > 1 && (
        <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
          {events.map((event: any, i: number) => (
            <div key={i} className="flex flex-row gap-3 text-xs">
              <div className="flex flex-col items-center pt-1">
                <div className="h-2 w-2 rounded-full bg-gray-300" />
                {i < events.length - 1 && <div className="w-px grow bg-gray-200" />}
              </div>
              <div className="flex flex-col min-w-0 pb-1">
                <span className="text-gray-700">{event.description}</span>
                <span className="text-gray-400">
                  {[event.city, event.stateProvince, event.postalCode, event.countryCode].filter(Boolean).join(", ")}
                  {event.signer ? ` · signed by ${event.signer}` : ""}
                </span>
                <span className="text-gray-400">
                  {fmtDateTime(event.occurredAt)}
                  {event.carrierOccurredAt ? ` · carrier time ${fmtNaive(event.carrierOccurredAt)}` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Shopify event messages embed anchors; render just those as real links. */
function HtmlText(props: { text: string | null | undefined }) {
  if (!props.text) return null
  const parts: React.ReactNode[] = []
  const re = /<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = re.exec(props.text)) !== null) {
    if (match.index > last) parts.push(props.text.slice(last, match.index))
    parts.push(
      <a key={key++} href={match[1]} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
        {stripTags(match[2])}
      </a>
    )
    last = match.index + match[0].length
  }
  if (last < props.text.length) parts.push(props.text.slice(last))
  return <>{parts.map((part) => (typeof part === "string" ? stripTags(part) : part))}</>
}

/* ======================= helpers ======================= */

function stripTags(text: string) {
  return text.replace(/<[^>]*>/g, "")
}

/**
 * Line items carry their weight under variant.inventoryItem.measurement; a
 * couple of Shopify responses hoist it to variant.measurement, so check both.
 */
function itemWeight(item: any) {
  const weight = item?.variant?.inventoryItem?.measurement?.weight ?? item?.variant?.measurement?.weight
  if (!weight || weight.value === undefined || weight.value === null) return null
  return weight as { value: number; unit?: string }
}

const UNIT_LABELS: Record<string, string> = {
  pounds: "lb",
  pound: "lb",
  lbs: "lb",
  ounces: "oz",
  ounce: "oz",
  oz: "oz",
  grams: "g",
  gram: "g",
  kilograms: "kg",
  kilogram: "kg",
  inches: "in",
  inch: "in",
  centimeters: "cm",
  centimeter: "cm",
  millimeters: "mm",
  millimeter: "mm",
}

function unitLabel(unit: any) {
  if (!unit) return ""
  return UNIT_LABELS[String(unit).toLowerCase()] || String(unit)
}

/** Convert a line item weight to pounds so item weights can be summed. */
function toPounds(value: number, unit: string | undefined) {
  switch (unitLabel(unit)) {
    case "lb":
      return value
    case "oz":
      return value / 16
    case "g":
      return value / 453.59237
    case "kg":
      return value * 2.2046226218
    default:
      return value
  }
}

/** Same conversion to grams, used to infer the order-level weight unit. */
function toGrams(value: number, unit: string | undefined) {
  switch (unitLabel(unit)) {
    case "lb":
      return value * 453.59237
    case "oz":
      return value * 28.349523125
    case "kg":
      return value * 1000
    case "g":
      return value
    default:
      return value
  }
}

/**
 * `summary.totalWeight` is a bare number in the shop's weight unit. If it lines
 * up with the summed item weights converted to grams (which it does for this
 * shop — 6 x 0.25 lb reads as 681), label it grams; otherwise leave it unitless
 * rather than guessing.
 */
function inferShopWeightUnit(totalWeight: any, itemWeightGrams: number) {
  const total = Number(totalWeight)
  if (!total || !itemWeightGrams) return ""
  const tolerance = Math.max(2, itemWeightGrams * 0.02)
  return Math.abs(total - itemWeightGrams) <= tolerance ? "g" : "shop units"
}

/** ShipStation money objects are {amount, currency} with a lowercase code. */
function moneyWithCode(money: any) {
  if (!money || money.amount === undefined || money.amount === null) return undefined
  const code = money.currency ? ` ${String(money.currency).toUpperCase()}` : ""
  return `${money.amount}${code}`
}

function pickMoney(set: any) {
  const amount = set?.shopMoney?.amount
  return amount === undefined || amount === null ? null : Number(amount)
}

function money(value: any, currency?: string | null) {
  if (value === null || value === undefined || value === "") return "—"
  const amount = Number(value)
  if (isNaN(amount)) return "—"
  const symbol = !currency || currency === "USD" ? "$" : `${currency} `
  return `${symbol}${amount.toFixed(2)}`
}

function fmtDate(value: any) {
  const d = asDate(value)
  if (!d) return "—"
  return d.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" })
}

/**
 * ShipStation serializes date-only fields (ship_date) at UTC midnight. Running
 * those through the Pacific formatter would show the previous day, so exact
 * midnights keep their UTC calendar date while real timestamps get converted.
 */
function fmtShipStationDate(value: any) {
  const d = asDate(value)
  if (!d) return "—"
  const isDateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0
  return d.toLocaleDateString("en-US", {
    timeZone: isDateOnly ? "UTC" : "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function fmtTime(value: any) {
  const d = asDate(value)
  if (!d) return ""
  return d.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })
}

function fmtDateTime(value: any) {
  const d = asDate(value)
  if (!d) return "—"
  return `${fmtDate(d)}, ${fmtTime(d)}`
}

function asDate(value: any) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function formatMinutes(minutes: any) {
  if (minutes === null || minutes === undefined) return "—"
  const m = Number(minutes)
  if (isNaN(m)) return "—"
  if (m < 1) return `${Math.round(m * 60)} seconds`
  if (m < 60) return `${m.toFixed(1)} minutes`
  return `${(m / 60).toFixed(1)} hours`
}

function flagText(value: any) {
  if (value === null || value === undefined) return undefined
  return value ? "Yes" : "No"
}

/** Locate a carrier tracking URL already present on the order's fulfillments. */
function findTrackingUrl(fulfillments: any[], number: string | undefined) {
  if (!number) return undefined
  for (const fulfillment of fulfillments || []) {
    for (const info of fulfillment?.trackingInfo || []) {
      if (info.number === number) return info.url
    }
  }
  return undefined
}

/**
 * Colour a live tracking status. Carrier status codes vary (UPS via ShipStation
 * uses NY/IT/D/EX), so fall back to the human description. Anything unreadable
 * stays neutral rather than pretending to be good news.
 */
function trackingTone(statusCode: any, statusDescription: any, exception: any) {
  const code = String(statusCode || "").toUpperCase()
  const text = String(statusDescription || "").toLowerCase()
  if (exception || code === "EX" || /exception|failed|returned/.test(text)) return "red"
  if (code === "D" || /delivered/.test(text)) return "green"
  if (code === "IT" || /transit|accepted|origin scan|arrived|departed|out for delivery|picked up/.test(text)) return "blue"
  return "gray"
}

/**
 * Carrier timestamps arrive without a zone ("2026-09-17T09:52:14"), meaning
 * local time where the scan happened — formatting them as given rather than
 * converting to Pacific, which would shift the clock face.
 */
function fmtNaive(value: any) {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value))
  if (!match) return String(value)
  const [, year, month, day, hourStr, minute] = match
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const hour = Number(hourStr)
  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}, ${hour12}:${minute} ${suffix}`
}

/** 'UPS' + 'ups' reads badly, so drop a code the name already contains. */
function carrierLabel(name: string | undefined, code: string | undefined) {
  if (!name) return code
  if (!code) return name
  return name.toLowerCase().includes(code.toLowerCase()) ? name : `${name} (${code})`
}

/** 'ups_next_day_air' → 'UPS Next Day Air' */
function titleFromCode(code: any) {
  if (!code) return ""
  const carriers = ["ups", "usps", "fedex", "dhl", "ontrac", "purolator"]
  return String(code)
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word: string) =>
      carriers.includes(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

/** 'label_purchased' / 'displayFulfillmentStatus' → 'Label Purchased' / 'Display Fulfillment Status' */
function prettifyKey(key: any) {
  if (key === null || key === undefined || key === "") return "—"
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function idTail(gid: any) {
  if (!gid) return ""
  const parts = String(gid).split("/")
  return parts[parts.length - 1]
}

/** Admin origin, derived from any admin URL the payload happens to include. */
function adminOriginOf(detail: any) {
  const url = detail?.draftTimeline?.draft?.adminUrl
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function firstDefined(values: any[]) {
  return values.find((v) => v !== null && v !== undefined && v !== "")
}

function sameAddress(a: any, b: any) {
  if (!a || !b) return false
  const addr = (x: any) => [x.address1 || x.address_line1, x.city || x.city_locality, x.zip || x.postal_code].join("|")
  return addr(a) === addr(b)
}

/** Resolve the operational sample-order tags into readable, colored badges. */
function orderFlags(tags: string[]) {
  const flags: { label: string; color: string }[] = []
  if (tags.includes("PRIORITY-SAMPLE-ORDER")) flags.push({ label: "Priority", color: "red" })
  if (tags.includes("TRADE-SAMPLE-ORDER")) flags.push({ label: "Trade", color: "yellow" })
  if (tags.includes("Expedited Sample Delivery")) flags.push({ label: "Expedited", color: "sky" })
  if (tags.includes("UPS 2nd Day Air")) flags.push({ label: "UPS 2nd Day Air", color: "blue" })
  if (tags.includes("UPS Next Day Air")) flags.push({ label: "UPS Next Day Air", color: "blue" })
  if (tags.includes("Standard Sample Shipping")) flags.push({ label: "Standard Shipping", color: "gray" })
  if (tags.includes("Sample Order")) flags.push({ label: "Sample Order", color: "gray" })
  return flags
}
