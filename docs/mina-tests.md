> Current product direction: Mina Tests is a consumer feature inside Flux, using existing Flux accounts. See [consumer implementation and publication path](mina-consumer-product.md). Earlier staged/pilot notes are historical, not the current product workflow.

# Mina Tests

Stage 6A administration, database-backed experiment publishing, first-admin setup and the public configuration contract are documented in [Mina admin Stage 6A](./mina-admin-stage-6a.md). The static configuration described below remains the legacy acquisition fallback; new experiments are managed through the dashboard.

## Files in this update
Created routes: `app/mina-tests/page.tsx`, `app/mina-tests/results/page.tsx`, `app/api/mina-tests/community/route.ts`, `app/api/mina-tests/enroll/route.ts`.

Created UI: `components/MinaVideo.tsx`, `MinaCommunity.tsx`, `MinaResults.tsx`, `MinaSignup.tsx`, `ReferralPrize.tsx`, `PublicJoinEntry.tsx`.

Created configuration/server helpers: `lib/minaTestsConfig.ts`, `lib/server/mina-media.ts`, `mina-community.ts`, `mina-model.ts`, `mina-participation.ts`; index example `firestore.mina-tests.indexes.json`; placeholder `public/images/mina-tests/video-placeholder.svg`; video instructions `public/videos/mina-tests/README.md`; this document.

Modified existing work: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `app/experiment/page.tsx`, `app/competition/page.tsx`, `app/check-email/page.tsx`, `app/coming-soon/page.tsx`, `app/join/page.tsx`; `components/ExperimentHeader.tsx`, `ExperimentSignup.tsx`, `ChampionshipInvite.tsx`, `ReferralBox.tsx`; `lib/server/championship-service.ts`, `championship-email.ts`, `championship-http.ts`; `tests/championship.test.ts` and local environment configuration (excluded from Git). Prior uncommitted package, legal-link and setup changes remain; no new dependency is introduced by the Mina update.

## Routes and configuration
`/mina-tests` is the canonical acquisition page; `/mina-tests/results` shows Coming soon until genuine results are published. `/experiment` redirects with every query parameter preserved. `/join` still validates and consumes private, single-use email tokens. `/competition` is now the verified participation/download and referral hub; the former preview query cannot grant access.

Edit `lib/minaTestsConfig.ts` for the stable experiment ID, editorial protocol, media and inactive referral campaign. The question and protocol are explicitly provisional. Place the owned video at `public/videos/mina-tests/latest.mp4`, optionally with `public/images/mina-tests/latest-poster.jpg`. Missing assets render a designed placeholder; videos have controls and no forced autoplay. Original Flux videos and use cases remain.

## Additive records and secure continuation
Existing championship collections, campaign ID `2026-10`, participant deduplication, original attribution, hashed tokens, Resend delivery and server sessions remain. `minaTestParticipants` adds one hashed experiment/participant relationship, with experiment ID, signed_up/joined status, consent, timestamps, acquisition and count exclusion flags. Invites and sessions can carry an experiment ID. Historical invites without it remain valid but require explicit Mina consent before enrollment. No historical records are deleted or renamed.

Only a verified HttpOnly server session can obtain the referral code or enroll without another email. Android confirmation enrolls the member; iPhone interest does not. Referral links target `/mina-tests?ref=CODE`. Newly attributed referrals qualify only after unique verified Android enrollment, excluding known test records. Clicks and sharing award nothing. The prize campaign stays inactive pending reviewed dates, eligibility, tie-breaks, abuse checks and official rules; disclosure accompanies invitations.

## Public counts
`GET /api/mina-tests/community` uses Firestore server count aggregations on this experiment's membership records with countSchemaVersion=1 and excludedFromPublicCounts=false. A second aggregate includes status=joined. Responses contain counts only, never participant documents or emails. Completion tracking is absent and neither signup nor enrollment counts claim completion.

Reads are coalesced and cached for five minutes per server instance; HTTP/CDN caching can add another five minutes of lag. Failures or missing Firebase return a nonnumeric unavailable state. Development-created records, reserved test email domains, participant test flags and configured exclusions are excluded when memberships are created. Existing known test memberships can be marked excludedFromPublicCounts=true by an authorized operator. Exclusion configuration does not retroactively rewrite records.

Merge the example indexes in `firestore.mina-tests.indexes.json` into the existing project's index configuration if needed. Do not replace the Android app's indexes or security rules. Membership access is through Firebase Admin only; public client rules should not expose these collections.

## Environment and launch
Keep server-only FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or the explicitly configured application-default option. Keep RESEND_API_KEY and the verified sender CHAMPIONSHIP_FROM_EMAIL (legacy variable name retained). Set NEXT_PUBLIC_SITE_URL to the canonical site and GOOGLE_PLAY_URL to the genuine app listing. Optional comma-separated MINA_TEST_EXCLUDED_EMAIL_DOMAINS and MINA_TEST_EXCLUDED_EMAILS exclude known test signups. See [environment setup](./environment.md) and the Stage 2 backend documentation for development emulator setup. Never expose private keys or Resend credentials through NEXT_PUBLIC variables.

Before launch: supply the owned video, confirm the protocol and duration, configure real Firebase/Resend and store URL, verify a real email and secure invitation end to end, review index/rule access and public count exclusions, reconcile privacy/consent text with actual data use, and review referral campaign rules before activation. No real email, production database mutation, index deployment or prize activation is performed by this update.

## Validation
Run `npm test`, `npm run lint`, and `npm run build`. Backend tests cover legacy invite compatibility, additive memberships, secure enrollment, qualified referrals, and cached aggregate failures alongside existing token, resend, attribution and concurrency checks. Browser checks use desktop and 360/390/430px layouts; unavailable backend checks and mocked client responses do not substitute for a credentialed production smoke test.

Stage 7C open-enrollment architecture and release preparation: [readiness checklist](mina-stage-7c.md). This supersedes historical invitation-only research admission; optional email updates do not authorize research participation. No deployment or live enrollment changes were made.
