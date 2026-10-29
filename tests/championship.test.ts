import type { Experiment } from '../lib/mina-experiments'
import { fixtureCapabilities, fixtureExperiment } from './mina-fixtures'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { championshipService, hashToken, minaMembershipPath, type Mailer, type Participant } from '../lib/server/championship-service'
import type { ChampionshipStore, StoreTransaction } from '../lib/server/championship-store'
import { validateSignup, FunnelError } from '../lib/championship-validation'
import { inviteEmail } from '../lib/server/championship-email'
import { activeMinaTest } from '../lib/minaTestsConfig'
import { isExcludedEmail, type MinaMembership } from '../lib/server/mina-model'
import { aggregateCache } from '../lib/server/mina-community'
import { confirmInvitation } from '../lib/server/championship-join-handler'
import { readFileSync } from 'node:fs'
import { SESSION_COOKIE } from '../lib/server/championship-service'
import nextConfig from '../next.config'

test('invite GET then form POST confirms once, timestamps membership and establishes a verified cookie without a prior session', async () => {
  // Next's client Link cannot load under the standalone react-server test condition.
  // Guard the critical browser policy without rendering the whole Next page here.
  assert.match(readFileSync(new URL('../app/join/page.tsx', import.meta.url), 'utf8'), /referrer:\s*'same-origin'/, 'The join page must preserve the browser POST Origin')
  const headers = await nextConfig.headers!()
  assert.equal(headers.find(entry => entry.source === '/join')?.headers.find(header => header.key === 'Referrer-Policy')?.value, 'same-origin', 'HTTP and HTML referrer policies must agree')
  const f = await fixture()
  await f.service.signup(f.input('http-confirmation'))
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  assert(invite)
  const path = `championshipParticipants/${invite.participantId}`
  await f.service.inspectInvite(token)
  assert.equal((await f.store.get<Participant>(path))?.joinedAt, null)
  const request = (origin: string) => new Request('https://flux.example/api/championship/join', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token }) })
  const rejected = await confirmInvitation(request('null'), () => f.service)
  assert.equal(new URL(rejected.headers.get('location')!).searchParams.get('error'), 'unavailable')
  assert.equal((await f.store.get<Participant>(path))?.status, 'invited', 'Null Origin is rejected before enrollment')
  const response = await confirmInvitation(request('https://flux.example'), () => f.service)
  assert.equal(response.status, 303)
  assert.equal(new URL(response.headers.get('location')!).pathname, '/competition')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const cookie = response.cookies.get(SESSION_COOKIE)
  assert(cookie && cookie.httpOnly && cookie.sameSite === 'lax' && cookie.path === '/')
  const participant = await f.store.get<Participant>(path)
  assert.equal(participant?.status, 'joined')
  assert(participant?.joinedAt)
  assert.equal((await f.service.joinedParticipant(cookie.value))?.experimentJoined, true)
  const membership = await f.store.get<MinaMembership>(minaMembershipPath(invite.participantId))
  assert.equal(membership?.status, 'joined'); assert(membership?.joinedAt)
  const size = f.store instanceof MemoryStore ? f.store.docs.size : null
  const second = await confirmInvitation(request('https://flux.example'), () => f.service)
  assert.equal(second.status, 303)
  assert.equal(new URL(second.headers.get('location')!).searchParams.get('error'), 'used_invite')
  assert.equal(second.cookies.has(SESSION_COOKIE), false)
  assert.deepEqual(await f.store.get<Participant>(path), participant)
  assert.deepEqual(await f.store.get<MinaMembership>(minaMembershipPath(invite.participantId)), membership)
  if (f.store instanceof MemoryStore) assert.equal(f.store.docs.size, size)
})

test('existing invites can be inspected and confirmed when email site URL is unavailable; new delivery fails before writes', async () => {
  const f = await fixture()
  const signup = await f.service.signup(f.input('configured-send'))
  const token = rawToken(f.sent[0].url)
  let urlChecks = 0
  const unavailable = championshipService({ store: f.store, mailer: { configured: true, send: async () => assert.fail('No email should be sent') }, siteUrl: () => { urlChecks++; throw new FunnelError('backend_not_configured', 503) }, development: false })
  assert.deepEqual(await unavailable.inspectInvite(token), { device: 'android' })
  assert.equal(urlChecks, 0, 'GET inspection does not depend on sending configuration')
  await assert.rejects(unavailable.signup(f.input('missing-site-url')), isError('backend_not_configured'))
  await assert.rejects(unavailable.resend(signup.sessionToken), isError('backend_not_configured'))
  assert.deepEqual(await unavailable.inspectInvite(token), { device: 'android' }, 'Failed sends leave the existing invite active')
  const checksBeforeJoin = urlChecks
  const joined = await unavailable.join(token)
  assert.equal(urlChecks, checksBeforeJoin, 'Confirmation does not depend on sending configuration')
  assert.equal((await unavailable.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
})

// Deterministic transactional test store. Tests use no real credentials or delivery.
// Production uses the Firestore adapter; run the same suite with USE_FIRESTORE_EMULATOR=1
// against a dedicated local emulator to validate real transaction semantics.
class MemoryStore implements ChampionshipStore {
  docs = new Map<string, object>()
  queue = Promise.resolve()
  constructor(private clock: () => number) {}
  async get<T>(path: string) { return this.docs.get(path) as T ?? null }
  timestamp(ms: number) { return ms }
  serverTimestamp() { return this.clock() }
  async transaction<T>(run: (tx: StoreTransaction) => Promise<T>): Promise<T> {
    const previous = this.queue
    let release!: () => void
    this.queue = new Promise(resolve => { release = resolve })
    await previous
    const staged = new Map(this.docs); let written = false
    try {
      const result = await run({
        get: async <U>(path: string) => { assert.equal(written, false, 'Firestore requires reads before writes'); return staged.get(path) as U ?? null },
        set: (path, data) => { written = true; staged.set(path, structuredClone(data)) },
        update: (path, data) => { assert(staged.has(path), 'Cannot update missing document'); written = true; staged.set(path, { ...staged.get(path), ...structuredClone(data) }) },
      })
      this.docs = staged
      return result
    } finally { release() }
  }
}

async function fixture(options: { mailConfigured?: boolean; failSend?: boolean; development?: boolean; referralGenerator?: () => string } = {}) {
  let clock = Date.now()
  let store: ChampionshipStore = new MemoryStore(() => clock)
  if (process.env.USE_FIRESTORE_EMULATOR === '1') {
    assert(process.env.FIRESTORE_EMULATOR_HOST, 'Tests require a local emulator; never use the live project')
    assert.equal(process.env.FIREBASE_PROJECT_ID, 'demo-flux-championship', 'Use the dedicated demo project')
    const { firestoreStore } = await import('../lib/server/championship-store')
    store = firestoreStore()
  }
  const sent: { email: string; url: string; key: string }[] = []
  const mailer: Mailer = { configured: options.mailConfigured ?? true, send: async (email, url, key) => { if (options.failSend) throw new Error('Simulated provider failure'); sent.push({ email, url, key }) } }
  const service = championshipService({ store, mailer, siteUrl: 'https://flux.example', development: options.development ?? false, now: () => clock, referralGenerator: options.referralGenerator })
  const suffix = `${crypto.randomUUID()}@example.org`
  const input = (name: string, extra: Record<string, unknown> = {}) => validateSignup({ email: `${name}-${suffix}`, device: 'android', consent: true, ...extra })
  return { store, service, sent, input, advance: (milliseconds: number) => { clock += milliseconds }, options }
}
const rawToken = (url: string) => new URL(url).searchParams.get('token')!
const isError = (code: string) => (error: unknown) => error instanceof FunnelError && error.code === code

test('input validation normalizes email and referral; acquisition is bounded and strips referrer query', () => {
  const data = validateSignup({ email: ' Student@EXAMPLE.org ', device: 'android', consent: true, referralCode: 'flux-a7k3p2', acquisition: { utmSource: 'tiktok', referrerUrl: 'https://example.org/article?email=private#token' }, participantId: 'forged', championshipId: 'forged' })
  assert.equal(data.email, 'student@example.org'); assert.equal(data.referralCode, 'FLUX-A7K3P2'); assert.equal(data.acquisition.referrerUrl, 'https://example.org/article')
  for (const invalid of [{ email: 'bad' }, { consent: false }, { device: 'other' }, { acquisition: { utmContent: 'x'.repeat(201) } }, { email: 'ok@example.org\nheader' }]) assert.throws(() => validateSignup({ email: 'ok@example.org', device: 'android', consent: true, ...invalid }), FunnelError)
})

test('Android creates participant, sends invite; pending receipt has no joined access; valid token joins once', async () => {
  const f = await fixture()
  const result = await f.service.signup(f.input('android', { acquisition: { utmSource: 'tiktok', utmCampaign: 'october', utmContent: 'maya_sleep_03' } }))
  assert.equal(result.receipt.delivery, 'sent'); assert.equal('participantId' in result.receipt, false); assert.equal('previewUrl' in result.receipt, false)
  assert.equal(await f.service.joinedParticipant(result.sessionToken), null)
  assert.equal((await f.service.receipt(result.sessionToken))?.email, result.receipt.email)
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  assert(invite)
  const participant = await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`)
  assert.equal(participant?.status, 'invited'); assert.equal(participant?.fluxUid, null); assert.equal(participant?.acquisition.utmSource, 'tiktok'); assert.notEqual(invite.participantId, participant?.email)
  assert(!JSON.stringify(invite).includes(token), 'Raw token not stored')
  await f.service.inspectInvite(token)
  assert.equal((await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`))?.status, 'invited', 'GET inspection does not join')
  const joined = await f.service.join(token)
  assert((await f.service.joinedParticipant(joined.sessionToken))?.referralCode)
  const after = await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`)
  assert.equal(after?.status, 'joined'); assert(after?.joinedAt)
  await assert.rejects(f.service.join(token), isError('used_invite'))
})

test('iPhone saves interest without email or joined access', async () => {
  const f = await fixture()
  const result = await f.service.signup(f.input('iphone', { device: 'iphone' }))
  assert.equal(result.receipt.delivery, 'waitlist'); assert.equal(f.sent.length, 0)
  assert.equal((await f.service.receipt(result.sessionToken))?.device, 'iphone')
  await assert.rejects(f.service.resend(result.sessionToken), isError('session_expired'))
})

test('concurrent duplicates reuse the participant; do not overwrite first attribution or gain verified access', async () => {
  const f = await fixture()
  const input = f.input('duplicate', { acquisition: { utmSource: 'instagram' } })
  const replies = await Promise.all(Array.from({ length: 4 }, () => f.service.signup(input)))
  assert.equal(f.sent.length, 1)
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  const joined = await f.service.join(token)
  assert(await f.service.joinedParticipant(joined.sessionToken))
  f.advance(61_000)
  const duplicate = await f.service.signup({ ...input, device: 'iphone', acquisition: { ...input.acquisition, utmSource: 'other' } })
  assert.equal(await f.service.joinedParticipant(duplicate.sessionToken), null)
  const participant = await f.store.get<Participant>(`championshipParticipants/${invite!.participantId}`)
  assert.equal(participant?.status, 'joined'); assert.equal(participant?.device, 'android'); assert.equal(participant?.acquisition.utmSource, 'instagram')
  if (f.store instanceof MemoryStore) assert.equal([...f.store.docs.keys()].filter(path => path.startsWith('championshipParticipants/')).length, 1)
  assert(replies.some(reply => reply.receipt.delivery === 'cooldown'))
})

test('valid referrals create exactly one signed_up relationship; invalid and self referrals are ignored', async () => {
  const f = await fixture()
  const ownerInput = f.input('owner')
  const owner = await f.service.signup(ownerInput)
  const joined = await f.service.join(rawToken(f.sent[0].url))
  const profile = await f.service.joinedParticipant(joined.sessionToken)
  assert(profile)
  const referredInput = f.input('friend', { referralCode: profile.referralCode.toLowerCase() })
  await f.service.signup(referredInput)
  const referredInvite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(rawToken(f.sent[1].url))}`)
  const referral = await f.store.get<{ status: string; referralCode: string }>(`championshipReferrals/${referredInvite!.participantId}`)
  assert.equal(referral?.status, 'signed_up'); assert.equal(referral?.referralCode, profile.referralCode)
  await f.service.signup(referredInput)
  await f.service.signup({ ...ownerInput, referralCode: profile.referralCode })
  assert.equal(await f.service.joinedParticipant(owner.sessionToken), null)
  await f.service.signup(f.input('invalid', { referralCode: 'FLUX-NOTREAL1' }))
  const invalidInvite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(rawToken(f.sent[2].url))}`)
  assert.equal(await f.store.get(`championshipReferrals/${invalidInvite!.participantId}`), null)
  if (f.store instanceof MemoryStore) assert.equal([...f.store.docs.keys()].filter(path => path.startsWith('championshipReferrals/')).length, 1)
})

test('referral code collisions are checked before assignment', async () => {
  const f = await fixture({ referralGenerator: (() => { let i = 0; return () => i++ < 2 ? 'FLUX-COLLIDE1' : `FLUX-UNIQUE${i}` })() })
  await f.service.signup(f.input('first')); await f.service.signup(f.input('second'))
  assert.equal(f.sent.length, 2)
})

test('invalid, expired and replaced tokens fail; resend cooldown and hourly limits cannot be bypassed by signup', async () => {
  const f = await fixture()
  const input = f.input('resend')
  const result = await f.service.signup(input)
  await assert.rejects(f.service.inspectInvite('not-a-token'), isError('invalid_invite'))
  assert.equal((await f.service.resend(result.sessionToken)).delivery, 'cooldown')
  const first = rawToken(f.sent[0].url)
  f.advance(61_000)
  assert.equal((await f.service.resend(result.sessionToken)).delivery, 'sent')
  await assert.rejects(f.service.inspectInvite(first), isError('invalid_invite'))
  const second = rawToken(f.sent[1].url)
  await f.service.inspectInvite(second)
  for (let i = 0; i < 3; i++) { f.advance(61_000); await f.service.resend(result.sessionToken) }
  f.advance(61_000)
  assert.equal((await f.service.signup(input)).receipt.delivery, 'cooldown')
  assert.equal(f.sent.length, 5)
  f.advance(8 * 86_400_000)
  await assert.rejects(f.service.inspectInvite(rawToken(f.sent[4].url)), isError('expired_invite'))
})

test('email failure retains the previous valid token; missing provider never claims sent; preview is development only', async () => {
  const f = await fixture()
  const result = await f.service.signup(f.input('failure'))
  const first = rawToken(f.sent[0].url)
  f.advance(61_000)
  f.options.failSend = true // Independently create a service using the same store and a failing provider.
  const failed = championshipService({ store: f.store, mailer: { configured: true, send: async () => { throw new Error('failure') } }, siteUrl: 'https://flux.example', development: false, now: () => Date.now() + 61_000 })
  assert.equal((await failed.resend(result.sessionToken)).delivery, 'failed')
  await f.service.inspectInvite(first)
  for (const development of [false, true]) {
    const missing = await fixture({ mailConfigured: false, development })
    const response = await missing.service.signup(missing.input('missing'))
    assert.equal(response.receipt.delivery, 'unavailable')
    assert.equal('previewUrl' in response.receipt, development)
    if (development && 'previewUrl' in response.receipt) await missing.service.inspectInvite(rawToken(response.receipt.previewUrl!))
  }
})

test('shared request throttle rejects a burst; branded email escapes the link', async () => {
  const f = await fixture()
  const key = crypto.randomUUID()
  for (let i = 0; i < 20; i++) await f.service.throttle(key)
  await assert.rejects(f.service.throttle(key), isError('rate_limited'))
  f.advance(60_001); await f.service.throttle(key)
  const mail = inviteEmail('https://flux.example/join?token=abc&test="')
  assert(mail.html.includes('&amp;test=&quot;')); assert(mail.text.includes('expires in 7 days'))
})

test('concurrent token consumption permits exactly one joined session', async () => {
  const f = await fixture()
  await f.service.signup(f.input('race'))
  const outcomes = await Promise.allSettled([f.service.join(rawToken(f.sent[0].url)), f.service.join(rawToken(f.sent[0].url))])
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1)
  assert.equal(outcomes.filter(outcome => outcome.status === 'rejected').length, 1)
})

test('Mina membership is additive, unique per test, and a pending session cannot enroll or expose referrals', async () => {
  const f = await fixture()
  const input = f.input('mina')
  const signup = await f.service.signup(input)
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string; experimentId: string }>(`championshipInvites/${hashToken(token)}`)
  assert.equal(invite?.experimentId, activeMinaTest.id)
  const membership = await f.store.get<MinaMembership>(minaMembershipPath(invite!.participantId))
  assert.equal(membership?.status, 'signed_up'); assert.equal(membership?.excludedFromPublicCounts, true)
  await assert.rejects(f.service.enrollVerified(signup.sessionToken, input.acquisition), isError('session_expired'))
  const joined = await f.service.join(token)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
  assert.equal((await f.store.get<MinaMembership>(minaMembershipPath(invite!.participantId)))?.status, 'joined')
  await f.service.signup(input)
  if (f.store instanceof MemoryStore) assert.equal([...f.store.docs.keys()].filter(path => path.startsWith('minaTestParticipants/')).length, 1)
})

test('legacy verified invite stays valid; explicit Mina consent enrolls without another email and preserves historical fields', async () => {
  const f = await fixture()
  const input = f.input('legacy')
  await f.service.signup(input)
  const token = rawToken(f.sent[0].url)
  const path = `championshipInvites/${hashToken(token)}`
  const current = await f.store.get<Record<string, unknown>>(path)
  const { experimentId, ...legacyInvite } = current!
  assert(experimentId)
  await f.store.transaction(async tx => { tx.set(path, legacyInvite) })
  const joined = await f.service.join(token)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, false)
  const before = await f.store.get<Participant>(`championshipParticipants/${current!.participantId}`)
  await f.service.enrollVerified(joined.sessionToken, input.acquisition)
  const after = await f.store.get<Participant>(`championshipParticipants/${current!.participantId}`)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
  assert.equal(before?.championshipId, '2026-10'); assert.equal(after?.championshipId, before?.championshipId)
  assert.equal(after?.createdAt instanceof Object, before?.createdAt instanceof Object)
  assert.equal(after?.referralCode, before?.referralCode); assert.deepEqual(after?.acquisition, before?.acquisition)
  assert.equal(f.sent.length, 1)
})

test('new real-domain referral qualifies only after confirmed Mina enrollment; duplicates and clicks award nothing', async () => {
  const f = await fixture()
  await f.service.signup(f.input('owner'))
  const owner = await f.service.join(rawToken(f.sent[0].url))
  const code = (await f.service.joinedParticipant(owner.sessionToken))!.referralCode
  const input = validateSignup({ email: `mina-${crypto.randomUUID()}@university.edu`, device: 'android', consent: true, referralCode: code })
  await f.service.signup(input)
  const token = rawToken(f.sent[1].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  const path = `championshipReferrals/${invite!.participantId}`
  assert.equal((await f.store.get<{ status: string }>(path))?.status, 'signed_up')
  await f.service.inspectInvite(token)
  assert.equal((await f.store.get<{ status: string }>(path))?.status, 'signed_up')
  await f.service.join(token)
  assert.equal((await f.store.get<{ status: string }>(path))?.status, 'qualified')
  await f.service.signup(input)
  assert.equal((await f.store.get<{ status: string }>(path))?.status, 'qualified')
})

test('public count cache coalesces concurrent reads, caches for five minutes and uses a nonnumeric error fallback', async () => {
  let reads = 0; let instant = 1000
  const count = aggregateCache(async () => { reads++; return { available: true, experimentId: activeMinaTest.id, signups: 7, confirmedEnrollments: 3, completedParticipants: null, cachedForSeconds: 300 } }, () => instant)
  const replies = await Promise.all([count(), count(), count()])
  assert.equal(reads, 1); assert.equal(replies[0].signups, 7); assert.equal(replies[0].completedParticipants, null)
  await count(); assert.equal(reads, 1); instant += 300_001; await count(); assert.equal(reads, 2)
  const failed = aggregateCache(async () => { throw new Error('unconfigured') })
  const response = await failed(); assert.equal(response.available, false); assert.equal('signups' in response, false)
  assert.equal(isExcludedEmail('known@example.org'), true); assert.equal(isExcludedEmail('someone@test.invalid'), true); assert.equal(isExcludedEmail('someone@university.edu'), false)
})

// Stage 6A: configuration and membership transactions share the same store.
test('database-backed experiments preserve canonical IDs, consent snapshots, attribution and per-experiment membership', async () => {
  const f = await fixture()
  const id = 'brown-noise-001'
  await f.store.transaction(async tx => { tx.set(`minaExperiments/${id}`, { ...fixtureExperiment(id), revision: 3 }); tx.set('minaExecutionCapabilities/flutter', fixtureCapabilities) })
  const result = await f.service.signup(f.input('configured', { experimentId: id, acquisition: { utmSource: 'test-source' } }))
  const invite = await f.store.get<{ participantId: string; experimentId: string }>(`championshipInvites/${hashToken(rawToken(f.sent[0].url))}`)
  assert.equal(invite?.experimentId, id)
  const member = await f.store.get<MinaMembership>(minaMembershipPath(invite!.participantId, id))
  assert.equal(member?.protocolVersion, 'fixture-v1'); assert.equal(member?.configRevision, 3); assert.equal(member?.consentReference, 'consent-v1')
  assert.equal(member?.acquisition.utmSource, 'test-source')
  assert.equal(await f.store.get(minaMembershipPath(invite!.participantId)), null, 'No competing legacy membership is created')
  assert.equal(await f.service.joinedParticipant(result.sessionToken), null)
  const joined = await f.service.join(rawToken(f.sent[0].url))
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentId, id)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
  assert.equal((await f.store.get<{ enrollmentStarted: boolean }>(`minaExperiments/${id}`))?.enrollmentStarted, false)
})

test('pausing blocks signup and verified enrollment while old email links still verify without enrolling', async () => {
  const f = await fixture(), id = 'brown-noise-paused'
  await f.store.transaction(async tx => { tx.set(`minaExperiments/${id}`, fixtureExperiment(id)); tx.set('minaExecutionCapabilities/flutter', fixtureCapabilities) })
  await f.service.signup(f.input('pause-race', { experimentId: id }))
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  await f.store.transaction(async tx => tx.update(`minaExperiments/${id}`, { status: 'paused' }))
  await assert.rejects(f.service.signup(f.input('new-paused', { experimentId: id })), isError('experiment_paused'))
  await assert.rejects(f.service.signup(f.input('unknown', { experimentId: 'unknown-experiment' })), isError('experiment_unavailable'))
  const joined = await f.service.join(token)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, false)
  assert.equal((await f.store.get<MinaMembership>(minaMembershipPath(invite!.participantId, id)))?.status, 'signed_up')
  await assert.rejects(f.service.enrollVerified(joined.sessionToken, f.input('a').acquisition, id), isError('experiment_paused'))
  await f.store.transaction(async tx => tx.update(`minaExperiments/${id}`, { status: 'published' }))
  await f.service.enrollVerified(joined.sessionToken, f.input('a').acquisition, id)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
  await f.store.transaction(async tx => tx.update(`minaExperiments/${id}`, { status: 'archived' }))
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true, 'Archiving preserves participant access')
})

test('unverified capabilities block enrollment and confirmation cannot assign a different protocol snapshot', async () => {
  const f = await fixture(), id = 'runtime-gated'
  const config = fixtureExperiment(id)
  await f.store.transaction(async tx => { tx.set(`minaExperiments/${id}`, config); tx.set('minaExecutionCapabilities/flutter', { ...fixtureCapabilities, verified: false }) })
  await assert.rejects(f.service.signup(f.input('blocked-runtime', { experimentId: id })), isError('flutter_capabilities_unverified_or_unsupported'))
  await f.store.transaction(async tx => tx.set('minaExecutionCapabilities/flutter', fixtureCapabilities))
  await f.service.signup(f.input('verified-runtime', { experimentId: id }))
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  const memberPath = minaMembershipPath(invite!.participantId, id)
  const before = await f.store.get<MinaMembership>(memberPath)
  assert.equal(before?.protocolHash, config.protocolHash)
  assert.equal(before?.protocolSnapshot?.protocol.activities[0].durationSeconds, 60)
  await f.store.transaction(async tx => tx.set('minaExecutionCapabilities/flutter', { ...fixtureCapabilities, verified: false }))
  const joined = await f.service.join(token)
  assert.equal((await f.store.get<MinaMembership>(memberPath))?.status, 'signed_up')
  await assert.rejects(f.service.enrollVerified(joined.sessionToken, f.input('a').acquisition, id), isError('flutter_capabilities_unverified_or_unsupported'))
  await f.store.transaction(async tx => tx.set('minaExecutionCapabilities/flutter', fixtureCapabilities))
  await f.service.enrollVerified(joined.sessionToken, f.input('a').acquisition, id)
  const after = await f.store.get<MinaMembership>(memberPath)
  assert.equal(after?.status, 'joined')
  assert.deepEqual(after?.protocolSnapshot, before?.protocolSnapshot)
  assert.equal(after?.protocolHash, before?.protocolHash)
})

test('enrollment reads the server-only canonical configuration and never writes private metadata to the public root', async () => {
  const f = await fixture(), id = 'private-config-fixture'
  const config = fixtureExperiment(id)
  await f.store.transaction(async tx => {
    tx.set(`minaExperiments/${id}`, { id, status: 'published', visibility: 'public', environment: 'production', publicationApproved: true, enrollmentEnabled: true, schemaVersion: 2, protocolHash: config.protocolHash })
    tx.set(`minaExperiments/${id}/private/admin`, config)
    tx.set('minaExecutionCapabilities/flutter', fixtureCapabilities)
  })
  await f.service.signup(f.input('private-config', { experimentId: id }))
  const token = rawToken(f.sent[0].url)
  const joined = await f.service.join(token)
  assert.equal((await f.service.joinedParticipant(joined.sessionToken))?.experimentJoined, true)
  const root = await f.store.get<Record<string, unknown>>(`minaExperiments/${id}`)
  assert.equal(root?.enrollmentStarted, undefined)
  assert.equal(root?.protocolReview, undefined)
  assert.equal((await f.store.get<Experiment>(`minaExperiments/${id}/private/admin`))?.enrollmentStarted, false)
})


test('tester signup verifies Android and iPhone without requiring a published experiment or enrolling', async () => {
  for (const device of ['android', 'iphone'] as const) {
    const f = await fixture()
    const input = validateSignup({ ...f.input(`tester-${device}`), purpose: 'tester', device })
    const signup = await f.service.signup(input)
    assert.equal(signup.receipt.delivery, 'sent')
    assert.equal(signup.receipt.purpose, 'tester')
    assert.equal(await f.service.testerProfile(signup.sessionToken), null)
    const token = rawToken(f.sent[0].url)
    const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
    assert(invite)
    assert.equal(await f.store.get(minaMembershipPath(invite.participantId)), null)
    assert.equal(await f.store.get(`fluxAndroidTesters/${invite.participantId}`), null)
    assert.equal((await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`))?.emailVerified, false)
    await f.service.inspectInvite(token)
    assert.equal((await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`))?.emailVerified, false)
    const joined = await f.service.join(token)
    assert.equal(joined.purpose, 'tester')
    const profile = await f.service.testerProfile(joined.sessionToken)
    assert.equal(profile?.emailVerified, true)
    assert.equal(profile?.device, device)
    assert.equal(profile?.status, device === 'android' ? 'pending' : 'waiting')
    const participant = await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`)
    assert(participant?.emailVerifiedAt)
    assert(participant?.testingConsentAt)
    assert.deepEqual(participant?.experimentIds, [])
    assert.equal(await f.store.get(minaMembershipPath(invite.participantId)), null)
    await assert.rejects(f.service.join(token), isError('used_invite'))
    if (device === 'android') {
      await assert.rejects(f.service.savePlayEmail(signup.sessionToken, 'google@example.org'), isError('session_expired'))
      await f.service.savePlayEmail(joined.sessionToken, 'other-google@example.org')
      assert.equal((await f.service.testerProfile(joined.sessionToken))?.playEmail, 'other-google@example.org')
      await assert.rejects(f.service.savePlayEmail(joined.sessionToken, '=formula@example.org'), isError('invalid_play_email'))
    } else {
      await assert.rejects(f.service.savePlayEmail(joined.sessionToken, 'google@example.org'), isError('session_expired'))
    }
  }
})

test('tester duplicates preserve identity and first-touch attribution, and iPhone supports resend', async () => {
  const f = await fixture()
  const input = validateSignup({ ...f.input('tester-duplicate'), purpose: 'tester', device: 'iphone', acquisition: { utmSource: 'original' } })
  await Promise.all([f.service.signup(input), f.service.signup(input)])
  assert.equal(f.sent.length, 1)
  const token = rawToken(f.sent[0].url)
  const invite = await f.store.get<{ participantId: string }>(`championshipInvites/${hashToken(token)}`)
  assert(invite)
  const joined = await f.service.join(token)
  const duplicate = await f.service.signup({ ...input, device: 'android', acquisition: { ...input.acquisition, utmSource: 'forged' } })
  const participant = await f.store.get<Participant>(`championshipParticipants/${invite.participantId}`)
  assert.equal(participant?.acquisition.utmSource, 'original')
  assert.equal(participant?.device, 'iphone')
  assert.equal((await f.service.testerProfile(joined.sessionToken))?.device, 'iphone')
  assert.equal(await f.service.testerProfile(duplicate.sessionToken), null)
  assert.equal((await f.service.resend(duplicate.sessionToken)).delivery, 'cooldown')
})

test('tester confirmation redirects to platform-aware testing page; forged purpose rejected', async () => {
  const f = await fixture()
  await f.service.signup(validateSignup({ ...f.input('tester-redirect'), purpose: 'tester' }))
  const response = await confirmInvitation(new Request('https://flux.example/api/championship/join', { method: 'POST', headers: { Origin: 'https://flux.example', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: rawToken(f.sent[0].url) }) }), () => f.service)
  assert.equal(new URL(response.headers.get('location')!).pathname, '/testing')
  assert.throws(() => validateSignup({ ...f.input('bad-purpose'), purpose: 'admin' }), isError('invalid_input'))
  assert.throws(() => validateSignup({ ...f.input('bad-mixed'), purpose: 'tester', experimentId: activeMinaTest.id }), isError('invalid_input'))
})


test('Play CSV is deduplicated and excludes unverified, inactive, nonconsenting, test and unsafe rows', async () => {
  const { playCsv, validateTesterStatus } = await import('../lib/server/tester-admin')
  const row = { active: true, emailVerified: true, consent: true, playEmail: 'GOOGLE@example.org' }
  assert.equal(playCsv([row, row, { ...row, playEmail: '=SUM@example.org' }, { ...row, isTestRecord: true }, { ...row, consent: false }, { ...row, active: false }, { ...row, emailVerified: false }]), 'google@example.org\r\n')
  assert.throws(() => validateTesterStatus({ id: 'abc', status: 'added', expectedStatus: 'pending' }), FunnelError)
  assert.throws(() => validateTesterStatus({ id: '../escape', status: 'pending', expectedStatus: 'pending' }), FunnelError)
  assert.equal(validateTesterStatus({ id: 'abc', status: 'added', expectedStatus: 'invited', confirmedAdded: true }).status, 'added')
})

test('tester endpoints enforce administrator authorization and reject cross-origin changes before writes', async () => {
  const admin = await import('../app/api/admin/testers/route')
  const exportRoute = await import('../app/api/admin/testers/export/route')
  // Outside a Next request, cookies() fails closed rather than opening access.
  assert.notEqual((await admin.GET(new Request('https://flux.example/api/admin/testers'))).status, 200)
  assert.notEqual((await exportRoute.GET(new Request('https://flux.example/api/admin/testers/export'))).status, 200)
  assert.equal((await admin.PATCH(new Request('https://flux.example/api/admin/testers', { method: 'PATCH', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' }))).status, 403)
  const profile = await import('../app/api/testing/profile/route')
  assert.equal((await profile.POST(new Request('https://flux.example/api/testing/profile', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' }))).status, 403)
})
