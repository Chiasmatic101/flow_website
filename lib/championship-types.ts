export type Device = 'android' | 'iphone'
export type Acquisition = {
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null
  utmContent: string | null; utmTerm: string | null; referrerUrl: string | null
}
export type SignupInput = { purpose?: 'tester'; experimentId?: string; email: string; device: Device; consent: true; referralCode: string | null; acquisition: Acquisition }
export type DeliveryState = 'sent' | 'failed' | 'unavailable' | 'cooldown' | 'waitlist'
export type SignupReceipt = { purpose?: 'tester'; email: string; device: Device; delivery: DeliveryState; retryAfter: number }
export const emptyAcquisition: Acquisition = { utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, utmTerm: null, referrerUrl: null }
