# Stage 6A verification against flow-9d714

Status: read-only environment inspection and local regression verification completed. Authenticated browser and live write testing **stopped at setup**, as requested. Stage 6B has not started. No website, rule, index or Cloud Function was deployed; no live account, claim, participant, experiment, session, rate-limit or email-delivery record was changed by this verification.

## Actual environment findings

| Check | Result |
| --- | --- |
| Firebase project | `.env.local` targets `flow-9d714`; live Firestore queries succeeded. |
| Server credentials | Existing client email/private key are configured and usable for the read-only checks. Their values were not printed. |
| Login Web API key | `FIREBASE_WEB_API_KEY` is **missing**. Current admin login cannot complete without it. |
| Local URL | `NEXT_PUBLIC_SITE_URL=http://localhost:3001`; run the local server on port 3001. |
| Firebase email auth | Live project configuration reports email sign-in enabled. The omitted `passwordRequired` field does not mean password sign-in is disabled: Firebase documents that false permits either email/password or email-link sign-in. No provider setting was changed. |
| Authorized domain | `localhost` is already authorized. |
| Admin account | No intended admin UID/credentials or authenticated admin session was supplied. No account inventory was downloaded and no claim was granted. |
| Experiment data | Read-only aggregation found zero `minaExperiments` root documents. No test draft was seeded. |
| Flutter capabilities | `minaExecutionCapabilities/flutter` does not exist. Live publication/new configured enrollment must remain blocked. Draft authoring does not require this document. |
| Existing email setup | `RESEND_API_KEY` and `CHAMPIONSHIP_FROM_EMAIL` are set. Delivery, sender verification and mailbox receipt were not tested. |
| Android store link | `GOOGLE_PLAY_URL` is unset. Supply the real listing to exercise the final download action. This is not required to run the dashboard. |
| Emulator overrides | Neither Firestore nor Auth emulator override is configured. A local dashboard therefore connects to the live project; local saves are live writes. |

Configuration was read using existing credentials and official read-only [Identity Platform configuration](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects/getConfig), Firebase Rules and Firestore APIs. Email configuration semantics are documented in [Firebase's Email configuration reference](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/Config#Email).

## Authorization and privacy checks

Code inspection confirms every protected admin page/read/write checks the Firebase session and `admin === true` custom claim on the server. Session validation checks revocation, then reads the current user's claims and disabled status. Neither a Firestore `isAdmin` field nor a browser flag grants access. Management writes require same-origin requests. Review identities/hashes are generated on the server, not accepted from the caller.

The deployed rules were fetched again, read-only. They still:

- Permit public `minaExperiments` root reads only for the configured public statuses, or administrator reads; deny all client writes.
- Deny all client access to `minaExperiments/{id}/private/{docId}`.
- Restrict version reads to administrators, the current published version for authenticated users, or the participant's pinned enrollment version. Clients cannot modify versions.
- Apply default deny to the website's private membership/session collections, revision history and runtime-capability metadata.

The dashboard matches that policy: the root is a sanitized public projection, full authoring state/unpublished results are in `private/admin`, and immutable scientific snapshots use the existing `versions` path. A draft/archived/never-published-paused ID is rejected by public APIs; private result drafts are removed by the serializer and never copied to publicly readable roots. There were no live draft/result documents with which to exercise a real positive/negative browser test, so these privacy behaviors were checked by source review and regression fixtures, not claimed as a production document test.

No Firestore rule change was identified as necessary for the present Stage 6A layout. No live non-admin account or emulator rule-enforcement test was performed.

## Index checks

The actual admin reporting query shapes (`experimentId`, and `experimentId + status`) succeeded against live Firestore. Both existing public community aggregation shapes (`experimentId + countSchemaVersion + excludedFromPublicCounts`, with and without `status`) also succeeded. Only success/failure was reported; participant documents/emails were not fetched or printed.

The read-only index listing returned no index entries; the tested query shapes produced no missing-index error. No additional composite index is currently demonstrated as required for those queries. The repository's `firestore.mina-tests.indexes.json` remains an optional merge reference if a future query asks for one. Do not replace app indexes or deploy this file blindly. Initial index metadata requests with a page-size parameter were rejected by the endpoint; the final unpaginated request succeeded.

## Tests actually run

```powershell
node --conditions=react-server --import tsx --test tests/championship.test.ts tests/mina-admin.test.ts
```

Result: **29 passed, 0 failed**. Store/Auth test doubles are used, without live writes. Coverage includes:

- Missing/forged sessions, non-admin claims, disabled users and revoked admin access.
- General draft creation/editing, revision conflicts and exact protocol review.
- Complete protocol/consent/eligibility/instruction immutability after membership exists.
- Create-only published versions and preservation of assigned scientific snapshots.
- Private results excluded from both public serializers and Firestore public projections.
- Existing invite verification, single-use tokens, resend limits, referrals, UTM attribution, iPhone interest and additive participant membership behavior.

This confirms the regression suite passes; it does not certify real Firebase login, draft transactions, participant enrollment or Resend delivery end to end. Authenticated browser tests, actual draft creation/edit/save, live enrolled-version rejection and production email/referral smoke tests are **not performed**.

## Exact setup for you

1. Open [Firebase project settings](https://console.firebase.google.com/project/flow-9d714/settings/general). Copy the existing web app's `apiKey` / Web API key into local `.env.local`:

   ```dotenv
   FIREBASE_WEB_API_KEY=YOUR_EXISTING_FIREBASE_WEB_API_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

   Keep the current server-only `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. Do not paste a service-account private key or your password into chat or browser code. Use a key whose restrictions permit the server's Identity Toolkit sign-in request; an Android-only key is not an equivalent server configuration.

2. In [Authentication → Users](https://console.firebase.google.com/project/flow-9d714/authentication/users), choose an existing authorized email/password user, or create a dedicated test administrator yourself. Email sign-in and localhost are already enabled/authorized; no provider/domain change is currently indicated. Do not disable email-link sign-in or change unrelated mobile sign-in settings. Copy the intended user's UID.

3. If the selected account does not already have `admin: true`, an authorized operator must explicitly grant it using the existing helper:

   ```powershell
   cd C:\Users\akpoo\flow-website
   node --env-file=.env.local scripts/mina-admin.mjs FIREBASE_AUTH_UID grant
   ```

   This command **changes live Firebase Auth custom claims**. It was not run during verification. Custom claims are set with the Admin SDK, not by adding `isAdmin` to a Firestore profile. The helper preserves unrelated claims. Grant access only to the intended account; sign in again after a grant so its token includes the claim.

4. Restart the local server and sign in yourself:

   ```powershell
   npm run dev -- --webpack --port 3001
   ```

   Open `http://localhost:3001/admin`. Enter the password directly in the login page; do not send it in chat. No custom token or service-account impersonation should be used to bypass this test. A login attempt writes the shared Firestore rate-limit counter, so none was attempted automatically under the no-live-write constraint.

5. After setup, explicitly approve a named test draft and any test enrollment/email operations before asking the agent to run live write tests. Suggested draft ID: `admin-smoke-stage6a-20261019`, kept in draft throughout, with clearly labeled non-scientific test copy. Creation/editing also creates public-projection/private/audit documents even though the draft is not publicly readable. Do not enable a fake capability manifest or publish to real participants merely to test immutability. The real enrolled-version test needs a separately approved test fixture or isolated emulator integration.

No Console rule/index/Cloud Function deployment is required to address the login blocker. The blocker is the missing local API key and selection/setup of an authorized user. Actual authentication/authorization and write permissions still need an end-to-end test once setup and approval are provided.

## Proposed Stage 6B plan — not started

1. Add Flutter models for API envelope v2 / protocol schema v1. Read published public projections from canonical `minaExperiments`; reject unknown schema/activity versions. Use the website's sanitized API where direct Firestore policy differs, such as paused pages.
2. Add an authenticated trusted-server enrollment/bootstrap flow linking existing website membership to Firebase Auth UID and the already reserved `minaEnrollments` model. Return the assigned immutable version/hash/snapshot; never switch existing participants to the latest definition automatically.
3. Build reusable audio playback/silence, cognitive-task, survey and check-in executors. Drive their order, conditions and duration from the assigned Firestore definition, with progress persistence and retry/offline handling. New configurations using supported capabilities should need no Flutter release.
4. Implement server-owned idempotent randomization and response/progress submission. Persist assignments per participant or night, enforce ownership/version/consent and prevent rerolling. Reuse existing records and rules where compatible; review any changes before deployment.
5. Test the released interpreter and backend, define reliable completion reporting, then attest only the verified capability versions. Review a real protocol and perform an approved staged enrollment before enabling publication. Deployments remain separate approval steps.

Authenticated Stage 6A verification remains a prerequisite to declaring this handoff fully verified.
