# Security policy

## Release and reporting status

The first public release is `@usualui/lint@0.1.0`, published on 2026-10-20. Security fixes target the development source and a subsequent release; no older release line or backport schedule is promised.

**Private vulnerability reporting is not configured in this checkout.** Before opening public contributions, the repository owner must enable and verify a private reporting route, name the people who monitor it, and update this document. This file alone does not enable GitHub reporting.

Once the canonical GitHub repository has private reporting enabled, use **Security → Advisories → Report a vulnerability**. If that action is absent, do not assume a report can be sent privately. Keep vulnerability details private until the repository owner supplies a verified confidential route. Do not use a public issue or pull request as a fallback for exploit details.

## What to report privately

Examples include:

- Reading or writing outside the authorized target through path traversal, symlinks, or stale/conflicting writes.
- Executing target-project code during discovery, analysis, or preview.
- Bypassing the local wizard's host, session, or origin checks.
- Exposing source, credentials, private session tokens, or other confidential data.
- Command injection in generated setup/hook files or a dependency vulnerability that is reachable through the tool.

Ordinary incorrect findings or unsupported syntax belong in a sanitized bug report unless they also create a security impact. If unsure, treat the details as private.

## What a private report should contain

Provide the affected version or source revision, runtime/OS, relevant command or workflow, expected boundary, actual impact, and the smallest safe reproduction. Include a proposed fix if you have one.

Use a disposable project you control. Do not access another person's data or systems to demonstrate an issue. Remove credentials, personal information, and proprietary source. Diagnostic JSON, audit records, and session URLs need particular care because they can carry source context or tokens.

## Handling and disclosure

After a reporting route is operational, maintainers should acknowledge the report there, reproduce it, assess affected versions, coordinate a fix, and agree on disclosure with the reporter. Credit is optional and should follow the reporter's preference.

There is no guaranteed response deadline, bounty program, or automated security monitoring claimed by this policy. Do not disclose sensitive details in a public patch before coordinating a safe release. Maintainers must document any supported versions and mitigations in the eventual advisory.

## Local boundaries

The checker is designed to parse source without executing project code. Normal checks do not call a model or upload source. The wizard is a loopback interface; keep its session URL private and do not expose it through a public tunnel.

An existing coding agent is a separate tool with its own permissions and data handling. Usual Design does not grant trust to that agent or certify everything it generates. See [compatibility](docs/compatibility.md) for the current limits.
