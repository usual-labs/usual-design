# Remaining engineering and proof

Updated: 2026-10-20. This is engineering context, not a list of permission requests. Items requiring Armin are in [needs-armin](../handoffs/needs-armin.md). Read the [progress evidence](progress.md) before changing scope.

## Before claiming complete first-release acceptance

- [ ] Finish direct interaction acceptance for the wizard: keyboard/focus, selection through rendered controls, clipboard failure, reload/stale errors, responsive layout, and visual specimen usability. Model/SSR/API proofs pass; browser execution remains separately pending under the workspace instruction.
- [ ] Exercise the generated skills and hooks in real supported Codex and Claude clients, record exact versions/trust/settings and a real approved repair turn. Fixture handlers and shell subprocesses cannot establish native lifecycle behavior.
- [ ] Run the prepared CI workflow in the approved remote repository. Local execution of its commands is recorded separately.
- [ ] Measure a larger real React/Tailwind project with representative source complexity before making broad performance claims. The retained benchmark has small Ember and 500 tiny generated JSX sources, file/LOC counts and separate command distributions; it is deliberately labeled synthetic.
- [ ] Complete visual/creative approval of the actual website policy, then record the real website's activation trail. Its source audit is clean; actual categories stay inactive until approval.

## Granular checklist work still open

The ordered plan also retains smaller unclosed engineering tasks. They are not assigned to Armin as decisions:

- [ ] Show a fully normalized omitted-field/default view with manifest-source mapping in the wizard; exact defaults are currently documented and schema-validated.
- [ ] Expand retained Tailwind prefix/variant/property/shorthand tables beyond the meaningful regression cases already present. Keep unsupported interpretations explicit.
- [ ] Add cancellation and obsolete-scan handling if large-project measurements justify it. The server currently rejects overlapping analysis/mutation jobs, and native handlers perform independent read-only checks with bounded adapter timeout/continuation.
- [ ] Add explicit cross-category dependency notes to saved repair batches when source evidence establishes them; today selected/deferred findings and protected-policy constraints remain explicit.
- [ ] Exercise competing simultaneous native events and workspace-root npm invocation on additional real installations. Existing tests cover nested working directories and real temporary commit hooks.

Approval batch records intentionally use unique UUIDs so separate explicit approvals are distinct events. Finding IDs are deterministic and line-independent; resumption uses current evidence and protected policy hashes. Do not make independent approvals overwrite each other merely to obtain deterministic filenames.

## Documented analysis boundaries

These are conservative compatibility limits, not hidden passing assertions. Expanding them requires targeted positive, violating and unknown cases.

- Compiler-config inheritance and arbitrary compiler/plugin execution are not resolved. Explicit JSONC aliases, covered immutable helpers and proven reexports are supported; unresolvable relevant paths fail coverage.
- Dynamic class fragments, aggregate references, computed CVA configuration, arbitrary helper wrappers, mutable/ambiguous component composition, CSS-in-JS and unhandled directives remain unknown. Do not replace unknowns with guessed runtime behavior.
- Theme wildcard resets are detected and block active style coverage. The tool does not emulate Tailwind's full theme/default/reset cascade.
- Generic approved-value checks cover the documented color/type/spacing/shape families. Neutral/unconstrained utility families are explicitly listed in [compatibility](../../compatibility.md). Extend the property matrix deliberately if those families become part of the project contract.
- There is no full CSS shorthand/cascade/computed-style model, arbitrary React preview execution, beauty/originality score, or universal accessibility assessment. These are outside the initial promise.
- Per-file locks, hash rechecks and fresh activation scans protect observable conflicts; there is no cross-editor repository transaction. A source edit immediately after verification is still possible. Recheck before completing work.
- Diagnostic IDs are line-independent semantic evidence plus occurrence. Identical insertions/deletions can change occurrence associations. Snapshot verification remains authoritative.
- Working-tree commit checks do not validate only staged content. CI validates the committed checkout.
- POSIX/macOS executable/hook behavior is proven locally. Linux remote CI and Windows behavior are not claimed as tested.

## Resume order

1. Keep ordinary `check` read-only and preserve full inactive-category semantics.
2. Refresh tests/build and the packed artifact after any source change. Retain the exact new integrity and environment in progress.
3. Close acceptance gates with direct evidence once the corresponding environment/authorization is available. Do not infer browser/native/remote results from local models or API tests.
4. Perform only the exact approved publication/deployment/outreach actions after destinations and artifacts have been reviewed. No action in this file authorizes them.
