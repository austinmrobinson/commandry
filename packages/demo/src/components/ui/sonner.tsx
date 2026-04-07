"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      offset={{ bottom: '1rem', right: '1rem' }}
      mobileOffset={{ bottom: '1rem', right: '1rem' }}
      toastOptions={{
        style: {
          borderRadius: '1rem',
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-50 group-[.toaster]:!border-zinc-800 group-[.toaster]:!shadow-lg group-[.toaster]:!px-4 group-[.toaster]:!py-3",
          icon: "group-[.toast]:text-zinc-300 group-[.toast]:mr-1",
          description: "group-[.toast]:!text-zinc-400",
          actionButton:
            "group-[.toast]:!bg-zinc-50 group-[.toast]:!text-zinc-900 group-[.toast]:!rounded-full",
          cancelButton:
            "group-[.toast]:!bg-zinc-800 group-[.toast]:!text-zinc-400 group-[.toast]:!rounded-full",
          success: "",
          error: "group-[.toaster]:!text-red-400",
          info: "group-[.toaster]:!text-blue-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
