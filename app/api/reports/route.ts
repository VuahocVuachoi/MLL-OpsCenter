import { google } from "googleapis"
import { Readable } from "stream"

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"]

const getServiceAccountAuth = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials.")
  }

  return new google.auth.JWT(clientEmail, undefined, privateKey, DRIVE_SCOPES)
}

const getFileName = (username: string, reportDate: string, originalName: string) => {
  const safeUser = username.replace(/[^a-zA-Z0-9_-]/g, "_")
  const safeDate = reportDate.replace(/[^0-9-]/g, "")
  const ext = originalName.includes(".") ? `.${originalName.split(".").pop()}` : ""
  return `${safeUser}_${safeDate}${ext}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File | null
    const description = String(formData.get("description") || "")
    const username = String(formData.get("username") || "user")
    const reportDate = String(formData.get("reportDate") || new Date().toISOString().split("T")[0])

    if (!file) {
      return Response.json({ error: "Missing video file." }, { status: 400 })
    }
    if (!description.trim()) {
      return Response.json({ error: "Missing issue description." }, { status: 400 })
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_SERVICE_ACCOUNT_DRIVE_FOLDER_ID
    const sheetId = process.env.GOOGLE_SHEETS_ID
    const sheetTab = process.env.GOOGLE_SHEETS_TAB || "Sheet1"

    if (!folderId || !sheetId) {
      return Response.json({ error: "Google Drive/Sheets configuration is missing." }, { status: 500 })
    }

    const auth = getServiceAccountAuth()
    const drive = google.drive({ version: "v3", auth })
    const sheets = google.sheets({ version: "v4", auth })

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = getFileName(username, reportDate, file.name)

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || "video/mp4",
        body: Readable.from(buffer),
      },
      fields: "id, webViewLink",
    })

    const fileId = driveResponse.data.id
    const videoUrl = driveResponse.data.webViewLink || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : "")

    if (process.env.GOOGLE_DRIVE_PUBLIC === "true" && fileId) {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      })
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTab}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[new Date().toISOString(), username, reportDate, videoUrl, description]],
      },
    })

    return Response.json({ ok: true, videoUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return Response.json({ error: message }, { status: 500 })
  }
}
