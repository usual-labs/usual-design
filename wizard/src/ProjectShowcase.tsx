import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showcaseUrl, type ShowcaseState } from '../../src/showcase-protocol';
import type { OnboardingProposal } from '../../src/onboarding-types';
import { Icon } from './Icon';

export function ProjectShowcase({
  showcase,
  state,
}: {
  showcase: NonNullable<OnboardingProposal['showcase']>;
  state: ShowcaseState;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef(state);
  latest.current = state;
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [channel, setChannel] = useState(() => crypto.randomUUID());
  const [status, setStatus] = useState<'connecting' | 'updating' | 'ready' | 'error'>('connecting');
  const connection = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const url = showcaseUrl(showcase.url);
    if (url.origin === window.location.origin) return null;
    url.hash = new URLSearchParams({
      'usual-parent': window.location.origin,
      'usual-channel': channel,
    }).toString();
    return { url: url.href, origin: url.origin };
  }, [showcase.url, channel]);

  const send = useCallback(() => {
    if (!connection || !frame.current?.contentWindow) return;
    revision.current += 1;
    setStatus('updating');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('error'), 8000);
    frame.current.contentWindow.postMessage(
      {
        type: 'usual:showcase:update',
        channel,
        revision: revision.current,
        state: latest.current,
      },
      connection.origin,
    );
  }, [channel, connection]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        !connection ||
        event.origin !== connection.origin ||
        event.source !== frame.current?.contentWindow ||
        !event.data ||
        event.data.channel !== channel
      )
        return;
      if (event.data.type === 'usual:showcase:ready') send();
      else if (
        event.data.revision === revision.current &&
        ['usual:showcase:applied', 'usual:showcase:error'].includes(event.data.type)
      ) {
        clearTimeout(timer.current);
        setStatus(event.data.type === 'usual:showcase:applied' ? 'ready' : 'error');
      }
    };
    window.addEventListener('message', receive);
    return () => {
      window.removeEventListener('message', receive);
      clearTimeout(timer.current);
    };
  }, [connection, channel, send]);
  useEffect(() => {
    send();
  }, [state, send]);

  if (!connection)
    return (
      <div className="showcase-message" role="alert">
        The showcase must run on a separate local development server.
      </div>
    );
  return (
    <div className="project-showcase">
      <div className="showcase-connection">
        <span role="status">
          {status === 'ready'
            ? 'Choices applied'
            : status === 'error'
              ? 'Preview not connected'
              : 'Connecting preview…'}
        </span>
        <button
          className="secondary small"
          onClick={() => {
            setStatus('connecting');
            setChannel(crypto.randomUUID());
          }}
        >
          <Icon name="reload" /> Reload preview
        </button>
      </div>
      {status === 'error' && (
        <div className="showcase-message" role="alert">
          <strong>The showcase hasn’t applied these choices.</strong>
          <p>
            Keep the project’s development server running at <code>{showcase.url}</code>. Ask your
            agent to check the showcase bridge and frame policy, then reload. Restart the wizard if
            the showcase address changed. Your wizard choices are retained.
          </p>
        </div>
      )}
      <iframe
        key={channel}
        ref={frame}
        src={connection.url}
        title={`${showcase.title} — project components`}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={send}
        onError={() => {
          clearTimeout(timer.current);
          setStatus('error');
        }}
      />
    </div>
  );
}
