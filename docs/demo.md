# Demonstration and review guide

The demonstration should prove the feedback loop using actual CLI output from the current build. It must not imply npm publication, production deployment, creative approval, native-agent event execution, or external adoption before those have happened.

## Local source-build demonstration

```sh
npm ci
npm run build
node dist/cli.js --version
node dist/cli.js audit --root site --save
node dist/cli.js wizard --root site --port 0
```

The website is an actual React/Tailwind v4 project with token CSS, a shared Button, a project manifest, and an explicit primary-action semantic rule. Its concrete design is provisional. Do not activate it as user-approved design merely because its build or audit passes.

Use a temporary copy for controlled drift examples. Preserve the original manifest and hash it before repairs. Demonstrate each rule type with a supported fixture or the copied site:

1. Introduce a color utility outside the approved set.
2. Remove the required primary-action class while retaining the explicit semantic target.
3. Add a native `button` outside the approved implementation path.
4. Run a full audit and retain the real output.
5. Select a repair batch and give its saved plan to the existing agent.
6. Repair application code, preserving semantics and accessibility.
7. Run the check again and verify the manifest hash did not change.
8. Show an inactive category remaining unchecked by `check` while appearing in the full audit.
9. Activate a clean category through the actual activation command and show a subsequent violation blocking it.

Do not invent diagnostic IDs or benchmark timings for a recording. Use fixture-derived findings and measured commands. Restore deliberate changes after the proof; never broaden policy to make a demonstration pass.

## Evidence to retain

Record the revision or source snapshot, Node/npm versions, CLI version, exact command, exit status, real output, target fixture, and whether policy changed. Keep local unit tests, CLI subprocess tests, site builds, agent-hook execution, commit-hook execution, CI execution, visual review, and deployment as separate gates.

The independent fixture must use different tokens/component conventions from the website. A pass on the website alone cannot establish support for other design systems.

## Website review

```sh
npm run dev:site
```

The server prints a local preview URL. Browser testing requires explicit user authorization. Once authorized, review:

- Home, product, and documentation navigation at desktop and narrow widths.
- Keyboard focus, skip link, example buttons, pressed states, and copy feedback.
- Code block scrolling and page heading structure.
- Color and type choices, spacing, and the concrete provisional direction.
- Full setup instructions against the built CLI rather than assumed commands.
- Clear inactive-category warnings and analysis boundaries.
- Absence of fabricated public URLs, published installation claims, tracking, or remote font requests.

The website’s static build lives at `dist/site`. Deployment preparation and release boundaries are documented in [site/README.md](../site/README.md). No deployment or public distribution is part of this local demonstration.
