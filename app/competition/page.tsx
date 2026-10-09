import type { Metadata } from 'next'
import Link from 'next/link'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import ReferralBox from '@/components/ReferralBox'
import ReferralPrize from '@/components/ReferralPrize'
import MinaSignup from '@/components/MinaSignup'
import { siteUrl } from '@/lib/server/championship'
import { verifiedMinaParticipant } from '@/lib/server/mina-participation'
export const metadata: Metadata = { title: 'Your Mina Tests Invite | Flux', robots: { index: false, follow: false } }
export default async function ParticipantPage() {
  const participant = await verifiedMinaParticipant()
  const enrolled = participant?.experimentJoined
  const inviteLink = enrolled ? `${siteUrl()}/mina-tests?ref=${participant.referralCode}` : ''
  const configuredPlayUrl = process.env.GOOGLE_PLAY_URL
  const playUrl = configuredPlayUrl && /^https:\/\/play\.google\.com\/store\/apps\/details\?/.test(configuredPlayUrl) ? configuredPlayUrl : ''
  return <div className="funnel-shell"><ExperimentHeader /><main><section className="mina-hero"><p className="eyebrow">FLUX / MINA TESTS</p><h1>{enrolled ? <>You&apos;re <span className="gradient-text">in.</span></> : <>Your next <span className="gradient-text">step.</span></>}</h1><p className="muted mt-6">{enrolled ? 'Your private invite is confirmed. Welcome to Mina Tests.' : 'Confirm your private email invite and enroll to continue with Mina Tests.'}</p></section>
    {enrolled ? <>
      <section className="glass-card mina-card"><p className="eyebrow">CONTINUE WITH FLUX</p><h2>{participant.device === 'iphone' ? 'Flux for iPhone is coming soon.' : 'Download Flux on Android'}</h2>
        {participant.device === 'iphone' ? <Link href="/coming-soon" className="flux-button mt-6">iPhone · Coming Soon →</Link> : playUrl ? <a href={playUrl} className="flux-button mt-6" target="_blank" rel="noopener noreferrer">Download Flux on Google Play →</a> : <><p className="muted mt-5">Your invite is confirmed. The Google Play download link has not been announced yet.</p><button disabled className="flux-button mt-6 opacity-60">Google Play link coming soon</button></>}
        <ol className="mina-next-steps">{['Install Flux when the download link is available.', 'Create your Flux account with the same verified email.', 'Review the Mina Test protocol before taking part.'].map(step => <li key={step}>{step}</li>)}</ol><p className="muted mt-5 text-sm">Website enrollment does not mean experiment completion. App account linking and measurement collection are not connected to this website yet.</p><Link href="/mina-tests" className="mt-5 inline-flex min-h-11 text-cyan-200 underline">View the current Mina Test</Link>
      </section>
      <section className="glass-card mina-card"><p className="eyebrow">INVITE FRIENDS</p><h2>Explore together.</h2><p className="muted mt-5">Share your personal Mina Tests link with friends.</p><ReferralBox inviteLink={inviteLink} /></section><ReferralPrize />
    </> : <MinaSignup verified={participant} />}
  </main><ExperimentFooter /></div>
}
