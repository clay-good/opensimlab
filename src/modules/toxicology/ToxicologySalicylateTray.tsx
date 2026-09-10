import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { salicylateInlinePrompt } from '../toxicology/tutor/salicylate-falling-number-guidance';
import { Button } from '@platform/ui';

export function ToxicologySalicylateTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologySalicylateAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = salicylateInlinePrompt(guidance, { scenarioVersion, salicylate: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const support = assessment?.supportAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-salicylate-early-title">
      <div id="toxicology-salicylate-early-title" className="syringe__name">Read the patient and the number together.</div>
      <p className="syringe__remaining">Begin with product, clock, tinnitus, vomiting, breathing, volume clues, units, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient') : undefined}>Connect exposure + breathing</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure') : undefined}>See the mixed pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership') : undefined}>Gather the right team early</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary') : undefined}>Review the coupled evidence</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-salicylate-later-title">
      <div id="toxicology-salicylate-later-title" className="syringe__name">A lower number can travel with a sicker patient.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'CNS, pulmonary, acid-base, absorption, renal, electrolyte, extracorporeal, safety, and outcome uncertainty handed off.' : reassessment ? 'The concentration fell while pH and mentation worsened. The whole trajectory is ominous, not reassuring.' : evidence ? 'Serial concentration, pH, ventilation, volume, electrolytes, and airway risk are coupled. Record qualified intent after time passes.' : support ? 'Qualified toxicology, critical-care, nephrology, monitoring, and safety ownership are active. Review the supplied evidence.' : 'Complete recognition and early ownership before treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review') : undefined}>Prepare early + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk') : undefined}>Hand off the whole trajectory</Button>}
      </div>
    </section>
  </>;
}
