'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mediaSource, publicExperiment, type Experiment } from '@/lib/mina-experiments'
import type { ExecutionCapabilities } from '@/lib/mina-protocol'
import { activityName, bundledSoundOptions, makeExperimentId, nextProtocolVersion, publicationBlockers, scientificSignature } from '@/lib/mina-builder'
import { completeCreatorCopy, creatorTemplate, creatorTemplates, inferTemplate, resizeCreator, setCreatorSound, withMorningGame, type CreatorTemplate } from '@/lib/mina-consumer-creator'
import MinaBuilderDesign from './MinaBuilderDesign'
import MinaBuilderActivities from './MinaBuilderActivities'
import MinaDesignTimeline from './MinaDesignTimeline'
import ExperimentVideo from './ExperimentVideo'
import PublishedExperiment from './PublishedExperiment'

type Counts = { signups: number | null; enrollments: number | null; active: null; completed: number | null; technicalErrors?: number | null; dropouts: number | null; completionRate: number | null }
const steps = ['Describe', 'Configure', 'Preview & Publish']
export default function MinaExperimentBuilder({ initial, counts, capabilities, startStep }: { initial: Experiment; counts?: Counts; capabilities: ExecutionCapabilities | null; startStep?: number }) {
  const router = useRouter()
  const starting = initial.protocol?.activities.length ? initial : { ...creatorTemplate('comparison', capabilities), id: initial.id }
  const [e, setE] = useState(starting), [saved, setSaved] = useState(starting)
  const [step, setStep] = useState(startStep && startStep >= 1 && startStep <= 3 ? startStep : 1)
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  const [previewCondition, setPreviewCondition] = useState('')
  const [androidPreview, setAndroidPreview] = useState('')
  const [preview, setPreview] = useState(false), [pendingRoute, setPendingRoute] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const locked = e.enrollmentStarted || (counts?.enrollments || 0) > 0 || (counts?.signups || 0) > 0
  const dirty = JSON.stringify(e) !== JSON.stringify(saved)
  const nextVersion = !!saved.firstPublishedAt && scientificSignature(e) !== scientificSignature(saved)
  const prepared = completeCreatorCopy(e)
  const blockers = publicationBlockers(prepared, capabilities, true)
  const kind = inferTemplate(e), sounds = bundledSoundOptions(capabilities)
  const games = capabilities?.cognitiveTaskIds || []
  useEffect(() => { if (!dirty) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard) }, [dirty])
  useEffect(() => { if (preview) dialog.current?.showModal(); else dialog.current?.close() }, [preview])
  function change<K extends keyof Experiment>(key: K, value: Experiment[K]) { setE(old => ({ ...old, [key]: value })); setError(''); setMessage('') }
  function navigate(href: string) { if (dirty) setPendingRoute(href); else router.push(href) }
  function configure(changePlan: () => Experiment) { try { setE(changePlan()); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Check the configuration.') } }
  function switchTemplate(value: CreatorTemplate) {
    if (!window.confirm('Replace this draft’s activity plan with the selected template? Your title, description, artwork and videos will stay.')) return
    const template = creatorTemplate(value, capabilities)
    setE(old => ({ ...old, protocol: template.protocol, protocolType: template.protocolType, durationNights: template.durationNights, eligibility: template.eligibility, consentReference: template.consentReference, instructions: template.instructions }))
  }
  async function save(status: Experiment['status'], publish = false) {
    if (busy) return
    if (!e.title.trim()) { setStep(1); setError('Add an experiment title.'); return }
    let payload = { ...completeCreatorCopy(e), id: e.id || makeExperimentId(e.title, crypto.randomUUID()), status }
    if (publish) payload = { ...payload, visibility: 'public', enrollmentEnabled: true }
    if (nextVersion) payload = { ...payload, protocolVersion: nextProtocolVersion(saved.protocolVersion), ...(!publish ? { status: 'draft' as const, enrollmentEnabled: false } : {}) }
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/admin/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experiment: payload, expectedRevision: e.revision }) })
      const data = await response.json()
      if (!response.ok) {
        const known: Record<string, string> = { edit_conflict_reload: 'Another save changed this experiment. Reload before saving; your edits are still here.', protocol_and_consent_locked: 'Participants already use this plan. Duplicate it to change activities.', protocol_version_already_used: 'This version is preserved. Duplicate it or save a new version.', admin_login_required: 'Your admin session expired. Sign in again.', internal_testing_requires_staging_project: 'Internal execution is available only in the staging project.' }
        setError(data.issues?.[0] || known[data.error] || 'Check the experiment configuration and try saving again.'); return
      }
      setE(data); setSaved(data); setMessage(status === 'published' ? 'Published. Eligible Flux users can now join.' : 'Saved. Participant records and assigned versions are preserved.')
      if (!e.revision) router.replace(`/admin/experiments/${data.id}`)
    } catch { setError('Could not connect. Your edits are still here. Please retry.') } finally { setBusy(false) }
  }
  async function prepareAndroidPreview() {
    if (busy || dirty || !e.revision) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/admin/experiments/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experimentId: e.id, expectedRevision: e.revision, conditionId: previewCondition || e.protocol.conditions[0]?.id }) })
      const result = await r.json()
      if (!r.ok) { setError(`Private preview could not be prepared: ${String(result.error || 'service unavailable').replaceAll('_', ' ')}`); return }
      setAndroidPreview(`${result.title}. ${result.instructions}`)
    } catch { setError('Could not connect. Retry private preview.') } finally { setBusy(false) }
  }
  const field = (key: 'title' | 'description' | 'thumbnailUrl' | 'introVideoUrl' | 'resultsVideoUrl' | 'explanation', label: string, multiline = false) => <label>{label}{multiline ? <textarea className="email-input" rows={3} value={e[key]} onChange={event => change(key, event.target.value)} /> : <input className="email-input" value={e[key]} onChange={event => change(key, event.target.value)} />}</label>
  return <div className="mina-builder consumer-creator">
    <header className="builder-header"><button className="builder-text-button" type="button" onClick={() => navigate('/admin/experiments')}>← All experiments</button><div className="builder-header-title"><div><p className="eyebrow">MINA TESTS / CREATE</p><h1>{e.title || 'A new discovery starts here.'}</h1><p className="muted">Describe it. Choose a plan. See what users will see.</p></div><span className="builder-status">{e.status === 'draft' ? 'Private draft' : e.status}</span></div></header>
    <nav aria-label="Experiment creator steps"><ol className="builder-progress">{steps.map((label, i) => <li key={label}><button type="button" aria-current={step === i + 1 ? 'step' : undefined} disabled={busy} onClick={() => setStep(i + 1)}><span>{i + 1}</span><strong>{label}</strong></button></li>)}</ol></nav>
    {pendingRoute && <div className="builder-callout"><p>Your edits have not been saved.</p><button type="button" className="flux-secondary" onClick={() => setPendingRoute('')}>Keep editing</button><button type="button" className="admin-link ml-4" onClick={() => router.push(pendingRoute)}>Discard edits and leave</button></div>}
    {locked && <div className="builder-callout">Participants are using this plan. You can edit its title, artwork and videos; duplicate it to change the activities. <button type="button" className="admin-link" onClick={() => navigate(`/admin/experiments/new?duplicate=${e.id}`)}>Duplicate experiment</button></div>}
    <section className="builder-main"><p className="builder-step-counter">Step {step} of 3</p><form onSubmit={event => { event.preventDefault(); void save(e.status) }}><fieldset disabled={busy} className="builder-form"><legend className="sr-only">{steps[step - 1]}</legend>
      {step === 1 && <div className="builder-stack"><h2>What will users explore?</h2>{field('title', 'Experiment title')}{field('description', 'Short description', true)}{field('thumbnailUrl', 'Cover image · HTTPS image URL (optional)')}{field('introVideoUrl', 'Mina introduction video URL (optional)')}<p className="builder-note">YouTube watch, Shorts and youtu.be links or direct HTTPS MP4/WebM. Leave empty for a text introduction. Videos can be updated later without an app release.</p>{mediaSource(e.introVideoUrl) && <ExperimentVideo url={e.introVideoUrl} title="Mina introduction" />}<label>Number of nights or days<input className="email-input" type="number" min={kind === 'comparison' ? 2 : 1} max={365} disabled={locked} value={e.durationNights} onChange={event => configure(() => resizeCreator(e, Number(event.target.value)))} /></label></div>}
      {step === 2 && <div className="builder-stack"><h2>Choose the experience.</h2><fieldset disabled={locked}><label>Supported template<select className="email-input" value={kind} onChange={event => switchTemplate(event.target.value as CreatorTemplate)}>{Object.entries(creatorTemplates).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        {(kind === 'comparison' || kind === 'single') && <div className="builder-stack mt-5">{e.protocol.conditions.map((c, i) => { const a = e.protocol.activities.find(a => c.activityIds.includes(a.id)); return <label key={c.id}>{i === 0 ? 'Flux sound' : 'Comparison condition'}<select className="email-input" value={a?.type === 'audio.silence' ? 'silence' : a?.soundId || ''} onChange={event => configure(() => setCreatorSound(e, i, event.target.value))}><option value="" disabled>Choose a Flux sound</option>{i > 0 && <option value="silence">Silence · no audio</option>}{a?.soundId && !sounds.some(s => s.id === a.soundId) && <option value={a.soundId} disabled>{a.soundId} · registry unavailable</option>}{sounds.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label> })}<p className="builder-note">Start Night / End Night · no fixed bedtime or duration. Silence starts no audio or foreground service. Sounds use Flux’s bundled media player.</p><label>Morning game (optional)<select className="email-input" value={e.protocol.activities.find(a => a.type === 'cognitive.task')?.taskId || ''} onChange={event => configure(() => withMorningGame(e, event.target.value))}><option value="">No game</option>{games.map(id => <option key={id} value={id}>{capabilities?.cognitiveTasks?.find(g => g.id === id)?.label || id}</option>)}</select></label></div>}
        {kind === 'cognitive' && <label className="block mt-5">Game<select className="email-input" value={e.protocol.activities.find(a => a.type === 'cognitive.task')?.taskId || ''} onChange={event => change('protocol', { ...e.protocol, activities: e.protocol.activities.map(a => a.type === 'cognitive.task' ? { ...a, taskId: event.target.value } : a) })}><option value="" disabled>Choose a supported game</option>{games.map(id => <option key={id}>{id}</option>)}</select></label>}
        {e.protocol.questions.length > 0 && <section className="builder-item mt-5"><h3>{kind === 'checkin' ? 'Daily check-in' : 'Morning check-in'}</h3><p className="builder-note">Four short sleep questions, plus an optional sleep-duration estimate. Sleep duration is self-reported; session elapsed time is not measured sleep.</p><ul>{e.protocol.questions.map(q => <li key={q.id}>{q.prompt}{!q.required && ' · optional'}</li>)}</ul></section>}
        <details className="builder-disclosure mt-5"><summary>Advanced scheduling, assignment & minimum interval</summary><p className="builder-note my-4">Sleep starts are participant-controlled; evening/morning describe ordering, not clock windows. Changes apply only to this draft. Daily activities use the existing app schedule.</p>{e.protocol.sessionPolicy && <label>Minimum hours between the end of one night and the next start<input className="email-input" type="number" min={1} max={168} value={e.protocol.sessionPolicy.minimumIntervalSeconds / 3600} onChange={event => change('protocol', { ...e.protocol, sessionPolicy: { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: Number(event.target.value) * 3600 } })} /></label>}<MinaBuilderDesign value={e} onChange={setE} locked={locked} /><MinaBuilderActivities protocol={e.protocol} nights={e.durationNights} capabilities={capabilities} locked={locked} onChange={p => change('protocol', p)} /></details>
      </fieldset><p className="builder-note">Shared Mina Tests onboarding supplies adult eligibility, privacy information, stop-challenge and deletion controls. App compatibility is checked automatically from the registered build; no per-experiment attestation is needed.</p></div>}
      {step === 3 && <div className="builder-stack"><h2>Here’s their next discovery.</h2><section className="builder-review-summary"><h3>{e.title || 'Your experiment'}</h3><p>{e.description || 'Add a short description.'}</p><MinaDesignTimeline protocol={e.protocol} nights={e.durationNights} /><dl><div><dt>What participants see</dt><dd>Mina’s {e.introVideoUrl ? 'video' : 'text introduction'}, Start Challenge, assigned activities, progress and private results.</dd></div><div><dt>What happens each night or day</dt><dd>{prepared.instructions}</dd></div><div><dt>Questions</dt><dd>{e.protocol.questions.map(q => q.prompt).join(' · ') || 'No questionnaire.'}</dd></div><div><dt>Data collected</dt><dd>{e.protocol.enrollment?.consentText}</dd></div><div><dt>Who can participate</dt><dd>{e.eligibility} Normal Flux sign-in. No invitations or participant cap.</dd></div><div><dt>Activities</dt><dd>{e.protocol.activities.map(a => activityName(a, e.protocol)).join(' · ')}</dd></div></dl></section>
        <button type="button" className="flux-secondary" onClick={() => setPreview(true)}>Preview participant experience</button>
        {e.protocol.sessionPolicy && <section className="builder-item"><h3>Private Android runtime preview</h3><p className="builder-note">Administrator account only · saved draft · separate preview records · no public enrollment. Select a condition for one real session; the seven-night plan is unchanged. Preview expires after 48 hours.</p><label>Condition<select className="email-input" value={previewCondition || e.protocol.conditions[0]?.id || ''} onChange={event => setPreviewCondition(event.target.value)}>{e.protocol.conditions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><button type="button" className="flux-secondary mt-4" disabled={busy || dirty || !e.revision} onClick={prepareAndroidPreview}>Prepare private Android preview</button>{(dirty || !e.revision) && <p className="builder-note">Save the draft first so this preview uses its exact saved configuration.</p>}{androidPreview && <p role="status" className="builder-callout">{androidPreview}</p>}</section>}
        <section className="builder-publishing"><h3>{blockers.length ? 'One more thing before publishing' : 'Ready to publish'}</h3>{blockers.length ? <p role="alert">{blockers[0].message}</p> : <p>Publishing makes this experiment available to eligible Flux users and opens enrollment. Your draft stays private until you choose Publish.</p>}<button type="button" className="flux-button mt-4" disabled={!!blockers.length || busy || ['published', 'testing'].includes(e.status)} onClick={() => save('published', true)}>Publish</button></section>
        <details className="builder-disclosure"><summary>Optional video & introduction details</summary><div className="builder-stack mt-4">{field('resultsVideoUrl', 'Mina results wrap-up video URL (optional)')}{field('explanation', 'Long introduction (optional)', true)}</div></details>
        {e.revision > 0 && <details className="builder-disclosure"><summary>Enrollment & lifecycle</summary><p className="builder-note my-4">Pausing closes new enrollment and preserves existing participants.</p><div className="flex gap-4 flex-wrap"><button type="button" className="flux-secondary" onClick={() => save('paused')}>Pause enrollment</button>{e.status === 'paused' && <button type="button" className="flux-secondary" disabled={!!blockers.length} onClick={() => save('published', true)}>Resume enrollment</button>}<button type="button" className="builder-text-button" onClick={() => save('completed')}>Complete experiment</button><button type="button" className="builder-text-button" onClick={() => save('archived')}>Retire experiment</button></div></details>}
      </div>}
    </fieldset></form></section>
    <footer className="builder-footer"><div className="builder-save-state" role="status">{busy ? 'Saving…' : message || (dirty ? 'Unsaved changes' : 'Drafts stay private until published.')}<span role="alert" className="builder-error">{error}</span></div><div className="builder-footer-actions"><button type="button" className="builder-text-button" disabled={busy || step === 1} onClick={() => setStep(step - 1)}>← Back</button><button type="button" className="flux-secondary" disabled={busy} onClick={() => save(e.status)}>Save {e.status === 'draft' ? 'draft' : 'changes'}</button>{step < 3 && <button type="button" className="flux-button" disabled={busy} onClick={() => setStep(step + 1)}>Continue →</button>}</div></footer>
    <dialog ref={dialog} className="builder-preview-dialog" onClose={() => setPreview(false)}><div className="builder-preview-toolbar"><p>Private preview · current edits · no enrollment</p><button type="button" className="flux-secondary" onClick={() => setPreview(false)}>Close preview</button></div><div className="builder-preview-content"><PublishedExperiment experiment={publicExperiment(prepared)} /></div></dialog>
  </div>
}
