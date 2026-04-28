import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const REMINDER_RECIPIENTS = [
  process.env.REMINDER_EMAIL_1,
  process.env.REMINDER_EMAIL_2,
  process.env.REMINDER_EMAIL_3,
].filter(Boolean) as string[]
