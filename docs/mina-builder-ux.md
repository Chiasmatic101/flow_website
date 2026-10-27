# Mina experiment builder UX — Stage 6A

Implemented locally, 20 October 2026. No deployment, Flutter changes or live Firebase writes.

## Workflow

Open **Admin → Experiments → Create experiment**. The five steps are Choose an experiment, Basic information, Design the experiment, Activities & check-ins, and Review & save. Progress buttons allow moving between steps without clearing values. Save draft retains the current step; reopening a saved experiment loads its complete configuration into the same interface. Advanced Settings hold stable identifiers, activity versions and protocol metadata. Leaving unsaved changes prompts a warning.

To create the proposed brown-noise experiment, choose **Brown Noise vs Silence → Use this template**. Add the real Mina video, descriptions, reviewed eligibility and approved consent. Inspect the plan, choose a verified sound and reviewed session/observation lengths, and supply the actual sleep-quality/alertness question wording and response types. Save at any point. Review & save provides the full human summary, preview of current unsaved edits, explicit Record protocol review action and gated Publish.

The template has seven nights: night 1 silence baseline; randomized pairs 2–3, 4–5 and 6–7. Every pair includes exactly one brown-noise and one silence night, yielding three brown-noise and four silence nights. Morning check-ins follow all seven nights. There is no default cognitive game. The preview never produces assignments. Whole-pair resizing supports odd durations from 3 through 365 nights. This is a proposed configuration, not clinical validation or proof of released app support.

## Schema and preservation

The minimal extension adds `randomization.method: paired_crossover` with explicit two-night/two-condition `pairs`, `unit: night` and `allocationOwner: server`. Existing none/weighted configurations retain their payload shape and scientific hashes. Validation rejects overlapping pairs, duplicate conditions, fixed conditions inside pair nights and assigned nights outside pairs. Publication separately checks complete schedule/duration and verified interpreter support. See [schema contract](mina-experiment-schema.md) for exact semantics.

Optional trusted capability catalogs provide sound labels/URLs, game labels and reviewed question templates. No asset or game identifier, approved question wording, response scale or capability verification is fabricated. A playback URL must match a verified sound asset at publication. The existing server remains responsible for authentication, optimistic concurrency, private storage, scientific review hashes, immutable published snapshots and publication gates.

Existing records are edited without reconstructing their scientific plan. Custom schedules, unused fields and saved unsupported activities remain intact. Enrolled scientific fields are locked and duplication creates an independent draft with a new version label, no participants, no review and no copied results. For a previously published un-enrolled experiment, material edits save as a new draft version. Published snapshots remain create-only. Metadata changes retain the existing protocol.

## Validation performed

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- ESLint: `node node_modules/eslint/bin/eslint.js` passed.
- Production build: `node node_modules/next/dist/bin/next build --webpack` passed. Webpack is used because the local sandbox previously blocked Turbopack CSS subprocesses. The existing parent lockfile warning is informational.
- Regression and focused tests: `node --conditions=react-server --import tsx --test tests/championship.test.ts tests/mina-admin.test.ts` — 34 passed. Covers auth, referral/email-verification regressions, private results, immutable versions, capability gates, template structure, pair validation, draft create/edit round-trip, duplication and shared-question preservation. Firestore transactions use an in-memory test double.
- Isolated browser fixture renders the actual React builder and CSS with a mock local save endpoint, no Firebase connection. Checked template selection, form population, saving without losing the step, activity-specific fields, scale controls, unsaved participant preview, disabled Publish, desktop 1440px and mobile 390px layouts, and absence of horizontal overflow/browser console errors. Screenshots were captured. The fixture is generated under ignored `node_modules/.cache/mina-preview`, never added as an unauthenticated application route.
- Real authenticated Firebase browser save/reopen was not run: no authorized admin session/account was supplied, `FIREBASE_WEB_API_KEY` was absent at the preceding environment audit, and live writes require approval. This task does not claim real-environment CRUD verification.

## Publication blockers

The actual Flutter interpreter and trusted pair-allocation backend must be verified together before publishing. Required remaining input includes verified sound assets, reviewed timing, final question wording/types/scales, reviewed eligibility/consent, Mina introduction video and explicit exact-plan review. Stage 6B must generate and persist uniformly randomized within-pair assignments idempotently, pin the immutable protocol snapshot at enrollment, execute reusable activities and check-ins, store responses privately and reject unsupported schema/method/type versions. Nothing in this UI enables live execution by itself.

## Files changed for this UX task

- `components/MinaExperimentBuilder.tsx` — five-step authoring, saving, review, preview, publishing checklist.
- `components/MinaBuilderDesign.tsx`, `components/MinaDesignTimeline.tsx` — visual plan and paired timeline.
- `components/MinaBuilderActivities.tsx` — conditional sound/game/question forms and activity placement.
- `components/MinaAdmin.tsx`, `app/admin/experiments/[id]/page.tsx` — use the guided editor for new, existing and duplicated experiments.
- `components/MinaProtocolPreview.tsx`, `components/PublishedExperiment.tsx` — friendly, accurate participant plan preview.
- `lib/mina-builder.ts` — template, defaults, duplication, counts, blockers and question cleanup.
- `lib/mina-protocol.ts` — paired declaration validation and trusted authoring catalogs/audio capability gate.
- `app/globals.css` — responsive dark Mina builder styling.
- `tests/mina-admin.test.ts` — five focused regression tests.
- `docs/mina-experiment-schema.md`, `docs/mina-builder-ux.md` — contract and delivery notes.

Other working-tree changes predate this UX task and were preserved.

### Focused follow-up: overnight activity choice

Audio/silence cards now offer Timed session (minutes) or Overnight sleep session. Minutes appear only for timed sessions; overnight cards show an explicit unverified Stage 6B notice. Silence uses an overnight observation window without experimental audio. Scheduling labels now read Only when [condition] is assigned, Every evening, and Every morning after a study night. Newly created brown-noise templates choose overnight for both conditions; existing saved protocols are not converted.

The optional `sessionMode` schema extension preserves omitted fields on legacy timed activities. Overnight requires `durationSeconds: 0` as unused data, and server capability validation blocks publication unconditionally until Stage 6B implementation and verification. This mode participates in the existing scientific hash and enrollment lock. No Firebase rules, live data or Flutter files were changed.

Focused validation: 36 regression/focused tests passed, including legacy shape/hash preservation, overnight round-trip, rejection of fixed-duration overnight configurations, server publication rejection and enrolled-mode immutability. TypeScript and targeted ESLint passed. No authenticated Firebase browser test or deployment was performed for this follow-up.
