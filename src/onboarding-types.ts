import type { Category, Manifest } from './types.js';

/** Roles organize human decisions; rules are the actual enforceable contract. */
export const previewSlots = {
  colors: ['primary', 'onPrimary', 'surface', 'onSurface', 'muted', 'border', 'focus'],
  typography: ['bodySize', 'headingSize', 'lineHeight', 'fontFamily'],
  spacing: ['gap', 'padding'],
  shape: ['controlRadius', 'cardRadius'],
  components: [],
} as const;
export type PreviewSlot = (typeof previewSlots)[Category][number];
export type PreviewValues = Partial<Record<PreviewSlot, string>>;
export type RuleFragment = Pick<Manifest, 'allowed' | 'semantics' | 'components' | 'imports'>;
export interface OnboardingOption {
  id: string;
  label: string;
  explanation: string;
  evidence: { file: string; line: number }[];
  rules: RuleFragment;
  preview?: { light?: PreviewValues; dark?: PreviewValues };
}
export interface OnboardingProposal {
  version: 1;
  title: string;
  summary: string;
  scope: Pick<Manifest, 'include' | 'ignore' | 'tokens'>;
  notes?: string[];
  decisions: {
    id: string;
    category: Category;
    role: string;
    title: string;
    description: string;
    recommended: string;
    options: OnboardingOption[];
  }[];
}
export interface OnboardingChoices {
  selections: Record<string, string>;
  deferred: Category[];
}
export interface OnboardingSession {
  version: 1;
  configPath: string;
  proposal: OnboardingProposal;
  choices: OnboardingChoices;
  step: number;
  sourceSnapshot: string;
  manifestHash: string | null;
  completedManifestHash?: string;
}
export interface OnboardingState {
  session: OnboardingSession;
  sessionHash: string;
  saved: boolean;
  stale?: string;
}

export function recommendedChoices(proposal: OnboardingProposal): OnboardingChoices {
  return {
    selections: Object.fromEntries(proposal.decisions.map((d) => [d.id, d.recommended])),
    deferred: [],
  };
}

/** Shared compiler. The server additionally validates proposal and resulting policy. */
export function compileChoices(proposal: OnboardingProposal, choices: OnboardingChoices): Manifest {
  const manifest: Manifest = { version: 1, include: proposal.scope.include, active: [] };
  for (const key of ['ignore', 'tokens'] as const)
    if (proposal.scope[key]?.length) manifest[key] = proposal.scope[key];
  for (const decision of proposal.decisions) {
    if (choices.deferred.includes(decision.category)) continue;
    const option = decision.options.find((o) => o.id === choices.selections[decision.id]);
    if (!option) throw new Error(`Choose an option for ${decision.title}.`);
    for (const [category, allowed] of Object.entries(option.rules.allowed ?? {})) {
      if (!Object.values(allowed).some((values) => values.length)) continue;
      const key = category as Exclude<Category, 'components'>;
      manifest.allowed ??= {};
      const target = (manifest.allowed[key] ??= {});
      for (const field of ['classes', 'variables', 'values'] as const) {
        if (allowed[field]?.length)
          target[field] = [...new Set([...(target[field] ?? []), ...allowed[field]])].sort();
      }
    }
    for (const key of ['semantics', 'components', 'imports'] as const) {
      const rules = option.rules[key];
      if (rules?.length) {
        // Each list has its own schema; assignment preserves the matching key.
        Object.assign(manifest, { [key]: [...(manifest[key] ?? []), ...rules] });
      }
    }
  }
  return manifest;
}

export function chosenPreview(
  proposal: OnboardingProposal,
  choices: OnboardingChoices,
  theme: 'light' | 'dark',
): PreviewValues {
  const result: PreviewValues = {};
  for (const decision of proposal.decisions) {
    if (choices.deferred.includes(decision.category)) continue;
    const option = decision.options.find((o) => o.id === choices.selections[decision.id]);
    Object.assign(result, option?.preview?.[theme]);
  }
  return result;
}
