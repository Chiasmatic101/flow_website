import 'server-only'
import { NextResponse } from 'next/server'
import { FunnelError } from '../championship-validation'
import { sameOrigin, setSession, smallBody } from './championship-http'

type InviteBackend = { join(token: string): Promise<{ sessionToken: string; device: 'android' | 'iphone' }> }
// Dependency injection keeps HTTP confirmation tests away from live Firestore.
export async function confirmInvitation(request: Request, backend: () => InviteBackend) {
  try {
    sameOrigin(request)
    if (Number(request.headers.get('content-length') || 0) > 1024 || !request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) throw new FunnelError('invalid_invite')
    const form = new URLSearchParams(await smallBody(request, 1024))
    const token = form.get('token') || ''
    const result = await backend().join(token)
    const response = NextResponse.redirect(new URL(result.device === 'iphone' ? '/coming-soon' : '/competition', request.url), 303)
    response.headers.set('Cache-Control', 'no-store')
    setSession(response, result.sessionToken, true)
    return response
  } catch (error) {
    const code = error instanceof FunnelError && ['invalid_invite', 'expired_invite', 'used_invite'].includes(error.code) ? error.code : 'unavailable'
    return NextResponse.redirect(new URL(`/join?error=${code}`, request.url), 303)
  }
}
