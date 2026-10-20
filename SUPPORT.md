# Getting help

Start with [usage and the manifest](docs/usage.md), [supported analysis](docs/compatibility.md), and [agent setup](docs/integrations.md). For source checkout problems, see the [development guide](docs/development.md).

This is an unreleased source checkout. The public tracker is [GitHub Issues](https://github.com/usual-labs/usual-design/issues). Use the forms described below for ordinary questions and bugs. Private reporting contacts are still being configured; no chat service, discussion forum, or support email is implied.

## Choose a report

- **Question:** ask how to use a documented command, model a policy, or interpret a finding.
- **Bug report:** provide a minimal example of incorrect analysis, an unexpected failure, or a broken onboarding step.
- **Feature proposal:** explain the use case, current limitation, and desired behavior. For syntax support, show which cases can be proved statically and which should stay unknown.
- **Security concern:** follow [SECURITY.md](SECURITY.md). Do not submit exploit details, leaked source, or credentials through a public form.
- **Community concern:** follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Search existing reports first. A small reproducer is more useful than a screenshot of a large private application. Documentation fixes can go straight to a pull request.

## Make a useful reproduction

Include:

1. The CLI version or source revision, Node/npm/Tailwind versions, OS, and relevant agent/shell version.
2. A tiny source file and the relevant manifest, including active categories and coverage paths.
3. The exact command, working directory, actual output, and exit status.
4. What you expected and why the declared contract should allow or reject it.
5. Whether the issue still occurs with a reduced example using the same supported versions.

Replace proprietary names, local usernames, credentials, and private values without changing the behavior being reported. Diagnostic JSON and saved audit/repair files can contain source snippets and paths. Review them before sharing. Never share the wizard's session URL or token. You do not need to upload an entire application.

For visual or interaction reports, a sanitized screenshot or short description of the steps can help, but it does not replace source/command details for analysis bugs.

## Expectations

Support and review depend on maintainer availability. There is no guaranteed response time, paid support service, or support commitment for unpublished builds. Keep follow-ups in the same thread and add new evidence when available.

Uncertainty in analysis is sometimes an intentional coverage boundary. A clean check applies only to configured, active rules; it does not certify visual quality or runtime behavior.
