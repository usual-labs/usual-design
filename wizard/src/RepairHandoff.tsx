import { useEffect, useRef, useState } from 'react';
import { grouped, labels } from './model';
import { categories, type Finding, type Handoff } from './types';

export function RepairHandoff({
  review,
  selected,
  total,
  handoff,
  pending,
  confirm,
  cancel,
  recheck,
}: {
  review: boolean;
  selected: Finding[];
  total: number;
  handoff: Handoff | null;
  pending: boolean;
  confirm: () => void;
  cancel: () => void;
  recheck: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState('');
  useEffect(() => {
    if (review || handoff) title.current?.focus();
  }, [review, handoff]);
  const groups = grouped(selected);

  function selectInstruction() {
    prompt.current?.focus();
    prompt.current?.select();
    setCopyStatus(
      'Instruction selected; use your normal copy shortcut. The saved plan remains in your project.',
    );
  }

  async function copy() {
    if (!handoff) return;
    try {
      await navigator.clipboard.writeText(handoff.prompt);
      setCopyStatus('Instruction copied. Paste it into your coding agent.');
    } catch {
      prompt.current?.focus();
      prompt.current?.select();
      setCopyStatus(
        'Copy is unavailable. The instruction is selected; use your normal copy shortcut.',
      );
    }
  }

  return (
    <section className="panel" aria-labelledby="handoff-title">
      <p className="eyebrow">04 · Repair with your agent</p>
      <h2 id="handoff-title" tabIndex={-1} ref={title}>
        {review
          ? 'Confirm this repair batch'
          : handoff
            ? 'Your repair plan is saved'
            : 'A clear handoff, on your terms'}
      </h2>
      {review ? (
        <>
          <p>
            You are authorizing a saved repair plan for <strong>{selected.length} findings</strong>.{' '}
            {total - selected.length} findings will remain deferred.
          </p>
          <ul className="review-groups">
            {categories
              .filter((category) => groups[category].length)
              .map((category) => (
                <li key={category}>
                  <strong>{labels[category]}</strong>
                  <span>{groups[category].length} findings</span>
                </li>
              ))}
          </ul>
          <details>
            <summary>Review selected source locations</summary>
            <ul className="source-list">
              {selected.map((item) => (
                <li key={item.id}>
                  <code>
                    {item.file}:{item.line}
                  </code>{' '}
                  — {item.message}
                </li>
              ))}
            </ul>
          </details>
          <div className="callout">
            <strong>The design contract stays protected.</strong>
            <p>
              The agent may repair application code for this batch. It must preserve the manifest,
              active categories, ignored paths, exceptions, and integration settings. Policy changes
              need your separate approval.
            </p>
          </div>
          <p>Saving this plan does not run an agent or modify application code.</p>
          <div className="actions">
            <button disabled={pending || !selected.length} onClick={confirm}>
              Confirm & save repair plan
            </button>
            <button className="secondary" disabled={pending} onClick={cancel}>
              Back to selection
            </button>
          </div>
        </>
      ) : handoff ? (
        <>
          <p>
            Saved in your project at <code className="source">{handoff.path}</code>. Copy the
            instruction into your existing agent to execute the approved batch.
          </p>
          <label htmlFor="repair-prompt">Agent instruction</label>
          <textarea
            ref={prompt}
            id="repair-prompt"
            className="handoff-prompt"
            readOnly
            value={handoff.prompt}
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="actions">
            <button onClick={() => void copy()}>Copy agent instruction</button>
            <button className="secondary" onClick={selectInstruction}>
              Select instruction
            </button>
            <button className="secondary" disabled={pending} onClick={recheck}>
              Agent finished? Run fresh audit
            </button>
          </div>
          <p role="status" className="muted">
            {copyStatus || 'The plan is prepared. No code repairs have been verified yet.'}
          </p>
          <p className="muted">
            Return to the audit after your agent works. Activation requires current, clean evidence
            for the whole category; copying this instruction is not proof of completion.
          </p>
        </>
      ) : (
        <p>
          Select findings in the audit, review the batch, then save a plan for your coding agent.
          Your choices and deferred work live in the project so you can return later.
        </p>
      )}
    </section>
  );
}
