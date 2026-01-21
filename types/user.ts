export interface User {
  id: string
  email: string
  name: string
  role: "employee" | "qc" | "hr"
  team: string
  accountName: string
  leaveBalance?: number
}
