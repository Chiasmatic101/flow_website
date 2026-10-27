'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { SignupReceipt } from '@/lib/championship-types'

export default function ChampionshipInvite() {
  const [receipt, setReceipt] = useState<SignupReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [preview, setPreview] = useState('')
  useEffect(() => {
    let alive = true
    fetch('/api/championship/receipt', { cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (!alive) return
      if (!response.ok) setNotice(data.message || 'We could not load your signup.')
      else { setReceipt(data.receipt); setCooldown(data.receipt?.retryAfter || 0) }
      if (process.env.NODE_ENV === 'development') { try { setPreview(sessionStorage.getItem('flux:championship:dev-preview') || '') } catch { /* Preview is optional. */ } }
    }).catch(() => { if (alive) setNotice('Could not load your signup. Please try again.') }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  useEffect(() => {
    if (!cooldown) return
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])
  async function resend() {
    if (busy || cooldown) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch('/api/championship/resend', { method: 'POST' })
      const result = await response.json()
      setCooldown(result.retryAfter || 0)
      if (!response.ok && result.delivery !== 'cooldown') { setNotice(result.message || 'Could not resend. Please try again.'); return }
      setReceipt(value => value ? { ...value, delivery: result.delivery } : null)
      setNotice(result.delivery === 'sent' ? 'Your new invite has been sent. Use the latest email.' : result.delivery === 'cooldown' ? 'Please wait before requesting another invite.' : 'No email was sent. Please try again later.')
      if (process.env.NODE_ENV === 'development' && result.previewUrl) setPreview(result.previewUrl)
    } catch { setNotice('Could not confirm email delivery. Please try again.') }
    finally { setBusy(false) }
  }
  const android = receipt?.device === 'android'
  const sent = android && receipt.delivery === 'sent'
  return <section className="glass-card invite-card">
    <div className="mail-orbit" aria-hidden="true"><svg viewBox="0 0 60 60" fill="none"><rect x="8" y="15" width="44" height="31" rx="6" stroke="currentColor" strokeWidth="2" /><path d="m9 18 21 16 21-16" stroke="currentColor" strokeWidth="2" /></svg></div>
    <p className="eyebrow">STEP 3 / YOUR INVITE</p>
    <h1>{loading ? 'Finding your signup…' : sent ? 'Check your inbox.' : android ? 'Your signup is saved.' : 'Get your Mina Tests invite.'}</h1>
    {sent && <p className="muted mt-5">Your Mina Tests invite is on the way.</p>}
    {android && <p className="invite-email">{receipt.email}</p>}
    {!loading && !android && <p className="muted mt-5">Start with your email and choose Android to request a Mina Tests invite.</p>}
    {android && !sent && <div className="prototype-notice"><strong>{receipt.delivery === 'cooldown' ? 'An invite was requested recently.' : 'No email delivery has been confirmed.'}</strong><p>{receipt.delivery === 'cooldown' ? 'Check your inbox, or wait before requesting another invite.' : 'Your signup is saved. Email delivery is currently unavailable or the request failed. You have not joined yet.'}</p></div>}
    <p className="muted mt-6">Open the email on your Android phone and follow the private link to continue.</p>
    <ol className="invite-sequence" aria-label="Your next steps">{['Email', 'Confirm invite', 'Download Flux', 'Your first check-in'].map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}{i < 3 && <b aria-hidden="true">↓</b>}</li>)}</ol>
    <div className="resend-area"><p className="font-bold">Didn&apos;t get it?</p><button disabled={!android || busy || cooldown > 0} className="flux-secondary mt-3 disabled:opacity-50" onClick={resend}>{busy ? 'Sending…' : cooldown ? `Resend in ${cooldown}s` : 'RESEND INVITE'}</button><p role="status" className="mt-3 text-sm leading-6 text-cyan-200">{notice}</p></div>
    <Link href="/mina-tests#signup" className="mt-4 inline-flex min-h-11 items-center text-sm text-cyan-200 underline">Join Mina Tests / Continue</Link>
    {process.env.NODE_ENV === 'development' && preview && <div className="dev-invite-preview"><p>Development only · Uses a real stored invite token. Preview does not confirm email delivery.</p><Link prefetch={false} href={preview} className="flux-secondary mt-3">Preview invite destination →</Link></div>}
  </section>
}
