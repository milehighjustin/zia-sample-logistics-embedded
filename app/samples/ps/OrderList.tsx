'use client';

import BadgeV2 from "@/lib/ui/BadgeV2";
import ListContainer from "@/lib/ui/ListContainer";
import MasterList from "@/lib/ui/MasterList";
import PageStandardList from "@/lib/ui/PageStandardList";
import { useEffect, useRef, useState } from "react";
import { BsFillBoxFill, BsFillTagFill } from "react-icons/bs";
import ziaBackendCall from "@/lib/ziaBackendCall";
import TopBarContainer from "@/lib/ui/TopBarContainer";
import TopBarV2 from "@/lib/ui/TopBarV2";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import EndlessSpinV2 from "@/lib/ui/EndlessSpinV2";
import ShippingDisplay from "./ShippingDisplay";
import PrintDisplay from "./PrintDisplay";
import Button from "@/lib/ui/Button";

export default function OrderList(props: { tag: string, printers: any[], settings: any }) {
  const [orders, setOrders] = useState<any[]>([])
  const [displayList, setDisplayList] = useState<any[]>([])
  const [reverse, setReverse] = useState<boolean>(false)
  const [pageInfo, setPageInfo] = useState<{startCursor: string, endCursor: string, hasNextPage: boolean, hasPreviousPage: boolean}>({startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false})
  const [showShippingModal, setShowShippingModal] = useState<boolean>(false)
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(()=>{
    fetchOrders('start')
  }, [])

  const labelPrinterRef = useRef<HTMLSelectElement>(null)

  const letterPrinterRef = useRef<HTMLSelectElement>(null)

  const fetchOrders = async (direction:string) => {
    const cursor = direction == 'forward' ? pageInfo.endCursor : (direction == 'backward' ? pageInfo.startCursor : '')
    const dir = direction == 'forward' ? 'after' : (direction == 'backward' ? 'before' : '')
    const url = `sampleOps/orders?tag=${encodeURIComponent(props.tag)}&reverse=${reverse}&cursor=${cursor}&dir=${dir}`
    const orders = await ziaBackendCall(url, 'GET', undefined)
    const fmt = (structuredClone(orders.data?.orders || [])).map((order:any)=>{
            order.statuses = <div className="flex flex-row gap-2 flex-wrap">
              {order.tags.includes('TRADE-SAMPLE-ORDER') && <BadgeV2 color="yellow">Trade</BadgeV2>}
              {order.tags.includes('PRIORITY-SAMPLE-ORDER') && <BadgeV2 color="red">Priority</BadgeV2>}
              {order.fulfillmentStatus == 'FULFILLED' && <BadgeV2 color="green">Fulfilled</BadgeV2>}
              {order.fulfillmentStatus == 'UNFULFILLED' && <BadgeV2 color="blue">Unfulfilled</BadgeV2>}
              {order.fulfillmentStatus == 'PARTIALLY_FULFILLED' && <BadgeV2 color="orange">Partially Fulfilled</BadgeV2>}
            </div>
            order.boxDisplay = <div className="flex flex-row gap-1 items-center justify-center">
              {order.boxes.map((box: any, index: number)=>(
                <div key={index}>
                  <div style={{color: box.template.color == 'orange' ? 'orange' : (box.template.color == 'blue' ? 'blue' : 'green')}}>
                  <BsFillBoxFill />
                </div>
              </div>
              ))}
        </div>
            const orderDate = order.date ? new Date(order.date) : null;
            order.datePretty = (orderDate && !isNaN(orderDate.getTime()))
              ? `${orderDate.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})} ${orderDate.toLocaleTimeString('en-US', {timeZone: 'America/Los_Angeles'})}`
              : "Date Unavailable";
            return order
          })
    setDisplayList(fmt)
    setOrders(orders.data?.orders || [])
    setPageInfo(orders.data?.pageInfo || {startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false})
  }

  const fetchOrdersSearch = async (term:string) => {
    if(term.length < 5){
      return
    }
    const url = `sampleOps/orders?searchTerm=${encodeURIComponent(term)}&reverse=${reverse}`
    const orders = await ziaBackendCall(url, 'GET', undefined)
    const fmt = (structuredClone(orders.data?.orders || [])).map((order:any)=>{
            order.statuses = <div className="flex flex-row gap-2 flex-wrap">
              {order.tags.includes('TRADE-SAMPLE-ORDER') && <BadgeV2 color="yellow">Trade</BadgeV2>}
              {order.tags.includes('PRIORITY-SAMPLE-ORDER') && <BadgeV2 color="red">Priority</BadgeV2>}
              {order.fulfillmentStatus == 'FULFILLED' && <BadgeV2 color="green">Fulfilled</BadgeV2>}
              {order.fulfillmentStatus == 'UNFULFILLED' && <BadgeV2 color="blue">Unfulfilled</BadgeV2>}
              {order.fulfillmentStatus == 'PARTIALLY_FULFILLED' && <BadgeV2 color="orange">Partially Fulfilled</BadgeV2>}
            </div>
            order.boxDisplay = <div className="flex flex-row gap-1 items-center justify-center">
              {order.boxes.map((box: any, index: number)=>(
                      <div key={index}>
                        <div style={{color: box.template.color == 'orange' ? 'orange' : (box.template.color == 'blue' ? 'blue' : 'green')}}>
                        <BsFillBoxFill />
                      </div>
                    </div>
                    ))}
            </div>
            const orderDate = order.date ? new Date(order.date) : null;
            order.datePretty = (orderDate && !isNaN(orderDate.getTime()))
              ? `${orderDate.toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})} ${orderDate.toLocaleTimeString('en-US', {timeZone: 'America/Los_Angeles'})}`
              : "Date Unavailable";
            return order
          })
    setDisplayList(fmt)
    setOrders(orders.data?.orders || [])
    setPageInfo(orders.data?.pageInfo || {startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false})
  }


  const actionFn = (action: any, item: any) => {
    const order = orders.find((o:any) => o.name == item.name)
    if(action.name == 'Ship'){
      setShowShippingModal(true)
      setActiveOrders([order])
    }
    if(action.name == 'Print'){
      setShowPrintModal(true)
      setActiveOrders([order])
    }
  }

  const multipleSelected = (items: any) => {
    setActiveOrders(orders.filter((o:any) => items.map((i:any) => i.name).includes(o.name)))
    if(items.length > 0){
      setShowPrintModal(true)
    }
  }

  const nextFn = () => {
    fetchOrders('forward')
  }

  const prevFn = () => {
    fetchOrders('backward')
  }

  const toggleReverse = () => {
    setReverse(!reverse)
    setTimeout(()=>{
      fetchOrders('start')
    }, 1)
  }

  const printLabels = () => {
    const orderLabels = activeOrders.map((order) => order.labels)
    shopify.toast.show("Label printing triggered for selected orders", { duration: 3000 });
    ziaBackendCall('sampleOps/printLabels?printerId='+labelPrinterRef.current?.value, 'POST', orderLabels)
  }

  const printPackingSlips = () => {
    shopify.toast.show("Packing slip printing triggered for selected orders", { duration: 3000 });
    ziaBackendCall('sampleOps/printPacking?printerId='+letterPrinterRef.current?.value, 'POST', activeOrders)
  }

  const orderShipped = () => {
    setShowShippingModal(false)
    setActiveOrders([])
    fetchOrders('start')
  }

  return (
    <PageStandardList>
    <Modal
      id="ps-ship-modal"
      open={showShippingModal}
      onHide={()=>{setShowShippingModal(false); setActiveOrders([])}}
    >
      <TitleBar title={'Ship Order'}>
      </TitleBar>
          <div className="p-5 relative mb-10">
            {activeOrders == undefined && <div className="w-full flex flex-row justify-center my-10">
              <div className="w-full flex flex-col gap-10 items-center justify-center">
                <div className="text-2xl">Gathering shipping rates from Shipstation</div>
                <EndlessSpinV2 />
              </div>  
            </div>}
            {activeOrders?.map((orderSelected: any, indexO:number)=>(
              <div style={{marginBottom: '50px'}} key={indexO}>
                <ShippingDisplay order={orderSelected} orderShipped={orderShipped} />
              </div>
            ))}
          </div>
    </Modal>

    <Modal
      id="ps-print-modal"
      open={showPrintModal}
      onHide={()=>{setShowPrintModal(false); setActiveOrders([])}}
    >
      <TitleBar title={'Print Order'}>

      </TitleBar>
          <div>
          <div className="p-5 relative flex flex-col gap-5 mb-10">
            <div className="ring-1 ring-gray-200 p-5 rounded-lg flex flex-col gap-5">
              <div className="flex flex-row justify-start text-lg font-bold gap-3 items-center">
                Print Tile Labels
              </div>
              <div className="flex flex-row justify-between gap-3">
                <div>Printer</div>
                <select ref={labelPrinterRef} defaultValue={props.settings.find((x:any)=>x.code == 'shippingLabelPrinterId')?.value} className="ring-1 ring-gray-200 rounded-md p-2" name="printers" id="printers">
                  {props.printers?.filter((x:any)=>x.state == 'online').map((printer: any, index: number) => (
                    <option value={printer.id} key={index}>{printer.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-row gap-5 justify-end">
                <Button size="lg" clickAction={printLabels}>Print {activeOrders?.reduce((acc, order) => acc + (Number(order.labelsToPrint || 0)), 0)} Labels</Button>
              </div>
            </div>
            <div className="ring-1 ring-gray-200 p-5 rounded-lg flex flex-col gap-5">
              <div className="flex flex-row justify-start text-lg font-bold gap-3 items-center">
                Print Packing Slips
              </div>
              <div className="flex flex-row justify-between gap-3">
                <div>Printer</div>
                <select ref={letterPrinterRef} defaultValue={props.settings.find((x:any)=>x.code == 'shippingLetterPrinterId')?.value} className="ring-1 ring-gray-200 rounded-md p-2" name="printers" id="printers">
                  {props.printers?.filter((x:any)=>x.state == 'online').map((printer: any, index: number) => (
                    <option value={printer.id} key={index}>{printer.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-row gap-5 justify-end">
                <Button size="lg" clickAction={printPackingSlips}>Print {activeOrders?.length} Packing Slips</Button>
              </div>
            </div>
            
            {activeOrders?.map((orderSelected: any, indexO:number)=>(
              <div style={{marginBottom: '50px'}} key={indexO}>
                <PrintDisplay order={orderSelected} />
              </div>
            ))}
          </div>
          </div>
    </Modal>

    <TopBarContainer>
      <TopBarV2
          searchFn={fetchOrdersSearch}
          liveSearch={true}
          loading={false}
          nextFn={pageInfo.hasNextPage ? nextFn : undefined}
          prevFn={pageInfo.hasPreviousPage ? prevFn : undefined}
          switchDirFn={toggleReverse}
      />
    </TopBarContainer>
    <ListContainer>
      <MasterList
          box={true}
          headers={[{name: 'Order'}, {name: 'Customer'}, {name: 'Date'}, {name: 'Status'}, {name: 'Boxes'}]} 
          keys={['name', 'customer', 'datePretty', 'statuses', 'boxDisplay']}
          rowClick={true}
          actionFunctions={[
            {name: 'Print'},
            {name: 'Ship'},
          ]}
          actionFunction={actionFn}
          list={displayList}
          shadedRows={true}
          selectedTitle="Print Materials for Selected Orders"
          selectedItemsSubmitted={multipleSelected}
      />
    </ListContainer>
    </PageStandardList>
  );
}