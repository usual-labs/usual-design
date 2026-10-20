import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectShowcase } from '../src/showcase.js';
import { showcaseUrl, isShowcaseUpdate } from '../src/showcase-protocol.js';

const channel = 'f8322dc7-8b1c-4825-b422-764d71bc2d41';
const origin = 'http://127.0.0.1:4321';
const state = {
  theme: 'dark',
  selections: { action: 'blue' },
  deferred: [],
  values: { primary: '#123456' },
};
const update = (revision = 1) => ({ type: 'usual:showcase:update', channel, revision, state });
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test('showcase allows only bounded loopback development URLs and message data', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]'])
    assert.equal(showcaseUrl(`http://${host}:5173/showcase`).port, '5173');
  for (const url of [
    'https://example.com',
    'http://localhost',
    'file:///app',
    'javascript:alert(1)',
    'http://127.0.0.1:5173/?token=private',
    'http://127.0.0.1:5173/#secret',
    'http://user:pass@localhost:5173/',
    'http://localhost.evil.test:5173/',
    'http://0.0.0.0:5173/',
  ])
    assert.throws(() => showcaseUrl(url));
  assert.ok(isShowcaseUpdate(update(), channel));
  for (const invalid of [
    null,
    [],
    { ...update(), channel: 'wrong' },
    { ...update(), revision: NaN },
    { ...update(), state: { ...state, theme: 'system' } },
    { ...update(), state: { ...state, selections: { action: 'x'.repeat(65) } } },
    { ...update(), state: { ...state, values: { css: 'arbitrary styles' } } },
    { ...update(), state: { ...state, deferred: ['unknown'] } },
  ])
    assert.equal(isShowcaseUpdate(invalid, channel), false);
});

test('bridge authenticates parent/source/channel, serializes changes, reports errors, and cleans up', async (t) => {
  const receipts: { data: Record<string, unknown>; origin: string }[] = [];
  const parent = {
    postMessage: (data: Record<string, unknown>, origin: string) => receipts.push({ data, origin }),
  };
  const previewWindow = Object.assign(new EventTarget(), {
    parent,
    location: {
      hash: '#' + new URLSearchParams({ 'usual-parent': origin, 'usual-channel': channel }),
      origin: 'http://localhost:5173',
    },
  });
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: previewWindow });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  const emit = (data: unknown, source: unknown = parent, from = origin) =>
    previewWindow.dispatchEvent(
      Object.assign(new Event('message'), { data, source, origin: from }),
    );
  const applied: string[] = [];
  let unblock: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    unblock = resolve;
  });
  const cleanup = connectShowcase(async (s) => {
    applied.push(s.theme);
    if (s.theme === 'dark') await gate;
    if (s.selections.action === 'unsupported') throw new Error('No mapping');
  });
  assert.equal(receipts[0].data.type, 'usual:showcase:ready');
  emit(update(), {});
  emit(update(), parent, 'https://evil.invalid');
  emit({ ...update(), channel: 'wrong' });
  await flush();
  assert.deepEqual(applied, []);
  emit(update());
  await flush();
  emit({ ...update(2), state: { ...state, theme: 'light', selections: {} } });
  emit(update(1)); // out-of-order reply must not restore old choices
  await flush();
  assert.deepEqual(applied, ['dark']);
  unblock();
  await flush();
  assert.deepEqual(applied, ['dark', 'light']);
  assert.deepEqual(
    receipts.slice(1).map((r) => [r.data.type, r.data.revision]),
    [['usual:showcase:applied', 2]],
  );
  assert.ok(receipts.every((r) => r.origin === origin));
  emit({
    ...update(3),
    state: { ...state, theme: 'light', selections: { action: 'unsupported' } },
  });
  await flush();
  assert.equal(receipts.at(-1)!.data.type, 'usual:showcase:error');
  cleanup();
  emit(update(4));
  await flush();
  assert.equal(applied.length, 3);
});

test('bridge is safe to import and call during server rendering', () => {
  assert.doesNotThrow(() => connectShowcase(() => assert.fail('No browser'))());
});
