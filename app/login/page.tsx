"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { User } from "@/types/user"
import { Briefcase } from "lucide-react"

import { supabaseBrowser } from "@/lib/supabase-browser"

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const performLogin = async () => {
    setErrorMessage("")
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setErrorMessage("Không tìm thấy tài khoản sau khi đăng nhập.")
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id,email,name,role,team,account_name,username,leave_balance,annual_leave_total,annual_leave_remaining",
      )
      .eq("id", data.user.id)
      .single()

    const fallbackRoleMap: Record<string, User["role"]> = {
      "ntphu@enveritas-associate.org": "mlqc",
      "pnquang@enveritas-associate.org": "hr",
      "tan@enveritas.org": "mlqc",
    }
    const fallbackRole = fallbackRoleMap[email]
    const enforcedRole = fallbackRoleMap[email]

    if (!profile && !fallbackRole) {
      setErrorMessage("Tài khoản chưa có quyền truy cập.")
      setLoading(false)
      return
    }

    const mappedUser = profile
      ? {
          id: profile.id,
          email: profile.email || email,
          name: profile.name || email,
          role: enforcedRole ?? profile.role,
          team: profile.team || "",
          accountName: profile.account_name || "",
          leaveBalance: profile.leave_balance ?? undefined,
        }
      : {
          id: data.user.id,
          email,
          name: email,
          role: fallbackRole,
          team: "",
          accountName: "",
          leaveBalance: undefined,
        }

    if (profileError && profileError.code !== "PGRST116" && !fallbackRole) {
      setErrorMessage("Không thể tải hồ sơ nhân viên. Vui lòng thử lại.")
      setLoading(false)
      return
    }
    const usernameLocalPart = mappedUser.email.split("@")[0]?.toLowerCase() || "user"
    const usernamePrefix = mappedUser.role === "mll" ? "mlops_analyst" : "mlops_manager"
    const resolvedUsername = `${usernamePrefix}_${usernameLocalPart}`

    const profilePayload = {
      id: mappedUser.id,
      email: mappedUser.email,
      name: mappedUser.name,
      role: mappedUser.role,
      team: profile?.team || "",
      account_name: resolvedUsername,
      username: resolvedUsername,
      leave_balance: profile?.leave_balance ?? 0,
      annual_leave_total: profile?.annual_leave_total ?? 12,
      annual_leave_remaining: profile?.annual_leave_remaining ?? 12,
    }

    const { error: upsertError } = await supabase.from("profiles").upsert(profilePayload)
    if (upsertError) {
      setErrorMessage("Không thể tạo hồ sơ nhân viên. Vui lòng thử lại.")
      setLoading(false)
      return
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...mappedUser,
          accountName: profilePayload.account_name,
        }),
      )
      localStorage.setItem(`login_started_at_${mappedUser.id}`, Date.now().toString())
    }

    const roleToRoute: Record<User["role"], string> = {
      mll: "/employee",
      mlqc: "/qc",
      hr: "/hr",
    }
    router.replace(roleToRoute[mappedUser.role])
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin()
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 opacity-50 blur-2xl" />
      <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-fuchsia-600 to-violet-500 opacity-50 blur-2xl" />
      <div className="absolute top-20 left-6 h-12 w-12 rounded-full bg-cyan-400 shadow-lg" />

      <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <Card className="relative overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-b from-slate-900 via-indigo-900 to-blue-900 p-10 text-white shadow-2xl">
            <div className="absolute inset-0">
              <div className="absolute -top-16 -right-20 h-44 w-44 rounded-full bg-blue-500/30 blur-2xl" />
              <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-fuchsia-500/30 blur-2xl" />
              <div className="absolute inset-x-8 top-24 h-px bg-white/20" />
            </div>

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-center text-4xl font-semibold tracking-tight">Welcome</h1>
              <p className="mt-2 text-center text-sm text-white/70">
                Login to manage your employee attendance
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div className="relative">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="relative">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/70">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="******"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-full border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-12 w-full rounded-full bg-white text-indigo-700 font-semibold hover:bg-white/90"
                >
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                {errorMessage && <p className="text-sm text-red-200 text-center">{errorMessage}</p>}
              </form>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
