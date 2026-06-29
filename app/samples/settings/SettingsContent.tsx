'use client';

import PageStandard from "@/lib/ui/PageStandard";
import NavigationHorizontal from "./NavigationHorizontal";
import { useState } from "react";
import Printers from "./Printers";
import BoxPacking from "./BoxPacking";
import Shipstation from "./Shipstation";
import ProductOverrides from "./ProductOverrides";
import LabelOverrides from "./LabelOverrides";
import Products from "./Products";

export default function SettingsContent(props: any) {
  console.log(props, 'content props')
  const [nav, setNav] = useState<{name: string, current: boolean}[]>([
    {name: 'Default Printers', current: true}, 
    {name: 'Products', current: false},
    {name: 'ShipStation', current: false},
    {name: 'Box Packing', current: false},
    {name: 'Overrides', current: false},
    {name: 'Label Count', current: false},
  ])


  const switchTab = (tab: {name: string, current?: boolean}) => {
    const cln = structuredClone(nav)
    const newCln = cln.map(x=>{
      if(x.name == tab.name){
        x.current = true
      }
      else{
        x.current = false
      }
      return x
    })
    setNav(newCln)
  }

  return (
    <PageStandard>
      <NavigationHorizontal tabs={nav} switch={switchTab}></NavigationHorizontal>
      {nav.find(x=>x.current)?.name == 'Default Printers' && <div className="p-5"><Printers printers={props.printers} settings={props.settings}/></div>}
      {nav.find(x=>x.current)?.name == 'Overrides' && <ProductOverrides rules={props.overrides} products={props.products}/>}
      {nav.find(x=>x.current)?.name == 'ShipStation' && <div className="p-5"><Shipstation settings={props.settings}/></div>}
      {nav.find(x=>x.current)?.name == 'Box Packing' && <BoxPacking rules={props.boxPackingRules} products={props.products}/>}
      {nav.find(x=>x.current)?.name == 'Label Count' && <LabelOverrides rules={props.labelCountRules} products={props.products}/>}
      {nav.find(x=>x.current)?.name == 'Products' && <Products bpRules={props.boxPackingRules} overrides={props.overrides} products={props.products}/>}
    </PageStandard>
  );
}