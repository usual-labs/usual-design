import { minimatch } from 'minimatch';
import type { Manifest, Finding, Category, ElementEvidence, Inventory } from './types.js';
import { categories } from './types.js';
import {
  classCategory,
  splitClass,
  styleCategories,
  variables,
  wildcardMatch,
  propertyCategory,
  directVariableReference,
  utilityFamily,
} from './classes.js';
import { hash } from './files.js';
import type { Declaration } from './analysis.js';
export function finding(input: Omit<Finding, 'id'>): Finding {
  const id = hash(
    JSON.stringify([
      input.file,
      input.ruleId,
      input.line,
      input.column,
      input.actual ?? input.message,
    ]),
  ).slice(0, 20);
  return { ...input, id };
}
export function coverage(
  file: string,
  line: number,
  message: string,
  affectedCategories: Category[] = styleCategories,
): Finding {
  return finding({
    file,
    line,
    column: 1,
    ruleId: 'coverage.unresolved',
    category: 'coverage',
    affectedCategories,
    message,
    kind: 'coverage',
  });
}
const neutral =
  /^(group(\/\w+)?|peer(\/\w+)?|sr-only|not-sr-only|container|overflow(-[xy])?-(auto|hidden|clip|visible|scroll)|z-[\w[\]-]+|cursor-[\w-]+|pointer-events-(none|auto)|select-(none|text|all|auto)|transition(-[\w-]+)?|duration-[\w[\]-]+|ease-[\w-]+|delay-[\w[\]-]+|motion-reduce|touch-[\w-]+|object-[\w-]+|aspect-[\w/[\]-]+|list-[\w-]+|resize(-[xy]|-none)?|whitespace-[\w-]+|break-[\w-]+|isolate|isolation-auto)$/;
export function evaluate(
  m: Manifest,
  elements: ElementEvidence[],
  declarations: Declaration[],
  inventory: Inventory,
  knownClasses: Set<string>,
  resolveIdentity?: (file: string, from: string, name: string) => string | undefined,
  manifestPath = 'usual.design.json',
): Finding[] {
  const out: Finding[] = [];
  const themeTokens = new Set(inventory.tokens.map((t) => t.name));
  const categoryOf = (c: string) => classCategory(c, themeTokens);
  for (const el of elements) {
    if (el.unknownCategories.length)
      out.push(
        coverage(
          el.file,
          el.line,
          'Dynamic classes, styles, or props prevent complete verification. Use finite literal branches or a reviewed scoped exception.',
          el.unknownCategories,
        ),
      );
    for (const candidate of new Set(el.classes.flat())) {
      const base = splitClass(candidate).base;
      const cat = categoryOf(candidate);
      if (!cat) {
        if (!neutral.test(base) && !knownClasses.has(base))
          out.push(
            coverage(
              el.file,
              el.line,
              `Cannot verify class ${candidate}; it is outside the supported utility/property matrix.`,
            ),
          );
        continue;
      }
      const policy = m.allowed?.[cat];
      const vars = variables(base);
      const okay =
        policy?.classes?.some((p) => wildcardMatch(candidate, p) || wildcardMatch(base, p)) ||
        directVariableReference(base, policy?.variables ?? []);
      if (!okay)
        out.push(
          finding({
            ruleId: `allowed.${cat}`,
            category: cat,
            file: el.file,
            line: el.line,
            column: el.column,
            kind: 'violation',
            actual: candidate,
            expected: `An approved ${cat} class or variable in allowed.${cat}`,
            message: `${candidate} is outside the approved ${cat} policy. Choose an allowed value; do not broaden policy as an ordinary repair.`,
          }),
        );
    }
    for (const rule of m.components ?? []) {
      if (rule.element !== el.name || rule.ignore?.some((p) => minimatch(el.file, p))) continue;
      out.push(
        finding({
          ruleId: rule.id,
          category: 'components',
          kind: 'violation',
          file: el.file,
          line: el.line,
          column: el.column,
          actual: `<${el.name}>`,
          expected: `${rule.replacement.name} from ${rule.replacement.from}`,
          message: `Use the approved ${rule.replacement.name} component instead of <${el.name}> in this scope.`,
        }),
      );
    }
    for (const rule of m.semantics ?? []) {
      if (rule.ignore?.some((p) => minimatch(el.file, p))) continue;
      const target = rule.target;
      const context = target.classes ?? [];
      const contextUnknown = context.length > 0 && (el.classesUnknown ?? el.unknown);
      const branches = context.length
        ? el.classes.filter((branch) => context.every((name) => branch.includes(name)))
        : el.classes;
      // Exact class context and literal prop mismatches can exclude a rule independently.
      if (context.length && !contextUnknown && !branches.length) continue;
      if (
        Object.entries(target.props ?? {}).some(
          ([name, value]) =>
            el.props[name] !== value &&
            !el.unknownProps.includes(name) &&
            !el.unknownProps.includes('*'),
        )
      )
        continue;
      const affected = [
        ...new Set([
          ...(rule.requireClasses ?? []).map((c) => categoryOf(c) ?? 'components'),
          ...(rule.forbidClasses ?? []).map((c) => categoryOf(c) ?? 'components'),
          ...(Object.keys(rule.requireProps ?? {}).length ? ['components' as const] : []),
        ]),
      ];
      const importedIdentity = el.identityBlocked ? undefined : el.identity;
      let identityMatch = target.element
        ? target.element === el.name
        : !!target.component &&
          !!importedIdentity &&
          target.component.from === importedIdentity.from &&
          target.component.name === importedIdentity.name;
      if (
        !identityMatch &&
        target.component &&
        resolveIdentity &&
        (importedIdentity || /^[A-Z]/.test(el.name) || el.name.includes('.'))
      ) {
        const actual = importedIdentity
          ? resolveIdentity(el.file, importedIdentity.from, importedIdentity.name)
          : el.identityBlocked
            ? undefined
            : resolveIdentity(el.file, '', el.name);
        const wanted = resolveIdentity(el.file, target.component.from, target.component.name);
        identityMatch = !!actual && !!wanted && actual === wanted;
        if (!actual || !wanted)
          out.push(
            coverage(
              el.file,
              el.line,
              `Cannot resolve component export identity for semantic rule ${rule.id}; use a supported explicit import or review its export chain.`,
              affected,
            ),
          );
      }
      if (!identityMatch) continue;
      if (Object.entries(target.props ?? {}).some(([k, v]) => el.props[k] !== v)) {
        if (
          Object.keys(target.props ?? {}).some(
            (k) => el.unknownProps.includes(k) || el.unknownProps.includes('*'),
          )
        )
          out.push(
            coverage(
              el.file,
              el.line,
              `Cannot determine whether semantic rule ${rule.id} applies because matching props are dynamic.`,
              affected,
            ),
          );
        continue;
      }
      if (contextUnknown) {
        out.push(
          coverage(
            el.file,
            el.line,
            `Cannot determine whether semantic rule ${rule.id} applies because its exact class context is dynamic.`,
            affected,
          ),
        );
        continue;
      }
      for (const needed of rule.requireClasses ?? []) {
        if (
          !branches.every(
            (branch) =>
              branch.includes(needed) &&
              !branch.some(
                (c) =>
                  c !== needed &&
                  utilityFamily(c, themeTokens) === utilityFamily(needed, themeTokens),
              ),
          )
        )
          out.push(
            finding({
              ruleId: rule.id,
              category: categoryOf(needed) ?? 'components',
              file: el.file,
              line: el.line,
              column: el.column,
              kind: 'violation',
              expected: needed,
              message: `Semantic rule ${rule.id} requires ${needed} in every applicable branch.`,
            }),
          );
      }
      for (const forbidden of rule.forbidClasses ?? []) {
        if (
          branches.some((branch) =>
            branch.some(
              (c) =>
                wildcardMatch(c, forbidden) ||
                (!splitClass(forbidden).variants.length &&
                  wildcardMatch(splitClass(c).base, splitClass(forbidden).base)),
            ),
          )
        )
          out.push(
            finding({
              ruleId: rule.id,
              category: categoryOf(forbidden) ?? 'components',
              file: el.file,
              line: el.line,
              column: el.column,
              kind: 'violation',
              actual: forbidden,
              message: `Semantic rule ${rule.id} forbids ${forbidden}.`,
            }),
          );
      }
      for (const [key, val] of Object.entries(rule.requireProps ?? {}))
        if (el.props[key] !== val)
          out.push(
            finding({
              ruleId: rule.id,
              category: 'components',
              file: el.file,
              line: el.line,
              column: el.column,
              kind: 'violation',
              expected: `${key}=${String(val)}`,
              message: `Semantic rule ${rule.id} requires prop ${key}=${String(val)}.`,
            }),
          );
    }
  }
  for (const d of declarations) {
    const cat = propertyCategory(d.property);
    if (!cat || d.property.startsWith('--')) continue;
    if (d.unknown) {
      out.push(coverage(d.file, d.line, `Cannot verify dynamic ${d.property}.`, [cat]));
      continue;
    }
    const policy = m.allowed?.[cat],
      vars = variables(d.value);
    if (
      !policy?.values?.includes(d.value) &&
      !directVariableReference(d.value, policy?.variables ?? [])
    )
      out.push(
        finding({
          ruleId: `allowed.${cat}`,
          category: cat,
          file: d.file,
          line: d.line,
          column: d.column,
          actual: `${d.property}: ${d.value}`,
          expected: `An approved allowed.${cat}.values or variable`,
          kind: 'violation',
          message: `${d.property}: ${d.value} is outside the approved ${cat} declaration policy.`,
        }),
      );
  }
  // Missing variable definitions are distinct from policy approval.
  const tokenNames = new Set(inventory.tokens.map((t) => t.name));
  function variableProblem(name: string, seen = new Set<string>()): string | undefined {
    if (seen.has(name)) return `cyclic reference at ${name}`;
    if (seen.size > 24) return 'variable resolution exceeds supported depth';
    if (!tokenNames.has(name)) return `missing definition for ${name}`;
    for (const definition of inventory.tokens.filter((t) => t.name === name))
      for (const ref of variables(definition.value)) {
        const problem = variableProblem(ref, new Set([...seen, name]));
        if (problem) return problem;
      }
  }
  for (const cat of styleCategories)
    for (const v of m.allowed?.[cat]?.variables ?? []) {
      const problem = variableProblem(v);
      if (problem)
        out.push(
          coverage(manifestPath, 1, `Approved variable ${v} cannot be resolved: ${problem}.`, [
            cat,
          ]),
        );
    }
  return out;
}
export function activeFinding(f: Finding, active: Category[]): boolean {
  return f.category === 'coverage'
    ? (f.affectedCategories ?? categories).some((c) => active.includes(c))
    : active.includes(f.category);
}
