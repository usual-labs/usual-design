# Phase 03 — Static source analysis and coverage evidence

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [manifest and discovery](02-manifest-and-discovery.md). Next: [rules and CLI](04-rules-and-cli.md).

Babel/PostCSS parsing, finite class alternatives, lexical/helper identity, supported clsx/cva/tailwind-merge decoding, local import coverage, static inline/CSS rules, and unresolved evidence are implemented and tested. Canonical named/default reexports, static aliases, unambiguous stars, JSONC paths, conservative mutable identities, UTF-16 spans, bounded source excerpts, and line-independent finding IDs have retained proof. Cycles, mutable/dynamic aliases, ambiguity, and bounded-resolution exhaustion remain explicit unknowns. Complete shorthand/cascade interpretation and an exhaustive Tailwind syntax matrix are not claimed.

## Outcome

Turn supported React/Tailwind source into traceable facts that rule evaluation can trust. Preserve conditional contexts, component identities, declaration locations, and uncertainty. This phase establishes what the tool can know; it does not silently convert syntactic validity into design approval.

## Analysis boundaries

Parse source rather than using regex as the primary program parser. Resolve finite literals and explicitly supported helper shapes without executing code. Reuse supported upstream utilities where their public API fits, but do not depend on undocumented Tailwind internals or run project plugins to classify a candidate.

The first release checks configured source contracts. It does not reproduce browser layout, the complete CSS cascade, runtime component composition, or arbitrary JavaScript data flow. Unsupported constructs that can affect active categories become coverage failures, with precise reasons and scoped escape hatches.

## Detailed tasks

### Build source ingestion

- [x] Parse JS, JSX, TS, and TSX with a maintained parser configured for their actual syntax.
- [x] Preserve file, line, column, source span, and useful surrounding context on extracted evidence.
- [x] Handle syntax failures as explicit analysis errors rather than treating the file as empty.
- [x] Build a bounded in-process file/import index for covered sources.
- [x] Resolve relative imports, configured aliases, extension/index resolution, and supported TypeScript path mappings.
- [x] Handle alias cycles, missing modules, re-exports, and unresolved identities without guessing.
- [x] Resolve imports from declared metadata without executing `next.config`, `tailwind.config`, or package code.
- [x] Establish per-run limits for pathological input and return explicit incomplete-analysis errors if exceeded.
- [x] Keep deterministic ordering independent of filesystem traversal order.

### Extract finite class and prop evidence

- [x] Extract literal JSX `className` values and supported equivalent class-bearing attributes.
- [x] Handle literal expression containers and template strings with no unresolved interpolation.
- [x] Resolve finite ternary/logical branches and preserve their conditions instead of flattening mutually exclusive alternatives.
- [x] Resolve safely bounded local/imported constant bindings where supported; detect mutation and cycles.
- [x] Support statically recognizable `clsx` and configured `cn` patterns, including literal arrays and object keys.
- [x] Identify helper imports/bindings so an unrelated function named `cn` is not assumed safe.
- [x] Support common `cva` literal base/variant/default/compound definitions with explicit branch semantics, or report unsupported shapes precisely.
- [x] Specify supported Tailwind-merge wrapper behavior; do not assume pre-merge class bags prove the effective choice.
- [x] Handle combinations conservatively when a merge helper or dynamic branch prevents proving a semantic requirement.
- [x] Extract relevant literal JSX props and identify spreads that may override them.
- [x] Detect fragmented dynamic class construction such as `bg-${color}-500` and return an unresolved finding.
- [x] Treat dynamic props, values returned by arbitrary functions, and runtime object mutation as unknown unless a narrowly supported resolution proves them.
- [x] Mark unknown evidence with the design categories it could affect; use conservative attribution when specificity is impossible.

### Interpret Tailwind v4 syntax

- [ ] Write table-driven fixtures for v4 prefixes, responsive/state variants, arbitrary variants, important modifiers, and negative values.
- [x] Separate variant parsing from the base utility while preserving source context.
- [x] Distinguish arbitrary values, arbitrary CSS properties, variable references, and arbitrary selectors.
- [x] Recognize v4 variable shorthand and typed values; avoid treating every bracketed class as an unapproved literal.
- [x] Resolve ambiguous utility families, including typography versus color uses of `text-*`, from syntax and declared theme evidence.
- [x] Map color, typography, spacing/layout, and shape/effects utilities to their governed properties.
- [ ] Define supported layout/effect properties explicitly; category labels do not imply comprehensive CSS coverage.
- [ ] Normalize equivalent spellings only when equivalence is proven for the supported Tailwind version.
- [x] Preserve variant-specific/conditional facts so a required base class is not satisfied only by a hover or unrelated branch.
- [x] Handle Tailwind structural/custom utilities explicitly: identify unaffected classes, configured approved patterns, or unresolved evidence.
- [x] Detect custom utilities and `@apply` rules that could hide governed declarations; either resolve a supported static shape or report coverage failure.
- [x] Keep valid Tailwind utility detection separate from the allowed-policy check.

### Close relevant bypass paths

- [x] Extract static inline-style declarations affecting governed categories and attach JSX locations.
- [ ] Map CSS property names, shorthand expansion, and custom-property references where supported.
- [x] Track covered local stylesheets and CSS modules, including rules used by covered source.
- [x] Treat unsupported scoped styles, CSS-in-JS, remote styles, and dynamic style objects as unresolved when they may affect active categories.
- [x] Define how custom-property chains and fallback values are resolved, including cycles and missing definitions.
- [x] Avoid claiming CSS selector/cascade equivalence when only declared values can be checked.
- [x] Allow unrelated properties without blanket bans on every inline style or custom stylesheet.
- [x] Explain missing source coverage, unsupported imports, and excluded files in the scan summary.
- [x] Ensure a disabled design category does not cause its isolated unknowns to fail enforcement of unrelated categories.
- [x] Ensure disabling a reporting bucket cannot hide unknowns that affect an active category.

## Focused proof

- [x] Verify source locations against deliberately multiline/Unicode fixtures.
- [x] Verify an import alias is tracked correctly and a same-named unrelated component/helper is not conflated.
- [x] Verify finite branches are checked independently and unresolved interpolation is never treated as clean.
- [ ] Verify arbitrary variable references, arbitrary properties, and arbitrary variants receive different interpretations.
- [x] Verify a class merge or spread that changes a relevant value does not receive an unsound pass.
- [x] Verify parser failures, excluded inputs, and unsupported CSS mechanisms are visible.
- [x] Verify static inline/CSS violations cannot bypass an active category merely by avoiding Tailwind classes.
- [x] Run the analyzer on both project fixtures and capture their evidence/coverage reports.

## Completion gate

- [ ] Every supported construct yields stable traceable evidence; every relevant unsupported construct yields an honest coverage result.
- [x] No module evaluates arbitrary project code to obtain values.
- [x] Document supported syntax, parser/version constraints, finite-resolution limits, and known unsupported patterns for phase 04 and website documentation.
- [x] Report actual source coverage rather than a blanket claim that all UI drift is detectable.
