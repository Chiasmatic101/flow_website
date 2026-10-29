import 'server-only'
import { FieldPath } from 'firebase-admin/firestore'
import { championshipDatabase } from '../firebase-admin'
import { FunnelError } from '../championship-validation'
import { safePlayEmail } from './championship-service'
export function testerCollection(platform: string) {
  if (platform !== 'android' && platform !== 'iphone') throw new FunnelError('invalid_device')
  return platform === 'android' ? 'fluxAndroidTesters' : 'fluxIosWaitlist'
}
export function testerCursor(cursor: string | null) {
  if (cursor && !/^[a-zA-Z0-9-]{1,80}$/.test(cursor)) throw new FunnelError('invalid_input')
  return cursor
}
export function playCsv(rows: { active?: unknown; emailVerified?: unknown; consent?: unknown; isTestRecord?: unknown; playEmail?: unknown }[]) {
  const emails = rows.filter(row => row.active === true && row.emailVerified === true && row.consent === true && row.isTestRecord !== true).map(row => typeof row.playEmail === 'string' ? safePlayEmail(row.playEmail.toLowerCase()) : null).filter((email): email is string => email !== null)
  return [...new Set(emails)].join('\r\n') + (emails.length ? '\r\n' : '')
}
export async function testerPage(platform: string, cursor: string | null) {
  let query = championshipDatabase().collection(testerCollection(platform)).orderBy(FieldPath.documentId()).limit(101)
  if (testerCursor(cursor)) query = query.startAfter(cursor)
  const snapshot = await query.get()
  const docs = snapshot.docs.slice(0, 100)
  return { rows: docs.map(doc => ({ ...(doc.data() as Record<string, unknown>), active: doc.get('active') as boolean, emailVerified: doc.get('emailVerified') as boolean, consent: doc.get('consent') as boolean, isTestRecord: doc.get('isTestRecord') as boolean, playEmail: doc.get('playEmail') as string | null, id: doc.id, createdAt: doc.get('createdAt')?.toDate?.().toISOString() ?? null, updatedAt: doc.get('updatedAt')?.toDate?.().toISOString() ?? null })), nextCursor: snapshot.size > 100 ? docs.at(-1)!.id : null }
}
export function validateTesterStatus(body: unknown) {
  const input = body as Record<string, unknown> | null
  if (!input || typeof input.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.id) || !['pending', 'invited', 'added'].includes(String(input.status)) || !['pending', 'invited', 'added'].includes(String(input.expectedStatus)) || (input.status === 'added' && input.confirmedAdded !== true)) throw new FunnelError('invalid_input')
  return { id: input.id, status: String(input.status), expectedStatus: String(input.expectedStatus), expectedPlayEmail: input.expectedPlayEmail }
}
export async function updateTesterStatus(body: unknown, adminUid: string) {
  const input = validateTesterStatus(body)
  const db = championshipDatabase()
  const ref = db.collection('fluxAndroidTesters').doc(input.id)
  const audit = db.collection('fluxTesterAudit').doc()
  const { FieldValue } = await import('firebase-admin/firestore')
  await db.runTransaction(async tx => {
    const doc = await tx.get(ref)
    if (!doc.exists || doc.get('active') !== true || doc.get('emailVerified') !== true || doc.get('consent') !== true) throw new FunnelError('invalid_input')
    if (doc.get('status') !== input.expectedStatus || doc.get('playEmail') !== input.expectedPlayEmail) throw new FunnelError('queue_changed', 409)
    if (!safePlayEmail(doc.get('playEmail') ?? '')) throw new FunnelError('invalid_play_email')
    tx.update(ref, { status: input.status, updatedAt: FieldValue.serverTimestamp() })
    tx.set(audit, { participantId: input.id, from: input.expectedStatus, to: input.status, adminUid, createdAt: FieldValue.serverTimestamp() })
  })
}
