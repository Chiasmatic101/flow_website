// Explicit operator command. Never called by the application or during signup.
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
const [uid, action] = process.argv.slice(2)
if (!uid || !['grant', 'revoke'].includes(action) || process.env.FIREBASE_PROJECT_ID !== 'flow-9d714' || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Usage: node --env-file=.env.local scripts/mina-admin.mjs FIREBASE_AUTH_UID grant|revoke (project must be flow-9d714; Auth emulator is not allowed)')
}
const { FIREBASE_CLIENT_EMAIL: clientEmail, FIREBASE_PRIVATE_KEY: key } = process.env
const credential = clientEmail && key ? cert({ projectId: 'flow-9d714', clientEmail, privateKey: key.replace(/\\n/g, '\n') }) : applicationDefault()
const auth = getAuth(initializeApp({ projectId: 'flow-9d714', credential }))
const user = await auth.getUser(uid)
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: action === 'grant' })
if (action === 'revoke') await auth.revokeRefreshTokens(uid)
console.log(`Admin access ${action === 'grant' ? 'granted' : 'revoked'}. Sign in again to refresh session claims.`)
