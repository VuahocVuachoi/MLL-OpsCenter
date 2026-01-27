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

const mockSubmissions: UserDaySubmission[] = [
  {
    date: new Date().toISOString().split("T")[0],
    username: "miops_analyst_ntqhao",
    totalPins: 3,
    totalTime: 900,
    averageHours: 5,
    workedDay: true,
    status: "pending",
    details: [
      { pinCode: "36800-37000", quantity: "1", workTime: "420", jobType: "df review", country: "Peru", notes: "Peru 36800-37000 df review" },
      { pinCode: "94401-94600", quantity: "1", workTime: "330", jobType: "df review", country: "Peru", notes: "Peru 94401-94600 df review" },
      { pinCode: "95601-95800", quantity: "1", workTime: "150", jobType: "df review", country: "Peru", notes: "Peru 95601-95800 df review" },
    ],
  },
  {
    date: new Date().toISOString().split("T")[0],
    username: "miops_analyst_tybac",
    totalPins: 2,
    totalTime: 600,
    averageHours: 5,
    workedDay: true,
    status: "approved",
    details: [
      { pinCode: "36800-37000", quantity: "1", workTime: "350", jobType: "label", country: "Brazil", notes: "Brazil label work" },
      { pinCode: "50000-51000", quantity: "1", workTime: "250", jobType: "df review", country: "Brazil", notes: "Brazil review" },
    ],
  },
]

export function MonthlyTeamData({ onSummaryChange }: MonthlyTeamDataProps) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [submissions, setSubmissions] = useState<UserDaySubmission[]>(mockSubmissions)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [minPinFilter, setMinPinFilter] = useState<string>("")
  const [commentRow, setCommentRow] = useState<number | null>(null)
  const [commentText, setCommentText] = useState<string>("")
  const [showCommentModal, setShowCommentModal] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadError, setLoadError] = useState("")
  const [activeLoginCount, setActiveLoginCount] = useState(0)
  const data = submissions.flatMap((submission, index) =>
    submission.details.map((detail, detailIndex) => ({
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
    const loadData = async () => {
      setLoadError("")
      const { data: rows, error } = await supabase
        .from("time_sheets")
        .select("user_name,work_date,pin_id,pin_count,duration_minutes,mode,country,notes,status,worked_day")
        .eq("work_date", selectedDate)
        .order("user_name", { ascending: true })

      if (error) {
        setLoadError(error.message || "Không thể tải dữ liệu.")
        return
      }

      if (!rows || rows.length === 0) {
        setSubmissions([])
        return
      }

      const grouped = rows.reduce<Record<string, typeof rows>>((acc, row) => {
        const key = `${row.user_name}-${row.work_date}`
        if (!acc[key]) acc[key] = []
        acc[key].push(row)
        return acc
      }, {})

      const mapped: UserDaySubmission[] = Object.values(grouped).map((groupRows) => {
        const totalPins = groupRows.reduce((sum, row) => sum + (row.pin_count || 0), 0)
        const totalTime = groupRows.reduce((sum, row) => sum + (row.duration_minutes || 0), 0)
        const workedDay = groupRows.some((row) => row.worked_day)
        return {
          date: groupRows[0].work_date,
          username: groupRows[0].user_name,
          totalPins,
          totalTime,
          averageHours: totalPins > 0 ? Number((totalTime / totalPins / 60).toFixed(1)) : 0,
          workedDay,
          status: (groupRows[0].status || "pending") as UserDaySubmission["status"],
          details: groupRows.map((row) => ({
            pinCode: row.pin_id,
            quantity: String(row.pin_count ?? ""),
            workTime: String(row.duration_minutes ?? ""),
            jobType: row.mode,
            country: row.country,
            notes: row.notes || "",
          })),
        }
      })

      setSubmissions(mapped)
    }

    void loadData()
  }, [selectedDate, supabase])

  useEffect(() => {
    const loadActiveLogins = async () => {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "mll")
        .gte("last_login_at", startOfToday.toISOString())
        .lte("last_login_at", endOfToday.toISOString())

      if (!error) {
        setActiveLoginCount(data?.length ?? 0)
        return
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "mll")
        .gte("updated_at", startOfToday.toISOString())
        .lte("updated_at", endOfToday.toISOString())

      if (!fallbackError) {
        setActiveLoginCount(fallbackData?.length ?? 0)
      }
    }

    void loadActiveLogins()
  }, [supabase])

  useEffect(() => {
    if (!onSummaryChange) return
    const activeToday = activeLoginCount
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
  }, [submissions, activeLoginCount, onSummaryChange])

  const updateStatus = async (submissionDate: string, username: string, status: UserDaySubmission["status"]) => {
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
      setLoadError(error.message || "Không thể cập nhật trạng thái.")
      return
    }

    setSubmissions(
      submissions.map((s) =>
        s.date === submissionDate && s.username === username ? { ...s, status } : s,
      ),
    )
  }

  const handleApprove = (submissionDate: string, username: string) => {
    void updateStatus(submissionDate, username, "approved")
  }

  const handleReject = (submissionDate: string, username: string) => {
    void updateStatus(submissionDate, username, "rejected")
  }

  const handleRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setCommentRow(idx)
    setShowCommentModal(true)
  }

  const getInitials = (name: string) => {
    return name
      .split("_")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredSubmissions = submissions.filter((s) => s.date === selectedDate)

  const saveComment = () => {
    if (commentRow !== null) {
      const newData = [...data]
      newData[commentRow].notes = commentText
      setSubmissions(
        submissions.map((submission, index) =>
          index === Math.floor(commentRow / submission.details.length)
            ? {
                ...submission,
                details: submission.details.map((detail, detailIndex) =>
                  detailIndex === commentRow % submission.details.length ? { ...detail, notes: commentText } : detail
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
              <label className="block text-sm font-semibold text-slate-900 mb-2">Chọn ngày/tháng/năm</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border-slate-300 text-slate-900 text-lg"
              />
            </div>
            <div className="min-w-48">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Tối thiểu số PIN</label>
              <Input
                type="number"
                placeholder="VD: 20"
                value={minPinFilter}
                onChange={(e) => setMinPinFilter(e.target.value)}
                min="0"
                className="w-full bg-white border-slate-300 text-slate-900"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Tìm kiếm
            </button>
          </div>
        </Card>

        {/* Submission Summary Cards */}
        <div className="space-y-3">
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map((submission) => {
              const isExpanded = expandedId === `${submission.date}-${submission.username}`

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
                          <p className="text-xs text-slate-500">Submitted on {new Date(submission.date).toLocaleDateString("vi-VN")}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 flex-1">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-slate-600 font-medium">Tổng số Pin</p>
                          <p className="text-2xl font-bold text-blue-600">{submission.totalPins}</p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                          <p className="text-xs text-slate-600 font-medium">Tổng thời gian</p>
                          <p className="text-2xl font-bold text-cyan-600">{submission.totalTime}</p>
                          <p className="text-xs text-slate-500">phút</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                          <p className="text-xs text-slate-600 font-medium">Giờ/Pin</p>
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
                                  handleApprove(submission.date, submission.username)
                                }}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReject(submission.date, submission.username)
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
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Số lượng</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Thời gian (phút)</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Job Type</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Quốc gia</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submission.details.map((detail, idx) => (
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })
          ) : (
            <Card className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-slate-600 font-medium">Không có dữ liệu cho ngày được chọn</p>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thời gian (giờ)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Loại công việc</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Quốc gia</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ghi chú</th>
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
                          onClick={() => handleRightClick(new MouseEvent("contextmenu") as any, idx)}
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
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Thêm yêu cầu xử lý</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Mô tả vấn đề hoặc yêu cầu xử lý lại data..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={saveComment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Lưu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
