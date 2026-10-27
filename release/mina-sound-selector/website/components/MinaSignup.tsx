'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ExperimentSignup from './ExperimentSignup'
import { captureAcquisition } from '@/lib/acquisition'
import type { Device } from '@/lib/championship-types'
export default function MinaSignup({ verified, experimentId, consentReference }: { consentReference?: string; experimentId?: string; verified: { device: Device; experimentJoined: boolean } | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!verified) return <ExperimentSignup experimentId={experimentId} consentReference={consentReference} />
  return <section id="signup" className="glass-card signup-card scroll-mt-8" aria-label="Join Mina Tests"><p className="eyebrow">YOUR VERIFIED EMAIL</p><h2 className="mt-4 text-3xl font-black">{verified.experimentJoined ? 'Welcome back.' : 'Receive Mina Tests updates.'}</h2><p className="muted mt-4">Your email is already verified. You can continue without entering it again.</p>
    {verified.experimentJoined ? <Link href={verified.device === 'iphone' ? '/coming-soon' : experimentId ? `/competition?experimentId=${encodeURIComponent(experimentId)}` : '/competition'} className="flux-button mt-7">{verified.device === 'iphone' ? 'Flux for iPhone · Coming Soon' : 'Continue / Download Flux →'}</Link> : <form className="mt-6" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError('')
      try { const response = await fetch('/api/mina-tests/enroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, experimentId, acquisition: captureAcquisition().acquisition }) }); const data = await response.json(); if (!response.ok) { setError(data.message || 'Could not enroll. Please try again.'); return }; router.push(data.device === 'iphone' ? '/coming-soon' : '/competition'); router.refresh() } catch { setError('Could not connect. Please try again.') } finally { setBusy(false) }
    }}><label className="flex items-start gap-3 text-sm leading-6"><input required type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-cyan-300" /><span>{consentReference ? 'I agree to receive updates about this experiment. Participation requires separate eligibility checks and consent in Flux.' : 'I agree to receive updates about this Mina Test.'}</span></label><button disabled={busy} className="flux-button mt-6" type="submit">{busy ? 'Joining…' : 'Receive updates →'}</button></form>}
    <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p><p className="muted mt-4 text-sm">Email updates are optional and do not enroll you in a research experiment. Read the <Link href="/privacy" className="text-cyan-200 underline">Privacy Policy</Link>.</p>
  </section>
}
