import { execFile } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import {
  applySetupPlan,
  digest,
  readSetupFile,
  safeTarget,
  type SetupPlan,
} from './integrations-files.js';

export { applySetupPlan } from './integrations-files.js';
export { handleHook } from './integrations-hooks.js';
export type { SetupPlan, SetupChange } from './integrations-files.js';
export type SetupHost = SetupPlan['host'];
export interface SetupOptions {
  hooks?: boolean;
  commitHook?: boolean;
  npmScript?: boolean;
  configPath?: string;
}
const exec = promisify(execFile);
const registryPath = '.usual-design/setup.json';
const start = '<!-- usual-design:begin -->';
const end = '<!-- usual-design:end -->';
const section = `${start}\n## Usual Design\n\nRead the project-local usual-design skill for design discovery and approved repairs. Run \`npm run lint:design\` after each completed UI change. It checks active categories only. Use a full audit before activation. Ordinary repairs must not weaken the configured manifest (usual.design.json by default), broaden exclusions, deactivate categories, add exceptions, or delete evidence. Resume selected work from docs/usual-design/ and re-audit stale batches.\n${end}`;
const shellQuote = (value: string): string => "'" + value.replaceAll("'", "'\"'\"'") + "'";

/** Adds one JSON property without reformatting existing package text. */
function addProperty(
  source: string,
  object: t.ObjectExpression,
  key: string,
  value: unknown,
): string {
  const last = object.properties.at(-1);
  const at = last?.end ?? object.start! + 1;
  const multiline = source.includes('\n');
  const lineStart = source.lastIndexOf('\n', object.start!) + 1;
  const parentIndent = source.slice(lineStart, object.start!).match(/^\s*/)?.[0] ?? '';
  const first = object.properties[0];
  const childIndent = first
    ? source.slice(source.lastIndexOf('\n', first.start!) + 1, first.start!).match(/^\s*/)?.[0]
    : undefined;
  const indent = childIndent || `${parentIndent}  `;
  const literal = JSON.stringify(value, null, multiline ? 2 : undefined).replace(
    /\n/g,
    `\n${indent}`,
  );
  const inserted = `${last ? ',' : ''}${multiline ? `\n${indent}` : last ? ' ' : ''}${JSON.stringify(key)}: ${literal}`;
  return source.slice(0, at) + inserted + source.slice(at);
}

function packageScript(source: string, configPath: string): string {
  const data = JSON.parse(source) as { scripts?: Record<string, unknown> };
  const desired = `usual-design check${configPath === 'usual.design.json' ? '' : ` --config ${shellQuote(configPath)}`}`;
  if (data.scripts?.['lint:design'] === desired) return source;
  if (data.scripts && typeof data.scripts !== 'object')
    throw new Error('package.json scripts must be an object');
  if (data.scripts && 'lint:design' in data.scripts)
    throw new Error(
      'package.json already defines a different lint:design script; keep it and add Usual manually',
    );
  const tree = parseExpression(source);
  if (!t.isObjectExpression(tree)) throw new Error('package.json must contain an object');
  const prop = tree.properties.find(
    (p) => t.isObjectProperty(p) && (t.isStringLiteral(p.key) ? p.key.value : '') === 'scripts',
  );
  if (prop && t.isObjectProperty(prop) && t.isObjectExpression(prop.value))
    return addProperty(source, prop.value, 'lint:design', desired);
  if (prop) throw new Error('package.json scripts must be an object');
  return addProperty(source, tree, 'scripts', { 'lint:design': desired });
}

const runner = (configPath: string) =>
  `// Managed by Usual Design. Project-local dependencies only; no downloads.\nconst fs = require('node:fs');\nconst path = require('node:path');\nconst { spawnSync } = require('node:child_process');\nconst root = path.dirname(__dirname);\nconst host = process.argv.at(-1);\nif (!['codex', 'claude'].includes(host)) throw Error('Unsupported Usual Design hook host');\nconst own = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).name === '@usualui/lint';\nconst cli = path.join(root, own ? 'dist/cli.js' : 'node_modules/@usualui/lint/dist/cli.js');\nconst result = spawnSync(process.execPath, [cli, 'hook', '--root', root, '--host', host${configPath === 'usual.design.json' ? '' : `, '--config', ${JSON.stringify(configPath)}`}], { cwd: root, input: fs.readFileSync(0), encoding: 'utf8', timeout: 25000, maxBuffer: 1048576 });\nif (result.stdout) process.stdout.write(result.stdout);\nif (result.stderr) process.stderr.write(result.stderr);\nif (result.error) process.stderr.write('Usual Design checker unavailable: ' + result.error.message + '\\n');\nprocess.exit(result.status ?? 1);\n`;

// Both clients run shell commands from the session cwd. Search ancestors so nested sessions work.
const locateRunner = `let d=process.cwd();const f=require("node:fs"),p=require("node:path");while(!f.existsSync(p.join(d,".usual-design","hook.cjs"))){const n=p.dirname(d);if(n===d)throw Error("Usual Design hook runner not found");d=n}require(p.join(d,".usual-design","hook.cjs"))`;
const hookCommand = (host: 'codex' | 'claude') => `node -e '${locateRunner}' ${host}`;

function withHooks(source: string | null, host: 'codex' | 'claude'): string {
  const data = source === null ? {} : JSON.parse(source);
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Hook configuration must be an object');
  if (
    data.hooks !== undefined &&
    (!data.hooks || typeof data.hooks !== 'object' || Array.isArray(data.hooks))
  )
    throw new Error('Existing hooks field is not an object');
  data.hooks ??= {};
  const command = hookCommand(host);
  for (const event of ['PostToolUse', 'Stop']) {
    const entries = data.hooks[event] ?? [];
    if (!Array.isArray(entries)) throw new Error(`Existing ${event} hooks must be an array`);
    const owned = entries.filter((entry: unknown) =>
      JSON.stringify(entry).includes('.usual-design'),
    );
    const desired = {
      ...(event === 'PostToolUse'
        ? { matcher: host === 'codex' ? '^(apply_patch|Edit|Write)$' : '^(Edit|Write|MultiEdit)$' }
        : {}),
      hooks: [{ type: 'command', command, timeout: 30 }],
    };
    if (
      owned.length &&
      (owned.length !== 1 || JSON.stringify(owned[0]) !== JSON.stringify(desired))
    ) {
      throw new Error(
        `Existing Usual Design ${event} hook differs; review it manually instead of overwriting`,
      );
    }
    if (!owned.length) entries.push(desired);
    data.hooks[event] = entries;
  }
  if (source && JSON.stringify(JSON.parse(source)) === JSON.stringify(data)) return source;
  return `${JSON.stringify(data, null, 2)}\n`;
}

export async function planSetup(
  root: string,
  host: SetupHost,
  options: SetupOptions = {},
): Promise<SetupPlan> {
  if (!['codex', 'claude', 'both', 'portable'].includes(host))
    throw new Error('Unsupported setup host');
  root = await realpath(root);
  const configPath = options.configPath ?? 'usual.design.json';
  await safeTarget(root, configPath);
  const plan: SetupPlan = { root, host, changes: [], conflicts: [], notices: [] };
  let registry: { version: number; files: Record<string, string> } = { version: 1, files: {} };
  try {
    const previous = await readSetupFile(root, registryPath);
    if (previous) {
      const parsed = JSON.parse(previous);
      if (
        parsed.version !== 1 ||
        !parsed.files ||
        typeof parsed.files !== 'object' ||
        Array.isArray(parsed.files)
      )
        throw new Error('Unsupported setup ownership record');
      registry = parsed;
    }
  } catch (error) {
    plan.conflicts.push(String(error));
    return plan;
  }
  const ownedFiles = { ...registry.files };
  async function add(
    relative: string,
    after: string,
    owned = false,
    executable = false,
  ): Promise<void> {
    try {
      const before = await readSetupFile(root, relative);
      if (
        owned &&
        before !== null &&
        before !== after &&
        registry.files[relative] !== digest(before)
      ) {
        throw new Error(`${relative} exists or has user edits; review it manually`);
      }
      if (before !== after)
        plan.changes.push({ path: relative, before, after, ...(executable ? { executable } : {}) });
      if (owned) ownedFiles[relative] = digest(after);
    } catch (error) {
      plan.conflicts.push(String(error));
    }
  }
  const skill = await readFile(new URL('../skills/usual-design/SKILL.md', import.meta.url), 'utf8');
  const hosts: ('codex' | 'claude')[] =
    host === 'both' ? ['codex', 'claude'] : host === 'portable' ? [] : [host];
  if (host === 'portable') {
    await add('docs/usual-design/SKILL.md', skill, true);
    plan.notices.push(
      'Portable skill saved as project documentation; configure your agent manually. No native hooks are claimed.',
    );
  }
  for (const client of hosts) {
    await add(
      `${client === 'codex' ? '.agents' : '.claude'}/skills/usual-design/SKILL.md`,
      skill,
      true,
    );
    const instructions = client === 'codex' ? 'AGENTS.md' : 'CLAUDE.md';
    try {
      const existing = await readSetupFile(root, instructions);
      if (existing?.includes(start) || existing?.includes(end)) {
        if (
          existing.split(start).length !== 2 ||
          existing.split(end).length !== 2 ||
          !existing.includes(section)
        ) {
          throw new Error(`${instructions} has a modified Usual section; review it manually`);
        }
      } else
        await add(
          instructions,
          `${existing ?? ''}${existing ? (existing.endsWith('\n') ? '\n' : '\n\n') : ''}${section}\n`,
        );
    } catch (error) {
      plan.conflicts.push(String(error));
    }
    if (options.hooks) {
      try {
        if (client === 'codex') {
          const config = await readSetupFile(root, '.codex/config.toml');
          if (config && /^\s*\[\[?hooks(?:\.|\])/m.test(config))
            throw new Error(
              'Codex inline [hooks] already exists; use its existing configuration rather than adding a conflicting hooks.json',
            );
        }
        const target = client === 'codex' ? '.codex/hooks.json' : '.claude/settings.json';
        await add(target, withHooks(await readSetupFile(root, target), client));
      } catch (error) {
        plan.conflicts.push(String(error));
      }
      plan.notices.push(
        `${client}: review and trust the exact native hooks in your client; setup cannot grant trust or override managed restrictions. POSIX shell required for the generated command.`,
      );
    }
  }
  if (options.hooks && hosts.length) await add('.usual-design/hook.cjs', runner(configPath), true);
  for (const file of ['SKILL.md', 'references/proposal.md', 'references/showcase.md']) {
    const content = await readFile(
      new URL(`../skills/usual-design-onboarding/${file}`, import.meta.url),
      'utf8',
    );
    const destinations =
      host === 'portable'
        ? ['docs/usual-design/skills']
        : hosts.map((client) => `${client === 'codex' ? '.agents' : '.claude'}/skills`);
    for (const directory of destinations)
      await add(`${directory}/usual-design-onboarding/${file}`, content, true);
  }
  if (options.npmScript !== false) {
    try {
      const source = await readSetupFile(root, 'package.json');
      if (source) await add('package.json', packageScript(source, configPath));
      else
        plan.notices.push(
          'No package.json found. Install @usualui/lint locally and add a lint:design script before using automatic integrations.',
        );
    } catch (error) {
      plan.conflicts.push(String(error));
    }
  }
  if (options.commitHook) await planCommitHook(plan, add, configPath);
  if (configPath !== 'usual.design.json')
    plan.notices.push(
      'Custom-manifest npm scripts use POSIX quoting. Keep passing --config for manual commands; generated native and commit hooks preserve the selected path.',
    );
  await add(registryPath, `${JSON.stringify({ version: 1, files: ownedFiles }, null, 2)}\n`);
  plan.notices.push(
    'Review the proposed files before applying. Existing user edits are never silently replaced; no global settings are changed.',
  );
  return plan;
}

async function planCommitHook(
  plan: SetupPlan,
  add: (relative: string, after: string, owned?: boolean, executable?: boolean) => Promise<void>,
  configPath: string,
): Promise<void> {
  try {
    const { stdout } = await exec('git', ['rev-parse', '--show-toplevel'], { cwd: plan.root });
    if ((await realpath(stdout.trim())) !== plan.root)
      throw new Error(
        'Project is inside a larger Git repository; attach the check to its existing hook manager manually',
      );
    const config = await exec('git', ['config', '--get', 'core.hooksPath'], {
      cwd: plan.root,
    }).catch((error) => {
      if (error.code === 1) return { stdout: '' };
      throw error;
    });
    if (config.stdout.trim())
      throw new Error(
        'core.hooksPath is configured; add npm run lint:design to that existing hook mechanism manually',
      );
    const pkg = JSON.parse((await readSetupFile(plan.root, 'package.json')) ?? '{}');
    if (pkg.devDependencies?.husky || pkg.devDependencies?.lefthook || pkg['simple-git-hooks'])
      throw new Error('An existing hook manager was found; add the check there manually');
    const existing = await readSetupFile(plan.root, '.git/hooks/pre-commit');
    const script =
      '#!/bin/sh\n# Managed by Usual Design: full working-tree check, not a staged-tree guarantee.\nproject_root=$(git rev-parse --show-toplevel) || exit $?\n"$project_root/node_modules/.bin/usual-design" check --root "$project_root"' +
      (configPath === 'usual.design.json' ? '' : ` --config ${shellQuote(configPath)}`) +
      '\n';
    if (existing !== null && existing !== script)
      throw new Error(
        'A pre-commit hook already exists; add the check manually, preserving its ordering and failure behavior',
      );
    await add('.git/hooks/pre-commit', script, true, true);
    plan.notices.push(
      'Commit hook checks the full working tree. Partial staging can differ from the committed tree; CI checks the actual commit.',
    );
  } catch (error) {
    plan.conflicts.push(`Commit hook: ${String(error)}`);
  }
}

/** CLI must call this only after an explicit --write; planSetup is the default preview. */
export async function applySetup(
  root: string,
  host: SetupHost,
  options: SetupOptions = {},
): Promise<SetupPlan> {
  return applySetupPlan(await planSetup(root, host, options));
}
