'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mediaSource, minaCopyFields, type Experiment, type MinaCopy } from '@/lib/mina-experiments'
import type { ExecutionCapabilities } from '@/lib/mina-protocol'
import { bundledSoundOptions, makeExperimentId, nextProtocolVersion, publicationBlockers, readableName, scientificSignature } from '@/lib/mina-builder'
import { completeCreatorCopy, creatorTemplate, creatorTemplates, inferTemplate, resizeCreator, setCreatorSound, withMorningGame, type CreatorTemplate } from '@/lib/mina-consumer-creator'
import { statusView, templateMeta } from '@/lib/mina-dashboard'
import MinaBuilderDesign from './MinaBuilderDesign'
import MinaBuilderActivities from './MinaBuilderActivities'
import MinaDesignTimeline from './MinaDesignTimeline'
import ExperimentVideo from './ExperimentVideo'
import MinaPhonePreview, { previewScreens, type PreviewScreen } from './MinaPhonePreview'
import { BackIcon, CheckInIcon, CompareIcon, GameIcon, PhoneIcon, SilenceIcon, WaveIcon } from './MinaIcons'

type Counts = { signups: number | null; enrollments: number | null; active: null; completed: number | null; technicalErrors?: number | null; dropouts: number | null; completionRate: number | null }
const steps = ['Starting point', 'Make it yours', 'What happens', 'Publish'] as const
const screenForStep: PreviewScreen[] = ['intro', 'intro', 'tonight', 'intro']
const templateIcons: Record<CreatorTemplate, React.ReactNode> = { comparison: <CompareIcon size={22} />, single: <WaveIcon size={22} />, checkin: <CheckInIcon size={22} />, cognitive: <GameIcon size={22} /> }

/** Which step fixes a publication blocker; null when it is a system matter. */
function blockerStep(message: string): number | null {
  if (/capability registry|Android build/i.test(message)) return null
  if (/title|description|explanation|video|instructions|eligibility|privacy/i.test(message)) return 2
  return 3
}

export default function MinaExperimentBuilder({ initial, counts, capabilities, startStep }: { initial: Experiment; counts?: Counts; capabilities: ExecutionCapabilities | null; startStep?: number }) {
  const router = useRouter()
  const isNew = !initial.revision
  const starting = initial.protocol?.activities?.length ? initial : { ...creatorTemplate('comparison', capabilities), id: initial.id }
  const [e, setE] = useState<Experiment>(starting), [saved, setSaved] = useState<Experiment>(starting)
  const [step, setStep] = useState(startStep && startStep >= 1 && startStep <= 4 ? startStep : isNew ? 1 : 2)
  const [screen, setScreen] = useState<PreviewScreen>(screenForStep[(startStep && startStep >= 1 && startStep <= 4 ? startStep : isNew ? 1 : 2) - 1])
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('')
  const [previewCondition, setPreviewCondition] = useState('')
  const [androidPreview, setAndroidPreview] = useState('')
  const [pendingRoute, setPendingRoute] = useState('')
  const locked = e.enrollmentStarted || (counts?.enrollments || 0) > 0 || (counts?.signups || 0) > 0
  const dirty = JSON.stringify(e) !== JSON.stringify(saved)
  const nextVersion = !!saved.firstPublishedAt && scientificSignature(e) !== scientificSignature(saved)
  const prepared = completeCreatorCopy(e)
  const blockers = publicationBlockers(prepared, capabilities, true)
  const kind = inferTemplate(e), sounds = bundledSoundOptions(capabilities)
  const games = capabilities?.cognitiveTaskIds || []
  const gameLabel = (id: string) => capabilities?.cognitiveTasks?.find(g => g.id === id)?.label || readableName(id)
  const overnight = kind === 'comparison' || kind === 'single'
  const live = ['published', 'testing'].includes(e.status)
  const status = statusView(e)
  useEffect(() => { if (!dirty) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard) }, [dirty])

  function goTo(next: number) { setStep(next); setScreen(screenForStep[next - 1]); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function change<K extends keyof Experiment>(key: K, value: Experiment[K]) { setE(old => ({ ...old, [key]: value })); setError(''); setMessage('') }
  function setCopy(key: keyof MinaCopy, value: string) { setE(old => ({ ...old, copy: { ...(old.copy || {}), [key]: value } })); setMessage('') }
  function navigate(href: string) { if (dirty) setPendingRoute(href); else router.push(href) }
  function configure(changePlan: () => Experiment) { try { setE(changePlan()); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Check the plan.') } }
  function chooseTemplate(value: CreatorTemplate) {
    if (locked || value === kind) return
    if (!isNew && !window.confirm(`Switch to “${templateMeta[value].title}”? The nights, sounds and questions are replaced. Your title, pitch, pictures, videos and Mina’s lines stay.`)) return
    const template = creatorTemplate(value, capabilities)
    setE(old => ({ ...old, protocol: template.protocol, protocolType: template.protocolType, durationNights: template.durationNights, eligibility: template.eligibility, consentReference: template.consentReference, instructions: template.instructions }))
  }
  async function save(status: Experiment['status'], publish = false) {
    if (busy) return
    if (!e.title.trim()) { goTo(2); setError('Give your test a title first.'); return }
    let payload = { ...completeCreatorCopy(e), id: e.id || makeExperimentId(e.title, crypto.randomUUID()), status }
    if (publish) payload = { ...payload, visibility: 'public', enrollmentEnabled: true }
    if (nextVersion) payload = { ...payload, protocolVersion: nextProtocolVersion(saved.protocolVersion), ...(!publish ? { status: 'draft' as const, enrollmentEnabled: false } : {}) }
    setBusy(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/admin/experiments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experiment: payload, expectedRevision: e.revision }) })
      const data = await response.json()
      if (!response.ok) {
        const known: Record<string, string> = { edit_conflict_reload: 'Someone else saved this test meanwhile. Reload the page — your edits are still here until you do.', protocol_and_consent_locked: 'People are already doing this plan, so the nights and questions can’t change. Duplicate it to make a new version.', protocol_version_already_used: 'This version is kept as it was. Duplicate the test to change it.', admin_login_required: 'You were signed out. Sign in again, then save.', internal_testing_requires_staging_project: 'Internal tests only run in the staging project.', invalid_copy: 'One of Mina’s lines is too long.' }
        setError(data.issues?.[0] || known[data.error] || 'That didn’t save. Check the steps marked below and try again.'); return
      }
      setE(data); setSaved(data); setMessage(status === 'published' ? 'Published! It’s now in Mina Tests for Flux users.' : 'Saved.')
      if (!e.revision) router.replace(`/admin/experiments/${data.id}`)
    } catch { setError('Couldn’t connect. Your edits are still here — try again.') } finally { setBusy(false) }
  }
  function lifecycle(status: Experiment['status'], confirmText: string, publish = false) { if (window.confirm(confirmText)) void save(status, publish) }
  async function prepareAndroidPreview() {
    if (busy || dirty || !e.revision) return
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/admin/experiments/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experimentId: e.id, expectedRevision: e.revision, conditionId: previewCondition || e.protocol.conditions[0]?.id }) })
      const result = await r.json()
      if (!r.ok) { setError(`The phone preview couldn’t be set up: ${String(result.error || 'service unavailable').replaceAll('_', ' ')}`); return }
      setAndroidPreview(`Ready. Open Flux on your phone with your admin account: ${result.title}. ${result.instructions}`)
    } catch { setError('Couldn’t connect. Try the phone preview again.') } finally { setBusy(false) }
  }
  const copyValue = (key: keyof MinaCopy) => e.copy?.[key] || ''
  const lineCount = minaCopyFields.filter(f => copyValue(f.key).trim()).length

  return <div className="md-ui">
    <header className="md-builder-head">
      <div className="md-stack" style={{ gap: 6 }}>
        <button type="button" className="md-btn md-btn-ghost" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => navigate('/admin/experiments')}><BackIcon size={18} />Your tests</button>
        <div className="md-row"><h1 className="md-h1">{e.title || 'New test'}</h1><span className={`md-pill md-pill-${status.tone}`} style={{ background: 'var(--md-soft)' }}>{status.label}</span></div>
      </div>
      <div className="md-row">
        <span className="md-save-state" role="status">{busy ? 'Saving…' : message || (dirty ? 'Unsaved changes' : e.revision ? 'All changes saved' : 'Not saved yet')}</span>
        <button type="button" className="md-btn md-btn-secondary" disabled={busy || (!dirty && !!e.revision)} onClick={() => save(e.status)}>{e.status === 'draft' ? 'Save draft' : 'Save changes'}</button>
      </div>
    </header>

    <nav aria-label="Steps" className="md-steps">{steps.map((label, i) => <button key={label} type="button" className={`md-step ${i + 1 < step ? 'is-done' : ''}`} aria-current={step === i + 1 ? 'step' : undefined} disabled={busy} onClick={() => goTo(i + 1)}><span>{i + 1 < step ? '✓' : i + 1}</span>{label}</button>)}</nav>

    {pendingRoute && <div className="md-alert md-alert-warn md-between" style={{ marginBottom: 16 }}><span>You have unsaved changes.</span><span className="md-row"><button type="button" className="md-btn md-btn-secondary" onClick={() => setPendingRoute('')}>Keep editing</button><button type="button" className="md-btn md-btn-ghost" onClick={() => router.push(pendingRoute)}>Leave without saving</button></span></div>}
    {locked && <div className="md-alert md-alert-info md-between" style={{ marginBottom: 16 }}><span>People are already doing this test. You can still change the title, pitch, pictures, videos and Mina’s lines. To change the nights or questions, duplicate it.</span><button type="button" className="md-btn md-btn-secondary" onClick={() => navigate(`/admin/experiments/new?duplicate=${e.id}`)}>Duplicate</button></div>}
    {error && <p className="md-alert md-alert-bad" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

    <div className="md-builder-layout">
      <form className="md-builder-main" onSubmit={event => { event.preventDefault(); void save(e.status) }}>

        {step === 1 && <section className="md-card md-pad md-stack-lg">
          <div><h2 className="md-h2">What kind of test?</h2><p className="md-sub">Pick a starting point. You can fine-tune everything next.</p></div>
          <div className="md-tiles">{(Object.keys(creatorTemplates) as CreatorTemplate[]).map(id => <button key={id} type="button" className="md-tile" aria-pressed={kind === id} disabled={locked && kind !== id} onClick={() => chooseTemplate(id)}>
            <span className="md-tile-icon">{templateIcons[id]}</span>
            <span className="md-h3">{templateMeta[id].title}</span>
            <span className="md-small">{templateMeta[id].blurb}</span>
            <span className="md-facts">{templateMeta[id].facts.map(f => <span key={f}>{f}</span>)}</span>
          </button>)}</div>
        </section>}

        {step === 2 && <>
          <section className="md-card md-pad md-stack">
            <h2 className="md-h2">The basics</h2>
            <label className="md-field">Title<input className="md-input" maxLength={180} value={e.title} placeholder="Does rain help you fall asleep faster?" onChange={event => change('title', event.target.value)} /></label>
            <label className="md-field">One-line pitch<small>Shown under the title in the app.</small><input className="md-input" maxLength={600} value={e.description} placeholder="Some nights rain, some nights silence — see what works for you." onChange={event => change('description', event.target.value)} /></label>
            <div className="md-grid-2">
              <label className="md-field">Cover picture<small>An HTTPS image link (optional). Without one, the app uses a soft colour.</small><input className="md-input" value={e.thumbnailUrl} placeholder="https://…" onChange={event => change('thumbnailUrl', event.target.value)} /></label>
              <label className="md-field">Mina’s intro video<small>YouTube link or HTTPS MP4 (optional). Change it any time.</small><input className="md-input" value={e.introVideoUrl} placeholder="https://youtu.be/…" onChange={event => change('introVideoUrl', event.target.value)} /></label>
            </div>
            {e.introVideoUrl && !mediaSource(e.introVideoUrl) && <p className="md-alert md-alert-warn">That video link isn’t one the app can play. Use a YouTube or HTTPS MP4 link.</p>}
            {mediaSource(e.introVideoUrl) && <ExperimentVideo url={e.introVideoUrl} title="Mina’s intro" />}
            <label className="md-field">Mina’s wrap-up video<small>Shown with each person’s results (optional).</small><input className="md-input" value={e.resultsVideoUrl} placeholder="https://youtu.be/…" onChange={event => change('resultsVideoUrl', event.target.value)} /></label>
          </section>
          <section className="md-card md-pad md-stack">
            <div><h2 className="md-h2">What Mina says</h2><p className="md-sub">Short lines in Mina’s voice, shown in the app. Leave any blank to use her default. These can change any time — no app update needed.</p></div>
            {minaCopyFields.map(f => <label key={f.key} className="md-field">
              <span className="md-row" style={{ gap: 8 }}>{f.label}<span className="md-count">{copyValue(f.key).length}/{f.max}</span></span>
              {f.max > 200 ? <textarea className="md-textarea" maxLength={f.max} value={copyValue(f.key)} placeholder={f.placeholder} onChange={event => setCopy(f.key, event.target.value)} onFocus={() => setScreen(f.key === 'bedtimeTip' ? 'bedtime' : f.key === 'morningHello' ? 'checkin' : f.key === 'resultsIntro' ? 'results' : 'intro')} />
                : <input className="md-input" maxLength={f.max} value={copyValue(f.key)} placeholder={f.placeholder} onChange={event => setCopy(f.key, event.target.value)} onFocus={() => setScreen(f.key === 'bedtimeTip' ? 'bedtime' : f.key === 'morningHello' ? 'checkin' : f.key === 'resultsIntro' ? 'results' : 'intro')} />}
            </label>)}
            <details className="md-details"><summary>Longer description for the website (optional)</summary><label className="md-field" style={{ marginTop: 8 }}>Longer description<textarea className="md-textarea" rows={4} value={e.explanation} onChange={event => change('explanation', event.target.value)} /></label></details>
          </section>
        </>}

        {step === 3 && <>
          <section className="md-card md-pad md-stack-lg">
            <div className="md-between">
              <div><h2 className="md-h2">{templateMeta[kind].title}</h2><p className="md-sub">How long it runs and what happens each {overnight ? 'night' : 'day'}.</p></div>
              <div className="md-field" style={{ alignItems: 'flex-start' }}>{overnight ? 'Nights' : 'Days'}
                <span className="md-stepper">
                  <button type="button" className="md-btn md-btn-ghost md-icon-btn" aria-label="Fewer" disabled={locked || e.durationNights <= (kind === 'comparison' ? 2 : 1)} onClick={() => configure(() => resizeCreator(e, e.durationNights - 1))}>−</button>
                  <input aria-label={overnight ? 'Number of nights' : 'Number of days'} type="number" min={kind === 'comparison' ? 2 : 1} max={365} disabled={locked} value={e.durationNights} onChange={event => { const n = Number(event.target.value); if (Number.isInteger(n) && n >= 1 && n <= 365) configure(() => resizeCreator(e, n)) }} />
                  <button type="button" className="md-btn md-btn-ghost md-icon-btn" aria-label="More" disabled={locked || e.durationNights >= 365} onClick={() => configure(() => resizeCreator(e, e.durationNights + 1))}>+</button>
                </span>
              </div>
            </div>

            {overnight && e.protocol.conditions.map((c, i) => { const a = e.protocol.activities.find(a => c.activityIds.includes(a.id)); const current = a?.type === 'audio.silence' ? 'silence' : a?.soundId || ''
              return <fieldset key={c.id} className="md-stack" disabled={locked} style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="md-h3" style={{ marginBottom: 10 }}>{i === 0 ? (kind === 'comparison' ? 'The sound to test' : 'The sound') : 'Compare it with'}</legend>
                <div className="md-tiles">
                  {i > 0 && <button type="button" className="md-tile md-tile-sm" aria-pressed={current === 'silence'} onClick={() => configure(() => setCreatorSound(e, i, 'silence'))}><span className="md-tile-icon"><SilenceIcon size={18} /></span><span><strong>Silence</strong><br /><span className="md-tiny">No sound plays</span></span></button>}
                  {sounds.map(s => <button key={s.id} type="button" className="md-tile md-tile-sm" aria-pressed={current === s.id} onClick={() => configure(() => setCreatorSound(e, i, s.id))}><span className="md-tile-icon"><WaveIcon size={18} /></span><strong>{s.label}</strong></button>)}
                  {current && current !== 'silence' && !sounds.some(s => s.id === current) && <button type="button" className="md-tile md-tile-sm" aria-pressed disabled><span className="md-tile-icon"><WaveIcon size={18} /></span><span><strong>{readableName(current)}</strong><br /><span className="md-tiny">Not in the app’s sound list right now</span></span></button>}
                </div>
                {!sounds.length && <p className="md-alert md-alert-warn">The app’s sound list isn’t available right now, so sounds can’t be changed. Check the supported Android build record.</p>}
              </fieldset> })}

            {kind === 'comparison' && <p className="md-alert md-alert-info">Flux decides the order of sound and quiet nights for each person, so the comparison is fair.{e.durationNights % 2 === 1 ? ' Night 1 is a quiet “starting point” night.' : ''}</p>}

            {overnight && <label className="md-field">Morning game (optional)<small>A one-minute game after the check-in.</small>
              <select className="md-select" disabled={locked} value={e.protocol.activities.find(a => a.type === 'cognitive.task')?.taskId || ''} onChange={event => configure(() => withMorningGame(e, event.target.value))}><option value="">No game</option>{games.map(id => <option key={id} value={id}>{gameLabel(id)}</option>)}</select></label>}
            {kind === 'cognitive' && <label className="md-field">The game
              <select className="md-select" disabled={locked} value={e.protocol.activities.find(a => a.type === 'cognitive.task')?.taskId || ''} onChange={event => change('protocol', { ...e.protocol, activities: e.protocol.activities.map(a => a.type === 'cognitive.task' ? { ...a, taskId: event.target.value } : a) })}><option value="" disabled>Choose a game</option>{games.map(id => <option key={id} value={id}>{gameLabel(id)}</option>)}</select></label>}
          </section>

          {e.protocol.questions.length > 0 && <section className="md-card md-pad md-stack">
            <div className="md-between"><h2 className="md-h2">{overnight ? 'Morning check-in' : 'Daily check-in'}</h2><button type="button" className="md-btn md-btn-ghost" onClick={() => setScreen('checkin')}>See it on the phone</button></div>
            <ol className="md-stack" style={{ gap: 8, paddingLeft: 0, listStyle: 'none' }}>{e.protocol.questions.map((q, i) => <li key={q.id} className="md-row" style={{ gap: 10, flexWrap: 'nowrap' }}><span className="md-check-icon md-check-opt">{i + 1}</span><span>{q.prompt}{!q.required && <span className="md-tiny"> · optional</span>}</span></li>)}</ol>
            <p className="md-tiny">These are Mina’s standard sleep questions — they’re covered by the Mina Tests privacy notice, so every test can use them without extra review.</p>
          </section>}

          <section className="md-card md-pad md-stack">
            <h2 className="md-h2">The plan, night by night</h2>
            <MinaDesignTimeline protocol={e.protocol} nights={e.durationNights} />
          </section>

          <details className="md-card md-pad md-details">
            <summary>Advanced settings</summary>
            <div className="md-stack" style={{ marginTop: 12 }}>
              <p className="md-small">For custom designs. People start and end each night themselves; “evening” and “morning” describe the order, not clock times.</p>
              {e.protocol.sessionPolicy && <label className="md-field">Minimum hours between ending one night and starting the next<input className="md-input" type="number" min={1} max={168} disabled={locked} value={e.protocol.sessionPolicy.minimumIntervalSeconds / 3600} onChange={event => change('protocol', { ...e.protocol, sessionPolicy: { schemaVersion: 1, mode: 'user_controlled', minimumIntervalSeconds: Number(event.target.value) * 3600 } })} /></label>}
              <div className="builder-form"><MinaBuilderDesign value={e} onChange={setE} locked={locked} /><MinaBuilderActivities protocol={e.protocol} nights={e.durationNights} capabilities={capabilities} locked={locked} onChange={p => change('protocol', p)} /></div>
            </div>
          </details>
        </>}

        {step === 4 && <>
          <section className="md-card md-pad md-stack">
            <h2 className="md-h2">{live ? 'This test is live' : blockers.length ? 'Almost there' : 'Ready to publish'}</h2>
            <ul className="md-stack" style={{ gap: 10, listStyle: 'none', padding: 0 }}>
              <Check ok={!!e.title.trim()} label="Title" onFix={() => goTo(2)} />
              <Check ok={!!e.description.trim()} label="One-line pitch" onFix={() => goTo(2)} />
              <Check ok={!blockers.some(b => blockerStep(b.message) === 3)} label={`Plan: ${templateMeta[kind].title.toLowerCase()}, ${e.durationNights} ${overnight ? 'nights' : 'days'}`} onFix={() => goTo(3)} />
              <Check ok={!!e.thumbnailUrl} optional label="Cover picture" onFix={() => goTo(2)} />
              <Check ok={!!mediaSource(e.introVideoUrl)} optional label="Mina’s intro video" onFix={() => goTo(2)} />
              <Check ok={lineCount > 0} optional label={`Mina’s lines (${lineCount} of ${minaCopyFields.length})`} onFix={() => goTo(2)} />
            </ul>
            {blockers.length > 0 && <div className="md-alert md-alert-warn md-stack" style={{ gap: 8 }}>
              <strong>Before it can go live:</strong>
              {blockers.map((b, i) => { const target = blockerStep(b.message); return <span key={i} className="md-between" style={{ gap: 8 }}>
                {target ? <span>{b.message}</span> : <span>The Flux app version that runs this kind of test hasn’t been marked as verified yet — that’s a one-time app setup step, not something in this test.<br /><span className="md-tiny">{b.message}</span></span>}
                {target && <button type="button" className="md-btn md-btn-ghost" onClick={() => goTo(target)}>Fix in step {target}</button>}</span> })}
            </div>}
            {!live && <button type="button" className="md-btn md-btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!!blockers.length || busy} onClick={() => lifecycle('published', 'Publish this test? It appears in Mina Tests for Flux users and people can start right away.', true)}>Publish</button>}
            {live && <p className="md-small">Changes to the title, pitch, pictures, videos and Mina’s lines reach the app when you save. {dirty && <strong>You have unsaved changes.</strong>}</p>}
          </section>

          {e.protocol.sessionPolicy && <section className="md-card md-pad md-stack">
            <div className="md-row"><span className="md-tile-icon"><PhoneIcon /></span><div><h2 className="md-h2">Try it on your phone</h2><p className="md-small">Runs one night privately on your own admin account. Nobody else sees it, and it isn’t counted. Expires after 48 hours.</p></div></div>
            {e.protocol.conditions.length > 1 && <label className="md-field">Which night to try<select className="md-select" value={previewCondition || e.protocol.conditions[0]?.id || ''} onChange={event => setPreviewCondition(event.target.value)}>{e.protocol.conditions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}
            <div className="md-row"><button type="button" className="md-btn md-btn-secondary" disabled={busy || dirty || !e.revision} onClick={prepareAndroidPreview}><PhoneIcon size={18} />Send to my phone</button>{(dirty || !e.revision) && <span className="md-tiny">Save first so your phone gets exactly this version.</span>}</div>
            {androidPreview && <p role="status" className="md-alert md-alert-good">{androidPreview}</p>}
          </section>}

          <section className="md-card md-pad md-stack">
            <h2 className="md-h2">More</h2>
            <div className="md-row">
              {e.revision > 0 && <Link className="md-btn md-btn-secondary" href={`/admin/experiments/${e.id}/preview`}>Website page preview</Link>}
              {e.revision > 0 && <button type="button" className="md-btn md-btn-secondary" onClick={() => navigate(`/admin/experiments/new?duplicate=${e.id}`)}>Duplicate</button>}
              {e.status === 'published' && <button type="button" className="md-btn md-btn-secondary" disabled={busy} onClick={() => lifecycle('paused', 'Pause new starts? People already in this test keep going; nobody new can join until you resume.')}>Pause new starts</button>}
              {e.status === 'paused' && <button type="button" className="md-btn md-btn-secondary" disabled={busy || !!blockers.length} onClick={() => lifecycle('published', 'Resume new starts? The test opens again in the app.', true)}>Resume new starts</button>}
              {['published', 'paused', 'testing'].includes(e.status) && <button type="button" className="md-btn md-btn-secondary" disabled={busy} onClick={() => lifecycle('completed', 'Finish this test? Nobody new can join. People already in it keep their saved results.')}>Finish test</button>}
              {e.revision > 0 && e.status !== 'archived' && <button type="button" className="md-btn md-btn-danger" disabled={busy} onClick={() => lifecycle('archived', 'Retire this test? It disappears from the app catalog. Saved results stay private to each person.')}>Retire</button>}
            </div>
            <details className="md-details"><summary>What Flux saves for this test</summary><div className="md-stack" style={{ marginTop: 8, gap: 8 }}><p className="md-small">{e.protocol.enrollment?.consentText}</p><p className="md-small">{e.eligibility} People sign in with their normal Flux account and confirm they’re 18 or older.</p></div></details>
          </section>
        </>}

        <div className="md-nav-row">
          <button type="button" className="md-btn md-btn-ghost" disabled={busy || step === 1} onClick={() => goTo(step - 1)}><BackIcon size={18} />Back</button>
          {step < 4 ? <button type="button" className="md-btn md-btn-primary" disabled={busy} onClick={() => goTo(step + 1)}>Next: {steps[step].toLowerCase()} →</button>
            : <button type="submit" className="md-btn md-btn-secondary" disabled={busy || (!dirty && !!e.revision)}>{e.status === 'draft' ? 'Save draft' : 'Save changes'}</button>}
        </div>
      </form>

      <aside className="md-builder-aside" aria-label="Phone preview">
        <p className="md-eyebrow">Live preview{dirty ? ' · unsaved' : ''}</p>
        <MinaPhonePreview e={prepared} screen={screen} />
        <div className="md-preview-tabs" role="group" aria-label="Preview screen">{previewScreens.map(s => <button key={s.id} type="button" className="md-chip" aria-pressed={screen === s.id} onClick={() => setScreen(s.id)}>{s.label}</button>)}</div>
        <p className="md-tiny" style={{ textAlign: 'center', maxWidth: 300 }}>A sketch of the Flux app. Results use example bars.</p>
      </aside>
    </div>
  </div>
}

function Check({ ok, label, optional = false, onFix }: { ok: boolean; label: string; optional?: boolean; onFix: () => void }) {
  return <li className="md-check">
    <span className={`md-check-icon ${ok ? 'md-check-ok' : optional ? 'md-check-opt' : 'md-check-todo'}`} aria-hidden="true">{ok ? '✓' : optional ? '–' : '!'}</span>
    <span style={{ flex: 1 }}>{label}{!ok && <span className="md-tiny">{optional ? ' · optional' : ' · needed'}</span>}</span>
    {!ok && <button type="button" className="md-btn md-btn-ghost" style={{ minHeight: 32 }} onClick={onFix}>{optional ? 'Add' : 'Fix'}</button>}
  </li>
}

