/**
 * CopdExacerbationTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasCopdExacerbationResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { copdExacerbationInlinePrompt } from './tutor/copd-exacerbation-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function CopdExacerbationTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['copdExacerbationAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.controlledOxygenAtTick != null;
  const bronchodilators = assessment?.bronchodilatorBundleAtTick != null;
  const corticosteroid = assessment?.corticosteroidIntentAtTick != null;
  const antibiotic = assessment?.antibioticIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : copdExacerbationInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="copd-assessment-title">
        <div id="copd-assessment-title" className="syringe__name">Read the whole respiratory story</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Symptoms · work · SpO₂ · sputum · blood gas · mimics</div>
        <p className="syringe__remaining" role="status">
          {oxygen ? 'Controlled oxygen target recorded'
            : reviewed ? 'Moderate pattern reviewed · initial treatment open'
              : 'Severity and blood-gas review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-severity-and-mimics') : undefined}>
            Review severity + blood gas + mimics
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            aria-disabled={demonstrating} onClick={act ? () => act('record-controlled-oxygen') : undefined}>
            Target controlled oxygen · 88–92%
          </Button>
        </div>
        <p className="field__hint">Findings and blood gases are authored. The screen does not perform examination, sampling, imaging, ECG, microbiology, or differential diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="copd-treatment-title">
        <div id="copd-treatment-title" className="syringe__name">Open the airways, then look again</div>
        <div className="syringe__meta">Air-driven inhaled intent · short anti-inflammatory course · indication check</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · repeat pH 7.38'
            : bronchodilators && corticosteroid && antibiotic
              ? 'Initial treatment recorded · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || bronchodilators}
            aria-disabled={demonstrating} onClick={act ? () => act('give-air-driven-bronchodilators') : undefined}>
            Give air-driven SABA + SAMA intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || corticosteroid}
            aria-disabled={demonstrating} onClick={act ? () => act('record-five-day-corticosteroid-intent') : undefined}>
            Record 5-day corticosteroid intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || antibiotic}
            aria-disabled={demonstrating} onClick={act ? () => act('record-antibiotic-indication') : undefined}>
            Record antibiotic indication · purulence
          </Button>
          <Button className="crisis-drug__action"
            disabled={!oxygen || !bronchodilators || !corticosteroid || !antibiotic || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-and-review-ventilatory-support') : undefined}>
            Reassess blood gas + ventilatory need
          </Button>
        </div>
        <p className="field__hint">No device technique, individualized or repeat dose, toxicity, antibiotic selection, NIV setup, disposition, maintenance plan, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
