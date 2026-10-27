import type { DeclarativeProtocol } from '@/lib/mina-protocol'
import { activityName, readableName } from '@/lib/mina-builder'
import MinaDesignTimeline from './MinaDesignTimeline'

export default function MinaProtocolPreview({ protocol: p }: { protocol: DeclarativeProtocol | null }) {
  if (!p) return <p>The experiment plan is not available yet.</p>
  const nights = Math.max(0, ...p.nightlySchedule.map(s => s.night))
  return <section className="glass-card mina-card space-y-6"><h2>Your nightly plan</h2><p>{p.randomization.method === 'paired_crossover' ? 'After the baseline, each two-night pair includes one night of each condition. The order within each pair is randomized.' : p.randomization.method === 'weighted' ? 'Conditions are assigned independently. The number of nights in each condition may vary.' : 'Follow the condition shown for each night.'}</p><MinaDesignTimeline protocol={p} nights={nights} /><div><h3 className="text-xl font-bold">What you’ll do</h3><ul className="space-y-3 mt-3">{p.activities.map(a => <li key={a.id}><strong>{activityName(a, p)}</strong>{a.sessionMode === 'overnight' ? a.type === 'audio.silence' ? ' · participant-controlled interval, no experimental audio' : ' · participant-controlled overnight session' : a.durationSeconds > 0 ? ` · ${a.durationSeconds / 60} minutes` : ['audio.playback', 'audio.silence', 'cognitive.task'].includes(a.type) ? ' · timing not configured' : ''}{p.nightlySchedule.some(s => s.phase === 'morning' && s.activityIds.includes(a.id)) && ' · the following morning'}</li>)}</ul></div>{p.questions.length > 0 && <div><h3 className="text-xl font-bold">Your check-in questions</h3><ul className="space-y-3 mt-3">{p.questions.map(q => <li key={q.id}><strong>{q.prompt || `${readableName(q.id)} — wording awaiting review`}</strong>{q.type === 'scale' && ` (${q.min}–${q.max})`}{q.type === 'single_choice' && ` (${q.options.join(' / ')})`}{q.required && ' · required'}</li>)}</ul></div>}</section>
}

