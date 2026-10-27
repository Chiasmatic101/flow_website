import 'server-only'
import { FunnelError } from '../championship-validation'
import { json } from './championship-http'
export function adminFailure(error: unknown) {
  const e = error instanceof FunnelError ? error : new FunnelError('service_unavailable', 503)
  return json({ error: e.code, message: e.code.replaceAll('_', ' ') }, e.status)
}
