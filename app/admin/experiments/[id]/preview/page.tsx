import { notFound } from 'next/navigation'
import { requireAdminPage } from '@/lib/server/mina-admin-page'
import { getExperiment } from '@/lib/server/mina-experiments'
import { publicExperiment } from '@/lib/mina-experiments'
import PublishedExperiment from '@/components/PublishedExperiment'
import Link from 'next/link'
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage()
  const e = await getExperiment((await params).id)
  if (!e) notFound()
  return <div className="md-stack">
    <div className="md-between"><Link className="md-btn md-btn-ghost" href={`/admin/experiments/${e.id}`}>← Back to the test</Link><span className="md-small">Website page preview · saved version {e.revision} · nobody can join from here</span></div>
    <div className="md-public-preview"><PublishedExperiment experiment={publicExperiment(e)} /></div>
  </div>
}
