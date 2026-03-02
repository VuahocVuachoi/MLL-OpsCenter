"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { AccountSettings } from "@/components/settings/account-settings"
import type { User } from "@/types/user"

export default function EmployeeSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "mll") {
      router.push(`/${parsedUser.role}`)
      return
    }
    setUser(parsedUser)
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-white mb-6">Account settings</h1>
        <AccountSettings user={user} />
      </main>
    </div>
  )
}
