"use client"
import Button from "@/lib/ui/Button"
import InputText from "@/lib/ui/InputText"
import PageStandard from "@/lib/ui/PageStandard"
import SectionBlock from "@/lib/ui/SectionBlock"
import ziaBackendCall from "@/lib/ziaBackendCall"
import {  useRef, useState } from "react"



export default function Shipstation(props: any){
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<any>(null)

    const keyUpdate = async () => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall('settings', 'PUT', {code: 'shipstationAPIKey', value: inputRef.current?.value})
        shopify.toast.show(result.error ? result.error : 'API key updated', { duration: 3000 })
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
      </PageStandard>
    )
}