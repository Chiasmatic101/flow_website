import { experimentId } from './mina-experiments'
import { emptyAcquisition, type SignupInput } from './championship-types'

export class FunnelError extends Error {
  constructor(public code: string, public status = 400, public retryAfter = 0) { super(code) }
}
export function normalizeReferral(value: unknown) {
  if (typeof value !== 'string') return null
  const code = value.trim().toUpperCase()
  return /^FLUX-[A-Z0-9]{6,12}$/.test(code) ? code : null
}
export function validateSignup(value: unknown): SignupInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new FunnelError('invalid_input')
  const input = value as Record<string, unknown>
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || /[\x00-\x1f\x7f]/.test(email)) throw new FunnelError('invalid_email')
  if (input.device !== 'android' && input.device !== 'iphone') throw new FunnelError('invalid_device')
  if (input.consent !== true) throw new FunnelError('consent_required')
  if (input.purpose !== undefined && input.purpose !== 'tester') throw new FunnelError('invalid_input')
  if (input.purpose === 'tester' && input.experimentId !== undefined) throw new FunnelError('invalid_input')
  const acquisition = { ...emptyAcquisition }
  if (input.acquisition !== undefined) {
    if (!input.acquisition || typeof input.acquisition !== 'object' || Array.isArray(input.acquisition)) throw new FunnelError('invalid_acquisition')
    const source = input.acquisition as Record<string, unknown>
    for (const key of Object.keys(acquisition) as (keyof typeof acquisition)[]) {
      const item = source[key]
      if (item == null || item === '') continue
      if (typeof item !== 'string' || item.length > (key === 'referrerUrl' ? 500 : 200) || /[\x00-\x1f\x7f]/.test(item)) throw new FunnelError('invalid_acquisition')
      if (key === 'referrerUrl') {
        try { const url = new URL(item); if (!['https:', 'http:'].includes(url.protocol)) throw new Error(); acquisition[key] = url.origin + url.pathname }
        catch { throw new FunnelError('invalid_acquisition') }
      } else acquisition[key] = item.trim()
    }
  }
  return { ...(input.purpose === 'tester' ? { purpose: 'tester' as const } : {}), ...(input.experimentId !== undefined ? { experimentId: experimentId(input.experimentId) } : {}), email, device: input.device, consent: true, referralCode: normalizeReferral(input.referralCode), acquisition }
}
