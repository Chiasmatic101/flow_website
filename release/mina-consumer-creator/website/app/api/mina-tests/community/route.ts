import { NextResponse } from 'next/server'
import { communityCounts } from '@/lib/server/mina-community'
export const runtime = 'nodejs'
export async function GET() {
  return NextResponse.json(await communityCounts(), { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300', 'X-Content-Type-Options': 'nosniff' } })
}
