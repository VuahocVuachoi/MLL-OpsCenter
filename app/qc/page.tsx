"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { QCDashboard } from "@/components/dashboards/qc-dashboard"
import type { User } from "@/types/user"

export default function QCPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "qc") {
        router.push(`/${parsedUser.role}`)
      }
      setUser(parsedUser)
    }
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <QCDashboard user={user} />
    </div>
  )
}
