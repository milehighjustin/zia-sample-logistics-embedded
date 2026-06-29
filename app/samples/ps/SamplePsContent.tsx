'use client';

import BadgeV2 from "@/lib/ui/BadgeV2";
import ListContainer from "@/lib/ui/ListContainer";
import MasterList from "@/lib/ui/MasterList";
import PageStandardList from "@/lib/ui/PageStandardList";
import { useEffect, useState } from "react";
import { BsFillBoxFill } from "react-icons/bs";
import ziaBackendCall from "@/lib/ziaBackendCall";
import TopBarContainer from "@/lib/ui/TopBarContainer";
import TopBarV2 from "@/lib/ui/TopBarV2";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import Button from "@/lib/ui/Button";
import Card from "@/lib/ui/Card";
import EndlessSpinV2 from "@/lib/ui/EndlessSpinV2";
import BoxDisplay from "./BoxDisplay";
import ShippingDisplay from "./ShippingDisplay";

export default function SamplePsContent(props: { tag: string, lcRules: any[] }) {
  const [orders, setOrders] = useState<any[]>([])
  const [displayList, setDisplayList] = useState<any[]>([])
  const [reverse, setReverse] = useState<boolean>(false)
  const [pageInfo, setPageInfo] = useState<{startCursor: string, endCursor: string, hasNextPage: boolean, hasPreviousPage: boolean}>({startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false})
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [alert, setAlert] = useState<{type: string, text: string} | undefined>(undefined)
  const boxes = {
      green: {color: 'green', length: 10, width: 10, height: 4, units: "inches", tare: 1.86},
      blue: {color: 'blue', length: 10, width: 10, height: 8, units: "inches", tare: 2},
      orange: {color: 'orange', length: 14, width: 14, height: 6, units: "inches", tare: 2.34},
  }

  useEffect(()=>{
    fetchOrders('start')
  }, [])

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
            order.date = new Date(order.createdAt).toLocaleString()
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
    console.log(orders, 'search orders')
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
            order.date = new Date(order.createdAt).toLocaleString()
            return order
          })
    setDisplayList(fmt)
    setOrders(orders.data?.orders || [])
    setPageInfo(orders.data?.pageInfo || {startCursor: '', endCursor: '', hasNextPage: false, hasPreviousPage: false})
  }


  const actionFn = (action: any, item: any) => {
    const order = orders.find((o:any) => o.name == item.name)
    launchOrders([order])
    setSelectedOrder(order)
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

  const launchOrders = async (selectedOrders: any[]) => {
    setLoading(true)
    setActiveOrders([])
    setTimeout(async ()=>{
      setShowOrderModal(true)
      setActiveOrders(selectedOrders)
      setLoading(false)
    }, 1)
  }

  const getShipping = async (orders: any[]) => {
    setLoading(true)
    const sanitized = orders.map(x=>{
      delete x.boxDisplay
      delete x.statuses
      return x
    })
    if(orders.length == 1){
      const shippingResponse = await ziaBackendCall(`sampleOps/shippingInfo`, 'POST', sanitized)
      const response = sanitized.map(order=>{
        const shippingResp = shippingResponse?.data?.find((x: any) => x.orderNumber  == order.name?.substring(1))
        if(shippingResp.boxes){
          order.shipping = shippingResp
          return order
        }
        else{
          order.shipping = {boxes: order.boxes, failed: true}
          return order
        }
      })
      setLoading(false)
      return response
    }
    else{
      sanitized.map(x=>{
        x.shipping = {boxes: x.boxes}
        return x
      })
      setLoading(false)
      return sanitized
    }
  }

  const menuSelect = (item: {title:string, data: any, id:string}) => {
    if(item.id == 'printLabels'){
      printSingleOrderLabels(item.data)
    }
    if(item.id == 'printPacking'){
      printSingleOrderPackingSlip(item.data)
    }
    if(item.id == 'shipBoxes'){
      shipSingleOrder(item.data)
    }
    if(item.id == 'addBox'){
      const clone = structuredClone(activeOrders)
      const orderI = clone.findIndex(x=>x.name == item.data['name'])
      if(orderI >= 0){
        const boxTemplates = boxes
        clone[orderI].boxes.push({
          template: boxTemplates?.green,
          weight: boxTemplates?.green?.tare,
          items: item.data.boxes[0]?.items
        })
      }
      setActiveOrders([])
      setTimeout(()=>{
        setActiveOrders(clone)
      },1)
    }
  }

  const labelsFromOrder = (order:any) => {
    const oLabels = []
    for(let l=0; l<order.lines?.length; l++){
      const line = order.lines[l]
      for(let y=0; y<line.currentQuantity; y++){
        const rule = props.lcRules.find(x=>x.sku == line.sku)
        if(rule){
          rule.labels.forEach((x: any)=>{
            oLabels.push(x)
          })
        }
        else{
          oLabels.push({
            showLogo: true,
            line1: line.product?.title?.replace(', Sample', ''),
            footer: 'ziatile.com'
          })
        }
      }
    }
    oLabels.unshift({
      line1: order.name,
      line2: order.customer,
    })
      oLabels.unshift({
      line1: order.name,
      line2: order.customer,
    })
      oLabels.unshift({
      line1: order.name,
      line2: order.customer,
    })
    return oLabels
  }

  const printSingleOrderLabels = async (order: any) => {
    setLoading(true)
    const labelOrders = [labelsFromOrder(order)]
    const call = await ziaBackendCall('sampleOps/printLabels', 'POST', labelOrders)
    setLoading(false)
  }

  const printSingleOrderPackingSlip = async (order: any) => {
    setLoading(true)
    const call = await ziaBackendCall('sampleOps/printPacking', 'POST', [order])
    setLoading(false)
  }

  const shipSingleOrder = async (order:any) => {
    setLoading(true)
    const call = await ziaBackendCall('sampleOps/printPacking', 'POST', [order])
    setLoading(false)
  }

  const deleteBox = (orderId: string, boxIndex: number) => {
    const clone = structuredClone(activeOrders)
    const orderI = clone.findIndex(x=>x.name == orderId)
    if(orderI >= 0){
      const newArray = clone[orderI].boxes.slice(0, boxIndex).concat(clone[orderI].boxes.slice(boxIndex + 1))
      clone[orderI].boxes = newArray
    }
    setActiveOrders([])
    setTimeout(()=>{
      setActiveOrders(clone)
    },1)
  }

  const changeBoxWeight = (orderId: string, boxIndex: number, newWeight: number) => {
    const clone = structuredClone(activeOrders)
    const orderI = clone.findIndex(x=>x.name == orderId)
    if(orderI >= 0){
      clone[orderI].boxes[boxIndex].weight = newWeight*1
    }
    setActiveOrders([])
    setTimeout(()=>{
      setActiveOrders(clone)
    },1)
  }

  const changeBoxTemplate = (orderId: string, boxIndex: number, newColor: string) => {
    console.log(activeOrders, 'active orders')
    const clone = structuredClone(activeOrders)
    const orderI = clone.findIndex(x=>x.name == orderId)
    if(orderI >= 0){
      const boxTemplates = boxes
      const searchKey = newColor == 'green' ? 'green' : (newColor == 'blue' ? 'blue' : 'orange')
      clone[orderI].boxes[boxIndex].template = boxTemplates[searchKey]
    }
    setActiveOrders([])
    setTimeout(()=>{
      setActiveOrders(clone)
    },1)
  }

  const printActiveOrderLabels = async () => {
    setLoading(true)
    const orders = structuredClone(activeOrders)
    const labelOrders = []
    for(let o=0; o<orders.length; o++){
      const oLabels = labelsFromOrder(orders[o])
      labelOrders.push(oLabels)
    }
    const call = await ziaBackendCall('sampleOps/printLabels', 'POST', labelOrders)
    setAlert({type: 'success', text: 'Labels successfully printed'})
    setLoading(false)
  }

  const printActiveOrdersPackingSlips = async () => {
    setLoading(true)
    const call = await ziaBackendCall('sampleOps/printPacking', 'POST', activeOrders)
    setLoading(false)
  }

  const shipActiveOrders = async ()=> {
    setLoading(true)
    const call = await ziaBackendCall('sampleOps/ship', 'POST', activeOrders)
    setLoading(false)
  }

  return (
    <PageStandardList>
    <Modal
      id="ps-order-modal"
      open={showOrderModal}
      onHide={()=>{setShowOrderModal(false); setActiveOrders([])}}
    >
      <TitleBar title={'Order Details'}>    
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
                <Card name={orderSelected.customer} subText={orderSelected?.name} menuSelect={menuSelect} menu={[
                  {title: 'Print Labels', data: orderSelected, id: 'printLabels'},
                  {title: 'Print Packing Slips', data: orderSelected, id: 'printPacking'},
                  {title: 'Ship Boxes', data: orderSelected, id: 'shipBoxes'},
                  {title: 'Add Box', data: orderSelected, id: 'addBox'}
                ]}>
                  <ShippingDisplay order={orderSelected} />
                </Card>
              </div>
            ))}
          <div className="p-3 w-full fixed bottom-0 left-0 bg-white flex flex-row items-center justify-end gap-5">
            <Button loading={loading} clickAction={printActiveOrderLabels} color="black">Print Labels</Button>
            <Button loading={loading} clickAction={printActiveOrdersPackingSlips} color="black">Print Packing Slips</Button>
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
          headers={[{name: 'Order'}, {name: 'Date'}, {name: 'Customer'}, {name: 'Status'}, {name: 'Boxes'}]} 
          keys={['name', 'date', 'customer', 'statuses', 'boxDisplay']}
          rowClick={true}
          actionFunctions={[]}
          actionFunction={actionFn}
          list={displayList}
          shadedRows={true}
      />
    </ListContainer>
    </PageStandardList>
  );
}