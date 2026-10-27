import 'server-only'
import { championshipService } from './championship-service'
import { firestoreStore } from './championship-store'
import { resendMailer } from './championship-email'
import { FunnelError } from '../championship-validation'

export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL
  if (!value) {
    if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'
    throw new FunnelError('backend_not_configured', 503)
  }
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error()
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error()
    return url.origin
  } catch { throw new FunnelError('backend_not_configured', 503) }
}
export function championshipBackend() {
  return championshipService({ store: firestoreStore(), mailer: resendMailer(), siteUrl, development: process.env.NODE_ENV === 'development' })
}
