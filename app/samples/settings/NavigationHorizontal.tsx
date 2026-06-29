  "use client"

import InputCombobox from "@/lib/ui/InputCombobox"

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  
  export default function NavigationHorizontal(props: { 
      tabs: { name: string, current?: boolean, href?: string, _id?: string }[], 
      switch?: (tab: { name: string, current?: boolean, href?: string, _id?: string }) => void, 
      bgColor?: string, 
      color?: string, 
      small?: boolean 
  }) {

    const selectTab = (tab: { name: string, current?: boolean, href?: string, _id?: string } | undefined) => {
      if(tab && props.switch){
        props.switch(tab)
      }
      else if(tab?.href){
        window.location.href = '?tab='+tab?.name?.toLowerCase()
      }
    }

    return (
      <div>
        <div className="md:hidden mt-1">
          <InputCombobox defaultValue={props.tabs.find((tab) => tab.current)?.name} list={props.tabs.map((tab) => {
            return {...tab, value: tab.name}            
          })} selectedItem={(value)=>{selectTab(props.tabs.find((x:any)=>x.name == value))}} />
        </div>
        <div className="hidden md:block w-full">
          <div className="hidden bg-gray-50 bg-gray-700 text-gray-700 bg-gray-100 text-gray-100 bg-sky-50 bg-sky-700 text-sky-700 bg-sky-100 text-sky-100 bg-red-50 bg-red-700 text-red-700 bg-red-100 text-red-100 bg-green-50 bg-green-700 text-green-700 bg-green-100 text-green-100"></div>
          <div className={classNames(
            'py-2 px-2 rounded-lg',
            props.bgColor ? `bg-${props.bgColor}-50` : ''
          )} >
            <nav className="-mb-px flex gap-3 " aria-label="Tabs">
              {props.tabs.map((tab, tabIndex) => (
                 <div
                  key={tabIndex}
                  onClick={() => selectTab(tab)}
                  className={classNames(
                    tab.current
                      ? (props.color ? (`bg-${props.color}-700 text-${props.color}-100`) : 'bg-gray-700 dark:bg-white/25 text-gray-100 dark:text-white')
                      : (props.color ? (`bg-${props.color}-100 text-${props.color}-700`) : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white'),
                    'cursor-pointer rounded-full px-3 py-2 text-sm font-medium',
                    props.small ? 'text-xs' : 'text-sm'
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {tab.name}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
    )
  }

