import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Card(props: {
    name: string,
    subText?: string,
    imageUrl?: string,
    color?: string,
    actionText?: string,
    actionFn?: () => void,
    menu?: {title:string, id:string, data: any}[],
    menuSelect?: (item:{title:string, data: any, id:string}) => void,
    rows?: {name:string, text:string, color?:string}[]
    children?: React.ReactNode
}) {

    const menuSelect = (item: {title:string, data: any, id:string}) => {
        if(props.menuSelect){
            props.menuSelect(item)
        }
    }

    const actionFn = () => {
        if(props.actionFn){
            props.actionFn()
        }
    }


  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
    <div className="hidden br-green-50 border-green-900/5 text-green-900 text-green-700 text-green-500 text-green-400 hover:text-green-500 bg-red-50 border-red-900/5 text-red-900 text-red-700 text-red-500 text-red-400 hover:text-red-500 bg-blue-50 border-blue-900/5 text-blue-900 text-blue-700 text-blue-500 text-blue-400 hover:text-blue-500"></div>
    <div className={classNames(
      'flex items-center justify-between gap-x-4 border-b p-6',
      props.color ? `bg-${props.color}-50 border-${props.color}-900/5` : 'bg-black border-gray-900/5'
    )}>
      {props.imageUrl && <img
        src={props.imageUrl}
        className="h-12 w-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10"
      />}
      <div className={classNames(
        "text-sm font-medium leading-6 flex flex-col",
        props.color ? `text-${props.color}-900` : 'text-gray-50'
      )
      }>
        <div>{props.name}</div>
        {props.subText && <div className="text-xs">{props.subText}</div>}
      </div>
      {props.actionFn && <div className={classNames(
        "cursor-pointer text-right text-xs ",
        props.color ? `text-${props.color}-400 hover:text-${props.color}-500`: "text-gray-50 hover:text-gray-100"
      )} onClick={actionFn}>
        {props.actionText}
      </div>}
      {props.menu && <Menu as="div" className="relative ml-auto">
        <MenuButton className={classNames(
          "-m-2.5 block p-2.5",
          props.color ? `text-${props.color}-400 hover:text-${props.color}-500` : 'text-gray-50 hover:text-gray-100'
        )}>
          <span className="sr-only">Menu</span>
          <EllipsisHorizontalIcon aria-hidden="true" className="h-5 w-5" />
        </MenuButton>
        <MenuItems
          transition
          className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
        >
          {props.menu.map((menuItem, indexM) => (
          <MenuItem key={indexM}>
          <div onClick={()=>menuSelect(menuItem)} className={classNames(
              "cursor-pointer block px-3 py-1 text-sm leading-6 text-gray-900 data-[focus]:bg-gray-50"
          )}>
            {menuItem.title}
          </div>
        </MenuItem>
          ) )}
        </MenuItems>
      </Menu>}

    </div>
    {props.rows && <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
      {props.rows.map((row, indexR)=>(
          <div key={indexR} className="flex justify-between gap-x-4 py-3">
              <dt  className={classNames(
                row.color ? `text-${row.color}-500` : 'text-gray-500'
              )}>{row.name}</dt>
              <dd className={classNames(
                row.color ? `text-${row.color}-700` : 'text-gray-700'
              )}>
                  {row.text}
              </dd>
          </div>
      ))}
    </dl>}
      <div className="p-3">
        {props.children}
      </div>
  </div>
  )
}