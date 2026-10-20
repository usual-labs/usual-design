import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { previewStyles } from '../src/preview-styles';
import { ReferenceShowcase } from '../src/ReferenceShowcase';
import {
  chosenPreview,
  recommendedChoices,
  type OnboardingProposal,
} from '../../src/onboarding-types';

const proposal: OnboardingProposal = {
  version: 1,
  title: 'Project',
  summary: 'Review',
  scope: { include: ['src/**'] },
  decisions: [
    {
      id: 'action',
      category: 'colors',
      role: 'primary',
      title: 'Action',
      description: 'Choose',
      recommended: 'blue',
      options: [
        {
          id: 'blue',
          label: 'Blue',
          explanation: 'Existing',
          evidence: [{ file: 'src/app.tsx', line: 1 }],
          rules: { allowed: { colors: { classes: ['bg-blue-600'] } } },
          preview: { light: { primary: '#2563eb' }, dark: { primary: '#93c5fd' } },
        },
        {
          id: 'red',
          label: 'Red',
          explanation: 'Alternative',
          evidence: [{ file: 'src/app.tsx', line: 1 }],
          rules: { allowed: { colors: { classes: ['bg-red-600'] } } },
          preview: { light: { primary: '#dc2626' } },
        },
      ],
    },
  ],
};

test('reference updates from selected options, keeps dark values separate, and removes deferred values', () => {
  const choices = recommendedChoices(proposal);
  assert.equal(chosenPreview(proposal, choices, 'dark').primary, '#93c5fd');
  choices.selections.action = 'red';
  assert.equal(chosenPreview(proposal, choices, 'light').primary, '#dc2626');
  assert.deepEqual(chosenPreview(proposal, choices, 'dark'), {});
  choices.deferred = ['colors'];
  assert.deepEqual(chosenPreview(proposal, choices, 'light'), {});
});

test('preview cannot load arbitrary CSS or remote resources and reports unresolved values', () => {
  const result = previewStyles({
    primary: 'url(https://evil.invalid/image)',
    surface: 'var(--missing)',
    fontFamily: 'Remote Font',
    padding: '999rem',
    lineHeight: 'expression(alert(1))',
    headingSize: '32px',
    cardRadius: '8px',
    onPrimary: '#fff',
  });
  assert.equal(result.unavailable.length, 5);
  assert.deepEqual(result.style, {
    '--sample-headingSize': '32px',
    '--sample-cardRadius': '8px',
    '--sample-onPrimary': '#fff',
  });
});

test('reference sheet exposes palette, typography, control and layout specimens with explicit limits', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceShowcase, {
      values: chosenPreview(proposal, recommendedChoices(proposal), 'light'),
      theme: 'light',
    }),
  );
  assert.match(html, /--sample-primary:#2563eb/);
  for (const label of [
    'Color palette',
    'Typography',
    'Actions &amp; states',
    'Inputs &amp; selection',
    'Data &amp; navigation',
    'Spacing &amp; shape',
  ])
    assert.ok(html.includes(label), label);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /<textarea/);
  assert.match(html, /<table/);
  assert.match(html, /Neutral defaults/);
  assert.match(html, /not a render of your application/);
  assert.doesNotMatch(html, /<script|<iframe|https:\/\//);
});

test('project bridge state excludes deferred selections and retains exact project option identities', async () => {
  const { showcaseState } = await import('../../src/showcase-protocol');
  const choices = recommendedChoices(proposal);
  assert.deepEqual(showcaseState(proposal, choices, 'dark'), {
    theme: 'dark',
    selections: { action: 'blue' },
    deferred: [],
    values: { primary: '#93c5fd' },
  });
  choices.deferred = ['colors'];
  assert.deepEqual(showcaseState(proposal, choices, 'light'), {
    theme: 'light',
    selections: {},
    deferred: ['colors'],
    values: {},
  });
});

test('project preview uses a separate sandboxed frame and only offers supported themes', async (t) => {
  const { OnboardingPreview } = await import('../src/OnboardingPreview');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { origin: 'http://127.0.0.1:4321' } },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  const actual = {
    ...proposal,
    showcase: {
      url: 'http://localhost:5173/catalogue',
      title: 'Actual components',
      themes: ['dark'] as ['dark'],
    },
  };
  const html = renderToStaticMarkup(
    createElement(OnboardingPreview, { proposal: actual, choices: recommendedChoices(actual) }),
  );
  assert.match(html, /<iframe/);
  assert.match(html, /src="http:\/\/localhost:5173\/catalogue#usual-parent=/);
  assert.match(html, /sandbox="allow-scripts allow-same-origin"/);
  assert.doesNotMatch(html, /allow-forms|allow-popups|allow-top-navigation|x-usual-token/);
  assert.match(html, /Actual components/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /> Dark</);
  assert.doesNotMatch(html, /> Light<|sample-card/);
});
