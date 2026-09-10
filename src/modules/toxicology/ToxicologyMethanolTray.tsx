import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { methanolInlinePrompt } from '../toxicology/tutor/methanol-visual-acidosis-gaps-guidance';
import { Button } from '@platform/ui';

export function ToxicologyMethanolTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyMethanolAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = methanolInlinePrompt(guidance, { scenarioVersion, methanol: assessment });
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
    <section className="syringe" aria-labelledby="toxicology-methanol-early-title">
      <div id="toxicology-methanol-early-title" className="syringe__name">Two gaps. One whole story.</div>
      <p className="syringe__remaining">Begin with source, clock, vision, breathing, mentation, acid-base state, both supplied gaps, and the whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient') : undefined}>Connect source + trajectory</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !support && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership') : undefined}>Bring the right teams together</Button>}
        {support && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary') : undefined}>Review both gaps + harm</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-methanol-later-title">
      <div id="toxicology-methanol-later-title" className="syringe__name">A better pH does not mean the danger is gone.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Acid-base, vision, neurologic, airway, renal, electrolyte, exposure, coingestion, extracorporeal, and outcome uncertainty handed off.' : reassessment ? 'Acid-base values improved while blurred vision and confusion persisted. Clearance, recovery, durable control, and treatment effect remain unproven.' : evidence ? 'Acid-base, osmolar, renal, visual, coingestion, and competing-cause evidence stay coupled. Record qualified intent after time passes.' : support ? 'Resuscitation, airway, antidote, extracorporeal, toxicology, laboratory, and vision ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and qualified ownership before the treatment-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk') : undefined}>Hand off what stays open</Button>}
      </div>
    </section>
  </>;
}
