"use client"

export default function ListContainer(props : {
    children: React.ReactNode
  }) {


  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar border border-gray-300 dark:border-white/10 rounded-md">
      {props.children}
    </div>
  )
}