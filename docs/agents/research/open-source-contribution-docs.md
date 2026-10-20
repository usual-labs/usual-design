# Open-source contribution documentation research

Researched: 2026-10-20. Scope: contribution and community documentation for the
unreleased Usual Design repository. Sources are GitHub's documentation, Open Source
Guides, Contributor Covenant, and the actual files maintained by four relevant
developer tools. Repository examples below are pinned to the commits inspected.
This is research and a recommendation, not proof that GitHub settings, reporting
channels, or a public release exist.

## Recommended approach

Make the repository easy to understand, contribute to, and maintain. Credibility
comes from accurate commands, explicit project boundaries, actionable reports, and
honest review expectations. Do not imitate an established project's organizational
machinery when Usual Design does not have it. Open Source Guides recommends
documenting project goals, accepted contributions, communication expectations,
and how tests work, while keeping that documentation current. [1]

The appropriate set for this project is a concise root `CONTRIBUTING.md`, focused
development and maintainer guides, bug and feature forms, a PR template, support
guidance, security guidance, and clear conduct expectations. Link the entry points
from the README. GitHub recognizes README, license, contribution, and conduct
files in its community profile, but presence in that checklist is not evidence
that an operating policy or reporting channel works. [2][3]

## Patterns from working projects

| Example                                               | What the source does                                                                                                                                                                                                      | Adopt for Usual Design                                                                                                                                                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ESLint contribution entry point][7]                  | Routes people to distinct bug, rule, change, code, conduct, security, and AI instructions. It also describes its own foundation CLA.                                                                                      | Keep the main contribution guide navigable. Separate reproduction guidance from implementation detail. Do not inherit ESLint's CLA, foundation governance, or advisory URL.                                                                                                    |
| [Prettier contribution guide][8] and [PR template][9] | Starts with working setup commands, explains meaningful tests, states scope limits, and asks for tests and documentation where applicable. Its AI policy requires understanding, testing, and ability to explain changes. | Give commands matching this repository's scripts. Require regression evidence for changed behavior and documentation for public contracts. Keep checklists conditional, so a prose correction does not pretend to need runtime tests.                                          |
| [Vite contribution guide][10]                         | Explains repository setup, package manager selection, development/testing paths, dependency costs, and why more configuration is not automatically the right fix.                                                         | Point contributors to the real Node/npm requirements and relevant source areas. Ask for a reason before new dependencies or configuration. Do not copy Vite's monorepo commands, dependency bundling rules, or browser test workflow.                                          |
| [Knip contribution guide][11] and [bug form][12]      | Welcomes multiple contribution types, requests one issue or feature per PR, suggests discussing uncertain scope first, and requires a minimal reproduction. It links a separate development guide.                        | Allow direct small fixes; discuss new syntax, frameworks, or policy semantics before substantial work. Ask for minimal source, manifest, commands, versions, and expected/actual output. Permit inline sanitized reproduction instead of requiring a public repository upload. |

These examples have different sizes and processes. None is a universal template.
Usual Design should explain its own invariants: deterministic local analysis,
project-owned policy, explicit unknown coverage, activation semantics, and repairs
that cannot silently weaken policy. Those are concrete review criteria, unlike a
generic instruction to “follow best practices.”

## File and workflow recommendations

| File or workflow     | Recommended content                                                                                                                                                                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`    | Welcoming scope; documentation, reproduction, test, and implementation contributions; supported stack; setup; focused PR expectations; links to deeper guides and community policies. Root entry points plus deeper guides are established patterns in ESLint and Knip. [7][11]                                              |
| Development guide    | Repository map, install/build/test commands, targeted test examples, fixtures, public contracts, and the smallest meaningful checks for each change. Prettier and Vite explain how their tests actually work rather than merely requiring tests. [8][10]                                                                     |
| Maintainer guide     | Triage, review evidence, handling unsupported requests, and an accurate release checklist. Clearly distinguish recommendations and work not configured yet from enforced branch protections or automation. This applies the expectation-setting and maintainability guidance in Open Source Guides. [1]                      |
| Bug form             | Actual and expected behavior; minimal sanitized source and manifest; exact command and output; version and environment details; activation and unknown-coverage details where relevant. Require essentials, not a long list of ceremonial checkboxes. Knip demonstrates mandatory minimal reproduction fields. [12]          |
| Feature form         | Problem, concrete example, desired behavior, current workaround, and compatibility impact. Ask about the use case before promising a new option, following Vite's documented reluctance to add configuration without a clear need. [10]                                                                                      |
| PR template          | Problem and user-visible behavior; related issue if any; verification commands/results; public API/docs impact; remaining uncertainty. Prettier's template makes tests and user-facing documentation conditional on the change. [9]                                                                                          |
| `SUPPORT.md`         | Existing docs first, then the actual issue route when public hosting exists; no guaranteed response or invented chat/community link. GitHub supports this file for help resources. [3]                                                                                                                                       |
| `SECURITY.md`        | Threat-relevant scope, versions/status, private-reporting instructions only for a verified route, useful sanitized report contents, and responsible handling of sensitive details. GitHub private reporting requires explicit enablement. [4]                                                                                |
| `CODE_OF_CONDUCT.md` | Clear behavior expectations and the real enforcement/reporting arrangement. Do not publish an unchanged template containing an invented contact, an unfilled contact placeholder, or a promise that no owner has accepted. Contributor Covenant explicitly requires filling reporting details and reviewing enforcement. [6] |

Keep these files focused and linked rather than duplicating setup, supported
versions, and policy in several places. The public contributor journey should not
require reading private implementation logs to understand how to submit a change.

## Practical GitHub details

- Issue forms use YAML in `.github/ISSUE_TEMPLATE/` with `name`, `description`,
  and a `body`. Their supported fields include required validations. Do not add
  automatic labels until those labels exist: GitHub says a nonexistent label will
  not be applied. Do not invent assignees or organization issue types. [2][5]
- Put the single PR template in `.github/pull_request_template.md`. GitHub makes
  templates available after they are on the repository's default branch; adding
  local files alone does not activate them on a service. [13]
- Repository-specific community files override account defaults. GitHub's lookup
  precedence is `.github`, root, then `docs`; avoid competing copies. A future
  Usual Labs `.github` repository can provide shared defaults if several projects
  need them, but it is unnecessary for this first local project. Licenses still
  belong in each repository. [3]
- A useful community profile does not justify creating fake badges, maintainers,
  sponsorship links, release guarantees, CLA checks, or community channels.
  Document the real status and only add process when it is needed. This is a
  project recommendation based on the expectation-setting guidance in [1],
  rather than a GitHub compliance requirement.

## Reporting channels are a launch prerequisite

The repository presently has no confirmed public hosting or working private
security/conduct contact in the implementation context. A documentation change
cannot provide those capabilities.

GitHub private vulnerability reporting is enabled by a repository owner,
organization owner, security manager, or administrator. Once enabled, researchers
see **Report a vulnerability** in the repository's **Security → Advisories** area.
Notification delivery also depends on maintainer watch/notification settings.
Therefore a generic instruction to use that button must be conditional until an
owner has enabled it and verified receipt. [4]

For now, state the prelaunch limitation clearly in `SECURITY.md`; ask readers not
to put exploit details, private source, or credentials into public issues. Do not
claim to offer a private channel. Record the owner action to configure and verify
the route before accepting public security reports. A published private contact
would also work, but its actual owner and monitoring arrangement must be chosen,
not guessed.

Conduct reporting is a separate concern. Contributor Covenant 2.1 contains an
explicit contact placeholder and warns adopters to fill reporting details and
review enforcement before posting. Do not claim complete adoption while that is
unresolved. A short original conduct policy can describe behavior expectations
and honestly identify the current reporting gap, while the owner selects a
confidential route and an alternative for complaints involving that owner. This
alternative-route recommendation is a practical project recommendation, not a
claim that the cited template specifies this exact arrangement. [6]

Public issues are not a substitute for confidential conduct or security reports.
No response-time service level should be promised until a responsible person has
accepted it and can sustain it. Open Source Guides recommends setting response
expectations; its example times are examples, not required deadlines. [1]

## AI-assisted contributions

Usual Design is explicitly intended for developers using existing coding agents.
Welcome AI-assisted contributions while keeping the submitting person responsible
for understanding the change, inspecting generated code, respecting licenses,
running relevant checks, and responding to review with accurate evidence.

The compared projects differ: ESLint requires disclosure, human responses, and an
accepted issue for AI-generated PRs; Prettier requires understanding, testing,
review, and clear explanations. These are project-specific policies, not universal
open-source requirements. [8][9][14] Usual Design should adopt accountability and
quality requirements without inventing an accepted-issue approval apparatus.
Never request private prompts or transcripts as a substitute for reviewable code
and proof.

## Sources

Accessed 2026-10-20 through HTTP retrieval. Repository source content was checked
against the pinned revisions below. No browser testing, hosted repository setup,
private reporting test, or external communication was performed.

[1]: https://opensource.guide/best-practices/ 'Open Source Guides: Best Practices for Maintainers'
[2]: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/about-community-profiles-for-public-repositories 'GitHub: About community profiles for public repositories'
[3]: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file 'GitHub: Creating a default community health file'
[4]: https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository 'GitHub: Configuring private vulnerability reporting'
[5]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms 'GitHub: Syntax for issue forms'
[6]: https://www.contributor-covenant.org/version/2/1/code_of_conduct/ 'Contributor Covenant 2.1'
[7]: https://github.com/eslint/eslint/blob/449724e95bfa013fa32c29375925b4111d3924e4/CONTRIBUTING.md 'ESLint contribution guide at inspected revision'
[8]: https://github.com/prettier/prettier/blob/ca89224084d406d11f61db7350044881c0744139/CONTRIBUTING.md 'Prettier contribution guide at inspected revision'
[9]: https://github.com/prettier/prettier/blob/ca89224084d406d11f61db7350044881c0744139/.github/PULL_REQUEST_TEMPLATE.md 'Prettier PR template at inspected revision'
[10]: https://github.com/vitejs/vite/blob/2601eed4d764f21809652dbba745d0f38b47146c/CONTRIBUTING.md 'Vite contribution guide at inspected revision'
[11]: https://github.com/webpro-nl/knip/blob/ba527f7386e7741507f2f18d84864058e02ac907/.github/CONTRIBUTING.md 'Knip contribution guide at inspected revision'
[12]: https://github.com/webpro-nl/knip/blob/ba527f7386e7741507f2f18d84864058e02ac907/.github/ISSUE_TEMPLATE/01-bug_report.yaml 'Knip bug form at inspected revision'
[13]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository 'GitHub: Creating a pull request template'
[14]: https://eslint.org/docs/latest/contribute/ai-policy 'ESLint AI usage policy'
