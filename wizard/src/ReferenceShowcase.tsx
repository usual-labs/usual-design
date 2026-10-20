import type { PreviewValues } from '../../src/onboarding-types';
import { previewStyles } from './preview-styles';
import { safeColor } from './model';

const slots = [
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
];

/** Compatibility view only. Exact project components live in the separate showcase. */
export function ReferenceShowcase({
  values,
  theme,
}: {
  values: PreviewValues;
  theme: 'light' | 'dark';
}) {
  const { style, unavailable } = previewStyles(values);
  const missing = slots.filter((slot) => !Object.hasOwn(values, slot));
  return (
    <div className="reference-scroll">
      <details className="reference-limits">
        <summary>Reference preview — connect your project for exact components and fonts</summary>
        <p>
          This is not a render of your application. Ask your onboarding agent to prepare the project
          showcase using the installed skill’s showcase guide.
        </p>
        {missing.length > 0 && <p>Neutral defaults: {missing.join(', ')}.</p>}
        {unavailable.length > 0 && <p>Unavailable: {unavailable.join('; ')}.</p>}
        <p>
          Custom fonts, states, and component variants are rendered by the project showcase. This
          reference uses system fonts.
        </p>
      </details>
      <div className={`design-sample ${theme}`} style={style}>
        <section className="sample-foundations" aria-label="Color palette">
          <h3>Color palette</h3>
          <div className="sample-palette">
            {(['primary', 'surface', 'onSurface', 'muted', 'border', 'focus'] as const).map(
              (slot) => (
                <div key={slot}>
                  <div className="sample-color" style={{ background: `var(--sample-${slot})` }} />
                  <strong>{slot}</strong>
                  <code>{safeColor(values[slot] ?? '') ?? 'Default'}</code>
                </div>
              ),
            )}
          </div>
        </section>
        <section className="sample-foundations" aria-label="Typography specimens">
          <h3>Typography</h3>
          <div className="sample-type-row">
            <span>Heading</span>
            <h2>The details make the system.</h2>
          </div>
          <div className="sample-type-row">
            <span>Subheading</span>
            <h4>Designed to work together</h4>
          </div>
          <div className="sample-type-row">
            <span>Body</span>
            <p>
              Choose a clear, consistent foundation for every screen. The same type, spacing, and
              colors connect each part of your product.
            </p>
          </div>
          <div className="sample-type-row">
            <span>Label / code</span>
            <div>
              <label>Project settings</label>
              <code>const design = 'intentional';</code>
            </div>
          </div>
        </section>
        <div className="sample-grid">
          <section className="sample-card">
            <h3>Actions & states</h3>
            <p>Primary, secondary, and disabled</p>
            <div className="sample-actions">
              <button type="button">Create project</button>
              <button className="sample-secondary" type="button">
                View details
              </button>
              <button disabled>Unavailable</button>
            </div>
            <div className="sample-badges">
              <span>Draft</span>
              <span>In review</span>
              <span>Published</span>
            </div>
          </section>
          <section className="sample-card">
            <h3>Inputs & selection</h3>
            <p>Labels, help text, and control sizes</p>
            <label htmlFor="sample-name">Project name</label>
            <input id="sample-name" placeholder="Project name" defaultValue="Design system" />
            <label htmlFor="sample-team">Team</label>
            <select id="sample-team" defaultValue="Design">
              <option>Design</option>
              <option>Engineering</option>
            </select>
            <div className="sample-actions">
              <label>
                <input type="checkbox" defaultChecked /> Email updates
              </label>
              <label>
                <input type="radio" name="sample-access" defaultChecked /> Private
              </label>
            </div>
            <label htmlFor="sample-notes">Description</label>
            <textarea id="sample-notes" rows={2} placeholder="Add a description…" />
          </section>
          <section className="sample-card sample-filled">
            <span className="sample-caption">Filled card</span>
            <h3>Workspace overview</h3>
            <p>Content, controls, and metrics in context.</p>
            <div className="sample-stats">
              <div>
                <strong>24</strong>
                <span>Components</span>
              </div>
              <div>
                <strong>8</strong>
                <span>Patterns</span>
              </div>
              <div>
                <strong>2</strong>
                <span>Themes</span>
              </div>
            </div>
            <div className="sample-actions">
              <button type="button">Open workspace</button>
              <button type="button" className="sample-secondary">
                Settings
              </button>
            </div>
          </section>
          <section className="sample-card">
            <h3>Data & navigation</h3>
            <div className="sample-tabs">
              <span>Overview</span>
              <span>Activity</span>
              <span>Members</span>
            </div>
            <table>
              <caption className="sr-only">Example project activity</caption>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Website</td>
                  <td>Published</td>
                  <td>Today</td>
                </tr>
                <tr>
                  <td>Mobile app</td>
                  <td>In review</td>
                  <td>Yesterday</td>
                </tr>
                <tr>
                  <td>Workspace</td>
                  <td>Draft</td>
                  <td>Oct 18</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <section className="sample-foundations" aria-label="Spacing and shape specimens">
          <h3>Spacing & shape</h3>
          <div className="sample-geometry">
            <div>
              <span>Content padding</span>
              <div className="sample-padding">
                <span>Content</span>
              </div>
            </div>
            <div>
              <span>Component gap</span>
              <div className="sample-gap">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div>
              <span>Card / control radius</span>
              <div className="sample-radius">
                <span />
                <button type="button">Control</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
