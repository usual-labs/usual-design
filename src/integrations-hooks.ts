import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { runProject } from './project.js';
import type { AuditResult } from './types.js';

export interface HookResponse {
  /** Native protocol process status; design failures are represented in output and checkExitCode. */
  exitCode: number;
  checkExitCode: 0 | 1 | 2;
  output: Record<string, unknown>;
}
type Checker = (root: string, mode: 'check') => Promise<AuditResult>;

function message(result: AuditResult): string {
  const scope = `Active: ${result.active.join(', ') || 'none'}. Inactive (unchecked): ${result.inactive.join(', ') || 'none'}.`;
  if (result.errors.length)
    return `Usual Design CHECKER ERROR. ${scope}\n${result.errors.slice(0, 4).join('\n')}\nRun npm run lint:design for the complete error. Do not weaken policy to bypass it.`.slice(
      0,
      5500,
    );
  if (!result.findings.length) return `Usual Design passed. ${scope}`;
  const examples = result.findings.slice(0, 6).map((finding) => {
    const expected = finding.expected ? ` Expected: ${finding.expected}` : '';
    return `${finding.file}:${finding.line}:${finding.column} [${finding.ruleId}] ${finding.message}${expected}`;
  });
  return `Usual Design FAILED (${result.findings.length} findings). ${scope}\n${examples.join('\n')}\nRun npm run lint:design for the full project check. Repair only authorized application code; do not broaden policy, exclusions, exceptions, or deactivate categories.`.slice(
    0,
    5500,
  );
}

function failedProtocol(reason: string): HookResponse {
  const text = `Usual Design CHECKER ERROR: ${reason}. No successful check has been established. Run npm run lint:design manually.`;
  return {
    exitCode: 0,
    checkExitCode: 2,
    output: { continue: false, stopReason: text, systemMessage: text },
  };
}

/** Stateless, read-only adapter. stop_hook_active bounds automatic repair to one continuation. */
export async function handleHook(
  root: string,
  host: 'codex' | 'claude',
  payload: unknown,
  checker: Checker = runProject,
  timeoutMs = 20_000,
): Promise<HookResponse> {
  if (!['codex', 'claude'].includes(host)) return failedProtocol('Unsupported native hook host');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    return failedProtocol('Expected a JSON hook object');
  const input = payload as Record<string, unknown>;
  const event = input.hook_event_name;
  if (event !== 'PostToolUse' && event !== 'Stop')
    return failedProtocol('Only PostToolUse and Stop events are supported');
  if (typeof input.cwd !== 'string') return failedProtocol('Native hook payload is missing cwd');
  if (
    event === 'Stop' &&
    input.stop_hook_active !== undefined &&
    typeof input.stop_hook_active !== 'boolean'
  ) {
    return failedProtocol('stop_hook_active must be a boolean');
  }
  try {
    root = await realpath(root);
    const cwd = await realpath(input.cwd);
    if (cwd !== root && !cwd.startsWith(`${root}${path.sep}`))
      return failedProtocol('Hook cwd is outside the installed project');
  } catch (error) {
    return failedProtocol(error instanceof Error ? error.message : String(error));
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let result: AuditResult;
  try {
    result = await Promise.race([
      checker(root, 'check'),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Checker timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } catch (error) {
    return failedProtocol(error instanceof Error ? error.message : String(error));
  } finally {
    if (timer) clearTimeout(timer);
  }

  const checkExitCode = result.errors.length ? 2 : result.findings.length ? 1 : 0;
  const text = message(result);
  if (event === 'PostToolUse') {
    return {
      exitCode: 0,
      checkExitCode,
      output: {
        ...(checkExitCode ? { systemMessage: text } : {}),
        hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text },
      },
    };
  }
  if (checkExitCode === 0) return { exitCode: 0, checkExitCode, output: { systemMessage: text } };
  if (input.stop_hook_active === true || checkExitCode === 2) {
    const reason = `${text}\nAutomatic continuation stopped${checkExitCode === 2 ? ' because the checker could not establish a result' : ' after one repair attempt'}. Findings remain unresolved; report the failure and required user action.`;
    return {
      exitCode: 0,
      checkExitCode,
      output: { continue: false, stopReason: reason, systemMessage: reason },
    };
  }
  return {
    exitCode: 0,
    checkExitCode,
    output: {
      decision: 'block',
      reason: `${text}\nMake one authorized repair pass, rerun the check, and report anything unresolved. This hook does not authorize a new repair batch or policy change.`,
    },
  };
}
