export default function ProductItem(props: {item: any}) {
    return (
      <div className="flex flex-row justify-between">
        <div className="flex">
          <div className="mr-4 shrink-0 self-center">
            <img width="30px" src={props.item?.product?.featuredImage?.url} />
          </div>
          <div>
            <h4 className="text-sm font-bold">{props.item?.product?.title}</h4>
            <p className="mt-1 text-xs">
              {props.item?.sku}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold">
          {props.item.recordedWeight} lbs {props.item.variant?.inventoryItem?.measurement?.weight?.value*1 <= 0 && <div>(estimated)</div> }
        </div>
      </div>

    )
  }