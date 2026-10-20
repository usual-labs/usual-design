import { CodeBlock } from '../components/CodeBlock';

const sections = [
  ['start', 'Install & initialize'],
  ['discover', 'Discover & decide'],
  ['repair', 'Repair & activate'],
  ['contract', 'The design contract'],
  ['feedback', 'Checks & integrations'],
  ['limits', 'Coverage & boundaries'],
] as const;

const manifest = `{
  "version": 1,
  "include": ["src/**/*.{js,jsx,ts,tsx}", "src/**/*.css"],
  "ignore": ["src/generated/**"],
  "tokens": ["src/style.css"],
  "active": [],
  "allowed": {
    "colors": { "classes": ["bg-surface", "bg-accent", "text-ink", "text-surface"] },
    "spacing": { "classes": ["p-4", "p-6", "gap-4"] }
  },
  "semantics": [{
    "id": "primary-action",
    "target": { "element": "a", "props": { "data-intent": "primary" } },
    "requireClasses": ["bg-accent", "text-surface"]
  }],
  "components": [{
    "id": "shared-button",
    "element": "button",
    "replacement": { "name": "Button", "from": "./ui/Button" },
    "ignore": ["src/ui/Button.tsx"]
  }]
}`;

export function Docs() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 pt-12 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <nav aria-label="Documentation sections" className="space-y-4 text-sm lg:sticky lg:top-8">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Local setup guide
          </p>
          {sections.map(([id, title]) => (
            <a key={id} href={`#${id}`} className="block hover:text-accent">
              {title}
            </a>
          ))}
        </nav>
      </aside>
      <article className="min-w-0 space-y-16 lg:col-span-3">
        <header>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">
            Usual Design / documentation
          </p>
          <h1 className="text-title font-semibold tracking-tight">
            From design decisions
            <br />
            to a dependable check.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Install @usualui/lint from npm and use your existing coding agent to turn project
            decisions into a contract you can check.
          </p>
        </header>
        <section id="start" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">1. Install and initialize</h2>
          <p className="leading-relaxed text-muted">
            Use Node.js 22.12 or newer. From your React/Tailwind v4 project, create the draft
            manifest with one command.
          </p>
          <CodeBlock code={'npx @usualui/lint init --write'} />
          <p className="leading-relaxed text-muted">
            Omit --write to preview without changing files. The draft leaves all categories inactive
            and never overwrites an existing manifest. Install the package locally for repeatable
            checks and agent hooks; one-off npx use does not add it to your dependencies.
          </p>
          <CodeBlock
            code={'npm install --save-dev @usualui/lint\nnpx --no-install usual-design --help'}
          />
        </section>
        <section id="discover" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">2. Discover and decide</h2>
          <p className="leading-relaxed text-muted">
            Start with the onboarding skill in your existing coding agent. It inventories the
            project, identifies token sources and shared components, and proposes explicit rules.
            Existing usage is evidence to review; it is not automatically approved.
          </p>
          <CodeBlock
            code={
              'npx --no-install usual-design audit --save\nnpx --no-install usual-design wizard --port 0'
            }
          />
          <p className="leading-relaxed text-muted">
            The initial audit can exit 1 while policy decisions and findings remain unresolved. Open
            the local URL printed by the wizard command. The wizard does not open a browser
            automatically. Use the --root option to target a different directory.
          </p>
          <div className="rounded-panel border border-line bg-soft p-5">
            <h3 className="font-medium">Have no design system yet?</h3>
            <p className="mt-2 leading-relaxed text-muted">
              Ask the agent to inventory existing values and recurring patterns first. Use the
              wizard’s specimens and source references to choose the roles and values you intend to
              keep. Several radii or colors can be intentional; consistency does not require one
              value everywhere.
            </p>
          </div>
        </section>
        <section id="repair" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            3. Select repairs, then activate
          </h2>
          <p className="leading-relaxed text-muted">
            The full audit groups findings into colors, typography, spacing/layout, shape/effects,
            components, and coverage/unresolved cases. Select a batch in the wizard and hand its
            saved plan to your existing agent. Decisions, findings, and deferred work remain in the
            project’s <code>docs/usual-design</code> folder.
          </p>
          <p className="leading-relaxed text-muted">
            The repair agent changes application code and reruns the audit. It must not broaden
            allowed values, edit exclusions, or weaken rules to get a pass. Re-audit before resuming
            old work so the plan reflects current source.
          </p>
          <CodeBlock
            code={
              'npx --no-install usual-design audit --save\nnpx --no-install usual-design activate --categories colors,components --write\nnpx --no-install usual-design check'
            }
          />
          <p className="leading-relaxed text-muted">
            Activation requires a fresh clean result for the selected categories. An inactive
            category is entirely unchecked by lint, even for new code. The full audit still reports
            its findings. Coverage is an audit group; unresolved analysis affecting an active
            category blocks its check.
          </p>
        </section>
        <section id="contract" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">4. Keep the contract explicit</h2>
          <p className="leading-relaxed text-muted">
            The project owns <code>usual.design.json</code>. Use optional sections as needed; begin
            with no active categories. The following is a small illustrative manifest, not a
            universal preset.
          </p>
          <CodeBlock label="usual.design.json" code={manifest} />
          <p className="leading-relaxed text-muted">
            Approved-value rules constrain each style category. Semantic rules match explicit
            elements or imported components and literal props. Component rules map configured native
            elements to an approved component. Give every semantic and component rule a stable,
            meaningful ID.
          </p>
          <p className="leading-relaxed text-muted">
            Declare coverage with <code>include</code> and narrow exclusions with{' '}
            <code>ignore</code>. Exceptions require a rule ID, file, and reason. Treat changes to
            these policy files as design changes requiring review.
          </p>
        </section>
        <section id="feedback" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">5. Put feedback in the workflow</h2>
          <p className="leading-relaxed text-muted">
            Use the same check in a local npm script, agent integration, optional commit hook, and
            CI. Codex and Claude Code integrations remain subject to their trust settings. A
            configured hook is not evidence that it ran.
          </p>
          <CodeBlock
            label="Preview integration setup"
            code={
              'npx --no-install usual-design setup --host both --hooks\nnpx --no-install usual-design setup --host both --hooks --write'
            }
          />
          <p className="leading-relaxed text-muted">
            Generated integrations require <code>@usualui/lint</code> installed as a local
            development dependency. Review the resulting package and lockfile changes. Native hooks
            use the installed CLI without downloading one.
          </p>
          <p className="leading-relaxed text-muted">
            A clean result exits 0. Policy or coverage failures exit 1. Configuration and
            operational failures exit 2. Structured output is suitable for agents; human output
            gives source locations and expected repairs.
          </p>
          <p className="leading-relaxed text-muted">
            Run the whole covered project for a consistent result. A working-tree commit check does
            not prove the staged snapshot is clean when files are partially staged. CI remains the
            independent check of committed code.
          </p>
        </section>
        <section id="limits" className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight">Know what a pass proves</h2>
          <ul className="list-disc space-y-3 pl-5 leading-relaxed text-muted">
            <li>
              Initial support targets React/Next.js, JavaScript/TypeScript, and Tailwind v4. Older
              or ambiguous Tailwind versions receive explicit compatibility feedback.
            </li>
            <li>
              Static literals and supported class helpers can be analyzed. Dynamic values that
              prevent checking active categories require an explicit resolution or a narrow,
              justified exception.
            </li>
            <li>
              Inline styles and custom CSS must remain in the configured coverage. An unsupported
              path is reported; the tool does not silently claim visual coverage.
            </li>
            <li>
              The wizard renders token specimens and source references. It does not automatically
              execute imported project components, start your application, or navigate it.
            </li>
            <li>
              The checker requires no account, hosted model, or telemetry. Your chosen agent has its
              own data-handling behavior.
            </li>
            <li>
              A pass establishes compliance with configured, active rules. Visual quality,
              accessibility, runtime layout, and brand distinctiveness need their own review.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
