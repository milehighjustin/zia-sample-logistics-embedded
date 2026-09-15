"use client"
import { useState, useRef, useEffect } from 'react'
import { Switch } from '@headlessui/react'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function InputToggle(props: { 
  label?: string, 
  hideLabel?: boolean, 
  required?: boolean,
  killMt?: boolean, 
  refX?: React.RefObject<HTMLInputElement> | null, 
  name?: string, 
  value?: string, 
  color?: string, 
  enabled?: boolean, 
  change?: (e: boolean) => void, 
  subText?: string }) {

  const [enabled, setEnabled] = useState(props.enabled)

  useEffect(()=>{
    if(props.refX){
      props.refX.current.value = props.enabled ? 'true' : 'false'
    }
  }, [props.enabled])

  const change = (e: boolean) => {
    setEnabled(e)
    if(props.refX){
        props.refX.current.value = e ? 'true' : 'false'
    }
    if(props.change){
        props.change(e)
    }
  }

  return (
    <div>
    <input type="hidden" ref={props.refX ? props.refX : null} />
    {props.label && <label className={`mb-2 block text-sm leading-6 font-bold ${props.required == true ? 'after:content-["*"] after:ml-0.5 text-red-500' : ''}`}>
      {props.label}<span className="opacity-0">;</span>
    </label>}
    <div className={props.killMt ? '' : "mt-2"}>
    <Switch
      defaultChecked={enabled}
      id={`switch-${props.name ? props.name : 'switch'}`}
      onChange={change}
      name={props.name}
      value={props.value}
      className={classNames(
        enabled ? (props.color ? props.color : 'bg-sky-700') : 'bg-gray-200',
        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none'
      )}
    >
      <span className="sr-only">{props.label}</span>
      <div className="hidden bg-sky-700 bg-red-700 bg-black bg-green-700 bg-yellow-700"></div>
      <span
        aria-hidden="true"
        className={classNames(
          enabled ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
        )}
      />
    </Switch>
    </div>
    {props.subText && <p className="mt-2 text-xs text-gray-500">
        {props.subText}
    </p>}
    </div>
  )
}