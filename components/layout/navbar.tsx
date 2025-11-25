"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Briefcase } from "lucide-react"
import type { User } from "@/types/user"

interface NavbarProps {
  user: User | null
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl font-bold text-white">FlowWork</h1>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-cyan-400 to-blue-500">
                <AvatarFallback className="text-slate-900 font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-gray-400 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
