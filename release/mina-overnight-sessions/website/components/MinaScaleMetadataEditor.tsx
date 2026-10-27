'use client'
import type { ProtocolQuestion } from '@/lib/mina-protocol'
export default function MinaScaleMetadataEditor({ question: q, onChange }: { question: ProtocolQuestion; onChange: (patch: Partial<ProtocolQuestion>) => void }) {
  return <div className="builder-stack"><label>Scale increment<input className="email-input" type="number" min="0.000001" step="any" value={q.step ?? ''} onChange={event => onChange({ step: event.target.value ? Number(event.target.value) : undefined })} /></label>
    <label>Exact scale labels, one per integer value<textarea className="email-input" value={(q.labels || []).join('\n')} onChange={event => onChange({ labels: event.target.value ? event.target.value.split('\n') : undefined, ...(event.target.value ? { step: 1 } : {}) })} /></label>
    <p className="builder-note">Labels run from the lowest to highest value. Labelled scales use integer values and a step of 1.</p></div>
}
