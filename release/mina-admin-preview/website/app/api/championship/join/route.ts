import { championshipBackend } from '@/lib/server/championship'
import { confirmInvitation } from '@/lib/server/championship-join-handler'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  return confirmInvitation(request, championshipBackend)
}
