import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startWizard } from '../src/server.js';
import { analyzeProject, runProject, resultExit } from '../src/project.js';
import { defaultManifest } from '../src/config.js';
import { hash } from '../src/files.js';
import { verifyPlan } from '../src/records.js';
import type { AuditResult } from '../src/types.js';

test('tokenless discovery exposes real ad-hoc values without approving or writing policy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-tokenless-'));
  await mkdir(join(root, 'src'));
  await writeFile(
    join(root, 'package.json'),
    '{"private":true,"devDependencies":{"tailwindcss":"^4.1.0"}}',
  );
  await writeFile(
    join(root, 'src/App.tsx'),
    `export const App=()=> <><div className="bg-[#ff00aa] rounded-[19px]"/><div className="rounded-[19px]" style={{borderRadius:"8px",color:"#113355"}}/></>`,
  );
  const wizard = await startWizard(root);
  try {
    const response = await fetch(wizard.origin + '/api/state', {
      headers: { 'X-Usual-Token': wizard.token },
    });
    assert.equal(response.status, 200);
    const state = await response.json();
    assert.equal(state.manifest, null);
    assert.equal(state.audit, null);
    assert.deepEqual(state.draft.active, []);
    assert.equal(state.inventory.tokens.length, 0);
    const candidates = state.inventory.candidates;
    assert.ok(
      candidates.some((c: { value: string; count: number }) => c.value === '19px' && c.count === 2),
    );
    assert.ok(
      candidates.some(
        (c: { name: string; value: string }) => c.name === 'bg-[#ff00aa]' && c.value === '#ff00aa',
      ),
    );
    assert.ok(
      candidates.some(
        (c: { name: string; value: string }) => c.name === 'borderRadius' && c.value === '8px',
      ),
    );
    const draft = defaultManifest();
    const audit = await analyzeProject(root, 'audit', draft, hash(JSON.stringify(draft)));
    assert.equal(audit.active.length, 0);
    assert.equal(draft.allowed!.colors!.classes!.length, 0);
  } finally {
    await new Promise<void>((r) => wizard.server.close(() => r()));
    await rm(root, { recursive: true, force: true });
  }
});

test('tokenless explicit choices preview without writes and reach repair plus activation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-tokenless-journey-'));
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'package.json'), '{"devDependencies":{"tailwindcss":"^4.1.0"}}');
  const app = join(root, 'src/App.tsx');
  await writeFile(
    app,
    'export const App=()=> <><div className="bg-[#112233] rounded-[3px]"/><div className="bg-[#445566] rounded-[9px]"/></>;',
  );
  const wizard = await startWizard(root);
  const api = async (name: string, payload?: unknown) => {
    const response = await fetch(`${wizard.origin}/api/${name}`, {
      method: payload === undefined ? 'GET' : 'POST',
      headers: {
        'X-Usual-Token': wizard.token,
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    });
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    return body;
  };
  try {
    const state = await api('state');
    assert.equal(state.manifestPath, join(await realpath(root), 'usual.design.json'));
    assert.equal(state.inventory.tokens.length, 0);
    assert.ok(state.inventory.candidates.some((c: { value: string }) => c.value === '3px'));
    assert.ok(state.inventory.candidates.some((c: { value: string }) => c.value === '9px'));
    const manifest = defaultManifest();
    manifest.allowed = {
      colors: { classes: ['bg-[#112233]'] },
      shape: { classes: ['rounded-[9px]'] },
    };
    const preview = (await api('preview', { manifest, expectedHash: null })) as AuditResult;
    assert.ok(preview.findings.some((f) => f.actual === 'rounded-[3px]'));
    assert.ok(preview.findings.some((f) => f.actual === 'bg-[#445566]'));
    await assert.rejects(readFile(join(root, 'usual.design.json')), { code: 'ENOENT' });
    await assert.rejects(readFile(join(root, 'docs/usual-design/audit.json')), { code: 'ENOENT' });

    await api('manifest', {
      manifest,
      expectedHash: null,
      rationale: 'Use the darker color and 9px corners.',
    });
    const rawPolicy = await readFile(join(root, 'usual.design.json'), 'utf8');
    const audit = (await api('audit', {})) as AuditResult;
    const selected = audit.findings.filter((f) => f.kind !== 'decision');
    const batch = await api('plan', {
      findingIds: selected.map((f) => f.id),
      expectedSnapshot: audit.snapshot,
    });
    assert.ok(batch.plan.deferred.some((f: { kind: string }) => f.kind === 'decision'));
    await verifyPlan(root, batch.path);
    await writeFile(app, 'export const App=()=> <div className="bg-[#112233] rounded-[9px]"/>;');
    assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), rawPolicy);
    const repaired = (await api('audit', {})) as AuditResult;
    await api('activate', { categories: ['colors', 'shape'], expectedSnapshot: repaired.snapshot });
    assert.equal(resultExit(await runProject(root, 'check')), 0);
    await writeFile(
      app,
      'export const App=()=> <div className="bg-[#445566] rounded-[9px] text-9xl"/>;',
    );
    const drift = await runProject(root, 'check');
    assert.equal(resultExit(drift), 1);
    assert.ok(drift.findings.every((f) => f.category === 'colors'));
  } finally {
    await new Promise<void>((r) => wizard.server.close(() => r()));
    await rm(root, { recursive: true, force: true });
  }
});
