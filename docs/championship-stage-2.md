# Flux Sleep Championship — Stage 2

## What is implemented

The website creates Firestore participants and referral relationships, sends Resend invites, and verifies seven-day private invites. Sleep/game boards still use `lib/demoLeaderboardData.ts`. Nothing changes the Flutter app, calculates competition scores, qualifies a referral, or links a Firebase Auth UID yet.

## Local and deployment configuration

Create `.env.local` using [environment setup](./environment.md), then supply values privately. Never put credentials in Git, screenshots, client components or `NEXT_PUBLIC_*` variables.

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Existing FLUX Firebase project ID. Use its default Firestore database. |
| `FIREBASE_CLIENT_EMAIL` | Server service-account email. |
| `FIREBASE_PRIVATE_KEY` | Service-account private key. A quoted value containing escaped `\n` newlines is supported. |
| `FIREBASE_USE_APPLICATION_DEFAULT` | Optional `true` for an attached server identity/Application Default Credentials instead of a downloaded key. |
| `RESEND_API_KEY` | Server-only Resend sending key. |
| `CHAMPIONSHIP_FROM_EMAIL` | Verified sending address, optionally `Flux <address@verified-domain>`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical website origin, e.g. your own HTTPS production origin or `http://localhost:3000` for development. No path/query. This is public, not a secret. |
| `GOOGLE_PLAY_URL` | Actual Google Play app details URL when available. Otherwise the download button stays disabled. |
| `FIRESTORE_EMULATOR_HOST` | Optional dedicated local emulator `host:port`, without protocol. Rejected in production. |

Firebase initialization is lazy: builds and public pages work without credentials. Missing Firebase credentials cause a safe 503 response and no claim of registration. With Firebase configured but Resend absent, the participant is saved and the check-email page explicitly says delivery is unavailable. Development can issue a clearly labeled private invite preview, while production never returns raw invite tokens. With no Firebase configured at all, development can preview the existing hub without creating any enrollment.

For Google-managed hosting, prefer an attached workload identity and Application Default Credentials over long-lived private keys. Grant only the server permissions needed for these Firestore operations. For non-Google hosting, configure encrypted server environment variables for a dedicated service account. Firebase Admin bypasses client security rules; service-account IAM still applies. See [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

Resend requires a verified sender domain, its requested DNS records, a suitable API key and the configured sender address. The SDK uses per-invite idempotency keys; acceptance by Resend means a send request succeeded, not guaranteed inbox delivery. There is no delivery-webhook or background retry worker in this stage. See [Resend sending documentation](https://resend.com/docs/api-reference/emails/send-email).

## Collections and access

All new collections are server-only. Do not grant browser/mobile reads or writes to them, even for authenticated Firebase clients. **Review the existing FLUX rules before live testing.** Broad existing wildcard `allow` rules can override a restrictive collection-specific rule because any matching allow grants access. Preserve the app's existing rules; do not deploy a replacement rules file from this website.

| Collection | Document ID / contents |
| --- | --- |
| `championshipParticipants` | Random UUID; normalized email, device, stable championship ID, `invited`/`joined`/`app_connected` status, unique referral code, `referredBy` referrer participant ID or null, server `createdAt`, `joinedAt` or null, consent, acquisition, `fluxUid: null`. Email attempt counters and current/pending invite hashes support delivery controls. No leaderboard scores. |
| `championshipParticipantKeys` | SHA-256 of championship ID + normalized email; maps to participant UUID. Atomic uniqueness guard, not public identity. |
| `championshipReferralCodes` | Uppercase random `FLUX-XXXXXXXX`; maps code to participant and championship. Collision checked transactionally. |
| `championshipReferrals` | Referred participant UUID; championship, referrer/referred participant IDs, referral code, `signed_up`, server creation timestamp. This ID ensures at most one attribution per participant. |
| `championshipInvites` | SHA-256 of the 32-byte random token; participant/championship/device, creation and seven-day expiry timestamps, status, used timestamp. No raw token. |
| `championshipSessions` | SHA-256 of a random browser session cookie; pending receipt scope or verified joined scope, participant, email supplied at signup, device, delivery state, timestamps. Pending sessions expire in one day; joined sessions in 30 days. |
| `championshipRateLimits` | Hash of the request rate-limit key; count/window and expiry timestamp. No raw IP address. |

No composite indexes are required: all uniqueness and ownership lookups are document reads. Configure Firestore TTL cleanup on `championshipSessions.expiresAt` and `championshipRateLimits.expiresAt`; expiration is enforced by code even before TTL deletion. Decide retention/deletion for participants, referrals, email indexes and invite records before launch. Removing a participant must also remove its indexes, codes, invites, sessions and referral relationships according to the chosen policy. No production TTL policies or rules are deployed by this implementation.

The championship identifier comes from `activeChampionship.id`, currently `2026-10`. Clients cannot override it. Old-month invite/session access stops when the active championship changes. Plan migration/renewal UX before switching a live campaign.

## API and trust boundaries

- `POST /api/championship/signup`: bounded JSON, validated email/device/consent/acquisition. Creates/reuses a participant transactionally, sets an HttpOnly receipt cookie, and attempts an Android invite. iPhone is stored as `device: iphone, status: invited`; it is a waitlist record, not joined membership, and sends no Android invite.
- `GET /api/championship/receipt`: minimal email/device/delivery receipt for the server session. No participant IDs, private referral code, or authorization token in the response.
- `POST /api/championship/resend`: requires a receipt session; server cooldown of 60 seconds and maximum five email attempts per participant per hour. Repeat signup uses the same limits. Provider failures count as attempts. Returns `429` and `Retry-After` on cooldown.
- `GET /join?token=…`: server validates the hash, participant, championship, status and expiry. It never consumes a token. A confirmation button avoids accidental enrollment by email link scanners or prefetching.
- `POST /api/championship/join`: consumes the invite atomically, writes `joined` and server `joinedAt`, creates a verified HttpOnly session and redirects to a clean hub URL. Invalid/expired/used links have friendly messages. A duplicate submission cannot consume the invite twice.

Cookies use SameSite Lax and HTTPS Secure in production. POST requests require a same-origin Origin header. API responses are uncached. Invite pages suppress referrers and indexing. Configure hosting access logs, analytics and observability to redact the `/join` query string: possession of an invite is authorization. No raw tokens or personal provider error payloads are logged by application code.

A pending receipt permits requesting email, not access to a participant's verified referral code. Entering an existing email never grants verified membership, overwrites first-touch attribution, changes the existing device/status, or exposes its participant ID. A new private invite can confirm a requested device after email ownership is proved. Failed resends preserve the last working invite; successful resends revoke it. If a process stops after provider acceptance but before Firestore finalization, request another invite after the cooldown. No durable email outbox is implemented yet.

The supplemental shared request limit is 20 requests/minute per ingress IP hash. Hosting must sanitize/replace forwarded headers at its trusted ingress. The participant email cooldown does not depend on IP headers. CAPTCHA, fraud detection and referral rewards remain future work.

## Referral and acquisition semantics

Referral codes are generated only on the server. Joined participants get `/experiment?ref=CODE`. Codes are case-insensitive. Invalid, unknown, different-championship and self referrals are ignored; signup continues. Only the initial participant creation stores attribution. Clicks create no referral record. Signed-up referrals are not qualified and earn no leaderboard points or rewards.

The root client capture stores `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `ref` and an external referring page across navigation in session storage. An explicit later campaign/referral link updates the supplied fields; other values survive. Referrer query strings/fragments are stripped to avoid importing personal information or tokens. Fields are bounded and revalidated by the server. These values are attribution hints, never trusted identity. No email, participant enrollment or consent is stored in local/session storage. Old Stage 1 participant/invite storage is removed; its fabricated code cannot become referral ownership.

## Stage 3 app linkage

After Flux authenticates the user, a trusted backend must verify the Firebase Auth ID token and obtain the UID and **verified** email from Firebase Auth. Normalize that verified email, find the championship participant through its unique index, verify membership, then transactionally set `fluxUid` and `status: app_connected`. Reject conflicting existing UID links and define how multiple monthly participant records link to the same verified user. Never accept arbitrary email/UID combinations from the mobile client. Keep sleep and game telemetry/results separate from acquisition participants. The Flutter app remains unchanged in Stage 2.

## Privacy review — policy left unchanged

The current policy broadly mentions account information, sleep feedback, cognitive-game results and service providers. It does **not explicitly describe** championship email collection/invites and update consent, device/waitlist records, competition participation, referral relationships/codes, UTM/referrer attribution, session cookies/storage, retention, withdrawal from updates, or possible future leaderboard publication. It also does not name Firebase/Google and Resend as the database/email processors or explain relevant international transfers.

Before public collection, have the policy and signup notice updated/reviewed for the actual operators, purposes, providers, retention/deletion process and applicable jurisdictions. Clarify that website signup does not currently collect sleep or game measurements; Stage 3 will need a separate review for real telemetry/participation and public rankings. This is a scoped gap review, not a replacement legal policy. No legal page is edited in this stage.

## File manifest

Created:

- `docs/environment.md` (environment files remain outside Git)
- `lib/firebase-admin.ts`
- `lib/championship-types.ts`, `lib/championship-validation.ts`, `lib/acquisition.ts`
- `lib/server/championship.ts`, `championship-store.ts`, `championship-service.ts`, `championship-email.ts`, `championship-http.ts`
- `app/api/championship/signup/route.ts`, `receipt/route.ts`, `resend/route.ts`, `join/route.ts`
- `app/join/page.tsx`
- `components/AcquisitionCapture.tsx`, `components/ChampionshipInvite.tsx`
- `tests/championship.test.ts`
- `docs/championship-stage-2.md`

Modified: `.gitignore`, `package.json`, `package-lock.json`, `next.config.ts`, `app/layout.tsx`, `app/check-email/page.tsx`, `app/competition/page.tsx`, `app/coming-soon/page.tsx`, `components/ExperimentSignup.tsx`, `components/ReferralBox.tsx`, `lib/championshipConfig.ts`. Next.js 16.4 also regenerated its managed instructions block in `AGENTS.md`; the instruction to consult installed documentation remains in place.

Removed: `lib/experiment-prototype.ts` and `components/PrototypeInvite.tsx`, superseded by server-backed signup and receipt state. Original product homepage, CSS, videos, legal pages and demo leaderboard data are untouched in Stage 2.

Packages: official `firebase-admin` and `resend`, `server-only` import protection, and development-only `tsx` for tests. Next.js and its matching ESLint config are updated from 16.2.4 to 16.4.0 for audit-reported security fixes; compatible transitive dependency fixes are also applied. Remaining audit findings involve the lint glob dependency chain and upstream Google/Firebase UUID dependencies. Forced audit fixes recommend incompatible downgrades and are not applied.

## Test commands

`npm test` runs isolated transaction and service tests with fake email transport; no production writes or email sends. To also validate the actual Firestore adapter, start a **dedicated local emulator**, use `FIREBASE_PROJECT_ID=demo-flux-championship`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `USE_FIRESTORE_EMULATOR=1`, then run the same command. Never run that suite against the existing live FLUX project. The emulator suite generates unique test addresses; discard the dedicated emulator database afterwards.

Before real end-to-end testing:

1. Review Firestore client rules and server IAM. Supply the Firebase environment values for the intended project.
2. Configure Resend domain/DNS, sender and key. Set the canonical site URL and actual Google Play URL if available.
3. Restart the server after changing environment values. Complete Android signup using an email you control; inspect the participant, receipt, sent email and confirmation page.
4. Confirm the invite, verify `joined`/`joinedAt`, and check its referral link. Repeat signup with the same email: one participant and the same ownership; no duplicate attribution.
5. Sign up a second controlled email through that referral link. Verify exactly one `signed_up` relationship. Test unknown code and self-referral with no relationship.
6. Test resend before/after cooldown, replacement of an earlier invite, invalid and expired invites, and iPhone waitlist persistence. No sleep/game score or `fluxUid` should be written.
7. Verify production contains no developer preview links or token API responses. Review the scoped privacy updates before accepting public traffic.
