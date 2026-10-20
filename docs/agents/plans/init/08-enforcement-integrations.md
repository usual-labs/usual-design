# Phase 08 — Agent hooks, commit hooks, npm, and CI

Status: implemented locally in part; unchecked scope and evidence remain open. [Implementation evidence](../../implementation/progress.md) · [User decisions and pending gates](../../handoffs/needs-armin.md). Depends on: [rules and CLI](04-rules-and-cli.md) and [agent setup](07-agent-skills-and-setup.md). Next: [website and documentation](09-website-and-documentation.md).

Default and custom manifest paths have tested host adapters, one-continuation Stop behavior, local-only runner, optional safe Git hook, npm setup, and a prepared CI example. Custom filenames with spaces, apostrophes, and shell metacharacters remain data; unsafe paths are rejected. Real temporary Git commits prove pass/fail propagation, and the full CI command sequence passed locally. Separate check/audit/Codex-handler/Claude-handler process timings are retained; these are direct handler measurements, not native host overhead. Actual host trust/events, redundant-event coalescing/flood prevention, and remote CI remain open.

## Outcome

Provide multiple entry points into the same deterministic check, giving developers and agents quick feedback without creating incompatible rule implementations. Automatic hooks require real host protocol handling and trust; an instruction file alone is not an installed hook.

## Verified research to recheck

The discussion's official-source research found local Codex `PostToolUse` and `Stop` hooks, with project configuration and exact-definition trust requirements. Claude Code has corresponding hooks and settings/trust restrictions. After-edit hooks cannot undo writes, and matching only edit tools misses shell-written changes. Completed-turn validation is therefore a backstop, while commit/CI checks are independent gates.

Sources: [Codex hooks](https://learn.chatgpt.com/docs/hooks), [Claude hooks](https://code.claude.com/docs/en/hooks). Verify the current protocol and client support before implementation; do not generalize local behavior to every cloud agent deployment.

## Detailed tasks

### One check contract everywhere

- [x] Document the full-scope CLI invocation used by every integration.
- [x] Resolve project root/configuration deterministically from hook/CI context.
- [x] Use local installed tool versions rather than downloading an unpinned package on every hook invocation.
- [x] Translate CLI statuses into each host's supported error/feedback format.
- [x] Keep protocol JSON valid and put logs on the correct stream.
- [x] Include concise findings and a command/path for the complete report when host output is bounded.
- [x] Preserve inactive-category summaries so agents understand the actual enforcement scope.
- [x] Avoid changed-lines-only enforcement as a speed shortcut; any internal optimization must preserve full-scope results.

### npm script and safe setup

- [x] Add a conventional project lint script through reviewed additive setup.
- [x] Detect script-name collisions and propose a non-destructive resolution.
- [x] Preserve package formatting and unrelated scripts/dependencies when editing.
- [x] Support the selected package manager and document alternatives without hard-coding a global tool installation.
- [ ] Verify script execution from both root and supported workspace locations.
- [x] Include installation/update/removal instructions that affect only Usual-owned entries.

### Local agent hooks

- [x] Verify Codex's current project hook file/schema and supported tool matcher names.
- [x] Verify Claude Code's current settings schema and edit/write/stop hook semantics.
- [x] Implement thin host adapters around the CLI rather than duplicate lint logic.
- [x] Provide after-edit feedback where supported and a completed-turn check for shell/tool paths missed by edit hooks.
- [x] Use host continuation markers such as `stop_hook_active` according to current documented semantics.
- [x] Define bounded retry/no-progress behavior so hook-triggered repairs cannot loop forever.
- [x] Distinguish a passing check from a stopped retry cycle with unresolved failures; never suppress the failure into success.
- [x] Preserve failure visibility when retry limits are reached and explain the required user action.
- [ ] Handle simultaneous tool events without corrupting files or flooding identical feedback.
- [ ] Coalesce redundant events only if it does not drop the final completed-turn validation.
- [x] Apply finite timeouts and report unavailable/broken checker execution distinctly from design violations.
- [x] Preview hook changes and preserve existing host entries/matchers.
- [x] Respect host-required trust/review; setup must not bypass or fabricate acceptance.
- [x] Document unsupported versions, managed-settings restrictions, and the manual command fallback.
- [x] Make clear that hooks are guardrails and some host/tool paths may bypass them.

### Opt-in commit hooks

- [x] Detect the existing hook manager or Git hook configuration before proposing installation.
- [x] Prefer integration with the existing mechanism over introducing another dependency.
- [x] Offer a manual command recipe when safe automatic chaining cannot be established.
- [x] Run the full active-category check against the working project and state that it is not a staged-tree guarantee.
- [x] Document partial-staging limitations: a passing worktree can differ from the committed tree; CI checks the actual committed source.
- [x] Propagate failures and preserve existing hook ordering/exit behavior where supported.
- [x] Verify shell quoting for spaces and unusual but valid project paths.
- [x] Do not overwrite user hook scripts or silently change global `core.hooksPath`.
- [x] Document how to disable/remove only Usual's hook and explain that local hooks are bypassable.

### CI and contract review

- [x] Provide a minimal workflow/example that installs locked dependencies and runs the same check on the checked-out commit.
- [x] Pin supported runtime and dependency installation practices without embedding provider credentials.
- [ ] Include structured diagnostics as an optional artifact only if useful and free of unintended private content.
- [x] Explain how teams make the job a required check through their own repository settings.
- [x] Recommend visible review ownership for the manifest, activation, exclusions, and policy records.
- [x] Keep policy-change review guidance distinct from hard technical enforcement; repository writers may still change files.
- [x] Do not mutate branch protection, publish a workflow externally, or create hosted resources without session authorization.
- [x] Document that a checked-in workflow file is preparation, not evidence of a successful remote CI run.

## Focused proof

- [x] Feed synthetic native hook payloads through adapters and verify real CLI output becomes correct host feedback.
- [x] Test clean, violating, invalid-config, timeout, repeated-failure, and no-progress cases.
- [ ] Verify shell-written source changes are caught by completed-turn validation in a real supported local agent when available.
- [ ] Verify hook setup preserves existing user hooks and requires the expected native trust review.
- [x] Test a temporary Git repository's commit hook success/failure without modifying unrelated hooks.
- [x] Run the CI command sequence locally; record remote execution separately only if actually performed.
- [ ] Measure integration overhead and ensure redundant event handling does not change check semantics.

## Completion gate

- [x] All integration paths invoke the same full-scope check and preserve exit/status distinctions.
- [x] Agent repairs receive actionable feedback with bounded continuation behavior.
- [x] Setup is additive, reviewable, opt-in where agreed, and reversible for tool-owned entries.
- [x] Report native-agent, local commit-hook, prepared CI, and actual remote CI evidence as separate results.
