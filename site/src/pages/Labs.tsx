import { SectionHeading } from '../components/SectionHeading';

export function Labs() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-end">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">
            An open-source software workshop
          </p>
          <h1 className="text-display font-semibold tracking-tight">
            Make good
            <br />
            work usual.
          </h1>
          <p className="mt-8 max-w-md text-xl leading-relaxed text-muted">
            Small, useful tools for the way software gets made. Built for people who care about the
            details, and the agents working beside them.
          </p>
        </div>
        <div className="border-l border-line pl-8 lg:mb-2">
          <p className="font-mono text-xs text-muted">THE FIRST TOOL / 001</p>
          <p className="mt-4 max-w-sm text-2xl font-medium leading-snug">
            Your agent moves fast.
            <br />
            Your design decisions should keep up.
          </p>
          <a
            href="/design/"
            className="mt-6 inline-flex items-center gap-3 font-medium text-accent hover:underline"
          >
            Meet Usual Design <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-8 flex items-center gap-3 font-mono text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-accent" />
              IN DEVELOPMENT
            </div>
            <h2 className="text-title font-semibold tracking-tight">Usual Design</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              A design linter for AI-heavy development. Turn your tokens, component conventions, and
              semantic rules into feedback an agent can actually use.
            </p>
            <a
              href="/design/"
              data-intent="primary"
              className="mt-8 inline-flex items-center gap-6 rounded-panel bg-accent px-5 py-3 font-medium text-surface hover:bg-accent-dark"
            >
              Explore the tool <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="rounded-panel border border-line bg-paper p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              The everyday feedback loop
            </p>
            <ol className="mt-6 space-y-6">
              <li className="flex gap-4">
                <span className="font-mono text-sm text-accent">01</span>
                <div>
                  <h3 className="font-medium">Make your decisions explicit.</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Your agent discovers the project. You choose the rules.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-sm text-accent">02</span>
                <div>
                  <h3 className="font-medium">Get a concrete failure.</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    A source location, the broken rule, and the expected result.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-sm text-accent">03</span>
                <div>
                  <h3 className="font-medium">Fix the code. Keep the decision.</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    One local check for developers, coding agents, hooks, and CI.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pt-20">
        <SectionHeading eyebrow="How we work" title="Useful. Understandable. Yours.">
          The best tools become part of the work. They should be easy to inspect, simple to run, and
          clear about what they can prove.
        </SectionHeading>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="border-t border-line pt-5">
            <h3 className="font-medium">Open by default</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Read the code, change a rule, and keep control. Our first tool is MIT-licensed.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <h3 className="font-medium">Close to the project</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Local files, explicit configuration, and familiar commands. Your code stays in your
              workflow.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <h3 className="font-medium">Built around real work</h3>
            <p className="mt-3 leading-relaxed text-muted">
              Starting with design drift, a problem we face while building with AI ourselves.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
