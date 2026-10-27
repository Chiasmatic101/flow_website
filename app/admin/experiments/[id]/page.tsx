import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/server/mina-admin-page'
import { getExperiment, experimentCounts, getExecutionCapabilities, conditionAverages } from '@/lib/server/mina-experiments'
import { ExperimentEditor } from '@/components/MinaAdmin'
import { blankExperiment, duplicateExperiment } from '@/lib/mina-builder'
export default async function EditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ duplicate?: string; step?: string; question?: string }> }) {
  await requireAdminPage()
  const { id } = await params
  const capabilities = await getExecutionCapabilities()
  const query = await searchParams
  if (id !== 'new') {
    const e = await getExperiment(id); if (!e) notFound()
    const [averages, counts] = await Promise.all([conditionAverages(e, query.question), experimentCounts(id)])
    const max = averages ? Math.max(1, Number(averages.question.max) - Number(averages.question.min)) : 1
    return <><ExperimentEditor initial={e} counts={counts} capabilities={capabilities} startStep={Number(query.step)} />
      {averages && <section id="results" className="md-ui md-card md-pad md-stack" style={{ marginTop: 32 }}>
        <div><p className="md-eyebrow">Results across everyone</p><h2 className="md-h2">How each condition compares</h2>
          <p className="md-small">Averages from this version of the test. Each person counts once per condition; starting-point, skipped and interrupted nights are left out. A condition needs at least five people before an average shows, and nobody’s individual answers appear here. These are app observations, not medical evidence.</p></div>
        <form method="get" className="md-row"><label className="md-field" style={{ flex: '1 1 260px' }}>Question<select className="md-select" name="question" defaultValue={averages.question.id}>{averages.questions.map(q => <option key={q.id} value={q.id}>{q.prompt}</option>)}</select></label><button className="md-btn md-btn-secondary" type="submit" style={{ alignSelf: 'flex-end' }}>Show</button></form>
        <div style={{ overflowX: 'auto' }}><table className="md-results-table"><thead><tr><th>Condition</th><th>People</th><th>Average ({averages.question.min}–{averages.question.max})</th><th aria-hidden="true"></th></tr></thead><tbody>{averages.rows.map(row => <tr key={row.label}><td><strong>{row.label}</strong></td><td>{row.participants ?? '—'}</td><td>{row.unavailable ? 'Not available yet — check the statistics index' : row.mean == null ? 'Needs 5+ people' : row.mean.toFixed(2)}</td><td style={{ width: '35%' }}>{row.mean != null && <div className="md-bar"><i style={{ width: `${Math.max(0, Math.min(100, ((row.mean - Number(averages.question.min)) / max) * 100))}%` }} /></div>}</td></tr>)}</tbody></table></div>
      </section>}</>
  }
  const { duplicate } = query
  const source = duplicate ? await getExperiment(duplicate) : null
  return <ExperimentEditor capabilities={capabilities} initial={source ? duplicateExperiment(source) : blankExperiment()} />
}
