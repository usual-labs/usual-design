#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defaultManifest, loadManifest, saveManifest } from './config.js';
import { categories, type Category } from './types.js';
import { analyzeProject, runProject, resultExit, humanResult } from './project.js';
import { hash } from './files.js';
import { activate, createPlan, saveAudit, verifyPlan } from './records.js';
import { startWizard } from './server.js';
import { planSetup, applySetup, handleHook } from './integrations.js';
import { prepareOnboarding } from './onboarding.js';
const help = `Usual Design — project-owned design enforcement\n\nUsage: usual-design <command> [--root path] [--config usual.design.json]\n\n  init        Summarize discovery; --json includes inventory; --write saves draft\n  onboard     Prepare guided review: --proposal path.json [--write]\n  validate    Validate the manifest without running analysis\n  audit       Audit every category; --save records results\n  check       Enforce only activated categories (read-only)\n  wizard      Start the local visual onboarding server (no browser auto-open)\n  plan        Save selected repairs: --findings id,id --snapshot hash --write\n  verify-plan Verify saved approval and current source before repairs; --plan path\n  activate    Fresh-audit gate: --categories colors,typography,... --write\n  setup       Preview agent installation; --host codex|claude|both|portable\n              --hooks --commit-hook optionally propose integrations; --write applies\n  hook        Native agent handler; --host codex|claude, reads JSON stdin\n\nOptions: --json --port 0 --version --help\nExit: 0 clean; 1 findings/unverifiable coverage; 2 configuration/operational error.\nNo active categories means no design enforcement. An audit still examines all.\n`;
try {
  const { values: v, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      root: { type: 'string' },
      config: { type: 'string' },
      json: { type: 'boolean' },
      write: { type: 'boolean' },
      save: { type: 'boolean' },
      categories: { type: 'string' },
      findings: { type: 'string' },
      plan: { type: 'string' },
      proposal: { type: 'string' },
      snapshot: { type: 'string' },
      port: { type: 'string' },
      host: { type: 'string' },
      hooks: { type: 'boolean' },
      'commit-hook': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
  const command = positionals[0];
  if (v.version) {
    console.log('0.3.0');
  } else if (v.help || !command) {
    console.log(help);
  } else {
    if (positionals.length > 1)
      throw new Error('Unexpected positional arguments. Use --root for the project path.');
    const root = await realpath(resolve(v.root ?? '.')),
      config = v.config ?? 'usual.design.json';
    const emit = (data: unknown, human?: string) =>
      console.log(v.json ? JSON.stringify(data) : (human ?? JSON.stringify(data, null, 2)));
    if (command === 'init') {
      const manifest = { version: 1 as const, include: defaultManifest().include, active: [] };
      const analysis = await analyzeProject(
        root,
        'audit',
        manifest,
        hash(JSON.stringify(manifest)),
        config,
      );
      const inventory = analysis.inventory;
      if (v.write) await saveManifest(root, manifest, null, config);
      if (analysis.errors.length) process.exitCode = 2;
      emit(
        { manifest, inventory, errors: analysis.errors, written: !!v.write },
        `${v.write ? `Inactive draft saved to ${config}.` : 'Discovery preview; no files written.'}\n` +
          `${inventory.files.length} covered files · ${inventory.tokens.length} token definitions · ${inventory.candidates?.length ?? 0} observed values.\n` +
          `Use --json for the full evidence report. Ask your agent to use the usual-design-onboarding skill for guided setup.\n` +
          analysis.errors.map((e) => `ERROR ${e}`).join('\n'),
      );
    } else if (command === 'onboard') {
      if (!v.proposal) throw new Error('Supply --proposal with the agent-prepared JSON path.');
      const result = await prepareOnboarding(root, v.proposal, config, !!v.write);
      emit(
        result,
        `${result.decisions} decisions in ${result.categories.join(', ')}.\n` +
          (v.write
            ? `Onboarding prepared at ${result.path}. Run usual-design wizard to review it.`
            : 'Proposal validated; no files written. Add --write to prepare the guided wizard.'),
      );
    } else if (command === 'validate') {
      const loaded = await loadManifest(root, config);
      emit({ valid: true, manifestHash: loaded.manifestHash }, 'Manifest is valid.');
    } else if (command === 'check' || command === 'audit') {
      const result = await runProject(root, command, config);
      if (v.save) {
        if (command !== 'audit') throw new Error('--save is only valid for audit.');
        await saveAudit(root, result);
      }
      emit(result, humanResult(result));
      process.exitCode = resultExit(result);
    } else if (command === 'wizard') {
      const port = Number(v.port ?? 0);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port.');
      const { server, url } = await startWizard(root, config, port);
      console.log(
        `Local wizard: ${url}\nSession URL is private to this local process. Press Ctrl-C to stop.`,
      );
      for (const signal of ['SIGINT', 'SIGTERM'] as const)
        process.once(signal, () => server.close());
    } else if (command === 'activate') {
      if (!v.write)
        throw new Error('Activation changes policy. Supply --write after reviewing the audit.');
      const selected = (v.categories ?? '').split(',').filter(Boolean);
      if (!selected.length || !selected.every((c) => categories.includes(c as Category)))
        throw new Error(`Choose categories: ${categories.join(',')}`);
      const result = await activate(root, selected as Category[], v.snapshot, config);
      emit(result, humanResult(result));
      process.exitCode = resultExit(result);
    } else if (command === 'plan') {
      if (!v.write || !v.snapshot || !v.findings)
        throw new Error('Approve a repair batch with --findings id,id --snapshot hash --write.');
      emit(await createPlan(root, v.findings.split(','), v.snapshot, config));
    } else if (command === 'verify-plan') {
      if (!v.plan) throw new Error('Supply --plan with the saved approved repair record.');
      emit(await verifyPlan(root, v.plan, config));
    } else if (command === 'setup') {
      const host = v.host ?? 'portable';
      if (!['codex', 'claude', 'both', 'portable'].includes(host))
        throw new Error('Unsupported agent host.');
      const options = {
        hooks: !!v.hooks,
        commitHook: !!v['commit-hook'],
        npmScript: true,
        configPath: config,
      };
      const setup = v.write
        ? await applySetup(root, host as 'codex', options)
        : await planSetup(root, host as 'codex', options);
      emit(setup);
      if (setup.conflicts.length) process.exitCode = 2;
    } else if (command === 'hook') {
      if (!['codex', 'claude'].includes(v.host ?? ''))
        throw new Error('Hook requires --host codex or claude.');
      let input = '';
      for await (const c of process.stdin) {
        input += c;
        if (input.length > 1_000_000) throw new Error('Hook payload too large.');
      }
      const result = await handleHook(
        root,
        v.host as 'codex' | 'claude',
        JSON.parse(input),
        (r, m) => runProject(r, m, config),
      );
      console.log(JSON.stringify(result.output));
      process.exitCode = result.exitCode;
    } else throw new Error(`Unknown command: ${command}. Use --help.`);
  }
} catch (e) {
  const json = process.argv.includes('--json');
  const message = (e as Error).message;
  if (json) console.log(JSON.stringify({ version: 1, error: message }));
  else console.error(`Usual Design: ${message}`);
  process.exitCode = 2;
}
