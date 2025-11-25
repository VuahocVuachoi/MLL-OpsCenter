export interface User {
  name: string
  role: "employee" | "qc" | "hr"
  team: string
  accountName: string
  leaveBalance?: number
}
