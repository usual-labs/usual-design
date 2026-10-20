import { parse } from 'jsonc-parser';
import { posix } from 'node:path';
import { optionalRead, safePath, validateRelative } from './files.js';
export interface CompilerResolution {
  paths: Record<string, string[]>;
  base: string;
  warnings: string[];
}
export function compilerResolution(text?: string | null): CompilerResolution {
  const result: CompilerResolution = { paths: {}, base: '.', warnings: [] };
  if (!text) return result;
  const errors: import('jsonc-parser').ParseError[] = [];
  const config = parse(text, errors, { allowTrailingComma: true });
  if (errors.length || !config || typeof config !== 'object')
    throw new Error('Cannot resolve local aliases: invalid tsconfig/jsconfig JSON.');
  if (config.extends)
    result.warnings.push(
      'Extended compiler configuration is not resolved; local alias coverage requires explicit supported local paths.',
    );
  const options = config.compilerOptions;
  if (options?.paths && typeof options.paths === 'object') {
    for (const [name, values] of Object.entries(options.paths)) {
      if (!Array.isArray(values) || values.some((v) => typeof v !== 'string'))
        throw new Error(`Invalid alias mapping for ${name}.`);
      result.paths[name] = values;
    }
  }
  if (typeof options?.baseUrl === 'string') result.base = options.baseUrl;
  return result;
}
export function moduleCandidates(file: string, ref: string, config: CompilerResolution): string[] {
  if (ref.startsWith('.')) return [posix.normalize(posix.join(posix.dirname(file), ref))];
  const result: string[] = [];
  for (const [pattern, replacements] of Object.entries(config.paths)) {
    const index = pattern.indexOf('*');
    const matches =
      index < 0
        ? ref === pattern
        : ref.startsWith(pattern.slice(0, index)) && ref.endsWith(pattern.slice(index + 1));
    if (!matches) continue;
    const middle = index < 0 ? '' : ref.slice(index, ref.length - (pattern.length - index - 1));
    result.push(
      ...replacements.map((p) => posix.normalize(posix.join(config.base, p.replace('*', middle)))),
    );
  }
  return result;
}
export function candidateFiles(path: string): string[] {
  const extensions = [
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.css',
    '/index.tsx',
    '/index.ts',
    '/index.jsx',
    '/index.js',
  ];
  if (/\.(js|jsx)$/.test(path))
    return [path, path.replace(/\.jsx?$/, '.tsx'), path.replace(/\.jsx?$/, '.ts')];
  return /\.[a-z]+$/i.test(path) ? [path] : [path, ...extensions.map((e) => path + e)];
}
export async function localImports(
  root: string,
  file: string,
  refs: string[],
  covered: Map<string, string>,
): Promise<string[]> {
  const text =
    (await optionalRead(await safePath(root, 'tsconfig.json'))) ??
    (await optionalRead(await safePath(root, 'jsconfig.json')));
  const config = compilerResolution(text),
    warnings = [...config.warnings];
  for (const ref of refs) {
    const candidates = moduleCandidates(file, ref, config);
    if (!candidates.length) {
      if (ref.startsWith('@/') || ref.startsWith('~/'))
        warnings.push(`Unresolved local alias import ${ref}.`);
      continue;
    }
    if (candidates.every((c) => /\.(svg|png|jpe?g|gif|webp|json|woff2?)$/.test(c))) continue;
    let found = false;
    for (const c of candidates) {
      try {
        validateRelative(c);
      } catch {
        warnings.push(`Import ${ref} escapes declared project root.`);
        found = true;
        break;
      }
      if (candidateFiles(c).some((v) => covered.has(v))) {
        found = true;
        break;
      }
    }
    if (!found)
      warnings.push(
        `Local import ${ref} is missing or outside declared analyzed coverage. Include its source/styles or make a reviewed scoped exception.`,
      );
  }
  return warnings;
}
