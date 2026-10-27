import { notFound } from 'next/navigation'
import { getExperiment, deploymentEnvironment } from '@/lib/server/mina-experiments'
import { publicExperiment, isPublicExperiment } from '@/lib/mina-experiments'
import PublishedExperiment from '@/components/PublishedExperiment'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
export const dynamic = 'force-dynamic'
export default async function ExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getExperiment(id)
  if (!e || !isPublicExperiment(e, deploymentEnvironment())) notFound()
  const personal = e.protocol?.enrollment?.mode === 'personal'
  const download = process.env.GOOGLE_PLAY_URL
  const downloadUrl = download && /^https:\/\/play\.google\.com\//.test(download) ? download : null
  return <div className="funnel-shell"><ExperimentHeader /><main><PublishedExperiment experiment={publicExperiment(e)} /><section className="glass-card mina-card"><h2>{personal ? 'Start in Flux' : 'Participate in Flux'}</h2><p>{personal ? 'Choose a personal challenge in Flux. Review the brief data explanation and adult eligibility, then tap Start Challenge. Skip or stop any time.' : 'Any registered Flux user who meets the eligibility criteria can choose to take part after reviewing the consent information. An email invite or website signup is not required.'}</p>{e.status === 'published' && e.enrollmentEnabled ? <p>Open Flux → Mina Tests → {e.title}. {personal ? 'Tap Start Challenge.' : 'Review eligibility and consent in the app before joining.'}</p> : <p>New enrollment is paused or the experiment has completed. Existing participant records remain available in Flux.</p>}{downloadUrl && <a className="flux-button" href={downloadUrl}>Get Flux for Android</a>}</section></main><ExperimentFooter /></div>
}
