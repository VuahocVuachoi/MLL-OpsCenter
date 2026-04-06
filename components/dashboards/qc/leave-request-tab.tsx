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
  const [annualTotal, setAnnualTotal] = useState(12)
  const [annualRemaining, setAnnualRemaining] = useState(12)
  const [pendingLeaveDays, setPendingLeaveDays] = useState(0)

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

  useEffect(() => {
    const loadBalances = async () => {
      if (!currentUser?.id) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("annual_leave_total,annual_leave_remaining")
        .eq("id", currentUser.id)
        .single()

      if (profile) {
        setAnnualTotal(profile.annual_leave_total ?? 12)
        setAnnualRemaining(profile.annual_leave_remaining ?? 12)
      }

      const { data: leaveRows } = await supabase
        .from("leave_requests")
        .select("total_days,status")
        .eq("user_id", currentUser.id)

      const pendingDays = (leaveRows || [])
        .filter((row) => row.status === "pending")
        .reduce((sum, row) => sum + (row.total_days || 0), 0)
      setPendingLeaveDays(pendingDays)
    }

    void loadBalances()
  }, [currentUser?.id, supabase])

  const requestedDays = useMemo(() => {
    if (!fromDate || !toDate) return 0
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const ms = end.getTime() - start.getTime()
    const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
    return Number.isFinite(days) ? Math.max(days, 0) : 0
  }, [fromDate, toDate])

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
      setErrorMessage("Please log in again.")
      return
    }
    if (!fromDate || !toDate || !reason.trim()) {
      setErrorMessage("Please fill in From Date, To Date, and Reason.")
      return
    }
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      setErrorMessage("From Date must be earlier than To Date.")
      return
    }
    if (!signatureData) {
      setErrorMessage("Please upload your signature before submitting.")
      return
    }
    if (leaveType === "annual" && requestedDays > annualRemaining) {
      setErrorMessage(`You only have ${annualRemaining} annual leave day(s) remaining.`)
      return
    }
    setIsSubmitting(true)
    const response = await fetch("/api/leave-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        leaveType,
        fromDate,
        toDate,
        reason: reason.trim(),
        contactPhone: contactPhone.trim(),
        signatureData,
        employeeName: currentUser.name,
        position: "MLQC (Machine Learning Quality Check)",
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setErrorMessage(payload.error || "Unable to create leave request.")
      setIsSubmitting(false)
      return
    }
    setSubmitMessage("Leave request created and uploaded to Drive.")
    setPendingLeaveDays((prev) => prev + requestedDays)
    setFromDate("")
    setToDate("")
    setReason("")
    setContactPhone("")
    setIsSubmitting(false)
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left Side - Leave Balance */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6 h-full">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Leave Balance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Annual Leave</span>
                <span className="text-sm font-semibold text-blue-600">
                  {annualRemaining}/{annualTotal}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-full"
                  style={{
                    width: `${annualTotal > 0 ? Math.max(0, Math.min(100, (annualRemaining / annualTotal) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Pending Requests</span>
                <span className="text-sm font-semibold text-amber-600">{pendingLeaveDays} day(s)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full"
                  style={{
                    width: `${annualTotal > 0 ? Math.max(0, Math.min(100, (pendingLeaveDays / annualTotal) * 100)) : 0}%`,
                  }}
                />
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
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Request Leave</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
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
                <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>
            </div>
            {requestedDays > 0 && (
              <p className="text-xs text-blue-600">Requested duration: {requestedDays} day(s)</p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Enter contact phone..."
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <Textarea
                placeholder="Enter reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-white border-slate-300 text-slate-900 min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Signature</label>
              {signatureData ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={signatureData} alt="signature" className="h-14 rounded bg-white" />
                    <div>
                      <p className="text-sm text-slate-900 font-semibold">Signature saved</p>
                      <p className="text-xs text-slate-500">{signatureFileName || "signature"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSignatureReset}
                    className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    Re-upload signature
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" onChange={handleSignatureChange} className="bg-white border-slate-300 text-slate-900" />
              )}
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            {submitMessage && <p className="text-sm text-green-600">{submitMessage}</p>}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
