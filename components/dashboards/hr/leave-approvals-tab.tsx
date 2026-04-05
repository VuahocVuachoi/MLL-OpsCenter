"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabaseBrowser } from "@/lib/supabase-browser"
import type { User } from "@/types/user"

interface LeaveRequestRow {
  id: string
  user_id: string
  start_date: string
  end_date: string
  total_days: number
  reason: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  approved_at: string | null
  profiles: {
    name: string | null
    email: string | null
  } | null
}

interface LeaveApprovalsTabProps {
  user: User
}

export function LeaveApprovalsTab({ user }: LeaveApprovalsTabProps) {
  const supabase = useMemo(() => supabaseBrowser(), [])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [actionId, setActionId] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("leave_requests")
      .select("id,user_id,start_date,end_date,total_days,reason,status,created_at,approved_at,profiles!leave_requests_user_id_fkey(name,email)")
      .order("created_at", { ascending: false })

    if (error) {
      setFeedbackMessage(error.message || "Unable to load leave requests.")
      setIsLoading(false)
      return
    }

    setLeaveRequests((data || []) as LeaveRequestRow[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  const totals = useMemo(() => {
    const pending = leaveRequests.filter((item) => item.status === "pending").length
    const approved = leaveRequests.filter((item) => item.status === "approved").length
    const rejected = leaveRequests.filter((item) => item.status === "rejected").length
    return {
      total: leaveRequests.length,
      pending,
      approved,
      rejected,
    }
  }, [leaveRequests])

  const handleStatus = async (leaveRequestId: string, status: "approved" | "rejected") => {
    setFeedbackMessage("")
    setActionId(leaveRequestId)
    const response = await fetch("/api/leave-request/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveRequestId,
        status,
        hrUserId: user.id,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      setFeedbackMessage(payload.error || "Unable to update leave request.")
      setActionId(null)
      return
    }

    setFeedbackMessage(status === "approved" ? "Leave request approved." : "Leave request rejected.")
    setActionId(null)
    await loadRequests()
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-border rounded-xl p-4 bg-gradient-to-br from-card to-background-secondary">
          <p className="text-xs text-muted-foreground mb-1">Total requests</p>
          <p className="text-2xl font-bold text-white">{totals.total}</p>
        </Card>
        <Card className="border-border rounded-xl p-4 bg-gradient-to-br from-card to-background-secondary">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{totals.pending}</p>
        </Card>
        <Card className="border-border rounded-xl p-4 bg-gradient-to-br from-card to-background-secondary">
          <p className="text-xs text-muted-foreground mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-400">{totals.approved}</p>
        </Card>
        <Card className="border-border rounded-xl p-4 bg-gradient-to-br from-card to-background-secondary">
          <p className="text-xs text-muted-foreground mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{totals.rejected}</p>
        </Card>
      </div>

      {feedbackMessage && <p className="text-sm text-cyan-300">{feedbackMessage}</p>}

      <Card className="border-border rounded-xl bg-gradient-to-br from-card to-background-secondary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-white/5">
                <th className="px-4 py-3 text-left text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Leave range</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Days</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-left text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Loading leave requests...
                  </td>
                </tr>
              )}
              {!isLoading && leaveRequests.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    No leave request found.
                  </td>
                </tr>
              )}
              {!isLoading &&
                leaveRequests.map((item) => (
                  <tr key={item.id} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{item.profiles?.name || "Unknown employee"}</p>
                      <p className="text-xs text-muted-foreground">{item.profiles?.email || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {item.start_date} - {item.end_date}
                    </td>
                    <td className="px-4 py-3 text-white">{item.total_days}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-sm whitespace-pre-wrap">{item.reason}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          item.status === "approved"
                            ? "bg-green-500/20 text-green-300"
                            : item.status === "rejected"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => void handleStatus(item.id, "approved")}
                            disabled={actionId === item.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => void handleStatus(item.id, "rejected")}
                            disabled={actionId === item.id}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {item.approved_at ? new Date(item.approved_at).toLocaleString("vi-VN") : "-"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
