/**
 * NeurologyAutonomicDysreflexiaTray, moved out of `ActionCockpit.tsx` unchanged.
 *
 * The cockpit defined this tray inline and rendered it behind a `hasNeurologyAutonomicDysreflexiaResponse` gate
 * computed from the scenario, so every specialty downloaded it. That gate is now this tray's
 * `supports` predicate in `trays.ts`; the body below is the original.
 */
import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import { dysreflexiaInlinePrompt } from './tutor/autonomic-dysreflexia-authored-trigger-guidance';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { Button } from '@platform/ui';

export function NeurologyAutonomicDysreflexiaTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['neurologyAutonomicDysreflexiaAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = dysreflexiaInlinePrompt(guidance, { scenarioVersion, dysreflexia: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const trigger = assessment?.triggerAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="neurology-autonomic-dysreflexia-early-title">
      <div id="neurology-autonomic-dysreflexia-early-title" className="syringe__name">His usual pressure matters.</div>
      <p className="syringe__remaining">Begin with the lesion, verified baseline, sudden change, symptoms, pulse, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-neurology-autonomic-dysreflexia-lesion-baseline-pressure-symptoms-rhythm-and-whole-patient') : undefined}>Connect baseline + pattern</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-neurology-autonomic-dysreflexia-pattern-without-closing-alternatives-or-definitive-diagnosis') : undefined}>Recognize the urgent pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-neurology-autonomic-dysreflexia-upright-support-monitoring-and-qualified-ownership') : undefined}>Sit up + bring help close</Button>}
        {support && !trigger && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-and-release-neurology-autonomic-dysreflexia-supplied-external-urinary-trigger-within-role') : undefined}>Free the visible tubing kink</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="neurology-autonomic-dysreflexia-later-title">
      <div id="neurology-autonomic-dysreflexia-later-title" className="syringe__name">Relief still needs watching.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Baseline, triggers, recurrence, complications, prevention, and outcome uncertainty handed off.' : reassessment ? 'Pressure and pulse are near baseline in the fixed report. Recurrence, another trigger, and complications remain open.' : trigger ? 'The visible kink is free and the monitor changed. Reassess after time passes.' : support ? 'Upright support and surveillance are active. Start the supplied trigger survey with urine flow.' : 'Complete the pattern, recognition, and immediate support before trigger review.'}</p>
      <div className="crisis-drug__actions">
        {trigger && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reassess-neurology-autonomic-dysreflexia-strict-pressure-pulse-symptom-and-trigger-transition') : undefined}>Review the strict response</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-neurology-autonomic-dysreflexia-baseline-triggers-recurrence-complications-prevention-and-active-risk') : undefined}>Hand off what could return</Button>}
      </div>
    </section>
  </>;
}
