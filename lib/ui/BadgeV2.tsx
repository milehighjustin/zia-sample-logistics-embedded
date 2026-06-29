function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function BadgeV2(props: { invert?: boolean, color?: string, children: React.ReactNode }) {
    return (
      <div className="cursor-default">
        <div className="fill-sky-500 fill-gray-500 fill-red-500 fill-blue-500 fill-purple-500 fill-orange-500 fill-white-500 fill-amber-500 fill-lime-500 fill-pink-500 fill-cyan-500 fill-teal-500 fill-green-500 fill-yellow-500"></div>
        <span className={classNames(
          "inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset text-gray-900 ring-gray-200 dark:ring-gray-700 dark:text-white",
        )}>
          <svg className={classNames('h-1.5 w-1.5',  props.color ? 'fill-'+props.color+'-500' : 'fill-gray-500')} viewBox="0 0 6 6" aria-hidden="true">
            <circle cx={3} cy={3} r={3} />
          </svg>
          {props.children}
        </span>
      </div>
    )
  }