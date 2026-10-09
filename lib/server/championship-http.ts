import 'server-only'
import { NextResponse } from 'next/server'
import { FunnelError } from '../championship-validation'
import { SESSION_COOKIE } from './championship-service'

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  const allowed = new Set([new URL(request.url).origin])
  if (configured) { try { allowed.add(new URL(configured).origin) } catch { /* Configuration validated separately. */ } }
  if (!origin || !allowed.has(origin)) throw new FunnelError('invalid_request', 403)
}
export async function smallBody(request: Request, limit = 8192) {
  if (Number(request.headers.get('content-length') || 0) > limit) throw new FunnelError('invalid_input', 413)
  const reader = request.body?.getReader()
  if (!reader) throw new FunnelError('invalid_input')
  const chunks: Uint8Array[] = []; let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > limit) { await reader.cancel(); throw new FunnelError('invalid_input', 413) }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
export async function smallJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new FunnelError('invalid_input')
  const text = await smallBody(request)
  try { return JSON.parse(text) as unknown } catch { throw new FunnelError('invalid_input') }
}
export function json(data: unknown, status = 200, retryAfter = 0) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}) } })
}
export function setSession(response: NextResponse, token: string, joined = false) {
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: joined ? 30 * 86400 : 86400 })
}
export function failure(error: unknown) {
  const known = error instanceof FunnelError ? error : new FunnelError('temporarily_unavailable', 503)
  const messages: Record<string, string> = {
    invalid_input: 'Please check your details and try again.', invalid_email: 'Enter a valid email address.', invalid_device: 'Choose Android or iPhone.', consent_required: 'Please agree to Mina Tests updates to continue.', invalid_acquisition: 'Please reopen the Championship page and try again.',
    session_expired: 'Your signup session has expired. Enter your email again to request an invite.', rate_limited: 'Too many requests. Please wait before trying again.', invalid_request: 'Please submit this request from the Flux website.',
    backend_not_configured: process.env.NODE_ENV === 'development' ? 'Backend not configured. Add Firebase credentials and the site URL in .env.local; restart the server. No signup was completed.' : 'Signup is temporarily unavailable. Please try again later.',
    temporarily_unavailable: 'We could not complete that request. Please try again shortly.',
  }
  return json({ error: known.code, message: messages[known.code] || 'This invite could not be opened. Request a new invite.', retryAfter: known.retryAfter }, known.status, known.retryAfter)
}
export function requestLimitKey(request: Request) {
  // Hosting must replace forwarded headers at its trusted ingress. Per-participant
  // email cooldowns remain enforced even if this supplemental IP limit is bypassed.
  return `request:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'}`
}
