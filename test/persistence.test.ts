import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  open,
  readFile,
  readdir,
  rm,
  writeFile,
  type FileHandle,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { atomicWrite, hash } from '../src/files.js';
import { createPlan, activate } from '../src/records.js';
import { runProject } from '../src/project.js';

const exec = promisify(execFile);

async function fixture(configPath = 'usual.design.json'): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'usual-persistence-'));
  await mkdir(path.join(root, 'src'));
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ devDependencies: { tailwindcss: '^4.1.0' } }),
  );
  await writeFile(
    path.join(root, 'src/App.tsx'),
    'export const App = () => <div className="bg-brand" />;',
  );
  await writeFile(
    path.join(root, configPath),
    JSON.stringify({
      version: 1,
      include: ['src/**/*.tsx'],
      active: [],
      allowed: { colors: { classes: ['bg-brand'] } },
    }),
  );
  return root;
}

/** Fault injection occurs at the real fsync boundary, after temporary content is written. */
async function interceptSync(
  root: string,
  intercept: (handle: FileHandle, original: FileHandle['sync']) => Promise<void>,
  action: () => Promise<void>,
): Promise<void> {
  const probe = await open(path.join(root, 'probe'), 'w');
  const prototype = Object.getPrototypeOf(probe) as FileHandle;
  const original = prototype.sync;
  await probe.close();
  prototype.sync = function (this: FileHandle) {
    return intercept(this, original);
  };
  try {
    await action();
  } finally {
    prototype.sync = original;
    await rm(path.join(root, 'probe'), { force: true });
  }
}

test('atomic save rejects a concurrent edit during fsync and preserves the newer user content', async () => {
  const root = await fixture();
  try {
    const target = path.join(root, 'notes.txt');
    await writeFile(target, 'original content');
    let injected = false;
    await interceptSync(
      root,
      async (handle, original) => {
        await writeFile(target, 'newer user content');
        injected = true;
        await original.call(handle);
      },
      async () => {
        await assert.rejects(
          atomicWrite(root, 'notes.txt', 'tool replacement', hash('original content')),
        );
      },
    );
    assert.equal(injected, true);
    assert.equal(await readFile(target, 'utf8'), 'newer user content');
    assert.deepEqual(
      (await readdir(root)).filter(
        (name) => name.startsWith('notes.txt.') || name === 'notes.txt.lock',
      ),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('activation leaves policy untouched when durable receipt preparation fails', async () => {
  const root = await fixture();
  try {
    const manifestPath = path.join(root, 'usual.design.json');
    const before = await readFile(manifestPath, 'utf8');
    let attemptedReceipt = false;
    await interceptSync(
      root,
      async () => {
        attemptedReceipt = true;
        throw new Error('Simulated receipt fsync failure');
      },
      async () => {
        await assert.rejects(activate(root, ['colors']));
      },
    );
    assert.equal(attemptedReceipt, true);
    assert.equal(await readFile(manifestPath, 'utf8'), before);
    const records = await readdir(path.join(root, 'docs/usual-design'));
    assert.deepEqual(
      records.filter((name) => name.startsWith('activation-')),
      [],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a prepared activation receipt is distinguishable from a failed policy commit', async () => {
  const root = await fixture();
  try {
    const manifestPath = path.join(root, 'usual.design.json');
    const before = await readFile(manifestPath, 'utf8');
    const newer = `${before}\n`;
    let syncedFiles = 0;
    await interceptSync(
      root,
      async (handle, original) => {
        syncedFiles += 1;
        if (syncedFiles === 2) await writeFile(manifestPath, newer);
        await original.call(handle);
      },
      async () => {
        await assert.rejects(activate(root, ['colors']));
      },
    );
    assert.equal(syncedFiles, 2);
    assert.equal(await readFile(manifestPath, 'utf8'), newer);
    assert.deepEqual(JSON.parse(newer).active, []);
    const directory = path.join(root, 'docs/usual-design');
    const receipts = (await readdir(directory)).filter((name) =>
      /^activation-.*\.json$/.test(name),
    );
    assert.equal(receipts.length, 1);
    const receipt = JSON.parse(await readFile(path.join(directory, receipts[0]!), 'utf8'));
    assert.equal(receipt.previousManifestHash, hash(before));
    assert.notEqual(receipt.resultingManifestHash, hash(newer));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('repair verification preserves configuration paths as argv data and safe shell arguments', async () => {
  const configPath = "design's $(touch injected-dollar); touch injected-semicolon; #.json";
  const root = await fixture(configPath);
  try {
    await writeFile(
      path.join(root, 'src/App.tsx'),
      'export const App = () => <div className="bg-red-500" />;',
    );
    const audit = await runProject(root, 'audit', configPath);
    const selected = audit.findings.find((finding) => finding.ruleId === 'allowed.colors');
    assert.ok(selected);
    const { plan, path: planPath } = await createPlan(
      root,
      [selected.id],
      audit.snapshot,
      configPath,
    );
    const expected = ['usual-design', 'audit', '--config', configPath];
    assert.deepEqual(plan.verifyArgv, expected);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(root, planPath), 'utf8')).verifyArgv,
      expected,
    );
    const bin = path.join(root, 'bin');
    const capture = path.join(root, 'captured-argv.json');
    await mkdir(bin);
    await writeFile(
      path.join(bin, 'usual-design'),
      '#!/usr/bin/env node\nrequire("node:fs").writeFileSync(process.env.USUAL_TEST_ARGV_CAPTURE, JSON.stringify(process.argv.slice(2)));\n',
      { mode: 0o755 },
    );
    await exec('/bin/sh', ['-c', plan.verify], {
      cwd: root,
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        USUAL_TEST_ARGV_CAPTURE: capture,
      },
    });
    assert.deepEqual(JSON.parse(await readFile(capture, 'utf8')), expected.slice(1));
    await assert.rejects(readFile(path.join(root, 'injected-dollar')));
    await assert.rejects(readFile(path.join(root, 'injected-semicolon')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
