import 'server-only'
import type { Acquisition } from '../championship-types'
export type MinaMembership = { participantId: string; experimentId: string; status: 'signed_up' | 'joined'; createdAt: unknown; joinedAt: unknown; consentUpdates: boolean; acquisition: Acquisition; excludedFromPublicCounts: boolean; countSchemaVersion: 1 }
export function isExcludedEmail(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() || ''
  const excludedDomains = new Set(['example.org', 'example.com', 'example.net', ...(process.env.MINA_TEST_EXCLUDED_EMAIL_DOMAINS || '').toLowerCase().split(',').map(item => item.trim()).filter(Boolean)])
  const excludedEmails = new Set((process.env.MINA_TEST_EXCLUDED_EMAILS || '').toLowerCase().split(',').map(item => item.trim()).filter(Boolean))
  return excludedEmails.has(email.toLowerCase()) || excludedDomains.has(domain) || /\.(test|invalid|localhost)$/.test(domain)
}
