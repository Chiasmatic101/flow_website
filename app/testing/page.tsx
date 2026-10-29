import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { championshipBackend } from '@/lib/server/championship'
import { SESSION_COOKIE } from '@/lib/server/championship-service'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import TesterConfirmation from '@/components/TesterConfirmation'
export const metadata: Metadata = { title: 'Your Flux testing signup', robots: { index: false, follow: false } }
export default async function TestingPage() {
  const profile = await championshipBackend().testerProfile((await cookies()).get(SESSION_COOKIE)?.value)
  if (!profile) redirect('/mina-tests#signup')
  const configured = process.env.GOOGLE_PLAY_TESTING_URL
  const playUrl = configured && /^https:\/\/play\.google\.com\/apps\/testing\/com\.chiasmatic\.flow(?:[/?#]|$)/.test(configured) ? configured : null
  return <div className="funnel-shell"><ExperimentHeader /><main className="invite-page"><TesterConfirmation initial={profile} playUrl={playUrl} /></main><ExperimentFooter /></div>
}
