// Plain-language labels for the Mina dashboard (client-safe, no server code).
import type { Experiment } from './mina-experiments'
import { inferTemplate, type CreatorTemplate } from './mina-consumer-creator'

export const templateMeta: Record<CreatorTemplate, { title: string; blurb: string; facts: string[] }> = {
  comparison: { title: 'Sound vs silence', blurb: 'Some nights with a sound, some nights quiet. Flux picks the order so the comparison is fair.', facts: ['Overnight', 'Morning check-in', 'Side-by-side results'] },
  single: { title: 'Try one sound', blurb: 'Fall asleep to one sound for a few nights and see how mornings feel.', facts: ['Overnight', 'Morning check-in'] },
  checkin: { title: 'Daily check-in', blurb: 'No sound — just a few quick sleep questions each morning.', facts: ['30 seconds a day'] },
  cognitive: { title: 'Morning brain game', blurb: 'A one-minute game each day to see how sharp mornings feel.', facts: ['1 minute a day', 'Scores over time'] },
}

export type StatusView = { label: string; tone: 'live' | 'draft' | 'paused' | 'done' }
export function statusView(e: Pick<Experiment, 'status' | 'enrollmentEnabled'>): StatusView {
  switch (e.status) {
    case 'published': return e.enrollmentEnabled === false ? { label: 'Live · new starts closed', tone: 'paused' } : { label: 'Live', tone: 'live' }
    case 'testing': return { label: 'Internal test', tone: 'draft' }
    case 'paused': return { label: 'Paused', tone: 'paused' }
    case 'completed': return { label: 'Finished', tone: 'done' }
    case 'archived': return { label: 'Retired', tone: 'done' }
    default: return { label: 'Draft', tone: 'draft' }
  }
}

export function coverClass(seed: string) { return `md-cover-${[...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 4}` }

export function planSummary(e: Experiment) {
  const kind = inferTemplate(e)
  const sounds = e.protocol.conditions.map(c => c.label).filter(Boolean)
  const what = kind === 'comparison' && sounds.length >= 2 ? `${sounds[0]} vs ${sounds[1].toLowerCase()}` : kind === 'single' && sounds[0] ? sounds[0] : templateMeta[kind].title
  return `${what} · ${e.durationNights} ${kind === 'comparison' || kind === 'single' ? 'nights' : 'days'}`
}

export function count(value: number | null | undefined) { return value == null ? '—' : value.toLocaleString() }
