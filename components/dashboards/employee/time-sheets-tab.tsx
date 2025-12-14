"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Save, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as UICalendar } from "@/components/ui/calendar"

interface TimeSheetRow {
  id: string
  name: string
  pinId: string
  pinNumber: string
  hours: string
  jobType: string
  country: string
  note: string
}

export function TimeSheetsTab() {
  const [rows, setRows] = useState<TimeSheetRow[]>([
    { id: "1", name: "staff_user", pinId: "PIN001", pinNumber: "1", hours: "2.5", jobType: "Label", country: "Brazil", note: "Hoàn thành đúng hạn" },
    { id: "2", name: "staff_user", pinId: "PIN002", pinNumber: "2", hours: "1.8", jobType: "DF check", country: "Brazil", note: "" },
    { id: "3", name: "staff_user", pinId: "PIN003", pinNumber: "3", hours: "3.2", jobType: "Document preparation", country: "Vietnam", note: "Cần kiểm tra lại" },
  ])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)

  const addRow = () => {
    setRows([...rows, { id: Date.now().toString(), name: "", pinId: "", pinNumber: "", hours: "", jobType: "", country: "", note: "" }])
  }

  const updateRow = (id: string, field: keyof TimeSheetRow, value: string) => {
    if (isSubmitted) return
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const deleteRow = (id: string) => {
    if (isSubmitted) return
    setRows(rows.filter((row) => row.id !== id))
  }

  const submit = () => {
    console.log("Submit time sheets:", rows, selectedDate.toISOString().split("T")[0])
    setIsSubmitted(true)
    alert("Time sheets submitted successfully! Data is now locked.")
  }

  const handleEditClick = () => {
    setShowEditModal(true)
  }

  const handleConfirmEdit = () => {
    console.log("Edit data for date:", selectedDate.toISOString().split("T")[0])
    setShowEditModal(false)
    alert(`Editing data for ${new Date(selectedDate).toLocaleDateString("vi-VN")}`)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Date header */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-2xl">⏰</span> Time Sheets - {new Date(selectedDate).toLocaleDateString("vi-VN")}
              </h3>
              {isSubmitted && <p className="text-sm text-green-600 mt-2 font-medium">✓ Dữ liệu đã được khóa</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={() => setIsDateDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Chọn ngày
              </Button>
              {isSubmitted && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditClick}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Calendar className="w-4 h-4" />
                  Chỉnh sửa
                </motion.button>
              )}
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-green-50 border-b border-green-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">User Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Pin ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Số pin</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thời gian (giờ)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Loại công việc</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Quốc gia</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Note</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        <span className="text-sm text-slate-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={row.pinId}
                        onChange={(e) => updateRow(row.id, "pinId", e.target.value)}
                        disabled={isSubmitted}
                        className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={row.pinNumber}
                        onChange={(e) => updateRow(row.id, "pinNumber", e.target.value)}
                        disabled={isSubmitted}
                        className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={row.hours}
                        onChange={(e) => updateRow(row.id, "hours", e.target.value)}
                        disabled={isSubmitted}
                        className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={row.jobType}
                        onValueChange={(v) => updateRow(row.id, "jobType", v)}
                        disabled={isSubmitted}
                      >
                        <SelectTrigger className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed" style={{ animation: 'none', transition: 'none' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="animate-none transition-none" style={{ animation: 'none', transition: 'none' }}>
                          <SelectItem value="Label">Label</SelectItem>
                          <SelectItem value="DF check">DF check</SelectItem>
                          <SelectItem value="Document preparation">Document preparation</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={row.country}
                        onChange={(e) => updateRow(row.id, "country", e.target.value)}
                        placeholder="e.g., Brazil"
                        disabled={isSubmitted}
                        className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={row.note}
                        onChange={(e) => updateRow(row.id, "note", e.target.value)}
                        placeholder="Ghi chú"
                        disabled={isSubmitted}
                        className="bg-white border-slate-300 text-slate-900 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        disabled={isSubmitted}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-6">
          <button
            onClick={addRow}
            disabled={isSubmitted}
            className="px-6 py-2 border-2 border-slate-400 text-slate-700 rounded-full font-medium hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            THÊM DÒNG
          </button>
          <button
            onClick={submit}
            disabled={isSubmitted}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSubmitted ? "ĐÓNG" : "SUBMIT"}
          </button>
        </div>

        {/* Modern Summary Section */}
        <div className="mt-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/20 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg">Tổng kết hôm nay</h4>
              <p className="text-sm text-slate-400">Thống kê hoạt động của ngày</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Pins Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-emerald-100 text-sm font-medium mb-2">Tổng số Pin</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {rows.reduce((sum, row) => sum + Number.parseFloat(row.pinNumber || 0), 0)}
                </p>
                <p className="text-emerald-100 text-xs">Tổng số pin đã nhập</p>
              </div>
            </div>

            {/* Total Hours Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-2">Tổng thời gian</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {rows.reduce((sum, row) => sum + Number.parseFloat(row.hours || 0), 0).toFixed(1)}
                </p>
                <p className="text-blue-100 text-xs">Giờ làm việc</p>
              </div>
            </div>

            {/* Average per Pin Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 cursor-default hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
              <div className="relative z-10">
                <p className="text-purple-100 text-sm font-medium mb-2">Trung bình/Pin</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {rows.length > 0
                    ? (rows.reduce((sum, row) => sum + Number.parseFloat(row.hours || 0), 0) / rows.length).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-purple-100 text-xs">Giờ/Lần chấm công</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">📅</span>
              <h3 className="text-lg font-semibold text-slate-900">Chọn ngày để chỉnh sửa</h3>
            </div>
            <div className="mb-6">
              <Input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="w-full bg-white border border-blue-300 text-slate-900 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                HỦY
              </button>
              <button
                onClick={handleConfirmEdit}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                XÁC NHẬN
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chọn ngày để xem dữ liệu timesheets</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <UICalendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setIsDateDialogOpen(false)
                  // Here, you could add logic to load data for the selected date
                }
              }}
              className="rounded-md border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
