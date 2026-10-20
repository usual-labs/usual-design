import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, test } from 'node:test';
import { applySetup, applySetupPlan, handleHook, planSetup } from '../src/integrations.js';
import type { AuditResult } from '../src/types.js';

const exec = promisify(execFile);
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'usual design setup '));
  temporary.push(root);
  await writeFile(
    path.join(root, 'package.json'),
    '{\n  "name": "example",\n  "scripts": {\n    "test": "existing command"\n  },\n  "private": true\n}\n',
  );
  return realpath(root);
}
const output = (extra: Partial<AuditResult> = {}): AuditResult => ({
  version: 1,
  mode: 'check',
  snapshot: 'source',
  manifestHash: 'policy',
  findings: [],
  active: ['colors'],
  inactive: ['typography', 'spacing', 'shape', 'components'],
  files: [],
  errors: [],
  inventory: { files: [], tokens: [], components: [], warnings: [] },
  ...extra,
});
const bad = () =>
  output({
    findings: [
      {
        id: 'one',
        ruleId: 'allowed.colors',
        category: 'colors',
        file: 'app.tsx',
        line: 3,
        column: 4,
        message: 'Unapproved color',
        expected: 'bg-brand',
        actual: 'bg-red-500',
        kind: 'violation',
      },
    ],
  });

test('setup previews, preserves instructions/package text, and is idempotent for both clients', async () => {
  const root = await fixture();
  const instructions = '# Existing instructions\n\nKeep this exact wording.\n';
  await writeFile(path.join(root, 'AGENTS.md'), instructions);
  const before = await readFile(path.join(root, 'package.json'), 'utf8');
  const plan = await planSetup(root, 'both');
  assert.deepEqual(plan.conflicts, []);
  await assert.rejects(readFile(path.join(root, '.agents/skills/usual-design/SKILL.md')));
  await applySetupPlan(plan);
  assert.ok((await readFile(path.join(root, 'AGENTS.md'), 'utf8')).startsWith(instructions));
  const after = await readFile(path.join(root, 'package.json'), 'utf8');
  assert.equal(after.replace(',\n    "lint:design": "usual-design check"', ''), before);
  assert.equal(JSON.parse(after).scripts.test, 'existing command');
  assert.match(
    await readFile(path.join(root, '.claude/skills/usual-design/SKILL.md'), 'utf8'),
    /name: usual-design/,
  );
  assert.deepEqual((await planSetup(root, 'both')).changes, []);
});

test('a custom skill conflict prevents all setup writes', async () => {
  const root = await fixture();
  await mkdir(path.join(root, '.agents/skills/usual-design'), { recursive: true });
  await writeFile(path.join(root, '.agents/skills/usual-design/SKILL.md'), 'Custom skill');
  const plan = await planSetup(root, 'codex');
  assert.ok(plan.conflicts.some((conflict) => conflict.includes('user edits')));
  await assert.rejects(applySetupPlan(plan), /conflicts/);
  assert.equal(
    await readFile(path.join(root, '.agents/skills/usual-design/SKILL.md'), 'utf8'),
    'Custom skill',
  );
  await assert.rejects(readFile(path.join(root, 'AGENTS.md')));
});

test('modified managed instructions and changed npm scripts require manual review', async () => {
  const root = await fixture();
  await applySetup(root, 'codex');
  await writeFile(
    path.join(root, 'AGENTS.md'),
    (await readFile(path.join(root, 'AGENTS.md'), 'utf8')).replace(
      'active categories only',
      'everything',
    ),
  );
  assert.ok(
    (await planSetup(root, 'codex')).conflicts.some((conflict) =>
      conflict.includes('modified Usual section'),
    ),
  );
  await writeFile(path.join(root, 'package.json'), '{"scripts":{"lint:design":"custom command"}}');
  assert.ok(
    (await planSetup(root, 'codex')).conflicts.some((conflict) =>
      conflict.includes('different lint:design'),
    ),
  );
});

test('setup rejects symlink escapes and stale previews before writing', async () => {
  const root = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'usual-outside-'));
  temporary.push(outside);
  await symlink(outside, path.join(root, '.agents'), 'dir');
  const unsafe = await planSetup(root, 'codex');
  assert.ok(unsafe.conflicts.some((conflict) => conflict.includes('symbolic link')));
  await assert.rejects(applySetupPlan(unsafe));
  await assert.rejects(readFile(path.join(outside, 'skills/usual-design/SKILL.md')));
  await rm(path.join(root, '.agents'));
  const stale = await planSetup(root, 'codex');
  await writeFile(path.join(root, 'package.json'), '{"name":"changed"}');
  await assert.rejects(applySetupPlan(stale), /changed since setup preview/);
  await assert.rejects(readFile(path.join(root, 'AGENTS.md')));
});

test('native hooks are opt-in, preserve custom handlers, and remain idempotent', async () => {
  const root = await fixture();
  await mkdir(path.join(root, '.claude'));
  const custom = { matcher: 'Bash', hooks: [{ type: 'command', command: 'existing-check' }] };
  await writeFile(
    path.join(root, '.claude/settings.json'),
    JSON.stringify({ permissions: { deny: ['secret'] }, hooks: { PostToolUse: [custom] } }),
  );
  await applySetup(root, 'both', { hooks: true });
  const settings = JSON.parse(await readFile(path.join(root, '.claude/settings.json'), 'utf8'));
  assert.deepEqual(settings.hooks.PostToolUse[0], custom);
  assert.deepEqual(settings.permissions, { deny: ['secret'] });
  assert.equal(settings.hooks.Stop.length, 1);
  assert.equal(settings.hooks.PostToolUse[1].hooks[0].timeout, 30);
  assert.deepEqual((await planSetup(root, 'both', { hooks: true })).changes, []);
  await writeFile(path.join(root, '.codex/config.toml'), '[hooks]\n');
  assert.ok(
    (await planSetup(root, 'codex', { hooks: true })).conflicts.some((conflict) =>
      conflict.includes('inline [hooks]'),
    ),
  );
});

test('native runner finds the project from a nested cwd containing spaces', async () => {
  const root = await fixture();
  await applySetup(root, 'codex', { hooks: true });
  await mkdir(path.join(root, 'node_modules/@usual/design-lint/dist'), { recursive: true });
  await writeFile(
    path.join(root, 'node_modules/@usual/design-lint/dist/cli.js'),
    'process.stdout.write(JSON.stringify({argv:process.argv.slice(2),payload:require("fs").readFileSync(0,"utf8")}));',
  );
  const nested = path.join(root, 'src/nested path');
  await mkdir(nested, { recursive: true });
  const config = JSON.parse(await readFile(path.join(root, '.codex/hooks.json'), 'utf8'));
  const command = config.hooks.Stop[0].hooks[0].command;
  const { stdout } = await exec('/bin/sh', ['-c', `${command} </dev/null`], {
    cwd: nested,
    timeout: 5000,
  });
  assert.deepEqual(JSON.parse(stdout).argv, ['hook', '--root', root, '--host', 'codex']);
});

test('portable setup uses a shared skill and does not claim native installation', async () => {
  const root = await fixture();
  const plan = await applySetup(root, 'portable', { hooks: true });
  assert.ok(plan.notices.some((notice) => notice.includes('No native hooks')));
  assert.match(
    await readFile(path.join(root, 'docs/usual-design/SKILL.md'), 'utf8'),
    /name: usual-design/,
  );
  await assert.rejects(readFile(path.join(root, '.codex/hooks.json')));
});

test('commit hook propagates checker failures and refuses to replace an existing hook', async () => {
  const root = await fixture();
  await exec('git', ['init', '--quiet'], { cwd: root });
  await applySetup(root, 'portable', { commitHook: true });
  await mkdir(path.join(root, 'node_modules/.bin'), { recursive: true });
  const bin = path.join(root, 'node_modules/.bin/usual-design');
  await writeFile(bin, '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  const args = [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.invalid',
    'commit',
    '--allow-empty',
    '--quiet',
    '-m',
    'fixture',
  ];
  await exec('git', args, { cwd: root });
  await writeFile(bin, '#!/bin/sh\nexit 1\n');
  await assert.rejects(exec('git', args, { cwd: root }));
  await writeFile(path.join(root, '.git/hooks/pre-commit'), '#!/bin/sh\ncustom-check\n');
  assert.ok(
    (await planSetup(root, 'portable', { commitHook: true })).conflicts.some((conflict) =>
      conflict.includes('already exists'),
    ),
  );
});

for (const host of ['codex', 'claude'] as const) {
  test(`${host} hook preserves full-scope diagnostics and bounds unresolved Stop continuation`, async () => {
    const root = await fixture();
    const initial = await handleHook(
      root,
      host,
      { cwd: root, hook_event_name: 'Stop', stop_hook_active: false },
      async () => bad(),
    );
    assert.equal(initial.checkExitCode, 1);
    assert.equal(initial.output.decision, 'block');
    assert.match(String(initial.output.reason), /app.tsx:3:4/);
    assert.match(String(initial.output.reason), /Inactive \(unchecked\): typography/);
    const retry = await handleHook(
      root,
      host,
      { cwd: root, hook_event_name: 'Stop', stop_hook_active: true },
      async () => bad(),
    );
    assert.equal(retry.checkExitCode, 1);
    assert.equal(retry.output.continue, false);
    assert.match(
      String(retry.output.systemMessage),
      /FAILED.*\n.*\n.*\nAutomatic continuation stopped/s,
    );
    const clean = await handleHook(
      root,
      host,
      { cwd: root, hook_event_name: 'Stop', stop_hook_active: true },
      async () => output(),
    );
    assert.equal(clean.checkExitCode, 0);
    assert.equal(clean.output.decision, undefined);
    const edit = await handleHook(
      root,
      host,
      { cwd: root, hook_event_name: 'PostToolUse' },
      async () => bad(),
    );
    assert.equal(edit.checkExitCode, 1);
    assert.match(JSON.stringify(edit.output), /additionalContext/);
  });
}

test('hook errors, timeouts, malformed payloads, and escaped cwd never become a clean result', async () => {
  const root = await fixture();
  const cases = [
    handleHook(root, 'codex', null),
    handleHook(root, 'codex', { cwd: path.dirname(root), hook_event_name: 'Stop' }),
    handleHook(root, 'codex', { cwd: root, hook_event_name: 'Stop' }, async () =>
      output({ errors: ['Invalid manifest'] }),
    ),
    handleHook(root, 'claude', { cwd: root, hook_event_name: 'Stop' }, async () => {
      throw new Error('unavailable');
    }),
    handleHook(
      root,
      'claude',
      { cwd: root, hook_event_name: 'Stop' },
      async () => new Promise(() => {}),
      5,
    ),
  ];
  for (const response of await Promise.all(cases)) {
    assert.equal(response.checkExitCode, 2);
    assert.equal(response.output.continue, false);
    assert.match(JSON.stringify(response.output), /ERROR/);
    assert.doesNotMatch(JSON.stringify(response.output), /passed/);
  }
});

test('native adapter runs the real project checker through failing, repaired, and invalid-config states', async () => {
  const root = await fixture();
  await writeFile(
    path.join(root, 'package.json'),
    '{"name":"fixture","devDependencies":{"tailwindcss":"^4.1.0"}}',
  );
  await mkdir(path.join(root, 'src'));
  await writeFile(
    path.join(root, 'usual.design.json'),
    JSON.stringify({
      version: 1,
      include: ['src/**/*.tsx'],
      active: ['colors'],
      allowed: { colors: { classes: ['bg-brand'] } },
    }),
  );
  const source = path.join(root, 'src/App.tsx');
  await writeFile(source, 'export const App = () => <div className="bg-red-500" />;');
  const payload = { cwd: root, hook_event_name: 'Stop', stop_hook_active: false };
  const failure = await handleHook(root, 'codex', payload);
  assert.equal(failure.checkExitCode, 1);
  assert.equal(failure.output.decision, 'block');
  assert.match(String(failure.output.reason), /allowed.colors/);
  await writeFile(source, 'export const App = () => <div className="bg-brand" />;');
  assert.equal((await handleHook(root, 'codex', payload)).checkExitCode, 0);
  await writeFile(path.join(root, 'usual.design.json'), '{"version":999}');
  const invalid = await handleHook(root, 'codex', payload);
  assert.equal(invalid.checkExitCode, 2);
  assert.match(String(invalid.output.systemMessage), /ERROR/);
});

test('custom manifest paths remain safe data through npm, native hooks, and commit hooks', async () => {
  const root = await fixture();
  const configPath = "design's $(touch injected-dollar); touch injected-semicolon; #.json";
  await exec('git', ['init', '--quiet'], { cwd: root });
  const options = { hooks: true, commitHook: true, configPath };
  const preview = await planSetup(root, 'both', options);
  assert.deepEqual(preview.conflicts, []);
  await assert.rejects(readFile(path.join(root, configPath)));
  assert.ok(preview.notices.some((notice) => notice.includes('POSIX')));
  await applySetupPlan(preview);
  await mkdir(path.join(root, 'node_modules/.bin'), { recursive: true });
  await mkdir(path.join(root, 'node_modules/@usual/design-lint/dist'), { recursive: true });
  const fake =
    '#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n';
  await writeFile(path.join(root, 'node_modules/.bin/usual-design'), fake, { mode: 0o755 });
  await writeFile(path.join(root, 'node_modules/@usual/design-lint/dist/cli.js'), fake);
  const script = await exec('npm', ['run', '--silent', 'lint:design'], { cwd: root });
  assert.deepEqual(JSON.parse(script.stdout), ['check', '--config', configPath]);
  for (const host of ['codex', 'claude']) {
    const settingsPath = host === 'codex' ? '.codex/hooks.json' : '.claude/settings.json';
    const settings = JSON.parse(await readFile(path.join(root, settingsPath), 'utf8'));
    const command = settings.hooks.Stop[0].hooks[0].command;
    const result = await exec('/bin/sh', ['-c', `${command} </dev/null`], {
      cwd: root,
      timeout: 5000,
    });
    assert.deepEqual(JSON.parse(result.stdout), [
      'hook',
      '--root',
      root,
      '--host',
      host,
      '--config',
      configPath,
    ]);
  }
  const commit = await exec('/bin/sh', [path.join(root, '.git/hooks/pre-commit')], { cwd: root });
  assert.deepEqual(JSON.parse(commit.stdout), ['check', '--root', root, '--config', configPath]);
  assert.deepEqual((await planSetup(root, 'both', options)).changes, []);
  await assert.rejects(readFile(path.join(root, 'injected-dollar')));
  await assert.rejects(readFile(path.join(root, 'injected-semicolon')));
});

test('setup rejects custom manifest traversal, absolute paths, and symlink ancestors', async () => {
  const root = await fixture();
  await assert.rejects(planSetup(root, 'portable', { configPath: '../outside.json' }));
  await assert.rejects(
    planSetup(root, 'portable', { configPath: path.join(os.tmpdir(), 'outside.json') }),
  );
  await symlink(os.tmpdir(), path.join(root, 'escape'), 'dir');
  await assert.rejects(planSetup(root, 'portable', { configPath: 'escape/contract.json' }));
  await assert.rejects(readFile(path.join(root, 'AGENTS.md')));
});
