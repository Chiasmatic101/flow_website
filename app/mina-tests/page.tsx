import type { Metadata } from 'next'
import Link from 'next/link'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import MinaVideo from '@/components/MinaVideo'
import MinaResults from '@/components/MinaResults'
import MinaCommunity from '@/components/MinaCommunity'
import MinaSignup from '@/components/MinaSignup'
import { activeMinaTest } from '@/lib/minaTestsConfig'
import { minaMedia } from '@/lib/server/mina-media'
import { verifiedMinaParticipant } from '@/lib/server/mina-participation'
export const metadata: Metadata = { title: 'Mina Tests | Flux', description: 'Community experiments into sleep, sound and cognition. Follow Mina, explore the questions and join through your private Flux invite.' }
export default async function MinaTestsPage() {
  const [media, verified] = await Promise.all([minaMedia(), verifiedMinaParticipant()])
  return <div className="funnel-shell"><ExperimentHeader /><main>
    <section className="mina-hero mina-home-grid"><div><p className="eyebrow">FLUX / COMMUNITY EXPERIMENTS</p><h1>Mina <span className="gradient-text">Tests</span></h1><p className="muted mt-6 text-lg">{activeMinaTest.description}</p><p className="mina-status">{activeMinaTest.status}</p><a href="#signup" className="flux-button mt-6">{verified?.experimentJoined ? 'Continue / Download Flux →' : 'Join Mina Tests →'}</a><Link href="/mina-tests/results" className="mt-4 block min-h-11 text-sm text-cyan-200 underline">Explore results</Link></div><MinaVideo {...media} /></section>
    <section className="glass-card mina-card" aria-labelledby="testing-title"><p className="eyebrow">THE CURRENT MINA TEST</p><h2 id="testing-title">What are we testing?</h2><h3 className="mt-5 text-xl font-bold text-cyan-200">{activeMinaTest.title}</h3><dl className="mina-protocol"><div><dt>Experiment question</dt><dd>{activeMinaTest.question}<small>{activeMinaTest.questionStatus}</small></dd></div><div><dt>Hypothesis</dt><dd>{activeMinaTest.hypothesis}</dd></div><div><dt>Participant steps</dt><dd><ol>{activeMinaTest.steps.map(step => <li key={step}>{step}</li>)}</ol></dd></div><div><dt>Measurements</dt><dd>{activeMinaTest.measurements}</dd></div><div><dt>Duration</dt><dd>{activeMinaTest.duration}</dd></div></dl><p className="muted mt-5 text-sm">Signing up expresses interest. It does not mean you have completed an experiment, and no sleep or game measurements are collected by this website yet.</p></section>
    <MinaResults /><MinaCommunity />
    <div className="mina-signup-intro"><p className="eyebrow">TAKE PART</p><h2>Join Mina Tests. Download Flux.</h2><p className="muted mt-4">Email, phone, private invite. Confirm your invite before continuing to Android download. iPhone interest is saved separately.</p></div>
    <MinaSignup verified={verified} />
  </main><ExperimentFooter /></div>
}
