import { adminAuth, ADMIN_COOKIE } from '@/lib/server/mina-admin'
import { championshipBackend } from '@/lib/server/championship'
import { sameOrigin, smallJson, json, requestLimitKey } from '@/lib/server/championship-http'
import { FunnelError } from '@/lib/championship-validation'
import { adminFailure } from '@/lib/server/mina-admin-http'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    sameOrigin(request)
    await championshipBackend().throttle(`admin:${requestLimitKey(request)}`)
    const input = await smallJson(request) as Record<string, unknown>
    if (!input || typeof input.email !== 'string' || typeof input.password !== 'string' || input.email.length > 254 || input.password.length > 1000) throw new FunnelError('invalid_credentials', 401)
    const key = process.env.FIREBASE_WEB_API_KEY
    if (!key) throw new FunnelError('admin_auth_not_configured', 503)
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.email, password: input.password, returnSecureToken: true }), cache: 'no-store', signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new FunnelError('invalid_credentials', 401)
    const result = await response.json()
    const auth = adminAuth(), token = await auth.verifyIdToken(result.idToken, true)
    const user = await auth.getUser(token.uid)
    if (token.admin !== true || user.customClaims?.admin !== true || user.disabled) throw new FunnelError('admin_access_required', 403)
    if (Date.now() / 1000 - token.auth_time > 300) throw new FunnelError('recent_login_required', 401)
    const expiresIn = 8 * 3600 * 1000
    const session = await auth.createSessionCookie(result.idToken, { expiresIn })
    const out = json({ ok: true })
    out.cookies.set(ADMIN_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: expiresIn / 1000 })
    return out
  } catch (error) { return adminFailure(error) }
}
export async function DELETE(request: Request) {
  try { sameOrigin(request); const out = json({ ok: true }); out.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 }); return out } catch (error) { return adminFailure(error) }
}
