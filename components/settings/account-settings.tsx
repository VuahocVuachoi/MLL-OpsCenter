"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

interface AccountSettingsProps {
  user: User
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!user.email) {
      setError("Không tìm thấy email tài khoản.")
      return
    }
    if (!currentPassword || !newPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp.")
      return
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.")
      return
    }

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      setError("Mật khẩu hiện tại không đúng.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError("Không thể đổi mật khẩu. Vui lòng thử lại.")
      setLoading(false)
      return
    }

    setLoading(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setSuccess("Đổi mật khẩu thành công.")

    localStorage.removeItem("user")
    localStorage.removeItem(`login_started_at_${user.id}`)
    router.push("/login")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 bg-gradient-to-br from-cyan-400 to-blue-500">
            <AvatarFallback className="text-slate-900 font-bold">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-white">{user.name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-500 mt-1">Avatar sẽ cập nhật sau.</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Đổi mật khẩu</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Mật khẩu hiện tại</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Mật khẩu mới</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Xác nhận mật khẩu mới</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}
          <Button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
