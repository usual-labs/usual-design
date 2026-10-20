import type * as t from '@babel/types';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { literal, unwrap, type Helpers } from './helpers.js';

export interface ClassValue {
  branches: string[][];
  unknown: boolean;
}
export type Bindings = Map<string, t.Node>;
export const unknown = (): ClassValue => ({ branches: [[]], unknown: true });
const empty = (): ClassValue => ({ branches: [[]], unknown: false });
const classes = (value: string): ClassValue => ({
  branches: [value.split(/\s+/).filter(Boolean)],
  unknown: false,
});

function bounded(branches: string[][], unresolved: boolean): ClassValue {
  return branches.length > 64 ? unknown() : { branches, unknown: unresolved };
}

export function combine(a: ClassValue, b: ClassValue): ClassValue {
  if (a.branches.length * b.branches.length > 64) return unknown();
  return bounded(
    a.branches.flatMap((x) => b.branches.map((y) => [...x, ...y])),
    a.unknown || b.unknown,
  );
}

function variantCall(
  node: t.CallExpression,
  definition: t.Node,
  bindings: Bindings,
  helpers: Helpers,
): ClassValue {
  definition = unwrap(definition);
  if (
    definition.type !== 'CallExpression' ||
    definition.callee.type !== 'Identifier' ||
    helpers.get(definition.callee.name) !== 'cva' ||
    definition.arguments.length > 2 ||
    node.arguments.length > 1
  )
    return unknown();
  const base = definition.arguments.length
    ? literal(definition.arguments[0], bindings)
    : { known: true as const, value: '' };
  const config =
    definition.arguments.length > 1
      ? literal(definition.arguments[1], bindings)
      : { known: true as const, value: null };
  const selection = node.arguments.length
    ? literal(node.arguments[0], bindings)
    : { known: true as const, value: null };
  if (!base.known || !config.known || !selection.known) return unknown();
  if (config.value !== null && (typeof config.value !== 'object' || Array.isArray(config.value)))
    return unknown();
  if (
    selection.value !== null &&
    (typeof selection.value !== 'object' || Array.isArray(selection.value))
  )
    return unknown();
  try {
    // Only decoded data reaches our dependency. Project code/modules are never evaluated.
    const evaluate = cva<Record<string, Record<string, string>>>(
      base.value as Parameters<typeof cva>[0],
      config.value as never,
    );
    return classes(evaluate(selection.value as never));
  } catch {
    return unknown();
  }
}

export function classValue(
  node: t.Node | null | undefined,
  bindings: Bindings,
  helpers: Helpers,
  seen = new Set<string>(),
  depth = 0,
  context: 'class' | 'clsx' | 'merge' = 'class',
): ClassValue {
  if (!node) return empty();
  if (depth > 32) return unknown();
  node = unwrap(node);
  const value = (child: t.Node | undefined | null) =>
    classValue(child, bindings, helpers, seen, depth + 1, context);
  if (node.type === 'StringLiteral') return classes(node.value);
  if (node.type === 'NumericLiteral')
    return context === 'merge' || !node.value ? empty() : classes(String(node.value));
  if (node.type === 'BooleanLiteral' || node.type === 'NullLiteral') return empty();
  if (node.type === 'TemplateLiteral' && !node.expressions.length)
    return classes(node.quasis[0].value.cooked ?? '');
  if (node.type === 'Identifier' && bindings.has(node.name) && !seen.has(node.name)) {
    const binding = unwrap(bindings.get(node.name)!);
    if (binding.type === 'ArrayExpression' || binding.type === 'ObjectExpression') return unknown();
    return classValue(
      binding,
      bindings,
      helpers,
      new Set([...seen, node.name]),
      depth + 1,
      context,
    );
  }
  if (node.type === 'ConditionalExpression') {
    const test = literal(node.test, bindings);
    if (test.known) return value(test.value ? node.consequent : node.alternate);
    const a = value(node.consequent),
      b = value(node.alternate);
    return bounded([...a.branches, ...b.branches], a.unknown || b.unknown);
  }
  if (node.type === 'LogicalExpression') {
    const left = literal(node.left, bindings);
    if (left.known) {
      if (node.operator === '&&') return left.value ? value(node.right) : empty();
      if (node.operator === '||') return value(left.value ? node.left : node.right);
      return value(left.value === null ? node.right : node.left);
    }
    const right = value(node.right);
    if (node.operator === '&&') return bounded([[], ...right.branches], right.unknown);
    const leftClasses = value(node.left);
    return bounded(
      [...leftClasses.branches, ...right.branches],
      leftClasses.unknown || right.unknown,
    );
  }
  if (node.type === 'ArrayExpression')
    return context === 'class'
      ? unknown()
      : node.elements.reduce<ClassValue>((acc, item) => combine(acc, value(item)), empty());
  if (node.type === 'ObjectExpression')
    return context !== 'clsx'
      ? unknown()
      : node.properties.reduce<ClassValue>((acc, property) => {
          if (property.type !== 'ObjectProperty' || property.computed)
            return combine(acc, unknown());
          const key =
            property.key.type === 'StringLiteral'
              ? property.key.value
              : property.key.type === 'Identifier'
                ? property.key.name
                : null;
          if (key === null || key === '__proto__') return combine(acc, unknown());
          const condition = literal(property.value, bindings);
          const names = classes(key);
          return combine(
            acc,
            condition.known
              ? condition.value
                ? names
                : empty()
              : bounded([[], ...names.branches], false),
          );
        }, empty());
  if (node.type === 'CallExpression') {
    if (node.callee.type === 'CallExpression')
      return variantCall(node, node.callee, bindings, helpers);
    if (node.callee.type !== 'Identifier') return unknown();
    const kind = helpers.get(node.callee.name);
    if (!kind) {
      const definition = bindings.get(node.callee.name);
      return definition ? variantCall(node, definition, bindings, helpers) : unknown();
    }
    if (kind === 'cva') return unknown(); // A cva definition is a function, not a class string.
    const result = node.arguments.reduce<ClassValue>(
      (acc, argument) =>
        combine(
          acc,
          classValue(
            argument,
            bindings,
            helpers,
            seen,
            depth + 1,
            kind === 'merge' ? 'merge' : 'clsx',
          ),
        ),
      empty(),
    );
    if (kind === 'clsx') return result;
    return bounded(
      result.branches.map((branch) => twMerge(branch.join(' ')).split(/\s+/).filter(Boolean)),
      result.unknown,
    );
  }
  return unknown();
}
