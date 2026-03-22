"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"

// Vietnamese holidays 2025
const VIETNAMESE_HOLIDAYS = [
  { date: "2025-01-01", name: "New Year's Day" },
  { date: "2025-01-29", name: "Lunar New Year" },
  { date: "2025-01-30", name: "Lunar New Year" },
  { date: "2025-01-31", name: "Lunar New Year" },
  { date: "2025-02-01", name: "Lunar New Year" },
  { date: "2025-02-02", name: "Lunar New Year" },
  { date: "2025-02-03", name: "Lunar New Year" },
  { date: "2025-04-18", name: "Hung Kings' Commemoration Day" },
  { date: "2025-04-30", name: "Reunification Day" },
  { date: "2025-05-01", name: "International Labor Day" },
  { date: "2025-09-02", name: "National Day" },
]

const STATUS_CONFIG = {
  C: { label: "Working", color: "bg-green-500", lightColor: "bg-green-100", textColor: "text-green-700" },
  OFF: { label: "Off", color: "bg-gray-500", lightColor: "bg-gray-100", textColor: "text-gray-700" },
  HOLIDAY: {
    label: "Holiday",
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
}

const MLL_USERS = [
  "mlops_analyst_nqtoan",
  "mlops_analyst_ttkthanh",
  "mlops_analyst_ndthinh",
  "mlops_analyst_ttnminh",
  "mlops_analyst_pthuyen",
  "mlops_analyst_mtmngan",
  "mlops_analyst_vhtuyen",
  "mlops_analyst_ttnyen",
  "mlops_analyst_nhtvuong",
  "mlops_analyst_nhuyen",
  "mlops_analyst_tvbac",
  "mlops_analyst_tttan",
  "mlops_analyst_tnvanh",
  "mlops_analyst_bthuy",
  "mlops_analyst_nntuyen",
  "mlops_analyst_lndquynh",
  "mlops_analyst_nntvy",
  "mlops_analyst_ntttuyen",
  "mlops_analyst_ntpthao",
  "mlops_analyst_tdthuan",
]

export function AttendanceCalendarView() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [workedByDate, setWorkedByDate] = useState<Record<string, Set<string>>>({})

  const isWeekend = (date: Date): boolean => {
    return date.getDay() === 0 || date.getDay() === 6
  }

  const isHoliday = (dateStr: string): string | null => {
    const holiday = VIETNAMESE_HOLIDAYS.find((h) => h.date === dateStr)
    return holiday ? holiday.name : null
  }

  const getDaysInMonth = (): Date[] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    const days: Date[] = []
    const startOffset = (firstDay.getDay() + 6) % 7
    for (let i = 0; i < startOffset; i++) {
      days.push(new Date(year, month, -(startOffset - i - 1)))
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    const endOffset = (lastDay.getDay() + 6) % 7
    for (let i = 1; i < 7 - endOffset; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const getDateString = (date: Date): string => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const year = parts.find((p) => p.type === "year")?.value
    const month = parts.find((p) => p.type === "month")?.value
    const day = parts.find((p) => p.type === "day")?.value
    return `${year}-${month}-${day}`
  }

  const getAttendanceForDate = (dateStr: string) => {
    const workedSet = workedByDate[dateStr] || new Set<string>()
    return MLL_USERS.map((username, index) => ({
      id: index + 1,
      name: username,
      status: workedSet.has(username) ? "C" : "OFF",
      country: "Peru",
    }))
  }

  useEffect(() => {
    const loadWorkedDays = async () => {
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const start = new Date(year, month, 1).toISOString().split("T")[0]
      const end = new Date(year, month + 1, 0).toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("time_sheets")
        .select("work_date,user_name,pin_id,pin_count,duration_minutes,mode,country,notes")
        .gte("work_date", start)
        .lte("work_date", end)

      if (error || !data) return

      const mapped: Record<string, Set<string>> = {}
      data.forEach((row) => {
        const hasInput = [row.pin_id, row.pin_count, row.duration_minutes, row.mode, row.country, row.notes].some((value) =>
          String(value ?? "").trim() !== "",
        )
        if (!hasInput) return
        const date = row.work_date as string
        const name = row.user_name as string
        if (!mapped[date]) mapped[date] = new Set()
        mapped[date].add(name)
      })
      setWorkedByDate(mapped)
    }
    void loadWorkedDays()
  }, [currentMonth, supabase])

  const days = getDaysInMonth()
  const monthName = currentMonth.toLocaleString("vi-VN", { month: "long", year: "numeric" })
  const selectedDateAttendance = selectedDate ? getAttendanceForDate(selectedDate) : []
  const selectedDateCounts = selectedDateAttendance.reduce(
    (acc, item) => {
      if (item.status === "C") {
        acc.worked += 1
      } else {
        acc.off += 1
      }
      return acc
    },
    { worked: 0, off: 0 },
  )
  const selectedDateInfo = selectedDate ? new Date(selectedDate) : null

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900">Employee Attendance Calendar</h3>
            <p className="text-sm text-slate-600 mt-1">
              View work calendar details - Click a day to see employee list
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <span className="text-lg font-semibold text-slate-900 min-w-48 text-center">{monthName}</span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                <div key={day} className="h-10 flex items-center justify-center font-semibold text-slate-700 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, idx) => {
                const dateStr = getDateString(date)
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isWknd = isWeekend(date)
                const holiday = isHoliday(dateStr)
                const attendanceCount = workedByDate[dateStr]?.size || 0
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === new Date().toISOString().split("T")[0]

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    className="relative"
                  >
                    <button
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`
                        w-full h-24 rounded-xl p-2 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer
                        ${isCurrentMonth ? "border-2" : "opacity-50"}
                        ${isSelected ? "border-blue-500 bg-blue-50 shadow-lg" : ""}
                        ${isToday && !isSelected ? "ring-2 ring-blue-300" : ""}
                        ${
                          holiday && !isSelected
                            ? "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-300"
                            : isWknd && !isSelected
                              ? "bg-slate-50 border-slate-200"
                              : !isSelected
                                ? "bg-white border-slate-200 hover:border-blue-300"
                                : ""
                        }
                      `}
                    >
                      {/* Date Number */}
                      <div className={`text-lg font-bold ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                        {date.getDate()}
                      </div>

                      {/* Attendance Count Badge */}
                      {attendanceCount > 0 && (
                        <div className="mt-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-blue-200 text-blue-700">
                          {attendanceCount} people
                        </div>
                      )}

                      {/* Holiday Indicator */}
                      {holiday && (
                        <div className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold text-purple-700">Holiday</div>
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-4">Status legend:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${config.lightColor}`} />
                  <span className="text-sm text-slate-700">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {selectedDate && selectedDateAttendance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Employee list - {selectedDateInfo?.toLocaleDateString("en-GB")}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedDateCounts.worked} working • {selectedDateCounts.off} off
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            <div className="space-y-3">
                      {selectedDateAttendance.map((emp, idx) => {
                const statusConfig = STATUS_CONFIG[emp.status as keyof typeof STATUS_CONFIG]
                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {emp.name.split("_").pop()?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-600">Peru</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.lightColor}`}>
                      <span className={statusConfig.textColor}>{statusConfig.label}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
