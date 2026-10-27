import { FunnelError } from './championship-validation'

export const activityTypes = ['audio.playback', 'audio.silence', 'cognitive.task', 'survey', 'check_in'] as const
export type ProtocolActivity = { id: string; type: string; version: number; audioUrl: string; soundId?: string; durationSeconds: number; sessionMode?: 'timed' | 'overnight'; taskId: string; questionIds: string[] }
export type ProtocolQuestion = { id: string; prompt: string; type: 'boolean' | 'scale' | 'single_choice' | 'text'; required: boolean; options: string[]; min: number; max: number; step?: number; labels?: string[] }
export type ProtocolEnrollment = { mode?: 'personal' | 'research'; aggregateResults?: boolean; schemaVersion: 1; minimumAge: number; consentVersion: string; consentText: string; requirements: { id: string; prompt: string }[] }
export type DeclarativeProtocol = {
  schemaVersion: 1;
  enrollment?: ProtocolEnrollment;
  sessionPolicy?: { schemaVersion: 1; mode: 'user_controlled'; minimumIntervalSeconds: number };
  conditions: { id: string; label: string; activityIds: string[]; weight: number }[];
  activities: ProtocolActivity[];
  questions: ProtocolQuestion[];
  nightlySchedule: { night: number; phase: 'evening' | 'morning'; conditionId: string; activityIds: string[] }[];
  randomization: { method: 'none' | 'weighted' | 'paired_crossover'; unit: 'participant' | 'night'; allocationOwner: 'server'; pairs?: { nights: [number, number]; conditionIds: [string, string] }[] };
}
// This describes a verified interpreter, never a catalog of hardcoded experiments.
export type ExecutionCapabilities = {
  schemaVersion: 1; verified: boolean; appBuild: string; verifiedAt: string;
  protocolSchemaVersions: number[]; activityVersions: Record<string, number[]>;
  cognitiveTaskIds: string[]; questionTypes: string[]; randomizationMethods: string[]; randomizationUnits: string[];
  audioAssets?: { id: string; label: string; url: string }[];
  cognitiveTasks?: { id: string; label: string }[];
  questionDefinitions?: ProtocolQuestion[];
  sessionModes?: string[];
  scheduleSemantics?: string[];
  bundledSoundIds?: string[];
  bundledAssets?: { id: string; sha256: string }[];
  enrollmentSchemaVersions?: number[];
  enrollmentModes?: string[];
  personalChallengeVerification?: { verified: boolean; appBuild: string; verifiedAt: string; evidence: string; features: string[] };
  stagingCandidate?: boolean;
  questionFeatures?: string[];
  androidVerification?: { verified: boolean; appBuild: string; verifiedAt: string; evidence: string; features: string[] };
  localTestOnly?: boolean;
}
export function emptyProtocol(): DeclarativeProtocol {
  return { schemaVersion: 1, conditions: [], activities: [], questions: [], nightlySchedule: [], randomization: { method: 'none', unit: 'participant', allocationOwner: 'server' } }
}
export function brownNoiseExample(): DeclarativeProtocol {
  return { ...emptyProtocol(), conditions: [{ id: 'brown-noise', label: 'Brown noise (proposed)', activityIds: ['sound'], weight: 1 }, { id: 'silence', label: 'Silence (proposed)', activityIds: ['quiet'], weight: 1 }], activities: [
    { id: 'sound', type: 'audio.playback', version: 1, audioUrl: '', durationSeconds: 0, taskId: '', questionIds: [] },
    { id: 'quiet', type: 'audio.silence', version: 1, audioUrl: '', durationSeconds: 0, taskId: '', questionIds: [] },
  ] }
}
const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw new FunnelError('invalid_protocol'); return v as Record<string, unknown> }
const str = (v: unknown, max = 200) => { if (typeof v !== 'string' || v.length > max) throw new FunnelError('invalid_protocol_text'); return v.trim() }
const key = (v: unknown) => { const s = str(v, 100); if (!/^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/.test(s) || ['none', 'assigned'].includes(s)) throw new FunnelError('invalid_protocol_identifier'); return s }
const num = (v: unknown, min: number, max: number, integer = true) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) throw new FunnelError('invalid_protocol_number'); return v }
const array = (v: unknown, max: number): unknown[] => { if (!Array.isArray(v) || v.length > max) throw new FunnelError('invalid_protocol_list'); return v }
const ids = (v: unknown) => { const values = array(v, 100).map(key); if (new Set(values).size !== values.length) throw new FunnelError('duplicate_protocol_reference'); return values }
const unique = (v: { id: string }[]) => { if (new Set(v.map(item => item.id)).size !== v.length) throw new FunnelError('duplicate_protocol_identifier') }
export function httpsAudioUrl(value: string) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && u.hostname.includes('.') && !/^[\d.]+$/.test(u.hostname) && !u.hostname.includes(':') } catch { return false }
}
export function validateProtocol(value: unknown): DeclarativeProtocol {
  const v = record(value)
  if (v.localTestWindow !== undefined) throw new FunnelError('local_fixture_cannot_publish')
  if (v.schemaVersion !== 1) throw new FunnelError('unsupported_protocol_schema')
  let enrollment: ProtocolEnrollment | undefined
  if (v.enrollment !== undefined) {
    const e = record(v.enrollment)
    if (e.schemaVersion !== 1) throw new FunnelError('unsupported_enrollment_schema')
    if (e.mode !== undefined && !['personal', 'research'].includes(String(e.mode))) throw new FunnelError('invalid_participation_mode')
    if (e.mode === 'personal' && e.minimumAge !== 18) throw new FunnelError('personal_challenge_requires_adult_eligibility')
    if (e.aggregateResults !== undefined && (typeof e.aggregateResults !== 'boolean' || e.mode !== 'personal' || (e.aggregateResults && !/aggregate/i.test(String(e.consentText))))) throw new FunnelError('invalid_aggregate_disclosure')
    const requirements = array(e.requirements, 30).map(item => { const r = record(item); return { id: key(r.id), prompt: str(r.prompt, 1000) } })
    unique(requirements)
    enrollment = { ...(e.aggregateResults === undefined ? {} : { aggregateResults: e.aggregateResults as boolean }), ...(e.mode === 'personal' ? { mode: 'personal' as const } : e.mode === 'research' ? { mode: 'research' as const } : {}), schemaVersion: 1, minimumAge: num(e.minimumAge, 18, 120), consentVersion: str(e.consentVersion, 100), consentText: str(e.consentText, 16000), requirements }
  }
  let sessionPolicy: DeclarativeProtocol['sessionPolicy']
  if (v.sessionPolicy !== undefined) {
    const w = record(v.sessionPolicy)
    if (w.schemaVersion !== 1 || w.mode !== 'user_controlled' || enrollment?.mode !== 'personal' || Object.keys(w).some(k => !['schemaVersion', 'mode', 'minimumIntervalSeconds'].includes(k))) throw new FunnelError('invalid_sleep_session_policy')
    sessionPolicy = { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: num(w.minimumIntervalSeconds, 3600, 604800) }
  }
  const activities = array(v.activities, 100).map(item => {
    const a = record(item), audioUrl = str(a.audioUrl, 2000)
    if (audioUrl && !httpsAudioUrl(audioUrl)) throw new FunnelError('invalid_protocol_audio_url')
    const durationSeconds = num(a.durationSeconds, 0, 86400)
    if (a.sessionMode !== undefined && (!['timed', 'overnight'].includes(String(a.sessionMode)) || !['audio.playback', 'audio.silence'].includes(String(a.type)))) throw new FunnelError('invalid_session_mode')
    if (a.sessionMode === 'overnight' && durationSeconds !== 0) throw new FunnelError('overnight_session_has_fixed_duration')
    // Missing mode retains the legacy timed shape, including existing scientific hashes.
    return { id: key(a.id), type: key(a.type), version: num(a.version, 1, 100), audioUrl, ...(a.soundId === undefined ? {} : { soundId: key(a.soundId) }), durationSeconds, ...(a.sessionMode === undefined ? {} : { sessionMode: a.sessionMode as 'timed' | 'overnight' }), taskId: str(a.taskId, 100), questionIds: ids(a.questionIds) }
  })
  const conditions = array(v.conditions, 30).map(item => { const c = record(item); return { id: key(c.id), label: str(c.label), activityIds: ids(c.activityIds), weight: num(c.weight, 0.001, 1000, false) } })
  const questions = array(v.questions, 100).map(item => {
    const q = record(item)
    if (!['boolean', 'scale', 'single_choice', 'text'].includes(String(q.type)) || typeof q.required !== 'boolean') throw new FunnelError('invalid_protocol_question')
    const options = array(q.options, 30).map(o => str(o, 300))
    if (new Set(options).size !== options.length) throw new FunnelError('duplicate_question_option')
    const min = num(q.min, -1000000, 1000000, false), max = num(q.max, -1000000, 1000000, false)
    const step = q.step === undefined ? undefined : num(q.step, 0.000001, 1000000, false)
    const labels = q.labels === undefined ? undefined : array(q.labels, 100).map(x => str(x, 300))
    if ((step !== undefined || labels !== undefined) && q.type !== 'scale') throw new FunnelError('scale_metadata_requires_scale')
    if (labels && (step !== 1 || !Number.isInteger(min) || !Number.isInteger(max) || labels.length !== max - min + 1 || labels.some(x => !x))) throw new FunnelError('invalid_scale_labels')
    return { id: key(q.id), prompt: str(q.prompt, 1000), type: q.type as ProtocolQuestion['type'], required: q.required, options, min, max, ...(step === undefined ? {} : { step }), ...(labels === undefined ? {} : { labels }) }
  })
  unique(activities); unique(conditions); unique(questions)
  const activityIds = new Set(activities.map(a => a.id)), questionIds = new Set(questions.map(q => q.id)), conditionIds = new Set(conditions.map(c => c.id))
  const nightlySchedule = array(v.nightlySchedule, 730).map(item => {
    const s = record(item), conditionId = str(s.conditionId, 100)
    if (!['evening', 'morning'].includes(String(s.phase)) || (!['none', 'assigned'].includes(conditionId) && !conditionIds.has(conditionId))) throw new FunnelError('invalid_schedule_condition_or_phase')
    return { night: num(s.night, 1, 365), phase: s.phase as 'evening' | 'morning', conditionId, activityIds: ids(s.activityIds) }
  })
  if (new Set(nightlySchedule.map(s => `${s.night}:${s.phase}`)).size !== nightlySchedule.length) throw new FunnelError('duplicate_night_phase')
  for (const list of [...conditions.map(c => c.activityIds), ...nightlySchedule.map(s => s.activityIds)]) if (list.some(id => !activityIds.has(id))) throw new FunnelError('unknown_activity_reference')
  for (const a of activities) if (a.questionIds.some(id => !questionIds.has(id))) throw new FunnelError('unknown_question_reference')
  const r = record(v.randomization)
  if (!['none', 'weighted', 'paired_crossover'].includes(String(r.method)) || !['participant', 'night'].includes(String(r.unit)) || r.allocationOwner !== 'server') throw new FunnelError('invalid_randomization')
  if (r.method === 'none' && nightlySchedule.some(s => s.conditionId === 'assigned')) throw new FunnelError('assigned_condition_requires_randomization')
  let pairs: DeclarativeProtocol['randomization']['pairs']
  if (r.method === 'paired_crossover') {
    if (r.unit !== 'night') throw new FunnelError('paired_crossover_requires_night_assignment')
    pairs = array(r.pairs, 182).map(item => {
      const pair = record(item), nights = array(pair.nights, 2).map(n => num(n, 1, 365)), conditionIds = ids(pair.conditionIds)
      if (nights.length !== 2 || nights[0] === nights[1] || conditionIds.length !== 2 || conditionIds.some(id => !conditions.some(c => c.id === id))) throw new FunnelError('invalid_crossover_pair')
      return { nights: nights as [number, number], conditionIds: conditionIds as [string, string] }
    })
    const pairedNights = pairs.flatMap(pair => pair.nights)
    if (!pairs.length || new Set(pairedNights).size !== pairedNights.length) throw new FunnelError('overlapping_or_missing_crossover_pairs')
    if (nightlySchedule.some(s => s.conditionId === 'assigned' && !pairedNights.includes(s.night))) throw new FunnelError('assigned_night_outside_crossover_pairs')
    for (const night of pairedNights) {
      if (!nightlySchedule.some(s => s.night === night && s.conditionId === 'assigned') || nightlySchedule.some(s => s.night === night && !['none', 'assigned'].includes(s.conditionId))) throw new FunnelError('invalid_crossover_night_schedule')
    }
  } else if (r.pairs !== undefined) throw new FunnelError('pairs_require_paired_crossover')
  if (sessionPolicy) {
    const nights = [...new Set(nightlySchedule.map(s => s.night))]
    for (const night of nights) {
      const evening = nightlySchedule.filter(s => s.night === night && s.phase === 'evening'), morning = nightlySchedule.filter(s => s.night === night && s.phase === 'morning')
      if (evening.length !== 1 || morning.length !== 1 || morning[0].conditionId !== 'none' || morning[0].activityIds.filter(id => activities.find(a => a.id === id)?.type === 'check_in').length !== 1 || morning[0].activityIds.some(id => !['check_in', 'survey', 'cognitive.task'].includes(activities.find(a => a.id === id)?.type || ''))) throw new FunnelError('invalid_sleep_session_plan')
      const slot = evening[0], possible = slot.conditionId === 'assigned' ? conditions : conditions.filter(c => c.id === slot.conditionId)
      if (!possible.length || possible.some(c => { const list = [...c.activityIds, ...slot.activityIds], a = activities.find(a => a.id === list[0]); return list.length !== 1 || !a?.type.startsWith('audio.') || a.sessionMode !== 'overnight' })) throw new FunnelError('invalid_sleep_session_plan')
    }
  }
  return { schemaVersion: 1, ...(sessionPolicy ? { sessionPolicy } : {}), ...(enrollment ? { enrollment } : {}), activities, conditions, questions, nightlySchedule, randomization: { method: r.method as DeclarativeProtocol['randomization']['method'], unit: r.unit as 'participant' | 'night', allocationOwner: 'server', ...(pairs ? { pairs } : {}) } }
}
export function protocolIssues(protocol: DeclarativeProtocol, durationNights: number): string[] {
  const issues: string[] = []
  if (protocol.enrollment && (!protocol.enrollment.consentText || !protocol.enrollment.consentVersion || protocol.enrollment.requirements.some(r => !r.prompt))) issues.push('Complete structured consent and eligibility.')
  if (!Number.isInteger(durationNights) || durationNights < 1) issues.push('Set a duration of at least one night.')
  for (let night = 1; night <= durationNights; night++) if (!protocol.nightlySchedule.some(s => s.night === night)) issues.push(`Night ${night} has no schedule.`)
  if (protocol.nightlySchedule.some(s => s.night > durationNights)) issues.push('Schedule extends beyond the duration.')
  if (!protocol.activities.length || !protocol.nightlySchedule.length) issues.push('Add activities and a nightly schedule.')
  for (const c of protocol.conditions) if (!c.label || !c.activityIds.length) issues.push(`Condition ${c.id} needs a label and activities.`)
  for (const a of protocol.activities) {
    if (a.type === 'audio.playback' && !a.audioUrl && !a.soundId) issues.push(`Activity ${a.id} needs a hosted audio URL or bundled sound ID.`)
    if (a.soundId && (a.type !== 'audio.playback' || a.audioUrl)) issues.push(`Activity ${a.id} must select exactly one audio source.`)
    if (['audio.playback', 'audio.silence', 'cognitive.task'].includes(a.type) && a.sessionMode !== 'overnight' && !a.durationSeconds) issues.push(`Activity ${a.id} needs a duration.`)
    if (a.type === 'cognitive.task' && !a.taskId) issues.push(`Activity ${a.id} needs a cognitive task ID.`)
    if (['survey', 'check_in'].includes(a.type) && !a.questionIds.length) issues.push(`Activity ${a.id} needs questions.`)
  }
  for (const q of protocol.questions) {
    if (!q.prompt) issues.push(`Question ${q.id} needs a prompt.`)
    if (q.type === 'scale' && q.min >= q.max) issues.push(`Question ${q.id} needs increasing scale bounds.`)
    if (q.type === 'single_choice' && (q.options.length < 2 || q.options.some(o => !o))) issues.push(`Question ${q.id} needs at least two nonempty choices.`)
  }
  for (const s of protocol.nightlySchedule) if (s.conditionId === 'none' && !s.activityIds.length) issues.push(`Night ${s.night} ${s.phase} has nothing to execute.`)
  if (protocol.randomization.method === 'weighted' && (!protocol.conditions.length || !protocol.nightlySchedule.some(s => s.conditionId === 'assigned'))) issues.push('Randomization requires conditions and an assigned-condition schedule entry.')
  if (protocol.randomization.pairs?.some(pair => pair.nights.some(n => n > durationNights))) issues.push('A randomized pair extends beyond the experiment duration.')
  return issues
}
export function capabilityIssues(protocol: DeclarativeProtocol, capabilities: ExecutionCapabilities | null, options: { stagingCandidate?: boolean } = {}): string[] {
  const stagingCandidate = options.stagingCandidate === true && capabilities?.stagingCandidate === true && capabilities.verified === false && capabilities.localTestOnly !== true
  // Stage 6B must verify end/recording semantics before adding any overnight capability path.
  const evidence = capabilities?.androidVerification
  const overnightVerified = evidence?.verified === true && evidence.appBuild === capabilities?.appBuild && Number.isFinite(Date.parse(evidence.verifiedAt)) && typeof evidence.evidence === 'string' && !!evidence.evidence.trim() && Array.isArray(evidence.features) && ['overnight-playback', 'overnight-silence', 'process-recovery', 'alarm-isolation'].every(f => evidence.features.includes(f))
  const issues: string[] = protocol.activities.some(a => a.sessionMode === 'overnight') && !overnightVerified && !stagingCandidate ? ['Overnight sessions require recorded Android verification of playback, silence, recovery and alarm isolation.'] : []
  if (capabilities?.localTestOnly) issues.push('Local emulator capabilities cannot authorize publication.')
  const personal = capabilities?.personalChallengeVerification
  const personalVerified = capabilities?.enrollmentModes?.includes('personal-challenge-v1') && personal?.verified === true && personal.appBuild === capabilities.appBuild && Number.isFinite(Date.parse(personal.verifiedAt)) && !!personal.evidence?.trim() && ['start-challenge', 'skip-night', 'private-results', 'account-isolation', 'stop-delete'].every(f => personal.features?.includes(f))
  if (protocol.sessionPolicy && !stagingCandidate && (!personalVerified || !['flexible-sleep-start-finish', 'sleep-session-recovery', 'late-linked-check-in'].every(f => personal?.features?.includes(f)))) issues.push('Flexible sleep sessions require build-specific Android session verification.')
  if (protocol.enrollment?.mode === 'personal' && !personalVerified && !(stagingCandidate && capabilities?.enrollmentModes?.includes('personal-challenge-v1'))) issues.push('Personal challenge start, skip and results require build-specific verification.')
  if (!capabilities || capabilities.schemaVersion !== 1 || (!stagingCandidate && capabilities.verified !== true) || typeof capabilities.appBuild !== 'string' || !capabilities.appBuild.trim() || (!stagingCandidate && (typeof capabilities.verifiedAt !== 'string' || !Number.isFinite(Date.parse(capabilities.verifiedAt))))) return [...issues, 'Flutter execution capabilities have not been verified.']
  const supports = (list: unknown, value: unknown) => Array.isArray(list) && list.includes(value)
  if (!supports(capabilities.protocolSchemaVersions, protocol.schemaVersion)) issues.push('Flutter does not support this protocol schema version.')
  if (protocol.enrollment && !supports(capabilities.enrollmentSchemaVersions, 1)) issues.push('Flutter does not support structured consent and eligibility.')
  if (!supports(capabilities.scheduleSemantics, protocol.sessionPolicy ? 'user-controlled-sleep-v1' : 'local-evening-following-morning-v1')) issues.push('Flutter schedule boundaries and participant timezone semantics have not been verified.')
  for (const a of protocol.activities) {
    if (!supports(capabilities.activityVersions?.[a.type], a.version)) issues.push(`Flutter does not support ${a.type} v${a.version}.`)
    if (['audio.playback', 'audio.silence'].includes(a.type) && !supports(capabilities.sessionModes, a.sessionMode || 'timed')) issues.push('Flutter does not support this audio session mode.')
    if (a.type === 'cognitive.task' && !supports(capabilities.cognitiveTaskIds, a.taskId)) issues.push(`Flutter does not support cognitive task ${a.taskId}.`)
    if (a.type === 'audio.playback' && (a.soundId ? !supports(capabilities.bundledSoundIds, a.soundId) : !capabilities.audioAssets?.some(asset => asset.url === a.audioUrl && httpsAudioUrl(asset.url)))) issues.push('Choose an audio asset verified for the Flux app.')
    if (a.type === 'audio.playback' && a.soundId && !capabilities.bundledAssets?.some(asset => asset.id === a.soundId && /^[a-f0-9]{64}$/.test(asset.sha256))) issues.push('Bundled audio requires a verified immutable file digest.')
  }
  for (const q of protocol.questions) if (!supports(capabilities.questionTypes, q.type)) issues.push(`Flutter does not support ${q.type} questions.`)
  if (protocol.questions.some(q => q.step !== undefined || q.labels !== undefined) && !supports(capabilities.questionFeatures, 'scale-labels-step-v1')) issues.push('Flutter has not verified labelled discrete scales.')
  if (!supports(capabilities.randomizationMethods, protocol.randomization.method) || !supports(capabilities.randomizationUnits, protocol.randomization.unit)) issues.push('Flutter does not support this randomization configuration.')
  return [...new Set(issues)]
}

export function validateSevenNight(d: { protocol: DeclarativeProtocol; durationNights: number }) {
  const p = d.protocol, r = p.randomization;
  const bad = (): never => { throw new FunnelError('invalid_seven_night_brown_noise_protocol') };
  if (d.durationNights !== 7 || ('localTestWindow' in p) || r.method !== 'paired_crossover' || r.unit !== 'night' || r.pairs?.length !== 3) bad();
  const brown = p.conditions.filter(c => c.activityIds.length === 1 && p.activities.some(a => a.id === c.activityIds[0] && a.type === 'audio.playback' && a.soundId === 'brown_noise' && a.sessionMode === 'overnight'));
  const quiet = p.conditions.filter(c => c.activityIds.length === 1 && p.activities.some(a => a.id === c.activityIds[0] && a.type === 'audio.silence' && a.sessionMode === 'overnight'));
  if (brown.length !== 1 || quiet.length !== 1 || p.conditions.length !== 2 || p.nightlySchedule.length !== 14) bad();
  for (let i = 0; i < 3; i++) {
    const pair = r.pairs![i];
    if (JSON.stringify(pair.nights) !== JSON.stringify([2 + i * 2, 3 + i * 2]) || pair.conditionIds.length !== 2 || !pair.conditionIds.includes(brown[0].id) || !pair.conditionIds.includes(quiet[0].id)) bad();
  }
  for (let night = 1; night <= 7; night++) {
    const evening = p.nightlySchedule.find(s => s.night === night && s.phase === 'evening');
    const morning = p.nightlySchedule.find(s => s.night === night && s.phase === 'morning');
    if (!evening || evening.conditionId !== (night === 1 ? quiet[0].id : 'assigned') || evening.activityIds.length || !morning || morning.conditionId !== 'none') bad();
    const activities = morning!.activityIds.map(id => p.activities.find(a => a.id === id)!);
    if (!activities.some(a => a?.type === 'check_in') || activities.some(a => !['check_in', 'survey', 'cognitive.task'].includes(a?.type || ''))) bad();
    const questions = activities.filter(a => a.type === 'check_in').flatMap(a => a.questionIds).map(id => p.questions.find(q => q.id === id)!);
    if (p.enrollment?.mode === 'personal') {
      if (p.activities.length !== 3 || p.questions.length !== (p.sessionPolicy ? 5 : 4) || activities.length !== 1 || activities[0].type !== 'check_in' || questions.length !== (p.sessionPolicy ? 5 : 4)) bad()
      const expectedPersonal = [
        { id: 'sleep-quality', min: 1, max: 5 }, { id: 'sleep-latency', min: 0, max: 180 },
        { id: 'awakenings', min: 0, max: 30 }, { id: 'restedness', min: 1, max: 5 },
      ]
      for (const expected of expectedPersonal) if (!questions.some(q => q.id === expected.id && q.type === 'scale' && q.required && q.min === expected.min && q.max === expected.max && q.step === 1)) bad()
      if (p.sessionPolicy && !questions.some(q => q.id === 'sleep-duration' && q.type === 'scale' && q.min === 0 && q.max === 1440 && q.step === 1 && !q.required)) bad()
      continue
    }
    const expected = [
      ['How well did you sleep last night?', ['Very poorly', 'Poorly', 'Okay', 'Well', 'Very well']],
      ['How alert do you feel right now?', ['Very sleepy', 'Sleepy', 'Neutral', 'Alert', 'Very alert']],
    ];
    for (const [prompt, labels] of expected) if (!questions.some(q => q.prompt === prompt && q.type === 'scale' && q.required === true && q.min === 1 && q.max === 5 && q.step === 1 && JSON.stringify(q.labels) === JSON.stringify(labels))) bad();
  }
}
