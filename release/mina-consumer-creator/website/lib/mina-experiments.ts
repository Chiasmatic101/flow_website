import { FunnelError } from './championship-validation'

import { validateProtocol, protocolIssues, type DeclarativeProtocol } from './mina-protocol'

export type Experiment = {
  id: string; title: string; description: string; explanation: string; introVideoUrl: string; instructionsVideoUrl: string; thumbnailUrl: string;
  protocolType: string; protocolVersion: string; durationNights: number; protocol: DeclarativeProtocol;
  protocolHash: string; protocolReview: { hash: string; reviewedBy: string; reviewedAt: string } | null; instructions: string; eligibility: string; consentReference: string;
  status: 'draft' | 'testing' | 'published' | 'paused' | 'completed' | 'archived'; resultsSummary: string; resultsVideoUrl: string; resultsPublished: boolean;
  revision: number; createdAt: string; updatedAt: string; enrollmentStarted: boolean;
  firstPublishedAt?: string | null;
  visibility?: 'internal' | 'public';
  enrollmentEnabled?: boolean;
  publicationApproved?: boolean;
  environment?: 'production' | 'staging';
}
export function experimentId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 100 || ['new', 'results'].includes(value)) throw new FunnelError('invalid_experiment_id')
  return value
}
export function mediaSource(value: string): { kind: 'file' | 'embed'; url: string } | null {
  if (!value) return null
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hostname === 'localhost' || !u.hostname.includes('.') || /^[\d.]+$/.test(u.hostname) || u.hostname.includes(':')) return null
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return { kind: 'file', url: u.href }
    if (['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'].includes(u.hostname)) {
      const id = u.hostname === 'youtu.be' ? u.pathname.match(/^\/([a-zA-Z0-9_-]{11})\/?$/)?.[1] : u.pathname === '/watch' && u.searchParams.getAll('v').length === 1 ? u.searchParams.get('v') : u.pathname.match(/^\/(?:shorts|embed)\/([a-zA-Z0-9_-]{11})\/?$/)?.[1]
      if (id && /^[\w-]{11}$/.test(id)) return { kind: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}` }
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(u.hostname)) {
      const id = u.pathname.match(/^\/(?:video\/)?(\d+)$/)?.[1]
      if (id) return { kind: 'embed', url: `https://player.vimeo.com/video/${id}` }
    }
  } catch { /* Invalid URL. */ }
  return null
}
export function validateExperiment(value: unknown): Omit<Experiment, 'revision' | 'createdAt' | 'updatedAt' | 'enrollmentStarted' | 'protocolHash' | 'protocolReview' | 'firstPublishedAt'> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new FunnelError('invalid_input')
  const v = value as Record<string, unknown>
  const text = (key: string, max = 8000) => { if (typeof v[key] !== 'string' || (v[key] as string).length > max) throw new FunnelError(`invalid_${key}`); return (v[key] as string).trim() }
  const id = experimentId(v.id)
  const title = text('title', 180), description = text('description', 600), explanation = text('explanation')
  const introVideoUrl = text('introVideoUrl', 2000), instructionsVideoUrl = text('instructionsVideoUrl', 2000), resultsVideoUrl = text('resultsVideoUrl', 2000), thumbnailUrl = text('thumbnailUrl', 2000)
  for (const url of [introVideoUrl, instructionsVideoUrl, resultsVideoUrl]) if (url && !mediaSource(url)) throw new FunnelError('invalid_video_url')
  if (thumbnailUrl) { try { const u = new URL(thumbnailUrl); if (u.protocol !== 'https:' || u.username || u.password) throw new Error() } catch { throw new FunnelError('invalid_thumbnail_url') } }
  const protocolType = text('protocolType', 100), protocolVersion = text('protocolVersion', 100), instructions = text('instructions'), eligibility = text('eligibility'), consentReference = text('consentReference', 1000), resultsSummary = text('resultsSummary')
  if (!['draft', 'testing', 'published', 'paused', 'completed', 'archived'].includes(String(v.status)) || !Number.isInteger(v.durationNights) || Number(v.durationNights) < 0 || Number(v.durationNights) > 365 || typeof v.resultsPublished !== 'boolean' || !title) throw new FunnelError('invalid_input')
  if (v.visibility !== undefined && !['internal', 'public'].includes(String(v.visibility))) throw new FunnelError('invalid_visibility')
  if (v.enrollmentEnabled !== undefined && typeof v.enrollmentEnabled !== 'boolean') throw new FunnelError('invalid_enrollment_switch')
  const protocol = validateProtocol(v.protocol)
  if (v.resultsPublished && !resultsSummary) throw new FunnelError('results_summary_required')
  if (['published', 'testing'].includes(String(v.status))) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(protocolVersion) || protocolIssues(protocol, Number(v.durationNights)).length) throw new FunnelError('incomplete_protocol')
    if (![description, explanation, instructions, eligibility, consentReference].every(Boolean)) throw new FunnelError('publishing_fields_required')
  }
  return { id, title, description, explanation, introVideoUrl, instructionsVideoUrl, resultsVideoUrl, thumbnailUrl, protocol, protocolType, protocolVersion, durationNights: Number(v.durationNights), instructions, eligibility, consentReference, resultsSummary, resultsPublished: v.resultsPublished, status: v.status as Experiment['status'], visibility: (v.visibility || 'internal') as Experiment['visibility'], enrollmentEnabled: v.enrollmentEnabled === true }
}
export function publicExperiment(e: Experiment & { wrapUpVideoUrl?: string; results?: { summary: string; videoUrl: string } | null }) {
  const { id, title, description, explanation, introVideoUrl, instructionsVideoUrl, thumbnailUrl, protocolType, protocolVersion, durationNights, instructions, eligibility, consentReference, status, updatedAt, visibility, enrollmentEnabled, publicationApproved, environment } = e
  const results = e.resultsPublished === true ? { summary: e.resultsSummary, videoUrl: e.resultsVideoUrl } : e.resultsPublished === false ? null : e.results ? { summary: e.results.summary, videoUrl: e.results.videoUrl } : null
  return { ...(e.protocol?.enrollment?.mode === 'personal' ? { wrapUpVideoUrl: typeof e.resultsVideoUrl === 'string' ? e.resultsVideoUrl : e.wrapUpVideoUrl || '' } : {}), schemaVersion: 2, protocol: e.protocol || null, protocolHash: e.protocolHash || null, id, title, description, explanation, introVideoUrl, instructionsVideoUrl, thumbnailUrl, protocolType, protocolVersion, durationNights, instructions, eligibility, consentReference, status, updatedAt, visibility: visibility || 'internal', enrollmentEnabled: enrollmentEnabled === true, publicationApproved: publicationApproved === true, environment, results }
}
export function isPublicExperiment(e: Experiment, environment = 'production') { return e.environment === environment && e.visibility === 'public' && e.publicationApproved === true && ['published', 'paused', 'completed'].includes(e.status) }
