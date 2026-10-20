# Usual Design: local usage

Usual Design turns the project’s design decisions into deterministic checks. It is intended for AI-heavy teams using React, JavaScript/TypeScript, and Tailwind v4. Read the [compatibility boundaries](compatibility.md) before treating a pass as evidence.

## Install and initialize

Use Node.js **22.12 or newer**. From the React/Tailwind v4 project you want to check:

```sh
npx @usualui/lint init
npx @usualui/lint init --write
npm install --save-dev @usualui/lint
npx --no-install usual-design audit --save
npx --no-install usual-design wizard --port 0
```

The first command previews a draft without writing files. The second creates `usual.design.json` and refuses to overwrite an existing manifest. The draft inventories evidence and leaves all categories inactive; observed values are not user-approved design policy. Review the result with your existing coding agent. An initial audit can exit `1` for unresolved findings or policy decisions.

`npx @usualui/lint` runs the package's single executable, `usual-design`. It does not install a project dependency; the `npm install --save-dev` step is needed for durable scripts and agent hooks. Keep the resulting package and lockfile changes in version control. To pin a one-off command, use `npx @usualui/lint@0.1.0 init --write`.

Commands below use the project-local executable. Run them from the target project; replace `/path/to/project` when an explicit root is shown. Source development setup is in the [development guide](development.md).

`wizard` prints a loopback URL. Open it manually. The interface uses token specimens and source references. It does not automatically import application components, execute project configuration, boot an app, or navigate it.

## Two onboarding journeys

**Existing system:** ask the agent to identify token definitions, approved utility classes, shared components, and semantic conventions. It proposes the contract, shows source evidence, and asks about conflicts. Keep original token definitions as source files; reference them through `tokens` and configure the permitted names/classes explicitly.

**Emerging system:** begin with the full inventory. The wizard shows observed ad-hoc class/style values, safe visual specimens, real source locations, and counts even when there are no CSS tokens. Use **Add to draft** to select intentional classes or literal values; this changes the unsaved policy only, until explicit review/save. Group recurring values by role, compare examples, and choose which patterns are intentional. Multiple radii, colors, or typography sizes can be valid. Record decisions and selected repair work before changing application code. The tool helps establish policy; it does not decide which visual direction is correct.

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

`init` starts with source patterns under `src`, `app`, `pages`, and `components`, no active categories, and empty allowed-value and rule lists. Omitted optional sections add no rules, exclusions, exceptions, or preview link. Validation never activates a category or approves observed values automatically.

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
