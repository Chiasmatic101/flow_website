'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { captureAcquisition } from '@/lib/acquisition'
import type { Device } from '@/lib/championship-types'

export default function ExperimentSignup({ experimentId, consentReference }: { experimentId?: string; consentReference?: string }) {
  const router = useRouter()
  const [signup, setSignup] = useState<{ email: string; consent: true } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    if (data.get('consent') !== 'on') { setError('Please agree to Mina Tests updates to continue.'); return }
    setError('')
    setSignup({ email, consent: true })
    requestAnimationFrame(() => heading.current?.focus())
  }

  async function choose(device: Device) {
    if (!signup || busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/championship/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...signup, experimentId, device, ...captureAcquisition() }) })
      const result = await response.json()
      if (!response.ok) { setError(result.message || 'Could not complete signup. Please try again.'); return }
      if (process.env.NODE_ENV === 'development' && result.previewUrl) {
        try { sessionStorage.setItem('flux:championship:dev-preview', result.previewUrl) } catch { /* Optional developer convenience. */ }
      } else if (process.env.NODE_ENV === 'development') { try { sessionStorage.removeItem('flux:championship:dev-preview') } catch { /* Optional cleanup. */ } }
      router.push(device === 'android' ? '/check-email' : '/coming-soon')
    } catch { setError('Could not connect. Please try again. No email delivery has been confirmed.') }
    finally { setBusy(false) }
  }

  return <section id="signup" className="glass-card signup-card scroll-mt-8" aria-label="Join Mina Tests">
    <ol className="signup-steps" aria-label="Enrollment steps">{['Email', 'Your phone', 'Confirmation'].map((step, i) => <li key={step} aria-current={i === (signup ? 1 : 0) ? 'step' : undefined}><span>{i + 1}</span>{step}</li>)}</ol>
    <p className="eyebrow">{signup ? '02 / YOUR PHONE' : '01 / YOUR PLACE'}</p>
    <h2 ref={heading} tabIndex={-1} className="mt-4 text-3xl font-black tracking-tight">{signup ? 'What phone do you use?' : "What's your email?"}</h2>
    {signup ? <>
      <p className="muted mt-4">Get optional Mina Tests updates and Flux download information. iPhone joins the Coming Soon list.</p>
      <div className="mt-7 grid grid-cols-2 gap-3">{(['android', 'iphone'] as const).map(platform => <button key={platform} disabled={busy} onClick={() => choose(platform)} className="platform-choice disabled:opacity-50">
        <svg aria-hidden="true" viewBox="0 0 32 44" width="32" height="44" fill="none"><rect x="3" y="1" width="26" height="42" rx="6" stroke="currentColor" strokeWidth="2" /><path d="M12 6h8M13 37h6" stroke="currentColor" strokeWidth="2" />{platform === 'android' ? <path d="M10 23h12v-7H10v7Zm1-10-2-3m12 3 2-3" stroke="currentColor" strokeWidth="2" /> : <circle cx="16" cy="21" r="5" stroke="currentColor" strokeWidth="2" />}</svg>
        {platform === 'android' ? 'Android' : 'iPhone'}
      </button>)}</div>
      <button disabled={busy} className="mt-6 min-h-11 text-sm text-cyan-200 underline" onClick={() => { setSignup(null); setError('') }}>Change email</button>
      {busy && <p role="status" className="muted mt-4">Saving your signup…</p>}
    </> : <form onSubmit={submit} className="mt-6 space-y-5">
      <label className="block"><span className="sr-only">Email address</span><input name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" required className="email-input" aria-describedby="signup-help signup-error" /></label>
      <p id="signup-help" className="muted text-sm">Your email will be used for optional Mina Tests updates.</p>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6"><input name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-cyan-300" /><span>{consentReference ? 'I agree to receive updates about this experiment. Research participation requires separate eligibility and consent in Flux.' : 'I agree to receive updates about Mina Tests.'}</span></label>
      <button className="flux-button w-full" type="submit">Continue →</button>
      <p className="text-sm text-white/60">By continuing, you acknowledge our <Link href="/privacy" className="text-cyan-200 underline">Privacy Policy</Link>.</p>
    </form>}
    <p id="signup-error" role="alert" className="mt-3 text-sm text-rose-300">{error}</p>
    <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/55">Email updates are optional. Registered eligible Flux users can consent to active experiments in the app. iPhone signup saves your interest for Coming Soon updates.</p>
  </section>
}
