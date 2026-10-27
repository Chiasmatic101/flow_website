import 'server-only'
import { createHash } from 'node:crypto'
import type { Experiment } from '../mina-experiments'
import { validateSevenNight, capabilityIssues, protocolIssues, type ExecutionCapabilities } from '../mina-protocol'
import { FunnelError } from '../championship-validation'
export const CAPABILITIES_PATH = 'minaExecutionCapabilities/flutter'
type DefinitionInput = Pick<Experiment, 'id' | 'protocolType' | 'protocolVersion' | 'durationNights' | 'protocol' | 'eligibility' | 'consentReference' | 'instructions'>
export function protocolDefinition(e: DefinitionInput) {
  return { schemaVersion: 1, experimentId: e.id, protocolType: e.protocolType, protocolVersion: e.protocolVersion, durationNights: e.durationNights, protocol: e.protocol, eligibility: e.eligibility, consentReference: e.consentReference, instructions: e.instructions }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}
export function protocolHash(e: DefinitionInput) { return createHash('sha256').update(canonical(protocolDefinition(e))).digest('hex') }
export function assertProtocolReviewable(e: DefinitionInput) {
  if (!e.protocol?.enrollment || e.protocol.enrollment.minimumAge < 18 || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(e.protocolVersion) || !e.eligibility || !e.consentReference || !e.instructions || protocolIssues(e.protocol, e.durationNights).length) throw new FunnelError('incomplete_protocol')
}
export function assertExecutable(e: Experiment, capabilities: ExecutionCapabilities | null) {
  assertProtocolReviewable(e)
  if (e.protocolType === 'brown-noise-seven-night-v1') validateSevenNight(e)
  const hash = protocolHash(e)
  if (!e.protocolReview || e.protocolReview.hash !== hash || e.protocolHash !== hash) throw new FunnelError('protocol_review_required', 409)
  const stagingCandidate = process.env.FIREBASE_PROJECT_ID === 'flux-staging-1' && e.environment === 'staging' && e.visibility === 'internal' && e.status === 'testing'
  if (capabilityIssues(e.protocol, capabilities, { stagingCandidate }).length) throw new FunnelError('flutter_capabilities_unverified_or_unsupported', 409)
}
