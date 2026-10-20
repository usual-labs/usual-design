# Usual Design: initial implementation plan

Status: local implementation and automated proof exist; the full plan is not complete and nothing has been published. See [implementation evidence](../../implementation/progress.md) and [user decisions / pending gates](../../handoffs/needs-armin.md).

Created: 2026-10-19. Source: the Usual Labs / Usual Design grilling session and its read-only documentation research.

## Goal and motivation

Usual Labs, at `usual.dev`, will house and distribute open-source developer tools. Its first tool suite is Usual Design: a project-owned design contract, a deterministic linter, an agent-assisted setup workflow, and a local visual onboarding wizard.

AI-native developers can already give their agents tokens and shared components, yet new code still drifts: arbitrary values appear, semantic roles are ignored, and existing components are bypassed. Instructions alone do not establish a reliable feedback loop. Usual Design makes explicit design decisions executable, producing failures that a developer or their existing coding agent can understand and repair quickly.

The initial audience is individuals and small-to-medium teams using AI heavily. Existing design systems can be imported; projects without one receive guided discovery and explicit choices. The first promise is enforceable consistency within declared coverage. Passing does not establish beauty, originality, accessibility, or complete visual equivalence.

The plan itself does not authorize execution. The later user instruction to implement it authorizes local implementation in this session. Deployment, public package/repository publication, outreach, and creative approval still require the separate actions and evidence documented in the handoff.

## Current execution evidence

The CLI, rule families, visual wizard, durable records, agent setup, optional local hooks, provisional website, and local package artifact are implemented. Checkmarks below refer only to matching local evidence; no phase is blanket-complete. The website workflow is proven against its actual source and draft policy in an isolated copy. Its real manifest remains inactive pending creative approval. Native-agent events/trust, browser review, remote CI, publication/deployment, and the five external projects are unperformed.

Unchecked items include both engineering gaps and gates requiring the user or an external environment. Read the phase notes and linked progress/handoff before resuming; fixture/API proof does not replace live-client or visual evidence.

## Agreed product decisions

| Area | Required first-release behavior |
| --- | --- |
| Stack | React, including Next.js, JavaScript/TypeScript, Tailwind v4. Tailwind v3 and other UI frameworks are outside initial support. |
| Checks | All three types ship: approved values, explicit semantic usage, and component usage. |
| Authority | A Usual-owned manifest is the lint policy. It configures approved variables/values, semantic rules, components, coverage, ignored paths, exceptions, and activation. Fields can be optional; defaults must be explicit. |
| AI | The user's existing coding agent performs discovery, proposes policy, and applies approved repairs. The CLI and wizard require no model API or account. |
| Wizard | A local web interface is part of the primary journey, not a future enhancement. It includes interactive specimens, usage/source evidence, conflict decisions, and repair selection. |
| Previews | Show validated token specimens and built-in controls. Link to an existing user-run preview where available. Do not automatically execute arbitrary project components/configuration. |
| Audit | Report six groups: colors, typography, spacing/layout, shape/effects, components, and coverage/unresolved cases. |
| Adoption | Full audit discovers work in every group. Enforcement checks only activated design categories. Skipped categories are entirely unchecked, including new violations, until resolved and activated. |
| Repair | The user selects and confirms a repair batch. Save an actionable plan for their agent and preserve deferred findings/decisions as project documentation. |
| Diagnostics | Provide precise locations, reasons, policy references, actionable guidance, human output, and structured output. |
| Coverage | Unverifiable uses affecting active categories fail explicitly. Invalid configuration and analysis failures cannot masquerade as a passing result. |
| Integrations | First-class local Codex and Claude Code setup, npm script, opt-in commit hooks, and a basic CI example, all using the same CLI. |
| Policy changes | Ordinary repair never authorizes broadening rules, exclusions, or activation. Design changes use explicit approval and visible Git diffs. |
| Licensing/privacy | CLI, schema, wizard, and skills use MIT. Local operation, no required account, and no telemetry in v1. |
| Website | Usual Labs homepage plus Usual Design installation, documentation, repository links, and a real demonstration at `usual.dev`. |
| Visual direction | Warm neutrals, strong typography, precise borders, one distinctive accent; review concrete visual work before treating it as approved. |
| Release evidence | Complete journey on the Usual website plus an independent React/Tailwind fixture with different conventions. |
| Distribution | Prepare public repository/package/docs/demo and seek five external projects completing onboarding, subject to separate publication and outreach approval. |

## Invariants every phase must preserve

1. Observed usage is evidence, not approval. Finding a token or component does not add it to the allowed set.
2. The manifest owns policy; Tailwind configuration and project source provide facts. Importing source definitions cannot silently widen policy.
3. Full audit and enforcement are different operations. There is no accepted-debt baseline or changed-lines-only substitute for category activation in v1.
4. Coverage is the sixth audit display group, not a global escape hatch. Associate unresolved evidence with affected design categories; it must block enforcement/activation if an affected category is active or being activated.
5. Inactive categories do not produce lint violations. Invalid manifests, unreadable required inputs, and inability to establish declared coverage remain operational errors. A run with no active categories must say so.
6. Activation requires a fresh, successful audit against the current files and policy. A stale wizard tab cannot activate a category after source changes.
7. Repair selections, deferred work, and policy decisions are persisted. Revalidate saved plans before applying them; stale line numbers are not authority to edit.
8. Discovery, linting, and the wizard do not execute project JavaScript, plugins, React components, arbitrary configuration, or model calls. Explicitly installed integration hooks execute the approved Usual CLI.
9. Parsing uncertainty is explicit. Never infer runtime values, silently skip broken files, or claim full CSS cascade/computed-style analysis.
10. Ordinary checks are read-only. Intentional writes validate paths, preserve unrelated files, use atomic updates, and reject conflicting/stale writes.
11. Instructions guide agents; hooks execute handlers; CI/review provides an independent gate. None is described as preventing all edits by an actor with repository write access.
12. Keep files focused, normally below 500 lines. Prefer existing platform/library behavior over speculative frameworks, plugin APIs, services, or provider abstractions.

## Complete user journey

1. Install the local tool and use the Usual skill in an existing coding agent.
2. Inventory supported source, tokens, components, class patterns, and unresolved evidence.
3. Propose a manifest; use the wizard to make intentional choices, including different legitimate radii or semantic variants.
4. Review the full categorized audit. Choose findings/groups to resolve now and document the rest.
5. Confirm a saved repair batch and give its short instruction to the existing agent.
6. The agent makes the selected application changes and reruns the audit without weakening policy.
7. Activate each resolved category after a fresh validation; keep other categories visibly inactive.
8. Run checks during ordinary development and through installed integrations. Fix code or deliberately approve a separate policy change.
9. Return later to documented work, refresh its evidence, complete repairs, and activate more categories.

## Planned implementation shape

These are concrete implementation defaults, not additional product promises. Verify dependency/version suitability in phase 01 and record justified changes locally.

- One TypeScript/Node CLI package containing the local wizard assets and reusable in-process analysis code; a private website workspace if needed. Avoid splitting every layer into a published package.
- A JSON manifest, provisionally `usual.design.json`, with a versioned JSON Schema and clear relative-path semantics.
- A project documentation folder, provisionally `docs/usual-design/`, holding decisions, audit summaries, deferred work, and repair plans. Keep transient generated/cache data separate and ignored.
- Syntax parsers for JS/TS/JSX and CSS, a finite static-value resolver, policy evaluation, diagnostics/reporting, and a small project-file persistence layer with clear responsibilities.
- A local HTTP server serving a bundled wizard. The wizard consumes the same audit/validation operations as the CLI; it does not implement a second linter.
- Provisional CLI surfaces: `init`, `audit`, `check`, `wizard`, `activate`, and `setup`. Final flag spelling and npm package names are determined before documenting/installing them. Initialization creates a draft; it does not claim to invent a verified design system.
- Existing agent skills and thin integration handlers call the CLI. No remote agent-control service, hosted model, database, login system, or daemon is required.

## Ordered phases and dependencies

| Phase | Outcome | Depends on |
| --- | --- | --- |
| [01 — Foundation](01-foundation.md) | Runnable package, explicit contracts, compatibility/proof fixtures | This overview |
| [02 — Manifest and discovery](02-manifest-and-discovery.md) | Validated project-owned policy and safe source inventory | 01 |
| [03 — Static analysis](03-static-analysis.md) | Traceable source evidence and honest coverage boundaries | 02 |
| [04 — Rules and CLI](04-rules-and-cli.md) | All three rule types and deterministic `check` | 03 |
| [05 — Audit and repair records](05-audit-and-repair-records.md) | Full audit, persistent decisions/plans, safe category activation | 04 |
| [06 — Visual wizard](06-visual-wizard.md) | Complete local visual onboarding and review journey | 05 |
| [07 — Agent skills and setup](07-agent-skills-and-setup.md) | Existing-agent discovery/repair workflows and safe installation | 05, 06 |
| [08 — Enforcement integrations](08-enforcement-integrations.md) | npm, local agent hooks, optional commit hooks, CI | 04, 07 |
| [09 — Website and documentation](09-website-and-documentation.md) | Usual Labs site, Usual Design docs, real dogfooding | 06–08 |
| [10 — Acceptance and release preparation](10-acceptance-and-release-preparation.md) | Verified artifact and reviewable release materials | 01–09 |
| [11 — Approved launch and pilots](11-approved-launch-and-pilots.md) | Authorized public release and evidence from external adoption | 10 plus explicit action-specific approval |

Implement in order by default. A design draft or test fixture can be prepared earlier where it reduces rework; do not mark downstream gates complete before dependencies are verified. Do not use a phase split to omit the wizard or any rule family from the initial release.

## Proof and reporting

- Use the smallest sufficient automated proof per change: parser/rule cases for source semantics; filesystem/integration cases for persistence; CLI subprocesses for exit/output contracts; API/component tests for the wizard; package smoke tests for the shipped artifact.
- Do not test in a browser unless explicitly instructed. Preparing a manual/browser acceptance script is allowed; executing it is a separate authorization. Report visual/browser behavior as unverified until it is actually exercised.
- Distinguish test fixtures, local agent execution, local hooks, CI configuration, a real remote CI run, deployed website, published package, and external adoption. One does not prove another.
- The website is a dogfood project, not the only oracle. The second fixture must use different approved values, component names, and semantic conventions.
- Performance is part of the feedback-loop goal. Benchmark representative fixtures, record environment and cold/warm results, and publish measured claims only. Do not add persistent caching or a watcher until evidence justifies it.
- Every phase checklist starts unchecked. Update items only with matching evidence. A prepared example or manual procedure is not an executed result.
- At each phase boundary report system changes, end-user changes, checks performed, unresolved limitations, and any commands/configuration needed to run, test, or deploy it.

## Out of scope for the initial release

- Tailwind v3, Vue/Svelte/other frameworks, arbitrary runtime interpretation, and universal visual equivalence detection.
- Judging beauty, originality, all accessibility requirements, or complete rendered CSS behavior.
- Automatically restyling an entire project without a selected repair plan, unattended policy broadening, and per-finding debt baselines.
- Hosted AI, accounts, telemetry, cloud source upload, remote agent control, arbitrary project-component execution, and a plugin marketplace.
- Publishing, sending outreach, or spending money merely because implementation is ready.

## Research evidence and cautions

Read-only official documentation research during the discussion established these constraints. Recheck current API details and versions at the phase that uses them; these links do not establish that any integration has been executed.

| Finding | Official source | Plan consequence |
| --- | --- | --- |
| Tailwind v4 differs materially from v3; `resolveConfig` was removed and utility/prefix syntax changed. | [Upgrade guide](https://tailwindcss.com/docs/upgrade-guide) | Support v4 explicitly, reject unsupported versions, avoid a v3-oriented adapter. |
| CSS `@theme` namespaces create utilities; ordinary CSS variables do not automatically do so. | [Theme variables](https://tailwindcss.com/docs/theme) | Separate theme discovery, CSS-variable resolution, and policy approval. |
| Numeric spacing utilities derive from a base spacing variable. | [Padding](https://tailwindcss.com/docs/padding) | Valid Tailwind syntax is not an approved spacing scale. |
| Tailwind expects complete class names; interpolated fragments are not statically discoverable. | [Source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files) | Resolve finite literal branches; report unresolved construction honestly. |
| Arbitrary values, properties, variants, and typed variables are different constructs. | [Custom styles](https://tailwindcss.com/docs/adding-custom-styles) | A blanket bracket ban or regex-only extraction is insufficient. |
| CSS can load JavaScript through directives such as `@plugin` and `@config`. | [Directives](https://tailwindcss.com/docs/functions-and-directives) | Do not compile arbitrary project CSS as a discovery/preview shortcut. |
| Rendering React calls component code, including server rendering. | [Rendering](https://react.dev/learn/render-and-commit), [static markup](https://react.dev/reference/react-dom/server/renderToStaticMarkup) | Use owned specimens and source references; do not promise safe arbitrary execution. |
| Node `vm` is not a security boundary. | [Node VM](https://nodejs.org/api/vm.html) | Do not use it as a project-code sandbox. |
| Codex has skills, project instructions, and local hooks with trust requirements. | [Skills](https://developers.openai.com/codex/skills), [AGENTS.md](https://developers.openai.com/codex/guides/agents-md), [hooks](https://learn.chatgpt.com/docs/hooks) | Verify installed-client compatibility and preserve trust review. |
| Claude Code has skills, project instructions, and local hooks subject to settings/trust. | [Skills](https://code.claude.com/docs/en/skills), [instructions](https://code.claude.com/docs/en/memory), [hooks](https://code.claude.com/docs/en/hooks) | Install additive, reviewed configuration and translate CLI output into the host protocol. |

## Plan completion checklist

- [x] Keep this overview consistent with approved product decisions and justified implementation changes.
- [ ] Complete phases 01–09 without silently dropping first-release behavior.
- [x] Record phase 10 evidence, including any unperformed browser/native-agent/remote checks.
- [ ] Prepare concrete release artifacts and obtain approval for the exact public actions required by phase 11.
- [x] Complete authorized phase 11 actions or report them as pending; never imply an unpublished artifact is public.
- [ ] Record external onboarding outcomes without inventing adoption or collecting source/identity data without permission.
