# Mina Tests declarative configuration — Stage 6A

Stage 6B adds review-hashed structured enrollment, bundled sound identities and labelled scales. See the [Android integration continuation](mina-stage-6b-android.md) for the current additive contract, verification gates and controlled-test procedure. Historical Stage 6A implementation notes below describe their original stage.

## Source of truth and version identities

`minaExperiments/{id}` is the canonical Firestore experiment path already present in deployed security rules. The complete authoring configuration lives at `minaExperiments/{id}/private/admin`; the root is a public projection updated atomically with it. This is one canonical source with a derived publication view, not competing experiment records. An experiment's free-form category does not select a hardcoded Flutter experiment. Code defines the data language and validates it; Firestore supplies each study's actual definition.

Three separate versions have distinct meanings:

- Public API envelope **schemaVersion 2** describes website/editorial fields plus a declarative protocol. The prior envelope v1 had only descriptive protocol fields; this is a versioned contract change before Flutter consumption begins.
- `protocol.schemaVersion: 1` describes the execution language below.
- `protocolVersion` is the administrator's immutable scientific version label for that experiment. A published label cannot later describe different scientific content. `revision` is the independent editorial/audit save counter.

The API returns `schemaVersion`, `id`, `title`, `description`, `explanation`, `introVideoUrl`, `instructionsVideoUrl`, `thumbnailUrl`, `protocolType` (descriptive category), `protocolVersion`, `durationNights`, `protocol`, `protocolHash`, `instructions`, `eligibility`, `consentReference`, `status`, `updatedAt`, and `results: null | { summary, videoUrl }`. The list includes published configurations only. The detail endpoint includes published and previously published paused configurations. Draft, never-published paused and archived configurations return 404 publicly. Review/admin identities and raw responses are never public.

No deployed definition, participant or legacy ID was migrated or renamed. The static legacy acquisition page is retained for existing links; it is not a verified scientific executor or an alternative catalog for new studies.

## Protocol schema v1

The following is an illustrative **incomplete draft**, not an approved brown-noise protocol. The missing durations, hosted audio and nightly schedule deliberately prevent publication:

```json
{
  "schemaVersion": 1,
  "conditions": [
    {"id": "brown-noise", "label": "Brown noise (proposed)", "activityIds": ["sound"], "weight": 1},
    {"id": "silence", "label": "Silence (proposed)", "activityIds": ["quiet"], "weight": 1}
  ],
  "activities": [
    {"id": "sound", "type": "audio.playback", "version": 1, "audioUrl": "", "durationSeconds": 0, "taskId": "", "questionIds": []},
    {"id": "quiet", "type": "audio.silence", "version": 1, "audioUrl": "", "durationSeconds": 0, "taskId": "", "questionIds": []}
  ],
  "questions": [],
  "nightlySchedule": [],
  "randomization": {"method": "none", "unit": "participant", "allocationOwner": "server"}
}
```

The guided editor offers a complete seven-night proposed template or a blank definition. The deliberately sparse JSON above remains an example of an incomplete draft, not the guided template. See [builder workflow](mina-builder-ux.md). Other studies can combine the same reusable types without adding a study-specific executor or changing website source.

| Reusable activity | v1 configuration semantics |
| --- | --- |
| `audio.playback` | Play `audioUrl` for `durationSeconds`; HTTPS asset with no embedded credentials. The executor must verify actual supported format and availability before enrollment. |
| `audio.silence` | Explicit silence condition for `durationSeconds`; no inference about sleep or cognitive performance. |
| `cognitive.task` | Invoke an implemented reusable `taskId` for the configured duration. The capability manifest must explicitly support that task. No arbitrary code, game definition or remote script is allowed. |
| `survey` | Present the ordered `questionIds` from the question catalog. |
| `check_in` | Present the ordered `questionIds` as a check-in. This does not imply a diagnosis or measurement not collected. |

Every activity has a stable ID, type, activity version and the same bounded shape (`audioUrl`, `durationSeconds`, `taskId`, `questionIds`), with irrelevant fields ignored by the v1 interpreter. A future named activity can be retained in drafts but cannot publish without verified interpreter support for that exact type/version. Unsupported protocol-language versions are rejected; an actual language expansion must be versioned rather than silently changing v1 semantics.

Questions have `{ id, prompt, type, required, options, min, max }`. Types are `boolean`, `scale`, `single_choice` and `text`. Scale bounds must increase before publication. Single-choice questions need at least two distinct nonempty options. `options` applies only to choices; bounds apply only to scales. Response data remains in separately authorized participant storage, never the public catalog.

Schedule entries have `{ night, phase, conditionId, activityIds }`. Nights are one-based and bounded to 365; phase is `evening` or `morning`. Morning means the morning following that numbered night. A given night/phase can appear only once. At publication every night in `durationNights` must have at least one executable entry, and no entry may exceed the duration. Process entries by night then evening before following morning, regardless of document-array order.

`conditionId` can reference a condition, be `none`, or be `assigned` under randomization. For a condition reference, execute that condition's ordered activities **first**, then the entry's ordered additional activities. `none` executes only the additional activities. This allows a morning survey without replaying the evening audio condition. Empty execution is blocked. Within an ID list, duplicates are rejected; IDs can appear in different entries intentionally. All activity/question/condition references are checked on the server.

Randomization supports:

- `method: none`: each entry explicitly chooses its condition or none; `assigned` is invalid.
- `method: weighted`: independent weighted sampling with replacement from condition weights. Each positive weight is normalized by their sum. This does **not** specify a balanced, counterbalanced or crossover allocation.
- `method: paired_crossover`: additive, explicitly capability-gated extension. Requires `unit: night` and `pairs: [{ nights: [2, 3], conditionIds: ["condition-a", "condition-b"] }]`. Each pair has two distinct nights and two distinct existing conditions. Every participant receives each condition exactly once within that pair, with a uniformly randomized order chosen independently for each pair. Weights do not apply. Pair nights cannot overlap; their schedule uses `assigned` (and may have separate `none` entries for check-ins), never a fixed condition. Every assigned night must belong to a pair. Fixed baseline nights may exist outside pairs. The trusted backend must persist the full assignment idempotently; retries and reopening cannot reroll it. No assignment implementation ships in Stage 6A. Existing `none`/`weighted` payloads and hashes remain unchanged; older executors must reject the new method.
- `unit: participant`: one persisted condition for that participant across all assigned entries.
- `unit: night`: one persisted condition per participant/night, reused for evening/following-morning assigned entries for that night.
- `allocationOwner: server`: assignments must be generated and persisted idempotently by a trusted backend, never chosen or rerolled by the client. Stage 6A stores the declaration but performs no allocation.

Limits: 100 activities, 100 questions, 30 conditions, 730 schedule entries, bounded strings and a 256 KB management request limit. Arrays preserve execution order. Drafts may omit the complete schedule, durations or prompts, but must have structurally valid data, unique IDs and valid references. Publication adds scientific completeness, capability and review checks. No arbitrary scripts, conditions expressed as executable code, or remote expressions are supported.

## Verification gates and capability data

The server reads trusted Firestore document `minaExecutionCapabilities/flutter`. It is runtime compatibility metadata, not a second experiment collection. It is not writable through any dashboard/public API. A trusted operator must attest capabilities only after testing the actual released Flutter interpreter **and** any required assignment backend. There is no auto-seed and no verified runtime is claimed in this stage.

An intentionally **unverified**, non-executable example of the document shape:

```json
{
  "schemaVersion": 1,
  "verified": false,
  "appBuild": "",
  "verifiedAt": "",
  "protocolSchemaVersions": [],
  "activityVersions": {},
  "cognitiveTaskIds": [],
  "questionTypes": [],
  "randomizationMethods": [],
  "randomizationUnits": []
}
```

Once independently verified, the manifest must identify the tested app build, ISO UTC verification date, supported protocol schema versions, exact activity-type versions, implemented cognitive task IDs, question types, and randomization methods/units. For example, support for a survey does not imply support for every question type, and support for cognitive tasks does not imply every task ID. Setting `verified: true` alone does not satisfy the other checks. A capability declaration is an operator attestation, not automated proof of Flutter implementation.

Optional verified authoring catalogs are `audioAssets: [{ id, label, url }]`, `cognitiveTasks: [{ id, label }]` (labels for supported `cognitiveTaskIds`), and `questionDefinitions: [{ id, prompt, type, required, options, min, max }]`. The builder does not invent these entries. Audio publication additionally requires an exact HTTPS URL match in `audioAssets`. Question templates are conveniences; the exact configured wording, answer type and bounds still require the scientific review. Do not mark `paired_crossover` supported until both the released interpreter and trusted assignment backend have been tested together.

Each experiment also needs the admin's explicit **Save and record my review of this exact protocol** action. The server creates the review UID/time and hashes canonical JSON containing experiment ID, category, protocol version, duration, the entire declarative definition, eligibility, consent reference and participant instructions. Unknown client review/hash/actor fields are discarded. Changing any hashed field invalidates the review. This is scientific configuration review, separate from runtime capability verification. Both are required at publication; they are not a study allowlist. New configurations using already verified activities can be reviewed/published through the dashboard without a source or app update.

Missing, revoked or unsupported capabilities block publication and new enrollment. Invite links still verify ownership without enrolling when runtime verification is unavailable. Already enrolled participants retain access to their existing membership; the Stage 6B executor must enforce its execution/withdrawal policy separately.

## Immutable participant definitions

On successful publication the server creates `minaExperiments/{id}/versions/{protocolVersion}` with the exact scientific definition, SHA-256 hash, verifying app build, creation timestamp and `published: true`. Admin review identities stay in server-only authoring/audit records, not client-readable versions. The public root sets `publishedVersion` for compatibility with the already deployed version-read rules. It uses create-only writes; the same version label with a different hash is rejected. Each ordinary save is separately audited in server-only `revisions/{revision}`. Unpublished results, review metadata and complete draft state never enter the publicly readable root.

At signup, configured membership records receive `protocolVersion`, `protocolHash`, `protocolSnapshot`, `configRevision` and `consentReference`. The full scientific snapshot is separate from editorial copy and aggregate results. The definition locks conservatively at the first membership (including interest/test records). Later enrollment confirmation leaves the assigned snapshot unchanged. Existing records without version/snapshot fields remain legacy/unversioned; no historical consent or random assignment is fabricated. New publication never rewrites historical participants.

Once memberships exist, protocol, eligibility, instructions and consent changes require a duplicate under a new experiment ID in this lightweight dashboard. Without memberships, a new protocol version can be authored and reviewed under the same experiment ID while older published version documents remain intact. Editorial title, explanation and Mina videos can be changed with revision history. Archiving never deletes membership or protocol-version records.

## Stage 6B implementation plan — documentation only

1. Replace study-specific hardcoded Flutter control flow with a schema-v1 parser and reusable activity renderers. Fetch the schema-v2 public catalog for discovery; unknown envelope, language, activity or task versions fail closed. Validate asset playback on the supported platforms.
2. Add an authenticated participant bootstrap endpoint that maps the existing verified website membership to the authenticated Flux identity and the already reserved `minaEnrollments/{experimentId_uid}` model (whose existing rules pin `experimentVersion`) and returns **that participant's assigned snapshot/version/hash**. Never trust the client's experiment ID, consent or assignment claims; never silently replace an assigned snapshot with the latest public definition. Legacy/unversioned memberships require an explicit approved transition/consent flow.
3. Implement trusted, idempotent random assignment, persist it against experiment/version/participant and optionally night, and return it to Flutter. Use a secure server random generator, preserve assignment history, enforce the declared weights/unit and prevent rerolling on retries/reinstalls. Do not claim crossover balancing from the independent weighted method.
4. Implement schedule progress, activity events, required check-ins/surveys, offline/retry behavior, timezone/night-boundary rules, consent withdrawal and app-side eligibility handling. Responses must carry exact experiment/version/hash and activity/question IDs. Reuse the existing owner-scoped `minaEnrollments`/responses policy where compatible and add separately reviewed authorization; keep responses separate from public summaries.
5. Define and verify the actual completion/activity/dropout schema before enabling those metrics. No completion counts are invented in Stage 6A.
6. Test each supported capability against a released Flutter build and assignment backend, then have an authorized operator populate the capability manifest. Review the first real scientific protocol through the dashboard before publishing. Deployment of website, rules or Cloud Functions still requires the user's approval.

No Flutter code, assignments, capabilities attestation, Firebase deployment or website deployment is performed in Stage 6A.

## Overnight session extension (20 October 2026)

Audio playback and silence activities may now declare `sessionMode: "timed" | "overnight"`. Omission means the existing timed behavior. Validation does not add a default field to saved legacy activities, so their payloads and scientific hashes remain unchanged. Explicit modes are accepted only for `audio.playback` and `audio.silence`.

For `overnight`, `durationSeconds` must be `0` (unused), never an assumed eight-hour or other fixed duration. This declares a sleep-session observation/playback intent; the executor must not treat zero as a timed stop. Silence represents an overnight observation window with **no experimental audio**. Exact lifecycle, interruptions, ending and reliable recording remain unverified pending Stage 6B. The server unconditionally blocks overnight publication in Stage 6A, including for manifests that otherwise verify the activity type/version. No client or manifest flag enables it in this stage.

For timed activities, the existing positive-duration publication requirement remains. Explicitly changing session mode changes the scientific hash and is subject to existing review invalidation, versioning and enrollment locks. No existing record or snapshot is migrated.

The new brown-noise template defaults both condition activities to overnight, preserves the silence baseline and three randomized pairs, and places the check-in every morning after a study night. Assets, question definitions, eligibility and consent remain unresolved until actually supplied and reviewed.
