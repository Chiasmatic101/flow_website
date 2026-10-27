import Link from 'next/link'
import MorePublishedExperiments from './MorePublishedExperiments'
import { publishedExperiments } from '@/lib/server/mina-experiments'
export default async function PublishedExperiments({ resultsOnly = false, initial }: { resultsOnly?: boolean; initial?: Awaited<ReturnType<typeof publishedExperiments>> | null }) {
  let experiments = initial
  try { if (experiments === undefined) experiments = await publishedExperiments(); if (experiments === null) throw new Error() } catch { return <section className="glass-card mina-card"><p className="muted">Challenge listings are temporarily unavailable.</p></section> }
  const rows = resultsOnly ? experiments.filter(e => e.results) : experiments
  return <section id="published-experiments" className="glass-card mina-card space-y-6"><h2>{resultsOnly ? 'Published results' : 'Mina’s challenges'}</h2>{rows.length ? rows.map(e => <article key={e.id}><h3 className="text-xl font-bold"><Link className="admin-link" href={`/mina-tests/${e.id}`}>{e.title} →</Link></h3><p className="muted mt-3">{resultsOnly ? e.results?.summary : e.description}</p><p className="mt-3">{e.durationNights} nights</p></article>) : <p className="muted">{resultsOnly ? 'Results have not been published yet.' : 'Mina is preparing the next challenge. Check back soon.'}</p>}<MorePublishedExperiments resultsOnly={resultsOnly} initialCursor={experiments.length === 20 ? experiments.at(-1)!.id : null} /></section>
}
