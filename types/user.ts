export interface User {
  id: string
  email: string
  name: string
  role: "mll" | "mlqc" | "hr"
  team: string
  accountName: string
  leaveBalance?: number
}
