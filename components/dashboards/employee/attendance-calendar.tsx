"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AttendanceCalendarProps {
  employeeName?: string
}

// Vietnamese holidays 2025
const VIETNAMESE_HOLIDAYS = [
  { date: "2025-01-01", name: "Tết Dương lịch" },
  { date: "2025-01-29", name: "Tết Âm lịch" },
  { date: "2025-01-30", name: "Tết Âm lịch" },
  { date: "2025-01-31", name: "Tết Âm lịch" },
  { date: "2025-02-01", name: "Tết Âm lịch" },
  { date: "2025-02-02", name: "Tết Âm lịch" },
  { date: "2025-02-03", name: "Tết Âm lịch" },
  { date: "2025-04-18", name: "Giỗ Tổ Hùng Vương" },
  { date: "2025-04-30", name: "Ngày Giải phóng" },
  { date: "2025-05-01", name: "Quốc tế Lao động" },
  { date: "2025-09-02", name: "Ngày Quốc khánh" },
]

// Mock attendance data - in real app, this would come from props/API
const MOCK_ATTENDANCE: { [key: string]: string } = {
  "2025-11-01": "C", // Working
  "2025-11-02": "C",
  "2025-11-03": "S", // Shift
  "2025-11-04": "C",
  "2025-11-05": "HC", // Holiday Comp
  "2025-11-08": "C",
  "2025-11-09": "NLB", // Sick Leave
  "2025-11-10": "OFF", // Off/Weekend
  "2025-11-15": "C",
  "2025-11-16": "OT", // Overtime
}

const STATUS_CONFIG = {
  C: { label: "Đi làm", color: "bg-green-500", lightColor: "bg-green-100", textColor: "text-green-700" },
  S: { label: "Ca trực", color: "bg-yellow-500", lightColor: "bg-yellow-100", textColor: "text-yellow-700" },
  HC: { label: "Nghỉ bù", color: "bg-blue-500", lightColor: "bg-blue-100", textColor: "text-blue-700" },
  OFF: { label: "Không đi", color: "bg-gray-500", lightColor: "bg-gray-100", textColor: "text-gray-700" },
  OT: { label: "Thêm giờ", color: "bg-red-500", lightColor: "bg-red-100", textColor: "text-red-700" },
  NLB: { label: "Nghỉ phép", color: "bg-pink-500", lightColor: "bg-pink-100", textColor: "text-pink-700" },
  HOLIDAY: {
    label: "Ngày lễ",
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    textColor: "text-purple-700",
  },
}

export function AttendanceCalendar({ employeeName = "You" }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1))

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
    // Add empty days for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -(firstDay.getDay() - i - 1)))
    }
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    // Add empty days to fill the last week
    const lastDayOfWeek = lastDay.getDay()
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const getDateString = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const getAttendanceStatus = (dateStr: string) => {
    return MOCK_ATTENDANCE[dateStr] || null
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const days = getDaysInMonth()
  const monthName = currentMonth.toLocaleString("vi-VN", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Lịch Công việc</h3>
              <p className="text-sm text-slate-600 mt-1">
                Xem toàn bộ ngày đi làm, nghỉ phép, và các ngày lễ của {employeeName}
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
                const attendance = getAttendanceStatus(dateStr)
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
                          Lễ
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
            <p className="text-sm font-semibold text-slate-900 mb-4">Chú thích trạng thái:</p>
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
