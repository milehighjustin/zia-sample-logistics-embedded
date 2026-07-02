"use client"
import Button from "@/lib/ui/Button"
import InputCombobox from "@/lib/ui/InputCombobox"
import InputText from "@/lib/ui/InputText"
import PageStandard from "@/lib/ui/PageStandard"
import SectionBlock from "@/lib/ui/SectionBlock"
import ziaBackendCall from "@/lib/ziaBackendCall"
import {  useEffect, useRef, useState } from "react"



export default function Shipstation(props: any){
    const [loading, setLoading] = useState(false)
    const [carriers, setCarriers] = useState<any[] | null>(null)

    const inputRef = useRef<any>(null)
    const carrierIdRef = useRef<any>(null)

    useEffect(()=>{
      getCarriers()
    }, [])

    const getCarriers = async () => {
      const result = await ziaBackendCall('sampleOps/carriers', 'GET', {})
      console.log('carriers', result)
      if(result.data.carriers){
        setCarriers(result.data.carriers)
      }
      return result.data.carriers || []
    }


    const keyUpdate = async () => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall('settings', 'PUT', {code: 'shipstationAPIKey', value: inputRef.current?.value})
        shopify.toast.show(result.error ? result.error : 'API key updated', { duration: 3000 })
        getCarriers()
        setLoading(false)
      },1)
    }

    const carrierIdUpdate = async (item: any) => {
      setLoading(true)
      setTimeout(async ()=>{
        const updateObj = {code: 'expeditedShippingCarrierId', value: item}
        console.log('updateObj', updateObj)
        const result = await ziaBackendCall('settings', 'PUT', updateObj)
        shopify.toast.show(result.error ? result.error : 'Carrier ID updated', { duration: 3000 })
        setLoading(false)
      },1)
    }
    
    return (
      <PageStandard>
        <SectionBlock title="Shipstation API Key" subText="Update the API Key for Shipstation when the previous key has expired or is invalid. Use a V2 API Key for this integration. The API key is obtainable through the Shipstation account under Account Settings > API Settings.">
            <div className="flex flex-col gap-5 max-w-[300px]">
              <InputText refX={inputRef} label="Shipstation V2 API Key" subText="Enter the new API key to replace the current key"  />
              <div>
                <Button clickAction={keyUpdate} loading={loading} color="black">Update API Key</Button>
              </div>
            </div>
        </SectionBlock>
        {carriers && <SectionBlock title="Expedited Shipping Carrier ID" subText="Select the shipping account to be used for expedited orders. This will be used by the website (Shopify Carrier Service) to generate rates">
            <div className="flex flex-col gap-5 max-w-[300px]">
              <InputCombobox label="Shipping Printer" subText="A6 Labels (Shipping Labels)" list={structuredClone(carriers || [])?.map((x: any)=>{
                x.name = `${x.nickname} (${x.account_number})`
                x.value = x.carrier_id
                return x
              })} selectedItem={(item: any)=>carrierIdUpdate(item)} defaultValue={props.settings.find((x: any)=>x.code == 'expeditedShippingCarrierId')?.value}/>
            </div>
        </SectionBlock>}
      </PageStandard>
    )
}