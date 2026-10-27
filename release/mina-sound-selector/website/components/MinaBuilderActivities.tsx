'use client'
import MinaBundledSoundPicker from './MinaBundledSoundPicker'
import MinaScaleMetadataEditor from './MinaScaleMetadataEditor'
import { activityName, activityNames, readableName, removeBuilderActivity } from '@/lib/mina-builder'
import { activityTypes, type DeclarativeProtocol, type ExecutionCapabilities, type ProtocolActivity, type ProtocolQuestion } from '@/lib/mina-protocol'

function nextId(prefix: string, ids: string[]) { let n = 1; while (ids.includes(`${prefix}-${n}`)) n++; return `${prefix}-${n}` }
function placement(p: DeclarativeProtocol, id: string, nights: number) {
  const conditions = p.conditions.filter(c => c.activityIds.includes(id)), schedule = p.nightlySchedule.filter(s => s.activityIds.includes(id))
  if (conditions.length === 1 && !schedule.length) return `condition:${conditions[0].id}`
  if (!conditions.length && schedule.length === nights && nights > 0 && schedule.every(s => s.phase === schedule[0].phase) && new Set(schedule.map(s => s.night)).size === nights) return `every:${schedule[0].phase}`
  return conditions.length || schedule.length ? 'saved' : 'unplaced'
}
export function placeBuilderActivity(p: DeclarativeProtocol, id: string, where: string, nights: number): DeclarativeProtocol {
  if (where === 'saved') return p
  let next: DeclarativeProtocol = { ...p, conditions: p.conditions.map(c => ({ ...c, activityIds: c.activityIds.filter(value => value !== id) })), nightlySchedule: p.nightlySchedule.map(s => ({ ...s, activityIds: s.activityIds.filter(value => value !== id) })) }
  if (where.startsWith('condition:')) next = { ...next, conditions: next.conditions.map(c => c.id === where.slice(10) ? { ...c, activityIds: [...c.activityIds, id] } : c) }
  if (where.startsWith('every:')) {
    const phase = where.slice(6) as 'morning' | 'evening'
    for (let night = 1; night <= nights; night++) {
      const old = next.nightlySchedule.find(s => s.night === night && s.phase === phase)
      next = { ...next, nightlySchedule: old ? next.nightlySchedule.map(s => s === old ? { ...s, activityIds: [...s.activityIds, id] } : s) : [...next.nightlySchedule, { night, phase, conditionId: 'none', activityIds: [id] }] }
    }
  }
  return next
}
export default function MinaBuilderActivities({ protocol: p, nights, capabilities, locked, onChange }: { protocol: DeclarativeProtocol; nights: number; capabilities: ExecutionCapabilities | null; locked: boolean; onChange: (p: DeclarativeProtocol) => void }) {
  const games = capabilities?.verified ? capabilities.cognitiveTaskIds || [] : []
  const definitions = capabilities?.verified ? capabilities.questionDefinitions || [] : []
  function updateActivity(id: string, patch: Partial<ProtocolActivity>) { onChange({ ...p, activities: p.activities.map(a => a.id === id ? { ...a, ...patch } : a) }) }
  function updateQuestion(id: string, patch: Partial<ProtocolQuestion>) { onChange({ ...p, questions: p.questions.map(q => { if (q.id !== id) return q; const next = { ...q, ...patch }; if (next.type !== 'scale') { delete next.step; delete next.labels } return next }) }) }
  function addQuestion(activity: ProtocolActivity) {
    const id = nextId('question', p.questions.map(q => q.id))
    onChange({ ...p, questions: [...p.questions, { id, prompt: '', type: 'text', required: true, options: [], min: 0, max: 10 }], activities: p.activities.map(a => a.id === activity.id ? { ...a, questionIds: [...a.questionIds, id] } : a) })
  }
  return <div className="builder-stack"><div className="builder-section-heading"><span className="eyebrow">04 / THE PARTICIPANT EXPERIENCE</span><h2>What happens each day?</h2><p className="muted">Choose a sound, a game or a short check-in. You’ll only see settings that apply to that activity.</p></div><fieldset disabled={locked} className="builder-stack"><legend className="sr-only">Activities and check-ins</legend>{p.activities.map((a, index) => <article key={a.id} className="builder-activity"><div className="builder-activity-heading"><div className="builder-activity-number">{String(index + 1).padStart(2, '0')}</div><div><p className="eyebrow">{activityNames[a.type] || 'Saved activity'}</p><h3>{activityName(a, p)}</h3></div><button type="button" className="builder-text-button" onClick={() => onChange(removeBuilderActivity(p, a.id))}>Remove</button></div>
      <label>When does this happen?<select className="email-input" value={placement(p, a.id, nights)} onChange={event => onChange(placeBuilderActivity(p, a.id, event.target.value, nights))}><option value="unplaced">Choose when this happens</option><option value="saved">Custom saved schedule (preserved)</option>{p.conditions.map(c => <option key={c.id} value={`condition:${c.id}`}>Only when {c.label || 'this condition'} is assigned</option>)}<option value="every:evening" disabled={!nights}>Every evening</option><option value="every:morning" disabled={!nights}>Every morning after a study night</option></select></label>
      {a.type === 'audio.playback' && <MinaBundledSoundPicker activity={a} capabilities={capabilities} onChange={patch => updateActivity(a.id, patch)} />}
      {a.type === 'audio.silence' && <p className="builder-note">This is the control condition. No experimental audio is played. The observation window below lets it be compared with a sound session.</p>}
      {a.type === 'cognitive.task' && <label>Choose an existing game<select className="email-input" value={a.taskId} onChange={event => updateActivity(a.id, { taskId: event.target.value })}><option value="">{games.length ? 'Choose a game' : 'No verified games available yet'}</option>{a.taskId && !games.includes(a.taskId) && <option value={a.taskId}>Saved game — awaiting verification</option>}{games.map(id => <option key={id} value={id}>{capabilities?.cognitiveTasks?.find(game => game.id === id)?.label || readableName(id)}</option>)}</select></label>}
      {['audio.playback', 'audio.silence'].includes(a.type) && <label>{a.type === 'audio.silence' ? 'Observation window type' : 'Session duration'}<select className="email-input" value={a.sessionMode || 'timed'} onChange={event => updateActivity(a.id, { sessionMode: event.target.value as 'timed' | 'overnight', durationSeconds: 0 })}><option value="timed">Timed session (minutes)</option><option value="overnight">Overnight sleep session</option></select></label>}
      {a.sessionMode === 'overnight' && <p className="builder-unresolved">{a.type === 'audio.silence' ? 'Overnight observation window — no experimental audio is played.' : 'Overnight sleep session — no fixed number of minutes is assumed.'} Unverified: Stage 6B must confirm reliable Flutter execution and recording before publication. You can save this draft now.</p>}
      {['audio.playback', 'audio.silence', 'cognitive.task'].includes(a.type) && a.sessionMode !== 'overnight' && <label>{a.type === 'audio.silence' ? 'Observation window' : 'Session length'} <span className="builder-label-help">minutes</span><input className="email-input" type="number" min={0} max={1440} step="any" placeholder="To be reviewed" value={a.durationSeconds ? a.durationSeconds / 60 : ''} onChange={event => updateActivity(a.id, { durationSeconds: Math.round(Number(event.target.value) * 60) })} /><small className="builder-label-help">Set the reviewed session duration before publishing.</small></label>}
      {['survey', 'check_in'].includes(a.type) && <div className="builder-stack"><p className="builder-note">Morning check-ins happen after the numbered night. Questions below are included in the protocol review.</p>{a.questionIds.map(id => {
        const q = p.questions.find(question => question.id === id)
        if (!q) return <p className="builder-error" key={id}>A saved question could not be found. Fix this reference in Advanced Settings before saving.</p>
        const verified = definitions.some(d => d.prompt === q.prompt && d.type === q.type && JSON.stringify(d.options) === JSON.stringify(q.options) && d.min === q.min && d.max === q.max)
        return <div className="builder-question" key={id}><div className="flex justify-between gap-3"><h4>{readableName(q.id)}</h4><span className={verified ? 'builder-verified' : 'builder-unresolved'}>{verified ? 'Verified wording' : 'Wording & answer type need review'}</span></div>{definitions.length > 0 && <label>Start with a verified question<select className="email-input" value="" onChange={event => { const d = definitions.find(v => v.id === event.target.value); if (d) updateQuestion(q.id, { ...d, id: q.id }) }}><option value="">Choose from the question library</option>{definitions.map(d => <option key={d.id} value={d.id}>{d.prompt}</option>)}</select></label>}<label>Question wording<textarea className="email-input" rows={2} value={q.prompt} placeholder={`Add reviewed ${readableName(q.id).toLowerCase()} wording`} onChange={event => updateQuestion(q.id, { prompt: event.target.value })} /></label><label>Answer type<select className="email-input" value={q.type} onChange={event => updateQuestion(q.id, { type: event.target.value as ProtocolQuestion['type'] })}><option value="text">Written answer (proposed until reviewed)</option><option value="scale">Number scale</option><option value="single_choice">Choose one answer</option><option value="boolean">Yes / No</option></select></label>{q.type === 'scale' && <div className="builder-two-columns">{(['min', 'max'] as const).map(bound => <label key={bound}>{bound === 'min' ? 'Lowest value' : 'Highest value'}<input className="email-input" type="number" value={q[bound]} onChange={event => updateQuestion(q.id, { [bound]: Number(event.target.value) })} /></label>)}</div>}{q.type === 'scale' && <MinaScaleMetadataEditor question={q} onChange={patch => updateQuestion(q.id, patch)} />}{q.type === 'single_choice' && <label>Answer choices <span className="builder-label-help">one per line</span><textarea className="email-input" rows={3} value={q.options.join('\n')} onChange={event => updateQuestion(q.id, { options: event.target.value.split('\n') })} /></label>}<label className="builder-checkbox"><input type="checkbox" checked={q.required} onChange={event => updateQuestion(q.id, { required: event.target.checked })} />Participant must answer this question</label><button type="button" className="builder-text-button" onClick={() => {
          const activities = p.activities.map(v => v.id === a.id ? { ...v, questionIds: v.questionIds.filter(qid => qid !== id) } : v)
          onChange({ ...p, activities, questions: activities.some(v => v.questionIds.includes(id)) ? p.questions : p.questions.filter(v => v.id !== id) })
        }}>Remove from this check-in</button></div>
      })}{!definitions.length && <p className="builder-note">No verified question definitions are available. The template does not assume an existing Flux question or response scale.</p>}<button className="flux-secondary" type="button" onClick={() => addQuestion(a)}>+ Add a question</button></div>}
      <details className="builder-disclosure"><summary>Advanced activity settings</summary><div className="builder-stack mt-4"><p className="builder-note">These identifiers are kept automatically. Change them only when preparing a supported app capability.</p><p>Internal reference: <code>{a.id}</code></p><label>Activity version<input className="email-input" type="number" min={1} max={100} value={a.version} onChange={event => updateActivity(a.id, { version: Number(event.target.value) })} /></label>{a.type === 'audio.playback' && <label>Candidate audio link <span className="builder-label-help">unverified links remain blocked from publication</span><input className="email-input" value={a.audioUrl} onChange={event => updateActivity(a.id, { audioUrl: event.target.value })} /></label>}</div></details>
    </article>)}<div className="builder-add-activities"><h3>Add something to the participant’s day</h3><div className="builder-activity-choices">{activityTypes.map(type => <button key={type} className="flux-secondary" type="button" onClick={() => {
      const id = nextId('activity', p.activities.map(a => a.id))
      onChange({ ...p, activities: [...p.activities, { id, type, version: 1, audioUrl: '', durationSeconds: 0, taskId: '', questionIds: [] }] })
    }}>+ {activityNames[type]}</button>)}</div></div></fieldset>{locked && <p className="builder-callout">These activities are pinned for existing participants. Make a new draft version to change them.</p>}</div>
}




