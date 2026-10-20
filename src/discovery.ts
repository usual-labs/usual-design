import { readdir } from 'node:fs/promises';
import { minimatch } from 'minimatch';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { dirname, posix } from 'node:path';
import type { Inventory, Manifest } from './types.js';
import { safePath, optionalRead, hash } from './files.js';
const generatedDirectories = new Set([
  'node_modules',
  'dist',
  '.git',
  '.usual-design',
  '.next',
  '.nuxt',
  '.output',
  '.svelte-kit',
  '.turbo',
  '.vercel',
  '.vite',
  '.parcel-cache',
]);
export const alwaysIgnored = [
  ...[...generatedDirectories].map((name) => `**/${name}/**`),
  '**/*.d.ts',
  'docs/usual-design/**',
];
export async function discover(
  root: string,
  m: Manifest,
): Promise<{ inventory: Inventory; sources: Map<string, string>; snapshot: string }> {
  const files: string[] = [];
  const excluded: NonNullable<Inventory['excluded']> = [];
  let visited = 0;
  const matches = (file: string, patterns: string[]) =>
    patterns.some((pattern) => minimatch(file, pattern) || minimatch(`${file}/`, pattern));
  async function walk(dir: string) {
    if (dir.split('/').length > 64)
      throw new Error(
        'Project traversal exceeds 64 directory levels; narrow or restructure coverage.',
      );
    for (const entry of await readdir(dir ? await safePath(root, dir) : root, {
      withFileTypes: true,
    })) {
      if (++visited > 50_000)
        throw new Error(
          'Project traversal exceeds 50000 entries; exclude unrelated generated or dependency paths.',
        );
      const file = dir ? `${dir}/${entry.name}` : entry.name;
      if (generatedDirectories.has(entry.name) || matches(file, alwaysIgnored)) {
        excluded.push({ path: file, reason: 'standard' });
        continue;
      }
      if (matches(file, m.ignore ?? [])) {
        excluded.push({ path: file, reason: 'configured' });
        continue;
      }
      if (entry.isSymbolicLink()) {
        if (m.include.some((p) => minimatch(file, p, { partial: true })))
          throw new Error(`Covered symlink is unsupported: ${file}`);
        excluded.push({ path: file, reason: 'outside-include' });
        continue;
      }
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && m.include.some((p) => minimatch(file, p))) files.push(file);
      else if (entry.isFile()) excluded.push({ path: file, reason: 'outside-include' });
      else if (m.include.some((p) => minimatch(file, p)))
        throw new Error(`Covered special file is unsupported: ${file}`);
      else excluded.push({ path: file, reason: 'outside-include' });
      if (files.length > 10000) throw new Error('Project exceeds 10000 covered files.');
    }
  }
  await walk('');
  files.sort();
  const sources = new Map<string, string>();
  const inventory: Inventory = { files, tokens: [], components: [], warnings: [], excluded: [] };
  if (files.length > 10000)
    throw new Error('Project exceeds 10000 covered files; narrow include paths.');
  const queue: string[] = [],
    queued = new Set<string>();
  function enqueue(file: string) {
    if (queued.has(file)) return;
    if (queue.length >= 10_000)
      throw new Error(
        'Project exceeds 10000 total covered/token/imported files; narrow stylesheet imports or coverage.',
      );
    queued.add(file);
    queue.push(file);
  }
  for (const file of [...files, ...(m.tokens ?? [])]) enqueue(file);
  for (let i = 0; i < queue.length; i++) {
    const file = queue[i];
    if (sources.has(file)) continue;
    const text = await readFile(await safePath(root, file), 'utf8');
    if (Buffer.byteLength(text) > 2_000_000) throw new Error(`Input exceeds 2MB: ${file}`);
    sources.set(file, text);
    if (file.endsWith('.css')) {
      const css = postcss.parse(text, { from: file });
      css.walkDecls((d) => {
        if (d.prop.startsWith('--') && d.prop.includes('*')) {
          inventory.warnings.push(
            `${file}:${d.source?.start?.line ?? 1}: Theme namespace reset ${d.prop} is not a concrete token definition; active style coverage requires explicit review of namespace resets.`,
          );
          return;
        }
        if (d.prop.startsWith('--'))
          inventory.tokens.push({
            name: d.prop,
            value: d.value,
            file,
            line: d.source?.start?.line ?? 1,
          });
      });
      css.walkAtRules((r) => {
        if (['config', 'plugin', 'source', 'utility', 'apply'].includes(r.name))
          inventory.warnings.push(
            `${file}:${r.source?.start?.line ?? 1}: @${r.name} requires explicit coverage review`,
          );
        if (r.name === 'import') {
          const target = r.params.match(/^["']([^"']+)["']/)?.[1];
          if (target === 'tailwindcss') return;
          if (target?.startsWith('.')) {
            const path = posix.normalize(posix.join(dirname(file), target));
            enqueue(path);
          } else
            inventory.warnings.push(
              `${file}:${r.source?.start?.line ?? 1}: unresolved stylesheet import ${r.params}`,
            );
        }
      });
    }
  }
  const pkg = await optionalRead(await safePath(root, 'package.json'));
  if (pkg) {
    const data = JSON.parse(pkg);
    const versions = [data.dependencies?.tailwindcss, data.devDependencies?.tailwindcss].filter(
      (value): value is string => typeof value === 'string',
    );
    if (new Set(versions).size > 1)
      throw new Error('Conflicting Tailwind dependency declarations; use one explicit v4 range.');
    const version = versions[0];
    if (version) {
      inventory.tailwindVersion = String(version);
      if (!/^[~^]?4\.(?:\d+|x|\*)(?:\.(?:\d+|x|\*))?(?:-[\w.-]+)?$/.test(version))
        throw new Error(
          `Unsupported or ambiguous Tailwind version: ${version}; this release supports explicit v4 ranges.`,
        );
    }
  }
  if (!inventory.tailwindVersion)
    inventory.warnings.push(
      'Tailwind version not declared in project package.json; compatibility is unverified.',
    );
  inventory.files = [...sources.keys()].sort();
  inventory.excluded = excluded
    .filter((entry) => !sources.has(entry.path))
    .sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason));
  inventory.warnings.sort();
  const compilerConfig =
    ((await optionalRead(await safePath(root, 'tsconfig.json'))) ?? '') +
    ((await optionalRead(await safePath(root, 'jsconfig.json'))) ?? '');
  const snapshot = hash(
    [...sources]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, s]) => p + '\0' + s)
      .join('\0') +
      '\0' +
      (pkg ?? '') +
      '\0' +
      compilerConfig,
  );
  return { inventory, sources, snapshot };
}
