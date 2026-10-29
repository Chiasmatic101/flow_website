'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
type Row = { id: string; email: string; playEmail?: string; status?: string; active: boolean; isTestRecord?: boolean; createdAt: string | null; invitation?: { status: string; errorCode: string | null; sentAt?: unknown } }
export default function TesterAdmin() {
  const [platform, setPlatform] = useState('android')
  const [cursor, setCursor] = useState('')
  const [page, setPage] = useState<{ rows: Row[]; nextCursor: string | null }>({ rows: [], nextCursor: null })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let alive = true
    fetch(`/api/admin/testers?platform=${platform}&cursor=${encodeURIComponent(cursor)}`, { cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (alive) { if (response.ok) setPage(data); else setMessage(data.message || 'Unable to load queue.') }
    }).catch(() => { if (alive) setMessage('Unable to connect.') })
    return () => { alive = false }
  }, [platform, cursor, reload])
  async function status(row: Row, value: string) {
    if (value === 'added' && !window.confirm('Have you already added this exact Google account to the correct Google Play tester list? This does not grant access automatically.')) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/testers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, status: value, expectedStatus: row.status, expectedPlayEmail: row.playEmail, confirmedAdded: value === 'added' }) })
      const data = await response.json()
      setMessage(response.ok ? `Status saved. ${data.invitation ? `Invitation: ${data.invitation.status}${data.invitation.errorCode ? ` (${data.invitation.errorCode})` : ''}.` : 'No invitation sent.'} Google Play membership is managed manually.` : data.message || 'Queue changed. Reload and try again.')
      setReload(value => value + 1)
    } catch { setMessage('Could not save status.') } finally { setBusy(false) }
  }
  async function retry(row: Row) {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/testers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: row.id, expectedPlayEmail: row.playEmail }) })
      const data = await response.json()
      setMessage(response.ok ? `Invitation: ${data.invitation?.status}. ${data.invitation?.errorCode ?? ''}` : data.message || 'Unable to retry.')
      setReload(value => value + 1)
    } catch { setMessage('Unable to confirm delivery. Refresh before retrying.') } finally { setBusy(false) }
  }
  return <main className="mx-auto max-w-6xl p-6 text-white"><Link href="/admin/experiments" className="text-cyan-200 underline">← Experiments</Link><h1 className="mt-6 text-3xl font-black">Flux testers</h1><p className="muted mt-4">Email-confirmed website signups only. These are not experiment enrollments. Add Android testers manually in Google Play before marking Added. Mark Added only after manual addition in Play Console. This sends the testing email automatically; email failure retains Added status. Invited remains a legacy manual status.</p><div className="my-6 flex flex-wrap gap-4">{['android', 'iphone'].map(value => <button key={value} className="flux-secondary" aria-pressed={platform === value} onClick={() => { setPlatform(value); setCursor(''); setPage({ rows: [], nextCursor: null }) }}>{value === 'android' ? 'Android tester queue' : 'iPhone waiting list'}</button>)}{platform === 'android' && <a className="flux-button" href={`/api/admin/testers/export?cursor=${encodeURIComponent(cursor)}`}>Export this page for Google Play</a>}</div><p className="muted text-sm">100 records per page. CSV includes active, verified, consenting Android accounts; excludes test records and missing Play addresses. One address per line, no header. Export subsequent pages separately and preserve your existing Play list.</p><div className="overflow-x-auto mt-6"><table className="w-full text-left"><thead><tr><th>Email</th><th>Google Play email</th><th>Signup date</th><th>Status</th><th>Testing email</th></tr></thead><tbody>{page.rows.map(row => <tr key={row.id} className="border-t border-white/10"><td className="py-4">{row.email}{row.isTestRecord && ' (test)'}{!row.active && ' (inactive)'}</td><td>{row.playEmail || '—'}</td><td>{row.createdAt?.slice(0, 10) || '—'}</td><td>{platform === 'android' ? <select aria-label={`Tester status for ${row.email}`} className="bg-slate-900 p-2" value={row.status} disabled={busy || !row.active} onChange={event => status(row, event.target.value)}>{['pending', 'invited', 'added'].map(value => <option key={value}>{value}</option>)}</select> : row.active ? 'Waiting' : 'Inactive'}</td><td><span>{row.invitation?.status === 'sent' ? 'Sent (provider accepted)' : row.invitation?.status ?? 'Not sent'}</span>{row.invitation?.errorCode && <p className="text-sm text-rose-300">{row.invitation.errorCode === 'play_opt_in_url_not_configured' ? 'Configure GOOGLE_PLAY_TESTING_URL on Vercel, then retry.' : row.invitation.errorCode === 'delivery_outcome_requires_review' ? 'Check Resend delivery history before any manual resend.' : 'Delivery not confirmed. Check email settings and retry.'}</p>}{row.status === 'added' && row.active && ['failed', 'pending', 'sending'].includes(row.invitation?.status ?? '') && <button className="text-cyan-200 underline" disabled={busy} onClick={() => retry(row)}>Retry / Check invitation</button>}</td></tr>)}</tbody></table></div><p role="status" className="mt-4">{message}</p><div className="mt-6 flex gap-4"><button className="flux-secondary" onClick={() => { setCursor(''); setReload(value => value + 1) }}>First page / Refresh</button>{page.nextCursor && <button className="flux-secondary" onClick={() => setCursor(page.nextCursor!)}>Next page →</button>}</div></main>
}
