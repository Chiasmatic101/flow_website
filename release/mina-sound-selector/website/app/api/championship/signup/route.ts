import { validateSignup } from '@/lib/championship-validation'
import { championshipBackend } from '@/lib/server/championship'
import { failure, json, requestLimitKey, sameOrigin, setSession, smallJson } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    const input = validateSignup(await smallJson(request))
    const backend = championshipBackend()
    await backend.throttle(requestLimitKey(request))
    const { sessionToken, receipt } = await backend.signup(input)
    const response = json(receipt, 200, receipt.retryAfter)
    setSession(response, sessionToken)
    return response
  } catch (error) { return failure(error) }
}
