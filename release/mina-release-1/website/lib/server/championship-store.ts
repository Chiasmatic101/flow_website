import 'server-only'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { championshipDatabase } from '../firebase-admin'

export interface StoreTransaction {
  get<T>(path: string): Promise<T | null>
  set(path: string, data: object): void
  update(path: string, data: object): void
}
export interface ChampionshipStore {
  get<T>(path: string): Promise<T | null>
  transaction<T>(run: (tx: StoreTransaction) => Promise<T>): Promise<T>
  timestamp(milliseconds: number): unknown
  serverTimestamp(): unknown
}
export function timeOf(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis()
  return 0
}
export function firestoreStore(): ChampionshipStore {
  const db = championshipDatabase()
  return {
    async get<T>(path: string) { const doc = await db.doc(path).get(); return doc.exists ? doc.data() as T : null },
    transaction: run => db.runTransaction(tx => run({
      async get<T>(path: string) { const doc = await tx.get(db.doc(path)); return doc.exists ? doc.data() as T : null },
      set: (path, data) => { tx.set(db.doc(path), data) },
      update: (path, data) => { tx.update(db.doc(path), data) },
    })),
    timestamp: milliseconds => Timestamp.fromMillis(milliseconds),
    serverTimestamp: () => FieldValue.serverTimestamp(),
  }
}
