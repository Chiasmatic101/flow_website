# Bundled sound selector fix

Deployed to https://www.minatests.com as dpl_8hS5hpw5b6CZ8cRTKpcQ8gvVJx9S (READY, production build passed).

Cause: missing production minaExecutionCapabilities/flutter document, plus an obsolete hosted-URL selector that ignored bundled sound IDs. A second hardcoded selector was consolidated into the capability-backed selector.

Five selectable bundled assets: Brown noise (brown_noise), Rain (rain), Ocean (ocean), Forest (forest), Winter (winter). Registered metadata/digests match the existing signed Android release 1.0.0 (13) APK's actual asset bytes. Runtime/Android/personal-challenge verification flags remain false; selecting a draft asset does not bypass publication checks.

Brown Noise already referenced brown_noise and was not rewritten. Draft remains revision 1, unpublished, enrollment disabled. Silence has neither a soundId nor an audio URL. No duplicate asset, upload, remote-audio option, Functions/rules deployment or APK rebuild.

Checks: 33 admin regression/security tests passed, including digest/ID filtering and unchanged runtime verification gate; component render showed five options with existing Brown Noise selected and no upload/remote player. Live admin API returns 401 without a session; public catalog returns zero experiments. Existing administrator can reload the editor to see the updated selector.

Deployment source is prior reviewed release snapshot plus only components/MinaBuilderActivities.tsx, components/MinaBundledSoundPicker.tsx, lib/mina-builder.ts and tests/mina-admin.test.ts. Existing unrelated local changes excluded. Future deployments retain the existing deployment-local ESM compatibility flag; project-wide NODE_OPTIONS was not changed.
