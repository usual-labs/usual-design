# Agent and enforcement integrations

Every entry point invokes the same full-project `usual-design check`. Only active categories are enforced; inactive categories remain explicitly unchecked. Full audits also inspect drafted inactive categories. Native hooks and commit hooks supplement the check; CI validates the actual committed source.

## Local setup

Install the published `@usualui/lint` package in your target project. Review proposed changes before writing:

```sh
npm install --save-dev @usualui/lint
npx --no-install usual-design setup --host both
npx --no-install usual-design setup --host both --write
```

Use `--host codex`, `--host claude`, or `--host portable` instead of `both` when appropriate. The preview reports exact file contents, conflicts, and native trust requirements. `--write` explicitly applies the reviewed project-local setup. Nothing is installed globally, and setup never downloads a second CLI version.

If the project has no manifest yet, run `npx @usualui/lint init --write` first. One-off npx use does not install the dependency needed by native hooks. For source development, you can still install a verified local tarball instead of the registry version.

Codex receives `.agents/skills/usual-design/SKILL.md` and a bounded `AGENTS.md` section. Claude Code receives `.claude/skills/usual-design/SKILL.md` and a bounded `CLAUDE.md` section. These project locations follow the [Codex customization documentation](https://learn.chatgpt.com/docs/customization/overview#skills) and [Claude Code skill documentation](https://code.claude.com/docs/en/skills), checked on 19 October 2026. Portable setup saves the shared skill in `docs/usual-design/SKILL.md` for manual use with another agent. The same maintained skill content is used by all hosts.

Setup adds `"lint:design": "usual-design check"` to `package.json`, preserving its other text. A conflicting script name, custom same-named skill, edited managed section, invalid configuration, or symlink path stops application and requires manual review. Ownership hashes in `.usual-design/setup.json` distinguish an unchanged generated file from a user-edited one. Repeating setup is stable. Concurrent file changes invalidate a preview. Each file replacement is atomic; an interrupted multi-file setup can be rerun after inspecting and clearing its stale setup lock.

## Discovery and approved repairs

The skill helps the existing agent inventory Tailwind v4 tokens and shared components, propose a manifest, and guide users through the visual wizard. It keeps observed code, proposed policy, and approved policy distinct. A draft manifest or repair batch does not imply user approval.

The wizard writes selected repairs into `docs/usual-design/` and supplies a short instruction pointing to the saved batch. The agent checks approval and freshness before editing. It reaudits changed source or policy, preserves unrelated work, and repairs only the selected scope. Ordinary repairs cannot broaden allowed values, add exceptions, change coverage, deactivate categories, or delete evidence. Intentional policy changes use a separate reviewed workflow. Hooks never grant additional repair authority.

## Optional native hooks

```sh
npx --no-install usual-design setup --host both --hooks
npx --no-install usual-design setup --host both --hooks --write
```

This adds native `PostToolUse` and `Stop` command hooks to `.codex/hooks.json` and/or `.claude/settings.json`, plus `.usual-design/hook.cjs`. Existing unrelated hook handlers and settings remain in place. Codex inline `[hooks]` configuration conflicts with a separate hook file, so setup refuses that combination and asks you to extend the existing configuration manually.

The generated command requires a POSIX shell and Node 22+. It finds the project runner from the current directory or its ancestors, including nested directories containing spaces, then invokes the **locally installed** CLI against that project root. The runner has a 25-second subprocess timeout; the native handler has a 30-second timeout. There are no package downloads, model calls, persisted retry state, or background repair agents.

- After-edit hooks provide immediate diagnostic context for the documented edit tools. They cannot undo writes.
- The completed-turn hook performs the full check again, covering shell-written changes and other paths missed by edit matchers.
- A first completed-turn design failure asks for one authorized repair pass. If `stop_hook_active` is already true, it ends automatic continuation with the unresolved failures visible. A checker/configuration error ends continuation immediately with a distinct error.
- A passing check is reported only when the checker actually passes. Hook process exit 0 means valid native protocol output; `checkExitCode` inside the adapter distinguishes clean (0), design failure (1), and checker error (2). A stopped retry still reports **FAILED** and does not become a successful lint result.
- Simultaneous invocations run independent read-only checks; they cannot corrupt repair records or policy. There is no cache or changed-line shortcut. Large diagnostics are bounded and point to the full check command.

Review/trust the exact hook definitions in your agent before relying on them. Setup cannot grant native trust, override managed settings, or establish compatibility with every client/cloud deployment. Codex project trust and exact-definition trust are separate requirements. Claude Code may require settings review/restart and can apply higher-priority managed restrictions. Use `npm run lint:design` manually when native execution is unavailable.

Protocol references checked on 19 October 2026: [Codex hooks](https://learn.chatgpt.com/docs/hooks), [Claude Code hooks](https://code.claude.com/docs/en/hooks). Both document `PostToolUse`, `Stop`, JSON feedback, and `stop_hook_active`. Automated tests exercise synthetic native payloads, setup preservation, nested-path runner invocation, timeouts, and bounded continuation. Actual native-agent execution and installed-client version compatibility must be recorded separately; generated hook files are not evidence that a host trusted or ran them.

## Optional commit hook

```sh
npx --no-install usual-design setup --host portable --commit-hook
npx --no-install usual-design setup --host portable --commit-hook --write
```

Automatic installation is limited to a project at its Git repository root with no existing hook manager, custom `core.hooksPath`, worktree-external hooks, or pre-commit script. It uses native Git hooks and adds no dependency. If a hook mechanism already exists, add `npm run lint:design` to that mechanism after reviewing its ordering and exit behavior; setup does not replace it or change global Git configuration.

The hook checks the full **working tree**, not the staged tree. Partial staging can commit code different from the checked files. Local hooks are bypassable; CI checks the actual commit. Fixture tests execute real temporary Git commits with passing and failing checker commands.

## CI and policy review

Copy and adapt [the minimal CI example](../examples/ci.yml) into your repository workflow. Use a supported Node version, locked dependencies, and `npm run lint:design`. In a monorepo set its working directory to the project containing the manifest and locally installed tool. pnpm/yarn users should use their own locked install command and the same check script.

Make the CI job required through your repository settings if desired. Consider review ownership for `usual.design.json`, activation/exclusions, and design-decision records. These are review policies, not an immutable barrier against repository writers. A checked-in workflow is preparation; only a completed remote run proves CI execution.

## Update and removal

Rerun the preview after a tool update. Unmodified tool-owned skill/runner files can update; custom edits require review. Setup never silently replaces edited instructions or hooks.

To remove an integration, review the version-control diff and remove only the bounded `usual-design:begin` / `usual-design:end` instruction section, the corresponding `usual-design` skill folder, and the exact generated hook handlers. Preserve all unrelated hooks/settings. Remove `lint:design` only if it still contains `usual-design check`, and remove the generated Git hook only if its contents are still the Usual-owned script. Remove `.usual-design/hook.cjs` after no host references it. The ownership record identifies generated files; do not delete project audit, decision, or repair history as part of integration removal.
