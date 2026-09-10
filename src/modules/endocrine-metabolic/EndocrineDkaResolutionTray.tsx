import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { dkaResolutionInlinePrompt } from '../endocrine-metabolic/tutor/dka-resolution-guidance';
import { Button } from '@platform/ui';

export function EndocrineDkaResolutionTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['endocrineDkaResolutionAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = dkaResolutionInlinePrompt(guidance, { scenarioVersion, dkaResolution: assessment });
  const act = demonstrating ? undefined : onAction;
  const support = assessment?.supportAtTick != null;
  const context = assessment?.contextAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const readiness = assessment?.readinessAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="endocrine-dka-resolution-now-title">
      <div id="endocrine-dka-resolution-now-title" className="syringe__name">Glucose is not the finish line.</div>
      <p className="syringe__remaining">{reassessment ? 'Supplied 4-hour report: glucose 162 mg/dL, ketones 0.4 mmol/L, pH 7.34, bicarbonate 19 mmol/L, potassium 3.8 mmol/L. Basal insulin was reported 2 hours earlier.' : 'Supplied after 8 hours of treatment: glucose 184 mg/dL, ketones 1.2 mmol/L, pH 7.32, bicarbonate 17 mmol/L, potassium 3.6 mmol/L, anion gap 10.'}</p>
      <p className="syringe__remaining">Read ketones and acid-base recovery alongside potassium, kidney function, intake, treatment continuity, access, preferences, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-dka-resolution-endocrine-nursing-pharmacy-electrolyte-nutrition-and-transition-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-dka-resolution-initial-triad-treatment-clock-current-ketone-acid-base-potassium-glucose-and-whole-person') : undefined}>Connect the whole trajectory</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-persistent-dka-despite-lower-glucose-and-closed-anion-gap') : undefined}>Recognize what remains open</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-dka-insulin-dextrose-potassium-monitoring-resolution-and-bridged-transition-boundaries') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="endocrine-dka-resolution-later-title">
      <div id="endocrine-dka-resolution-later-title" className="syringe__name">Resolution needs a bridge, not a gap.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Recurrence, glucose, potassium, fluid, kidney, nutrition, access, education, follow-up, disposition, and outcome risks handed off.' : reassessment ? 'The supplied panel meets biochemical resolution criteria and the basal-overlap record is present. Durable safety, transition success, discharge, and outcomes remain open.' : readiness ? 'Qualified continuity and serial reassessment continue. Review the fixed report after time passes.' : support ? 'Prepared support is present. Connect the whole trajectory before deciding what has resolved.' : 'Begin with calm shared ownership. You can pause or leave this practice at any time.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-dka-resolution-fixed-four-hour-qualified-report') : undefined}>Review the fixed 4-hour report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-dka-recurrence-insulin-potassium-nutrition-precipitant-education-follow-up-and-outcome-risk') : undefined}>Hand off active recurrence risk</Button>}
      </div>
    </section>
  </>;
}
