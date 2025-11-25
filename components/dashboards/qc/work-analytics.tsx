"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data structure
interface WorkData {
  employeeName: string
  dfPins: number
  otherWork: { [key: string]: number }
  date: string
}

// Sample work types
const WORK_TYPES = [
  { name: "DF Check", color: "#3b82f6", id: "df" },
  { name: "Label", color: "#10b981", id: "label" },
  { name: "Document Prep", color: "#f59e0b", id: "doc" },
  { name: "QA Review", color: "#8b5cf6", id: "qa" },
  { name: "Other", color: "#6b7280", id: "other" },
]

// Mock data generator
const generateMockData = (month = false) => {
  const baseEmployees = ["Employee A", "Employee B", "Employee C", "Employee D", "Employee E"]

  if (month) {
    return baseEmployees.map((emp) => ({
      name: emp,
      "DF Check": Math.floor(Math.random() * 500) + 200,
      Label: Math.floor(Math.random() * 300) + 100,
      "Document Prep": Math.floor(Math.random() * 150) + 50,
      "QA Review": Math.floor(Math.random() * 100) + 30,
    }))
  }

  // Daily data
  return baseEmployees.map((emp) => ({
    name: emp,
    "DF Check": Math.floor(Math.random() * 100) + 30,
  }))
}

const generateWorkBreakdown = () => {
  return [
    { name: "DF Check", value: 65, color: "#3b82f6" },
    { name: "Label", value: 15, color: "#10b981" },
    { name: "Document Prep", value: 12, color: "#f59e0b" },
    { name: "QA Review", value: 8, color: "#8b5cf6" },
  ]
}

export function WorkAnalytics() {
  const [mode, setMode] = useState<"daily" | "monthly">("daily")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [dfData, setDfData] = useState(generateMockData(false))
  const [monthlyData, setMonthlyData] = useState(generateMockData(true))
  const [workBreakdown, setWorkBreakdown] = useState(generateWorkBreakdown())

  const handleModeChange = (newMode: "daily" | "monthly") => {
    setMode(newMode)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setDfData(generateMockData(false))
  }

  const totalPins = useMemo(() => {
    if (mode === "daily") {
      return dfData.reduce((sum, emp) => sum + emp["DF Check"], 0)
    }
    return monthlyData.reduce((sum, emp) => sum + emp["DF Check"], 0)
  }, [mode, dfData, monthlyData])

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">DF Work Analytics</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleModeChange("daily")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === "daily" ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => handleModeChange("monthly")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === "monthly"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Date Picker for Daily Mode */}
        {mode === "daily" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-end gap-4"
          >
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
            <p className="text-sm font-medium text-blue-700 mb-2">Total DF Pins</p>
            <p className="text-4xl font-bold text-blue-900">{totalPins.toLocaleString()}</p>
            <p className="text-xs text-blue-600 mt-2">Across all employees</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <p className="text-sm font-medium text-green-700 mb-2">Avg Per Employee</p>
            <p className="text-4xl font-bold text-green-900">
              {(totalPins / (mode === "daily" ? dfData.length : monthlyData.length)).toFixed(0)}
            </p>
            <p className="text-xs text-green-600 mt-2">Average pins</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
            <p className="text-sm font-medium text-purple-700 mb-2">Employee Count</p>
            <p className="text-4xl font-bold text-purple-900">
              {mode === "daily" ? dfData.length : monthlyData.length}
            </p>
            <p className="text-xs text-purple-600 mt-2">Active workers</p>
          </Card>
        </motion.div>
      </div>

      {/* Main Chart - DF Pins by Employee */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">DF Pins by Employee</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mode === "daily" ? dfData : monthlyData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" />
                <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                />
                {mode === "daily" ? (
                  <Bar dataKey="DF Check" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                ) : (
                  <>
                    <Bar dataKey="DF Check" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="Label" fill="#10b981" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="Document Prep" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="QA Review" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                  </>
                )}
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Work Type Breakdown - Only for Daily */}
      {mode === "daily" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Work Time Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pie Chart */}
              <div className="flex justify-center">
                <div className="h-80 w-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {workBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #475569",
                          borderRadius: "8px",
                          color: "#f1f5f9",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Work Type Details */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-slate-900 mb-4">Breakdown by Type</h4>
                {workBreakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Details Table for Monthly */}
      {mode === "monthly" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Summary Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Employee</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-900">DF Check</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-900">Label</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-900">Document Prep</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-900">QA Review</th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{row.name}</td>
                      <td className="px-6 py-3 text-right text-blue-600 font-semibold">{row["DF Check"]}</td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-semibold">{row["Label"]}</td>
                      <td className="px-6 py-3 text-right text-amber-600 font-semibold">{row["Document Prep"]}</td>
                      <td className="px-6 py-3 text-right text-violet-600 font-semibold">{row["QA Review"]}</td>
                      <td className="px-6 py-3 text-right font-bold text-slate-900">
                        {row["DF Check"] + row["Label"] + row["Document Prep"] + row["QA Review"]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
