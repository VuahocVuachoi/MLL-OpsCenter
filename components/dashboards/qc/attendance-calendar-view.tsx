"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface EmployeeAttendance {
  id: number
  name: string
  pinId: string
  schedule: { [key: string]: string }
  shift?: string
  country?: string
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

const mockEmployees: EmployeeAttendance[] = [
  {
    id: 1,
    name: "Trần Thị Staff",
    pinId: "PIN001",
    shift: "Morning",
    country: "Vietnam",
    schedule: {
      "2025-11-01": "C",
      "2025-11-02": "C",
      "2025-11-03": "S",
      "2025-11-04": "C",
      "2025-11-05": "HC",
      "2025-11-08": "C",
      "2025-11-09": "NLB",
      "2025-11-15": "C",
      "2025-11-16": "OT",
    },
  },
  {
    id: 2,
    name: "Nguyễn Văn A",
    pinId: "PIN002",
    shift: "Morning",
    country: "Brazil",
    schedule: {
      "2025-11-01": "C",
      "2025-11-02": "C",
      "2025-11-03": "C",
      "2025-11-04": "C",
      "2025-11-05": "HC",
      "2025-11-08": "C",
      "2025-11-09": "C",
      "2025-11-15": "C",
      "2025-11-16": "C",
    },
  },
  {
    id: 3,
    name: "Phạm Thị B",
    pinId: "PIN003",
    shift: "Afternoon",
    country: "Vietnam",
    schedule: {
      "2025-11-01": "C",
      "2025-11-02": "C",
      "2025-11-03": "C",
      "2025-11-04": "OFF",
      "2025-11-05": "HC",
      "2025-11-08": "C",
      "2025-11-09": "C",
      "2025-11-15": "C",
      "2025-11-16": "C",
    },
  },
  {
    id: 4,
    name: "Hoàng Văn C",
    pinId: "PIN004",
    shift: "Afternoon",
    country: "Brazil",
    schedule: {
      "2025-11-01": "C",
      "2025-11-02": "C",
      "2025-11-03": "S",
      "2025-11-04": "C",
      "2025-11-05": "HC",
      "2025-11-08": "C",
      "2025-11-09": "NLB",
      "2025-11-15": "C",
      "2025-11-16": "OT",
    },
  },
]

export function AttendanceCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [employees] = useState<EmployeeAttendance[]>(mockEmployees)

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
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -(firstDay.getDay() - i - 1)))
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    const lastDayOfWeek = lastDay.getDay()
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const getDateString = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const getAttendanceForDate = (dateStr: string) => {
    return employees
      .filter((emp) => emp.schedule[dateStr])
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        pinId: emp.pinId,
        status: emp.schedule[dateStr],
        shift: emp.shift,
        country: emp.country,
      }))
      .sort((a, b) => {
        // Sort by shift (Morning first, then Afternoon)
        if (a.shift !== b.shift) {
          return a.shift === "Morning" ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
  }

  const days = getDaysInMonth()
  const monthName = currentMonth.toLocaleString("vi-VN", { month: "long", year: "numeric" })
  const selectedDateAttendance = selectedDate ? getAttendanceForDate(selectedDate) : []
  const selectedDateInfo = selectedDate ? new Date(selectedDate) : null

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          {/* Header */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900">Lịch Chấm Công Nhân viên</h3>
            <p className="text-sm text-slate-600 mt-1">
              Xem chi tiết lịch công việc - Nhấn vào ngày để xem danh sách nhân viên
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
                const attendanceCount = employees.filter((emp) => emp.schedule[dateStr]).length
                const isSelected = selectedDate === dateStr

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
                          {attendanceCount} người
                        </div>
                      )}

                      {/* Holiday Indicator */}
                      {holiday && (
                        <div className="mt-0.5 px-2 py-0.5 rounded text-xs font-bold text-purple-700">Lễ</div>
                      )}
                    </button>
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

      {selectedDate && selectedDateAttendance.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Danh sách nhân viên - {selectedDateInfo?.toLocaleDateString("vi-VN")}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{selectedDateAttendance.length} nhân viên đi làm</p>
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
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-600">{emp.pinId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-600">{emp.country}</p>
                        <p className="text-xs text-slate-500">{emp.shift}</p>
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
