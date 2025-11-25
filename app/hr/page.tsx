"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { HRDashboard } from "@/components/dashboards/hr-dashboard"
import type { User } from "@/types/user"

export default function HRPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "hr") {
        router.push(`/${parsedUser.role}`)
      }
      setUser(parsedUser)
    }
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <HRDashboard user={user} />
    </div>
  )
}
