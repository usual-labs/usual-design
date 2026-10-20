import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeSource } from '../src/analysis.js';
import { finalizeFindings, type DiagnosticEvidence } from '../src/diagnostics.js';
import type { Finding } from '../src/types.js';

function finding(evidence: DiagnosticEvidence, ruleId = 'allowed.colors'): Finding {
  return {
    id: 'previous-location-dependent-id',
    ruleId,
    category: 'colors',
    kind: 'violation',
    file: evidence.file,
    line: evidence.line,
    column: evidence.column,
    actual: 'bg-red',
    expected: 'bg-brand',
    message: 'Use the approved color.',
  };
}

test('JSX, inline declarations and import bindings have precise multiline UTF16 spans', () => {
  const file = 'src/Unicode.tsx';
  const source =
    '/*🙂*/ import { Button as Action } from "./Button";\r\n' +
    'export function P() {\r\n  return <Action\r\n    style={{\r\n      borderRadius: "19px",\r\n      color: "red"\r\n    }}\r\n  />;\r\n}\r\n';
  const analysis = analyzeSource(file, source);
  const element = analysis.elements[0],
    declaration = analysis.declarations[0],
    binding = analysis.importBindings[0];
  assert.equal(element.span?.start, source.indexOf('<Action'));
  assert.equal(
    source.slice(element.span!.start, element.span!.end),
    '<Action\r\n    style={{\r\n      borderRadius: "19px",\r\n      color: "red"\r\n    }}\r\n  />',
  );
  assert.equal(
    source.slice(declaration.span!.start, declaration.span!.end),
    'borderRadius: "19px"',
  );
  assert.equal(source.slice(binding.span!.start, binding.span!.end), 'Button as Action');
  assert.equal(binding.file, file);
  assert.equal(
    binding.column,
    binding.span!.start + 1,
    'Babel columns and offsets count the emoji as two UTF16 code units',
  );
  const evidence = [element, declaration, ...analysis.importBindings];
  const findings = finalizeFindings(
    evidence.map((item, index) => finding(item, `evidence.${index}`)),
    new Map([[file, source]]),
    evidence,
  );
  assert.equal(findings.length, evidence.length);
  for (const diagnostic of findings) {
    assert.ok(diagnostic.span);
    assert.ok(diagnostic.context);
    assert.equal(
      diagnostic.context.text,
      source.slice(diagnostic.context.start, diagnostic.context.end),
    );
    assert.ok(diagnostic.context.text.length <= 400);
  }
});

test('stable finding IDs survive unrelated line shifts and deduplicate repeated emissions', () => {
  const file = 'src/Repeated.tsx';
  const source =
    'export const P = () => <>\n  <div className="bg-red" />\n  <div className="bg-red" />\n</>;';
  function diagnostics(input: string) {
    const evidence = analyzeSource(file, input).elements;
    const first = finding(evidence[0]),
      second = finding(evidence[1]);
    return finalizeFindings(
      [second, first, { ...first, id: 'duplicate-emission' }],
      new Map([[file, input]]),
      evidence,
    );
  }
  const before = diagnostics(source),
    after = diagnostics('// An unrelated comment.\n\n' + source);
  assert.equal(before.length, 2);
  assert.notEqual(before[0].id, before[1].id);
  assert.deepEqual(
    before.map((item) => item.id),
    after.map((item) => item.id),
  );
  assert.equal(after[0].line, before[0].line + 2);
  assert.notEqual(before[0].span?.start, after[0].span?.start);
  const changed = finalizeFindings(
    [{ ...before[0], expected: 'bg-action' }],
    new Map([[file, source]]),
    analyzeSource(file, source).elements,
  );
  assert.notEqual(
    changed[0].id,
    before[0].id,
    'A different expected behavior is a different diagnostic identity',
  );
});

test('unmatched, invalid and ambiguous evidence never produces a guessed span or context', () => {
  const file = 'src/App.tsx',
    source = 'const value = "source evidence";';
  const at: DiagnosticEvidence = { file, line: 1, column: 1 };
  const diagnostic = finding(at);
  for (const evidence of [
    [],
    [{ ...at, span: { start: -1, end: 4 } }],
    [{ ...at, span: { start: 0, end: source.length + 1 } }],
    [{ ...at, span: { start: 1, end: 4 } }],
    [{ ...at, line: 2, span: { start: 0, end: 4 } }],
    [
      { ...at, span: { start: 0, end: 4 } },
      { ...at, span: { start: 0, end: 8 } },
    ],
  ]) {
    const output = finalizeFindings(
      [
        {
          ...diagnostic,
          span: { start: 0, end: 1 },
          context: { start: 0, end: 1, text: 'stale', truncated: false },
        },
      ],
      new Map([[file, source]]),
      evidence,
    );
    assert.equal(output[0].span, undefined);
    assert.equal(output[0].context, undefined);
  }
});

test('bounded context preserves surrogate pairs at both UTF16 excerpt boundaries', () => {
  const file = 'src/context.tsx';
  for (const source of [
    'x'.repeat(19) + '🙂' + 'x'.repeat(79) + '<div>' + 'x'.repeat(600),
    'x'.repeat(100) + '<div>' + 'x'.repeat(314) + '🙂' + 'x'.repeat(600),
  ]) {
    const evidence: DiagnosticEvidence = {
      file,
      line: 1,
      column: 101,
      span: { start: 100, end: 105 },
    };
    const output = finalizeFindings([finding(evidence)], new Map([[file, source]]), [evidence])[0];
    assert.ok(output.context);
    assert.ok(output.context.text.length <= 400);
    assert.equal(output.context.truncated, true);
    assert.ok(!/^[\udc00-\udfff]/.test(output.context.text));
    assert.ok(!/[\ud800-\udbff]$/.test(output.context.text));
  }
});

test('new source spans preserve lexical identity blocking and separate class uncertainty from style uncertainty', () => {
  const source =
    'import { Button } from "./Button";\n' +
    'export function P(Button, tone, rest, radius) { return <>\n' +
    '  <Button className="bg-brand" style={{ borderRadius: radius }} />\n' +
    '  <div className={tone} />\n  <div {...rest} />\n</>; }';
  const elements = analyzeSource('src/App.tsx', source).elements;
  assert.equal(elements[0].identityBlocked, true);
  assert.equal(elements[0].identity, undefined);
  assert.ok(elements[0].span);
  assert.equal(elements[0].classesUnknown, false);
  assert.equal(elements[1].classesUnknown, true);
  assert.equal(elements[2].classesUnknown, true);
});
