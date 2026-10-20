import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { loadManifest, parseManifest, saveManifest } from './config.js';
import { discover } from './discovery.js';
import { atomicWrite, hash, optionalRead, safePath } from './files.js';
import { analyzeProject } from './project.js';
import { parseChoices, parseProposal, validateProposalCategories } from './onboarding-proposal.js';
import {
  compileChoices,
  recommendedChoices,
  type OnboardingSession,
  type OnboardingState,
  type OnboardingProposal,
} from './onboarding-types.js';

export const onboardingPath = 'docs/usual-design/onboarding/session.json';
const serialize = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const policyText = (s: OnboardingSession) => serialize(compileChoices(s.proposal, s.choices));

async function currentPolicy(root: string, configPath: string) {
  return loadManifest(root, configPath).catch((e) => {
    if (e.code === 'ENOENT') return null;
    throw e;
  });
}

async function sourceSnapshot(root: string, proposal: OnboardingProposal) {
  const discovery = await discover(root, { version: 1, active: [], ...proposal.scope });
  validateProposalCategories(proposal, new Set(discovery.inventory.tokens.map((t) => t.name)));
  if (!discovery.inventory.files.length) throw new Error('No files match proposed coverage.');
  for (const decision of proposal.decisions)
    for (const option of decision.options)
      for (const evidence of option.evidence) {
        const source = discovery.sources.get(evidence.file);
        if (source === undefined || evidence.line > source.split(/\r\n|\r|\n/).length)
          throw new Error(
            `Evidence is outside analyzed sources or lines: ${evidence.file}:${evidence.line}`,
          );
      }
  return discovery.snapshot;
}

async function readSession(root: string, configPath: string) {
  const raw = await optionalRead(await safePath(root, onboardingPath));
  if (raw === null) return null;
  if (Buffer.byteLength(raw) > 1_000_000) throw new Error('Onboarding session exceeds 1MB.');
  const session = JSON.parse(raw) as OnboardingSession;
  if (
    !session ||
    session.version !== 1 ||
    session.configPath !== configPath ||
    typeof session.sourceSnapshot !== 'string' ||
    (session.manifestHash !== null && typeof session.manifestHash !== 'string') ||
    !Number.isInteger(session.step) ||
    session.step < 0 ||
    session.step > 6
  )
    throw new Error('Invalid onboarding session or different manifest path.');
  session.proposal = parseProposal(session.proposal);
  session.choices = parseChoices(session.proposal, session.choices);
  if (
    session.completedManifestHash !== undefined &&
    session.completedManifestHash !== hash(policyText(session))
  )
    throw new Error('Onboarding completion does not match the saved choices.');
  return { session, sessionHash: hash(raw) };
}

export async function onboardingState(
  root: string,
  configPath: string,
): Promise<OnboardingState | null> {
  const stored = await readSession(root, configPath);
  if (!stored) return null;
  const loaded = await currentPolicy(root, configPath);
  const saved =
    !!stored.session.completedManifestHash ||
    (loaded !== null &&
      serialize({ ...loaded.manifest, active: [] }) === policyText(stored.session));
  let stale: string | undefined;
  if (!saved) {
    try {
      await assertFresh(root, stored.session);
    } catch (error) {
      stale = (error as Error).message;
    }
  }
  return { ...stored, saved, ...(stale ? { stale } : {}) };
}

async function assertFresh(root: string, session: OnboardingSession) {
  const loaded = await currentPolicy(root, session.configPath);
  if ((loaded?.manifestHash ?? null) !== session.manifestHash)
    throw new Error('Saved policy changed. Review it in the policy workshop before onboarding.');
  if ((await sourceSnapshot(root, session.proposal)) !== session.sourceSnapshot)
    throw new Error(
      'Project sources changed. Ask your agent to refresh the proposal and run onboard --write again.',
    );
}

/** --write prepares evidence and resumable choices, never design policy. */
export async function prepareOnboarding(
  root: string,
  proposalPath: string,
  configPath: string,
  write: boolean,
) {
  const raw = await readFile(await safePath(root, proposalPath), 'utf8');
  if (Buffer.byteLength(raw) > 750_000) throw new Error('Onboarding proposal exceeds 750KB.');
  const proposal = parseProposal(JSON.parse(raw));
  const loaded = await currentPolicy(root, configPath);
  const previous = await readSession(root, configPath);
  if (
    loaded &&
    (loaded.manifest.active.length ||
      (!previous &&
        (Object.values(loaded.manifest.allowed ?? {}).some((a) =>
          Object.values(a).some((v) => v.length),
        ) ||
          loaded.manifest.semantics?.length ||
          loaded.manifest.components?.length ||
          loaded.manifest.imports?.length ||
          loaded.manifest.exceptions?.length ||
          loaded.manifest.preview)))
  )
    throw new Error(
      'An existing design contract needs an intentional policy review. Use the policy workshop; onboarding will not replace it.',
    );
  if (previous && (loaded?.manifestHash ?? null) !== previous.session.manifestHash)
    throw new Error(
      'Policy changed since onboarding. Use the policy workshop to review the existing contract.',
    );
  const session: OnboardingSession = {
    version: 1,
    configPath,
    proposal,
    choices: recommendedChoices(proposal),
    step: 0,
    sourceSnapshot: await sourceSnapshot(root, proposal),
    manifestHash: loaded?.manifestHash ?? null,
  };
  session.choices = parseChoices(proposal, session.choices);
  const identical =
    previous &&
    previous.session.sourceSnapshot === session.sourceSnapshot &&
    JSON.stringify(previous.session.proposal) === JSON.stringify(proposal);
  if (write && !identical) {
    if (previous)
      await atomicWrite(
        root,
        `docs/usual-design/onboarding/history/${randomUUID()}.json`,
        serialize(previous.session),
        null,
      );
    await assertFresh(root, session);
    await atomicWrite(root, onboardingPath, serialize(session), previous?.sessionHash ?? null);
  }
  return {
    written: write,
    path: onboardingPath,
    decisions: proposal.decisions.length,
    categories: [...new Set(proposal.decisions.map((d) => d.category))],
    resumed: !!identical,
    session: identical ? previous.session : session,
  };
}

async function editable(root: string, configPath: string, expected: unknown) {
  const stored = await readSession(root, configPath);
  if (!stored || stored.sessionHash !== expected)
    throw new Error('Onboarding changed in another session. Reload before continuing.');
  if (stored.session.completedManifestHash)
    throw new Error('Onboarding is complete. Use the policy workshop for further changes.');
  await assertFresh(root, stored.session);
  return stored;
}

export async function updateOnboarding(
  root: string,
  configPath: string,
  body: Record<string, unknown>,
) {
  const { session, sessionHash } = await editable(root, configPath, body.expectedHash);
  if (!Number.isInteger(body.step) || Number(body.step) < 0 || Number(body.step) > 6)
    throw new Error('Invalid onboarding step.');
  session.choices = parseChoices(session.proposal, body.choices);
  session.step = Number(body.step);
  await atomicWrite(root, onboardingPath, serialize(session), sessionHash);
  return onboardingState(root, configPath);
}

export async function previewOnboarding(
  root: string,
  configPath: string,
  body: Record<string, unknown>,
) {
  const { session } = await editable(root, configPath, body.expectedHash);
  const choices = parseChoices(session.proposal, body.choices);
  const manifest = parseManifest(compileChoices(session.proposal, choices));
  const audit = await analyzeProject(
    root,
    'audit',
    manifest,
    hash(serialize(manifest)),
    configPath,
  );
  return { manifest, audit };
}

export async function finishOnboarding(
  root: string,
  configPath: string,
  body: Record<string, unknown>,
) {
  const { session } = await editable(root, configPath, body.expectedHash);
  if (body.approved !== true || session.step !== 6)
    throw new Error('Review all steps and explicitly approve the manifest before saving.');
  const manifest = parseManifest(compileChoices(session.proposal, session.choices));
  const audit = await analyzeProject(
    root,
    'audit',
    manifest,
    hash(serialize(manifest)),
    configPath,
  );
  if (audit.errors.length) throw new Error(audit.errors.join('\n'));
  // Recheck evidence and session after analysis, immediately before the protected policy write.
  await editable(root, configPath, body.expectedHash);
  await saveManifest(
    root,
    manifest,
    session.manifestHash,
    configPath,
    `Guided onboarding choices approved; decisions and deferred categories recorded in ${onboardingPath}.`,
  );
  session.completedManifestHash = hash(serialize(manifest));
  await atomicWrite(root, onboardingPath, serialize(session), body.expectedHash as string);
  return { manifest, audit };
}
