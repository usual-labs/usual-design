import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir, platform, arch, cpus, release, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const project = resolve('.');
const cli = join(project, 'dist/cli.js');
const root = await mkdtemp(join(tmpdir(), 'usual-bench-'));
const samples = 6;
function summary(times) {
  const repeated = times.slice(1),
    sorted = [...repeated].sort((a, b) => a - b);
  return {
    processColdMs: times[0],
    repeatProcessMs: repeated,
    repeatMedianMs: sorted[Math.floor(sorted.length / 2)],
  };
}
function invoke(fixture, args, input) {
  const start = performance.now();
  const result = spawnSync(process.execPath, [cli, ...args, '--root', fixture], {
    cwd: project,
    input,
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 4_000_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return {
    elapsed: Math.round((performance.now() - start) * 10) / 10,
    value: JSON.parse(result.stdout),
  };
}
async function profile(label, fixture) {
  const checkTimes = [],
    auditTimes = [],
    codexTimes = [],
    claudeTimes = [];
  let check;
  for (let sample = 0; sample < samples; sample++) {
    const result = invoke(fixture, ['check', '--json']);
    check = result.value;
    assert.deepEqual(check.findings, []);
    assert.deepEqual(check.errors, []);
    checkTimes.push(result.elapsed);
  }
  for (let sample = 0; sample < samples; sample++) {
    const result = invoke(fixture, ['audit', '--save', '--json']);
    assert.deepEqual(result.value.findings, []);
    assert.deepEqual(result.value.errors, []);
    auditTimes.push(result.elapsed);
  }
  for (const [host, times] of [
    ['codex', codexTimes],
    ['claude', claudeTimes],
  ]) {
    const payload = JSON.stringify({
      hook_event_name: 'Stop',
      cwd: fixture,
      stop_hook_active: false,
    });
    for (let sample = 0; sample < samples; sample++) {
      const result = invoke(fixture, ['hook', '--host', host], payload);
      assert.notEqual(result.value.continue, false);
      assert.equal(result.value.decision, undefined);
      assert.match(result.value.systemMessage, /passed/);
      times.push(result.elapsed);
    }
  }
  const lineCounts = await Promise.all(
    check.files.map(async (file) => {
      const text = await readFile(join(fixture, file), 'utf8');
      return {
        file,
        lines: text.length ? text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0) : 0,
      };
    }),
  );
  const source = lineCounts.filter(({ file }) => /\.[jt]sx?$/.test(file));
  return {
    label,
    sourceFiles: source.length,
    sourceLines: source.reduce((sum, item) => sum + item.lines, 0),
    coveredFiles: check.files.length,
    coveredLines: lineCounts.reduce((sum, item) => sum + item.lines, 0),
    active: check.active,
    commands: {
      check: summary(checkTimes),
      auditSave: summary(auditTimes),
      codexHandlerProcess: summary(codexTimes),
      claudeHandlerProcess: summary(claudeTimes),
    },
  };
}

try {
  const small = join(root, 'small'),
    large = join(root, 'large');
  await cp(join(project, 'fixtures/ember'), small, { recursive: true });
  await cp(join(project, 'fixtures/ember'), large, { recursive: true });
  for (let i = 0; i < 498; i++) {
    await writeFile(
      join(large, 'src', `Sample${i}.jsx`),
      `export const Sample${i}=()=> <section className="bg-ocean text-snow text-lg p-6 rounded-lg"/>;\n`,
    );
  }
  const metadata = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  const dependencyVersions = {};
  for (const name of Object.keys(metadata.dependencies)) {
    dependencyVersions[name] = JSON.parse(
      await readFile(join(project, 'node_modules', name, 'package.json'), 'utf8'),
    ).version;
  }
  const report = {
    version: 1,
    toolVersion: metadata.version,
    runtime: process.version,
    npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
    platform: platform(),
    osRelease: release(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    cpuCores: cpus().length,
    memoryBytes: totalmem(),
    dependencyVersions,
    samplesPerCommand: samples,
    nativeClientExecuted: false,
    remoteCIExecuted: false,
    projects: [await profile('ember-small', small), await profile('synthetic-500-jsx', large)],
    note: 'Wall time for a fresh Node process per sample, including startup. First sample is process-cold, not a flushed OS filesystem cache. Audit includes persistence; hook timings invoke the native handler protocol directly, without a real agent client. Synthetic small source files are not a real-world timing guarantee. No daemon or persistent cache.',
  };
  await mkdir(join(project, '.usual-design/artifacts'), { recursive: true });
  await writeFile(
    join(project, '.usual-design/artifacts/benchmark.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
