"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

export function LeaveRequestTab() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [leaveType, setLeaveType] = useState("annual")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [signatureFileName, setSignatureFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const loadSignature = async () => {
      if (!currentUser?.id) return
      const { data } = await supabase.from("profiles").select("signature_data").eq("id", currentUser.id).single()
      if (data?.signature_data) {
        setSignatureData(data.signature_data)
      }
    }
    void loadSignature()
  }, [currentUser?.id, supabase])

  const handleSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.id) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = String(reader.result || "")
      if (!dataUrl) return
      setSignatureData(dataUrl)
      setSignatureFileName(file.name)
      await supabase.from("profiles").update({ signature_data: dataUrl }).eq("id", currentUser.id)
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureReset = async () => {
    if (!currentUser?.id) return
    setSignatureData(null)
    setSignatureFileName("")
    await supabase.from("profiles").update({ signature_data: null }).eq("id", currentUser.id)
  }

  const handleSubmit = async () => {
    setErrorMessage("")
    setSubmitMessage("")
    if (!currentUser) {
      setErrorMessage("Vui lòng đăng nhập lại.")
      return
    }
    if (!fromDate || !toDate || !reason.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ From Date, To Date và Reason.")
      return
    }
    if (!signatureData) {
      setErrorMessage("Vui lòng tải chữ ký trước khi gửi.")
      return
    }
    setIsSubmitting(true)
    const response = await fetch("/api/leave-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
        contactPhone: contactPhone.trim(),
        signatureData,
        employeeName: currentUser.name,
        position: currentUser.role === "mlqc" ? "MLOQC (Machine Learning Quality Check)" : "MLL",
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setErrorMessage(payload.error || "Không thể tạo đơn nghỉ phép.")
      setIsSubmitting(false)
      return
    }
    setSubmitMessage("Đã tạo đơn nghỉ phép và tải lên Drive.")
    setIsSubmitting(false)
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left Side - Leave Balance */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 h-full">
          <h3 className="text-lg font-semibold text-white mb-6">Leave Balance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Annual Leave</span>
                <span className="text-sm font-semibold text-cyan-300">18/25</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: "72%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Extra Leave</span>
                <span className="text-sm font-semibold text-green-300">5/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full" style={{ width: "50%" }} />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Right Side - Request Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="md:col-span-2"
      >
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Request Leave</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="compensatory">Compensatory Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Enter contact phone..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
              <Textarea
                placeholder="Enter reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Chữ ký</label>
              {signatureData ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={signatureData} alt="signature" className="h-14 rounded bg-white/10" />
                    <div>
                      <p className="text-sm text-white font-semibold">Đã lưu chữ ký</p>
                      <p className="text-xs text-gray-400">{signatureFileName || "signature"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSignatureReset}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Tải lại chữ ký
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" onChange={handleSignatureChange} className="bg-white/5 border-white/10 text-white" />
              )}
            </div>
            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            {submitMessage && <p className="text-sm text-emerald-400">{submitMessage}</p>}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold disabled:opacity-60"
            >
              {isSubmitting ? "Đang gửi..." : "Submit Request"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
