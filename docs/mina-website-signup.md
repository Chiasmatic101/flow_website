# Mina website signup and video — October 29, 2026

## Audit
Existing infrastructure already supported normalized-email transactional deduplication, referral reservations, first-touch UTM/referrer capture, hashed single-use email tokens, resend limits, secure cookies, CSRF checks, Resend delivery and administrator sessions. Preserve these mechanisms and existing experiment-specific flows.

Gaps: homepage download links targeted a missing #signup section; general registration depended on the default Brown Noise publication state; the legacy iPhone path skipped email verification; no Play account email, tester queue, manual status tracking or CSV export existed; Mina promotional media used local placeholders.

## Implementation
- Homepage and /mina-tests share a click-to-load YouTube privacy-enhanced 9:16 player for QGoBL06AjNU, with a permanent Watch on YouTube fallback. Unrelated Flux demo videos remain intact.
- /mina-tests#signup uses the existing signup endpoint with purpose=tester. Both platforms receive one-use email confirmation. This path never checks, joins or changes an experiment.
- Confirmation writes emailVerified and emailVerifiedAt to championshipParticipants, records versioned testing-communications consent, and creates/updates fluxAndroidTesters or fluxIosWaitlist. Email ownership is verified by the existing website link, not by creating a Firebase Authentication account or changing a Flux user's Auth emailVerified property.
- Duplicate requests reuse the participant and preserve first-touch acquisition, referral ownership and platform until email ownership is confirmed. Switching platform after confirmation deactivates the other list entry.
- /testing shows platform-specific confirmation. Only a confirmed cookie can edit the participant's Google Play email. A changed address returns status to pending. Secondary Play addresses are explicitly self-reported.
- /admin/testers uses existing administrator authorization. Pending/invited/added statuses are manual; recording Added requires confirmation of actual manual addition. Status updates check the expected status AND Play address to reject stale admin writes and create an audit record.
- CSV exports one bounded 100-record page, one normalized account email per row, no header. It excludes inactive, unverified, nonconsenting, missing/unsafe addresses and test records. Export subsequent pages separately. Existing Play lists must be preserved when importing.
- New collections remain inaccessible to direct Firestore clients under the existing deny-by-default rules. No rules or infrastructure deployment is needed. No new composite index is needed (queue pagination orders by document ID).
- Privacy page explains optional recruitment records, Google sharing, communication opt-out and separate website-record deletion through the existing contact address.

## Verification
- 65 automated regression/security tests passed, including both platform confirmations, no experiment enrollment, duplicate/concurrent signup, replay rejection, pending-cookie restrictions, Play email validation, CSV exclusion/deduplication, CSRF and unauthenticated admin denial.
- Production-dependency npm audit: zero vulnerabilities.
- ESLint: zero errors; three existing unused-variable warnings in Mina builder/admin tests.
- Production build passed using next build --webpack, including TypeScript and route generation. Local Turbopack failed while spawning its CSS compiler process, including outside the sandbox; no application compilation error was reported. No security guard was disabled.
- Local browser: verified homepage and /mina-tests CTAs, YouTube embed loaded the correct video and played (currentTime > 0; no media error), 350px desktop 9:16 player, and 390px mobile layout without horizontal overflow.
- Authorized live Android signup: real Resend request accepted, user confirmed receipt and clicked the email confirmation, and Firestore reads confirmed emailVerified=true with server timestamp, pending Android queue, isTestRecord=true and experimentIds=[] (zero experiment signups). The test is excluded from Play CSV. iPhone uses the same tested transaction/email mechanism; its full waiting-list path was covered automatically, not by sending a second live email.

## Manual activation (nothing deployed automatically)
1. Review changes and deploy the website through the existing Vercel process. Preserve existing in-progress dashboard/dependency changes in the checkout.
2. Retain server-only FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (or the existing supported ADC setup), RESEND_API_KEY and verified CHAMPIONSHIP_FROM_EMAIL. Never expose these through NEXT_PUBLIC variables. Existing local configuration successfully wrote Firebase and sent the authorized email.
3. Set NEXT_PUBLIC_SITE_URL to https://www.minatests.com for the production deployment. The live test used a process-only localhost override; no stored environment configuration was changed. Existing verification URLs remain governed by their original origin and expire after seven days.
4. Optional server-only GOOGLE_PLAY_TESTING_URL=https://play.google.com/apps/testing/com.chiasmatic.flow. It is shown ONLY for Android entries an admin has marked Added; pending/invited and iPhone never receive the link. .env.example documents this setting (that file follows the repository's existing .env ignore policy).
5. Sign into /admin using an existing authorized administrator. Open /admin/testers, export active Android accounts, and manually add them in the intended Play Console testing track. Confirm the account email, mark Added only after actual addition, then send any testing instructions manually. The dashboard does not send invitations automatically.
6. Maintain the existing contact inbox for communication opt-out/deletion requests. Website recruitment does not create app accounts or enroll in Brown Noise. Do not publish or enable any experiment as part of website activation.

No website deployment, Google Play change, Firebase infrastructure change or experiment publication was performed.
