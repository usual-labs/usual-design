# Distributing Usual Design skills

Research date: 2026-10-20. Sources are the official skills.sh documentation, the Vercel Skills CLI source, and the Agent Skills specification. This note records the distribution contract; it does not claim that a new skill has been pushed, installed remotely, indexed, or audited.

## Decision

Keep the skills in the existing public `usual-labs/usual-design` repository:

```text
skills/
  usual-design/
    SKILL.md
  usual-design-onboarding/
    SKILL.md
    references/
```

Use Vercel's `skills add` command to distribute them. The CLI discovers `skills/<name>/SKILL.md` without additional registration files. A GitHub repository can contain multiple skills; selectors choose which to install. [Creating skills](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md), [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

The separate onboarding skill should guide installation, evidence gathering, proposal preparation, user review, manifest saving, and the repair handoff. The existing `usual-design` skill should own ongoing checks and approved repairs. These responsibility boundaries are Usual Design's implementation choice, not a registry requirement.

## File requirements

Each skill requires a `SKILL.md` with YAML `name` and `description`. Use the exact directory name as the skill name; names must be lowercase letters/numbers/hyphens, 1–64 characters, with no leading/trailing or consecutive hyphens. Descriptions must be nonempty and at most 1,024 characters, explaining both purpose and activation conditions. `license: MIT` and concise compatibility information are optional. [Agent Skills specification](https://agentskills.io/specification).

Keep references inside the individual skill directory so an installed skill remains self-contained. Link them relatively from `SKILL.md`. Avoid depending on sibling skills or unpublished repository-only documentation unless the instructions explicitly fetch/read them. Reference files are loaded when needed; they are appropriate for the onboarding proposal format and design-role guidance. [Agent Skills specification](https://agentskills.io/specification).

Do not set `metadata.internal: true`: that hides a skill from normal discovery. No Claude marketplace, separate npm package, or Vercel project is required for this repository layout. [Creating skills](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md).

## Installation commands

Once both skills are on the public branch, list remote discoveries without installation:

```sh
npx skills add usual-labs/usual-design --list
```

Interactive project installation of the onboarding skill:

```sh
npx skills add usual-labs/usual-design --skill usual-design-onboarding
```

An agent that knows it is running in Codex can use a scoped, noninteractive install:

```sh
npx skills add usual-labs/usual-design \
  --skill usual-design-onboarding -a codex -y
```

For Claude Code, select `-a claude-code`; for Cursor, select `-a cursor`. To install both workflows, repeat the selector:

```sh
npx skills add usual-labs/usual-design \
  --skill usual-design-onboarding --skill usual-design -a codex -y
```

`--skill` selects names, `--list` avoids installing, `-a` selects agents, and `-y` skips CLI confirmation prompts. Omit `-g` so setup stays project-local. Avoid `--all`, which installs every skill for every agent. [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).

The official agent table currently lists `.agents/skills/` for Codex and Cursor, and `.claude/skills/` for Claude Code. Installation can use shared canonical directories and agent links; read the actual result before referring to an installed path. [Supported agents](https://github.com/vercel-labs/skills/blob/main/docs/agents.md).

At research time, the CLI's main-branch package identifies itself as `1.7.4` and requires Node `>=22.20.0`. This is source metadata, not proof of the latest npm release. It is stricter than Usual Design's existing Node `>=22.12.0` requirement; instructions using the current Skills CLI should account for that runtime requirement. [CLI package manifest](https://github.com/vercel-labs/skills/blob/main/package.json), [CLI README](https://github.com/vercel-labs/skills#install-a-skill).

## What publishing means

There is no documented standalone registry submission/publish command. Skills are hosted on GitHub. The skills.sh FAQ says its directory and rankings are populated automatically from real `skills add` installations and their anonymous install telemetry. Publishing the GitHub files and confirming a remote installation establishes distribution; website indexing is a separate outcome. [skills.sh FAQ](https://skills.sh/docs/faq).

The CLI tracks public repository identity, selected skills, source-relative skill file paths, and agent identifiers. GitHub install tracking occurs only after the CLI positively verifies that the source repository is public. Tracking failures do not cause installation to fail. Therefore a successful install is not proof that the directory received or indexed the event. [Install implementation](https://github.com/vercel-labs/skills/blob/main/src/add.ts), [Telemetry implementation](https://github.com/vercel-labs/skills/blob/main/src/telemetry.ts).

`DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1` disables telemetry and audit requests. Preserve existing preferences. Do not make direct telemetry calls or repeat installations to manufacture ranking activity. A real release-verification installation is sufficient to exercise the documented distribution path. [Troubleshooting and configuration](https://github.com/vercel-labs/skills/blob/main/docs/troubleshooting.md).

## Release and verification checklist

1. Validate frontmatter and all relative reference links locally.
2. Check that every onboarding command exists in the CLI release the skill requires. Keep new GitHub skill instructions from sending users into commands absent from their npm release.
3. Push the reviewed skills and their complete references to `usual-labs/usual-design`.
4. Run remote `skills add ... --list`; confirm both exact skill names.
5. Perform one genuine project-local remote install in a clean disposable project, selecting the intended agent and skills. Read back `SKILL.md` and supporting references; inspect generated paths and lock data.
6. Confirm the installed onboarding instructions start the intended version of Usual Design. Installation does not by itself prove that an already-running agent refreshed its skill catalog; the onboarding prompt should explicitly tell the agent to read the installed file and follow it now.
7. Separately check `npx skills find usual-design` or the public skills.sh page for the repository/skill. Report installation and indexing separately. If indexing is absent, say so; do not block GitHub installation on leaderboard visibility.

The CLI offers `skills find` for search and `skills list` for installed files. Its search implementation queries the skills.sh directory; direct GitHub installation does not depend on a search hit. [CLI README](https://github.com/vercel-labs/skills#other-commands), [Search implementation](https://github.com/vercel-labs/skills/blob/main/src/find.ts).

The public API documents skill detail URLs and repository-filtered listings, but requires Vercel OIDC authentication. It is unnecessary infrastructure for our onboarding. The documented directory URL shape is `https://skills.sh/<owner>/<repo>/<skill>`; verify a real response before announcing a listing. Automatic security audits may also lag the first installation and are distinct from our own validation. [skills.sh API reference](https://skills.sh/docs/api).

## Prompt and documentation implications

The README should provide one prompt that asks the current agent to:

1. Install `usual-design-onboarding` from `usual-labs/usual-design` using the Skills CLI, targeting its own supported agent and project scope.
2. Read the installed skill immediately, including required references, and follow its setup workflow.
3. Preserve an existing manifest and unrelated project instructions; stop on incompatible versions or missing capabilities instead of pretending setup succeeded.
4. Prepare the guided wizard for human design decisions, then finish with the approved manifest location and a separate selected-repair handoff.

Use explicit commands in the skill for reproducibility, while keeping the user-facing prompt short. The Skills CLI also provides `skills use <source>@<skill>` for printing a prompt or launching supported agents. That does not establish universal agent launching, so it need not replace the portable install-and-read entry point. [CLI README](https://github.com/vercel-labs/skills#use-a-skill-without-installing).

The experimental npm skill-sync feature can discover packaged `skills/<name>/SKILL.md` files, but it would add another setup mechanism and package dependency. Keep our npm skills bundled as a fallback and use the established GitHub installation flow for now. [CLI reference: experimental commands](https://github.com/vercel-labs/skills/blob/main/docs/commands.md#experimental-commands).

## Research evidence boundary

Official documents and source files above were read through the web connector. Direct shell retrieval failed because the sandbox could not resolve `raw.githubusercontent.com`; no skill installation or external write was performed for this research. An attempted public page read for `usual-labs/usual-design/usual-design` returned a connector error and is not evidence either for or against an existing listing.
