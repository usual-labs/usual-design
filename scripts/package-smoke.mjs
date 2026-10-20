import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const project = resolve('.');
const artifacts = join(project, '.usual-design/artifacts');
await mkdir(artifacts, { recursive: true });
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', artifacts], {
    cwd: project,
    encoding: 'utf8',
  }),
);
for (const required of [
  'dist/cli.js',
  'schema/manifest.schema.json',
  'skills/usual-design/SKILL.md',
  'dist/wizard/index.html',
]) {
  assert.ok(
    packed.files.some((file) => file.path === required),
    `Missing package asset: ${required}`,
  );
}
assert.ok(
  !packed.files.some((file) =>
    /(^|\/)(?:\.env(?:\.|$)|node_modules\/|fixtures\/|test\/|\.usual-design\/)/.test(file.path),
  ),
);

const temp = await mkdtemp(join(tmpdir(), 'usual-package-'));
try {
  await writeFile(
    join(temp, 'package.json'),
    JSON.stringify({
      name: 'usual-install-proof',
      private: true,
      type: 'module',
      devDependencies: { tailwindcss: '^4.1.0' },
    }),
  );
  execFileSync(
    'npm',
    ['install', '--ignore-scripts', '--omit=dev', join(artifacts, packed.filename)],
    { cwd: temp, stdio: 'pipe' },
  );
  const executable = join(temp, 'node_modules/.bin/usual-design');
  const commands = [];
  function run(label, args, expectedStatus = 0, extra = {}) {
    const result = spawnSync(executable, args, {
      cwd: temp,
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 4_000_000,
      ...extra,
    });
    if (result.error) throw result.error;
    assert.equal(result.status, expectedStatus, `${label}: ${result.stderr || result.stdout}`);
    commands.push({ command: label, exit: result.status });
    return result.stdout;
  }
  const version = run('installed executable --version', ['--version']).trim();
  const metadata = JSON.parse(await readFile(join(project, 'package.json'), 'utf8'));
  assert.equal(version, metadata.version);
  assert.match(run('help', ['--help']), /check/);
  const invalid = JSON.parse(run('unknown command', ['unknown-command', '--json'], 2));
  assert.equal(typeof invalid.error, 'string');
  assert.equal(invalid.findings, undefined);

  await mkdir(join(temp, 'src'));
  await writeFile(
    join(temp, 'src/App.tsx'),
    'export const App = () => <div className="bg-[#123456] rounded-[19px]" />;\n',
  );
  const preview = JSON.parse(run('init preview', ['init', '--json']));
  assert.equal(preview.written, false);
  assert.deepEqual(preview.manifest.active, []);
  assert.ok(preview.inventory.candidates.length > 0);
  await assert.rejects(readFile(join(temp, 'usual.design.json')));
  const initialized = JSON.parse(run('init --write', ['init', '--write', '--json']));
  assert.equal(initialized.written, true);
  assert.deepEqual(initialized.errors, []);
  assert.equal(JSON.parse(run('validate', ['validate', '--json'])).valid, true);
  const audit = JSON.parse(run('draft audit --save', ['audit', '--save', '--json'], 1));
  assert.deepEqual(audit.errors, []);
  assert.ok(audit.findings.some((finding) => finding.kind === 'decision'));
  assert.equal(
    JSON.parse(await readFile(join(temp, 'docs/usual-design/audit.json'), 'utf8')).snapshot,
    audit.snapshot,
  );
  const inactive = JSON.parse(run('inactive check', ['check', '--json']));
  assert.deepEqual(inactive.active, []);
  assert.deepEqual(inactive.findings, []);
  assert.deepEqual(inactive.errors, []);

  const fixture = join(temp, 'independent');
  await cp(join(project, 'fixtures/ember'), fixture, { recursive: true });
  const check = JSON.parse(
    run('independent fixture check', ['check', '--root', fixture, '--json']),
  );
  assert.deepEqual(check.findings, []);
  assert.deepEqual(check.errors, []);
  const beforeSetup = await readFile(join(temp, 'package.json'), 'utf8');
  const setup = JSON.parse(run('setup preview', ['setup', '--host', 'both', '--hooks', '--json']));
  assert.deepEqual(setup.conflicts, []);
  assert.ok(setup.changes.some((change) => change.path.endsWith('SKILL.md')));
  assert.equal(await readFile(join(temp, 'package.json'), 'utf8'), beforeSetup);
  await assert.rejects(readFile(join(temp, '.agents/skills/usual-design/SKILL.md')));
  const applied = JSON.parse(
    run('setup --write', ['setup', '--host', 'both', '--hooks', '--write', '--json']),
  );
  assert.deepEqual(applied.conflicts, []);
  for (const hostPath of [
    '.agents/skills/usual-design/SKILL.md',
    '.claude/skills/usual-design/SKILL.md',
  ]) {
    assert.match(await readFile(join(temp, hostPath), 'utf8'), /name: usual-design/);
  }
  const repeated = JSON.parse(
    run('idempotent setup', ['setup', '--host', 'both', '--hooks', '--json']),
  );
  assert.deepEqual(repeated.changes, []);
  const npmCheck = spawnSync('npm', ['run', '--silent', 'lint:design'], {
    cwd: temp,
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(npmCheck.status, 0, npmCheck.stderr);
  commands.push({ command: 'installed npm lint:design script', exit: npmCheck.status });

  const { startWizard } = await import(
    pathToFileURL(join(temp, 'node_modules/@usual/design-lint/dist/server.js'))
  );
  const wizard = await startWizard(temp);
  let bundledAssets = 0;
  try {
    const page = await fetch(wizard.origin);
    assert.ok(page.ok);
    const html = await page.text();
    assert.ok(html.includes('root'));
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(
      (match) => match[1],
    );
    assert.ok(assets.length > 0, 'No bundled JS/CSS references');
    for (const asset of assets) {
      const response = await fetch(new URL(asset, wizard.origin));
      assert.ok(response.ok, `Bundled asset unavailable: ${asset}`);
      assert.ok((await response.text()).length > 0);
      bundledAssets += 1;
    }
    const state = await fetch(wizard.origin + '/api/state', {
      headers: { 'X-Usual-Token': wizard.token },
    });
    assert.ok(state.ok);
    assert.deepEqual((await state.json()).manifest.active, []);
  } finally {
    await new Promise((done) => wizard.server.close(done));
  }
  const result = {
    version,
    runtime: process.version,
    artifact: '.usual-design/artifacts/' + packed.filename,
    files: packed.entryCount,
    unpackedBytes: packed.unpackedSize,
    independentCheck: 'passed',
    packagedSkills: 'passed',
    packagedWizard: 'passed',
    bundledAssets,
    commands,
    published: false,
    nativeClientExecuted: false,
    browserExecuted: false,
    integrity: packed.integrity,
  };
  await writeFile(join(artifacts, 'package-smoke.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
