'use client'
import { useEffect, useState } from 'react'
type Counts = { available: boolean; signups?: number; confirmedEnrollments?: number; cachedForSeconds: number }
export default function MinaCommunity() {
  const [counts, setCounts] = useState<Counts | null>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/mina-tests/community').then(async response => {
      if (!response.ok) throw new Error()
      const result = await response.json()
      if (alive) setCounts(result)
    }).catch(() => { if (alive) setCounts({ available: false, cachedForSeconds: 300 }) })
    return () => { alive = false }
  }, [])
  return <section className="glass-card mina-card" aria-labelledby="community-title">
    <p className="eyebrow">THE COMMUNITY</p><h2 id="community-title">Explore together.</h2>
    {counts?.available && Number.isSafeInteger(counts.signups) && Number.isSafeInteger(counts.confirmedEnrollments) ? <><dl className="mina-community-stats"><div><dt>Signups for this Mina Test</dt><dd>{counts.signups!.toLocaleString()}</dd></div><div><dt>Confirmed enrollments</dt><dd>{counts.confirmedEnrollments!.toLocaleString()}</dd></div></dl><p className="muted mt-4 text-sm">Cached counts, refreshed at most every five minutes. Signups include iPhone interest; confirmed enrollments require the verification/enrollment step. Neither number represents completed participants.</p></> : <p className="muted mt-5">{counts ? 'A reliable signup count is not available yet.' : 'Checking community signups…'}</p>}
    <p className="muted mt-4 text-sm">Experiment completion tracking is not connected yet. No completed-participant count is available.</p>
  </section>
}
