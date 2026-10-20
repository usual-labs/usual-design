import { categories, type Audit, type Category, type Finding, type ObservedValue } from './types';

export const labels: Record<Category, string> = {
  colors: 'Colors',
  typography: 'Typography',
  spacing: 'Spacing & layout',
  shape: 'Shape & effects',
  components: 'Components',
  coverage: 'Coverage & unresolved',
};

export function grouped(findings: Finding[]): Record<Category, Finding[]> {
  return Object.fromEntries(
    categories.map((category) => [category, findings.filter((item) => item.category === category)]),
  ) as Record<Category, Finding[]>;
}

export function toggleGroup(selected: Set<string>, findings: Finding[]): Set<string> {
  const next = new Set(selected);
  const allSelected = findings.length > 0 && findings.every((item) => next.has(item.id));
  for (const finding of findings) allSelected ? next.delete(finding.id) : next.add(finding.id);
  return next;
}

export function canActivate(category: Category, audit: Audit | null, hash: string | null): boolean {
  if (category === 'coverage') return false;
  if (
    !audit ||
    !hash ||
    audit.manifestHash !== hash ||
    audit.errors.length ||
    audit.active.includes(category)
  )
    return false;
  return !audit.findings.some(
    (item) =>
      item.category === category ||
      (item.kind === 'coverage' &&
        (!item.affectedCategories?.length || item.affectedCategories.includes(category))),
  );
}

export function describe(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2) ?? '';
}

export function addCandidateToDraft(draft: string, candidate: ObservedValue): string {
  const isObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);
  let manifest: unknown;
  try {
    manifest = JSON.parse(draft);
  } catch {
    throw new Error(
      'Fix the JSON in your policy draft before adding an observed value. Your draft has been kept.',
    );
  }
  if (!isObject(manifest))
    throw new Error('The policy draft must be a JSON object. Your draft has been kept.');
  if (manifest.allowed !== undefined && !isObject(manifest.allowed))
    throw new Error(
      'Fix the allowed section in your policy draft before adding a value. Your draft has been kept.',
    );
  const allowed = (manifest.allowed ?? {}) as Record<string, unknown>;
  const current = allowed[candidate.category];
  if (current !== undefined && !isObject(current))
    throw new Error(
      `Fix the ${candidate.category} policy in your draft before adding a value. Your draft has been kept.`,
    );
  const policy = (current ?? {}) as Record<string, unknown>;
  const field = candidate.kind === 'class' ? 'classes' : 'values';
  const value = candidate.kind === 'class' ? candidate.className : candidate.value;
  if (!value) throw new Error('This observed value has no complete policy value to add.');
  const existing = policy[field];
  if (
    existing !== undefined &&
    (!Array.isArray(existing) || !existing.every((item) => typeof item === 'string'))
  )
    throw new Error(
      `Fix the allowed ${field} in your draft before adding a value. Your draft has been kept.`,
    );
  return JSON.stringify(
    {
      ...manifest,
      allowed: {
        ...allowed,
        [candidate.category]: {
          ...policy,
          [field]: [...new Set([...((existing as string[] | undefined) ?? []), value])],
        },
      },
    },
    null,
    2,
  );
}

export function safePreviewUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  try {
    const url = new URL(input);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function safeColor(value: string): string | null {
  if (value.length > 160) return null;
  if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) return value;
  if (
    /^(?:transparent|black|white|red|green|blue|gray|grey|orange|purple|yellow|pink|teal|navy|rebeccapurple)$/i.test(
      value,
    )
  )
    return value;
  if (/^(?:rgb|rgba|hsl|hsla|oklch|oklab|lch|lab)\(\s*[-\d.%\s,/]+\)$/i.test(value)) return value;
  return null;
}

export function safeLength(value: string, max = 96): string | null {
  const match = /^(\d+(?:\.\d+)?)(px|rem|em)$/.exec(value);
  if (value === '0') return value;
  if (!match) return null;
  const numeric = Number(match[1]) * (match[2] === 'px' ? 1 : 16);
  return numeric <= max ? value : null;
}

export function safeBorder(value: string): string | null {
  const match = /^(\d+(?:\.\d+)?(?:px|rem|em)|0)\s+(solid|dashed|dotted|double)\s+(.+)$/.exec(
    value,
  );
  return match && safeLength(match[1], 8) && safeColor(match[3]) ? value : null;
}

export function safeShadow(value: string): string | null {
  if (value.length > 200) return null;
  const match =
    /^(inset\s+)?((?:-?\d+(?:\.\d+)?(?:px|rem|em)|0)(?:\s+(?:-?\d+(?:\.\d+)?(?:px|rem|em)|0)){1,3})\s+(.+)$/.exec(
      value,
    );
  if (!match || !safeColor(match[3])) return null;
  const lengths = match[2].split(/\s+/);
  if (
    lengths.some((length) => !safeLength(length.replace(/^-/, ''), 64)) ||
    lengths[2]?.startsWith('-')
  )
    return null;
  return value;
}

export interface DraftPreview {
  draft: string;
  manifestHash: string | null;
  audit: Audit;
}

export function currentDraftPreview(
  preview: DraftPreview | null,
  draft: string,
  manifestHash: string | null,
): Audit | null {
  return preview?.draft === draft && preview.manifestHash === manifestHash ? preview.audit : null;
}

export function compareAudits(
  before: Audit | null,
  after: Audit,
): { resolved: number; added: number; remaining: number } | null {
  if (!before) return null;
  const previous = new Set(before.findings.map((item) => item.id));
  const current = new Set(after.findings.map((item) => item.id));
  return {
    resolved: [...previous].filter((id) => !current.has(id)).length,
    added: [...current].filter((id) => !previous.has(id)).length,
    remaining: [...current].filter((id) => previous.has(id)).length,
  };
}
