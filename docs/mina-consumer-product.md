# Mina Tests consumer product

Mina Tests lives inside the normal Flux app (`lib/app.dart` → `MinaTestsPage`) and uses its existing Firebase user. The isolated diagnostic staging entrypoint is a development tool, not consumer onboarding. No new accounts, cloud experiments, deployments or APKs were created for this work.

## Implemented

- Experiment home, paginated public catalog, cover images, detail/video/text introduction, inline adult confirmation and Start Challenge.
- Owner-scoped saved experiments remain reachable after pause, completion or withdrawal. Private results remain accessible.
- Existing native background audio and silence, Start/Resume/Finish, immutable server assignments, linked check-ins, skips, durable pending submissions, stop and account deletion.
- Custom dashboard drafts now start with a consumer sleep plan. Configure duration, conditions, implemented Flux sound, fixed/weighted/paired assignment, optional baseline, questions, optional morning games, interval, cover and videos without code.
- Optional morning games use their own server-opened timing and the finished sleep session identity. Games cannot start before sleep completion and preceding morning activities; they do not claim the audio-session mutex.
- Personal comparisons use configured baselines rather than assuming every first night is a baseline. Device playback, server elapsed time and optional sleep estimates stay separate.
- Existing authenticated admin preview, immutable version review, publication, pause, completion, retirement and editorial findings/video controls remain in place.
- Operational aggregate counts include historical admissions, finalized runs, finalization rate, explicit stops and technical endings. Account deletion removes retained records from the rate denominator. Stops are not inferred from inactivity; finalization includes skips and does not prove adherence or benefit.

## First experiment

The Brown Noise template is titled **Does Brown Noise Help You Sleep?** It retains one silence baseline and three server-randomized brown-noise/silence pairs, flexible sessions with a 12-hour interval, four core morning questions and an optional sleep-duration estimate. Both Mina videos remain blank. The local draft is `docs/brown-noise-consumer-challenge.draft.json`; no live configuration changed.

## Limits and release work

- Disclosed aggregate condition averages are implemented in the protected admin editor, separately for each protocol and numeric question. Each participant has equal weight per condition; means with fewer than five contributors are suppressed. Baselines/skips/interrupted nights are excluded. Older plans without the pinned aggregate flag are excluded. These are descriptive app observations, not research or medical efficacy findings. Editorial publication remains explicit.
- Sound choices are the five implemented bundled Flux sounds, subject to the existing capability check. Arbitrary remote sound playback is not advertised as working.
- The new collection-group statistics index and server projections have not been deployed. Each numeric check-in answer adds one participant-scoped statistics read/write; there is no shared write counter. Account deletion recursively removes the projection, so averages do not retain deleted contributions.
- Production has not received these changes. The previously signed staging APK predates this work and is preserved, not represented as a build of the new home/dashboard/game integration.
- Build-specific native playback/recovery evidence remains honest and unverified where evidence is missing. Existing Functions dependency findings still need their documented release decision (`stage8b-security-assessment.md`).

## Shortest publication path

Review the completed local consumer changes and existing dependency decision, then prepare one final signed app build and run a short smoke check in the normal Flux flow (device installation still requires approval). After explicit production deployment approval, deploy the reviewed Mina backend/rules/index changes and admin website to their intended production environment, record truthful capability support, create the Brown Noise draft in the dashboard, preview/review it and explicitly publish with enrollment enabled. Users use their existing Flux account. Videos can be added later without an app update.


Deployment ordering after approval: create the reviewed statistics index and wait until ready; deploy the mutually compatible declarative callables together (including Policy, Enroll and Submit, which share the pinned disclosure hash), with the reviewed deletion implementation and rules; deploy the protected dashboard; then release the app and publish the reviewed challenge. A missing aggregate index shows Unavailable instead of invented zero results. No new callable, shared counter or background aggregation service was introduced.

Validation: focused backend/security, admin and consumer widget regressions pass. Flutter analysis, targeted ESLint and the final Next.js webpack production build pass. No live-cloud verification or APK rebuild was performed for these changes.
