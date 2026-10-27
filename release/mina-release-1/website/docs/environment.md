# Environment setup

Environment files are excluded from Git, including local templates. Create `.env.local` privately for local development. Configure the following names in the existing Vercel project's Production environment for deployment:

- `NEXT_PUBLIC_SITE_URL=https://minatests.com` (public canonical origin; no trailing path).
- `FIREBASE_PROJECT_ID=flow-9d714`.
- `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`: the authorized Firebase Admin service account credentials, supplied privately. Escaped newline sequences in the key are supported.
- `RESEND_API_KEY` and `CHAMPIONSHIP_FROM_EMAIL`: the sending key and verified sender, supplied privately.
- `GOOGLE_PLAY_URL`: the genuine Google Play listing when ready. An absent value shows an honest unavailable-download message.
- Optional `MINA_TEST_EXCLUDED_EMAIL_DOMAINS` and `MINA_TEST_EXCLUDED_EMAILS`: comma-separated known test exclusions.
- Optional `FIREBASE_USE_APPLICATION_DEFAULT=true`: use only when application-default credentials are explicitly configured.

Do not put credentials in any `NEXT_PUBLIC_*` variable or in Git. Restart the local server after changing configuration. Vercel environment changes apply to subsequent deployments.

Development can omit the site URL to use `http://localhost:3000`; production signup and resend require the configured HTTPS origin. Never configure `FIRESTORE_EMULATOR_HOST` in Production. Automated backend tests use mocks by default; the optional emulator test mode requires the dedicated `demo-flux-championship` project described in the backend guide.
