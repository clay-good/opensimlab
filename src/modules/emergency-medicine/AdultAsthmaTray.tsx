/**
 * AdultAsthmaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAdultAsthmaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { adultAsthmaInlinePrompt } from './tutor/adult-asthma-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AdultAsthmaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['adultAsthmaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.severityReviewedAtTick != null;
  const oxygen = assessment?.controlledOxygenAtTick != null;
  const bronchodilators = assessment?.bronchodilatorBundleAtTick != null;
  const corticosteroid = assessment?.corticosteroidIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : adultAsthmaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="adult-asthma-assessment-title">
        <div id="adult-asthma-assessment-title" className="syringe__name">Read severity, not wheeze alone</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Speech · work · SpO₂ · PEF · immediate mimics</div>
        <p className="syringe__remaining" role="status">
          {oxygen ? 'Controlled oxygen target recorded'
            : reviewed ? 'Severe pattern reviewed · initial treatment open'
              : 'Whole-patient severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-severity-and-mimics') : undefined}>
            Review severity + immediate mimics
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || oxygen}
            aria-disabled={demonstrating} onClick={act ? () => act('record-controlled-oxygen') : undefined}>
            Target controlled oxygen · 92–95%
          </Button>
        </div>
        <p className="field__hint">Findings and peak flow are authored. The screen does not perform examination, spirometry, blood gas, imaging, or differential diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="adult-asthma-treatment-title">
        <div id="adult-asthma-treatment-title" className="syringe__name">Treat, then look again</div>
        <div className="syringe__meta">Conservative inhaled bundle · early anti-inflammatory intent</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · repeat PEF 55%'
            : bronchodilators && corticosteroid ? 'Initial treatment complete · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Severity review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || bronchodilators}
            aria-disabled={demonstrating} onClick={act ? () => act('give-fixed-inhaled-bronchodilators') : undefined}>
            Give fixed pMDI + spacer bundle
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || corticosteroid}
            aria-disabled={demonstrating} onClick={act ? () => act('record-early-corticosteroid-intent') : undefined}>
            Record early corticosteroid intent
          </Button>
          <Button className="crisis-drug__action"
            disabled={!oxygen || !bronchodilators || !corticosteroid || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-after-initial-treatment') : undefined}>
            Reassess symptoms + PEF
          </Button>
        </div>
        <p className="field__hint">No inhaler technique, individualized dose, repeat cycle, toxicity, magnesium, ventilatory support, disposition, discharge prescription, or prevention plan is offered.</p>
      </section>
      </div>
    </div>
  );
}
