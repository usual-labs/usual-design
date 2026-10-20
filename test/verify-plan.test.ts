import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { runProject } from '../src/project.js';
import { createPlan, verifyPlan, saveAudit } from '../src/records.js';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'usual-plan-verification-'));
  await cp(resolve('fixtures/atlas'), root, { recursive: true });
  return root;
}

test('saved repair approval is verified read-only and rejects later source changes', async () => {
  const root = await fixture();
  try {
    const audit = await runProject(root, 'audit');
    const batch = await createPlan(root, [audit.findings[0].id], audit.snapshot);
    const before = await readFile(join(root, batch.path), 'utf8');
    const result = await verifyPlan(root, batch.path);
    assert.equal(result.valid, true);
    assert.equal(result.selected, 1);
    assert.equal(result.snapshot, audit.snapshot);
    assert.equal(await readFile(join(root, batch.path), 'utf8'), before);
    await writeFile(
      join(root, 'src/App.tsx'),
      '// Changed since approval\nexport const App=()=>null;',
    );
    await assert.rejects(verifyPlan(root, batch.path), /Stale repair plan/);
    assert.equal(await readFile(join(root, batch.path), 'utf8'), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('refreshing repair evidence preserves manually added notes', async () => {
  const root = await fixture();
  try {
    const audit = await runProject(root, 'audit');
    await createPlan(root, [audit.findings[0].id], audit.snapshot);
    const path = join(root, 'docs/usual-design/repair-progress.md');
    const manual = (await readFile(path, 'utf8')) + '\nMy repair notes.\n';
    await writeFile(path, manual);
    await assert.rejects(saveAudit(root, audit), /manual changes/);
    assert.equal(await readFile(path, 'utf8'), manual);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('unapproved, corrupt and incompatible records never authorize a repair', async () => {
  const root = await fixture();
  try {
    const audit = await runProject(root, 'audit');
    const batch = await createPlan(root, [audit.findings[0].id], audit.snapshot);
    for (const record of [
      { ...batch.plan, status: 'draft' },
      { ...batch.plan, version: 2 },
      { ...batch.plan, selected: [{ ...batch.plan.selected[0], file: '../escape.tsx' }] },
    ]) {
      const raw = JSON.stringify(record);
      await writeFile(join(root, batch.path), raw);
      await assert.rejects(verifyPlan(root, batch.path));
      assert.equal(await readFile(join(root, batch.path), 'utf8'), raw);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
