import type { ReactNode } from 'react';

export function Layout({
  children,
  page,
}: {
  children: ReactNode;
  page: 'labs' | 'design' | 'docs';
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-surface focus:p-4"
      >
        Skip to content
      </a>
      <div className="border-b border-line bg-soft px-6 py-2 text-center text-xs text-muted">
        Development preview · local build · visual direction awaiting review
      </div>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-6 py-6">
        <a
          href="/"
          className="flex items-center gap-3 text-xl font-semibold tracking-tight"
          aria-label="Usual Labs home"
        >
          <svg
            width="27"
            height="27"
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="text-accent"
          >
            <path fill="currentColor" d="M2 2h8v22h20v6H2zM18 2h12v16H18z" />
          </svg>
          usual<span className="font-normal text-muted">labs</span>
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm">
          <a
            href="/design/"
            aria-current={page === 'design' ? 'page' : undefined}
            className="hover:text-accent"
          >
            Usual Design
          </a>
          <a
            href="/design/docs/"
            aria-current={page === 'docs' ? 'page' : undefined}
            className="hover:text-accent"
          >
            Documentation <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="mx-auto mt-24 flex max-w-6xl flex-wrap justify-between gap-6 border-t border-line px-6 py-8 text-sm text-muted">
        <div>
          <a href="/" className="font-medium text-ink">
            Usual Labs
          </a>
          <p className="mt-2">Tools for the everyday craft.</p>
        </div>
        <div className="flex gap-6">
          <a className="hover:text-accent" href="/design/docs/">
            Local setup
          </a>
          <span>Open source · MIT</span>
        </div>
      </footer>
    </>
  );
}
