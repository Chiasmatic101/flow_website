import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { Firestore } from 'firebase-admin/firestore'
import { OAuth2Client } from 'google-auth-library'
import { saveExperiment } from '../lib/server/mina-experiments'

const require = createRequire(resolve(process.cwd(), 'package.json'))
const flow = 'C:/Users/akpoo/StudioProjects/flow'
const cloud = require(resolve(flow, 'functions/tools/stage8b-staging.js'))
const { token } = require(resolve(flow, 'functions/tools/stage7d-preflight.js'))
let phase = 'staging identity and artifact guards'
async function main() {
  if (process.argv[2] !== '--apply-private-staging' || process.env.FIREBASE_PROJECT_ID !== 'flux-staging-1') throw Error('Explicit private staging target required')
  await cloud.connect()
  const artifact = JSON.parse(readFileSync(resolve(flow, 'docs/mina-tests/stage-8-video-apk-verification.json'), 'utf8'))
  const capabilities = JSON.parse(readFileSync(resolve(flow, 'docs/mina-tests/capabilities.candidate.json'), 'utf8'))
  if (createHash('sha256').update(readFileSync(artifact.apk)).digest('hex').toUpperCase() !== artifact.sha256 || capabilities.apkSha256 !== artifact.sha256 || capabilities.verified !== false || capabilities.stagingCandidate !== true || capabilities.androidVerification.verified !== false || capabilities.personalChallengeVerification.verified !== false) throw Error('APK-bound unverified staging candidate required')
  // Firestore's supported Google Auth client path; CLI tokens stay in memory.
  const authClient = new OAuth2Client()
  authClient.refreshHandler = async () => ({ access_token: await token(), expiry_date: Date.now() + 50 * 60 * 1000 })
  const db = new Firestore({ projectId: 'flux-staging-1', authClient })
  const before = JSON.parse(readFileSync(resolve(flow, 'docs/mina-tests/stage-8b-preflight.json'), 'utf8'))
  const ref = db.doc('minaExecutionCapabilities/flutter')
  phase = 'unverified staging capability compare-and-swap'
  await db.runTransaction(async tx => {
    const current = await tx.get(ref)
    if (isDeepStrictEqual(current.data(), capabilities)) return
    if (!isDeepStrictEqual(current.data() || null, before.capabilityBefore)) throw Error('Capability changed since preflight; stop before overwriting evidence')
    tx.set(ref, capabilities)
  })
  phase = 'private real-calendar challenge validation'
  const draft = JSON.parse(readFileSync(resolve('docs/brown-noise-consumer-challenge.draft.json'), 'utf8'))
  if (draft.introVideoUrl || draft.resultsVideoUrl || draft.visibility !== 'internal' || draft.protocol.enrollment.mode !== 'personal' || draft.protocol.localTestWindow) throw Error('Private real-calendar text-only consumer draft required')
  const id = draft.id
  const current = await db.doc(`minaExperiments/${id}/private/admin`).get()
  const existingRoot = await db.doc(`minaExperiments/${id}`).get()
  if (existingRoot.exists && !current.exists) throw Error('Unrecognized existing challenge; do not overwrite')
  if (current.exists && (current.data()?.environment !== 'staging' || current.data()?.visibility !== 'internal')) throw Error('Unrecognized existing challenge environment')
  phase = 'atomic reviewed private challenge activation'
  const saved = await saveExperiment({ ...draft, status: 'testing', visibility: 'internal', enrollmentEnabled: true }, 'stage8b-reviewed-staging-operation', current.data()?.revision || 0, () => db, true)
  if (saved.environment !== 'staging' || saved.visibility !== 'internal' || saved.status !== 'testing' || saved.firstPublishedAt) throw Error('Challenge must never be publicly published')
  const report = { project: 'flux-staging-1', configuredAt: new Date().toISOString(), id, protocolVersion: saved.protocolVersion, protocolHash: saved.protocolHash, status: saved.status, visibility: saved.visibility, enrollmentEnabled: saved.enrollmentEnabled, introVideoUrlUnset: !saved.introVideoUrl, resultsVideoUrlUnset: !saved.resultsVideoUrl, capabilityVerified: false, apkSha256: artifact.sha256, publicPublication: false, accountEnrolled: false }
  writeFileSync(resolve(flow, 'docs/mina-tests/stage-8b-challenge.json'), JSON.stringify(report, null, 2)+'\n')
  console.log(JSON.stringify(report))
  await db.terminate()
}
main().catch((error: unknown) => { const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'error'; console.error(`Private staging configuration stopped at ${phase} (${code}); no credentials or identifiers logged.`); process.exitCode = 1 })
