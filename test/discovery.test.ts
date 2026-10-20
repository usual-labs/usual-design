import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { discover } from '../src/discovery.js';
import { defaultManifest } from '../src/config.js';
import { runProject, resultExit } from '../src/project.js';

async function fixture(files: Record<string, string>, run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'usual-discovery-'));
  try {
    for (const [path, source] of Object.entries({
      'package.json': '{"devDependencies":{"tailwindcss":"^4.1.0"}}',
      ...files,
    })) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), source);
    }
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('excluded metadata reports stable boundaries without enumerating dependency/generated contents', async () => {
  await fixture(
    {
      'src/App.tsx': 'export const App=()=> <div/>;',
      'src/ignored/Skip.tsx': 'invalid source',
      'src/types.d.ts': 'declare const ignored: unknown;',
      'src/readme.txt': 'outside include',
      'node_modules/deep/package/failure.tsx': 'invalid source',
      '.next/server/pages/failure.tsx': 'invalid source',
      '.nuxt/nested/generated.ts': 'invalid source',
      '.output/server/generated.ts': 'invalid source',
      '.svelte-kit/generated/types.ts': 'invalid source',
      '.turbo/cache/result.json': '{}',
      '.vercel/output/config.json': '{}',
      '.vite/deps/compiled.js': 'invalid source',
      '.parcel-cache/hash': 'cache',
      'docs/usual-design/notes.md': 'durable notes',
    },
    async (root) => {
      const manifest = defaultManifest();
      manifest.ignore = ['src/ignored/**'];
      const first = await discover(root, manifest),
        second = await discover(root, manifest);
      assert.deepEqual(first.inventory.excluded, second.inventory.excluded);
      assert.equal(first.snapshot, second.snapshot);
      assert.deepEqual(first.inventory.files, ['src/App.tsx']);
      const entries = first.inventory.excluded!;
      assert.deepEqual(
        entries,
        [...entries].sort(
          (a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason),
        ),
      );
      for (const path of [
        'node_modules',
        '.next',
        '.nuxt',
        '.output',
        '.svelte-kit',
        '.turbo',
        '.vercel',
        '.vite',
        '.parcel-cache',
        'docs/usual-design',
        'src/types.d.ts',
      ])
        assert.ok(entries.some((e) => e.path === path && e.reason === 'standard'));
      assert.ok(entries.some((e) => e.path === 'src/ignored' && e.reason === 'configured'));
      assert.ok(entries.some((e) => e.path === 'src/readme.txt' && e.reason === 'outside-include'));
      assert.equal(
        entries.some((e) => e.path.startsWith('node_modules/') || e.path.startsWith('.next/')),
        false,
      );
    },
  );
});

test('CSS import cycles terminate with each source and token visited once', async () => {
  await fixture(
    {
      'src/base.css': '@import "./loop.css";@theme {--color-brand:#123456;}',
      'src/loop.css': '@import "./base.css";@theme {--radius-control:4px;}',
    },
    async (root) => {
      const manifest = defaultManifest();
      manifest.include = ['src/base.css'];
      const result = await discover(root, manifest);
      assert.deepEqual(result.inventory.files, ['src/base.css', 'src/loop.css']);
      assert.equal(result.sources.size, 2);
      assert.equal(result.inventory.tokens.length, 2);
      assert.equal(
        result.inventory.excluded!.some((e) => e.path === 'src/loop.css'),
        false,
      );
    },
  );
});

test('total CSS import queue is bounded before reading an unbounded dependency graph', async () => {
  await fixture(
    {
      'src/base.css': Array.from(
        { length: 10_001 },
        (_, i) => `@import "./dependency-${i}.css";`,
      ).join('\n'),
    },
    async (root) => {
      const manifest = defaultManifest();
      await assert.rejects(discover(root, manifest), /10000 total covered\/token\/imported files/);
    },
  );
});

test('explicit token sources outside include remain actual analyzed files', async () => {
  await fixture(
    {
      'src/App.tsx': 'export const App=()=> <div/>;',
      'theme.css': '@theme {--color-brand:#123456;}',
    },
    async (root) => {
      const manifest = defaultManifest();
      manifest.tokens = ['theme.css'];
      const result = await discover(root, manifest);
      assert.ok(result.inventory.files.includes('theme.css'));
      assert.ok(result.inventory.tokens.some((t) => t.name === '--color-brand'));
      assert.equal(
        result.inventory.excluded!.some((e) => e.path === 'theme.css'),
        false,
      );
    },
  );
});

test('theme wildcard namespace resets cannot establish clean active coverage or concrete tokens', async () => {
  for (const reset of ['--color-*', '--*'])
    await fixture(
      {
        'src/App.tsx': 'export const App=()=> <div className="bg-brand"/>;',
        'src/theme.css': `@theme {--color-brand:#123456;${reset}:initial;}`,
        'usual.design.json': JSON.stringify({
          version: 1,
          include: ['src/**/*.{tsx,css}'],
          active: ['colors'],
          allowed: { colors: { classes: ['bg-brand'], variables: ['--color-brand'] } },
        }),
      },
      async (root) => {
        const result = await runProject(root, 'check');
        assert.equal(resultExit(result), 1);
        assert.ok(
          result.findings.some(
            (f) => f.kind === 'coverage' && f.message.includes('namespace reset'),
          ),
        );
        assert.equal(
          result.inventory.tokens.some((token) => token.name.includes('*')),
          false,
        );
        assert.ok(result.inventory.warnings.some((message) => message.includes(reset)));
      },
    );
});

test('new discovered token definitions remain observations and never expand approved policy', async () => {
  await fixture(
    {
      'src/App.tsx': 'export const App=()=> <div className="bg-rogue"/>;',
      'src/theme.css': '@theme {--color-brand:#123456;--color-rogue:#ff00aa;}',
      'usual.design.json': JSON.stringify({
        version: 1,
        include: ['src/**/*.{tsx,css}'],
        active: ['colors'],
        allowed: { colors: { classes: ['bg-brand'], variables: ['--color-brand'] } },
      }),
    },
    async (root) => {
      const before = await readFile(join(root, 'usual.design.json'), 'utf8');
      const result = await runProject(root, 'check');
      assert.ok(result.inventory.tokens.some((token) => token.name === '--color-rogue'));
      assert.ok(
        result.findings.some((f) => f.ruleId === 'allowed.colors' && f.actual === 'bg-rogue'),
      );
      assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), before);
      const draft = defaultManifest(),
        draftBefore = JSON.stringify(draft);
      await discover(root, draft);
      assert.equal(JSON.stringify(draft), draftBefore);
      assert.deepEqual(draft.allowed!.colors!.classes, []);
    },
  );
});

test('covered directory symlinks cannot hide CSS-only covered sources', async () => {
  await fixture({ 'src/theme.css': '@theme {--color-brand:#123456;}' }, async (root) => {
    await symlink(join(root, 'src'), join(root, 'linked'));
    const manifest = defaultManifest();
    manifest.include = ['linked/**/*.css'];
    await assert.rejects(discover(root, manifest), /Covered symlink is unsupported/);
  });
});

test('conflicting declarations and disjunctive major ranges cannot claim Tailwind v4 support', async () => {
  for (const pkg of [
    { dependencies: { tailwindcss: '^4.1.0' }, devDependencies: { tailwindcss: '^3.4.0' } },
    { devDependencies: { tailwindcss: '^4.1.0 || ^5.0.0' } },
  ])
    await fixture(
      { 'package.json': JSON.stringify(pkg), 'src/App.tsx': 'export const App=()=>null;' },
      async (root) => {
        await assert.rejects(
          discover(root, defaultManifest()),
          /Conflicting|Unsupported or ambiguous/,
        );
      },
    );
});
