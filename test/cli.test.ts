import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const cli = fileURLToPath(new URL('../src/cli.ts', import.meta.url));
const project = dirname(dirname(cli));
function run(root: string, args: string[], expectedStatus = 0) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...args, '--root', root], {
    cwd: project,
    encoding: 'utf8',
    timeout: 15_000,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return result.stdout;
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'usual-cli-'));
  await mkdir(join(root, 'src'));
  await mkdir(join(root, 'app'));
  await writeFile(
    join(root, 'package.json'),
    '{"private":true,"devDependencies":{"tailwindcss":"^4.1.0"}}',
  );
  await writeFile(
    join(root, 'src/App.tsx'),
    'export const App=()=> <div className="bg-[#123456] rounded-[19px]"/>;\n',
  );
  await writeFile(
    join(root, 'app/layout.tsx'),
    'import type {ReactNode} from \'react\';export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}',
  );
  await writeFile(
    join(root, 'app/page.tsx'),
    'export default function Page(){return <main className="p-4">Example</main>}',
  );
  return root;
}

async function snapshot(root: string): Promise<string> {
  const rows: string[] = [];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else
        rows.push(
          file +
            ':' +
            createHash('sha256')
              .update(await readFile(file))
              .digest('hex'),
        );
    }
  }
  await visit(root);
  return JSON.stringify(rows.sort());
}

test('CLI help/version and usage errors are distinct from successful design checks', async () => {
  const root = await fixture();
  try {
    const before = await snapshot(root);
    assert.match(run(root, ['--help']), /check/);
    assert.match(run(root, ['--version']).trim(), /^\d+\.\d+\.\d+$/);
    const invalid = JSON.parse(run(root, ['unknown-command', '--json'], 2));
    assert.equal(typeof invalid.error, 'string');
    assert.equal(invalid.findings, undefined);
    assert.equal(await snapshot(root), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI initializes an inactive draft, inventories Next-style files, and separates audit/check exits without hidden writes', async () => {
  const root = await fixture();
  try {
    const before = await snapshot(root);
    const preview = JSON.parse(run(root, ['init', '--json']));
    assert.equal(preview.written, false);
    assert.deepEqual(preview.manifest.active, []);
    assert.ok(preview.inventory.files.includes('app/layout.tsx'));
    assert.ok(preview.inventory.files.includes('app/page.tsx'));
    assert.equal(await snapshot(root), before);
    const created = JSON.parse(run(root, ['init', '--write', '--json']));
    assert.equal(created.written, true);
    const manifestPath = join(root, 'usual.design.json');
    const policy = await readFile(manifestPath, 'utf8');
    assert.deepEqual(JSON.parse(policy).active, []);
    const auditBefore = await snapshot(root);
    const audit = JSON.parse(run(root, ['audit', '--json'], 1));
    assert.deepEqual(audit.errors, []);
    assert.ok(audit.findings.some((finding: { kind: string }) => finding.kind === 'decision'));
    assert.equal(await snapshot(root), auditBefore);
    const check = JSON.parse(run(root, ['check', '--json']));
    assert.deepEqual(check.findings, []);
    assert.deepEqual(check.active, []);
    assert.equal(await snapshot(root), auditBefore);
    run(root, ['init', '--write', '--json'], 2);
    assert.equal(await readFile(manifestPath, 'utf8'), policy);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI malformed manifests produce an operational error instead of a clean finding result', async () => {
  const root = await fixture();
  try {
    const manifestPath = join(root, 'usual.design.json');
    const invalid = '{"version":999}';
    await writeFile(manifestPath, invalid);
    const before = await snapshot(root);
    const failure = JSON.parse(run(root, ['check', '--json'], 2));
    assert.equal(typeof failure.error, 'string');
    assert.equal(failure.findings, undefined);
    assert.equal(await snapshot(root), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
