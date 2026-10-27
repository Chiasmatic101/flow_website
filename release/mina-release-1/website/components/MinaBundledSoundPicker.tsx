'use client'
import type { ProtocolActivity } from '@/lib/mina-protocol'
// Implemented IDs, not a verification claim. Publication uses the trusted manifest.
export const bundledMinaSounds = ['brown_noise', 'rain', 'ocean', 'forest', 'winter']
export default function MinaBundledSoundPicker({ activity, onChange }: { activity: ProtocolActivity; onChange: (patch: Partial<ProtocolActivity>) => void }) {
  return <label>Flux sound<select className="email-input" value={activity.soundId || ''} onChange={event => onChange(event.target.value ? { soundId: event.target.value, audioUrl: '' } : { soundId: undefined })}>
    <option value="">Choose a Flux sound</option>
    {bundledMinaSounds.map(id => <option value={id} key={id}>{id.replaceAll('_', ' ')} — Android verification required</option>)}
  </select></label>
}
