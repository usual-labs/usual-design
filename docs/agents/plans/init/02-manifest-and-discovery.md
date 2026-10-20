# Phase 02 — Manifest contract and safe project discovery

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [foundation](01-foundation.md). Next: [static analysis](03-static-analysis.md).

Strict JSON/Ajv validation now has located syntax errors, version migration guidance, contradiction/selector/reference checks, documented optional-section defaults, and deeply frozen snapshots. Discovery reports exclusions and bounded graph/traversal limits; namespace resets become explicit unresolved coverage, and newly discovered tokens never expand approval. Config/discovery/CLI/onboarding tests passed, including tokenless observations and initialization preservation. A normalized omitted-field preview/source map, dedicated manifest example files, and broader workspace metadata handling remain unchecked.

## Outcome

Make the project's approved design policy explicit, validate it strictly, and discover the source facts needed by the agent, wizard, and linter. Discovery proposes evidence; it never automatically approves observed styles.

## Contract and trust boundaries

The Usual JSON manifest is authoritative policy, even when the project already has Tailwind tokens. It may name approved variables and reference their definitions for resolution, but source discovery cannot expand allowed values or rules. No executable configuration is required.

A category's activation is independent of whether rules for that category have been drafted. A draft can be audited before activation. The six UI audit groups include coverage/unresolved cases; unresolved evidence is attributed to affected design categories rather than made dismissible through a global coverage-off toggle.

## Detailed tasks

### Define the manifest

- [x] Finalize the conventional filename and explicit `--config` override behavior.
- [x] Add a schema version and reject unsupported versions with migration guidance rather than guessing.
- [x] Define root-relative coverage paths, exclusions, token sources, approved variables/values, semantic rules, component rules, exceptions, and category activation.
- [x] Keep genuinely unused sections optional and define the exact default for every omitted field.
- [x] Make initial categories inactive unless the user has explicitly completed activation.
- [x] Validate unknown fields, contradictory settings, duplicate IDs, invalid selectors, and malformed paths.
- [x] Define stable rule IDs for diagnostics, documentation links, and saved decisions.
- [x] Distinguish token identifiers, resolved source values, and approved policy constraints.
- [x] Define how approved numeric spacing steps differ from Tailwind's syntactically valid numeric utilities.
- [x] Support intentional variants such as different button/card radii without forcing a single global value.
- [x] Define explicit matching for semantic rules: element/component identity, relevant literal props, and class context.
- [x] Define component replacement and approved-import rules, including implementation-file exceptions.
- [x] Require exceptions to identify their rule/target and reason; reject an exception that accidentally disables unrelated coverage.
- [x] Define safe constraints for path patterns and rule selectors; avoid executing arbitrary expressions or user regex without bounded behavior.
- [x] Model structural configuration failures independently from ordinary design findings.
- [x] Specify the policy for zero active categories and for active categories with no effective rules; never imply protection where none exists.
- [ ] Produce minimal, complete, and intentionally invalid example manifests in fixtures.

### Build one validation path

- [x] Implement a pure loader/parser with useful JSON syntax locations.
- [x] Use a maintained schema validator and avoid manually maintaining inconsistent runtime/type/schema definitions.
- [x] Add semantic validation for references and relationships that JSON Schema alone cannot express clearly.
- [ ] Normalize paths and policy once, keeping original source locations for user-facing messages.
- [x] Return immutable validated configuration to analysis and wizard consumers.
- [x] Calculate a stable policy identity/fingerprint for audit freshness and repair-plan records.
- [x] Ensure CLI, activation, wizard saves, and skills all call the same validator.
- [ ] Keep defaults visible in normalized previews so users know what a missing field means.
- [x] Reject partial/truncated writes and unknown schema versions without overwriting the original file.

### Discover project facts without executing them

- [x] Resolve the project root and inventory configured file types using bounded file traversal.
- [x] Respect configured coverage/ignore patterns and report their effect as counts and paths.
- [ ] Exclude dependencies, generated builds, binaries, and unsupported large inputs by documented rules rather than silent arbitrary skipping.
- [x] Detect Tailwind version from declared/installed metadata without executing the package or config.
- [ ] Handle missing, conflicting, workspace, and unsupported-version metadata explicitly.
- [x] Find candidate token stylesheets and statically parse CSS `@theme` namespaces.
- [x] Recognize `@theme inline`, namespace resets, ordinary CSS variables, and unresolved `var()` references.
- [x] Follow only supported local stylesheet imports inside declared coverage; handle cycles and reject paths escaping the approved root.
- [x] Identify `@config`, `@plugin`, remote imports, and other executable/unsupported inputs as unresolved discovery facts.
- [x] Collect source references for token definitions and usages without loading project JavaScript.
- [x] Inventory component exports/imports and likely shared component directories as candidates, not mandatory approvals.
- [x] Recognize existing preview/documentation links as user-reviewed metadata; do not fetch or launch them automatically.
- [x] Produce a machine-readable inventory plus a concise human summary for agent consumption.
- [x] Keep discovered facts separate from the proposed manifest so accepting an inventory cannot approve policy accidentally.

### Implement safe draft initialization

- [x] Make initialization create a clearly labeled draft and documented next steps rather than falsely reporting a complete design system.
- [x] Refuse to overwrite an existing manifest; support an explicit review/merge path instead.
- [x] Generate no approved values from frequency alone; present candidate values and competing usages to the agent/user.
- [x] Preserve legitimate diversity and identify missing/ambiguous evidence for the wizard.
- [x] Use atomic writes and reject changes if the existing manifest changed after it was read.
- [x] Limit generated files to the selected project and document their purpose.

## Focused proof

- [x] Test omitted/default/unknown fields and cross-reference failures through the public loader.
- [x] Test a malicious/executable config fixture with an observable side effect and verify discovery never executes it.
- [x] Test local import cycles, symlink/root escape, namespace reset, unresolved variable, and unsupported version cases.
- [x] Verify adding a new source token does not automatically make it approved by policy.
- [x] Verify initialization preserves an existing manifest and reports a stale-write conflict.
- [x] Verify both independent fixtures produce different, traceable inventories.

## Completion gate

- [x] Valid configuration has one normalized meaning across consumers.
- [x] Invalid/unsupported input cannot look like a clean scan.
- [x] The user/agent can inspect discovered evidence and create a valid draft without any project-code execution.
- [x] Document the manifest fields, defaults, discovery limits, and required migration/version behavior for phase 03.
