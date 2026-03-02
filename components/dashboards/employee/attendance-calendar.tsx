"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

interface AttendanceCalendarProps {
  employeeName?: string
}

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
  S: { label: "Shift", color: "bg-yellow-500", lightColor: "bg-yellow-100", textColor: "text-yellow-700" },
  HC: { label: "Comp day", color: "bg-blue-500", lightColor: "bg-blue-100", textColor: "text-blue-700" },
  OFF: { label: "Off", color: "bg-gray-500", lightColor: "bg-gray-100", textColor: "text-gray-700" },
  OT: { label: "Overtime", color: "bg-red-500", lightColor: "bg-red-100", textColor: "text-red-700" },
  NLB: { label: "Leave", color: "bg-pink-500", lightColor: "bg-pink-100", textColor: "text-pink-700" },
  HOLIDAY: {
    label: "Holiday",
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
}

export function AttendanceCalendar({ employeeName = "You" }: AttendanceCalendarProps) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({})
  const [currentUser, setCurrentUser] = useState<User | null>(null)

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

  const getAttendanceStatus = (dateStr: string) => {
    return attendanceMap[dateStr] || null
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setCurrentUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    const loadAttendance = async () => {
      if (!currentUser) return
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const monthStart = new Date(year, month, 1).toISOString().split("T")[0]
      const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0]
      const { data, error } = await supabase
        .from("time_sheets")
        .select("work_date")
        .eq("user_id", currentUser.id)
        .gte("work_date", monthStart)
        .lte("work_date", monthEnd)
      if (error || !data) return
      const mapped: Record<string, string> = {}
      data.forEach((row) => {
        mapped[row.work_date] = "C"
      })
      setAttendanceMap(mapped)
    }
    void loadAttendance()
  }, [currentUser, currentMonth, supabase])

  const days = getDaysInMonth()
  const monthName = currentMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Work Calendar</h3>
              <p className="text-sm text-slate-600 mt-1">
                View work days, leave days, and holidays for {employeeName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={previousMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <span className="text-lg font-semibold text-slate-900 min-w-48 text-center">{monthName}</span>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
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
                const todayStr = getDateString(new Date())
                const attendance = getAttendanceStatus(dateStr) || (dateStr < todayStr ? "OFF" : null)
                const statusConfig = attendance ? STATUS_CONFIG[attendance as keyof typeof STATUS_CONFIG] : null

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    className="relative"
                  >
                    <div
                      className={`
                        h-20 rounded-xl p-2 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-default
                        ${isCurrentMonth ? "border-2" : "opacity-50"}
                        ${
                          holiday
                            ? "bg-gradient-to-br from-purple-100 to-purple-50 border-purple-300"
                            : statusConfig
                              ? `${statusConfig.lightColor} border-slate-200`
                              : isWknd
                                ? "bg-slate-50 border-slate-200"
                                : "bg-white border-slate-200"
                        }
                        ${statusConfig ? "hover:shadow-lg" : "hover:shadow-md"}
                      `}
                    >
                      {/* Date Number */}
                      <div className={`text-lg font-bold ${isCurrentMonth ? "text-slate-900" : "text-slate-400"}`}>
                        {date.getDate()}
                      </div>

                      {/* Status Badge */}
                      {statusConfig && (
                        <div className={`mt-1 px-2 py-1 rounded text-xs font-semibold ${statusConfig.lightColor}`}>
                          <span className={statusConfig.textColor}>{statusConfig.label}</span>
                        </div>
                      )}

                      {/* Holiday Indicator */}
                      {holiday && (
                        <div className="mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-200 text-purple-700">
                          Holiday
                        </div>
                      )}
                    </div>
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
    </div>
  )
}
