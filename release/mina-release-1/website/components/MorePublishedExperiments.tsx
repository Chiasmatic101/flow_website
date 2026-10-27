'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { publicExperiment } from '@/lib/mina-experiments'
type Row = ReturnType<typeof publicExperiment>
export default function MorePublishedExperiments({ initialCursor, resultsOnly }: { initialCursor: string | null; resultsOnly: boolean }) {
  const [cursor, setCursor] = useState(initialCursor), [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function more() {
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/mina-tests/experiments?after=${encodeURIComponent(cursor || '')}`)
      if (!response.ok) throw new Error()
      const page = await response.json()
      setRows(old => [...old, ...page.experiments]); setCursor(page.nextCursor)
    } catch { setError('Could not load the next page. Retry.') } finally { setBusy(false) }
  }
  return <>{rows.filter(e => !resultsOnly || e.results).map(e => <article key={e.id}><h3><Link href={`/mina-tests/${e.id}`}>{e.title} →</Link></h3><p>{resultsOnly ? e.results?.summary : e.description}</p></article>)}{error && <p role="alert">{error}</p>}{cursor && <button className="flux-secondary" disabled={busy} onClick={more}>Load more experiments</button>}</>
}
