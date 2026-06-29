"use client"

export default function PageStandardList(props : {
    children: React.ReactNode
  }) {


  return (
    <div className="h-full w-full flex flex-col gap-5 px-1 overflow-y-auto">
      {props.children}
    </div>
  )
}