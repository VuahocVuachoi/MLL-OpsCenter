"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Save, Calendar, Upload, X, CheckCircle, XCircle } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

interface TimeSheetRow {
  id: string
  username: string
  pinCode: string
  pinQuantity: string
  workTime: string
  jobType: string
  country: string
  notes: string
}

interface DailySubmission {
  date: string
  status: "pending" | "approved" | "rejected"
  totalPins: number
  totalMinutes: number
  averageHours: number
  approvedBy?: string
  approvalDate?: string
}

export function TimeSheetsTab() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [rows, setRows] = useState<TimeSheetRow[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [isEditing, setIsEditing] = useState(true)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<DailySubmission["status"] | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [dailySubmissions, setDailySubmissions] = useState<DailySubmission[]>([])
  const [isLoadingRows, setIsLoadingRows] = useState(false)
  const [dragFill, setDragFill] = useState<{ field: keyof TimeSheetRow; value: string } | null>(null)
  const [rejectNotice, setRejectNotice] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [rejectedItems, setRejectedItems] = useState<
    { jobType: string; country: string; pinCode: string; quantity: string; workTime: string }[]
  >([])

  const totalPins = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.pinQuantity) || 0), 0), [rows])
  const totalMinutes = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.workTime) || 0), 0), [rows])

  const usernamePrefix = useMemo(() => {
    if (!currentUser) return ""
    if (currentUser.accountName) return currentUser.accountName
    if (!currentUser.email) return ""
    const localPart = currentUser.email.split("@")[0]?.toLowerCase() || ""
    if (!localPart) return ""
    const prefix = currentUser.role === "mll" ? "mlops_analyst" : "mlops_manager"
    return `${prefix}_${localPart}`
  }, [currentUser])

  const modeOptions = [
    "Label",
    "Label recorrection",
    "QC - labeling",
    "Team call",
    "GPS search",
    "Adding archetype",
    "Training",
    "Document preparation",
    "Pins review & assignment",
    "DF review",
    "QC - df review",
    "Map review",
    "Polygon check",
    "QC - polygon check",
    "Tool issues",
    "Pins loading",
    "GT check",
    "Timesheet prep.",
    "BD list",
    "Point Dropper",
    "Demo task",
    "Re - training",
    "EUDR TK",
  ]

  const countryOptions = [
    "Angola",
    "Bolivia",
    "Brazil",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "China (Yunnan)",
    "Colombia",
    "Congo",
    "Costa Rica",
    "Côte d'Ivoire",
    "Cuba",
    "Dominican Republic",
    "DR Congo",
    "Ecuador",
    "El Salvador",
    "Ethiopia",
    "Ghana",
    "Guatemala",
    "Guinea",
    "Honduras",
    "India",
    "Indonesia",
    "Jamaica",
    "Kenya",
    "Laos",
    "Liberia",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Mexico",
    "Myanmar",
    "Nicaragua",
    "Nigeria",
    "Panama",
    "Philippines",
    "PNG",
    "Sierra Leone",
    "Sri Lanka",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Uganda",
    "Venezuela",
    "United States - Hawaii",
    "Viet Nam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
    "Rwanda",
    "Peru",
  ]

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") return
    const key = `login_started_at_${currentUser.id}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, Date.now().toString())
    }
  }, [currentUser])

  useEffect(() => {
    const handleMouseUp = () => setDragFill(null)
    window.addEventListener("mouseup", handleMouseUp)
    return () => window.removeEventListener("mouseup", handleMouseUp)
  }, [])

  useEffect(() => {
    if (!usernamePrefix) return
    if (rows.length === 0) {
      setRows([
        {
          id: Date.now().toString(),
          username: usernamePrefix,
          pinCode: "",
          pinQuantity: "",
          workTime: "",
          jobType: "",
          country: "",
          notes: "",
        },
      ])
      return
    }
    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        username: usernamePrefix,
      })),
    )
  }, [usernamePrefix])

  useEffect(() => {
    const loadStatus = async () => {
      if (!currentUser) return
      const { data, error } = await supabase
        .from("time_sheets")
        .select("status")
        .eq("user_id", currentUser.id)
        .eq("work_date", selectedDate)
        .limit(1)
      if (error) return
      setSubmissionStatus(data?.[0]?.status ?? null)
    }
    void loadStatus()
  }, [currentUser, selectedDate, supabase])

  useEffect(() => {
    const loadRejectNotice = async () => {
      if (!currentUser) return
      const { data } = await supabase
        .from("notifications")
        .select("message,created_at")
        .eq("user_id", currentUser.id)
        .eq("event_type", "rejected")
        .eq("work_date", selectedDate)
        .order("created_at", { ascending: false })
        .limit(1)
      const message = data?.[0]?.message || ""
      setRejectNotice(message)
      const parsed = parseRejectMessage(message)
      setRejectReason(parsed.reason)
      setRejectedItems(parsed.items)
    }
    void loadRejectNotice()
  }, [currentUser, selectedDate, supabase])

  const parseRejectMessage = (message: string) => {
    if (!message) return { reason: "", items: [] as { jobType: string; country: string; pinCode: string; quantity: string; workTime: string }[] }
    const reasonMatch = message.match(/Lý do:\s*(.+)/i)
    const reason = reasonMatch?.[1]?.trim() || ""
    const itemsIndex = message.indexOf("Mục không hợp lệ:")
    if (itemsIndex === -1) return { reason, items: [] }
    const itemsBlock = message.slice(itemsIndex).split("\n").slice(1)
    const items = itemsBlock
      .map((line) => line.replace(/^-+\s*/, "").trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim())
        return {
          jobType: parts[0] || "",
          country: parts[1] || "",
          pinCode: parts[2] || "",
          quantity: parts[3]?.replace(/pin/i, "").trim() || "",
          workTime: parts[4]?.replace(/phút/i, "").trim() || "",
        }
      })
      .filter((item) => item.jobType || item.country || item.pinCode)
    return { reason, items }
  }

  const isRejectedRow = (row: TimeSheetRow) => {
    if (!rejectedItems.length) return false
    return rejectedItems.some((item) => {
      const jobOk = item.jobType ? item.jobType === (row.jobType || "N/A") : true
      const countryOk = item.country ? item.country === (row.country || "N/A") : true
      const pinOk = item.pinCode ? item.pinCode === (row.pinCode || "N/A") : true
      const qtyOk = item.quantity ? item.quantity === (row.pinQuantity || "0") : true
      const timeOk = item.workTime ? item.workTime === (row.workTime || "0") : true
      return jobOk && countryOk && pinOk && qtyOk && timeOk
    })
  }

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser) return
      const { data, error } = await supabase
        .from("time_sheets")
        .select("work_date,status,approved_at,pin_count,duration_minutes")
        .eq("user_id", currentUser.id)
        .order("work_date", { ascending: false })
        .limit(30)
      if (error || !data) return
      const seen = new Set<string>()
      const grouped: Record<string, typeof data> = {}
      for (const row of data) {
        const date = row.work_date as string
        if (!grouped[date]) grouped[date] = []
        grouped[date].push(row)
      }

      const mapped: DailySubmission[] = Object.entries(grouped).map(([date, rows]) => {
        const totalPins = rows.reduce((sum, row) => sum + (row.pin_count ?? 0), 0)
        const totalMinutes = rows.reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0)
        return {
          date,
          status: (rows[0]?.status ?? "pending") as DailySubmission["status"],
          totalPins,
          totalMinutes,
          averageHours: totalPins > 0 ? Number((totalMinutes / totalPins / 60).toFixed(1)) : 0,
          approvalDate: rows[0]?.approved_at ? new Date(rows[0].approved_at).toLocaleDateString("vi-VN") : undefined,
        }
      })

      mapped.sort((a, b) => (a.date < b.date ? 1 : -1))
      setDailySubmissions(mapped)
    }
    if (showEditModal) {
      void loadHistory()
    }
  }, [currentUser, showEditModal, supabase])

  const loadRowsForDate = async (date: string) => {
    if (!currentUser) return
    setIsLoadingRows(true)
    const { data, error } = await supabase
      .from("time_sheets")
      .select("pin_id,pin_count,duration_minutes,mode,country,notes,user_name,status")
      .eq("user_id", currentUser.id)
      .eq("work_date", date)
      .order("pin_id", { ascending: true })
    if (error || !data || data.length === 0) {
      setRows([
        {
          id: Date.now().toString(),
          username: usernamePrefix,
          pinCode: "",
          pinQuantity: "",
          workTime: "",
          jobType: "",
          country: "",
          notes: "",
        },
      ])
      setIsLoadingRows(false)
      return
    }

    const mappedRows: TimeSheetRow[] = data.map((row, idx) => ({
      id: `${date}-${idx}`,
      username: row.user_name || usernamePrefix,
      pinCode: row.pin_id || "",
      pinQuantity: row.pin_count?.toString() || "",
      workTime: row.duration_minutes?.toString() || "",
      jobType: row.mode || "",
      country: row.country || "",
      notes: row.notes || "",
    }))

    const status = (data[0]?.status ?? "pending") as DailySubmission["status"]
    setRows(mappedRows)
    setSubmissionStatus(status)
    setHasSubmitted(true)
    setIsEditing(status !== "approved")
    setIsLoadingRows(false)
  }

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        username: usernamePrefix,
        pinCode: "",
        pinQuantity: "",
        workTime: "",
        jobType: "",
        country: "",
        notes: "",
      },
    ])
  }

  const updateRow = (id: string, field: keyof TimeSheetRow, value: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const startDragFill = (field: keyof TimeSheetRow, value: string) => {
    if (!isEditing) return
    setDragFill({ field, value })
  }

  const handleDragFillEnter = (rowId: string) => {
    if (!dragFill) return
    updateRow(rowId, dragFill.field, dragFill.value)
  }

  const sanitizePinId = (value: string) => value.replace(/[^0-9-]/g, "")
  const sanitizeInt = (value: string) => value.replace(/[^0-9]/g, "")

  const deleteRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id))
  }

  const clearAllRows = () => {
    setRows([
      {
        id: Date.now().toString(),
        username: usernamePrefix,
        pinCode: "",
        pinQuantity: "",
        workTime: "",
        jobType: "",
        country: "",
        notes: "",
      },
    ])
  }

  const handlePasteData = () => {
    const lines = pasteContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
    const newRows: TimeSheetRow[] = []

    lines.forEach((line, idx) => {
      const cells = line.split("\t")
      if (cells.length >= 3) {
        newRows.push({
          id: Date.now().toString() + idx,
          username: usernamePrefix || "",
          pinCode: cells[0]?.trim() || "",
          pinQuantity: cells[1]?.trim() || "",
          workTime: cells[2]?.trim() || "",
          jobType: "",
          country: "",
          notes: cells[3]?.trim() || "",
        })
      }
    })

    if (newRows.length > 0) {
      setRows(newRows)
      setShowPasteModal(false)
      setPasteContent("")
      alert(`Successfully imported ${newRows.length} rows from Google Sheets`)
    } else {
      alert("No valid data found. Make sure to copy 3+ tab-separated columns from Google Sheets.")
    }
  }

  const buildActionsDuplicated = (row: TimeSheetRow) => {
    const parts = [row.country, row.pinCode, row.jobType].filter(Boolean)
    return parts.join(" ")
  }

  const getSessionWorkedDay = () => {
    if (!currentUser) return false
    if (typeof window === "undefined") return false
    const stored = localStorage.getItem(`login_started_at_${currentUser.id}`)
    if (!stored) return false
    const startedAt = Number.parseInt(stored, 10)
    if (!Number.isFinite(startedAt)) return false
    const hours = (Date.now() - startedAt) / (1000 * 60 * 60)
    return hours >= 3
  }

  const submit = async () => {
    if (!currentUser) {
      setSubmitError("Không tìm thấy thông tin user. Vui lòng đăng nhập lại.")
      return
    }
    if (!rows.length) {
      setSubmitError("Vui lòng nhập ít nhất 1 dòng.")
      return
    }

    setSubmitError("")
    setIsSubmitting(true)

    const { error: deleteError } = await supabase
      .from("time_sheets")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("work_date", selectedDate)

    if (deleteError) {
      setSubmitError(deleteError.message || "Không thể cập nhật dữ liệu. Vui lòng thử lại.")
      setIsSubmitting(false)
      return
    }

    const workedDay = getSessionWorkedDay()
    const payload = rows.map((row) => ({
      user_id: currentUser.id,
      user_name: row.username || usernamePrefix,
      work_date: selectedDate,
      pin_id: row.pinCode,
      country: row.country,
      mode: row.jobType,
      actions_duplicated: buildActionsDuplicated(row),
      duration_minutes: Number.parseInt(row.workTime || "0", 10) || 0,
      ot: false,
      bu_gio: false,
      approved: false,
      status: "pending",
      worked_day: workedDay,
      pin_count: Number.parseInt(row.pinQuantity || "0", 10) || 0,
      notes: row.notes || "",
    }))

    const { error: insertError } = await supabase.from("time_sheets").insert(payload)
    if (insertError) {
      setSubmitError(insertError.message || "Không thể lưu dữ liệu. Vui lòng thử lại.")
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setHasSubmitted(true)
    setIsEditing(false)
    setSubmissionStatus("pending")
  }

  const handleSubmitClick = () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }
    void submit()
  }

  const handleHistoryCardClick = (date: string) => {
    setSelectedDate(date)
    setShowEditModal(false)
    void loadRowsForDate(date)
  }

  const handleBackToToday = () => {
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
    setSubmissionStatus(null)
    setHasSubmitted(false)
    setIsEditing(true)
    setRows([
      {
        id: Date.now().toString(),
        username: usernamePrefix,
        pinCode: "",
        pinQuantity: "",
        workTime: "",
        jobType: "",
        country: "",
        notes: "",
      },
    ])
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Date header */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">⏰</span> Time Sheets - {new Date(selectedDate).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" })}
              </h3>
              {hasSubmitted && !isEditing && <p className="text-sm text-blue-600 mt-2 font-medium">✓ Dữ liệu đã lưu</p>}
              {submissionStatus === "approved" && <p className="text-sm text-green-600 mt-2 font-medium">✓ Đã duyệt</p>}
              {submissionStatus === "rejected" && <p className="text-sm text-red-600 mt-2 font-medium">✕ Bị từ chối</p>}
              {submissionStatus === "pending" && <p className="text-sm text-amber-600 mt-2 font-medium">⏳ Chờ duyệt</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPasteModal(true)}
                disabled={!isEditing}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Dán từ Sheets
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4" />
                Xem lịch sử
              </button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 w-8">STT</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-32">Username</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-32">Loại công việc</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-24">Quốc gia</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-28">PIN ID</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-24">Số lượng</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-24">Thời gian (phút)</th>
                  <th className="px-3 py-3 text-left font-semibold text-slate-700 min-w-40">Ghi chú</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-700 w-12">
                    <button
                      type="button"
                      onClick={clearAllRows}
                      disabled={!isEditing}
                      className="text-slate-700 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Xoá tất cả dữ liệu"
                    >
                      Xoá
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-200 transition-colors ${
                      isRejectedRow(row) ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-3 py-3 text-slate-700 font-medium">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <Input
                        value={row.username}
                        onChange={(e) => updateRow(row.id, "username", e.target.value)}
                        disabled={!isEditing || !!usernamePrefix}
                        placeholder="Username"
                        className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td
                      className={`px-3 py-3 relative group ${dragFill?.field === "jobType" ? "bg-blue-50" : ""}`}
                      onMouseEnter={() => handleDragFillEnter(row.id)}
                    >
                      <Select
                        value={row.jobType}
                        onValueChange={(value) => updateRow(row.id, "jobType", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed">
                          <SelectValue placeholder="Chọn công việc" />
                        </SelectTrigger>
                        <SelectContent className="animate-none transition-none">
                          {modeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.jobType && isEditing && (
                        <button
                          type="button"
                          onMouseDown={() => startDragFill("jobType", row.jobType)}
                          className="absolute right-2 bottom-2 h-2 w-2 rounded-full bg-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-opacity"
                          title="Kéo để fill"
                        />
                      )}
                    </td>
                    <td
                      className={`px-3 py-3 relative group ${dragFill?.field === "country" ? "bg-blue-50" : ""}`}
                      onMouseEnter={() => handleDragFillEnter(row.id)}
                    >
                      <Select
                        value={row.country}
                        onValueChange={(value) => updateRow(row.id, "country", value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed">
                          <SelectValue placeholder="Chọn quốc gia" />
                        </SelectTrigger>
                        <SelectContent className="animate-none transition-none">
                          {countryOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.country && isEditing && (
                        <button
                          type="button"
                          onMouseDown={() => startDragFill("country", row.country)}
                          className="absolute right-2 bottom-2 h-2 w-2 rounded-full bg-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-opacity"
                          title="Kéo để fill"
                        />
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={row.pinCode}
                        onChange={(e) => updateRow(row.id, "pinCode", sanitizePinId(e.target.value))}
                        disabled={!isEditing}
                        placeholder="e.g., 36800-37000"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={row.pinQuantity}
                        onChange={(e) => updateRow(row.id, "pinQuantity", sanitizeInt(e.target.value))}
                        disabled={!isEditing}
                        placeholder="Qty"
                        type="number"
                        inputMode="numeric"
                        className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={row.workTime}
                        onChange={(e) => updateRow(row.id, "workTime", sanitizeInt(e.target.value))}
                        disabled={!isEditing}
                        placeholder="Minutes"
                        type="number"
                        inputMode="numeric"
                        className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <Input
                        value={row.notes}
                        onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Notes"
                        className="bg-white border-slate-300 text-slate-900 text-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        disabled={!isEditing}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {submissionStatus === "rejected" && (rejectReason || rejectNotice) && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs">!</span>
              <p className="text-sm font-semibold text-red-700">Lý do reject:</p>
              <p className="text-sm text-red-700 whitespace-pre-wrap">{rejectReason || rejectNotice}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={addRow}
            disabled={!isEditing}
            className="px-6 py-2 border-2 border-slate-400 text-slate-700 rounded-full font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            THÊM DÒNG
          </button>
          {submissionStatus !== "approved" && (
            <button
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Đang lưu..." : !isEditing ? "CHỈNH SỬA" : hasSubmitted ? "LƯU LẠI" : "SUBMIT"}
            </button>
          )}
        </div>
        {submitError && <p className="text-center text-sm text-red-500 mt-3">{submitError}</p>}

        {/* Modern Summary Section */}
        <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Tổng kết hôm nay</h4>
              <p className="text-sm text-slate-400">Thống kê hoạt động của ngày</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Pins Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-2">Tổng số Pin</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {totalPins}
                </p>
                <p className="text-blue-100 text-xs">Tổng số pin</p>
              </div>
            </div>

            {/* Total Minutes Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-cyan-100 text-sm font-medium mb-2">Tổng thời gian</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {totalMinutes}
                </p>
                <p className="text-cyan-100 text-xs">Phút làm việc</p>
              </div>
            </div>

            {/* Average per Pin Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-indigo-100 text-sm font-medium mb-2">Giờ/Pin</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {(() => {
                    return totalPins > 0 ? (totalMinutes / totalPins / 60).toFixed(1) : "0.0"
                  })()}
                </p>
                <p className="text-indigo-100 text-xs">Giờ/Pin</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Paste from Sheets Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Dán dữ liệu từ Google Sheets</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Sao chép các hàng từ Google Sheets (cột: PIN ID, Số lượng, Thời gian (phút), Ghi chú - tuỳ chọn) và dán vào đây:
            </p>

            <Textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste your data here..."
              className="w-full h-48 mb-6 p-4 border border-slate-300 rounded-lg font-mono text-xs !text-black placeholder:text-slate-400"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 Cách sử dụng:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Mở Google Sheets của bạn</li>
                <li>Chọn các hàng dữ liệu (tất cả các cột cần thiết)</li>
                <li>Nhấn Ctrl+C (hoặc Cmd+C) để sao chép</li>
                <li>Dán vào hộp dữ liệu bên trên</li>
                <li>Nhấn nút "Nhập dữ liệu"</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPasteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                HỦY
              </button>
              <button
                onClick={handlePasteData}
                disabled={!pasteContent.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                NHẬP DỮ LIỆU
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Lịch sử chấm công</h3>
                  <p className="text-sm text-slate-600">Xem trạng thái phê duyệt từ MLQC QC</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToToday}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {dailySubmissions.map((submission) => (
                <motion.div
                  key={submission.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    onClick={() => handleHistoryCardClick(submission.date)}
                    className="w-full text-left bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-lg hover:bg-blue-50 transition-all duration-300 group"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[180px,1fr,180px] gap-6 items-start">
                        {/* Left - Date */}
                        <div className="flex flex-col">
                          <p className="text-2xl font-bold text-slate-900">
                            {new Date(submission.date).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </p>
                          <p className="text-sm text-slate-600 mt-1 font-medium">Ngày chấm công</p>
                        </div>

                        {/* Center - Stats (Always visible) */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm group-hover:border-blue-400 transition-colors">
                            <p className="text-xs text-slate-600 font-medium mb-2">Tổng số Pin</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {submission.totalPins}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-cyan-200 shadow-sm group-hover:border-cyan-400 transition-colors">
                            <p className="text-xs text-slate-600 font-medium mb-2">Tổng thời gian</p>
                            <p className="text-2xl font-bold text-cyan-600">
                              {submission.totalMinutes}
                            </p>
                            <p className="text-xs text-slate-500">phút</p>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm group-hover:border-indigo-400 transition-colors">
                            <p className="text-xs text-slate-600 font-medium mb-2">Giờ/Pin</p>
                            <p className="text-2xl font-bold text-indigo-600">
                              {submission.averageHours}
                            </p>
                          </div>
                        </div>

                        {/* Right - Approval Status */}
                        <div className="flex flex-col items-center justify-center">
                          {submission.status === "pending" && (
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-1">
                                <Calendar className="w-7 h-7 text-yellow-600" />
                              </div>
                              <p className="font-semibold text-slate-900 text-xs">Chờ duyệt</p>
                              <p className="text-xs text-slate-500">Awaiting MLQC</p>
                            </div>
                          )}

                          {submission.status === "approved" && (
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                                <CheckCircle className="w-7 h-7 text-green-600" />
                              </div>
                              <p className="font-semibold text-green-700 text-xs">Approved</p>
                              <p className="text-xs text-slate-500">{submission.approvalDate}</p>
                            </div>
                          )}

                          {submission.status === "rejected" && (
                            <div className="text-center">
                              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
                                <XCircle className="w-7 h-7 text-red-600" />
                              </div>
                              <p className="font-semibold text-red-700 text-xs">Rejected</p>
                              <p className="text-xs text-slate-500">{submission.approvalDate}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 mt-6 pt-4 flex justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
