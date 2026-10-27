import type { Metadata } from 'next'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import ChampionshipInvite from '@/components/ChampionshipInvite'
import { verifiedMinaParticipant } from '@/lib/server/mina-participation'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Your Mina Tests Invite | Flux', robots: { index: false, follow: false } }

export default async function CheckEmailPage() {
  const participant = await verifiedMinaParticipant()
  if (participant) redirect(participant.device === 'iphone' ? '/coming-soon' : '/competition')
  return <div className="funnel-shell"><ExperimentHeader /><main className="invite-page"><ChampionshipInvite /></main><ExperimentFooter /></div>
}
