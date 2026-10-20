# Phase 01 — Repository, runtime, and proof foundation

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [overview](00-overview.md). Next: [manifest and discovery](02-manifest-and-discovery.md).

Local package, ESM CLI, TypeScript build, two independent fixtures, and packaged wizard/skill assets exist. Retained CLI tests cover help/version, usage exit 2, inactive draft initialization, Next-style app inventory, and no-write behavior. The final clean install/typecheck/build and 143 automated tests passed on macOS/Node 22.23.2/npm 10.9.8; the progress record carries exact evidence. Repository publication/naming access, legal holder confirmation, and real remote gates remain open.

## Outcome

Create the smallest runnable structure that can own the complete local tool and website. Establish executable contracts and independent fixtures before building policy evaluation. The workspace was empty at planning time except for the project directory; re-inspect it before implementation rather than assuming that remains true.

## Ownership and implementation approach

Use one TypeScript/Node package for the CLI, analysis modules, bundled wizard, and skill assets. Use a private workspace for the website if separation is useful. Internal modules should follow behavior ownership—configuration, source analysis, rules, reporting, local server—not a generic plugin/provider framework.

Use existing parsing and schema-validation dependencies where they reduce correctness risk. Candidate choices are a maintained JS/TS/JSX parser, PostCSS for CSS syntax, and a JSON Schema validator. Select exact packages after checking current support and footprint. Do not invent a JavaScript parser or execute source to avoid parsing it.

## Detailed tasks

### Inspect and establish the project

- [x] Read current repository/ancestor instructions and inspect all existing files and Git state.
- [x] Preserve unrelated changes and revise the planned layout if real structure has appeared.
- [x] Confirm the project root is `usual-design` under the current Usual workspace.
- [x] Confirm this implementation session authorizes code changes; planning alone is not that authorization.
- [x] Decide whether an existing Git repository owns the project before creating repository metadata; do not create a nested repository accidentally.
- [ ] Record the chosen Node runtime range using maintained versions and actual CI availability.
- [x] Choose one package manager, pin it where appropriate, and create one authoritative lockfile.
- [x] Check intended npm package/CLI names before relying on them in generated files; availability is not permission to publish.
- [x] Create package metadata with MIT licensing and accurate unpublished/private workspace settings.
- [ ] Add the MIT license using the correct holder details when known; do not invent legal ownership.
- [x] Add minimal ignore rules for dependencies, build output, caches, and local wizard state, preserving durable audit documents.

### Define module and executable boundaries

- [x] Create CLI, configuration, source-analysis, rules, reporting, project-records, and wizard ownership boundaries only as implementation begins to use them.
- [x] Reserve a private website workspace without creating unrelated starter features.
- [x] Configure strict TypeScript checking and a build that emits runnable Node code and bundled assets.
- [x] Choose ESM/CommonJS behavior deliberately and test the package entry point under the selected runtime.
- [x] Create a CLI entry point with version/help and coherent usage errors.
- [x] Define the conventional exit contract: success, policy/coverage failure, and configuration/operational failure are distinguishable.
- [ ] Define cancellation behavior and keep diagnostic output separate from protocol JSON on stdout.
- [x] Establish root-relative path handling and deterministic output ordering shared by later commands.
- [ ] Create one immutable project/run context rather than reading global process state inside every rule.
- [x] Document that normal checks do not write project files or execute project code.
- [x] Ensure the published package can carry wizard and skill assets without requiring repository-source paths.

### Establish compatibility and fixture contracts

- [x] Create a supported React/Tailwind v4 fixture with approved tokens, shared components, and deliberate violations.
- [x] Create a second fixture with different tokens, component names, semantic conventions, and file layout.
- [x] Include JS, TS, JSX, and TSX source cases, plus a representative Next.js layout without requiring a running app.
- [x] Include stylesheet/token files needed to demonstrate source inventory and category coverage.
- [x] Keep fixtures small and explain what each fixture proves; avoid copying a large application.
- [x] Record unsupported-version behavior for Tailwind v3 and missing/ambiguous version metadata.
- [x] Write the initial supported-syntax matrix that phases 02–04 will complete.
- [x] Define canonical locations for fixture expectations and CLI integration tests.
- [ ] Define provisional human and machine diagnostic examples before implementing every rule.
- [x] Define which configuration/schema versions the first package will accept and how unknown versions fail.

### Set up focused development proof

- [x] Choose a test runner that can exercise source analysis, temporary project directories, and CLI subprocesses.
- [x] Add typecheck, focused test, build, and package-inspection commands.
- [x] Use lint/format tooling already present if any; otherwise add only what is needed for consistent maintainable implementation.
- [x] Add a minimal CLI invocation test that checks help, version, and invalid-command behavior.
- [x] Verify the build uses only declared dependencies and includes required runtime assets.
- [x] Record local OS/runtime/package-manager versions alongside the initial proof.
- [x] Start an evidence log for implementation decisions and phase completion; keep it separate from this unchanged planning baseline if convenient.
- [x] Record any dependency-specific limitations that affect security, coverage, packaging, or supported runtimes.

## Acceptance and handoff

- [x] A fresh install, typecheck, test, and build succeed using documented commands.
- [x] The CLI runs from built output and reports usage failures without crashing or emitting fake lint results.
- [x] Both fixtures exist and represent different design systems.
- [x] Package boundaries remain small and justified; no model service, database, plugin marketplace, or speculative framework was introduced.
- [x] Report the runnable commands, runtime requirements, structural decisions, and remaining unimplemented behavior.

No browser testing is needed for this phase. Do not represent a CLI scaffold as a functioning linter.
