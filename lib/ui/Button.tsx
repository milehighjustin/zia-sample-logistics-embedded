"use client"

import Spinner from "./Spinner";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Button(props: {
  htmlId?: string;
  type?: "button" | "submit" | "reset";
  clickAction?: (data: any) => void;
  clickData?: any;
  loading?: boolean;
  form?: string;
  wide?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  opposite?: boolean;
  icon?: React.ElementType;
  children: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  href?: string;
}) {

    const buttonClicked = () => {
        if(props.clickAction){
            props.clickAction(props.clickData)
        }
        if(props.href){
          window.location.href = props.href
        }
    }

  return (
      <button
        id={props.htmlId || undefined}
        type={props.type}
        onClick={(props.loading != true) ? ()=>buttonClicked() : undefined}
        disabled={(props.loading == true || props.disabled == true) ? true : false }
        form={props.form}
        className={classNames(
          "cursor-pointer block rounded-md  text-center font-semibold shadow-sm hover:font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2  flex flex-row gap-3 items-center justify-center ring-1 ring-inset",
          props.wide ? 'w-full' : '',
          props.size == 'xs' ? 'px-2 py-1 text-xs' : '',
          props.size == 'sm' ? 'px-3 py-2 text-sm' : '',
          props.size == 'md' ? 'px-3 py-2 text-base' : '',
          props.size == 'lg' ? 'px-4 py-3 text-lg' : '',
          props.size == 'xl' ? 'px-6 py-4 text-xl' : '',
          !props.size ? 'px-2 py-1 text-xs' : '',
          (props.color && props.opposite != true) ? `text-${props.color}-700 bg-${props.color}-200 ring-${props.color}-200 focus-visible:outline-${props.color}-200` : '',
          (props.color && (props.opposite == true) ||  props.selected) ? `bg-white ring-${props.color}-700 focus-visible:outline-${props.color}-700 text-${props.color}-700` : '',
          (props.color == undefined && props.selected != true) ? `text-gray-700 focus-visible:outline-black ring-gray-200 bg-gray-200` : '',
          (props.color == undefined && props.selected == true) ? `bg-white ring-${props.color}-700 focus-visible:outline-${props.color}-700 text-${props.color}-700` : '',
        )}
      >
        <div className="hidden bg-yellow-700 bg-yellow-200 text-yellow-700 text-yellow-200 ring-yellow-700 ring-yellow-200 focus-visible:outline-yellow-700 focus-visible:outline-yellow-200"></div>
        <div className="hidden bg-indigo-700 bg-indigo-200 text-indigo-700 text-indigo-200 ring-indigo-700 ring-indigo-200 focus-visible:outline-indigo-700 focus-visible:outline-indigo-200"></div>
        <div className="hidden bg-red-700 bg-red-200 text-red-700 text-red-200 ring-red-700 ring-red-200 focus-visible:outline-red-700 focus-visible:outline-red-200"></div>
        <div className="hidden bg-green-700 bg-green-200 text-green-700 text-green-200 ring-green-700 ring-green-200 focus-visible:outline-green-700 focus-visible:outline-green-200"></div>
        <div className="hidden bg-gray-700 bg-gray-200 text-gray-700 text-gray-200 ring-gray-700 ring-gray-200 focus-visible:outline-gray-700 focus-visible:outline-gray-200"></div>
        <div className="hidden bg-sky-700 bg-sky-200 text-sky-700 text-sky-200 ring-sky-700 ring-sky-200 focus-visible:outline-sky-700 focus-visible:outline-sky-200"></div>
        <div className="hidden bg-purple-700 bg-purple-200 text-purple-700 text-purple-200 ring-purple-700 ring-purple-200 focus-visible:outline-purple-700 focus-visible:outline-purple-200"></div>
        <div className="hidden bg-pink-700 bg-pink-200 text-pink-700 text-pink-200 ring-pink-700 ring-pink-200 focus-visible:outline-pink-700 focus-visible:outline-pink-200"></div>
        <div className="hidden bg-blue-700 bg-blue-200 text-blue-700 text-blue-200 ring-blue-700 ring-blue-200 focus-visible:outline-blue-700 focus-visible:outline-blue-200"></div>
        
        {props.icon && <div>
              <div className={classNames(
          (props.color && props.opposite != true) ? `text-${props.color}-700 bg-${props.color}-200 ring-${props.color}-200 focus-visible:outline-${props.color}-200` : '',
          (props.color && props.opposite == true) ? `bg-white ring-${props.color}-700 focus-visible:outline-${props.color}-700 text-${props.color}-700` : '',
          (props.color == undefined) ? `text-gray-700 focus-visible:outline-black ring-gray-200 bg-gray-200` : ''
              )}>
                <props.icon className={classNames(
                  props.size ? (props.size == 'sm' ? 'h-3 w-3' : 'h-5 w-5') : 'h-5 w-5',
                )}></props.icon>
              </div> 
        </div>}
              <div>{props.children} {props.loading && <Spinner size="3" />}</div>
      </button>
  )
}