import { requireAdmin } from '@/lib/server/mina-admin'
import { createAndroidPreview } from '@/lib/server/mina-admin-preview'
import { experimentId } from '@/lib/mina-experiments'
import { FunnelError } from '@/lib/championship-validation'
import { json, sameOrigin, smallBody } from '@/lib/server/championship-http'
import { adminFailure } from '@/lib/server/mina-admin-http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const actor = await requireAdmin()
    const body = JSON.parse(await smallBody(request))
    const id = experimentId(body.experimentId)
    if (typeof body.conditionId !== 'string' || !/^[a-z0-9][a-z0-9_.-]{0,99}$/.test(body.conditionId) || !Number.isInteger(body.expectedRevision)) throw new FunnelError('invalid_input')
    return json(await createAndroidPreview(actor, id, body.conditionId, body.expectedRevision))
  } catch (err) { return adminFailure(err) }
}
