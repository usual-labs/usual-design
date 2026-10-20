import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultManifest, loadManifest, parseManifest, parseManifestText } from '../src/config.js';

test('strict JSON parsing identifies syntax location and rejects JSONC extensions', () => {
  assert.throws(
    () => parseManifestText('{\r\n  "version": 1,\r\n  "include": [}\r\n}'),
    /Invalid manifest JSON at line 3, column 15: ValueExpected/,
  );
  for (const text of ['{"version":1,}', '{/* comment */ "version":1}', '{', ''])
    assert.throws(() => parseManifestText(text), /Invalid manifest JSON at line \d+, column \d+/);
  assert.deepEqual(parseManifestText(JSON.stringify(defaultManifest())), defaultManifest());
});

test('loading a manifest preserves useful syntax diagnostics', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-config-'));
  try {
    await writeFile(join(root, 'usual.design.json'), '{\n  "version" 1\n}');
    await assert.rejects(loadManifest(root), /line 2, column 13: ColonExpected/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('unsupported versions include migration guidance while malformed versions fail schema validation', () => {
  for (const version of [0, 2])
    assert.throws(
      () => parseManifest({ ...defaultManifest(), version }),
      /Unsupported manifest version .*supports version 1.*migrate.*alone is not a migration/,
    );
  assert.throws(() => parseManifest({ ...defaultManifest(), version: '1' }), /Invalid manifest/);
});

test('validated manifests are deeply frozen clones, while editable drafts remain independent', () => {
  const draft = defaultManifest();
  draft.allowed!.colors!.classes!.push('bg-action');
  draft.semantics!.push({
    id: 'action',
    target: { element: 'button', props: { type: 'submit' } },
    requireProps: { disabled: false },
  });
  const manifest = parseManifest(draft);
  draft.allowed!.colors!.classes!.push('bg-other');
  assert.deepEqual(manifest.allowed!.colors!.classes, ['bg-action']);
  assert.throws(() => manifest.active.push('colors'), TypeError);
  assert.throws(() => manifest.allowed!.colors!.classes!.push('bg-other'), TypeError);
  assert.throws(() => {
    manifest.semantics![0].target.props!.type = 'reset';
  }, TypeError);
  assert.throws(() => {
    manifest.semantics![0].requireProps!.disabled = true;
  }, TypeError);
  const editable = structuredClone(manifest);
  editable.active.push('colors');
  assert.deepEqual(manifest.active, []);
  assert.deepEqual(defaultManifest().allowed!.colors!.classes, []);
});

test('semantic native-element targets reject component names and selector expressions', () => {
  const withElement = (element: string) => ({
    ...defaultManifest(),
    semantics: [{ id: 'action', target: { element }, requireClasses: ['bg-action'] }],
  });
  for (const element of ['Button', 'button.primary', 'button a', '*', ''])
    assert.throws(() => parseManifest(withElement(element)), /Invalid manifest/);
  for (const element of ['button', 'h1', 'usual-button'])
    assert.doesNotThrow(() => parseManifest(withElement(element)));
});

test('semantic constraints reject contradictions but permit consistent target narrowing', () => {
  const rule = {
    id: 'action',
    target: { element: 'button', props: { type: 'submit', disabled: false } },
    requireClasses: ['bg-action'],
  };
  assert.throws(
    () =>
      parseManifest({
        ...defaultManifest(),
        semantics: [{ ...rule, forbidClasses: ['bg-action'] }],
      }),
    /action both requires and forbids class bg-action/,
  );
  for (const requireProps of [{ type: 'reset' }, { disabled: true }])
    assert.throws(
      () => parseManifest({ ...defaultManifest(), semantics: [{ ...rule, requireProps }] }),
      /action requires prop .* but targets/,
    );
  assert.doesNotThrow(() =>
    parseManifest({
      ...defaultManifest(),
      semantics: [
        {
          ...rule,
          requireProps: { type: 'submit', disabled: false, 'aria-label': 'Save' },
          forbidClasses: ['bg-muted'],
        },
      ],
    }),
  );
});

test('exceptions must be unique by rule and file regardless of their reasons', () => {
  const exception = {
    ruleId: 'allowed.colors',
    file: 'src/legacy.tsx',
    reason: 'Legacy migration',
  };
  assert.throws(
    () =>
      parseManifest({
        ...defaultManifest(),
        exceptions: [exception, { ...exception, reason: 'Other reason' }],
      }),
    /Duplicate exception for rule allowed.colors in src\/legacy.tsx/,
  );
  assert.doesNotThrow(() =>
    parseManifest({
      ...defaultManifest(),
      exceptions: [
        exception,
        { ...exception, file: 'src/other.tsx' },
        { ...exception, ruleId: 'allowed.shape' },
      ],
    }),
  );
});

test('preview links require valid absolute HTTP URLs', () => {
  for (const preview of [
    'https://',
    'https://bad host/path',
    'https://localhost:99999',
    'https://example.com/\npath',
    'javascript:alert(1)',
    '/preview',
  ])
    assert.throws(
      () => parseManifest({ ...defaultManifest(), preview }),
      /Invalid (?:preview URL|manifest)/,
    );
  for (const preview of [
    'http://localhost:5173',
    'https://example.com/preview?theme=dark#button',
    'http://[::1]:3000',
  ])
    assert.equal(parseManifest({ ...defaultManifest(), preview }).preview, preview);
});

test('minimal version 1 manifests do not receive implicit activation or invented policy', () => {
  const minimal = { version: 1, include: ['src/**/*.tsx'], active: [] };
  assert.deepEqual(parseManifest(minimal), minimal);
});
