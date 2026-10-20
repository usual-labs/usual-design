import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { hash } from '../src/files.js';
import { runProject, resultExit } from '../src/project.js';
import { recordsDir } from '../src/records.js';
import { startWizard } from '../src/server.js';
import type { AuditResult, Finding, Manifest } from '../src/types.js';

type Wizard = Awaited<ReturnType<typeof startWizard>>;
interface State {
  projectRoot: string;
  manifest: Manifest | null;
  manifestHash: string | null;
  draft: Manifest;
  audit: AuditResult | null;
}
interface Plan {
  path: string;
  prompt: string;
  plan: {
    status: string;
    snapshot: string;
    manifestHash: string;
    selected: Finding[];
    deferred: Finding[];
    constraints: string[];
  };
}

async function atlas() {
  const root = await mkdtemp(join(tmpdir(), 'usual-workflow-'));
  await cp(resolve('fixtures/atlas'), root, { recursive: true });
  return root;
}

async function api(wizard: Wizard, endpoint: string, body?: unknown) {
  const response = await fetch(`${wizard.origin}/api/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'X-Usual-Token': wizard.token,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

async function successful<T>(wizard: Wizard, endpoint: string, body?: unknown): Promise<T> {
  const response = await api(wizard, endpoint, body);
  assert.equal(response.status, 200, `${endpoint}: ${JSON.stringify(response.body)}`);
  return response.body as T;
}

async function close(wizard: Wizard) {
  await new Promise<void>((resolveClose, reject) =>
    wizard.server.close((error) => (error ? reject(error) : resolveClose())),
  );
}

const repairedApp = `import { Button } from './Button';
export function App() {
  return <main className="p-4 text-9xl"><a data-intent="primary" className="bg-brand text-paper rounded-control">Go</a><Button /></main>;
}
`;

test('HTTP onboarding repairs all three rule families, activates clean categories, and resumes deferred typography', async () => {
  const root = await atlas();
  let wizard: Wizard | undefined;
  try {
    const manifest = JSON.parse(
      await readFile(join(root, 'usual.design.json'), 'utf8'),
    ) as Manifest;
    manifest.active = [];
    await rm(join(root, 'usual.design.json'));
    const appPath = join(root, 'src/App.tsx');
    await writeFile(appPath, (await readFile(appPath, 'utf8')).replace('p-4', 'p-4 text-9xl'));
    wizard = await startWizard(root);

    const initial = await successful<State>(wizard, 'state');
    assert.equal(initial.projectRoot, root);
    assert.equal(initial.manifest, null);
    assert.deepEqual(initial.draft.active, []);
    assert.equal(initial.audit, null);

    await successful(wizard, 'manifest', { manifest, expectedHash: null });
    const firstSave = await successful<State>(wizard, 'state');
    assert.ok(firstSave.manifestHash);
    assert.deepEqual(firstSave.manifest?.active, []);

    const reviewedManifest = { ...manifest, ignore: ['src/generated/**'] };
    await successful(wizard, 'manifest', {
      manifest: reviewedManifest,
      expectedHash: firstSave.manifestHash,
    });
    const policyRaw = await readFile(join(root, 'usual.design.json'), 'utf8');
    const staleSave = await api(wizard, 'manifest', {
      manifest,
      expectedHash: firstSave.manifestHash,
    });
    assert.equal(staleSave.status, 400);
    assert.match(staleSave.body.error, /stale/i);
    assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), policyRaw);

    const audit = await successful<AuditResult>(wizard, 'audit', {});
    assert.deepEqual(audit.errors, []);
    const ruleIds = new Set(audit.findings.map((finding) => finding.ruleId));
    for (const ruleId of [
      'allowed.colors',
      'allowed.shape',
      'allowed.typography',
      'action-color',
      'use-button',
    ]) {
      assert.ok(ruleIds.has(ruleId), `Atlas must exercise ${ruleId}`);
    }
    assert.ok(audit.findings.every((finding) => finding.kind !== 'decision'));
    const selected = audit.findings.filter((finding) => finding.category !== 'typography');
    const deferred = audit.findings.filter((finding) => finding.category === 'typography');
    assert.ok(selected.length > 0);
    assert.ok(deferred.length > 0);

    const handoff = await successful<Plan>(wizard, 'plan', {
      findingIds: selected.map((finding) => finding.id),
      expectedSnapshot: audit.snapshot,
    });
    assert.equal(handoff.plan.status, 'approved');
    assert.deepEqual(
      handoff.plan.selected.map((finding) => finding.id).sort(),
      selected.map((finding) => finding.id).sort(),
    );
    assert.deepEqual(
      handoff.plan.deferred.map((finding) => finding.id).sort(),
      deferred.map((finding) => finding.id).sort(),
    );
    assert.ok(
      handoff.plan.constraints.some((constraint) => constraint.includes('Do not change manifest')),
    );
    assert.ok(handoff.prompt.includes(handoff.path));
    const savedPlan = await readFile(join(root, handoff.path), 'utf8');
    const repairMarkdown = await readFile(join(root, handoff.path.replace(/json$/, 'md')), 'utf8');
    assert.match(repairMarkdown, /## Selected/);
    assert.match(repairMarkdown, /## Deferred/);
    assert.match(repairMarkdown, /text-9xl/);
    assert.equal(JSON.parse(savedPlan).snapshot, audit.snapshot);

    // Perform the actual approved application repair; leave the deferred typography unchanged.
    await writeFile(appPath, repairedApp);
    assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), policyRaw);
    const rechecked = await successful<AuditResult>(wizard, 'audit', {});
    assert.notEqual(rechecked.snapshot, audit.snapshot);
    assert.deepEqual(rechecked.errors, []);
    assert.ok(rechecked.findings.length > 0);
    assert.ok(rechecked.findings.every((finding) => finding.category === 'typography'));

    const activated = await successful<AuditResult>(wizard, 'activate', {
      categories: ['colors', 'spacing', 'shape', 'components'],
      expectedSnapshot: rechecked.snapshot,
    });
    assert.equal(activated.mode, 'check');
    assert.deepEqual(activated.findings, []);
    assert.ok(activated.inactive.includes('typography'));
    const check = await runProject(root, 'check');
    assert.equal(resultExit(check), 0);
    assert.deepEqual(check.findings, []);
    const policyAfter = JSON.parse(
      await readFile(join(root, 'usual.design.json'), 'utf8'),
    ) as Manifest;
    assert.deepEqual({ ...policyAfter, active: [] }, JSON.parse(policyRaw));
    assert.deepEqual(policyAfter.active, ['colors', 'spacing', 'shape', 'components']);

    // Inactive means fully unchecked, including newly introduced typography drift.
    await writeFile(appPath, repairedApp.replace('text-9xl', 'text-9xl font-black'));
    assert.equal(resultExit(await runProject(root, 'check')), 0);
    const deferredAudit = await successful<AuditResult>(wizard, 'audit', {});
    assert.ok(deferredAudit.findings.some((finding) => finding.actual === 'font-black'));
    assert.ok(deferredAudit.findings.every((finding) => finding.category === 'typography'));

    // A prepared receipt is only evidence when its resulting hash matches committed policy.
    const receipts = (await readdir(join(root, recordsDir))).filter((name) =>
      name.startsWith('activation-'),
    );
    assert.equal(receipts.length, 1);
    const receipt = JSON.parse(await readFile(join(root, recordsDir, receipts[0]), 'utf8'));
    assert.equal(receipt.status, 'prepared-decision');
    assert.equal(
      receipt.resultingManifestHash,
      hash(await readFile(join(root, 'usual.design.json'), 'utf8')),
    );

    await close(wizard);
    wizard = undefined;
    wizard = await startWizard(root);
    const resumed = await successful<State>(wizard, 'state');
    assert.deepEqual(resumed.manifest?.active, policyAfter.active);
    assert.ok(resumed.audit?.findings.some((finding) => finding.category === 'typography'));
    assert.equal(await readFile(join(root, handoff.path), 'utf8'), savedPlan);
    const persistedAudit = JSON.parse(
      await readFile(join(root, recordsDir, 'audit.json'), 'utf8'),
    ) as AuditResult;
    assert.equal(persistedAudit.snapshot, deferredAudit.snapshot);
    assert.ok(persistedAudit.findings.some((finding) => finding.category === 'typography'));
    assert.match(
      await readFile(join(root, recordsDir, 'audit.md'), 'utf8'),
      /Inactive categories are unchecked by lint/,
    );
    // Resume the deferred category from persisted evidence, then activate it deliberately.
    const later = await successful<AuditResult>(wizard, 'audit', {});
    const laterPlan = await successful<Plan>(wizard, 'plan', {
      findingIds: later.findings.map((finding) => finding.id),
      expectedSnapshot: later.snapshot,
    });
    assert.ok(laterPlan.plan.selected.every((finding) => finding.category === 'typography'));
    const policyBeforeTypographyRepair = await readFile(join(root, 'usual.design.json'), 'utf8');
    await writeFile(appPath, repairedApp.replace('text-9xl', 'text-sm'));
    assert.equal(
      await readFile(join(root, 'usual.design.json'), 'utf8'),
      policyBeforeTypographyRepair,
    );
    const typographyClean = await successful<AuditResult>(wizard, 'audit', {});
    assert.deepEqual(typographyClean.findings, []);
    await successful(wizard, 'activate', {
      categories: ['typography'],
      expectedSnapshot: typographyClean.snapshot,
    });
    await writeFile(appPath, repairedApp);
    const newTypographyDrift = await runProject(root, 'check');
    assert.equal(resultExit(newTypographyDrift), 1);
    assert.ok(newTypographyDrift.findings.some((finding) => finding.actual === 'text-9xl'));
  } finally {
    if (wizard) await close(wizard);
    await rm(root, { recursive: true, force: true });
  }
});

test('HTTP rejects source changes after repair selection and stale activation without modifying policy', async () => {
  const root = await atlas();
  let wizard: Wizard | undefined;
  try {
    const manifestPath = join(root, 'usual.design.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
    manifest.active = [];
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    const policyBefore = await readFile(manifestPath, 'utf8');
    wizard = await startWizard(root);
    const audit = await successful<AuditResult>(wizard, 'audit', {});
    const selectedIds = audit.findings.map((finding) => finding.id);
    const appPath = join(root, 'src/App.tsx');
    await writeFile(appPath, (await readFile(appPath, 'utf8')) + '\n// Changed after selection.\n');
    const stalePlan = await api(wizard, 'plan', {
      findingIds: selectedIds,
      expectedSnapshot: audit.snapshot,
    });
    assert.equal(stalePlan.status, 400);
    assert.match(stalePlan.body.error, /source or policy changed/i);
    assert.equal(existsSync(join(root, recordsDir, 'repairs')), false);

    await writeFile(appPath, repairedApp.replace(' text-9xl', ''));
    const clean = await successful<AuditResult>(wizard, 'audit', {});
    assert.deepEqual(clean.findings, []);
    await writeFile(appPath, (await readFile(appPath, 'utf8')) + '// Changed after audit.\n');
    const staleActivation = await api(wizard, 'activate', {
      categories: ['colors'],
      expectedSnapshot: clean.snapshot,
    });
    assert.equal(staleActivation.status, 400);
    assert.match(staleActivation.body.error, /stale audit/i);
    assert.equal(await readFile(manifestPath, 'utf8'), policyBefore);
    assert.equal(
      (await readdir(join(root, recordsDir))).some((name) => name.startsWith('activation-')),
      false,
    );

    const current = await successful<AuditResult>(wizard, 'audit', {});
    const activated = await successful<AuditResult>(wizard, 'activate', {
      categories: ['colors'],
      expectedSnapshot: current.snapshot,
    });
    assert.deepEqual(activated.active, ['colors']);
    assert.deepEqual(activated.findings, []);
  } finally {
    if (wizard) await close(wizard);
    await rm(root, { recursive: true, force: true });
  }
});

test('built wizard serves its HTML and referenced bundled assets over HTTP', async (context) => {
  const entry = fileURLToPath(new URL('../dist/server.js', import.meta.url));
  const index = fileURLToPath(new URL('../dist/wizard/index.html', import.meta.url));
  if (!existsSync(entry) || !existsSync(index)) {
    context.skip('Build core and wizard before running packaged static-asset acceptance.');
    return;
  }
  const built = (await import(entry)) as { startWizard: typeof startWizard };
  const root = await atlas();
  const wizard = await built.startWizard(root);
  try {
    const response = await fetch(wizard.origin);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/);
    const html = await response.text();
    assert.match(html, /Usual Design/);
    assert.ok(!html.includes(wizard.token));
    const assets = [...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)].map(
      (match) => match[1],
    );
    assert.ok(assets.some((asset) => asset.endsWith('.js')));
    assert.ok(assets.some((asset) => asset.endsWith('.css')));
    for (const asset of assets) {
      const served = await fetch(new URL(asset, wizard.origin + '/'));
      assert.equal(served.status, 200, asset);
      assert.match(
        served.headers.get('content-type') ?? '',
        asset.endsWith('.js') ? /^text\/javascript/ : /^text\/css/,
      );
      assert.ok((await served.text()).length > 0);
    }
    assert.equal((await successful<State>(wizard, 'state')).manifest?.version, 1);
  } finally {
    await close(wizard);
    await rm(root, { recursive: true, force: true });
  }
});
