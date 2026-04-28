import { Resend } from 'resend'

export function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY no configurado')
  return new Resend(key)
}

export const REMINDER_RECIPIENTS = () =>
  [
    process.env.REMINDER_EMAIL_1,
    process.env.REMINDER_EMAIL_2,
    process.env.REMINDER_EMAIL_3,
  ].filter(Boolean) as string[]
