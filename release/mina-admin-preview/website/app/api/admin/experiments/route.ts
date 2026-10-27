import { requireAdmin } from '@/lib/server/mina-admin'
import { adminExperimentPage, saveExperiment } from '@/lib/server/mina-experiments'
import { json, sameOrigin, smallBody } from '@/lib/server/championship-http'
import { adminFailure } from '@/lib/server/mina-admin-http'
import { FunnelError } from '@/lib/championship-validation'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const page = await adminExperimentPage(new URL(request.url).searchParams.get('after') || undefined)
    return json({ experiments: page.rows, nextCursor: page.nextCursor })
  } catch (e) { return adminFailure(e) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request); const actor = await requireAdmin()
    let body; try { body = JSON.parse(await smallBody(request, 256000)) } catch { throw new FunnelError('invalid_input') }
    return json(await saveExperiment(body.experiment, actor, body.expectedRevision, undefined, body.reviewProtocol === true))
  } catch (e) { return adminFailure(e) }
}
