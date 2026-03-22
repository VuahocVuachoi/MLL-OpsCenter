"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"

interface Employee {
  id: string
  name: string
  schedule: Record<string, string>
}

const SCHEDULE_STATUS = {
  C: { label: "Working", color: "bg-green-100 text-green-700", dotColor: "bg-green-500" },
  S: { label: "Shift", color: "bg-yellow-100 text-yellow-700", dotColor: "bg-yellow-500" },
  HC: { label: "Comp day", color: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500" },
  OFF: { label: "Off", color: "bg-gray-100 text-gray-600", dotColor: "bg-gray-400" },
  OT: { label: "Overtime", color: "bg-red-100 text-red-700", dotColor: "bg-red-500" },
  NLB: { label: "Leave", color: "bg-pink-100 text-pink-700", dotColor: "bg-pink-500" },
  HOLIDAY: { label: "Holiday", color: "bg-purple-100 text-purple-700", dotColor: "bg-purple-500" },
}

const STATUS_ORDER = ["C", "S", "HC", "OFF", "OT", "NLB", "HOLIDAY"]

export function TeamScheduleCalendar() {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadError, setLoadError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const employeeIds = useMemo(() => employees.map((emp) => emp.id).join(","), [employees])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDay = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7

  const isWeekend = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.getDay() === 0 || date.getDay() === 6
  }

  const formatDate = (day: number): string => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const year = parts.find((p) => p.type === "year")?.value
    const month = parts.find((p) => p.type === "month")?.value
    const dayPart = parts.find((p) => p.type === "day")?.value
    return `${year}-${month}-${dayPart}`
  }

  const getTodayString = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date())
    const year = parts.find((p) => p.type === "year")?.value
    const month = parts.find((p) => p.type === "month")?.value
    const dayPart = parts.find((p) => p.type === "day")?.value
    return `${year}-${month}-${dayPart}`
  }

  const getStatusForDate = (employee: Employee, day: number) => {
    return employee.schedule[formatDate(day)] || null
  }

  const updateEmployeeSchedule = (employeeId: string, day: number, status: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId
          ? {
              ...emp,
              schedule: {
                ...emp.schedule,
                [formatDate(day)]: status,
              },
            }
          : emp,
      ),
    )
  }

  const persistSchedule = async (employeeId: string, day: number, status: string) => {
    const workDate = formatDate(day)
    const { error } = await supabase.from("work_schedules").upsert(
      {
        user_id: employeeId,
        work_date: workDate,
        status,
        updated_by: currentUserId,
      },
      { onConflict: "user_id,work_date" },
    )
    if (error) {
      setLoadError(error.message || "Unable to save schedule.")
    }
  }

  const handleStatusClick = (employeeId: string, day: number, currentStatus: string | null) => {
    const nextStatus = currentStatus
      ? STATUS_ORDER[(STATUS_ORDER.indexOf(currentStatus) + 1) % STATUS_ORDER.length]
      : STATUS_ORDER[0]
    updateEmployeeSchedule(employeeId, day, nextStatus)
    void persistSchedule(employeeId, day, nextStatus)
  }

  const monthYear = currentMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setCurrentUserId(parsed?.id || null)
      } catch {
        setCurrentUserId(null)
      }
    }
  }, [])

  useEffect(() => {
    const loadEmployees = async () => {
      setLoadError("")
      setIsLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, account_name, name")
        .eq("role", "mll")
        .order("username", { ascending: true })
      if (error || !data) {
        setLoadError(error?.message || "Unable to load employees.")
        setIsLoading(false)
        return
      }
      const mapped: Employee[] = data.map((row) => ({
        id: row.id,
        name: row.account_name || row.username || row.name || "mll",
        schedule: {},
      }))
      setEmployees(mapped)
      setIsLoading(false)
    }
    void loadEmployees()
  }, [supabase])

  useEffect(() => {
    const loadSchedules = async () => {
      if (employees.length === 0) return
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const monthStart = formatDate(1)
      const monthEnd = formatDate(daysInMonth)
      const todayStr = getTodayString()
      const rangeEnd = monthEnd > todayStr ? todayStr : monthEnd

      const { data, error } = await supabase
        .from("work_schedules")
        .select("user_id,work_date,status")
        .gte("work_date", monthStart)
        .lte("work_date", rangeEnd)
      if (error) return

      const { data: sheets, error: sheetsError } = await supabase
        .from("time_sheets")
        .select("user_id,work_date")
        .gte("work_date", monthStart)
        .lte("work_date", rangeEnd)
      if (sheetsError) return

      const byUser = new Map<string, Record<string, string>>()
      data?.forEach((row) => {
        const key = String(row.user_id)
        if (!byUser.has(key)) byUser.set(key, {})
        byUser.get(key)![row.work_date] = row.status
      })
      sheets?.forEach((row) => {
        const key = String(row.user_id)
        if (!byUser.has(key)) byUser.set(key, {})
        const existing = byUser.get(key)!
        if (!existing[row.work_date]) {
          existing[row.work_date] = "C"
        }
      })

      setEmployees((prev) =>
        prev.map((emp) => ({
          ...emp,
          schedule: byUser.get(emp.id) ? { ...byUser.get(emp.id)! } : emp.schedule,
        })),
      )
    }
    void loadSchedules()
  }, [employeeIds, currentMonth, employees.length, supabase])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 min-w-56 text-center capitalize">{monthYear}</h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-4">
          {Object.entries(SCHEDULE_STATUS).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
              <span className="text-sm text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Employees Schedule Grid */}
      {loadError && <p className="text-sm text-red-600">{loadError}</p>}
      {isLoading && <p className="text-sm text-slate-500">Loading schedules...</p>}
      <div className="space-y-4">
        {employees.map((employee) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              {/* Employee Header */}
              <button
                onClick={() => setSelectedEmployee(selectedEmployee === employee.id ? null : employee.id)}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-slate-200 hover:from-blue-100 hover:to-blue-150 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{employee.name}</p>
                    <p className="text-xs text-slate-600">ID: {employee.id.slice(0, 6)}</p>
                  </div>
                </div>
                <ChevronRight
                  className={`w-5 h-5 text-slate-600 transition-transform ${selectedEmployee === employee.id ? "rotate-90" : ""}`}
                />
              </button>

              {/* Calendar Grid */}
              {selectedEmployee === employee.id && (
                <div className="p-6">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="text-center font-semibold text-slate-900 text-sm py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month starts */}
                    {Array.from({ length: firstDay }).map((_, idx) => (
                      <div key={`empty-${idx}`} />
                    ))}

                    {/* Days of month */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1
                      const status = getStatusForDate(employee, day)
                      const isWknd = isWeekend(day)
                      const statusConfig = status ? SCHEDULE_STATUS[status as keyof typeof SCHEDULE_STATUS] : null

                      return (
                        <motion.div
                          key={day}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => handleStatusClick(employee.id, day, status)}
                          className={`relative p-2 rounded-lg border-2 min-h-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isWknd ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 hover:border-blue-400"
                          } ${status ? "border-blue-400 bg-blue-50" : ""}`}
                        >
                          <div className="text-sm font-bold text-slate-900">{day}</div>
                          {statusConfig && (
                            <div className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${statusConfig.color}`}>
                              {statusConfig.label}
                            </div>
                          )}
                          {isWknd && !status && <div className="text-xs text-slate-400 mt-1">Off</div>}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Stats */}
                  <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-5 gap-4">
                    {Object.entries(SCHEDULE_STATUS).map(([key, config]) => {
                      const count = Object.values(employee.schedule).filter((s) => s === key || s === config.label).length
                      return count > 0 ? (
                        <div key={key} className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">{config.label}</p>
                          <p className="text-lg font-bold text-slate-900">{count}</p>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
