import Card from "@/lib/ui/Card";
import ProductItem from "./ProductItem";

export default function PrintDisplay(props: {order: any}) {
 
    return (
      <div>
          <Card name={props.order.customer} subText={props.order?.name}>
            <div className="flex flex-col gap-5">
              {props.order.boxes.map((box: any, index: number)=>(
                <div key={index} className="flex flex-col gap-5">
                  {box.items?.map((item: any, indexK: number) => (
                    <div
                      key={item.id ? String(item.id) : `native-${indexK}-${indexK}`}
                      style={{ cursor: 'grab' }}
                      className="p-3 bg-white border border-gray-200 rounded shadow-sm select-none hover:border-gray-300 active:cursor-grabbing transition-all"
                    >
                      <ProductItem item={item} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
      </div>

    )
  }