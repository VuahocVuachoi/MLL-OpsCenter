"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { User } from "@/types/user"
import { Search, Bell } from "lucide-react"
import { TargetAssignment } from "./hr/target-assignment"
import { WorkAnalytics } from "@/components/dashboards/qc/work-analytics"
import { AttendanceCalendarView } from "./qc/attendance-calendar-view" // use interactive calendar view instead of static calendar

interface HRDashboardProps {
  user: User
}

export function HRDashboard({ user }: HRDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [team, setTeam] = useState("all")

  const kpis = [
    { label: "Total Employees", value: "124", icon: "👥", color: "from-primary to-pink-500" },
    { label: "On Leave Today", value: "8", icon: "📅", color: "from-secondary to-cyan-400" },
    { label: "Avg Productivity", value: "94%", icon: "📈", color: "from-accent to-lime-400" },
    { label: "Pending Approvals", value: "12", icon: "⏳", color: "from-violet-500 to-purple-500" },
  ]

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
            <h1 className="text-4xl font-bold text-white">People & Performance</h1>
            <div className="flex items-center gap-4">
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
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button className="relative p-2 bg-card border border-border rounded-lg hover:bg-background-secondary">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <Card className="border-border rounded-xl p-6 bg-gradient-to-br from-card to-background-secondary hover:shadow-2xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{kpi.label}</p>
                        <p className="text-3xl font-bold text-white">{kpi.value}</p>
                      </div>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-xl`}
                      >
                        {kpi.icon}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-border rounded-xl p-1 mb-8">
              <TabsTrigger
                value="overview"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="work-schedule"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-cyan-400 data-[state=active]:text-white"
              >
                Work Schedule
              </TabsTrigger>
              <TabsTrigger
                value="df-analytics"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-lime-400 data-[state=active]:text-white"
              >
                DF Analytics
              </TabsTrigger>
              <TabsTrigger
                value="target-assignment"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                Target Assignment
              </TabsTrigger>
              <TabsTrigger
                value="directory"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                Directory
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <Card className="border-border bg-gradient-to-br from-card to-background-secondary rounded-xl p-8 min-h-96 flex items-center justify-center">
                <p className="text-muted-foreground text-lg">Analytics overview coming soon...</p>
              </Card>
            </TabsContent>

            <TabsContent value="work-schedule" className="mt-0">
              <AttendanceCalendarView /> {/* use interactive calendar that shows employee list when clicking dates */}
            </TabsContent>

            <TabsContent value="df-analytics" className="mt-0">
              <WorkAnalytics />
            </TabsContent>

            <TabsContent value="target-assignment" className="mt-0">
              <TargetAssignment />
            </TabsContent>

            <TabsContent value="directory" className="mt-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Sarah Johnson", role: "Senior Engineer", team: "Engineering" },
                  { name: "Mike Chen", role: "QC Manager", team: "Quality" },
                  { name: "Lisa Davis", role: "Product Designer", team: "Design" },
                  { name: "James Wilson", role: "Backend Developer", team: "Engineering" },
                  { name: "Emma Brown", role: "HR Specialist", team: "HR" },
                  { name: "David Lee", role: "Frontend Developer", team: "Engineering" },
                ].map((emp, idx) => (
                  <Card
                    key={idx}
                    className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 hover:shadow-md cursor-pointer transition-all hover:border-blue-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {emp.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{emp.name}</p>
                        <p className="text-sm text-slate-600">{emp.role}</p>
                        <p className="text-xs text-slate-500 mt-1">{emp.team}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  )
}
