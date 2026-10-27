import 'server-only'
import { cookies } from 'next/headers'
import { championshipBackend } from './championship'
import { SESSION_COOKIE } from './championship-service'
export async function verifiedMinaParticipant(experimentId?: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  try { return await championshipBackend().joinedParticipant(token, experimentId) } catch { return null }
}
