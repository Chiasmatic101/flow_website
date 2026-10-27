# Stage 6B — Android integration continuation

The first seven-night brown-noise/silence protocol now has an implemented execution path. **Android device verification and a controlled end-to-end run remain outstanding. Publication is blocked.** No Firebase deployment, live configuration write, participant creation, website deployment, APK installation or Android release was performed.

This report supersedes the earlier partial-delivery status in `mina-stage-6b.md`.

## What is implemented

- Published Firestore discovery and owner-scoped continuation use the declarative engine. Existing legacy enrollment records remain unchanged and require an approved transition rather than fabricated historical consent.
- `audio.playback` v1 selects existing bundled `brown_noise`, `rain`, `ocean`, `forest` or `winter` assets. Remote audio is explicitly unsupported by this executor. All five files were loaded in host Flutter tests and checked against their SHA-256 digests; this verifies file identity/packaging, **not Android decoding, acoustic output or scientific suitability**.
- Timed and overnight playback/silence use an isolated Android `MinaResearchService`, not the ordinary sleep service or its alarm/snooze controller. Playback uses native `MediaPlayer`; silence plays nothing. Observation state survives Flutter navigation and is saved in app-private native preferences. Android 8/API 26 or later is required for these research activities.
- The native foreground service samples monotonic elapsed time. Only bounded intervals with observed playback and nonzero music volume count as audio exposure. Focus loss, pause, unknown gaps, process recovery and abnormal endings are recorded. A partial wake lock supports native sampling while the screen is off. Unobserved process/reboot gaps never become playback credit. The foreground service is not automatically restarted after process death/reboot; recovery is explicit.
- Both overnight conditions have the same user-start/user-end observation lifecycle. There is no invented eight-hour duration and no silent audio file. Silence adherence is a separate explicit participant report, not proof that no other sound was present.
- A 24-hour service safety stop is an interrupted ending, not an assumed protocol duration. Timed sessions stop at their observed target. Early stops, insufficient exposure and interruptions remain visible in finalized results. Overnight `ended` means the observation was ended; it does not assert full-night exposure or adherence. `finalizedAtMs` records submission progress separately from exposure completion.
- Bundled asset digests are pinned in create-only version documents and copied into enrollment. Android checks the actual packaged file before playback, and the backend checks the reported digest against that assignment. Republishing a different digest under the same scientific version is rejected.
- Server-owned enrollment, assignment, starts, validated responses, withdrawal and question locks remain idempotent. Paired crossover persists once; it is never replaced by independent weighted sampling. An automated seven-night simulation exercises the fixed silence baseline, three balanced randomized pairs and seven following-morning check-ins without rerandomization or duplicate responses.
- The pinned IANA timezone and existing `local-evening-following-morning-v1` calendar semantics are preserved. Morning belongs to the preceding numbered night, including DST transitions. Server-opened interrupted sessions remain recoverable for seven days; reopening does not advance nights.
- Dynamic check-ins preserve exact stable IDs, wording, options, discrete scale increments and labels. The proposed brown-noise template copies the existing personal check-in question definitions as **candidate research questions**, never personal response data: sleep quality and alertness, integer 1–5 with their exact five labels. An administrator must approve their use in the research protocol.
- `cognitive.task` v1 uses the existing `MinaGamePage`/calibration registry through an injected submission callback: `color_match`, `sequence_memory`, `tap_tap_tap`, `color_runner`. No scoring or game mechanics were changed. Existing raw-metric validation is reused server-side.
- Outboxes and cached progress are scoped by participant. Native session identity includes participant/experiment/hash/task. Account changes hide stale forms and stop active research audio; withdrawal stops the research service; ordinary sleep sessions take precedence. The research service never schedules, cancels or snoozes an alarm.

New consent, labelled scales, cognitive tasks and audio extensions require the `mina-android-native-v1` executor handshake. Older clients cannot silently ignore these semantics; legacy definitions without the extensions remain compatible. This compatibility handshake is not device attestation and does not replace the trusted capability/evidence gate.

## Dashboard and immutable consent

The optional additive `protocol.enrollment` extension is now authorable in the dashboard's design step:

```json
{
  "schemaVersion": 1,
  "minimumAge": 18,
  "consentVersion": "approved-version-label",
  "consentText": "The full approved participant-readable consent text",
  "requirements": [{"id": "stable-requirement-id", "prompt": "Exact required eligibility attestation"}]
}
```

The age above is illustrative; the administrator must configure the approved age and requirements. These fields live inside the protocol, so the existing scientific hash, exact-content review, enrollment lock and immutable version snapshot cover them. Flutter obtains consent/eligibility from trusted server code and returns a policy fingerprint; stale acceptance is rejected. Accepted consent text, version, policy hash, timestamps, age attestation and requirement IDs are retained on enrollment. New app enrollment also locks the canonical private authoring record transactionally.

The earlier server-only `private/enrollmentPolicy` bridge remains only for existing definitions without the new extension. New studies no longer require a separate manual eligibility document. Scientific review does not independently verify a participant's age or the truth of their self-attestations.

Activities may add `soundId` instead of `audioUrl`; exactly one source is permitted. Questions may add `step` and `labels`; labelled scales use integer bounds, step 1 and one label per value. Omitted fields do not get inserted into legacy definitions, preserving their existing hashes. The capability manifest explicitly gates these extensions.

## Capability status and publication

The versioned candidate manifest is:

`C:\Users\akpoo\StudioProjects\flow\docs\mina-tests\capabilities.candidate.json`

Regenerate it without Firebase access:

```powershell
node functions/tools/build-mina-capabilities.js
```

It lists implemented activity versions, sound IDs/digests, game IDs, question features, enrollment schema, session modes, randomization and schedule semantics. `verified` and `androidVerification.verified` are **false**, and the tested-build/evidence fields are empty. Do not upload it as a verified attestation.

Both publication and new production enrollment require verified compatible capabilities. Overnight additionally requires matching build/date/evidence and all four recorded verification features: `overnight-playback`, `overnight-silence`, `process-recovery`, `alarm-isolation`. A bare `verified: true`, stale build, missing digest or emulator-only manifest is insufficient.

The Android service declares media-playback and special-use foreground types. Silence uses **special-use**, because it does not play audio. Notification permission, wake-lock behavior, OEM background restrictions and the special-use declaration require actual device/release review. The ordinary notification/alarm service and receivers were retained. Debug builds permit cleartext only to local emulator addresses and disable production Analytics collection; release network/Analytics configuration is unchanged.

## Exact first controlled test steps

**Your approval is required before creating test identities/participant enrollments; live writes and deployments need separate approval. The controlled-run commands below are prepared, not executed.** Use a fresh Android emulator or a dedicated test device; do not overwrite a daily-use Flux installation. A connected Android emulator tests integration but does not establish physical-device overnight reliability.

1. From `C:\Users\akpoo\StudioProjects\flow`, start only local services:

   ```powershell
   firebase emulators:start --project flow-9d714 --only auth,firestore,functions
   ```

   If existing function dependencies are absent, install the declared dependencies in `functions` first. No dependency was added by this change.

2. In a second PowerShell window, prepare local configuration fixtures:

   ```powershell
   Set-Location C:\Users\akpoo\StudioProjects\flow
   $env:FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
   node functions/tools/mina-local-fixtures.js --confirm-local-fixtures
   ```

   This command refuses non-loopback hosts. It creates four synthetic local experiment configurations and an explicitly unverified `localTestOnly` manifest, **not Auth users or participant records**. Only a Functions emulator process may use this test-only compatibility path; deployed functions and website publication reject it. Do not run this tooling against production or copy the manifest into live capabilities.

3. On the selected dedicated device or Android emulator:

   ```powershell
   flutter devices
   flutter run --debug --no-pub -d <android-device-id> -t lib/mina_emulator/main.dart --dart-define=MINA_EMULATOR_HOST=10.0.2.2
   ```

   For a physical USB test device, reverse the emulator ports and use loopback:

   ```powershell
   adb reverse tcp:9099 tcp:9099
   adb reverse tcp:8080 tcp:8080
   adb reverse tcp:5001 tcp:5001
   flutter run --debug --no-pub -d <android-device-id> -t lib/mina_emulator/main.dart --dart-define=MINA_EMULATOR_HOST=127.0.0.1
   ```

   The harness refuses non-debug builds and non-local hosts; configures Auth, Firestore and Functions emulators before use; disables persistent Firestore cache; isolates Flutter preferences; and never starts RevenueCat or ordinary sleep submission sync. It is separate from the existing Firebase-free check-in debug harness.

4. With approval to create synthetic identities/participation, press **Create LOCAL emulator test identity**. Open **LOCAL timed smoke test**. Decline consent, fail the configured age/attestation, then test eligible explicit acceptance. Use a test IANA timezone whose current local time is 18:00–23:59 for an immediate night-1 test; do not change the device clock. Verify one immutable enrollment and one persisted assignment in the emulator UI. Retry/reopen and confirm neither is replaced.

5. Run the configured 10-second brown-noise session, timed silence, existing game and labelled check-in in their saved order. Check actual audio/observation counters, zero silence exposure, unchanged game score, exact labels and stable question IDs. Turn networking off before saving; restart/reconnect and refresh. Confirm one finalized response per task and one question record per night/question, with no cross-account submission.

6. Test **LOCAL overnight sound** and **LOCAL overnight quiet** independently, one active session at a time. Grant notifications, lock the screen, background/reopen, pause/unpause, mute/unmute, simulate an interruption, stop early and save. For a real overnight run, leave each condition until waking. Kill/restart the app or reboot the dedicated device: no playback may be credited for unknown gaps, no automatic restart should occur, and the same server session ID must recover. End and save, then complete the following-morning check-in; verify the experiment/night/version/hash on every stored record.

7. Open **LOCAL seven-night paired test**. Confirm night 1 is silence and each pair 2–3, 4–5, 6–7 contains one of each condition. Follow it over real dates for the controlled seven-night pilot. Automated backend tests already simulate the whole sequence, retries and morning association without a client clock override.

8. In the normal app on a dedicated test device, verify existing sleep playback, alarms and snooze still work; ordinary sleep takes precedence over Mina. Record OS/OEM/build, logs, audio output, permission behavior, interruptions, counters, recovery and check-in storage. Do not set verification flags until these tests actually pass.

## Checks and remaining blockers

### Local harness navigation correction (2026-10-20)

#### Remaining quiet and seven-night local fixtures v2

The two existing catalog IDs now point to new immutable local versions:

| Fixture ID | Version | Development timing |
| --- | --- | --- |
| `mina-local-overnight-silence` | `local-overnight-quiet-v2` | Quiet starts immediately, within 24 hours of server enrollment. Its check-in opens after a successfully saved quiet observation in that same window. |
| `mina-local-seven-nights` | `local-seven-night-paired-v2` | Night 1 opens at enrollment. Every night needs at least 30 seconds of trusted server elapsed time and measured observation/playback. Each successfully recorded phase opens the next after 5 server seconds. The whole run expires 24 hours after enrollment. |

The paired definition retains Night 1 silence baseline and one brown-noise/one silence assignment in each pair (2–3, 4–5, 6–7): three brown-noise and three silence nights among Nights 2–7. Existing server randomization is persisted once; retries and reads do not reroll. Morning questionnaires remain associated with their original participant, experiment, version, night and phase, even though simulated phases occur on the same real date. This fixture currently configures questionnaires but no cognitive activity. No game was added to change its scientific definition; a regression test verifies that any configured morning game retains its duration/raw scoring and must finish before the next night opens.

Backend changes extend the same declarative scheduling/Start/Submit engine. Quiet adds `includeMorning: true` to its enrollment-relative local window. The paired version uses `mode: completion_sequence`, with fixed `phaseDelaySeconds: 5` and `minimumObservationSeconds: 30`. A server-owned `localProgress` records successful task IDs and phase completion timestamps in the submission transaction. Only `completed`/`ended` outcomes advance; short, interrupted or non-adherent finalized records remain truthful and immutable but do not unlock later tasks. Duplicate retries do not move phase timestamps. Device-supplied time, assignments or progress are ignored. The next opening instant is unknown until its prerequisite phase is successfully recorded, then it is shown with second precision. Pending prerequisites, countdown windows, expiry and failed prior results each have explicit reasons.

Both new behaviors require an exact synthetic fixture shape, `protocolType: local-fixture`, Functions emulator context and a `localTestOnly` manifest. Real study IDs, changed baseline/pairs, forged timing parameters and production execution are rejected. Ordinary protocols with no development window still use evening 18:00–following noon and morning 04:00–18:00 in the pinned IANA zone. Legacy quiet/seven-night `local-v1` definitions retain those calendar rules. The already working `local-smoke-v2` and `local-overnight-sound-v2` definitions are unchanged. No production capability or Android verification flag was promoted.

Quiet still routes through the existing native observation service with `silence: true`, an empty sound ID and no audio asset. The fixture contains no playback activity. Native screen-lock/background handling, notification return-to-app behavior, observation counters, explicit ending and recovery remain unchanged. Interrupted/killed-process gaps never become invented observation or playback credit. Existing trusted-session recovery remains bounded to seven days; recovery cannot create a new phase after the 24-hour development run has expired. Native service safety limits and ordinary Flux session isolation remain intact.

The guarded seed tool was run against loopback Firestore only. Before/after fingerprints confirmed **all six existing enrollment records and all six existing immutable version snapshots were unchanged**; the working smoke/sound hashes were checked before seeding. Two new version documents were added and the corresponding local catalog pointers changed. No identity, enrollment, response, production record, rule or index was created or deployed.

S22 instructions:

1. Relaunch the updated debug `lib/mina_emulator/main.dart` build using `127.0.0.1` and the existing ADB reverse mappings (9099, 8080, 5001). Keep the local emulators running. End any active Mina or ordinary sleep session before starting a different research session.
2. Use an identity that has not enrolled in the selected experiment. If necessary, **Reset local Auth session**, then explicitly **Create LOCAL emulator test identity**. Existing participants stay on their old immutable versions; signing in again or retrying enrollment does not migrate them.
3. Open **LOCAL overnight quiet**, confirm `local-overnight-quiet-v2`, review consent/eligibility and join. Choose **Start Quiet → Start session**. Confirm no experimental audio and zero playback counter; test screen lock/backgrounding, then end, answer adherence truthfully and save. A successful observation unlocks its check-in immediately. Plan 15–30 minutes for background testing; perform interruption/recovery cases as separate local runs if they produce an immutable interrupted result.
4. Open **LOCAL seven-night paired test**, confirm `local-seven-night-paired-v2` and the explicit accelerated label, review/accept consent and join. For each assigned night, start the normal observation/audio screen, obtain at least 30 seconds of measured quiet or audible playback, and end/save explicitly. After 5 server seconds, tap the morning row or refresh; complete all required questions and any configured games. Wait another 5 server seconds, then start the next night. The minimum automated sequence is **4 minutes 35 seconds** of server time (7×30 seconds plus 13×5 seconds), plus questionnaire, network and navigation time; allow **10–20 minutes** on the phone. Do not change the phone clock or enrollment timezone to advance.
5. Confirm Night 1 silence, balanced randomized pairs, one immutable response per task, correct per-night morning answers and final successful local progress. Normal Save is unavailable before the accelerated observation target; explicit early/interrupted saves remain possible for honest failure testing. Such a finalized result will visibly block progression and requires a fresh local enrollment to repeat; it is not overwritten or silently skipped.

Validation: all **142 backend tests and 121 Flutter tests passed**; changed-file Flutter analysis reported no issues. Ten new backend tests cover quiet/no exposure, recovery, all eight pair allocations, full seven-night progression, phase delays, client clock/progress rejection, short/failed outcomes, configured game completion, expiry, production restrictions and legacy snapshot pinning. Four new Flutter tests cover the quiet native start contract, accelerated protocol banner/minimum, catalog version/timing labels and blocked-phase explanations. Updated physical-device execution of these two new fixtures remains pending. The local Android debug harness APK compiled successfully. It was not installed or released.

Changed files: backend `functions/lib/config.js`, `declarative.js`, `declarative_handlers.js`, `functions/tools/mina-local-fixture-definitions.js`, new `functions/test/declarative_local_remaining.test.js`, updated legacy assertions in `declarative_local_overnight.test.js`; Flutter `lib/mina_emulator/scenario_menu.dart`, `lib/screens/mina/mina_task_availability.dart`, `mina_declarative_page.dart`, `mina_declarative_audio_page.dart`, expanded `test/mina/emulator_navigation_test.dart`, `activity_execution_test.dart`, new `local_remaining_fixture_test.dart`; this report. No dependencies, native service/game scoring code, alarm/snooze logic or production Firebase configuration changed.

#### Immediate local overnight sound follow-up

The local overnight sound root now publishes **`local-overnight-sound-v2`**, using the existing declarative `localTestWindow` to authorize the evening-labelled sound activity immediately from the server's enrollment timestamp for 24 hours. Playback remains `audio.playback` / `overnight`, bundled `brown_noise`, `durationSeconds: 0`. The existing `MinaResearchService` still handles foreground/background audio, screen locking, notification controls, interruptions and persisted session observations. No native service, playback counter, alarm, sleep personalization or recovery implementation was changed. Morning check-ins retain their regular 04:00–18:00 following-morning window; the seven-night experiment retains its regular 18:00–following-noon evening schedule.

Immediate windows are permitted only for the exact synthetic local smoke or overnight sound fixture shapes, protocol type `local-fixture`, one night and a fixed 24-hour window. The overnight shape must contain the sound activity and its morning check-in. Quiet, seven-night, ordinary experiment IDs, altered protocol types and malformed windows fail validation. Enrollment requires the Functions emulator and `localTestOnly` capabilities, and execution of a stored development window is rejected outside the emulator context. Trusted Start/Submit ordering, consent, version/hash checks, measured playback, interruption outcomes, duplicate handling and seven-day server-session recovery bounds remain enforced. No client clock override or alternate executor was added.

The harness now displays each catalog version and whether it has a 24-hour enrollment-relative development window. The real audio screen receives that timing from the pinned server enrollment, so the development fixture no longer instructs participants to wait until evening. Production audio instructions remain unchanged.

The guarded loopback seed tool was run locally. Before/after fingerprints confirmed **all four existing enrollment records and all five existing immutable version records were unchanged**. The previous overnight `local-v1` version remains stored and any existing participant remains pinned to it. The smoke, quiet and seven-night definitions were checked against their existing protocol hashes before seeding. No identity, enrollment or response was created, and nothing was deployed to production Firebase.

To enroll: relaunch the updated debug harness with the existing loopback/ADB reverse setup. Use a local identity that has not previously enrolled in overnight sound; if needed, choose **Reset local Auth session**, then explicitly **Create LOCAL emulator test identity**. Open **LOCAL overnight sound**, verify the harness shows `local-overnight-sound-v2`, review/accept consent and eligibility, and join. Confirm the assigned version, tap **Start Sound**, grant notifications and press **Start session**. A previously enrolled identity remains on its immutable old version even after catalog publication; it must not be silently migrated.

Expected duration: start with **15–30 minutes** for lock/background/notification pause-resume and interruption checks, then optionally perform a real overnight run (for example 6–10 hours). There is no required fixed playback duration. End and save explicitly. The **24-hour enrollment window** authorizes starting; the existing Android service independently stops after **24 hours of observed session time** as a safety limit. A trusted session may be recovered within the existing seven-day backend recovery bound, but killed-process gaps must never receive assumed playback credit. After a kill/restart, inspect/recover the same observation/session identity and save the truthful interrupted record rather than expecting automatic continuous playback.

Notification detail confirmed in the existing native source: this is an ongoing **tap-to-open** notification whose text directs the user to open Flux to pause or end. Pause/resume/end controls are in the session screen; direct notification transport buttons are not implemented. Exercise notification visibility while locked and tap-to-return, then use those in-app controls. The fixture's notification-control testing instruction refers to this existing path, not newly added native buttons.

Validation: **132 backend tests and 117 Flutter tests passed**, and analysis of every changed Flutter source/test reported no issues. Six new backend tests cover immediate overnight availability, normal morning timing, retained native configuration, stable trusted sessions, truthful interrupted submissions, expiry and recovery bounds, production/local-manifest rejection, forbidden fixture shapes and immutable old enrollments. Two new Flutter tests cover the visible version/window and routing into the existing audio engine with development timing and pinned asset identity. The local Android debug harness APK compiled successfully. It was not installed or released, and updated physical-device background playback is not claimed as verified.

Changed files for this follow-up: `flow/functions/tools/mina-local-fixture-definitions.js`, `flow/functions/lib/declarative.js`, `declarative_handlers.js`, new `flow/functions/test/declarative_local_overnight.test.js`; `flow/lib/mina_emulator/scenario_menu.dart`, `flow/lib/screens/mina/mina_declarative_page.dart`, `mina_declarative_audio_page.dart`; expanded `flow/test/mina/emulator_navigation_test.dart` and `activity_execution_test.dart`; this report.

#### Post-enrollment activity execution follow-up

Assigned activity rows are execution controls, not a read-only protocol summary. The old `_task` renderer set `onTap` to null for every status except `available` or `recoverable`, without explaining the window or giving an availability action. The existing local smoke enrollment was pinned to `local-v1`, `America/New_York`, with no completed tasks, during the afternoon. That fixture used the ordinary server schedule: evening opens at 18:00 and closes at noon the following day. The server therefore correctly reported `upcoming`; Flutter silently disabled the rows. Once the window opened, later activities could appear available even though Start/Submit correctly required preceding activities to be finalized.

State responses now include exact opening/closing instants, participant-zone labels and availability reasons. Pending predecessors are projected as `blocked` using the same order enforced by Start/Submit. Completed and recoverable states retain their recorded outcomes; completed activities cannot be started again. Normal evening/morning semantics, following-morning association and DST behavior are unchanged. The Flutter cards remain responsive for status/details, show explicit **Start Sound**, **Start Quiet**, **Start Game** or recovery actions when authorized, refresh trusted State before navigation, and expose loading and errors beside the selected row. Audio and silence still use `MinaDeclarativeAudioPage` and its explicit server Start/native session controls. Cognitive activities still use server Start and `MinaGamePage.declarative` with the existing game ID, duration and raw scoring. Returning from a screen does not imply completion: refreshed server state confirms recording, or the UI explicitly says completion remains unconfirmed.

The synthetic timed fixture now publishes a new immutable `local-smoke-v2` version with a declarative `localTestWindow`: 24 hours from its server-written enrollment timestamp. This is restricted to `mina-local-timed-smoke`, protocol type `local-fixture`, one timed night and no randomization/overnight activity. Enrollment requires both the Functions-emulator context and `localTestOnly` capabilities; execution of a stored local window is rejected outside that context. There is no client clock override, forced availability, alternative interpreter, production capability attestation or bypass of ordering/Start/Submit checks. Existing enrollments remain on their original definition and consent. Overnight sound, overnight quiet and the seven-night fixture retain their original schedules and version hashes.

The guarded loopback seed tool was run against the already running local emulator. The smoke root now points to `local-smoke-v2`; before/after fingerprint checks confirmed the existing participant record and all four `local-v1` version records were unchanged. No Auth identity, participant record or response was created. Fixture definitions were extracted into a pure configuration module so the seed tool and tests consume exactly the same definitions.

To run the first sound on the S22:

1. Rebuild/relaunch the debug `lib/mina_emulator/main.dart` target with `MINA_EMULATOR_HOST=127.0.0.1` and the existing ADB reverse mappings for 9099, 8080 and 5001. Keep Auth, Firestore and Functions emulators running.
2. To use the immediate window, choose **Reset local Auth session**, then explicitly **Create LOCAL emulator test identity**. Open **LOCAL timed smoke test**, review/accept its eligibility and consent, and join. Confirm the assigned protocol says `local-smoke-v2`. Re-enrolling the existing identity does not upgrade its immutable `local-v1` participation; that enrollment still opens at 18:00 in `America/New_York`.
3. Sound should be `available`; quiet, game and the synthetic check-in should explain that they are waiting for preceding activities. Tap **Start Sound** or its row to open **Research audio**. Grant notifications, press **Start session**, and confirm audible brown noise and increasing observed playback. Wait for the configured 10 seconds of measured playback, then **Save recorded session** (or end and save once the target is met).
4. Confirm Sound is recorded and Quiet becomes available. Start Quiet, observe the timed window, answer the silence-adherence question truthfully and save. Game then becomes available through the existing color-match runner, followed by the synthetic check-in. A server refusal, offline state or expired window must show a reason and must not launch an unauthorized activity.

Validation: all 126 backend tests and 115 Mina/isolation Flutter tests passed; analysis of all changed Flutter files and the new activity tests reported no issues. Five new backend tests cover the full real fixture sequence, ordering, idempotency, completed-session refusal, local-only rejection, expiry/recovery, old enrollment pinning, client clock rejection, DST and fractional-offset boundaries. Seven new Flutter tests cover actual row taps, refreshed authorization, loading/error feedback, audio/quiet/game route construction, pinned asset identity, account changes, offline blocking and server-confirmed completion. Android debug compilation passed for the local harness. The APK was not installed and native sound playback on the updated S22 build was not verified in this turn. No production Firebase change or deployment occurred.

Changed files: `flow/functions/lib/declarative.js`, `declarative_handlers.js`, `flow/functions/tools/mina-local-fixtures.js`, new `mina-local-fixture-definitions.js`, new `flow/functions/test/declarative_local_smoke.test.js`; `flow/lib/screens/mina/mina_declarative_page.dart`, new `mina_task_availability.dart`, new `flow/test/mina/activity_execution_test.dart`; and this report. No dependency, native audio implementation, alarm/snooze logic, cognitive scoring, ordinary Flux sleep personalization, rule or index was changed.

#### Consent and enrollment UI follow-up

The declarative experiment page forced Mina's dark background but inherited checkbox labels, text fields and disabled button colors from the harness's default light Material theme. This produced nearly black text and a barely visible disabled enrollment action on a dark surface. The action was present in the widget tree, but a failed policy fetch disabled it with no explanation. The original plain text fields also provided no inline age/timezone validation, and the page lacked an explicit safe-area wrapper. Server consent checks were already enforced; they have not been relaxed.

The page now uses the active theme consistently and wraps its scrollable content in `SafeArea`, with scaffold keyboard resizing and drag-to-dismiss support. `mina_enrollment_form.dart` renders the exact server-returned consent text/version, readable full-row checkboxes, age and real IANA timezone validation, every mandatory attestation, and a prominent **Join Experiment** button. A missing/malformed approved policy disables enrollment with a visible reason. Submission disables repeat taps and shows progress; failures appear next to the action, and success requires a server response confirming enrollment. A changed policy hash clears previous confirmations, and refresh failures cannot leave an old policy active. The normal protocol parser, native capability check, authenticated callable, policy/protocol hashes, consent reference, server-owned consent records, retry queue and identity checks remain in use. A small client interface permits real-page widget tests without initializing Firebase.

“Mina Service not found” was a required callable failure, not an optional video or personalization service. A local POST to `http://127.0.0.1:5001/flow-9d714/us-central1/minaProtocolState` returned 404 and reported an empty function registry. The emulator log showed its initial source discovery failed because `firebase-functions` was missing. Dependencies were subsequently present, but the running emulator had not loaded endpoints. Touching the unchanged local `functions/index.js` triggered the existing source watcher; an initial discovery retry timed out, and the next loaded all endpoints. The first runtime request also suffered a slow cold start; a bounded retry returned the expected `401 UNAUTHENTICATED` with “Please sign in to take part.” Auth and Firestore were not restarted, no participant record was created and no production deployment was made. The app now names the missing `minaProtocol<State/Policy/...>` endpoint, its region, and local Functions/ADB guidance while retaining the server error.

Validation: 108 Mina and existing isolation Flutter tests passed, including 7 new enrollment tests; the focused enrollment tests passed again after final progress wording changes. The 21 focused backend tests passed with expanded no-consent, false-attestation, invalid-age and invalid-timezone rejection cases. The new widget tests exercise light/dark contrast of at least 4.5:1, a 360×640 viewport, keyboard insets, 2× text scaling, full-row tap targets, scrolling to the action, visible disabled reasons, inline errors, exact version/hash payloads, double-submit prevention, explicit success/refusal and policy changes. A wider analysis found an existing style info in `test/mina/native_session_test.dart:84`; that unrelated file was left unchanged. Final analysis of all changed Flutter files and the new enrollment tests passed with no issues. The Android debug harness APK compiled successfully with the loopback emulator target; it was not installed or released.

Manual S22 rerun: rebuild/relaunch `lib/mina_emulator/main.dart` with loopback and the existing ADB reverse mappings; open timed smoke and use **Refresh / retry saved responses**. Confirm approved consent/version and minimum age load. Test missing fields, an underage value, invalid timezone and unchecked attestations; none should enroll. With an approved local identity, explicitly complete all fields and checkboxes, press **Join Experiment**, and inspect the immutable consent/version/hash in the local emulator UI. Repeat in light/dark mode with Android font size increased and the keyboard open. No updated on-device enrollment execution is claimed by the automated widget tests.

Files changed for this consent follow-up: `flow/lib/screens/mina/mina_declarative_page.dart`, `mina_declarative_service.dart`, new `mina_enrollment_form.dart`; new `flow/test/mina/enrollment_widget_test.dart`; expanded `flow/functions/test/declarative.test.js`; and this report. No dependency, production configuration, rule, index, consent/protocol definition or backend handler was changed. The local Functions reload changed only the timestamp of its existing entry point, not its source contents.

#### Galaxy S22 inert-tile follow-up

Read-only inspection of the attached Samsung SM-S906U confirmed ADB reverse for ports 9099, 8080 and 5001. A loopback-only Admin read confirmed all four fixture records exist with `schemaVersion: 2` and `status: published`. Device logcat at 13:33:43 on 2026-10-20 showed `FirestoreCallCredentials: Failed to get auth token`, `INVALID_REFRESH_TOKEN` and a Firestore watch stream closing with `UNAUTHENTICATED`. The harness previously treated a non-null cached Auth user as sufficient, even when the Auth emulator no longer accepted its refresh token. All four names were static inventory, so their visibility did not prove successful Firestore discovery. While discovery had no valid record, `enabled: false` and `onTap: null` made those tiles inert. Capability validation was not disabling them; that occurs in the normal declarative engine/server after opening.

The emulator entry now forces a token refresh, with a 15-second timeout, before accepting a saved identity. An invalid/offline session shows an explicit error and **Reset local Auth session**. Reset signs out locally and leaves creating another identity as an explicit button action; it deletes no fixture or participation records. All four scenario controls remain tappable for diagnostic feedback while loading, missing or failed. Ready scenarios acknowledge opening, show a spinner and push the existing declarative route with the exact Firestore catalog; route-construction failures show a retryable error. Feedback no longer silently disables the controls. The discovery widget keeps a stable identity as feedback changes, preserving its subscription.

After rebuilding/relaunching the debug entry with loopback and the three reverse mappings, reset the stale local Auth session, explicitly create the synthetic identity, then tap **LOCAL timed smoke test**. Confirm the experiment title opens and any State/Policy/capability failure appears within the engine. Repeat selection for the other three fixtures. No production Firebase code, rules or data was modified; no participant records were created during diagnosis. Tests for this follow-up: 7 focused harness tests plus the existing declarative widget and isolation guards passed (29 total); analysis of the harness and tests reported no issues. These tests exercise actual taps and route pushes, missing/loading/Firestore errors, navigation exceptions, expired-token rejection and explicit Auth recovery. Device logs and port mappings were inspected; updated on-device tap/enrollment execution has not been claimed.

The follow-up debug APK compiled successfully with `-t lib/mina_emulator/main.dart --dart-define=MINA_EMULATOR_HOST=127.0.0.1` and is at `C:\Users\akpoo\StudioProjects\flow\build\app\outputs\flutter-apk\app-debug.apk`. It was not installed or released during this diagnosis. Restart the debug target to pick up the startup token-validation change; a widget-only hot reload does not rerun `main()`.

The emulator entry now opens a dedicated four-scenario selector after local authentication. It lists the existing fixture IDs from `functions/tools/mina-local-fixtures.js`, discovers only published schema-v2 records, and opens the normal `MinaDeclarativePage` with the stored catalog. Missing fixtures and connection errors are explicit and disable opening; there is no synthetic interpreter or fabricated protocol. The UI does not hide local fixtures because capability verification is false: the existing Functions-emulator-only capability gate remains authoritative, and production publication remains blocked.

The previous entry routed into the general Mina landing page. Its legacy featured-experiment loader deliberately skips schema-v2 fixtures; the separate embedded declarative catalog depends on successful Firestore discovery. This was unsuitable as the local scenario launcher and its empty message did not explain missing fixtures or networking. In addition, all three Firebase SDK emulator APIs default to Android host remapping. The harness now explicitly sets `automaticHostMapping: false` for Auth, Firestore and Functions and defaults to `127.0.0.1`; use the three ADB reverse commands above for physical devices. Explicit `10.0.2.2` remains supported for Android emulators. Fully stop and relaunch the debug target after this configuration change.

Focused verification for this correction: 3 new harness tests cover authentication-to-menu navigation, four fixture names, missing/error discovery, published/schema filtering, the real declarative route and preserved catalog, fixture ID consistency, and explicit SDK host mapping configuration; the existing declarative widget and harness-isolation tests also passed (25 combined). The 21 focused declarative backend tests passed, and analysis of the changed harness and tests reported no issues. The local emulator REST inspection returned HTTP 403, so the currently running fixture records and physical-device connectivity were not verified. No Firebase records were written and nothing was deployed. If a tile reports a missing fixture, run the guarded local fixture seed command above; then open timed smoke first and inspect enrollment/session records only in the emulator UI.

Actual checks: 121 backend tests passed (including the seven-night simulation, consent/version gating, asset integrity and unchanged scoring); 73 Mina Flutter tests plus 21 existing harness-isolation guard tests passed; 40 website tests passed. Flutter analysis is clean. Website lint, TypeScript and the webpack production build passed. Android debug APK compilation passed. Script syntax checks passed. No physical-device, callable-emulator or live Firebase verification is claimed. The controlled participant run remains pending approval to create test identities/enrollments.

The final APK was rebuilt after the compatibility-handshake edit; inspection of its packaged debug kernel confirmed the `executorVersion` handshake is present. The APK was not installed or run.

Before a live first study: complete the controlled local run and physical-device overnight matrix; approve the real eligibility/consent, sound and question definitions; review special-use foreground-service release requirements; attest the exact released interpreter/backend build and asset digests; then approve deployment and live configuration. Historical legacy enrollments still need an explicit approved transition. Website acquisition/referral identities are not automatically merged into app enrollments; research participation uses the authenticated Flux UID and explicit app consent.

After approval, the selective backend deployment remains:

```powershell
firebase deploy --project flow-9d714 --only "functions:minaProtocolEnroll,functions:minaProtocolState,functions:minaProtocolStart,functions:minaProtocolSubmit,functions:minaProtocolPolicy,functions:minaProtocolWithdraw"
```

Release the website through its configured host and the approved Android build separately. No rule or index change was required or deployed. Do not deploy the emulator entry point as a release or use test-only capabilities to publish. The real seven-night dashboard definition must receive an exact-content scientific review and pass all verification gates before publication.

## Files changed in this continuation

Website: `lib/mina-protocol.ts`, `lib/mina-builder.ts`, `lib/server/mina-experiments.ts`, `components/MinaExperimentBuilder.tsx`, `components/MinaBuilderActivities.tsx`; new `MinaEnrollmentEditor.tsx`, `MinaBundledSoundPicker.tsx`, `MinaScaleMetadataEditor.tsx`; expanded `tests/mina-admin.test.ts`; this report and pointers in existing Mina documentation.

Flutter: declarative parser/page, new declarative audio page/native bridge, reusable game-runner callback, startup identity guard; native `MinaResearchService.kt`/`MinaResearchChannel.kt`, registration in `MainActivity.kt`, main/debug manifests and local-only debug network policy; `functions/lib/declarative.js`, `declarative_handlers.js`, new `declarative_media.js`, catalog additions in `config.js`, emulator-only wiring in `index.js`; expanded backend/Flutter tests; unverified candidate JSON and its generator; guarded local fixture tool; isolated `lib/mina_emulator/main.dart`. Existing personalization, alarm/snooze implementations, game scoring and Mina home artwork were not edited.



