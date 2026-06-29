"use client"

export default function PageStandard(props : {
    children: React.ReactNode
  }) {


  return (
    <div className="h-full w-full flex flex-col gap-5 overflow-y-auto scrollbar">
      {props.children}
    </div>
  )
}