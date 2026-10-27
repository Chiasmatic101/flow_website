# Stage 6B implementation status — 20 October 2026

**Continuation:** [Android integration report](mina-stage-6b-android.md) describes the completed execution path and remaining device-verification gates. The text below records the earlier partial delivery.

This is a **partial implementation**, not a completed or publishable brown-noise executor. Nothing was deployed and no live Firebase data was written. The released Android app, background audio, overnight recovery, identity linkage to website membership and research consent experience have not been verified end to end.

## Architecture and differences found

Stage 6A publishes schema-v2 public projections and immutable `{ definition, hash, published }` version documents. Flutter's existing engine instead expects `durationDays`, `blocks`, `consent`, and a `schedule.days` document. Its callables use legacy block IDs, offset-based dates and a different assignment language. Passing new definitions through that engine would be incorrect.

The new, separate declarative path queries published Firestore roots, displays editorial content and published results, and uses six authenticated callables. Legacy records, callables and retry storage remain supported separately. Existing sleep personalization, alarms, snooze, games/scoring, ordinary audio and Mina home-card assets were not modified.

`minaProtocolEnroll` transactionally reads the public root, immutable version, capability manifest and a reviewed eligibility policy. It checks consent reference and hash, explicit acceptance, age and attestations; pins the complete definition; creates cryptographic assignments once; and rejects existing legacy enrollments rather than inventing historical consent. `minaProtocolState` returns that snapshot and derived schedule. `minaProtocolStart` persists an idempotent server start. `minaProtocolSubmit` validates exact questions, bounds and stable task IDs, stores receipt time, prevents conflicting finalized retries and keeps one private answer record per night/question. `minaProtocolWithdraw` stops further execution.

Assignments support `none`, `weighted` and `paired_crossover`, including participant/night units where defined. No experiment IDs or seven-night sequence are hardcoded in production. Pair definitions supply the baseline/schedule from Firestore; weighted randomization is never substituted for crossover.

The pinned IANA timezone determines civil study dates over DST; travel does not move the study. Candidate `local-evening-following-morning-v1` semantics are evening 18:00 through following noon, morning 04:00 through 18:00, with night 1 on the enrollment civil date. These are explicit reusable executor semantics, not scientific approval of a particular schedule. Publication now requires attestation of this exact schedule identifier. Reads never advance nights. Missed tasks remain visible. Server-opened sessions can submit within seven days for recovery, with actual receipt time; future sessions cannot start early.

Flutter has a separate owner-scoped durable retry queue, cached owner-scoped progress, and a foreground silence observation counter persisted under user/experiment/hash/task. Background and restart gaps receive no exposure credit. Failed starts do not enable submission. Client observation is a report bounded by server elapsed time, not tamper-proof proof of adherence.

## Actually implemented activities

- `survey` and `check_in` v1: dynamic boolean, numeric scale, exact single-choice options and text, using stable question IDs. Responses are experiment-linked and never imported from personal sleep records.
- `audio.silence` v1, timed/foreground only: explicit observation window, zero audio exposure, conservative interruption handling and persisted observed counter.
- `audio.playback`, `cognitive.task` and all overnight sessions are **unsupported in this declarative path**. Their legacy components exist but have not been adapted and verified against this contract. Unknown types/versions fail closed. There is no claim that the full requested Stage 6B is finished.

The Flutter candidate manifest is `minaDeclarativeCapabilities` in `lib/screens/mina/mina_declarative.dart`; `verified` remains false, with no verified sounds or task IDs. It must not be uploaded as verified. The website additionally gates `sessionModes` and `scheduleSemantics`. Overnight publication remains unconditionally blocked.

## Eligibility and question-contract gaps

Stage 6A has only free-text `eligibility`, not a machine-readable minimum age or eligibility criteria. New enrollment therefore requires trusted server-only `minaExperiments/{id}/private/enrollmentPolicy` containing `{ protocolHash, minimumAge, consentText, requiredAttestations: ["exact attestation text", ...] }`. The policy must match the current published hash. Approved participant-readable consent text is mandatory, displayed before acceptance and preserved in the server-owned consent record. No policy is auto-created. This is a temporary fail-closed bridge: add structured, review-hashed eligibility/consent to the dashboard/version contract before claiming dashboard-only scientific authoring is complete. This implementation collects an age attestation, not independently verified identity or age.

The current app's personal check-in definitions (`lib/screens/sleep/checkin/checkin_models.dart`) are:

- `sleep_quality`: “How well did you sleep last night?”; integer 1–5; Very poorly, Poorly, Okay, Well, Very well.
- `alertness`: “How alert do you feel right now?”; integer 1–5; Very sleepy, Sleepy, Neutral, Alert, Very alert.

The legacy Mina block instead asks “How would you rate your sleep?” and “How rested do you feel right now?”; restfulness must not be relabelled alertness. Stage 6A scales currently lack answer-label and integer-step metadata. Do not attest brown-noise question equivalence until that contract preserves approved labels/representation and the research form is verified. The new renderer shows the configured wording and numeric bounds without manufacturing these labels.

## Changed files

Website: `lib/mina-protocol.ts`, `tests/mina-fixtures.ts`, `tests/mina-admin.test.ts`, this document. Existing Stage 6A uncommitted changes were retained.

Flutter repository: `functions/index.js`; new `functions/lib/declarative.js`, `functions/lib/declarative_handlers.js`, `functions/test/declarative.test.js`; new `lib/screens/mina/mina_declarative.dart`, `mina_declarative_service.dart`, `mina_declarative_page.dart`, `mina_declarative_empty_guard.dart`; integration changes in `mina_tests_page.dart`, `mina_service.dart`, `mina_outbox.dart`; new `test/mina/declarative_test.dart`, `declarative_widget_test.dart`; queue isolation test in `test/mina/outbox_test.dart`.

## Deployment boundary

Do not deploy until the implementation and outstanding contracts are reviewed. Existing checked-in rules already deny all client writes and protect private documents and owner enrollments/responses; no rules or indexes were changed. Local source inspection is not live rules verification. No rules, indexes, capabilities or policy documents were deployed or seeded. Functions use default project `flow-9d714` and `us-central1`.

After explicit approval, the selective callable deployment command from `C:\Users\akpoo\StudioProjects\flow` is:

```powershell
firebase deploy --project flow-9d714 --only functions:minaProtocolEnroll,functions:minaProtocolState,functions:minaProtocolStart,functions:minaProtocolSubmit,functions:minaProtocolPolicy,functions:minaProtocolWithdraw
```

The website's updated publication gate and the Flutter app also require their normal reviewed releases, separately approved. No blanket Firebase rules/index deploy is required by these changes. Trusted operator policy/capability writes remain separate live configuration changes requiring approval. Do not overwrite the currently deployed runtime capability document with a synthetic test fixture.

## Android verification and first brown-noise publication

1. Complete declarative playback and cognitive adapters, structured review-hashed eligibility/consent, scale labels/representation, website membership identity transition and protocol-defined overnight lifecycle. Preserve existing enrollment snapshots. Add contract/emulator tests with real callable serialization and security rules.
2. Connect a physical Android test device and a dedicated emulator/test Firebase configuration. Run `flutter test test/mina`, `flutter analyze`, and build the intended Android variant. Install/run that build with approved test accounts. Do not use production study records as test fixtures.
3. Verify published-only discovery, videos/thumbnail failures, consent decline/minimum-age failures, retries/reinstall assignment stability, exact question wording, missed days and DST/timezone travel. Submit an answer offline, restart, reconnect and verify one finalized answer per task/night/question. Repeat with another signed-in account to check isolation and withdrawal.
4. For playback/overnight, test lock screen, Android background restrictions, process death, device restart, interruptions, early stop, network loss, exposure accounting and resume. Confirm alarms and snooze still work. Record device/OS/build, logs and observations; host Flutter tests do not establish Android reliability.
5. Attest only the tested released interpreter and backend capabilities, exact sound IDs/URLs, games and approved question definitions. Overnight remains blocked until its explicit publication gate is implemented against completed verification evidence; merely setting a manifest flag cannot enable it.
6. Create/review the actual seven-night definition in the dashboard: fixed silence baseline; three pairs using `paired_crossover`; exact approved sound asset and overnight semantics; exact following-morning sleep quality/alertness questions; structured eligibility and participant-readable consent. Clear every publication issue and perform an end-to-end dry run before publication. Do not publish the current draft.

## Checks actually run

- Backend: `node --test (Get-ChildItem functions/test/*.test.js | ForEach-Object FullName)` — 114 passed, including 14 new declarative cases.
- Flutter: `flutter test --no-pub test/mina` — 68 passed, including parser rejection, unsupported-protocol widget and durable queue isolation cases.
- Targeted Flutter analysis of all six changed/new runtime Mina files — no issues found. An earlier pass found syntax/lint issues that were corrected and rechecked.
- Website: `npm test` — 37 passed; `npm run lint` and `tsc --noEmit` passed.
- Website production: `next build --webpack` passed outside the sandbox after the sandbox run compiled/type-checked but failed generating a directory with EPERM. Default Turbopack was not run for this stage.
- `git diff --check` passed in the website checkout, with existing LF/CRLF normalization notices.

The Android debug APK compiled successfully with `flutter build apk --debug --no-pub`. Targeted declarative parser/widget tests were rerun after the last consent/recovery edits and all five passed. This is compilation/host verification, not an Android device test. The backend tests use an in-memory transaction double; they do not certify emulator, network or real Android behavior. No physical-device Android tests, callable emulator/rules integration or live research enrollments were run.
