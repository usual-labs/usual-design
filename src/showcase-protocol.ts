import { categories } from './types.js';
import {
  chosenPreview,
  previewSlots,
  type OnboardingChoices,
  type OnboardingProposal,
  type PreviewValues,
} from './onboarding-types.js';

export type ShowcaseTheme = 'light' | 'dark';
export interface ShowcaseState {
  theme: ShowcaseTheme;
  selections: Record<string, string>;
  deferred: OnboardingChoices['deferred'];
  values: PreviewValues;
}
export interface ShowcaseUpdate {
  type: 'usual:showcase:update';
  channel: string;
  revision: number;
  state: ShowcaseState;
}

/** A separate, local dev server. No credentials, tokens, or remote pages. */
export function showcaseUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'Showcase URL must be an HTTP loopback URL with a port, without credentials, query, or fragment.',
    );
  return url;
}

export function showcaseState(
  proposal: OnboardingProposal,
  choices: OnboardingChoices,
  theme: ShowcaseTheme,
): ShowcaseState {
  return {
    theme,
    selections: Object.fromEntries(
      proposal.decisions
        .filter((d) => !choices.deferred.includes(d.category))
        .map((d) => [d.id, choices.selections[d.id]]),
    ),
    deferred: [...choices.deferred],
    values: chosenPreview(proposal, choices, theme),
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const id = /^[a-z][a-z0-9-]{0,63}$/;
export function isShowcaseUpdate(value: unknown, channel: string): value is ShowcaseUpdate {
  if (
    !isRecord(value) ||
    value.type !== 'usual:showcase:update' ||
    value.channel !== channel ||
    !Number.isSafeInteger(value.revision) ||
    Number(value.revision) < 1 ||
    !isRecord(value.state)
  )
    return false;
  const s = value.state;
  return (
    (s.theme === 'light' || s.theme === 'dark') &&
    isRecord(s.selections) &&
    Object.keys(s.selections).length <= 60 &&
    Object.entries(s.selections).every(
      ([key, v]) => id.test(key) && typeof v === 'string' && id.test(v),
    ) &&
    Array.isArray(s.deferred) &&
    s.deferred.length <= categories.length &&
    s.deferred.every((v) => categories.includes(v)) &&
    isRecord(s.values) &&
    Object.entries(s.values).every(
      ([key, v]) =>
        (Object.values(previewSlots).flat() as readonly string[]).includes(key) &&
        typeof v === 'string' &&
        v.length <= 160,
    )
  );
}
