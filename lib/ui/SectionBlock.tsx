"use client"

export default function SectionBlock(props: {
  title?: string;
  subText?: string;
  children: React.ReactNode;
}) {


    return (
      <div className="w-full flex flex-col sm:flex-row items-start gap-10">
        <div className="w-full sm:w-1/3 shrink-0">
          <h2 className="text-md font-medium font-semibold">{props.title}</h2>
          {props.subText && <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{props.subText}</p>}
        </div>
        <div className="grow min-w-0">
          {props.children}
        </div>
      </div>
    )
  }
