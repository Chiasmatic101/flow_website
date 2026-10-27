import { publishedExperimentPage } from '@/lib/server/mina-experiments'
import { json } from '@/lib/server/championship-http'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  try { return json({ schemaVersion: 2, ...await publishedExperimentPage(new URL(request.url).searchParams.get('after') || undefined) }) }
  catch { return json({ error: 'experiments_unavailable' }, 503) }
}
