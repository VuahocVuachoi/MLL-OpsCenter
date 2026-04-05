import { supabaseAdmin } from "@/lib/supabase-admin"

type LeaveStatus = "approved" | "rejected"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const leaveRequestId = String(body?.leaveRequestId || "")
    const status = body?.status as LeaveStatus
    const hrUserId = String(body?.hrUserId || "")

    if (!leaveRequestId || !hrUserId || (status !== "approved" && status !== "rejected")) {
      return Response.json({ error: "Invalid request payload." }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const nowIso = new Date().toISOString()

    const { data: hrProfile, error: hrError } = await admin.from("profiles").select("id,role,name").eq("id", hrUserId).single()
    if (hrError || !hrProfile || hrProfile.role !== "hr") {
      return Response.json({ error: "Only HR can approve/reject leave requests." }, { status: 403 })
    }

    const { data: leaveRequest, error: leaveError } = await admin
      .from("leave_requests")
      .select("id,user_id,start_date,end_date,total_days,status")
      .eq("id", leaveRequestId)
      .single()

    if (leaveError || !leaveRequest) {
      return Response.json({ error: "Leave request not found." }, { status: 404 })
    }

    if (leaveRequest.status !== "pending") {
      return Response.json({ error: "This leave request has already been processed." }, { status: 400 })
    }

    if (status === "approved") {
      const { data: employeeProfile, error: profileError } = await admin
        .from("profiles")
        .select("id,annual_leave_remaining")
        .eq("id", leaveRequest.user_id)
        .single()

      if (profileError || !employeeProfile) {
        return Response.json({ error: "Employee profile not found." }, { status: 404 })
      }

      const currentRemaining = employeeProfile.annual_leave_remaining ?? 0
      if (currentRemaining < leaveRequest.total_days) {
        return Response.json({ error: "Employee does not have enough annual leave remaining." }, { status: 400 })
      }

      const { error: deductError } = await admin
        .from("profiles")
        .update({ annual_leave_remaining: currentRemaining - leaveRequest.total_days })
        .eq("id", leaveRequest.user_id)

      if (deductError) {
        return Response.json({ error: deductError.message || "Unable to update leave balance." }, { status: 500 })
      }
    }

    const { error: updateError } = await admin
      .from("leave_requests")
      .update({
        status,
        approved_by: hrUserId,
        approved_at: nowIso,
      })
      .eq("id", leaveRequestId)

    if (updateError) {
      return Response.json({ error: updateError.message || "Unable to update leave status." }, { status: 500 })
    }

    const { data: latestProfile } = await admin
      .from("profiles")
      .select("annual_leave_remaining")
      .eq("id", leaveRequest.user_id)
      .single()

    const title = status === "approved" ? "Leave request approved" : "Leave request rejected"
    const message =
      status === "approved"
        ? `Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been approved. Remaining annual leave: ${latestProfile?.annual_leave_remaining ?? "N/A"} day(s).`
        : `Your leave request from ${leaveRequest.start_date} to ${leaveRequest.end_date} has been rejected. Please contact HR for details.`

    await admin.from("notifications").insert({
      user_id: leaveRequest.user_id,
      title,
      message,
      event_type: status,
      work_date: leaveRequest.start_date,
    })

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return Response.json({ error: message }, { status: 500 })
  }
}
