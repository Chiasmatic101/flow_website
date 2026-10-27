'use client'
import type { ExecutionCapabilities, ProtocolActivity } from '@/lib/mina-protocol'
import { bundledSoundOptions } from '@/lib/mina-builder'
export { bundledMinaSounds } from '@/lib/mina-builder'
export default function MinaBundledSoundPicker({ activity, capabilities, onChange }: { activity: ProtocolActivity; capabilities: ExecutionCapabilities | null; onChange: (patch: Partial<ProtocolActivity>) => void }) {
  const sounds = bundledSoundOptions(capabilities)
  return <div className="builder-stack"><label>Choose a verified sound<select className="email-input" value={activity.soundId || ''} onChange={event => onChange({ soundId: event.target.value || undefined, audioUrl: '' })}>
    <option value="">Choose a Flux sound</option>
    {activity.soundId && !sounds.some(sound => sound.id === activity.soundId) && <option value={activity.soundId} disabled>Saved sound — registry verification required</option>}
    {sounds.map(sound => <option value={sound.id} key={sound.id}>{sound.label}</option>)}
  </select></label><p className={sounds.length ? 'builder-note' : 'builder-unresolved'}>{sounds.length ? 'These sounds already ship in Flux and have registered file digests. No upload or audio URL is needed.' : 'No bundled sound metadata is available for this app build. Existing draft selections are preserved; publication remains blocked.'}</p>{sounds.length > 0 && capabilities?.verified !== true && <p className="builder-note">Bundled files are registered for draft selection. Android execution verification is still pending and remains required before publication.</p>}{activity.audioUrl && <p className="builder-unresolved">This saved activity references a hosted audio URL. Choose a bundled Flux sound to replace it; remote audio is not offered here.</p>}</div>
}
