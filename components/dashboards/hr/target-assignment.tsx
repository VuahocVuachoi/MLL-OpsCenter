"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface TargetAssignment {
  id: string
  title: string
  country: string
  startDate: string
  endDate: string
  assignedQC: string
  targetPins: number
}

export function TargetAssignment() {
  const [country, setCountry] = useState("vietnam")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [targets, setTargets] = useState<TargetAssignment[]>([
    {
      id: "1",
      title: "DF Project Alpha",
      country: "vietnam",
      startDate: "2025-11-01",
      endDate: "2025-11-15",
      assignedQC: "QC Team 1",
      targetPins: 5000,
    },
    {
      id: "2",
      title: "DF Project Beta",
      country: "brazil",
      startDate: "2025-11-10",
      endDate: "2025-11-30",
      assignedQC: "QC Team 2",
      targetPins: 8000,
    },
  ])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    country: "vietnam",
    startDate: "",
    endDate: "",
    assignedQC: "",
    targetPins: "",
  })

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const handleAddTarget = () => {
    if (formData.title && formData.startDate && formData.endDate && formData.assignedQC && formData.targetPins) {
      const newTarget: TargetAssignment = {
        id: Date.now().toString(),
        title: formData.title,
        country: formData.country,
        startDate: formData.startDate,
        endDate: formData.endDate,
        assignedQC: formData.assignedQC,
        targetPins: Number.parseInt(formData.targetPins),
      }
      setTargets([...targets, newTarget])
      setFormData({ title: "", country: "vietnam", startDate: "", endDate: "", assignedQC: "", targetPins: "" })
      setIsDialogOpen(false)
    }
  }

  const getEventColorByCountry = (countryValue: string) => {
    const colors: { [key: string]: string } = {
      vietnam: "bg-blue-500",
      brazil: "bg-green-500",
      usa: "bg-purple-500",
      india: "bg-orange-500",
    }
    return colors[countryValue] || "bg-slate-500"
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days: (number | null)[] = Array(firstDay).fill(null)

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    const monthName = currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">{monthName}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  const dateStr = day
                    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    : null

                  const dayTargets = dateStr
                    ? targets.filter(
                        (t) =>
                          new Date(t.startDate) <= new Date(dateStr) &&
                          new Date(t.endDate) >= new Date(dateStr) &&
                          t.country === country,
                      )
                    : []

                  return (
                    <div
                      key={idx}
                      className={`min-h-24 p-2 rounded-lg border transition-all ${
                        day
                          ? dayTargets.length > 0
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                          : "border-transparent bg-slate-50"
                      }`}
                    >
                      {day && (
                        <div className="space-y-2">
                          <span className="text-sm font-semibold text-slate-900">{day}</span>
                          <div className="space-y-1">
                            {dayTargets.map((target) => (
                              <div
                                key={target.id}
                                className={`${getEventColorByCountry(target.country)} text-white text-xs p-1 rounded truncate font-medium`}
                              >
                                {target.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-40 bg-white border border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vietnam">Vietnam</SelectItem>
                <SelectItem value="brazil">Brazil</SelectItem>
                <SelectItem value="usa">USA</SelectItem>
                <SelectItem value="india">India</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Assign Target
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign DF Target</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Project Title</label>
                  <Input
                    placeholder="e.g., DF Project Alpha"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Country</label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                  >
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vietnam">Vietnam</SelectItem>
                      <SelectItem value="brazil">Brazil</SelectItem>
                      <SelectItem value="usa">USA</SelectItem>
                      <SelectItem value="india">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="border-slate-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned QC Team</label>
                  <Select
                    value={formData.assignedQC}
                    onValueChange={(value) => setFormData({ ...formData, assignedQC: value })}
                  >
                    <SelectTrigger className="bg-white border-slate-300">
                      <SelectValue placeholder="Select QC team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QC Team 1">QC Team 1</SelectItem>
                      <SelectItem value="QC Team 2">QC Team 2</SelectItem>
                      <SelectItem value="QC Team 3">QC Team 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Target Pins</label>
                  <Input
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.targetPins}
                    onChange={(e) => setFormData({ ...formData, targetPins: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddTarget} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Add Target
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Calendar */}
      {renderCalendar()}

      {/* Target List for Selected Country */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Active Targets - {country.toUpperCase()}</h3>
          <div className="space-y-4">
            {targets
              .filter((t) => t.country === country)
              .map((target) => (
                <div
                  key={target.id}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-2">{target.title}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Date Range:</span> {target.startDate} to {target.endDate}
                      </div>
                      <div>
                        <span className="font-medium">Assigned QC:</span> {target.assignedQC}
                      </div>
                      <div>
                        <span className="font-medium">Target:</span> {target.targetPins.toLocaleString()} pins
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {targets.filter((t) => t.country === country).length === 0 && (
              <div className="text-center py-8 text-slate-500">No targets assigned for this country yet.</div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
