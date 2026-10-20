import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseAuditRecord, parseRepairRecord, type RepairPlan } from '../src/record-validation.js';
import { createPlan, saveAudit } from '../src/records.js';
import { runProject } from '../src/project.js';
import { categories, type AuditResult, type Finding } from '../src/types.js';

const repairPath = 'docs/usual-design/repairs/example.json';
const auditPath = 'docs/usual-design/audit.json';
const digest = 'a'.repeat(64);
function finding(id = 'finding'): Finding {
  return {
    id,
    ruleId: 'allowed.colors',
    category: 'colors',
    file: 'src/App.tsx',
    line: 1,
    column: 1,
    message: 'Use an approved color.',
    kind: 'violation',
  };
}
function plan(): RepairPlan {
  return {
    version: 1,
    id: 'batch',
    status: 'approved',
    snapshot: digest,
    manifestHash: digest,
    selected: [finding()],
    deferred: [],
    constraints: ['Preserve policy.'],
    verifyArgv: ['usual-design', 'audit', '--config', 'usual.design.json'],
    verify: "usual-design audit --config 'usual.design.json'",
  };
}
function audit(): AuditResult {
  return {
    version: 1,
    mode: 'audit',
    snapshot: digest,
    manifestHash: digest,
    findings: [finding()],
    active: [],
    inactive: [...categories],
    files: ['src/App.tsx'],
    errors: [],
    inventory: { files: ['src/App.tsx'], tokens: [], components: [], warnings: [] },
  };
}

test('record parsers accept actual persisted audits and approved repair batches without altering source text', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-record-validation-'));
  try {
    await cp(resolve('fixtures/atlas'), root, { recursive: true });
    const result = await runProject(root, 'audit');
    await saveAudit(root, result);
    const rawAudit = await readFile(join(root, auditPath), 'utf8');
    assert.deepEqual(parseAuditRecord(rawAudit, auditPath), JSON.parse(rawAudit));
    const selected = result.findings.find((entry) => entry.kind === 'violation')!;
    const created = await createPlan(root, [selected.id], result.snapshot);
    const rawPlan = await readFile(join(root, created.path), 'utf8');
    assert.deepEqual(parseRepairRecord(rawPlan, created.path), JSON.parse(rawPlan));
    assert.equal(await readFile(join(root, created.path), 'utf8'), rawPlan);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('corrupt JSON and unsupported versions provide recovery guidance including record path', () => {
  for (const [parse, path, valid] of [
    [parseRepairRecord, repairPath, plan()],
    [parseAuditRecord, auditPath, audit()],
  ] as const) {
    for (const raw of ['{', 'null', '{}', JSON.stringify({ ...valid, version: 2 })])
      assert.throws(
        () => parse(raw, path),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.ok(error.message.includes(path));
          assert.match(error.message, /Preserve the original/);
          if (raw.includes('"version":2'))
            assert.match(error.message, /compatible release or a reviewed migration/);
          return true;
        },
      );
  }
});

test('repair records reject unapproved, empty, duplicate, and policy-decision selections', () => {
  for (const change of [
    { status: 'draft' },
    { status: 'complete' },
    { selected: [] },
    { selected: [{ ...finding(), kind: 'decision' }] },
    { selected: [finding(), finding()] },
    { deferred: [finding()] },
  ])
    assert.throws(() => parseRepairRecord(JSON.stringify({ ...plan(), ...change }), repairPath));
  const allowed = plan();
  allowed.deferred = [{ ...finding('decision'), kind: 'decision' }];
  assert.equal(parseRepairRecord(JSON.stringify(allowed), repairPath).deferred[0].kind, 'decision');
});

test('findings require complete valid data before refresh or rendering', () => {
  for (const change of [
    { line: 0 },
    { column: -1 },
    { message: null },
    { expected: {} },
    { category: 'invented' },
    { kind: 'fixed' },
    { affectedCategories: ['invented'] },
    { span: { start: 9, end: 3 } },
    { context: { start: 1, end: 2, text: 'a' } },
  ]) {
    const invalid = { ...finding(), ...change };
    assert.throws(() =>
      parseRepairRecord(JSON.stringify({ ...plan(), selected: [invalid] }), repairPath),
    );
    assert.throws(() =>
      parseAuditRecord(JSON.stringify({ ...audit(), findings: [invalid] }), auditPath),
    );
  }
  const withContext = {
    ...finding(),
    span: { start: 0, end: 3 },
    context: { start: 0, end: 3, text: '<a>', truncated: false },
  };
  assert.doesNotThrow(() =>
    parseRepairRecord(JSON.stringify({ ...plan(), selected: [withContext] }), repairPath),
  );
});

test('paths in records, findings, config, and inventory stay within the project', () => {
  for (const unsafe of ['../escape', '/tmp/escape', 'src/../escape', 'src\\escape']) {
    assert.throws(() => parseRepairRecord(JSON.stringify(plan()), unsafe), /inside the project/);
    assert.throws(
      () => parseRepairRecord(JSON.stringify({ ...plan(), configPath: unsafe }), repairPath),
      /inside the project/,
    );
    assert.throws(
      () =>
        parseRepairRecord(
          JSON.stringify({ ...plan(), selected: [{ ...finding(), file: unsafe }] }),
          repairPath,
        ),
      /inside the project/,
    );
    const record = audit();
    record.inventory.components = [
      { name: 'Button', file: 'src/Button.tsx', locations: [{ file: unsafe, line: 1 }] },
    ];
    assert.throws(() => parseAuditRecord(JSON.stringify(record), auditPath), /inside the project/);
    record.inventory.components = [];
    record.coverage = {
      include: ['src/**'],
      ignore: [],
      exceptionsUsed: [{ ruleId: 'allowed.colors', file: unsafe, reason: 'Legacy' }],
    };
    assert.throws(() => parseAuditRecord(JSON.stringify(record), auditPath), /inside the project/);
  }
});

test('audit records validate render dependencies and optional inventory evidence', () => {
  for (const change of [
    { snapshot: '' },
    { files: null },
    { findings: {} },
    { errors: 'failure' },
    { inventory: {} },
    { active: ['colors'], inactive: ['colors'] },
    { coverage: { include: [], ignore: [], exceptionsUsed: 'all' } },
  ])
    assert.throws(() => parseAuditRecord(JSON.stringify({ ...audit(), ...change }), auditPath));
  const record = audit();
  record.inventory.excluded = [{ path: 'node_modules', reason: 'standard' }];
  record.inventory.candidates = [
    {
      category: 'spacing',
      kind: 'class',
      name: 'p-4',
      value: 'p-4',
      file: 'src/App.tsx',
      line: 1,
      count: 2,
    },
  ];
  assert.deepEqual(parseAuditRecord(JSON.stringify(record), auditPath), record);
});

test('legacy version 1 batches need no configPath and newer batches retain command metadata as data', () => {
  assert.deepEqual(parseRepairRecord(JSON.stringify(plan()), repairPath), plan());
  const record = {
    ...plan(),
    configPath: 'config/design.json',
    startArgv: ['usual-design', 'verify-plan', '--plan', repairPath],
  };
  assert.deepEqual(parseRepairRecord(JSON.stringify(record), repairPath), record);
});
