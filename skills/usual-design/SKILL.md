---
name: usual-design
description: Check a React and Tailwind v4 project against its Usual Design contract, execute an approved repair batch, or review an intentional policy change.
---

# Usual Design

Use the project's locally installed `usual-design` command. npm scripts put its local binary on PATH; otherwise invoke `./node_modules/.bin/usual-design`. Do not download a different tool version as part of ordinary checks.

## Policy and evidence

`usual.design.json` is the project's approved design contract. It defines allowed values, explicit semantic rules, approved components, covered paths, exceptions, and active categories. Existing code supplies evidence, not automatic permission. A project's legitimate variations, such as different card and button radii, need intentional rules rather than forced uniformity.

The design categories are colors, typography, spacing/layout, shape/effects, and components. Coverage/unresolved cases form a sixth audit group and are attributed to the categories they prevent verifying.

- `usual-design check` checks the full covered project against **active categories only**. Inactive categories are entirely unchecked, including newly introduced drift. Report that scope accurately.
- `usual-design audit` examines drafted policy across all categories. Both commands are read-only unless an explicit persistence option is requested.
- Invalid configuration and unverifiable code affecting active categories are failures. Never describe them as a clean result.

## First-time onboarding

Use the dedicated `usual-design-onboarding` skill for discovery, recommendations,
and guided visual review. It can be installed project-locally with
`npx skills add usual-labs/usual-design --skill usual-design-onboarding`, selecting
the user's agent. Read its installed `SKILL.md` immediately. An existing contract
remains authoritative; onboarding does not grant permission to replace it.

## Execute a repair batch

Read the exact saved batch the user selected. A draft batch is not authorization. The wizard can approve and save a selected batch; the equivalent CLI is `usual-design plan --findings id,id --snapshot hash --write` with IDs and snapshot from a current audit. Before editing, run `usual-design verify-plan --plan docs/usual-design/repairs/<id>.json` using the exact saved path, and pass its `--config` value if custom. This read-only command rejects unapproved, corrupted, or stale batches. Check its approval, selected findings, source snapshot, and manifest identity before editing. If source, policy, or findings changed, run a fresh audit and reconcile the selection; do not treat stale locations as current instructions. Compare current audit identities with the saved batch before editing; after repairs, compare the fresh findings with the original selected outcomes.

Preserve unrelated dirty work and application behavior. Ordinary repairs may change only the selected application code and intended outcomes. They must not broaden allowed values, weaken semantic/component rules, change coverage or ignored paths, deactivate categories, add exceptions, or delete records to make findings disappear. Ask for a separate design-policy decision when a valid repair requires a policy change.

After each completed UI change, run `usual-design check`. Before reporting the batch complete, rerun the full audit and compare findings against the approved selection. Report remaining, new, and unresolved findings explicitly. Passing prose from another agent is not proof.

Resume deferred work by reading `docs/usual-design/`, refreshing the audit, and selecting a current batch. Do not rely on chat memory to reconstruct approval.

## Change design policy intentionally

A policy change requires the user's specific design intent. Show the proposed contract diff, the findings affected, and any enforcement scope reduction. Validate and reaudit after approval; preserve the decision in the project records. This workflow does not authorize publishing, outbound communication, or unrelated project changes.

## Hooks and reporting

Native hooks are optional guardrails that must be installed and trusted in the host. An instruction section alone is not an automatic hook. Hook feedback never authorizes a wider repair scope or policy change. If automatic continuation stops with unresolved failures, report them and wait for the required decision rather than claiming success.

Conclude with application changes, commands actually run, remaining findings, and active/inactive categories. State native-agent, local CLI, commit-hook, and remote CI evidence separately.
