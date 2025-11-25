"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"

const mockEmployeeData = {
  "2025-11-23": [
    { name: "Trần Thị Staff", id: "PIN001", shift: "Morning" },
    { name: "Nguyễn Văn A", id: "PIN002", shift: "Morning" },
    { name: "Phạm Thị B", id: "PIN003", shift: "Afternoon" },
    { name: "Hoàng Văn C", id: "PIN004", shift: "Afternoon" },
  ],
  "2025-11-24": [
    { name: "Trần Thị Staff", id: "PIN001", shift: "Morning" },
    { name: "Lý Thị D", id: "PIN005", shift: "Morning" },
  ],
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 23))
  const [selectedDate, setSelectedDate] = useState("2025-11-23")

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  const employees = mockEmployeeData[selectedDate as keyof typeof mockEmployeeData] || []

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Calendar */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {currentDate.toLocaleString("vi-VN", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const dateStr = day ? formatDate(currentDate.getFullYear(), currentDate.getMonth(), day) : ""
                const isSelected = dateStr === selectedDate
                const hasEmployees = day && mockEmployeeData[dateStr as keyof typeof mockEmployeeData]

                return (
                  <button
                    key={idx}
                    onClick={() => day && setSelectedDate(dateStr)}
                    disabled={!day}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      !day
                        ? "text-slate-300 cursor-default"
                        : isSelected
                          ? "bg-blue-600 text-white"
                          : hasEmployees
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="md:col-span-2"
      >
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-full">
          <h3 className="font-semibold text-slate-900 mb-4">
            Danh sách nhân viên - {new Date(selectedDate).toLocaleDateString("vi-VN")}
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees.length > 0 ? (
              employees.map((emp, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {emp.name.split(" ").slice(-1)[0].charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-600">{emp.id}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      emp.shift === "Morning" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {emp.shift}
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">Không có nhân viên nào trong ngày này</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
