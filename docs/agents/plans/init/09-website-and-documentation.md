# Phase 09 — Usual Labs website, Usual Design docs, and dogfooding

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [wizard](06-visual-wizard.md), [agent setup](07-agent-skills-and-setup.md), and [integrations](08-enforcement-integrations.md). Next: [acceptance and release preparation](10-acceptance-and-release-preparation.md).

A provisional static React/Tailwind site, source-build docs, proposed inactive manifest, and saved full audit exist. test/site-dogfood.test.ts exercises actual website source in an isolated copy through audit, selected persisted repairs, source repairs, activation, and controlled regressions. The real site remains inactive; creative approval, browser review, public destinations, hosting, and deployment remain pending.

## Outcome

Create the initial public-facing Usual Labs experience centered on its first useful tool. Make Usual Design understandable, installable, and reviewable, and use the website as a real project for the complete onboarding/enforcement journey. Prepare deployment artifacts without publishing until authorized.

## Product and visual direction

Usual Labs is an umbrella for open-source tools; the initial site does not need a fabricated catalog. Usual Design gets a clear product page, documentation, and a demonstration of a real failure/repair loop.

Use warm neutral surfaces, strong typography, precise borders, and one distinctive accent. Lead with concrete code, diagnostics, and usable examples. Make a reviewable visual proposal before treating specific colors/type/layout as approved. A clean token system is necessary but is not itself proof of visual quality.

## Detailed tasks

### Establish site scope and information architecture

- [x] Define the Usual Labs homepage and the Usual Design product/documentation paths.
- [x] Write concise positioning for the audience, problem, deterministic promise, and supported stack.
- [x] Explain what the tool enforces and what passing does not prove.
- [x] Provide a primary installation/onboarding path and clear repository/package links once those destinations exist.
- [x] Avoid fake products, fabricated adoption numbers, testimonials, or claims of published integrations before evidence exists.
- [x] Decide a small static-friendly React/Tailwind v4 site structure; add server infrastructure only if a concrete requirement needs it.
- [x] Keep the website private/unpublished during preparation and separate its release commands from tool validation.

### Create and review the visual system

- [x] Produce a concrete visual proposal for homepage, product page, documentation, and diagnostic example.
- [x] Define color, typography, spacing, radius, border, and effect tokens with intentional semantic roles.
- [x] Choose a distinctive accent and accessible foreground/background pairs; document the rationale.
- [x] Choose appropriately licensed typography and document asset licenses.
- [x] Define shared Button, link, code block, callout, navigation, and layout components as actually needed.
- [x] Establish intentional variants rather than forcing all components into one appearance.
- [ ] Review the concrete direction with the user before marking creative choices approved.
- [x] Preserve an explicit provisional state if implementation proceeds before creative review is complete.
- [ ] Reuse approved visual primitives between website and wizard where it lowers maintenance without coupling their runtimes.

### Build useful pages and examples

- [x] Implement the Labs homepage with Usual Design as its first tool.
- [x] Implement a product page showing a violation, an actionable diagnostic, and the corrected result.
- [x] Explain the complete setup -> wizard -> selected repairs -> activation -> check workflow.
- [x] Show that skipped categories stay unchecked and that the audit still documents them.
- [x] Add a concise local-first/privacy explanation consistent with actual implementation.
- [x] Make all example code, commands, manifest fields, and diagnostics match the shipped interface.
- [x] Use recorded fixture output or clearly labeled illustrative content; do not manufacture benchmark or adoption claims.
- [x] Build readable responsive navigation, code blocks, focus states, and accessible page structure.
- [ ] Add appropriate page titles, descriptions, canonical URLs, sitemap/robots behavior, social metadata, and favicon assets.
- [x] Keep preview environments from being mistaken for the production domain.
- [x] Avoid analytics, forms, trackers, or third-party services not required by the agreed initial experience.

### Write the complete documentation set

- [x] Document installation, runtime support, Tailwind v4 compatibility, and known unsupported versions.
- [x] Provide quickstarts for an existing design system and a project that needs guided decisions.
- [x] Document the manifest schema, defaults, explicit coverage, ignored paths, rule IDs, and exceptions.
- [x] Give working examples for approved-value, semantic, and component rules.
- [x] Explain supported literal/helper syntax, dynamic-class limitations, inline/CSS handling, and coverage failures.
- [x] Explain all six audit groups and why unknown coverage cannot be ignored for an active design category.
- [x] Document durable project records, deferred work, repair selection, freshness, and category activation.
- [x] Document Codex and Claude setup, native trust limitations, and the manual portable workflow.
- [x] Document npm, commit-hook, and CI setup, including partial-staging and remote-CI limitations.
- [x] Document policy-change review and the prohibition on ordinary repair weakening policy.
- [x] Document preview boundaries: specimens/source links, no automatic project-component execution.
- [x] Document operational errors, exit codes, JSON output, troubleshooting, and clean removal of tool-owned setup.
- [x] Add contribution guidance, issue templates focused on reproducible evidence, and a small support/compatibility statement.
- [x] Ensure public documentation never includes local absolute user paths, secrets, or private pilot source.

### Dogfood the real website

- [x] Run discovery against the website and generate its proposed manifest through the agent workflow.
- [ ] Review tokens/components/semantics in the wizard and record design decisions.
- [x] Produce a full audit and document any deferred categories.
- [x] Select and execute a repair batch without broadening policy.
- [x] Re-audit and activate resolved categories using the actual activation operation.
- [x] Introduce controlled value, semantic, and component violations on a temporary branch/copy and capture their diagnostics.
- [ ] Repair those examples through the approved agent workflow and verify policy remains unchanged.
- [ ] Install/run the agreed local integration layers where authorized, recording each proof separately.
- [ ] Restore deliberate test changes and confirm the final website matches approved design decisions.

## Deployment preparation and proof

- [x] Build the site and validate generated documentation links, referenced commands, assets, and example snippets without browser automation.
- [ ] Inspect existing domain/hosting setup before choosing deployment steps; do not assume DNS control or a provider.
- [x] Prepare exact build/output configuration and list any environment variables actually required; prefer none for a static public site.
- [ ] Document preview/production URLs, domain setup, rollback, and release sequence without executing publication yet.
- [x] Prepare a browser/manual review script covering responsive layout, keyboard use, navigation, snippets, and installation journey.
- [ ] Run browser testing only with explicit authorization and distinguish visual evidence from build/test success.

## Completion gate

- [x] The site and docs explain the actual usable tool, including honest coverage limits.
- [ ] The website has a real approved manifest and a recorded onboarding/repair/activation trail.
- [x] The concrete visual direction is approved or explicitly marked pending; build success is not creative approval.
- [ ] The site builds and deployment instructions are concrete; publication status remains accurate.
