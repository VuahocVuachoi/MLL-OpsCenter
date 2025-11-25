"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Briefcase, BookOpen, Users, BarChart3, BookMarked, Settings } from "lucide-react"

const quickLinks = [
  { icon: Briefcase, title: "Tool Desk", description: "Access your tools" },
  { icon: BookOpen, title: "Basic Docs", description: "Documentation & guides" },
  { icon: Users, title: "Workspace", description: "Team collaboration" },
  { icon: BarChart3, title: "Reports", description: "View analytics" },
  { icon: BookMarked, title: "Knowledge Base", description: "Learn & explore" },
  { icon: Settings, title: "Settings", description: "Manage preferences" },
]

export function QuickLinksTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickLinks.map((link, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(6, 182, 212, 0.2)" }}
        >
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 cursor-pointer hover:bg-white/15 transition-all h-full">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full flex items-center justify-center border border-cyan-300/30">
                <link.icon className="w-7 h-7 text-cyan-300" />
              </div>
              <h3 className="font-semibold text-white">{link.title}</h3>
              <p className="text-sm text-gray-400">{link.description}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
