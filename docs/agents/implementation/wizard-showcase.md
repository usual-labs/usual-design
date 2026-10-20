# Wizard shell and project showcase

Implemented 2026-10-20. Included in the 0.3.0 release candidate; see the release receipt for publication status.

## Experience

The wizard now fills the viewport, with a roughly 20% control rail and 80%
preview on desktop. The rail keeps steps and navigation available while its
choices scroll independently. Narrow screens stack controls above the preview.
The marketing hero and decorative copy are gone.

The shell began with Smoketest's product UI and now has its own restrained iris
accent, softer neutral grays, outlined Usual mark, numbered active step, and
1px dividers. It retains locally bundled Manrope, white surfaces, square panels,
whole-item selection and a 4px spacing rhythm. See the Mobbin reference notes
in `docs/agents/research/wizard-visual-direction.md`. Sources inspected were
`apps/web/app/globals.css`, `apps/web/app/layout.tsx`, the styleguide page,
and UI primitives in `/Users/armin/Projects/smoketest`. That repository was not
modified. Fonts and their license ship in the package; no remote font request
is needed for the shell.

The preview supports a project-owned development page, preserving actual
components, fonts, variants, type scales and theme providers. The updated
onboarding skill owns preparing its complete catalogue and decision mappings.
A coverage table records unavailable components rather than faking them.
Old proposals retain a labeled reference sheet with palette, type specimens,
actions, forms, cards, data, spacing and shape.

## Ownership and boundaries

- Optional `proposal.showcase` holds a loopback URL, title and supported themes.
  The manifest and its compiler remain policy-only; no preview inventory is added.
- `dist/showcase.js` is the browser bridge. It sends/receives only selections,
  deferred categories, literal preview values and theme. Project code maps these
  to its own tokens and component props; deferred choices restore original values.
- The application dev server renders its components. The CLI does not import
  application modules or proxy them under the wizard's origin.
- The server permits only the configured frame origin. The cross-origin iframe
  cannot submit forms, navigate its parent or open popups. Messages check window,
  origin, channel, shape and revision; updates serialize, time out and report
  application failures. No wizard API token or source data goes to the frame.
- Existing source, policy, session freshness, approval and activation checks remain.

## Local evidence and use

160 tests passed (142 core/API and 18 wizard/model/SSR). Type checking,
formatting, production builds and packed-install smoke passed. Packaging checks
cover the helper, installed skill/reference, loopback asset server, and bundled
Manrope font responses. No browser testing was performed, following project
instructions; visual acceptance and a real customer-project showcase remain
unverified.

No environment variable or database migration is required. Build this checkout
with `npm install` and `npm run build`. For a target project, install
`@usualui/lint@^0.3.0` once its release is available. Rerun the updated onboarding
skill to prepare its dev-only showcase, start the project server, refresh
`onboard --write`, and restart the wizard. Old proposals cannot render actual
components until that showcase is added. Both servers must stay running during
review; any frame policy adjustment belongs only on the local development route.
