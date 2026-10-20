import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readFile, realpath, rename, rm } from 'node:fs/promises';
import path from 'node:path';

export interface SetupChange {
  path: string;
  before: string | null;
  after: string;
  executable?: boolean;
}
export interface SetupPlan {
  root: string;
  host: 'codex' | 'claude' | 'both' | 'portable';
  changes: SetupChange[];
  conflicts: string[];
  notices: string[];
}

export const digest = (text: string): string => createHash('sha256').update(text).digest('hex');

export async function safeTarget(root: string, relative: string): Promise<string> {
  if (
    path.isAbsolute(relative) ||
    relative.split(/[\\/]/).some((part) => part === '..' || part === '')
  ) {
    throw new Error(`Unsafe setup path: ${relative}`);
  }
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`))
    throw new Error(`Setup path escapes project: ${relative}`);
  let current = root;
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) throw new Error(`Setup refuses symbolic link: ${relative}`);
      if (current !== target && !entry.isDirectory())
        throw new Error(`Setup ancestor is not a directory: ${relative}`);
      if (current === target && !entry.isFile())
        throw new Error(`Setup target is not a regular file: ${relative}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  return target;
}

export async function readSetupFile(root: string, relative: string): Promise<string | null> {
  const target = await safeTarget(root, relative);
  try {
    return await readFile(target, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

/** Each target replacement is atomic; preflight prevents known conflicts before any write. */
export async function applySetupPlan(plan: SetupPlan): Promise<SetupPlan> {
  if (plan.conflicts.length) throw new Error(`Setup has conflicts:\n${plan.conflicts.join('\n')}`);
  const root = await realpath(plan.root);
  if (root !== plan.root) throw new Error('Project root changed since setup preview');
  if (!plan.changes.length) return plan;
  for (const change of plan.changes) {
    if ((await readSetupFile(root, change.path)) !== change.before)
      throw new Error(`File changed since setup preview: ${change.path}`);
  }
  const lockPath = await safeTarget(root, '.usual-design/setup.lock');
  await mkdir(path.dirname(lockPath), { recursive: true });
  const lock = await open(lockPath, 'wx', 0o600).catch((error) => {
    if (error.code === 'EEXIST')
      throw new Error(
        'Another setup is running; inspect .usual-design/setup.lock if it was interrupted',
      );
    throw error;
  });
  const staged: { target: string; temporary: string; change: SetupChange }[] = [];
  try {
    for (const change of plan.changes) {
      const target = await safeTarget(root, change.path);
      if ((await readSetupFile(root, change.path)) !== change.before)
        throw new Error(`Concurrent setup edit: ${change.path}`);
      await mkdir(path.dirname(target), { recursive: true });
      await safeTarget(root, change.path);
      const temporary = `${target}.${randomUUID()}.tmp`;
      const file = await open(temporary, 'wx', change.executable ? 0o755 : 0o644);
      try {
        await file.writeFile(change.after, 'utf8');
        await file.sync();
      } finally {
        await file.close();
      }
      staged.push({ target, temporary, change });
    }
    // Check the entire batch again before committing replacements.
    for (const entry of staged) {
      if ((await readSetupFile(root, entry.change.path)) !== entry.change.before)
        throw new Error(`Concurrent setup edit: ${entry.change.path}`);
    }
    for (const entry of staged) {
      await safeTarget(root, entry.change.path);
      if ((await readSetupFile(root, entry.change.path)) !== entry.change.before)
        throw new Error(`Concurrent setup edit: ${entry.change.path}`);
      await rename(entry.temporary, entry.target);
    }
  } finally {
    await Promise.all(staged.map((entry) => rm(entry.temporary, { force: true })));
    await lock.close();
    await rm(lockPath, { force: true });
  }
  return plan;
}
