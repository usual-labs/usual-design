import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseProposal, parseChoices } from '../src/onboarding-proposal.js';
import {
  compileChoices,
  recommendedChoices,
  chosenPreview,
  type OnboardingProposal,
} from '../src/onboarding-types.js';
import {
  prepareOnboarding,
  onboardingState,
  updateOnboarding,
  finishOnboarding,
  onboardingPath,
} from '../src/onboarding.js';
import { startWizard } from '../src/server.js';
import { activate, verifyPlan } from '../src/records.js';
import { runProject } from '../src/project.js';
import { defaultManifest, loadManifest, saveManifest } from '../src/config.js';

async function example(): Promise<OnboardingProposal> {
  const reference = await readFile(
    new URL('../skills/usual-design-onboarding/references/proposal.md', import.meta.url),
    'utf8',
  );
  return parseProposal(JSON.parse(reference.match(/```json\n([\s\S]*?)\n```/)![1]));
}
async function project(t: { after: (fn: () => Promise<void>) => void }) {
  const root = await mkdtemp(join(tmpdir(), 'usual-guided-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'package.json'), '{"devDependencies":{"tailwindcss":"^4.1.0"}}');
  await writeFile(
    join(root, 'src/App.tsx'),
    'export const App = () => <a data-intent="primary" className="bg-red-600 text-white rounded-sm text-lg">Start</a>;\n',
  );
  const proposal = await example();
  const alternative = structuredClone(proposal.decisions[0].options[0]);
  alternative.id = 'red';
  alternative.label = 'Red action';
  alternative.rules.allowed!.colors!.classes = ['bg-red-600', 'text-white'];
  alternative.rules.semantics![0].requireClasses = ['bg-red-600', 'text-white'];
  alternative.preview = { light: { primary: '#dc2626', onPrimary: '#ffffff' } };
  proposal.decisions[0].options.push(alternative);
  await writeFile(join(root, 'proposal.json'), JSON.stringify(proposal));
  return { root, proposal };
}

test('documented proposal compiles minimal policy, alternatives, semantics and whole-category deferral', async () => {
  const proposal = await example();
  const choices = recommendedChoices(proposal);
  const manifest = compileChoices(proposal, choices);
  assert.deepEqual(Object.keys(manifest), ['version', 'include', 'active', 'allowed', 'semantics']);
  assert.deepEqual(manifest.active, []);
  assert.equal(manifest.semantics![0].id, 'primary-action');
  choices.deferred = ['colors'];
  const deferred = compileChoices(proposal, parseChoices(proposal, choices));
  assert.equal(deferred.allowed!.colors, undefined);
  assert.equal(deferred.semantics, undefined);
  assert.deepEqual(chosenPreview(proposal, choices, 'light'), {
    cardRadius: '12px',
    controlRadius: '6px',
  });
  assert.throws(() =>
    parseChoices(proposal, { selections: { action: 'nonexistent' }, deferred: [] }),
  );
});

test('proposal rejects hidden policy changes, ambiguous choices, and invalid rule combinations', async () => {
  const p = await example();
  assert.throws(() => parseProposal({ ...p, active: ['colors'] }), /Invalid onboarding/);
  assert.throws(
    () => parseProposal({ ...p, scope: { include: ['../outside.tsx'] } }),
    /inside the project/i,
  );
  const duplicate = structuredClone(p);
  duplicate.decisions.push(duplicate.decisions[0]);
  assert.throws(() => parseProposal(duplicate), /Duplicate/);
  const wrong = structuredClone(p);
  wrong.decisions[0].options[0].rules.components = [
    { id: 'button', element: 'button', replacement: { name: 'Button', from: './ui' } },
  ];
  assert.throws(() => parseProposal(wrong), /components step/);
  const invalid = structuredClone(p);
  invalid.decisions[1].options[0].rules.semantics = [
    invalid.decisions[0].options[0].rules.semantics![0],
  ];
  assert.throws(() => parseChoices(invalid, recommendedChoices(invalid)), /unique/);
});

test('component choices compile import identities and prop constraints; deferral removes all of them', async () => {
  const p = await example();
  p.decisions.push({
    id: 'button',
    category: 'components',
    role: 'button',
    title: 'Shared button',
    description: 'Use the established component',
    recommended: 'shared',
    options: [
      {
        id: 'shared',
        label: 'Shared Button',
        explanation: 'Preserve variants',
        evidence: [{ file: 'src/App.tsx', line: 1 }],
        rules: {
          components: [
            {
              id: 'shared-button',
              element: 'button',
              replacement: { name: 'Button', from: './ui/Button' },
              ignore: ['src/ui/Button.tsx'],
            },
          ],
          imports: [{ id: 'legacy-button', from: 'old-ui', names: ['Button'] }],
          semantics: [
            {
              id: 'button-type',
              target: { component: { name: 'Button', from: './ui/Button' } },
              requireProps: { type: 'button' },
            },
          ],
        },
      },
    ],
  });
  const proposal = parseProposal(p);
  const choices = parseChoices(proposal, recommendedChoices(proposal));
  const manifest = compileChoices(proposal, choices);
  assert.equal(manifest.components![0].replacement.from, './ui/Button');
  assert.equal(manifest.imports![0].from, 'old-ui');
  assert.equal(manifest.semantics!.at(-1)!.requireProps!.type, 'button');
  choices.deferred = ['components'];
  const deferred = compileChoices(proposal, choices);
  assert.equal(deferred.components, undefined);
  assert.equal(deferred.imports, undefined);
  assert.deepEqual(
    deferred.semantics!.map((r) => r.id),
    ['primary-action'],
  );
});

test('preparation validates evidence and is read-only by default; repeated preparation resumes choices', async (t) => {
  const { root } = await project(t);
  const preview = await prepareOnboarding(root, 'proposal.json', 'usual.design.json', false);
  assert.equal(preview.written, false);
  await assert.rejects(readFile(join(root, onboardingPath)), { code: 'ENOENT' });
  await assert.rejects(readFile(join(root, 'usual.design.json')), { code: 'ENOENT' });
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  const state = (await onboardingState(root, 'usual.design.json'))!;
  const choices = structuredClone(state.session.choices);
  choices.selections.action = 'red';
  choices.deferred = ['shape'];
  const updated = await updateOnboarding(root, 'usual.design.json', {
    expectedHash: state.sessionHash,
    choices,
    step: 3,
  });
  await assert.rejects(
    updateOnboarding(root, 'usual.design.json', {
      expectedHash: state.sessionHash,
      choices,
      step: 4,
    }),
    /another session/,
  );
  const again = await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  assert.equal(again.resumed, true);
  assert.equal(again.session.step, 3);
  assert.deepEqual(again.session.choices, updated!.session.choices);
});

test('source drift blocks approval and refreshed preparation preserves old choices in history', async (t) => {
  const { root } = await project(t);
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  const before = (await onboardingState(root, 'usual.design.json'))!;
  const review = (await updateOnboarding(root, 'usual.design.json', {
    expectedHash: before.sessionHash,
    choices: before.session.choices,
    step: 6,
  }))!;
  await writeFile(join(root, 'src/new.tsx'), 'export const New = () => <div />;');
  await assert.rejects(
    finishOnboarding(root, 'usual.design.json', {
      expectedHash: review.sessionHash,
      approved: true,
    }),
    /sources changed/,
  );
  await assert.rejects(readFile(join(root, 'usual.design.json')), { code: 'ENOENT' });
  const refreshed = await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  assert.equal(refreshed.resumed, false);
  assert.equal(refreshed.session.step, 0);
  const { readdir } = await import('node:fs/promises');
  const history = await readdir(join(root, 'docs/usual-design/onboarding/history'));
  const archived = JSON.parse(
    await readFile(join(root, 'docs/usual-design/onboarding/history', history[0]), 'utf8'),
  );
  assert.equal(archived.step, 6);
});

test('existing contracts and changes made during review remain protected', async (t) => {
  const { root } = await project(t);
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  const state = (await onboardingState(root, 'usual.design.json'))!;
  await saveManifest(root, defaultManifest(), null);
  await assert.rejects(
    updateOnboarding(root, 'usual.design.json', {
      expectedHash: state.sessionHash,
      choices: state.session.choices,
      step: 6,
    }),
    /policy changed/,
  );
  const other = await project(t);
  const m = defaultManifest();
  m.allowed!.colors!.classes = ['bg-red-600'];
  await saveManifest(other.root, m, null);
  await assert.rejects(
    prepareOnboarding(other.root, 'proposal.json', 'usual.design.json', true),
    /existing design contract/,
  );
});

test('evidence locations and semantic categories use actual discovered theme tokens', async (t) => {
  const { root, proposal } = await project(t);
  proposal.decisions[0].options[0].evidence[0].line = 900;
  await writeFile(join(root, 'proposal.json'), JSON.stringify(proposal));
  await assert.rejects(
    prepareOnboarding(root, 'proposal.json', 'usual.design.json', false),
    /Evidence/,
  );
  proposal.decisions[0].options[0].evidence[0].line = 1;
  proposal.decisions[0].options[0].rules.semantics![0].requireClasses = ['text-heading'];
  await writeFile(join(root, 'src/theme.css'), '@theme { --text-heading: 2rem; }');
  await writeFile(join(root, 'proposal.json'), JSON.stringify(proposal));
  await assert.rejects(
    prepareOnboarding(root, 'proposal.json', 'usual.design.json', false),
    /Semantic constraints/,
  );
  const decision = proposal.decisions[0];
  decision.category = 'typography';
  decision.options = [decision.options[0]];
  decision.options[0].rules.allowed = { typography: { classes: ['text-heading'] } };
  delete decision.options[0].preview;
  await writeFile(join(root, 'proposal.json'), JSON.stringify(proposal));
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', false);
});

test('guided API journey reaches saved minimal policy, selected repair prompt, and activation', async (t) => {
  const { root } = await project(t);
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  const wizard = await startWizard(root);
  t.after(() => new Promise<void>((resolve) => wizard.server.close(() => resolve())));
  async function api(path: string, body?: unknown, expected = 200) {
    const response = await fetch(`${wizard.origin}/api/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'X-Usual-Token': wizard.token, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    assert.equal(response.status, expected, JSON.stringify(data));
    return data;
  }
  const state = await api('state');
  assert.equal(state.manifest, null);
  assert.equal(state.onboarding.saved, false);
  const early = await api(
    'onboarding/finish',
    {
      expectedHash: state.onboarding.sessionHash,
      approved: true,
    },
    400,
  );
  assert.match(early.error, /Review all steps/);
  const review = await api('onboarding/choices', {
    expectedHash: state.onboarding.sessionHash,
    step: 6,
    choices: state.onboarding.session.choices,
  });
  const preview = await api('onboarding/preview', {
    expectedHash: review.sessionHash,
    choices: review.session.choices,
  });
  assert.ok(preview.audit.findings.some((f: { ruleId: string }) => f.ruleId === 'primary-action'));
  await assert.rejects(readFile(join(root, 'usual.design.json')));
  await api('onboarding/finish', { expectedHash: review.sessionHash, approved: false }, 400);
  await api('onboarding/finish', { expectedHash: review.sessionHash, approved: true });
  const saved = await api('state');
  assert.equal(saved.onboarding.saved, true);
  assert.deepEqual(saved.manifest.active, []);
  assert.equal(saved.manifest.inventory, undefined);
  assert.equal(saved.manifest.decisions, undefined);
  assert.equal(saved.manifest.allowed.typography, undefined);
  const audit = await api('audit', {});
  const selected = audit.findings.filter(
    (f: { kind: string; category: string }) =>
      f.kind === 'violation' && ['colors', 'shape'].includes(f.category),
  );
  assert.ok(selected.length > 0);
  const batch = await api('plan', {
    findingIds: selected.map((f: { id: string }) => f.id),
    expectedSnapshot: audit.snapshot,
  });
  assert.match(batch.prompt, /verify-plan/);
  await verifyPlan(root, batch.path);
  await writeFile(
    join(root, 'src/App.tsx'),
    'export const App = () => <a data-intent="primary" className="bg-blue-600 text-white rounded-xl text-lg">Start</a>;',
  );
  const repaired = await runProject(root, 'audit');
  await activate(root, ['colors', 'shape'], repaired.snapshot);
  const checked = await runProject(root, 'check');
  assert.deepEqual(checked.findings, []);
  assert.equal((await onboardingState(root, 'usual.design.json'))!.saved, true);
  const current = await loadManifest(root);
  await saveManifest(
    root,
    { ...current.manifest, ignore: ['src/generated/**'] },
    current.manifestHash,
  );
  assert.equal(
    (await onboardingState(root, 'usual.design.json'))!.saved,
    true,
    'An intentional later policy edit must not restart completed onboarding.',
  );
});

test('project showcase is proposal-only and CSP permits only its separate loopback origin', async (t) => {
  const { root, proposal } = await project(t);
  proposal.showcase = {
    url: 'http://127.0.0.1:5173/__usual/showcase',
    title: 'Project components',
    themes: ['light', 'dark'],
  };
  const parsed = parseProposal(proposal);
  assert.equal(parsed.showcase?.url, proposal.showcase.url);
  assert.equal('showcase' in compileChoices(parsed, recommendedChoices(parsed)), false);
  assert.throws(() =>
    parseProposal({ ...proposal, showcase: { ...proposal.showcase, themes: ['dark', 'dark'] } }),
  );
  assert.throws(
    () =>
      parseProposal({
        ...proposal,
        showcase: { ...proposal.showcase, url: 'https://remote.example/app' },
      }),
    /loopback/,
  );
  await writeFile(join(root, 'proposal.json'), JSON.stringify(proposal));
  await prepareOnboarding(root, 'proposal.json', 'usual.design.json', true);
  const wizard = await startWizard(root);
  t.after(() => new Promise<void>((resolve) => wizard.server.close(() => resolve())));
  const response = await fetch(wizard.origin + '/api/state', {
    headers: { 'x-usual-token': wizard.token },
  });
  assert.equal(response.status, 200);
  const csp = response.headers.get('content-security-policy')!;
  assert.match(csp, /frame-src http:\/\/127.0.0.1:5173;/);
  assert.match(csp, /font-src 'self';/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal((await fetch(wizard.origin + '/api/state')).status, 403);
});
