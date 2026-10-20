# Items for Armin when back

Onboarding update (2026-10-20): the dedicated skill and guided wizard are
implemented for 0.2.0. Local API, component, and packaged-install checks passed;
the browser walkthrough remains pending under your no-browser-testing instruction.
No new environment variables or migrations are required. Review the guided
experience in a disposable React/Tailwind v4 project using the README prompt.
Native-agent trust/lifecycle and website deployment remain separate gates.

Release gate: both skills are live on skills.sh and verified through the official
installer; implementation commit `c3ab664` passed GitHub CI. npm 0.2.0 publication
stopped when its account-verification session expired. The earlier chat link is
no longer usable. A fresh registry read confirms 0.1.0 is still latest and 0.2.0
is absent. When available, request fresh verification to publish the prepared
archive; 0.1.0 does not have the guided `onboard` command.

Release update (2026-10-20): `@usualui/lint@0.1.0` is published and verified through registry integrity and a clean install. This supersedes the npm login, scope-access, and first-publication blockers below. Trusted-publisher configuration and an actual OIDC publication remain pending.

Repository update (2026-10-20): the user authorized pushing to `usual-labs/usual-design`, and the public GitHub repository has been created at https://github.com/usual-labs/usual-design. This supersedes the repository-creation and destination-pending notes below. npm publication, website deployment, confidential reporting contacts, and protection settings remain separate tasks.

Implementation has continued without waiting for these decisions. This file contains only actions/decisions needing your involvement; technical status is in [progress](../implementation/progress.md). None of these items is an instruction to publish or contact anyone automatically.

## 1. Review the actual visual direction

- The complete provisional site is in `site/`; run `npm run dev:site` from the project root.
- The local wizard runs with `node dist/cli.js wizard --root site` after `npm run build`.
- Review warm paper neutrals, brick accent, system typography, borders, controls, copy, and page structure.
- The actual site manifest intentionally has no active categories. Its full source audit is clean under the draft policy, and an isolated copy passed the repair/activation API journey; that is not creative approval.
- After approval, review/save the policy in the wizard and activate resolved categories through its fresh-audit gate.

## 2. Browser and real interaction evidence

- No browser testing was performed, following your workspace instruction.
- API, server asset delivery, component rendering/model tests, and builds have passed. Rendered usability, keyboard navigation, responsive layout, clipboard behavior, and cross-browser behavior still need direct review.
- Authorize a browser walkthrough or perform the manual steps in `docs/demo.md` yourself. Record actual results before calling those gates verified.

## 3. Native agent trust and execution

- Skills and native hook configurations are ready for local Codex and Claude Code. Preview with `node dist/cli.js setup --root <project> --host both --hooks`.
- Applying setup requires `--write`; the target project needs the built tool installed locally, preferably from the prepared tarball.
- Native clients may require review/trust of the exact hooks and project configuration. Setup cannot grant that trust.
- Actual Codex/Claude lifecycle execution and client versions remain unverified. Fixtures exercised the real checker, handler JSON, shell runner, and commit pass/fail, but they do not prove native client behavior.

## 4. Naming, ownership, and release destination

- Local candidate: `@usualui/lint@0.1.0`, executable `usual-design`.
- Registry lookup did not find a public package at that name. That does not establish ownership/availability of the `@usualui` scope.
- Confirm the public GitHub owner/repository, npm name/scope and authorized publishing account.
- Confirm copyright attribution before public release. The current MIT file uses “Usual Design contributors”; no company identity has been invented.
- No Git repository or remote was created, and nothing was committed/pushed/publicized by this implementation.

## 5. Hosting and publication

- Choose/confirm the existing hosting target and DNS control for `usual.dev`. The website is static output in `dist/site`; it needs no application environment variables, database, or migrations.
- The preview intentionally uses noindex/crawler exclusions and no unverifiable public repository/package links. Finalize canonical URLs, sitemap, robots, install links, and preview banner after the actual destinations are approved.
- Review the package artifact, release notes, evidence report, website design/copy, and rollback steps before authorizing exact public actions.
- CI files are prepared. No remote workflow run, deployed website, or public package installation is claimed.

## 6. Distribution and pilots

- Review `docs/launch/announcement-draft.md` and `docs/launch/pilot-invitation-draft.md`.
- Choose the first channels/recipients and authorize exact posts/messages. Drafts remain unsent.
- Target five external projects completing onboarding and retaining useful enforcement. No external projects have been contacted or counted.
- No paid services, spending, account creation, or recurring automation was introduced.

## 7. Open-source community setup

The contribution workflow, development/maintainer guides, security/conduct/support policies, and GitHub issue/PR templates are prepared. Research and source examples are in [open-source contribution documentation](../research/open-source-contribution-docs.md).

- Confirm the canonical repository and owner/team before filling `repository`, `bugs`, and homepage metadata or adding public links. No GitHub handles, email addresses, labels, or CODEOWNERS entries have been guessed.
- Enable private vulnerability reporting in the confirmed GitHub repository, or choose a verified private alternative. Assign primary and backup responders, verify delivery/access, and replace the prelaunch notice in `SECURITY.md`.
- Designate a monitored confidential conduct-reporting contact and an uninvolved alternate. Review the proposed project-specific conduct/enforcement policy and replace the contact notice in `CODE_OF_CONDUCT.md`. This is not presented as an adopted Contributor Covenant template.
- Review the contribution policy, including human responsibility for AI-assisted changes, the MIT contribution terms, and the intentionally simple process without a CLA, DCO sign-off, or prescribed commit format.
- After the files reach the actual default branch, verify GitHub's community profile, three issue forms, and PR template. Local YAML checks do not establish that GitHub has activated them.
- Configure maintainer access, branch protection, and required checks after an actual CI run. Private security/conduct routes must be operational before public contribution intake.

These are owner/platform setup items, not missing local documentation or permission requests to continue implementation.

## Quick local commands

Run from `usual-design`:

```sh
npm ci
npm run typecheck
npm run build
npm test
node dist/cli.js wizard --root site
npm run dev:site
```

Candidate archive and machine proof are generated in the ignored `.usual-design/artifacts/` folder by `npm run verify:package`. Engineering limitations that do not require a product decision are listed in the compatibility guide and progress record, rather than being passed to you as permission requests.

## 8. npm publishing setup

The package is now `@usualui/lint`, with the `usual-design` executable unchanged. See [publishing](../../publishing.md) for the exact first-release and trusted-publisher steps. GitHub Actions `publish.yml` defaults to verification only; publishing requires an explicit checked input.

The current local npm session returns E401 and the registry has no public `@usualui/lint` version. Confirm/create the npm scope and authenticate the authorized owner for the first publication. Then configure npm trust for `usual-labs/usual-design`, workflow `publish.yml`, environment `npm`, and the Publish action when the next release is ready. Configure GitHub environment protections separately. No npm token, first publication, or scope ownership has been established by these files.
