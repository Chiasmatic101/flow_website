'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function MinaAdminLogin() {
  const router = useRouter()
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  return <form className="glass-card mina-card space-y-5" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage('')
    const data = new FormData(event.currentTarget)
    try { const r = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) }); const result = await r.json(); if (!r.ok) setMessage(result.message); else { router.push('/admin/experiments'); router.refresh() } } catch { setMessage('Could not connect. Try again.') } finally { setBusy(false) }
  }}><p className="eyebrow">AUTHORIZED ADMINISTRATORS</p><h1 className="text-3xl font-bold">Mina Tests admin</h1><label className="block">Email<input className="email-input mt-2" name="email" type="email" autoComplete="username" required /></label><label className="block">Password<input className="email-input mt-2" name="password" type="password" autoComplete="current-password" required /></label><button className="flux-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p role="alert">{message}</p></form>
}
