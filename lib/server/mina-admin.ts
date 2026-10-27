import 'server-only'
import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { championshipApp } from '../firebase-admin'
import { FunnelError } from '../championship-validation'
export const ADMIN_COOKIE = 'mina_admin_session'
export const adminAuth = () => getAuth(championshipApp())
export async function verifyAdminSession(token: string | undefined, auth = adminAuth) {
  if (!token) throw new FunnelError('admin_login_required', 401)
  try {
    const service = auth()
    const decoded = await service.verifySessionCookie(token, true)
    const user = await service.getUser(decoded.uid)
    if (decoded.admin !== true || user.customClaims?.admin !== true || user.disabled) throw new FunnelError('admin_access_required', 403)
    return decoded.uid
  } catch (e) { if (e instanceof FunnelError) throw e; throw new FunnelError('admin_login_required', 401) }
}
export async function requireAdmin() { return verifyAdminSession((await cookies()).get(ADMIN_COOKIE)?.value) }
