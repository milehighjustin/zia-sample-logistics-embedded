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
import InputCombobox from "@/lib/ui/InputCombobox"



export default function ProductOverrides(props: any){
    const [loading, setLoading] = useState<boolean>(false)
    const [alert, setAlert] = useState<any>(undefined)
    const [showCreate, setShowCreate] = useState<boolean>(false)
    const [rules, setRules] = useState<any>(props.rules)

    const initialRef = useRef<any>(null)
    const replaceRef = useRef<any>(null)

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

    const deleteRule = (action:any, rule: any) => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall(`sampleOps/overrides/${rule['_id']}`, 'DELETE', {})
        if(result.error){
          shopify.toast.show(result.error)
        }
        else{
          const cln = structuredClone(rules)
          const newCln = cln.filter((x: any) => x['_id'] != rule['_id'])
          setRules(newCln)
        }
        setLoading(false)
      },1)
    }


    const saveRule = async () => {
      const ruleSku = initialRef.current?.value
      const replaceSku = replaceRef.current?.value
      if(ruleSku){
        if(rules.find((x: any) => x.ruleSku == ruleSku)){
          shopify.toast.show('Rule already exists for this SKU')
          return
        }
        setLoading(true)
        const rule = {
          ruleSku: ruleSku,
          replaceSku: replaceSku,
        }
        const call = await ziaBackendCall('sampleOps/overrides', 'POST', rule)
        if(call.data?._id){
          const cln = structuredClone(rules)
          const newCln = cln.unshift(call.data)
          setRules(cln)
          shopify.toast.show('Rule Successfully Added')
          setShowCreate(false)
          setLoading(false)
        }
        else{
          shopify.toast.show(call.error ? call.error : 'Error adding rule')
          setLoading(false)
        }
      }
    }
    
    return (
      <PageStandardList>
        <Modal open={showCreate} onHide={()=>setShowCreate(false)}>
      <TitleBar title={'Create a Product Override Rule'}>
      </TitleBar>
                {showCreate &&  <div className="my-5 ring-1 ring-gray-300 p-5 rounded-md">
                  <div className="p-5 relative mb-10">
                    <div className="flex flex-col gap-5">
                      <div>Select a product to replace and the product to replace it with</div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="size">Product To Replace</label>
                        <select name="size" defaultValue={""} ref={initialRef} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Product To Replace</option>
                          {structuredClone(products).map((x: any)=>{
                            return <option key={x.id} value={x.sku}>{x.name} {x.sku}</option>
                          })}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="replace">Product To Replace</label>
                        <select name="replace" defaultValue={""} ref={replaceRef} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Replacement Product</option>
                          {structuredClone(products).map((x: any)=>{
                            return <option key={x.id} value={x.sku}>{x.name} {x.sku}</option>
                          })}
                        </select>
                      </div>


                    </div>

                    <div className="p-3 w-full flex flex-row items-center justify-end gap-5">
                      <Button clickAction={cancelCreate} loading={loading} color="black">Cancel</Button>
                      <Button loading={loading} color="black" clickAction={saveRule}>Create Rule</Button>
                    </div>
                  </div>
                </div>}

        </Modal>
          <TopBarContainer>
            <TopBarV2 createFn={launchCreate} createTitle="Create Rule"/>
          </TopBarContainer>
          <ListContainer>
            <MasterList actionFunctions={[{name: 'Delete'}]} actionFunction={deleteRule} list={structuredClone(rules).map((x: any) => {
              x.ruleName = props.products.find((y: any) => y.sku == x.ruleSku)?.product?.title?.replace(', Sample', '')
              x.replaceName = props.products.find((y: any) => y.sku == x.replaceSku)?.product?.title?.replace(', Sample', '')
              x.labelCount = x.labels?.length
              return x
            })} headers={[{name:'Rule'}, {name: 'SKU'}, {name: 'Replacement'}, {name: 'SKU'}]} keys={['ruleName', 'ruleSku', 'replaceName', 'replaceSku']} />
          </ListContainer>
      </PageStandardList>
    )
}