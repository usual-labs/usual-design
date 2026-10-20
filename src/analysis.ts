import { parse } from '@babel/parser';
import * as t from '@babel/types';
import type { Category, ElementEvidence, SourceSpan } from './types.js';
import { classValue, type Bindings } from './expressions.js';
import { discoverHelpers } from './helpers.js';
export interface Declaration {
  property: string;
  value: string;
  file: string;
  line: number;
  column: number;
  unknown: boolean;
  span?: SourceSpan;
}
export interface ImportBinding {
  name: string;
  from: string;
  local: string;
  line: number;
  column: number;
  file: string;
  span?: SourceSpan;
}
function sourceSpan(node: t.Node): SourceSpan | undefined {
  return typeof node.start === 'number' && typeof node.end === 'number'
    ? { start: node.start, end: node.end }
    : undefined;
}
export interface SourceAnalysis {
  elements: ElementEvidence[];
  declarations: Declaration[];
  unknownImports: string[];
  imports: string[];
  importBindings: ImportBinding[];
}
function bindingNames(node: t.Node): string[] {
  if (node.type === 'Identifier') return [node.name];
  if (node.type === 'RestElement') return bindingNames(node.argument);
  if (node.type === 'AssignmentPattern') return bindingNames(node.left);
  if (node.type === 'ArrayPattern') return node.elements.flatMap((v) => (v ? bindingNames(v) : []));
  if (node.type === 'ObjectPattern')
    return node.properties.flatMap((v) =>
      bindingNames(v.type === 'RestElement' ? v.argument : v.value),
    );
  return [];
}
function hoistedNames(body: t.Node): string[] {
  const names: string[] = [];
  function visit(node: t.Node) {
    if (t.isFunction(node)) return;
    if (node.type === 'VariableDeclaration' && node.kind === 'var')
      for (const declaration of node.declarations) names.push(...bindingNames(declaration.id));
    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child === 'object' && 'type' in child) visit(child as t.Node);
      } else if (value && typeof value === 'object' && 'type' in value) visit(value as t.Node);
    }
  }
  visit(body);
  return names;
}
export function analyzeSource(
  file: string,
  source: string,
  covered: ReadonlyMap<string, string> = new Map(),
): SourceAnalysis {
  const ast = parse(source, {
    sourceType: 'unambiguous',
    plugins: ['jsx', 'typescript'],
    errorRecovery: false,
  });
  const bindings: Bindings = new Map();
  const imports = new Map<string, { name: string; from: string }>(),
    helpers = discoverHelpers(ast, file, covered),
    importBindings: ImportBinding[] = [];
  for (const item of ast.program.body) {
    if (item.type === 'ImportDeclaration')
      for (const s of item.specifiers) {
        const name =
          s.type === 'ImportSpecifier'
            ? s.imported.type === 'Identifier'
              ? s.imported.name
              : s.imported.value
            : s.type === 'ImportDefaultSpecifier'
              ? 'default'
              : '*';
        imports.set(s.local.name, { name, from: item.source.value });
        importBindings.push({
          file,
          name,
          from: item.source.value,
          local: s.local.name,
          line: s.loc?.start.line ?? 1,
          column: (s.loc?.start.column ?? 0) + 1,
          span: sourceSpan(s),
        });
      }
    if (item.type === 'ImportDeclaration' && !item.specifiers.length)
      importBindings.push({
        file,
        name: '*side-effect*',
        from: item.source.value,
        local: '',
        line: item.loc?.start.line ?? 1,
        column: (item.loc?.start.column ?? 0) + 1,
        span: sourceSpan(item),
      });
    const declaration = item.type === 'ExportNamedDeclaration' ? item.declaration : item;
    if (declaration?.type === 'VariableDeclaration' && declaration.kind === 'const')
      for (const d of declaration.declarations)
        if (d.id.type === 'Identifier' && d.init) bindings.set(d.id.name, d.init);
  }
  const result: SourceAnalysis = {
    elements: [],
    declarations: [],
    unknownImports: [],
    imports: [],
    importBindings,
  };
  function visit(node: t.Node, locals: Set<string>, environment: Bindings) {
    const local = new Set(locals),
      visible = new Map(environment);
    // Lexical declarations shadow outer bindings throughout their block, including helper imports.
    if (node.type === 'BlockStatement')
      for (const statement of node.body) {
        if (statement.type === 'VariableDeclaration')
          for (const d of statement.declarations) {
            for (const name of bindingNames(d.id)) {
              local.add(name);
              visible.delete(name);
            }
            if (d.id.type === 'Identifier') {
              if (statement.kind === 'const' && d.init) visible.set(d.id.name, d.init);
            }
          }
        if (
          (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') &&
          statement.id
        ) {
          local.add(statement.id.name);
          visible.delete(statement.id.name);
        }
      }
    if (t.isFunction(node)) {
      const names = [
        ...node.params.flatMap(bindingNames),
        ...hoistedNames(node.body),
        ...('id' in node && node.id ? [node.id.name] : []),
      ];
      for (const name of names) {
        local.add(name);
        visible.delete(name);
      }
    }
    if ((node.type === 'ClassDeclaration' || node.type === 'ClassExpression') && node.id) {
      local.add(node.id.name);
      visible.delete(node.id.name);
    }
    if (node.type === 'CatchClause' && node.param)
      for (const name of bindingNames(node.param)) {
        local.add(name);
        visible.delete(name);
      }
    if (
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement'
    ) {
      const declaration = node.type === 'ForStatement' ? node.init : node.left;
      if (declaration?.type === 'VariableDeclaration')
        for (const d of declaration.declarations)
          for (const name of bindingNames(d.id)) {
            local.add(name);
            visible.delete(name);
          }
    }
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportAllDeclaration' ||
        node.type === 'ExportNamedDeclaration') &&
      node.source
    )
      result.imports.push(node.source.value);
    if (
      node.type === 'CallExpression' &&
      (node.callee.type === 'Import' ||
        (node.callee.type === 'Identifier' && node.callee.name === 'require'))
    ) {
      const arg = node.arguments[0];
      if (arg?.type === 'StringLiteral') result.imports.push(arg.value);
      else
        result.unknownImports.push(
          `Dynamic module loading at ${node.loc?.start.line ?? 1} is not statically supported.`,
        );
    }
    if (
      node.type === 'CallExpression' &&
      ((node.callee.type === 'Identifier' && node.callee.name === 'createElement') ||
        (node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'createElement'))
    )
      result.unknownImports.push(
        `Imperative createElement at ${node.loc?.start.line ?? 1} is outside supported JSX analysis.`,
      );
    if (node.type === 'JSXOpeningElement') {
      const n = node.name;
      const name =
        n.type === 'JSXIdentifier'
          ? n.name
          : n.type === 'JSXMemberExpression'
            ? `${n.object.type === 'JSXIdentifier' ? n.object.name : '?'}.${n.property.name}`
            : '?';
      let identity = local.has(name) ? undefined : imports.get(name);
      if (
        n.type === 'JSXMemberExpression' &&
        n.object.type === 'JSXIdentifier' &&
        !local.has(n.object.name)
      ) {
        const namespace = imports.get(n.object.name);
        if (namespace?.name === '*') identity = { name: n.property.name, from: namespace.from };
      }
      const el: ElementEvidence = {
        name,
        identity,
        identityBlocked:
          local.has(name) ||
          (n.type === 'JSXMemberExpression' &&
            n.object.type === 'JSXIdentifier' &&
            local.has(n.object.name)),
        props: {},
        classes: [[]],
        classesUnknown: false,
        unknown: false,
        unknownProps: [],
        unknownCategories: [],
        file,
        line: node.loc?.start.line ?? 1,
        column: (node.loc?.start.column ?? 0) + 1,
        span: sourceSpan(node),
      };
      for (const attr of node.attributes) {
        if (attr.type === 'JSXSpreadAttribute') {
          el.classesUnknown = true;
          el.unknown = true;
          el.unknownProps.push('*');
          el.unknownCategories = ['colors', 'typography', 'spacing', 'shape', 'components'];
          continue;
        }
        const key = attr.name.type === 'JSXIdentifier' ? attr.name.name : '';
        const value =
          attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value;
        if (key === 'dangerouslySetInnerHTML') {
          el.unknown = true;
          el.unknownCategories.push('colors', 'typography', 'spacing', 'shape', 'components');
        }
        if (key === 'className') {
          const cv = classValue(
            value,
            visible,
            new Map([...helpers].filter(([name]) => !local.has(name))),
          );
          el.classes = cv.branches;
          if (cv.unknown) {
            el.classesUnknown = true;
            el.unknown = true;
            el.unknownCategories.push('colors', 'typography', 'spacing', 'shape');
          }
        } else if (key === 'style') {
          if (value?.type === 'ObjectExpression')
            for (const p of value.properties) {
              if (p.type !== 'ObjectProperty' || p.computed) {
                el.unknown = true;
                el.unknownCategories.push('colors', 'typography', 'spacing', 'shape');
                continue;
              }
              const prop =
                p.key.type === 'Identifier'
                  ? p.key.name
                  : p.key.type === 'StringLiteral'
                    ? p.key.value
                    : '?';
              const val =
                p.value.type === 'StringLiteral'
                  ? p.value.value
                  : p.value.type === 'NumericLiteral'
                    ? String(p.value.value)
                    : '';
              result.declarations.push({
                property: prop,
                value: val,
                file,
                line: p.loc?.start.line ?? el.line,
                column: (p.loc?.start.column ?? 0) + 1,
                unknown: val === '',
                span: sourceSpan(p),
              });
            }
          else {
            el.unknown = true;
            el.unknownCategories.push('colors', 'typography', 'spacing', 'shape');
          }
        } else if (!value) el.props[key] = true;
        else if (value.type === 'StringLiteral' || value.type === 'BooleanLiteral')
          el.props[key] = value.value;
        else {
          el.unknownProps.push(key);
        }
      }
      el.unknownCategories = [...new Set(el.unknownCategories)];
      result.elements.push(el);
    }
    // Unhandled CSS-in-JS is explicit coverage evidence, never executed.
    if (node.type === 'TaggedTemplateExpression')
      result.unknownImports.push(
        `Tagged template at ${node.loc?.start.line ?? 1} is not statically supported.`,
      );
    for (const key of t.VISITOR_KEYS[node.type] ?? []) {
      const child = (node as unknown as Record<string, unknown>)[key];
      if (Array.isArray(child)) {
        for (const c of child)
          if (c && typeof c === 'object' && 'type' in c) visit(c as t.Node, local, visible);
      } else if (child && typeof child === 'object' && 'type' in child)
        visit(child as t.Node, local, visible);
    }
  }
  visit(ast, new Set(), bindings);
  return result;
}
