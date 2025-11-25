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
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 h-full">
          <h3 className="text-lg font-semibold text-white mb-6">Leave Balance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Annual Leave</span>
                <span className="text-sm font-semibold text-cyan-300">18/25</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: "72%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Extra Leave</span>
                <span className="text-sm font-semibold text-green-300">5/10</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
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
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Request Leave</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="bg-white/5 border-white/10">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                <Input type="date" className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason</label>
              <Textarea
                placeholder="Enter reason for leave..."
                className="bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>
            <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
              Submit Request
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
