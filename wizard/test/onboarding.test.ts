import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { previewStyles, OnboardingPreview } from '../src/OnboardingPreview';
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

test('reference rendering exposes theme selection, explicit limits, and selected literal color', () => {
  const html = renderToStaticMarkup(
    createElement(OnboardingPreview, {
      proposal,
      choices: recommendedChoices(proposal),
    }),
  );
  assert.match(html, /--sample-primary:#2563eb/);
  assert.match(html, /<select/);
  assert.match(html, /Neutral defaults/);
  assert.match(html, /not a render of your application/);
  assert.doesNotMatch(html, /<script|<iframe|https:\/\//);
});
