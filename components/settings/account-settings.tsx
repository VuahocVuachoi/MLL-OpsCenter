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
      setError("Account email not found.")
      return
    }
    if (!currentPassword || !newPassword) {
      setError("Please enter all password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      setError("Current password is incorrect.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError("Unable to change password. Please try again.")
      setLoading(false)
      return
    }

    setLoading(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setSuccess("Password changed successfully.")

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
            <p className="text-xs text-gray-500 mt-1">Avatar will update later.</p>
          </div>
        </div>
      </Card>

      <Card className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Confirm new password</label>
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
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
