import type { EquipmentSnapshot } from '@platform/kernel/protocol';
import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import { TutorPanel } from '@anesthesia/ui/tutor-panel';
import { cholinergicInlinePrompt } from '../toxicology/tutor/cholinergic-pesticide-respiratory-failure-guidance';
import { Button } from '@platform/ui';

export function ToxicologyCholinergicTray({ assessment, scenarioVersion, onAction, guidance = 'unassisted', demonstrating = false }: {
  assessment?: NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCholinergicAssessment']>;
  scenarioVersion: string;
  onAction: (action: string) => void;
  guidance?: GuidanceLevel;
  demonstrating?: boolean;
}) {
  const prompt = cholinergicInlinePrompt(guidance, { scenarioVersion, cholinergic: assessment });
  const act = demonstrating ? undefined : onAction;
  const trajectory = assessment?.trajectoryAtTick != null;
  const recognition = assessment?.recognitionAtTick != null;
  const safety = assessment?.safetyAtTick != null;
  const evidence = assessment?.evidenceAtTick != null;
  const reassessment = assessment?.reassessmentAtTick != null;
  const handoff = assessment?.handoffAtTick != null;
  return <>
    {demonstrating && <p className="syringe__remaining">Watching the worked example. Choose “Take the controls” to make your own decisions.</p>}
    <TutorPanel prompt={demonstrating ? null : prompt} />
    <section className="syringe" aria-labelledby="toxicology-cholinergic-early-title">
      <div id="toxicology-cholinergic-early-title" className="syringe__name">Protect the rescuers before the first touch.</div>
      <p className="syringe__remaining">Begin with exposure route, wet clothing, secretions, breathing, weakness, CNS, and whole person.</p>
      <div className="crisis-drug__actions">
        {!trajectory && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient') : undefined}>Connect exposure + breathing</Button>}
        {trajectory && !recognition && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure') : undefined}>Recognize the whole pattern</Button>}
        {recognition && !safety && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership') : undefined}>Protect patient + team</Button>}
        {safety && !evidence && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary') : undefined}>Review lungs + strength</Button>}
      </div>
    </section>
    <section className="syringe" aria-labelledby="toxicology-cholinergic-later-title">
      <div id="toxicology-cholinergic-later-title" className="syringe__name">Dryer lungs do not prove stronger muscles.</div>
      <p className="syringe__remaining" role="status">{handoff ? 'Airway, secretions, bronchospasm, weakness, intermediate syndrome, exposure, seizure, safety, and outcome uncertainty handed off.' : reassessment ? 'Secretions, oxygenation, circulation, and mentation improved while weakness persisted. Durable ventilation and treatment effect remain unproven.' : evidence ? 'Respiratory, neuromuscular, CNS, exposure, contamination, and airway evidence stay coupled. Record qualified intent after time passes.' : safety ? 'PPE, contamination, decontamination, airway, resuscitation, toxicology, occupational, and co-worker ownership are active. Review the supplied evidence.' : 'Complete whole-pattern recognition and team protection before antidote-boundary review.'}</p>
      <div className="crisis-drug__actions">
        {evidence && !reassessment && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review') : undefined}>Record rescue intent + reassess</Button>}
        {reassessment && !handoff && <Button className="crisis-drug__action" aria-disabled={demonstrating} onClick={act ? () => act('handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk') : undefined}>Hand off what can return</Button>}
      </div>
    </section>
  </>;
}
