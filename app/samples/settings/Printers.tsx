"use client"
import InputCombobox from "@/lib/ui/InputCombobox"
import MasterList from "@/lib/ui/MasterList"
import PageStandard from "@/lib/ui/PageStandard"
import SectionBlock from "@/lib/ui/SectionBlock"
import ziaBackendCall from "@/lib/ziaBackendCall"
import {  useState } from "react"



export default function Printers(props: any){
    const [loading, setLoading] = useState(false)

    const printerSelected = async (code: string, printerId: any) => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall('settings', 'PUT', {code: code, value: printerId})
        shopify.toast.show(result.error ? result.error : 'Default printer set', { duration: 3000 })
        setLoading(false)
      },1)
    }
    
    return (
      <PageStandard>
        <SectionBlock title="Default Printers" subText="Select default printers for various print types.">
            <div className="flex flex-col gap-5 max-w-[300px]">
              <InputCombobox label="Label Printer" subText="2.25 x 1.37 labels" list={structuredClone(props.printers || [])?.map((x: any)=>{
                x.name = `${x.id} ${x.name}`
                x.value = x.id
                return x
              })} selectedItem={(item)=>printerSelected('shippingLabelPrinterId', item)} defaultValue={props.settings.find((x: any)=>x.code == 'shippingLabelPrinterId')?.value}/>
              <InputCombobox label="Letter Printer" subText="8.5 x 11 Letter Sized (Packing slips, etc.)" list={structuredClone(props.printers || [])?.map((x: any)=>{
                x.value = x.id
                return x
              })} selectedItem={(item)=>printerSelected('shippingLetterPrinterId', item)} defaultValue={props.settings.find((x: any)=>x.code == 'shippingLetterPrinterId')?.value}/>
              <InputCombobox label="Shipping Printer" subText="A6 Labels (Shipping Labels)" list={structuredClone(props.printers || [])?.map((x: any)=>{
                x.value = x.id
                return x
              })} selectedItem={(item)=>printerSelected('shippingShippingPrinterId', item)} defaultValue={props.settings.find((x: any)=>x.code == 'shippingShippingPrinterId')?.value}/>
            </div>
        </SectionBlock>
        <SectionBlock title="Available Printers" subText="List of printers connected to Zia.">
            <MasterList actionFunctions={[]} headers={[{name: 'Name'}, {name: 'Connected Device'}, {name: 'ID'}, {name: 'Status'}]} keys={['name', 'deviceName', 'id','status'] } list={structuredClone(props.printers || [])?.map((printer: any)=>{
              printer.deviceName = printer.computer?.name
              printer.status = printer.state
              return printer
            })}/>
        </SectionBlock>

      </PageStandard>
    )
}