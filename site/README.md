# Usual Labs website

Static React + TypeScript + Tailwind v4 pages:

- `/` — Usual Labs and its first tool.
- `/design/` — Usual Design promise, three rule examples, and workflow.
- `/design/docs/` — local setup, manifest, repairs/activation, and coverage boundaries.

No account, tracking, external font, form, hosted API, or third-party assets are used. The site’s token values, typography, and layout are a concrete **provisional design proposal**, awaiting creative review. The preview banner and crawler exclusions deliberately preserve that state.

## Run and build

From the Usual Design package directory:

```sh
npm run dev:site
npx tsc --project site/tsconfig.json
npx vite build --config site/vite.config.ts
```

Build output: `dist/site`. Vite uses a multi-page build so each public path has its own HTML title/description. The intended deployment is at the root of `usual.dev`; deep paths are directories with `index.html` files. Use any static server that resolves those directory indexes. No runtime environment variables are required.

## Design proposal

Warm paper and surface neutrals, dark ink, brick accent, simple borders, and compact corner radii support a workshop/editorial direction. Large headings give the site an identity without illustrations or decorative motion. Tokens live in `src/style.css` under Tailwind v4 `@theme`.

Typography uses installed system fonts: Helvetica Neue/Arial or the OS sans-serif fallback, plus system monospace for code. No font files are redistributed or remotely fetched. The favicon is an original simple geometric SVG. Application code/assets use the repository’s MIT license.

Calculated token contrast: ink on paper 13.51:1, muted on paper 5.56:1, surface on accent 6.21:1, accent on paper 5.64:1, and muted on soft 5.02:1. These static color-pair calculations do not replace rendered accessibility review.

Shared components own Button, CodeBlock/copy feedback, layout/navigation, and section headings. Buttons have a fixed approved style; copy errors tell users to select text manually. Focus outlines and reduced-motion handling are present. Typecheck/build proof is separate from browser and visual approval.

## Dogfood contract

`usual.design.json` is a proposed site-specific contract created by inventorying the actual authored classes and tokens. It includes:

- Explicit allowed values/classes for colors, typography, spacing, and shape.
- Token source `src/style.css`.
- A semantic rule requiring accent/background contrast classes on primary-action links.
- A component rule requiring the shared Button, with its own implementation excluded from that replacement rule.
- No active categories initially; user design approval and fresh audit/activation evidence remain separate gates.

The contract is not a reusable universal preset. The agent-generated initial inventory is not a claim that every existing value has user approval. Use the actual CLI/wizard to record later decisions, repairs, and activation.

```sh
node dist/cli.js audit --root site --save
node dist/cli.js wizard --root site --port 0
node dist/cli.js check --root site --json
```

## Publication preparation

Hosting and DNS ownership have not been established. Before public release:

1. Review/approve the concrete site design and copy.
2. Verify public repository/package destinations; add links and install instructions only once real.
3. Complete the real dogfood activation/repair proof and approved browser review.
4. Replace preview metadata: remove `noindex,nofollow`, change `robots.txt`, add canonical URLs and a sitemap for the verified production hostname, and remove the development banner.
5. Build with `npx vite build --config site/vite.config.ts` and upload only `dist/site` through the selected hosting provider’s authorized release workflow.
6. Verify deployed routes, assets, content, and HTTPS independently. A local build is not deployment evidence.

No public preview/production URL exists as a verified result of this implementation. Prepare hosting-specific commands after inspecting the chosen provider. Keep the previous immutable static artifact for rollback, then restore it using that provider’s release mechanism if needed. There are no database migrations, server runtime, or application secrets for this static site.
