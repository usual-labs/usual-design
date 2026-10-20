# Phase 06 — Local visual onboarding and repair wizard

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [audit and repair records](05-audit-and-repair-records.md). Next: [agent skills and setup](07-agent-skills-and-setup.md).

The bundled React wizard has real token/ad-hoc value choices, safe color/type/spacing/radius/border/shadow specimens, exact manifest identification, a component/import/count/source catalog, and draft-impact analysis without writes. Six audit groups, repair selection, copy fallbacks, fresh comparison, recheck, and activation share the CLI operations. Thirteen wizard model/SSR tests and actual loopback API journeys passed, including tokenless explicit choices through persisted repair and clean activation. Both independent fixtures have core workflow proof; a complete HTTP journey on each, scan cancellation/coalescing, rendered interaction, visual acceptance, and native-agent execution remain unverified.

## Outcome

Deliver the visual wizard as a complete first-release experience. A user can understand the discovered design system, choose intentional policy, inspect the full audit, select repairs, return from agent work, and activate resolved categories. The wizard uses the same operations and evidence as the CLI.

## Experience and trust boundary

Run a local server bound to loopback and serve bundled UI assets. Show interactive specimens generated from validated values and owned example components. Show real source references and link to an existing user-run preview when configured. Do not import arbitrary project React components or compile executable project stylesheets to create previews.

Multiple radii, sizes, colors, or variants are not automatically problems. The experience must ask about intended roles and allow deliberate diversity. Missing evidence stays unknown; visual polish must not imply certainty.

## Detailed tasks

### Define the onboarding flow

- [x] Sketch screens/states for project selection, inventory, policy choices, audit, repair selection, handoff, recheck, and activation.
- [x] Provide an existing-design-system path and a no-established-system path using the same underlying policy operations.
- [x] Make pending decisions, active categories, skipped categories, and incomplete evidence visible at every relevant step.
- [x] Include back/resume behavior without losing saved decisions.
- [x] Distinguish draft edits, saved policy, approved repair batches, and executed repairs visually and in text.
- [x] Show exactly which project and manifest are being edited.
- [x] Provide readable explanations for technical evidence without exposing implementation details unnecessarily.
- [x] Avoid presenting frequency, the current most-common value, or a model suggestion as the correct design by default.

### Implement the local server boundary

- [x] Serve only the selected project's supported operations and bundled assets.
- [x] Bind to loopback, select/report the local port clearly, and handle port conflicts predictably.
- [x] Protect local mutation APIs from cross-origin requests, DNS rebinding/host confusion, and unrelated web pages.
- [x] Use a per-session authorization mechanism where needed and avoid logging it or persisting it in project records.
- [x] Validate all request bodies through the same policy/record validators used by CLI operations.
- [x] Restrict file access to the approved project and explicitly safe resources; reject traversal/symlink escapes.
- [x] Do not expose generic file-write, shell-execution, arbitrary fetch, or process-control endpoints.
- [x] Escape source snippets, diagnostic text, and project-provided strings before displaying them.
- [ ] Bound request sizes and analysis jobs; cancel or supersede obsolete scans safely.
- [x] Surface disconnected server, interrupted scan, invalid manifest, stale snapshot, and write-conflict states.
- [x] Ensure the server shuts down cleanly without leaving partial records or orphaned project locks.
- [x] Make browser opening optional in the command; running tests must not open a browser implicitly.

### Build visual policy review

- [x] Render color swatches with readable labels and value/token/source references.
- [x] Render typography samples from safe supported values, with clear fallback behavior when a font is unavailable.
- [x] Render spacing/layout specimens that illustrate the approved finite scale.
- [x] Render radii, borders, and supported effect choices on owned example controls/cards.
- [x] Sanitize preview values and disallow executable/remote-resource CSS payloads.
- [x] Show multiple intentional roles rather than asking the user to choose one universal radius or size.
- [x] Display component identities, imports, usage counts, source evidence, and relevant policy choices as a catalog.
- [x] Provide links to explicitly configured existing previews without executing project components inside Usual.
- [x] Let the user accept/edit/reject a proposed policy decision with an inspectable diff.
- [x] Explain which existing usages would become findings under each choice, using real audit evidence.
- [x] Validate drafts before saving and preserve the previous valid policy on errors.

### Build full audit and repair selection

- [x] Display all six audit groups with counts split by violation, unresolved evidence, and decision needed.
- [x] Show active/inactive state separately from audit cleanliness.
- [x] Filter/search findings and navigate their source/policy evidence without changing scope implicitly.
- [x] Support group-level and individual selection with accurate partial-selection behavior.
- [x] Show a review screen containing selected changes, deferred work, and protected policy boundaries.
- [x] Persist the confirmed batch through phase 05's shared operation.
- [x] Display a copyable instruction pointing the current coding agent to the saved plan.
- [x] Make clear that copying a prompt does not mean code has changed or repairs succeeded.
- [x] Refresh results from an explicit recheck or completed result read; avoid introducing a permanent watcher without need.
- [x] Show resolved, remaining, new, and stale findings after agent work.
- [x] Provide a visible path to resume deferred groups later from project records.

### Activation, accessibility, and failure recovery

- [x] Offer activation only when current evidence makes a category eligible.
- [x] Revalidate through the shared activation operation when clicked; UI eligibility is not authority.
- [x] Show post-save activation readback and remaining inactive categories.
- [x] Handle source changes while the wizard is open by invalidating stale decisions/results and guiding recheck.
- [x] Implement keyboard navigation, labeled controls, focus management, and accessible dialogs/status updates.
- [x] Do not communicate category states or failures through color alone.
- [x] Support readable layouts on small screens and usable large finding lists without premature virtualization.
- [x] Provide copy/export fallbacks for source paths and repair instructions.
- [x] Make destructive or policy-weakening actions explicit and reviewable; ordinary repairs must not trigger them.

## Focused proof and visual evidence

- [x] Test server request validation, origin/host protection, path boundaries, and stale-write rejection without a browser.
- [x] Test specimens against hostile source strings/CSS values and unavailable font/token data.
- [x] Test component state transitions for selection, partial selection, stale scan, handoff, and activation using an appropriate non-browser harness.
- [ ] Exercise the complete API workflow against both fixtures and verify actual persisted files.
- [x] Build the wizard bundle and verify the installed CLI serves packaged assets.
- [x] Prepare an explicit manual/browser walkthrough for visual comparison, keyboard operation, and end-to-end interactions.
- [ ] Execute browser testing only if explicitly authorized; otherwise leave the browser/visual acceptance items unverified in the report.

## Completion gate

- [x] The wizard is a functional onboarding interface, not a static mockup or documentation-only substitute.
- [x] Both existing-system and guided-decision paths reach repair handoff and fresh category activation.
- [x] No project code is executed to obtain preview fidelity.
- [x] Record which behavior has automated/API/component proof and which visual/browser behavior still needs direct verification.
