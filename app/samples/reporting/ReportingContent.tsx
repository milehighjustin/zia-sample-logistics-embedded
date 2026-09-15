'use client';

import PageStandardSideNav from "@/lib/ui/PageStandardSideNav";
import { useRef, useState } from "react";
import ShopifyOrdersByDate from "./ShopifyOrdersByDate";
import ShipstationOrdersByDate from "./ShipstationOrdersByDate";
import OrderShippingReport from "./OrderShippingReport";
import CompedShippingReport from "./CompedShippingReport";

export default function ReportingContent(props: { carriers: any[] }) {
    const [loading, setLoading] = useState<boolean>(false)
    const [alert, setAlert] = useState<{type: string, text: string} | undefined>(undefined)
    const [nav, setNav] = useState<any>([
        { id: 'shopifyOrdersByDate', name: 'All Orders By Date' },
        { id: 'expeditedOrdersByDate', name: 'Expedited Delivery Orders By Date' },
        { id: 'standardOrdersByDate', name: 'Standard Delivery Orders By Date' },
        { id: 'shipstationShipmentsByDate', name: 'All Shipments By Date' },
        { id: 'expeditedShipmentsByDate', name: 'Expedited Delivery Shipments By Date' },
        { id: 'standardShipmentsByDate', name: 'Standard Delivery Shipments By Date' },
        { id: 'intlShipment', name: 'International Shipments By Date' },
        { id: 'orderShippingReport', name: 'Order Shipping Report' },
        { id: 'expeditedOrderShippingReport', name: 'Expedited Order Shipping Report' },
        { id: 'standardOrderShippingReport', name: 'Standard Order Shipping Report' },
        { id: 'compedShipmentsByDate', name: 'Comped Shipments Report' },
        { id: 'shipmentsByUser', name: 'Shipments By User' }
    ])


    const switchNav = (item: any) => {
        setNav((prevNav: any) => prevNav.map((navItem: any) => ({
            ...navItem,
            current: navItem.id === item.id
        })));
    }
  
  return (
    <PageStandardSideNav ringSide={true} nav={nav} clickAction={switchNav}>
      {nav.find((item:any) => item.current)?.id === 'shopifyOrdersByDate' && <ShopifyOrdersByDate tag="Sample%20Order" />}
      {nav.find((item:any) => item.current)?.id === 'expeditedOrdersByDate' && <ShopifyOrdersByDate tag="Expedited%20Sample%20Delivery" />}
      {nav.find((item:any) => item.current)?.id === 'standardOrdersByDate' && <ShopifyOrdersByDate tag="Standard%20Sample%20Delivery" />}
      {nav.find((item:any) => item.current)?.id === 'shipstationShipmentsByDate' && <ShipstationOrdersByDate carriers={props.carriers} />}
      {nav.find((item:any) => item.current)?.id === 'expeditedShipmentsByDate' && <ShipstationOrdersByDate carriers={props.carriers} serviceCodes="ups_2nd_day_air,ups_next_day_air" />}
      {nav.find((item:any) => item.current)?.id === 'standardShipmentsByDate' && <ShipstationOrdersByDate carriers={props.carriers} serviceCodes="ups_ground,fedex_home_delivery" />}
      {nav.find((item:any) => item.current)?.id === 'intlShipment' && <ShipstationOrdersByDate carriers={props.carriers} serviceCodes="ups_worldwide_saver,ups_standard_international,fedex_international_connect_plus" />}
      {nav.find((item:any) => item.current)?.id === 'orderShippingReport' && <OrderShippingReport tag="Sample%20Order" />}
      {nav.find((item:any) => item.current)?.id === 'expeditedOrderShippingReport' && <OrderShippingReport tag="Expedited%20Sample%20Delivery" />}
      {nav.find((item:any) => item.current)?.id === 'standardOrderShippingReport' && <OrderShippingReport tag="Standard%20Sample%20Delivery" />}
      {nav.find((item:any) => item.current)?.id === 'compedShipmentsByDate' && <CompedShippingReport tag={"Sample%20Order"} />}
    </PageStandardSideNav>
  );
}