"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { User } from "@/types/user"
import { QuickLinksTab } from "./employee/quick-links-tab"
import { LeaveRequestTab } from "./employee/leave-request-tab"
import { PerformanceTab } from "./employee/performance-tab"
import { TimeSheetsTab } from "./employee/time-sheets-tab"
import { AttendanceCalendar } from "./employee/attendance-calendar"

interface EmployeeDashboardProps {
  user: User
}

export function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState("time-sheets")

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-br from-card to-background-secondary border border-border rounded-xl p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-primary to-pink-500">
                  <AvatarFallback className="text-white font-bold text-lg">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  <p className="text-muted-foreground">
                    {user.accountName} • {user.team}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Data synced from Google Sheets</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-gradient-to-br from-primary/20 to-pink-500/20 border border-primary/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Annual Leave</p>
                  <p className="text-2xl font-bold text-primary">18</p>
                </div>
                <div className="bg-gradient-to-br from-secondary/20 to-cyan-400/20 border border-secondary/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Extra Leave</p>
                  <p className="text-2xl font-bold text-secondary">5</p>
                </div>
                <div className="bg-gradient-to-br from-accent/20 to-lime-400/20 border border-accent/30 rounded-xl p-4 flex items-center space-x-2">
                  <div className="h-3 w-3 bg-accent rounded-full animate-pulse" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold text-accent">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-border rounded-xl p-1 mb-8">
              <TabsTrigger
                value="time-sheets"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                Time Sheets
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-cyan-400 data-[state=active]:text-white"
              >
                Lịch Công việc
              </TabsTrigger>
              <TabsTrigger
                value="leave-request"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                Leave Request
              </TabsTrigger>
              <TabsTrigger
                value="quick-links"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-lime-400 data-[state=active]:text-white"
              >
                Quick Links
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="rounded-lg font-semibold text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time-sheets" className="mt-0">
              <TimeSheetsTab />
            </TabsContent>

            <TabsContent value="calendar" className="mt-0">
              <AttendanceCalendar employeeName={user.name} />
            </TabsContent>

            <TabsContent value="leave-request" className="mt-0">
              <LeaveRequestTab />
            </TabsContent>

            <TabsContent value="quick-links" className="mt-0">
              <QuickLinksTab />
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              <PerformanceTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </main>
  )
}
