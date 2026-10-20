import { useCallback, useEffect, useRef, useState } from 'react';
import { request } from './api';
import { AuditBoard } from './AuditBoard';
import { Inventory } from './Inventory';
import { addCandidateToDraft, compareAudits } from './model';
import { PolicyReview } from './PolicyReview';
import { RepairHandoff } from './RepairHandoff';
import type { Audit, Category, Handoff, ObservedValue, ProjectState } from './types';

export function App() {
  const [state, setState] = useState<ProjectState | null>(null);
  const [pending, setPending] = useState('Opening project');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(new Set<string>());
  const [review, setReview] = useState(false);
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [policyDraft, setPolicyDraft] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const next = await request<ProjectState>('state');
    setState(next);
    if (next.error) setError(next.error);
    setSelected(
      (current) =>
        new Set([...current].filter((id) => next.audit?.findings.some((item) => item.id === id))),
    );
    return next;
  }, []);

  useEffect(() => {
    void refresh()
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'The project could not be opened.'),
      )
      .finally(() => setPending(''));
  }, [refresh]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function run(label: string, action: () => Promise<void>): Promise<boolean> {
    if (pending) return false;
    setPending(label);
    setError('');
    setNotice('');
    try {
      await action();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The operation could not be completed.');
      return false;
    } finally {
      setPending('');
    }
  }

  async function recheck() {
    await run('Auditing the project', async () => {
      const previous = state?.audit ?? null;
      await request('audit', {});
      const next = await refresh();
      setReview(false);
      const comparison = next.audit && compareAudits(previous, next.audit);
      setNotice(
        comparison
          ? `Fresh audit: ${comparison.resolved} resolved, ${comparison.added} new, ${comparison.remaining} remaining findings.`
          : 'Fresh audit saved. Review the six groups below.',
      );
      document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function saveManifest(manifest: Record<string, unknown>, rationale: string) {
    return run('Validating and saving policy', async () => {
      await request('manifest', { manifest, expectedHash: state?.manifestHash ?? null, rationale });
      await refresh();
      setReview(false);
      setSelected(new Set());
      setNotice(
        'Policy saved. Run a fresh audit before planning repairs or activating categories.',
      );
    });
  }

  async function previewImpact(manifest: Record<string, unknown>): Promise<Audit | null> {
    let audit: Audit | null = null;
    const completed = await run('Previewing draft impact', async () => {
      audit = await request<Audit>('preview', {
        manifest,
        expectedHash: state?.manifestHash ?? null,
      });
      setNotice('Unsaved draft preview ready. Review its impact before approving policy.');
    });
    return completed ? audit : null;
  }

  function approveCandidate(candidate: ObservedValue) {
    if (pending) return;
    try {
      setPolicyDraft(addCandidateToDraft(policyDraft, candidate));
      setError('');
      setNotice(
        `Added ${candidate.name} to the unsaved policy draft. Review and approve the policy to save it; activation stays unchanged.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The value could not be added to the policy draft.',
      );
      document.getElementById('policy')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function savePlan() {
    if (!state?.audit) return;
    await run('Saving your repair plan', async () => {
      const next = await request<Handoff>('plan', {
        findingIds: [...selected],
        expectedSnapshot: state.audit!.snapshot,
      });
      setHandoff(next);
      setReview(false);
      setNotice('Repair plan saved. Hand it to your agent, then run a fresh audit.');
    });
  }

  async function activate(category: Category) {
    if (!state?.audit) return;
    await run(`Activating ${category}`, async () => {
      await request('activate', {
        categories: [category],
        expectedSnapshot: state.audit!.snapshot,
      });
      await refresh();
      setNotice(
        `${category[0]!.toUpperCase()}${category.slice(1)} is now active in lint. Other inactive categories remain unchecked.`,
      );
    });
  }

  const selectedFindings = state?.audit?.findings.filter((item) => selected.has(item.id)) ?? [];
  const preview =
    state?.existingPreview ??
    (typeof state?.manifest?.preview === 'string' ? state.manifest.preview : undefined);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to project workshop
      </a>
      <header className="site-header">
        <a className="wordmark" href="#main" aria-label="Usual Design workshop">
          <span className="brand-mark" aria-hidden="true">
            u.
          </span>
          usual<span className="wordmark-sub">design</span>
        </a>
        <span className="local-badge">Local project workshop</span>
      </header>
      <main id="main">
        <section className="intro">
          <p className="eyebrow">A system you can keep</p>
          <h1>
            Your design.
            <br />
            <span>Made explicit.</span>
          </h1>
          <p className="intro-copy">
            Understand what exists, decide what belongs, and give your coding agent a reliable
            feedback loop.
          </p>
          <div className="project-label">
            <span>Selected project</span>
            <code>
              {state?.projectRoot ??
                (pending ? 'Opening local project…' : 'Project served by this local session')}
            </code>
          </div>
        </section>
        <nav className="step-nav" aria-label="Workshop sections">
          <a href="#discover">01 Discover</a>
          <a href="#policy">02 Policy</a>
          <a href="#audit">03 Audit</a>
          <a href="#handoff">04 Repair</a>
        </nav>
        {error && (
          <div className="callout error" role="alert" ref={errorRef} tabIndex={-1}>
            <strong>The operation needs attention</strong>
            <p>{error}</p>
            <div className="actions">
              <button
                className="secondary"
                disabled={!!pending}
                onClick={() =>
                  void run('Reconnecting', async () => {
                    await refresh();
                  })
                }
              >
                Reload project state
              </button>
              <button className="secondary" disabled={!!pending} onClick={() => setError('')}>
                Dismiss
              </button>
            </div>
            <p className="small-text">
              If source or policy changed, reload and run a fresh audit. An unsaved policy draft may
              need to be copied before reloading changed policy.
            </p>
          </div>
        )}
        <div className="live-status" role="status" aria-live="polite">
          {pending ? <span className="working">{pending}…</span> : notice}
        </div>
        {state ? (
          <div aria-busy={!!pending}>
            <div id="discover">
              <Inventory
                inventory={state.audit?.inventory ?? state.inventory}
                preview={preview}
                disabled={!!pending}
                onApproveCandidate={approveCandidate}
              />
            </div>
            <div id="policy">
              <PolicyReview
                state={state}
                pending={!!pending}
                save={saveManifest}
                draft={policyDraft}
                setDraft={setPolicyDraft}
                previewImpact={previewImpact}
              />
            </div>
            <div id="audit">
              <AuditBoard
                state={state}
                pending={!!pending}
                selected={selected}
                setSelected={setSelected}
                recheck={() => void recheck()}
                review={() => {
                  setReview(true);
                  document
                    .getElementById('handoff')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                activate={(category) => void activate(category)}
              />
            </div>
            <div id="handoff">
              <RepairHandoff
                review={review}
                selected={selectedFindings}
                total={state.audit?.findings.length ?? 0}
                handoff={handoff}
                pending={!!pending}
                confirm={() => void savePlan()}
                cancel={() => setReview(false)}
                recheck={() => void recheck()}
              />
            </div>
          </div>
        ) : (
          !pending && (
            <div className="empty">
              The project has not loaded. Use the session URL printed by the running wizard command
              and reconnect above.
            </div>
          )
        )}
        <footer>
          <span>Usual Labs · Intentional software.</span>
          <span>Local workflow · No project code is executed for previews.</span>
        </footer>
      </main>
    </>
  );
}
