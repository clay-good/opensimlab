/**
 * The page a program director reads before deciding whether to put this in front
 * of their students (platform/adoption).
 *
 * It answers the questions an institution actually asks, in the order they ask
 * them, and it is careful about the two claims that would be easiest to overstate
 * and worst to get wrong: what has been clinically reviewed, and whether any of
 * this counts toward a requirement. Both answers are currently "no".
 */

import { useState } from 'react';
import { Button, SiteBar } from '@platform/ui';
import { SCENARIOS, scenariosByDifficulty } from '@anesthesia/scenarios';
import { SITE_ORIGIN } from './routes';
import { NOT_FOR_CLINICAL_USE } from '@platform/transcript/transcript';
import { MAPPING_DISCLAIMER } from '@anesthesia/curriculum/frameworks';
import { EDUCATOR_PAGES } from './educator-pages';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-educator';

/** Builds the link an instructor hands out. Nothing here contacts anything. */
function AssignmentBuilder() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]!.metadata.id);
  const [guidance, setGuidance] = useState('coached');
  const [label, setLabel] = useState('');
  const [seed, setSeed] = useState('20260819');
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const version = SCENARIOS.find((scenario) => scenario.metadata.id === scenarioId)?.metadata.version;

  const params = new URLSearchParams();
  params.set('guidance', guidance);
  if (seed.trim()) params.set('seed', seed.trim());
  if (label.trim()) params.set('assignment', label.trim());
  // Pinned so a learner opening the link after the scenario changes is told so.
  if (version) params.set('version', version);
  if (reviewedOnly) params.set('policy', 'reviewed-only');
  const url = `${SITE_ORIGIN}/anesthesia/scenario/${scenarioId}?${params.toString()}`;

  return (
    <section className="educators__builder">
      <h3>{t('edu.builder-heading')}</h3>
      <p className="field__hint">{t('edu.builder-hint')}</p>

      <label className="field">
        <span className="field__label">{t('edu.builder-scenario')}</span>
        <select className="select" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
          {scenariosByDifficulty().map((scenario) => (
            <option key={scenario.metadata.id} value={scenario.metadata.id}>
              {scenario.metadata.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">{t('edu.builder-guidance')}</span>
        <select className="select" value={guidance} onChange={(e) => setGuidance(e.target.value)}>
          <option value="guided">{t('edu.builder-guided')}</option>
          <option value="coached">{t('edu.builder-coached')}</option>
          <option value="unassisted">{t('edu.builder-unassisted')}</option>
        </select>
      </label>

      <label className="field">
        <span className="field__label">{t('edu.builder-name')}</span>
        <input
          className="field__input"
          value={label}
          placeholder={t('edu.builder-name-placeholder')}
          onChange={(e) => setLabel(e.target.value)}
        />
      </label>

      <label className="field">
        <span className="field__label">{t('edu.builder-seed')}</span>
        <input
          className="field__input numeric"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
        />
        <span className="field__hint">{t('edu.builder-seed-hint')}</span>
      </label>

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={reviewedOnly}
            aria-describedby="reviewed-only-hint"
            onChange={(e) => setReviewedOnly(e.target.checked)}
          />{' '}
          {t('edu.builder-reviewed-only')}
        </label>
        <span className="field__hint" id="reviewed-only-hint">{t('edu.builder-reviewed-only-hint')}</span>
      </div>

      <p className="educators__link"><code>{url}</code></p>
      <Button
        variant="primary"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
        }}
      >
        {t(copied ? 'edu.builder-copied' : 'edu.builder-copy')}
      </Button>
    </section>
  );
}

export function EducatorsRoute() {
  return (
    <div className="document">
      <SiteBar current="/for-educators" extra={EDUCATOR_PAGES} />

      <main className="reading" id="main">
        <h1>{t('sitebar.for-educators')}</h1>
        <p>{t('edu.intro')}</p>

        <h2>{t('edu.first-heading')}</h2>
        <p><strong>{t('edu.unreviewed-lead')}</strong> {t('edu.unreviewed')}</p>
        <p><strong>{t('edu.not-clinical-time-lead')}</strong> {t('edu.not-clinical-time')}</p>
        <p>{t('edu.supplements')}</p>

        <h2>{t('edu.good-for-heading')}</h2>
        <ul>
          <li>{t('edu.good-for-night-before')}</li>
          <li>{t('edu.good-for-pre-work')}</li>
          <li>{t('edu.good-for-lecture')}</li>
          <li>{t('edu.good-for-repetition')}</li>
        </ul>

        <h2>{t('edu.assigning-heading')}</h2>
        <AssignmentBuilder />

        <h2>{t('edu.seeing-heading')}</h2>
        <p>
          {t('edu.seeing-before')}{' '}
          <a href="/review">{t('edu.seeing-link')}</a>{t('edu.seeing-after')}
        </p>
        <p>{t('edu.trade')}</p>

        <h2>{t('edu.group-heading')}</h2>
        <p>
          {t('edu.guide-before')}{' '}
          <code>{`/facilitator/<module>/scenario/<scenario>`}</code>{t('edu.guide-after')}
        </p>
        <p>{t('edu.classroom')}</p>

        <h2>{t('edu.curriculum-heading')}</h2>
        <p>{t('edu.curriculum')} {MAPPING_DISCLAIMER}</p>
        <p><a href="/curriculum">{t('edu.curriculum-link')}</a></p>

        <h2>{t('edu.infrastructure-heading')}</h2>
        <p>{t('edu.infrastructure')}</p>
        <p>{t('edu.licence')}</p>

        <h2>{t('edu.want-heading')}</h2>
        <p>{t('edu.want')}</p>

        <h2>{t('edu.check-heading')}</h2>
        <p>{t('edu.check')}</p>
        <p><a href="/content-review">{t('edu.check-link')}</a></p>

        <h2>{t('edu.practice-heading')}</h2>
        <p>{t('edu.practice-intro')}</p>
        <p><strong>{t('edu.practice-rapid-lead')}</strong> {t('edu.practice-rapid')}</p>
        <p>{t('edu.practice-rapid-not')}</p>
        <p><strong>{t('edu.practice-notes-lead')}</strong> {t('edu.practice-notes')}</p>
        <p>{t('edu.practice-notes-not')}</p>
        <p><strong>{t('edu.practice-return-lead')}</strong> {t('edu.practice-return')}</p>
        <p>{t('edu.practice-return-not')}</p>
        <p><strong>{t('edu.practice-progress-lead')}</strong> {t('edu.practice-progress')}</p>
        <p>{t('edu.practice-progress-not')}</p>

        <h2>{t('edu.documents-heading')}</h2>
        <ul>
          <li><a href="/validation">{t('edu.doc-validation')}</a>: {t('edu.doc-validation-note')}</li>
          <li><a href="/governance">{t('edu.doc-governance')}</a>: {t('edu.doc-governance-note')}</li>
          <li><a href="/limitations">{t('edu.doc-limitations')}</a>: {t('edu.doc-limitations-note')}</li>
          <li><a href="/privacy">{t('edu.doc-privacy')}</a>: {t('edu.doc-privacy-note')}</li>
          <li><a href="/catalog/adoption-pack.json">{t('edu.doc-adoption')}</a>: {t('edu.doc-adoption-note')}</li>
        </ul>

        <p className="reading__aside">{NOT_FOR_CLINICAL_USE}</p>
      </main>

      <footer className="document__foot">
        <a href="/curriculum">{t('sitebar.curriculum')}</a>
        <a href="/review">{t('educator.review-submissions')}</a>
        <a href="/">{t('documents.footer.home')}</a>
      </footer>
    </div>
  );
}
