import type { Metadata } from 'next'
import ExperimentSignup from '@/components/ExperimentSignup'
import { publishedExperiments } from '@/lib/server/mina-experiments'
import PublishedExperiments from '@/components/PublishedExperiments'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import MinaVideo from '@/components/MinaVideo'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mina Tests | Flux', description: 'Explore your own sleep habits with Mina. Fun personal challenges, short check-ins and your own discoveries inside Flux.' }
export default async function MinaTestsPage() {
  const published = await publishedExperiments().catch(() => null)
  return <div className="funnel-shell"><ExperimentHeader /><main>
    <section className="mina-hero mina-home-grid"><div><p className="eyebrow">FLUX / PERSONAL CHALLENGES</p><h1>Mina <span className="gradient-text">Tests</span></h1><p className="muted mt-6 text-lg">A little curiosity. Seven nights. Your own discoveries.</p><p className="mt-4">Meet Mina, try your assigned activity each evening, and share a short sleep check-in each morning. See your personal comparisons in Flux.</p><a href="#published-experiments" className="flux-button mt-6">Explore challenges →</a><p className="mina-status">Open Flux → Mina Tests → Start Challenge</p><a href="#signup" className="flux-secondary mt-4">Get Flux / Join testing</a></div><MinaVideo /></section>
    <section className="mina-card"><h2 className="text-3xl font-black">Help shape Flux with Mina</h2><p className="muted mt-4 mb-6">Want to test Flux or hear about Mina Tests? Verify your email to join the Android tester queue or iPhone waiting list. This does not enroll you in any experiment. Already using Flux? Continue using your normal account in the app.</p><ExperimentSignup purpose="tester" /></section>
    <PublishedExperiments initial={published} />
    <section className="glass-card mina-card"><h2>Your experience, at your pace</h2><p className="muted mt-4">Challenges are optional for eligible registered Flux users. No invitation code or website signup is needed. Skip a night or stop any time. Your personal answers stay private.</p><p className="muted mt-4">Personal exploration, not a validated sleep treatment. Any future generalizable research requires a separately reviewed disclosure and appropriate permission.</p></section>
  </main><ExperimentFooter /></div>
}
