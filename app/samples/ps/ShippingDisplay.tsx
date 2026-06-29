import React, { useEffect, useRef, useState } from "react";
import { TfiPackage } from "react-icons/tfi";
import { FaFedex, FaUps } from "react-icons/fa6";
import ProductItem from "./ProductItem";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import { BsSave2 } from "react-icons/bs";
import Button from "@/lib/ui/Button";
import InputText from "@/lib/ui/InputText";
import InputCombobox from "@/lib/ui/InputCombobox";
import boxes from "../boxes";
import ziaBackendCall from "@/lib/ziaBackendCall";

export default function ShippingDisplay(props: { order: any, orderShipped: () => void }) {
    const [activeOrder, setActiveOrder] = useState<any>(props.order);
    const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
    const [editingTemplateIndex, setEditingTemplateIndex] = useState<number | null>(null);
    const [weightError, setWeightError] = useState<boolean>(false);
    const [draggingOverBoxIndex, setDraggingOverBoxIndex] = useState<number | null>(null);
    const [rates, setRates] = useState<any[]>([]);
    const [printers, setPrinters] = useState<any[]>([]);
    const [shippingParameters, setShippingParameters] = useState<{carrierId: string, serviceCode: string} | null>(null);
    const [settings, setSettings] = useState<any[]>([]);
    const templateRef = useRef<HTMLInputElement | null>(null);
    const weightRef = useRef<HTMLInputElement | null>(null);
    const printerRef = useRef<HTMLSelectElement | null>(null);

    useEffect(() => {
        getPrinters();
        getSettings();
    }, []);

      interface AddressV2 {
        name: string;
        phone: string;
        company_name?: string;
        address_line1: string;
        address_line2?: string;
        address_line3?: string;
        city_locality: string;
        state_province: string;
        postal_code: string;
        country_code: string;
        address_residential_indicator?: "yes" | "no" | "unknown";
      }

      interface PackageV2 {
        package_code: string;
        weight: {
          value: number;
          unit: "ounce" | "pound" | "gram" | "kilogram";
        };
        dimensions?: {
          length: number;
          width: number;
          height: number;
          unit: "inch" | "centimeter";
        };
      }

      function formatShipStationAddressV2(address1: string | null | undefined, address2: string | null | undefined) {
        const maxLen = 44;
        let s1 = (address1 || "").trim();
        let s2 = (address2 || "").trim();

        if (s1.length > maxLen) {
          let splitIndex = s1.lastIndexOf(" ", maxLen);
          if (splitIndex === -1) splitIndex = maxLen;

          const part1 = s1.substring(0, splitIndex).trim();
          const part2 = s1.substring(splitIndex).trim();

          s1 = part1;
          s2 = s2 ? `${part2} ${s2}` : part2;
        }

        if (s2.length > maxLen) {
          s2 = s2.substring(0, maxLen).trim();
        }

        return { address_line1: s1, address_line2: s2 || undefined };
      }

      const formattedStreets = formatShipStationAddressV2(activeOrder.shippingAddress.address1, activeOrder.shippingAddress.address2);


    const getPrinters = async () => {
      const resp = await ziaBackendCall('print/printers', 'GET');
      if(resp?.data){
        setPrinters(resp.data);
      }
    }

    const getSettings = async () => {
      const resp = await ziaBackendCall('settings', 'GET');
      if(resp?.data){
        setSettings(resp.data);
      }
    }


    const changeWeight = async (boxIndex: number): Promise<void> => {
      const newWeight: number = Number(weightRef.current?.value);
      if (!(newWeight > 3)) {
        setWeightError(true);
        return;
      }
      const clone = structuredClone(activeOrder);
      clone.boxes[boxIndex].weight = newWeight;
      setActiveOrder(clone);
      setWeightError(false);
      setEditingWeightIndex(null);
      setRates([]);
    };

    const changeTemplate = async (boxIndex: number): Promise<void> => {
      const newColor: string = String(templateRef.current?.value);
      if (['green', 'blue', 'orange'].includes(newColor)) {
        const clone = structuredClone(activeOrder);
        const newTemplate = boxes[newColor as keyof typeof boxes];
        clone.boxes[boxIndex].template = newTemplate;
        clone.boxes[boxIndex].weight = recalculateWeight(clone.boxes[boxIndex]);
        setActiveOrder(clone);
        setEditingTemplateIndex(null);
        setRates([]);
      }
    };

    const deleteBox = async (boxIndex: number) => {
      if(activeOrder.boxes[boxIndex].items.length > 0){
        shopify.toast.show("Cannot delete box with items inside", { duration: 3000 });
        return;
      }
      const clone = structuredClone(activeOrder);
      clone.boxes.splice(boxIndex, 1);
      setRates([]);
      setActiveOrder(clone);
    };

    // 🚀 NATIVE DRAG HANDLERS: Shopify cannot block these
    const handleDragStart = (e: React.DragEvent, sourceBoxIndex: number, itemIndex: number) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ sourceBoxIndex, itemIndex }));
      e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, boxIndex: number) => {
      e.preventDefault(); // MANDATORY: Allows dropping
      if (draggingOverBoxIndex !== boxIndex) {
        setDraggingOverBoxIndex(boxIndex);
      }
    };

    const recalculateWeight = (box: any) => {
      const itemsWeight = box.items.reduce((total: number, item: any) => total + item.recordedWeight, 0);
      return itemsWeight + Number(box.template.tare);
    };

    const handleDrop = (e: React.DragEvent, destBoxIndex: number) => {
      e.preventDefault();
      setDraggingOverBoxIndex(null);
      
      try {
        const rawData = e.dataTransfer.getData("text/plain");
        if (!rawData) return;
        
        const { sourceBoxIndex, itemIndex } = JSON.parse(rawData);
        if (sourceBoxIndex === destBoxIndex) return;

        const clone = structuredClone(activeOrder);
        const sourceBoxItems = clone.boxes[sourceBoxIndex].items;
        const destBoxItems = clone.boxes[destBoxIndex].items;

        // Splice out of old box and inject into new box
        const [movedItem] = sourceBoxItems.splice(itemIndex, 1);
        destBoxItems.push(movedItem);
        // Recalculate weights for both boxes
        clone.boxes[sourceBoxIndex].weight = recalculateWeight(clone.boxes[sourceBoxIndex]);
        clone.boxes[destBoxIndex].weight = recalculateWeight(clone.boxes[destBoxIndex]);
        setActiveOrder(clone);
        setRates([]);
      } catch (err) {
        console.error("Native drop tracking failed", err);
      }
    };

    const getRates = async () => {
      const shipTo = {
        name: activeOrder.shippingAddress.name,
        phone: activeOrder.shippingAddress.phone || "",
        address_line1: formattedStreets.address_line1,
        address_line2: formattedStreets.address_line2,
        city_locality: activeOrder.shippingAddress.city || "",
        state_province: activeOrder.shippingAddress.provinceCode || "",
        postal_code: activeOrder.shippingAddress.zip || "",
        country_code: activeOrder.shippingAddress.countryCodeV2
      }

      if(!shipTo.name || !shipTo.address_line1 || !shipTo.city_locality || !shipTo.state_province || !shipTo.postal_code || !shipTo.country_code){
        shopify.toast.show("Shipping address is incomplete", { duration: 3000 });
        return;
      }

      const boxesToShip = activeOrder.boxes.map((box: any) => ({
        package_code: "package",
        weight: {
          value: box.weight,
          unit: "pound"
        },
        dimensions: {
          length: box.template.length,
          width: box.template.width,
          height: box.template.height,
          unit: "inch"
        }
      }));

      if(boxesToShip.length === 0){
        shopify.toast.show("No boxes to ship", { duration: 3000 });
        return;
      }

      if(activeOrder.shippingAddress.countryCodeV2 !== 'US'){
        const customsItems = activeOrder.boxes.flatMap((box: any) => 
          box.items.map((item: any) => ({
            description: item.title,
            quantity: 1,
            value: {
              amount: item.price || 0,
              currency: "USD"
            },
            harmonized_tariff_code: item.harmonizedSystemCode || undefined,
            country_of_origin: item.countryCodeOfOrigin || undefined
          }))
        );
        if(customsItems.filter((item: any) => !item.harmonized_tariff_code || !item.country_of_origin).length > 0){
          shopify.toast.show("Some items are missing Harmonized Tariff Code or Country of Origin", { duration: 3000 });
          return;
        }
      }

      interface RatePayload {
        serviceCode?: string;
        carrierId?: string;
        shipTo: AddressV2;
        boxes: PackageV2[];
        customsItems?: Array<{
          description: string;
          quantity: number;
          value: {
            amount: number;
            currency: string;
          };
          harmonized_tariff_code?: string;
          country_of_origin?: string;
        }>;
      } 

      const ratesPayload: RatePayload = {
        shipTo: shipTo,
        boxes: boxesToShip,
        customsItems: activeOrder.shippingAddress.countryCodeV2 !== 'US' ? activeOrder.boxes.flatMap((box: any) => 
          box.items.map((item: any) => ({
            description: item.title,
            quantity: 1,
            value: {
              amount: item.price || 0,
              currency: "USD"
            },
            harmonized_tariff_code: item.harmonizedSystemCode || undefined,
            country_of_origin: item.countryCodeOfOrigin || undefined
          }))
        ) : null
      }

      if(activeOrder.tags?.includes('Expedited Sample Order')){
        ratesPayload.serviceCode = 'ups_2nd_day_air';
        ratesPayload.carrierId = 'se-5963767';
      }

      const resp = await ziaBackendCall('sampleOps/shippingRates', 'POST', ratesPayload);
      if(resp?.data){
        const ratesFound = (resp.data.rate_response?.rates || []).map((rate: any) => {
          rate.shipmentTotal  = 
            (rate.shipping_amount?.amount || 0) +
            (rate.other_amount?.amount || 0) +
            (rate.confirmation_amount?.amount || 0) +
            (rate.insurance_amount?.amount || 0);
          return rate;
        }).sort((a: any, b: any) => (a.shipmentTotal || 0) - (b.shipmentTotal || 0));
        console.log('ratesFound', ratesFound);
        setRates(ratesFound);
      }
    }

    const beginShip = async (rate: any) => {
      setShippingParameters({carrierId: rate.carrier_id, serviceCode: rate.service_code});
      setRates([]);
    }

    const shipFinal = async () => {
      if(!shippingParameters){
        shopify.toast.show("No shipping parameters found", { duration: 3000 });
        return;
      }
      const printerId = printerRef.current?.value || settings.find((x:any)=>x.code == 'shippingShippingPrinterId')?.value;
      if(!printerId){
        shopify.toast.show("No printer selected", { duration: 3000 });
        return;
      }

      const targetFulfillmentOrder = activeOrder.fulfillmentOrders
        .map((edge:any) => edge.node)
        .find((node:any) => node.status === "OPEN" || node.status === "IN_PROGRESS");

      if (!targetFulfillmentOrder) {
        shopify.toast.show("No open fulfillment order found", { duration: 3000 });
        return;
      }

      const fulfillmentOrderId = targetFulfillmentOrder.id;

      const shipPayload = {
        orderId: activeOrder.id,
        fulfillmentOrderId: fulfillmentOrderId,
        carrierId: shippingParameters.carrierId,
        serviceCode: shippingParameters.serviceCode,
        customsItems: null,
        shipTo: {
          name: activeOrder.shippingAddress.name,
          phone: activeOrder.shippingAddress.phone || "",
          address_line1: formattedStreets.address_line1,
          address_line2: formattedStreets.address_line2,
          city_locality: activeOrder.shippingAddress.city || "",
          state_province: activeOrder.shippingAddress.provinceCode || "",
          postal_code: activeOrder.shippingAddress.zip || "",
          country_code: activeOrder.shippingAddress.countryCodeV2
        },
        packages: activeOrder.boxes.map((box: any) => ({
          package_code: "package",
          weight: {
            value: box.weight,
            unit: "pound"
          },
          dimensions: {
            length: box.template.length,
            width: box.template.width,
            height: box.template.height,
            unit: "inch"
          }
        })) 
      }

      if(activeOrder.shippingAddress.countryCodeV2 !== 'US'){
        const customsItems = activeOrder.boxes.flatMap((box: any) => 
          box.items.map((item: any) => ({
            description: item.title,
            quantity: 1,
            value: {
              amount: item.price || 0,
              currency: "USD"
            },
            harmonized_tariff_code: item.harmonizedSystemCode || undefined,
            country_of_origin: item.countryCodeOfOrigin || undefined
          }))
        );
        if(customsItems.filter((item: any) => !item.harmonized_tariff_code || !item.country_of_origin).length > 0){
          shopify.toast.show("Some items are missing Harmonized Tariff Code or Country of Origin", { duration: 3000 });
          return;
        }
        shipPayload.customsItems = customsItems;
      }

      const resp = await ziaBackendCall(`sampleOps/ship?printerId=${printerId}`, 'POST', shipPayload);
      if(resp?.data?.label_id){
        shopify.toast.show("Order shipped successfully", { duration: 3000 });
        setActiveOrder(resp.data.order);
        setShippingParameters(null);
        if(props.orderShipped){
          props.orderShipped();
        }
      }
      else{
        shopify.toast.show("Error shipping order", { duration: 3000 });
      }
    }


    return (
        <div className="flex flex-col gap-5">
          {activeOrder?.boxes?.map((box: any, indexB: number) => (
            <div style={{ marginBottom: '25px' }} key={indexB}>
              <div>
                {box && (
                  <div className="flex flex-row justify-between items-stretch gap-2">
                    <div className="basis-1/2 flex flex-col justify-between items-center gap-5 ring-1 rounded-lg ring-gray-200 p-3">
                      {editingTemplateIndex !== indexB ? (
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-bold">Box {indexB + 1}/{activeOrder?.boxes?.length}</div>
                          <div className="flex flex-col items-center gap-3">
                            <div style={{ fontSize: '65px', color: box.template.color === 'orange' ? 'orange' : (box.template.color === 'blue' ? 'blue' : 'green') }}>
                              <TfiPackage />
                            </div>
                            <div className="flex flex-row gap-5 items-center justify-center cursor-pointer">
                              <div onClick={() => setEditingTemplateIndex(indexB)}><PencilSquareIcon className="h-5 w-5" /></div> 
                              <div onClick={() => deleteBox(indexB)}><TrashIcon className="h-5 w-5" /></div> 
                            </div> 
                          </div>  
                        </div>
                      ) : (
                        <div className="flex flex-col gap-5 items-start w-full">
                          <InputCombobox 
                            name="templateColor" 
                            shadowId={`templateColor-${indexB}`} 
                            refX={templateRef} 
                            label="Template Color" 
                            list={[
                              { value: 'green', name: 'Green' },
                              { value: 'blue', name: 'Blue' },
                              { value: 'orange', name: 'Orange' },
                            ]} />
                          <Button color="black" icon={BsSave2} clickAction={() => changeTemplate(indexB)}>Update Box</Button>
                        </div>
                      )}
                    </div>

                    <div className="basis-1/2 flex flex-col justify-start items-center gap-5 ring-1 rounded-lg ring-gray-200 p-3">
                      <div className="text-2xl font-bold flex flex-row items-center gap-2">
                        <span>{(box.weight * 1).toFixed(1)} lbs</span> 
                        <div className="cursor-pointer" onClick={() => setEditingWeightIndex(indexB)}>
                          <PencilSquareIcon className="h-5 w-5" />
                        </div>
                      </div>
                      {editingWeightIndex !== indexB ? (
                        <div className="text-gray-500 text-sm">
                          (Tare: {box.template.tare} lbs)
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-5 w-full">
                          <InputText shadowId={`newWeight-${indexB}`} name="newWeight" refX={weightRef} label="New Weight (lbs)" />
                          <Button color="black" icon={BsSave2} clickAction={() => changeWeight(indexB)}>Update Weight</Button>
                          {weightError && <div className="text-red-600 text-xs font-semibold">Invalid Amount</div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* 📦 NATIVE DROPPABLE BOX CONTAINER */}
                <div 
                  onDragOver={(e) => handleDragOver(e, indexB)}
                  onDrop={(e) => handleDrop(e, indexB)}
                  onDragLeave={() => setDraggingOverBoxIndex(null)}
                  className={`flex flex-col gap-2 mt-5 p-2 rounded-lg border-2 transition-all min-h-[100px] ${
                    draggingOverBoxIndex === indexB 
                      ? 'bg-blue-50/70 border-dashed border-blue-400 scale-[1.005]' 
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  {box.items?.map((item: any, indexK: number) => (
                    
                    /* 🏷️ NATIVE DRAGGABLE CARD LAYER */
                    <div
                      key={item.id ? String(item.id) : `native-${indexB}-${indexK}`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, indexB, indexK)}
                      style={{ cursor: 'grab' }}
                      className="p-3 bg-white border border-gray-200 rounded shadow-sm select-none hover:border-gray-300 active:cursor-grabbing transition-all"
                    >
                      <ProductItem item={item} />
                    </div>

                  ))}

                  {box.items?.length === 0 && (
                    <div className="text-gray-400 text-sm font-medium text-center py-6 pointer-events-none">
                      Empty Box — Drag items here
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rates.length == 0 && !shippingParameters && <div>
            <div className="w-full flex flex-row justify-end">
              <Button color="gray" size="md" clickAction={getRates}>Get Rates</Button>
            </div>
          </div>}

          {rates.length > 0 && <div className="flex flex-col justify-between items-center gap-5">
            {rates.map((rate, index) => (
              <div key={index} className="flex flex-row justify-between items-center w-full ring-1 ring-gray-200 rounded-lg p-3">
                <div className="basis-1/5">
                  {rate.carrier_code === 'ups' && <FaUps className="h-8 w-8" />}
                  {rate.carrier_code === 'fedex' && <FaFedex className="h-8 w-8" />}
                </div>
                <div className="basis-2/5">
                  {rate.carrier_delivery_days}
                </div>
                <div className="basis-1/5">
                  ${rate.shipmentTotal?.toFixed(2) || '0.00'}
                </div>
                <div className="basis-1/5">
                  <Button color="green" size="md" clickAction={() => beginShip(rate)}>Ship</Button>
                </div>
              </div>
            ))}
          </div>}

          {shippingParameters && <div className="flex flex-col gap-5">
          <div className="flex flex-row justify-between gap-3">
                <div>Printer</div>
                <select ref={printerRef} defaultValue={settings.find((x:any)=>x.code == 'shippingShippingPrinterId')?.value} className="ring-1 ring-gray-200 rounded-md p-2" name="printers" id="printers">
                  {printers?.filter((x:any)=>x.state == 'online').map((printer: any, index: number) => (
                    <option value={printer.id} key={index}>{printer.name}</option>
                  ))}
                </select>
              </div>
          <div className="w-full flex flex-row justify-end">
              <Button color="green" size="md" clickAction={shipFinal}>Print Labels and Ship</Button>
            </div>   
          </div>}

          {}
        </div>
    );
}
