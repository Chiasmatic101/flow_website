import { consumerExperimentTemplate, brownNoiseTemplate, resizeConsumerPlan, pairedComparisonPlan } from './mina-builder'
import type { Experiment } from './mina-experiments'
import type { ExecutionCapabilities } from './mina-protocol'

export const sharedConsumerDisclosure = 'Flux saves your assigned activities, challenge progress, server session start and end times, available playback and interruption telemetry, short sleep check-ins, optional self-reported sleep estimates and cognitive game scores to show your private personal results. Elapsed session time is not measured sleep. Operators can see aggregate condition averages to operate the challenge; this does not authorize generalizable research. You can skip, stop the challenge, or delete your account and challenge data in Settings.'

export const creatorTemplates = {
  comparison: 'Overnight sound comparison', single: 'Single sound challenge',
  checkin: 'Daily check-in', cognitive: 'Cognitive game challenge',
} as const
export type CreatorTemplate = keyof typeof creatorTemplates
export function inferTemplate(e: Experiment): CreatorTemplate {
  if (e.protocol.activities.some(a => a.type.startsWith('audio.'))) return e.protocol.conditions.length > 1 ? 'comparison' : 'single'
  return e.protocol.activities.some(a => a.type === 'cognitive.task') ? 'cognitive' : 'checkin'
}
// Existing saved definitions are loaded unchanged. Templates are applied only on
// creation or an explicit template change; participant versions are never migrated.
export function creatorTemplate(kind: CreatorTemplate, capabilities: ExecutionCapabilities | null): Experiment {
  let e = brownNoiseTemplate()
  e = { ...e, title: '', description: '', explanation: '', visibility: 'internal', enrollmentEnabled: false }
  e.consentReference = 'personal-challenge-v3'
  e.protocol.enrollment = { ...e.protocol.enrollment!, consentVersion: e.consentReference, consentText: sharedConsumerDisclosure }
  e.instructions = 'Tap Start Night at your preferred bedtime, then End Night when you choose. Complete the linked check-in afterwards. You may skip a night or stop at any time. Session elapsed time is not measured sleep duration.'
  if (kind === 'comparison') return e
  e.protocolType = `consumer-${kind}-v1`
  e.protocol.randomization = { method: 'none', unit: 'night', allocationOwner: 'server' }
  if (kind === 'single') {
    e.protocol.conditions = e.protocol.conditions.slice(0, 1)
    e.protocol.activities = e.protocol.activities.filter(a => a.type !== 'audio.silence')
    e.protocol.nightlySchedule = e.protocol.nightlySchedule.map(s => s.phase === 'evening' ? { ...s, conditionId: 'brown-noise' } : s)
  } else {
    e.instructions = kind === 'checkin' ? 'Open your daily activity in Flux and complete the short sleep check-in. You can skip or stop at any time.' : 'Open your daily activity in Flux and play the assigned cognitive game. Scores are personal observations, not a health assessment.'
    delete e.protocol.sessionPolicy
    e.protocol.conditions = []
    e.protocol.activities = e.protocol.activities.filter(a => a.type === 'check_in')
    let id = 'morning-check-in'
    if (kind === 'cognitive') {
      id = 'daily-game'
      e.protocol.activities = [{ id, type: 'cognitive.task', version: 1, audioUrl: '', durationSeconds: 60, taskId: capabilities?.cognitiveTaskIds?.[0] || '', questionIds: [] }]
      e.protocol.questions = []
    }
    e.protocol.nightlySchedule = Array.from({ length: 7 }, (_, i) => ({ night: i + 1, phase: 'evening', conditionId: 'none', activityIds: [id] }))
  }
  return e
}
export function resizeCreator(e: Experiment, nights: number) {
  // Comparisons default to a baseline for odd lengths, otherwise complete pairs.
  if (e.protocol.conditions.length === 2 && e.protocol.randomization.method === 'paired_crossover') return pairedComparisonPlan({ ...e, durationNights: nights }, nights % 2 === 1)
  return resizeConsumerPlan(e, nights)
}
export function setCreatorSound(e: Experiment, conditionIndex: number, soundId: string): Experiment {
  const condition = e.protocol.conditions[conditionIndex]
  if (!condition) return e
  return { ...e, protocol: { ...e.protocol, conditions: e.protocol.conditions.map((c, i) => i === conditionIndex ? { ...c, label: soundId === 'silence' ? 'Silence' : soundId.replaceAll('_', ' ') } : c), activities: e.protocol.activities.map(a => condition.activityIds.includes(a.id) ? { ...a, type: soundId === 'silence' ? 'audio.silence' : 'audio.playback', soundId: soundId === 'silence' ? undefined : soundId, audioUrl: '' } : a) } }
}
export function withMorningGame(e: Experiment, taskId: string): Experiment {
  const id = 'optional-morning-game'
  const activities = e.protocol.activities.filter(a => a.id !== id)
  if (taskId) activities.push({ id, type: 'cognitive.task', version: 1, audioUrl: '', durationSeconds: 60, taskId, questionIds: [] })
  return { ...e, ...(taskId ? { consentReference: 'personal-challenge-v3' } : {}), protocol: { ...e.protocol, ...(taskId ? { enrollment: { ...e.protocol.enrollment!, consentVersion: 'personal-challenge-v3', consentText: sharedConsumerDisclosure } } : {}), activities, nightlySchedule: e.protocol.nightlySchedule.map(s => s.phase === 'morning' ? { ...s, activityIds: [...s.activityIds.filter(a => a !== id), ...(taskId ? [id] : [])] } : s) } }
}
export function completeCreatorCopy(e: Experiment): Experiment {
  if (e.protocol.enrollment?.mode !== 'personal') return e
  return { ...e, explanation: e.explanation || `${e.description} This is a personal exploration, not a validated sleep treatment.`, instructions: e.instructions || brownNoiseTemplate().instructions }
}
// Known consumer question wording and data categories reuse the existing shared
// disclosure. Unknown/sensitive custom questions need a separately approved policy.
export function consumerDisclosureIssues(e: Pick<Experiment, 'protocol' | 'consentReference'>): string[] {
  const p = e.protocol
  if (p.enrollment?.mode !== 'personal') return []
  if (!['personal-challenge-v2', 'personal-challenge-v3'].includes(p.enrollment.consentVersion) || e.consentReference !== p.enrollment.consentVersion || p.enrollment.requirements.length) return ['This experiment needs a disclosure or eligibility policy beyond shared Mina Tests onboarding.']
  const knownDisclosures = [sharedConsumerDisclosure, brownNoiseTemplate().protocol.enrollment!.consentText, consumerExperimentTemplate().protocol.enrollment!.consentText, 'Flux saves your assigned nights, server session start/finish times, device-observed playback duration, interruptions and optional sleep-duration estimates and short sleep check-ins to show your personal patterns. Your answers are private app data, not automatically included in generalizable research. You can skip nights, stop tracking, or delete your account and challenge data in Settings. Operators can see aggregate condition averages to operate the challenge. This is not permission for generalizable research.']
  if (p.activities.some(a => a.type === 'cognitive.task') && p.enrollment.consentVersion !== 'personal-challenge-v3') return ['Cognitive games need the shared disclosure including game scores. Create a new draft with the current template.']
  if (!knownDisclosures.includes(p.enrollment.consentText) || (p.enrollment.consentVersion === 'personal-challenge-v3' && p.enrollment.consentText !== sharedConsumerDisclosure)) return ['Use the shared Mina Tests data disclosure. A changed disclosure needs a separate assessment.']
  const standard = brownNoiseTemplate().protocol.questions
  const unknown = p.questions.find(q => !standard.some(s => s.id === q.id && s.prompt === q.prompt && s.type === q.type && s.min === q.min && s.max === q.max))
  return unknown ? [`Question “${unknown.prompt || unknown.id}” needs a disclosure assessment; choose a default sleep question for shared onboarding.`] : []
}
