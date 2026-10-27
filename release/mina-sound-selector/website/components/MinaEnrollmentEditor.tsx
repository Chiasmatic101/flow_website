'use client'
import type { DeclarativeProtocol, ProtocolEnrollment } from '@/lib/mina-protocol'
export default function MinaEnrollmentEditor({ protocol, locked, onChange }: { protocol: DeclarativeProtocol; locked: boolean; onChange: (p: DeclarativeProtocol) => void }) {
  const e = protocol.enrollment
  function update(patch: Partial<ProtocolEnrollment>) { onChange({ ...protocol, enrollment: { schemaVersion: 1, minimumAge: 18, consentVersion: '', consentText: '', requirements: [], ...e, ...patch } }) }
  return <fieldset disabled={locked} className="builder-stack"><legend>Challenge privacy and eligibility</legend>
    {!e ? <button className="flux-secondary" type="button" onClick={() => update({ mode: 'personal', minimumAge: 18 })}>Configure personal challenge start</button> : <>
      <p className="builder-note">Personal tracking has a single inline adult confirmation. Research use needs a separate reviewed disclosure; never silently convert existing participation.</p>
      <p>{e.mode === 'personal' ? 'Personal consumer challenge · existing Flux account' : 'This saved legacy plan retains its original purpose. Create a new consumer challenge rather than changing an existing disclosure.'}</p>
      <label>Minimum age<input className="email-input" type="number" min={18} max={120} value={e.minimumAge} onChange={event => update({ minimumAge: Number(event.target.value) })} /></label>
      {e.mode === 'personal' && <label className="builder-checkbox"><input type="checkbox" checked={e.aggregateResults === true} onChange={event => update({ aggregateResults: event.target.checked, consentText: event.target.checked && !/aggregate/i.test(e.consentText) ? `${e.consentText} Operators can see aggregate condition averages to operate this consumer challenge. This is not permission for generalizable research.` : e.consentText })} />Include disclosed aggregate condition averages in admin results</label>}
      <label>Versioned privacy explanation<input className="email-input" value={e.consentVersion} onChange={event => update({ consentVersion: event.target.value })} /></label>
      <label>Personal-data explanation shown beside Start Challenge<textarea className="email-input" rows={8} value={e.consentText} onChange={event => update({ consentText: event.target.value })} /></label>
      {e.requirements.map((r, index) => <label key={r.id}>Required attestation ({r.id})<textarea className="email-input" value={r.prompt} onChange={event => update({ requirements: e.requirements.map((v, i) => i === index ? { ...v, prompt: event.target.value } : v) })} /><button type="button" onClick={() => update({ requirements: e.requirements.filter(v => v.id !== r.id) })}>Remove requirement</button></label>)}
      <button className="flux-secondary" type="button" onClick={() => { let n = 1; while (e.requirements.some(r => r.id === `requirement-${n}`)) n++; update({ requirements: [...e.requirements, { id: `requirement-${n}`, prompt: '' }] }) }}>Add eligibility attestation</button>
      <p className="builder-note">Purpose, privacy explanation, adult eligibility and stable requirement IDs are pinned to each user’s plan. Changes invalidate protocol review.</p>
    </>}
  </fieldset>
}
