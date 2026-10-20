import { readFile } from 'node:fs/promises';
import { Ajv } from 'ajv';
import { parseManifest } from './config.js';
import { classCategory } from './classes.js';
import { validateRelative } from './files.js';
import { categories } from './types.js';
import {
  compileChoices,
  previewSlots,
  type OnboardingChoices,
  type OnboardingProposal,
} from './onboarding-types.js';

const manifestSchema = JSON.parse(
  await readFile(new URL('../schema/manifest.schema.json', import.meta.url), 'utf8'),
);
const proposalSchema = JSON.parse(
  await readFile(new URL('../schema/onboarding.schema.json', import.meta.url), 'utf8'),
);
const validate = new Ajv({ allErrors: true, strict: false })
  .addSchema(manifestSchema, 'manifest')
  .compile(proposalSchema);

export function parseProposal(input: unknown): OnboardingProposal {
  if (!validate(input))
    throw new Error(
      `Invalid onboarding proposal: ${validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join('; ')}`,
    );
  const proposal = structuredClone(input as OnboardingProposal);
  parseManifest({ version: 1, active: [], ...proposal.scope });
  const ids = new Set<string>();
  const slots = new Set<string>();
  for (const decision of proposal.decisions) {
    if (ids.has(decision.id)) throw new Error(`Duplicate decision: ${decision.id}`);
    ids.add(decision.id);
    const optionIds = decision.options.map((o) => o.id);
    if (new Set(optionIds).size !== optionIds.length || !optionIds.includes(decision.recommended))
      throw new Error(`Invalid options or recommendation: ${decision.id}`);
    const decisionSlots = new Set<string>();
    for (const option of decision.options) {
      const rules = option.rules;
      parseManifest({ version: 1, ...proposal.scope, active: [], ...rules });
      if (Object.keys(rules.allowed ?? {}).some((c) => c !== decision.category))
        throw new Error(`Allowed values must belong to ${decision.category}: ${decision.id}`);
      if (decision.category !== 'components' && (rules.components?.length || rules.imports?.length))
        throw new Error(`Component rules belong in the components step: ${decision.id}`);
      const effective =
        Object.values(rules.allowed ?? {}).some((a) => Object.values(a).some((v) => v.length)) ||
        rules.semantics?.length ||
        rules.components?.length ||
        rules.imports?.length;
      if (!effective) throw new Error(`Option ${option.id} must propose enforceable rules.`);
      for (const e of option.evidence) validateRelative(e.file);
      for (const values of Object.values(option.preview ?? {}))
        for (const slot of Object.keys(values)) {
          if (!(previewSlots[decision.category] as readonly string[]).includes(slot))
            throw new Error(`Preview slot ${slot} does not belong to ${decision.category}.`);
          decisionSlots.add(slot);
        }
    }
    for (const slot of decisionSlots) {
      if (slots.has(slot)) throw new Error(`Preview slot ${slot} has multiple decision owners.`);
      slots.add(slot);
    }
  }
  return proposal;
}

export function validateProposalCategories(
  proposal: OnboardingProposal,
  tokens: ReadonlySet<string>,
) {
  for (const decision of proposal.decisions)
    for (const option of decision.options)
      for (const rule of option.rules.semantics ?? []) {
        const affected = [...(rule.requireClasses ?? []), ...(rule.forbidClasses ?? [])].map(
          (c) => classCategory(c, tokens) ?? 'components',
        );
        if (Object.keys(rule.requireProps ?? {}).length) affected.push('components');
        if (affected.some((c) => c !== decision.category))
          throw new Error(`Semantic constraints must belong to ${decision.category}: ${rule.id}`);
      }
}

export function parseChoices(proposal: OnboardingProposal, input: unknown): OnboardingChoices {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Expected onboarding choices.');
  const c = input as OnboardingChoices;
  if (
    Object.keys(c).some((k) => !['selections', 'deferred'].includes(k)) ||
    !c.selections ||
    typeof c.selections !== 'object' ||
    Array.isArray(c.selections) ||
    !Array.isArray(c.deferred) ||
    new Set(c.deferred).size !== c.deferred.length ||
    c.deferred.some((v) => !categories.includes(v)) ||
    Object.keys(c.selections).some((id) => !proposal.decisions.some((d) => d.id === id))
  )
    throw new Error('Invalid onboarding choices.');
  for (const d of proposal.decisions)
    if (!Object.hasOwn(c.selections, d.id) || !d.options.some((o) => o.id === c.selections[d.id]))
      throw new Error(`Choose an option for ${d.title}.`);
  parseManifest(compileChoices(proposal, c));
  return structuredClone(c);
}
