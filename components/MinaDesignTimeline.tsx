import { conditionNightCounts, readableName } from '@/lib/mina-builder'
import type { DeclarativeProtocol } from '@/lib/mina-protocol'
export default function MinaDesignTimeline({ protocol: p, nights }: { protocol: DeclarativeProtocol; nights: number }) {
  const counts = conditionNightCounts(p), pairs = p.randomization.pairs || []
  const pairedNights = new Set(pairs.flatMap(pair => pair.nights))
  const fixed = Array.from({ length: Math.min(365, Math.max(0, nights)) }, (_, i) => i + 1).filter(n => !pairedNights.has(n))
  const name = (id: string) => id === 'none' ? 'Scheduled activities' : id === 'assigned' ? 'Randomly assigned condition' : p.conditions.find(c => c.id === id)?.label || readableName(id)
  return <div className="builder-timeline-wrap"><div className="builder-counts">{p.conditions.map(c => <span className={`builder-condition-tag ${c.id === 'brown-noise' ? 'is-sound' : ''}`} key={c.id}><span aria-hidden="true">{c.id === 'brown-noise' ? '≋' : '◌'}</span> {c.label || 'Unnamed condition'} <strong>{counts ? `${counts[c.id] || 0} nights` : 'Count varies'}</strong></span>)}</div><div className="builder-timeline">{[
    ...fixed.map(night => ({ night, content: <article key={night} className="builder-night"><span>Night {night}</span><strong>{name(p.nightlySchedule.find(s => s.night === night && s.phase === 'evening')?.conditionId || 'none')}</strong><small>{night === 1 && pairs.length ? 'Baseline' : 'Scheduled activities'}</small></article> })),
    ...pairs.map((pair, index) => ({ night: Math.min(...pair.nights), content: <article className="builder-pair" key={`pair-${index}`}><div className="builder-pair-label">Pair {index + 1} <span>One of each · order randomized</span></div><div className="builder-pair-nights">{pair.nights.map(night => <div key={night}><span>Night {night}</span><strong>{pair.conditionIds.map(name).join(' or ')}</strong><small>Order picked when they start</small></div>)}</div></article> })),
  ].sort((a, b) => a.night - b.night).map(item => item.content)}</div>{!nights && <p className="muted">Set the number of nights to start your timeline.</p>}{pairs.length > 0 && <p className="builder-note">Each pair has one night of each. Flux picks the order for each person when they start — this preview doesn’t assign anyone.</p>}</div>
}
