"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

export function PerformanceTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 min-h-96">
        <h3 className="text-lg font-semibold text-white mb-6">Performance Analytics</h3>
        <div className="flex items-center justify-center h-80 text-gray-400">
          <p>Performance charts coming soon...</p>
        </div>
      </Card>
    </motion.div>
  )
}
