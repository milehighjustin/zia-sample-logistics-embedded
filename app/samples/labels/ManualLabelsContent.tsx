'use client';


import Button from "@/lib/ui/Button";
import Checkbox from "@/lib/ui/Checkbox";
import InputCombobox from "@/lib/ui/InputCombobox";
import InputText from "@/lib/ui/InputText";
import PageStandard from "@/lib/ui/PageStandard";
import ziaBackendCall from "@/lib/ziaBackendCall";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { useRef, useState } from "react";
import { FaTrash } from "react-icons/fa";

export default function ManualLabelsContent(props: {products: any[], printers: any[], settings: any[]}) {
    const [loading, setLoading] = useState<boolean>(false)
    const [alert, setAlert] = useState<{type: string, text: string} | undefined>(undefined)
    const [pendingLabels, setPendingLabels] = useState<any[]>([])
    const [prefillFields, setPrefillFields] = useState<any | undefined>(undefined)
    const [showForm, setShowForm] = useState<boolean>(true)
    const [formKey, setFormKey] = useState<number>(0)
    const [showPrintModal, setShowPrintModal] = useState<boolean>(false)

    const labelPrinterRef = useRef<HTMLSelectElement>(null)


    const addLabel = (formData: any) => {
      const label = {
        showLogo: formData.get('showLogo') ? true : false,
        line1: formData.get('line1'),
        line2: formData.get('line2'),
        footer: formData.get('footer')
      }
      const cloned = structuredClone(pendingLabels)
      const count = formData.get('quantity') ? formData.get('quantity')*1 : 1
      if(count > 0){
        for(let y=0; y<count; y++){
          cloned.push(label)
        }
      }
      setPendingLabels(cloned)
      setShowForm(false)
      setPrefillFields(undefined)
      setTimeout(()=>{
        setShowForm(true)
        setFormKey(prev => prev + 1)
      },1)
    }

    const prefillSelected = (item: any) => {
      setShowForm(false)
      const product = props.products.find((p: any)=>p.sku == item)
      const title = product?.product?.title ? product.product.title.replace(', Sample', '') : 'Sample Product'
      const prefill = {
        showLogo: true,
        line1: title,
        footer: 'ziatile.com'
      }
      setPrefillFields(prefill)
      setTimeout(()=>{
        setShowForm(true)
        setFormKey(prev => prev + 1)
      },1)
    }

    const printLabels = async () => {
      if(pendingLabels.length > 0){
        setShowPrintModal(true)
      }
    }

    const removeLabel = (rIndex: number) => {
      const clone  = structuredClone(pendingLabels)
      const newClone = clone.filter((x, index)=>{
        if(index != rIndex){
          return true
        }
        else{
          return false
        }
      })
      setTimeout(()=>{
        setPendingLabels(newClone)
      })
    }

    const printExecute = async () => {
      if(pendingLabels.length > 0){
      shopify.toast.show("Labels Printed", { duration: 3000 });
      ziaBackendCall('sampleOps/printPacking?printerId='+labelPrinterRef.current?.value, 'POST', [pendingLabels])
      }
    }

  
  return (
    <PageStandard>
    <Modal
      id="ps-print2-modal"
      open={showPrintModal}
      onHide={()=>{setShowPrintModal(false); setPendingLabels([])}}
    >
      <TitleBar title={'Print Labels'}>

      </TitleBar>
          <div className="flex flex-col items-center gap-5 py-10">
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
                <Button size="lg" clickAction={printExecute}>Print {pendingLabels.length} Labels</Button>
              </div>
            </div>

          {pendingLabels.map((label, index)=>(
            <div className="flex flex-row items-center gap-5" key={index}>
              <div className="w-[2.25in] h-[1.37in] relative p-2 ring-1 ring-gray-300">
                <div>{label.showLogo && <svg viewBox="0 0 90 16"><g fill="none" fillRule="evenodd"><g fill="currentColor" fillRule="nonzero"><path d="M28.953.074c.706 0 1.355.372 1.714.97l.078.142L38.088 16h-3.995l-1.046-2.228c-.306-.651-.937-1.084-1.646-1.143l-.165-.006h-5.975l-1.542 3.366h-1.387L28.19 3.288 26.648.074h2.305zm-8.471 0l-.006 15.915H17.09V.074h3.392zm-6.167 0L3.985 14.765h10.33v1.224H1.199c-.215 0-.425-.07-.598-.198-.408-.304-.518-.862-.273-1.294l.069-.105 9.755-13.094H.286V.074h14.029zm43.937 0v1.224h-4.976c-.552 0-.999.446-1 .998l-.036 13.693h-3.392l.036-13.688c0-.555-.448-1.003-1-1.003h-5.048V.074h15.416zm5.088 0l-.006 15.915h-3.386V.074h3.392zM69.879 0l-.06 13.76c0 .557.448 1.005 1 1.005h5.153l.053 1.224h-9.602V0h3.456zM88.93.074v1.224H81.84V7.42h5.55v1.224h-5.55v5.121c0 .552.447 1 1 1h6.4v1.224H78.448V.074h10.483zM28.807 4.971l-3.084 6.427h4.578c.15 0 .298-.033.433-.098.462-.222.676-.753.513-1.226l-.044-.108-2.396-4.995z" transform="translate(-39 -40) translate(39.878 40)"></path></g></g></svg>}</div>
                <div className="absolute bottom-2 left-2 text-sm">{label.footer ? label.footer : ''}</div>
                  <div className="mt-2 w-full flex flex-col gap-2">
                      <span className="block text-lg font-semibold leading-4">{label.line1 ? label.line1 : ''}</span>
                      <span className="block truncate text-sm">{label.line2 ? label.line2 : ''}</span>
                      <span className="block truncate text-sm">{label.line3 ? label.line3 : ''}</span>
                  </div>
              </div>
              <div onClick={()=>removeLabel(index)}><FaTrash className="h-5 w-5" /></div>
            </div>
          ))}
          </div>
    </Modal>   


      <div className="h-full w-full ring-1 ring-gray-500 rounded-lg p-5 flex flex-col gap-5">
        <div className="mt-2 flex flex-row gap-10 w-full">
          <div className="basis-1/2 ring-1 p-5 ring-gray-300 rounded-lg">
            <InputCombobox icon="search" searchable={true} selectedItem={prefillSelected} label="Select a Product" list={props.products?.map(p=>{
              p.name = p.product?.title.replace(', Sample', '')
              p.value = p.sku
              return p
            })} />
            {showForm && <form key={formKey} action={addLabel} className="flex flex-col gap-3">
            <InputText label="Line 1" name="line1" defaultValue={prefillFields?.line1} />
            <InputText label="Line 2" name="line2" defaultValue={prefillFields?.line2} />
            <InputText label="Footer" name="footer" defaultValue={prefillFields?.footer} />
            <Checkbox key="0" id="0" name='showLogo' label="Show Logo" defaultChecked={prefillFields?.showLogo ? true : false}/>
            <InputCombobox defaultValue={"1"} name="quantity" label="Quantity" list={[
              {name: "1", value: "1"},
              {name: "2", value: "2"},
              {name: "3", value: "3"},
              {name: "4", value: "4"},
              {name: "5", value: "5"},
              {name: "6", value: "6"},
              {name: "7", value: "7"},
              {name: "8", value: "8"},
              {name: "9", value: "9"},
              {name: "10", value: "10"},
            ]} />
            <div>
              <Button  loading={loading}   type="submit" color="black">Add Label</Button>
            </div>
            </form>}
          </div>
          <div className="basis-1/2 flex flex-col gap-5 rounded-lg ring-1 p-5 ring-gray-300">
          <div className="flex flex-row items-center justify-between">
            <div className="block text-md font-bold leading-6 text-gray-900">Labels To Print</div>
            <Button  loading={loading}   color="black" clickAction={printLabels}>Print</Button>
          </div>
          <div className="flex flex-col items-center gap-5 overflow-auto h-[500px] py-10">
          {pendingLabels.map((label, index)=>(
            <div className="flex flex-row items-center gap-5" key={index}>
              <div className="w-[2.25in] h-[1.37in] relative p-2 ring-1 ring-gray-300">
                <div>{label.showLogo && <svg viewBox="0 0 90 16"><g fill="none" fillRule="evenodd"><g fill="currentColor" fillRule="nonzero"><path d="M28.953.074c.706 0 1.355.372 1.714.97l.078.142L38.088 16h-3.995l-1.046-2.228c-.306-.651-.937-1.084-1.646-1.143l-.165-.006h-5.975l-1.542 3.366h-1.387L28.19 3.288 26.648.074h2.305zm-8.471 0l-.006 15.915H17.09V.074h3.392zm-6.167 0L3.985 14.765h10.33v1.224H1.199c-.215 0-.425-.07-.598-.198-.408-.304-.518-.862-.273-1.294l.069-.105 9.755-13.094H.286V.074h14.029zm43.937 0v1.224h-4.976c-.552 0-.999.446-1 .998l-.036 13.693h-3.392l.036-13.688c0-.555-.448-1.003-1-1.003h-5.048V.074h15.416zm5.088 0l-.006 15.915h-3.386V.074h3.392zM69.879 0l-.06 13.76c0 .557.448 1.005 1 1.005h5.153l.053 1.224h-9.602V0h3.456zM88.93.074v1.224H81.84V7.42h5.55v1.224h-5.55v5.121c0 .552.447 1 1 1h6.4v1.224H78.448V.074h10.483zM28.807 4.971l-3.084 6.427h4.578c.15 0 .298-.033.433-.098.462-.222.676-.753.513-1.226l-.044-.108-2.396-4.995z" transform="translate(-39 -40) translate(39.878 40)"></path></g></g></svg>}</div>
                <div className="absolute bottom-2 left-2 text-sm">{label.footer ? label.footer : ''}</div>
                  <div className="mt-2 w-full flex flex-col gap-2">
                      <span className="block text-lg font-semibold leading-4">{label.line1 ? label.line1 : ''}</span>
                      <span className="block truncate text-sm">{label.line2 ? label.line2 : ''}</span>
                      <span className="block truncate text-sm">{label.line3 ? label.line3 : ''}</span>
                  </div>
              </div>
              <div onClick={()=>removeLabel(index)}><FaTrash className="h-5 w-5" /></div>
            </div>
          ))}
          </div>
          </div>
        </div>
      </div>
    </PageStandard>
  );
}