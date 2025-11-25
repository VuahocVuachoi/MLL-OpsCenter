"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { EmployeeDashboard } from "@/components/dashboards/employee-dashboard"
import type { User } from "@/types/user"

export default function EmployeePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
    } else {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role !== "employee") {
        router.push(`/${parsedUser.role}`)
      }
      setUser(parsedUser)
    }
  }, [router])

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <EmployeeDashboard user={user} />
    </div>
  )
}
