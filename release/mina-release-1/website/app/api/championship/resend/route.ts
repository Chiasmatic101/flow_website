import { cookies } from 'next/headers'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'
import { failure, json, sameOrigin } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const result = await championshipBackend().resend((await cookies()).get(SESSION_COOKIE)?.value)
    return json(result, result.delivery === 'cooldown' ? 429 : 200, result.retryAfter)
  } catch (error) { return failure(error) }
}
