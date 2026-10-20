import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { loadManifest } from '../src/config.js';
import { runProject, resultExit } from '../src/project.js';
import type { Category, SemanticRule } from '../src/types.js';

async function check(rule: SemanticRule, source: string, active?: Category[]) {
  const root = await mkdtemp(join(tmpdir(), 'usual-semantic-context-'));
  try {
    await cp(resolve('fixtures/ember'), root, { recursive: true });
    const manifest = structuredClone((await loadManifest(root)).manifest);
    manifest.semantics = [rule];
    if (active) manifest.active = active;
    await writeFile(join(root, 'usual.design.json'), JSON.stringify(manifest));
    await writeFile(join(root, 'src/Page.jsx'), source);
    return await runProject(root, 'check');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

const contextual: SemanticRule = {
  id: 'surface-copy',
  target: { element: 'div', classes: ['bg-ocean', 'rounded-lg'] },
  requireClasses: ['text-snow'],
};

test('unqualified semantic forbidden utilities cannot be hidden by variants or important modifiers', async () => {
  const rule: SemanticRule = {
    id: 'no-ocean',
    target: { element: 'div' },
    forbidClasses: ['bg-ocean'],
  };
  for (const value of ['hover:bg-ocean', 'md:focus:bg-ocean!', '[&:hover]:bg-ocean']) {
    const result = await check(rule, `export const Page=()=> <div className="${value}"/>;`);
    assert.ok(result.findings.some((finding) => finding.ruleId === 'no-ocean'));
  }
  const scoped = await check(
    { ...rule, forbidClasses: ['hover:bg-ocean'] },
    'export const Page=()=> <div className="focus:bg-ocean"/>;',
  );
  assert.deepEqual(scoped.findings, []);
});

test('semantic class context is exact all-of matching, not a global requirement', async () => {
  for (const classes of ['bg-ocean rounded-full', 'rounded-lg', 'hover:bg-ocean rounded-lg']) {
    const result = await check(contextual, `export const Page=()=> <div className="${classes}"/>;`);
    assert.deepEqual(result.findings, []);
  }
  const result = await check(
    contextual,
    `export const Page=()=> <div className="bg-ocean rounded-lg"/>;`,
  );
  assert.ok(result.findings.some((f) => f.ruleId === 'surface-copy'));
});

test('required classes are evaluated only in branches matching the complete context', async () => {
  const result = await check(
    contextual,
    `export const Page=({ok})=> <div className={ok?'bg-ocean rounded-lg text-snow':'bg-ocean rounded-full'}/>;`,
  );
  assert.deepEqual(result.findings, []);
  const failed = await check(
    contextual,
    `export const Page=({ok})=> <div className={ok?'bg-ocean rounded-lg':'bg-ocean rounded-full text-snow'}/>;`,
  );
  assert.ok(failed.findings.some((f) => f.ruleId === 'surface-copy'));
});

test('forbidden classes on nonmatching alternatives do not trigger contextual violations', async () => {
  const rule: SemanticRule = {
    id: 'surface-shape',
    target: { element: 'div', classes: ['bg-ocean'] },
    forbidClasses: ['rounded-full'],
  };
  const result = await check(
    rule,
    `export const Page=({ok})=> <div className={ok?'bg-ocean rounded-lg':'text-snow rounded-full'}/>;`,
  );
  assert.deepEqual(result.findings, []);
  const failed = await check(
    rule,
    `export const Page=()=> <div className="bg-ocean rounded-full"/>;`,
  );
  assert.ok(failed.findings.some((f) => f.ruleId === 'surface-shape'));
});

test('contextual required props apply when at least one finite branch matches', async () => {
  const rule: SemanticRule = {
    id: 'action-role',
    target: { element: 'div', classes: ['bg-ocean'] },
    requireProps: { role: 'button' },
  };
  const result = await check(
    rule,
    `export const Page=({ok})=> <div role="button" className={ok?'bg-ocean':'text-snow'}/>;`,
  );
  assert.deepEqual(result.findings, []);
  const failed = await check(
    rule,
    `export const Page=({ok})=> <div className={ok?'bg-ocean':'text-snow'}/>;`,
  );
  assert.ok(failed.findings.some((f) => f.ruleId === 'action-role'));
});

test('dynamic class context blocks its affected component category even with style categories inactive', async () => {
  const rule: SemanticRule = {
    id: 'action-role',
    target: { element: 'div', classes: ['bg-ocean'] },
    requireProps: { role: 'button' },
  };
  const result = await check(rule, `export const Page=({classes})=> <div className={classes}/>;`, [
    'components',
  ]);
  assert.equal(resultExit(result), 1);
  const issue = result.findings.find(
    (f) => f.kind === 'coverage' && f.message.includes('class context'),
  );
  assert.deepEqual(issue?.affectedCategories, ['components']);
});

test('dynamic inline style does not make a known class context unknown', async () => {
  const rule: SemanticRule = {
    id: 'action-role',
    target: { element: 'div', classes: ['bg-ocean'] },
    requireProps: { role: 'button' },
  };
  const result = await check(
    rule,
    `export const Page=({color})=> <div role="button" className="bg-ocean" style={{color}}/>;`,
    ['components'],
  );
  assert.deepEqual(result.findings, []);
});

test('known nonmatching target props exclude dynamic context without speculative failures', async () => {
  const rule: SemanticRule = {
    id: 'action-role',
    target: { element: 'div', classes: ['bg-ocean'], props: { 'data-intent': 'primary' } },
    requireProps: { role: 'button' },
  };
  const result = await check(
    rule,
    `export const Page=({classes})=> <div data-intent="secondary" className={classes}/>;`,
    ['components'],
  );
  assert.deepEqual(result.findings, []);
});
