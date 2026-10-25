import { Banner, Button } from '@platform/ui';
import type { Prompt } from '../tutor/guidance';
import { t } from '@platform/i18n/messages';
import { ClinicalContentMarker } from '@platform/i18n/ClinicalContentMarker';
import '@platform/i18n/messages-session';

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
            {t('tutor.dont-show')}
          </Button>
        )}
      >
        <strong>{t('tutor.intro-title')}</strong>
        <br />
        <span className="field__hint">{t('tutor.intro')}</span>
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
          {t('tutor.collapsed', { level: assistanceLabel })}
        </Button>
      </div>
    );
  }

  return (
    <div className="tutor-prompt" role="status">
      <ClinicalContentMarker />
      <Banner
        kind="advisory"
        actions={(
          <>
            <Button compact variant="ghost" onClick={onToggleCollapsed} aria-expanded="true">
              {t('tutor.collapse')}
            </Button>
            <Button compact variant="ghost" onClick={onToggleWhy} aria-expanded={whyOpen}>
              {t(whyOpen ? 'tutor.hide-why' : 'tutor.why')}
            </Button>
            <Button compact variant="ghost" onClick={onDismiss}>{t('tutor.dismiss')}</Button>
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
          {t('tutor.provenance', {
            level: assistanceLabel,
            maturity: `${prompt.maturity[0]?.toUpperCase()}${prompt.maturity.slice(1)}`,
            rule: prompt.ruleVersion,
          })}
        </span>
        {prompt.concept && (
          <>
            {' '}
            <Button variant="ghost" compact onClick={onOpenSource}>{t('tutor.full-source')}</Button>
          </>
        )}
        {!prompt.concept && prompt.sourceHref && <>{' '}<a href={prompt.sourceHref} target="_blank" rel="noreferrer" aria-label={t('tutor.full-source-new-tab')}>{t('tutor.full-source')}</a></>}
      </Banner>
    </div>
  );
}
