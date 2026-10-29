import Link from 'next/link'
import { requireAdminPage } from '@/lib/server/mina-admin-page'
import { adminExperimentPage } from '@/lib/server/mina-experiments'
import { ExperimentList } from '@/components/MinaAdmin'
export default async function ExperimentsPage() {
  await requireAdminPage()
  const page = await adminExperimentPage()
  return <><div className="p-4 text-right"><Link href="/admin/testers" className="text-cyan-200 underline">Flux tester queue / CSV export</Link></div><ExperimentList initial={page.rows} initialCursor={page.nextCursor} projectId={process.env.FIREBASE_PROJECT_ID || 'flow-9d714'} /></>
}
