import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AuditBoard } from '../src/AuditBoard';
import { Inventory } from '../src/Inventory';
import { PolicyReview } from '../src/PolicyReview';
import { RepairHandoff } from '../src/RepairHandoff';
import { DraftImpact } from '../src/DraftImpact';
import {
  addCandidateToDraft,
  canActivate,
  compareAudits,
  currentDraftPreview,
  grouped,
  safeColor,
  safeLength,
  safePreviewUrl,
  safeBorder,
  safeShadow,
  toggleGroup,
} from '../src/model';
import type { Audit, Finding, ObservedValue, ProjectState } from '../src/types';

const finding: Finding = {
  id: 'color-1',
  ruleId: 'allowed-color',
  category: 'colors',
  file: 'src/Button.tsx',
  line: 2,
  column: 4,
  message: 'Use the action color.',
  kind: 'violation',
};
const audit: Audit = {
  version: 1,
  mode: 'audit',
  snapshot: 'snapshot-1',
  manifestHash: 'hash-1',
  findings: [finding],
  active: [],
  inactive: ['colors', 'typography', 'spacing', 'shape', 'components'],
  files: ['src/Button.tsx'],
  errors: [],
  inventory: { files: ['src/Button.tsx'], tokens: [], components: [], warnings: [] },
};

test('group selection includes all group findings and preserves other categories without mutating state', () => {
  const second = { ...finding, id: 'color-2' };
  const initial = new Set(['type-1', finding.id]);
  const full = toggleGroup(initial, [finding, second]);
  assert.deepEqual([...full].sort(), ['color-1', 'color-2', 'type-1']);
  assert.deepEqual([...initial].sort(), ['color-1', 'type-1']);
  assert.deepEqual([...toggleGroup(full, [finding, second])], ['type-1']);
  assert.equal(Object.keys(grouped([finding])).length, 6);
});

test('activation requires current clean evidence and includes affected coverage', () => {
  assert.equal(canActivate('colors', audit, 'hash-1'), false);
  assert.equal(canActivate('typography', audit, 'hash-1'), true);
  assert.equal(canActivate('typography', audit, 'changed-hash'), false);
  assert.equal(
    canActivate('typography', { ...audit, errors: ['Incomplete scan'] }, 'hash-1'),
    false,
  );
  assert.equal(canActivate('typography', { ...audit, active: ['typography'] }, 'hash-1'), false);
  const coverage: Finding = {
    ...finding,
    id: 'coverage-1',
    category: 'coverage',
    kind: 'coverage',
    affectedCategories: ['typography'],
  };
  assert.equal(canActivate('typography', { ...audit, findings: [coverage] }, 'hash-1'), false);
  assert.equal(canActivate('shape', { ...audit, findings: [coverage] }, 'hash-1'), true);
  assert.equal(
    canActivate(
      'shape',
      { ...audit, findings: [{ ...coverage, affectedCategories: [] }] },
      'hash-1',
    ),
    false,
  );
});

test('specimens accept only safe literals and never pass arbitrary CSS or remote resources', () => {
  for (const value of ['#fff', '#aabbccdd', 'oklch(65% 0.2 125)', 'rgb(10 20 30 / 50%)'])
    assert.equal(safeColor(value), value);
  for (const value of [
    'url(https://example.test/track)',
    'red; background:url(x)',
    'var(--remote)',
    'expression(alert(1))',
    'rgb(1 2 calc(3))',
    '<script>',
  ])
    assert.equal(safeColor(value), null);
  assert.equal(safeLength('1.5rem'), '1.5rem');
  assert.equal(safeLength('100000px'), null);
  assert.equal(safeLength('-10px'), null);
  assert.equal(safeLength('url(x)'), null);
  assert.equal(safePreviewUrl('javascript:alert(1)'), null);
  assert.equal(safePreviewUrl('https://user:password@example.test'), null);
  assert.equal(safePreviewUrl('http://localhost:6006'), 'http://localhost:6006/');
});

test('project-provided source strings are escaped in the visual inventory', () => {
  const markup = renderToStaticMarkup(
    createElement(Inventory, {
      inventory: {
        files: [],
        components: [],
        warnings: [],
        tokens: [
          {
            name: '<script>alert(1)</script>',
            value: 'url(https://example.test)',
            file: '"><img src=x>',
            line: 3,
          },
        ],
      },
    }),
  );
  assert.ok(markup.includes('&lt;script&gt;'));
  assert.ok(!markup.includes('<script>'));
  assert.ok(!markup.includes('background-color:url'));
  assert.ok(!markup.includes('<img'));
});

const observedRadius: ObservedValue = {
  category: 'shape',
  kind: 'class',
  name: 'rounded-[19px]',
  value: '19px',
  className: 'rounded-[19px]',
  file: 'src/Card.tsx',
  line: 4,
  count: 2,
};

test('tokenless inventory renders observed radius and color choices with safe source evidence', () => {
  const markup = renderToStaticMarkup(
    createElement(Inventory, {
      inventory: {
        files: ['src/Card.tsx'],
        tokens: [],
        components: [],
        warnings: [],
        candidates: [
          observedRadius,
          {
            category: 'colors',
            kind: 'class',
            name: 'bg-[#dd44aa]',
            value: '#dd44aa',
            className: 'bg-[#dd44aa]',
            file: 'src/Card.tsx',
            line: 5,
            count: 1,
          },
          {
            category: 'colors',
            kind: 'declaration',
            name: '<script>color</script>',
            value: 'url(https://example.test)',
            property: 'color',
            file: '<img>',
            line: 6,
            count: 1,
          },
        ],
      },
      onApproveCandidate() {},
    }),
  );
  assert.ok(markup.includes('border-radius:19px'));
  assert.ok(markup.includes('background-color:#dd44aa'));
  assert.ok(markup.includes('2 observed uses'));
  assert.ok(markup.includes('src/Card.tsx:4'));
  assert.ok(markup.includes('Add to draft'));
  assert.ok(markup.includes('does not save policy or activate lint'));
  assert.ok(!markup.includes('<script>'));
  assert.ok(!markup.includes('<img>'));
  assert.ok(!markup.includes('background-color:url'));
});

test('observed choices only edit the draft, deduplicate exact values, and preserve unrelated policy', () => {
  const original = JSON.stringify({
    version: 1,
    include: ['src/**/*.tsx'],
    active: [],
    allowed: { shape: { classes: ['rounded-control'] } },
    ignore: ['generated/**'],
    semantics: [{ id: 'action', target: { element: 'a' }, requireClasses: ['bg-brand'] }],
  });
  const added = addCandidateToDraft(original, observedRadius);
  const result = JSON.parse(addCandidateToDraft(added, observedRadius));
  assert.deepEqual(result.allowed.shape.classes, ['rounded-control', 'rounded-[19px]']);
  assert.deepEqual(result.active, []);
  assert.deepEqual(result.ignore, ['generated/**']);
  assert.deepEqual(result.semantics, JSON.parse(original).semantics);
  assert.deepEqual(JSON.parse(original).allowed.shape.classes, ['rounded-control']);
  const declaration: ObservedValue = {
    ...observedRadius,
    kind: 'declaration',
    name: 'borderRadius',
    property: 'borderRadius',
  };
  const withLiteral = JSON.parse(addCandidateToDraft(added, declaration));
  assert.deepEqual(withLiteral.allowed.shape.values, ['19px']);
  assert.deepEqual(withLiteral.allowed.shape.classes, result.allowed.shape.classes);
});

test('candidate addition rejects invalid editor contents instead of discarding them', () => {
  for (const draft of [
    '{ invalid JSON',
    '[]',
    '{"allowed":null}',
    '{"allowed":{"shape":[]}}',
    '{"allowed":{"shape":{"classes":12}}}',
  ]) {
    assert.throws(() => addCandidateToDraft(draft, observedRadius), /draft.*kept/i);
  }
});

test('wizard exposes exact policy path, component identities and evidence, and selectable saved instructions', () => {
  const manifest = { version: 1 as const, include: ['src/**/*.tsx'], active: [] };
  const policy = renderToStaticMarkup(
    createElement(PolicyReview, {
      state: {
        manifest,
        manifestPath: '/workspace/project/config/design policy.json',
        manifestHash: 'hash-1',
        audit: null,
      },
      pending: false,
      draft: JSON.stringify(manifest),
      setDraft() {},
      async save() {
        return true;
      },
      async previewImpact() {
        return null;
      },
    }),
  );
  assert.ok(policy.includes('/workspace/project/config/design policy.json'));
  const catalog = renderToStaticMarkup(
    createElement(Inventory, {
      inventory: {
        files: [],
        tokens: [],
        warnings: [],
        components: [
          {
            name: 'ButtonAlias',
            exportName: 'Button',
            from: '@acme/ui',
            count: 3,
            file: 'src/App.tsx',
            locations: [
              { file: 'src/App.tsx', line: 9 },
              { file: 'src/Panel.tsx', line: 4 },
            ],
          },
          { name: 'LocalView', file: 'src/LocalView.tsx' },
        ],
      },
    }),
  );
  for (const evidence of [
    'ButtonAlias',
    'Button',
    '@acme/ui',
    '3 uses',
    'src/App.tsx:9',
    'src/Panel.tsx:4',
    'Usage count unavailable',
    'Import identity unresolved',
  ])
    assert.ok(catalog.includes(evidence), evidence);
  const handoff = renderToStaticMarkup(
    createElement(RepairHandoff, {
      review: false,
      selected: [],
      total: 0,
      pending: false,
      handoff: {
        path: 'docs/usual-design/repairs/approved.json',
        prompt: 'Read the saved approved plan and preserve the policy.',
        plan: {},
      },
      confirm() {},
      cancel() {},
      recheck() {},
    }),
  );
  assert.ok(handoff.includes('docs/usual-design/repairs/approved.json'));
  assert.match(handoff, /<textarea[^>]*readOnly=""[^>]*>Read the saved approved plan/i);
  assert.ok(handoff.includes('Select instruction'));
});

test('audit presents six groups, inactive categories, and disables stale actions', () => {
  const state: ProjectState = {
    manifest: { version: 1, include: ['src/**/*.tsx'], active: ['typography'] },
    manifestHash: 'changed-hash',
    audit,
  };
  const markup = renderToStaticMarkup(
    createElement(AuditBoard, {
      state,
      pending: false,
      selected: new Set([finding.id]),
      setSelected() {},
      recheck() {},
      review() {},
      activate() {},
    }),
  );
  for (const id of ['colors', 'typography', 'spacing', 'shape', 'components', 'coverage'])
    assert.ok(markup.includes(`id="group-${id}"`));
  assert.ok(markup.includes('1 of 5 categories active'));
  assert.ok(markup.includes('policy has changed'));
  assert.match(markup, /disabled=""[^>]*>Review repair batch/);
  assert.ok(!markup.includes('coverage is now active'));
});

test('missing policy decisions are reviewed separately from ordinary application repairs', () => {
  const decision: Finding = {
    ...finding,
    id: 'decision-1',
    ruleId: 'policy.colors',
    kind: 'decision',
  };
  const state: ProjectState = {
    manifest: { version: 1, include: ['src/**/*.tsx'], active: [] },
    manifestHash: 'hash-1',
    audit: { ...audit, findings: [decision] },
  };
  const markup = renderToStaticMarkup(
    createElement(AuditBoard, {
      state,
      pending: false,
      selected: new Set<string>(),
      setSelected() {},
      recheck() {},
      review() {},
      activate() {},
    }),
  );
  assert.ok(markup.includes('Review this policy decision'));
  assert.ok(!markup.includes('Select policy.colors at'));
});

test('fresh scan comparison reports resolved, new, and remaining findings', () => {
  assert.equal(compareAudits(null, audit), null);
  assert.deepEqual(
    compareAudits(audit, { ...audit, findings: [finding, { ...finding, id: 'new-1' }] }),
    { resolved: 0, added: 1, remaining: 1 },
  );
  assert.deepEqual(compareAudits(audit, { ...audit, findings: [] }), {
    resolved: 1,
    added: 0,
    remaining: 0,
  });
});

test('draft impact is invalidated by edited draft or saved-policy changes and cannot approve repairs', () => {
  const preview = { draft: '{"version":1}', manifestHash: 'saved-policy', audit };
  assert.equal(currentDraftPreview(preview, preview.draft, preview.manifestHash), audit);
  assert.equal(currentDraftPreview(preview, '{"version":2}', preview.manifestHash), null);
  assert.equal(currentDraftPreview(preview, preview.draft, 'changed-policy'), null);
  const markup = renderToStaticMarkup(
    createElement(DraftImpact, {
      audit: {
        ...audit,
        findings: [
          { ...finding, context: { start: 0, end: 8, text: '<script>', truncated: false } },
        ],
        errors: ['An unresolved source could not be analyzed.'],
      },
    }),
  );
  assert.ok(markup.includes('Unsaved preview'));
  assert.ok(markup.includes('Preview incomplete'));
  assert.ok(markup.includes('src/Button.tsx:2:4'));
  assert.ok(markup.includes('&lt;script&gt;'));
  assert.ok(!markup.includes('<script>'));
  assert.ok(!markup.includes('<button'));
  assert.ok(!markup.includes('<input'));
});

test('border and shadow specimens accept bounded primitives and reject executable or remote CSS', () => {
  assert.equal(safeBorder('2px solid #334455'), '2px solid #334455');
  assert.equal(safeShadow('0 2px 8px 0 rgb(0 0 0 / 20%)'), '0 2px 8px 0 rgb(0 0 0 / 20%)');
  for (const value of [
    'url(https://example.test)',
    '1px solid var(--remote)',
    '1px solid red; background: url(x)',
    '100px solid red',
  ])
    assert.equal(safeBorder(value), null);
  for (const value of [
    '0 0 5px url(x)',
    '0 0 2px var(--remote)',
    '0 0 -2px red',
    '0 0 999px red',
    '0 0 2px red, 0 0 3px blue',
  ])
    assert.equal(safeShadow(value), null);
  const markup = renderToStaticMarkup(
    createElement(Inventory, {
      inventory: {
        files: [],
        components: [],
        warnings: [],
        tokens: [
          { name: '--border-control', value: '2px solid #334455', file: 'theme.css', line: 1 },
          {
            name: '--shadow-control',
            value: '0 2px 8px 0 rgb(0 0 0 / 20%)',
            file: 'theme.css',
            line: 2,
          },
        ],
      },
    }),
  );
  assert.ok(markup.includes('border:2px solid #334455'));
  assert.ok(markup.includes('box-shadow:0 2px 8px 0 rgb(0 0 0 / 20%)'));
});
