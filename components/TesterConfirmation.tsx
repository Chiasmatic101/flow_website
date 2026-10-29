'use client'
import { useState, type FormEvent } from 'react'
export type TesterProfile = { email: string; device: 'android' | 'iphone'; emailVerified: true; status: string; playEmail: string | null }
export default function TesterConfirmation({ initial, playUrl }: { initial: TesterProfile; playUrl: string | null }) {
  const [profile, setProfile] = useState(initial)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    const playEmail = new FormData(event.currentTarget).get('playEmail')
    try {
      const response = await fetch('/api/testing/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playEmail }) })
      const data = await response.json()
      if (response.ok) { setProfile(data.profile); setMessage('Saved. A changed Google Play address returns to pending review.') }
      else setMessage(data.message || 'Unable to save. Please try again.')
    } catch { setMessage('Could not connect. Please try again.') } finally { setBusy(false) }
  }
  return <section className="glass-card invite-card"><p className="eyebrow">EMAIL VERIFIED</p><h1>{profile.device === 'iphone' ? 'You’re on the iPhone waiting list.' : 'Your Android tester signup is saved.'}</h1><p className="muted mt-5">{profile.device === 'iphone' ? 'We’ll email relevant updates when iPhone testing is available. There is no Google Play step for iPhone.' : `Tester status: ${profile.status}. ${profile.status === 'added' ? 'An administrator has recorded your addition to the Google Play tester list.' : 'Google Play testing access is not active yet. Our team must add your Google account manually; we’ll email the next steps.'}`}</p><p className="mt-4">{profile.email}</p>
  {profile.device === 'android' && <form onSubmit={save} className="mt-6 space-y-4"><label className="block">Google Play testing account email<input name="playEmail" type="email" required defaultValue={profile.playEmail ?? profile.email} autoComplete="email" className="email-input mt-3" /></label><p className="muted text-sm">Use the Gmail or other Google account you use in Google Play. If it differs from your signup address, enter it here. It will be shared with Google for manual tester access. This address is self-reported, not separately verified.</p><button className="flux-button" disabled={busy}>{busy ? 'Saving…' : 'Save Google Play email'}</button><p role="status">{message}</p></form>}
  {profile.device === 'android' && profile.status === 'added' && playUrl && <a href={playUrl} className="flux-button mt-6" rel="noopener noreferrer">Open Google Play testing</a>}
  <p className="muted mt-6">You have not joined an experiment. Challenges, eligibility and consent remain separate in Flux. To stop testing communications or request deletion of this signup, contact alankelly@chiasmatic.co.</p></section>
}
