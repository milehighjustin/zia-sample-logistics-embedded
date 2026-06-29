"use client"
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, useMemo, useTransition } from 'react'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function InputCombobox(props: {
    list:  {value: string, name: string} [],
    defaultValue?: string,
    subText?: string,
    selectedItem?: (value: string) => void,
    hideLabel?: boolean,
    white?: boolean,
    icon?: string,
    textColor?: string,
    big?: boolean,
    disabled?: boolean,
    preventTyping?: boolean,
    autoComplete?: string,
    optionsUp?: boolean,
    name?: string,
    required?: boolean,
    label?: string,
    placeholder?: string,
    shadowId?: string,
    refX?: any,
    grow?: boolean,
    searchable?: boolean,
    typing?: boolean
}) {
  const [query, setQuery] = useState<string>('')
  const [selected, setSelected] = useState<{value: string, name: string} | null>(() => {
    if (props.defaultValue && props.list) {
      return props.list.find(x => x.value === props.defaultValue) || null
    }
    return null
  })
  
  const [mounted, setMounted] = useState<boolean>(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setMounted(true)
  }, [])

  const listMap = useMemo(() => {
    return new Map(props.list.map(item => [item.value, item]))
  }, [props.list])

  useEffect(() => {
    if (props.defaultValue) {
      const match = listMap.get(props.defaultValue)
      if (match) setSelected(match)
    }
  }, [props.defaultValue, listMap])

  // FIX 1: Normalize everything to lowercase and scan anywhere inside the text string
  const filteredList = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    
    // If text entry is empty or the input isn't interactive, skip filtering logic
    if (cleanQuery === '' || (!props.searchable && !props.typing)) return props.list

    return props.list.filter((item) => 
      item.name.toLowerCase().includes(cleanQuery) || 
      item.value.toLowerCase().includes(cleanQuery)
    )
  }, [query, props.list, props.searchable, props.typing])

  if (!mounted) return null
  
  const changeFunction = (value: any) => {
    setSelected(null)
    setTimeout(() => {
      if (value) {
        setSelected(value)
        if (props.selectedItem) {
          props.selectedItem(value?.value)
        }
      }
    }, 100)
  }

  // FIX 2: Allow typing if *either* typing or searchable props are set to true
  const isWritable = props.typing === true || props.searchable === true

  return (
    <div className={classNames("grow p-0", props.grow ? "flex-grow" : "")}>
      {selected && <input 
        type="hidden" 
        id={props.shadowId ? props.shadowId : 'shadowValue'} 
        ref={props.refX}
        name={props.name}
        defaultValue={selected ? selected.value : ''}
      />}
      {props.label && (
        <label className={`mb-2 block text-sm font-medium leading-6 ${props.required === true ? 'after:content-["*"] after:ml-0.5 text-red-500' : ''}`}>
          {props.label}<span className="opacity-0">;</span>
        </label>
      )}

      {mounted && (
        <Combobox 
          as="div" 
          className="w-full" 
          value={selected}
          onChange={changeFunction} 
          onClose={() => setQuery('')}
          virtual={{ options: filteredList }}
        >
          <div className="relative ring-1 ring-gray-300 dark:ring-white/10 rounded-lg shadow-sm bg-white dark:bg-white/5">
            <ComboboxButton id="input2" as="div" className={classNames("w-full relative cursor-pointer")}>
              <ComboboxInput
                className={classNames(
                  'w-full rounded-lg border-none py-1.5 pr-8 pl-3 text-sm/6 dark:text-white text-gray-600 font-semibold',
                  'focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 dark:data-focus:outline-white/25',
                  isWritable ? "" : "cursor-pointer", // FIX 3: Dynamic cursor styles
                )}
                id="input11"
                readOnly={!isWritable} // FIX 4: Unlock read-only mode conditionally
                autoComplete={props.autoComplete ? props.autoComplete : 'off'}
                placeholder={props.placeholder}
                displayValue={(item: {value: string, name: string}) => item?.name || ''}
                onChange={(event) => {
                  startTransition(() => {
                    setQuery(event.target.value)
                  })
                }}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5">
                <ChevronDownIcon className="size-4 dark:fill-white/60 fill-gray-900/60" />
              </div>
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor="bottom"
            portal={false} 
            aria-hidden="false"
            modal={false}
            className={classNames(
              'mt-3 z-50 w-(--input-width) min-w-[200px] backdrop-blur-lg rounded-xl border border-gray-300 dark:border-white/5 bg-white/75 dark:bg-white/5 p-1 [--anchor-gap:--spacing(1)] empty:invisible max-h-60 overflow-y-auto',
              'transition duration-100 ease-in data-leave:data-closed:opacity-0'
            )}
          >
            {({ option: item }) => (
              <ComboboxOption
                key={item.value}
                value={item}
                className="group flex cursor-default items-center gap-2 rounded-lg px-3 py-1.5 select-none dark:data-focus:bg-white/10 data-focus:bg-gray-100 data-hover:bg-gray-100 dark:data-hover:bg-white/10"
              >
                <CheckIcon className="invisible size-4 dark:fill-white fill-gray-900/60 group-data-selected:visible" />
                <div className="text-sm/6 dark:text-white text-gray-500 group-data-selected:font-semibold">
                  {item.name}
                </div>
              </ComboboxOption>
            )}
          </ComboboxOptions>
        </Combobox>
      )}
      {props.subText && <p className={`mt-2 text-sm`}>{props.subText}</p>}
    </div>
  )
}