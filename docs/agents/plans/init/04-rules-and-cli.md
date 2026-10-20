# Phase 04 — All three rule families and the deterministic CLI

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [static analysis](03-static-analysis.md). Next: [audit and repair records](05-audit-and-repair-records.md).

All three rule families run through the built CLI; Atlas produces approved-value, semantic, and component failures, while Ember passes without writes. Branch-aware class-context semantics and renamed/mutable identity uncertainty have retained regressions. Structured results include coverage patterns, used/unused exceptions, stable semantic IDs and occurrence disambiguation. Unqualified forbidden utilities cannot hide behind responsive/state/arbitrary variants or important modifiers. Unchecked tasks retain compound edge-case and interrupt proof; no comprehensive rendered-style claim is made.

## Outcome

Deliver a useful, read-only linter with approved-value, semantic, and component checks. Feed the same validated evidence into all output modes and integrations. A failing diagnostic should tell an agent what was observed, which policy it violates, and what authorized correction is available.

## Behavioral contract

`check` enforces only active categories across the full declared project scope. It does not accept a violation baseline, suppress old findings by line number, or redefine passing as checking only changed files. Inactive categories and declared exclusions remain visible in summaries. No active categories means no design rules are enforced, not that the project is compliant.

Define a stable result model with statuses for pass, violation, unverifiable active coverage, and configuration/operational failure. Use a conventional, documented exit mapping—for example 0, 1, and 2—shared by all handlers. Structured output has its own version.

## Detailed tasks

### Approved-value rules

- [x] Evaluate approved color literals, variables, and semantic color utilities according to manifest policy.
- [x] Evaluate typography families/sizes/weights/line heights/letter spacing for the supported utility/property matrix.
- [x] Evaluate configured spacing steps, including negative and arbitrary values where policy allows them.
- [x] Evaluate declared layout constraints only where explicitly modeled; do not invent global taste rules.
- [x] Evaluate radii and supported border/shadow/effect constraints.
- [x] Preserve distinct allowed roles and component variants instead of forcing identical values everywhere.
- [x] Resolve allowed variable references without treating every newly discovered variable as approved.
- [x] Apply equivalent checks to supported inline/CSS declarations as to Tailwind utilities.
- [x] Respect responsive/state/conditional contexts without confusing inactive branches with global compliance.
- [x] Explain an unsupported value separately from a definitely forbidden value.

### Semantic rules

- [x] Match explicit elements, resolved component identities, literal props, and configured class contexts.
- [x] Define and implement required/forbidden prop or class/token constraints for matched targets.
- [x] Demonstrate a primary-action rule using explicit component/prop evidence.
- [x] Evaluate each reachable finite branch and variant context rather than pooling all classes together.
- [x] Reject a false pass where only hover/dark/responsive code satisfies an unrelated base requirement.
- [x] Define how a required semantic value interacts with a conflicting later class or supported merge helper.
- [x] Detect dynamic prop/spread cases that make matching or satisfaction unverifiable.
- [x] Permit approved shared-component APIs to carry semantics without requiring callers to repeat internal style classes.
- [x] Attribute semantic findings to their relevant design categories and avoid duplicate audit rows.
- [x] Supply direct source/policy evidence; do not emit aesthetic judgments as deterministic failures.

### Component rules

- [x] Resolve approved component imports by module/export identity, including supported aliases and re-exports.
- [x] Enforce configured native-element replacement rules in declared application scope.
- [x] Exempt approved implementation files precisely so `Button` can contain a native button.
- [x] Enforce approved/forbidden component imports where configured.
- [x] Handle aliased names and local shadowing without trusting spelling alone.
- [x] Support explicitly approved wrapper components through configured identities rather than visual inference.
- [x] Keep composite-layout suggestions outside hard failures until explicit detectable conditions exist.
- [x] Detect unknown component identities or relevant dynamic composition as coverage issues where required.
- [x] Provide the approved import/usage guidance without generating an unsafe automatic rewrite.

### Shared evaluation and diagnostics

- [x] Build a deterministic evaluation pipeline over the normalized manifest and source evidence.
- [x] Apply activation before reporting category-specific enforcement findings while retaining operational errors.
- [x] Apply narrowly scoped exceptions consistently and include exception usage in summaries.
- [x] Validate exception references and expose ineffective/orphaned exceptions for review.
- [x] Assign stable finding identity based on rule/target/evidence, with collision handling; avoid line-number-only identity.
- [x] Include file, location, rule/category, observed evidence, expected policy, and a useful remedy.
- [x] Reference the governing manifest section and distinguish code repairs from policy-change suggestions.
- [x] Avoid pretending to know a unique replacement when several approved values are legitimate.
- [x] Deduplicate overlapping checks without hiding distinct root causes.
- [x] Preserve one canonical result model for human output, JSON, future wizard use, and hooks.

### CLI behavior

- [x] Implement `check` with explicit project/config selection and documented full-scope behavior.
- [x] Produce concise human diagnostics and a summary of active/inactive categories, checked files, and coverage limits.
- [x] Produce schema-versioned JSON with stable ordering and no extra stdout chatter.
- [x] Route progress/debug detail to stderr and disable terminal styling when inappropriate.
- [ ] Implement help/version/usage errors and controlled interrupt behavior.
- [x] Return correct exits for clean, policy failure, unresolved active coverage, invalid manifest, and I/O/parser failures.
- [x] Show an unmistakable no-enforcement message when no categories are active.
- [x] Make checks read-only, including on failure and under JSON output.
- [x] Avoid adding automatic `--fix` behavior; repairs belong to the user-approved agent workflow.

## Focused proof

- [ ] Test valid and violating examples for each of the three rule families in both independent fixtures.
- [x] Test an inactive typography category with new typography violations and verify it is not linted.
- [x] Test that active color checks still fail for color violations and relevant unknowns in that same project.
- [ ] Test default, branch, responsive, import-alias, wrapper, and implementation-exception edge cases that could create false passes.
- [x] Invoke the built CLI as a subprocess and verify outputs, exits, deterministic ordering, and no writes.
- [x] Verify a violation's guidance enables a fixture repair that then passes without modifying policy.
- [x] Record a first representative timing baseline without introducing caching prematurely.

## Completion gate

- [x] All three rule families work through the public CLI, not only internal unit calls.
- [x] Full-scope category activation and coverage semantics match the overview.
- [x] Diagnostics are actionable and honest about unknowns.
- [x] Publish the implemented rule/syntax matrix and limitations for downstream audit/wizard work.
