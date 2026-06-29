'use client'
export default function Spinner(props: {
  size?: string | number
}){ 
    return (
      <div 
        className={`inline-block animate-spin rounded-full border-3 border-black border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] flex-shrink-0 aspect-square`}
        style={{ 
          height: `${(Number(props.size) || 24) * 0.25}rem`, 
          width: `${(Number(props.size) || 24) * 0.25}rem` 
        }} 
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
        )
    
}