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
  return <><Link className="admin-link" href={`/admin/experiments/${e.id}`}>← Editor</Link><p className="mina-status">Private preview · saved revision {e.revision} · enrollment disabled</p><PublishedExperiment experiment={publicExperiment(e)} /></>
}
