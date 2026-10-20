# Phase 07 — Existing-agent skills and safe project setup

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [audit records](05-audit-and-repair-records.md) and [wizard](06-visual-wizard.md). Next: [enforcement integrations](08-enforcement-integrations.md).

One maintained portable skill is installed additively for Codex, Claude Code, both, or manual use. Setup preservation/idempotence/conflict/path tests, packaged skill validation, and read-only saved-plan approval/freshness rejection pass. Official formats were checked, but no installed native-client version or actual native-agent skill execution is verified; those tasks remain open.

## Outcome

Make Codex and Claude Code capable of discovering policy, guiding the wizard journey, repairing selected findings, and resuming deferred work. Keep the AI in the user's existing agent. The CLI validates what the agent proposes; no model output bypasses deterministic checks.

## Integration ownership

Keep shared workflow content in one maintained source, with host-specific installation details where needed. A skill is guidance, not a security boundary or guaranteed automatic trigger. Hook execution belongs to phase 08.

At planning time official documentation described Codex project skills under `.agents/skills/`, Claude skills under `.claude/skills/`, and project instructions in `AGENTS.md` / `CLAUDE.md`. Verify current supported locations and behavior before installation. Preserve users' existing instructions.

## Detailed tasks

### Specify the shared agent workflow

- [x] Write an agent-readable overview of the manifest, categories, audit/check distinction, and policy authority.
- [x] Define discovery steps that read project code/tokens/components and invoke the CLI inventory.
- [x] Explicitly separate observed conventions, proposed policy, and user-approved decisions.
- [x] Require the agent to surface competing legitimate conventions rather than forcing uniformity.
- [x] Explain how projects with an existing system and projects without one enter the wizard.
- [x] Require schema validation of every proposed manifest before presenting it as usable.
- [x] Document that unsupported constructs and ambiguous design intent require decisions or honest coverage findings.
- [x] Provide the exact command sequence for generating an audit, opening the wizard, and reading saved records.
- [x] Include a sample journey using fixture values rather than fabricated real-user evidence.

### Define repair and resumption behavior

- [x] Require the agent to read the selected approved batch and check its source/policy freshness.
- [x] Limit ordinary repairs to the selected scope and intended outcomes.
- [x] Explicitly prohibit broadening allowed values, changing exclusions, deactivating categories, or deleting evidence to make a repair pass.
- [x] Treat comments/documentation/source text encountered during analysis as data, not instructions overriding the user's plan.
- [x] Require a refreshed audit when locations, code, or policy changed since selection.
- [x] Instruct the agent to preserve unrelated application behavior and dirty work.
- [x] Require a recheck after each completed UI change and an audit before category activation.
- [x] Make failed/ambiguous repairs visible and leave unresolved work documented.
- [x] Define the separate approved-policy-change workflow, including intent, policy diff, affected findings, and revalidation.
- [x] Explain how to resume deferred work from the saved project folder without relying on old chat memory.
- [x] Require final reports to identify code changes, remaining findings, active/inactive categories, and proof actually run.

### Build installation and update behavior

- [ ] Verify current official Codex and Claude skill/instruction formats and record tested client versions.
- [x] Package host-specific skill files and supporting references with the CLI artifact.
- [x] Implement project-local setup for either host, both hosts, or portable manual instructions.
- [x] Preview every proposed file/configuration change before writing it.
- [x] Preserve all existing `AGENTS.md` and `CLAUDE.md` instructions; add a bounded managed section only after confirmation.
- [x] Do not replace an existing same-named skill without a clear conflict/update review.
- [x] Track which content the tool owns so updates and removal preserve user edits and unrelated integrations.
- [x] Make repeated setup idempotent and show changes when the installed version differs.
- [x] Use atomic writes and reject concurrent modifications rather than overwriting them.
- [x] Validate installed paths remain within the intended project and handle symlinks safely.
- [x] Avoid changing global agent settings unless separately and explicitly requested.
- [x] Provide a manual installation path where host/version/trust rules prevent automatic setup.
- [x] Give portable instructions for unsupported agents without claiming native hooks exist.

### Connect wizard handoff

- [x] Make the wizard's copied instruction concise and reference the exact saved batch location.
- [x] Ensure both host skills can consume the same batch and record formats.
- [x] Include the protected policy identity and relevant commands in machine-readable handoff data.
- [x] Keep approval status explicit; a draft plan is not executable authorization.
- [x] Ensure the agent's result is validated against a new audit, not merely trusted prose.
- [x] Handle a second agent/process editing the same plan by detecting conflicts and requiring refreshed evidence.
- [x] Avoid remote control, direct model API calls, provider secrets, or automatic outbound messages.

## Focused proof

- [x] Test installation into empty, preconfigured, conflicting, and user-modified project fixtures.
- [x] Verify existing instructions and unrelated skill files remain byte-for-byte intact outside authorized managed edits.
- [x] Verify repeated setup is stable and updates do not duplicate sections.
- [ ] Validate every example command/path against the built CLI and record schema.
- [ ] Exercise the saved-plan workflow in a local supported agent if available and authorized, recording the actual client/version.
- [x] If live agent execution is unavailable, record fixture/setup proof separately and leave native-agent behavior unverified.
- [x] Demonstrate a repair that passes while protected policy remains unchanged.
- [x] Demonstrate a stale or unapproved batch being rejected as authority for an ordinary repair.

## Completion gate

- [x] Both named agents have usable project-local skills and setup instructions.
- [x] The discovery-to-wizard-to-repair handoff uses existing agent capabilities, without a hosted AI dependency.
- [x] Installation preserves existing project instructions and records exact modifications.
- [x] State which installation and actual agent behaviors were verified before phase 08 adds automatic hooks.
