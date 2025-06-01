"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { AutoBreadcrumb } from "@/components/breadcrumb"

interface BreadcrumbItem {
  label: string
  href?: string
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(({ children, className, ...props }, ref) => {

  return (
    <nav
      ref={ref}
      {...props}
      className={cn(
        "px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23] h-full",
        className
      )}>
      <div className="font-medium text-sm hidden sm:flex items-center space-x-1 truncate max-w-[300px]">
        {<AutoBreadcrumb/>}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        {children}
      </div>
    </nav>
  )
})

Navbar.displayName = "Navbar"

export { Navbar }