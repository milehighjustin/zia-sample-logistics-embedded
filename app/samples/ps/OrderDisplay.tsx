"use client"

import { useEffect, useState } from "react"
import authenticatedZiaBackendCall from "@/lib/authenticatedZiaBackendCall"
import Button from "@/lib/ui/Button"
import EndlessSpinV2 from "@/lib/ui/EndlessSpinV2"
import OrderDetailView from "./OrderDetailView"

/**
 * Loads a single order from ziaback's `ops/orderDetail` endpoint and hands the
 * payload to OrderDetailView.
 *
 * `orderId` is the order reference the list row carries (`#417545`), so it gets
 * URL-encoded — the backend resolves order names as well as ids.
 *
 * All of the fetching happens here and none of it can throw: a dead server
 * action would otherwise reject inside the effect and unmount the modal.
 */
export default function OrderDisplay(props: { orderId: string }) {
  const [detail, setDetail] = useState<any | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Bumping the nonce re-runs the load (used by the retry button).
  const [nonce, setNonce] = useState<number>(0)

  useEffect(() => {
    const orderId = props.orderId

    setDetail(null)
    setError(null)

    if (!orderId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const run = async () => {
      const resp = await authenticatedZiaBackendCall(
        `ops/orderDetail?orderId=${encodeURIComponent(orderId)}`,
        "GET",
        undefined
      )

      // Cancelled means the modal closed or switched orders mid-flight — a late
      // response must not overwrite the order now on screen.
      if (cancelled) return

      const payload = resp?.data ?? null
      console.log("orderDetail payload", payload)

      if (resp?.error) {
        setError(resp.error)
      } else if (payload?.reason === "order_not_found") {
        setError(`Order ${orderId} was not found in Shopify.`)
      } else if (!payload?.order) {
        setError("Could not load order detail.")
      } else {
        setDetail(payload)
      }

      setLoading(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [props.orderId, nonce])

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 items-center justify-center py-16">
        <div className="text-2xl">Pulling order detail from Shopify &amp; ShipStation</div>
        <EndlessSpinV2 />
      </div>
    )
  }

  if (error) {
    return (
      <div className="ring-1 ring-red-200 bg-red-50 rounded-lg p-5 flex flex-col gap-4">
        <div className="font-bold text-red-700">Could not load this order</div>
        <div className="text-sm text-red-700">{error}</div>
        <div>
          <Button size="lg" clickAction={() => setNonce((n) => n + 1)}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!detail) {
    return <div className="text-sm text-gray-500 py-10 text-center">No order selected.</div>
  }

  return <OrderDetailView detail={detail} />
}
