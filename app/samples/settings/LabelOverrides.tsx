"use client"
import { useAppBridge, Modal, TitleBar } from "@shopify/app-bridge-react"
import {  useRef, useState } from "react"
import ziaBackendCall from "@/lib/ziaBackendCall"
import Button from "@/lib/ui/Button"
import MasterList from "@/lib/ui/MasterList"
import ListContainer from "@/lib/ui/ListContainer"
import TopBarContainer from "@/lib/ui/TopBarContainer"
import TopBarV2 from "@/lib/ui/TopBarV2"
import PageStandardList from "@/lib/ui/PageStandardList"
import InputText from "@/lib/ui/InputText"
import Checkbox from "@/lib/ui/Checkbox"
import { FaTrash } from "react-icons/fa6"



export default function LabelOverrides(props: any){
    const [loading, setLoading] = useState<boolean>(false)
    const [pendingLabels, setPendingLabels] = useState<any>([])
    const [prefillFields, setPrefillFields] = useState<{showLogo: boolean, line1: string, line2?: string, footer: string} | undefined>(undefined)
    const [showForm, setShowForm] = useState<boolean>(false)
    const [showCreate, setShowCreate] = useState<boolean>(false)
    const [rules, setRules] = useState<any[]>(props.rules)
    const [activeSku, setActiveSku] = useState<any>(undefined)
    const [activeRule, setActiveRule] = useState<any>(undefined)

    const initialRef = useRef<any>(null)

    const products = props.products?.filter((x:any)=> x.sku).map((x: any) => {
      return {
        id: x._id,
        name: x.product?.title?.replace(', Sample', ''),
        sku: x.sku,
      }
    }).sort((a: any, b: any) => a.name.localeCompare(b.name))


    const cancelCreate = () => {
      setShowCreate(false)
    }
    
    const launchCreate = () => {
      setShowCreate(true)
    }

    const addLabel = (formData: any) => {
      const label = {
        showLogo: formData.get('showLogo') ? true : false,
        line1: formData.get('line1'),
        line2: formData.get('line2'),
        footer: formData.get('footer')
      }
      const cloned = structuredClone(pendingLabels)
      if(formData.get('quantity')*1 > 0){
        for(let y=0; y<formData.get('quantity')*1; y++){
          cloned.push(label)
        }
      }
      else{
        shopify.toast.show('Quantity must be greater than 0', { duration: 3000 })
        return
      }
      console.log(cloned)
      setPendingLabels(cloned)
      setShowForm(false)
      setPrefillFields({
        showLogo: true,
        line1: '',
        footer: 'ziatile.com'
      })
      setTimeout(()=>{
        setShowForm(true)
      },1)
    }

    const removeLabel = (rIndex: number) => {
      const clone  = structuredClone(pendingLabels)
      const newClone = clone.filter((x: any, index: number)=>{
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

    const prefillSelected = (event:any) => {
      const item = products.find((x: any) => x.sku == event.target.value)
      setPrefillFields({
        showLogo: true,
        line1: item.name?.replace(', Sample', ''),
        footer: 'ziatile.com'
      })
      setShowForm(false)
      setTimeout(()=>{
        setShowForm(true)
      },1)
    }

    const saveRule = async () => {
      if(((pendingLabels.length > 0) && initialRef.current?.value)){
        if(rules.find(x=>x.sku == initialRef.current?.value)){
          shopify.toast.show('Rule already exists for this SKU', { duration: 3000 })
          return
        }
        setLoading(true)
        const labelRule = {
          labels: pendingLabels,
          sku: initialRef.current?.value,
        }
        const call = await ziaBackendCall('sampleOps/labelCount', 'POST', labelRule)
        if(call.data?._id){
          const cln = structuredClone(rules)
          const newCln = cln.unshift(call.data)
          setRules(cln)
          shopify.toast.show('Rule Successfully Added', { duration: 3000 })
          setPendingLabels([])
          setPrefillFields(undefined)
          setActiveSku(undefined)
          setShowForm(false)
          setShowCreate(false)
          setTimeout(()=>{
            setShowForm(true)
          },1)
          setLoading(false)
        }
        else{
          shopify.toast.show(call.error ? call.error : 'Error adding rule', { duration: 3000 })
          setLoading(false)
        }
      }
    }

    const actionFn = (action: any, rule: any) => {
      if(action.name == 'View'){
        setActiveSku(rule.sku)
        setActiveRule(rule)
        setShowCreate(true)
      }
      else if(action.name == 'Delete'){
        deleteLabel(rule)
      }
    }

    const deleteLabel = (rule:any) => {
        setLoading(true)
        setTimeout(async ()=>{
          const result = await ziaBackendCall(`sampleOps/labelCount/${rule['_id']}`, 'DELETE', {})
          if(result.error){
            shopify.toast.show(result.error, { duration: 3000 })
          }
          else{
            const cln = structuredClone(rules)
            const newCln = cln.filter((x: any) => x['_id'] != rule['_id'])
            setRules(newCln)
            shopify.toast.show('Rule Deleted', { duration: 3000 })
          }
          setLoading(false)
        },1)
    }

    const closeCreate = () => {
      setShowCreate(false)
      setActiveSku(undefined)
      setActiveRule(undefined)
      setPendingLabels([])
      setPrefillFields(undefined)
      setShowForm(false)
    }

    return (
      <PageStandardList>
        <Modal open={showCreate} onHide={closeCreate}>
      <TitleBar title={'Create a Label Override Rule'}>
      </TitleBar>
                {showCreate &&  <div className="my-5 ring-1 ring-gray-300 p-5 rounded-md">
                  <div className="p-5 relative mb-10">
                    <div className="flex flex-col gap-5">
                      <div>Select a product to override its label printing settings</div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="size">Select a product</label>
                        <select name="size" defaultValue={""} ref={initialRef} onChange={prefillSelected} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Product To Replace</option>
                          {structuredClone(products).map((x: any)=>{
                            return <option key={x.id} value={x.sku}>{x.name} {x.sku}</option>
                          })}
                        </select>
                      </div>
                      {showForm && <form action={addLabel} className="flex flex-col gap-3">
                      <InputText label="Line 1" name="line1" defaultValue={prefillFields?.line1} />
                      <InputText label="Line 2" name="line2" defaultValue={prefillFields?.line2} />
                      <InputText label="Footer" name="footer" defaultValue={prefillFields?.footer} />
                      <Checkbox key="0" id="0" name='showLogo' label="Show Logo" defaultChecked={prefillFields?.showLogo ? true : false}/>
                      <InputText label="Quantity" name="quantity" defaultValue={1} />
                      <div>
                        <Button  loading={loading} type="submit" color="black">Add Label</Button>
                      </div>
                      </form>}
                      <div className="p-5 relative mb-10">
                      {pendingLabels.map((label: any, index:number)=>(
                        <div key={index} className="flex flex-row items-center gap-5">
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

                    {pendingLabels?.length > 0 && <div className="p-3 w-full flex flex-row items-center justify-end gap-5">
                      <Button clickAction={cancelCreate} loading={loading} color="black">Cancel</Button>
                      <Button loading={loading} color="black" clickAction={saveRule}>Create Rule</Button>
                    </div>}
                  </div>
                </div>}
        </Modal>
          <TopBarContainer>
            <TopBarV2 createFn={launchCreate} createTitle="Create Rule"/>
          </TopBarContainer>
          <ListContainer>
            <MasterList actionFunctions={[{name: 'View'}, {name: 'Delete'}]} actionFunction={actionFn} list={structuredClone(rules).map(x=>{
              x.productName = props.products.find((y:any)=>y.sku == x.sku)?.product?.title?.replace(', Sample', '')
              x.labelCount = x.labels?.length
              return x
            })} headers={[{name: 'SKU'}, {name: 'Product'}, {name: 'Labels'}]} keys={['sku', 'productName', 'labelCount']} />
          </ListContainer>
      </PageStandardList>
    )
}