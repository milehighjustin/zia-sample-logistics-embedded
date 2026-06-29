import { TfiPackage } from "react-icons/tfi";
import { FaFedex, FaUps } from "react-icons/fa6";
import ProductItem from "./ProductItem";
import { PencilIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { BsSave, BsSave2 } from "react-icons/bs";
import Button from "@/lib/ui/Button";
import InputText from "@/lib/ui/InputText";



export default function BoxDisplay(props: {box: any, boxIndex: number, orderId: string, changeWeight?: (orderId: string, boxIndex: number, newWeight: number) => void, changeTemplate?: (orderId: string, boxIndex: number, newColor: string) => void, deleteBox?: (orderId: string, boxIndex: number) => void, shippingFailed?: boolean, boxNumber: number, totalBoxes: number, orderCount: number}) {
    const [showWeightChange, setShowWeightChange] = useState(false)
    const [showTemplateChange, setShowTemplateChange] = useState(false)
    const [loading, setLoading] = useState(false)
    const [weightError, setWeightError] = useState(false)

    const box = props.box
    const changeWeight = async (formData: FormData) => {
      const newWeight: number = Number(formData.get('newWeight'))
      if(!(newWeight > 3)){
        setWeightError(true)
        return
      }
      if(props.changeWeight){
        props.changeWeight(props.orderId, props.boxIndex, newWeight)
        setShowWeightChange(false)
      }
    }

    const changeTemplate = async (formData: FormData) => {
      const newColor: string = String(formData.get('templateColor'))
      if(['green', 'blue', 'orange'].includes(newColor)){
        if(props.changeTemplate){
          props.changeTemplate(props.orderId, props.boxIndex, newColor)
          setShowTemplateChange(false)
        }
      }
    }

    const deleteBox = async () => {
      if(props.deleteBox){
        if(props.boxIndex > 0){
          props.deleteBox(props.orderId, props.boxIndex)
        }
      }
    }


    return (
      <div className="">
      {props.box && <div className="flex flex-row justify-between items-stretch gap-2">
        <div className="basis-1/3 flex flex-col justify-between items-center gap-5 ring-1 rounded-lg ring-gray-200 p-3">
        {!showTemplateChange && <div>
          <div className="text-2xl font-bold">Box {props.boxNumber}/{props.totalBoxes}</div>
          <div className="flex flex-col items-center gap-3">
            <div style={{fontSize: '65px', color: box.template.color == 'orange' ? 'orange' : (box.template.color == 'blue' ? 'blue' : 'green')}}>
              <TfiPackage />
            </div>
            <div className="flex flex-row gap-5 items-center justify-center">
            <div onClick={()=>setShowTemplateChange(true)}><PencilSquareIcon className="h-5 w-5" /> </div> 
            <div onClick={()=>deleteBox()}><TrashIcon className="h-5 w-5" /> </div> 
            </div> 
          </div>  
        </div>}
        {showTemplateChange && <form action={changeTemplate} className="flex flex-col gap-5 items-start">
            <select name="templateColor" id="tc">
              <option value="green">Green</option>
              <option value="blue">Blue</option>
              <option value="orange">Orange</option>
            </select>
              <Button color="black" icon={BsSave2} type="submit">Update Box</Button>
          </form>}
        </div>
        {Array.isArray(box?.rates) && <div className="basis-1/3 flex flex-col justify-between items-center gap-5 ring-1 rounded-lg ring-gray-200 p-3">
          <div className="text-2xl font-bold w-full text-center">
            {box.rates[0].serviceName}
          </div>
          <div style={{fontSize: '75px', display: 'flex', justifyContent: 'end'}}>
            {box.rates?.length > 0 && <div>
              {box.rates[0].serviceName.slice(0,5).toLowerCase() == 'fedex' && <FaFedex />}  
            </div>}
            {box.rates.length > 0 && <div>
              {box.rates[0].serviceName.slice(0,3).toLowerCase() == 'ups' && <FaUps />}  
            </div>}
          </div>
        </div>}
        <div className="basis-1/3 flex flex-col justify-start items-center gap-5 ring-1 rounded-lg ring-gray-200 p-3">
          <div className="text-2xl font-bold flex flex-row items-center gap-2">
            <span>{(box.weight*1).toFixed(1)} lbs</span> 
            <div>
              <div onClick={()=>setShowWeightChange(true)}><PencilSquareIcon className="h-5 w-5" /> </div>  
            </div>
          </div>
          {!showWeightChange && <div>
            (Tare: {box.template.tare} lbs)
          </div>}
          {showWeightChange && <form action={changeWeight} className="flex flex-col items-start">
              <InputText name="newWeight"  label="New Weight (lbs)" />
              <Button color="black" icon={BsSave2} type="submit">Update Weight</Button>
              {weightError && <div className="text-red-600">Invalid Amount</div>}
          </form>}
        </div>
      </div>}
      {props.shippingFailed && <div style={{width: '100%', textAlign: 'center'}}>
        <div style={{fontWeight: 'bold'}}>Order not yet synchronized with shipstation or has already shipped.</div> 
      </div>}
    <div className="flex flex-col gap-2 mt-5">
        {box.items.map((item: any, indexK:number)=>(
          <div key={indexK}>
            <ProductItem item={item} />
          </div>
        ))}
    </div>
    </div>
    )
  }