import { grouped, labels } from './model';
import { categories, type Audit } from './types';

export function DraftImpact({ audit }: { audit: Audit }) {
  const groups = grouped(audit.findings);
  return (
    <section className="draft-impact" aria-labelledby="draft-impact-title">
      <div className="section-heading">
        <h3 id="draft-impact-title">Draft impact</h3>
        <span className="pill notice">Unsaved preview</span>
      </div>
      <p>
        This checks your current source against the proposed contract. No policy, audit records,
        repair plans, or activation have been saved by this preview.
      </p>
      <p className="muted">
        {audit.files.length} files · {audit.findings.length} findings across all categories. Save
        approved policy and run a fresh audit before selecting repairs or activating categories.
      </p>
      {!!audit.errors.length && (
        <div className="callout warning" role="status">
          <strong>Preview incomplete</strong>
          <ul>
            {audit.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <ul className="review-groups">
        {categories.map((category) => (
          <li key={category}>
            <strong>{labels[category]}</strong>
            <span>{groups[category].length} findings</span>
          </li>
        ))}
      </ul>
      {audit.findings.length ? (
        <details>
          <summary>Inspect proposed-policy findings and source evidence</summary>
          <ul className="draft-finding-list">
            {audit.findings.map((finding, index) => (
              <li key={`${finding.id}:${index}`}>
                <p>
                  <strong>{finding.ruleId}</strong> · {finding.kind}
                </p>
                <p>{finding.message}</p>
                <code className="source">
                  {finding.file}:{finding.line}:{finding.column}
                </code>
                {finding.actual !== undefined && (
                  <p>
                    <strong>Observed:</strong> <code>{finding.actual}</code>
                  </p>
                )}
                {finding.expected !== undefined && (
                  <p>
                    <strong>Expected:</strong> <code>{finding.expected}</code>
                  </p>
                )}
                {finding.context && <pre>{finding.context.text}</pre>}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <p>No findings under the proposed rules. This preview does not activate any category.</p>
      )}
    </section>
  );
}
