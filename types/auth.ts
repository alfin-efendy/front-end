import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, "Email is Required"),
  password: z.string().min(6, "Password minimum 6 character")
})

export type LoginInput = z.infer<typeof loginSchema>

export interface LoginResponse {
  userName?: string
  error?: string
}