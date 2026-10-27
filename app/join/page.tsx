import type { Metadata } from 'next'
import Link from 'next/link'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import { championshipBackend } from '@/lib/server/championship'
import { FunnelError } from '@/lib/championship-validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Preserve the form POST's Origin for CSRF validation; suppress cross-site referrers.
export const metadata: Metadata = { title: 'Join Mina Tests | Flux', robots: { index: false, follow: false }, referrer: 'same-origin' }
const errors: Record<string, [string, string]> = {
  invalid_invite: ['This invite could not be opened.', 'The link is invalid or has been replaced. Request a fresh invite to continue.'],
  expired_invite: ['Your invite has expired.', 'Email confirmation links last seven days. Request a new one to continue.'],
  used_invite: ['This invite has already been used.', 'Continue in the browser where you joined, or request another invite.'],
  unavailable: ['We could not check your invite.', 'Please try again shortly.'],
}
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string | string[]; error?: string | string[] }> }) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''
  let issue = typeof params.error === 'string' && errors[params.error] ? params.error : ''
  if (!issue) {
    try { if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new FunnelError('invalid_invite'); await championshipBackend().inspectInvite(token) }
    catch (error) { issue = error instanceof FunnelError && errors[error.code] ? error.code : 'unavailable' }
  }
  return <div className="funnel-shell"><ExperimentHeader /><main className="invite-page"><section className="glass-card invite-card">
    <p className="eyebrow">FLUX / MINA TESTS</p>
    {issue ? <><h1>{errors[issue][0]}</h1><p className="muted mt-5">{errors[issue][1]}</p><Link href="/mina-tests#signup" className="flux-button mt-7">Request email updates →</Link><Link href="/competition" className="mt-5 block text-cyan-200 underline">Continue in Flux</Link></> : <>
      <h1>Your place is ready.</h1><p className="muted mt-5">Confirm optional Mina Tests email updates. Experiment eligibility and consent are handled separately in Flux.</p>
      {/* A GET never consumes a token: email security scanners and Next prefetching cannot enroll someone. */}
      <form action="/api/championship/join" method="post" className="mt-7"><input type="hidden" name="token" value={token} /><button className="flux-button" type="submit">CONFIRM EMAIL UPDATES →</button></form>
      <p className="muted mt-5 text-sm">Explore sleep, sound and cognition with Flux.</p>
    </>}
  </section></main><ExperimentFooter /></div>
}
