import { createHash, randomUUID } from 'node:crypto';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { mkdir, readFile, realpath, open, rename, unlink, lstat } from 'node:fs/promises';
export const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export async function optionalRead(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}
export function validateRelative(path: string): void {
  if (path.length > 1024 || (path.match(/[{}]/g)?.length ?? 0) > 16)
    throw new Error('Path pattern is too complex.');
  if (
    !path ||
    isAbsolute(path) ||
    path.includes('\\') ||
    path.split('/').includes('..') ||
    path.includes('\0')
  )
    throw new Error(`Path must stay inside the project: ${path}`);
}
export async function safePath(root: string, path: string): Promise<string> {
  validateRelative(path);
  const base = await realpath(root),
    target = resolve(base, path);
  let cursor = target;
  for (;;) {
    try {
      const actual = await realpath(cursor);
      const rel = relative(base, actual);
      if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
        throw new Error(`Path escapes project: ${path}`);
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      const parent = dirname(cursor);
      if (parent === cursor) throw e;
      cursor = parent;
    }
  }
  // Never replace a symlink even if it currently points within the project.
  try {
    if ((await lstat(target)).isSymbolicLink()) throw new Error(`Refusing symlink: ${path}`);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
  }
  return target;
}
export async function atomicWrite(
  root: string,
  path: string,
  text: string,
  expectedHash?: string | null,
): Promise<void> {
  const target = await safePath(root, path);
  await mkdir(dirname(target), { recursive: true });
  const lock = await open(`${target}.lock`, 'wx').catch(() => {
    throw new Error(`Another write is active for ${path}; inspect its .lock file before recovery.`);
  });
  const temp = `${target}.${randomUUID()}.tmp`;
  try {
    const old = await optionalRead(target);
    if (expectedHash !== undefined && (old === null ? null : hash(old)) !== expectedHash)
      throw new Error(`Stale write for ${path}; reload and review changes.`);
    await safePath(root, path);
    await lock.writeFile(String(process.pid));
    const file = await open(temp, 'wx', 0o600);
    try {
      await file.writeFile(text);
      await file.sync();
    } finally {
      await file.close();
    }
    await safePath(root, path);
    const current = await optionalRead(target);
    if (current !== old) throw new Error(`Stale write for ${path}; file changed during save.`);
    await rename(temp, target);
  } finally {
    await lock.close();
    await unlink(`${target}.lock`).catch(() => {});
    await unlink(temp).catch(() => {});
  }
}
