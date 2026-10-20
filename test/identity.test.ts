import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIdentityResolver } from '../src/identity.js';

function resolver(files: Record<string, string>) {
  return createIdentityResolver(new Map(Object.entries(files)));
}

test('direct components and explicit barrel reexports share canonical identities', () => {
  const resolve = resolver({
    'src/Button.tsx': 'export function Button(){return <button/>}',
    'src/ui/index.ts': "export {Button} from '../Button';",
  });
  assert.ok(resolve('src/Page.tsx', './Button', 'Button'));
  assert.equal(
    resolve('src/Page.tsx', './Button', 'Button'),
    resolve('src/Page.tsx', './ui', 'Button'),
  );
});

test('export aliases, imported aliases, and const aliases resolve to the original declaration', () => {
  const resolve = resolver({
    'src/Button.tsx': 'export const Button=()=> <button/>;',
    'src/ui.ts':
      "import {Button as Internal} from './Button';const Alias=Internal;export {Alias as Action};",
    'src/barrel.ts': "export {Action as Primary} from './ui';",
  });
  assert.equal(
    resolve('src/Page.tsx', './Button', 'Button'),
    resolve('src/Page.tsx', './barrel', 'Primary'),
  );
});

test('default named declarations unify with their explicit named exports and default aliases', () => {
  const resolve = resolver({
    'src/Button.tsx': 'export default function Button(){return <button/>}export {Button};',
    'src/ui.ts': "export {default as Action} from './Button';",
  });
  const expected = resolve('src/Page.tsx', './Button', 'default');
  assert.ok(expected);
  assert.equal(expected, resolve('src/Page.tsx', './Button', 'Button'));
  assert.equal(expected, resolve('src/Page.tsx', './ui', 'Action'));
});

test('anonymous default functions and classes have distinct stable module identities', () => {
  const resolve = resolver({
    'src/Arrow.tsx': 'export default ()=> <button/>;',
    'src/Class.tsx': 'export default class {render(){return <button/>}}',
    'src/ui.ts': "export {default as Arrow} from './Arrow';",
  });
  const arrow = resolve('src/Page.tsx', './Arrow', 'default');
  assert.ok(arrow);
  assert.equal(arrow, resolve('src/Page.tsx', './ui', 'Arrow'));
  assert.notEqual(arrow, resolve('src/Page.tsx', './Class', 'default'));
});

test('namespace caller names and JSONC aliases resolve through covered barrels', () => {
  const resolve = resolver({
    'tsconfig.json': '{// aliases\n"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]},},}',
    'src/Button.tsx': 'export function Button(){return <button/>}',
    'src/ui.ts': "export {Button} from './Button';",
  });
  // import * as UI from '@/ui'; <UI.Button/> supplies raw export name Button.
  assert.equal(
    resolve('src/Page.tsx', '@/ui', 'Button'),
    resolve('src/Page.tsx', './Button', 'Button'),
  );
});

test('unambiguous star exports are resolved, identical paths agree, and explicit exports win', () => {
  const resolve = resolver({
    'src/Button.tsx': 'export function Button(){return <button/>}',
    'src/Other.tsx': 'export const Other=()=> <div/>;',
    'src/a.ts': "export * from './Button';",
    'src/b.ts': "export * from './Button';export * from './Other';",
    'src/ui.ts': "export * from './a';export * from './b';",
    'src/explicit.ts': "export {Button} from './Button';export * from './missing';",
  });
  const expected = resolve('src/Page.tsx', './Button', 'Button');
  assert.ok(expected);
  assert.equal(expected, resolve('src/Page.tsx', './ui', 'Button'));
  assert.equal(expected, resolve('src/Page.tsx', './explicit', 'Button'));
  assert.equal(resolve('src/Page.tsx', './ui', 'default'), undefined);
});

test('ambiguous stars and same-named components in unrelated modules remain distinct', () => {
  const resolve = resolver({
    'src/a.tsx': 'export function Button(){return <button/>}',
    'src/b.tsx': 'export function Button(){return <button/>}',
    'src/ui.ts': "export * from './a';export * from './b';",
  });
  assert.notEqual(
    resolve('src/Page.tsx', './a', 'Button'),
    resolve('src/Page.tsx', './b', 'Button'),
  );
  assert.equal(resolve('src/Page.tsx', './ui', 'Button'), undefined);
});

test('cycles, missing modules, missing exports, and uncovered paths return undefined', () => {
  const resolve = resolver({
    'src/a.ts': "export {Button} from './b';",
    'src/b.ts': "export {Button} from './a';",
    'src/star.ts': "export * from './star';",
    'src/empty.ts': 'export const unrelated=1;',
  });
  for (const path of ['./a', './b', './star', './missing', './empty'])
    assert.equal(resolve('src/Page.tsx', path, 'Button'), undefined);
  assert.equal(resolve('src/Page.tsx', '../../outside', 'Button'), undefined);
});

test('mutable, reassigned, dynamically computed declarations and direct eval are unresolved', () => {
  for (const source of [
    'export let Button=()=> <button/>;',
    'export function Button(){return <button/>}Button=other;',
    'export function Button(){return <button/>}[Button]=other;',
    'export const Button=makeComponent();',
    'export const Button=enabled?First:Second;',
    "export function Button(){return <button/>}eval('Button=other');",
  ])
    assert.equal(
      resolver({ 'src/Button.tsx': source })('src/Page.tsx', './Button', 'Button'),
      undefined,
    );
});

test('external identity is stable across explicit local reexports', () => {
  const resolve = resolver({ 'src/ui.ts': "export {Button as Action} from '@company/ui';" });
  assert.equal(resolve('src/Page.tsx', '@company/ui', 'Button'), '@company/ui#Button');
  assert.equal(resolve('src/Page.tsx', './ui', 'Action'), '@company/ui#Button');
});

test('type-only exports, unsupported namespace reexports, and external stars are not guessed', () => {
  const resolve = resolver({
    'src/type.ts': 'export type Button={value:string};',
    'src/ui.ts': "export * as UI from './Button';",
    'src/external.ts': "export * from '@company/ui';",
  });
  assert.equal(resolve('src/Page.tsx', './type', 'Button'), undefined);
  assert.equal(resolve('src/Page.tsx', './ui', 'UI'), undefined);
  assert.equal(resolve('src/Page.tsx', './external', 'Button'), undefined);
});

test('module side effects are parsed but never executed', () => {
  const resolve = resolver({
    'src/Button.tsx':
      "throw Error('PROJECT CODE MUST NOT EXECUTE');export function Button(){return <button/>}",
    'src/ui.ts': "export {Button} from './Button';",
  });
  assert.ok(resolve('src/Page.tsx', './ui', 'Button'));
});

test('resolution is bounded and malformed source cannot establish identity', () => {
  const files: Record<string, string> = {};
  for (let i = 0; i < 50; i++)
    files[`src/${i}.ts`] =
      i === 49 ? 'export function Button(){}' : `export {Button} from './${i + 1}';`;
  const resolve = resolver(files);
  assert.equal(resolve('src/Page.tsx', './0', 'Button'), undefined);
  assert.equal(
    resolver({ 'src/invalid.ts': 'export function {' })('src/Page.tsx', './invalid', 'Button'),
    undefined,
  );
});
