import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname } from 'node:path';
import { categories, type Category } from './types.js';
import { loadManifest, saveManifest, defaultManifest, parseManifest } from './config.js';
import { analyzeProject, runProject } from './project.js';
import { activate, createPlan, saveAudit } from './records.js';
import { hash, safePath } from './files.js';
import {
  onboardingState,
  updateOnboarding,
  previewOnboarding,
  finishOnboarding,
} from './onboarding.js';
function json(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (!String(req.headers['content-type']).startsWith('application/json'))
    throw new Error('Expected application/json.');
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('Request exceeds 1MB.');
    chunks.push(Buffer.from(chunk));
  }
  const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!data || Array.isArray(data) || typeof data !== 'object')
    throw new Error('Expected a JSON object.');
  return data;
}
export async function startWizard(root: string, configPath = 'usual.design.json', port = 0) {
  const token = randomBytes(32).toString('hex');
  let origin = '';
  let busy = false;
  const assets = fileURLToPath(new URL('./wizard/', import.meta.url));
  const server = createServer(async (req, res) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    try {
      if (req.headers.host !== new URL(origin).host)
        return json(res, 403, { error: 'Invalid Host header.' });
      const url = new URL(req.url ?? '/', origin);
      if (url.pathname.startsWith('/api/')) {
        const provided = String(req.headers['x-usual-token'] ?? '');
        if (
          provided.length !== token.length ||
          !timingSafeEqual(Buffer.from(provided), Buffer.from(token))
        )
          return json(res, 403, { error: 'Invalid session token.' });
        if (req.headers.origin && req.headers.origin !== origin)
          return json(res, 403, { error: 'Cross-origin access is forbidden.' });
        if (busy)
          return json(res, 409, {
            error: 'Another operation is running. Retry after it completes.',
          });
        busy = true;
        try {
          if (req.method === 'GET' && url.pathname === '/api/state') {
            let loaded;
            try {
              loaded = await loadManifest(root, configPath);
            } catch (e) {
              if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
            }
            const draft = defaultManifest();
            const report = loaded
              ? await analyzeProject(
                  root,
                  'audit',
                  loaded.manifest,
                  loaded.manifestHash,
                  configPath,
                )
              : await analyzeProject(root, 'audit', draft, hash(JSON.stringify(draft)), configPath);
            return json(res, 200, {
              projectRoot: root,
              manifestPath: await safePath(root, configPath),
              manifest: loaded?.manifest ?? null,
              manifestHash: loaded?.manifestHash ?? null,
              draft,
              inventory: report.inventory,
              audit: loaded ? report : null,
              onboarding: await onboardingState(root, configPath),
              error: report.errors.length ? report.errors.join('\n') : undefined,
            });
          }
          if (req.method !== 'POST') return json(res, 405, { error: 'Unsupported method.' });
          const b = await body(req);
          if (url.pathname === '/api/onboarding/choices')
            return json(res, 200, await updateOnboarding(root, configPath, b));
          if (url.pathname === '/api/onboarding/preview')
            return json(res, 200, await previewOnboarding(root, configPath, b));
          if (url.pathname === '/api/onboarding/finish')
            return json(res, 200, await finishOnboarding(root, configPath, b));
          if (url.pathname === '/api/preview') {
            const loaded = await loadManifest(root, configPath).catch((error) => {
              if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
              throw error;
            });
            if (b.expectedHash !== (loaded?.manifestHash ?? null))
              throw new Error('Saved policy changed; reload before previewing the draft.');
            const proposed = parseManifest(b.manifest);
            return json(
              res,
              200,
              await analyzeProject(
                root,
                'audit',
                proposed,
                hash(JSON.stringify(proposed)),
                configPath,
              ),
            );
          }
          if (url.pathname === '/api/manifest') {
            if (b.expectedHash !== null && typeof b.expectedHash !== 'string')
              throw new Error('expectedHash is required.');
            return json(res, 200, {
              manifest: await saveManifest(
                root,
                b.manifest,
                b.expectedHash as string | null,
                configPath,
                typeof b.rationale === 'string' ? b.rationale.slice(0, 4000) : undefined,
              ),
            });
          }
          if (url.pathname === '/api/audit') {
            const audit = await runProject(root, 'audit', configPath);
            await saveAudit(root, audit);
            return json(res, 200, audit);
          }
          if (url.pathname === '/api/plan') {
            if (
              !Array.isArray(b.findingIds) ||
              !b.findingIds.every((id) => typeof id === 'string') ||
              b.findingIds.length > 10000 ||
              typeof b.expectedSnapshot !== 'string'
            )
              throw new Error('Valid findingIds and expectedSnapshot required.');
            return json(
              res,
              200,
              await createPlan(root, b.findingIds, b.expectedSnapshot, configPath),
            );
          }
          if (url.pathname === '/api/activate') {
            if (
              !Array.isArray(b.categories) ||
              !b.categories.length ||
              !b.categories.every((c) => categories.includes(c as Category)) ||
              typeof b.expectedSnapshot !== 'string'
            )
              throw new Error('Valid categories and expectedSnapshot required.');
            return json(
              res,
              200,
              await activate(root, b.categories as Category[], b.expectedSnapshot, configPath),
            );
          }
          return json(res, 404, { error: 'Unknown operation.' });
        } finally {
          busy = false;
        }
      }
      if (req.method !== 'GET') return json(res, 405, { error: 'Unsupported method.' });
      const file =
        decodeURIComponent(url.pathname) === '/'
          ? 'index.html'
          : decodeURIComponent(url.pathname).slice(1);
      const path = await safePath(assets, file);
      const data = await readFile(path);
      const type =
        (
          {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.svg': 'image/svg+xml',
          } as Record<string, string>
        )[extname(file)] ?? 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(data);
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.message });
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not bind local wizard.');
  origin = `http://127.0.0.1:${address.port}`;
  return { server, origin, token, url: `${origin}/#token=${token}` };
}
