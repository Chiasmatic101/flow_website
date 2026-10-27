import 'server-only'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { FunnelError } from './championship-validation'

export function championshipApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const emulator = process.env.NODE_ENV !== 'production' && process.env.FIRESTORE_EMULATOR_HOST
  if (!projectId || (!emulator && !(clientEmail && privateKey) && process.env.FIREBASE_USE_APPLICATION_DEFAULT !== 'true')) throw new FunnelError('backend_not_configured', 503)
  // Never permit an emulator override in production.
  if (process.env.NODE_ENV === 'production' && process.env.FIRESTORE_EMULATOR_HOST) throw new FunnelError('backend_not_configured', 503)
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new FunnelError('backend_not_configured', 503)
  const existing = getApps().find(app => app.name === 'flux-championship')
  const app = existing || initializeApp({ projectId, ...(emulator ? {} : { credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() }) }, 'flux-championship')
  return app
}
export function championshipDatabase() { return getFirestore(championshipApp()) }
