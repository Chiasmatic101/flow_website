import { getExperiment, deploymentEnvironment } from '@/lib/server/mina-experiments'
import { experimentId, publicExperiment, isPublicExperiment } from '@/lib/mina-experiments'
import { json } from '@/lib/server/championship-http'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try { experimentId(id) } catch { return json({ error: 'not_found' }, 404) }
  try {
    const e = await getExperiment(id)
    if (!e || !isPublicExperiment(e, deploymentEnvironment())) return json({ error: 'not_found' }, 404)
    return json(publicExperiment(e))
  } catch { return json({ error: 'experiments_unavailable' }, 503) }
}
