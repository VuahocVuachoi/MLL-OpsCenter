import { google } from "googleapis"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { Buffer } from "node:buffer"
import { Readable } from "stream"

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]

const getServiceAccountAuth = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials.")
  }

  return new google.auth.JWT(clientEmail, undefined, privateKey, DRIVE_SCOPES)
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

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const {
      employeeName,
      position,
      leaveType,
      fromDate,
      toDate,
      reason,
      contactPhone,
      signatureData,
    } = payload || {}

    if (!employeeName || !fromDate || !toDate || !reason || !signatureData) {
      return Response.json({ error: "Missing required information." }, { status: 400 })
    }

    const auth = getServiceAccountAuth()
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
    const numberOfDays = diffDaysInclusive(fromDate, toDate)

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

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: "application/pdf",
        body: Readable.from(Buffer.from(pdfBytes)),
      },
      fields: "id, webViewLink",
    })

    const fileId = driveResponse.data.id
    const fileUrl = driveResponse.data.webViewLink || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : "")

    return Response.json({ ok: true, fileUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return Response.json({ error: message }, { status: 500 })
  }
}
