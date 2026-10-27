# Stage 8 — consumer Mina challenges

22 October 2026. Local implementation; no hosting/Firebase deployment or public challenge publication.

The existing admin, declarative protocol builder and public Mina pages now describe personal consumer challenges. The default brown-noise template includes a pinned personal-data purpose, inline adult eligibility, seven calendar nights, three randomized pairs and four morning sleep questions. Existing research definitions and their hashes are preserved. Videos remain linked through the existing editor; the new draft has no invented Mina video URLs.

The consumer web entry directs users to Flux rather than a recruitment/email form. Personal challenge pages describe Start Challenge and private in-app results; old research-specific disclosures remain limited to those older definitions. Personal wrap-up videos are separate from publication of editorial summaries or aggregate research findings.

Admin counts distinguish historical admissions, all activities finalized (including explicit skips/interruption outcomes), and submitted technical ending reasons. Aggregates are operational counts, not sleep improvements or adherence. Owner responses remain private. Composite indexes for these server-side counts are prepared in firestore.mina-tests.indexes.json. Missing count indexes show unavailable; backend diagnostics link to the correct project in Cloud Logging.

Public and production publication require a reviewed protocol and compatible verified runtime. An explicitly unverified stagingCandidate can collect evidence only through private internal testing in flux-staging-1; it never authorizes public/production publication. The personal mode requires personal-challenge-v1 support; no candidate has been falsely marked verified. Staging/project separation, public visibility and the enrollment switch remain independent. No UID allowlist, invitation requirement, global participant counter or cap was added.

The full implementation/evidence/release checklist lives at C:/Users/akpoo/StudioProjects/flow/docs/mina-tests/stage-8-consumer-readiness.md. The offline consumer draft is docs/brown-noise-consumer-challenge.draft.json. Deploying website code, private staging consumer data, verified capabilities, Firebase changes and any production/public release are separate unexecuted actions.

Focused checks: stage8-web-final-candidate.log, stage8-types-final-candidate.log, stage8-lint-final-candidate.log and stage8-next-candidate-build.log. Build runs with Firebase cloud credentials disabled and staging project identity in its process environment.


## Optional YouTube videos (Stage 8 follow-up)

Introduction and results wrap-up URLs remain unset in the consumer draft. Both are optional: clear text introductions and private results remain available. Admin accepts canonical HTTPS YouTube watch, youtu.be and Shorts URLs, validates the 11-character video ID, and retains direct HTTPS MP4/WebM alternatives. The Introduction video and Results wrap-up video fields are editorial metadata. Adding, replacing or clearing them does not change the protocol hash or publish another assigned version. Current approved same-protocol metadata reaches existing participants through State and Results, including stopped challenges.

Flutter uses youtube_player_iframe 6.0.2 with the official YouTube iframe API and OS WebView. The user explicitly opens a visible in-app dialog and controls playback. Standard YouTube controls/branding remain, privacy-enhanced mode is enabled, and the installed Android application ID supplies the HTTPS origin/Referer. Player viewport is at least 200 by 200; narrow screens retain external fallback. Closing or backgrounding removes the player. No streams are downloaded, extracted or rehosted. Open in YouTube stays available even if embedding or the network fails. In-app and website disclosures link Google's privacy policy and YouTube terms.

The player implementation is prepared, not claimed as real-device verified. Actual videos can be linked later through admin without an app rebuild. Missing videos do not block text-only challenge readiness. A future configured video still needs an embedding/availability check and S22 playback smoke test. Public/production publication and deployment remain unapproved.

Sources consulted: https://pub.dev/packages/youtube_player_iframe and https://developers.google.com/youtube/terms/required-minimum-functionality . Evidence and the replacement build 11 candidate are recorded in the Flutter repository's stage-8-video-verification-summary.json and stage-8-video-apk-verification.json.

Dependency audit: stage8-youtube-npm-audit.json reports one critical and eight moderate production dependency findings (including Next.js 16.4.0). No package upgrade was applied. Resolve/review these before public website release; the warning does not prove every advisory is reachable in this app.


Final follow-up result: 27 admin tests and changed-file ESLint pass; final webpack compilation, TypeScript, routes and tracing complete, but the command exits 1 at the dependency SecurityFatalError guard even on retry. Do not describe the final website build as a clean pass. Upgrade/review patched dependencies before public release; the guard was not disabled. The Android build 11 APK passed signed-package/staging isolation/compiled-YouTube-agreement verification. See the Flutter stage-8-video-apk-verification.json for the exact path/hash and stage-8-video-verification-summary.json for all current results. No APK was installed and no live changes were made.


Stage 8B (23 October 2026): patched website dependencies and lockfile now pass 47 tests, type/lint checks and the normal security-guarded production build; website full audit is zero. Private staging consumer challenge and necessary Mina Functions/indexes are deployed and 13 focused cloud checks pass. No production/website release or APK installation occurred. The separate Functions dependency tree retains eight moderate UUID-chain entries requiring public-release review. Current concise report: C:/Users/akpoo/StudioProjects/flow/docs/mina-tests/stage-8b-staging-readiness.md.
