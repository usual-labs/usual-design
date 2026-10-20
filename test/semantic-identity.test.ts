import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runProject } from '../src/project.js';
import { loadManifest, saveManifest } from '../src/config.js';
import type { Manifest } from '../src/types.js';

async function fixture(run: (root: string, manifest: Manifest) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'usual-semantic-review-'));
  try {
    await cp(resolve('fixtures/ember'), root, { recursive: true });
    const { manifest } = await loadManifest(root);
    const draft = structuredClone(manifest);
    draft.semantics!.push({
      id: 'control-role',
      target: { component: { name: 'Control', from: './Control' } },
      requireProps: { 'aria-label': 'Approved' },
    });
    await run(root, draft);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('semantic component rules follow proven reexports despite renamed imports', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-semantic-export-'));
  await cp(resolve('fixtures/ember'), root, { recursive: true });
  try {
    const loaded = await loadManifest(root);
    const manifest = structuredClone(loaded.manifest),
      manifestHash = loaded.manifestHash;
    manifest.semantics!.push({
      id: 'control-role',
      target: { component: { name: 'Control', from: './Control' } },
      requireProps: { 'aria-label': 'Approved' },
    });
    await saveManifest(root, manifest, manifestHash);
    await writeFile(join(root, 'src/barrel.jsx'), `export {Control as Action} from './Control'`);
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Action as C} from './barrel';export const Page=()=> <C/>`,
    );
    const r = await runProject(root, 'check');
    assert.ok(r.findings.some((f) => f.ruleId === 'control-role'));
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Action as C} from './barrel';export const Page=()=> <C aria-label="Approved"/>`,
    );
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('renamed dynamic and mutable component exports cannot silently skip semantic coverage', async () => {
  for (const declaration of ['export const Action=(()=>Control)();', 'export let Action=Control;'])
    await fixture(async (root, manifest) => {
      await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
      await writeFile(
        join(root, 'src/barrel.jsx'),
        `import {Control} from './Control';${declaration}`,
      );
      await writeFile(
        join(root, 'src/Page.jsx'),
        `import {Action as C} from './barrel';export const Page=()=> <C/>;`,
      );
      const result = await runProject(root, 'check');
      assert.equal(result.errors.length, 0);
      assert.ok(
        result.findings.some((f) => f.kind === 'coverage' && f.message.includes('control-role')),
      );
    });
});

test('immutable same-file aliases retain the semantic identity of imported components', async () => {
  await fixture(async (root, manifest) => {
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    const source = (props: string) =>
      `import {Control} from './Control';const Alias=Control;export const Page=()=> <Alias ${props}/>;`;
    await writeFile(join(root, 'src/Page.jsx'), source(''));
    const failed = await runProject(root, 'check');
    assert.ok(failed.findings.some((f) => f.ruleId === 'control-role'));
    await writeFile(join(root, 'src/Page.jsx'), source('aria-label="Approved"'));
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  });
});

test('lexical shadows never borrow a module-global component alias identity', async () => {
  await fixture(async (root, manifest) => {
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Control} from './Control';const Alias=Control;export function Page({Alias}){return <Alias aria-label="Approved"/>;}`,
    );
    const result = await runProject(root, 'check');
    assert.ok(
      result.findings.some((f) => f.kind === 'coverage' && f.message.includes('control-role')),
    );
  });
});

test('known unrelated local components and intrinsic elements remain outside component semantic targets', async () => {
  await fixture(async (root, manifest) => {
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    await writeFile(
      join(root, 'src/Page.jsx'),
      `const Other=()=> <div/>;export const Page=()=> <Other/>;`,
    );
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  });
});

test('unresolved identity coverage affects only the categories enforced by its semantic rule', async () => {
  await fixture(async (root, manifest) => {
    manifest.active = ['typography'];
    manifest.semantics = [
      {
        id: 'control-color',
        target: { component: { name: 'Control', from: './Control' } },
        requireClasses: ['bg-ocean'],
      },
    ];
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    await writeFile(
      join(root, 'src/barrel.jsx'),
      `import {Control} from './Control';export const Action=(()=>Control)();`,
    );
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Action} from './barrel';export const Page=()=> <Action/>;`,
    );
    assert.deepEqual((await runProject(root, 'check')).findings, []);
    const audit = await runProject(root, 'audit');
    const issue = audit.findings.find(
      (f) => f.kind === 'coverage' && f.message.includes('control-color'),
    );
    assert.deepEqual(issue?.affectedCategories, ['colors']);
  });
});

test('exact external component imports remain usable without inspecting third-party factories', async () => {
  await fixture(async (root, manifest) => {
    manifest.semantics = [
      {
        id: 'external-role',
        target: { component: { name: 'Control', from: 'ui-factory' } },
        requireProps: { 'aria-label': 'Approved' },
      },
    ];
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    await writeFile(
      join(root, 'src/Page.jsx'),
      `import {Control} from 'ui-factory';export const Page=()=> <Control aria-label="Approved"/>;`,
    );
    assert.deepEqual((await runProject(root, 'check')).findings, []);
  });
});
