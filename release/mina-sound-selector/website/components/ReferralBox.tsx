'use client'

import { useRef, useState } from 'react'
import { MINA_TESTS_NAME, referralCampaign } from '@/lib/minaTestsConfig'

export default function ReferralBox({ inviteLink = '' }: { inviteLink?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState('')

  async function copy() {
    const link = inviteLink
    if (!link) return
    try { await navigator.clipboard.writeText(link); setStatus('Invite link copied.') }
    catch { input.current?.focus(); input.current?.select(); setStatus('Select and copy the invite link above.') }
  }
  async function share() {
    const url = inviteLink
    if (!url) return
    if (!navigator.share) { await copy(); return }
    try { await navigator.share({ title: MINA_TESTS_NAME, text: `Join me in Mina Tests: community experiments into sleep, sound and cognition. ${referralCampaign.disclosure}`, url }); setStatus('Share options opened.') }
    catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) await copy() }
  }
  return <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
    <label htmlFor="invite-link" className="text-sm font-bold">Your invite link</label>
    <input ref={input} id="invite-link" value={inviteLink} readOnly className="email-input mt-3 text-sm" placeholder="Confirm your email invite to get your link" />
    <div className="mt-3 flex flex-wrap gap-2"><button disabled={!inviteLink} onClick={copy} className="flux-button text-sm disabled:opacity-50">Copy Invite Link</button><button disabled={!inviteLink} onClick={share} className="flux-secondary text-sm disabled:opacity-50">Share ↗</button></div>
    <p role="status" className="mt-3 text-sm text-cyan-200">{status}</p>
    <p className="mt-3 text-xs leading-5 text-white/60">{referralCampaign.disclosure} Include this disclosure when sharing a copied link.</p>
  </div>
}
