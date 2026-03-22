 "use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Copy, Download, MessageSquare } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

interface TimeSheetDetail {
  pinCode: string
  quantity: string
  workTime: string
  jobType: string
  country: string
  notes: string
}

interface UserDaySubmission {
  date: string
  username: string
  userId?: string
  totalPins: number
  totalTime: number
  averageHours: number
  workedDay: boolean
  status: "pending" | "approved" | "rejected"
  details: TimeSheetDetail[]
}

interface MonthlyTeamDataProps {
  onSummaryChange?: (summary: { activeToday: number; totalPins: number; avgPerformance: number }) => void
}

export function MonthlyTeamData({ onSummaryChange }: MonthlyTeamDataProps) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [selectedDate, setSelectedDate] = useState("")
  const [submissions, setSubmissions] = useState<UserDaySubmission[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [minPinFilter, setMinPinFilter] = useState<string>("")
  const [commentRow, setCommentRow] = useState<number | null>(null)
  const [commentText, setCommentText] = useState<string>("")
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadError, setLoadError] = useState("")
  const [rejectSelectionsByKey, setRejectSelectionsByKey] = useState<Record<string, Record<number, boolean>>>({})
  const [rejectCommentsByKey, setRejectCommentsByKey] = useState<Record<string, string>>({})
  const [rejectErrorsByKey, setRejectErrorsByKey] = useState<Record<string, string>>({})
  const safeSubmissions = Array.isArray(submissions) ? submissions.filter(Boolean) : []
  const data = safeSubmissions.flatMap((submission, index) =>
    (submission.details ?? []).filter(Boolean).map((detail, detailIndex) => ({
      stt: index + 1,
      name: submission.username,
      pinId: detail.pinCode,
      hours: detail.workTime,
      jobType: detail.jobType,
      country: detail.country,
      notes: detail.notes,
    }))
  )

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (selectedDate) return
    setSelectedDate(new Date().toISOString().split("T")[0])
  }, [selectedDate])

  useEffect(() => {
    if (!selectedDate) return
    const loadData = async () => {
      setLoadError("")
      const { data: rows, error } = await supabase
        .from("time_sheets")
        .select("user_id,user_name,work_date,pin_id,pin_count,duration_minutes,mode,country,notes,status,worked_day")
        .eq("work_date", selectedDate)
        .order("user_name", { ascending: true })

      if (error) {
        setLoadError(error.message || "Unable to load data.")
        return
      }

      if (!rows || rows.length === 0) {
        setSubmissions([])
        return
      }

      const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
        const safeName = row.user_name || "unknown"
        const key = `${safeName}-${row.work_date}`
        if (!acc[key]) acc[key] = []
        acc[key].push(row)
        return acc
      }, {})

      const mapped: UserDaySubmission[] = Object.values(grouped)
        .map((groupRows) => {
          if (!groupRows?.length) return null
        const totalPins = groupRows.reduce((sum, row) => sum + (row.pin_count || 0), 0)
        const totalTime = groupRows.reduce((sum, row) => sum + (row.duration_minutes || 0), 0)
        const workedDay = groupRows.some((row) =>
          [row.pin_id, row.pin_count, row.duration_minutes, row.mode, row.country, row.notes].some(
            (value) => String(value ?? "").trim() !== "",
          ),
        )
        const safeUsername = groupRows[0].user_name || "unknown"
        return {
          date: groupRows[0].work_date,
          username: safeUsername,
          userId: groupRows[0].user_id ?? undefined,
          totalPins,
          totalTime,
          averageHours: totalPins > 0 ? Number((totalTime / totalPins / 60).toFixed(1)) : 0,
          workedDay,
          status: (groupRows[0].status || "pending") as UserDaySubmission["status"],
          details: groupRows.map((row) => ({
            pinCode: row.pin_id || "",
            quantity: String(row.pin_count ?? ""),
            workTime: String(row.duration_minutes ?? ""),
            jobType: row.mode || "",
            country: row.country || "",
            notes: row.notes || "",
          })),
        }
        })
        .filter(Boolean) as UserDaySubmission[]

      setSubmissions(mapped)
    }

    void loadData()
  }, [selectedDate, supabase])

  useEffect(() => {
    if (!onSummaryChange) return
    const activeToday = submissions.filter((submission) => submission.workedDay).length
    const totalPins = submissions.reduce((sum, submission) => sum + submission.totalPins, 0)
    const avgHours =
      submissions.length > 0
        ? Number((submissions.reduce((sum, submission) => sum + submission.averageHours, 0) / submissions.length).toFixed(1))
        : 0
    onSummaryChange({
      activeToday,
      totalPins,
      avgPerformance: avgHours,
    })
  }, [submissions, onSummaryChange])

  const updateStatus = async (
    submissionDate: string,
    username: string,
    status: UserDaySubmission["status"],
    userId?: string,
    rejectPayload?: { comment: string; items: TimeSheetDetail[] },
  ) => {
    if (!currentUser) return
    const { error } = await supabase
      .from("time_sheets")
      .update({
        status,
        approved: status === "approved",
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq("work_date", submissionDate)
      .eq("user_name", username)

    if (error) {
      setLoadError(error.message || "Unable to update status.")
      return
    }

    if (userId) {
      const title = status === "approved" ? "Timesheet approved" : "Timesheet rejected"
      let message =
        status === "approved"
          ? `Timesheet ${submissionDate} has been approved.`
          : `Timesheet ${submissionDate} has been rejected.`
      if (status === "rejected" && rejectPayload) {
        const itemsText =
          rejectPayload.items.length > 0
            ? rejectPayload.items
                .map(
                  (item) =>
                    `- ${item.jobType || "N/A"} | ${item.country || "N/A"} | ${item.pinCode || "N/A"} | ${item.quantity || "0"} pin | ${item.workTime || "0"} minutes`,
                )
                .join("\n")
            : "- No specific items"
        message = `Timesheet ${submissionDate} has been rejected.\nReason: ${rejectPayload.comment}\nInvalid items:\n${itemsText}`
      }
      await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        event_type: status,
        work_date: submissionDate,
      })
    }

    setSubmissions(
      submissions.map((s) =>
        s.date === submissionDate && s.username === username ? { ...s, status } : s,
      ),
    )
  }

  const handleApprove = (submissionDate: string, username: string, userId?: string) => {
    void updateStatus(submissionDate, username, "approved", userId)
  }

  const handleInlineRejectSubmit = async (submission: UserDaySubmission) => {
    const key = `${submission.date}-${submission.username}`
    const selections = rejectSelectionsByKey[key] || {}
    const picked = Object.entries(selections)
      .filter(([, isRejected]) => isRejected)
      .map(([idx]) => Number.parseInt(idx, 10))
    const comment = (rejectCommentsByKey[key] || "").trim()

    if (!comment) {
      setRejectErrorsByKey((prev) => ({ ...prev, [key]: "Please enter a reject reason." }))
      return
    }
    if (picked.length === 0) {
      setRejectErrorsByKey((prev) => ({ ...prev, [key]: "Please select at least one invalid item." }))
      return
    }

    const items = picked.map((idx) => submission.details?.[idx]).filter(Boolean) as TimeSheetDetail[]
    await updateStatus(submission.date, submission.username, "rejected", submission.userId, {
      comment,
      items,
    })
    setRejectErrorsByKey((prev) => ({ ...prev, [key]: "" }))
  }

  const handleRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    openCommentForRow(idx)
  }

  const openCommentForRow = (idx: number) => {
    setCommentRow(idx)
    setShowCommentModal(true)
  }

  const getInitials = (name: string) => {
    if (!name) return "--"
    return name
      .split("_")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredSubmissions = safeSubmissions.filter((s) => s?.date === selectedDate)

  const saveComment = () => {
    if (commentRow !== null && data[commentRow]) {
      const newData = [...data]
      newData[commentRow].notes = commentText
      setSubmissions(
        submissions.map((submission, index) =>
          (submission.details ?? []).length > 0 && index === Math.floor(commentRow / (submission.details ?? []).length)
            ? {
                ...submission,
                details: (submission.details ?? []).map((detail, detailIndex) =>
                  detailIndex === commentRow % (submission.details ?? []).length ? { ...detail, notes: commentText } : detail
                ),
              }
            : submission
        )
      )
    }
    setShowCommentModal(false)
    setCommentRow(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="space-y-6">
        {/* Date Picker and Filters */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Select date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border-slate-300 text-slate-900 text-lg"
              />
            </div>
            <div className="min-w-48">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Minimum pins</label>
              <Input
                type="number"
                placeholder="e.g., 20"
                value={minPinFilter}
                onChange={(e) => setMinPinFilter(e.target.value)}
                min="0"
                className="w-full bg-white border-slate-300 text-slate-900"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Search
            </button>
          </div>
        </Card>

        {/* Submission Summary Cards */}
        <div className="space-y-3">
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((submission) => {
              const isExpanded = expandedId === `${submission.date}-${submission.username}`
              const details = (submission.details ?? []).filter(Boolean)

              return (
                <motion.div key={`${submission.date}-${submission.username}`} layout>
                  {/* Summary Card */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setExpandedId(isExpanded ? null : `${submission.date}-${submission.username}`)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setExpandedId(isExpanded ? null : `${submission.date}-${submission.username}`)
                      }
                    }}
                    className={`w-full text-left rounded-2xl p-6 transition-all group border-2 cursor-pointer ${
                      minPinFilter && submission.totalPins < Number.parseInt(minPinFilter)
                        ? "bg-red-50 border-red-300 hover:border-red-400 hover:shadow-lg"
                        : "bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* User Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {getInitials(submission.username)}
                        </div>

                        {/* User Info */}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">{submission.username}</p>
                          <p className="text-xs text-slate-500">
                            Submitted on {submission.date ? new Date(submission.date).toLocaleDateString("vi-VN") : "--"}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-slate-600 font-medium">Total pins</p>
                          <p className="text-2xl font-bold text-blue-600">{submission.totalPins}</p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                          <p className="text-xs text-slate-600 font-medium">Total time</p>
                          <p className="text-2xl font-bold text-cyan-600">{submission.totalTime}</p>
                          <p className="text-xs text-slate-500">minutes</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                          <p className="text-xs text-slate-600 font-medium">Hours/Pin</p>
                          <p className="text-2xl font-bold text-indigo-600">{submission.averageHours}</p>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {submission.status === "pending" && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(submission.date, submission.username, submission.userId)
                                }}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedId(`${submission.date}-${submission.username}`)
                                }}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {submission.status === "approved" && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Approved
                            </div>
                          )}
                          {submission.status === "rejected" && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                              <XCircle className="w-4 h-4" />
                              Rejected
                            </div>
                          )}
                        </div>
                        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                      {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-slate-50 border-2 border-slate-200 rounded-2xl overflow-hidden"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">PIN Code</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Quantity</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Time (minutes)</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Job Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Country</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Notes</th>
                              {submission.status === "pending" && (
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Reject</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {details.map((detail, idx) => (
                              <tr key={idx} className="border-b border-slate-200 bg-white hover:bg-blue-50">
                                <td className="px-4 py-3 text-slate-900 font-medium">{detail.pinCode}</td>
                                <td className="px-4 py-3 text-slate-700">{detail.quantity}</td>
                                <td className="px-4 py-3 text-slate-700">{detail.workTime}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    {detail.jobType}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {detail.country}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-xs">{detail.notes}</td>
                                {submission.status === "pending" && (
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={
                                        !!rejectSelectionsByKey[`${submission.date}-${submission.username}`]?.[idx]
                                      }
                                      onChange={(e) =>
                                        setRejectSelectionsByKey((prev) => {
                                          const key = `${submission.date}-${submission.username}`
                                          const current = prev[key] || {}
                                          return {
                                            ...prev,
                                            [key]: { ...current, [idx]: e.target.checked },
                                          }
                                        })
                                      }
                                      className="h-4 w-4 accent-red-500"
                                      title="Invalid"
                                    />
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {submission.status === "pending" && (
                        <div className="p-4 border-t border-slate-200 bg-white">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Reject reason</label>
                          <textarea
                            value={rejectCommentsByKey[`${submission.date}-${submission.username}`] || ""}
                            onChange={(e) =>
                              setRejectCommentsByKey((prev) => ({
                                ...prev,
                                [`${submission.date}-${submission.username}`]: e.target.value,
                              }))
                            }
                            placeholder="Enter reason..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-20"
                          />
                          {rejectErrorsByKey[`${submission.date}-${submission.username}`] && (
                            <p className="text-sm text-red-600 mt-2">
                              {rejectErrorsByKey[`${submission.date}-${submission.username}`]}
                            </p>
                          )}
                          <div className="flex justify-end mt-4">
                            <button
                              onClick={() => handleInlineRejectSubmit(submission)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                            >
                              Complete Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })
          ) : (
            <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-slate-600 font-medium">No data for the selected date</p>
            </Card>
          )}
        </div>

        {/* Team Data Table */}
        <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">User Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Pin ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time (hours)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Job Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Country</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={`${row.stt}-${row.pinId}-${idx}`}
                    className="border-b border-slate-200 hover:bg-slate-50 cursor-context-menu"
                    onContextMenu={(e) => handleRightClick(e, idx)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{row.stt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        <span className="text-sm text-slate-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.pinId}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.hours}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {row.jobType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {row.country}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.notes ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {row.notes.substring(0, 20)}...
                        </span>
                      ) : (
                        <button
                          onClick={() => openCommentForRow(idx)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs">Comment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Add processing request</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Describe the issue or request reprocessing..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveComment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  )
}
