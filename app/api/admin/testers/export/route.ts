import { requireAdmin } from '@/lib/server/mina-admin'
import { testerPage, playCsv } from '@/lib/server/tester-admin'
import { failure } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  try {
    await requireAdmin()
    const page = await testerPage('android', new URL(request.url).searchParams.get('cursor'))
    return new Response(playCsv(page.rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="flux-android-testers.csv"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...(page.nextCursor ? { 'X-Next-Cursor': page.nextCursor } : {}) } })
  } catch (error) { return failure(error) }
}
