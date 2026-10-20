# Usual Design

Project-owned design rules. Deterministic feedback for developers and coding agents.

Usual Design is the first open-source tool from **Usual Labs**. It helps React/Tailwind projects enforce approved values, explicit semantic conventions, and shared component usage. The project owns the contract; its existing coding agent helps discover conventions and repair violations.

Install [@usualui/lint](https://www.npmjs.com/package/@usualui/lint) from npm. Source is available at [usual-labs/usual-design](https://github.com/usual-labs/usual-design). The website remains a local preview.

## Quick start

Paste this prompt into your coding agent from your React/Tailwind v4 project:

```text
Set up Usual Design in this project. Install the usual-design-onboarding skill
from usual-labs/usual-design using `npx skills add`, selecting only this skill
and my current agent at project scope. Read its installed SKILL.md and follow
it now: inspect our design system, install the compatible @usualui/lint CLI,
prepare recommendations, and open the guided wizard for my choices. Preserve
existing policy and unrelated changes. Finish with the saved manifest and the
wizard’s prompt for my approved repair batch.
```

The agent installs the [onboarding skill](skills/usual-design-onboarding/SKILL.md)
through [Vercel Skills](https://skills.sh), reads your code, and prepares the local
wizard. You choose colors, typography, spacing, shape, and components while a
reference UI updates live. Review the minimal `usual.design.json`, then select
repairs and copy the generated prompt back to your agent.

Use Node **22.20+** for the Skills installer (the Usual Design CLI itself supports
22.12+). Guided onboarding requires **@usualui/lint 0.2.0+**. Direct skill install:

```sh
npx skills add usual-labs/usual-design --skill usual-design-onboarding
```

Existing tokens keep their names. Discovery, recommendations, and deferred work
stay in `docs/usual-design/`; the manifest contains only approved policy.
The preview uses reference components, not your running application.

For manual CLI setup and existing-policy editing, see the [usage guide](docs/usage.md).

An inactive category is **entirely unchecked by lint**, including new violations. The full audit still reports it. A passing check establishes compliance with the configured active rules and supported analysis; it does not establish visual quality or runtime layout correctness.

## Read more

- [Complete usage and manifest guide](docs/usage.md)
- [Compatibility and coverage boundaries](docs/compatibility.md)
- [Local demonstration and release review](docs/demo.md)
- [Agent setup and enforcement](docs/integrations.md)

Source checkouts also contain the website and visual proposal in `site/`, plus the ordered implementation plan in `docs/agents/plans/init/`.

The normal checker reads source without executing it, requires no model API key, and adds no telemetry. Your chosen coding agent operates under its own settings. The local wizard renders specimens and source references, rather than importing arbitrary project components.

## Develop

Contributions are welcome: reproducible bugs, clearer documentation, better diagnostics, and focused code changes all help. Start with [CONTRIBUTING.md](CONTRIBUTING.md), then use the [development guide](docs/development.md) for setup, architecture, targeted tests, and fixtures.

- [Support and useful bug reports](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security reporting and current release support](SECURITY.md)
- [Maintainer review and release guide](docs/maintaining.md)
- [Publishing @usualui/lint](docs/publishing.md)

Private reporting setup and the public contribution intake process are still being finalized. The community documents state those limits explicitly.

Licensed under [MIT](LICENSE); see [third-party notices](THIRD_PARTY_NOTICES.md).
