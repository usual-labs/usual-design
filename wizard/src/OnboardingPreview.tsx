import { useMemo, useState } from 'react';
import {
  chosenPreview,
  type OnboardingChoices,
  type OnboardingProposal,
} from '../../src/onboarding-types';
import { showcaseState, type ShowcaseTheme } from '../../src/showcase-protocol';
import { ReferenceShowcase } from './ReferenceShowcase';
import { ProjectShowcase } from './ProjectShowcase';
import { Icon } from './Icon';

export function OnboardingPreview({
  proposal,
  choices,
}: {
  proposal: OnboardingProposal;
  choices: OnboardingChoices;
}) {
  const themes: ShowcaseTheme[] = proposal.showcase?.themes ?? ['light', 'dark'];
  const [selectedTheme, setTheme] = useState<ShowcaseTheme>(themes[0]);
  const theme = themes.includes(selectedTheme) ? selectedTheme : themes[0];
  const state = useMemo(() => showcaseState(proposal, choices, theme), [proposal, choices, theme]);
  return (
    <section className="onboarding-preview" aria-label="Design system preview">
      <header className="preview-toolbar">
        <div>
          <h2>{proposal.showcase?.title ?? 'Design reference'}</h2>
          <span>
            {proposal.showcase
              ? 'Project components'
              : 'Reference components · project showcase not connected'}
          </span>
        </div>
        <div className="theme-switch" role="group" aria-label="Preview theme">
          {themes.map((t) => (
            <button
              key={t}
              className="secondary"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
            >
              <Icon name={t === 'light' ? 'sun' : 'moon'} /> {t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </header>
      {proposal.showcase ? (
        <ProjectShowcase showcase={proposal.showcase} state={state} />
      ) : (
        <ReferenceShowcase values={chosenPreview(proposal, choices, theme)} theme={theme} />
      )}
    </section>
  );
}
