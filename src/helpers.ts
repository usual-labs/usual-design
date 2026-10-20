import { parse } from '@babel/parser';
import * as t from '@babel/types';
import { candidateFiles, compilerResolution, moduleCandidates } from './imports.js';

export type HelperKind = 'clsx' | 'merge' | 'cn' | 'cva';
export type Helpers = ReadonlyMap<string, HelperKind>;
export type Literal = string | number | boolean | null | Literal[] | { [key: string]: Literal };
export type Decoded = { known: true; value: Literal } | { known: false };
const missing: Decoded = { known: false };

export function unwrap(node: t.Node): t.Node {
  while (
    node.type === 'TSAsExpression' ||
    node.type === 'TSSatisfiesExpression' ||
    node.type === 'TSNonNullExpression' ||
    node.type === 'ParenthesizedExpression'
  )
    node = node.expression;
  return node;
}

/** Decode data only. Referenced arrays/objects are mutable and deliberately unsupported. */
export function literal(
  node: t.Node | undefined | null,
  bindings: ReadonlyMap<string, t.Node>,
  seen = new Set<string>(),
  depth = 0,
): Decoded {
  if (!node || depth > 24) return missing;
  node = unwrap(node);
  if (
    node.type === 'StringLiteral' ||
    node.type === 'NumericLiteral' ||
    node.type === 'BooleanLiteral'
  )
    return { known: true, value: node.value };
  if (node.type === 'NullLiteral') return { known: true, value: null };
  if (node.type === 'TemplateLiteral' && !node.expressions.length)
    return { known: true, value: node.quasis[0].value.cooked ?? '' };
  if (node.type === 'Identifier' && bindings.has(node.name) && !seen.has(node.name)) {
    const binding = unwrap(bindings.get(node.name)!);
    if (binding.type === 'ObjectExpression' || binding.type === 'ArrayExpression') return missing;
    return literal(binding, bindings, new Set([...seen, node.name]), depth + 1);
  }
  if (node.type === 'ArrayExpression') {
    const result: Literal[] = [];
    if (node.elements.length > 128) return missing;
    for (const item of node.elements) {
      const parsed = literal(item, bindings, seen, depth + 1);
      if (!parsed.known) return missing;
      result.push(parsed.value);
    }
    return { known: true, value: result };
  }
  if (node.type === 'ObjectExpression') {
    if (node.properties.length > 128) return missing;
    const result: Record<string, Literal> = Object.create(null);
    for (const property of node.properties) {
      if (property.type !== 'ObjectProperty' || property.computed) return missing;
      const key =
        property.key.type === 'Identifier'
          ? property.key.name
          : property.key.type === 'StringLiteral' || property.key.type === 'NumericLiteral'
            ? String(property.key.value)
            : null;
      if (key === null || ['__proto__', 'constructor', 'prototype'].includes(key)) return missing;
      const parsed = literal(property.value, bindings, seen, depth + 1);
      if (!parsed.known) return missing;
      result[key] = parsed.value;
    }
    return { known: true, value: result };
  }
  return missing;
}

function importKind(from: string, name: string): HelperKind | undefined {
  if (
    (from === 'clsx' && ['default', 'clsx'].includes(name)) ||
    (from === 'classnames' && name === 'default') ||
    (from === 'class-variance-authority' && name === 'cx')
  )
    return 'clsx';
  if (from === 'tailwind-merge' && name === 'twMerge') return 'merge';
  if (from === 'class-variance-authority' && name === 'cva') return 'cva';
}

function declarations(ast: t.File): t.Statement[] {
  const result: t.Statement[] = [];
  for (const item of ast.program.body) {
    const declaration =
      item.type === 'ExportNamedDeclaration' || item.type === 'ExportDefaultDeclaration'
        ? item.declaration
        : item;
    if (declaration && t.isStatement(declaration)) result.push(declaration);
  }
  return result;
}

/** Reassignment invalidates trusted identities; no project code is executed. */
function assignedNames(ast: t.File): Set<string> {
  const assigned = new Set<string>();
  function visit(node: t.Node) {
    if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier')
      assigned.add(node.left.name);
    if (node.type === 'UpdateExpression' && node.argument.type === 'Identifier')
      assigned.add(node.argument.name);
    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const child = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(child))
        child.forEach((value) => {
          if (value && typeof value === 'object' && 'type' in value) visit(value as t.Node);
        });
      else if (child && typeof child === 'object' && 'type' in child) visit(child as t.Node);
    }
  }
  visit(ast);
  return assigned;
}

function canonicalWrapper(node: t.Node, direct: Helpers): boolean {
  if (
    !t.isFunctionDeclaration(node) &&
    !t.isFunctionExpression(node) &&
    !t.isArrowFunctionExpression(node)
  )
    return false;
  if (node.async || node.generator || node.params.length !== 1) return false;
  const parameter = node.params[0];
  if (
    parameter.type !== 'RestElement' ||
    parameter.argument.type !== 'Identifier' ||
    direct.has(parameter.argument.name)
  )
    return false;
  const body =
    node.body.type === 'BlockStatement'
      ? node.body.body.length === 1 && node.body.body[0].type === 'ReturnStatement'
        ? node.body.body[0].argument
        : null
      : node.body;
  if (
    body?.type !== 'CallExpression' ||
    body.callee.type !== 'Identifier' ||
    direct.get(body.callee.name) !== 'merge' ||
    body.arguments.length !== 1
  )
    return false;
  const inner = body.arguments[0];
  if (
    inner.type !== 'CallExpression' ||
    inner.callee.type !== 'Identifier' ||
    direct.get(inner.callee.name) !== 'clsx' ||
    inner.arguments.length !== 1
  )
    return false;
  const input =
    inner.arguments[0].type === 'SpreadElement' ? inner.arguments[0].argument : inner.arguments[0];
  return input.type === 'Identifier' && input.name === parameter.argument.name;
}

function directHelpers(ast: t.File): Map<string, HelperKind> {
  const result = new Map<string, HelperKind>();
  for (const item of ast.program.body)
    if (item.type === 'ImportDeclaration' && item.importKind !== 'type')
      for (const specifier of item.specifiers) {
        if (
          specifier.type === 'ImportNamespaceSpecifier' ||
          (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
        )
          continue;
        const name =
          specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value;
        const kind = importKind(item.source.value, name);
        if (kind) result.set(specifier.local.name, kind);
      }
  for (const name of assignedNames(ast)) result.delete(name);
  return result;
}

function localWrappers(ast: t.File, direct: Helpers): Map<string, HelperKind> {
  const result = new Map<string, HelperKind>();
  const assigned = assignedNames(ast);
  for (const declaration of declarations(ast)) {
    if (
      declaration.type === 'FunctionDeclaration' &&
      declaration.id &&
      canonicalWrapper(declaration, direct) &&
      !assigned.has(declaration.id.name)
    )
      result.set(declaration.id.name, 'cn');
    if (declaration.type === 'VariableDeclaration' && declaration.kind === 'const')
      for (const item of declaration.declarations)
        if (
          item.id.type === 'Identifier' &&
          item.init &&
          canonicalWrapper(item.init, direct) &&
          !assigned.has(item.id.name)
        )
          result.set(item.id.name, 'cn');
  }
  return result;
}

function exportedWrappers(source: string): Set<string> {
  const ast = parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  const direct = directHelpers(ast),
    local = localWrappers(ast, direct);
  const result = new Set<string>();
  for (const item of ast.program.body) {
    if (item.type === 'ExportNamedDeclaration') {
      const declaration = item.declaration;
      if (
        declaration?.type === 'FunctionDeclaration' &&
        declaration.id &&
        local.has(declaration.id.name)
      )
        result.add(declaration.id.name);
      if (declaration?.type === 'VariableDeclaration')
        for (const value of declaration.declarations)
          if (value.id.type === 'Identifier' && local.has(value.id.name)) result.add(value.id.name);
      if (!item.source)
        for (const specifier of item.specifiers)
          if (specifier.type === 'ExportSpecifier' && local.has(specifier.local.name))
            result.add(
              specifier.exported.type === 'Identifier'
                ? specifier.exported.name
                : specifier.exported.value,
            );
    }
    if (item.type === 'ExportDefaultDeclaration') {
      const declaration = item.declaration;
      const supported =
        declaration.type === 'Identifier'
          ? local.has(declaration.name)
          : declaration.type === 'FunctionDeclaration' && declaration.id
            ? local.has(declaration.id.name)
            : canonicalWrapper(declaration, direct);
      if (supported) result.add('default');
    }
  }
  return result;
}

export function discoverHelpers(
  ast: t.File,
  file: string,
  covered: ReadonlyMap<string, string>,
): Map<string, HelperKind> {
  const result = directHelpers(ast);
  const resolver = compilerResolution(covered.get('tsconfig.json') ?? covered.get('jsconfig.json'));
  for (const [name, kind] of localWrappers(ast, result)) result.set(name, kind);
  for (const item of ast.program.body) {
    if (item.type !== 'ImportDeclaration' || item.importKind === 'type') continue;
    const candidates = moduleCandidates(file, item.source.value, resolver)
      .filter((path) => !path.startsWith('../') && !path.startsWith('/'))
      .flatMap(candidateFiles);
    const source = candidates
      .map((candidate) => covered.get(candidate))
      .find((value) => value !== undefined);
    if (!source) continue;
    let exports: Set<string>;
    try {
      exports = exportedWrappers(source);
    } catch {
      continue;
    }
    for (const specifier of item.specifiers) {
      if (
        specifier.type === 'ImportNamespaceSpecifier' ||
        (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
      )
        continue;
      const imported =
        specifier.type === 'ImportDefaultSpecifier'
          ? 'default'
          : specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value;
      if (exports.has(imported)) result.set(specifier.local.name, 'cn');
    }
  }
  for (const name of assignedNames(ast)) result.delete(name);
  return result;
}
