/**
 * AcutePulmonaryEdemaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasAcutePulmonaryEdemaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { acutePulmonaryEdemaInlinePrompt } from './tutor/acute-pulmonary-edema-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function AcutePulmonaryEdemaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['acutePulmonaryEdemaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const niv = assessment?.nivAtTick != null;
  const diuretic = assessment?.diureticIntentAtTick != null;
  const vasodilator = assessment?.vasodilatorIntentAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : acutePulmonaryEdemaInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="pulmonary-edema-pattern-title">
        <div id="pulmonary-edema-pattern-title" className="syringe__name">See lungs, pressure, and perfusion together</div>
        <Badge kind="teaching">Fixed ED vignette</Badge>
        <div className="syringe__meta">Work · SpO₂ · congestion · BP · perfusion · mimics</div>
        <p className="syringe__remaining" role="status">
          {niv ? 'Early positive-pressure support recorded'
            : reviewed ? 'Pulmonary-edema pattern reviewed · support open'
              : 'Whole-patient pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-pattern-mimics-and-precipitants') : undefined}>
            Review pattern + mimics + precipitants
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || niv}
            aria-disabled={demonstrating} onClick={act ? () => act('record-niv-and-titrated-oxygen') : undefined}>
            Start NIV + titrated oxygen intent
          </Button>
        </div>
        <p className="field__hint">Findings, ECG, radiograph, and focused ultrasound are authored. The screen does not acquire an examination, test, image, or diagnosis.</p>
      </section>
      <section className="syringe" aria-labelledby="pulmonary-edema-treatment-title">
        <div id="pulmonary-edema-treatment-title" className="syringe__name">Unload, decongest, then re-read the patient</div>
        <div className="syringe__meta">Congestion intent · pressure-safe vasodilation · serial response</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? 'Initial response reassessed · BP 146/86'
            : diuretic && vasodilator ? 'Initial treatment recorded · reassess next'
              : reviewed ? 'Parallel initial treatment open' : 'Pattern review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!reviewed || diuretic}
            aria-disabled={demonstrating} onClick={act ? () => act('record-loop-diuretic-intent') : undefined}>
            Record IV loop-diuretic intent
          </Button>
          <Button className="crisis-drug__action" disabled={!reviewed || vasodilator}
            aria-disabled={demonstrating} onClick={act ? () => act('record-vasodilator-intent') : undefined}>
            Record IV vasodilator intent · SBP &gt;110
          </Button>
          <Button className="crisis-drug__action"
            disabled={!niv || !diuretic || !vasodilator || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-breathing-pressure-and-perfusion') : undefined}>
            Reassess breathing + BP + perfusion
          </Button>
        </div>
        <p className="field__hint">No NIV technique, drug dose or titration, urine output, precipitant treatment, intubation, shock pathway, disposition, or outcome is offered.</p>
      </section>
      </div>
    </div>
  );
}
