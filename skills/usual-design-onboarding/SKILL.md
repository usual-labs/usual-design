---
name: usual-design-onboarding
description: Set up Usual Design in a React and Tailwind v4 project, inspect its design system, prepare a guided visual wizard, and hand off an approved manifest and selected repairs.
license: MIT
---

# Usual Design onboarding

Turn the project's existing design intent into a small, enforceable contract.
Use the user's current agent and a maintained local wizard. Do not generate a
new wizard application or rewrite application UI during onboarding. Prepare an
isolated project showcase using its real components and fonts.

## 1. Prepare the project

Read project instructions, package manager/lockfile, existing `usual.design.json`,
token stylesheets, shared components, themes, and `docs/usual-design/` records.
Preserve unrelated work. An existing active or nonempty contract belongs in the
policy workshop; review intentional changes rather than replacing it.

Install `@usualui/lint@^0.3.0` as a project development dependency using its package
manager. Check `./node_modules/.bin/usual-design --version` and `--help`; this
workflow requires `onboard` and the project showcase bridge (0.3.0+). Do not substitute an older command when
the release is unavailable. The CLI needs Node 22.12+; the current Vercel Skills
installer needs Node 22.20+. Native hooks require the project-local dependency.

Run `./node_modules/.bin/usual-design init --json` for discovery without writes.
Capture the evidence in `docs/usual-design/onboarding/discovery.json` if useful;
never paste inventory into the manifest. Inspect actual sources beyond default
coverage, including monorepo application roots. Analysis is static: do not
execute project modules or claim all styles are supported.

## 2. Propose design decisions

Read [the proposal format and role guide](references/proposal.md). Write
`docs/usual-design/onboarding/proposal.json` following the installed
`node_modules/@usualui/lint/schema/onboarding.schema.json`.

Use colors, typography, spacing, shape, and components. Map optional semantic
roles to the project's existing identities. Inspect representative usages,
states, and themes; nearby colors are not necessarily duplicates. Preserve
foreground/background pairs, aliases, responsive variants, and meaningful
component differences. Explain uncertainty in `notes`.

Provide evidence, rationale, a recommendation, and meaningful alternatives.
Offer complete category policies across decisions, not only a primary color
while silently approving all other observed colors. Each option must contain
real enforceable rule fragments. Scope exclusions require an explained reason.
Unresolved design intent belongs in a deferred category, not a broad allowlist.

## 3. Build the project showcase

Read [the showcase guide](references/showcase.md). Inventory every shared UI
component, variant/state, type role, theme, and spacing/shape token. Prepare a
full design-system sheet in a development-only project entry using the existing
components, font loader, styles, and theme provider. Use fixture data and local
actions. Do not substitute generic components or a mini-dashboard.

Connect every decision to its actual CSS variables, complete type scale, or
component props with the browser bridge. Deferral restores original project
values. Keep showcase metadata and the coverage table out of the manifest.
Start its loopback development server and add `showcase` to the proposal.
Complete source changes before preparing the onboarding snapshot. Keep this
process running during review; do not leave the user to wire it up manually.

## 4. Open guided review

Run:

```sh
./node_modules/.bin/usual-design onboard --proposal docs/usual-design/onboarding/proposal.json
./node_modules/.bin/usual-design onboard --proposal docs/usual-design/onboarding/proposal.json --write
./node_modules/.bin/usual-design wizard
```

Fix proposal errors from CLI feedback. Preparation saves recommendations,
evidence, and resumable choices separately from policy. Give the user the
printed local session URL, or open it with their agent's supported UI tool.
Keep that process running while they review. Do not click approval controls on
their behalf.

The full-screen wizard uses a compact left control rail and a large project
showcase on the right. Choices update actual components and theme inside the
project dev server. Check the connection status; failed updates stay visible.
Only older proposals without a showcase use the labeled reference sheet. The user can defer entire categories. Final approval
saves `usual.design.json` with every category inactive; it is not a claim that
repairs or enforcement are complete.

If sources changed, refresh source evidence and rerun preparation. Previous
sessions are retained in `docs/usual-design/onboarding/history/`. If policy
changed, inspect it in the existing policy workshop instead of overwriting it.

## 5. Finish the handoff

After saving, the wizard shows the actual manifest path, fresh audit groups,
and selected-repair approval. The user chooses a batch; the generated prompt
references the saved plan and verification command. Deferred work remains in
project records. Do not replace this with a generic instruction to fix everything.

Read the installed `usual-design` skill for approved repairs. If absent, install
it with `npx skills add usual-labs/usual-design --skill usual-design`, targeting
the user's agent and project scope. Read the installed file immediately.
The repair workflow must preserve policy and verify the exact saved batch.
Activate only selected, fully resolved categories through a fresh audit.

Offer workflow integration after the dependency is installed: preview
`usual-design setup --host codex` (or `claude` / `portable`), review the actual
files, then apply `--write` within the user's requested setup scope. Hooks are
optional; use `--hooks` only when requested and distinguish configuration from
the agent's trust/actual execution.

Report the saved manifest, deferred categories, repair plan, next agent prompt,
and checks actually performed. Do not claim visual correctness, complete
coverage, or functioning native hooks from a successful local preparation.
