# Design-system foundations for guided onboarding

Researched: 2026-10-20. Scope: established design-system conventions and their
application to Usual Design's agent-assisted onboarding. Sources below are
official documentation, specifications, and first-party implementation guides.
This document recommends product behavior; it is not evidence that every
recommendation is implemented or that an application passes accessibility checks.

## Recommendation

Keep the existing five enforcement categories: **colors, typography, spacing,
shape, and components**. Organize onboarding around meaningful decisions within
those categories, preserving each project's existing names, scales, modes, and
shared components. Define a small shared vocabulary for the wizard, not a required
universal token catalog.

Keep three separate artifacts:

1. **Discovery evidence:** what the analyzer and agent observed, including
   locations, counts, unknowns, and contradictory examples.
2. **Onboarding proposal:** recommendations, alternatives, reasons, preview data,
   and the user's pending choices.
3. **Manifest:** approved coverage, token references, allowed values, semantic
   rules, component rules, and activation settings.

The proposal can be rich. The manifest should remain a compact, enforceable
contract, with no repeated file inventory or explanations of every decision.
This separation is a Usual Design architecture recommendation, not a format
prescribed by the systems below.

## What established systems teach us

| Source | Verified convention | Adaptation for Usual Design |
| --- | --- | --- |
| Material's first-party web theming guides | Color roles map to components and pair surface colors with content colors. Typography combines family, size, line height, and weight into purposeful styles. [1][2] | Review color pairs and complete type styles. Avoid picking a foreground or font size independently of its context. |
| Atlassian Design System | Color names communicate property, semantic role, emphasis, and interaction state. Brand, danger, information, and neutral are purposes; interchangeable decorative accents have a different meaning. [3] | Recommend from source usage and token meaning. Preserve states and do not map every blue value to the brand role. |
| Carbon | Roles remain stable across themes while values change. Core roles and component-specific tokens have different scopes. Spacing uses a finite scale for both internal and layout relationships. [4][5] | Preserve aliases and mode variants. Keep component-specific exceptions local. Review a spacing scale and its uses rather than one universal gap. |
| Radix Themes | An accent scale has different values for surfaces, interaction, borders, solid fills, and text. Radius depends on component context; a fully rounded button does not imply a fully rounded checkbox. [6][7] | Similar colors or radii can be intentional. Offer coherent choices without collapsing structural differences. |
| shadcn/ui | Semantic background/foreground pairs map through CSS variables to Tailwind utilities. Dark mode overrides those variables. The official theme tool previews choices before generating configuration. [8] | Prefer existing semantic variables and utilities; give choices an immediate effect on a maintained reference screen. |
| Design Tokens Community Group | The format supports typed values, references, groups, and composite tokens. Groups are organizational and must not imply a token's meaning or type; tools should preserve references. [9] | Borrow explicit typing and alias-preservation principles. Do not treat folder/group names as proof of semantics or present our policy manifest as a DTCG token file. |

These sources do not agree on a single required naming scheme or complete list of
roles. The product should not copy an entire Material, Carbon, or Atlassian
catalog into every project.

## A small onboarding vocabulary

The following is a product recommendation. A role identifies a decision in the
wizard; it does not mandate renaming the application's tokens or components.
Only present a role when source evidence or the user's stated goal warrants it.

| Category | Useful starting decisions | Expand when the project needs it |
| --- | --- | --- |
| Colors | Primary action and its foreground; page/card surface and its foreground; muted content; border; focus | Secondary action, overlays, semantic success/warning/danger/information, inverse surfaces, chart palettes, additional brands |
| Typography | Body, heading, label; font families; sizes with their line heights and weights | Caption, code, display styles, responsive styles, reading versus application contexts |
| Spacing | Existing finite scale, control padding, content gaps, section spacing | Dense/comfortable variants, responsive layouts, grid gutters |
| Shape | Control and card radii, border treatment, shadow/elevation conventions | Overlays, pill controls, nested radii, special component anatomy |
| Components | Authoritative shared button, input, card, and other components actually used; import paths and supported variants | Native element replacement rules and banned imports only where the intended replacement is established |

For example, the wizard's **Primary action** can refer to a project's
`--color-brand-600` and `bg-brand-600`. **Primary action hover** can refer to
`--color-brand-700` and `hover:bg-brand-700`. No new token named `primary` is
necessary if those identities already express the project's chosen convention.

Component roles differ from token roles: component decisions must record actual
import identity and relevant props. An attractive sample button does not establish
which application button implementation is authoritative.

## Evidence and recommendations

Use existing documented conventions and shared component definitions first,
representative usage second, and frequency or visual similarity as supporting
signals. This is a recommendation for the agent's reasoning, not a deterministic
proof of design intent.

For each decision, provide:

- A plain-language question and category.
- One recommended option, its reason, and the uncertainty that remains.
- A small set of meaningful alternatives, each with source references.
- The existing token/class/component identities behind the option.
- Supported preview values, with unresolved values marked as unavailable.
- The exact manifest changes that approval would make.

For five nearby blues, inspect where they appear: main actions, hover/pressed
states, muted fills, borders, links, or dark mode. Radix intentionally assigns
different scale steps to several such purposes, and Atlassian names interaction
states explicitly. Color distance alone cannot choose the primary token. [3][6]

Do not automatically approve every observed value. Discovery describes today's
code, including drift. A recommendation should identify what to keep, what to
repair, and what cannot yet be determined.

## Wizard journey

Use a maintained wizard driven by proposal data. The agent should not generate a
new application or run project components to construct each preview.

1. **Project summary.** Show the project, supported stack, coverage scope, existing
   token sources, recognized themes, and unresolved evidence. Explain that the
   next steps choose policy and do not rewrite the application.
2. **Colors.** Review surfaces, text, actions, and feedback pairs. Show relevant
   light/dark or other existing theme variants, with interaction states kept
   distinct.
3. **Typography.** Review complete type roles in a heading, paragraph, label,
   helper text, and button sample. Show when the local preview cannot load the
   actual font.
4. **Spacing.** Compare the project's scales and typical layout uses on the same
   screen. Keep valid responsive/fluid layout constructs separate from fixed
   spacing decisions.
5. **Shape.** Update the same controls and panels with proposed radii, borders,
   and shadows. Preserve meaningful differences between component types.
6. **Components.** Review existing identities, supported variants, and source
   references. Use examples to explain usage; do not claim that reference
   specimens are renders of the user's actual components.
7. **Review and save.** Summarize chosen policy, skipped categories, unresolved
   decisions, and the target manifest path. Allow direct changes to prior
   choices. Require explicit approval before saving.
8. **Repair handoff.** Present current findings, let the user choose a cleanup
   scope, then produce an agent prompt referencing the saved contract and repair
   plan. Activation follows fresh successful checks.

GOV.UK recommends focused questions, explanations for why information is needed,
back navigation, and preserving previous answers. Its review pattern gives
users a final opportunity to change answers and clearly identifies the final
submission action. Those principles support this journey; the precise category
order above is Usual Design's choice, not a tested external standard. [10][11]

Each category needs a visible **defer** option. Deferring is not approval and must
not count as clean coverage. For an already-active category, a new onboarding
session must not silently deactivate it.

## Preview, themes, and accessibility

Use one coherent reference screen containing navigation, a heading, body copy, a
card, primary/secondary actions, a form control, and feedback. Selection changes
its values immediately. Keep all specimen styles scoped so proposal values
cannot change the surrounding wizard.

Preserve foreground/background pairs and theme context. Carbon's role/value
distinction and shadcn's mode-specific variable overrides show why an alias should
remain stable even when its rendered value changes. Do not flatten a dark token
into a light literal or deduplicate equal values whose roles differ. [4][8]

Check contrast only when both colors can be resolved and their compositing context
is known. WCAG's text criterion generally requires 4.5:1, with 3:1 for qualifying
large text and specific exceptions. A sample ratio is not proof that every
application screen is accessible. Unresolved CSS variables, transparency, gradients,
and unavailable fonts must not produce a false pass. [12]

Keep preview input constrained to supported values; never execute source modules,
arbitrary CSS, scripts, imports, or remote resources for a more faithful sample.
This is an existing project trust boundary, independent of design-system style
guidance.

## Existing systems and projects without tokens

**Existing system:** retain its variable names, aliases, modes, component imports,
and scale structure. Recommend explicit mappings from the wizard vocabulary to
those identities. Flag conflicting usage instead of replacing the system with a
generic preset.

**No established token system:** distinguish observed values from proposed design
decisions. Offer a small convention derived from representative code and the
user's choices. Permit an initial contract using approved existing classes or
literal values where supported. Creating a token stylesheet and migrating usages
belongs in the approved repair plan; do not quietly generate application CSS
during wizard review.

**Incomplete evidence:** show what requires source review or a project decision.
Allow deferred categories. Never compensate by automatically allowing every value,
excluding difficult files, or declaring the project consistent.

## Implementation acceptance

These checks follow the product's authority boundaries rather than any external
system's implementation:

- A user can accept recommendations, choose alternatives, or defer by category.
- Choice changes update the reference preview and the proposed enforcement rules.
- Approval produces a schema-valid manifest with no inventory/proposal bloat.
- Existing active policy and unrelated manifest fields survive onboarding.
- Source changes invalidate stale proposals before their policy can be saved.
- Role labels correspond to enforceable rules where enforcement is claimed.
- Existing tokens and tokenless fixture projects both reach a repair handoff.
- A saved manifest is distinguished from completed repairs and active coverage.
- Automated component/API proof is distinguished from actual browser validation.

## Sources

All sources were read on 2026-10-20. Material's primary website required JavaScript
for full content, so its first-party `material-web` documentation supplies the
detailed color and typography evidence. No product browser test was performed.

[1]: https://github.com/material-components/material-web/blob/main/docs/theming/color.md
[2]: https://github.com/material-components/material-web/blob/main/docs/theming/typography.md
[3]: https://atlassian.design/foundations/color
[4]: https://www.carbondesignsystem.com/building-blocks/foundations/color/overview
[5]: https://www.carbondesignsystem.com/building-blocks/foundations/spacing/overview
[6]: https://www.radix-ui.com/themes/docs/theme/color
[7]: https://www.radix-ui.com/themes/docs/theme/radius
[8]: https://ui.shadcn.com/docs/theming
[9]: https://www.designtokens.org/tr/2025.10/format/
[10]: https://design-system.service.gov.uk/patterns/question-pages/
[11]: https://design-system.service.gov.uk/patterns/check-answers/
[12]: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
