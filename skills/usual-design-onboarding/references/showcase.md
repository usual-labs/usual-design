# Project showcase

The right side of the wizard is a project-owned development page, embedded from
its own loopback server. It imports the actual project components, CSS, fonts,
and theme provider. The wizard shell remains Manrope and neutral gray; the
showcase retains the customer's design. Do not restyle it to match the shell.

This integration requires `@usualui/lint` 0.3.0 or later and its
`@usualui/lint/dist/showcase.js` helper. Check the installed version and file.
Upgrade older packages before preparing a project showcase. Existing proposals
without a showcase still open with a labeled, generic reference preview.

## 1. Inventory before building

Read the actual component exports, variant definitions, theme files, global CSS,
font setup, and representative screens. Prefer an existing Storybook/gallery
where it can render the complete sheet and receive live choices. Otherwise add
one isolated development-only entry using the project's existing framework and
build setup. Do not install a second UI library or generate another wizard.

Keep a compact `docs/usual-design/onboarding/showcase.md` coverage table:
source/export, variants/states, showcase section, and any reason unavailable.
Cover every discovered shared presentational component. Compose business views
with fixture props; never invoke authenticated services, production data, or
mutating actions. Record genuinely blocked components instead of imitating them.

The sheet should contain these sections when present in the project:

| Section | What to render from the actual project |
| --- | --- |
| Palette | Every semantic color family and foreground/background pair, with labels; status and interactive states, light and dark values |
| Typography | Every heading level, body size, label, caption, code and display role; actual family, size, weight, tracking and line height, including responsive roles |
| Actions | Every button/link variant and size; loading, disabled, icon-only, and destructive states |
| Forms | Input, textarea, select, checkbox, radio, switch, search, date/range controls; labels, help, validation, disabled and selected states |
| Surfaces | All card variants, density/padding options, dividers, borders, shadows, panels and an example content composition |
| Navigation/data | Tabs, breadcrumbs, menus, pagination, table/list, badges, avatars, progress, empty/loading/error states |
| Overlays | Open dialog, tooltip, popover and toast specimens with local mock actions; use the existing portal/theme boundary |
| Geometry | Actual spacing scale, stacked/inline gaps, layout density, control/card radii and elevations |

Render sections together in a responsive sheet with a small section index,
consistent gutters, source labels, and readable specimen sizes. Prefer 2–3
columns for component specimens on wide screens. Typography and palette can span
the sheet. Do not make a generic dashboard or scale the entire app into a tiny
frame. Do not invent components the project does not have.

## 2. Keep project rendering intact

Use the same font imports/loader and theme provider as the app. Local font files
must resolve from the project dev server. Retain existing licensed asset usage.
Use the app's real type classes and tokens, rather than approximating a whole
scale from one `headingSize`. Show native primitives only where the app uses them.

Keep this entry dev-only (for example, a framework-specific development route
with a production 404 guard, or a separate Vite HTML entry excluded from the
production build). Never expose it in production navigation. Use fixture data
and local callbacks. Read repository restrictions before starting its server.

The CLI never imports or executes these components. Start the project's normal
dev server on an available loopback port yourself. Reuse an existing compatible
server without killing unrelated processes. Inspect its output and fetch the
showcase route; an HTTP 200 is not visual verification. Honor project instructions
about whether browser testing is allowed.

## 3. Connect decisions to the actual system

Import the browser helper and register it in a client effect:

```tsx
import { useEffect, useState } from 'react';
import { connectShowcase, type ShowcaseState } from '@usualui/lint/dist/showcase.js';

export function Showcase() {
  const [view, setView] = useState<ShowcaseState | null>(null);
  useEffect(() => connectShowcase(setView), []);
  // Render the project's real theme provider + catalogue here.
  // view?.theme sets the provider's explicit theme, never the host OS preference.
  // view?.selections maps decision IDs to option IDs from proposal.json.
  // A missing selection means deferred: restore the project's original value.
  return <ProjectCatalogue view={view} />;
}
```

`ProjectCatalogue` above is a project-specific component to implement, not an
export from Usual Design. Use the exact decision and option IDs from the proposal.
The bridge sends only `{theme, selections, deferred, values}`. It sends no source
files, manifest, API session token, or executable code. `values` contains selected
literal preview slots; `selections` also supports full typography scales and
component variants that cannot be represented by those small slots.

Build **fixed option maps in showcase code** for every decision. For example,
`action.blue` might override the existing `--color-brand` and foreground pair,
while `corners.square` changes the existing card and control radius variables.
Map the project’s real CSS syntax: an HSL channel variable needs HSL channels,
not a hex string. A typography option sets its whole family/size/weight/leading
set. A component option changes real component props/imports in the catalogue.
For hardcoded utility variants, choose explicit existing class/prop combinations;
do not claim a CSS variable override affects a hardcoded class.

Apply overrides only inside the showcase document. Clear **all previous
choice overrides** before applying the current selection, including when a
category is deferred. Restore the original theme values on cleanup. Portal
containers must use the same theme. Dark selections never reuse guessed light
values: preserve the project's dark system or mark the option unavailable.
Only list supported themes in the proposal. Await asynchronous setup in the
bridge callback; throw on unsupported selections instead of silently ignoring
them. Returned cleanup removes listeners. Do not use `eval`, inject strings as
HTML, or fetch code from a message.

Add focused checks for the project-specific option mapping: every proposed
option maps to the correct values/variants, deferral restores originals, and
switching themes retains the real font/type scale. Run its normal typecheck/build.

## 4. Point the proposal at the showcase

Add to the proposal, **never the manifest** (replace with the actual port/path):

```json
"showcase": {
  "url": "http://127.0.0.1:5173/__usual/showcase",
  "title": "Project design system",
  "themes": ["light", "dark"]
}
```

Only HTTP `127.0.0.1`, `localhost`, or `[::1]` with an explicit port is accepted.
No credentials, query strings, fragments, or remote URLs. It must be a separate
origin from the wizard. The iframe has scripts and its own origin enabled so
real fonts and components work, but cannot navigate the parent, submit forms,
open popups, or download. Use local form callbacks without submission.

The wizard's CSP permits only the configured showcase origin. If the project
sends `X-Frame-Options` or `frame-ancestors`, allow the printed wizard origin only
on this development route; preserve production protections. Start the wizard on
a stable port if that makes its dev-only policy easier. Do not proxy the app into
the wizard's origin. The bridge verifies the parent window, origin, per-frame
channel, message shape, and increasing revision before invoking the callback.
The parent similarly verifies replies and times out when choices are unapplied.

Finish scaffold edits before `onboard --write` stamps the source snapshot. After
changing proposal URL or scaffold/source, refresh preparation and restart the
wizard. Keep both servers alive during review. Provide the user the wizard URL;
there is no extra manual setup step for them. Record both stop commands and
which dev-only files were added in the handoff.
