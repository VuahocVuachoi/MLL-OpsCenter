"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Briefcase, Bell, X } from "lucide-react"
import type { User } from "@/types/user"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface NotificationItem {
  id: string
  title: string
  message: string
  event_type: "approved" | "rejected" | "info"
  work_date: string | null
  is_read: boolean
  created_at: string
}

interface NavbarProps {
  user: User | null
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/login")
  }

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    setIsLoadingNotifications(true)
    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,message,event_type,work_date,is_read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (!error && data) {
      setNotifications(data as NotificationItem[])
      setUnreadCount(data.filter((item) => !item.is_read).length)
    }
    setIsLoadingNotifications(false)
  }, [supabase, user?.id])

  useEffect(() => {
    if (!user) return
    void loadNotifications()
  }, [loadNotifications, user])

  useEffect(() => {
    if (!showNotifications || !user?.id) return
    const markAsRead = async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
      setUnreadCount(0)
    }
    void markAsRead()
  }, [showNotifications, supabase, user?.id])

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
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="relative h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 text-xs font-semibold text-white rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-300 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-6">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Notifications</h3>
                <p className="text-xs text-slate-400 mt-1">Timesheet approve/reject</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {isLoadingNotifications ? (
                <p className="text-sm text-slate-400">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-slate-400">No notifications yet.</p>
              ) : (
                notifications.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.event_type === "approved"
                            ? "bg-green-500/20 text-green-300"
                            : item.event_type === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-slate-600/40 text-slate-300"
                        }`}
                      >
                        {item.event_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2">{item.message}</p>
                    <div className="text-[11px] text-slate-500 mt-2">
                      {item.work_date ? `Date ${item.work_date}` : ""} •{" "}
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
