'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function MinaAdminLogin() {
  const router = useRouter()
  const [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  return <div className="md-ui" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh' }}>
    <form className="md-card md-pad md-stack" style={{ width: 'min(420px, 100%)' }} onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage('')
      const data = new FormData(event.currentTarget)
      try { const r = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) }); const result = await r.json(); if (!r.ok) setMessage(result.message); else { router.push('/admin/experiments'); router.refresh() } } catch { setMessage('Could not connect. Try again.') } finally { setBusy(false) }
    }}>
      <div className="md-row"><span className="md-avatar" aria-hidden="true">M</span><div><p className="md-eyebrow">Mina Tests</p><h1 className="md-h2">Sign in to the dashboard</h1></div></div>
      <label className="md-field">Email<input className="md-input" name="email" type="email" autoComplete="username" required /></label>
      <label className="md-field">Password<input className="md-input" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="md-btn md-btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      <p role="alert" className="md-small">{message}</p>
    </form>
  </div>
}
