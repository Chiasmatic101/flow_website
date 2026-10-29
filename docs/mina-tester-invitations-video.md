# Tester invitation and Mina video release

## Administrator workflow
Add the exact Google account manually in the intended Google Play closed-testing track. Only then select Added in /admin/testers and confirm the existing prompt. This records the manual action; the website does not manage Play Console membership.

Added automatically attempts an invitation to the verified signup email, naming the self-reported Play account and providing Become a tester / install / normal Flux sign-in instructions. Pending and legacy Invited do not send. Existing Added entries are not bulk-mailed during deployment. No experiment enrollment or publication is performed.

The Testing email column distinguishes Not sent, pending/sending, sent (provider accepted), failed, and review_required. Added remains Added on an email failure. Fix the configuration/provider issue and use Retry / Check invitation. Refreshing or repeatedly saving Added does not resend accepted invitations. Delivery acceptance is not a claim of inbox delivery.

## Production configuration
Use existing server-only RESEND_API_KEY and CHAMPIONSHIP_FROM_EMAIL. Set server-only GOOGLE_PLAY_TESTING_URL to the actual Play Console opt-in URL for com.chiasmatic.flow (expected format https://play.google.com/apps/testing/com.chiasmatic.flow). Only this HTTPS Google Play package path is accepted. Missing/invalid URL records a visible configuration error while retaining Added. A corrected configuration can be retried after deployment.

No Firebase APIs, IAM, security rules, indexes, public enrollment switches or Google Play membership are changed by this website deployment.

## Delivery integrity
fluxTesterInvitations contains a durable job keyed by participant plus Play email. It stores approval actor, status, attempt timestamps/count, provider-acceptance timestamp and sanitized error codes. Queue records retain the current job and summary. Atomic Firestore reservation plus a lease and a stable Resend idempotency key prevent concurrent or repeated invitations. The request payload retains its original opt-in URL for retries.

A crash after provider acceptance can be recovered with the same key within the deduplication window. Resend retains keys for 24 hours: https://resend.com/changelog/idempotency-keys . To avoid ambiguous duplicates beyond that boundary, this implementation stops retries after 23 hours from the first actual attempt and requires review of Resend history before any manual resend. It never silently emits a new key for an uncertain send. Missing-URL failures do not consume this send window. These jobs use the existing deny-by-default Firestore access, and both status updates and retries require a fresh authorized administrator session and same-origin request.

## Video behavior
The dependency-free YouTube IFrame Player API loads when a 50%-visible embed is eligible for automatic playback. IntersectionObserver is supplemented by animation-frame-throttled scroll/resize reconciliation for embedded browsers that defer observer delivery. Start muted, expose Unmute, pause below the threshold or when the tab is hidden, and resume the same player without seeking. Completed videos do not automatically restart. A shared coordinator permits one Mina player at a time, including native YouTube Play controls. Reduced-motion users get manual play and do not automatically resume after leaving the view. Normal YouTube controls, privacy-enhanced embed host, 9:16 layout and a permanent Watch on YouTube fallback remain. Privacy copy now describes visibility-based automatic loading/playback.

Official API: https://developers.google.com/youtube/iframe_api_reference

## Verification scope
Regression suite covers existing signup, email verification, Android/iPhone queues, referral/UTM attribution, CSV filtering and experiment separation, plus Added invitation, repeated saves, concurrent retries, errors, missing/unsafe URL, changed addresses, old ambiguous delivery, 50% visibility, offscreen/tab pause, resume, reduced motion, completion and multiple-player coordination.

Do not fake a Play Console addition to test live invitation sending. Test delivery against mocks unless a genuine manually added tester is available. No invitation should be sent to the existing pending test record as part of deployment.

Release checks: 74 automated tests passed; ESLint has zero errors and three existing unused-variable warnings. The production webpack build passed after preserving a stale compiler cache. The confirmed GOOGLE_PLAY_TESTING_URL was added to the existing Vercel Production environment for the release. No live Added status is fabricated for testing.
