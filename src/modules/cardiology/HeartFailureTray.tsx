/**
 * HeartFailureTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasHeartFailureResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { heartFailureInlinePrompt } from './tutor/heart-failure-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel, WatchingNotice } from '@anesthesia/ui/tutor-panel';
import { Badge, Button } from '@platform/ui';

export function HeartFailureTray({ assessment, scenarioVersion, guidance = 'unassisted', demonstrating = false, onAction }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['heartFailureAssessment']>;
  scenarioVersion: string;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
  onAction: (action: string) => void;
}) {
  const status = assessment?.statusAtTick != null;
  const response = assessment?.responseAtTick != null;
  const tolerance = assessment?.toleranceAtTick != null;
  const transition = assessment?.transitionAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const prompt = demonstrating ? null
    : heartFailureInlinePrompt(guidance, { scenarioVersion, patient: assessment });
  const act = demonstrating ? undefined : onAction;
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
    <WatchingNotice demonstrating={demonstrating} />
    <TutorPanel prompt={prompt} />
    <div className="tray-grid">
      <section className="syringe" aria-labelledby="heart-failure-trajectory-title">
        <div id="heart-failure-trajectory-title" className="syringe__name">Decongestion is a trajectory.</div>
        <Badge kind="teaching">symptoms · weight · balance · output · congestion · perfusion</Badge>
        <div className="syringe__meta">77.2 → 75.8 kg · net −1.6 L · still orthopneic</div>
        <p className="syringe__remaining" role="status">
          {response ? 'Partial response · residual congestion remains'
            : status ? 'Warm + congested · review reported response'
              : 'Improved is not the same as decongested'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={status}
            aria-disabled={demonstrating} onClick={act ? () => act('reconcile-heart-failure-congestion-and-perfusion') : undefined}>Reconcile congestion + perfusion</Button>
          <Button className="crisis-drug__action" disabled={!status || response}
            aria-disabled={demonstrating} onClick={act ? () => act('review-heart-failure-diuretic-response') : undefined}>Review serial decongestion response</Button>
          <Button className="crisis-drug__action" disabled={!response || tolerance}
            aria-disabled={demonstrating} onClick={act ? () => act('review-heart-failure-tolerance-and-precipitant') : undefined}>Review tolerance + precipitant</Button>
        </div>
        <p className="field__hint">A creatinine change needs context. No single weight, balance, urine-output, or laboratory value proves euvolemia or treatment failure.</p>
      </section>
      <section className="syringe" aria-labelledby="heart-failure-transition-title">
        <div id="heart-failure-transition-title" className="syringe__name">Warm is not the same as ready.</div>
        <Badge kind="teaching">residual congestion · oral transition · GDMT · owner · follow-up</Badge>
        <div className="syringe__meta">Orthopnea · JVP · crackles · edema · 3.8 kg above clinic weight</div>
        <p className="syringe__remaining" role="status">
          {readiness ? 'Not discharge-ready · owner + next review recorded'
            : transition ? 'Transition intent recorded · reassess readiness'
              : tolerance ? 'Whole trajectory reviewed · transition plan due'
                : 'Tolerance + precipitant review pending'}
        </p>
        <div className="syringe__presets">
          <Button className="crisis-drug__action" disabled={!tolerance || transition}
            aria-disabled={demonstrating} onClick={act ? () => act('record-heart-failure-transition-intent') : undefined}>Record decongestion + transition intent</Button>
          <Button className="crisis-drug__action" disabled={!transition || readiness}
            aria-disabled={demonstrating} onClick={act ? () => act('reassess-heart-failure-discharge-readiness') : undefined}>Reassess readiness + ownership</Button>
        </div>
        <p className="field__hint">No drug, dose, target, order, regimen, disposition, or outcome is supplied. The next reassessment stays owned while congestion remains.</p>
      </section>
    </div>
    </div>
  );
}
