export const MINA_TESTS_NAME = 'Mina Tests'

// An editorial draft, not a published research protocol or scientific finding.
// Stable ID is independent of the legacy acquisition campaign ID and display title.
export const activeMinaTest = {
  id: 'mina-sleep-sound-cognition-001',
  acquisitionCampaignId: '2026-10', // Keep the Stage 2 deduplication/referral namespace stable.
  title: 'Sleep, sound and your next-day brain',
  description: 'Community experiments exploring how sleep, sound and cognitive-game performance relate to one another.',
  status: 'Protocol coming soon',
  question: 'How do sleep and sound relate to next-day cognitive-game performance?',
  questionStatus: 'Proposed question · Final protocol to be confirmed',
  hypothesis: 'The hypothesis and analysis plan will be published before the experiment begins.',
  steps: ['Sign up and confirm your private email invite.', 'Download Flux on Android, or register your interest for iPhone.', 'Review the published protocol and participation instructions when they are ready.'],
  measurements: 'Planned: sleep check-ins, sound-session information and cognitive-game scores. Exact measures and collection schedule are still to be confirmed.',
  duration: 'To be announced with the final protocol.',
  media: { videoPath: '/videos/mina-tests/latest.mp4', posterPath: '/images/mina-tests/latest-poster.jpg', title: "Mina’s latest video", fallback: 'Mina’s next update is coming soon.' },
  results: { state: 'coming-soon' as const },
}

// Never activate based on an unreviewed rules draft or a client-provided flag.
export const referralCampaign = {
  id: 'mina-referrals-2026-10',
  status: 'not-active' as const,
  prize: 'Prize to be announced',
  dates: 'Campaign dates to be announced',
  eligibility: 'Eligibility and location/age requirements to be confirmed',
  tieBreak: 'Tie-break rules to be announced',
  fraudChecks: 'Duplicate, self-referral and abuse checks; final review process to be published',
  officialRules: 'Official rules pending review',
  qualification: 'A unique new participant must confirm their private email invite and enroll in this Mina Test. Clicks, share-button presses and unverified signups do not qualify. iPhone interest alone does not complete this step.',
  disclosure: 'Disclosure: I may become eligible for a referral prize if you join through my link after an official campaign launches. No prize campaign is active yet.',
}
