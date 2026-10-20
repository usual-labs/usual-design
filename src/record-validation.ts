import { Ajv, type SchemaObject } from 'ajv';
import { validateRelative } from './files.js';
import { categories, type AuditResult, type Finding } from './types.js';

export interface RepairPlan {
  version: 1;
  id: string;
  status: 'approved';
  snapshot: string;
  manifestHash: string;
  policyHash?: string;
  configPath?: string;
  selected: Finding[];
  deferred: Finding[];
  constraints: string[];
  verifyArgv: string[];
  startArgv?: string[];
  verify: string;
}

const text = { type: 'string' };
const nonempty = { type: 'string', minLength: 1 };
const positive = { type: 'integer', minimum: 1 };
const offset = { type: 'integer', minimum: 0 };
const digest = { type: 'string', pattern: '^[a-f0-9]{64}$' };
const array = (items: SchemaObject): SchemaObject => ({ type: 'array', items });
const object = (
  properties: Record<string, SchemaObject>,
  optional: string[] = [],
): SchemaObject => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  additionalProperties: false,
});
const categoryList = { ...array({ enum: categories }), uniqueItems: true };
const span = object({ start: offset, end: offset });
const finding = object(
  {
    id: nonempty,
    ruleId: nonempty,
    category: { enum: [...categories, 'coverage'] },
    affectedCategories: categoryList,
    file: nonempty,
    line: positive,
    column: positive,
    message: nonempty,
    expected: text,
    actual: text,
    kind: { enum: ['violation', 'coverage', 'decision'] },
    span,
    context: object({ start: offset, end: offset, text, truncated: { type: 'boolean' } }),
  },
  ['affectedCategories', 'expected', 'actual', 'span', 'context'],
);
const exception = object({ ruleId: nonempty, file: nonempty, reason: nonempty });
const inventory = object(
  {
    files: array(nonempty),
    tokens: array(object({ name: nonempty, value: text, file: nonempty, line: positive })),
    components: array(
      object(
        {
          name: nonempty,
          file: nonempty,
          from: text,
          exportName: text,
          count: positive,
          locations: array(object({ file: nonempty, line: positive })),
        },
        ['from', 'exportName', 'count', 'locations'],
      ),
    ),
    candidates: array(
      object(
        {
          category: { enum: categories.filter((category) => category !== 'components') },
          kind: { enum: ['class', 'declaration'] },
          name: nonempty,
          value: text,
          file: nonempty,
          line: positive,
          count: positive,
          className: text,
          property: text,
        },
        ['className', 'property'],
      ),
    ),
    excluded: array(
      object({ path: nonempty, reason: { enum: ['standard', 'configured', 'outside-include'] } }),
    ),
    warnings: array(text),
    tailwindVersion: text,
  },
  ['candidates', 'excluded', 'tailwindVersion'],
);
const auditSchema = object(
  {
    version: { const: 1 },
    mode: { enum: ['audit', 'check'] },
    snapshot: digest,
    manifestHash: digest,
    policyHash: digest,
    findings: array(finding),
    active: categoryList,
    inactive: categoryList,
    files: array(nonempty),
    errors: array(text),
    coverage: object(
      {
        include: array(nonempty),
        ignore: array(nonempty),
        exceptionsUsed: array(exception),
        exceptionsUnused: array(exception),
      },
      ['exceptionsUnused'],
    ),
    inventory,
  },
  ['policyHash', 'coverage'],
);
const repairSchema = object(
  {
    version: { const: 1 },
    id: nonempty,
    status: { const: 'approved' },
    snapshot: digest,
    manifestHash: digest,
    policyHash: digest,
    configPath: nonempty,
    selected: { ...array(finding), minItems: 1 },
    deferred: array(finding),
    constraints: { ...array(nonempty), minItems: 1 },
    verifyArgv: { ...array(nonempty), minItems: 1 },
    verify: nonempty,
    startArgv: { ...array(nonempty), minItems: 1 },
  },
  ['policyHash', 'configPath', 'startArgv'],
);
const ajv = new Ajv({ allErrors: true, strict: false });
const validateAudit = ajv.compile(auditSchema);
const validateRepair = ajv.compile(repairSchema);

function parseRecord(
  raw: string,
  path: string,
  kind: string,
  validate: typeof validateAudit,
): unknown {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      `Corrupt ${kind} record ${path}: invalid JSON. Preserve the original and restore a valid record from version control before retrying.`,
    );
  }
  if (value && typeof value === 'object' && 'version' in value && value.version !== 1)
    throw new Error(
      `Unsupported ${kind} record version ${JSON.stringify(value.version)} in ${path}; supported version is 1. Preserve the original and use a compatible release or a reviewed migration; do not change only its version number.`,
    );
  if (!validate(value))
    throw new Error(
      `Corrupt ${kind} record ${path}: ${validate.errors?.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ')}. Preserve the original and restore a valid record from version control before retrying.`,
    );
  return value;
}

function inspectRecord<T>(path: string, kind: string, inspect: () => T): T {
  try {
    validateRelative(path);
    return inspect();
  } catch (error) {
    throw new Error(
      `Invalid ${kind} record ${path}: ${(error as Error).message} Preserve the original; review or restore it before retrying.`,
    );
  }
}

function validateFindings(findings: Finding[]) {
  const ids = new Set<string>();
  for (const finding of findings) {
    validateRelative(finding.file);
    if (ids.has(finding.id)) throw new Error(`Duplicate finding ID ${finding.id}.`);
    ids.add(finding.id);
    for (const range of [finding.span, finding.context])
      if (range && range.end < range.start)
        throw new Error(`Finding ${finding.id} has an inverted source range.`);
  }
}

export function parseRepairRecord(raw: string, path: string): RepairPlan {
  const plan = parseRecord(raw, path, 'repair', validateRepair) as RepairPlan;
  return inspectRecord(path, 'repair', () => {
    if (plan.configPath !== undefined) validateRelative(plan.configPath);
    validateFindings([...plan.selected, ...plan.deferred]);
    if (plan.selected.some((finding) => finding.kind === 'decision'))
      throw new Error(
        'Selected policy decisions are not approved application repairs. Review policy separately.',
      );
    return plan;
  });
}

export function parseAuditRecord(raw: string, path: string): AuditResult {
  const audit = parseRecord(raw, path, 'audit', validateAudit) as AuditResult;
  return inspectRecord(path, 'audit', () => {
    validateFindings(audit.findings);
    if (audit.active.some((category) => audit.inactive.includes(category)))
      throw new Error('Active and inactive categories overlap.');
    const paths = [
      ...audit.files,
      ...audit.inventory.files,
      ...audit.inventory.tokens.map((token) => token.file),
      ...audit.inventory.components.flatMap((component) => [
        component.file,
        ...(component.locations?.map((location) => location.file) ?? []),
      ]),
      ...(audit.inventory.candidates?.map((candidate) => candidate.file) ?? []),
      ...(audit.inventory.excluded?.map((entry) => entry.path) ?? []),
      ...(audit.coverage?.include ?? []),
      ...(audit.coverage?.ignore ?? []),
      ...(audit.coverage?.exceptionsUsed.map((exception) => exception.file) ?? []),
      ...(audit.coverage?.exceptionsUnused?.map((exception) => exception.file) ?? []),
    ];
    for (const file of paths) validateRelative(file);
    return audit;
  });
}
