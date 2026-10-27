'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type Experiment } from '@/lib/mina-experiments'
import { count, coverClass, planSummary, statusView } from '@/lib/mina-dashboard'
import { ChartIcon, DotsIcon, PlusIcon } from './MinaIcons'

type Counts = { signups: number | null; enrollments: number | null; active: null; completed: number | null; technicalErrors?: number | null; dropouts: number | null; completionRate: number | null }
export type AdminExperiment = Experiment & { counts?: Counts }

export function AdminLogout() {
  const router = useRouter()
  return <button type="button" className="md-btn md-btn-ghost" onClick={async () => { await fetch('/api/admin/session', { method: 'DELETE' }); router.push('/admin'); router.refresh() }}>Sign out</button>
}

type Filter = 'all' | 'live' | 'draft' | 'finished'
const filters: { id: Filter; label: string; match: (e: Experiment) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'live', label: 'Live', match: e => ['published', 'paused', 'testing'].includes(e.status) },
  { id: 'draft', label: 'Drafts', match: e => e.status === 'draft' },
  { id: 'finished', label: 'Finished', match: e => ['completed', 'archived'].includes(e.status) },
]

/** A status change from the list, with the consequence spelled out first. */
type Action = { label: string; status: Experiment['status']; confirm: string; danger?: boolean }
function actionsFor(e: Experiment): Action[] {
  const pause: Action = { label: 'Pause new starts', status: 'paused', confirm: 'Pause new starts? People already in this test keep going; nobody new can join until you resume.' }
  const finish: Action = { label: 'Finish test', status: 'completed', confirm: 'Finish this test? Nobody new can join. People already in it keep their saved results.' }
  const retire: Action = { label: 'Retire', status: 'archived', confirm: 'Retire this test? It disappears from the app catalog. Saved results stay private to each person.', danger: true }
  if (e.status === 'published') return [pause, finish, retire]
  if (e.status === 'paused') return [{ label: 'Resume new starts', status: 'published', confirm: 'Resume new starts? The test opens again in the app.' }, finish, retire]
  if (e.status === 'completed') return [retire]
  if (e.status === 'testing') return [finish, retire]
  return []
}

export function ExperimentList({ initial, initialCursor = null, projectId = 'flux-staging-1' }: { initial: AdminExperiment[]; initialCursor?: string | null; projectId?: string }) {
  const [rows, setRows] = useState(initial), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
  const [cursor, setCursor] = useState(initialCursor)
  const [filter, setFilter] = useState<Filter>('all')
  async function more() {
    setBusy(true)
    try { const r = await fetch(`/api/admin/experiments?after=${encodeURIComponent(cursor || '')}`); const page = await r.json(); if (!r.ok) throw new Error('Could not load tests'); setRows(old => [...old, ...page.experiments]); setCursor(page.nextCursor) } catch { setMessage('Could not load more tests. Try again.') } finally { setBusy(false) }
  }
  async function change(e: Experiment, action: Action) {
    if (!window.confirm(action.confirm)) return
    setBusy(true); setMessage('')
    try {
      const r = await fetch('/api/admin/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experiment: { ...e, status: action.status, enrollmentEnabled: action.status === 'published' }, expectedRevision: e.revision }) })
      const value = await r.json()
      if (!r.ok) throw new Error(value.issues?.[0] || value.message || 'That change didn’t save. Open the test to see what’s needed.')
      setRows(rows.map(row => row.id === e.id ? { ...value, counts: row.counts } : row)); setMessage(`${e.title}: ${statusView(value).label}.`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'That change didn’t save.') } finally { setBusy(false) }
  }
  const shown = rows.filter(filters.find(f => f.id === filter)!.match)
  return <div className="md-ui">
    <header className="md-list-head">
      <div className="md-row"><span className="md-avatar" aria-hidden="true">M</span><div><p className="md-eyebrow">Mina Tests</p><h1 className="md-h1">Your tests</h1></div></div>
      <div className="md-row"><AdminLogout /><Link className="md-btn md-btn-primary" href="/admin/experiments/new"><PlusIcon />New test</Link></div>
    </header>
    <div className="md-row" role="group" aria-label="Show tests" style={{ marginBottom: 20 }}>
      {filters.map(f => <button key={f.id} type="button" className="md-chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label} · {rows.filter(f.match).length}</button>)}
    </div>
    <p role="status" className="md-small" style={{ minHeight: 20, marginBottom: 8 }}>{message}</p>
    {shown.length ? <div className="md-test-grid">{shown.map(e => <TestCard key={e.id} e={e} busy={busy} onAction={action => change(e, action)} />)}</div>
      : <div className="md-card md-empty md-stack" style={{ alignItems: 'center' }}><span className="md-avatar" aria-hidden="true">M</span><h2 className="md-h2">{rows.length ? 'Nothing here yet' : 'Make your first test'}</h2><p className="md-sub">Pick a starting point — sound vs silence, one sound, a daily check-in or a brain game — and Mina’s ready in a few minutes.</p><Link className="md-btn md-btn-primary" href="/admin/experiments/new"><PlusIcon />New test</Link></div>}
    {cursor && <div style={{ marginTop: 20, textAlign: 'center' }}><button type="button" className="md-btn md-btn-secondary" disabled={busy} onClick={more}>Show more tests</button></div>}
    <p className="md-tiny" style={{ marginTop: 28 }}>Started = people who joined in the app (including anyone who later stopped). Finished = every night saved or skipped — it doesn’t mean their sleep improved. Completion = finished ÷ started, counting only people who still have an account. — means the number isn’t available yet. <a className="md-btn-ghost" style={{ padding: 0 }} target="_blank" rel="noopener noreferrer" href={`https://console.cloud.google.com/logs/query;query=${encodeURIComponent('resource.type="cloud_run_revision" severity>=WARNING ("minaProtocol" OR "Mina")')}?project=${encodeURIComponent(projectId)}`}>Technical log</a></p>
  </div>
}

function TestCard({ e, busy, onAction }: { e: AdminExperiment; busy: boolean; onAction: (a: Action) => void }) {
  const status = statusView(e)
  const draft = e.status === 'draft'
  const actions = actionsFor(e)
  return <article className="md-card md-test-card">
    <div className={`md-cover ${coverClass(e.id)}`}>
      {/* Admin-entered HTTPS image URL; decorative here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {e.thumbnailUrl && <img src={e.thumbnailUrl} alt="" />}
      <span className={`md-pill md-pill-${status.tone} md-cover-badge`}>{status.label}</span>
    </div>
    <div className="md-test-body">
      <div><h2 className="md-h2">{e.title || 'Untitled test'}</h2><p className="md-small">{planSummary(e)}</p></div>
      {draft ? <p className="md-alert md-alert-info">Private draft — only you can see it. Open it to finish and publish.</p>
        : <div className="md-stats">
          <div className="md-stat" title="People who joined in the app, including anyone who later stopped."><strong>{count(e.counts?.enrollments)}</strong><span>Started</span></div>
          <div className="md-stat" title="Every night saved or skipped."><strong>{count(e.counts?.completed)}</strong><span>Finished</span></div>
          <div className="md-stat" title="Finished ÷ started (people who still have an account)."><strong>{e.counts?.completionRate == null ? '—' : `${Math.round(e.counts.completionRate * 100)}%`}</strong><span>Completion</span></div>
        </div>}
      {!draft && (e.counts?.dropouts || e.counts?.technicalErrors) ? <p className="md-tiny">{count(e.counts?.dropouts)} stopped · {count(e.counts?.technicalErrors)} technical hiccups</p> : null}
      <div className="md-card-actions">
        <Link className={`md-btn ${draft ? 'md-btn-primary' : 'md-btn-secondary'}`} href={`/admin/experiments/${e.id}`}>{draft ? 'Continue editing' : 'Open'}</Link>
        {!draft && <Link className="md-btn md-btn-secondary" href={`/admin/experiments/${e.id}#results`}><ChartIcon size={18} />Results</Link>}
        <details className="md-menu">
          <summary className="md-btn md-btn-secondary md-icon-btn" aria-label={`More actions for ${e.title}`}><DotsIcon /></summary>
          <div className="md-card md-menu-pop">
            <Link href={`/admin/experiments/${e.id}/preview`}>Website page preview</Link>
            <Link href={`/admin/experiments/new?duplicate=${e.id}`}>Duplicate</Link>
            {actions.map(a => <button key={a.label} type="button" className={a.danger ? 'md-danger' : undefined} disabled={busy} onClick={event => { (event.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open'); onAction(a) }}>{a.label}</button>)}
          </div>
        </details>
      </div>
    </div>
  </article>
}

export { default as ExperimentEditor } from './MinaExperimentBuilder'
