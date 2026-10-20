import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Ajv } from 'ajv';
import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';
import { categories, type Manifest, type Category } from './types.js';
import { hash, safePath, validateRelative, atomicWrite } from './files.js';
const schema = JSON.parse(
  await readFile(new URL('../schema/manifest.schema.json', import.meta.url), 'utf8'),
);
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
export function parseManifestText(raw: string): Manifest {
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    const errors: ParseError[] = [];
    parse(raw, errors, { disallowComments: true, allowTrailingComma: false });
    const error = errors[0];
    const before = raw.slice(0, error?.offset ?? raw.length).split(/\r\n|\r|\n/);
    throw new Error(
      `Invalid manifest JSON at line ${before.length}, column ${before.at(-1)!.length + 1}: ${error ? printParseErrorCode(error.error) : 'invalid JSON syntax'}. Use strict JSON without comments or trailing commas.`,
    );
  }
  return parseManifest(input);
}
export function parseManifest(input: unknown): Manifest {
  if (
    input &&
    typeof input === 'object' &&
    'version' in input &&
    typeof input.version === 'number' &&
    input.version !== 1
  )
    throw new Error(
      `Unsupported manifest version ${input.version}; this release supports version 1. Use a compatible Usual Design release or migrate the manifest to the version 1 schema after reviewing its fields. Changing the version number alone is not a migration.`,
    );
  if (!validate(input))
    throw new Error(
      `Invalid manifest: ${validate.errors?.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')}`,
    );
  const m = input as Manifest;
  for (const p of [
    ...m.include,
    ...(m.ignore ?? []),
    ...(m.tokens ?? []),
    ...(m.semantics?.flatMap((r) => r.ignore ?? []) ?? []),
    ...(m.components?.flatMap((r) => r.ignore ?? []) ?? []),
    ...(m.imports?.flatMap((r) => r.ignore ?? []) ?? []),
    ...(m.exceptions?.map((e) => e.file) ?? []),
  ])
    validateRelative(p);
  const ids = [...(m.semantics ?? []), ...(m.components ?? []), ...(m.imports ?? [])].map(
    (r) => r.id,
  );
  if (new Set(ids).size !== ids.length) throw new Error('Rule IDs must be unique.');
  for (const r of m.semantics ?? []) {
    if (!(
      r.requireClasses?.length ||
      r.forbidClasses?.length ||
      Object.keys(r.requireProps ?? {}).length
    ))
      throw new Error(`Semantic rule ${r.id} has no constraint.`);
    const overlap = r.requireClasses?.find((name) => r.forbidClasses?.includes(name));
    if (overlap)
      throw new Error(`Semantic rule ${r.id} both requires and forbids class ${overlap}.`);
    for (const [name, value] of Object.entries(r.requireProps ?? {}))
      if (Object.hasOwn(r.target.props ?? {}, name) && r.target.props![name] !== value)
        throw new Error(
          `Semantic rule ${r.id} requires prop ${name}=${JSON.stringify(value)} but targets ${JSON.stringify(r.target.props![name])}.`,
        );
  }
  const exceptions = new Set<string>();
  for (const e of m.exceptions ?? []) {
    if (
      !ids.includes(e.ruleId) &&
      !/^allowed\.(colors|typography|spacing|shape)$/.test(e.ruleId) &&
      e.ruleId !== 'coverage.unresolved'
    )
      throw new Error(`Unknown exception rule: ${e.ruleId}`);
    const key = JSON.stringify([e.ruleId, e.file]);
    if (exceptions.has(key))
      throw new Error(`Duplicate exception for rule ${e.ruleId} in ${e.file}.`);
    exceptions.add(key);
  }
  if (m.preview !== undefined) {
    let url: URL;
    try {
      url = new URL(m.preview);
    } catch {
      throw new Error('Invalid preview URL: provide an absolute http:// or https:// URL.');
    }
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || /\s/.test(m.preview))
      throw new Error('Invalid preview URL: provide an absolute http:// or https:// URL.');
  }
  return freeze(structuredClone(m));
}
export async function loadManifest(root: string, path = 'usual.design.json') {
  const raw = await readFile(await safePath(root, path), 'utf8');
  return { manifest: parseManifestText(raw), manifestHash: hash(raw), raw };
}
export function defaultManifest(): Manifest {
  return {
    version: 1,
    include: [
      'src/**/*.{js,jsx,ts,tsx,css}',
      'app/**/*.{js,jsx,ts,tsx,css}',
      'pages/**/*.{js,jsx,ts,tsx,css}',
      'components/**/*.{js,jsx,ts,tsx,css}',
    ],
    ignore: [],
    active: [],
    allowed: {
      colors: { classes: [] },
      typography: { classes: [] },
      spacing: { classes: [] },
      shape: { classes: [] },
    },
    semantics: [],
    components: [],
  };
}
export function categoryReady(m: Manifest, cat: Category): boolean {
  if (cat === 'components')
    return (
      !!m.components?.length ||
      !!m.imports?.length ||
      !!m.semantics?.some(
        (r) => !!r.target.component || Object.keys(r.requireProps ?? {}).length > 0,
      )
    );
  const a = m.allowed?.[cat];
  return !!(a?.classes?.length || a?.values?.length || a?.variables?.length);
}
export async function saveManifest(
  root: string,
  manifest: unknown,
  expectedHash: string | null,
  path = 'usual.design.json',
  rationale?: string,
) {
  const m = parseManifest(manifest);
  // Activating is only allowed through the audit-checked operation, never the editor.
  const current = await loadManifest(root, path).catch((e) => {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  });
  if ((current?.manifestHash ?? null) !== expectedHash)
    throw new Error(`Stale write for ${path}; reload and review changes.`);
  const active = current?.manifest.active ?? [];
  if (m.active.some((c) => !active.includes(c)))
    throw new Error('Activate categories through the fresh-audit activation operation.');
  const next = JSON.stringify(m, null, 2) + '\n';
  await atomicWrite(
    root,
    `docs/usual-design/decisions/${randomUUID()}.json`,
    JSON.stringify(
      {
        version: 1,
        status: 'prepared-policy-decision',
        previousManifestHash: current?.manifestHash ?? null,
        resultingManifestHash: hash(next),
        rationale:
          rationale?.trim() ||
          'No rationale supplied. Explicit manifest review; inspect before/after policy.',
        before: current?.manifest ?? null,
        after: m,
        verification:
          'Compare resultingManifestHash with current manifest; a prepared decision is not proof of commit.',
      },
      null,
      2,
    ) + '\n',
    null,
  );
  await atomicWrite(root, path, next, expectedHash);
  return m;
}
export { categories };
