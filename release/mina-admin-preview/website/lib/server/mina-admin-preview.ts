import 'server-only'
import { randomBytes } from 'node:crypto'
import { championshipDatabase } from '../firebase-admin'
import { FunnelError } from '../championship-validation'
import { validateProtocol } from '../mina-protocol'
import { publicExperiment, type Experiment } from '../mina-experiments'
import { CAPABILITIES_PATH, protocolDefinition, protocolHash } from './mina-protocol'

export function previewSnapshot(source: Experiment, conditionId: string, id: string) {
  if (!source.protocol.sessionPolicy || source.protocol.enrollment?.mode !== 'personal') throw new FunnelError('preview_requires_personal_sleep_protocol')
  const condition = source.protocol.conditions.find(c => c.id === conditionId)
  const morning = source.protocol.nightlySchedule.find(s => s.phase === 'morning')
  if (!condition || !morning) throw new FunnelError('invalid_preview_condition')
  const ids = new Set([...condition.activityIds, ...morning.activityIds])
  const questions = new Set(source.protocol.activities.filter(a => ids.has(a.id)).flatMap(a => a.questionIds))
  const preview: Experiment = { ...source, id, title: `ADMIN PREVIEW · ${condition.label} · ${source.title}`, description: 'Private administrator runtime check. Not real participant data. Original experiment remains unchanged.', durationNights: 1, protocolType: 'admin-private-preview-v1', protocolVersion: 'admin-preview-v1', visibility: 'internal', enrollmentEnabled: false, publicationApproved: false, status: 'draft', resultsPublished: false, resultsSummary: '', resultsVideoUrl: '', protocolReview: null,
    protocol: validateProtocol({ ...source.protocol, enrollment: { ...source.protocol.enrollment, aggregateResults: false }, conditions: [condition], activities: source.protocol.activities.filter(a => ids.has(a.id)), questions: source.protocol.questions.filter(q => questions.has(q.id)), randomization: { method: 'none', unit: 'night', allocationOwner: 'server' }, nightlySchedule: [{ night: 1, phase: 'evening', conditionId: condition.id, activityIds: [] }, { ...morning, night: 1 }] }) }
  preview.protocolHash = protocolHash(preview)
  return preview
}
export async function createAndroidPreview(actor: string, sourceId: string, conditionId: string, expectedRevision: number, database = championshipDatabase) {
  const db = database(), id = `mina-admin-preview-${randomBytes(12).toString('hex')}`, instant = Date.now()
  return db.runTransaction(async tx => {
    const root = await tx.get(db.doc(`minaExperiments/${sourceId}`))
    const privateDoc = await tx.get(db.doc(`minaExperiments/${sourceId}/private/admin`))
    const capDoc = await tx.get(db.doc(CAPABILITIES_PATH))
    const barrier = await tx.get(db.doc(`minaResearchDeletionLocks/${actor}`))
    if (barrier.exists) throw new FunnelError('account_deletion_started', 409)
    const source = privateDoc.data() as Experiment | undefined
    if (!root.exists || !source || source.revision !== expectedRevision) throw new FunnelError('edit_conflict_reload', 409)
    if (process.env.FIREBASE_PROJECT_ID !== 'flow-9d714') throw new FunnelError('preview_production_project_required', 409)
    const c = capDoc.data()
    if (!c?.appBuild || c.androidApplicationId !== 'com.chiasmatic.flow' || c.artifactVerification?.verified !== true) throw new FunnelError('preview_build_identity_required', 409)
    if (protocolHash(source) !== source.protocolHash || root.data()?.protocolHash !== source.protocolHash) throw new FunnelError('protocol_hash_mismatch', 409)
    const preview = previewSnapshot(source, conditionId, id)
    const sounds = new Set(preview.protocol.activities.flatMap(a => a.soundId ? [a.soundId] : []))
    const assets = (c.bundledAssets || []).filter((a: { id: string; sha256: string }) => sounds.has(a.id) && /^[a-f0-9]{64}$/.test(a.sha256)).map((a: { id: string; sha256: string }) => ({ id: a.id, sha256: a.sha256 }))
    if (assets.length !== sounds.size) throw new FunnelError('preview_asset_identity_required', 409)
    const config = { id, ownerUid: actor, previewOnly: true, environment: 'production', sourceExperimentId: sourceId, sourceProtocolHash: source.protocolHash, conditionId, appBuild: c.appBuild, createdAtMs: instant, expiresAtMs: instant + 48 * 3600000,
      root: { ...publicExperiment(preview), publishedVersion: preview.protocolVersion }, version: { definition: protocolDefinition(preview), hash: preview.protocolHash, executionAssets: assets } }
    tx.create(db.doc(`minaAdminPreviews/${actor}/runs/${id}`), config)
    return { id, title: preview.title, expiresAtMs: config.expiresAtMs, instructions: 'On the same administrator account, reopen Flux → Mina Tests → ADMIN PREVIEW. Start Challenge, then Start Night. This run is private and excluded from participant results.' }
  })
}
