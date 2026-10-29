import { cookies } from 'next/headers'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'
import { failure, json, sameOrigin, smallJson } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function GET() {
  try { return json({ profile: await championshipBackend().testerProfile((await cookies()).get(SESSION_COOKIE)?.value) }) }
  catch (error) { return failure(error) }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const body = await smallJson(request) as { playEmail?: unknown }
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    const backend = championshipBackend()
    await backend.savePlayEmail(token, body.playEmail)
    return json({ profile: await backend.testerProfile(token) })
  } catch (error) { return failure(error) }
}
