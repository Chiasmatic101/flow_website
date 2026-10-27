import 'server-only'
import { AggregateField, type Query } from 'firebase-admin/firestore'
import { championshipDatabase } from '../firebase-admin'
import { experimentId, validateExperiment, publicExperiment, type Experiment } from '../mina-experiments'
import { FunnelError } from '../championship-validation'
import type { ExecutionCapabilities } from '../mina-protocol'
import { assertExecutable, assertProtocolReviewable, CAPABILITIES_PATH, protocolDefinition, protocolHash } from './mina-protocol'
export function deploymentEnvironment() { return !process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'flow-9d714' ? 'production' as const : 'staging' as const }
export const EXPERIMENTS = 'minaExperiments'
export async function getExecutionCapabilities() {
  const doc = await championshipDatabase().doc(CAPABILITIES_PATH).get()
  return doc.exists ? doc.data() as ExecutionCapabilities : null
}
export async function getExperiment(id: string) {
  try { experimentId(id) } catch { return null }
  const ref = championshipDatabase().collection(EXPERIMENTS).doc(id)
  const [root, privateDoc] = await Promise.all([ref.get(), ref.collection('private').doc('admin').get()])
  if (!root.exists) return null
  return privateDoc.exists ? { ...privateDoc.data(), visibility: root.data()?.visibility, environment: root.data()?.environment, publicationApproved: root.data()?.publicationApproved, enrollmentEnabled: root.data()?.enrollmentEnabled, status: root.data()?.status } as Experiment : root.data() as Experiment
}
export async function adminExperimentPage(cursor?: string) {
  let query = championshipDatabase().collection(EXPERIMENTS).orderBy('__name__').limit(21)
  if (cursor) query = query.startAfter(experimentId(cursor))
  const docs = await query.get()
  const rows = await Promise.all(docs.docs.slice(0, 20).map(async doc => {
    const privateDoc = await doc.ref.collection('private').doc('admin').get()
    const e = (privateDoc.exists ? privateDoc.data() : doc.data()) as Experiment
    return { ...e, counts: await experimentCounts(doc.id) }
  }))
  return { rows, nextCursor: docs.docs.length > 20 ? rows.at(-1)!.id : null }
}
export async function adminExperimentRows() { return (await adminExperimentPage()).rows }
export async function publishedExperimentPage(cursor?: string) {
  let query = championshipDatabase().collection(EXPERIMENTS).where('environment', '==', deploymentEnvironment()).where('visibility', '==', 'public').where('publicationApproved', '==', true).where('status', 'in', ['published', 'paused', 'completed']).orderBy('__name__').limit(21)
  if (cursor) query = query.startAfter(experimentId(cursor))
  const docs = await query.get()
  const experiments = docs.docs.slice(0, 20).map(doc => publicExperiment(doc.data() as Experiment))
  return { experiments, nextCursor: docs.docs.length > 20 ? experiments.at(-1)!.id : null }
}
export async function publishedExperiments() { return (await publishedExperimentPage()).experiments }
export async function experimentCounts(id: string) {
  const db = championshipDatabase()
  const aggregate = async (query: Query) => {
    try { return (await query.count().get()).data().count }
    catch { console.warn('Mina challenge aggregate unavailable; check project indexes and service access.'); return null }
  }
  const [shards, technicalErrors, completed, retained, stopped] = await Promise.all([
    db.collection(`minaExperimentMetrics/${experimentId(id)}/shards`).limit(256).get(),
    aggregate(db.collectionGroup('responses').where('experimentId', '==', id).where('response.endedReason', 'in', ['player_error', 'start_error', 'process_lost', 'service_destroyed', 'safety_timeout', 'sleep_session_conflict'])),
    aggregate(db.collection('minaEnrollments').where('experimentId', '==', id).where('finalizedAtMs', '>', 0)),
    aggregate(db.collection('minaEnrollments').where('experimentId', '==', id)),
    aggregate(db.collection('minaEnrollments').where('experimentId', '==', id).where('status', '==', 'withdrawn')),
  ])
  const historicalAdmissions = shards.empty ? null : shards.docs.reduce((sum, d) => sum + Number(d.data().totalAdmissions || 0), 0)
  return { signups: null, enrollments: historicalAdmissions, active: null, completed, technicalErrors, dropouts: stopped, completionRate: retained !== null && retained > 0 && completed !== null ? completed / retained : null }

}
export async function saveExperiment(value: unknown, actor: string, expectedRevision: unknown, database = championshipDatabase, reviewProtocol = false) {
  const input = validateExperiment(value)
  if (!Number.isInteger(expectedRevision) || Number(expectedRevision) < 0) throw new FunnelError('revision_required', 409)
  const db = database(), ref = db.collection(EXPERIMENTS).doc(input.id)
  return db.runTransaction(async tx => {
    const current = await tx.get(ref), privateRef = ref.collection('private').doc('admin')
    const privateDoc = await tx.get(privateRef)
    const old = privateDoc.exists ? privateDoc.data() as Experiment : current.exists ? current.data() as Experiment : null
    if ((old?.revision ?? 0) !== expectedRevision) throw new FunnelError('edit_conflict_reload', 409)
    const members = await tx.get(db.collection('minaTestParticipants').where('experimentId', '==', input.id).limit(1))
    const enrollments = await tx.get(db.collection('minaEnrollments').where('experimentId', '==', input.id).limit(1))
    const locked = old?.enrollmentStarted === true || !members.empty || !enrollments.empty
    const hash = protocolHash(input)
    if (old && locked && protocolHash(old) !== hash) throw new FunnelError('protocol_and_consent_locked', 409)
    const environment = deploymentEnvironment()
    const released = ['testing', 'published'].includes(input.status) || (['paused', 'completed'].includes(input.status) && old?.publicationApproved === true)
    if (released && input.visibility === 'internal' && environment === 'production') throw new FunnelError('internal_testing_requires_staging_project', 409)
    if (input.status === 'testing' && input.visibility !== 'internal') throw new FunnelError('testing_visibility_required', 409)
    const enrollmentEnabled = ['testing', 'published'].includes(input.status) && input.enrollmentEnabled === true
    const instant = new Date().toISOString()
    if (reviewProtocol) assertProtocolReviewable(input)
    const review = reviewProtocol ? { hash, reviewedBy: actor, reviewedAt: instant } : old?.protocolReview?.hash === hash ? old.protocolReview : null
    const saved: Experiment = { ...input, environment, enrollmentEnabled, publicationApproved: released, protocolHash: hash, protocolReview: review, firstPublishedAt: old?.firstPublishedAt || (input.status === 'published' ? instant : null), revision: Number(expectedRevision) + 1, createdAt: old?.createdAt || instant, updatedAt: instant, enrollmentStarted: locked }
    if (released) {
      const capabilities = await tx.get(db.doc(CAPABILITIES_PATH))
      if (!old?.publicationApproved || old.protocolHash !== hash || ['published', 'testing'].includes(input.status)) assertExecutable(saved, capabilities.exists ? capabilities.data() as ExecutionCapabilities : null)
      const versionRef = ref.collection('versions').doc(input.protocolVersion)
      const version = await tx.get(versionRef)
      const soundIds = new Set(saved.protocol.activities.flatMap(a => a.soundId ? [a.soundId] : []))
      const executionAssets = ((capabilities.data() as ExecutionCapabilities | undefined)?.bundledAssets || []).filter(a => soundIds.has(a.id)).map(a => ({ id: a.id, sha256: a.sha256 })).sort((a, b) => a.id.localeCompare(b.id))
      if (version.exists && version.data()?.hash !== hash) throw new FunnelError('protocol_version_already_used', 409)
      if (version.exists && executionAssets.length && JSON.stringify((version.data()?.executionAssets || []).map((a: { id: string; sha256: string }) => ({ id: a.id, sha256: a.sha256 })).sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id))) !== JSON.stringify(executionAssets)) throw new FunnelError('asset_change_requires_new_protocol_version', 409)
      if (!version.exists) tx.create(versionRef, { definition: protocolDefinition(saved), hash, published: true, createdAt: instant, appBuild: capabilities.data()?.appBuild, ...(executionAssets.length ? { executionAssets } : {}) })
    }
    // Deployed rules allow public root reads. Never persist private result drafts,
    // reviewer identities, or review attestations on the publicly readable root.
    tx.set(ref, { ...publicExperiment(saved), publishedVersion: input.protocolVersion })
    tx.set(privateRef, saved)
    tx.create(ref.collection('revisions').doc(String(saved.revision)), { ...saved, actor })
    return saved
  })
}

// Admin pages call this after requireAdminPage. Numeric means are projected by
// trusted submission code; no participant documents or raw answers leave here.
export async function conditionAverages(e: Experiment, requestedQuestion?: string, database = championshipDatabase) {
  if (e.protocol.enrollment?.aggregateResults !== true || !e.protocolHash) return null
  const questions = e.protocol.questions.filter(q => q.type === 'scale')
  const question = questions.find(q => q.id === requestedQuestion) || questions[0]
  if (!question) return null
  const rows = await Promise.all(e.protocol.conditions.map(async condition => {
    try {
      const result = await database().collectionGroup('minaConditionStatistics')
        .where('experimentId', '==', e.id).where('protocolHash', '==', e.protocolHash)
        .where('conditionId', '==', condition.id).where('questionId', '==', question.id)
        .aggregate({ participants: AggregateField.count(), mean: AggregateField.average('value') }).get()
      const { participants, mean } = result.data()
      return { label: condition.label || condition.id, participants, mean: participants >= 5 ? mean : null, unavailable: false }
    } catch { return { label: condition.label || condition.id, participants: null, mean: null, unavailable: true } }
  }))
  return { question, questions, rows }
}
