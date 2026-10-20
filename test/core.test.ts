import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { parseManifest, loadManifest, saveManifest, defaultManifest } from '../src/config.js';
import { atomicWrite, hash } from '../src/files.js';
import { runProject, resultExit } from '../src/project.js';
import { createPlan, activate } from '../src/records.js';
import { startWizard } from '../src/server.js';
async function fixture(name = 'atlas') {
  const root = await mkdtemp(join(tmpdir(), 'usual-core-'));
  await cp(resolve('fixtures', name), root, { recursive: true });
  return root;
}
async function modify(root: string, change: (s: string) => string) {
  const p = join(root, 'src/App.tsx');
  await writeFile(p, change(await readFile(p, 'utf8')));
}
test('strict manifest validation rejects unknown fields, duplicate IDs, escaping paths, and empty constraints', () => {
  const m = defaultManifest();
  assert.deepEqual(parseManifest(m).active, []);
  assert.throws(() => parseManifest({ ...m, typo: true }), /Invalid manifest/);
  assert.throws(() => parseManifest({ ...m, include: ['../secret'] }), /inside the project/);
  assert.throws(
    () => parseManifest({ ...m, semantics: [{ id: 'x', target: { element: 'a' } }] }),
    /no constraint/,
  );
});
test('independent designs: Atlas catches value/semantic/component drift and Ember passes', async () => {
  const a = await runProject(resolve('fixtures/atlas'), 'check');
  assert.equal(a.errors.length, 0);
  assert.ok(a.findings.some((f) => f.ruleId === 'allowed.colors'));
  assert.ok(a.findings.some((f) => f.ruleId === 'action-color'));
  assert.ok(a.findings.some((f) => f.ruleId === 'use-button'));
  const b = await runProject(resolve('fixtures/ember'), 'check');
  assert.deepEqual(b.errors, []);
  assert.deepEqual(b.findings, []);
  assert.equal(resultExit(b), 0);
});
test('inactive typography is fully skipped by check but included in audit', async () => {
  const root = await fixture();
  try {
    await modify(root, (s) => s.replace('p-4', 'p-4 text-9xl'));
    const c = await runProject(root, 'check'),
      a = await runProject(root, 'audit');
    assert.equal(
      c.findings.some((f) => f.category === 'typography'),
      false,
    );
    assert.ok(a.findings.some((f) => f.category === 'typography'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('literal conditionals preserve branches; dynamic classes remain unverifiable', async () => {
  const root = await fixture();
  try {
    await modify(
      root,
      () =>
        `export function A({ok,value}) { return <div className={ok ? "bg-brand" : "bg-wrong"}/> }`,
    );
    let r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.actual === 'bg-wrong'));
    await modify(root, () => `export function A({value}) { return <div className={value}/> }`);
    r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.kind === 'coverage'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('unrelated dynamic props do not create design failures', async () => {
  const root = await fixture('ember');
  try {
    await writeFile(
      join(root, 'src/Page.jsx'),
      `export function Page({label}) { return <a href={label} aria-label={label} className="bg-ocean"/> }`,
    );
    const r = await runProject(root, 'check');
    assert.deepEqual(r.findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('dynamic semantic matching props fail coverage instead of silently skipping', async () => {
  const root = await fixture();
  try {
    await modify(
      root,
      () => `export function A({intent}) { return <a data-intent={intent} className="bg-brand"/> }`,
    );
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.kind === 'coverage' && f.message.includes('semantic')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('arbitrary variable references are distinct from forbidden arbitrary literals', async () => {
  const root = await fixture();
  try {
    await modify(
      root,
      () => `export function A(){return <div className="bg-[var(--color-brand)]"/>}`,
    );
    let r = await runProject(root, 'check');
    assert.equal(
      r.findings.some((f) => f.category === 'colors'),
      false,
    );
    await modify(root, () => `export function A(){return <div className="bg-[#ff0000]"/>}`);
    r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.category === 'colors'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('inline and covered stylesheet values cannot bypass color policy', async () => {
  const root = await fixture();
  try {
    await modify(root, () => `export function A(){return <div style={{color:"red"}}/>}`);
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.actual === 'color: red'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('parser errors and unsupported Tailwind majors are operational errors', async () => {
  const root = await fixture();
  try {
    await modify(root, () => `export function {`);
    assert.equal(resultExit(await runProject(root, 'check')), 2);
    await writeFile(join(root, 'package.json'), '{"devDependencies":{"tailwindcss":"^3.4.0"}}');
    await assert.rejects(runProject(root, 'check'), /Unsupported/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('a successful approved repair passes with unchanged policy', async () => {
  const root = await fixture();
  try {
    const before = await readFile(join(root, 'usual.design.json'), 'utf8');
    const a = await runProject(root, 'audit');
    const plan = await createPlan(
      root,
      a.findings.map((f) => f.id),
      a.snapshot,
    );
    assert.ok(plan.path.endsWith('.json'));
    await modify(
      root,
      () =>
        `import {Button} from './Button';export function App(){return <a data-intent="primary" className="bg-brand text-paper rounded-control"><Button/></a>}`,
    );
    const r = await runProject(root, 'check');
    assert.deepEqual(r.findings, []);
    assert.equal(await readFile(join(root, 'usual.design.json'), 'utf8'), before);
    await assert.rejects(createPlan(root, [a.findings[0].id], a.snapshot), /changed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('activation requires clean current evidence and cannot be bypassed by the editor', async () => {
  const root = await fixture('ember');
  try {
    const { manifest: loadedManifest, manifestHash } = await loadManifest(root);
    const manifest = structuredClone(loadedManifest);
    manifest.active = [];
    await saveManifest(root, manifest, manifestHash);
    const a = await runProject(root, 'audit');
    assert.deepEqual(a.findings, []);
    const added = { ...manifest, active: ['colors'] };
    await assert.rejects(
      saveManifest(root, added, hash(await readFile(join(root, 'usual.design.json'), 'utf8'))),
      /Activate categories/,
    );
    const r = await activate(root, ['colors'], a.snapshot);
    assert.deepEqual(r.active, ['colors']);
    const before = await runProject(root, 'audit');
    await writeFile(join(root, 'src/Page.jsx'), 'export const P=()=> <div className="bg-bad"/>');
    await assert.rejects(activate(root, ['typography'], before.snapshot), /Stale/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('atomic writes reject stale content and symlink escapes', async () => {
  const root = await fixture();
  const outside = await mkdtemp(join(tmpdir(), 'usual-outside-'));
  try {
    await assert.rejects(atomicWrite(root, 'usual.design.json', '{}', 'stale'), /Stale/);
    await symlink(outside, join(root, 'escape'));
    await assert.rejects(atomicWrite(root, 'escape/file', 'secret', null), /escapes/);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
test('discovery never executes project plugins and reports them as unresolved', async () => {
  const root = await fixture();
  try {
    await writeFile(join(root, 'src/theme.css'), '@plugin "./evil.js";');
    await writeFile(join(root, 'src/evil.js'), 'throw Error("EXECUTED")');
    const r = await runProject(root, 'audit');
    assert.ok(r.findings.some((f) => f.message.includes('@plugin')));
    assert.equal(
      r.errors.some((e) => e.includes('EXECUTED')),
      false,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('local wizard APIs require session authorization and same-origin requests', async () => {
  const root = await fixture();
  const w = await startWizard(root);
  try {
    assert.equal((await fetch(w.origin + '/api/state')).status, 403);
    assert.equal(
      (
        await fetch(w.origin + '/api/state', {
          headers: { 'X-Usual-Token': w.token, Origin: 'https://evil.test' },
        })
      ).status,
      403,
    );
    const response = await fetch(w.origin + '/api/state', {
      headers: { 'X-Usual-Token': w.token },
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).manifest.version, 1);
    const invalid = await fetch(w.origin + '/api/activate', {
      method: 'POST',
      headers: { 'X-Usual-Token': w.token, 'Content-Type': 'application/json' },
      body: '{"categories":["colors"]}',
    });
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise<void>((r) => w.server.close(() => r()));
    await rm(root, { recursive: true, force: true });
  }
});
test('logical alternatives and lexical shadowing cannot produce false passes', async () => {
  const root = await fixture('ember');
  try {
    const cases = [
      `export function P(){return <div className={"bg-forbidden" || "bg-ocean"}/>}`,
      `const tone="bg-ocean";export function P(){const tone="bg-forbidden";return <div className={tone}/>}`,
      `import clsx from 'clsx';export function P(){const clsx=()=>"bg-forbidden";return <div className={clsx("bg-ocean")}/>}`,
      `import clsx from 'clsx';const tones=["bg-ocean"];tones.push("bg-forbidden");export function P(){return <div className={clsx(tones)}/>}`,
    ];
    for (const source of cases) {
      await writeFile(join(root, 'src/Page.jsx'), source);
      const r = await runProject(root, 'check');
      assert.notEqual(resultExit(r), 0, source);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('approved variables cannot authorize surrounding forbidden literals or calculations', async () => {
  const root = await fixture();
  try {
    for (const source of [
      `export function P(){return <div style={{background:"linear-gradient(var(--color-brand),red)"}}/>}`,
      `export function P(){return <div className="bg-[linear-gradient(var(--color-brand),red)]"/>}`,
      `export function P(){return <div className="bg-[var(--color-brand,red)]"/>}`,
    ]) {
      await modify(root, () => source);
      const r = await runProject(root, 'check');
      assert.ok(r.findings.some((f) => f.category === 'colors'));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('local imported sources outside declared coverage are explicit failures', async () => {
  const root = await fixture('ember');
  try {
    await writeFile(join(root, 'hidden.css'), 'div { background:red }');
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import '../hidden.css';export function P(){return <div className="bg-ocean"/>}`,
    );
    let r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.message.includes('outside declared')));
    await writeFile(join(root, 'hidden.jsx'), 'export const H=()=> <div className="bg-bad"/>');
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {H} from '../hidden';export function P(){return <H/>}`,
    );
    r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.kind === 'coverage'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('local aliases resolve from nonexecuted JSONC config and are included in freshness identity', async () => {
  const root = await fixture('ember');
  try {
    await writeFile(
      join(root, 'tsconfig.json'),
      '{/* local */"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}',
    );
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Control} from '@/Control';export function P(){return <Control/>}`,
    );
    const a = await runProject(root, 'check');
    assert.deepEqual(a.findings, []);
    await writeFile(
      join(root, 'tsconfig.json'),
      '{"compilerOptions":{"paths":{"@/*":["missing/*"]}}}',
    );
    const b = await runProject(root, 'check');
    assert.notEqual(a.snapshot, b.snapshot);
    assert.ok(b.findings.some((f) => f.kind === 'coverage'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('semantic required tokens cannot pass alongside a conflicting approved token', async () => {
  const root = await fixture();
  try {
    const { manifest: loadedManifest, manifestHash } = await loadManifest(root);
    const manifest = structuredClone(loadedManifest);
    manifest.allowed!.colors!.classes!.push('bg-other');
    await saveManifest(root, manifest, manifestHash);
    await modify(
      root,
      () => `export function P(){return <a data-intent="primary" className="bg-brand bg-other"/>}`,
    );
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.ruleId === 'action-color'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('policy decision findings cannot become ordinary application repair authority', async () => {
  const root = await fixture();
  try {
    const { manifest: loadedManifest, manifestHash } = await loadManifest(root);
    const manifest = structuredClone(loadedManifest);
    delete manifest.allowed!.typography;
    await saveManifest(root, manifest, manifestHash);
    const a = await runProject(root, 'audit');
    const decision = a.findings.find((f) => f.kind === 'decision')!;
    await assert.rejects(createPlan(root, [decision.id], a.snapshot), /Policy decisions/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('import restrictions track original export names despite local aliases', async () => {
  const root = await fixture('ember');
  try {
    const { manifest: loadedManifest, manifestHash } = await loadManifest(root);
    const manifest = structuredClone(loadedManifest);
    manifest.imports = [
      {
        id: 'no-legacy-button',
        from: 'legacy-ui',
        names: ['Button'],
        replacement: { name: 'Control', from: './Control' },
      },
    ];
    await saveManifest(root, manifest, manifestHash);
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Button as Action} from 'legacy-ui'; export const Page=()=> <Action/>`,
    );
    const r = await runProject(root, 'check');
    assert.ok(
      r.findings.some(
        (f) => f.ruleId === 'no-legacy-button' && f.actual === 'Button from legacy-ui',
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('approved variable cycles and missing aliases cannot establish coverage', async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, 'src/theme.css'),
      '@theme {--color-brand:var(--missing);--color-paper:var(--color-paper)}',
    );
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.message.includes('missing definition')));
    assert.ok(r.findings.some((f) => f.message.includes('cyclic reference')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('audit saves preserve edited human notes and repair progress follows moved evidence', async () => {
  const root = await fixture();
  try {
    const a = await runProject(root, 'audit');
    const plan = await createPlan(
      root,
      [a.findings.find((f) => f.ruleId === 'allowed.colors')!.id],
      a.snapshot,
    );
    await modify(root, (s) => '\n\n' + s);
    const moved = await runProject(root, 'audit');
    const { saveAudit } = await import('../src/records.js');
    await saveAudit(root, moved);
    const progress = JSON.parse(
      await readFile(join(root, 'docs/usual-design/repair-progress.json'), 'utf8'),
    );
    assert.equal(progress.batches[0].findings[0].status, 'still-reported');
    const md = join(root, 'docs/usual-design/audit.md');
    await writeFile(md, (await readFile(md, 'utf8')) + '\nPersonal note');
    await assert.rejects(saveAudit(root, moved), /non-generated changes/);
    assert.ok((await readFile(md, 'utf8')).endsWith('Personal note'));
    assert.equal(JSON.parse(await readFile(join(root, plan.path), 'utf8')).status, 'approved');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('namespace members retain semantic identity and cannot bypass named import restrictions', async () => {
  const root = await fixture('ember');
  try {
    const { manifest: loadedManifest, manifestHash } = await loadManifest(root);
    const manifest = structuredClone(loadedManifest);
    manifest.semantics!.push({
      id: 'kit-role',
      target: { component: { name: 'Button', from: 'kit-ui' } },
      requireProps: { 'aria-label': 'Approved' },
    });
    manifest.imports = [{ id: 'no-legacy', from: 'legacy-ui', names: ['Button'] }];
    await saveManifest(root, manifest, manifestHash);
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import * as Kit from 'kit-ui';import * as Legacy from 'legacy-ui';export const Page=()=> <><Kit.Button/><Legacy.Button/></>`,
    );
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.ruleId === 'kit-role'));
    assert.ok(r.findings.some((f) => f.ruleId === 'no-legacy'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('negative spacing needs explicit approval rather than inheriting the positive value', async () => {
  const root = await fixture('ember');
  try {
    let { manifest, manifestHash } = structuredClone(await loadManifest(root));
    manifest.allowed!.spacing!.classes!.push('m-4');
    await saveManifest(root, manifest, manifestHash);
    await writeFile(join(root, 'src/Page.jsx'), `export const Page=()=> <div className="-m-4"/>`);
    const denied = await runProject(root, 'check');
    assert.ok(denied.findings.some((f) => f.actual === '-m-4' && f.category === 'spacing'));
    ({ manifest, manifestHash } = structuredClone(await loadManifest(root)));
    manifest.allowed!.spacing!.classes!.push('-m-4');
    await saveManifest(root, manifest, manifestHash);
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('canonical cn wrappers resolve through explicit local compiler aliases without code execution', async () => {
  const root = await fixture('ember');
  try {
    await writeFile(join(root, 'tsconfig.json'), '{"compilerOptions":{"paths":{"@/*":["src/*"]}}}');
    await writeFile(
      join(root, 'src/utils.jsx'),
      `import clsx from 'clsx';import {twMerge} from 'tailwind-merge';export function cn(...inputs){return twMerge(clsx(inputs))}`,
    );
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {cn} from '@/utils';export const Page=()=> <div className={cn("bg-bad", "bg-ocean")}/>`,
    );
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
