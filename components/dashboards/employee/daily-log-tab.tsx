"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function DailyLogTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6">Daily Work Log</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <Input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">What did you work on today?</label>
            <Textarea
              placeholder="Share your daily accomplishments..."
              className="bg-white/5 border-white/10 text-white min-h-32"
            />
          </div>
          <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold">
            Save Log
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
