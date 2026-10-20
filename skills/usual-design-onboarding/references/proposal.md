# Proposal format and design roles

The installed `schema/onboarding.schema.json` is authoritative. A proposal is
unapproved wizard data. The resulting manifest still uses schema version 1;
it is a policy file, not a DTCG token document.

## Standard categories

| Category | Start with | Preserve where present |
| --- | --- | --- |
| colors | Primary action + foreground, surface + foreground, muted text, border, focus | Secondary actions, feedback pairs, hover/pressed/disabled states, themes |
| typography | Body, heading, label; families, sizes, line heights, weights | Caption/code, responsive type, full role combinations |
| spacing | Finite spacing scale, control padding, content gaps, section spacing | Responsive layout, dense/comfortable variants |
| shape | Control/card radii, borders, shadows | Overlay elevation, pill controls, component-specific anatomy |
| components | Actual shared button/input/card import identities | Supported variants and intentional native primitives |

These are decision prompts, not required tokens or forced names. Map `primary`
to the project's `--color-brand-600` when appropriate. Keep aliases and theme
overrides. Similar blues may be valid action, hover, border, or dark values.
For a tokenless project, propose intentional existing classes/literals first;
token creation and application migration belong in an approved repair scope.

The role model draws on [Material](https://github.com/material-components/material-web/blob/main/docs/theming/color.md),
[Atlassian](https://atlassian.design/foundations/color),
[Carbon](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview),
[Radix](https://www.radix-ui.com/themes/docs/theme/color), and
[shadcn/ui](https://ui.shadcn.com/docs/theming).
[DTCG](https://www.designtokens.org/tr/2025.10/format/) distinguishes typed tokens,
groups, and references; group names alone do not establish semantics.

## Structure

- `version: 1`, `title`, `summary`, `scope`, and `decisions` are required.
- `scope`: manifest-compatible `include` and optional `ignore` and `tokens`.
  Include actual application roots. Document exclusions in `notes`. Tokens are
  existing CSS file paths, not token values or an inventory.
- `showcase`: optional project-owned loopback page with `url`, `title`, and
  supported `themes`. New onboarding should prepare this using the
  [showcase guide](showcase.md). It never enters the manifest.
- `notes`: optional unresolved evidence, unsupported features, themes, and scope
  rationale. Keep these honest; they do not change lint policy.
- Each decision: stable `id`, `category`, `role`, `title`, `description`,
  `recommended` option ID, and `options`.
- Each option: stable `id`, `label`, `explanation`, `evidence`, `rules`, optional
  `preview`. Evidence is at least one `{file, line}` in covered or token/imported
  source; lines are one-based and verified when preparing.
- IDs and roles use lowercase letters, digits, and hyphens; start with a letter.
- At most 60 decisions and 12 options per decision. Keep choices focused.

`rules` contains only manifest `allowed`, `semantics`, `components`, or `imports`.
Each option needs an effective constraint. Allowed rules and semantic constraints
must belong to the decision's category. Split constraints across categories:
`requireProps` belongs to components, while required color classes belong to
colors. Component/import rules belong to components. Rule IDs must be unique
across the selected options. Empty sections are omitted from the output.

All decisions in a category combine into its policy. Allowed lists merge and
deduplicate; semantic/component/import rules accumulate. Options are alternatives
within a decision. Deferring a category omits all its decisions and previews.
Do not offer contradictory rules across different decisions.

The UI displays exact rule fragments under each option and the entire manifest
before saving. Explain the practical effect in ordinary language as well.
Only actual enforceable rules belong in `rules`; role labels alone enforce nothing.

## Live preview

Use the project showcase for actual fonts, full type scales, component variants,
and interactive states. The bridge sends selected option IDs and theme; the
project maps them to its real system. The slots below provide a compatibility
reference sheet for older proposals and optional literal values for the bridge.

`preview.light` and optional `preview.dark` accept these literal string slots:

| Category | Slots |
| --- | --- |
| colors | `primary`, `onPrimary`, `surface`, `onSurface`, `muted`, `border`, `focus` |
| typography | `bodySize`, `headingSize`, `lineHeight`, `fontFamily` |
| spacing | `gap`, `padding` |
| shape | `controlRadius`, `cardRadius` |
| components | None; show real import rules and explain variants |

One decision owns each preview slot. Put associated pairs together. Values must
be resolved from the proposed option and theme. Never substitute a guessed color
for an unresolved alias. Missing/unsupported values are explicitly shown as
neutral reference defaults. Dark values do not fall back to light values.

The preview accepts bounded literal colors, lengths (`px`, `rem`, `em`, or `0`),
unitless line height 1–2, and system font families (`system-ui`, `sans-serif`,
`serif`, `monospace`). Custom fonts, unresolved `var()`, CSS expressions, URLs,
remote assets, and project components are not loaded into the reference sheet.
The separate project showcase uses its own runtime and assets. The original token names
and type rules still belong in the policy even if a preview cannot render them.
States and roles beyond these sample slots remain enforceable through the rules.

## Small example

This illustrates two decisions; extend it from real project evidence rather than
using it as a universal system. Replace source paths and values before preparing.

```json
{
  "version": 1,
  "title": "Everyday studio",
  "summary": "Keep the existing blue action and soft card corners.",
  "scope": { "include": ["src/**/*.{tsx,ts,css}"] },
  "notes": ["Typography, spacing, and components need further source review."],
  "decisions": [
    {
      "id": "action",
      "category": "colors",
      "role": "primary",
      "title": "Primary action",
      "description": "Keep the action and foreground together.",
      "recommended": "blue",
      "options": [
        {
          "id": "blue",
          "label": "Existing brand blue",
          "explanation": "Used by the shared primary action; retains its foreground.",
          "evidence": [{ "file": "src/App.tsx", "line": 1 }],
          "rules": {
            "allowed": { "colors": { "classes": ["bg-blue-600", "text-white", "hover:bg-blue-700"] } },
            "semantics": [{
              "id": "primary-action",
              "target": { "element": "a", "props": { "data-intent": "primary" } },
              "requireClasses": ["bg-blue-600", "text-white"]
            }]
          },
          "preview": {
            "light": { "primary": "#2563eb", "onPrimary": "#ffffff" },
            "dark": { "primary": "#2563eb", "onPrimary": "#ffffff" }
          }
        }
      ]
    },
    {
      "id": "corners",
      "category": "shape",
      "role": "card",
      "title": "Card corners",
      "description": "Choose a radius for cards, preserving a separate control radius.",
      "recommended": "soft",
      "options": [
        {
          "id": "soft",
          "label": "Soft corners",
          "explanation": "Matches the existing dashboard cards.",
          "evidence": [{ "file": "src/App.tsx", "line": 1 }],
          "rules": { "allowed": { "shape": { "classes": ["rounded-xl", "rounded-md"] } } },
          "preview": {
            "light": { "cardRadius": "12px", "controlRadius": "6px" },
            "dark": { "cardRadius": "12px", "controlRadius": "6px" }
          }
        }
      ]
    }
  ]
}
```

Run `onboard --proposal ...` for validation, then add `--write` to prepare the
session. Preparation stamps the current source snapshot and manifest hash itself.
Agent-supplied hashes are not accepted. To refresh stale source evidence, update
the proposal then rerun `onboard --write`; it archives the previous session and
resets recommendations. Repeating an unchanged preparation preserves progress.
The existing manifest is never written by preparation.
