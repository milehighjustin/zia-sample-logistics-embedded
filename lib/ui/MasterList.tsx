"use client"
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react"
import { ChevronUpDownIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { useLayoutEffect, useRef, useState } from "react"


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}


export default function MasterList(props: {
  headers: {name: string, sortable?: boolean, text?: string}[],
  hideHeader?: boolean,
  keys: string[],
  list: any[],
  actionFunctions: {name: string, headerName?: string}[],
  headerClick?: (item: any) => void,
  actionFunction?: (action: {name: string}, item: any) => void,
  selectedItemsSubmitted?: (items: any[]) => void,
  liveSelected?: (items: any[]) => void,
  selectedTitle?: string,
  shadedRows?: boolean,
  textXs?: boolean,
  cellPy?: number,
  cellPx?: number,
  box?: boolean,
  stickyX?: boolean,
  alignFinalRight?: boolean,
  killMt?: boolean,
  headerHeight?: number,
  rowClick?: boolean,
}) {
  const checkbox = useRef<HTMLInputElement>(null)
  const [checked, setChecked] = useState(false)
  const [indeterminate, setIndeterminate] = useState(false)
  const [selected, setSelected] = useState<any[]>([])
  
  useLayoutEffect(() => {
    if(props.box == true){
      const isIndeterminate = selected.length > 0 && selected.length < props.list?.length
      setChecked(selected.length === props.list?.length)
      setIndeterminate(isIndeterminate)
      if (checkbox.current) {
        checkbox.current.indeterminate = isIndeterminate
      }
    }
    if(props.liveSelected){
      props.liveSelected(selected)
    }
  }, [selected])

  function toggleAll() {
    setSelected(checked || indeterminate ? [] : (props.list ? props.list : []))
    setChecked(!checked && !indeterminate)
    setIndeterminate(false)
  }


  const headerClick = (item: any) => {
    if(props.headerClick){
      props.headerClick(item)
    }
  }

  const actionFunctionLocal = (action: {name: string}, item: any) => {
    if(props.actionFunction){
      props.actionFunction(action, item)
    }
  }

  const selectedItemsSubmitted = () => {
    if(props.selectedItemsSubmitted){
      setSelected([])
      setChecked(false)
      props.selectedItemsSubmitted(selected)
    }
  }


  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="hidden mt-2 py-2 py-1 py-4 py-3 py-5 py-6 px-1 px-2 px-3 px-4 px-5 px-5"></div>
      {((selected.length > 0) && props.selectedTitle) && <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50">
        <div onClick={selectedItemsSubmitted} className={classNames("cursor-pointer px-5 py-2  text-base font-semibold text-white rounded-full m-4 backdrop-blur-sm backdrop-filter bg-black/75 dark:bg-white/5")}>{props.selectedTitle}</div>  
      </div>}
      <div className={`${props.killMt ? '' : 'mt-8'} flow-root`}>
        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
          <div className={`inline-block min-w-full ${props.killMt ? '' : 'py-2'} align-middle`}>
            <table className="min-w-full border-separate border-spacing-0 p-[.5px]">
              {props.hideHeader != true && <thead>
                <tr className={props.headerHeight ? `h-${props.headerHeight}` : ''}>
                  {props.box && <td scope="col" className="px-3 sticky top-0 z-10 border-b border-gray-300 dark:border-gray-50/10 py-3.5 text-sm text-gray-900 dark:text-white backdrop-blur-lg backdrop-filter">
                    <input
                      type="checkbox"
                      className={classNames(
                        'absolute h-4 w-4 rounded border-gray-300 text-sky-700 focus:ring-sky-700',
                      )}
                      ref={checkbox}
                      checked={checked}
                      onChange={toggleAll}
                    />
                  </td>}
                  {props.headers.map((header, indexH)=>{
                    return (
                      <th
                        key={indexH}
                        scope="col"
                        className={classNames(
                          indexH + 1 == props.headers?.length ? (props.actionFunctions.length > 0 ? 'text-left' : (props.alignFinalRight ? 'text-right' : 'text-left')) : 'text-left',
                          props.textXs ? 'text-xs' : 'text-sm',
                          indexH == 0 ? 'font-semibold' : '',
                          props.cellPy ? `p-${props.cellPy}` : 'py-3.5',
                          props.cellPx ? `px-${props.cellPx}` : 'px-3',
                          'sticky top-0 z-10 border-b border-gray-300 dark:border-gray-50/10 text-sm backdrop-blur-lg backdrop-filter'
                        )}
                      >
                        <div className="flex items-start flex-col w-full gap-2">
                          <div className="w-full">{header.name}</div>
                          {(header.text || header.sortable) && <div className="pt-2 border-t-2 border-gray-300 flex flex-row justify-start items-center w-full gap-2">
                            {header.sortable && <div onClick={() => headerClick(header)}><ChevronUpDownIcon className="h-4 w-4 text-gray-400" /></div>}
                            {header.text && <Popover>
                              <PopoverButton className="">
                                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                              </PopoverButton>
                              <PopoverPanel
                                transition
                                anchor="bottom"
                                className="bg-gray-900/90 dark:bg-white/5 p-4 rounded text-white text-base max-w-xs shadow-lg"
                              >
                                {header.text}
                              </PopoverPanel>
                            </Popover>}
                          </div>}
                        </div>
                      </th>
                    )
                  })}
                  {props.actionFunctions.map((action, indexA)=>{
                    return (
                      <th
                        key={indexA}
                        scope="col"
                        className={classNames(
                          props.textXs ? 'text-xs' : 'text-sm',
                          props.cellPy ? `p-${props.cellPy}` : 'py-3.5',
                          props.cellPx ? `px-${props.cellPx}` : 'px-3',
                          'text-right sticky top-0 z-10 border-b border-gray-300 dark:border-gray-50/10 text-sm dark:text-white  backdrop-blur-lg backdrop-filter'
                        )}
                      >
                        {action.headerName}
                      </th>
                    )
                  })}
                </tr>
              </thead>}
              <tbody>
                {props.list.map((item, indexI) => (
                  <tr 
                    key={indexI} 
                    onClick={props.rowClick ? () => actionFunctionLocal({ name: 'rowClick' }, item) : undefined}
                    className={classNames(
                    (((props.shadedRows) && (!item.isDivider) && !selected.includes(item) && (indexI % 2 === 0)) ? 'dark:bg-white/5 bg-gray-50' : ''),
                    item.isDivider ? 'bg-gray-700 dark:bg-white/5 text-white' : '',
                    selected.includes(item) ? 'bg-sky-50' : '' ,
                    props.rowClick ? 'cursor-pointer' : '', 
                  )}>
                    {props.box && <td className="relative w-[10px] px-5">
                      {selected.includes(item) && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-sky-700" />
                      )}
                      <input
                        type="checkbox"
                        className="absolute -mt-2 h-4 w-4 rounded border-gray-300 text-sky-700 focus:ring-sky-700"
                        value={item.id}
                        checked={selected.includes(item)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, item]
                              : selected.filter((p) => p !== item)
                          )
                        }
                      />
                    </td>}
                  {props.keys.map((key,indexK )=> (
                    <td key={indexK} 
                    scope="col"
                    className={classNames(
                      item.isDivider ? 'bg-gray-700 dark:bg-white/50 text-white' : '',
                      indexK + 1 == props.headers?.length ? (props.actionFunctions.length > 0 ? 'text-left' : (props.alignFinalRight ? 'text-right' : 'text-left')) : 'text-left',
                      indexK == 0 ? "text-left whitespace-nowrap text-sm font-medium text-gray-900" : "whitespace-normal",
                      indexK == 0 ? (props.stickyX ? "overflow-x-auto sticky left-0 backdrop-blur-sm backdrop-filter" : "px-3") : '',
                      props.textXs ? 'text-xs' : 'text-sm',
                      item.textColor ? `text-${item.textColor}-700` : 'dark:text-gray-50 text-gray-600',
                      props.cellPy ? `p-${props.cellPy}` : 'py-3.5',
                      props.cellPx ? `px-${props.cellPx}` : 'px-3',
                    )}
                    >
                        {(key == 'status') && 
                          <div>{item[key]}</div>
                        }

                        {(!['status'].includes(key) && item.primaryHref == undefined)  ? item[key] : ''}

                        {(!['status'].includes(key) && item.primaryHref != undefined) && <a href={item.primaryHref}>
                          {item.isDivider ? item.title : item[key]}
                        </a> }
                    </td>
                  ))}
                  {props.actionFunctions.map((action, indexA)=>{
                    return (
                    <td key={indexA} 
                    scope="col"
                    onClick={()=>actionFunctionLocal(action, item)}
                    className={classNames(
                      "cursor-pointer whitespace-nowrap text-right text-semibold",
                      props.textXs ? 'text-xs' : 'text-sm',
                      item.textColor ? `text-${item.textColor}-700` : 'text-gray-400',
                      props.cellPy ? `p-${props.cellPy}` : 'py-3.5',
                      props.cellPx ? `px-${props.cellPx}` : 'px-3',
                    )}
                    >
                      <div>{action.name}</div>
                    </td>
                    )
                  })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
