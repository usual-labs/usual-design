# Contributing to Usual Design

Thanks for helping make design rules dependable. Contributions can be code, a small reproduction, clearer documentation, better diagnostics, or feedback on onboarding. You do not need to be a static-analysis expert to help.

Usual Design is an early-stage open-source project from Usual Labs. The canonical repository is [usual-labs/usual-design](https://github.com/usual-labs/usual-design). The workflow below describes contributions there; public contribution intake depends on completing the reporting setup described in [Security](SECURITY.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Find the right starting point

| You want to…                                   | Start here                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Use the tool or understand a finding           | [Usage](docs/usage.md), [compatibility](docs/compatibility.md), then [support](SUPPORT.md) |
| Report an incorrect result or broken workflow  | A bug report with a minimal reproduction                                                   |
| Improve wording, an example, or a small bug    | A focused pull request; no advance issue is needed                                         |
| Add syntax support, a rule type, or a workflow | A feature proposal explaining the use case and analysis boundary                           |
| Report a possible security vulnerability       | [Security reporting](SECURITY.md); keep details out of public issues                       |
| Report harmful community behavior              | [Code of Conduct](CODE_OF_CONDUCT.md)                                                      |

Search the repository’s issues and pull requests before starting. For larger changes, agree on scope in an issue before investing in implementation. This is especially useful for new frameworks, manifest/schema changes, dependencies, or changes to what a passing check means.

Good first contributions include clarifying a confusing diagnostic, reducing a reported bug to a small fixture, improving a CLI example, and adding a regression test for an agreed bug. If an issue is already being worked on, coordinate there rather than duplicating the work.

## Set up a source checkout

Use **Node.js 22.12 or newer** and **npm 10.9.8**, the package manager pinned in `package.json`. Fork the canonical repository, clone your fork, and create a topic branch from its default branch. Run these commands from the package root:

```sh
npm ci
npm run build
node dist/cli.js --help
```

There are no application environment variables, model API keys, accounts, or database migrations to configure. Installing dependencies needs access to the npm registry or a populated local cache.

See the [development guide](docs/development.md) for the source map, targeted tests, fixtures, wizard workflow, and troubleshooting.

## Make a focused change

1. Describe the problem and the intended observable behavior.
2. Reuse the existing owner of that behavior. Keep modules focused, normally under 500 lines, and avoid speculative features or unrelated cleanup.
3. For behavior changes, add a test that would fail before the fix. New analysis support needs an accepted case, a violating case, and a relevant unknown or ambiguous case.
4. Update user-facing documentation when commands, supported syntax, diagnostics, or compatibility change. Note significant behavior changes under the unreleased entry in [CHANGELOG.md](CHANGELOG.md).
5. Run the checks relevant to the change and read the final diff.

Do not edit `dist/`, `node_modules/`, packed archives, or local generated audit records as source changes. Keep dependency updates intentional; use npm and include `package-lock.json` when dependencies change.

### Protect the design contract

- **The manifest is policy; discovery is evidence.** Observed styles do not become approved values automatically.
- `audit` examines all design categories. `check` enforces only activated categories; inactive categories are entirely unchecked.
- Unknown evidence affecting active rules must remain an explicit failure. Unsupported syntax must not silently become a clean result.
- Analysis reads and parses project source. It must not execute project modules, configurations, or components to discover values.
- Repairs must not broaden allowed values, add exclusions or exceptions, or deactivate categories merely to pass.
- Preserve read-only checks, fresh snapshot verification, safe file writes, and the distinction between findings and operational errors.

The [development guide](docs/development.md#behavior-that-must-stay-true) explains these boundaries and where to test them.

### AI-assisted contributions

AI-assisted work is welcome. The submitting contributor is responsible for understanding and reviewing the complete change, checking the rights to included code, running appropriate checks, and explaining the result. Be ready to respond to review and maintain the contribution.

Mention substantial AI assistance in the pull request, including what you reviewed and verified. A brief note is enough; do not upload private prompts, transcripts, project source, or credentials. Generated explanations and claimed test results must be checked against actual behavior. Small, reviewed changes are easier to accept than bulk generated patches.

## Verify and open a pull request

For source changes, the normal local checks are:

```sh
npm run format:check
npm run typecheck
npm run build
npm test
```

Use [the verification table](docs/development.md#choose-the-right-checks) to select additional checks. Documentation-only edits do not need the full application suite: check formatting, links, and any changed command examples. Browser testing in this workspace requires explicit instruction; report it as not run when it was not performed.

Use a short, descriptive PR title. In the description:

- Explain the problem and resulting behavior, with a linked issue when there is one.
- Show a small before/after example when it helps.
- List the exact checks run and their results, plus anything not verified.
- Call out compatibility, schema, dependency, security, or documentation changes.

Open a draft when feedback would help before the change is ready. Maintainers may request a smaller scope, a regression test, or a clearer compatibility boundary. Disagreement about design is fine; focus on evidence and the tradeoff. Review is capacity-dependent, with no promised response time. A merged contribution is not necessarily included in a published release.

Contributions are made under this repository's [MIT license](LICENSE). Only submit material you have the right to contribute, and preserve required third-party attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The current workflow does not require a separate CLA, DCO sign-off, or special commit-message format.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Maintainer review and release responsibilities are described in the [maintainer guide](docs/maintaining.md).
