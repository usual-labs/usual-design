import { useEffect, useRef, useState } from 'react';
import { categories } from '../../src/types';
import {
  compileChoices,
  type OnboardingChoices,
  type OnboardingState,
} from '../../src/onboarding-types';
import { request } from './api';
import { OnboardingPreview } from './OnboardingPreview';
import { safeColor } from './model';
import type { Audit } from './types';
import './onboarding.css';

const steps = ['Your project', 'Colors', 'Typography', 'Spacing', 'Shape', 'Components', 'Review'];

export function GuidedOnboarding({
  initial,
  manifestPath,
  onSaved,
  openWorkshop,
}: {
  initial: OnboardingState;
  manifestPath: string;
  onSaved: () => Promise<unknown>;
  openWorkshop: () => void;
}) {
  const [record, setRecord] = useState(initial);
  const [choices, setChoices] = useState<OnboardingChoices>(initial.session.choices);
  const [step, setStep] = useState(initial.session.step);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const [impact, setImpact] = useState<Audit | null>(null);
  const [approved, setApproved] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const proposal = record.session.proposal;
  const category = categories[step - 1];
  const decisions = proposal.decisions.filter((d) => d.category === category);
  const deferred = choices.deferred.includes(category);
  let manifest;
  let compilationError = '';
  try {
    manifest = compileChoices(proposal, choices);
  } catch (cause) {
    compilationError = (cause as Error).message;
  }

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  async function operation(label: string, action: () => Promise<void>) {
    if (pending) return;
    setPending(label);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setPending('');
    }
  }
  async function persist(next: number) {
    const updated = await request<OnboardingState>('onboarding/choices', {
      choices,
      step: next,
      expectedHash: record.sessionHash,
    });
    setRecord(updated);
    setStep(next);
    setApproved(false);
    setImpact(null);
    return updated;
  }
  function choose(next: OnboardingChoices) {
    setChoices(next);
    setApproved(false);
    setImpact(null);
  }
  async function finish() {
    await operation('Saving your design contract', async () => {
      const updated = await persist(6);
      await request('onboarding/finish', { expectedHash: updated.sessionHash, approved: true });
      await onSaved();
    });
  }
  return (
    <section className="onboarding" aria-labelledby="onboarding-title" aria-busy={!!pending}>
      <nav className="onboarding-steps" aria-label="Onboarding progress">
        {steps.map((label, i) => (
          <button
            key={label}
            className="secondary"
            aria-current={step === i ? 'step' : undefined}
            disabled={!!pending || !!record.stale}
            onClick={() =>
              void operation('Saving progress', async () => {
                await persist(i);
              })
            }
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {label}
          </button>
        ))}
      </nav>
      {record.stale && (
        <div className="callout error" role="alert">
          <p>{record.stale}</p>
          <button className="secondary" onClick={openWorkshop}>
            Open policy workshop
          </button>
        </div>
      )}
      {error && (
        <div className="callout error" role="alert">
          {error}
        </div>
      )}
      <div role="status" aria-live="polite">
        {pending}
      </div>
      <div className="onboarding-layout">
        <div className="onboarding-decisions">
          <p className="eyebrow">
            Step {step + 1} of {steps.length} · Your design language
          </p>
          <h2 id="onboarding-title" ref={heading} tabIndex={-1}>
            {steps[step]}
          </h2>
          {step === 0 ? (
            <>
              <h3>{proposal.title}</h3>
              <p>{proposal.summary}</p>
              <div className="callout">
                Your agent prepared these recommendations from your code. Review the choices, see
                them together, and save a small design contract.
              </div>
              <dl className="onboarding-scope">
                <dt>Covered paths</dt>
                <dd>
                  {proposal.scope.include.map((p) => (
                    <code key={p}>{p}</code>
                  ))}
                </dd>
                <dt>Excluded paths</dt>
                <dd>
                  {proposal.scope.ignore?.join(', ') ||
                    'None configured; standard generated/dependency exclusions apply.'}
                </dd>
                <dt>Token sources</dt>
                <dd>
                  {proposal.scope.tokens?.join(', ') ||
                    'No additional token files; covered CSS is discovered automatically.'}
                </dd>
                <dt>Manifest destination</dt>
                <dd>
                  <code>{manifestPath}</code>
                </dd>
              </dl>
              {proposal.notes?.length ? (
                <div className="callout">
                  <strong>Before you choose</strong>
                  <ul>
                    {proposal.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p>
                Recommendations are preselected for review. Application code stays as it is until
                you approve a separate repair batch. Categories activate only after a clean audit.
              </p>
            </>
          ) : step === 6 ? (
            <>
              <p>
                Review the exact contract below. Evidence, alternatives, and your saved choices stay
                in <code>docs/usual-design/onboarding/</code>.
              </p>
              <ul className="review-groups">
                {categories.map((c) => {
                  const group = proposal.decisions.filter((d) => d.category === c);
                  return (
                    <li key={c}>
                      <strong>{c}</strong>
                      <span>
                        {choices.deferred.includes(c) || !group.length
                          ? 'Deferred — no policy added'
                          : `${group.length} decisions · inactive until repaired`}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <details open>
                <summary>Manifest to save</summary>
                <pre className="onboarding-json">
                  {JSON.stringify(manifest, null, 2) || compilationError}
                </pre>
              </details>
              <button
                className="secondary"
                disabled={!!pending || !!record.stale || !!compilationError}
                onClick={() =>
                  void operation('Checking the proposed policy', async () => {
                    const result = await request<{ audit: Audit }>('onboarding/preview', {
                      choices,
                      expectedHash: record.sessionHash,
                    });
                    setImpact(result.audit);
                  })
                }
              >
                Preview lint impact
              </button>
              {impact && (
                <div className="callout" role="status">
                  {impact.findings.length} findings across {impact.files.length} files.
                  {impact.errors.length > 0 && <p>{impact.errors.join('\n')}</p>}
                  <p>This is an unsaved audit. You choose repairs after saving.</p>
                </div>
              )}
              <label className="onboarding-approval">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                  disabled={!!pending || !!record.stale}
                />
                I approve these rules and coverage. Save the manifest with all categories inactive.
              </label>
              <button
                disabled={!approved || !!pending || !!record.stale || !!compilationError}
                onClick={() => void finish()}
              >
                Approve & save manifest
              </button>
            </>
          ) : (
            <>
              <p>
                Choose the conventions your project should keep. The live reference combines choices
                across every step.
              </p>
              <label className="onboarding-defer">
                <input
                  type="checkbox"
                  checked={deferred || !decisions.length}
                  disabled={!!pending || !!record.stale || !decisions.length}
                  onChange={(e) =>
                    choose({
                      ...choices,
                      deferred: e.target.checked
                        ? [...choices.deferred, category]
                        : choices.deferred.filter((c) => c !== category),
                    })
                  }
                />
                Defer all {category} decisions
              </label>
              {!decisions.length && (
                <p className="callout">
                  Your agent has not proposed this category yet. It will remain unchecked. Ask for a
                  proposal when you are ready.
                </p>
              )}
              {decisions.map((decision) => (
                <fieldset
                  className="onboarding-question"
                  key={decision.id}
                  disabled={!!pending || !!record.stale || deferred}
                >
                  <legend>{decision.title}</legend>
                  <p>{decision.description}</p>
                  {decision.options.map((option) => (
                    <div
                      className="onboarding-option"
                      key={option.id}
                      data-selected={choices.selections[decision.id] === option.id}
                    >
                      <label>
                        <input
                          type="radio"
                          name={decision.id}
                          checked={choices.selections[decision.id] === option.id}
                          onChange={() =>
                            choose({
                              ...choices,
                              selections: { ...choices.selections, [decision.id]: option.id },
                            })
                          }
                        />
                        <strong>{option.label}</strong>
                        {decision.recommended === option.id && (
                          <span className="onboarding-recommended">Recommended</span>
                        )}
                      </label>
                      <p>{option.explanation}</p>
                      <div className="onboarding-swatches">
                        {Object.entries(option.preview?.light ?? {})
                          .filter(([key]) => ['primary', 'surface', 'onSurface'].includes(key))
                          .map(([key, value]) => (
                            <code key={key}>
                              {safeColor(value) && (
                                <span
                                  className="onboarding-swatch"
                                  aria-hidden="true"
                                  style={{ backgroundColor: safeColor(value)! }}
                                />
                              )}
                              {key}: {value}
                            </code>
                          ))}
                      </div>
                      <details>
                        <summary>Source evidence & rules</summary>
                        <ul>
                          {option.evidence.map((e, i) => (
                            <li key={i}>
                              <code>
                                {e.file}:{e.line}
                              </code>
                            </li>
                          ))}
                        </ul>
                        <pre className="onboarding-json">
                          {JSON.stringify(option.rules, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </fieldset>
              ))}
            </>
          )}
          <div className="onboarding-navigation">
            {step > 0 && (
              <button
                className="secondary"
                disabled={!!pending || !!record.stale}
                onClick={() =>
                  void operation('Saving progress', async () => {
                    await persist(step - 1);
                  })
                }
              >
                Back
              </button>
            )}
            <button
              className="secondary"
              disabled={!!pending || !!record.stale}
              onClick={() =>
                void operation('Progress saved', async () => {
                  await persist(step);
                })
              }
            >
              Save progress
            </button>
            {step < 6 && (
              <button
                disabled={!!pending || !!record.stale}
                onClick={() =>
                  void operation('Saving progress', async () => {
                    await persist(step + 1);
                  })
                }
              >
                {step === 5 ? 'Review contract' : 'Continue'}
              </button>
            )}
          </div>
          <p className="small-text">
            Continue, Back, and Save progress retain your choices for the next session.
          </p>
        </div>
        <OnboardingPreview proposal={proposal} choices={choices} />
      </div>
    </section>
  );
}
