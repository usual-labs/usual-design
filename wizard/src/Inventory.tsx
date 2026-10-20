import { useState, type CSSProperties } from 'react';
import { labels, safeBorder, safeColor, safeLength, safePreviewUrl, safeShadow } from './model';
import type { Inventory as InventoryData, ObservedValue, Token } from './types';

function Specimen({ token }: { token: Token }) {
  const color = safeColor(token.value);
  const length = safeLength(token.value);
  const border = /border/i.test(token.name) ? safeBorder(token.value) : null;
  const shadow = /shadow/i.test(token.name) ? safeShadow(token.value) : null;
  const styles: CSSProperties = {};
  let label = 'Source value';
  if (color) {
    styles.backgroundColor = color;
    label = 'Color sample';
  } else if (length && /radius|rounded/i.test(token.name)) {
    styles.borderRadius = length;
    label = 'Corner sample';
  } else if (length && /(?:text|font-size)/i.test(token.name)) {
    styles.fontSize = length;
    label = 'Type sample';
  } else if (length && /spacing|gap|padding|space/i.test(token.name)) {
    styles.width = length;
    styles.minWidth = '2px';
    styles.backgroundColor = 'var(--accent)';
    label = 'Spacing sample';
  } else if (border) {
    styles.border = border;
    label = 'Border sample';
  } else if (shadow) {
    styles.boxShadow = shadow;
    label = 'Shadow sample';
  }
  return (
    <div className="specimen" aria-label={label}>
      <span
        className={`specimen-object ${color ? 'swatch' : ''}`}
        style={styles}
        aria-hidden="true"
      >
        {label === 'Type sample'
          ? 'Ag'
          : color || label === 'Spacing sample'
            ? ''
            : ['Corner sample', 'Border sample', 'Shadow sample'].includes(label)
              ? 'Aa'
              : '—'}
      </span>
      <span className="specimen-label">{label}</span>
    </div>
  );
}

export function Inventory({
  inventory,
  preview,
  disabled = false,
  onApproveCandidate,
}: {
  inventory?: InventoryData;
  preview?: string;
  disabled?: boolean;
  onApproveCandidate?: (candidate: ObservedValue) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState(false);
  const tokens = (inventory?.tokens ?? []).filter(
    (token) => typeof token.name === 'string' && typeof token.value === 'string',
  );
  const visible = expanded ? tokens : tokens.slice(0, 24);
  const previewUrl = safePreviewUrl(preview);
  const components = inventory?.components ?? [];
  const warnings = Array.isArray(inventory?.warnings)
    ? inventory.warnings.filter((value): value is string => typeof value === 'string')
    : [];
  const candidates = (inventory?.candidates ?? []).filter(
    (candidate) => typeof candidate.name === 'string' && typeof candidate.value === 'string',
  );
  const candidateCategories = ['colors', 'typography', 'spacing', 'shape'] as const;
  return (
    <section className="panel" aria-labelledby="inventory-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 · Understand the system</p>
          <h2 id="inventory-title">What is already here</h2>
        </div>
        <span className="pill">{tokens.length} discovered tokens</span>
      </div>
      <p>
        These are observed values, not approved rules. Multiple sizes or corners can be intentional.
        Choose the roles that belong in your project.
      </p>
      <p className="muted">
        Samples use built-in controls and safe literal values. Fonts and values that need
        application context fall back to their source representation.
      </p>
      {!!warnings.length && (
        <div className="callout warning">
          <strong>Discovery needs attention</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {tokens.length ? (
        <div className="token-grid">
          {visible.map((token, index) => (
            <article
              className="token-card"
              key={`${token.file}:${token.line}:${token.name}:${index}`}
            >
              <Specimen token={token} />
              <h3>
                <code>{token.name}</code>
              </h3>
              <code className="token-value">{token.value}</code>
              <small className="source">
                {token.file}:{token.line}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          No supported token declarations were discovered. Review the observed styles below to
          establish intentional rules; your agent can help turn those decisions into shared tokens.
        </div>
      )}
      {tokens.length > 24 && (
        <button className="secondary" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show fewer tokens' : `Show all ${tokens.length} tokens`}
        </button>
      )}
      {candidates.length > 0 && (
        <div className="observed-values">
          <h3>Styles observed in your code</h3>
          <p>
            Choose the values that belong in your design. You can keep multiple intentional roles.
            Adding a value edits the draft only; it does not save policy or activate lint.
          </p>
          <p className="muted">
            Frequency is evidence, not a recommendation. Named utilities without a known literal
            value show source text instead of an invented preview.
          </p>
          {candidateCategories.map((category) => {
            const group = candidates.filter((candidate) => candidate.category === category);
            const visibleCandidates = expandedCandidates ? group : group.slice(0, 12);
            if (!group.length) return null;
            return (
              <section
                key={category}
                className="observed-category"
                aria-labelledby={`observed-${category}`}
              >
                <h4 id={`observed-${category}`}>
                  {labels[category]} <span className="muted">({group.length} choices)</span>
                </h4>
                <div className="token-grid">
                  {visibleCandidates.map((candidate, index) => (
                    <article
                      className="token-card"
                      key={`${category}:${candidate.kind}:${candidate.name}:${index}`}
                    >
                      <Specimen token={candidate} />
                      <h3>
                        <code>{candidate.name}</code>
                      </h3>
                      <code className="token-value">{candidate.value}</code>
                      <small className="source">
                        {candidate.file}:{candidate.line}
                      </small>
                      <p className="muted">
                        {candidate.count} observed {candidate.count === 1 ? 'use' : 'uses'} ·{' '}
                        {candidate.kind === 'class' ? 'Tailwind class' : 'Style declaration'}
                      </p>
                      {onApproveCandidate && (
                        <button
                          className="secondary small"
                          disabled={disabled}
                          onClick={() => onApproveCandidate(candidate)}
                          aria-label={`Add ${candidate.name} to ${labels[category]} draft`}
                        >
                          Add to draft
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          {candidateCategories.some(
            (category) =>
              candidates.filter((candidate) => candidate.category === category).length > 12,
          ) && (
            <button
              className="secondary"
              onClick={() => setExpandedCandidates(!expandedCandidates)}
            >
              {expandedCandidates
                ? 'Show fewer observed values'
                : `Show all ${candidates.length} observed values`}
            </button>
          )}
        </div>
      )}
      {components.length > 0 && (
        <details className="disclosure" open>
          <summary>Component catalog ({components.length})</summary>
          <p>
            Review the import identities and source evidence with your agent before configuring
            replacement rules.
          </p>
          <div className="component-catalog">
            {components.map((component, index) => (
              <article
                className="component-card"
                key={`${component.from ?? ''}:${component.name}:${index}`}
              >
                <h3>
                  <code>{component.name}</code>
                </h3>
                <dl>
                  <dt>Export identity</dt>
                  <dd>
                    <code>{component.exportName ?? 'Unresolved'}</code>
                  </dd>
                  <dt>Import source</dt>
                  <dd>
                    <code>{component.from ?? 'Import identity unresolved'}</code>
                  </dd>
                  <dt>Observed usage</dt>
                  <dd>
                    {typeof component.count === 'number'
                      ? `${component.count} ${component.count === 1 ? 'use' : 'uses'}`
                      : 'Usage count unavailable'}
                  </dd>
                </dl>
                <h4>Source evidence</h4>
                <ul className="component-locations">
                  {component.locations?.length ? (
                    component.locations.map((location, locationIndex) => (
                      <li key={`${location.file}:${location.line}:${locationIndex}`}>
                        <code>
                          {location.file}:{location.line}
                        </code>
                      </li>
                    ))
                  ) : (
                    <li>
                      <code>{component.file}</code>
                      <span className="muted"> · Exact line unavailable</span>
                    </li>
                  )}
                </ul>
              </article>
            ))}
          </div>
        </details>
      )}
      {previewUrl && (
        <p>
          <a href={previewUrl} target="_blank" rel="noreferrer noopener">
            Open your existing component preview ↗
          </a>
          <span className="muted"> · Opens your user-run preview separately.</span>
        </p>
      )}
    </section>
  );
}
