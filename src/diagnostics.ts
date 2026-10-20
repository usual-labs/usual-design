import { hash } from './files.js';
import type { Finding, SourceContext, SourceSpan } from './types.js';

export interface DiagnosticEvidence {
  file: string;
  line: number;
  column: number;
  span?: SourceSpan;
}

const contextLimit = 400;
const contextPrefix = 80;

function sourceLineStarts(source: string): number[] {
  const starts = [0];
  for (let index = 0; index < source.length; index++) {
    const code = source.charCodeAt(index);
    if (code === 13) {
      if (source.charCodeAt(index + 1) === 10) index++;
      starts.push(index + 1);
    } else if (code === 10 || code === 0x2028 || code === 0x2029) starts.push(index + 1);
  }
  return starts;
}

function splitSurrogate(source: string, offset: number): boolean {
  const before = source.charCodeAt(offset - 1),
    after = source.charCodeAt(offset);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

function contextFor(source: string, span: SourceSpan): SourceContext {
  let start = Math.max(0, span.start - contextPrefix);
  if (splitSurrogate(source, start)) start--;
  let end = Math.min(source.length, start + contextLimit);
  if (splitSurrogate(source, end)) end--;
  return {
    start,
    end,
    text: source.slice(start, end),
    truncated: start > 0 || end < source.length,
  };
}

function identityParts(finding: Finding): (string | null)[] {
  return [
    finding.file,
    finding.ruleId,
    finding.kind,
    finding.actual ?? null,
    finding.expected ?? null,
    finding.message,
  ];
}

/**
 * Enrich only exact source-evidence matches, remove repeated emissions at the same
 * location, and give semantic findings IDs that survive unrelated line shifts.
 * Identical findings are numbered in source order. Adding/removing an identical
 * earlier occurrence can change which source occurrence owns a later ID; IDs
 * are not edit authority. Always revalidate the audit snapshot before repairs.
 */
export function finalizeFindings(
  findings: readonly Finding[],
  sources: ReadonlyMap<string, string>,
  evidence: readonly DiagnosticEvidence[],
): Finding[] {
  const locations = new Map<string, SourceSpan[]>();
  const lines = new Map<string, number[]>();
  const key = (item: DiagnosticEvidence) => JSON.stringify([item.file, item.line, item.column]);
  for (const item of evidence) {
    const source = sources.get(item.file),
      span = item.span;
    if (
      source === undefined ||
      !span ||
      !Number.isInteger(span.start) ||
      !Number.isInteger(span.end) ||
      span.start < 0 ||
      span.end <= span.start ||
      span.end > source.length ||
      item.line < 1 ||
      item.column < 1
    )
      continue;
    const starts = lines.get(item.file) ?? sourceLineStarts(source);
    lines.set(item.file, starts);
    if (
      starts[item.line - 1] === undefined ||
      starts[item.line - 1] + item.column - 1 !== span.start
    )
      continue;
    const existing = locations.get(key(item)) ?? [];
    if (!existing.some((value) => value.start === span.start && value.end === span.end))
      existing.push(span);
    locations.set(key(item), existing);
  }

  const unique = new Map<string, Finding>();
  for (const finding of findings) {
    const exact = JSON.stringify([
      identityParts(finding),
      finding.category,
      finding.line,
      finding.column,
      [...(finding.affectedCategories ?? [])].sort(),
    ]);
    if (!unique.has(exact)) unique.set(exact, finding);
  }
  const ordered = [...unique.values()].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      JSON.stringify(identityParts(a)).localeCompare(JSON.stringify(identityParts(b))) ||
      a.category.localeCompare(b.category),
  );
  const occurrences = new Map<string, number>();
  return ordered.map((finding) => {
    const identity = identityParts(finding),
      family = JSON.stringify(identity);
    const occurrence = (occurrences.get(family) ?? 0) + 1;
    occurrences.set(family, occurrence);
    const { span: _oldSpan, context: _oldContext, ...rest } = finding;
    const result: Finding = {
      ...rest,
      id: hash(JSON.stringify([...identity, occurrence])).slice(0, 20),
    };
    const matches = locations.get(key(finding));
    const source = sources.get(finding.file);
    if (source !== undefined && matches?.length === 1) {
      result.span = { ...matches[0] };
      result.context = contextFor(source, result.span);
    }
    return result;
  });
}
