# Stage 8B dependency security review

23 October 2026. Local source/dependency changes only; no website/production deployment.

The previous audit counted nine vulnerable packages, not nine independent bugs: Next.js was critical and eight Firebase/Google Cloud dependency entries were moderate. The latter trace to uuid's missing output-buffer bounds validation in v3/v5/v6. The application does not call these methods or expose caller-provided UUID output buffers; no reachable application exploit was identified. This does not substitute for patching dependencies.

| Previous package | Severity | Cause / remediation |
| --- | --- | --- |
| next 16.4.0 | Critical | Three Next advisories; upgraded to 16.4.3 and matching eslint-config-next. |
| firebase-admin | Moderate | Upgrade 13.10.0 to 14.5.0 through the supported modular API. |
| @google-cloud/firestore | Moderate | Vulnerable google-gax chain; upgraded through Admin SDK. |
| @google-cloud/storage | Moderate | retry-request/teeny-request chain; upgraded through Admin SDK. |
| google-gax | Moderate | uuid/retry-request chain; upgraded through Admin SDK. |
| gaxios | Moderate | uuid chain; resolved to patched dependency tree. |
| retry-request | Moderate | teeny-request chain; resolved through Admin SDK. |
| teeny-request | Moderate | uuid chain; resolved through Admin SDK. |
| uuid | Moderate | Vulnerable v3/v5/v6 output-buffer handling; patched tree, no forced major override. |

Next.js image optimization RCE (GHSA-2464-fhr4-w9xw) affects glibc-based Linux and an upstream image-processing library. next/image is used, so the optimizer is a relevant surface. No dangerouslyAllowSVG setting, permissive remote image configuration or anonymous image-upload route was found; Mina's editable thumbnail uses unoptimized rendering. A practical exploit through this source was not demonstrated, and deployment OS/input behavior was not inspected in production. Patch rather than assume immunity. Patched Next.js brings the fixed sharp dependency.

Server Actions DoS (GHSA-p3m5-59mp-jv5r) requires at least one Server Action. This app uses route handlers; no use-server directives were found. Cache Component RCE (GHSA-673q-mjm6-r5xr) requires a use-cache function returning multiple typed arrays; no use-cache directives/Cache Component configuration were found. Those preconditions were absent in the reviewed application source.

Firebase Admin 14 requires Node 22+. Existing website Auth/Firestore code already uses modular entry points. The legacy FirebaseFirestore.Query type was replaced by an explicit Query type import. package.json records Node >=22; the local version-3 package-lock.json pins the patched tree. Staging tooling explicitly declares its Google Auth client dependency, uses the supported Firestore authClient path and keeps CLI access tokens in memory. No service-account key or human IAM grant was created. Production website credentials and configuration were not changed.

The full post-install npm audit reported zero vulnerabilities, including development dependencies; the lockfile-only refresh also reported zero. Tests cover real existing admin claims/session enforcement, protocol immutability, open eligible enrollment, optional media and personal result privacy. The production website build runs with credentials disabled, staging identity and the normal security guard enabled. No overrides, force-fix or security-guard bypass were used. The patched website is prepared locally; its existing live deployment still requires a separately approved website release.

Sources:
- https://github.com/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/advisories/GHSA-p3m5-59mp-jv5r
- https://github.com/advisories/GHSA-673q-mjm6-r5xr
- https://github.com/advisories/GHSA-w5hq-g745-h8pq
- https://firebase.google.com/support/release-notes/admin/node

Evidence: stage8b-audit-after.json, stage8b-web-tests.log (47 passing), stage8b-website-build.log, stage8b-operations-types.log, stage8b-operations-lint.log, stage8b-lockfile-final.log. The first temporary operations credential adapter was rejected before writes; it was replaced with the supported Google OAuth client path and private challenge activation succeeded. This did not require an application auth fallback, replacement device account or IAM change.


## Separate Functions audit (not the website tree)

A read-only audit of the deployed Functions' unchanged dependency lockfile reports eight moderate entries (zero critical/high), all tracing to the same uuid buffer-bounds advisory: firebase-admin, @google-cloud/firestore, @google-cloud/storage, google-gax, gaxios, retry-request, teeny-request and uuid. Inspected installed call sites use unaffected v4(): gaxios/build/src/gaxios.js:417, teeny-request/build/src/index.js:135 and google-gax/build/src/util.js:108. This is a scoped reachability assessment, not proof about every SDK branch. The supported upstream remediation requires Firebase Admin 14 and review of the Functions framework/legacy namespace migration; it was not silently substituted into the already reviewed staging deployment. Do not use forced cross-major uuid overrides as a shortcut. Review/remediate or explicitly document risk acceptance before public backend release. Evidence: C:/Users/akpoo/StudioProjects/flow/stage8b-functions-audit.json.

Final website audit after the explicit operations-only Google Auth dependency/lockfile refresh still reports zero vulnerabilities: stage8b-audit-final.json. This clean result must not be generalized to the separate Functions tree.
