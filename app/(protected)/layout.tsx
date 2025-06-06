'use client'

import { LogOut, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button"
import { logout as serverLogout } from "./actions"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useTheme } from "next-themes"
import { Navbar } from "@/components/navbar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false);

  const handleLogout = async () => {
    const res = await serverLogout()

    if (res == null) {
      logout()
      router.push('/login')
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      const current = window.location.pathname + window.location.search;
      router.push(`/login?redirectTo=${encodeURIComponent(current)}`);
    }
  }, [user, router])

  if (!isMounted || !user) return null

  return (
    <div className="flex flex-col h-screen">
      <header className="h-16 border-b shrink-0 bg-background/50 backdrop-blur-md">
        <Navbar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor size={16} strokeWidth={2} className="opacity-60" aria-hidden="true" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="focus:outline-none">
              <Button variant="ghost">{user.userName}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
            >
              <DropdownMenuItem>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-2                               
                              rounded-lg transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </div>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Navbar>
      </header>
      <main className="flex-1 overflow-auto relative max-h-full">
          {children}
      </main>
    </div>
  )
}