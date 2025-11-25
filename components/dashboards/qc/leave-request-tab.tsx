"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function LeaveRequestTab() {
  const [leaveType, setLeaveType] = useState("annual")

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Left Side - Leave Balance */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-white border border-slate-200 rounded-2xl p-6 h-full">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Leave Balance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Annual Leave</span>
                <span className="text-sm font-semibold text-blue-600">18/25</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-full" style={{ width: "72%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Extra Leave</span>
                <span className="text-sm font-semibold text-green-600">5/10</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full" style={{ width: "50%" }} />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Right Side - Request Form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="md:col-span-2"
      >
        <Card className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Request Leave</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="compensatory">Compensatory Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                <Input type="date" className="bg-white border-slate-300 text-slate-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                <Input type="date" className="bg-white border-slate-300 text-slate-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
              <Textarea
                placeholder="Enter reason for leave..."
                className="bg-white border-slate-300 text-slate-900 min-h-24"
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">Submit Request</Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
