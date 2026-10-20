import { useState, type CSSProperties } from 'react';
import {
  chosenPreview,
  type OnboardingChoices,
  type OnboardingProposal,
  type PreviewValues,
} from '../../src/onboarding-types';
import { safeColor, safeLength } from './model';

/** No project CSS, external fonts, resources, or components enter the reference UI. */
export function previewStyles(values: PreviewValues): {
  style: CSSProperties;
  unavailable: string[];
} {
  const style: Record<string, string> = {};
  const unavailable: string[] = [];
  for (const [slot, value] of Object.entries(values)) {
    let safe: string | null = null;
    if (['primary', 'onPrimary', 'surface', 'onSurface', 'muted', 'border', 'focus'].includes(slot))
      safe = safeColor(value);
    else if (slot === 'fontFamily')
      safe = ['system-ui', 'sans-serif', 'serif', 'monospace'].includes(value) ? value : null;
    else if (slot === 'lineHeight')
      safe = /^(?:1(?:\.\d{1,2})?|2(?:\.0{1,2})?)$/.test(value) ? value : null;
    else safe = safeLength(value, slot === 'headingSize' ? 64 : 48);
    if (safe !== null) style[`--sample-${slot}`] = safe;
    else unavailable.push(`${slot}: ${value}`);
  }
  return { style: style as CSSProperties, unavailable };
}

export function OnboardingPreview({
  proposal,
  choices,
}: {
  proposal: OnboardingProposal;
  choices: OnboardingChoices;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const hasDark = proposal.decisions.some((d) => d.options.some((o) => o.preview?.dark));
  const values = chosenPreview(proposal, choices, theme);
  const { style, unavailable } = previewStyles(values);
  const missing = [
    'primary',
    'onPrimary',
    'surface',
    'onSurface',
    'muted',
    'border',
    'focus',
    'bodySize',
    'headingSize',
    'lineHeight',
    'fontFamily',
    'gap',
    'padding',
    'controlRadius',
    'cardRadius',
  ].filter((slot) => !Object.hasOwn(values, slot));
  return (
    <aside className="onboarding-preview" aria-label="Live design reference">
      <div className="onboarding-preview-heading">
        <div>
          <p className="eyebrow">Live reference</p>
          <h3>Your choices, together</h3>
        </div>
        {hasDark && (
          <label>
            Theme
            <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        )}
      </div>
      <div className={`design-sample ${theme}`} style={style}>
        <div className="sample-nav">
          <strong>Workspace</strong>
          <span>Overview · Projects</span>
        </div>
        <div className="sample-content">
          <div>
            <span className="sample-label">YOUR NEXT CHAPTER</span>
            <h2>A little more intention.</h2>
            <p>Bring a clear rhythm to the things you build. Every choice has a place.</p>
          </div>
          <div className="sample-card">
            <span className="sample-label">PROJECT SETTINGS</span>
            <h3>Make room for good work</h3>
            <p>A shared language for your team, from the first screen to the next release.</p>
            <label htmlFor="sample-project">Project name</label>
            <input id="sample-project" value="Everyday studio" readOnly />
            <div className="sample-actions">
              <button type="button">Save changes</button>
              <button type="button" className="sample-secondary">
                Preview
              </button>
            </div>
          </div>
          <div className="sample-stats">
            <div>
              <strong>12</strong>
              <span>Projects</span>
            </div>
            <div>
              <strong>04</strong>
              <span>In progress</span>
            </div>
            <div>
              <strong>08</strong>
              <span>Published</span>
            </div>
          </div>
        </div>
      </div>
      <p className="small-text">
        Reference components, not a render of your application. Selections update immediately;
        unsupported or missing values use neutral preview defaults.
      </p>
      {(missing.length > 0 || unavailable.length > 0) && (
        <details>
          <summary>Preview limits</summary>
          {unavailable.length > 0 && <p>Unavailable: {unavailable.join('; ')}.</p>}
          {missing.length > 0 && <p>Neutral defaults: {missing.join(', ')}.</p>}
          <p>
            Only local system fonts are previewed. This screen does not verify application contrast,
            theme coverage, or component behavior.
          </p>
        </details>
      )}
    </aside>
  );
}
