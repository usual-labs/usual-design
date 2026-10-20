# Compatibility and coverage

This document describes the first-release target and interpretation of results. The implementation’s fixtures and CLI output remain the evidence for a particular build.

## Supported starting point

| Area               | Initial boundary                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Runtime            | Node.js 22.12 or newer, npm package and source builds.                                                  |
| Application syntax | JavaScript, TypeScript, JSX, TSX; React and source-compatible Next.js layouts.                          |
| Tailwind           | Version 4. Detect older, missing, or ambiguous version metadata; never treat it as verified v4 support. |
| Configuration      | `usual.design.json` schema version 1; project-relative coverage and token paths.                        |
| Tokens             | CSS token declarations, including Tailwind v4 `@theme` custom properties.                               |
| Rule types         | Approved values; explicit semantic element/component/prop rules; native-to-shared-component rules.      |
| Model integration  | Existing agent runs the workflow. The deterministic checker calls no model.                             |
| Visual preview     | Built-in specimens and source references; an existing preview may be linked.                            |

No browser, server render, screenshot, or runtime application inspection happens during a normal check. There is no assertion that configured rules prove beauty, usability, accessibility, or runtime behavior.

## Static source behavior

Literal JSX classes and supported common class-helper patterns are the principal analysis surface. Static branches can contribute alternative class sets; every supported alternative must obey active policy. Import identity matters for component semantics. A similarly named local function is not automatically the approved component.

Dynamic class construction such as `` `bg-${tone}-500` `` cannot be assumed safe from a few observed values. Unknown expressions, unsupported helper behavior, spread props affecting a target, inline styles, or custom CSS paths must produce explicit coverage findings when they prevent verification of active categories. Replace them with statically analyzable alternatives or use an explicit narrow exception with a reason. Discovery-only audits can retain unresolved cases while decisions are pending.

Tailwind variants must not hide a forbidden base utility. A responsive or hover form of a forbidden color still needs evaluation. Approved utility classes do not grant general permission for arbitrary raw CSS values. Utility detection also does not prove that every custom class is a recognized Tailwind utility; the tool must report its configured analysis boundary honestly.

The exact supported helper/AST cases are captured in the tests for each build. Avoid assuming arbitrary third-party helper, CSS preprocessor, macro, CSS-in-JS, external import, or generated-code support. The checker parses source rather than executing it to discover values.

## Coverage and activation

- `audit` examines all five design categories and groups unknown analysis separately.
- `check` enforces only `active` categories. Inactive categories are entirely unchecked, including new violations.
- Coverage affecting an active category fails the check unless narrowly and explicitly excepted.
- Skipped categories remain visible in saved project records. They are not an accepted-debt baseline for active categories.
- Include/ignore and exception changes are design-policy changes. A repair agent must not silently use them to pass.

Files outside declared coverage cannot be claimed as checked. Ignoring generated/vendor code can be appropriate; excluding ordinary application paths to hide findings defeats the contract.

Discovery reports sorted exclusion boundaries with reasons `standard`, `configured`, and `outside-include`. Standard skipped directories include `node_modules`, `dist`, `.git`, `.usual-design`, `.next`, `.nuxt`, `.output`, `.svelte-kit`, `.turbo`, `.vercel`, `.vite`, and `.parcel-cache`; declaration files and `docs/usual-design` records are also excluded. Skipped dependency/build directories are reported at their boundary without enumerating their contents. Explicit token sources and local CSS imports can still appear in the analyzed file list; a skipped traversal boundary does not hide those explicit reads.

Discovery limits each input to 2 MB, the complete covered/token/CSS-import graph to 10,000 files, and directory traversal to 50,000 entries and 64 levels. Exclude unrelated generated trees when these bounds are exceeded. CSS import cycles are visited once. Tailwind wildcard namespace resets such as `@theme { --color-*: initial; }` are reported as unresolved style coverage, rather than fabricated concrete token definitions; current warnings conservatively affect active style categories. Newly observed token definitions never expand the manifest’s approved policy.

## Operating boundaries

Checks are read-only. Write operations such as manifest initialization, saving audits, repair selection, decisions, category activation, and integration setup are explicit. The local wizard is a loopback development interface. It does not import arbitrary project components or execute project configuration. Keep project source in the target directory; do not point the tool at a path whose content you are not authorized to inspect.

First-class agent configuration is for local Codex and Claude Code. Agent trust settings and hook capabilities vary by version. Validate actual event execution locally; configuration presence alone is not proof. Human-readable instructions remain available for other agents.

Commit hooks and working-tree checks are not equivalent to testing the Git index when files are partially staged. CI proves its own committed checkout with its own installed tool version. Local passing results are not CI evidence, deployment evidence, or browser evidence.

## Known review gates

The website’s visual direction is provisional. The repository and `@usualui/lint@0.1.0` package are public. Website deployment, actual agent lifecycle behavior, visual/browser review, and external pilot adoption still require their own recorded evidence. See the implementation handoff and [demonstration guide](demo.md).

## Concrete static support

- JSX literal classes; finite conditional/logical alternatives; lexical primitive `const` bindings; imported `clsx`/`classnames` forms; explicit dynamic/unknown coverage. Mutable referenced arrays/objects are not assumed immutable.
- Direct supported `tailwind-merge` calls and recognized pure `cn` wrappers use the tool's own helper implementation on decoded static data. Unsupported wrappers or dynamic inputs stay unknown.
- Literal `cva` definitions with literal selections/defaults and compound variants are analyzed through the tool's installed helper implementation. Dynamic selections and mutable configurations remain coverage findings.
- Local imports must be inside analyzed coverage. Basic JSONC `tsconfig`/`jsconfig` `baseUrl`/`paths` aliases are recognized for coverage; compiler-config inheritance is not resolved. Canonical local helper-wrapper recognition supports relative imports and these explicit local path aliases.
- Semantic component targets use declared import/export identity and literal matching props. Covered explicit named/default re-export chains, static local aliases, JSONC aliases, and unambiguous star reexports are resolved where provable. Cycles, mutable/dynamic aliases, ambiguous stars, and arbitrary runtime composition remain unverified.
- A variable approval permits a direct variable reference, not gradients, arithmetic, or fallback literals that happen to mention that variable. Approve such composite classes/values explicitly if intentional.
- Current property families cover colors, typography, configured spacing/layout, and supported shape/effect declarations. This is source-contract checking, not a full browser cascade model.

Prepared activation/policy decision records carry the proposed resulting manifest hash. They are not commit receipts: compare that hash with the actual manifest before claiming activation succeeded. A later failed write can leave a prepared decision behind safely.

## Unconstrained utility families

The initial generic value rules govern recognized color, typography, spacing/layout, and shape/effect families. They do not govern every Tailwind property. Known utility families such as cursor/pointer interaction, selection, overflow, stacking (`z-*`), transitions/timing, whitespace, object fitting, and aspect ratio currently pass through without a generic value policy. Explicit semantic `forbidClasses` rules can still constrain them on a declared target. Other unrecognized candidates produce coverage findings. Source scope and this property matrix are separate limits; a passing result is not a complete rendered-style assessment.

The visual inventory also reports observed ad-hoc class/declaration values when no token system exists. Unresolved named utilities remain source representations; the wizard does not invent computed values. Selecting an observation adds it only to an unsaved draft for explicit policy review.

## Platform evidence

Local implementation and packed-executable checks were run on macOS Darwin 25.5.0 arm64 with Node 22.23.2 and npm 10.9.8. POSIX shell quoting and temporary Git hooks were exercised there, including spaces and shell metacharacters in manifest paths. Linux GitHub Actions checks and the publishing dry run passed for source revision `76da0d3`; the published archive matched that verified candidate. Windows shell/native hook behavior is unverified; this candidate does not claim tested Windows support.

Diagnostic spans are zero-based, half-open UTF-16 offsets, matching JavaScript/parser indexing. Source context is bounded and may contain project source; review JSON before sharing it externally. Semantic IDs survive unrelated line shifts and distinguish repeated evidence by occurrence. Inserting/removing indistinguishable earlier occurrences can change associations, so IDs and old line numbers never replace a current snapshot check.
