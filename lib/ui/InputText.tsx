"use client"
import { EyeIcon, EyeSlashIcon, LockClosedIcon, MagnifyingGlassIcon, PencilIcon } from "@heroicons/react/24/outline"
import { useRef, useState } from "react"
import { CiCircleCheck } from "react-icons/ci";
import Spinner from "./Spinner";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }

export default function InputText(props: {
    type?: string;
    grow?: boolean;
    hideLabel?: boolean;
    white?: boolean;
    usd?: boolean;
    leftIcon?: React.ElementType;
    rightIcon?: React.ElementType;
    leftCharacter?: any;
    rightCharacter?: any;
    leftLabel?: boolean;
    rightLabel?: boolean;
    percentage?: boolean;
    autoComplete?: string;
    name?: string;
    refX?: React.RefObject<HTMLInputElement | null>;
    changeEvent?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    textColor?: string;
    big?: boolean;
    placeholder?: string;
    required?: boolean;
    defaultValue?: string | number;
    min?: string | number;
    max?: string | number;
    label?: string;
    searchFn?: (() => void) | undefined;
    subText?: string;
    liveLoading?: boolean;
    liveComplete?: boolean;
    edit?: boolean;
    editFn?: () => void | undefined;
    onEnter?: (value: string) => void;
    shadowId?: string;
}) {
    const [type, setType] = useState(props.type != undefined ? props.type : 'text')
    const defaultRef = useRef<HTMLInputElement | null>(null)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && props.onEnter) {
            props.onEnter(e.currentTarget.value);
        }
    };


    const search = () => {
        if(props.searchFn != undefined){
            props.searchFn()
        }
    }

    return   (
        <div className={classNames(props.grow == true ? 'grow w-full' : '',)}>
            <div className={classNames(
                'hidden',
                'text-sky-500',
                'text-gray-500',
                'text-red-500',
                'text-blue-500',
                'text-yelloow-500',
                'text-green-500',
                'text-purple-500',
                'text-pink-500',
                'text-gray-900'
            )}>

            </div>
            {props.label && <label className={`mb-2 block text-sm font-medium leading-6 ${props.required == true ? 'after:content-["*"] after:ml-0.5 text-red-500' : ''}`}>
            {props.label}<span className="opacity-0">;</span>
            </label>}
            {props.disabled != true && <div className={classNames(
                "relative flex flex-row items-center gap-3 justify-between ring-1 ring-gray-300 dark:ring-white/10 rounded-lg shadow-sm bg-white dark:bg-white/5",
                "py-2 pr-3 pl-3"
            )}>
            {props.usd == true && '$'}
            {props.leftIcon && <props.leftIcon size="5" className="h-5 w-5" />}
            {props.leftCharacter && <span>{props.leftCharacter}</span>}
            <input
                id={props.shadowId ? props.shadowId : undefined}
                type={type}
                autoComplete={props.autoComplete ? props.autoComplete : 'off'}
                name={props.name}
                ref={props.refX ? props.refX : defaultRef}
                onChange={props.changeEvent ? props.changeEvent : undefined}
                onKeyDown={handleKeyDown}
                disabled={props.disabled ? props.disabled : false}
                className={classNames(
                    `focus:outline-none block w-full bg-transparent dark:placeholder-gray-100 placeholder-gray-400`, 
                    `${props.textColor ? `text-${props.textColor}-500` : ''}`,
                    props.big == true ? 'text-xl h-[40px]' : 'text-sm',)
                }
                placeholder={props.placeholder}
                required={props.required ? props.required : false}
                defaultValue={props.defaultValue != undefined ? ((props.usd && typeof props.defaultValue === 'number')  ? (props.defaultValue * 1)?.toFixed(2) : props.defaultValue) : ''}
                min={props.min}
                max={props.max}
            />
            {props.rightCharacter && <span>{props.rightCharacter}</span>}
            {props.liveLoading && <Spinner size="5" />}
            {props.liveComplete && <CiCircleCheck className="text-green-500 h-5 w-5" />}
            {props.rightIcon && <props.rightIcon size="5" className="h-5 w-5" />}
            {props.percentage == true && '%'}
            {props.type == 'password' && <div>{type == 'text' && <div onClick={()=>setType('password')}><EyeIcon className="absolute right-2 bottom-2 my-auto h-6 w-5" /></div>}
            {type == 'password' && <div><EyeSlashIcon onClick={()=>setType('text')} className="absolute right-2 bottom-2 h-6 w-5" /></div>}
            </div>}
            </div>}
            {props.disabled == true && <div className="mt-2 flex flex-row items-center justify-between px-3 focus:outline-none block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 sm:text-sm sm:leading-6">
            <input
                id={props.shadowId ? props.shadowId : undefined}
                type={props.type != undefined ? props.type : 'text'}
                name={props.name}
                ref={props.refX ? props.refX : defaultRef}
                onChange={props.changeEvent ? props.changeEvent : undefined}
                disabled={true}
                className={classNames(
                    `focus:outline-none block w-full`, 
                    `${props.textColor ? `text-${props.textColor}-500` : ''}`,
                    props.big == true ? 'text-xl h-[40px]' : 'text-sm',)
                }
                placeholder={props.placeholder}
                defaultValue={props.defaultValue != undefined ? props.defaultValue : ''}
            />
            <LockClosedIcon className="h-4 w-4"/>
            </div>}
            {props.subText && <p className="mt-2 text-sm">
                {props.subText}
            </p>}
        </div>
    )
  }