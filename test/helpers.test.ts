import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSource } from '../src/analysis.js';
import { mkdtemp, cp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { runProject, resultExit } from '../src/project.js';

function element(source: string, covered = new Map<string, string>()) {
  const result = analyzeSource('src/Page.tsx', source, covered);
  assert.equal(result.elements.length, 1);
  return result.elements[0];
}

test('clsx import aliases, finite branches, nested literals, and static falsy maps are decoded', () => {
  const el = element(
    `import {clsx as cx} from 'clsx'; export function Page({ok}) { return <div className={cx('p-4', ['bg-brand', null], {'text-paper':ok,'bg-wrong':false}, ok&&'rounded-control')}/> }`,
  );
  assert.equal(el.unknown, false);
  assert.ok(el.classes.every((branch) => branch.includes('p-4') && branch.includes('bg-brand')));
  assert.ok(el.classes.some((branch) => branch.includes('text-paper')));
  assert.equal(
    el.classes.some((branch) => branch.includes('bg-wrong')),
    false,
  );
});

test('logical OR and nullish coalescing cannot discard forbidden left results', () => {
  for (const operator of ['||', '??']) {
    const el = element(
      `import clsx from 'clsx';export const Page=()=> <div className={clsx('bg-wrong' ${operator} 'bg-brand')}/>;`,
    );
    assert.equal(el.unknown, false);
    assert.deepEqual(el.classes, [['bg-wrong']]);
  }
});

test('unknown class values and mutated referenced aggregates remain coverage failures', () => {
  for (const source of [
    `import clsx from 'clsx'; export const Page=({value})=> <div className={clsx(value)}/>;`,
    `import clsx from 'clsx';const styles=['bg-brand'];styles.push('bg-wrong');export const Page=()=> <div className={clsx(styles)}/>;`,
    `import clsx from 'clsx';const styles={'bg-brand':true};styles['bg-wrong']=true;export const Page=()=> <div className={clsx(styles)}/>;`,
  ])
    assert.equal(element(source).unknown, true);
});

test('helper identities respect block, rest, default, nested destructuring, and hoisted var shadowing', () => {
  const sources = [
    `import clsx from 'clsx';export function Page(){const clsx=()=> 'bg-wrong';return <div className={clsx('bg-brand')}/>;}`,
    `import clsx from 'clsx';export function Page(...clsx){return <div className={clsx('bg-brand')}/>;}`,
    `import clsx from 'clsx';export function Page(clsx=evil){return <div className={clsx('bg-brand')}/>;}`,
    `import clsx from 'clsx';export function Page({nested:{clsx}}){return <div className={clsx('bg-brand')}/>;}`,
    `import clsx from 'clsx';export function Page(){if(ok){var clsx=evil;}return <div className={clsx('bg-brand')}/>;}`,
  ];
  for (const source of sources) assert.equal(element(source).unknown, true);
});

test('literal local shadowing uses its own value rather than an outer approved binding', () => {
  const el = element(
    `const tone='bg-brand';export function Page(){const tone='bg-wrong';return <div className={tone}/>;}`,
  );
  assert.deepEqual(el.classes, [['bg-wrong']]);
});

test('only verified helper exports are trusted, not function names', () => {
  assert.equal(
    element(
      `import {other as clsx} from 'clsx';export const Page=()=> <div className={clsx('bg-brand')}/>;`,
    ).unknown,
    true,
  );
  assert.equal(
    element(`const cn=()=> 'bg-wrong';export const Page=()=> <div className={cn('bg-brand')}/>;`)
      .unknown,
    true,
  );
});

test('tailwind-merge produces actual conflict results for static branches', () => {
  const el = element(
    `import {twMerge as merge} from 'tailwind-merge';export const Page=()=> <div className={merge('p-2 bg-wrong','p-4 bg-brand')}/>;`,
  );
  assert.equal(el.unknown, false);
  assert.deepEqual(el.classes, [['p-4', 'bg-brand']]);
});

test('tailwind-merge preserves branch alternatives and does not pretend object maps are clsx inputs', () => {
  const el = element(
    `import {twMerge} from 'tailwind-merge';export const Page=({ok})=> <div className={twMerge('p-2',ok?'p-4':'p-6')}/>;`,
  );
  assert.equal(el.unknown, false);
  assert.deepEqual(el.classes, [['p-4'], ['p-6']]);
  assert.equal(
    element(
      `import {twMerge} from 'tailwind-merge';export const Page=()=> <div className={twMerge({'bg-brand':true})}/>;`,
    ).unknown,
    true,
  );
});

test('cva evaluates literal variants, defaults, compound variants, and extra classes', () => {
  const el = element(`import {cva} from 'class-variance-authority';
    export const variants=cva('rounded-control',{variants:{tone:{primary:'bg-brand',quiet:'bg-muted'},size:{sm:'p-2',lg:'p-6'}},defaultVariants:{tone:'primary',size:'sm'},compoundVariants:[{tone:'quiet',size:['sm','lg'],className:'text-paper'}]});
    export const Page=()=> <div className={variants({tone:'quiet',class:'font-medium'})}/>;`);
  assert.equal(el.unknown, false);
  assert.deepEqual(el.classes, [
    ['rounded-control', 'bg-muted', 'p-2', 'text-paper', 'font-medium'],
  ]);
});

test('cva no-argument invocation uses defaults and supports immediate invocation', () => {
  const el = element(
    `import {cva} from 'class-variance-authority';export const Page=()=> <div className={cva('p-4',{variants:{tone:{primary:'bg-brand'}},defaultVariants:{tone:'primary'}})()}/>;`,
  );
  assert.equal(el.unknown, false);
  assert.deepEqual(el.classes, [['p-4', 'bg-brand']]);
});

test('cva dynamic selection, computed config, mutable config, and shadowed factory stay unresolved', () => {
  for (const source of [
    `import {cva} from 'class-variance-authority';const styles=cva('p-4',{variants:{tone:{primary:'bg-brand'}}});export const Page=({tone})=> <div className={styles({tone})}/>;`,
    `import {cva} from 'class-variance-authority';const config={variants:{tone:{primary:'bg-brand'}}};const styles=cva('p-4',config);export const Page=()=> <div className={styles()}/>;`,
    `import {cva} from 'class-variance-authority';const styles=cva('p-4',{variants:{[key]:{primary:'bg-brand'}}});export const Page=()=> <div className={styles()}/>;`,
    `import {cva} from 'class-variance-authority';export function Page({cva}){const styles=cva('p-4');return <div className={styles()}/>;}`,
  ])
    assert.equal(element(source).unknown, true);
});

const wrapper = `import {clsx,type ClassValue} from 'clsx';import {twMerge} from 'tailwind-merge';export function cn(...inputs:ClassValue[]){return twMerge(clsx(inputs));}`;
test('canonical local cn wrappers resolve from covered sources without executing project code', () => {
  const covered = new Map([
    ['src/utils.ts', `throw Error('PROJECT CODE MUST NOT RUN');${wrapper}`],
  ]);
  const el = element(
    `import {cn as classes} from './utils';export const Page=()=> <div className={classes('p-2',{'bg-brand':true},'p-4')}/>;`,
    covered,
  );
  assert.equal(el.unknown, false);
  assert.deepEqual(el.classes, [['bg-brand', 'p-4']]);
});

test('canonical same-file and exported arrow cn wrappers are supported', () => {
  const local = element(`${wrapper}export const Page=()=> <div className={cn('p-2','p-4')}/>;`);
  assert.equal(local.unknown, false);
  assert.deepEqual(local.classes, [['p-4']]);
  const covered = new Map([
    [
      'src/utils.ts',
      `import cx from 'clsx';import {twMerge as merge} from 'tailwind-merge';export const cn=(...values)=>merge(cx(...values));`,
    ],
  ]);
  assert.equal(
    element(
      `import {cn} from './utils';export const Page=()=> <div className={cn('p-4')}/>;`,
      covered,
    ).unknown,
    false,
  );
});

test('noncanonical, uncovered, aliased, mutated, or shadowed cn wrappers are not guessed', () => {
  const page = `import {cn} from './utils';export const Page=()=> <div className={cn('bg-brand')}/>;`;
  assert.equal(element(page).unknown, true);
  assert.equal(
    element(page, new Map([['src/utils.ts', `export function cn(...inputs){return 'bg-wrong';}`]]))
      .unknown,
    true,
  );
  assert.equal(element(page, new Map([['src/utils.ts', `${wrapper}cn=evil;`]])).unknown, true);
  assert.equal(
    element(
      `import cn from './utils';export const Page=()=> <div className={cn('bg-brand')}/>;`,
      new Map([
        [
          'src/utils.ts',
          `import clsx from 'clsx';import {twMerge} from 'tailwind-merge';export default function cn(...inputs){return twMerge(clsx(inputs));}cn=evil;`,
        ],
      ]),
    ).unknown,
    true,
  );
  const covered = new Map([['src/utils.ts', wrapper]]);
  assert.equal(
    element(
      `import {cn} from '@/utils';export const Page=()=> <div className={cn('bg-brand')}/>;`,
      covered,
    ).unknown,
    true,
  );
  assert.equal(
    element(
      `import {cn} from './utils';export function Page({cn}){return <div className={cn('bg-brand')}/>;}`,
      covered,
    ).unknown,
    true,
  );
});

test('direct class objects and arrays do not borrow clsx semantics', () => {
  assert.equal(
    element(`export const Page=()=> <div className={{'bg-brand':true}}/>;`).unknown,
    true,
  );
  assert.equal(
    element(`export const Page=()=> <div className={['bg-brand','p-4']}/>;`).unknown,
    true,
  );
});

test('source analysis exposes actual import identities for import restrictions', () => {
  const a = analyzeSource(
    'src/Page.tsx',
    `import Default,{Button as Action} from './ui';export const Page=()=> <Action/>;`,
  );
  assert.deepEqual(
    a.importBindings.map(({ name, from, local }) => ({ name, from, local })),
    [
      { name: 'default', from: './ui', local: 'Default' },
      { name: 'Button', from: './ui', local: 'Action' },
    ],
  );
});

test('full project checks compose covered cn wrappers with CVA and flag forbidden or dynamic selections', async () => {
  const root = await mkdtemp(join(tmpdir(), 'usual-helper-proof-'));
  try {
    await cp(resolve('fixtures/ember'), root, { recursive: true });
    await writeFile(join(root, 'src/utils.jsx'), wrapper);
    const source = (selection: string) =>
      `import {cn} from './utils';import {cva} from 'class-variance-authority';const variants=cva('rounded-lg',{variants:{tone:{quiet:'bg-ocean',loud:'bg-forbidden'}},defaultVariants:{tone:'quiet'}});export function Page({tone}){return <div className={cn(variants(${selection}),'p-2','p-6')}/>;}`;
    await writeFile(join(root, 'src/Page.jsx'), source(`{tone:'quiet'}`));
    let result = await runProject(root, 'check');
    assert.equal(resultExit(result), 0);
    assert.deepEqual(result.findings, []);
    await writeFile(join(root, 'src/Page.jsx'), source(`{tone:'loud'}`));
    result = await runProject(root, 'check');
    assert.equal(resultExit(result), 1);
    assert.ok(result.findings.some((f) => f.actual === 'bg-forbidden'));
    await writeFile(join(root, 'src/Page.jsx'), source(`{tone}`));
    result = await runProject(root, 'check');
    assert.equal(resultExit(result), 1);
    assert.ok(result.findings.some((f) => f.kind === 'coverage'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
