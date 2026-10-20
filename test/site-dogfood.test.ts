import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { startWizard } from '../src/server.js';
import { runProject } from '../src/project.js';
import { categories, type AuditResult } from '../src/types.js';

test('website source and draft policy complete the real API audit/repair/activation loop in an isolated copy', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-site-dogfood-'));
  await cp(resolve('site'), root, { recursive: true });
  const wizard = await startWizard(root);
  async function post(path: string, body: unknown) {
    const response = await fetch(wizard.origin + '/api/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Usual-Token': wizard.token },
      body: JSON.stringify(body),
    });
    const value = await response.json();
    assert.equal(response.status, 200, JSON.stringify(value));
    return value;
  }
  try {
    const original = await readFile(join(root, 'usual.design.json'), 'utf8');
    const clean = (await post('audit', {})) as AuditResult;
    assert.deepEqual(clean.findings, []);
    assert.deepEqual(clean.active, []);
    await writeFile(
      join(root, 'src/DogfoodProbe.tsx'),
      `export function Probe(){return <a data-intent="primary" className="bg-fuchsia-500 rounded-[19px]"><button>Continue</button></a>}`,
    );
    const audit = (await post('audit', {})) as AuditResult;
    for (const rule of ['allowed.colors', 'allowed.shape', 'primary-action', 'shared-button']) {
      assert.ok(
        audit.findings.some((f) => f.ruleId === rule),
        rule,
      );
    }
    const selected = audit.findings.filter((f) => f.kind !== 'decision').map((f) => f.id);
    const batch = await post('plan', { findingIds: selected, expectedSnapshot: audit.snapshot });
    assert.ok(batch.path.endsWith('.json'));
    await writeFile(
      join(root, 'src/DogfoodProbe.tsx'),
      `import {Button} from './components/Button';export function Probe(){return <a data-intent="primary" className="bg-accent text-surface rounded-panel"><Button>Continue</Button></a>}`,
    );
    const repaired = (await post('audit', {})) as AuditResult;
    assert.deepEqual(repaired.findings, []);
    assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), original);
    const activated = (await post('activate', {
      categories: [...categories],
      expectedSnapshot: repaired.snapshot,
    })) as AuditResult;
    assert.deepEqual(activated.findings, []);
    assert.equal(activated.active.length, 5);
    const progress = JSON.parse(
      await readFile(join(root, 'docs/usual-design/repair-progress.json'), 'utf8'),
    );
    assert.ok(
      progress.batches[0].findings.every(
        (f: { status: string }) => f.status === 'not-observed-in-current-audit',
      ),
    );
    await writeFile(
      join(root, 'src/DogfoodProbe.tsx'),
      `export const Probe=()=> <div className="bg-fuchsia-500"/>`,
    );
    const regression = await runProject(root, 'check');
    assert.ok(regression.findings.some((f) => f.ruleId === 'allowed.colors'));
  } finally {
    await new Promise<void>((done) => wizard.server.close(() => done()));
    await rm(root, { recursive: true, force: true });
  }
});
