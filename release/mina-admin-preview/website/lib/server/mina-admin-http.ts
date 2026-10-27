import 'server-only'
import { FunnelError } from '../championship-validation'
import { PublicationValidationError } from './mina-protocol'
import { json } from './championship-http'
export function adminFailure(error: unknown) {
  const e = error instanceof FunnelError ? error : new FunnelError('service_unavailable', 503)
  return json({ error: e.code, message: e.code.replaceAll('_', ' '), ...(e instanceof PublicationValidationError ? { issues: e.issues } : {}) }, e.status)
}
