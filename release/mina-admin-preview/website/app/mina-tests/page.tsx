import type { Metadata } from 'next'
import ExperimentVideo from '@/components/ExperimentVideo'
import { publishedExperiments } from '@/lib/server/mina-experiments'
import PublishedExperiments from '@/components/PublishedExperiments'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import MinaVideo from '@/components/MinaVideo'
import { minaMedia } from '@/lib/server/mina-media'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Mina Tests | Flux', description: 'Explore your own sleep habits with Mina. Fun personal challenges, short check-ins and your own discoveries inside Flux.' }
export default async function MinaTestsPage() {
  const [media, published] = await Promise.all([minaMedia(), publishedExperiments().catch(() => null)])
  const download = process.env.GOOGLE_PLAY_URL
  const downloadUrl = download && /^https:\/\/play\.google\.com\//.test(download) ? download : null
  return <div className="funnel-shell"><ExperimentHeader /><main>
    <section className="mina-hero mina-home-grid"><div><p className="eyebrow">FLUX / PERSONAL CHALLENGES</p><h1>Mina <span className="gradient-text">Tests</span></h1><p className="muted mt-6 text-lg">A little curiosity. Seven nights. Your own discoveries.</p><p className="mt-4">Meet Mina, try your assigned activity each evening, and share a short sleep check-in each morning. See your personal comparisons in Flux.</p><a href="#published-experiments" className="flux-button mt-6">Explore challenges →</a><p className="mina-status">Open Flux → Mina Tests → Start Challenge</p>{downloadUrl && <a href={downloadUrl} className="flux-secondary mt-4">Get Flux for Android</a>}</div>{published?.length ? <ExperimentVideo url={published[0].introVideoUrl} title="Meet your next challenge with Mina" /> : <MinaVideo {...media} />}</section>
    <PublishedExperiments initial={published} />
    <section className="glass-card mina-card"><h2>Your experience, at your pace</h2><p className="muted mt-4">Challenges are optional for eligible registered Flux users. No invitation code or website signup is needed. Skip a night or stop any time. Your personal answers stay private.</p><p className="muted mt-4">Personal exploration, not a validated sleep treatment. Any future generalizable research requires a separately reviewed disclosure and appropriate permission.</p></section>
  </main><ExperimentFooter /></div>
}
