# Usual Design

Project-owned design rules. Deterministic feedback for developers and coding agents.

Usual Design is the first open-source tool from **Usual Labs**. It helps React/Tailwind projects enforce approved values, explicit semantic conventions, and shared component usage. The project owns the contract; its existing coding agent helps discover conventions and repair violations.

This is an unreleased development build. Source is available at [usual-labs/usual-design](https://github.com/usual-labs/usual-design). npm package and `usual.dev` publication are pending; no published installation command is implied.

## Run locally

Use Node.js 22.12 or newer and npm. From this source checkout:

```sh
npm ci
npm run build
node dist/cli.js --help
```

From the same directory, target a React/Tailwind v4 project explicitly:

```sh
node dist/cli.js init --root /path/to/project
node dist/cli.js init --root /path/to/project --write
node dist/cli.js audit --root /path/to/project --save
node dist/cli.js wizard --root /path/to/project --port 0
```

Open the local URL printed by the wizard command. Use the existing coding agent to review the draft contract, resolve selected findings, and rerun the full audit. Activate only resolved categories:

```sh
node dist/cli.js activate --root /path/to/project --categories colors,components --write
node dist/cli.js check --root /path/to/project
node dist/cli.js check --root /path/to/project --json
```

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

Private reporting setup and the public contribution intake process are still being finalized. The community documents state those limits explicitly.

Licensed under [MIT](LICENSE); see [third-party notices](THIRD_PARTY_NOTICES.md).
