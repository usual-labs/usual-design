# Usual Design

Project-owned design rules. Deterministic feedback for developers and coding agents.

Usual Design is the first open-source tool from **Usual Labs**. It helps React/Tailwind projects enforce approved values, explicit semantic conventions, and shared component usage. The project owns the contract; its existing coding agent helps discover conventions and repair violations.

Install [@usualui/lint](https://www.npmjs.com/package/@usualui/lint) from npm. Source is available at [usual-labs/usual-design](https://github.com/usual-labs/usual-design). The website remains a local preview.

## Quick start

Use Node.js **22.12 or newer**. From your React/Tailwind v4 project, create an initial manifest:

```sh
npx @usualui/lint init --write
```

To preview the draft without writing files, run `npx @usualui/lint init` instead. `--write` creates `usual.design.json` with all categories inactive and refuses to overwrite an existing manifest. Use `--root /path/to/project` to target another directory. For a version-pinned invocation, use `npx @usualui/lint@0.1.0 init --write`.

Install the tool locally for repeatable checks and agent hooks:

```sh
npm install --save-dev @usualui/lint
npx --no-install usual-design audit --save
npx --no-install usual-design wizard --port 0
```

The npm package is `@usualui/lint`; its executable is `usual-design`. The one-off `npx` command does not add the dependency to your project. An initial audit can exit `1` while policy decisions and findings remain unresolved.

Open the local URL printed by the wizard command. Use your existing coding agent to review the draft contract and resolve selected findings. Activate only resolved categories:

```sh
npx --no-install usual-design activate --categories colors,components --write
npx --no-install usual-design check
npx --no-install usual-design check --json
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
- [Publishing @usualui/lint](docs/publishing.md)

Private reporting setup and the public contribution intake process are still being finalized. The community documents state those limits explicitly.

Licensed under [MIT](LICENSE); see [third-party notices](THIRD_PARTY_NOTICES.md).
