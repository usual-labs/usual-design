import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { compilerResolution, moduleCandidates, candidateFiles } from './imports.js';
import { validateRelative } from './files.js';

type Reference =
  { local: string } | { from: string; name: string } | { symbol: string } | { unknown: true };
type Resolution = { kind: 'found'; identity: string } | { kind: 'missing' | 'unknown' };
interface Module {
  locals: Map<string, Reference>;
  exports: Map<string, Reference>;
  stars: string[];
  mutable: Set<string>;
}
interface Traversal {
  visiting: Set<string>;
  budget: number;
}
const missing: Resolution = { kind: 'missing' },
  unknown: Resolution = { kind: 'unknown' };
const found = (identity: string): Resolution => ({ kind: 'found', identity });
const symbol = (file: string, name: string) => `local:${JSON.stringify([file, name])}`;

function names(node: t.Node): string[] {
  if (node.type === 'Identifier') return [node.name];
  if (node.type === 'RestElement') return names(node.argument);
  if (node.type === 'AssignmentPattern') return names(node.left);
  if (node.type === 'ArrayPattern')
    return node.elements.flatMap((value) => (value ? names(value) : []));
  if (node.type === 'ObjectPattern')
    return node.properties.flatMap((value) =>
      names(value.type === 'RestElement' ? value.argument : value.value),
    );
  return [];
}

function expression(node: t.Node, file: string, name: string): Reference {
  while (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'ParenthesizedExpression'
  )
    node = node.expression;
  if (node.type === 'Identifier') return { local: node.name };
  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ClassExpression'
  )
    return { symbol: symbol(file, name) };
  return { unknown: true };
}

function readModule(file: string, source: string): Module | undefined {
  try {
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    const result: Module = { locals: new Map(), exports: new Map(), stars: [], mutable: new Set() };
    let dynamic = false;
    const queue: t.Node[] = [ast];
    let visited = 0;
    while (queue.length) {
      const node = queue.pop()!;
      if (++visited > 50_000) return undefined;
      if (node.type === 'AssignmentExpression')
        names(node.left).forEach((name) => result.mutable.add(name));
      if (node.type === 'UpdateExpression')
        names(node.argument).forEach((name) => result.mutable.add(name));
      if (
        (node.type === 'ForOfStatement' || node.type === 'ForInStatement') &&
        node.left.type !== 'VariableDeclaration'
      )
        names(node.left).forEach((name) => result.mutable.add(name));
      if (
        node.type === 'CallExpression' &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'eval'
      )
        dynamic = true;
      for (const key of t.VISITOR_KEYS[node.type] ?? []) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          for (const child of value)
            if (child && typeof child === 'object' && 'type' in child) queue.push(child as t.Node);
        } else if (value && typeof value === 'object' && 'type' in value)
          queue.push(value as t.Node);
      }
    }
    if (dynamic) return undefined;
    function declare(declaration: t.Node) {
      if (
        (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') &&
        declaration.id
      )
        result.locals.set(declaration.id.name, { symbol: symbol(file, declaration.id.name) });
      if (declaration.type === 'VariableDeclaration')
        for (const value of declaration.declarations) {
          for (const name of names(value.id)) result.locals.set(name, { unknown: true });
          if (declaration.kind === 'const' && value.id.type === 'Identifier' && value.init)
            result.locals.set(value.id.name, expression(value.init, file, value.id.name));
        }
    }
    for (const item of ast.program.body) {
      if (item.type === 'ImportDeclaration' && item.importKind !== 'type')
        for (const value of item.specifiers) {
          if (
            value.type === 'ImportNamespaceSpecifier' ||
            (value.type === 'ImportSpecifier' && value.importKind === 'type')
          )
            continue;
          const name =
            value.type === 'ImportDefaultSpecifier'
              ? 'default'
              : value.imported.type === 'Identifier'
                ? value.imported.name
                : value.imported.value;
          result.locals.set(value.local.name, { from: item.source.value, name });
        }
      const declaration =
        item.type === 'ExportNamedDeclaration' || item.type === 'ExportDefaultDeclaration'
          ? item.declaration
          : item;
      if (declaration) declare(declaration);
      if (item.type === 'ExportNamedDeclaration' && item.exportKind !== 'type') {
        if (
          declaration?.type === 'FunctionDeclaration' ||
          declaration?.type === 'ClassDeclaration'
        ) {
          if (declaration.id)
            result.exports.set(declaration.id.name, { local: declaration.id.name });
        }
        if (declaration?.type === 'VariableDeclaration')
          for (const value of declaration.declarations)
            for (const name of names(value.id)) result.exports.set(name, { local: name });
        for (const value of item.specifiers) {
          const exported =
            value.exported.type === 'Identifier' ? value.exported.name : value.exported.value;
          if (value.type !== 'ExportSpecifier') {
            result.exports.set(exported, { unknown: true });
            continue;
          }
          if (value.exportKind === 'type') continue;
          const local = value.local.name;
          result.exports.set(
            exported,
            item.source ? { from: item.source.value, name: local } : { local },
          );
        }
      }
      if (item.type === 'ExportDefaultDeclaration') {
        const value = item.declaration;
        if ((value.type === 'FunctionDeclaration' || value.type === 'ClassDeclaration') && value.id)
          result.exports.set('default', { local: value.id.name });
        else if (value.type === 'FunctionDeclaration' || value.type === 'ClassDeclaration')
          result.exports.set('default', { symbol: symbol(file, 'default') });
        else result.exports.set('default', expression(value, file, 'default'));
      }
      if (item.type === 'ExportAllDeclaration' && item.exportKind !== 'type')
        result.stars.push(item.source.value);
    }
    return result;
  } catch {
    return undefined;
  }
}

/** Resolve only covered, root-local source. No filesystem access or project execution. */
export function createIdentityResolver(covered: ReadonlyMap<string, string>) {
  let config: ReturnType<typeof compilerResolution>;
  try {
    config = compilerResolution(covered.get('tsconfig.json') ?? covered.get('jsconfig.json'));
  } catch {
    config = { paths: {}, base: '.', warnings: ['Unresolved compiler configuration'] };
  }
  const modules = new Map<string, Module | undefined>();
  const cached = new Map<string, Resolution>();
  function module(file: string): Module | undefined {
    if (!modules.has(file))
      modules.set(file, covered.has(file) ? readModule(file, covered.get(file)!) : undefined);
    return modules.get(file);
  }
  function guard(key: string, state: Traversal, work: () => Resolution): Resolution {
    if (--state.budget < 0 || state.visiting.size > 32 || state.visiting.has(key)) return unknown;
    const previous = cached.get(key);
    if (previous) return previous;
    state.visiting.add(key);
    const result = work();
    state.visiting.delete(key);
    // Unknown may depend on this traversal's remaining budget/cycle path.
    if (result.kind !== 'unknown') cached.set(key, result);
    return result;
  }
  function resolveModule(
    file: string,
    from: string,
    name: string,
    state: Traversal,
    star = false,
  ): Resolution {
    if (!from || !name) return unknown;
    const candidates = moduleCandidates(file, from, config);
    if (!candidates.length) {
      if (
        from.startsWith('.') ||
        from.startsWith('/') ||
        from.startsWith('@/') ||
        from.startsWith('~/') ||
        from.includes('\\') ||
        from.includes('\0')
      )
        return unknown;
      return star ? unknown : found(`${from}#${name}`);
    }
    const matched = new Set<string>();
    for (const candidate of candidates) {
      try {
        validateRelative(candidate);
      } catch {
        return unknown;
      }
      const target = candidateFiles(candidate).find((value) => covered.has(value));
      if (target) matched.add(target);
    }
    if (matched.size !== 1) return unknown;
    return resolveExport([...matched][0], name, state);
  }
  function reference(file: string, value: Reference, state: Traversal): Resolution {
    if ('unknown' in value) return unknown;
    if ('symbol' in value) return found(value.symbol);
    if ('from' in value) return resolveModule(file, value.from, value.name, state);
    return guard(`local:${JSON.stringify([file, value.local])}`, state, () => {
      const info = module(file);
      if (!info || info.mutable.has(value.local)) return unknown;
      const binding = info.locals.get(value.local);
      return binding ? reference(file, binding, state) : unknown;
    });
  }
  function resolveExport(file: string, name: string, state: Traversal): Resolution {
    return guard(`export:${JSON.stringify([file, name])}`, state, () => {
      const info = module(file);
      if (!info) return unknown;
      const explicit = info.exports.get(name);
      if (explicit) return reference(file, explicit, state);
      if (name === 'default') return missing;
      const identities = new Set<string>();
      for (const from of info.stars) {
        const value = resolveModule(file, from, name, state, true);
        if (value.kind === 'unknown') return unknown;
        if (value.kind === 'found') identities.add(value.identity);
      }
      return identities.size === 1
        ? found([...identities][0])
        : identities.size
          ? unknown
          : missing;
    });
  }
  return (file: string, from: string, exportName: string): string | undefined => {
    const traversal = { visiting: new Set<string>(), budget: 512 };
    // Callers must establish that a module-local JSX name is not lexically shadowed.
    const result =
      from === ''
        ? reference(file, { local: exportName }, traversal)
        : resolveModule(file, from, exportName, traversal);
    return result.kind === 'found' ? result.identity : undefined;
  };
}
