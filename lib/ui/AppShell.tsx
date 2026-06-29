"use client"

export default function AppShell(props: {children: React.ReactNode}) {

    return (
        <div className="flex flex-col items-center justify-start h-screen fixed w-screen top-0 left-0">
            <div className="w-full max-w-[2560px] h-full flex-1 min-h-0">
                <div className={`w-full max-w-[2560px] h-full p-5`}>
                    {props.children}
                </div>
            </div>
        </div>
    )
}