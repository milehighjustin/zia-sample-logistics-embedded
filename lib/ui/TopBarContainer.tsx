"use client"

export default function TopBarContainer(props : {
    children: React.ReactNode
  }) {


  return (
    <div className="sticky top-0 z-50 backdrop-blur-sm py-1">
      {props.children}
    </div>
  )
}