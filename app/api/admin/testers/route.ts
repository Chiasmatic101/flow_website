import { requireAdmin } from '@/lib/server/mina-admin'
import { testerPage, updateTesterStatus } from '@/lib/server/tester-admin'
import { failure, json, sameOrigin, smallJson } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  try { await requireAdmin(); const params = new URL(request.url).searchParams; return json(await testerPage(params.get('platform') || 'android', params.get('cursor'))) }
  catch (error) { return failure(error) }
}
export async function PATCH(request: Request) {
  try { sameOrigin(request); const uid = await requireAdmin(); await updateTesterStatus(await smallJson(request), uid); return json({ ok: true }) }
  catch (error) { return failure(error) }
}
