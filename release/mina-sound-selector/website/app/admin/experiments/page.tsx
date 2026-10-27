import { requireAdminPage } from '@/lib/server/mina-admin-page'
import { adminExperimentPage } from '@/lib/server/mina-experiments'
import { ExperimentList } from '@/components/MinaAdmin'
export default async function ExperimentsPage() {
  await requireAdminPage()
  const page = await adminExperimentPage()
  return <ExperimentList initial={page.rows} initialCursor={page.nextCursor} projectId={process.env.FIREBASE_PROJECT_ID || 'flow-9d714'} />
}
