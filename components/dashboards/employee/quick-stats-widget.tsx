"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { TrendingUp, Clock, Zap, Target } from "lucide-react"

export function QuickStatsWidget() {
  const stats = [
    {
      label: "Today's Pins",
      value: "45",
      change: "+12%",
      icon: Target,
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
    },
    {
      label: "Efficiency",
      value: "92%",
      change: "+5%",
      icon: Zap,
      color: "from-emerald-600 to-emerald-700",
      bgColor: "bg-emerald-50",
    },
    {
      label: "Avg Response",
      value: "2.3s",
      change: "-0.5s",
      icon: Clock,
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-50",
    },
    {
      label: "Rank",
      value: "#3",
      change: "+1",
      icon: TrendingUp,
      color: "from-orange-600 to-orange-700",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
          >
            <Card className={`${stat.bgColor} border-0 p-6 hover:shadow-lg cursor-pointer group`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-600">{stat.change}</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
