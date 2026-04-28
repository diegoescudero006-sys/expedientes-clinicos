import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { resend, REMINDER_RECIPIENTS } from '@/lib/resend'

function formatFechaTomorrow(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatHora(horaStr: string | null): string {
  if (!horaStr) return 'Sin hora definida'
  const [h, min] = horaStr.split(':').map(Number)
  return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const TIPO_LABELS: Record<string, string> = {
  cita: 'Cita médica',
  estudio: 'Estudio',
  laboratorio: 'Laboratorio',
  medicamento: 'Medicamento',
  general: 'General',
}

const TIPO_COLORS: Record<string, string> = {
  cita: '#3b82f6',
  estudio: '#a855f7',
  laboratorio: '#f97316',
  medicamento: '#22c55e',
  general: '#9ca3af',
}

function buildEmailHtml(eventos: Record<string, string>[], fechaLabel: string): string {
  const rows = eventos.map((ev, i) => {
    const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc'
    const color = TIPO_COLORS[ev.tipo] ?? TIPO_COLORS.general
    const label = TIPO_LABELS[ev.tipo] ?? ev.tipo
    return `
      <tr style="background:${bg}">
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b">${ev.paciente_nombre}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b">${ev.titulo}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0">
          <span style="background:${color}20;color:${color};font-size:12px;font-weight:600;padding:2px 8px;border-radius:9999px">${label}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569">${formatHora(ev.hora ?? null)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569">${ev.lugar ?? '—'}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#1d4ed8;padding:28px 32px">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700">Ángel de los Abuelos</h1>
            <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px">Citas y eventos programados para mañana — ${fechaLabel}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Paciente</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Evento</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Tipo</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Hora</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:2px solid #e2e8f0">Lugar</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 24px">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b">Este recordatorio se envía automáticamente cada día.</p>
            <p style="margin:0;font-size:13px;color:#64748b">Por favor contactar a los pacientes vía WhatsApp para confirmar su asistencia.</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">Sistema de Expedientes Clínicos — Ángel de los Abuelos</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')
  if (token !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[cron/recordatorios] RESEND_API_KEY no configurado — omitiendo envío')
      return NextResponse.json({ ok: false, error: 'Resend no configurado' })
    }

    const result = await pool.query(
      `SELECT a.id, a.titulo, a.hora, a.lugar, a.tipo,
              p.nombre AS paciente_nombre
       FROM agenda a
       JOIN pacientes p ON a.paciente_id = p.id
       WHERE a.fecha = CURRENT_DATE + INTERVAL '1 day'
         AND a.completado = false
       ORDER BY a.hora ASC NULLS LAST`
    )

    const eventos = result.rows

    if (eventos.length === 0) {
      return NextResponse.json({ ok: true, message: 'Sin eventos mañana', sent: 0 })
    }

    if (REMINDER_RECIPIENTS.length === 0) {
      console.warn('[cron/recordatorios] Sin destinatarios configurados — omitiendo envío')
      return NextResponse.json({ ok: false, error: 'Sin destinatarios configurados' })
    }

    const fechaLabel = formatFechaTomorrow(
      new Date(Date.now() + 86400000).toISOString()
    )

    const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const [ty, tm, td] = tomorrowIso.split('-').map(Number)
    const tomorrowLabel = new Date(ty, tm - 1, td).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    const html = buildEmailHtml(eventos, tomorrowLabel)

    await resend.emails.send({
      from: 'Ángel de los Abuelos <recordatorios@angeldelosabuelos.com>',
      to: REMINDER_RECIPIENTS,
      subject: `📅 Recordatorio de citas — ${tomorrowLabel}`,
      html,
    })

    return NextResponse.json({ ok: true, sent: REMINDER_RECIPIENTS.length, events: eventos.length })
  } catch (err) {
    console.error('[cron/recordatorios] Error:', err)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}
