"use client"
import {  useRef, useState } from "react"
import ziaBackendCall from "@/lib/ziaBackendCall"
import MasterList from "@/lib/ui/MasterList"
import ListContainer from "@/lib/ui/ListContainer"
import TopBarContainer from "@/lib/ui/TopBarContainer"
import TopBarV2 from "@/lib/ui/TopBarV2"
import PageStandardList from "@/lib/ui/PageStandardList"



export default function Products(props: any){
  console.log(props, 'products props')
    const [loading, setLoading] = useState<boolean>(false)
    const [products, setProducts] = useState<any[]>(props.products || [])

    const launchRefresh = () => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall(`sampleOps/syncProducts`, 'GET', {})
        if(result.error){
          shopify.toast.show(result.error)
        }
        else{
          shopify.toast.show('Products refreshed from Shopify')
          getProducts()
        }
        setLoading(false)
      },1)
    }

    const getProducts = async () => {
      setLoading(true)
      setTimeout(async ()=>{
        const result = await ziaBackendCall(`sampleOps/productList`, 'GET', {})
        if(result.error){
          shopify.toast.show(result.error)
        }
        else{
          setProducts(result.data)
          shopify.toast.show('Products refreshed from Shopify')
        }
        setLoading(false)
      },1)
    }

    const tileSizes: { [key: string]: string[] } = {
      small: ['22', '24', '26', '28','44', 'MAD', 'MOS', 'TRAP'],
      medium: ['66', '88', '48', 'AER', 'SC', 'ST', 'CR', 'KEP', 'MAN', 'ALC', 'HEX'],
      large: ['613', '1212', '1313', 'HEX', 'NOU', 'TOL', 'ZOC'],
      xLarge: [],
    }
    
    return (
      <PageStandardList>
          <TopBarContainer>
            <TopBarV2 createFn={launchRefresh} createTitle="Synchronize With Shopify"/>
          </TopBarContainer>
          <ListContainer>
            <MasterList actionFunctions={[]} actionFunction={()=>{}} list={structuredClone(products).sort((a: any, b: any) => a.product?.title.localeCompare(b.product?.title)).map((x: any) => {
              x.displayName = x.product?.title?.replace(', Sample', '')
              x.image = <img src={x.product?.featuredImage?.url} className="max-w-[20px]" alt={x.displayName} />
              const skuParts = x.sku.split('-')
              x.family = skuParts[2] || ''
              x.size = skuParts[3] || ''
              const bpRule = props.bpRules.find((y: any) => ((y.family == x.family) && (y.size == x.size)))
              x.bpRule = bpRule ? `Size: ${bpRule.tileSize} (Rule)` : (tileSizes.small.includes(x.size) ? 'Size: Small (Guess)' : (tileSizes.medium.includes(x.size) ? 'Size: Medium (Guess)' : (tileSizes.large.includes(x.size) ? 'Size: Large (Guess)' : (tileSizes.xLarge.includes(x.size) ? 'Size: X-Large (Guess)' : 'No Rule Found'))))
              const replacementRule = props.overrides.find((y: any) => (y.ruleSku == x.sku))
              const replacement = replacementRule ? props.products.find((y: any) => (y.sku == replacementRule.replaceSku)) : null
              x.replacement = replacement?.product?.title?.replace(', Sample', '') || ''
              x.coe = replacement ? replacement.inventoryItem?.countryCodeOfOrigin : x.inventoryItem?.countryCodeOfOrigin || 'None'
              x.htc = replacement ? replacement.inventoryItem?.harmonizedSystemCode : x.inventoryItem?.harmonizedSystemCode || 'None'
              return x
            })
            } headers={[{name: ''}, {name:'Name'}, {name: 'SKU'}, {name: 'Weight'}, {name: 'Packing Rule'}, {name: 'Replacement'}, {name: 'COE'}, {name: 'HTC'}]} keys={['image', 'displayName', 'sku', 'weight', 'bpRule', 'replacement', 'coe', 'htc']} />
          </ListContainer>
      </PageStandardList>
    )
}