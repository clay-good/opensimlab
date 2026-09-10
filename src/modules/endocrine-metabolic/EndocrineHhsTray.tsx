import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { hhsOsmolalityInlinePrompt } from '../endocrine-metabolic/tutor/hhs-osmolality-guidance';
import { Button } from '@platform/ui';

export function EndocrineHhsTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['endocrineHhsAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = hhsOsmolalityInlinePrompt(guidance, { scenarioVersion, hhsOsmolality: assessment });
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
    <section className="syringe" aria-labelledby="endocrine-hhs-now-title">
      <div id="endocrine-hhs-now-title" className="syringe__name">Follow the whole trajectory.</div>
      <p className="syringe__remaining">{reassessment ? 'Supplied 4-hour report: glucose 540 mg/dL, sodium 149 mmol/L, total osmolality 343 mOsm/kg, potassium 3.8 mmol/L. Urine output 0.4 mL/kg/h; cognition still below baseline.' : 'Supplied presentation: glucose 900 mg/dL, sodium 146 mmol/L, total osmolality 362 mOsm/kg, ketones 1.1 mmol/L, pH 7.36. Dehydration and cognitive change matter together.'}</p>
      <div className="crisis-drug__actions">
        {!support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support') : undefined}>Confirm prepared support</Button>}
        {support && !context && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person') : undefined}>Connect the whole trajectory</Button>}
        {context && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure') : undefined}>Recognize the coupled pattern</Button>}
        {recognition && !readiness && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention') : undefined}>Review qualified boundaries</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="endocrine-hhs-later-title">
      <div id="endocrine-hhs-later-title" className="syringe__name">A falling number is not recovery.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Osmolality, cognition, urine output, fluid tolerance, electrolyte, precipitant, access, and outcome risks handed off.' : reassessment ? 'Glucose and osmolality fell while sodium rose. Persistent hyperosmolality, reduced urine output, and cognitive change keep resolution open.' : readiness ? 'Qualified cautious correction and surveillance continue. Review the fixed report after time passes.' : support ? 'Connect heart and kidney tolerance, cognition, intake, access, and the biochemical pattern.' : 'Begin with calm shared ownership. Pause or leave whenever you need.'}</p>
      <div className="crisis-drug__actions">
        {readiness && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-hhs-fixed-four-hour-qualified-report') : undefined}>Review the fixed 4-hour report</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk') : undefined}>Hand off active risks</Button>}
      </div>
    </section>
  </>;
}
