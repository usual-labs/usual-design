# Developing Usual Design

Start with [CONTRIBUTING.md](../CONTRIBUTING.md) for scope, pull requests, and community expectations. This guide describes the current source checkout, not a published package installation.

## Prerequisites and first run

Use Node.js 22.12+ and npm 10.9.8. Run commands from the repository's package root:

```sh
node --version
npm --version
npm ci
npm run build
node dist/cli.js --help
```

`npm ci` installs the committed lockfile without updating it. Do not regenerate the lockfile to work around a local runtime mismatch. If your versions differ, select the supported runtime and pinned npm version using your usual version manager first.

`npm run build` compiles the CLI into `dist/`, the wizard into `dist/wizard/`, and the website into `dist/site/`. Changes to source are not reflected in the built CLI until you rebuild. There is no database or application secret setup.

## Where behavior lives

The main read path is:

```text
CLI or wizard API
  -> manifest validation
  -> source discovery and snapshot
  -> static evidence and import identity
  -> rule evaluation and active-category filtering
  -> diagnostics and exit status
```

| Area                                                          | Owner in this checkout                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| CLI arguments, commands, human/JSON output                    | `src/cli.ts`, `src/project.ts`                                                  |
| Manifest schema, validation, defaults, activation readiness   | `schema/manifest.schema.json`, `src/config.ts`, `src/types.ts`                  |
| Covered files, token discovery, exclusions, bounded traversal | `src/discovery.ts`                                                              |
| JSX/CSS evidence and finite expressions                       | `src/analysis.ts`, `src/expressions.ts`                                         |
| Static helper interpretation and component/import identity    | `src/helpers.ts`, `src/imports.ts`, `src/identity.ts`                           |
| Utility classification, observations, policy evaluation       | `src/classes.ts`, `src/observed.ts`, `src/rules.ts`                             |
| Source spans and finding identifiers                          | `src/diagnostics.ts`                                                            |
| Approved repairs, audits, verification, activation records    | `src/records.ts`, `src/record-validation.ts`                                    |
| Path boundaries and safe writes                               | `src/files.ts`                                                                  |
| Local wizard API and session boundary                         | `src/server.ts`                                                                 |
| Existing-agent setup and hook adapters                        | `src/integrations.ts`, `src/integrations-files.ts`, `src/integrations-hooks.ts` |
| Visual wizard and website                                     | `wizard/src/`, `site/src/`                                                      |
| Distributed agent workflow                                    | `skills/usual-design/SKILL.md`                                                  |
| Tests and independent sample contracts                        | `test/`, `wizard/test/`, `fixtures/`                                            |

Extend the responsible layer instead of teaching the CLI or UI a second version of a rule. Keep the manifest schema, TypeScript types, validation, documentation, and tests consistent when changing the contract.

## Behavior that must stay true

1. **A result has a defined scope.** `audit` reports all five design categories and separate coverage findings. `check` filters to active categories. A clean check with no active categories establishes no design enforcement.
2. **Unknown does not mean approved.** Dynamic expressions, ambiguous imports, unsupported syntax, and unresolved values need explicit coverage or operational errors where appropriate. Static helper support interprets bounded data; it never runs target-project code.
3. **Policy is independent of observations.** Discovery can propose decisions, but cannot silently authorize values. Ordinary repairs preserve policy; activation requires a fresh, clean audit for the selected categories.
4. **Read-only means read-only.** `check` and unsaved `audit` must not modify a target. Writes require their explicit workflow, validate paths, preserve unrelated changes, and reject stale or conflicting state.
5. **Snapshots authorize repairs.** A diagnostic ID or old line number alone is insufficient. Verify saved approval and the current snapshot immediately before writing.
6. **Errors retain their meaning.** Exit `0` means no blocking findings for the selected mode; `1` means findings or unverifiable coverage; `2` means configuration or operational failure.
7. **Local interfaces remain local.** Preserve loopback binding and wizard host, session, and origin checks. Never put session URLs or private source context in public logs.
8. **Evidence is specific.** Unit/SSR/API tests do not establish browser usability, native-agent lifecycle execution, remote CI success, deployment, or publication.

The full supported surface and exclusions live in [compatibility](compatibility.md). Source spans use zero-based, half-open UTF-16 offsets.

## Choose the right checks

Run the smallest checks that prove the change while developing. Before requesting review of source changes, run the normal checks in [CONTRIBUTING.md](../CONTRIBUTING.md#verify-and-open-a-pull-request).

| Change                                                    | Focused proof and additional checks                                                                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analysis, rules, discovery, or manifest                   | Regression in the relevant `test/*.test.ts`; accepted, violating, and unknown cases for new support; `npm run test:core`                                   |
| CLI commands or exit behavior                             | `test/cli.test.ts` and affected workflow tests; exercise human/JSON output and failure exits                                                               |
| Saved records, activation, or filesystem writes           | Persistence, record-validation, workflow, and verify-plan tests covering stale/conflicting state and unchanged files                                       |
| Wizard UI or API                                          | `npm run test:wizard`, affected core API/onboarding tests, typecheck and build; report browser evidence separately                                         |
| Agent setup or hooks                                      | `test/integrations.test.ts`; verify repeated setup and preservation of existing user configuration; distinguish adapter tests from actual client execution |
| Website                                                   | Typecheck/build and `npm run audit:site`; this command saves audit records in `site/docs/usual-design/`                                                    |
| Packaging, dependencies, CLI assets, or distributed skill | `npm run verify:package`; inspect the archive contents                                                                                                     |
| Analysis performance                                      | `npm run benchmark`; compare the same workload/runtime and report measurements                                                                             |
| Documentation or community templates                      | Check local links, changed command examples, Markdown/YAML formatting, and issue-form structure                                                            |

For one core test file, using the already installed runner:

```sh
npx --no-install tsx --test test/core.test.ts
```

Tests create temporary targets for mutations and clean up afterward. Follow that pattern when testing writes. Do not change the checked-in fixture or a real user's project as a side effect of a test.

`npm run verify:package` rebuilds, creates a local npm archive, installs it into a temporary project, and exercises the installed executable, skill assets, and wizard HTTP endpoints. It needs npm dependency access and writes evidence into ignored `.usual-design/artifacts/`. It does not publish anything or launch a browser.

`npm run format:check` covers source, tests, scripts, and schema files; it does not currently check Markdown or GitHub templates. Check changed documentation explicitly, for example:

```sh
npx --no-install prettier --check CONTRIBUTING.md docs/development.md
npx --no-install prettier --check '.github/ISSUE_TEMPLATE/*.yml' .github/pull_request_template.md
```

Use the same command with `--write` to format only those files. Check relative Markdown links from the containing file, not from your shell's working directory.

## Explore the fixtures

After building:

```sh
node dist/cli.js check --root fixtures/ember
node dist/cli.js check --root fixtures/atlas
node dist/cli.js audit --root fixtures/atlas --json
```

Ember should exit `0`. Atlas intentionally contains violations and should exit `1`; this is not a broken installation. The fixtures have independent token and component conventions so the checker cannot pass only the Usual website's design.

For interactive or repair experiments, copy a fixture into a temporary directory and pass that copy with `--root`. Do not activate, rewrite, or save records into the canonical fixture.

## Work on the interfaces

`npm run dev:site` starts the website development server. It does not deploy the site.

For an integrated wizard session, build and run:

```sh
node dist/cli.js wizard --root /absolute/path/to/your/temporary-project --port 0
```

The target needs a manifest; use a copied fixture or initialize a disposable project. The command prints a private loopback session URL and does not auto-open a browser. Stop it with Ctrl-C. Rebuild after UI edits and restart to use the updated assets.

`npm run dev:wizard` starts Vite for UI development, but it does not provide the wizard API or a session token. Use the built loopback server for the complete workflow.

Browser testing in this workspace requires explicit instruction. When authorized, keep manual keyboard, focus, responsive, and interaction results separate from API/SSR results.

## Common setup problems

- **`dist/cli.js` or wizard assets are missing or stale:** rerun `npm run build`.
- **An audit exits `1`:** read the findings. Exit `1` is expected for a violating or undecided contract, including Atlas.
- **An inactive check passes unexpectedly:** inspect `active` in the manifest. Use `audit` to see unactivated categories.
- **A wizard request reports a missing/invalid session:** use the current server's complete session URL. Do not share it or substitute the Vite URL.
- **A write reports a conflict:** preserve the changed files, read the error, and refresh the audit/approval as appropriate. Do not remove protections to force an old plan through.
- **A Windows or native hook problem occurs:** include the shell and client version; current platform evidence is in [compatibility](compatibility.md#platform-evidence).

If a problem remains, follow [SUPPORT.md](../SUPPORT.md) with a sanitized reproduction.
