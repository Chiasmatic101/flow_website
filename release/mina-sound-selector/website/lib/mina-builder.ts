import { type Experiment, mediaSource } from './mina-experiments'
import { emptyProtocol, protocolIssues, capabilityIssues, validateProtocol, type DeclarativeProtocol, type ExecutionCapabilities, type ProtocolActivity } from './mina-protocol'

export const builderSteps = ['Choose a challenge', 'Meet Mina', 'Build the challenge', 'Activities & check-ins', 'Review & save']
export const activityNames: Record<string, string> = { 'audio.playback': 'Play a sound', 'audio.silence': 'Silence / no sound', 'cognitive.task': 'Cognitive game', survey: 'Ask survey questions', check_in: 'Morning or evening check-in' }
export function readableName(value: string) { return value.replace(/[._-]+/g, ' ').replace(/^./, c => c.toUpperCase()) }
// Draft asset selection is distinct from runtime/publication verification.
export const bundledMinaSounds = ['brown_noise', 'rain', 'ocean', 'forest', 'winter']
export function bundledSoundOptions(capabilities: ExecutionCapabilities | null) {
  if (capabilities?.schemaVersion !== 1 || !capabilities.appBuild) return []
  return bundledMinaSounds.flatMap(id => {
    const asset = capabilities.bundledAssets?.find(a => a.id === id && /^[a-f0-9]{64}$/.test(a.sha256))
    return capabilities.bundledSoundIds?.includes(id) && asset ? [{ id, label: readableName(id), sha256: asset.sha256 }] : []
  })
}
export function activityName(a: ProtocolActivity, p: DeclarativeProtocol) {
  const condition = p.conditions.find(c => c.activityIds.includes(a.id))
  return condition?.label ? `${condition.label} · ${activityNames[a.type] || 'Additional activity'}` : activityNames[a.type] || readableName(a.type)
}
export function blankExperiment(): Experiment {
  return { visibility: 'internal', enrollmentEnabled: false, id: '', title: '', description: '', explanation: '', introVideoUrl: '', instructionsVideoUrl: '', thumbnailUrl: '', protocolType: 'custom', protocolVersion: '1', durationNights: 0, protocol: emptyProtocol(), protocolHash: '', protocolReview: null, instructions: '', eligibility: '', consentReference: '', status: 'draft', resultsSummary: '', resultsVideoUrl: '', resultsPublished: false, revision: 0, createdAt: '', updatedAt: '', enrollmentStarted: false, firstPublishedAt: null }
}
export function makeExperimentId(title: string, suffix: string) {
  const stem = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65).replace(/-$/, '') || 'mina-test'
  return `${stem}-${suffix.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'draft'}`
}
export function nextProtocolVersion(version: string) {
  const m = version.match(/^(.*?)(\d+)$/)
  return m && m[2].length < 10 ? `${m[1]}${Number(m[2]) + 1}` : `${version.slice(0, 85)}-next`
}
export function duplicateExperiment(source: Experiment): Experiment {
  return { ...source, id: '', title: `${source.title} (copy)`, protocolVersion: nextProtocolVersion(source.protocolVersion), status: 'draft', revision: 0, createdAt: '', updatedAt: '', enrollmentStarted: false, firstPublishedAt: null, enrollmentEnabled: false, publicationApproved: false, protocolHash: '', protocolReview: null, resultsPublished: false, resultsSummary: '', resultsVideoUrl: '' }
}
export function brownNoiseTemplate(): Experiment {
  const e = blankExperiment()
  e.title = 'Does Brown Noise Help You Sleep?'
  e.description = 'Compare brown noise and silence across seven nights, with a short check-in each morning.'
  e.explanation = 'Could brown noise change how you feel after a night’s sleep? Start with a silence baseline. Then compare one brown-noise night and one silence night in each of three two-night pairs. The order within each pair will be assigned by a trusted server. Discover your own patterns. This is personal exploration, not a validated sleep treatment.'
  e.instructions = 'Start Sleep Session whenever you choose. Finish when you wake, then complete the linked check-in at any time. Allow at least 12 hours after finishing before the next session. Brown-noise nights play audio; silence nights do not. Late or missed nights do not expire progress. Keep volume comfortable; skip or stop whenever you like.'
  e.protocolType = 'paired-audio-comparison'
  e.protocol = { ...emptyProtocol(), conditions: [{ id: 'brown-noise', label: 'Brown noise', activityIds: ['brown-noise-audio'], weight: 1 }, { id: 'silence', label: 'Silence', activityIds: ['silence-control'], weight: 1 }], activities: [
    { id: 'brown-noise-audio', type: 'audio.playback', version: 1, audioUrl: '', soundId: 'brown_noise', durationSeconds: 0, sessionMode: 'overnight', taskId: '', questionIds: [] },
    { id: 'silence-control', type: 'audio.silence', version: 1, audioUrl: '', durationSeconds: 0, sessionMode: 'overnight', taskId: '', questionIds: [] },
    { id: 'morning-check-in', type: 'check_in', version: 1, audioUrl: '', durationSeconds: 0, taskId: '', questionIds: ['sleep-quality', 'sleep-latency', 'awakenings', 'restedness'] },
  ], questions: ['sleep-quality', 'alertness'].map(id => ({ id, prompt: '', type: 'text', required: true, options: [], min: 0, max: 0 })) }
  e.protocol.sessionPolicy = { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: 43200 }
  e.protocol.activities.find(a => a.type === 'check_in')!.questionIds.push('sleep-duration')
  e.protocol.enrollment = { aggregateResults: true, mode: 'personal', schemaVersion: 1, minimumAge: 18, consentVersion: 'personal-challenge-v2', consentText: 'Flux saves your assigned nights, server session start/finish times, device-observed playback duration, interruptions, optional sleep estimates and short sleep check-ins to show your personal patterns. Your answers are private app data. Operators can see aggregate condition averages to operate the challenge; this is not permission for generalizable research. You can skip nights, stop tracking, or delete your account and challenge data in Settings.', requirements: [] }
  e.eligibility = 'For Flux users aged 18 or older.'
  e.consentReference = 'personal-challenge-v2'
  e.protocol.questions = [
    { id: 'sleep-quality', prompt: 'How well did you sleep last night?', type: 'scale', required: true, options: [], min: 1, max: 5, step: 1, labels: ['Very poorly', 'Poorly', 'Okay', 'Well', 'Very well'] },
    { id: 'sleep-latency', prompt: 'About how many minutes did it take to fall asleep?', type: 'scale', required: true, options: [], min: 0, max: 180, step: 1 },
    { id: 'awakenings', prompt: 'How many times did you wake during the night?', type: 'scale', required: true, options: [], min: 0, max: 30, step: 1 },
    { id: 'restedness', prompt: 'How rested do you feel this morning?', type: 'scale', required: true, options: [], min: 1, max: 5, step: 1, labels: ['Not at all', 'A little', 'Moderately', 'Well rested', 'Fully rested'] },
  ]
  e.protocol.questions.push({ id: 'sleep-duration', prompt: 'About how many minutes did you sleep? (Your estimate, optional)', type: 'scale', required: false, options: [], min: 0, max: 1440, step: 1 })
  return resizeBrownNoisePlan(e, 7)
}
export function isBrownNoisePlan(e: Experiment) {
  const pairs = e.protocol.randomization.pairs || []
  return e.durationNights >= 3 && e.durationNights % 2 === 1 && pairs.length === (e.durationNights - 1) / 2 && pairs.every((pair, index) => pair.nights[0] === index * 2 + 2 && pair.nights[1] === index * 2 + 3 && pair.conditionIds.includes('brown-noise') && pair.conditionIds.includes('silence')) && e.protocol.randomization.method === 'paired_crossover' && e.protocol.conditions.length === 2 && ['brown-noise', 'silence'].every(id => e.protocol.conditions.some(c => c.id === id)) && e.protocol.nightlySchedule.some(s => s.night === 1 && s.phase === 'evening' && s.conditionId === 'silence')
}
export function resizeBrownNoisePlan(e: Experiment, nights: number): Experiment {
  if (!Number.isInteger(nights) || nights < 3 || nights > 365 || nights % 2 !== 1) throw new Error('Choose an odd number of nights, from 3 to 365: one baseline plus complete two-night pairs.')
  const pairs = Array.from({ length: (nights - 1) / 2 }, (_, i) => ({ nights: [2 + 2 * i, 3 + 2 * i] as [number, number], conditionIds: ['brown-noise', 'silence'] as [string, string] }))
  const morning = e.protocol.nightlySchedule.find(s => s.phase === 'morning')?.activityIds || e.protocol.activities.filter(a => a.type === 'check_in').map(a => a.id)
  const nightlySchedule = Array.from({ length: nights }, (_, i) => [
    { night: i + 1, phase: 'evening' as const, conditionId: i === 0 ? 'silence' : 'assigned', activityIds: e.protocol.nightlySchedule.find(s => s.night === i + 1 && s.phase === 'evening')?.activityIds || [] },
    { night: i + 1, phase: 'morning' as const, conditionId: 'none', activityIds: e.protocol.nightlySchedule.find(s => s.night === i + 1 && s.phase === 'morning')?.activityIds || [...morning] },
  ]).flat()
  return { ...e, durationNights: nights, protocol: { ...e.protocol, nightlySchedule, randomization: { method: 'paired_crossover', unit: 'night', allocationOwner: 'server', pairs } } }
}
export function conditionNightCounts(p: DeclarativeProtocol): Record<string, number> | null {
  if (p.randomization.method === 'weighted') return null
  const counts: Record<string, number> = Object.fromEntries(p.conditions.map(c => [c.id, 0]))
  const seen = new Set<string>()
  for (const s of p.nightlySchedule) if (!['none', 'assigned'].includes(s.conditionId) && !seen.has(`${s.night}:${s.conditionId}`)) { counts[s.conditionId] = (counts[s.conditionId] || 0) + 1; seen.add(`${s.night}:${s.conditionId}`) }
  for (const pair of p.randomization.pairs || []) for (const id of pair.conditionIds) counts[id] = (counts[id] || 0) + 1
  return counts
}
export function scientificSignature(e: Experiment) { return JSON.stringify([e.id, e.protocolType, e.protocolVersion, e.durationNights, e.protocol, e.instructions, e.eligibility, e.consentReference]) }
export function removeBuilderActivity(p: DeclarativeProtocol, id: string): DeclarativeProtocol {
  const removed = p.activities.find(a => a.id === id)
  const activities = p.activities.filter(a => a.id !== id)
  const usedQuestions = new Set(activities.flatMap(a => a.questionIds))
  return { ...p, activities, questions: p.questions.filter(q => !removed?.questionIds.includes(q.id) || usedQuestions.has(q.id)), conditions: p.conditions.map(c => ({ ...c, activityIds: c.activityIds.filter(value => value !== id) })), nightlySchedule: p.nightlySchedule.map(s => ({ ...s, activityIds: s.activityIds.filter(value => value !== id) })) }
}
export type BuilderBlocker = { step: number; message: string }
export function publicationBlockers(e: Experiment, capabilities: ExecutionCapabilities | null, reviewed: boolean): BuilderBlocker[] {
  const blockers: BuilderBlocker[] = []
  const runtimeIssues = capabilityIssues(e.protocol, capabilities, { stagingCandidate: e.environment === 'staging' && e.visibility === 'internal' })
  if (!e.protocol.enrollment || e.protocol.enrollment.minimumAge < 18) blockers.push({ step: 4, message: 'Configure adult eligibility (18+) and the personal-data explanation.' })
  for (const [key, label] of [['title', 'title'], ['description', 'short description'], ['explanation', 'full explanation'], ['eligibility', 'reviewed eligibility information'], ['consentReference', 'versioned privacy information'], ['instructions', 'participant instructions']] as const) if (!e[key].trim()) blockers.push({ step: 2, message: `Add ${label}.` })
  for (const url of [e.introVideoUrl, e.instructionsVideoUrl, e.resultsVideoUrl]) if (url && !mediaSource(url)) blockers.push({ step: 2, message: 'Use a supported HTTPS video URL, or leave the optional video empty.' })
  let structurallyValid = true
  try { validateProtocol(e.protocol) } catch { structurallyValid = false; blockers.push({ step: 3, message: 'Check the plan: every scheduled condition, activity and question must exist, and randomized pairs must contain two distinct nights and conditions.' }) }
  if (structurallyValid) for (let issue of protocolIssues(e.protocol, e.durationNights)) {
    for (const a of e.protocol.activities) issue = issue.replace(`Activity ${a.id}`, activityName(a, e.protocol))
    for (const q of e.protocol.questions) issue = issue.replace(`Question ${q.id}`, readableName(q.id))
    for (const c of e.protocol.conditions) issue = issue.replace(`Condition ${c.id}`, c.label || 'A condition')
    issue = issue.replace('hosted audio URL', 'verified sound').replace('cognitive task ID', 'verified game').replace('needs a prompt', 'needs reviewed question wording')
    blockers.push({ step: /Night|Schedule|schedule|duration|pair|Randomization/.test(issue) ? 3 : 4, message: issue })
  }
  if (e.protocol.activities.some(a => a.sessionMode === 'overnight') && runtimeIssues.some(i => i.startsWith('Overnight'))) blockers.push({ step: 4, message: 'Overnight sessions require Android playback, silence, recovery and alarm-isolation verification.' })
  if (runtimeIssues.length) blockers.push({ step: 4, message: 'The Flux Android app has not been verified to support this experiment’s activities, sounds and randomization.' })
  const used = new Set([...e.protocol.conditions.flatMap(c => c.activityIds), ...e.protocol.nightlySchedule.flatMap(s => s.activityIds)])
  for (const a of e.protocol.activities) if (!used.has(a.id)) blockers.push({ step: 4, message: `Choose when ${activityName(a, e.protocol)} happens, or remove it.` })
  if (!reviewed) blockers.push({ step: 5, message: 'Record a review of the completed experiment plan before publishing.' })
  return blockers
}


// A consumer draft starts with a working, editable sleep plan, not a research form.
export function consumerExperimentTemplate(): Experiment {
  const e = blankExperiment()
  e.protocolType = 'sleep-sound-comparison'
  e.durationNights = 6
  e.eligibility = 'For Flux users aged 18 or older.'
  e.consentReference = 'personal-challenge-v2'
  e.instructions = 'Start when you choose, finish when you wake, then complete your check-in. You can skip or stop at any time. Your personal observations are not proof of medical efficacy.'
  e.protocol = { ...emptyProtocol(),
    enrollment: { aggregateResults: true, mode: 'personal', schemaVersion: 1, minimumAge: 18, consentVersion: e.consentReference, consentText: 'Flux saves your assigned activities, session times, device-observed playback and check-ins to show your private results. You can stop the challenge or delete your account and data in Settings. Operators can see aggregate condition averages to operate the challenge. This does not give permission for research reuse.', requirements: [] },
    sessionPolicy: { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: 43200 },
    conditions: [{ id: 'sound', label: 'Sound', activityIds: ['sound-session'], weight: 1 }, { id: 'silence', label: 'Silence', activityIds: ['silence-session'], weight: 1 }],
    activities: [
      { id: 'sound-session', type: 'audio.playback', version: 1, soundId: '', audioUrl: '', durationSeconds: 0, sessionMode: 'overnight', taskId: '', questionIds: [] },
      { id: 'silence-session', type: 'audio.silence', version: 1, audioUrl: '', durationSeconds: 0, sessionMode: 'overnight', taskId: '', questionIds: [] },
      { id: 'morning-check-in', type: 'check_in', version: 1, audioUrl: '', durationSeconds: 0, taskId: '', questionIds: ['sleep-quality'] },
    ],
    questions: [{ id: 'sleep-quality', prompt: 'How well did you sleep?', type: 'scale', required: true, options: [], min: 1, max: 5, step: 1, labels: ['Very poorly', 'Poorly', 'Okay', 'Well', 'Very well'] }],
    nightlySchedule: Array.from({ length: 6 }, (_, i) => [
      { night: i + 1, phase: 'evening' as const, conditionId: 'assigned', activityIds: [] },
      { night: i + 1, phase: 'morning' as const, conditionId: 'none', activityIds: ['morning-check-in'] },
    ]).flat(),
    randomization: { method: 'weighted', unit: 'night', allocationOwner: 'server' },
  }
  return e
}
// Explicit pairs are configurable without assuming a particular sound or baseline.
export function pairedComparisonPlan(e: Experiment, baseline: boolean): Experiment {
  const ids = e.protocol.conditions.map(c => c.id)
  const offset = baseline ? 1 : 0
  if (ids.length !== 2 || e.durationNights <= offset || (e.durationNights - offset) % 2) throw new Error('Use two conditions and an even number of paired nights, plus an optional baseline.')
  const pairs = Array.from({ length: (e.durationNights - offset) / 2 }, (_, i) => ({ nights: [offset + 1 + 2 * i, offset + 2 + 2 * i] as [number, number], conditionIds: [ids[0], ids[1]] as [string, string] }))
  const checkIns = e.protocol.activities.filter(a => ['check_in', 'survey', 'cognitive.task'].includes(a.type)).map(a => a.id)
  return { ...e, protocol: { ...e.protocol, randomization: { method: 'paired_crossover', unit: 'night', allocationOwner: 'server', pairs }, nightlySchedule: Array.from({ length: e.durationNights }, (_, i) => [
    { night: i + 1, phase: 'evening' as const, conditionId: baseline && i === 0 ? ids[1] : 'assigned', activityIds: [] },
    { night: i + 1, phase: 'morning' as const, conditionId: 'none', activityIds: e.protocol.nightlySchedule.find(s => s.night === i + 1 && s.phase === 'morning')?.activityIds || checkIns },
  ]).flat() } }
}

export function resizeConsumerPlan(e: Experiment, nights: number): Experiment {
  if (!Number.isInteger(nights) || nights < 1 || nights > 365) throw new Error('Choose a whole number from 1 to 365.')
  const resized = { ...e, durationNights: nights }
  if (e.protocol.randomization.method === 'paired_crossover') return pairedComparisonPlan(resized, e.protocol.nightlySchedule.some(s => s.night === 1 && s.phase === 'evening' && !['none', 'assigned'].includes(s.conditionId)))
  const fallback = e.protocol.nightlySchedule.filter(s => s.night === 1)
  return { ...resized, protocol: { ...e.protocol, nightlySchedule: Array.from({ length: nights }, (_, i) => {
    const existing = e.protocol.nightlySchedule.filter(s => s.night === i + 1)
    return (existing.length ? existing : fallback).map(s => ({ ...s, night: i + 1, activityIds: [...s.activityIds] }))
  }).flat() } }
}
