import { google } from "googleapis"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { Buffer } from "node:buffer"
import { Readable } from "stream"
import { readFile } from "node:fs/promises"
import { supabaseAdmin } from "@/lib/supabase-admin"

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

export const runtime = "nodejs"

const loadServiceAccountFromJsonPath = async () => {
  const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH
  if (!jsonPath) return null

  const fileContent = await readFile(jsonPath, "utf-8")
  const parsed = JSON.parse(fileContent) as { client_email?: string; private_key?: string }
  if (!parsed.client_email || !parsed.private_key) return null
  return {
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  }
}

const getOAuthUserAuth = async () => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN

  if (!clientId?.trim() || !clientSecret?.trim()) return null
  if (!refreshToken?.trim() && !accessToken?.trim()) return null

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret)
  oauth2.setCredentials({
    refresh_token: refreshToken || undefined,
    access_token: accessToken || undefined,
  })

  // Ensure token is available/refreshed before Drive calls.
  await oauth2.getAccessToken()
  return oauth2
}

const getServiceAccountAuth = async () => {
  const fileAccount = await loadServiceAccountFromJsonPath()
  const clientEmail = fileAccount?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey =
    fileAccount?.privateKey || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail?.trim() || !privateKey?.trim()) {
    throw new Error("Missing Google service account credentials.")
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: DRIVE_SCOPES,
  })

  const client = await auth.getClient()
  return client
}

const getDriveAuthClient = async () => {
  const oauthAuth = await getOAuthUserAuth()
  if (oauthAuth) return oauthAuth
  return getServiceAccountAuth()
}

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const diffDaysInclusive = (fromDate: string, toDate: string) => {
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const ms = end.getTime() - start.getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
  return Math.max(days, 1)
}

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1] || ""
  return Buffer.from(base64, "base64")
}

const getVietnamDateFolderName = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())

const getOrCreateDatedFolder = async (parentFolderId: string, drive: ReturnType<typeof google.drive>, folderName: string) => {
  const safeFolderName = folderName.replace(/'/g, "\\'")
  const existing = await drive.files.list({
    q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false and name='${safeFolderName}'`,
    fields: "files(id,name)",
    pageSize: 1,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  })

  const existingId = existing.data.files?.[0]?.id
  if (existingId) return existingId

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  })

  if (!created.data.id) {
    throw new Error("Unable to create date folder on Google Drive.")
  }

  return created.data.id
}

export async function POST(request: Request) {
  try {
    const admin = supabaseAdmin()
    const payload = await request.json()
    const {
      userId,
      employeeName,
      position,
      leaveType,
      fromDate,
      toDate,
      reason,
      contactPhone,
      signatureData,
    } = payload || {}

    if (!userId || !employeeName || !fromDate || !toDate || !reason || !signatureData) {
      return Response.json({ error: "Missing required information." }, { status: 400 })
    }

    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      return Response.json({ error: "From Date must be earlier than To Date." }, { status: 400 })
    }

    const numberOfDays = diffDaysInclusive(fromDate, toDate)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,annual_leave_total,annual_leave_remaining")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: "Employee profile not found." }, { status: 400 })
    }

    if (leaveType === "annual" && numberOfDays > (profile.annual_leave_remaining ?? 0)) {
      return Response.json({ error: "Requested days exceed remaining annual leave." }, { status: 400 })
    }

    const auth = await getDriveAuthClient()
    const drive = google.drive({ version: "v3", auth })

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842])
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    const title = "APPLICATION TO LEAVE"
    page.drawText("INETZERO DA LAT OFFICE", { x: 360, y: 790, size: 10, font: fontBold })
    page.drawText("5/2 Me Linh, Phuong 9", { x: 360, y: 775, size: 9, font })
    page.drawText("Da Lat city, Lam Dong, Vietnam", { x: 360, y: 762, size: 9, font })
    page.drawText(title, { x: 200, y: 700, size: 14, font: fontBold })
    page.drawText("To: Inetzero HR Department", { x: 90, y: 670, size: 11, font })

    const startY = 620
    const lineHeight = 20
    const leaveTypeLabel = leaveType === "compensatory" ? "Compensatory Leave Application" : "Annual Leave Application"
    const lines = [
      `Name: ${employeeName}`,
      `Position: ${position || "MLL"}`,
      `Type of Leave: ${leaveTypeLabel}`,
      `Date of leave: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
      `Number of days: ${numberOfDays}`,
      `Reason for leaving: ${reason}`,
      `Contact during days leave: ${contactPhone || "-"}`,
    ]

    lines.forEach((line, index) => {
      page.drawText(line, { x: 90, y: startY - index * lineHeight, size: 11, font })
    })

    page.drawText("Applied by", { x: 130, y: 350, size: 10, font })
    page.drawText("Approved by", { x: 380, y: 350, size: 10, font })

    const signatureBytes = dataUrlToBytes(signatureData)
    let signatureImage
    if (signatureData.startsWith("data:image/png")) {
      signatureImage = await pdfDoc.embedPng(signatureBytes)
    } else {
      signatureImage = await pdfDoc.embedJpg(signatureBytes)
    }
    page.drawImage(signatureImage, { x: 110, y: 280, width: 150, height: 60 })
    page.drawText(employeeName, { x: 120, y: 260, size: 10, font })

    const pdfBytes = await pdfDoc.save()
    const fileName = `Leave_${employeeName.replace(/\\s+/g, "_")}_${fromDate}_to_${toDate}.pdf`
    const folderId =
      process.env.GOOGLE_LEAVE_DRIVE_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      process.env.GOOGLE_SERVICE_ACCOUNT_DRIVE_FOLDER_ID

    if (!folderId) {
      return Response.json({ error: "Google Drive folder configuration is missing." }, { status: 500 })
    }

    const datedFolderName = getVietnamDateFolderName()
    const datedFolderId = await getOrCreateDatedFolder(folderId, drive, datedFolderName)

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [datedFolderId],
      },
      media: {
        mimeType: "application/pdf",
        body: Readable.from(Buffer.from(pdfBytes)),
      },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    })

    const fileId = driveResponse.data.id
    const fileUrl = driveResponse.data.webViewLink || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : "")

    const { data: leaveRequest, error: insertError } = await admin
      .from("leave_requests")
      .insert({
        user_id: userId,
        start_date: fromDate,
        end_date: toDate,
        total_days: numberOfDays,
        reason: reason.trim(),
        status: "pending",
      })
      .select("id,status,total_days,start_date,end_date")
      .single()

    if (insertError) {
      return Response.json({ error: insertError.message || "Unable to save leave request." }, { status: 500 })
    }

    return Response.json({ ok: true, fileUrl, leaveRequest })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unexpected error"
    const text = String(rawMessage || "")
    const looksLikeUnregisteredCaller =
      /unregistered callers|without established identity|API consumer identity/i.test(text)
    const looksLikeServiceQuota = /Service Accounts do not have storage quota/i.test(text)
    const message = looksLikeUnregisteredCaller
      ? "Google Drive authentication failed. Please set GOOGLE_SERVICE_ACCOUNT_JSON_PATH to your service-account JSON file, enable Drive API in that GCP project, and share the target Drive folder with the service account email."
      : looksLikeServiceQuota
        ? "Google Drive rejected service-account upload quota. Configure OAuth user credentials (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN) to upload to My Drive."
        : rawMessage
    return Response.json({ error: message }, { status: 500 })
  }
}
