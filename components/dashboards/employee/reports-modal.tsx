"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { X, Upload, Send } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { User } from "@/types/user"

interface ReportsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export function ReportsModal({ isOpen, onClose, user }: ReportsModalProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [errorDescription, setErrorDescription] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0])
  const [reportType, setReportType] = useState<"report" | "suggestion">("report")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const username = useMemo(() => {
    if (user.accountName) return user.accountName
    if (user.email) return user.email.split("@")[0]
    return user.name || "user"
  }, [user])

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
    }
  }

  const resetForm = () => {
    setVideoFile(null)
    setErrorDescription("")
    setReportDate(new Date().toISOString().split("T")[0])
    setReportType("report")
    setErrorMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile) return
    setErrorMessage("")
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append("video", videoFile)
    formData.append("description", errorDescription.trim())
    formData.append("username", username)
    formData.append("reportDate", reportDate)
    formData.append("reportType", reportType)

    const response = await fetch("/api/reports", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setErrorMessage(payload.error || "Unable to submit report. Please try again.")
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setSubmitSuccess(true)
    setTimeout(() => {
      setSubmitSuccess(false)
      resetForm()
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-slate-700"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Tool Report</h2>
            <p className="text-sm text-slate-400 mt-1">Choose report type and describe the issue</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {submitSuccess ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-semibold">Report submitted successfully!</p>
            <p className="text-slate-400 text-sm mt-2">Thank you for reporting this issue.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 text-sm">
              <p>
                Submitted by: <span className="font-semibold">{username}</span>
              </p>
            </Card>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">Report type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("report")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    reportType === "report"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Report tool
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("suggestion")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    reportType === "suggestion"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Suggestion
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">Report date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">Upload Video</label>
              <div className="relative">
                <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" id="video-upload" required />
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center w-full p-8 border-2 border-dashed border-slate-600 rounded-xl hover:border-blue-400 hover:bg-blue-400/5 transition-all cursor-pointer group"
                >
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                    {videoFile ? (
                      <div>
                        <p className="text-sm font-medium text-white">{videoFile.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-white">Drag and drop your video here</p>
                        <p className="text-xs text-slate-400 mt-1">or click to select a file</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-white">
                {reportType === "suggestion" ? "Describe your suggestion" : "Describe the issue"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={errorDescription}
                onChange={(e) => setErrorDescription(e.target.value)}
                placeholder={
                  reportType === "suggestion"
                    ? "Please describe your suggestion for the tool..."
                    : "Please describe the error or issue you encountered..."
                }
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={5}
              />
              <p className="text-xs text-slate-400">{errorDescription.length}/500 characters</p>
            </div>

            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!videoFile || !errorDescription.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
