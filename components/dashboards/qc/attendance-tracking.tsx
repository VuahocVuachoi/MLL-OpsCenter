"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Download, FileText, Sheet as Sheet3 } from "lucide-react"

interface Employee {
  id: number
  name: string
  schedule: { [key: string]: string }
}

const ATTENDANCE_CODES = {
  C: { label: "Working", color: "bg-green-100 text-green-700" },
  S: { label: "Shift", color: "bg-yellow-100 text-yellow-700" },
  HC: { label: "Holiday Comp", color: "bg-blue-100 text-blue-700" },
  OFF: { label: "Off", color: "bg-gray-100 text-gray-700" },
  OT: { label: "Overtime", color: "bg-red-100 text-red-700" },
  NLB: { label: "Sick Leave", color: "bg-pink-100 text-pink-700" },
}

const mockEmployees: Employee[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${String.fromCharCode(65 + (i % 26))}`,
  schedule: {},
}))

export function AttendanceTracking() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1))
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [batchFillStatus, setBatchFillStatus] = useState<string>("C")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("") // add state to track individual employee selection

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()

  const isWeekend = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.getDay() === 0 || date.getDay() === 6
  }

  const formatDate = (day: number): string => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.toISOString().split("T")[0]
  }

  const calculateStats = (emp: Employee) => {
    const stats = {
      working: 0,
      makeup: 0,
      ot: 0,
      sick: 0,
      off: 0,
      shift: 0,
    }

    Object.values(emp.schedule).forEach((status) => {
      if (status === "C") stats.working++
      else if (status === "HC") stats.makeup++
      else if (status === "OT") stats.ot++
      else if (status === "NLB") stats.sick++
      else if (status === "OFF") stats.off++
      else if (status === "S") stats.shift++
    })

    return stats
  }

  const initializeSchedule = () => {
    const newEmployees = employees.map((emp) => {
      const newSchedule = { ...emp.schedule }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(day)
        if (!newSchedule[dateStr] && isWeekend(day)) {
          newSchedule[dateStr] = "OFF"
        }
      }
      return { ...emp, schedule: newSchedule }
    })
    setEmployees(newEmployees)
  }

  const handleBatchFill = () => {
    let targetEmployees = selectedEmployees

    // If an employee is selected from dropdown, use that instead
    if (selectedEmployee) {
      const employeeId = Number.parseInt(selectedEmployee)
      targetEmployees = [employeeId]
    }

    if (targetEmployees.length === 0) return

    const newEmployees = employees.map((emp) => {
      if (!targetEmployees.includes(emp.id)) return emp

      const newSchedule = { ...emp.schedule }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDate(day)
        // Skip weekends if filling with working status
        if (batchFillStatus === "C" && isWeekend(day)) {
          newSchedule[dateStr] = "OFF"
        } else {
          newSchedule[dateStr] = batchFillStatus
        }
      }
      return { ...emp, schedule: newSchedule }
    })
    setEmployees(newEmployees)
    setSelectedEmployee("")
  }

  const exportToCSV = () => {
    let csv = "Employee,"
    for (let day = 1; day <= daysInMonth; day++) {
      csv += `${day},`
    }
    csv += "Working,Makeup,OT,Sick,Off\n"

    employees.forEach((emp) => {
      const stats = calculateStats(emp)
      csv += `${emp.name},`
      for (let day = 1; day <= daysInMonth; day++) {
        csv += `${emp.schedule[formatDate(day)] || ""},`
      }
      csv += `${stats.working},${stats.makeup},${stats.ot},${stats.sick},${stats.off}\n`
    })

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}.csv`
    a.click()
  }

  const summaryStats = useMemo(() => {
    const totals = {
      totalEmployees: employees.length,
      avgWorking: 0,
      totalOT: 0,
      totalMakeup: 0,
      presentToday: 0,
    }

    employees.forEach((emp) => {
      const stats = calculateStats(emp)
      totals.avgWorking += stats.working
      totals.totalOT += stats.ot
      totals.totalMakeup += stats.makeup
    })

    totals.avgWorking = Math.round(totals.avgWorking / employees.length)
    return totals
  }, [employees])

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 min-w-48 text-center">
            {currentMonth.toLocaleString("vi-VN", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <FileText className="w-4 h-4" />
            Excel
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            <Sheet3 className="w-4 h-4" />
            Sheets
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Batch Operations */}
      <Card className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Batch Operations</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm text-slate-600 block mb-2">Select Employees</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Choose option" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-slate-600 block mb-2">Fill Status</label>
            <Select value={batchFillStatus} onValueChange={setBatchFillStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ATTENDANCE_CODES).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    {code} - {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBatchFill} className="bg-blue-600 hover:bg-blue-700 text-white">
              Fill Month
            </Button>
            <Button onClick={initializeSchedule} variant="outline" className="text-slate-700 bg-transparent">
              Auto Weekends OFF
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-blue-700">{summaryStats.totalEmployees}</p>
        </Card>
        <Card className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Avg Working Days</p>
          <p className="text-3xl font-bold text-green-700">{summaryStats.avgWorking}</p>
        </Card>
        <Card className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Total OT Hours</p>
          <p className="text-3xl font-bold text-red-700">{summaryStats.totalOT}</p>
        </Card>
        <Card className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Total Makeup Days</p>
          <p className="text-3xl font-bold text-purple-700">{summaryStats.totalMakeup}</p>
        </Card>
        <Card className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 mb-1">Working Days/Month</p>
          <p className="text-3xl font-bold text-yellow-700">{daysInMonth - Math.ceil(daysInMonth / 7) * 2}</p>
        </Card>
      </div>

      {/* Main Attendance Table */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-900 sticky left-0 bg-slate-50 z-10">
                  <Checkbox
                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedEmployees(employees.map((e) => e.id))
                      } else {
                        setSelectedEmployees([])
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900 sticky left-12 bg-slate-50 z-10">
                  Employee
                </th>
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1
                  const isWknd = isWeekend(day)
                  return (
                    <th
                      key={day}
                      className={`px-2 py-3 text-center font-semibold text-xs ${
                        isWknd ? "bg-gray-100 text-slate-500" : "text-slate-600"
                      }`}
                    >
                      {day}
                    </th>
                  )
                })}
                <th className="px-3 py-3 text-center font-semibold text-slate-900">Working</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900">Makeup</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900">OT</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-900">Sick</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const stats = calculateStats(emp)
                return (
                  <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10">
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, emp.id])
                          } else {
                            setSelectedEmployees(selectedEmployees.filter((id) => id !== emp.id))
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 sticky left-12 bg-white z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <span>{emp.name}</span>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1
                      const dateStr = formatDate(day)
                      const status = emp.schedule[dateStr] || (isWeekend(day) ? "OFF" : "")
                      const isWknd = isWeekend(day)

                      return (
                        <td key={day} className={`px-2 py-3 text-center ${isWknd ? "bg-gray-50" : ""}`}>
                          {status ? (
                            <div
                              className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold cursor-pointer hover:shadow-md transition-all ${
                                ATTENDANCE_CODES[status as keyof typeof ATTENDANCE_CODES]?.color || "bg-gray-100"
                              }`}
                              onClick={() => {
                                const codes = Object.keys(ATTENDANCE_CODES)
                                const nextCode = codes[(codes.indexOf(status) + 1) % codes.length]
                                setEmployees(
                                  employees.map((e) =>
                                    e.id === emp.id ? { ...e, schedule: { ...e.schedule, [dateStr]: nextCode } } : e,
                                  ),
                                )
                              }}
                            >
                              {status}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">-</div>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3 text-center font-semibold text-green-700">{stats.working}</td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-700">{stats.makeup}</td>
                    <td className="px-3 py-3 text-center font-semibold text-red-700">{stats.ot}</td>
                    <td className="px-3 py-3 text-center font-semibold text-pink-700">{stats.sick}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-slate-900 mb-3">Status Codes Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(ATTENDANCE_CODES).map(([code, config]) => (
            <div key={code} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${config.color}`}>
                {code}
              </div>
              <span className="text-sm text-slate-600">{config.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Summary Report */}
      <Card className="bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Monthly Summary Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Employee</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Working</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Makeup</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">OT</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Sick</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Off</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const stats = calculateStats(emp)
                const total = stats.working + stats.makeup + stats.ot + stats.sick + stats.off
                return (
                  <tr key={emp.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                    <td className="px-4 py-3 text-center text-green-700 font-semibold">{stats.working}</td>
                    <td className="px-4 py-3 text-center text-blue-700 font-semibold">{stats.makeup}</td>
                    <td className="px-4 py-3 text-center text-red-700 font-semibold">{stats.ot}</td>
                    <td className="px-4 py-3 text-center text-pink-700 font-semibold">{stats.sick}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-semibold">{stats.off}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
