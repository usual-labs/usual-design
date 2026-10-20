import { useEffect, useId, useState } from 'react';
import { PolicyControls } from './PolicyControls';
import { DraftImpact } from './DraftImpact';
import { currentDraftPreview, type DraftPreview } from './model';
import type { Audit, ProjectState } from './types';

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function PolicyReview({
  state,
  pending,
  save,
  draft,
  setDraft,
  previewImpact,
}: {
  state: ProjectState;
  pending: boolean;
  save: (manifest: Record<string, unknown>, rationale: string) => Promise<boolean>;
  draft: string;
  setDraft: (draft: string) => void;
  previewImpact: (manifest: Record<string, unknown>) => Promise<Audit | null>;
}) {
  const saved = state.manifest ? stringify(state.manifest) : '';
  const seed = saved || (state.draft ? stringify(state.draft) : '');
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [rationale, setRationale] = useState('');
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const editorId = useId();
  const helpId = useId();
  const rationaleId = useId();
  const rationaleHelpId = useId();
  const dirty = saved !== draft;
  const currentPreview = currentDraftPreview(preview, draft, state.manifestHash);
  let parsedDraft: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(draft);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      parsedDraft = parsed as Record<string, unknown>;
  } catch {
    /* The editor keeps invalid drafts until the user requests validation. */
  }

  useEffect(() => {
    setDraft(seed);
    setReview(false);
    setError('');
    setRationale('');
  }, [seed, setDraft]);

  useEffect(() => setReview(false), [draft]);
  useEffect(() => setPreview(null), [draft, state.manifestHash]);

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function parseDraft(): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(draft);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new Error('The manifest must be a JSON object.');
      setError('');
      return parsed as Record<string, unknown>;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The JSON could not be read.');
      return null;
    }
  }

  async function approve() {
    const manifest = parseDraft();
    if (manifest && (await save(manifest, rationale))) setReview(false);
  }

  async function inspectImpact() {
    const manifest = parseDraft();
    if (!manifest) return;
    const requestedDraft = draft,
      requestedHash = state.manifestHash;
    const audit = await previewImpact(manifest);
    if (audit) setPreview({ draft: requestedDraft, manifestHash: requestedHash, audit });
    else
      setError(
        'The draft preview could not be generated. See the operation error above. Your draft has been kept.',
      );
  }

  return (
    <section className="panel" aria-labelledby="policy-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 · Make the intent explicit</p>
          <h2 id="policy-title">Review your design contract</h2>
        </div>
        <span className={`pill ${dirty ? 'notice' : ''}`}>
          {dirty ? 'Unsaved draft' : state.manifest ? 'Saved policy' : 'No manifest yet'}
        </span>
      </div>
      <p>
        Your manifest owns allowed values, semantic rules, approved components, coverage, and
        exceptions. Your agent can propose it; you approve what belongs.
      </p>
      <p className="muted">
        Manifest file:{' '}
        <code className="source">
          {state.manifestPath ?? 'Manifest path has not been reported by the local server.'}
        </code>
      </p>
      {!state.manifest && (
        <div className="callout">
          Ask your existing coding agent to use the Usual Design setup skill and draft a manifest
          from the inventory. Paste its JSON here for validation and review. New categories should
          begin inactive.
        </div>
      )}
      {parsedDraft && (
        <PolicyControls
          manifest={parsedDraft}
          tokens={state.inventory?.tokens ?? []}
          disabled={pending || review}
          change={(manifest) => {
            setDraft(stringify(manifest));
            setError('');
          }}
        />
      )}
      <label htmlFor={editorId}>Manifest JSON</label>
      <p id={helpId} className="muted">
        Changes to this file are design-policy decisions. Ordinary repair batches must preserve it.
        Saving validates the full schema and invalidates the previous audit.
      </p>
      <textarea
        id={editorId}
        aria-describedby={helpId}
        className="code-editor"
        spellCheck={false}
        value={draft}
        disabled={pending || review}
        onChange={(event) => {
          setDraft(event.target.value);
          setError('');
        }}
        placeholder="Paste the manifest proposed by your agent"
      />
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <div className="actions">
        <button
          className="secondary"
          disabled={pending || !draft.trim()}
          onClick={() => void inspectImpact()}
        >
          Preview draft impact
        </button>
        <span className="muted">Check the proposal without saving or activating it.</span>
      </div>
      {currentPreview && <DraftImpact audit={currentPreview} />}
      {!review ? (
        <div className="actions">
          <button
            disabled={pending || !dirty || !draft.trim()}
            onClick={() => {
              if (parseDraft()) setReview(true);
            }}
          >
            Review policy changes
          </button>
          {dirty && (
            <button
              className="secondary"
              disabled={pending}
              onClick={() => {
                setDraft(seed);
                setError('');
                setRationale('');
              }}
            >
              Reset draft
            </button>
          )}
        </div>
      ) : (
        <div className="policy-review">
          <h3>Approve this policy change</h3>
          <p>
            Review allowed values, component mappings, ignored paths, exceptions, and active
            categories. Broadening these can reduce enforcement.
          </p>
          <label htmlFor={rationaleId}>
            Why this policy? <span className="muted">(optional)</span>
          </label>
          <p id={rationaleHelpId} className="muted">
            Save the design intent with this decision so your team can understand it later. Leaving
            this empty records the rationale as unknown.
          </p>
          <textarea
            id={rationaleId}
            aria-describedby={rationaleHelpId}
            rows={3}
            maxLength={4000}
            value={rationale}
            disabled={pending}
            onChange={(event) => setRationale(event.target.value)}
            placeholder="For example: use the action color consistently for primary controls."
          />
          <div className="comparison">
            <div>
              <h4>Saved</h4>
              <pre>{saved || 'No saved manifest'}</pre>
            </div>
            <div>
              <h4>Proposed</h4>
              <pre>{draft}</pre>
            </div>
          </div>
          <div className="actions">
            <button disabled={pending} onClick={() => void approve()}>
              Approve policy & save
            </button>
            <button className="secondary" disabled={pending} onClick={() => setReview(false)}>
              Back to draft
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
