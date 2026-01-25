import process from "node:process"
import fs from "node:fs"
import path from "node:path"

const stripBom = (value) => value.replace(/^\uFEFF/, "")

const loadEnvLocal = () => {
  const envPath = path.resolve(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return
  const contents = stripBom(fs.readFileSync(envPath, "utf8"))
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) return
    const normalized = trimmed.startsWith("export ") ? trimmed.slice(7) : trimmed
    const eqIndex = normalized.indexOf("=")
    if (eqIndex === -1) return
    let key = normalized.slice(0, eqIndex).trim()
    key = key.replace(/^[^A-Za-z0-9_]+/, "")
    let value = normalized.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvLocal()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123"

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  const keys = Object.keys(process.env)
    .filter((key) => key.startsWith("SUPABASE_") || key.startsWith("NEXT_PUBLIC_") || key === "DEFAULT_PASSWORD")
    .sort()
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  console.error("Detected env keys:", keys.join(", "))
  process.exit(1)
}

const users = [
  { username: "mlops_manager_tan", email: "tan@enveritas.org" },
  { username: "mlops_manager_nghi", email: "nghi@enveritas-associate.org" },
  { username: "mlops_manager_ha", email: "bkha@enveritas-associate.org" },
  { username: "mlops_manager_ntphu", email: "ntphu@enveritas-associate.org" },
  { username: "mlops_analyst_pnquang", email: "pnquang@enveritas-associate.org" },
  { username: "mlops_manager_nhvhuy", email: "nhvhuy@enveritas-associate.org" },
  { username: "mlops_analyst_dhduc", email: "dhduc@enveritas-associate.org" },
  { username: "mlops_analyst_nqtoan", email: "nqtoan@enveritas-associate.org" },
  { username: "mlops_analyst_ttkthanh", email: "ttkthanh@enveritas-associate.org" },
  { username: "mlops_analyst_ndthinh", email: "ndthinh@enveritas-associate.org" },
  { username: "mlops_analyst_ttnminh", email: "ttnminh@enveritas-associate.org" },
  { username: "mlops_analyst_pthuyen", email: "pthuyen@enveritas-associate.org" },
  { username: "mlops_analyst_mtmngan", email: "mtmngan@enveritas-associate.org" },
  { username: "mlops_analyst_vhtuyen", email: "vhtuyen@enveritas-associate.org" },
  { username: "mlops_analyst_ttnyen", email: "ttnyen@enveritas-associate.org" },
  { username: "mlops_analyst_nhtvuong", email: "nhtvuong@enveritas-associate.org" },
  { username: "mlops_analyst_nhuyen", email: "nhuyen@enveritas-associate.org" },
  { username: "mlops_analyst_tvbac", email: "tvbac@enveritas-associate.org" },
  { username: "mlops_analyst_tttan", email: "tttan@enveritas-associate.org" },
  { username: "mlops_analyst_tnvanh", email: "tnvanh@enveritas-associate.org" },
  { username: "mlops_analyst_bthuy", email: "bthuy@enveritas-associate.org" },
  { username: "mlops_analyst_nntuyen", email: "nntuyen@enveritas-associate.org" },
  { username: "mlops_analyst_lndquynh", email: "lndquynh@enveritas-associate.org" },
  { username: "mlops_analyst_nntvy", email: "nntvy@enveritas-associate.org" },
  { username: "mlops_analyst_ntttuyen", email: "ntttuyen@enveritas-associate.org" },
  { username: "mlops_analyst_ntpthao", email: "ntpthao@enveritas-associate.org" },
  { username: "mlops_analyst_tdthuan", email: "tdthuan@enveritas-associate.org" },
]

const createUser = async (user) => {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: user.username,
      },
    }),
  })

  if (response.ok) {
    const payload = await response.json()
    return { status: "created", id: payload.id }
  }

  const errorPayload = await response.json().catch(() => ({}))
  if (response.status === 400 && errorPayload?.message?.includes("User already registered")) {
    return { status: "exists" }
  }

  return { status: "error", message: errorPayload?.message || `HTTP ${response.status}` }
}

const run = async () => {
  console.log(`Creating ${users.length} users...`)
  for (const user of users) {
    const result = await createUser(user)
    if (result.status === "created") {
      console.log(`✔ created ${user.email}`)
    } else if (result.status === "exists") {
      console.log(`• exists ${user.email}`)
    } else {
      console.log(`✖ failed ${user.email} - ${result.message}`)
    }
  }
}

run().catch((error) => {
  console.error("Unexpected error:", error)
  process.exit(1)
})
