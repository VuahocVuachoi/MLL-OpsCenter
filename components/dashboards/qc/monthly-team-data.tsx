"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, Copy, Download } from "lucide-react"

interface TeamDataRow {
  stt: number
  name: string
  pinId: string
  hours: string
  jobType: string
  country: string
  notes: string
}

const mockTeamData: TeamDataRow[] = [
  { stt: 1, name: "staff_user", pinId: "PIN001", hours: "2.5", jobType: "Label", country: "Brazil", notes: "" },
  { stt: 2, name: "staff_user", pinId: "PIN002", hours: "1.8", jobType: "DF check", country: "Vietnam", notes: "" },
  {
    stt: 3,
    name: "staff_user",
    pinId: "PIN003",
    hours: "3.2",
    jobType: "Document prep",
    country: "Vietnam",
    notes: "",
  },
]

export function MonthlyTeamData() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [data, setData] = useState<TeamDataRow[]>(mockTeamData)
  const [commentRow, setCommentRow] = useState<number | null>(null)
  const [commentText, setCommentText] = useState("")
  const [showCommentModal, setShowCommentModal] = useState(false)

  const handleRightClick = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault()
    setCommentRow(rowIndex)
    setCommentText(data[rowIndex].notes)
    setShowCommentModal(true)
  }

  const saveComment = () => {
    if (commentRow !== null) {
      const newData = [...data]
      newData[commentRow].notes = commentText
      setData(newData)
    }
    setShowCommentModal(false)
    setCommentRow(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="space-y-6">
        {/* Date Picker */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Chọn ngày/tháng/năm</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border-slate-300 text-slate-900 text-lg"
              />
            </div>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Tìm kiếm
            </button>
          </div>
        </Card>

        {/* Team Data Table */}
        <Card className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 w-12">STT</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">User Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Pin ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Thời gian (giờ)</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Loại công việc</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Quốc gia</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={row.stt}
                    className="border-b border-slate-200 hover:bg-slate-50 cursor-context-menu"
                    onContextMenu={(e) => handleRightClick(e, idx)}
                  >
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">{row.stt}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        <span className="text-sm text-slate-900">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.pinId}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.hours}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {row.jobType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {row.country}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.notes ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {row.notes.substring(0, 20)}...
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRightClick(new MouseEvent("contextmenu") as any, idx)}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs">Comment</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Thêm yêu cầu xử lý</h3>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Mô tả vấn đề hoặc yêu cầu xử lý lại data..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommentModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={saveComment}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Lưu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
