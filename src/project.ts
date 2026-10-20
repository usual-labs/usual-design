import { loadManifest, categoryReady } from './config.js';
import { discover } from './discovery.js';
import { analyzeSource, type Declaration } from './analysis.js';
import { categories, type AuditResult, type ElementEvidence, type Manifest } from './types.js';
import { activeFinding, coverage, evaluate, finding } from './rules.js';
import { hash, optionalRead, safePath } from './files.js';
import postcss from 'postcss';
import { minimatch } from 'minimatch';
import { wildcardMatch } from './classes.js';
import { createIdentityResolver } from './identity.js';
import { collectObserved } from './observed.js';
import { localImports } from './imports.js';
import { finalizeFindings, type DiagnosticEvidence } from './diagnostics.js';
export async function runProject(
  root: string,
  mode: 'check' | 'audit',
  configPath = 'usual.design.json',
): Promise<AuditResult> {
  const { manifest, manifestHash } = await loadManifest(root, configPath);
  return analyzeProject(root, mode, manifest, manifestHash, configPath);
}
export async function analyzeProject(
  root: string,
  mode: 'check' | 'audit',
  m: Manifest,
  manifestHash: string,
  configPath = 'usual.design.json',
): Promise<AuditResult> {
  const { inventory, sources, snapshot: sourceHash } = await discover(root, m);
  const result: AuditResult = {
    version: 1,
    mode,
    snapshot: hash(sourceHash + manifestHash),
    manifestHash,
    policyHash: hash(JSON.stringify({ ...m, active: [] })),
    findings: [],
    active: m.active,
    inactive: categories.filter((c) => !m.active.includes(c)),
    files: inventory.files,
    errors: [],
    inventory,
  };
  const elements: ElementEvidence[] = [],
    declarations: Declaration[] = [],
    evidence: DiagnosticEvidence[] = [],
    knownClasses = new Set<string>();
  const analysisSources = new Map(sources);
  for (const path of ['tsconfig.json', 'jsconfig.json']) {
    const raw = await optionalRead(await safePath(root, path));
    if (raw) analysisSources.set(path, raw);
  }
  for (const [file, source] of sources) {
    try {
      if (/\.[jt]sx?$/.test(file)) {
        const a = analyzeSource(file, source, analysisSources);
        elements.push(...a.elements);
        declarations.push(...a.declarations);
        evidence.push(...a.importBindings);
        for (const binding of a.importBindings ?? [])
          for (const rule of m.imports ?? []) {
            if (
              !wildcardMatch(binding.from, rule.from) ||
              (rule.names && !rule.names.includes(binding.name) && binding.name !== '*') ||
              rule.ignore?.some((p) => minimatch(file, p))
            )
              continue;
            result.findings.push(
              finding({
                ruleId: rule.id,
                category: 'components',
                kind: 'violation',
                file,
                line: binding.line,
                column: binding.column,
                actual: `${binding.name} from ${binding.from}`,
                expected: rule.replacement
                  ? `${rule.replacement.name} from ${rule.replacement.from}`
                  : undefined,
                message: `Import restriction ${rule.id} forbids ${binding.name} from ${binding.from}.`,
              }),
            );
          }
        for (const warning of a.unknownImports) result.findings.push(coverage(file, 1, warning));
        for (const warning of await localImports(root, file, a.imports, sources))
          result.findings.push(coverage(file, 1, warning, [...categories]));
      } else if (file.endsWith('.css')) {
        const css = postcss.parse(source, { from: file });
        css.walkRules((r) => {
          for (const match of r.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g))
            knownClasses.add(match[1]);
        });
        css.walkDecls((d) => {
          if (d.prop.startsWith('--')) return;
          declarations.push({
            property: d.prop,
            value: d.value,
            file,
            line: d.source?.start?.line ?? 1,
            column: d.source?.start?.column ?? 1,
            span:
              d.source?.start?.offset !== undefined && d.source?.end?.offset !== undefined
                ? { start: d.source.start.offset, end: d.source.end.offset }
                : undefined,
            unknown: false,
          });
        });
        css.walkAtRules((r) => {
          if (['config', 'plugin', 'utility', 'apply', 'source'].includes(r.name))
            result.findings.push(
              coverage(
                file,
                r.source?.start?.line ?? 1,
                `@${r.name} cannot be verified without additional supported static analysis.`,
              ),
            );
        });
      } else result.findings.push(coverage(file, 1, 'Unsupported covered source type.'));
    } catch (error) {
      result.errors.push(`${file}: ${(error as Error).message}`);
    }
  }
  collectObserved(inventory, elements, declarations);
  if (!result.files.length)
    result.errors.push('No files match declared coverage; review include/ignore paths.');
  for (const warning of inventory.warnings) result.findings.push(coverage(configPath, 1, warning));
  result.findings.push(
    ...evaluate(
      m,
      elements,
      declarations,
      inventory,
      knownClasses,
      createIdentityResolver(analysisSources),
      configPath,
    ),
  );
  for (const cat of categories)
    if (!categoryReady(m, cat))
      result.findings.push(
        finding({
          file: configPath,
          line: 1,
          column: 1,
          ruleId: `policy.${cat}`,
          category: cat,
          kind: 'decision',
          message: `No effective ${cat} policy. Make explicit design decisions before activation.`,
        }),
      );
  result.findings = finalizeFindings(result.findings, sources, [
    ...evidence,
    ...elements,
    ...declarations,
  ]);
  if (mode === 'check') result.findings = result.findings.filter((f) => activeFinding(f, m.active));
  const exceptionsUsed = (m.exceptions ?? []).filter((e) =>
    result.findings.some((f) => e.ruleId === f.ruleId && minimatch(f.file, e.file)),
  );
  result.coverage = {
    include: m.include,
    ignore: m.ignore ?? [],
    exceptionsUsed,
    exceptionsUnused: (m.exceptions ?? []).filter((e) => !exceptionsUsed.includes(e)),
  };
  result.findings = result.findings.filter(
    (f) => !exceptionsUsed.some((e) => e.ruleId === f.ruleId && minimatch(f.file, e.file)),
  );
  return result;
}
export function resultExit(result: AuditResult): number {
  return result.errors.length ? 2 : result.findings.length ? 1 : 0;
}
export function humanResult(r: AuditResult): string {
  const lines = [
    `Usual Design ${r.mode}: ${r.files.length} files`,
    `Active: ${r.active.join(', ') || 'none — no design enforcement'}`,
    `Inactive: ${r.inactive.join(', ') || 'none'}`,
  ];
  if (r.coverage)
    lines.push(
      `Include: ${r.coverage.include.join(', ')}`,
      `Configured excludes: ${r.coverage.ignore.join(', ') || 'none'}; standard dependency/build exclusions also apply.`,
      `Exceptions used: ${r.coverage.exceptionsUsed.length}`,
    );
  if (r.coverage?.exceptionsUnused !== undefined)
    lines.push(
      `Exceptions unused in this run: ${r.coverage.exceptionsUnused.length}; review them in a full audit before removal.`,
    );
  for (const e of r.errors) lines.push(`ERROR ${e}`);
  for (const f of r.findings)
    lines.push(
      `${f.file}:${f.line}:${f.column} [${f.ruleId}] ${f.message}${f.expected ? ` Expected: ${f.expected}` : ''}`,
    );
  lines.push(`${r.findings.length} findings; ${r.errors.length} operational errors.`);
  return lines.join('\n');
}
