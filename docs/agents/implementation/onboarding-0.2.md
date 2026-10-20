# Agent-led onboarding implementation

Date: 2026-10-20. Package: `@usualui/lint@0.2.0`.

## Experience

The README and website start with a copyable prompt. The existing agent installs
the dedicated onboarding skill, reads project evidence, installs the compatible
CLI, and prepares a structured proposal. A maintained wizard walks through
scope, colors, typography, spacing, shape, components, and review. Choices update
a reference UI; theme variants and unsupported preview values are explicit.

Final approval saves a small inactive `usual.design.json`. Recommendations,
evidence, alternatives, choices, and deferred categories stay in
`docs/usual-design/onboarding/`. The existing audit workflow lets users approve
selected repairs and copy a prompt referencing their saved verification record.
Activation still requires a fresh clean audit for the entire category.

## Decisions and ownership

- [Design-system research](../research/design-system-onboarding.md) covers
  Material, Atlassian, Carbon, Radix, shadcn/ui, DTCG, review patterns, and contrast.
  Roles are optional human vocabulary, mapped to existing identities. The
  manifest remains schema version 1; no inventory or decorative role metadata
  enters enforcement policy.
- [Skill distribution research](../research/skills-distribution.md) establishes
  GitHub-hosted distribution via Vercel Skills. Installation and skills.sh
  indexing must be verified separately.
- `onboarding-types.ts` owns the pure choice compiler used by server and UI.
  `onboarding-proposal.ts` validates shape and category ownership; the existing
  manifest parser remains authoritative for rule fragments.
- `onboarding.ts` stamps source snapshots itself, verifies source evidence,
  archives refreshed sessions, protects existing contracts, and uses existing
  atomic expected-hash writes. Session hashes prevent stale tab writes. Saved
  completion remains separate from subsequent intentional policy edits.
- New HTTP operations retain the existing loopback, Host, Origin, session-token,
  body-size, and serialized-operation guards. Preview renders no project code,
  arbitrary CSS, remote assets, or custom fonts.
- Existing `init`, policy editing, audit, repair plans, activation, integrations,
  and manifest v1 remain compatible. `init --json` retains its report shape;
  human output and newly written drafts are smaller.

## Local evidence

- 154 automated tests passed: 138 core/API and 16 wizard model/render tests.
- Type checking, formatting, production builds, and `git diff --check` passed.
- Packed npm installation verified the executable, both schemas, both skills,
  supporting reference, real `onboard` preparation from the documented example,
  setup/idempotence, audit/check behavior, and bundled wizard asset delivery.
- Actual API journey verified proposal → choices → preview → approved minimal
  manifest → saved repair plan → `verify-plan` → source repair → activation.
- The website's source audit passed with zero findings/errors under its existing
  inactive draft policy.
- Both skills passed the skill-creator validator. Its PyYAML dependency was
  installed in an isolated temporary environment, not added to this project.

No browser test or native-agent lifecycle test was performed. No new environment
variables, database, migrations, hosted services, or model credentials are needed.
## Remote distribution evidence

- Implementation commit: `c3ab664c7f59feb6e8b88923df12d5373852aa2d`, pushed to
  `usual-labs/usual-design` on `main`.
- [GitHub CI](https://github.com/usual-labs/usual-design/actions/runs/39433061684)
  completed successfully for that exact commit.
- Official `skills@1.7.4` remote `--list` discovered both skills. One genuine
  isolated project-local installation with `--skill usual-design-onboarding
  --skill usual-design -a codex -y` succeeded. Both installed SKILL.md files and
  the proposal reference matched the repository byte-for-byte.
- Both direct skills.sh pages returned HTTP 200, the correct titles, and actual
  skill content:
  [onboarding](https://skills.sh/usual-labs/usual-design/usual-design-onboarding),
  [ongoing checks/repairs](https://skills.sh/usual-labs/usual-design/usual-design).
  A general `skills find usual-design` search did not yet return our repository;
  direct installation and page availability are verified separately from search.
- The verified npm archive is
  `.usual-design/artifacts/usualui-lint-0.2.0.tgz`, integrity
  `sha512-Cm1iDSOSrHE0vNj2EpqeLsAyI6wBUN/EKTHuJfSFc52gKZ2J7YwjvDvNdE6gDZhYVjv6N8PuPsHj43hLqTPBrg==`.
- npm publication was initiated from this archive and is waiting for fresh
  account verification. The user has the verification link in chat. No 0.2.0
  registry publication, registry installation, or OIDC provenance is claimed yet.
  The last verified public version is 0.1.0, which lacks `onboard`.

After verification, confirm publication outcome before retrying. Compare the
registry integrity with the archive above, install 0.2.0 in a clean temporary
project, and verify its `onboard` command and skill example. Keep that receipt
separate from the already-passed packed-install proof.
