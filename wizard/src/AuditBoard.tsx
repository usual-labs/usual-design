import { useEffect, useRef, useState } from 'react';
import { canActivate, describe, grouped, labels, toggleGroup } from './model';
import { categories, type Category, type Finding, type ProjectState } from './types';

function GroupCheckbox({
  findings,
  selected,
  disabled,
  toggle,
}: {
  findings: Finding[];
  selected: Set<string>;
  disabled: boolean;
  toggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const count = findings.filter((item) => selected.has(item.id)).length;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = count > 0 && count < findings.length;
  }, [count, findings.length]);
  return (
    <label className="selection-label">
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled || !findings.length}
        checked={findings.length > 0 && count === findings.length}
        onChange={toggle}
      />
      Select group{count > 0 ? ` (${count})` : ''}
    </label>
  );
}

function FindingRow({
  finding,
  selected,
  disabled,
  toggle,
}: {
  finding: Finding;
  selected: boolean;
  disabled: boolean;
  toggle: () => void;
}) {
  return (
    <li className="finding">
      {finding.kind === 'decision' ? (
        <span className="decision-marker" aria-hidden="true">
          ?
        </span>
      ) : (
        <input
          type="checkbox"
          checked={selected}
          disabled={disabled}
          onChange={toggle}
          aria-label={`Select ${finding.ruleId} at ${finding.file}:${finding.line}`}
        />
      )}
      <div className="finding-body">
        <div className="finding-heading">
          <span className={`kind kind-${finding.kind}`}>
            {finding.kind === 'coverage'
              ? 'Unresolved coverage'
              : finding.kind === 'decision'
                ? 'Decision needed'
                : 'Violation'}
          </span>
          <code>{finding.ruleId}</code>
        </div>
        <p>{finding.message}</p>
        <code className="source">
          {finding.file}:{finding.line}:{finding.column}
        </code>
        {finding.kind === 'decision' && (
          <p>
            <a href="#policy">Review this policy decision</a>
            <span className="muted"> · Policy changes require separate approval.</span>
          </p>
        )}
        {(finding.expected !== undefined ||
          finding.actual !== undefined ||
          finding.affectedCategories?.length) && (
          <details>
            <summary>Rule evidence</summary>
            {finding.actual !== undefined && (
              <p>
                <strong>Observed:</strong> <code>{describe(finding.actual)}</code>
              </p>
            )}
            {finding.expected !== undefined && (
              <p>
                <strong>Expected:</strong> <code>{describe(finding.expected)}</code>
              </p>
            )}
            {!!finding.affectedCategories?.length && (
              <p>
                <strong>Affects:</strong> {finding.affectedCategories.join(', ')}
              </p>
            )}
            <p className="muted">
              Finding ID: <code>{finding.id}</code>
            </p>
          </details>
        )}
      </div>
    </li>
  );
}

export function AuditBoard({
  state,
  pending,
  selected,
  setSelected,
  recheck,
  review,
  activate,
}: {
  state: ProjectState;
  pending: boolean;
  selected: Set<string>;
  setSelected: (value: Set<string>) => void;
  recheck: () => void;
  review: () => void;
  activate: (category: Category) => void;
}) {
  const [search, setSearch] = useState('');
  const [limits, setLimits] = useState<Partial<Record<Category, number>>>({});
  const audit = state.audit;
  const groups = grouped(audit?.findings ?? []);
  const stale = !!audit && audit.manifestHash !== state.manifestHash;
  const query = search.trim().toLowerCase();
  const active: readonly string[] = state.manifest?.active ?? audit?.active ?? [];
  const inactive = categories.filter(
    (category) => category !== 'coverage' && !active.includes(category),
  );

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <section className="panel" aria-labelledby="audit-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 · Choose what to resolve</p>
          <h2 id="audit-title">Full project audit</h2>
        </div>
        <button className="secondary" disabled={pending || !state.manifest} onClick={recheck}>
          {pending ? 'Working…' : audit ? 'Run fresh audit' : 'Run first audit'}
        </button>
      </div>
      <p>
        The audit examines every category. Lint only enforces activated categories. Selecting a
        repair does not activate or weaken a rule.
      </p>
      <div className="coverage-banner">
        <strong>{active.length} of 5 categories active</strong>
        <span>
          {inactive.length
            ? `Not checked by lint: ${inactive.map((category) => labels[category]).join(', ')}.`
            : 'All five policy categories are enforced.'}
        </span>
      </div>
      {!state.manifest && (
        <div className="callout">
          Save an approved manifest above to audit against your design rules.
        </div>
      )}
      {stale && (
        <div className="callout warning" role="status">
          The policy has changed since this audit. Run a fresh audit before selecting repairs or
          activating a category.
        </div>
      )}
      {!!audit?.errors.length && (
        <div className="callout warning">
          <strong>The audit is incomplete.</strong>
          <ul>
            {audit.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p>Resolve these errors and recheck before activation.</p>
        </div>
      )}
      {audit && (
        <>
          <div className="audit-toolbar">
            <label htmlFor="finding-search">
              Search findings
              <input
                id="finding-search"
                type="search"
                placeholder="File, rule, or message"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <span className="muted">
              {audit.files.length} files · {audit.findings.length} findings
            </span>
          </div>
          <p className="muted">
            Group selection includes all findings in that group, even when search hides some.
          </p>
          <div className="audit-groups">
            {categories.map((category) => {
              const findings = groups[category];
              const repairable = findings.filter((item) => item.kind !== 'decision');
              const filtered = findings.filter(
                (item) =>
                  !query ||
                  `${item.message} ${item.file} ${item.ruleId}`.toLowerCase().includes(query),
              );
              const limit = limits[category] ?? 40;
              const violations = findings.filter((item) => item.kind === 'violation').length;
              const unresolved = findings.filter((item) => item.kind === 'coverage').length;
              const decisions = findings.filter((item) => item.kind === 'decision').length;
              return (
                <section
                  key={category}
                  className="audit-group"
                  aria-labelledby={`group-${category}`}
                >
                  <div className="group-heading">
                    <div>
                      <h3 id={`group-${category}`}>{labels[category]}</h3>
                      <p>
                        {violations} violations · {unresolved} unresolved · {decisions} decisions
                      </p>
                    </div>
                    <span className={`pill ${active.includes(category) ? 'success' : ''}`}>
                      {category === 'coverage'
                        ? 'Analysis evidence'
                        : active.includes(category)
                          ? 'Active in lint'
                          : 'Inactive in lint'}
                    </span>
                  </div>
                  <div className="group-controls">
                    <GroupCheckbox
                      findings={repairable}
                      selected={selected}
                      disabled={pending || stale}
                      toggle={() => setSelected(toggleGroup(selected, repairable))}
                    />
                    {category !== 'coverage' && !active.includes(category) && (
                      <button
                        className="secondary small"
                        disabled={pending || !canActivate(category, audit, state.manifestHash)}
                        onClick={() => activate(category)}
                      >
                        Activate category
                      </button>
                    )}
                  </div>
                  {filtered.length > 0 ? (
                    <ul className="finding-list">
                      {filtered.slice(0, limit).map((finding) => (
                        <FindingRow
                          key={finding.id}
                          finding={finding}
                          selected={selected.has(finding.id)}
                          disabled={pending || stale}
                          toggle={() => toggleOne(finding.id)}
                        />
                      ))}
                    </ul>
                  ) : (
                    <p className="empty compact">
                      {findings.length
                        ? 'No findings match this search.'
                        : category === 'coverage'
                          ? 'No unresolved coverage findings.'
                          : 'No findings under the current configured rules.'}
                    </p>
                  )}
                  {filtered.length > limit && (
                    <button
                      className="secondary small"
                      onClick={() => setLimits({ ...limits, [category]: limit + 100 })}
                    >
                      Show next {Math.min(100, filtered.length - limit)} findings
                    </button>
                  )}
                  {category !== 'coverage' &&
                    !active.includes(category) &&
                    !canActivate(category, audit, state.manifestHash) && (
                      <p className="muted small-text">
                        Resolve this category’s findings and any related coverage errors, then run a
                        fresh audit to activate it.
                      </p>
                    )}
                </section>
              );
            })}
          </div>
          <div className="actions repair-actions">
            <span>
              {selected.size} selected · {audit.findings.length - selected.size} deferred
            </span>
            <button
              disabled={pending || stale || !!audit.errors.length || !selected.size}
              onClick={review}
            >
              Review repair batch
            </button>
            {selected.size > 0 && (
              <button
                className="secondary"
                disabled={pending}
                onClick={() => setSelected(new Set())}
              >
                Clear selection
              </button>
            )}
          </div>
          <p className="muted">
            Deferred findings remain in the project audit records. Reopen this wizard and run a
            fresh audit to resume them. Source changes since this scan are checked again by the
            server before a repair plan or activation is saved.
          </p>
        </>
      )}
    </section>
  );
}
