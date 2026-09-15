"use client"

import { FaAngleRight } from "react-icons/fa"
import InputCombobox from "./InputCombobox"

export default function PageStandardSideNav(props : {
    nav: any[],
    children: React.ReactNode,
    ringSide?: boolean,
    ringContent?: boolean,
    clickAction?: (item: any) => void
  }) {

  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ')
  }

  const clickAction = (item: any) => {
      if(props.clickAction){
          props.clickAction(item)
      }
  }

  return (
    <div className="h-full w-full flex sm:flex-row flex-col gap-3 items-stretch p-1 overflow-y-auto scrollbar">
      <div className={`w-full sm:w-1/4 sm:h-full sm:overflow-y-auto scrollbar ${props.ringSide ? 'border-1 border-slate-900/20 rounded-lg p-4' : ''}`}>
        <ul className="hidden sm:flex flex-col gap-1 list-none">
          {props.nav.filter((item: any)=>{
            if(item.current){
              return true
            }
            if(props.nav.find((x:any) => x.name == item.parent)?.current){
              return true
            }
            if(item.parent){
              const currentItem = props.nav.find((x:any) => x.current)
              if(currentItem?.parent == item.parent){
                return true
              }
              return false
            }
            return true
          }).map((item) => (
              <li key={item?.name || item?.id || item?.label}>
                  <div
                      onClick={()=>clickAction(item)}
                      className={classNames(
                      item.current
                          ? 'bg-sky-800 text-white'
                          : 'dark:text-gray-100 text-gray-700 hover:text-white hover:bg-sky-800',
                      'cursor-pointer group flex items-center gap-x-3 rounded-md p-2 px-5 text-sm leading-6 font-semibold'
                      )}
                  >
                      {item.icon && <item.icon
                      className={classNames(
                          item.current ? 'text-white' : 'dark:text-gray-100 text-gray-400 group-hover:text-white',
                          'h-5 w-5 shrink-0'
                      )}
                      aria-hidden="true"
                      />}
                      {item.parent && <FaAngleRight
                      className={classNames(
                          item.current ? 'text-white' : 'dark:text-gray-100 text-gray-400 group-hover:text-white',
                          'h-5 w-5 shrink-0'
                      )}
                      aria-hidden="true"
                      />}
                      {item.name}
                  </div>
              </li>
          ))}
        </ul>
        <div className="sm:hidden mt-1">
          <InputCombobox defaultValue={props.nav.find((tab) => tab.current)?.name} list={props.nav.map((tab) => {
            return {...tab, value: tab.name}            
          })} selectedItem={(value)=>{clickAction(props.nav.find((x:any)=>x.name == value))}} />
        </div>

      </div>
      <div className={`w-full h-full overflow-y-auto scrollbar sm:w-3/4 sm:h-full ${props.ringContent ? 'border-1 border-slate-900/20 rounded-lg p-4' : ''}`}>
        {props.children}
      </div>
    </div>
  )
}