import Link from 'next/link'
import { activeMinaTest } from '@/lib/minaTestsConfig'
export default function MinaResults() {
  return <section id="results" data-results-state={activeMinaTest.results.state} className="glass-card mina-card" aria-labelledby="results-title"><p className="eyebrow">RESULTS</p><h2 id="results-title">Coming soon</h2><p className="muted mt-5">No scientific results have been published for this Mina Test. We&apos;ll share genuine findings with methods and limitations when they are available.</p><Link href="/mina-tests#signup" className="flux-secondary mt-6">Join Mina Tests →</Link></section>
}
