import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { Firestore } from '@google-cloud/firestore'
import { OAuth2Client } from 'google-auth-library'
import { saveExperiment } from './website/lib/server/mina-experiments'
const require = createRequire(import.meta.url)
const { token } = require('C:/Users/akpoo/StudioProjects/flow/functions/tools/stage7d-preflight')
async function main() {
  if (process.argv[2] !== '--create-approved-unpublished-draft') throw Error('Explicit draft-only mode required')
  process.env.FIREBASE_PROJECT_ID = 'flow-9d714'
  process.env.FIREBASE_USE_APPLICATION_DEFAULT = 'true'
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw Error('Emulator override refused')
  const draft = JSON.parse(readFileSync('C:/Users/akpoo/StudioProjects/flow/release/mina-release-1/brown-noise-production-draft.json', 'utf8'))
  if (draft.status !== 'draft' || draft.publicationApproved !== false || draft.enrollmentEnabled !== false || draft.environment !== 'production' || draft.introVideoUrl || draft.wrapUpVideoUrl) throw Error('Unpublished draft invariants failed')
  const access = await token()
  const authClient = new OAuth2Client(); authClient.setCredentials({access_token:access,expiry_date:Date.now()+3500000}); const database = new Firestore({projectId:'flow-9d714',authClient} as any)
  const ref = database.doc(`minaExperiments/${draft.id}`)
  if ((await ref.get()).exists) throw Error('Existing production definition found; refusing overwrite')
  const saved = await saveExperiment(draft, 'release1-approved-deployment', 0, () => database)
  const result = {project:'flow-9d714',id:saved.id,status:saved.status,publicationApproved:saved.publicationApproved,enrollmentEnabled:saved.enrollmentEnabled,durationNights:saved.durationNights,introVideoConfigured:!!saved.introVideoUrl,resultsVideoConfigured:!!saved.wrapUpVideoUrl,revision:saved.revision}
  writeFileSync('C:/Users/akpoo/StudioProjects/flow/release/mina-release-1/production-brown-noise-draft-result.json', JSON.stringify(result,null,2))
  console.log(JSON.stringify(result))
}
main().catch((e)=>{console.error(String(e.message).replace(/[\w.+-]+@[\w.-]+/g,'[redacted]').replace(/ya29\.[\w.-]+/g,'[redacted-token]').replace(/AIza[\w-]+/g,'[redacted-key]'));process.exitCode=1})


