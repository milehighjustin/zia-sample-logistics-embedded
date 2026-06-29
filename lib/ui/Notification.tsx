"use client"
import { Portal } from '@headlessui/react'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'

export default function Notification(props: {
  text: string, 
  type: "error" | "success" | "warning" | "info", 
  close?: () => void
}) {

  const timer = setTimeout(()=>{
    close()
  }, 8000)

  const close = () => {
    if(props.close){
      props.close()
    }
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  return (
    <Portal>
    <div className="h-screen w-screen fixed top-0 left-0 items-start flex p-4 z-[50000]">
    <div className="w-full flex flex-row justify-end">
      <div className={classNames(
      'z-[50001] rounded-md p-4 shadow-lg ring-1 ring-inset',
      props.type == 'error' ? 'bg-red-100 ring-red-200' : '',
      props.type == 'success' ? 'bg-green-100 ring-green-200' : '',
      props.type == 'warning' ? 'bg-yellow-100 ring-yellow-200' : '',
      props.type == 'info' ? 'bg-sky-100 ring-sky-200' : '',
      )}>
      <div className="flex">
      <div className="flex-shrink-0">
      <CheckCircleIcon aria-hidden="true" className={classNames(
      'h-5 w-5',
      props.type == 'error' ? 'text-red-500' : '',
      props.type == 'success' ? 'text-green-500' : '',
      props.type == 'warning' ? 'text-yellow-500' : '',
      props.type == 'info' ? 'text-sky-500' : '',
      )}/>
      </div>
      <div className="ml-3">
      <p className={classNames(
      'text-sm font-medium ',
      props.type == 'error' ? 'text-red-800' : '',
      props.type == 'success' ? 'text-green-800' : '',
      props.type == 'warning' ? 'text-yellow-800' : '',
      props.type == 'info' ? 'text-sky-800' : '',
      )}>{props.text}</p>
      </div>
      <div className="ml-auto pl-3">
      <div className="-mx-1.5 -my-1.5">
        <button
          type="button"
          className={classNames(
            'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
            props.type == 'error' ? 'bg-red-100 text-red-500 hover:bg-red-200 focus:ring-red-600 focus:ring-offset-red-100' : '',
            props.type == 'success' ? 'bg-green-100 text-green-500 hover:bg-green-200 focus:ring-green-600 focus:ring-offset-green-100' : '',
            props.type == 'warning' ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 focus:ring-yellow-600 focus:ring-offset-yellow-100' : '',
            props.type == 'info' ? 'bg-sky-100 text-sky-500 hover:bg-sky-200 focus:ring-sky-600 focus:ring-offset-sky-100' : '',
              )}
        >
          <span className="sr-only">Dismiss</span>
          {props.close && <div onClick={close}><XMarkIcon aria-hidden="true" className="h-5 w-5" /></div>}
        </button>
      </div>
      </div>
      </div>
      </div>
    </div>

      <div className="hidden bg-red-50 bg-green-50 bg-yellow-50 bg-sky-50 ring-red-200 ring-green-200 ring-yellow-200 reing-sky-200 text-red-400 text-green-400 text-yellow-400 text-sky-400 text-red-800 text-green-800 text-yellow-800 text-sky-800 text-red-500 text-green-500 text-yellow-500 text-sky-500 hover:bg-red-100 hover:bg-green-100 hover:bg-yellow-100 hover:bg-sky-100 focus:ring-red-600 focus:ring-green-600 focus:ring-yellow-600 focus:ring-sky-600 focus:ring-offset-red-50 focus:ring-offset-green-50 focus:ring-offset-yellow-50 focus:ring-offset-sky-50">
      </div>
  </div>
    </Portal>
  )
}