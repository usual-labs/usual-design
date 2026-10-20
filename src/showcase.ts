import { isShowcaseUpdate, showcaseUrl, type ShowcaseState } from './showcase-protocol.js';
export type { ShowcaseState } from './showcase-protocol.js';

/** Browser-only bridge for a project-owned showcase. Returns an effect cleanup. */
export function connectShowcase(apply: (state: ShowcaseState) => void | Promise<void>): () => void {
  if (typeof window === 'undefined' || window.parent === window) return () => {};
  const params = new URLSearchParams(window.location.hash.slice(1));
  const channel = params.get('usual-channel');
  const parent = params.get('usual-parent');
  if (!channel || !/^[a-f0-9-]{36}$/.test(channel) || !parent) return () => {};
  let origin: string;
  try {
    origin = showcaseUrl(parent).origin;
  } catch {
    return () => {};
  }
  if (origin === window.location.origin || parent !== origin) return () => {};
  let active = true;
  let revision = 0;
  let queue = Promise.resolve();
  const receive = (event: MessageEvent) => {
    if (
      event.source !== window.parent ||
      event.origin !== origin ||
      !isShowcaseUpdate(event.data, channel)
    )
      return;
    const update = event.data;
    if (update.revision <= revision) return;
    revision = update.revision;
    // Serialize asynchronous theme providers: an earlier update cannot finish last.
    queue = queue.then(async () => {
      if (!active || update.revision !== revision) return;
      try {
        await apply(update.state);
        if (active && update.revision === revision)
          window.parent.postMessage({ type: 'usual:showcase:applied', channel, revision }, origin);
      } catch {
        if (active && update.revision === revision)
          window.parent.postMessage({ type: 'usual:showcase:error', channel, revision }, origin);
      }
    });
  };
  window.addEventListener('message', receive);
  window.parent.postMessage({ type: 'usual:showcase:ready', channel }, origin);
  return () => {
    active = false;
    window.removeEventListener('message', receive);
  };
}
