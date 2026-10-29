import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { FunnelError } from '../championship-validation'
import { safePlayEmail } from './championship-service'
import { timeOf, type ChampionshipStore } from './championship-store'
export type InvitationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'review_required'
export type InvitationSummary = { status: InvitationStatus; errorCode: string | null; sentAt?: unknown }
type Queue = { active: boolean; emailVerified: boolean; consent: boolean; email: string; playEmail: string; status: string; invitationId?: string; invitation?: InvitationSummary }
type Job = { participantId: string; recipient: string; playEmail: string; status: InvitationStatus; errorCode: string | null; attempts: number; firstAttemptAt?: unknown; leaseUntil?: unknown; lease?: string; optInUrl?: string; sentAt?: unknown }
export type TesterStatusInput = { id: string; status: string; expectedStatus: string; expectedPlayEmail: unknown }
export function playOptInUrl(value: string | undefined) {
  try { const url = new URL(value || ''); if (url.protocol !== 'https:' || url.hostname !== 'play.google.com' || url.port || url.username || url.password || url.pathname.replace(/\/$/, '') !== '/apps/testing/com.chiasmatic.flow' || url.search || url.hash) return null; return url.href } catch { return null }
}
const summary = (job: Job): InvitationSummary => ({ status: job.status, errorCode: job.errorCode, ...(job.sentAt ? { sentAt: job.sentAt } : {}) })
export function testerInvitationService({ store, send, optInUrl, now = Date.now }: { store: ChampionshipStore; send: (email: string, playEmail: string, url: string, key: string) => Promise<void>; optInUrl: () => string | undefined; now?: () => number }) {
  async function change(input: TesterStatusInput, adminUid: string) {
    const path = `fluxAndroidTesters/${input.id}`
    const jobId = createHash('sha256').update(`${input.id}:${input.expectedPlayEmail}`).digest('hex')
    const jobPath = `fluxTesterInvitations/${jobId}`
    await store.transaction(async tx => {
      const row = await tx.get<Queue>(path)
      const job = input.status === 'added' ? await tx.get<Job>(jobPath) : null
      if (!row?.active || !row.emailVerified || !row.consent) throw new FunnelError('invalid_input')
      if (row.status !== input.expectedStatus || row.playEmail !== input.expectedPlayEmail) throw new FunnelError('queue_changed', 409)
      if (!safePlayEmail(row.playEmail)) throw new FunnelError('invalid_play_email')
      const created: Job = job ?? { participantId: input.id, recipient: row.email, playEmail: row.playEmail, status: 'pending', errorCode: null, attempts: 0 }
      tx.update(path, { status: input.status, updatedAt: store.serverTimestamp(), ...(input.status === 'added' ? { invitationId: jobId, invitation: summary(created) } : {}) })
      if (input.status === 'added' && !job) tx.set(jobPath, { ...created, createdAt: store.serverTimestamp(), approvedBy: adminUid })
      tx.set(`fluxTesterAudit/${randomUUID()}`, { participantId: input.id, from: input.expectedStatus, to: input.status, adminUid, createdAt: store.serverTimestamp() })
    })
    return input.status === 'added' ? deliver(input.id, input.expectedPlayEmail) : null
  }
  async function deliver(id: string, expectedPlayEmail: unknown) {
    const path = `fluxAndroidTesters/${id}`
    const lease = randomUUID()
    const reservation = await store.transaction(async tx => {
      const row = await tx.get<Queue>(path)
      const jobPath = row?.invitationId ? `fluxTesterInvitations/${row.invitationId}` : null
      const job = jobPath ? await tx.get<Job>(jobPath) : null
      if (!row?.active || !row.emailVerified || !row.consent || row.status !== 'added' || row.playEmail !== expectedPlayEmail || !job || job.participantId !== id || job.playEmail !== row.playEmail) throw new FunnelError('queue_changed', 409)
      if (job.status === 'sent' || job.status === 'review_required' || (job.status === 'sending' && timeOf(job.leaseUntil) > now())) return { result: summary(job) }
      // Provider idempotency keys expire after 24h. Never blindly resend an ambiguous
      // attempt after that boundary; an operator must inspect the provider dashboard.
      if (job.firstAttemptAt && now() - timeOf(job.firstAttemptAt) >= 23 * 3600000) {
        const result: InvitationSummary = { status: 'review_required', errorCode: 'delivery_outcome_requires_review' }
        tx.update(jobPath!, result); tx.update(path, { invitation: result }); return { result }
      }
      const url = job.optInUrl || playOptInUrl(optInUrl())
      if (!url) {
        const result: InvitationSummary = { status: 'failed', errorCode: 'play_opt_in_url_not_configured' }
        tx.update(jobPath!, { ...result, lastAttemptAt: store.serverTimestamp() }); tx.update(path, { invitation: result }); return { result }
      }
      tx.update(jobPath!, { status: 'sending', errorCode: null, lease, leaseUntil: store.timestamp(now() + 60000), firstAttemptAt: job.firstAttemptAt ?? store.timestamp(now()), lastAttemptAt: store.serverTimestamp(), attempts: job.attempts + 1, optInUrl: url })
      tx.update(path, { invitation: { status: 'sending', errorCode: null } })
      return { jobPath: jobPath!, jobId: row.invitationId!, job, url }
    })
    if ('result' in reservation) return reservation.result
    let result: InvitationSummary
    try { await send(reservation.job.recipient, reservation.job.playEmail, reservation.url, `flux-play/${reservation.jobId}`); result = { status: 'sent', errorCode: null, sentAt: store.serverTimestamp() } }
    catch { result = { status: 'failed', errorCode: 'email_delivery_not_confirmed' } }
    await store.transaction(async tx => {
      const job = await tx.get<Job>(reservation.jobPath)
      const row = await tx.get<Queue>(path)
      if (job?.lease !== lease) return
      tx.update(reservation.jobPath, { ...result, leaseUntil: store.timestamp(0), updatedAt: store.serverTimestamp() })
      if (row?.invitationId === reservation.jobId && row.playEmail === reservation.job.playEmail) tx.update(path, { invitation: result })
    })
    return result
  }
  return { change, retry: deliver }
}
