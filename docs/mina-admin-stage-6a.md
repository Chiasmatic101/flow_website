# Mina Tests administration — Stage 6A

Implemented locally in the existing Next.js website. No Firebase accounts, claims, rules, indexes, Cloud Functions or production records were changed. No Flutter screens were changed.

## Database-driven experiment definitions

Firestore is the source of truth. The canonical collection remains `minaExperiments`; no experiment or brown-noise executor registry exists in source code. Admins configure duration, conditions, reusable activities, questions, nightly schedules, randomization, eligibility and consent through the dashboard. Protocol category is descriptive and imposes no experiment allowlist. The versioned contract and Stage 6B plan are in [the declarative schema guide](./mina-experiment-schema.md).

New drafts start blank and need no Flutter verification. The optional brown-noise/silence example has proposed conditions only: no assumed duration, nightly schedule, audio file or verified scientific protocol. This checkout does not establish its intended protocol as implemented.

Live publication requires a complete definition, an admin's explicit review of its exact content hash, and verified compatible execution capabilities from the trusted Firestore document `minaExecutionCapabilities/flutter`. No manifest is automatically created or marked verified. Missing or unsupported capabilities block publication and new enrollment, not draft creation. This prevents enabling live studies before the Stage 6B interpreter and assignment backend have been verified. A verified reusable interpreter can later execute new compatible configurations without an app update per experiment.

## Authentication and first admin

Use **flow-9d714**, the existing project. Keep the existing server-only Firebase Admin credentials or configured application-default credentials. Set `FIREBASE_PROJECT_ID=flow-9d714`, `FIREBASE_WEB_API_KEY` to this project's Firebase Web API key, and `NEXT_PUBLIC_SITE_URL` to `https://minatests.com` in the deployed server environment. The Web API key is a project identifier, not a service account credential. Never put a service account key in a browser bundle.

Enable Email/Password in Firebase Authentication if it is not already enabled. Create or select the intended administrator in Firebase Authentication; this does not make a participant an admin. Obtain that Auth user's UID. From an authorized operator environment with server credentials loaded, run:

```powershell
node --env-file=.env.local scripts/mina-admin.mjs FIREBASE_AUTH_UID grant
```

The command deliberately requires project `flow-9d714` and preserves unrelated custom claims. It is never invoked by the application. Sign in at `/admin` with the existing user's email and password. There is no public admin-registration endpoint. To remove access:

```powershell
node --env-file=.env.local scripts/mina-admin.mjs FIREBASE_AUTH_UID revoke
```

Revocation removes the claim and revokes refresh tokens. Every protected read and write verifies the signed Firebase session cookie with revocation checking, then checks the current user's `admin === true` claim and disabled state. Claim removal takes effect even for a previously issued cookie. Sessions last eight hours in HttpOnly, SameSite=Strict cookies, Secure in production. Passwords go from the login request to Firebase's official REST sign-in endpoint and are not stored or logged. Auth responses, ID/refresh tokens and credentials are not returned to the browser. Login uses the existing shared Firestore request throttle. Mutations check request Origin. Production rejects Auth and Firestore emulator overrides.

This follows Firebase's [session cookie](https://firebase.google.com/docs/auth/admin/manage-cookies), [custom claim](https://firebase.google.com/docs/auth/admin/custom-claims) and [REST sign-in](https://firebase.google.com/docs/reference/rest/auth#section-sign-in-email-password) documentation.

## Working in the dashboard

1. Open `/admin/experiments` and choose **Create experiment**. Choose a stable lowercase ID such as `brown-noise-001`. Do not reuse an existing ID for a different experiment. The ID cannot change after creation.
2. Fill in title, descriptions, HTTPS thumbnail URL, eligibility, approved consent reference/text and participant instructions. Choose a descriptive category and protocol version. Set the duration, activities, conditions, questions, randomization and nightly schedule using the form controls. A draft can be incomplete.
3. Paste Mina's externally hosted introduction URL into **Mina videos**. HTTPS `.mp4`, `.webm` and `.ogg` files (including signed query parameters), YouTube and Vimeo links are supported. A HeyGen generation/share link or TikTok/Instagram post is not a direct video file; obtain an exported hosted video URL. Optional instructions/results videos use the same validation and preview. Availability, MIME type, embed permissions and signed URL expiry require checking with the hosting provider; validation does not fetch arbitrary remote URLs on the server.
4. Save the draft. **Preview saved** renders the last saved revision in a protected page; it does not enroll anyone. Save again after edits before previewing.
5. Inspect the saved preview, then **Save and record my review of this exact protocol** after reviewing the execution definition, instructions, eligibility and consent. Changes to those fields invalidate the review. **Publish** validates completeness, that exact review, the verified runtime capability manifest and required public fields on the server before opening enrollment. **Pause** hides it from listings and closes new enrollment while keeping previously published direct pages and existing participants. Pausing a never-published draft does not make it public. Email links still verify while paused, but do not enroll new members. **Archive** hides the public page and keeps all membership, invite and participant records.
6. Enter genuine aggregate findings in **Results** and explicitly check **Publish these results**. The summary must be nonempty. Unchecked summaries and video URLs never enter the public serializer or public API. Paused experiments retain their direct public page; draft/archived pages remain private. Results on draft/archived experiments remain private regardless of the results checkbox.

Saving an existing experiment preserves its selected status. Saving as draft closes enrollment. Edits use an expected revision: stale saves return `409 edit_conflict_reload` instead of overwriting another admin's work. Reload after a conflict. Duplicate creates an unsaved draft with an empty new ID and clears results, publication history, content hash and review; it copies no participant data. Changes to enrolled protocol category/version, duration, the entire declarative execution definition, eligibility, participant instructions or consent reference are rejected. Copy edits remain allowed and audited.

## Routes

| Route | Purpose |
| --- | --- |
| `/admin` | Admin login |
| `/admin/experiments` | Protected list and aggregate counts |
| `/admin/experiments/new` | New draft; optional `?duplicate=ID` |
| `/admin/experiments/[id]` | Protected editor |
| `/admin/experiments/[id]/preview` | Protected saved preview |
| `POST /api/admin/session` | Firebase login/session creation |
| `DELETE /api/admin/session` | Same-origin logout |
| `GET /api/admin/experiments` | Protected list with counts |
| `POST /api/admin/experiments` | Protected validated create/update/status operation |
| `/mina-tests` | Database-backed published list, with a legacy invite/download signup continuation when none are published |
| `/mina-tests/[id]` | Published/paused landing page and scoped join action |
| `/mina-tests/results` | Published result summaries |
| `GET /api/mina-tests/experiments` | Public versioned published configuration list |
| `GET /api/mina-tests/experiments/[id]` | Public published/paused configuration; private IDs return 404 |

Existing `/experiment` query-preserving redirect, `/join`, verification emails, receipt/resend APIs and campaign `2026-10` remain. Signup and verified enrollment optionally accept `experimentId`; absent IDs retain the legacy default or the verified session's experiment as appropriate. Current invitation/session IDs are carried through to download/referral pages. The shared email cooldown and single-use invitation policy remain per participant, including across experiments.

## Collections, data integrity and reporting

- **Canonical experiments:** `minaExperiments/{canonicalId}` reuses the canonical experiment path already reserved in the deployed rules. Full authoring state is stored at `private/admin` under each experiment; the root is an atomically updated public projection. `minaExperiments/{id}/revisions/{revision}` keeps full saved snapshots with admin UID and ISO UTC timestamps. The static legacy identifiers and generic media preserve acquisition links; hardcoded scientific descriptions/results are no longer rendered as an alternate experiment catalog. No automatic seed/migration is run.
- **Runtime verification metadata:** `minaExecutionCapabilities/flutter` declares the independently verified interpreter capabilities. It is server-only under the deployed default-deny policy. The application does not create, edit or automatically attest this document.
- A read-only top-level collection-name check against `flow-9d714` confirmed existing championship collections, `minaTestParticipants` and `users`, with no experiment root documents populated at the time of inspection. A later read-only rules inspection confirmed an existing policy for `minaExperiments`, `versions`, `private`, `publicResults` and `minaEnrollments`; those reserved paths are reused rather than introducing a competing experiment collection. No participant documents were read by that inspection, and no live collection was created.
- **Reused:** `minaTestParticipants`, `championshipParticipants`, `championshipParticipantKeys`, `championshipInvites`, `championshipSessions`, `championshipReferralCodes`, `championshipReferrals`, `championshipRateLimits` and existing email delivery infrastructure.
- Membership keys remain the hash of `experimentId:participantId`; no historical ID or record is renamed. New configured memberships store protocol version, content hash, the full scientific definition snapshot, consent reference and configuration revision. Published definitions are also retained in create-only `minaExperiments/{id}/versions/{protocolVersion}` documents. Reusing a published version label with a different hash is rejected. Historical memberships are not retroactively assigned a consent or protocol they never accepted.
- Signup/enrollment reads configuration and locks it in the same Firestore transaction as membership writes. Admin saves read the configuration and check for existing memberships in their transaction. The complete definition is hash-locked, including eligibility and instructions. New enrollment and invite confirmation also recheck runtime compatibility. The lock starts conservatively at the first signup/interest membership, including test records; it never unlocks on archive.
- `signups` counts all existing memberships for that ID; `enrollments` counts `status=joined`. These private operational totals include test/excluded records. Public legacy community totals retain their existing exclusion logic. Counts are Firestore server aggregations, not participant documents delivered to the browser.
- Completion, active activity, dropouts and completion rate are **unavailable/null**: this checkout has no completion/activity/dropout schema or Flutter data mapping. A zero would falsely imply measured completion. No health responses, emails or participant identifiers appear in public configurations.
- Existing referral ownership, attribution and qualification remain in the campaign namespace. A referral qualifies only against its original experiment when verified Android enrollment occurs. iPhone remains interest only. A fresh signup for another experiment does not overwrite the participant's original attribution/referral.

## Public configuration contract for Stage 6B

The list response is `{ schemaVersion: 2, experiments: [...] }`. Each public experiment is a plain-text editorial configuration plus `protocol` (declarative schema v1), `protocolHash`, protocol version, duration, eligibility and consent. Results remain `null` until explicitly published. Actor identities, reviews and participant data are omitted. See [the precise contract and execution semantics](./mina-experiment-schema.md).

A Stage 6B app must use the exact assigned participant snapshot/version, not silently switch to the latest public configuration. The public catalog describes studies; it does not authenticate participants, allocate conditions or collect responses. No Flutter consumption code is added here.

## Firestore rules, indexes and deployment

A read-only Firebase Rules API inspection of the deployed `flow-9d714` rules confirmed:

- `minaExperiments/{id}` roots are readable by anyone when status is `published` or `closed`, or by Firebase admins. All client writes are denied.
- `private/{docId}` under an experiment is explicitly denied for all client reads/writes. The dashboard therefore stores the complete configuration, unpublished results and review identities in `private/admin`. The public root receives only the whitelisted serializer output and `publishedVersion`, in the same transaction. Unpublishing results removes them from the root as well as from the public API.
- Existing `versions/{versionId}` rules allow the current published version and pinned `minaEnrollments` participants to read the appropriate version. Stage 6A reuses this path with immutable scientific snapshots and omits admin identities from those potentially client-readable documents.
- `revisions`, `minaExecutionCapabilities` and the website championship/membership/session collections fall through to default deny for clients. The Admin SDK serves them only after server authorization where applicable.
- Existing owner-scoped `users` rules and the planned `minaEnrollments`/responses rules are preserved. No broad top-level allow overrides these restrictions. Current rules do not expose paused roots directly; the website can still serve its sanitized paused page through the trusted server.

No rule change is required for this Stage 6A storage layout, and none was deployed. There is no checked-in active rules source in this website repository; do not replace the deployed app rules with a blanket website rule file. Review Stage 6B identity/response/assignment integration separately before extending access. Inspection read policy source only, not participant or health response documents. Rule enforcement was reviewed from source, not exercised with live non-admin accounts or an emulator.

The index example `firestore.mina-tests.indexes.json` adds the `minaTestParticipants` (`experimentId`, `status`) composite alongside existing community indexes. Merge this example into the project's actual index configuration if Firestore requests it. Do not replace Flutter's indexes. Normal single-field indexes serve the published status query and experiment membership existence query. No Firebase rule/index deployment, account creation, claim grant or Cloud Function deployment was performed.

Deploy this Next.js application through its existing host after configuring environment, first admin, reviewed protocol/consent, verified interpreter capabilities, rules and any required index. Keep the existing Firebase project and email sender. No new dependency or service is required.

## Files changed

New routes: `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/experiments/layout.tsx`, `app/admin/experiments/page.tsx`, `app/admin/experiments/[id]/page.tsx`, `app/admin/experiments/[id]/preview/page.tsx`, `app/api/admin/session/route.ts`, `app/api/admin/experiments/route.ts`, `app/api/mina-tests/experiments/route.ts`, `app/api/mina-tests/experiments/[id]/route.ts`, `app/mina-tests/[id]/page.tsx`.

New components: `components/MinaAdmin.tsx`, `MinaAdminLogin.tsx`, `ExperimentVideo.tsx`, `PublishedExperiment.tsx`, `PublishedExperiments.tsx`, `MinaProtocolEditor.tsx`, `MinaProtocolPreview.tsx`.

New helpers/tooling: `lib/mina-experiments.ts`, `lib/server/mina-experiments.ts`, `mina-admin.ts`, `mina-admin-page.ts`, `mina-admin-http.ts`, `scripts/mina-admin.mjs`, `tests/mina-admin.test.ts`, `lib/mina-protocol.ts`, `lib/server/mina-protocol.ts`, `tests/mina-fixtures.ts`, `docs/mina-experiment-schema.md`, this document.

Updated: `app/mina-tests/page.tsx`, `app/mina-tests/results/page.tsx`, `app/competition/page.tsx`, `app/api/mina-tests/enroll/route.ts`, `app/globals.css`, `components/ExperimentSignup.tsx`, `components/MinaSignup.tsx`, `lib/firebase-admin.ts`, `lib/championship-types.ts`, `lib/championship-validation.ts`, `lib/server/championship-service.ts`, `championship-http.ts`, `mina-model.ts`, `mina-participation.ts`, `next.config.ts`, `firestore.mina-tests.indexes.json`, `package.json`, `tests/championship.test.ts`, `docs/mina-tests.md`. The ignored local `.env.example` also documents `FIREBASE_WEB_API_KEY`; no local secret values were changed.

## Verification

Actual checks:

- `node --conditions=react-server --import tsx --test tests/championship.test.ts tests/mina-admin.test.ts`: **29 passed**, including the original 16 invitation/referral tests. `npm test` now runs both suites. New tests cover missing/forged/non-admin/revoked/disabled authorization, declarative-schema and capability gates, immutable published version snapshots, exact-content reviews, media validation, private results serialization, optimistic conflicts, enrolled protocol/consent locks, audited saves, configured experiment IDs and pause/confirmation behavior. Tests also verify that unpublished result drafts and reviewer identities never reach directly client-readable roots or version documents. Store/Auth test doubles do not contact the live project. Synthetic test executors do not certify a real scientific protocol or Flutter compatibility.
- `node node_modules/eslint/bin/eslint.js .`: passed without errors or warnings.
- `node node_modules/typescript/bin/tsc --noEmit`: passed. Production webpack compilation also checks TypeScript.
- `node node_modules/next/dist/bin/next build --webpack`: production build passed. The default `next build` was also attempted, both within and outside the sandbox, and failed with a Turbopack internal CSS child-process connection panic. This environment-specific failure remains; no claim is made that the default Turbopack build passed. For this environment use `npm run build -- --webpack`.
- Real local HTTP smoke checks: `/admin` returned 200; protected list, new editor and saved preview returned 307 to `/admin`; unauthenticated GET/POST management API returned 401; forged-session GET returned 401; cross-origin POST returned 403. All responses were checked without authenticated writes. Initial loopback requests were blocked with EACCES in the sandbox; the successful checks used an approved local process outside that restriction and Next's localhost request origin.
- Final webpack production build completed successfully, including all admin, public experiment and public configuration API routes. A restricted retry encountered an EPERM on generated `.next` output; the final approved unrestricted build passed.

Limits: in-app browser access to the sandbox preview timed out, so there is no claimed visual browser QA. Actual Firebase admin login, database saves/count queries, signed/embedded video playback, genuine email delivery and live non-admin Firebase accounts were not exercised end to end. They require configured credentials and explicit test accounts. The deployed rules were inspected read-only, but live client rule-enforcement tests remain outstanding. Verified Flutter interpreter capabilities and a reviewed scientific protocol remain prerequisites for live publication. General draft authoring is fully database-driven and does not depend on either prerequisite. No live data was seeded or migrated, and no Firebase changes were deployed.
