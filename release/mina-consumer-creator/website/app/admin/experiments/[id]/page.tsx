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
    const averages = await conditionAverages(e, query.question)
    return <><ExperimentEditor initial={e} counts={await experimentCounts(id)} capabilities={capabilities} startStep={Number(query.step)} />
      {averages && <section className="builder-section my-8"><h2>Aggregate personal observations</h2>
        <p className="muted">Current saved protocol only. Each participant has equal weight within each condition. Baselines, skipped and interrupted sessions are excluded. These are descriptive app observations, not medical evidence or a causal comparison. Means require at least five contributors per condition; individual answers are never displayed here. Account deletion removes contributions.</p>
        <form method="get" className="my-4"><label>Question<select className="email-input" name="question" defaultValue={averages.question.id}>{averages.questions.map(q => <option key={q.id} value={q.id}>{q.prompt}</option>)}</select></label><button className="flux-secondary" type="submit">Show averages</button></form>
        <table className="admin-table"><thead><tr><th>Condition</th><th>Contributors</th><th>Average ({averages.question.min}–{averages.question.max})</th></tr></thead><tbody>{averages.rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{row.participants ?? 'Unavailable'}</td><td>{row.unavailable ? 'Unavailable — check the statistics index and server access' : row.mean == null ? 'Not enough contributors' : row.mean.toFixed(2)}</td></tr>)}</tbody></table>
      </section>}</>
  }
  const { duplicate } = query
  const source = duplicate ? await getExperiment(duplicate) : null
  return <ExperimentEditor capabilities={capabilities} initial={source ? duplicateExperiment(source) : blankExperiment()} />
}
