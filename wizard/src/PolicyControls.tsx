import { useEffect, useState } from 'react';
import { labels, safeColor, safeLength } from './model';
import type { Category, Token } from './types';

const styleCategories = ['colors', 'typography', 'spacing', 'shape'] as const;
const tokenMatch: Record<Exclude<Category, 'components' | 'coverage'>, RegExp> = {
  colors: /^--color-/,
  typography: /^--(?:font|text|leading|tracking)/,
  spacing: /^--(?:spacing|container|breakpoint)/,
  shape: /^--(?:radius|shadow|inset-shadow|drop-shadow|blur|border)/,
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function ListField({
  title,
  values,
  commit,
}: {
  title: string;
  values: string[];
  commit: (values: string[]) => void;
}) {
  const source = values.join('\n');
  const [draft, setDraft] = useState(source);
  useEffect(() => setDraft(source), [source]);
  return (
    <label>
      {title} <span className="muted">(one per line)</span>
      <textarea
        rows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() =>
          commit([
            ...new Set(
              draft
                .split('\n')
                .map((value) => value.trim())
                .filter(Boolean),
            ),
          ])
        }
      />
    </label>
  );
}

export function PolicyControls({
  manifest,
  tokens,
  disabled,
  change,
}: {
  manifest: Record<string, unknown>;
  tokens: Token[];
  disabled: boolean;
  change: (manifest: Record<string, unknown>) => void;
}) {
  const allowed = object(manifest.allowed);
  function update(category: string, field: string, value: string[]) {
    change({
      ...manifest,
      allowed: { ...allowed, [category]: { ...object(allowed[category]), [field]: value } },
    });
  }
  return (
    <details className="disclosure policy-controls" open>
      <summary>Choose allowed values visually</summary>
      <p>
        These controls edit the draft below. Approving a variable allows its configured design role,
        not every observed value. Keep different intentional roles; category activation happens
        after a clean audit.
      </p>
      <div className="policy-category-grid">
        {styleCategories.map((category) => {
          const policy = object(allowed[category]);
          const variables = strings(policy.variables);
          const candidates = [
            ...new Map(
              tokens
                .filter((token) => tokenMatch[category].test(token.name))
                .map((token) => [token.name, token]),
            ).values(),
          ];
          return (
            <fieldset key={category} disabled={disabled} className="policy-fieldset">
              <legend>{labels[category]}</legend>
              {candidates.length > 0 && (
                <div className="variable-choices">
                  {candidates.map((token) => {
                    const color = category === 'colors' ? safeColor(token.value) : null;
                    const radius =
                      category === 'shape' && /radius/.test(token.name)
                        ? safeLength(token.value)
                        : null;
                    return (
                      <label className="variable-choice" key={token.name}>
                        <input
                          type="checkbox"
                          checked={variables.includes(token.name)}
                          onChange={(event) =>
                            update(
                              category,
                              'variables',
                              event.target.checked
                                ? [...variables, token.name]
                                : variables.filter((value) => value !== token.name),
                            )
                          }
                        />
                        <span
                          className="variable-sample"
                          aria-hidden="true"
                          style={
                            color
                              ? { backgroundColor: color }
                              : radius
                                ? { borderRadius: radius }
                                : undefined
                          }
                        >
                          {color ? '' : 'Aa'}
                        </span>
                        <span>
                          <code>{token.name}</code>
                          <small>{token.value}</small>
                          <small className="source">
                            {token.file}:{token.line}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <ListField
                title="Allowed variables"
                values={variables}
                commit={(value) => update(category, 'variables', value)}
              />
              <ListField
                title="Allowed Tailwind classes"
                values={strings(policy.classes)}
                commit={(value) => update(category, 'classes', value)}
              />
              <ListField
                title="Allowed literal values"
                values={strings(policy.values)}
                commit={(value) => update(category, 'values', value)}
              />
            </fieldset>
          );
        })}
      </div>
      <p className="muted">
        Semantic targets, component replacement rules, file coverage, and exceptions remain explicit
        in the JSON editor. Ask your agent to draft precise rules from source evidence.
      </p>
    </details>
  );
}
