import { cookies } from 'next/headers'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'
import { failure, json } from '@/lib/server/championship-http'
export const runtime = 'nodejs'
export async function GET() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value
    if (!token) return json({ receipt: null })
    return json({ receipt: await championshipBackend().receipt(token) })
  } catch (error) { return failure(error) }
}
