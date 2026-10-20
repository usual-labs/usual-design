# Usual Design: local usage

Usual Design turns the project’s design decisions into deterministic checks. It is intended for AI-heavy teams using React, JavaScript/TypeScript, and Tailwind v4. Read the [compatibility boundaries](compatibility.md) before treating a pass as evidence.

## Start with your existing agent

Copy the [README onboarding prompt](../README.md#quick-start) into your agent.
It installs `usual-design-onboarding` from `usual-labs/usual-design` through the
Vercel Skills CLI, reads the installed skill, and prepares recommendations from
your project. Node 22.20+ supports the current Skills installer; our CLI needs
22.12+. This onboarding workflow requires @usualui/lint 0.3.0+.

The maintained wizard walks through project scope, colors, typography, spacing,
shape, components, and review. Choices update a large project component showcase beside the compact control rail. Preserve
existing names, states, themes, and meaningful variations; nearby colors need
not be duplicates. Defer a whole category when its decisions are not ready.

The agent writes a proposal following `schema/onboarding.schema.json`, with
actual rule fragments and source evidence. The installed skill includes the
[format and role guide](../skills/usual-design-onboarding/references/proposal.md).
It runs these commands from your project:

```sh
npm install --save-dev @usualui/lint@^0.3.0
npx --no-install usual-design init --json
npx --no-install usual-design onboard --proposal docs/usual-design/onboarding/proposal.json
npx --no-install usual-design onboard --proposal docs/usual-design/onboarding/proposal.json --write
npx --no-install usual-design wizard
```

`onboard` validates without writes by default. `--write` saves a resumable proposal
session, never policy. Open the printed local URL; the server does not auto-open
a browser. Choices persist on Continue, Back, or Save. Final approval
writes the minimal manifest with all categories inactive. A fresh audit then
lets you select a repair batch and copy a prompt for your existing agent.

`docs/usual-design/onboarding/session.json` holds recommendations and choices;
previous preparations are archived under `history/`. Source and policy changes
invalidate stale approval. Refresh evidence and rerun preparation after source
changes. Existing active/nonempty contracts use the policy workshop for
intentional changes; onboarding does not replace them.

### Project showcase (0.3.0+)

The onboarding agent prepares a development-only sheet of the project's real
components, variants, type scale, fonts, palettes, and themes. It uses the
project's own server and font/theme setup, embedded into the right side of the
wizard. The wizard sends selected option IDs and the light/dark theme through
an origin-checked browser bridge. Each choice maps to real tokens or component
props in that page; deferring a category restores its original project values.

The agent starts both local servers and adds `showcase: {url, title, themes}` to
the proposal. This metadata stays out of the manifest. See the
[showcase guide](../skills/usual-design-onboarding/references/showcase.md) for
coverage, bridge usage, dev-only routing, and frame policy. Upgrade to 0.3.0 or later
for this bridge; earlier packages continue to use the reference sheet.
After updating the showcase URL, refresh preparation and restart the wizard.

If the showcase is unavailable or cannot apply a selection, the preview shows
the failure and a reload control while retaining choices. The CLI never imports
project modules. Older proposals without a showcase use an expanded reference
sheet, with neutral defaults and explicit limits; it is not the actual app.
Neither view alone proves accessibility or production layout correctness.

## Manual discovery and existing contracts

`npx @usualui/lint init` prints a concise discovery summary without writing files.
Add `--json` for the full `{manifest, inventory, errors, written}` report. The
inventory is evidence, never part of the saved manifest. `init --write` saves a
minimal inactive draft and refuses to overwrite an existing manifest. These
manual commands remain available; guided onboarding is the recommended start.

One-off npx use does not install the local dependency required by scripts/hooks.
Commands below use the project-local executable. Pass `--root /path/to/project`
when targeting another project. An audit can exit 1 for unresolved findings or
policy decisions. Source setup is in the [development guide](development.md).

## Project manifest

The default filename is `usual.design.json`. Pass `--config relative/path.json` to use an explicit project-relative path. Schema version `1` is supported. Unknown or malformed fields must be fixed rather than silently ignored.

```json
{
  "version": 1,
  "include": ["src/**/*.{js,jsx,ts,tsx}", "src/**/*.css"],
  "ignore": ["src/generated/**"],
  "tokens": ["src/style.css"],
  "active": [],
  "allowed": {
    "colors": {
      "classes": ["bg-surface", "bg-action", "text-ink", "text-on-action"],
      "variables": ["--color-surface", "--color-action", "--color-ink", "--color-on-action"],
      "values": ["transparent", "currentColor"]
    },
    "typography": {
      "classes": ["font-sans", "font-medium", "text-sm", "text-base", "leading-relaxed"]
    },
    "spacing": { "classes": ["p-4", "p-6", "gap-4", "mt-4"] },
    "shape": { "classes": ["rounded-md", "border", "shadow-sm"] }
  },
  "semantics": [
    {
      "id": "primary-action",
      "target": { "element": "a", "props": { "data-intent": "primary" } },
      "requireClasses": ["bg-action", "text-on-action"]
    }
  ],
  "components": [
    {
      "id": "shared-button",
      "element": "button",
      "replacement": { "name": "Button", "from": "./ui/Button" },
      "ignore": ["src/ui/Button.tsx"]
    }
  ]
}
```

This is an illustrative starting point, not a complete policy for every project. A category must have the policy it needs before activation.

| Field        | Purpose                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `version`    | Explicit manifest format version.                                                                                                |
| `include`    | Project-relative file patterns to analyze. Include every application source/style path whose design rules you expect to enforce. |
| `ignore`     | Optional project-relative exclusions. Exclusions are policy decisions requiring review.                                          |
| `tokens`     | Optional stylesheet paths used to inventory token definitions. They do not approve all observed values automatically.            |
| `active`     | Enforced categories: `colors`, `typography`, `spacing`, `shape`, `components`.                                                   |
| `allowed`    | Per-style-category permitted classes, CSS variable names, and literal CSS values.                                                |
| `semantics`  | Rules targeting explicit elements or imported components with optional literal props.                                            |
| `imports`    | Optional forbidden modules/exported names and replacement guidance.                                                              |
| `components` | Rules requiring an approved replacement for configured native elements.                                                          |
| `exceptions` | Narrow exceptions with `ruleId`, `file`, and a human-readable `reason`.                                                          |
| `preview`    | Optional link to an existing, user-run preview; the checker does not start it.                                                   |

The JSON schema shipped in `schema/manifest.schema.json` is authoritative for accepted fields. Keep the manifest in version control with its decisions and repair records.

### Defaults and validation

Manifests use strict JSON: comments and trailing commas are rejected with a line and column. Version `1`, a nonempty `include`, and an explicit `active` array are required. An unsupported version needs a compatible tool release or a reviewed migration; changing only its version number does not migrate its fields.

`init` starts with source patterns under `src`, `app`, `pages`, and `components`, no active categories, and no optional policy fields. Omitted optional sections add no rules, exclusions, exceptions, or preview link. Validation never activates a category or approves observed values automatically.

Semantic native-element targets use tag names such as `button` or `usual-button`, not CSS selectors or React component names. A rule cannot require and forbid the same class, or require a prop value that contradicts its target filter. Rule IDs must be unique across rule types; exceptions must be unique by rule ID and file, even when their reasons differ. Preview links must be valid absolute HTTP or HTTPS URLs.

The programmatic `parseManifest`, `parseManifestText`, and `loadManifest` APIs return deeply frozen manifest snapshots. Use `structuredClone(manifest)` to prepare an editable draft, then validate or save it. `defaultManifest()` returns a fresh editable onboarding draft.

## The three rule types

### Approved values

A valid Tailwind utility is not necessarily approved by the project. For example, `bg-fuchsia-500` can compile successfully while violating a contract that permits only semantic surface/action colors. Configure allowed classes, variable references, and literal CSS values by category.

```tsx
// Violates a policy that excludes bg-fuchsia-500.
<section className="bg-fuchsia-500 p-6">Overview</section>

// Uses approved values for this project.
<section className="bg-surface p-6">Overview</section>
```

### Semantic usage

Semantic rules enforce explicit intent. They do not infer arbitrary visual purpose from nearby text. Target a native element or an imported component, optionally narrowed by literal props or exact class context. Require/forbid classes or require props using the manifest’s supported fields.

```json
{
  "id": "primary-action",
  "target": { "element": "a", "props": { "data-intent": "primary" } },
  "requireClasses": ["bg-action", "text-on-action"],
  "forbidClasses": ["bg-muted"]
}
```

Both muted and action colors can be globally allowed while the primary action specifically requires the action role. Component targets use `{ "name": "Button", "from": "./ui/Button" }` to identify the intended import. Match the project’s explicit import convention; do not assume unrelated local variables with the same name are equivalent.

Add `"classes": ["bg-surface", "rounded-md"]` inside `target` to apply a rule only to class branches containing **every exact contextual class**. This is an all-of match, with no wildcard interpretation: `hover:bg-surface` does not match `bg-surface`. Required and forbidden classes are evaluated only on matching finite branches; required props apply when any branch matches. A dynamic class context produces coverage findings for the categories affected by the rule, including components when props are required.

### Component usage

Require an approved component for a known native element, with a narrow exclusion for the component’s own implementation:

```json
{
  "id": "shared-button",
  "element": "button",
  "replacement": { "name": "Button", "from": "./ui/Button" },
  "ignore": ["src/ui/Button.tsx"]
}
```

The agent performs the repair, preserving event handlers, accessible names, form behavior, and other props. The checker reports the violation; it does not blindly rewrite native elements. It does not recognize every collection of `div`s that might visually resemble a shared card.

## Audit, durable work, and activation

The full audit examines every category, whether active or not. Findings appear in six groups:

1. Colors.
2. Typography.
3. Spacing and layout.
4. Shape and effects.
5. Components.
6. Coverage and unresolved analysis.

Semantic findings belong to the relevant style/component category. Coverage is an audit group, not a sixth independently activated design category. An unverifiable use affecting an active category blocks its check.

Save an audit before selecting repairs. The wizard records selected work and decisions in `docs/usual-design` within the project. Keep durable records in version control where appropriate; they are local project artifacts, not a hosted backlog. The separate `.usual-design` directory holds integration ownership and local hook state.

```sh
npx --no-install usual-design audit --root /path/to/project --save
```

The user selects a repair batch, then gives the saved plan to their existing agent. The agent changes application code, reruns the audit, and leaves deferred work documented. Recheck freshness before resuming an old plan because source and policy may have changed.

Ordinary repair authorization does not authorize changing `allowed`, `ignore`, `exceptions`, activation settings, or rule requirements. A design-policy change requires an explicit, separate decision and a visible review of those files.

```sh
npx --no-install usual-design activate --root /path/to/project --categories colors,typography --write
npx --no-install usual-design check --root /path/to/project
```

Activation requires current evidence that the selected categories are resolved. If typography is skipped, lint does not check typography at all, including new typography violations. The audit continues to document it. There is no baseline that silently accepts individual violations in an active category.

## Put the same check in your workflow

First validate the command directly. With the package installed in your project, add an npm script:

```json
{
  "scripts": {
    "lint:design": "usual-design check"
  }
}
```

Run `npm run lint:design` locally and in CI after installing locked dependencies. npm scripts resolve the project-local executable.

Use the generated preview before requesting setup writes. First-class agent setup targets Codex and Claude Code. Review proposed instruction, skill, and hook changes; preserve existing user content. Automatic hooks depend on each agent’s version, trust settings, and supported lifecycle events. A skill instruction to run a command is not an automatic hook.

```sh
npx --no-install usual-design setup --root /path/to/project --host both --hooks
npx --no-install usual-design setup --root /path/to/project --host both --hooks --write
```

The generated npm script uses the locally installed `usual-design` executable. Install `@usualui/lint` as a development dependency in the target project before triggering it; review the resulting lockfile changes. Generated native hooks invoke the locally installed built CLI without downloading a package. Add `--commit-hook` to the setup preview only if you want the optional hook; existing hook managers and conflicting hooks require manual integration.

Commit hooks provide local feedback. A working-tree check does not prove the Git index is clean when files are partially staged. Run the independent CI check against the committed checkout. Do not assume a local executable path exists on the CI runner; build/install the tool from the exact source/package the workflow is meant to validate.

Do not record a setup integration as working until its actual event has triggered and its command result has been observed. To remove setup, remove only the tool-owned entries/files shown by the setup preview; preserve unrelated instructions and hooks. If removal is not automated by the installed CLI, review the relevant tracked diff manually.

## Output, errors, and troubleshooting

```sh
npx --no-install usual-design check --root /path/to/project --json
```

| Exit | Meaning                                                                                      |
| ---- | -------------------------------------------------------------------------------------------- |
| `0`  | The requested operation succeeded; for checks, configured active rules passed.               |
| `1`  | Design-policy or active-coverage failures were found.                                        |
| `2`  | Invalid configuration, compatibility issue, or operational failure prevented a valid result. |

Human output is intended for development; structured output is intended for agents and automation. Findings include a rule ID, file, line/column, explanation, and expected result where available. Output order is deterministic so repeated results are easy to compare.

If a check passes unexpectedly, inspect the reported active/inactive categories, include/ignore paths, exceptions, and compatibility warnings. No active categories is not full compliance. If a category cannot activate, resolve its design findings and any coverage failures that affect it. If a repair plan is stale, rerun the full saved audit and select current findings.

For a possible false positive, preserve the manifest and minimal triggering source, note exact Node/Tailwind/CLI versions, and include the full structured finding. Avoid broad exclusions as a workaround. Never attach secrets or private source without permission.

## Import restrictions

Use `imports` to prohibit a module or specific imported names. Omit `names` to prohibit all imports from the matching source; `from` supports an explicit `*` wildcard. Import aliases keep the original exported name for matching.

```json
{
  "imports": [
    {
      "id": "approved-controls-only",
      "from": "legacy-ui",
      "names": ["Button"],
      "replacement": { "name": "Button", "from": "./components/Button" }
    }
  ]
}
```

This is an optional manifest section, enforced by the `components` category. Replacement information is diagnostic guidance; the checker does not rewrite imports.

## Saved decisions and repair verification

Manifest saves record a prepared before/after policy decision in `docs/usual-design/decisions/`. The wizard can supply a rationale. An empty rationale remains explicitly unknown. A prepared record alone does not mean a manifest write succeeded; compare its resulting hash with the actual manifest.

`audit --save` refreshes `audit.json`, its generated Markdown view, and `repair-progress.json` / `repair-progress.md` when repair batches exist. Original approved plans remain unchanged. Findings moved to another line still count as reported. Changes to policy require review. “Not observed in current audit” describes current covered evidence and does not prove visual correctness. Keep manual notes in separate files; edited audit Markdown is preserved by refusing an automatic overwrite.

Repair plans contain `verifyArgv` as structured command arguments. Treat filenames as data, and run verification from the selected project root. The human `verify` command uses POSIX quoting.

Component target `name` refers to the exported name, independently of a local alias. Use `"default"` for a default export. Direct namespace member usage is recognized. A named import restriction also rejects namespace imports from that source: switch to explicit permitted imports or review a scoped exception. Covered static named/default re-export chains and unambiguous stars are canonicalized where provable; cyclic, mutable, dynamic, or ambiguous export chains remain unresolved.

## Verify saved repairs before editing

Run `usual-design verify-plan --plan docs/usual-design/repairs/<id>.json` immediately before starting an approved batch. For a custom manifest pass the same `--config` used to create the batch. This read-only operation validates the record, approval, current source/policy snapshot, and selected findings. It never executes commands stored in records. If it fails, refresh the audit and explicitly approve a current selection. After repairs the original snapshot is expected to differ; use a fresh audit to verify outcomes.

Writes use per-file exclusive locks, temporary files, fsync, and a final content/hash recheck before rename. These protections detect observable conflicts; they are not a repository-wide transaction and cannot stop another editor from changing source immediately after a scan. Activation scans again before committing policy. A prepared receipt is not proof of commit. Preserve edited/corrupt records and restore or reconcile them before retrying; never delete approval history to conceal a failure.

An unqualified semantic `forbidClasses` utility, such as `bg-ocean`, also forbids its responsive/state/arbitrary-variant and important forms. A variant-qualified entry such as `hover:bg-ocean` retains that explicit variant scope. Required classes and `target.classes` contexts are exact source tokens; a hover-only class does not satisfy an unconditional requirement.
