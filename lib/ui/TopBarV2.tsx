"use client"

import { MagnifyingGlassIcon, PlusCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline"
import { BiLeftArrow, BiRightArrow } from "react-icons/bi"
import Button from "./Button"
import InputText from "./InputText"
import InputCombobox from "./InputCombobox"
import { useState } from "react"
import { HiArrowsUpDown } from "react-icons/hi2"



function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function TopBarV2(props:{
    loading?: boolean,
    title?: string,
    serverSearch?: boolean,
    searchFn?: (value:string) => void,
    liveSearch?: boolean,
    searchPlaceholder?: string,
    sortFn?: (value:string) => void,
    sortList?: {value:string, name:string}[],
    sortValue?: string,
    filterFn?: (value:string) => void,
    filterList?: {value:string, name:string}[],
    helpContent?: React.ReactNode,
    filterValue?: string,
    filterTwoFn?: (value:string) => void,
    filterTwoList?: {value:string, name:string}[],
    filterTwoValue?: string,
    prevFn?: () => void,
    nextFn?: () => void,
    switchDirFn?: () => void,
    activeFn?: (value:boolean) => void,
    createList?: {value:string, name:string}[],
    createFn?: (value?:string | undefined) => void,
    createTitle?: string,
    additionalButtonsLeft?: {name: string, action: () => void, color?: string, icon?: React.ElementType}[],
    additionalButtons?: {name: string, action: () => void, color?: string, icon?: React.ElementType}[],
    additionalButtonsRight?: {name: string, action: () => void, color?: string, icon?: React.ElementType}[],
    marginBottom?: boolean
}) {
  const [loading, setLoading] = useState(props.loading || false)
  const [showHelp, setShowHelp] = useState(false)
    const searchSubmit = (formData: FormData) => {
        const term = formData.get('term') as string
        if(props.searchFn){
            props.searchFn(term)
        }
    }

    const liveSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(props.searchFn && props.liveSearch){
            props.searchFn(e.target.value)
        }
    }

    const prevFn = () => {
        if(props.prevFn){
            props.prevFn()
        }
    }
    
    const nextFn = () => {
        if(props.nextFn){
            props.nextFn()
        }
    }

    const launchCreate = (value?: string | undefined) => {
        if(props.createFn){
            props.createFn(value)
        }
    }

    const activeFn = (value: boolean) => {
        if(props.activeFn){
            props.activeFn(value)
        }
    }

    const CreateButton = () => {
        return (
            <Button size="sm" loading={loading} color="green"  icon={PlusCircleIcon} clickAction={!props.createList ? launchCreate : ()=>{}}>
                {props.createTitle} 
            </Button>
        )
    }

    const launchHelp = () => {
      setShowHelp(true)
    }


  return (
    <div className={classNames(
      props.marginBottom ? 'mb-12' : '',
      "flex items-center justify-between gap-5 flex-wrap-reverse w-full rounded-lg"
    )}>
    <div className="flex sm:flex-row flex-col gap-5 items-center">
        {props.additionalButtonsLeft && props.additionalButtonsLeft.map((btn, idx)=>(
          <Button size="md" color={btn.color || 'gray'} icon={btn.icon} key={idx} clickAction={()=>btn.action()}>
            {btn.name}    
          </Button>
        ))}
        {props.title && <h2 className="text-2xl font-bold leading-7 text-gray-700 dark:text-white">{props.title}</h2>}
        {(props.serverSearch || props.liveSearch) && <form action={searchSubmit} >
                <div className="flex flex-row gap-2 items-center h-[40px]">
                <InputText hideLabel={true} name="term" rightIcon={!props.serverSearch ? MagnifyingGlassIcon : undefined} placeholder={props.searchPlaceholder} changeEvent={liveSearch}/>
                {props.serverSearch && <Button size="sm" type="submit"> <MagnifyingGlassIcon className="h-4 w-6"/> </Button>}
                </div>
        </form>}
        {props.sortFn && <InputCombobox hideLabel={true} list={props.sortList as {value: string, name: string}[]} selectedItem={props.sortFn} defaultValue={props.sortValue} placeholder="Sort By" />}
        {props.filterFn && <InputCombobox hideLabel={true} list={props.filterList as {value: string, name: string}[]} selectedItem={props.filterFn} defaultValue={props.filterValue} placeholder="Filter Results" />}
        {props.filterTwoFn && <InputCombobox hideLabel={true} list={props.filterTwoList as {value: string, name: string}[]} selectedItem={props.filterTwoFn} defaultValue={props.filterTwoValue} placeholder="Filter Results" />}
        {props.additionalButtons && props.additionalButtons.map((btn, idx)=>(
          <Button size="sm" color={btn.color || 'gray'} icon={btn.icon} key={idx} clickAction={()=>btn.action()}>
            {btn.name}    
          </Button>
        ))}
    </div>
    <div className="gap-5 flex items-center sm:items-center justify-end flex-row">
      {props.switchDirFn && <div>
          <HiArrowsUpDown className="text-gray-700 h-5 w-5 cursor-pointer" onClick={props.switchDirFn} />
        </div>}
      {props.prevFn && <div>
          <BiLeftArrow className="text-gray-700 h-5 w-5 cursor-pointer" onClick={prevFn} />
        </div>}
      {props.nextFn && <div>
          <BiRightArrow className="text-gray-700 h-5 w-5 cursor-pointer" onClick={nextFn} />
        </div>}
      {props.helpContent && <div onClick={launchHelp}><QuestionMarkCircleIcon className="h-7 w-7 cursor-pointer" /></div>}
      <div className="">
        {(props.createList == undefined && (props.createFn != undefined)) &&
        <CreateButton />}
        {Array.isArray(props.createList) && <div></div>}
        {props.additionalButtonsRight && <div className="inline-flex gap-2">
          {props.additionalButtonsRight.map((btn, idx)=>(
            <Button size="sm" color={btn.color || 'gray'} icon={btn.icon} key={idx} clickAction={()=>btn.action()}>
              {btn.name}    
            </Button>
          ))}
        </div>}
      </div>
    </div>
  </div>
  )
}