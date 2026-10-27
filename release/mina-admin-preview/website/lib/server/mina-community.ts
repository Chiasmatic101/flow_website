import 'server-only'
import { championshipDatabase } from '../firebase-admin'
import { activeMinaTest } from '../minaTestsConfig'
export type PublicCounts = { available: boolean; experimentId: string; signups?: number; confirmedEnrollments?: number; completedParticipants: null; cachedForSeconds: number }
export function aggregateCache(load: () => Promise<PublicCounts>, now = Date.now) {
  let cache: { until: number; value: PublicCounts } | undefined
  let pending: Promise<PublicCounts> | undefined
  return async () => {
    if (cache && cache.until > now()) return cache.value
    if (pending) return pending
    pending = load().catch(() => ({ available: false, experimentId: activeMinaTest.id, completedParticipants: null, cachedForSeconds: 300 })).then(value => {
      cache = { value, until: now() + 300_000 }; return value
    }).finally(() => { pending = undefined })
    return pending
  }
}
// Each unique test/participant relationship counts once. Admin aggregation returns
// only numbers; no participant document or email is loaded into this public path.
export const communityCounts = aggregateCache(async () => {
  const query = championshipDatabase().collection('minaTestParticipants').where('experimentId', '==', activeMinaTest.id).where('countSchemaVersion', '==', 1).where('excludedFromPublicCounts', '==', false)
  const [signups, confirmed] = await Promise.all([query.count().get(), query.where('status', '==', 'joined').count().get()])
  return { available: true, experimentId: activeMinaTest.id, signups: signups.data().count, confirmedEnrollments: confirmed.data().count, completedParticipants: null, cachedForSeconds: 300 }
})
