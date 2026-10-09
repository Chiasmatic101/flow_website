import 'server-only'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { activeMinaTest } from '../minaTestsConfig'
import { isExcludedEmail, type MinaMembership } from './mina-model'
import type { Acquisition, DeliveryState, Device, SignupInput, SignupReceipt } from '../championship-types'
import { FunnelError } from '../championship-validation'
import { timeOf, type ChampionshipStore } from './championship-store'

export const SESSION_COOKIE = 'flux_championship_session'
const activeChampionship = { id: activeMinaTest.acquisitionCampaignId }
const DAY = 86_400_000
const HOUR = 3_600_000
const COOLDOWN = 60_000
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex')
const newToken = () => randomBytes(32).toString('base64url')
const tokenShape = (value: string) => /^[A-Za-z0-9_-]{43}$/.test(value)
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const newReferral = () => `FLUX-${Array.from(randomBytes(8), byte => alphabet[byte % alphabet.length]).join('')}`
const participantPath = (id: string) => `championshipParticipants/${id}`
const invitePath = (hash: string) => `championshipInvites/${hash}`
const sessionPath = (token: string) => `championshipSessions/${hashToken(token)}`
export const minaMembershipPath = (participantId: string, experimentId = activeMinaTest.id) => `minaTestParticipants/${hashToken(`${experimentId}:${participantId}`)}`

export type Participant = {
  email: string; emailNormalized: string; device: Device; championshipId: string
  status: 'invited' | 'joined' | 'app_connected'; referralCode: string; referredBy: string | null
  createdAt: unknown; joinedAt: unknown; consentExperimentUpdates: boolean; acquisition: Acquisition; fluxUid: string | null
  emailNextAttemptAt?: unknown; emailWindowStartedAt?: unknown; emailAttempts?: number
  currentInviteHash?: string | null; pendingInviteHash?: string | null
  experimentIds?: string[]; isTestRecord?: boolean
}
type ReferralOwner = { participantId: string; championshipId: string }
type Invite = { participantId: string; championshipId: string; experimentId?: string; deliveryConfirmed?: boolean; device: Device; status: 'pending' | 'active' | 'used' | 'revoked' | 'failed'; expiresAt: unknown; createdAt: unknown; usedAt: unknown }
type Session = SignupReceipt & { participantId: string; championshipId: string; experimentId?: string; kind: 'pending' | 'joined'; expiresAt: unknown; createdAt: unknown }
export type DeliveryResult = { delivery: DeliveryState; retryAfter: number; previewUrl?: string }
export type Mailer = { configured: boolean; send: (email: string, url: string, idempotencyKey: string) => Promise<void> }
type Dependencies = { store: ChampionshipStore; mailer: Mailer; siteUrl: string | (() => string); development: boolean; now?: () => number; referralGenerator?: () => string }

export function championshipService({ store, mailer, siteUrl, development, now = Date.now, referralGenerator = newReferral }: Dependencies) {
  const invitationOrigin = () => typeof siteUrl === 'function' ? siteUrl() : siteUrl
  async function signup(input: SignupInput) {
    // Sending configuration must be valid before signup writes any records.
    // Reading or confirming an existing invite does not need an email origin.
    invitationOrigin()
    const instant = now()
    const candidateId = randomUUID()
    const sessionToken = newToken()
    const index = `championshipParticipantKeys/${hashToken(`${activeChampionship.id}:${input.email}`)}`
    let participantId = ''
    // Both deduplication and referral-code reservations are transactional.
    // Retries generate a new candidate code if an actual collision is observed.
    for (let attempt = 0; attempt < 8; attempt++) {
      const referralCode = referralGenerator()
      const result = await store.transaction(async tx => {
        const existing = await tx.get<{ participantId: string }>(index)
        if (existing) {
          const participant = await tx.get<Participant>(participantPath(existing.participantId))
          if (!participant || participant.emailNormalized !== input.email || participant.championshipId !== activeChampionship.id) throw new FunnelError('temporarily_unavailable', 503)
          const membership = await tx.get<MinaMembership>(minaMembershipPath(existing.participantId))
          // A duplicate request does not prove email ownership. Never change the existing
          // participant, attribution, device, joined state or referral ownership here.
          if (!membership) tx.set(minaMembershipPath(existing.participantId), membershipRecord(existing.participantId, input.acquisition, participant.isTestRecord === true || isExcludedEmail(input.email)))
          tx.update(participantPath(existing.participantId), { experimentIds: [...new Set([...(participant.experimentIds || []), activeMinaTest.id])] })
          tx.set(sessionPath(sessionToken), { participantId: existing.participantId, championshipId: activeChampionship.id, experimentId: activeMinaTest.id, kind: 'pending', email: input.email, device: input.device, delivery: input.device === 'iphone' ? 'waitlist' : 'unavailable', retryAfter: 0, createdAt: store.serverTimestamp(), expiresAt: store.timestamp(instant + DAY) })
          return existing.participantId
        }
        const collision = await tx.get<ReferralOwner>(`championshipReferralCodes/${referralCode}`)
        let referrer: ReferralOwner | null = null
        if (input.referralCode) referrer = await tx.get<ReferralOwner>(`championshipReferralCodes/${input.referralCode}`)
        const owner = referrer ? await tx.get<Participant>(participantPath(referrer.participantId)) : null
        if (collision) return null
        const validReferral = referrer && owner && referrer.championshipId === activeChampionship.id && owner.championshipId === activeChampionship.id && owner.emailNormalized !== input.email ? referrer : null
        tx.set(participantPath(candidateId), {
          email: input.email, emailNormalized: input.email, device: input.device, championshipId: activeChampionship.id,
          status: 'invited', referralCode, referredBy: validReferral?.participantId ?? null,
          createdAt: store.serverTimestamp(), joinedAt: null, consentExperimentUpdates: true,
          acquisition: input.acquisition, fluxUid: null,
          experimentIds: [activeMinaTest.id], isTestRecord: development || isExcludedEmail(input.email),
        } satisfies Participant)
        tx.set(index, { participantId: candidateId, createdAt: store.serverTimestamp() })
        tx.set(`championshipReferralCodes/${referralCode}`, { participantId: candidateId, championshipId: activeChampionship.id, createdAt: store.serverTimestamp() })
        if (validReferral) tx.set(`championshipReferrals/${candidateId}`, { championshipId: activeChampionship.id, experimentId: activeMinaTest.id, referrerParticipantId: validReferral.participantId, referredParticipantId: candidateId, referralCode: input.referralCode, status: 'signed_up', qualifiedAt: null, createdAt: store.serverTimestamp() })
        tx.set(minaMembershipPath(candidateId), membershipRecord(candidateId, input.acquisition, isExcludedEmail(input.email)))
        tx.set(sessionPath(sessionToken), { participantId: candidateId, championshipId: activeChampionship.id, experimentId: activeMinaTest.id, kind: 'pending', email: input.email, device: input.device, delivery: input.device === 'iphone' ? 'waitlist' : 'unavailable', retryAfter: 0, createdAt: store.serverTimestamp(), expiresAt: store.timestamp(instant + DAY) })
        return candidateId
      })
      if (result) { participantId = result; break }
    }
    if (!participantId) throw new FunnelError('temporarily_unavailable', 503)
    const delivery = input.device === 'iphone' ? { delivery: 'waitlist' as const, retryAfter: 0 } : await sendInvite(participantId, input.device, activeMinaTest.id)
    await store.transaction(async tx => { tx.update(sessionPath(sessionToken), { delivery: delivery.delivery, retryAfter: delivery.retryAfter }) })
    return { sessionToken, receipt: { email: input.email, device: input.device, ...delivery } }
  }

  function membershipRecord(participantId: string, acquisition: Acquisition, excluded: boolean): MinaMembership {
    return { participantId, experimentId: activeMinaTest.id, status: 'signed_up', createdAt: store.serverTimestamp(), joinedAt: null, consentUpdates: true, acquisition, excludedFromPublicCounts: development || excluded, countSchemaVersion: 1 }
  }
  async function sendInvite(participantId: string, device: Device, experimentId?: string): Promise<DeliveryResult> {
    const origin = invitationOrigin()
    const instant = now()
    const token = newToken()
    const hash = hashToken(token)
    const reservation = await store.transaction(async tx => {
      const participant = await tx.get<Participant>(participantPath(participantId))
      if (!participant || participant.championshipId !== activeChampionship.id) throw new FunnelError('session_expired', 401)
      const wait = timeOf(participant.emailNextAttemptAt) - instant
      const started = timeOf(participant.emailWindowStartedAt)
      const inWindow = instant - started < HOUR
      if (wait > 0 || (inWindow && (participant.emailAttempts ?? 0) >= 5)) return { cooldown: Math.max(1, Math.ceil(Math.max(wait, inWindow && (participant.emailAttempts ?? 0) >= 5 ? started + HOUR - instant : 0) / 1000)), email: participant.email }
      tx.update(participantPath(participantId), { pendingInviteHash: hash, emailNextAttemptAt: store.timestamp(instant + COOLDOWN), emailWindowStartedAt: store.timestamp(inWindow ? started : instant), emailAttempts: inWindow ? (participant.emailAttempts ?? 0) + 1 : 1 })
      tx.set(invitePath(hash), { participantId, championshipId: activeChampionship.id, ...(experimentId ? { experimentId } : {}), device, status: 'pending', expiresAt: store.timestamp(instant + 7 * DAY), createdAt: store.serverTimestamp(), usedAt: null } satisfies Invite)
      return { cooldown: 0, email: participant.email }
    })
    if (reservation.cooldown) return { delivery: 'cooldown', retryAfter: reservation.cooldown }
    const url = `${origin}/join?token=${token}`
    let delivery: DeliveryState = 'unavailable'
    if (mailer.configured) {
      try { await mailer.send(reservation.email, url, `championship-invite/${hash}`); delivery = 'sent' }
      catch { delivery = 'failed' }
    }
    const preview = development && !mailer.configured
    await store.transaction(async tx => {
      const participant = await tx.get<Participant>(participantPath(participantId))
      if (!participant || participant.pendingInviteHash !== hash) { tx.update(invitePath(hash), { status: 'revoked' }); return }
      if (delivery === 'sent' || preview) {
        // Preserve the previous valid invite if email delivery fails.
        if (participant.currentInviteHash) tx.update(invitePath(participant.currentInviteHash), { status: 'revoked' })
        tx.update(invitePath(hash), { status: 'active', deliveryConfirmed: delivery === 'sent' })
        tx.update(participantPath(participantId), { currentInviteHash: hash, pendingInviteHash: null })
      } else {
        tx.update(invitePath(hash), { status: 'failed' })
        tx.update(participantPath(participantId), { pendingInviteHash: null })
      }
    })
    // Raw tokens only leave the server in email, or an explicit development-only preview.
    return { delivery, retryAfter: 60, ...(preview ? { previewUrl: url } : {}) }
  }

  async function readSession(token: string | undefined) {
    if (!token || !tokenShape(token)) return null
    const session = await store.get<Session>(sessionPath(token))
    return session && timeOf(session.expiresAt) > now() && session.championshipId === activeChampionship.id ? session : null
  }
  async function receipt(token: string | undefined): Promise<SignupReceipt | null> {
    const session = await readSession(token)
    if (!session) return null
    const participant = await store.get<Participant>(participantPath(session.participantId))
    if (!participant) return null
    return { email: session.email, device: session.device, delivery: session.delivery, retryAfter: Math.max(0, Math.ceil((timeOf(participant.emailNextAttemptAt) - now()) / 1000)) }
  }
  async function resend(token: string | undefined) {
    const session = await readSession(token)
    if (!session || session.device !== 'android' || !token) throw new FunnelError('session_expired', 401)
    const result = await sendInvite(session.participantId, session.device, session.experimentId)
    await store.transaction(async tx => { tx.update(sessionPath(token), { delivery: result.delivery, retryAfter: result.retryAfter }) })
    return result
  }
  async function inspectInvite(token: string) {
    if (!tokenShape(token)) throw new FunnelError('invalid_invite', 400)
    const invite = await store.get<Invite>(invitePath(hashToken(token)))
    const participant = invite ? await store.get<Participant>(participantPath(invite.participantId)) : null
    assertInvite(invite, participant, hashToken(token))
    return { device: invite!.device }
  }
  function assertInvite(invite: Invite | null, participant: Participant | null, hash: string) {
    if (!invite || !participant || invite.championshipId !== participant.championshipId || invite.championshipId !== activeChampionship.id) throw new FunnelError('invalid_invite')
    if (timeOf(invite.expiresAt) <= now()) throw new FunnelError('expired_invite')
    if (invite.status === 'used') throw new FunnelError('used_invite')
    if (invite.status !== 'active' || participant.currentInviteHash !== hash) throw new FunnelError('invalid_invite')
  }
  async function join(token: string) {
    if (!tokenShape(token)) throw new FunnelError('invalid_invite')
    const hash = hashToken(token)
    const sessionToken = newToken()
    const instant = now()
    const device = await store.transaction(async tx => {
      const invite = await tx.get<Invite>(invitePath(hash))
      const participant = invite ? await tx.get<Participant>(participantPath(invite.participantId)) : null
      assertInvite(invite, participant, hash)
      const validInvite = invite!
      const validParticipant = participant!
      const membership = validInvite.experimentId ? await tx.get<MinaMembership>(minaMembershipPath(validInvite.participantId, validInvite.experimentId)) : null
      const referral = await tx.get<{ status: string; experimentId?: string }>(`championshipReferrals/${validInvite.participantId}`)
      if (validInvite.experimentId && !membership) throw new FunnelError('invalid_invite')
      tx.update(invitePath(hash), { status: 'used', usedAt: store.serverTimestamp() })
      if (membership && validInvite.device === 'android') tx.update(minaMembershipPath(validInvite.participantId, validInvite.experimentId), { status: 'joined', joinedAt: membership.joinedAt ?? store.serverTimestamp() })
      if (referral?.status === 'signed_up' && referral.experimentId === validInvite.experimentId && validInvite.experimentId && validInvite.device === 'android' && !membership?.excludedFromPublicCounts) tx.update(`championshipReferrals/${validInvite.participantId}`, { status: 'qualified', qualifiedAt: store.serverTimestamp() })
      tx.update(participantPath(validInvite.participantId), { status: validParticipant.status === 'app_connected' ? 'app_connected' : 'joined', joinedAt: validParticipant.joinedAt ?? store.serverTimestamp(), device: validInvite.device })
      tx.set(sessionPath(sessionToken), { participantId: validInvite.participantId, championshipId: validInvite.championshipId, ...(validInvite.experimentId ? { experimentId: validInvite.experimentId } : {}), kind: 'joined', email: validParticipant.email, device: validInvite.device, delivery: validInvite.deliveryConfirmed ? 'sent' : 'unavailable', retryAfter: 0, createdAt: store.serverTimestamp(), expiresAt: store.timestamp(instant + 30 * DAY) })
      return validInvite.device
    })
    return { sessionToken, device }
  }
  async function joinedParticipant(token: string | undefined) {
    const session = await readSession(token)
    if (!session || session.kind !== 'joined') return null
    const participant = await store.get<Participant>(participantPath(session.participantId))
    if (!participant || participant.championshipId !== activeChampionship.id || !['joined', 'app_connected'].includes(participant.status)) return null
    const membership = await store.get<MinaMembership>(minaMembershipPath(session.participantId))
    return { referralCode: participant.referralCode, device: participant.device, experimentJoined: membership?.status === 'joined' }
  }
  async function enrollVerified(token: string | undefined, acquisition: Acquisition) {
    const session = await readSession(token)
    if (!session || session.kind !== 'joined') throw new FunnelError('session_expired', 401)
    return store.transaction(async tx => {
      const participant = await tx.get<Participant>(participantPath(session.participantId))
      const membership = await tx.get<MinaMembership>(minaMembershipPath(session.participantId))
      const referral = await tx.get<{ status: string; experimentId?: string }>(`championshipReferrals/${session.participantId}`)
      if (!participant || !['joined', 'app_connected'].includes(participant.status)) throw new FunnelError('session_expired', 401)
      // iPhone remains interest only; no Android enrollment or referral qualification.
      const joined = participant.device === 'android'
      if (!membership) tx.set(minaMembershipPath(session.participantId), { ...membershipRecord(session.participantId, acquisition, participant.isTestRecord === true || isExcludedEmail(participant.emailNormalized)), ...(joined ? { status: 'joined', joinedAt: store.serverTimestamp() } : {}) })
      else if (joined && membership.status !== 'joined') tx.update(minaMembershipPath(session.participantId), { status: 'joined', joinedAt: store.serverTimestamp() })
      if (joined && referral?.status === 'signed_up' && referral.experimentId === activeMinaTest.id && !(membership?.excludedFromPublicCounts ?? (development || participant.isTestRecord || isExcludedEmail(participant.emailNormalized)))) tx.update(`championshipReferrals/${session.participantId}`, { status: 'qualified', qualifiedAt: store.serverTimestamp() })
      tx.update(participantPath(session.participantId), { experimentIds: [...new Set([...(participant.experimentIds || []), activeMinaTest.id])] })
      return { device: participant.device }
    })
  }
  async function throttle(key: string) {
    // Shared across instances; never store an IP address or request URL.
    const path = `championshipRateLimits/${hashToken(key)}`
    await store.transaction(async tx => {
      const current = await tx.get<{ start: number; count: number }>(path)
      const instant = now()
      const active = current && instant - current.start < 60_000
      if (active && current.count >= 20) throw new FunnelError('rate_limited', 429, Math.ceil((current.start + 60_000 - instant) / 1000))
      tx.set(path, { start: active ? current.start : instant, count: active ? current.count + 1 : 1, expiresAt: store.timestamp(instant + DAY) })
    })
  }
  return { signup, receipt, resend, inspectInvite, join, joinedParticipant, enrollVerified, throttle }
}
