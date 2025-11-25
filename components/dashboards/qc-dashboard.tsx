"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types/user"
import { AttendanceCalendarView } from "./qc/attendance-calendar-view"
import { MonthlyTeamData } from "./qc/monthly-team-data"
import { LeaveRequestTab } from "./qc/leave-request-tab"
import { AttendanceTracking } from "./qc/attendance-tracking"
import { WorkAnalytics } from "./qc/work-analytics"

interface QCDashboardProps {
  user: User
}

export function QCDashboard({ user }: QCDashboardProps) {
  const [team, setTeam] = useState("all")
  const [activeTab, setActiveTab] = useState("attendance-calendar")

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-white">QC Control Center</h1>
            <div className="flex gap-4">
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger className="bg-card border-border text-foreground w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All team</SelectItem>
                  <SelectItem value="morning">Morning shift</SelectItem>
                  <SelectItem value="afternoon">Afternoon shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-card to-background-secondary border border-border rounded-xl p-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-primary/20 to-pink-500/20 border border-primary/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Team Members</p>
                <p className="text-2xl font-bold text-primary">24</p>
              </div>
              <div className="bg-gradient-to-br from-secondary/20 to-cyan-400/20 border border-secondary/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Active Today</p>
                <p className="text-2xl font-bold text-secondary">18</p>
              </div>
              <div className="bg-gradient-to-br from-accent/20 to-lime-400/20 border border-accent/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Pins Today</p>
                <p className="text-2xl font-bold text-accent">1,248</p>
              </div>
              <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Avg Performance</p>
                <p className="text-2xl font-bold text-violet-400">94%</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-border rounded-xl p-1 mb-8">
              <TabsTrigger
                value="attendance-calendar"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-cyan-400 data-[state=active]:text-white"
              >
                Lịch Công việc
              </TabsTrigger>
              <TabsTrigger
                value="work-analytics"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                DF Analytics
              </TabsTrigger>
              <TabsTrigger
                value="team-output"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                Team Data
              </TabsTrigger>
              <TabsTrigger
                value="attendance"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-lime-400 data-[state=active]:text-white"
              >
                Tracking
              </TabsTrigger>
              <TabsTrigger
                value="links"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                Links
              </TabsTrigger>
              <TabsTrigger
                value="leave"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white"
              >
                Leave
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance-calendar" className="mt-0">
              <AttendanceCalendarView />
            </TabsContent>

            <TabsContent value="work-analytics" className="mt-0">
              <WorkAnalytics />
            </TabsContent>

            <TabsContent value="team-output" className="mt-0">
              <MonthlyTeamData />
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <AttendanceTracking />
            </TabsContent>

            <TabsContent value="links" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {["QC Dashboard", "Analytics", "Reports", "Documentation", "Tools", "Settings"].map((link, idx) => (
                  <Card
                    key={idx}
                    className="bg-gradient-to-br from-card to-background-secondary border border-border rounded-xl p-6 hover:shadow-2xl cursor-pointer transition-all hover:border-primary/50"
                  >
                    <p className="text-foreground font-medium">{link}</p>
                    <p className="text-sm text-muted-foreground mt-1">Access {link.toLowerCase()}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="leave" className="mt-0">
              <LeaveRequestTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  )
}
