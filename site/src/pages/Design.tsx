import { useState } from 'react';
import { Button } from '../components/Button';
import { CodeBlock } from '../components/CodeBlock';
import { SectionHeading } from '../components/SectionHeading';

const examples = [
  {
    title: 'Approved values',
    before: '<div className="bg-fuchsia-500 p-7">\n  Project overview\n</div>',
    after: '<div className="bg-surface p-6">\n  Project overview\n</div>',
    explanation:
      'Use the colors and spacing approved by this project. A valid Tailwind class can still violate its design contract.',
  },
  {
    title: 'Semantic usage',
    before: '<a data-intent="primary"\n   className="bg-muted text-surface">\n  Get started\n</a>',
    after: '<a data-intent="primary"\n   className="bg-accent text-surface">\n  Get started\n</a>',
    explanation:
      'Both colors may be approved. An explicit semantic rule requires the action color for primary actions.',
  },
  {
    title: 'Shared components',
    before: '<button onClick={save}>\n  Save changes\n</button>',
    after:
      'import { Button } from "./ui/Button";\n\n<Button onClick={save}>\n  Save changes\n</Button>',
    explanation:
      'Require the approved component for a configured native element. Its own implementation can be explicitly excluded.',
  },
];

export function Design() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
          Usual Design · React + Tailwind v4
        </p>
        <h1 className="max-w-4xl text-display font-semibold tracking-tight">
          Keep the design.
          <br />
          Lose the drift.
        </h1>
        <p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted">
          Your project has design decisions. Give your coding agent a fast, deterministic way to
          follow them.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <a
            href="/design/docs/"
            data-intent="primary"
            className="inline-flex items-center gap-6 rounded-panel bg-accent px-5 py-3 font-medium text-surface hover:bg-accent-dark"
          >
            Start locally <span aria-hidden="true">→</span>
          </a>
          <a href="#checks" className="font-medium hover:text-accent">
            See what gets checked ↓
          </a>
        </div>
        <p className="mt-6 font-mono text-xs text-muted">
          Open source · Local operation · Your existing agent
        </p>
      </section>
      <section id="checks" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <SectionHeading
            eyebrow="Three kinds of rules"
            title="Decisions that survive the next prompt."
          >
            Start with your own design system. Usual checks approved values, explicit semantic
            intent, and shared component usage.
          </SectionHeading>
          <div className="mb-6 flex flex-wrap gap-3" aria-label="Example categories">
            {examples.map((item, index) => (
              <Button
                key={item.title}
                onClick={() => setSelected(index)}
                aria-pressed={selected === index}
              >
                {item.title}
                {selected === index ? ' ✓' : ''}
              </Button>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <CodeBlock label="Illustrative violation" code={example.before} />
            <CodeBlock label="Approved repair" code={example.after} />
          </div>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted" aria-live="polite">
            {example.explanation}
          </p>
          <p className="mt-3 text-sm text-muted">
            These examples explain the rules. The CLI reports findings from your actual files and
            manifest.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <SectionHeading
          eyebrow="A complete local workflow"
          title="Your agent does the work. You own the decisions."
        />
        <div className="grid gap-8 md:grid-cols-3">
          <div className="border-t border-line pt-5">
            <p className="font-mono text-xs text-accent">01 / DISCOVER & DECIDE</p>
            <h3 className="mt-4 text-xl font-medium">See the system you already have.</h3>
            <p className="mt-3 leading-relaxed text-muted">
              An agent skill inventories tokens and conventions. The local visual wizard lets you
              compare specimens and record intentional choices.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <p className="font-mono text-xs text-accent">02 / REPAIR & ACTIVATE</p>
            <h3 className="mt-4 text-xl font-medium">Take it one category at a time.</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Choose a repair batch. Your existing agent applies the saved plan. Activate a category
              after its audit is clean; keep deferred work documented.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <p className="font-mono text-xs text-accent">03 / CHECK & REPEAT</p>
            <h3 className="mt-4 text-xl font-medium">Keep feedback in the work.</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Run one CLI from an npm script, coding-agent hook, commit hook, or CI. Agents repair
              the application without relaxing the contract.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto mt-20 grid max-w-6xl gap-8 px-6 md:grid-cols-2">
        <div className="rounded-panel border border-line bg-soft p-8">
          <h2 className="text-2xl font-semibold tracking-tight">A pass has a precise meaning.</h2>
          <p className="mt-4 leading-relaxed text-muted">
            Only activated categories are enforced. Skipped categories—including new violations in
            them—stay unchecked until you resolve and activate them. The audit still makes that work
            visible.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            Passing means compliance with the configured rules and supported analysis. It does not
            establish visual quality, usability, or a distinctive brand.
          </p>
        </div>
        <div className="rounded-panel border border-line p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Local, by construction.</h2>
          <p className="mt-4 leading-relaxed text-muted">
            The checker reads your manifest and source files. No model call, account, or telemetry
            is required. Your existing agent handles analysis and repairs under its own settings.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            The wizard uses token specimens and source references. It does not import and execute
            arbitrary application components.
          </p>
          <a
            href="/design/docs/"
            className="mt-6 inline-block font-medium text-accent hover:underline"
          >
            Read the setup guide →
          </a>
        </div>
      </section>
    </>
  );
}
