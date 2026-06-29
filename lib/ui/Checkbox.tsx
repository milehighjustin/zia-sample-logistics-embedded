"use client"


function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }


  export default function Checkbox(props: {label: string, required?: boolean, subText?: string, name?: string, id: string, defaultChecked?: boolean, changeAction?: (checked: boolean, id: string, name?: string) => void, index?: number}) {

    const changeAction = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(props.changeAction){
        props.changeAction(e.target.checked, props.id, props.name)
      }
    }

    return (
      <div key={props.index ? props.index : 'noKey'} className="relative flex items-start">
      <div className="flex h-6 items-center">
          <input
          id={props.id}
          name={props.name}
          type="checkbox"
          onChange={changeAction}
          defaultChecked={props.defaultChecked ? props.defaultChecked : false}
          className="h-4 w-4 rounded border-gray-300 text-sky-700 focus:ring-sky-700"
          />
      </div>
      <div className="ml-3 text-sm leading-6">
        {props.label && <label className={`mb-2 block text-sm font-medium leading-6 ${props.required == true ? 'after:content-["*"] after:ml-0.5 text-red-500' : ''}`}>
          {props.label}<span className="opacity-0">;</span>
        </label>}
          {props.subText && <p className="mt-2 text-sm">
              {props.subText}
          </p>}
      </div>
      </div>
    )
  }