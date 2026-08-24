import { Banner, Button } from '@platform/ui';
import type { Prompt } from '../tutor/guidance';

export const TUTOR_INTRODUCTION_PREFERENCE = 'tutor-introduction-dismissed';

export interface TutorIntroductionProps {
  readonly onDismissPermanently: () => void;
}

export function TutorIntroduction({ onDismissPermanently }: TutorIntroductionProps) {
  return (
    <div className="tutor-prompt" role="status">
      <Banner
        kind="advisory"
        actions={(
          <Button compact variant="ghost" onClick={onDismissPermanently}>
            Don't show this again
          </Button>
        )}
      >
        <strong>Your private tutor</strong>
        <br />
        <span className="field__hint">
          It reads only this fictional run, works entirely on this device, and never changes the
          patient. Collapse any prompt to keep the monitor clear; reopen this introduction from
          More options.
        </span>
      </Banner>
    </div>
  );
}

export interface TutorPromptCardProps {
  readonly prompt: Prompt;
  readonly collapsed: boolean;
  readonly whyOpen: boolean;
  readonly onToggleCollapsed: () => void;
  readonly onToggleWhy: () => void;
  readonly onDismiss: () => void;
  readonly onOpenSource: () => void;
}

export function TutorPromptCard({
  prompt, collapsed, whyOpen, onToggleCollapsed, onToggleWhy, onDismiss, onOpenSource,
}: TutorPromptCardProps) {
  const assistanceLabel = `${prompt.assistanceLevel[0]?.toUpperCase()}${prompt.assistanceLevel.slice(1)}`;
  if (collapsed) {
    return (
      <div className="tutor-prompt tutor-prompt--collapsed" role="status">
        <Button compact onClick={onToggleCollapsed} aria-expanded="false">
          Private tutor · {assistanceLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="tutor-prompt" role="status">
      <Banner
        kind="advisory"
        actions={(
          <>
            <Button compact variant="ghost" onClick={onToggleCollapsed} aria-expanded="true">
              Collapse
            </Button>
            <Button compact variant="ghost" onClick={onToggleWhy} aria-expanded={whyOpen}>
              {whyOpen ? 'Hide why' : 'Why this now?'}
            </Button>
            <Button compact variant="ghost" onClick={onDismiss}>Dismiss</Button>
          </>
        )}
      >
        <strong>{prompt.suggestion}</strong>
        {whyOpen && (
          <>
            <br />
            <span className="field__hint">{prompt.because}</span>
          </>
        )}
        <br />
        <span className="field__hint">
          {assistanceLabel} · {prompt.maturity[0]?.toUpperCase()}{prompt.maturity.slice(1)} · rule {prompt.ruleVersion}
        </span>
        {prompt.concept && (
          <>
            {' '}
            <Button variant="ghost" compact onClick={onOpenSource}>Full source</Button>
          </>
        )}
      </Banner>
    </div>
  );
}
