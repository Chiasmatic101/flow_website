import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'

export const metadata: Metadata = { title: 'Flux for iPhone — Coming Soon' }

export default async function ComingSoonPage() {
  let saved = false
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (token) { try { saved = (await championshipBackend().receipt(token))?.device === 'iphone' } catch { /* Do not claim persistence if the backend cannot confirm it. */ } }
  return <div className="funnel-shell"><ExperimentHeader /><main>
    <section className="campaign-hero iphone-hero"><p className="pulse-label"><i aria-hidden="true" />NEXT UP / IPHONE</p><div className="iphone-orbit" aria-hidden="true">↗</div><h1 className="campaign-title">Your turn is <span className="gradient-text">coming.</span></h1><h2 className="mt-6 text-2xl font-bold">Flux for iPhone is coming soon.</h2><p className="muted mx-auto mt-5 max-w-xl">Community experiments into sleep, sound and cognition. Join Mina Tests when Flux for iPhone is ready.</p><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-cyan-200">{saved ? 'Your iPhone interest is saved for Mina Tests. You have not enrolled in the Android experiment, and no Android invite has been sent.' : 'Leave your email and choose iPhone to save your interest for Coming Soon updates.'}</p><Link href="/" className="flux-button mt-8">Back to Flux →</Link><Link href="/mina-tests#signup" className="mt-5 block text-sm text-cyan-200 underline">{saved ? 'Join Mina Tests / Continue' : 'Join Mina Tests for iPhone'}</Link></section>
    <section><p className="eyebrow">WHILE YOU WAIT...</p><h2 className="mt-4 text-3xl font-black">Three things. One curious brain.</h2><div className="mt-7 grid gap-4 sm:grid-cols-3">{[['Sleep', 'Track your nights and discover patterns in your daily routine.'], ['Sound', 'Explore personalized sound environments for sleep and study.'], ['Cognition', 'Test focus, memory and reaction time to see how your performance changes.']].map(([title, text]) => <article className="glass-card p-6" key={title}><h3 className="text-2xl font-bold text-cyan-200">{title}</h3><p className="muted mt-4">{text}</p></article>)}</div></section>
  </main><ExperimentFooter /></div>
}
