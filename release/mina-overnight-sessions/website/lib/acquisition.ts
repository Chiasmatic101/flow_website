'use client'

import { emptyAcquisition, type Acquisition } from './championship-types'
import { normalizeReferral } from './championship-validation'

const KEY = 'flux:championship:acquisition:v1'
type Attribution = { referralCode: string | null; acquisition: Acquisition }
const parameters = { utm_source: 'utmSource', utm_medium: 'utmMedium', utm_campaign: 'utmCampaign', utm_content: 'utmContent', utm_term: 'utmTerm' } as const

// First touch per browser tab. Explicit later campaign/referral links update their fields.
// No email, participant identity, consent or enrollment is stored here.
export function captureAcquisition(): Attribution {
  let stored: Attribution = { referralCode: null, acquisition: { ...emptyAcquisition } }
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (raw && typeof raw === 'object') stored = { referralCode: normalizeReferral(raw.referralCode), acquisition: { ...emptyAcquisition, ...raw.acquisition } }
  } catch { /* Capture the current visit if storage is unavailable or corrupted. */ }
  const params = new URLSearchParams(window.location.search)
  if (params.has('ref')) stored.referralCode = normalizeReferral(params.get('ref'))
  for (const [parameter, key] of Object.entries(parameters)) {
    if (params.has(parameter)) stored.acquisition[key as keyof Acquisition] = params.get(parameter)?.slice(0, 200) || null
  }
  if (!stored.acquisition.referrerUrl && document.referrer) {
    try { const referrer = new URL(document.referrer); if (referrer.origin !== window.location.origin) stored.acquisition.referrerUrl = (referrer.origin + referrer.pathname).slice(0, 500) } catch { /* Ignore malformed referrers. */ }
  }
  try { sessionStorage.setItem(KEY, JSON.stringify(stored)) } catch { /* Signup still works from the current visit. */ }
  // Stage 1 browser records never become real enrollment or referral ownership.
  try { localStorage.removeItem('flux:experiment-001:signup'); localStorage.removeItem('flux:experiment-001:invite') } catch { /* Optional cleanup. */ }
  return stored
}
