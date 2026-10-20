# Maintainer guide

This guide keeps review, community care, and releases consistent for a small project. It does not grant repository access or publishing authority. Repository owners designate maintainers and retain responsibility for those permissions.

Contributors should start with [CONTRIBUTING.md](../CONTRIBUTING.md). The source repository is [usual-labs/usual-design](https://github.com/usual-labs/usual-design), with `@usualui/lint` published on npm; the preparation below is not evidence that external settings are enabled.

## Before opening public contributions

- Confirm the canonical repository, package name/scope, copyright attribution, and owners.
- Enable GitHub private vulnerability reporting or establish another verified private route. Assign primary and backup responders and update [SECURITY.md](../SECURITY.md).
- Establish a confidential conduct contact and an alternate for conflicts of interest. Review the enforcement process and update [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md).
- Verify the issue forms and PR template on the default branch. Do not assign labels or reviewers that do not exist.
- Add verified repository, homepage, and issue URLs to package metadata and public documentation.
- Run the workflow on the actual host. Configure branch protection and required checks using the real check names and agreed maintainer permissions.
- Review write and release access, require strong account security, and keep publishing credentials out of workflows that process untrusted pull requests.

Do not claim a community health check, private reporting route, required review, or release protection is active solely because its documentation exists.

## Triage issues

1. Route security details privately under the security policy. If a public report exposes secrets, limit further exposure and coordinate removal and credential rotation with the affected owner.
2. Check whether there is a minimal reproduction and whether the behavior is within [supported scope](compatibility.md).
3. Reproduce with the stated version and contract. Distinguish a false positive, missed violation, honest unknown, configuration error, and workflow bug.
4. Ask for the smallest missing piece of evidence. Do not ask for an entire private repository.
5. Link duplicates and explain closures. For a feature proposal, settle intended behavior and unknown cases before encouraging implementation.

Labels are optional organizational aids. Add only labels the team will actually maintain. Do not use automated stale closure as a substitute for a clear decision.

## Review pull requests

Review the behavior before the implementation details:

- Does the change solve a demonstrated problem and fit the supported scope?
- Does it live in the layer that owns the invariant?
- Are accepted, violating, and ambiguous cases covered where relevant?
- Does it preserve policy authority, active-category semantics, deterministic analysis, meaningful exits, safe writes, and fresh approval checks?
- Are compatibility and user-facing docs accurate? Does an observed value remain evidence rather than implicit policy?
- Are new dependencies necessary, licensed appropriately, and represented in the lockfile and notices?
- Are test results real and tied to the reviewed revision? Are unverified browser/native-client/platform claims marked clearly?
- Are generated assets, local audit records, secrets, and unrelated changes absent?

Explain required changes and distinguish them from optional suggestions. For disputed behavior, discuss the smallest concrete example and the product boundary; record the resulting decision where future contributors can find it. Maintainers decide whether a change fits, and should explain deferrals rather than imply a roadmap commitment.

Use [the development guide](development.md#choose-the-right-checks) to choose proof. The current `.github/workflows/ci.yml` installs dependencies, typechecks, builds, tests, verifies the packed package, and audits the site. The local formatting check is an additional contributor check. A workflow file is not a successful remote run.

Do not run untrusted pull-request code with publishing credentials, privileged repository tokens, or access to private projects. Review workflow changes as carefully as source changes.

## Prepare a release

The npm destination is `@usualui/lint`. Follow [publishing setup and the release workflow](publishing.md) for owner authentication, trusted publishing, and verification-only runs.

Public publication and deployment require the repository owner's authorization. Review a concrete candidate first:

1. Identify the exact source revision and intended version. Keep `package.json`, the lockfile version, CLI `--version`, and changelog consistent.
2. From a clean candidate checkout, run:

   ```sh
   npm ci
   npm run format:check
   npm run typecheck
   npm run build
   npm test
   npm run verify:package
   npm run audit:site
   ```

3. Inspect the archive and `.usual-design/artifacts/package-smoke.json`. Check that documentation, schema, skills, and wizard assets are present and that private source, local evidence, and credentials are absent.
4. Review compatibility and migration implications. For manifest/schema or saved-record changes, document the supported transition; do not silently reinterpret existing approvals.
5. Review dependency vulnerabilities, licenses, and [third-party notices](../THIRD_PARTY_NOTICES.md). For a security fix, coordinate the advisory and release under the security policy.
6. Record tests, actual platform/client/browser evidence, known limitations, artifact identity, and release notes. A build cannot stand in for those other checks.
7. Obtain authorization for the exact registry account/scope, repository release, and any website deployment. Use the confirmed destinations and credentials; this guide intentionally contains no assumed publication command.
8. After authorized publication, verify the actual registry version and a clean install. Verify deployed routes separately if the website changed. Link the real release and advisory, if any, and update support/status documentation.

The site is static output in `dist/site`; it has no database migrations or application runtime secrets. Browser review and deployment still require their own evidence. Its current preview metadata and inactive design categories must not be treated as production approval.

## Recover from a bad release

Keep the previous known-good artifact and the evidence identifying what was published. Stop further rollout, describe affected versions and any workaround, and prepare a tested patch. Prefer a corrective version over attempting to overwrite a published npm version. Registry deprecation or removal and public notices require the authorized owner and the current registry policy.

For a website rollback, restore the prior immutable artifact through the actual hosting provider and verify it. For a security problem, coordinate details privately until a safe disclosure is ready.
