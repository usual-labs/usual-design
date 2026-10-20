# Usual Design implementation evidence

Latest onboarding update (2026-10-20): see [agent-led onboarding 0.2](onboarding-0.2.md)
for the dedicated skill, proposal compiler, guided preview, and current local
proof. The phase evidence below is the original implementation snapshot; later
repository/npm release receipts supersede its historical unpublished status.

Updated: 2026-10-20. Candidate: `@usual/design-lint@0.1.0`; executable: `usual-design`.

## Current outcome

A runnable local system implements the core of phases 01–10: deterministic source analysis and all three rule families, project-owned policy, full audit, approved repair records, gated category activation, a local visual wizard, Codex/Claude setup and hook adapters, the provisional website, and distributable package preparation. Phase 11 has preparation only. The entire plan is **not complete**: browser/creative acceptance, real native-client lifecycle/trust, remote CI, public release, and external adoption remain unperformed.

The implementation introduces no hosted model, account, telemetry, database, application environment variable, or migration. Project source and policy stay local. Nothing has been published, deployed, pushed, or sent externally.

Items needing Armin are separated in [needs-armin](../handoffs/needs-armin.md). Engineering boundaries and remaining proof are in [remaining-engineering](remaining-engineering.md). The original ordered [plan](../plans/init/00-overview.md) retains granular checkboxes: **519 of 631 tasks checked, 112 open**. This count includes phase 11 publication/pilot tasks; it is not a release-readiness percentage. A phase containing unchecked gates is not blanket-complete.

## Phase evidence matrix

| Phase | Local system and end-user outcome | Evidence | Gate status |
| --- | --- | --- | --- |
| 01 Foundation | One focused TypeScript/Node ESM package; bundled React wizard; static website; two independent design fixtures; MIT candidate and notices. | Package scripts, lockfile, source/CLI tests, builds and clean install. | Local passed; public legal identity and actual remote CI availability pending. |
| 02 Manifest/discovery | Strict JSON/schema, syntax locations/version guidance, deeply frozen snapshots, explicit defaults, safe bounded traversal, CSS facts, stable exclusions, no token autoapproval. | `test/config.test.ts`, `test/discovery.test.ts`, initialization and root/symlink tests. | Supported local boundary passed. Theme namespace resets and unresolvable compiler/CSS behavior fail coverage. |
| 03 Static analysis | Finite JSX branches/helpers, canonical static cn/CVA patterns, import aliases, proven component reexports, inline/CSS declarations, UTF-16 spans and bounded context. | `test/helpers.test.ts`, `test/identity.test.ts`, `test/diagnostics.test.ts`, core cases. | Local passed for documented syntax. Arbitrary runtime interpretation is unsupported and reported. |
| 04 Rules/CLI | Approved values, semantic element/component/prop/class-context rules, native component and import restrictions; deterministic human/JSON outputs and exits. | Core, semantic identity/context, CLI tests and installed executable. | Local passed. Passing establishes the declared active source contract only. |
| 05 Records | Six audit groups, explicit selected/deferred batches, prepared policy/activation decisions, current-snapshot `verify-plan`, stale writes rejected, edited generated notes preserved. | Record-validation, persistence, verify-plan, workflow tests. | Local passed. Per-file safe writes are not a repository-wide transaction. |
| 06 Visual wizard | Existing-system and tokenless discovery; specimens; actual component catalog; unsaved draft-impact preview; explicit policy review; audit selection, copy handoff, fresh recheck and activation. | Wizard model/SSR tests, actual local HTTP API journeys, bundled asset delivery. | API/component passed; rendered interaction/accessibility/visual acceptance unperformed because browser testing is prohibited without instruction. |
| 07 Agent skills/setup | Existing agent discovers/proposes/repairs; separate policy changes; additive skills/instructions; exact custom-config propagation and ownership conflicts. | Setup preservation/idempotence tests and packaged skill assets. | Generated integration passed; real native-client versions, trust and repair turn unperformed. |
| 08 Enforcement | npm script, opt-in Codex/Claude protocol adapters, bounded Stop continuation, optional real Git commit hook, same CLI in CI examples. | Real checker/handler subprocesses, temporary Git commit pass/fail, spaces/metacharacters/config-path tests. | Local handlers and commit hook passed; native lifecycle and remote CI unperformed. |
| 09 Website/docs | Labs/product/docs pages, own token CSS and shared controls, authored draft policy, source dogfood loop in isolated copy, install/demo/compatibility docs. | Website production build; source audit; actual site-copy API repair/activation test. | Source/build passed; creative approval, real site activation, browser review, hosting and deployment pending. |
| 10 Acceptance/release preparation | Clean install/build/tests; local tarball installation; executable/schema/assets/skills proof; synthetic performance samples; license metadata/notices and launch drafts. | Commands and retained artifacts below. | Local candidate verified within stated scope. Exact public release destinations and remaining acceptance gates pending. |
| 11 Launch/pilots | Announcement and invitation drafts; reviewable package and static site. | `docs/launch/` and local artifact. | Prepared only. No public launch, outreach, remote run, or external pilot is claimed. |

## Behavioral proof

- Atlas and Ember use independent values/components/semantics. A wrong color, missing semantic class, native component bypass, forbidden import, or relevant unresolved expression fails without changing policy.
- Actual website source is audited clean under its provisional draft. An isolated copy passes audit → introduce all three rule failures → selected approval → application repair → activation → subsequent drift failure. The actual `site/usual.design.json` remains entirely inactive pending creative review.
- A project with no tokens exposes conflicting observed values. A proposed policy can be previewed through the shared analyzer without writing policy, audits, decisions, plans, or activation. Explicit choices then reach a saved batch, real source repair and gated activation.
- Typography can remain inactive while other clean categories enforce. New typography drift is unchecked by lint and remains visible in a full audit. Deferred records survive restart; the workflow retains original approvals.
- Unknown aliases, dynamic class context, incomplete coverage, missing imports, invalid policy, and parser failures cannot masquerade as a clean active check. Namespace resets are conservative coverage warnings, not fabricated concrete tokens.
- Source or policy changes reject stale selection/activation/repair authority. A concurrent user edit during fsync survives. Receipt preparation failure leaves policy unchanged; a prepared receipt alone does not establish a committed change.
- Setup preserves unrelated instructions, scripts, hooks, and skills. Shell metacharacters in configuration paths remain data. Real temporary Git commit hooks distinguish pass/fail; partially staged checks still inspect the working tree, as documented.

## Environment and retained evidence

Local environment: macOS Darwin 25.5.0 arm64, Apple M4 Pro, Node `22.23.2`, npm `10.9.8`. Package runtime declares Node `>=22.12.0`. Tested shell integration is POSIX/macOS. Linux CI is configured but has not run remotely; Windows hook behavior is unverified.

Transient machine output is ignored under `.usual-design/artifacts/`:

- `tests-final.txt`: latest complete automated suite output.
- `package-smoke.json` and `usual-design-lint-0.1.0.tgz`: exact local packed candidate, integrity and installed-artifact proof.
- `benchmark.json`: fixture dimensions, hardware/runtime/dependencies and separate process measurements.
- `runtime-dependencies.json`: runtime license inventory used for `THIRD_PARTY_NOTICES.md`.

Final aggregate run passed after the final source changes:

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts` | Clean lockfile install passed; npm reported zero vulnerabilities. |
| `npm run format:check` | Passed. |
| `npm run typecheck` | Core, wizard and site passed. |
| `npm run build` | CLI/types and both Vite production bundles passed. |
| `npm test` | **143 passed**, 0 failed, 0 skipped: 130 core/CLI/API/persistence cases plus 13 wizard model/SSR cases. |
| Installed tarball smoke | Passed executable version/help/usage-error, init preview/write, validation, saved audit, inactive check, independent check, setup preview/write/idempotence, npm script, wizard HTML/assets/API. |
| Site full audit | 10 source files; 0 findings; 0 operational errors. All five actual categories remain inactive. |
| Production dependency audit | Zero vulnerabilities. |
| Local Markdown links | 29 Markdown files checked; no missing local links before the final checklist-only edits. |

Packed artifact: `.usual-design/artifacts/usual-design-lint-0.1.0.tgz`; 77 files, 653,678 bytes unpacked. Integrity:

```text
sha512-SLxvs7qbE7slab7IiHGj94S8wfcDYOYO29mY5BNVRPmtsWTBoVozBqoWnTnSZxbOthOwByMrD5bOsnt8BhrX2w==
```

The benchmark records one first sample and five repeated samples for every command, each in a new Node process. It does not flush OS caches. Synthetic dimensions and measured wall times:

| Fixture | JS/TS source / covered files | JS/TS source / covered LOC | Check first / repeat median | Saved-audit median | Codex / Claude handler medians |
| --- | --- | --- | --- | --- | --- |
| ember-small | 2 / 3 | 3 / 5 | 159.4 / 162.3 ms | 171.4 ms | 162.9 / 160.7 ms |
| synthetic-500-jsx | 500 / 501 | 501 / 503 | 378.8 / 377.2 ms | 388.4 ms | 378 / 383.9 ms |

Hook timings invoke generated protocol handlers directly; they do not include or establish a real native agent client. These tiny synthetic sources are not a representative large-product guarantee. No persistent cache, watcher, daemon or speculative optimization was added. Retained files establish local execution only; they are not remote CI, deployed, browser or native-client evidence.

## Run, test, and inspect

From the `usual-design` folder:

```sh
npm ci
npm run format:check
npm run typecheck
npm run build
npm test
npm run verify:package
npm run benchmark
npm run audit:site
node dist/cli.js wizard --root site
npm run dev:site
```

The wizard binds loopback and prints a private session URL; it never auto-opens a browser. The site dev server is for manual preview. Run the CLI with `--root` to target another local React/Tailwind v4 project. Setup previews by default; `--write` applies only reviewed changes. Install the candidate tarball locally before applying integrations to another project so hooks resolve a pinned local executable.

## Deployment and next handoff

The package is an unpublished local candidate. The website output is `dist/site`; the wizard bundle is included in the package. Neither requires a database, migration, model key or application environment variable. Hosting/DNS/repository/npm ownership has not been invented. Finalize the approved destinations, metadata/crawl settings, exact release artifact and rollback steps in the separate handoff before any public action.

No browser was launched. No actual Codex/Claude trust was granted. No contacts, posts, accounts, spending, or recurring automation were introduced.
