import { cookies } from 'next/headers'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'
import { FunnelError, validateSignup } from '@/lib/championship-validation'
import { failure, json, sameOrigin, smallJson } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const value = await smallJson(request)
    if (!value || typeof value !== 'object' || !('consent' in value) || value.consent !== true) throw new FunnelError('consent_required')
    const input = validateSignup({ ...(value as object), email: 'validation@example.org', device: 'android', consent: true })
    return json(await championshipBackend().enrollVerified((await cookies()).get(SESSION_COOKIE)?.value, input.acquisition))
  } catch (error) { return failure(error) }
}
