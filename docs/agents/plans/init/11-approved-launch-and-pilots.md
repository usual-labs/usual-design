# Phase 11 — Approved publication and five external onboarding projects

Status: launch drafts prepared; publication and external pilots not started; action-specific authorization pending. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [acceptance and release preparation](10-acceptance-and-release-preparation.md).

No public repository/package/site release, remote CI run, domain mutation, outreach, or external pilot onboarding has been performed. Checked items refer only to the pilot definition and unsent invitation in docs/launch/pilot-invitation-draft.md; every external action/evidence gate remains unchecked.

## Outcome

Publish the approved tool and website, demonstrate a truthful agent repair loop, and learn from five external projects completing onboarding. The initial objective is successful sustained use, not a broad launch with unverified adoption claims.

This phase is conditional. Code completion does not authorize repository publication, npm publication, deployment, external messages, account creation, payments, or recurring automations. Prepare concrete actions first; use the user's exact authorization and preserve any existing boundaries.

## Detailed tasks

### Confirm the release is concrete and authorized

- [ ] Review the phase 10 evidence matrix and resolve release-blocking failures.
- [ ] Distinguish verified behavior from unperformed native/browser/remote checks in the release summary.
- [ ] Present the exact repository visibility/URL, package name/version/artifact, site target, and release materials for approval.
- [ ] Confirm actual repository/package/domain ownership and publishing access through read-only checks before attempting release.
- [ ] Record explicit authorization for each public mutation category; do not infer outreach permission from permission to publish code.
- [ ] Confirm the MIT copyright holder and public legal/contact details rather than inventing them.
- [ ] Confirm no spend, paid infrastructure, or new recurring service is required without separate authorization.
- [ ] Prepare rollback/recovery steps for the site and package, recognizing that package publication is not fully reversible.

### Publish the approved repository and package

- [ ] Review the complete Git diff/history and publish payload for secrets, private source, local paths, and unintended files.
- [ ] Publish only the approved repository/visibility and preserve intended contribution/license files.
- [ ] Push/tag the exact reviewed release commit when authorized.
- [ ] Run the approved remote CI workflow and record its actual outcome; a local equivalent is not remote CI evidence.
- [ ] Publish the reviewed package version through the authorized account/provenance mechanism.
- [ ] Verify registry metadata, tarball contents, license, executable entry point, and links after publication.
- [ ] Install the public version in a clean project and verify basic commands and included wizard/skill assets.
- [ ] Publish release notes matching the exact shipped behavior and known limitations.
- [ ] Record durable release receipts and public URLs without storing tokens or provider secrets.
- [ ] If publication partially fails, report actual state and recover the intended artifact rather than blindly creating another release.

### Deploy the approved Usual Labs website

- [ ] Deploy the reviewed build to the authorized target.
- [ ] Change DNS/domain settings only within explicitly authorized scope and preserve unrelated records/services.
- [ ] Verify HTTPS, canonical URLs, repository/package links, documentation routes, and install instructions using appropriate authorized checks.
- [ ] Verify deployed content identifies the actual released version and support boundaries.
- [ ] Verify public install examples work against the published artifact rather than local workspace files.
- [ ] Perform browser validation only if explicitly authorized; report HTTP/build evidence separately from visual evidence.
- [ ] Verify sitemap/robots/social metadata for the intended public domain.
- [ ] Record deployment/version/readback evidence and retain a practical rollback reference.

### Prepare and conduct authorized outreach

- [x] Define pilot eligibility: an external React/Tailwind v4 project, heavy agent usage, and willingness to try the workflow.
- [x] Prepare a concise invitation focused on the developer's benefit and an honest compatibility statement.
- [ ] Prepare the demonstration and a short onboarding checklist with links to the actual public docs.
- [ ] Identify proposed communities/channels/recipients without contacting them automatically.
- [ ] Present exact outreach copy and intended recipients/channels for authorization before sending.
- [ ] Send or publish only the messages the user explicitly authorizes; keep remaining drafts unsent.
- [x] Offer a feedback path that does not require sharing source code, secrets, or proprietary design assets.
- [ ] Request explicit permission before storing identifiable feedback, quoting users, or publishing project examples.
- [ ] Do not enroll pilots in email lists, analytics, telemetry, or recurring reminders without consent/authorization.
- [ ] If later monitoring is requested, create it through the approved automation mechanism rather than silently scheduling work.

### Measure five completed onboarding journeys

- [ ] Track external projects separately from maintainers' fixtures and the Usual website.
- [x] Define onboarding completion as manifest review, a selected repair/recheck journey, at least one activated category, and a working check integration.
- [ ] Record completion evidence supplied or authorized by each pilot; a download, star, or page view is not completion.
- [ ] Record supported stack/client versions and the categories actually activated.
- [ ] Capture time-to-first-useful-diagnostic and setup friction through voluntary feedback.
- [ ] Record incorrect findings, unverifiable patterns, confusing policy choices, and failed installations with reproducible minimal evidence.
- [ ] Record whether the project leaves enforcement enabled during normal work rather than only running a demo.
- [ ] Distinguish user-reported outcomes from maintainer-observed reproductions.
- [ ] Keep feedback local/minimal unless the user explicitly approves another system.
- [ ] Count only genuinely external projects that meet the completion definition; report fewer than five honestly if that is the outcome.

### Respond and close the learning loop

- [ ] Triage confirmed defects into bounded fixes with relevant regression proof.
- [ ] Separate unsupported scope, false positives, unclear documentation, and new feature requests.
- [ ] Prioritize adoption blockers and incorrect failures over speculative additional frameworks or hosted features.
- [ ] Update docs and compatibility statements when evidence contradicts earlier claims.
- [ ] Prepare any follow-up public changes for the appropriate release authorization.
- [ ] Summarize the five-project target, actual completions, retained enforcement, observed friction, and next recommended work.
- [ ] Publish adoption claims or testimonials only when evidenced and authorized.

## Completion gate

- [ ] The approved repository, package, and website are publicly accessible and verified at their actual URLs.
- [ ] Release and deployment receipts identify exactly what shipped.
- [ ] Authorized outreach has been executed or remains explicitly pending; drafts are never reported as sent.
- [ ] Five external projects have completed onboarding, or the target remains transparently incomplete with the next required action.
- [ ] Learning is based on actual evidence and consent, without adding telemetry or relaxing deterministic correctness to improve adoption numbers.

Stop at an authorization boundary if needed and report the prepared result plus the precise pending action. Do not mark the entire launch complete merely because the code or launch materials are ready.
