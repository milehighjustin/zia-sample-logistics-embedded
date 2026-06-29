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



export default function BoxPacking(props: any){
    const [loading, setLoading] = useState<boolean>(false)
    const [alert, setAlert] = useState<any>(undefined)
    const [showCreate, setShowCreate] = useState<boolean>(false)
    const [rules, setRules] = useState<any>(props.rules)
    const [families, setFamilies] = useState<any>(props.products?.reduce((acc: any[], product: any) => {
      if (!acc.includes(product.sku.split('-')[2])) {
        acc.push(product.sku.split('-')[2]);
      }
      return acc;
    }, []).filter((x: any) => x))
    const [sizes, setSizes] = useState<any>(undefined)
    const [allowedBoxes, setAllowedBoxes] = useState<any>(undefined)


    const famRef = useRef<any>(null)
    const sizeRef = useRef<any>(null)
    const tileSizeRef = useRef<any>(null)

    const TileSize = (props: any) => {
      const factor = props.factor
      return (
        <div className="ring-1 ring-gray-200 rounded-md p-2 flex flex-col gap-2">
        <div className="font-bold text-xl">{props.name} ({props.factor})</div>
        <ul>
          <li>Green: {Math.floor(16/factor)}</li>
          <li>Blue: {Math.floor(32/factor)}</li>
          <li>Orange: {Math.floor(64/factor)}</li>
        </ul>
      </div>
      )
    }


    const addRule = async () => {
      const ruleObj = {
        family: famRef.current?.value,
        size: sizeRef.current?.value,
        tileSize: tileSizeRef.current?.value,
      }
      if(!(ruleObj.family) || !(ruleObj.size) || !(ruleObj.tileSize)){
        shopify.toast.show('Please ensure all fields are selected') 
        return
      }
      if(rules.find((y: any) => ((y.family == ruleObj.family) && (y.size == ruleObj.size)))){
        shopify.toast.show('Rule exists. Delete existing rule to recreate rule.', { duration: 3000 })
        return 
      }
      setLoading(true)
      setTimeout(async ()=>{
          const result = await ziaBackendCall('sampleOps/boxPacking', 'POST', ruleObj)
          setLoading(false)
          if(result.data && result.data['_id']){
            const cln = structuredClone(rules)
            const newCln = cln.unshift(result.data)
            setRules(cln)
            shopify.toast.show('Successfully added rule', { duration: 3000 })
            cancelCreate()
          }
          else{
            shopify.toast.show(result.error ? result.error : 'Error adding rule', { duration: 3000 })
          }
      },1)
    }

    const familySelected = (fam: any) => {
      const famName = famRef.current?.value
      console.log('famName', famName)
      const famProducts = props.products.filter((x: any) => x.sku.split('-')[2] == famName)
      console.log('famProducts', famProducts)
      const sz = famProducts?.reduce((acc: any[], product: any) => {
        if (!acc.includes(product.sku.split('-')[3])) {
          acc.push(product.sku.split('-')[3]);
        }
        return acc;
      }, []).filter((x: any) => x).filter((x: any) => {
        if(rules.find((y: any) => ((y.family == famName) && (y.size == x)))){
          return false
        }
        else{
          return true
        }
      })
      setSizes(sz)
    }

    const sizeSelected = (size: any) => {
      setAllowedBoxes([
        {name: 'Green', value: 'green'},
        {name: 'Blue', value: 'blue'},
        {name: 'Orange', value: 'orange'}
      ])
    }

    const cancelCreate = () => {
      setShowCreate(false)
      setSizes(undefined)
      setAllowedBoxes(undefined)
    }
    
    const deleteRule = (action:any, rule: any) => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall(`sampleOps/boxPacking/${rule['_id']}`, 'DELETE', {})
        if(result.error){
          shopify.toast.show(result.error ? result.error : 'Error deleting rule', { duration: 3000 })
        }
        else{
          const cln = structuredClone(rules)
          const newCln = cln.filter((x: any) => x['_id'] != rule['_id'])
          setRules(newCln)
        }
        setLoading(false)
      },1)
    }

    const launchCreate = () => {
      setShowCreate(true)
    }

    
    return (
      <PageStandardList>
        <Modal open={showCreate} onHide={()=>setShowCreate(false)}>
      <TitleBar title={'Create a Box Packing Rule'}>
      </TitleBar>
            <div className="flex sm:flex-row flex-col gap-10">
              <div className="w-full sm:w-1/3">
                <div className="my-5 ring-1 ring-gray-300 p-5 flex flex-col gap-5 rounded-md">
                  <div className="w-full text-2xl font-bold">Tile Size (Factor)</div>
                  <div>Use this guide to determine the factor. The factor is the maximum number of each tile size allowed in each box size</div>
                  <TileSize name="A" factor={1}/>
                  <TileSize name="B" factor={1.33} />
                  <TileSize name="C" factor={1.6} />
                  <TileSize name="D" factor={1.8} />
                  <TileSize name="E" factor={2} />
                  <TileSize name="F" factor={2.7} />
                  <TileSize name="G" factor={4} />
                  <TileSize name="H" factor={5.3} />
                  <TileSize name="I" factor={6} />
                  <TileSize name="J" factor={8} />
                  <TileSize name="K" factor={10.67} />
                  <TileSize name="L" factor={12} />
                </div>
              </div>
              <div className="grow">
                {showCreate &&  <div className="my-5 ring-1 ring-gray-300 p-5 rounded-md">
                  <div className="p-5 relative mb-10">
                    <div className="flex flex-col gap-5">
                      <div>To create a rule, select the applicable SKU parts and set the tile size according to the guide to the left</div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="size">Family</label>
                        <select name="size" defaultValue={""} onChange={familySelected} ref={famRef} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Family</option>
                          {families.map((x: string)=>{
                            return <option key={x} value={x}>{x}</option>
                          })}
                        </select>
                      </div>
                      {sizes && <div className="flex flex-col gap-2">
                        <label htmlFor="size">Size</label>
                        <select name="size" defaultValue={""} onChange={sizeSelected} ref={sizeRef} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Size</option>
                          {sizes.map((x: string)=>{
                            return <option key={x} value={x}>{x}</option>
                          })}
                        </select>
                      </div>}
                      {allowedBoxes && <div className="flex flex-col gap-2">
                        <label htmlFor="tileSize">Select a Tile Size</label>
                        <div className="text-sm">Use the chart above to determine the size of the tile for box packing purposes.</div>
                        <select name="tileSize" ref={tileSizeRef} defaultValue={""} className="ring-1 ring-gray-300 rounded-md p-2">
                          <option value="" disabled hidden>Select a Size</option>
                          {[
                            {name: 'A', value: 'a'},
                            {name: 'B', value: 'b'},
                            {name: 'C', value: 'c'},
                            {name: 'D', value: 'd'},
                            {name: 'E', value: 'e'},
                            {name: 'F', value: 'f'},
                            {name: 'G', value: 'g'},
                            {name: 'H', value: 'h'},
                            {name: 'I', value: 'i'},
                            {name: 'J', value: 'j'},
                            {name: 'K', value: 'k'},
                            {name: 'L', value: 'l'},
                          ].map((x: any)=>{
                            return <option key={x.value} value={x.value}>{x.name}</option>
                          })}
                        </select>
                      </div>}

                    </div>

                    <div className="p-3 w-full flex flex-row items-center justify-end gap-5">
                      <Button clickAction={cancelCreate} loading={loading} color="black">Cancel</Button>
                      <Button loading={loading} color="black" clickAction={addRule}>Create Rule</Button>
                    </div>
                  </div>
                </div>}
              </div>
            </div>

        </Modal>
          <TopBarContainer>
            <TopBarV2 createFn={launchCreate} createTitle="Create Rule"/>
          </TopBarContainer>
          <ListContainer>
            <MasterList actionFunction={deleteRule} actionFunctions={[{name: 'Delete'}]} list={structuredClone(rules).map((x: any)=>{
              x.tileSize = x.tileSize.toUpperCase()
              return x
            })} headers={[{name:'Family'}, {name: 'Size'}, {name: 'Tile Size'}]} keys={['family', 'size', 'tileSize']} />
          </ListContainer>
      </PageStandardList>
    )
}