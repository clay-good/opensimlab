/**
 * HyperkalemiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHyperkalemiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { hyperkalemiaWithEcgChangeInlinePrompt } from './tutor/hyperkalemia-with-ecg-change-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HyperkalemiaTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['hyperkalemiaAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const reviewed = assessment?.patternReviewedAtTick != null;
  const calcium = assessment?.calciumAtTick != null;
  const postCalcium = assessment?.postCalciumEcgAtTick != null;
  const insulin = assessment?.insulinGlucoseAtTick != null;
  const betaAgonist = assessment?.betaAgonistAtTick != null;
  const removal = assessment?.removalAtTick != null;
  const reassessed = assessment?.reassessedAtTick != null;
  const prompt = demonstrating ? null
    : hyperkalemiaWithEcgChangeInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <WatchingNotice demonstrating={demonstrating} />
      <TutorPanel prompt={prompt} />
      <div className="tray-grid">
      <section className="syringe" aria-labelledby="hyperkalemia-heart-title">
        <div id="hyperkalemia-heart-title" className="syringe__name">Protect the heart first.</div>
        <Badge kind="teaching">K 7.1 · ECG toxicity · no arrest</Badge>
        <div className="syringe__meta">HR 48 · peaked T · flat P · QRS 140 ms</div>
        <p className="syringe__remaining" role="status">
          {postCalcium ? 'Reported ECG response · QRS 104 ms · K still 7.1'
            : calcium ? 'Calcium intent recorded · no ECG or K change claimed'
            : reviewed ? 'Severe toxicity recognized · calcium intent next'
              : 'Confirmed K + ECG + driver review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={reviewed}
            aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemia-pattern') : undefined}>Review K + ECG + drivers</Button>
          <Button className="crisis-drug__action" disabled={!reviewed || calcium}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyperkalemia-calcium-intent') : undefined}>Record IV calcium-salt intent</Button>
          <Button className="crisis-drug__action" disabled={!calcium || postCalcium}
            aria-disabled={demonstrating} onClick={act ? () => act('review-hyperkalemia-post-calcium-ecg') : undefined}>Review post-team ECG</Button>
        </div>
        <p className="field__hint">Calcium protects the myocardium; it does not lower potassium. Salt, dose, access, delivery, and repeat dosing follow local protocol and are not simulated.</p>
      </section>
      <section className="syringe" aria-labelledby="hyperkalemia-potassium-title">
        <div id="hyperkalemia-potassium-title" className="syringe__name">Shift now. Remove next. Watch for return.</div>
        <div className="syringe__meta">Insulin-glucose · adjunct shift · removal · rebound</div>
        <p className="syringe__remaining" role="status">
          {reassessed ? '1-hour K 5.8 · glucose 92 · QRS 98 ms · keep watching'
            : postCalcium && insulin && betaAgonist && removal
              ? 'All lanes recorded · allow time before the fixed 1-hour panel'
              : calcium ? 'ECG review · shifting · removal can proceed in parallel'
                : 'Calcium intent pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!calcium || insulin}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyperkalemia-insulin-glucose') : undefined}>Record insulin-glucose + surveillance</Button>
          <Button className="crisis-drug__action" disabled={!calcium || betaAgonist}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyperkalemia-beta-agonist') : undefined}>Record adjunct beta-2 shift</Button>
          <Button className="crisis-drug__action" disabled={!calcium || removal}
            aria-disabled={demonstrating} onClick={act ? () => act('record-hyperkalemia-removal-and-cause-control') : undefined}>Remove K + stop drivers + renal help</Button>
          <Button className="crisis-drug__action" disabled={!postCalcium || !insulin || !betaAgonist || !removal || reassessed}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-hyperkalemia') : undefined}>Recheck ECG + K + glucose</Button>
        </div>
        <p className="field__hint">No ECG reading, dose, delivery, potassium kinetics, glucose complication, binder, diuresis, dialysis, recurrence, disposition, or outcome is simulated.</p>
      </section>
      </div>
    </div>
  );
}
