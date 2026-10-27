import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'
import { mediaSource, validateExperiment, publicExperiment, isPublicExperiment, type Experiment } from '../lib/mina-experiments'
import { verifyAdminSession } from '../lib/server/mina-admin'
import { saveExperiment } from '../lib/server/mina-experiments'
import { emptyProtocol, brownNoiseExample, validateProtocol, protocolIssues, capabilityIssues } from '../lib/mina-protocol'
import { assertProtocolReviewable, protocolHash } from '../lib/server/mina-protocol'
import { fixtureExperiment, fixtureCapabilities } from './mina-fixtures'
import { FunnelError } from '../lib/championship-validation'
const draft: Experiment = { ...fixtureExperiment(), status: 'draft', revision: 0, protocolHash: '', protocolReview: null }
const code = (name: string) => (error: unknown) => error instanceof FunnelError && error.code === name
test('admin verification rejects missing sessions, forgery, absent claims, revoked access and disabled users', async () => {
  const fake = (claim: boolean, current: boolean, disabled = false) => () => ({ verifySessionCookie: async (_token: string, revoked: boolean) => { assert.equal(revoked, true); return { uid: 'admin-uid', admin: claim } }, getUser: async () => ({ customClaims: { admin: current }, disabled }) }) as unknown as Auth
  await assert.rejects(verifyAdminSession(undefined, fake(true, true)), code('admin_login_required'))
  await assert.rejects(verifyAdminSession('forged', () => ({ verifySessionCookie: async () => { throw new Error('invalid signature') } }) as unknown as Auth), code('admin_login_required'))
  for (const values of [[false, false, false], [false, true, false], [true, false, false], [true, true, true]]) await assert.rejects(verifyAdminSession('token', fake(...values as [boolean, boolean, boolean])), code('admin_access_required'))
  assert.equal(await verifyAdminSession('token', fake(true, true)), 'admin-uid')
})
test('server validation blocks unsupported publishing, validates media, and omits private results', () => {
  assert.equal(validateExperiment(draft).id, draft.id)
  assert.throws(() => validateExperiment({ ...draft, protocol: emptyProtocol(), status: 'published' }), code('incomplete_protocol'))
  assert.throws(() => validateExperiment({ ...draft, resultsPublished: true }), code('results_summary_required'))
  assert.throws(() => validateExperiment({ ...draft, introVideoUrl: 'https://www.instagram.com/reel/123' }), code('invalid_video_url'))
  assert.equal(mediaSource('javascript:alert(1)'), null)
  assert.equal(mediaSource('https://localhost/a.mp4'), null)
  assert.equal(mediaSource('https://user:pass@example.org/a.mp4'), null)
  assert.equal(mediaSource('https://youtu.be/dQw4w9WgXcQ')?.url, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  assert.equal(mediaSource('https://vimeo.com/12345')?.kind, 'embed')
  assert.equal(mediaSource('https://cdn.example.org/intro.mp4?signature=abc')?.kind, 'file')
  const hidden = publicExperiment({ ...draft, resultsSummary: 'Private draft result', resultsVideoUrl: 'https://cdn.example.org/results.mp4' })
  assert.equal(hidden.results, null); assert(!JSON.stringify(hidden).includes('Private draft result')); assert(!JSON.stringify(hidden).includes('results.mp4'))
  assert.equal(publicExperiment({ ...draft, resultsSummary: 'Aggregate only', resultsPublished: true }).results?.summary, 'Aggregate only')
})

// Atomic Firestore test double checks read-before-write ordering and create-only versions.
function database(capabilities: unknown = fixtureCapabilities) {
  let docs = new Map<string, object>(), members = false
  if (capabilities) docs.set('minaExecutionCapabilities/flutter', capabilities as object)
  const reference = (path: string) => ({ path, collection: (name: string) => collection(`${path}/${name}`) })
  const collection = (path: string) => ({ path, doc: (id: string) => reference(`${path}/${id}`), where: () => ({ limit: () => ({ path, query: true }) }) })
  const db = { collection, doc: reference, runTransaction: async (run: (tx: object) => Promise<unknown>) => {
    const staged = new Map(docs); let written = false
    const result = await run({
      get: async (target: { path: string; query?: boolean }) => { assert.equal(written, false, 'All reads precede writes'); return target.query ? { empty: !members } : { exists: staged.has(target.path), data: () => staged.get(target.path) } },
      set: (ref: { path: string }, value: object) => { written = true; staged.set(ref.path, structuredClone(value)) },
      create: (ref: { path: string }, value: object) => { written = true; assert(!staged.has(ref.path), 'No version or audit overwrite'); staged.set(ref.path, structuredClone(value)) },
    })
    docs = staged; return result
  } }
  return { db: () => db as unknown as Firestore, read: (path: string) => docs.get(path) as Record<string, unknown> | undefined, audits: () => [...docs.keys()].filter(key => key.includes('/revisions/')), versions: () => [...docs.entries()].filter(([key]) => key.includes('/versions/')), setMembers: () => { members = true } }
}
test('drafts support arbitrary experiments without a runtime manifest or fixed protocol registry', async () => {
  const f = database(null)
  const e = await saveExperiment({ ...draft, id: 'future-cognition-study', protocolType: 'future-study', protocol: emptyProtocol(), durationNights: 0 }, 'admin-uid', 0, f.db)
  assert.equal(e.status, 'draft'); assert.equal(e.protocol.schemaVersion, 1); assert.equal(e.protocolReview, null)
  assert.equal(f.audits().length, 1)
  assert(protocolIssues(brownNoiseExample(), 0).length > 0, 'Illustrative brown-noise data is not a verified protocol')
  const paused = await saveExperiment({ ...e, status: 'paused', firstPublishedAt: 'forged' }, 'admin-uid', 1, f.db)
  assert.equal(isPublicExperiment(paused), false, 'Pausing an unverified draft cannot expose it publicly')
})
test('draft creation, optimistic conflicts and all enrolled scientific fields are immutable', async () => {
  const f = database()
  const first = await saveExperiment(draft, 'admin-uid', 0, f.db)
  assert.equal(first.revision, 1)
  await assert.rejects(saveExperiment({ ...first, title: 'Stale' }, 'admin-uid', 0, f.db), code('edit_conflict_reload'))
  f.setMembers()
  for (const patch of [{ protocolVersion: 'changed' }, { consentReference: 'changed' }, { eligibility: 'changed' }, { instructions: 'changed' }, { durationNights: 2 }, { protocol: { ...first.protocol, activities: [{ ...first.protocol.activities[0], durationSeconds: 120 }] } }]) {
    await assert.rejects(saveExperiment({ ...first, ...patch }, 'admin-uid', 1, f.db), code('protocol_and_consent_locked'))
  }
  const archived = await saveExperiment({ ...first, title: 'Editable copy', status: 'archived' }, 'admin-uid', 1, f.db)
  assert.equal(archived.enrollmentStarted, true); assert.equal(archived.revision, 2); assert.equal(f.audits().length, 2)
})
test('schedule and session capabilities must be explicitly verified', () => {
  const p = fixtureExperiment().protocol
  assert(capabilityIssues(p, { ...fixtureCapabilities, scheduleSemantics: [] }).some(issue => /schedule boundaries/.test(issue)))
  assert(capabilityIssues(p, { ...fixtureCapabilities, sessionModes: [] }).some(issue => /session mode/.test(issue)))
})

test('publication requires a server-recorded exact protocol review and verified compatible runtime capabilities', async () => {
  const f = database()
  const first = await saveExperiment({ ...draft, protocolReview: { hash: protocolHash(draft), reviewedBy: 'forged' } }, 'admin-uid', 0, f.db)
  assert.equal(first.protocolReview, null, 'Caller cannot forge a review field')
  await assert.rejects(saveExperiment({ ...first, status: 'published' }, 'admin-uid', 1, f.db), code('protocol_review_required'))
  const reviewed = await saveExperiment(first, 'admin-uid', 1, f.db, true)
  assert.equal(reviewed.protocolReview?.reviewedBy, 'admin-uid')
  const published = await saveExperiment({ ...reviewed, status: 'published' }, 'admin-uid', 2, f.db)
  assert.equal(published.status, 'published'); assert.equal(f.versions().length, 1)
  assert.equal(isPublicExperiment({ ...published, status: 'paused' }), true)
  const changed = await saveExperiment({ ...published, status: 'draft', durationNights: 2 }, 'admin-uid', 3, f.db)
  assert.equal(changed.protocolReview, null, 'Scientific changes invalidate prior review')
  for (const capabilities of [null, { ...fixtureCapabilities, verified: false }, { ...fixtureCapabilities, activityVersions: {} }]) {
    const blocked = database(capabilities)
    const reviewedDraft = await saveExperiment(draft, 'admin-uid', 0, blocked.db, true)
    await assert.rejects(saveExperiment({ ...reviewedDraft, status: 'published' }, 'admin-uid', 1, blocked.db), code('flutter_capabilities_unverified_or_unsupported'))
  }
})
test('published Firestore roots contain only the public projection; draft results and review identities remain server-only', async () => {
  const f = database()
  const reviewed = await saveExperiment({ ...draft, resultsSummary: 'Confidential aggregate draft', resultsVideoUrl: 'https://videos.example.org/unreleased.mp4' }, 'private-admin-uid', 0, f.db, true)
  const published = await saveExperiment({ ...reviewed, status: 'published' }, 'private-admin-uid', 1, f.db)
  const root = f.read(`minaExperiments/${draft.id}`)!
  assert.equal(root.results, null)
  for (const secret of ['Confidential aggregate draft', 'unreleased.mp4', 'private-admin-uid', 'reviewedAt']) assert(!JSON.stringify(root).includes(secret))
  const privateConfig = f.read(`minaExperiments/${draft.id}/private/admin`)!
  assert.equal(privateConfig.resultsSummary, 'Confidential aggregate draft')
  assert.equal((privateConfig.protocolReview as { reviewedBy: string }).reviewedBy, 'private-admin-uid')
  assert(!JSON.stringify(f.versions()).includes('private-admin-uid'), 'Client-readable version snapshots omit admin identities')
  assert.equal(publicExperiment(root as unknown as Experiment).results, null)
  const withResults = await saveExperiment({ ...published, resultsPublished: true }, 'private-admin-uid', 2, f.db)
  const projectedResults = publicExperiment(f.read(`minaExperiments/${draft.id}`) as unknown as Experiment).results
  assert.equal(projectedResults?.summary, 'Confidential aggregate draft')
  await saveExperiment({ ...withResults, resultsPublished: false }, 'private-admin-uid', 3, f.db)
  assert.equal(f.read(`minaExperiments/${draft.id}`)?.results, null, 'Unpublishing removes results from direct client reads too')
})
test('published protocol versions cannot be overwritten, while a new version preserves old snapshots', async () => {
  const f = database()
  const first = await saveExperiment(draft, 'admin-uid', 0, f.db, true)
  const published = await saveExperiment({ ...first, status: 'published' }, 'admin-uid', 1, f.db)
  const changedProtocol = { ...published.protocol, activities: [{ ...published.protocol.activities[0], durationSeconds: 120 }] }
  const changed = await saveExperiment({ ...published, status: 'draft', protocol: changedProtocol }, 'admin-uid', 2, f.db, true)
  await assert.rejects(saveExperiment({ ...changed, status: 'published' }, 'admin-uid', 3, f.db), code('protocol_version_already_used'))
  const newVersion = await saveExperiment({ ...changed, protocolVersion: 'fixture-v2' }, 'admin-uid', 3, f.db, true)
  await saveExperiment({ ...newVersion, status: 'published' }, 'admin-uid', 4, f.db)
  assert.equal(f.versions().length, 2)
  const original = f.versions()[0][1] as { definition: { protocol: Experiment['protocol'] } }
  assert.equal(original.definition.protocol.activities[0].durationSeconds, 60)
})
test('declarative schema validates references, duplicate IDs, schedule coverage, question bounds and capabilities', () => {
  const p = draft.protocol
  assert.deepEqual(validateProtocol(p), p)
  assert.throws(() => validateProtocol({ ...p, schemaVersion: 99 }), code('unsupported_protocol_schema'))
  assert.throws(() => validateProtocol({ ...p, activities: [...p.activities, p.activities[0]] }), code('duplicate_protocol_identifier'))
  assert.throws(() => validateProtocol({ ...p, nightlySchedule: [{ ...p.nightlySchedule[0], activityIds: ['missing'] }] }), code('unknown_activity_reference'))
  assert.throws(() => validateProtocol({ ...p, activities: [{ ...p.activities[0], questionIds: ['missing'] }] }), code('unknown_question_reference'))
  assert.throws(() => validateProtocol({ ...p, nightlySchedule: [...p.nightlySchedule, p.nightlySchedule[0]] }), code('duplicate_night_phase'))
  assert.throws(() => validateProtocol({ ...p, nightlySchedule: [{ ...p.nightlySchedule[0], conditionId: 'assigned' }] }), code('assigned_condition_requires_randomization'))
  assert(protocolIssues(p, 2).includes('Night 2 has no schedule.'))
  assert(protocolIssues({ ...p, questions: [{ id: 'scale', prompt: 'Sleep?', type: 'scale', min: 10, max: 0, required: true, options: [] }] }, 1).some(issue => issue.includes('increasing scale')))
  assert(capabilityIssues({ ...p, activities: [{ ...p.activities[0], type: 'unimplemented.activity' }] }, fixtureCapabilities).length > 0)
  assert(capabilityIssues({ ...p, activities: [{ ...p.activities[0], type: 'cognitive.task', taskId: 'unknown-task' }] }, fixtureCapabilities).length > 0)
  assert.equal(protocolHash({ ...draft, protocol: { ...p, randomization: { unit: 'participant', allocationOwner: 'server', method: 'none' } } }), protocolHash(draft), 'Hash does not depend on object property order')
  const serialized = publicExperiment(fixtureExperiment())
  assert.equal(serialized.schemaVersion, 2); assert.equal(serialized.protocol?.schemaVersion, 1)
  assert(!JSON.stringify(serialized).includes('test-admin'), 'Admin review identity stays private')
})
test('a generic multi-night cognitive and survey study publishes through verified reusable capabilities without a study registry', async () => {
  const p = validateProtocol({
    schemaVersion: 1, enrollment: fixtureExperiment().protocol.enrollment,
    conditions: [{ id: 'short', label: 'Short activity', activityIds: ['short-task'], weight: 1 }, { id: 'long', label: 'Long activity', activityIds: ['long-task'], weight: 2 }],
    activities: [
      { id: 'short-task', type: 'cognitive.task', version: 1, durationSeconds: 30, taskId: 'fixture-task', audioUrl: '', questionIds: [] },
      { id: 'long-task', type: 'cognitive.task', version: 1, durationSeconds: 60, taskId: 'fixture-task', audioUrl: '', questionIds: [] },
      { id: 'morning', type: 'check_in', version: 1, durationSeconds: 0, taskId: '', audioUrl: '', questionIds: ['rating', 'choice'] },
    ],
    questions: [{ id: 'rating', prompt: 'Example rating?', type: 'scale', min: 0, max: 10, options: [], required: true }, { id: 'choice', prompt: 'Example choice?', type: 'single_choice', min: 0, max: 0, options: ['First', 'Second'], required: false }],
    nightlySchedule: [1, 2].flatMap(night => [{ night, phase: 'evening', conditionId: 'assigned', activityIds: [] }, { night, phase: 'morning', conditionId: 'none', activityIds: ['morning'] }]),
    randomization: { method: 'weighted', unit: 'night', allocationOwner: 'server' },
  })
  assert.deepEqual(protocolIssues(p, 2), []); assert.deepEqual(capabilityIssues(p, fixtureCapabilities), [])
  const f = database()
  const reviewed = await saveExperiment({ ...draft, id: 'generic-cognitive-fixture', protocolType: 'cognitive-survey', durationNights: 2, protocol: p }, 'admin-uid', 0, f.db, true)
  const published = await saveExperiment({ ...reviewed, status: 'published' }, 'admin-uid', 1, f.db)
  assert.equal(published.id, 'generic-cognitive-fixture'); assert.equal(published.protocol.randomization.unit, 'night')
})

// The guided template is declarative: these tests never generate participant assignments.
import { brownNoiseTemplate, conditionNightCounts, resizeBrownNoisePlan, duplicateExperiment, removeBuilderActivity, publicationBlockers, bundledSoundOptions, bundledMinaSounds, participantControlledSleep } from '../lib/mina-builder'
test('guided brown-noise template preserves baseline and balanced pairs without inventing verified content', () => {
  const e = brownNoiseTemplate(), p = validateProtocol(e.protocol)
  assert.equal(e.durationNights, 7)
  assert.deepEqual(p.randomization, { method: 'paired_crossover', unit: 'night', allocationOwner: 'server', pairs: [
    { nights: [2, 3], conditionIds: ['brown-noise', 'silence'] }, { nights: [4, 5], conditionIds: ['brown-noise', 'silence'] }, { nights: [6, 7], conditionIds: ['brown-noise', 'silence'] },
  ] })
  assert.deepEqual(conditionNightCounts(p), { 'brown-noise': 3, silence: 4 })
  assert.equal(p.nightlySchedule.find(s => s.night === 1 && s.phase === 'evening')?.conditionId, 'silence')
  assert.equal(p.nightlySchedule.filter(s => s.phase === 'morning' && s.activityIds.includes('morning-check-in')).length, 7)
  assert(!p.activities.some(a => a.type === 'cognitive.task'))
  assert(p.questions.every(q => q.prompt.length > 0 && q.type === 'scale' && q.step === 1 && (q.labels === undefined || q.labels.length === 5)))
  assert.equal(p.activities[0].soundId, 'brown_noise')
  assert.equal(p.enrollment?.mode, 'personal')
  assert(p.enrollment?.consentText.includes('private app data'))
  assert.deepEqual(p.questions.map(q => q.id), ['sleep-quality', 'sleep-latency', 'awakenings', 'restedness', 'sleep-duration'])
  assert.equal(p.activities.find(a => a.type === 'audio.playback')?.audioUrl, '')
  assert(p.activities.filter(a => ['audio.playback', 'audio.silence'].includes(a.type)).every(a => a.sessionMode === 'overnight' && a.durationSeconds === 0))
  assert.deepEqual(p.conditions.map(c => c.activityIds), [['brown-noise-audio'], ['silence-control']])
  assert(publicationBlockers(e, null, false).length > 0)
  assert(capabilityIssues(p, fixtureCapabilities).some(issue => /randomization/i.test(issue)))
})
test('paired plans resize only into whole pairs and reject overlapping or contradictory assignments', () => {
  const e = brownNoiseTemplate()
  assert.deepEqual(conditionNightCounts(resizeBrownNoisePlan(e, 9).protocol), { 'brown-noise': 4, silence: 5 })
  assert.throws(() => resizeBrownNoisePlan(e, 8))
  const bad = structuredClone(e.protocol)
  bad.randomization.pairs![1].nights[0] = 2
  assert.throws(() => validateProtocol(bad))
  const fixed = structuredClone(e.protocol)
  fixed.nightlySchedule.find(s => s.night === 2 && s.phase === 'evening')!.conditionId = 'silence'
  assert.throws(() => validateProtocol(fixed))
  assert(protocolIssues(e.protocol, 5).length > 0)
  const old = fixtureExperiment().protocol
  assert.deepEqual(validateProtocol(old), old, 'Existing non-paired configurations remain unchanged')
})
test('guided template drafts round-trip and enrolled pairs stay immutable', async () => {
  const f = database(null), e = { ...brownNoiseTemplate(), id: 'guided-brown-noise' }
  const first = await saveExperiment(e, 'admin-uid', 0, f.db)
  assert.deepEqual(first.protocol, e.protocol)
  const edited = await saveExperiment({ ...first, description: 'Edited draft' }, 'admin-uid', 1, f.db)
  assert.deepEqual(edited.protocol, e.protocol)
  f.setMembers()
  await assert.rejects(saveExperiment({ ...resizeBrownNoisePlan(edited, 9) }, 'admin-uid', 2, f.db), code('protocol_and_consent_locked'))
  const duplicate = duplicateExperiment(edited)
  assert.equal(duplicate.status, 'draft'); assert.equal(duplicate.revision, 0); assert.equal(duplicate.id, '')
  assert.equal(duplicate.enrollmentStarted, false); assert.equal(duplicate.protocolReview, null)
  assert.notEqual(duplicate.protocolVersion, edited.protocolVersion)
  assert.deepEqual(duplicate.protocol, edited.protocol)
})
test('removing an activity removes its exclusive questions but preserves shared questions', () => {
  const p = brownNoiseTemplate().protocol
  const removed = removeBuilderActivity(p, 'morning-check-in')
  assert.equal(removed.questions.length, 0)
  assert(removed.nightlySchedule.every(s => !s.activityIds.includes('morning-check-in')))
  const shared = { ...p, activities: [...p.activities, { ...p.activities[2], id: 'other-check-in', questionIds: ['restedness'] }] }
  assert.deepEqual(removeBuilderActivity(shared, 'morning-check-in').questions.map(q => q.id), ['restedness'])
})
test('sound publication support requires an asset explicitly verified for the interpreter', () => {
  const p = brownNoiseTemplate().protocol
  delete p.sessionPolicy // This test exercises the legacy remote/timed capability independently.
  for (const a of p.activities) if (a.sessionMode) a.sessionMode = 'timed'
  p.activities[0].audioUrl = 'https://audio.example.org/brown.mp3'
  delete p.activities[0].soundId
  const caps = { ...fixtureCapabilities, enrollmentSchemaVersions: [1], questionFeatures: ['scale-labels-step-v1'], randomizationMethods: [...fixtureCapabilities.randomizationMethods, 'paired_crossover'] }
  assert(capabilityIssues(p, caps).some(issue => /audio asset/.test(issue)))
  assert.deepEqual(capabilityIssues(p, { ...caps, audioAssets: [{ id: 'verified-brown', label: 'Brown noise', url: p.activities[0].audioUrl }] }), [])
})

test('legacy timed protocols retain their exact shape and hash; overnight has explicit non-timed semantics', () => {
  const original = fixtureExperiment(), p = validateProtocol(original.protocol)
  assert.deepEqual(p, original.protocol)
  assert(!Object.hasOwn(p.activities[0], 'sessionMode'))
  assert.equal(protocolHash({ ...original, protocol: p }), protocolHash(original))
  const overnight = { ...p, activities: [{ ...p.activities[0], sessionMode: 'overnight' as const, durationSeconds: 0 }] }
  assert.deepEqual(validateProtocol(overnight), overnight)
  assert.deepEqual(protocolIssues(overnight, 1), [])
  assert.notEqual(protocolHash({ ...original, protocol: overnight }), protocolHash(original))
  assert.throws(() => validateProtocol({ ...overnight, activities: [{ ...overnight.activities[0], durationSeconds: 28800 }] }), code('overnight_session_has_fixed_duration'))
  assert.throws(() => validateProtocol({ ...overnight, activities: [{ ...overnight.activities[0], sessionMode: 'unknown' }] }), code('invalid_session_mode'))
  assert.throws(() => validateProtocol({ ...overnight, activities: [{ ...overnight.activities[0], type: 'cognitive.task' }] }), code('invalid_session_mode'))
  const timed = { ...p, activities: [{ ...p.activities[0], sessionMode: 'timed' as const }] }
  assert.deepEqual(validateProtocol(timed), timed)
  assert.deepEqual(capabilityIssues(timed, fixtureCapabilities), [])
})

test('overnight drafts round-trip but cannot publish even with otherwise verified capabilities', async () => {
  const f = database(), e = { ...draft, protocol: { ...draft.protocol, activities: [{ ...draft.protocol.activities[0], sessionMode: 'overnight' as const, durationSeconds: 0 }] } }
  const first = await saveExperiment(e, 'admin-uid', 0, f.db, true)
  assert.deepEqual(first.protocol, e.protocol)
  assert(capabilityIssues(first.protocol, fixtureCapabilities).some(issue => /Overnight sessions require recorded Android verification/.test(issue)))
  assert(publicationBlockers(first, fixtureCapabilities, true).some(issue => /Android.*verification/.test(issue.message)))
  await assert.rejects(saveExperiment({ ...first, status: 'published' }, 'admin-uid', 1, f.db), code('flutter_capabilities_unverified_or_unsupported'))
  assert.equal(f.versions().length, 0)
  f.setMembers()
  await assert.rejects(saveExperiment({ ...first, protocol: draft.protocol }, 'admin-uid', 1, f.db), code('protocol_and_consent_locked'))
})

test('structured enrollment and exact labelled scales round-trip and invalidate scientific review', async () => {
  const p = brownNoiseTemplate().protocol
  delete p.sessionPolicy
  p.enrollment = { schemaVersion: 1, minimumAge: 21, consentVersion: 'reviewed-v1', consentText: 'Approved test consent.', requirements: [{ id: 'eligible', prompt: 'Exact eligibility wording.' }] }
  assert.deepEqual(validateProtocol(p), p)
  const before = protocolHash({ ...draft, protocol: p })
  assert.notEqual(protocolHash({ ...draft, protocol: { ...p, enrollment: { ...p.enrollment, consentText: 'Different consent.' } } }), before)
  assert.notEqual(protocolHash({ ...draft, protocol: { ...p, questions: p.questions.map((q, i) => i === 0 ? { ...q, labels: ['a', 'b', 'c', 'd', 'e'] } : q) } }), before)
  assert.throws(() => validateProtocol({ ...p, questions: [{ ...p.questions[0], labels: ['too short'] }] }), code('invalid_scale_labels'))
  const f = database()
  const reviewed = await saveExperiment({ ...draft, protocol: p, durationNights: 7 }, 'admin-uid', 0, f.db, true)
  f.setMembers()
  await assert.rejects(saveExperiment({ ...reviewed, protocol: { ...p, enrollment: { ...p.enrollment, minimumAge: 22 } } }, 'admin-uid', 1, f.db), code('protocol_and_consent_locked'))
})

test('overnight capability requires matching Android evidence; local fixtures cannot publish', () => {
  const p = brownNoiseTemplate().protocol
  const caps = { ...fixtureCapabilities, sessionModes: ['timed', 'overnight'], enrollmentSchemaVersions: [1], questionFeatures: ['scale-labels-step-v1'], bundledSoundIds: ['brown_noise'], bundledAssets: [{ id: 'brown_noise', sha256: 'a'.repeat(64) }], randomizationMethods: ['none', 'weighted', 'paired_crossover'], androidVerification: { verified: true, appBuild: fixtureCapabilities.appBuild, verifiedAt: fixtureCapabilities.verifiedAt, evidence: 'SYNTHETIC TEST ONLY', features: ['overnight-playback', 'overnight-silence', 'process-recovery', 'alarm-isolation'] } }
  assert.deepEqual(capabilityIssues(p, caps), [])
  assert(capabilityIssues(p, { ...caps, androidVerification: { ...caps.androidVerification, appBuild: 'other-build' } }).some(i => /Android verification/.test(i)))
  assert(capabilityIssues(p, { ...caps, androidVerification: { ...caps.androidVerification, features: ['overnight-playback'] } }).some(i => /Android verification/.test(i)))
  assert(capabilityIssues(p, { ...caps, localTestOnly: true }).some(i => /cannot authorize publication/.test(i)))
})

test('published bundled sound identities cannot silently change under the same scientific version', async () => {
  const caps = { ...fixtureCapabilities, bundledSoundIds: ['rain'], bundledAssets: [{ id: 'rain', sha256: 'a'.repeat(64) }] }
  const f = database(caps)
  const protocol = { ...draft.protocol, activities: [{ ...draft.protocol.activities[0], type: 'audio.playback', soundId: 'rain', audioUrl: '' }] }
  const reviewed = await saveExperiment({ ...draft, protocol }, 'admin-uid', 0, f.db, true)
  const published = await saveExperiment({ ...reviewed, status: 'published' }, 'admin-uid', 1, f.db)
  assert.deepEqual((f.versions()[0][1] as { executionAssets: unknown }).executionAssets, [{ id: 'rain', sha256: 'a'.repeat(64) }])
  caps.bundledAssets[0].sha256 = 'b'.repeat(64)
  await assert.rejects(saveExperiment(published, 'admin-uid', 2, f.db), code('asset_change_requires_new_protocol_version'))
})


import { validateSevenNight } from '../lib/mina-protocol'
import { readFileSync } from 'node:fs'
test('public release and the enrollment switch are independent, reviewed server-owned states', async () => {
  const f = database();
  const reviewed = await saveExperiment(draft, 'admin-uid', 0, f.db, true);
  const saved = await saveExperiment({ ...reviewed, status: 'published', enrollmentEnabled: true }, 'admin-uid', 1, f.db);
  const root = f.read(`minaExperiments/${saved.id}`)!;
  assert.equal(root.status, 'published'); assert.equal(root.visibility, 'public');
  assert.equal(root.publicationApproved, true); assert.equal(root.enrollmentEnabled, true);
  assert.equal(isPublicExperiment(saved), true);
  const paused = await saveExperiment({ ...saved, enrollmentEnabled: false }, 'admin-uid', 2, f.db);
  assert.equal(isPublicExperiment(paused), true); assert.equal(paused.enrollmentEnabled, false);
  const completed = await saveExperiment({ ...paused, status: 'completed' }, 'admin-uid', 3, f.db);
  assert.equal(isPublicExperiment(completed), true); assert.equal(completed.enrollmentEnabled, false);
  await assert.rejects(saveExperiment({ ...completed, status: 'testing', visibility: 'internal' }, 'admin-uid', 4, f.db), code('internal_testing_requires_staging_project'));
});

test('adult floor applies to protocol validation and missing structured consent blocks publication', () => {
  const e = fixtureExperiment();
  assert.throws(() => validateProtocol({ ...e.protocol, enrollment: { ...e.protocol.enrollment, minimumAge: 17 } }));
  const missing = { ...e, protocol: { ...e.protocol, enrollment: undefined } };
  assert.throws(() => assertProtocolReviewable(missing));
});

test('reviewed seven-night structure requires baseline, pairs, approved scales and morning check-ins', () => {
  const d = JSON.parse(readFileSync(new URL('../docs/brown-noise-seven-night.draft.json', import.meta.url), 'utf8'));
  validateSevenNight(d);
  assert.throws(() => validateProtocol({ ...d.protocol, localTestWindow: { mode: 'completion_sequence' } }));
  for (const mutate of [
    (v: typeof d) => { v.protocol.nightlySchedule[0].conditionId = 'brown'; },
    (v: typeof d) => { v.protocol.randomization.method = 'weighted'; },
    (v: typeof d) => { v.protocol.randomization.pairs[0].nights = [2, 4]; },
    (v: typeof d) => { v.protocol.nightlySchedule[1].activityIds = []; },
    (v: typeof d) => { v.protocol.questions[0].step = undefined; },
    (v: typeof d) => { v.protocol.localTestWindow = { mode: 'completion_sequence' }; },
  ]) { const changed = structuredClone(d); mutate(changed); assert.throws(() => validateSevenNight(changed)); }
});


test('consumer mode preserves a personal purpose and cannot publish on research-only capabilities', async () => {
  const e = brownNoiseTemplate()
  assert.equal(validateProtocol(e.protocol).enrollment?.mode, 'personal')
  assert.throws(() => validateProtocol({ ...e.protocol, enrollment: { ...e.protocol.enrollment, mode: 'unknown' } }), code('invalid_participation_mode'))
  assert.throws(() => validateProtocol({ ...e.protocol, enrollment: { ...e.protocol.enrollment, minimumAge: 17 } }))
  assert(capabilityIssues(e.protocol, { ...fixtureCapabilities, enrollmentModes: [] }).some(i => i.includes('Personal challenge')))
  const { validateSevenNight } = await import('../lib/mina-protocol')
  validateSevenNight(e)
  const bad = structuredClone(e); bad.protocol.questions = bad.protocol.questions.filter(q => q.id !== 'awakenings')
  assert.throws(() => validateSevenNight(bad))
})


test('reviewed consumer publication preserves personal purpose and exposes wrap-up without publishing private findings', async () => {
  const e = { ...brownNoiseTemplate(), id: 'personal-consumer-unit', visibility: 'public' as const, introVideoUrl: 'https://videos.example.org/mina.mp4', resultsVideoUrl: 'https://videos.example.org/wrap.mp4', resultsSummary: 'PRIVATE EDITORIAL DRAFT', resultsPublished: false }
  const caps = { ...fixtureCapabilities, sessionModes: ['timed', 'overnight'], questionFeatures: ['scale-labels-step-v1'], bundledSoundIds: ['brown_noise'], bundledAssets: [{ id: 'brown_noise', sha256: 'a'.repeat(64) }], randomizationMethods: ['paired_crossover'], androidVerification: { verified: true, appBuild: fixtureCapabilities.appBuild, verifiedAt: fixtureCapabilities.verifiedAt, evidence: 'SYNTHETIC UNIT ONLY', features: ['overnight-playback', 'overnight-silence', 'process-recovery', 'alarm-isolation'] } }
  const f = database(caps)
  const reviewed = await saveExperiment(e, 'unit-admin', 0, f.db, true)
  await saveExperiment({ ...reviewed, status: 'published', enrollmentEnabled: true }, 'unit-admin', 1, f.db)
  const root = f.read(`minaExperiments/${e.id}`)!
  assert.equal(root.wrapUpVideoUrl, e.resultsVideoUrl)
  assert.equal(root.results, null)
  assert(!JSON.stringify(root).includes('PRIVATE EDITORIAL DRAFT'))
  const projection = publicExperiment(root as unknown as Experiment & { wrapUpVideoUrl: string })
  assert.equal(projection.wrapUpVideoUrl, e.resultsVideoUrl)
  assert.equal((f.versions()[0][1] as { definition: { protocol: Experiment['protocol'] } }).definition.protocol.enrollment?.mode, 'personal')
  const published = { ...reviewed, status: 'published' as const, enrollmentEnabled: true, revision: 2 }
  const withoutVideos = await saveExperiment({ ...published, introVideoUrl: '', resultsVideoUrl: '' }, 'unit-admin', 2, f.db)
  assert.equal(withoutVideos.protocolHash, reviewed.protocolHash)
  assert.equal(f.read(`minaExperiments/${e.id}`)!.wrapUpVideoUrl, '')
  assert.equal(publicationBlockers(withoutVideos, caps, true).length, 0)
  const withYouTube = await saveExperiment({ ...withoutVideos, introVideoUrl: 'https://youtube.com/shorts/AbCd_12-345', resultsVideoUrl: 'https://youtu.be/AbCd_12-345' }, 'unit-admin', 3, f.db)
  assert.equal(withYouTube.protocolHash, reviewed.protocolHash)
  assert.equal(f.read(`minaExperiments/${e.id}`)!.wrapUpVideoUrl, withYouTube.resultsVideoUrl)
  assert.equal(f.versions().length, 1, 'Editorial media updates never republish the assigned protocol')
})


test('private staging candidates keep verification false and cannot authorize public or production publication', async () => {
  const previous = process.env.FIREBASE_PROJECT_ID
  try {
    process.env.FIREBASE_PROJECT_ID = 'flux-staging-1'
    const e = { ...brownNoiseTemplate(), id: 'candidate-consumer-unit', introVideoUrl: 'https://videos.example.org/mina.mp4' }
    const caps = { ...fixtureCapabilities, verified: false, verifiedAt: '', stagingCandidate: true,
      personalChallengeVerification: { ...fixtureCapabilities.personalChallengeVerification!, verified: false },
      sessionModes: ['timed', 'overnight'], questionFeatures: ['scale-labels-step-v1'], bundledSoundIds: ['brown_noise'], bundledAssets: [{ id: 'brown_noise', sha256: 'a'.repeat(64) }], randomizationMethods: ['paired_crossover'] }
    const f = database(caps)
    const reviewed = await saveExperiment(e, 'unit-admin', 0, f.db, true)
    const candidate = await saveExperiment({ ...reviewed, status: 'testing', enrollmentEnabled: true }, 'unit-admin', 1, f.db)
    assert.equal(candidate.environment, 'staging'); assert.equal(candidate.visibility, 'internal')
    assert.equal(caps.verified, false); assert.equal(caps.personalChallengeVerification.verified, false)
    await assert.rejects(saveExperiment({ ...candidate, visibility: 'public', status: 'published' }, 'unit-admin', 2, f.db), code('flutter_capabilities_unverified_or_unsupported'))
    process.env.FIREBASE_PROJECT_ID = 'flow-9d714' // Mock database only; never calls Firebase.
    await assert.rejects(saveExperiment({ ...candidate, visibility: 'public', status: 'published' }, 'unit-admin', 2, f.db), code('flutter_capabilities_unverified_or_unsupported'))
  } finally {
    if (previous === undefined) delete process.env.FIREBASE_PROJECT_ID
    else process.env.FIREBASE_PROJECT_ID = previous
  }
})


test('optional Mina videos accept watch, shortened and Shorts URLs with strict IDs', () => {
  for (const url of ['https://youtube.com/watch?v=AbCd_12-345', 'https://youtu.be/AbCd_12-345?si=x', 'https://www.youtube.com/shorts/AbCd_12-345', 'https://m.youtube.com/shorts/AbCd_12-345/']) {
    assert.equal(mediaSource(url)?.url, 'https://www.youtube-nocookie.com/embed/AbCd_12-345')
  }
  for (const url of ['https://youtube.com/watch?v=short', 'https://youtu.be/AbCd_12-345/extra', 'https://youtube.com/other?v=AbCd_12-345', 'https://youtube.com/watch?v=AbCd_12-345&v=AbCd_12-345', 'https://youtube.com.evil.org/watch?v=AbCd_12-345']) assert.equal(mediaSource(url), null)
  const e = { ...fixtureExperiment(), status: 'published', introVideoUrl: '', resultsVideoUrl: '' }
  assert.equal(validateExperiment(e).introVideoUrl, '')
  assert.equal(validateExperiment(e).resultsVideoUrl, '')
  const edited = { ...e, introVideoUrl: 'https://youtube.com/shorts/AbCd_12-345', resultsVideoUrl: 'https://youtu.be/AbCd_12-345' }
  assert.equal(protocolHash(e), protocolHash(edited))
})


test('consumer sleep session policy survives validation, pins the interval, and requires its capability', async () => {
  const { brownNoiseTemplate } = await import('../lib/mina-builder')
  const e = brownNoiseTemplate(), p = validateProtocol(e.protocol)
  assert.equal(p.sessionPolicy?.minimumIntervalSeconds, 43200)
  validateSevenNight({ protocol: p, durationNights: 7 })
  for (const policy of [{ ...p.sessionPolicy, minimumIntervalSeconds: 0 }, { ...p.sessionPolicy, mode: 'fixed' }, { ...p.sessionPolicy, cap: 10 }]) assert.throws(() => validateProtocol({ ...p, sessionPolicy: policy }))
  assert.throws(() => validateProtocol({ ...p, enrollment: { ...p.enrollment, mode: 'research' } }))
  const original = protocolHash(e)
  assert.notEqual(protocolHash({ ...e, protocol: { ...p, sessionPolicy: { ...p.sessionPolicy!, minimumIntervalSeconds: 86400 } } }), original)
  assert(capabilityIssues(p, { ...fixtureCapabilities, scheduleSemantics: ['local-evening-following-morning-v1'] }).some(x => /schedule/.test(x)))
})


test('custom consumer drafts support arbitrary sounds, durations, pairs and linked morning games', async () => {
  const { consumerExperimentTemplate, pairedComparisonPlan, resizeConsumerPlan } = await import('../lib/mina-builder')
  let e = consumerExperimentTemplate()
  e.protocol.activities[0].soundId = 'rain'
  assert.equal(e.protocol.enrollment?.mode, 'personal')
  assert.equal(e.protocol.sessionPolicy?.mode, 'user_controlled')
  e = pairedComparisonPlan(e, false)
  assert.equal(e.protocol.randomization.pairs?.length, 3)
  e.protocol.activities.push({ id: 'morning-game', type: 'cognitive.task', version: 1, audioUrl: '', durationSeconds: 30, taskId: 'color_match', questionIds: [] })
  e.protocol.nightlySchedule.filter(s => s.phase === 'morning').forEach(s => s.activityIds.push('morning-game'))
  validateProtocol(e.protocol)
  const resized = resizeConsumerPlan(e, 8)
  assert.equal(resized.protocol.randomization.pairs?.length, 4)
  assert(resized.protocol.nightlySchedule.filter(s => s.phase === 'morning').every(s => s.activityIds.includes('morning-game')))
  assert.throws(() => resizeConsumerPlan(e, 7))
  const baseline = pairedComparisonPlan({ ...e, durationNights: 7 }, true)
  assert.equal(baseline.protocol.nightlySchedule[0].conditionId, 'silence')
  validateProtocol(baseline.protocol)
  const weighted = consumerExperimentTemplate()
  assert.equal(resizeConsumerPlan(weighted, 4).protocol.nightlySchedule.length, 8)
})


test('aggregate disclosure is pinned, optional for old plans and never permits research reuse', () => {
  const e = brownNoiseTemplate(), p = validateProtocol(e.protocol)
  assert.equal(p.enrollment?.aggregateResults, true)
  assert.match(p.enrollment!.consentText, /aggregate/)
  const older = structuredClone(p); delete older.enrollment!.aggregateResults
  assert.equal(validateProtocol(older).enrollment?.aggregateResults, undefined)
  assert.notEqual(protocolHash(e), protocolHash({ ...e, protocol: older }))
  for (const enrollment of [{ ...p.enrollment, aggregateResults: 'yes' }, { ...p.enrollment, consentText: 'Private tracking only.' }, { ...p.enrollment, mode: 'research' }]) assert.throws(() => validateProtocol({ ...p, enrollment }))
})


test('admin outcome averages are version-specific, suppress small groups and expose no raw answers', async () => {
  const { conditionAverages } = await import('../lib/server/mina-experiments')
  const e = { ...brownNoiseTemplate(), id: 'consumer-aggregate', protocolHash: 'pinned-unit-version' }
  const filters: unknown[][] = []
  let count = 4
  const db = () => ({ collectionGroup: (name: string) => {
    assert.equal(name, 'minaConditionStatistics')
    const query = { where: (...args: unknown[]) => { filters.push(args); return query }, aggregate: () => ({ get: async () => ({ data: () => ({ participants: count, mean: 3.5 }) }) }) }
    return query
  } }) as unknown as import('firebase-admin/firestore').Firestore
  const small = await conditionAverages(e, 'sleep-quality', db)
  assert(small!.rows.every(r => r.mean === null && r.participants === 4))
  count = 5
  const ready = await conditionAverages(e, 'sleep-quality', db)
  assert(ready!.rows.every(r => r.mean === 3.5))
  assert(filters.some(f => f[0] === 'protocolHash' && f[2] === e.protocolHash))
  assert(!JSON.stringify(ready).includes('userId'))
  const older = structuredClone(e); delete older.protocol.enrollment!.aggregateResults
  assert.equal(await conditionAverages(older, undefined, db), null)
})

test('bundled sound draft choices use registered IDs and digests without claiming runtime verification', () => {
  const caps = { ...fixtureCapabilities, verified: false, bundledSoundIds: bundledMinaSounds, bundledAssets: bundledMinaSounds.map(id => ({ id, sha256: 'a'.repeat(64) })) }
  assert.deepEqual(bundledSoundOptions(caps).map(s => s.id), ['brown_noise', 'rain', 'ocean', 'forest', 'winter'])
  assert.equal(bundledSoundOptions(caps)[0].label, 'Brown noise')
  assert.ok(capabilityIssues(brownNoiseExample(), caps).includes('Flutter execution capabilities have not been verified.'))
  assert.equal(caps.verified, false)
})

test('bundled sound selector excludes missing registry entries, bad digests and unsupported IDs', () => {
  assert.deepEqual(bundledSoundOptions(null), [])
  const caps = { ...fixtureCapabilities, bundledSoundIds: ['brown_noise', 'rain', 'unsupported'], bundledAssets: [{ id: 'brown_noise', sha256: 'a'.repeat(64) }, { id: 'rain', sha256: 'invalid' }, { id: 'unsupported', sha256: 'b'.repeat(64) }] }
  assert.deepEqual(bundledSoundOptions(caps).map(s => s.id), ['brown_noise'])
  assert.deepEqual(bundledSoundOptions({ ...caps, bundledSoundIds: [] }), [])
})


test('participant-controlled sleep uses no fixed duration and keeps condition assignments and linked check-ins', () => {
  const p = brownNoiseTemplate().protocol
  const flexible = participantControlledSleep(p, true)
  assert.equal(flexible.sessionPolicy?.minimumIntervalSeconds, 43200)
  assert.ok(flexible.activities.filter(a => a.type.startsWith('audio.')).every(a => a.sessionMode === 'overnight' && a.durationSeconds === 0))
  assert.deepEqual(flexible.conditions, p.conditions)
  assert.deepEqual(flexible.nightlySchedule, p.nightlySchedule)
  assert.doesNotThrow(() => validateProtocol(flexible))
  const configured = participantControlledSleep({ ...p, sessionPolicy: { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: 86400 } }, true)
  assert.equal(configured.sessionPolicy?.minimumIntervalSeconds, 86400)
})

test('scheduled and timed personal plans are preserved unless an operator explicitly changes timing', () => {
  const p = brownNoiseTemplate().protocol
  const { sessionPolicy: _policy, ...scheduled } = p
  const timed = { ...scheduled, activities: scheduled.activities.map(a => a.type.startsWith('audio.') ? { ...a, sessionMode: 'timed' as const, durationSeconds: 600 } : a) }
  assert.deepEqual(participantControlledSleep(timed, false), timed)
  assert.doesNotThrow(() => validateProtocol(timed))
  const flexible = participantControlledSleep(timed, true)
  assert.equal(timed.activities[0].durationSeconds, 600)
  assert.equal(flexible.activities[0].durationSeconds, 0)
  assert.throws(() => participantControlledSleep({ ...timed, enrollment: { ...timed.enrollment!, mode: 'research' } }, true))
})
