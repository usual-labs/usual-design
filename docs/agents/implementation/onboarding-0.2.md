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
Release and remote-install evidence is recorded separately after publication.
