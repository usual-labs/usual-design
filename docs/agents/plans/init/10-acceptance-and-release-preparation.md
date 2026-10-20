# Phase 10 — End-to-end acceptance and release preparation

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: phases 01–09. Next: [approved launch and pilots](11-approved-launch-and-pilots.md).

The final clean dependency install, format/typechecks/builds, 130 core tests, 13 wizard model/SSR tests, full packed-executable workflow smoke, website audit, and production dependency audit passed. API acceptance covers tokenless explicit choices and later deferred-typography repair, activation, and new drift failure. The benchmark records small and synthetic 500-JSX fixture dimensions plus separate check/audit/native-handler process distributions; it does not substitute for a larger real-project benchmark. Progress records exact environment, artifact integrity, licenses, and evidence boundaries. Native clients, direct visual/browser evidence, remote CI, public release, and pilots remain unperformed.

## Outcome

Verify the complete initial release as a shipped artifact, not just as source modules. Produce an honest evidence report and concrete package/site/repository/demo materials ready for approval. Do not publish or send anything as part of this phase.

## Evidence levels

Keep these distinct: unit/fixture proof, CLI/API integration, installed-package proof, local native-agent behavior, native hook behavior, local commit hook, prepared CI configuration, executed remote CI, visual/browser validation, deployed website, published npm package, and external adoption.

Automated non-browser tests can prove many operations but do not prove the wizard's actual visual usability. Prepare the direct walkthrough and obtain explicit browser-test authorization or user-provided manual evidence before calling that part verified. If unavailable, report it as pending rather than inventing completion.

## Detailed tasks

### Reconcile scope and evidence

- [x] Compare implementation against every agreed decision in the overview.
- [x] Confirm all three rule families and the visual wizard exist in the release artifact.
- [x] Confirm Tailwind v4 compatibility is explicit and unsupported versions produce honest outcomes.
- [x] Confirm the manifest owns policy and discovered additions never silently broaden it.
- [x] Confirm skipped categories remain entirely unchecked while the full audit still records their work.
- [x] Confirm relevant unknown coverage blocks active categories and activation.
- [x] Confirm ordinary checks are read-only and ordinary repairs do not alter protected policy.
- [x] List supported properties/helper forms/semantic selectors/component mappings and known omissions in user-facing docs.
- [x] Check that no speculative service, database, hosted AI requirement, telemetry, or baseline mechanism entered the release.

### Execute the complete acceptance journeys

- [ ] Run installation, discovery, manifest proposal, visual policy review, and audit on the Usual website.
- [ ] Select a repair batch, confirm its plan, and hand it to a supported existing agent.
- [x] Verify actual code changes, re-audit, and activate resolved categories.
- [x] Skip typography and verify both existing and newly introduced typography findings are absent from enforcement but visible in full audit.
- [x] Resolve typography later from the durable plan, re-audit, activate it, and verify a new typography violation fails.
- [x] Introduce one approved-value violation, one semantic misuse, and one component bypass; verify useful failures for each.
- [ ] Verify the agent repairs those failures without changing policy, exclusions, or activation.
- [ ] Run the same check through npm, local agent integrations, commit hooks, and CI command configuration.
- [x] Repeat core policy/audit/repair/activation proof on the independent fixture with genuinely different conventions.
- [x] Exercise the no-established-design-system journey using conflicting observed values and explicit user choices.
- [x] Test a legitimate multi-radius or multi-variant design to show consistency does not mean uniformity.
- [x] Verify durable documents survive restart and can be used without prior chat history.
- [x] Record exact tool/runtime/client versions and evidence paths for each executed journey.

### Verify failure and trust boundaries

- [x] Exercise invalid manifests, unsupported schema/version, parser errors, missing imports, and corrupted records.
- [x] Exercise dynamic classes, relevant unknown props/spreads, inline/CSS bypasses, and custom executable Tailwind inputs.
- [x] Verify no config/plugin/component execution occurs during discovery, linting, or preview generation.
- [x] Exercise stale audit activation, competing writes, interrupted saves, and safe recovery.
- [x] Exercise path traversal/symlink escapes and local-server cross-origin mutation attempts.
- [x] Exercise hostile source snippets and preview values without executing them.
- [x] Verify skill/hook setup preserves existing instructions, unrelated hooks, and user-edited managed content.
- [x] Exercise hook no-progress/continuation limits and keep unresolved failure visible.
- [x] Verify reports/package contents do not leak credentials, local session tokens, private source, or personal absolute paths.
- [x] Review narrowly scoped exception handling so exceptions cannot accidentally suppress unrelated active rules.

### Measure the feedback loop

- [ ] Define a reproducible small fixture and representative larger React/Tailwind fixture with recorded file/LOC counts.
- [x] Measure cold startup/full scan, repeated full scan, audit generation, and hook overhead separately.
- [x] Record hardware, OS, runtime, dependency versions, active policy, and repeated-run distribution.
- [x] Use provisional engineering targets of roughly one second for a representative small-project check and five seconds for a 500-source-file cold check; document measured results rather than promise universal timings.
- [ ] Investigate material misses before optimizing; identify parsing, traversal, rule, or startup ownership.
- [ ] Apply only evidence-backed optimization and prove full-scope semantic equivalence afterward.
- [x] Add persistent caching, watchers, or parallel execution only if necessary and justified by measured benefit and invalidation correctness.
- [x] Keep performance claims in docs/demo aligned with recorded measurements and environment.

### Validate the distributable artifact

- [x] Build from a clean dependency install using the committed lockfile.
- [x] Pack locally and inspect the exact tarball file list and size.
- [x] Verify CLI executable permissions, runtime imports, JSON schema, wizard assets, and skill assets are included.
- [x] Install the packed artifact into a clean temporary project and run help, init, audit, check, wizard API, and setup workflows.
- [x] Verify no workspace-relative or unpublished internal-package dependency is required at runtime.
- [x] Test supported path/OS behavior on claimed platforms, or narrow the documented support claim to actual evidence.
- [x] Check package license metadata and third-party asset/dependency license compatibility.
- [x] Check repository/package/docs names, links, command names, and version consistency.
- [x] Prepare a versioned release note explaining behavior, supported scope, known limitations, and upgrade/configuration requirements.
- [x] Inspect the publish payload for build caches, credentials, test-only private data, and unnecessary source artifacts.

### Prepare the demonstration and approval bundle

- [x] Create a reproducible demo script: introduce drift, show CLI/hook feedback, apply approved repair, show passing evidence.
- [x] Include the wizard's visual decision and activation steps, not only terminal output.
- [x] Use owned fixtures/website content and avoid exposing private project data.
- [ ] Produce media only through an authorized workflow; browser interaction/recording still needs explicit instruction.
- [x] Prepare repository content, npm artifact, website deployment settings, release notes, and outreach drafts for review.
- [x] Create an evidence matrix marking each gate passed, failed, unperformed, or not applicable with a reason.
- [x] Provide a concise implementation report covering system behavior, end-user behavior, run/test commands, configuration, deployment steps, and unresolved risks.
- [x] State explicitly whether any environment variables, migrations, or external services are required; do not invent them for a local/static architecture.
- [ ] Present the exact public actions and artifacts for authorization only after they are concrete and reviewable.

## Completion gate

- [x] All required automated/local artifact checks pass or have a specific disclosed blocker.
- [x] End-to-end evidence covers the website and independent fixture, with no conflation of prepared and executed integrations.
- [x] Direct visual/browser/native-agent gaps are explicitly pending if not exercised; do not label the entire release verified prematurely.
- [x] Release materials are ready for review without having been published.
- [x] Record which phase 11 actions are authorized, which still need approval, and the exact artifact/version they concern.
