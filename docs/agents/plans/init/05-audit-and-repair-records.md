# Phase 05 — Full audit, durable decisions, repair batches, and activation

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [rules and CLI](04-rules-and-cli.md). Next: [visual wizard](06-visual-wizard.md).

Audit/policy decisions, approved immutable repair batches, deferred work, repair-progress views, strict versioned record validation/recovery, atomic writes, freshness gates, and multi-category activation have passing CLI/API/test evidence. The read-only verify-plan operation rejects stale, corrupt, incompatible, or unapproved repair authority. Persistence regressions cover edits during fsync, failed receipt preparation, prepared decisions preceding failed commits, and quoted command data. Per-file conflicts are detectable within documented limits; no repository-wide transaction is claimed. Native-agent execution remains unperformed.

## Outcome

Provide the durable project workflow behind onboarding: inspect all categories, make explicit choices, select repairs, preserve deferred work, and activate enforcement only after a fresh clean audit. The wizard and agents will use these operations rather than owning separate state machines.

## State and ownership

An audit is evidence about a particular source/policy snapshot. A repair batch records user intent, selected findings, authorized application edits, and verification requirements. A decision document records why policy was chosen. These are different objects.

The manifest owns enforcement activation. Saved documentation does not become a second source of truth for enabled categories. Use plain project files, not a database. Keep human-readable Markdown and necessary machine state aligned without duplicating complete raw findings in multiple durable stores.

The normal lifecycle is: draft policy -> full audit -> approved repairs -> fresh audit -> category activation. Defer means keeping a category inactive and documenting work, not accepting individual violations while continuing to enforce that category.

## Detailed tasks

### Full audit

- [x] Implement `audit` to evaluate all configured design categories regardless of enforcement activation.
- [x] Identify missing policy decisions as setup work rather than declaring uncovered categories compliant.
- [x] Group results into the six agreed display groups with stable rule/category attribution.
- [x] Separate violations, unresolved evidence, informational discovery suggestions, and operational errors.
- [x] Show currently active/inactive categories alongside full-audit results.
- [x] Include sources scanned, exclusions, unsupported inputs, manifest identity, and source snapshot identity.
- [x] Produce human and structured output from the same result model used by `check`.
- [x] Keep a normal audit read-only; make persistence an explicit command option or workflow operation.
- [x] Define exits so audit findings are distinguishable from an unsuccessful/incomplete audit.
- [x] Return counts without implying that high usage frequency approves a design choice.

### Persistent project records

- [x] Finalize a documented project folder for decisions, audit summaries, deferred work, and repair batches.
- [ ] Define a versioned record format and deterministic IDs compatible with later refreshing.
- [x] Choose the canonical machine representation and generated human views for each record; avoid competing editable copies.
- [x] Separate transient caches/server sessions from durable records intended for version control.
- [x] Persist compact evidence, source references, reasoning, user choices, and next actions.
- [x] Avoid embedding secrets, entire private source files, absolute user paths, or unnecessary personal data in generated documents.
- [x] Preserve existing hand-written notes and mark generated regions/files clearly.
- [x] Keep earlier meaningful decisions recoverable without creating an unbounded full-source snapshot history.
- [x] Validate record paths inside the approved project and reject symlink/traversal escapes.
- [x] Use atomic file updates, detect concurrent changes, and preserve the last valid record on failure.
- [x] Make record-version incompatibility and corruption explicit and recoverable.

### Selection and repair-plan creation

- [x] Allow selecting an audit group or individual findings without implying policy changes.
- [x] Reconcile the selection against the current audit and report stale or removed findings.
- [x] Require explicit confirmation of the selected batch before marking it approved for the agent.
- [x] Record allowed application scope, targeted rule violations, design decisions, and required validation commands.
- [x] Record that manifest rules, activation, exclusions, and policy records cannot be weakened as part of an ordinary repair.
- [x] Include source evidence and intended outcome rather than brittle instructions to edit a line number blindly.
- [ ] Include dependency notes where one repair affects another selected group.
- [x] Create a short copyable agent instruction that references the saved plan without embedding project source.
- [x] Keep unselected findings documented as deferred work, with the category remaining inactive where applicable.
- [x] Never mark a finding resolved merely because it was selected, copied, or handed to an agent.
- [x] Refresh the audit after repair and reconcile resolved, still failing, newly introduced, and stale findings.
- [x] Handle reappearing findings and changed source locations without losing the decision trail.

### Category activation and deliberate deactivation

- [x] Implement a shared activation operation callable by CLI and wizard.
- [x] Require an explicit category selection and a fresh audit against current policy/source.
- [x] Refuse activation when that category has violations, unresolved relevant coverage, incomplete analysis, or missing required policy.
- [x] Check snapshot freshness immediately before writing activation; handle concurrent edits conservatively.
- [x] Make multi-category activation atomic or explicitly report which individual operations succeeded; do not silently partially activate a requested atomic batch.
- [x] Update only the intended manifest activation fields and related decision records.
- [x] Confirm activation with readback and a normal enforcement run.
- [x] Show exactly what remains inactive after partial onboarding.
- [x] Treat deactivation as an explicit policy change requiring review, never as an automatic repair action.
- [x] Document limitations of filesystem concurrency detection and ensure stale evidence is rejected wherever observable.
- [x] Do not implement baseline reset, blanket suppress-current-errors, or hidden changed-files enforcement.

## Focused proof

- [x] Verify full audit includes an inactive category while `check` omits its design findings.
- [x] Verify skipped typography remains documented and entirely unenforced until clean activation.
- [x] Verify choosing a group creates a reviewable plan and does not alter application code or enable rules.
- [x] Verify a stale plan cannot silently authorize editing changed source.
- [x] Verify activation fails after a new relevant violation is introduced between audit and save.
- [x] Verify a relevant unresolved coverage finding blocks activation even though it appears in the sixth display group.
- [x] Verify failed/competing writes preserve valid manifest and record content.
- [x] Verify rerunning a completed repair updates status from actual evidence without deleting manual notes.

## Completion gate

- [x] The complete file-based workflow can be exercised without the wizard.
- [x] Deferred work survives process restarts and can be resumed from documented evidence.
- [x] Category activation has no baseline or stale-audit loophole.
- [x] Document record formats, write boundaries, agent handoff instructions, and recovery behavior for phase 06.
