"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Briefcase } from "lucide-react"

const mockUsers = {
  "employee@example.com": { name: "Sarah Johnson", role: "employee", team: "Engineering", accountName: "Tech Corp" },
  "qc@example.com": { name: "Mike Chen", role: "qc", team: "Quality Control", accountName: "Tech Corp" },
  "hr@example.com": { name: "Lisa Rodriguez", role: "hr", team: "Human Resources", accountName: "Tech Corp" },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    setTimeout(() => {
      const user = mockUsers[email as keyof typeof mockUsers]
      if (user && password.length > 0) {
        localStorage.setItem("user", JSON.stringify(user))
        router.push(`/${user.role}`)
      } else {
        alert("Invalid credentials. Try: employee@example.com, qc@example.com, or hr@example.com")
      }
      setLoading(false)
    }, 500)
  }

  const quickLogin = (email: string) => {
    const user = mockUsers[email as keyof typeof mockUsers]
    localStorage.setItem("user", JSON.stringify(user))
    router.push(`/${user.role}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/30 rounded-full filter blur-3xl opacity-40 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-300/30 rounded-full filter blur-3xl opacity-40 animate-pulse animation-delay-2000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center relative z-10"
      >
        {/* Left Side - Inspirational Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="hidden md:block text-slate-900"
        >
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Manage Your Workday Beautifully
          </h1>
          <p className="text-xl text-slate-700 mb-8">
            A premium work management platform designed for teams that demand excellence. Streamline your workflow with
            elegant, intuitive dashboards tailored to your role.
          </p>

          {/* Mini Stats */}
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-300 flex-shrink-0">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Real-time Sync</p>
                <p className="text-sm text-slate-600">Data synced from Google Sheets</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-300 flex-shrink-0">
                <div className="w-3 h-3 bg-purple-600 rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-purple-900">Role-Based Access</p>
                <p className="text-sm text-slate-600">Tailored dashboards for each role</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center border border-pink-300 flex-shrink-0">
                <div className="w-3 h-3 bg-pink-600 rounded-full" />
              </div>
              <div>
                <p className="font-semibold text-pink-900">Premium Design</p>
                <p className="text-sm text-slate-600">Beautiful, modern interface</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-white border border-slate-200 shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center justify-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">Welcome back</h2>
            <p className="text-slate-600 text-center mb-8">Sign in to manage your workday</p>

            <form onSubmit={handleLogin} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 rounded-lg"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-600">Quick demo login</span>
              </div>
            </div>

            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickLogin("employee@example.com")}
                className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              >
                Employee
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickLogin("qc@example.com")}
                className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 transition-colors"
              >
                QC Manager
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickLogin("hr@example.com")}
                className="w-full px-4 py-2 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-lg text-sm font-medium text-pink-700 transition-colors"
              >
                HR Manager
              </motion.button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-6">Demo credentials - any password works</p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
